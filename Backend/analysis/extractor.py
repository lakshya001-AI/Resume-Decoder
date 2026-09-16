"""The Gemini call that reads the offer letter.

One job: document text in, `ExtractionResult` out, or an exception. It knows
nothing about HTTP, Mongo or the report shape, so it can be exercised on its own
and swapped for a fake in a test by handing the constructor a different client.

This is the only module in the package that knows which provider is in use.
Everything downstream — the catalogue, the prompt, the validator, the report
builder — works on the returned Pydantic model, so changing provider again means
changing this file and nothing else.
"""

import asyncio
import json
import logging
import random
from typing import Optional

import pydantic
from google import genai
from google.genai import errors as genai_errors
from google.genai import types

from analysis.extraction_prompt import SYSTEM_PROMPT, build_user_message
from analysis.models import ExtractionResult
from settings import get, require

logger = logging.getLogger("extractor")

# Chosen by measurement, not by version number: this model returned all 38
# clauses with zero unverifiable quotes on a test offer letter, and is what the
# API itself recommends for new keys. Override with GEMINI_MODEL.
DEFAULT_MODEL = "gemini-3.6-flash"

# 38 clauses, each with a quote, an explanation and up to three questions, plus
# thinking tokens — which Gemini bills and counts against this ceiling. A real
# run used about 4,200; the headroom is for longer documents.
DEFAULT_MAX_TOKENS = 32_000

# A long read of a long document. Generous, but bounded, so a stuck request
# eventually fails instead of holding the connection until the proxy kills it.
DEFAULT_TIMEOUT_SECONDS = 240.0

# Gemini's free tier returns 503 under load often enough that one attempt is not
# a fair test of whether the service is up.
MAX_TRANSIENT_RETRIES = 2


class ExtractionError(Exception):
    """Analysis failed. The message is safe to show the user."""


class ExtractionUnavailable(ExtractionError):
    """Analysis is not configured or the provider is down — a 503, not a 400."""


