"""Storage for offer-letter audits.

What is stored is the structured result — the 38 findings and the summary. The
uploaded PDF is not stored, not here and not on disk; it exists as bytes inside
one request and is released when that request ends. The frontend promises the
document is only used to generate the report, and this is where that promise is
either kept or broken.

The document layout mirrors the agreed audit model: id, created_at, file_name,
summary and audit.

This lives beside the rest of the analysis code rather than in MongoDB/ because
it is the only collection the analysis owns, and reading it next to the report
shape it stores is more use than reading it next to the users collection. The
client and the collection handle still come from MongoDB/configuration.py, which
is where every collection in the app is declared.
"""

import logging
import secrets
from datetime import datetime, timezone
from typing import Optional

from pydantic import ValidationError
from pymongo.errors import DuplicateKeyError

from MongoDB.configuration import audits_collection
from analysis.models import AnalysisReport

logger = logging.getLogger("audits")

# No 0/O or 1/I — these ids get read off a screen and typed back in.
_ID_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"

# 12 characters of this alphabet is 60 bits. The id is the only thing protecting
# a stored report, so it has to be long enough that guessing one is hopeless.
_ID_LENGTH = 12


def new_analysis_id() -> str:
    return "audit_" + "".join(secrets.choice(_ID_ALPHABET) for _ in range(_ID_LENGTH))


def save_audit(report: AnalysisReport) -> None:
    """Persist a finished report. Raises PyMongoError if the database is down."""
    document = report.model_dump(mode="json")

    audits_collection.insert_one(
        {
            "analysis_id": report.analysisId,
            "created_at": datetime.now(timezone.utc),
            "file_name": report.document.fileName,
            "page_count": report.document.pages,
            # Split the way the audit model describes: the headline numbers in
            # one field, the findings themselves in the other.
            "summary": document["summary"],
            "audit": {
                "topFindings": document["topFindings"],
                "categories": document["categories"],
                "hrQuestions": document["hrQuestions"],
            },
            "access": document["access"],
            # Reports are anonymous today. The field is here so that attaching
            # them to accounts later is a migration, not a schema change.
            "user_id": None,
        }
    )


def find_audit(analysis_id: str) -> Optional[AnalysisReport]:
    """Rebuild a stored report, or None if there is no such id.

    A document that no longer fits the current shape is treated as missing
    rather than crashing the request — the schema can move on without every old
    report becoming a 500.
    """
    document = audits_collection.find_one({"analysis_id": analysis_id})
    if document is None:
        return None

    try:
        return AnalysisReport(
            analysisId=document["analysis_id"],
            access=document["access"],
            document={
                "fileName": document["file_name"],
                "pages": document["page_count"],
                "uploadedAt": document["created_at"],
            },
            summary=document["summary"],
            topFindings=document["audit"]["topFindings"],
            categories=document["audit"]["categories"],
            hrQuestions=document["audit"]["hrQuestions"],
        )
    except (KeyError, ValidationError) as exc:
        logger.warning("Stored audit %s no longer matches the schema: %s", analysis_id, exc)
        return None


def save_with_fresh_id(report: AnalysisReport, *, attempts: int = 3) -> AnalysisReport:
    """Store the report, generating a new id on the (vanishingly rare) collision."""
    for _ in range(attempts):
        try:
            save_audit(report)
            return report
        except DuplicateKeyError:
            logger.warning("Analysis id collision on %s, regenerating", report.analysisId)
            report = report.model_copy(update={"analysisId": new_analysis_id()})

    raise RuntimeError(f"Could not allocate a free analysis id in {attempts} attempts")
