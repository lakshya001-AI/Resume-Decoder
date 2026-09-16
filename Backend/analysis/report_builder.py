"""Assemble the validated clauses into the report the frontend renders."""

from datetime import datetime

from analysis.models import (
    MAX_TOP_FINDINGS,
    AccessInfo,
    AnalysisReport,
    DocumentInfo,
    ReportCategory,
    ReportCheck,
    ReportSummary,
)
from analysis.checks import CATEGORIES, CHECKS_BY_ID, TOTAL_CHECKS
from analysis.validator import ValidationOutcome
from settings import get

# Which clause leads the report when several need attention. A missing bond
# penalty matters more than a missing casual-leave figure.
_PRIORITY_ORDER = {"high": 0, "medium": 1, "low": 2}


def _top_findings(checks: tuple[ReportCheck, ...]) -> list[ReportCheck]:
    """The handful of clauses worth reading first.

    Clauses needing attention come first, ordered by how much they can cost the
    candidate. High-priority clauses the letter is silent on fill any remaining
    slots — a missing non-compete is not a finding, but a missing notice period
    is worth asking about.
    """
    order = {check.id: position for position, check in enumerate(checks)}

    def rank(check: ReportCheck) -> tuple[int, int]:
        return (_PRIORITY_ORDER[check.priority], order[check.id])

    attention = sorted((c for c in checks if c.status == "attention"), key=rank)
    findings = attention[:MAX_TOP_FINDINGS]

    if len(findings) < MAX_TOP_FINDINGS:
        gaps = sorted(
            (c for c in checks if c.status == "not_specified" and c.priority == "high"),
            key=rank,
        )
        findings += gaps[: MAX_TOP_FINDINGS - len(findings)]

    return findings


def _categories(checks: tuple[ReportCheck, ...]) -> list[ReportCategory]:
    by_category: dict[str, list[ReportCheck]] = {category.id: [] for category in CATEGORIES}
    for check in checks:
        # Catalogue order is preserved because `checks` arrives in it.
        by_category[CHECKS_BY_ID[check.id].category].append(check)

    return [
        ReportCategory(id=category.id, title=category.title, checks=by_category[category.id])
        for category in CATEGORIES
    ]


def build_report(
    outcome: ValidationOutcome,
    *,
    analysis_id: str,
    file_name: str,
    page_count: int,
    uploaded_at: datetime,
) -> AnalysisReport:
    checks = outcome.checks

    summary = ReportSummary(
        totalChecks=TOTAL_CHECKS,
        clear=sum(1 for c in checks if c.status == "clear"),
        attention=sum(1 for c in checks if c.status == "attention"),
        notSpecified=sum(1 for c in checks if c.status == "not_specified"),
        headline=outcome.summary,
    )

    return AnalysisReport(
        analysisId=analysis_id,
        access=AccessInfo(
            plan=get("REPORT_PLAN", "full"),
            unlocked=True,
            price=int(get("REPORT_PRICE", "0")),
        ),
        document=DocumentInfo(fileName=file_name, pages=page_count, uploadedAt=uploaded_at),
        summary=summary,
        topFindings=_top_findings(checks),
        categories=_categories(checks),
        hrQuestions=list(outcome.hr_questions),
    )