class ClauseExtractor:
    """Reads an offer letter with Gemini.

    The client is injected rather than constructed here so tests can pass a
    stub, and so a deployment can hand in a client with its own credentials or
    transport.
    """

    def __init__(
        self,
        client: genai.Client,
        *,
        model: str = DEFAULT_MODEL,
        max_tokens: int = DEFAULT_MAX_TOKENS,
    ) -> None:
        self._client = client
        self._model = model
        self._max_tokens = max_tokens

    async def extract(self, document_text: str, *, file_name: str) -> ExtractionResult:
        """Analyse one document. Retries once if the model returns unusable JSON."""
        user_message = build_user_message(document_text, file_name=file_name)

        try:
            return await self._request(user_message)
        except ExtractionError:
            raise
        except (pydantic.ValidationError, json.JSONDecodeError, ValueError) as exc:
            # A malformed answer is usually a one-off. Ask again before giving
            # up; if the second attempt is also bad, the failure is real.
            logger.warning("Model returned unusable JSON, retrying once: %s", exc)

        try:
            return await self._request(
                user_message
                + "\n\nReturn only the JSON object described by the schema, with all "
                "38 clauses present."
            )
        except (pydantic.ValidationError, json.JSONDecodeError, ValueError) as exc:
            logger.error("Model returned unusable JSON twice: %s", exc)
            raise ExtractionError(
                "We couldn't make sense of the analysis for that document. Please try again."
            ) from exc

    async def _request(self, user_message: str) -> ExtractionResult:
        config = types.GenerateContentConfig(
            system_instruction=SYSTEM_PROMPT,
            # Schema and mime type together are what stop the model wrapping the
            # JSON in prose or a markdown fence.
            response_mime_type="application/json",
            response_schema=ExtractionResult,
            max_output_tokens=self._max_tokens,
            http_options=types.HttpOptions(
                timeout=int(float(get("GEMINI_TIMEOUT_SECONDS", str(DEFAULT_TIMEOUT_SECONDS))) * 1000)
            ),
        )

        response = await self._call_with_retries(user_message, config)
        self._check_finish_reason(response)

        parsed = response.parsed
        if not isinstance(parsed, ExtractionResult):
            # `parsed` is None when the SDK could not coerce the reply. Fall back
            # to the raw text before declaring the attempt lost; either branch
            # raises on bad JSON, which is what triggers the retry above.
            text = response.text or ""
            if not text.strip():
                raise ValueError("model returned an empty response")
            parsed = ExtractionResult.model_validate(json.loads(text))

        usage = response.usage_metadata
        logger.info(
            "Analysed document with %s: %d clauses, %s in / %s out tokens (%s thinking)",
            self._model,
            len(parsed.checks),
            getattr(usage, "prompt_token_count", "?"),
            getattr(usage, "candidates_token_count", "?"),
            getattr(usage, "thoughts_token_count", None) or 0,
        )
        return parsed

    async def _call_with_retries(self, user_message: str, config: types.GenerateContentConfig):
        """Send the request, retrying the failures that are worth retrying.

        A 503 on the free tier means "busy", not "broken", and a 429 means "not
        yet". Both deserve another go; a 400 does not, because sending the same
        bad request again will fail the same way.
        """
        last: Exception | None = None

        for attempt in range(MAX_TRANSIENT_RETRIES + 1):
            try:
                return await self._client.aio.models.generate_content(
                    model=self._model, contents=user_message, config=config
                )
            except genai_errors.ClientError as exc:
                if exc.code == 429:
                    last = exc
                    logger.warning("Rate limited by Gemini (attempt %d)", attempt + 1)
                elif exc.code in (401, 403):
                    logger.error("Gemini rejected our credentials: %s", exc)
                    raise ExtractionUnavailable(
                        "Analysis isn't available right now. Please try again shortly."
                    ) from exc
                else:
                    logger.error("Gemini rejected the request (%s): %s", exc.code, exc)
                    raise ExtractionError(
                        "We couldn't analyse that document. Please check it's an offer "
                        "letter and try again."
                    ) from exc
            except genai_errors.ServerError as exc:
                last = exc
                logger.warning("Gemini unavailable (%s), attempt %d", exc.code, attempt + 1)
            except asyncio.TimeoutError as exc:
                last = exc
                logger.warning("Gemini request timed out, attempt %d", attempt + 1)

            if attempt < MAX_TRANSIENT_RETRIES:
                # Jittered backoff: without the jitter, a burst of uploads would
                # retry in lockstep and hit the same busy minute together.
                await asyncio.sleep(2**attempt + random.uniform(0, 1))

        logger.error("Gemini did not answer after %d attempts: %s", MAX_TRANSIENT_RETRIES + 1, last)
        raise ExtractionUnavailable(
            "We're handling a lot of documents right now. Please try again in a minute."
        ) from last

    @staticmethod
    def _check_finish_reason(response) -> None:
        """Catch the ways a response can look fine but be incomplete."""
        candidates = response.candidates or []
        if not candidates:
            # No candidate at all means the prompt itself was blocked.
            raise ExtractionError(
                "We couldn't analyse that document. Please check it's an offer letter "
                "and try again."
            )

        reason = candidates[0].finish_reason
        if reason == types.FinishReason.MAX_TOKENS:
            raise ExtractionError(
                "That document was too long to analyse in one pass. "
                "Try uploading just the offer letter."
            )
        if reason in (
            types.FinishReason.SAFETY,
            types.FinishReason.PROHIBITED_CONTENT,
            types.FinishReason.BLOCKLIST,
            types.FinishReason.RECITATION,
        ):
            logger.warning("Model declined the document (finish_reason=%s)", reason)
            raise ExtractionError(
                "We couldn't analyse that document. Please check it's an offer letter "
                "and try again."
            )


_extractor: Optional[ClauseExtractor] = None


def get_extractor() -> ClauseExtractor:
    """The shared extractor, built on first use.

    Built lazily rather than at import for the same reason main.py tolerates a
    dead database at boot: a missing GEMINI_API_KEY should take out the upload
    endpoint, not the whole API — including /api/health, which is where you would
    go to find out what is wrong.
    """
    global _extractor
    if _extractor is not None:
        return _extractor

    try:
        api_key = require("GEMINI_API_KEY")
    except RuntimeError as exc:
        logger.error("%s", exc)
        raise ExtractionUnavailable(
            "Analysis isn't switched on yet. Please try again later."
        ) from exc

    _extractor = ClauseExtractor(
        genai.Client(api_key=api_key),
        model=get("GEMINI_MODEL", DEFAULT_MODEL),
        max_tokens=int(get("GEMINI_MAX_TOKENS", str(DEFAULT_MAX_TOKENS))),
    )
    return _extractor
