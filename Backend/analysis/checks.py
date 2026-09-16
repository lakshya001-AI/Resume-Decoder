"""The 38 clauses this tool looks for, and how they are grouped.

This catalogue is the single source of truth. The extraction prompt, the
validator and the report builder all read it, so adding or renaming a clause is
one edit here rather than four edits that can quietly drift apart.

`CheckId` is spelled out rather than generated from CHECKS so that type checkers
can see the real literals; the assertion at the bottom is what stops the two
lists from diverging.
"""

from typing import Literal, NamedTuple, get_args

# What the model may say about a clause it was asked to find.
ExtractionStatus = Literal["found", "unclear", "not_specified"]

# What the frontend renders. "found" becomes "clear", "unclear" becomes
# "attention" — see analysis/report_builder.py for the mapping.
ReportStatus = Literal["clear", "attention", "not_specified"]

# How loudly a clause deserves to be surfaced when it needs attention. Driven by
# how much an Indian offer letter's version of that clause typically costs the
# candidate if they miss it, not by how common it is.
Priority = Literal["high", "medium", "low"]

CheckId = Literal[
    # Compensation
    "total_ctc",
    "fixed_salary",
    "variable_pay",
    "employer_pf",
    "gratuity",
    "joining_bonus",
    "relocation_bonus",
    "bonus_clawback",
    "salary_revision",
    # Leaving the company
    "minimum_service",
    "bond_penalty",
    "notice_period_employee",
    "notice_period_employer",
    "probation_period",
    "probation_notice",
    "notice_buyout",
    "termination_clause",
    # Working conditions
    "working_hours",
    "working_days",
    "shift",
    "night_shift",
    "overtime",
    "weekend_work",
    "work_location",
    "transfer_clause",
    # Leaves and benefits
    "annual_leave",
    "sick_leave",
    "casual_leave",
    "paid_leave",
    "leave_carry",
    "leave_encash",
    # Restrictions
    "moonlighting",
    "ip_ownership",
    "open_source",
    "non_compete",
    "confidentiality",
    # Other conditions
    "background_verification",
    "company_policy",
]


class Category(NamedTuple):
    id: str
    title: str


class Check(NamedTuple):
    id: CheckId
    title: str
    category: str
    priority: Priority
    # One line telling the model what counts as this clause. Deliberately terse:
    # it goes into the prompt 38 times over, and a long description invites the
    # model to pattern-match on the description instead of the document.
    hint: str


CATEGORIES: tuple[Category, ...] = (
    Category("compensation", "Compensation"),
    Category("leaving_company", "Leaving the Company"),
    Category("working_conditions", "Working Conditions"),
    Category("leaves", "Leaves & Benefits"),
    Category("restrictions", "Restrictions"),
    Category("other", "Other Conditions"),
)

