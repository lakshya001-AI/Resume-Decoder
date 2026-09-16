"""Turn an uploaded PDF into page-numbered text.

Page numbers are the point. Every finding in the report has to cite a page the
candidate can turn to, so the text is never flattened into one blob — it is kept
per page from here all the way through validation.

The PDF bytes stay in memory and are never written to disk.
"""

import logging
import re
from typing import NamedTuple

import pymupdf

logger = logging.getLogger("pdf")

# An offer letter that runs past this is either not an offer letter or is an
# employee handbook, and either way the tail is not what we were asked about.
MAX_PAGES = 40

# Roughly 45k tokens of document, which leaves plenty of room under the context
# window for the prompt and a 38-clause answer.
MAX_CHARS = 180_000

# Below this, whatever came out of the PDF is not prose — almost always a scan
# or a photo of a letter, which has no text layer to extract.
MIN_MEANINGFUL_CHARS = 200


class PdfParseError(Exception):
    """The upload could not be read. The message is shown to the user."""


class Page(NamedTuple):
    number: int  # 1-based, matching what the reader sees in a PDF viewer
    text: str


class PdfText(NamedTuple):
    pages: tuple[Page, ...]
    total_pages: int  # pages in the document, which may exceed len(pages)
    truncated: bool


def _tidy(text: str) -> str:
    """Make extracted text readable without destroying the words in it.

    Only whitespace is touched. Quote verification later compares the model's
    quotes against this text, so anything that rewrote characters here would
    make honest quotes look invented.
    """
    # PDF extraction litters lines with trailing spaces and stacks blank lines
    # wherever the layout had vertical space.
    text = text.replace(" ", " ")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r" *\n *", "\n", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def extract_pages(data: bytes, *, max_pages: int = MAX_PAGES, max_chars: int = MAX_CHARS) -> PdfText:
    """Read `data` as a PDF and return its text, one entry per page.

    Raises PdfParseError with a message fit to show the user.
    """
    if not data:
        raise PdfParseError("That file is empty.")

    try:
        document = pymupdf.open(stream=data, filetype="pdf")
    except Exception as exc:  # pymupdf raises several unrelated types here
        logger.info("Rejected an unreadable upload: %s", exc)
        raise PdfParseError("That file isn't a readable PDF. Try exporting it again.") from exc

    with document:
        if document.needs_pass:
            raise PdfParseError(
                "That PDF is password protected. Remove the password and upload it again."
            )

        total_pages = document.page_count
        if total_pages == 0:
            raise PdfParseError("That PDF has no pages in it.")

        pages: list[Page] = []
        characters = 0
        truncated = total_pages > max_pages

        for index in range(min(total_pages, max_pages)):
            try:
                raw = document[index].get_text("text")
            except Exception as exc:
                # One damaged page should not lose the other nineteen.
                logger.warning("Could not read page %d: %s", index + 1, exc)
                continue

            text = _tidy(raw)
            if not text:
                continue

            remaining = max_chars - characters
            if remaining <= 0:
                truncated = True
                break
            if len(text) > remaining:
                text = text[:remaining]
                truncated = True

            characters += len(text)
            pages.append(Page(number=index + 1, text=text))

    if characters < MIN_MEANINGFUL_CHARS:
        raise PdfParseError(
            "We couldn't read any text in that PDF. It looks like a scan or a photo — "
            "upload the original PDF your employer sent, not a scanned printout."
        )

    return PdfText(pages=tuple(pages), total_pages=total_pages, truncated=truncated)


def as_prompt_text(parsed: PdfText) -> str:
    """Render the pages for the model with their numbers attached.

    The markers are what let the model cite a page, and what lets the validator
    check that the page it cited is the page the quote is actually on.
    """
    blocks = [f"<page number=\"{page.number}\">\n{page.text}\n</page>" for page in parsed.pages]
    body = "\n\n".join(blocks)

    if parsed.truncated:
        body += (
            f"\n\n<note>This document was truncated. It has {parsed.total_pages} pages in "
            f"total and only the text above was provided.</note>"
        )
    return body
