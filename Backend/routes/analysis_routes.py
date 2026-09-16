"""Upload an offer letter, get a structured audit back.

    POST /api/upload            multipart/form-data, one PDF
    GET  /api/audit/{id}        a previously generated report

The pipeline is deliberately linear and each stage lives in its own service:
read the PDF, ask the model, check the answer against the document, shape the
report, store it. Nothing is written to disk at any point.
"""

import logging
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.concurrency import run_in_threadpool
from pymongo.errors import PyMongoError

from analysis.extractor import (
    ClauseExtractor,
    ExtractionError,
    ExtractionUnavailable,
    get_extractor,
)
from analysis.models import AnalysisReport
from analysis.pdf_parser import PdfParseError, as_prompt_text, extract_pages
from analysis.report_builder import build_report
from analysis.storage import find_audit, new_analysis_id, save_with_fresh_id
from analysis.validator import validate
from settings import get

logger = logging.getLogger("analysis")

router = APIRouter(tags=["analysis"])

# Matches the limit the upload page enforces in the browser. That check is a
# courtesy; this one is the one that counts.
MAX_UPLOAD_MB = int(get("MAX_UPLOAD_MB", "10"))
MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024

_READ_CHUNK = 1024 * 1024

# Every PDF starts with this. Checking it costs nothing and catches a .docx
# renamed to .pdf before we spend a model call on it.
_PDF_MAGIC = b"%PDF-"


def _bad_request(message: str) -> HTTPException:
    return HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=message)


_NOT_CONFIGURED = "Analysis isn't switched on yet. Please try again later."


def extractor_dependency() -> Optional[ClauseExtractor]:
    """The extractor, or None when analysis is not configured.

    Deliberately does not raise. FastAPI resolves dependencies before the
    handler body runs, so raising here would answer "analysis isn't switched on"
    to someone who actually uploaded a Word document — the wrong complaint, and
    the one they can do nothing about. The handler raises the 503 itself, after
    it has had a chance to reject the file on its own merits.

    Being a dependency rather than a direct call is what lets a test swap in a
    stub through app.dependency_overrides.
    """
    try:
        return get_extractor()
    except ExtractionUnavailable:
        return None


async def _read_upload(upload: UploadFile) -> bytes:
    """Read the upload into memory, refusing anything oversized.

    Read in chunks rather than in one call so an oversized file is rejected
    partway through instead of being buffered in full first.
    """
    name = (upload.filename or "").lower()
    looks_like_pdf = upload.content_type == "application/pdf" or name.endswith(".pdf")
    if not looks_like_pdf:
        raise _bad_request(
            "That's not a PDF. Export your offer letter as a PDF and try again."
        )

    chunks: list[bytes] = []
    size = 0
    while chunk := await upload.read(_READ_CHUNK):
        size += len(chunk)
        if size > MAX_UPLOAD_BYTES:
            raise HTTPException(
                status_code=status.HTTP_413_CONTENT_TOO_LARGE,
                detail=f"That file is over {MAX_UPLOAD_MB}MB. Try a smaller PDF.",
            )
        chunks.append(chunk)

    data = b"".join(chunks)
    if not data:
        raise _bad_request("That file is empty.")
    if not data.startswith(_PDF_MAGIC):
        raise _bad_request(
            "That file isn't a PDF inside, whatever it's named. Export it again as a PDF."
        )
    return data


@router.post(
    "/upload",
    response_model=AnalysisReport,
    summary="Analyse an offer letter PDF",
)
async def upload_offer_letter(
    file: UploadFile = File(..., description="The offer letter, as a PDF."),
    extractor: Optional[ClauseExtractor] = Depends(extractor_dependency),
) -> AnalysisReport:
    data = await _read_upload(file)
    file_name = (file.filename or "offer-letter.pdf").strip()
    uploaded_at = datetime.now(timezone.utc)

    # PyMuPDF is CPU-bound and synchronous; off the event loop it goes, or a
    # twenty-page document blocks every other request while it parses.
    try:
        parsed = await run_in_threadpool(extract_pages, data)
    except PdfParseError as exc:
        raise _bad_request(str(exc)) from exc
    finally:
        # The bytes are of no further use, and holding them is the one thing we
        # told the user we would not do.
        del data

    # Only now, with a document we know we can read, does it matter whether
    # there is anything to read it with.
    if extractor is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=_NOT_CONFIGURED
        )

    logger.info("Analysing %r (%d pages)", file_name, parsed.total_pages)

    try:
        result = await extractor.extract(as_prompt_text(parsed), file_name=file_name)
    except ExtractionUnavailable as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)
        ) from exc
    except ExtractionError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)
        ) from exc

    outcome = validate(result, parsed)
    report = build_report(
        outcome,
        analysis_id=new_analysis_id(),
        file_name=file_name,
        page_count=parsed.total_pages,
        uploaded_at=uploaded_at,
    )

    try:
        report = await run_in_threadpool(save_with_fresh_id, report)
    except (PyMongoError, RuntimeError) as exc:
        # The analysis is finished and correct. Throwing it away because the
        # database blinked would waste the model call and the user's wait for
        # no gain; they lose only the ability to reopen it by id later.
        logger.error("Could not store audit %s: %s", report.analysisId, exc)

    logger.info(
        "Report %s ready: %d clear, %d attention, %d not specified",
        report.analysisId,
        report.summary.clear,
        report.summary.attention,
        report.summary.notSpecified,
    )
    return report


@router.get(
    "/audit/{analysis_id}",
    response_model=AnalysisReport,
    summary="Fetch a report generated earlier",
)
async def get_audit(analysis_id: str) -> AnalysisReport:
    report = await run_in_threadpool(find_audit, analysis_id)
    if report is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="We don't have a report with that id. It may have expired.",
        )
    return report