CHECKS: tuple[Check, ...] = (
    # --- Compensation (9) ---------------------------------------------------
    Check(
        "total_ctc",
        "Total CTC",
        "compensation",
        "high",
        "The headline annual cost to company, including every component.",
    ),
    Check(
        "fixed_salary",
        "Fixed Salary",
        "compensation",
        "high",
        "The guaranteed annual or monthly pay, excluding variable and one-off components.",
    ),
    Check(
        "variable_pay",
        "Variable Pay",
        "compensation",
        "high",
        "Performance bonus, incentive or any pay conditional on targets being met.",
    ),
    Check(
        "employer_pf",
        "Employer PF",
        "compensation",
        "medium",
        "The employer's Provident Fund contribution, and whether it sits inside the CTC.",
    ),
    Check(
        "gratuity",
        "Gratuity",
        "compensation",
        "medium",
        "Gratuity amount or formula, and whether it is counted inside the CTC.",
    ),
    Check(
        "joining_bonus",
        "Joining Bonus",
        "compensation",
        "medium",
        "Sign-on or joining bonus, including when it is paid out.",
    ),
    Check(
        "relocation_bonus",
        "Relocation Bonus",
        "compensation",
        "low",
        "Relocation allowance or reimbursement of moving costs.",
    ),
    Check(
        "bonus_clawback",
        "Bonus Repayment",
        "compensation",
        "high",
        "Any duty to repay a joining, retention or relocation bonus on early exit.",
    ),
    Check(
        "salary_revision",
        "Salary Revision",
        "compensation",
        "low",
        "When and how pay is reviewed, and whether a raise is promised or discretionary.",
    ),
    # --- Leaving the company (8) --------------------------------------------
    Check(
        "minimum_service",
        "Minimum Service Period",
        "leaving_company",
        "high",
        "A committed minimum time with the company before resigning is allowed.",
    ),
    Check(
        "bond_penalty",
        "Bond Penalty",
        "leaving_company",
        "high",
        "Money payable, or a training cost recoverable, if the bond or service period is broken.",
    ),
    Check(
        "notice_period_employee",
        "Employee Notice",
        "leaving_company",
        "high",
        "How much notice the employee must give to resign.",
    ),
    Check(
        "notice_period_employer",
        "Employer Notice",
        "leaving_company",
        "medium",
        "How much notice the company must give to terminate.",
    ),
    Check(
        "probation_period",
        "Probation Duration",
        "leaving_company",
        "medium",
        "Length of probation and what confirmation depends on.",
    ),
    Check(
        "probation_notice",
        "Probation Notice",
        "leaving_company",
        "medium",
        "The shorter notice period that applies while on probation, for either side.",
    ),
    Check(
        "notice_buyout",
        "Buyout Available",
        "leaving_company",
        "high",
        "Whether unserved notice can be bought out, at whose discretion, and at what rate.",
    ),
    Check(
        "termination_clause",
        "Termination",
        "leaving_company",
        "high",
        "The grounds on which the company may end employment, including immediate dismissal.",
    ),
    # --- Working conditions (8) ---------------------------------------------
    Check(
        "working_hours",
        "Daily/Weekly Hours",
        "working_conditions",
        "medium",
        "Stated hours per day or per week.",
    ),
    Check(
        "working_days",
        "Working Days",
        "working_conditions",
        "low",
        "Which days of the week are working days.",
    ),
    Check(
        "shift",
        "Rotational Shift",
        "working_conditions",
        "medium",
        "Whether shifts rotate, and whether the company may change the shift.",
    ),
    Check(
        "night_shift",
        "Night Shift",
        "working_conditions",
        "medium",
        "Any requirement to work nights, and any allowance for it.",
    ),
    Check(
        "overtime",
        "Overtime",
        "working_conditions",
        "medium",
        "Whether extra hours are paid, compensated with time off, or unpaid.",
    ),
    Check(
        "weekend_work",
        "Weekend Work",
        "working_conditions",
        "medium",
        "Any requirement to work weekends or public holidays.",
    ),
    Check(
        "work_location",
        "Primary Location",
        "working_conditions",
        "medium",
        "The named base location, and whether the role is on-site, hybrid or remote.",
    ),
    Check(
        "transfer_clause",
        "Transfer Rights",
        "working_conditions",
        "high",
        "The company's right to move the employee to another city, office, project or group entity.",
    ),
    # --- Leaves and benefits (6) --------------------------------------------
    Check(
        "annual_leave",
        "Annual Leave",
        "leaves",
        "medium",
        "Earned or privilege leave days per year.",
    ),
    Check(
        "sick_leave",
        "Sick Leave",
        "leaves",
        "low",
        "Sick leave days per year and any medical certificate requirement.",
    ),
    Check(
        "casual_leave",
        "Casual Leave",
        "leaves",
        "low",
        "Casual leave days per year.",
    ),
    Check(
        "paid_leave",
        "Paid Leave",
        "leaves",
        "medium",
        "Total paid time off, where the letter gives one combined figure rather than a split.",
    ),
    Check(
        "leave_carry",
        "Carry Forward",
        "leaves",
        "low",
        "Whether unused leave carries into the next year, and any cap on it.",
    ),
    Check(
        "leave_encash",
        "Leave Encashment",
        "leaves",
        "low",
        "Whether unused leave is paid out, and on what terms.",
    ),
    # --- Restrictions (5) ----------------------------------------------------
    Check(
        "moonlighting",
        "Outside Employment",
        "restrictions",
        "high",
        "Limits on second jobs, freelancing, consulting or running a business.",
    ),
    Check(
        "ip_ownership",
        "Intellectual Property",
        "restrictions",
        "high",
        "Who owns work product, inventions and code, and whether that reaches personal projects.",
    ),
    Check(
        "open_source",
        "Open Source",
        "restrictions",
        "medium",
        "Rules on contributing to or using open-source projects.",
    ),
    Check(
        "non_compete",
        "Non Compete",
        "restrictions",
        "high",
        "Limits on joining a competitor, or on soliciting clients or colleagues, after leaving.",
    ),
    Check(
        "confidentiality",
        "Confidentiality",
        "restrictions",
        "medium",
        "The duty to keep company information secret, and how long it lasts.",
    ),
    # --- Other conditions (2) ------------------------------------------------
    Check(
        "background_verification",
        "Background Verification",
        "other",
        "medium",
        "Background or reference checks, and what happens if one comes back adverse.",
    ),
    Check(
        "company_policy",
        "Company Policy References",
        "other",
        "medium",
        "Terms that defer to a separate handbook or policy the candidate has not been shown.",
    ),
)

CHECKS_BY_ID: dict[str, Check] = {check.id: check for check in CHECKS}

CATEGORY_TITLES: dict[str, str] = {category.id: category.title for category in CATEGORIES}

TOTAL_CHECKS = len(CHECKS)


def checks_in(category_id: str) -> tuple[Check, ...]:
    """The catalogue order of one category — the order the report renders in."""
    return tuple(check for check in CHECKS if check.category == category_id)


# Guard rails. These run at import, so a typo in the catalogue fails at boot
# rather than halfway through somebody's upload.
assert TOTAL_CHECKS == 38, f"Expected 38 checks, catalogue has {TOTAL_CHECKS}"
assert set(CHECKS_BY_ID) == set(get_args(CheckId)), "CHECKS and CheckId disagree"
assert len(CHECKS_BY_ID) == TOTAL_CHECKS, "Duplicate check id in the catalogue"
assert all(check.category in CATEGORY_TITLES for check in CHECKS), "Unknown category id"
