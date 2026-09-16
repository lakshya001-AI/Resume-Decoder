"""Check the model's answer against the document before anyone sees it.

Structured outputs guarantee the *shape* of the response. They guarantee nothing
about the *content* — the model can return a well-formed object containing a
notice period that is not in the letter. This module is the part that cares
whether the answer is true:

* every one of the 38 clauses is present exactly once, in catalogue order;
* every quote is actually in the document, on the page it claims;
* a clause with no verifiable quote is never reported as a confident finding.

Nothing here trusts a field just because it parsed.
"""

import logging
import re
import unicodedata
from typing import NamedTuple, Optional

from analysis.models import (
    MAX_HR_QUESTIONS,
    MAX_QUESTIONS_PER_CHECK,
    MAX_QUOTE_CHARS,
    Evidence,
    ExtractedCheck,
    ExtractionResult,
    ReportCheck,
)
from analysis.checks import CHECKS, CHECKS_BY_ID
from analysis.pdf_parser import PdfText

logger = logging.getLogger("validator")

# How much of a quote has to line up before we accept it. PDF extraction mangles
# the ends of lines often enough that demanding the whole quote would reject
# honest evidence; this is the compromise.
PREFIX_WORDS = 12
MIN_PREFIX_CHARS = 40

_PUNCTUATION_LOOKALIKES = str.maketrans(
    {
        "‘": "'",
        "’": "'",
        "“": '"',
        "”": '"',
        "–": "-",
        "—": "-",
        "−": "-",
        " ": " ",
        "­": "",  # soft hyphen: invisible in a viewer, present in the text
    }
)

_STANDARD_EXPLANATION = "The offer letter doesn't say anything about this."


class ValidationOutcome(NamedTuple):
    checks: tuple[ReportCheck, ...]  # exactly 38, in catalogue order
    summary: str
    hr_questions: tuple[str, ...]
    # Counters for the log. A run where many quotes failed to verify is a signal
    # that something changed — a worse model, a bad prompt edit, odd PDF text.
    evidence_rejected: int
    clauses_missing: int


def _normalise(text: str) -> str:
    """Flatten text to the form quotes are compared in.

    Case, whitespace and lookalike punctuation are the three things that differ
    between what a model copies out and what the PDF layer produced, and none of
    them change what the sentence says.
    """
    text = unicodedata.normalize("NFKC", text)
    text = text.translate(_PUNCTUATION_LOOKALIKES)
    return re.sub(r"\s+", " ", text).strip().casefold()


class _DocumentIndex:
    """The document's pages, pre-normalised for repeated quote lookups."""

    def __init__(self, parsed: PdfText) -> None:
        self._by_page = {page.number: _normalise(page.text) for page in parsed.pages}

    def locate(self, quote: str) -> Optional[int]:
        """The page this quote is on, or None if it is nowhere in the document.

        Checks the whole quote first, then its opening words. The page is
        returned rather than a boolean so a right quote with a wrong page number
        gets corrected instead of thrown away.
        """
        needle = _normalise(quote)
        if not needle:
            return None

        for number, text in self._by_page.items():
            if needle in text:
                return number

        prefix = " ".join(needle.split()[:PREFIX_WORDS])
        if len(prefix) < MIN_PREFIX_CHARS:
            # Too short to be distinctive — accepting it would let a fragment
            # that happens to appear anywhere pass as evidence.
            return None

        for number, text in self._by_page.items():
            if prefix in text:
                return number
        return None


def _clean_questions(questions: list[str]) -> list[str]:
    """Strip blanks and near-duplicates, then cap the list."""
    seen: set[str] = set()
    cleaned: list[str] = []
    for question in questions:
        text = " ".join(str(question).split())
        if not text:
            continue
        key = _normalise(text)
        if key in seen:
            continue
        seen.add(key)
        cleaned.append(text)
    return cleaned


def _not_specified(check_id: str) -> ReportCheck:
    definition = CHECKS_BY_ID[check_id]
    return ReportCheck(
        id=definition.id,
        title=definition.title,
        status="not_specified",
        priority=definition.priority,
        value=None,
        evidence=None,
        explanation=_STANDARD_EXPLANATION,
        questions=[],
    )


