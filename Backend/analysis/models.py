"""Shapes for the offer-letter audit: what the model returns, and what we return.

Two families live here and they are deliberately not the same thing:

* `ExtractionResult` and friends are what the model is asked to produce. Nothing
  is defaulted — a default would let a missing field pass silently as a real
  answer. The models carry no `extra="forbid"`: that emits
  `additionalProperties`, which Gemini's structured output rejects outright.
* `AnalysisReport` and friends are the wire shape the frontend consumes. Field
  names are camelCase to match the agreed response contract, which is why they
  break Python convention.
"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from analysis.checks import CheckId, ExtractionStatus, Priority, ReportStatus

# A quote long enough to be evidence but not long enough to be a page dump. The
# validator truncates rather than rejecting, so this is a guide, not a cliff.
MAX_QUOTE_CHARS = 600

# Follow-up questions are for a real conversation with HR, so a handful beats a
# checklist nobody will read.
MAX_QUESTIONS_PER_CHECK = 3
MAX_HR_QUESTIONS = 8

# How many attention-worthy clauses lead the report.
MAX_TOP_FINDINGS = 6


# --------------------------------------------------------------------------- #
# What the model returns
# --------------------------------------------------------------------------- #


class Evidence(BaseModel):
    """The words in the document that a finding rests on."""

    quote: str = Field(description="Text copied verbatim from the offer letter.")
    page: int = Field(description="1-based page number the quote appears on.")


class ExtractedCheck(BaseModel):
    """One of the 38 clauses, as the model reports it.

    There is no `title` here on purpose. The title belongs to the catalogue in
    analysis/checks.py, so asking the model for it would add a field that can be
    wrong without adding anything that can be right.
    """

    id: CheckId
    status: ExtractionStatus
    value: Optional[str] = Field(
        description="The short answer, e.g. '90 days' or '₹9.5 LPA'. Null when not stated."
    )
    evidence: Optional[Evidence] = Field(
        description="Supporting quote and page. Null when nothing was found to quote."
    )
    explanation: str = Field(
        description="One or two plain sentences explaining what this means for the candidate."
    )
    questions: list[str] = Field(
        description="Questions the candidate could put to HR about this clause. May be empty."
    )


class ExtractionResult(BaseModel):
    """The whole model response for one document."""

    document_summary: str = Field(
        description="Two or three plain sentences describing this offer letter overall."
    )
    checks: list[ExtractedCheck]
    hr_questions: list[str] = Field(
        description="The most useful questions to ask HR, across all clauses."
    )


# --------------------------------------------------------------------------- #
# What we return to the frontend
# --------------------------------------------------------------------------- #


class ReportCheck(BaseModel):
    """A validated clause, titled and prioritised from the catalogue."""

    id: str
    title: str
    status: ReportStatus
    priority: Priority
    value: Optional[str] = None
    evidence: Optional[Evidence] = None
    explanation: str = ""
    questions: list[str] = Field(default_factory=list)
    # True when the model claimed this clause but its quote could not be found
    # in the document, so we stripped the evidence. The frontend should show
    # these as unconfirmed rather than as findings.
    unverified: bool = False


class ReportCategory(BaseModel):
    id: str
    title: str
    checks: list[ReportCheck]


class ReportSummary(BaseModel):
    totalChecks: int
    clear: int
    attention: int
    notSpecified: int
    headline: str


class DocumentInfo(BaseModel):
    fileName: str
    pages: int
    uploadedAt: datetime


class AccessInfo(BaseModel):
    """Placeholder for the paywall.

    Nothing bills yet, so this reports whatever REPORT_PLAN / REPORT_PRICE say
    and always unlocks. It exists so the frontend can render the real shape now
    instead of being rewritten when billing arrives.
    """

    plan: str
    unlocked: bool
    price: int


class AnalysisReport(BaseModel):
    success: bool = True
    analysisId: str
    access: AccessInfo
    document: DocumentInfo
    summary: ReportSummary
    topFindings: list[ReportCheck]
    categories: list[ReportCategory]
    hrQuestions: list[str]
    # Said on every response because the whole product depends on it being said.
    disclaimer: str = (
        "This is general information to help you read your offer letter. "
        "It is not legal advice."
    )