def _validate_one(raw: ExtractedCheck, index: _DocumentIndex) -> tuple[ReportCheck, bool]:
    """Turn one model answer into a report entry. Returns (check, evidence_rejected)."""
    definition = CHECKS_BY_ID[raw.id]
    status = raw.status
    value = " ".join(raw.value.split()) if raw.value else None
    evidence: Optional[Evidence] = None
    unverified = False
    rejected = False

    if status == "not_specified":
        # Nothing to stand on, so nothing may be attached to it.
        return (
            ReportCheck(
                id=definition.id,
                title=definition.title,
                status="not_specified",
                priority=definition.priority,
                value=None,
                evidence=None,
                explanation=raw.explanation.strip() or _STANDARD_EXPLANATION,
                questions=[],
            ),
            False,
        )

    if raw.evidence is not None:
        page = index.locate(raw.evidence.quote)
        if page is None:
            rejected = True
            unverified = True
            logger.info(
                "Dropped unverifiable evidence for %s: %r",
                raw.id,
                raw.evidence.quote[:120],
            )
        else:
            if page != raw.evidence.page:
                logger.debug(
                    "Corrected page for %s: model said %d, quote is on %d",
                    raw.id,
                    raw.evidence.page,
                    page,
                )
            evidence = Evidence(
                quote=raw.evidence.quote.strip()[:MAX_QUOTE_CHARS],
                page=page,
            )
    else:
        # A claim with no quote offered at all is no better than one whose quote
        # turned out to be invented.
        unverified = True

    # A clause we cannot point at is not a confident finding, whatever the model
    # called it. Demote rather than delete: the reader is better served by
    # "we think this is here but couldn't confirm it" than by silence.
    if unverified and status == "found":
        status = "unclear"

    # "found" with no answer in it is a contradiction — treat it as ambiguous.
    if status == "found" and not value:
        status = "unclear"

    return (
        ReportCheck(
            id=definition.id,
            title=definition.title,
            status="clear" if status == "found" else "attention",
            priority=definition.priority,
            value=value,
            evidence=evidence,
            explanation=raw.explanation.strip(),
            questions=_clean_questions(raw.questions)[:MAX_QUESTIONS_PER_CHECK],
            unverified=unverified,
        ),
        rejected,
    )


def validate(result: ExtractionResult, parsed: PdfText) -> ValidationOutcome:
    """Reconcile the model's answer with the document it was supposed to read."""
    index = _DocumentIndex(parsed)

    # First answer per clause wins; later ones are the model repeating itself.
    # Unknown ids cannot happen through structured outputs, but the fallback
    # JSON path has no such guarantee, so they are dropped here rather than
    # trusted to be impossible.
    by_id: dict[str, ExtractedCheck] = {}
    for raw in result.checks:
        if raw.id not in CHECKS_BY_ID:
            logger.warning("Model returned an unknown clause id: %r", raw.id)
            continue
        by_id.setdefault(raw.id, raw)

    checks: list[ReportCheck] = []
    evidence_rejected = 0
    missing = 0

    for definition in CHECKS:
        raw = by_id.get(definition.id)
        if raw is None:
            # Silence is not evidence of absence, but reporting it as
            # "not specified" is the only honest thing we can say about a clause
            # the model skipped.
            missing += 1
            checks.append(_not_specified(definition.id))
            continue

        check, rejected = _validate_one(raw, index)
        evidence_rejected += rejected
        checks.append(check)

    if missing:
        logger.warning("Model skipped %d of %d clauses", missing, len(CHECKS))
    if evidence_rejected:
        logger.warning("Rejected %d quotes that were not in the document", evidence_rejected)

    return ValidationOutcome(
        checks=tuple(checks),
        summary=" ".join(result.document_summary.split()),
        hr_questions=tuple(_clean_questions(result.hr_questions)[:MAX_HR_QUESTIONS]),
        evidence_rejected=evidence_rejected,
        clauses_missing=missing,
    )
