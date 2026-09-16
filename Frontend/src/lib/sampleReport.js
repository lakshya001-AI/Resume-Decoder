// A real report, produced by running the real pipeline over a fictional offer
// letter from a company that does not exist. Regenerate it the same way if the
// report shape changes; do not hand-edit findings into something the analysis
// would not actually produce.
export const SAMPLE_REPORT = {
  "success": true,
  "analysisId": "audit_SAMPLE00REPORT",
  "access": {
    "plan": "full",
    "unlocked": true,
    "price": 0
  },
  "document": {
    "fileName": "Sample offer letter.pdf",
    "pages": 3,
    "uploadedAt": "2026-09-12T10:30:00Z"
  },
  "summary": {
    "totalChecks": 38,
    "clear": 31,
    "attention": 1,
    "notSpecified": 6,
    "headline": "This offer letter is for an Associate Software Engineer role in Bengaluru with a total CTC of Rs. 8,40,000 per annum. Key terms include a 12-month minimum service commitment tied to a joining bonus repayment, unequal notice periods after confirmation (60 days for you versus 30 days for the employer), and provisions allowing the company to assign night shifts or transfer you to other locations."
  },
  "topFindings": [
    {
      "id": "leave_encash",
      "title": "Leave Encashment",
      "status": "attention",
      "priority": "low",
      "value": "Governed by separate HR policy",
      "evidence": {
        "quote": "Encashment of leave is governed by the HR policy in force.",
        "page": 3
      },
      "explanation": "The terms for converting unused leaves to cash depend on an external HR policy document not detailed in this offer letter.",
      "questions": [
        "Could you share the HR policy on leave encashment and how unused leaves are paid out upon resignation?"
      ],
      "unverified": false
    },
    {
      "id": "bond_penalty",
      "title": "Bond Penalty",
      "status": "not_specified",
      "priority": "high",
      "value": null,
      "evidence": null,
      "explanation": "The document requires you to refund the joining bonus if you resign early, but does not specify any additional financial penalty or training cost recovery.",
      "questions": [],
      "unverified": false
    }
  ],
  "categories": [
    {
      "id": "compensation",
      "title": "Compensation",
      "checks": [
        {
          "id": "total_ctc",
          "title": "Total CTC",
          "status": "clear",
          "priority": "high",
          "value": "Rs. 8,40,000 per annum",
          "evidence": {
            "quote": "Your total cost to company (CTC) will be Rs. 8,40,000 per annum, made up of:",
            "page": 1
          },
          "explanation": "This is the headline annual cost to the company for your employment, including all fixed pay, variable components, and statutory contributions.",
          "questions": [],
          "unverified": false
        },
        {
          "id": "fixed_salary",
          "title": "Fixed Salary",
          "status": "clear",
          "priority": "high",
          "value": "Rs. 6,60,000 per annum",
          "evidence": {
            "quote": "Fixed salary Rs. 6,60,000 per annum",
            "page": 1
          },
          "explanation": "This is your guaranteed annual gross base pay, paid out monthly before taxes and statutory deductions.",
          "questions": [],
          "unverified": false
        },
        {
          "id": "variable_pay",
          "title": "Variable Pay",
          "status": "clear",
          "priority": "high",
          "value": "Rs. 1,00,000 per annum",
          "evidence": {
            "quote": "Performance-linked variable pay Rs. 1,00,000 per annum",
            "page": 1
          },
          "explanation": "This payout is annual and depends on both company performance and your performance rating, meaning it is not guaranteed.",
          "questions": [
            "What key performance indicators or metrics are used to determine my variable pay rating?"
          ],
          "unverified": false
        },
        {
          "id": "employer_pf",
          "title": "Employer PF",
          "status": "clear",
          "priority": "medium",
          "value": "Rs. 43,200 per annum (included in CTC)",
          "evidence": {
            "quote": "Employer Provident Fund Rs. 43,200 per annum (included in CTC)",
            "page": 1
          },
          "explanation": "The company's contribution to your Provident Fund is counted as part of your total CTC rather than being paid over and above it.",
          "questions": [],
          "unverified": false
        },
        {
          "id": "gratuity",
          "title": "Gratuity",
          "status": "clear",
          "priority": "medium",
          "value": "Rs. 31,800 per annum (included in CTC)",
          "evidence": {
            "quote": "Gratuity provision Rs. 31,800 per annum (included in CTC)",
            "page": 1
          },
          "explanation": "The company includes a annual gratuity provision within your total CTC.",
          "questions": [],
          "unverified": false
        },
        {
          "id": "joining_bonus",
          "title": "Joining Bonus",
          "status": "clear",
          "priority": "medium",
          "value": "Rs. 75,000",
          "evidence": {
            "quote": "A joining bonus of Rs. 75,000 will be paid with your first month's salary.",
            "page": 1
          },
          "explanation": "You will receive a one-time sign-on bonus paid together with your first monthly salary payment.",
          "questions": [],
          "unverified": false
        },
        {
          "id": "relocation_bonus",
          "title": "Relocation Bonus",
          "status": "not_specified",
          "priority": "low",
          "value": null,
          "evidence": null,
          "explanation": "The offer letter does not mention any relocation bonus or reimbursement for moving expenses.",
          "questions": [],
          "unverified": false
        },
        {
          "id": "bonus_clawback",
          "title": "Bonus Repayment",
          "status": "clear",
          "priority": "high",
          "value": "Full refund of joining bonus if resigning before 12 months",
          "evidence": {
            "quote": "Should you resign before completing this period, the joining bonus shall be refunded in full.",
            "page": 2
          },
          "explanation": "If you resign within your first year of joining, you must repay the full Rs. 75,000 joining bonus to the company.",
          "questions": [],
          "unverified": false
        },
        {
          "id": "salary_revision",
          "title": "Salary Revision",
          "status": "clear",
          "priority": "low",
          "value": "Annual review in April (discretionary)",
          "evidence": {
            "quote": "Compensation is reviewed once a year in April. Any revision is at the sole discretion of management and no increment is assured.",
            "page": 1
          },
          "explanation": "Salary is reviewed every April, but any pay raise is entirely at management's discretion and not guaranteed.",
          "questions": [
            "Will I be eligible for the upcoming April pay review cycle if I join close to that date?"
          ],
          "unverified": false
        }
      ]
    },
    {
      "id": "leaving_company",
      "title": "Leaving the Company",
      "checks": [
        {
          "id": "minimum_service",
          "title": "Minimum Service Period",
          "status": "clear",
          "priority": "high",
          "value": "12 months",
          "evidence": {
            "quote": "You agree to remain in continuous service for a minimum period of 12 months from your date of joining.",
            "page": 2
          },
          "explanation": "You are committed to staying with the company for at least one year from your start date.",
          "questions": [],
          "unverified": false
        },
        {
          "id": "bond_penalty",
          "title": "Bond Penalty",
          "status": "not_specified",
          "priority": "high",
          "value": null,
          "evidence": null,
          "explanation": "The document requires you to refund the joining bonus if you resign early, but does not specify any additional financial penalty or training cost recovery.",
          "questions": [],
          "unverified": false
        },
        {
          "id": "notice_period_employee",
          "title": "Employee Notice",
          "status": "clear",
          "priority": "high",
          "value": "60 days",
          "evidence": {
            "quote": "On confirmation, you shall give 60 days written notice to resign.",
            "page": 2
          },
          "explanation": "Once confirmed after probation, you must give 60 days written notice if you decide to resign.",
          "questions": [],
          "unverified": false
        },
        {
          "id": "notice_period_employer",
          "title": "Employer Notice",
          "status": "clear",
          "priority": "medium",
          "value": "30 days",
          "evidence": {
            "quote": "The company may terminate your employment by giving 30 days notice or salary in lieu thereof.",
            "page": 2
          },
          "explanation": "The company can end your employment by giving 30 days notice or paying you 30 days salary instead. Note that this is shorter than the 60 days notice you are required to give.",
          "questions": [
            "Why is the company's notice period set to 30 days while the employee notice period is 60 days?"
          ],
          "unverified": false
        },
        {
          "id": "probation_period",
          "title": "Probation Duration",
          "status": "clear",
          "priority": "medium",
          "value": "6 months",
          "evidence": {
            "quote": "You will be on probation for six months from your date of joining.",
            "page": 2
          },
          "explanation": "Your probation lasts for six months, during which the company can evaluate your work and may extend probation if they choose.",
          "questions": [
            "What are the specific performance criteria required for confirmation after six months?"
          ],
          "unverified": false
        },
        {
          "id": "probation_notice",
          "title": "Probation Notice",
          "status": "clear",
          "priority": "medium",
          "value": "30 days",
          "evidence": {
            "quote": "During probation either party may terminate this employment by giving 30 days written notice.",
            "page": 2
          },
          "explanation": "While on probation, either you or the company can terminate employment with 30 days written notice.",
          "questions": [],
          "unverified": false
        },
        {
          "id": "notice_buyout",
          "title": "Buyout Available",
          "status": "clear",
          "priority": "high",
          "value": "Sole discretion of management",
          "evidence": {
            "quote": "Buyout of the notice period is permitted only at the sole discretion of management.",
            "page": 2
          },
          "explanation": "You cannot automatically pay salary to leave earlier than your required notice period unless management explicitly agrees to it.",
          "questions": [
            "What factors does management consider when deciding whether to allow a notice period buyout?"
          ],
          "unverified": false
        },
        {
          "id": "termination_clause",
          "title": "Termination",
          "status": "clear",
          "priority": "high",
          "value": "Immediate termination without notice for misconduct, policy breach, or unsatisfactory performance",
          "evidence": {
            "quote": "The company may terminate your employment without notice for misconduct, breach of policy, or unsatisfactory performance.",
            "page": 2
          },
          "explanation": "The company can dismiss you immediately without notice or severance for performance issues, policy violations, or misconduct.",
          "questions": [
            "Is there a formal warning process or performance improvement plan provided before immediate termination for unsatisfactory performance?"
          ],
          "unverified": false
        }
      ]
    },
    {
      "id": "working_conditions",
      "title": "Working Conditions",
      "checks": [
        {
          "id": "working_hours",
          "title": "Daily/Weekly Hours",
          "status": "clear",
          "priority": "medium",
          "value": "9 hours per day",
          "evidence": {
            "quote": "Normal working hours are 9 hours per day, Monday to Friday.",
            "page": 2
          },
          "explanation": "Standard daily working hours are set at 9 hours per day.",
          "questions": [],
          "unverified": false
        },
        {
          "id": "working_days",
          "title": "Working Days",
          "status": "clear",
          "priority": "low",
          "value": "Monday to Friday",
          "evidence": {
            "quote": "Normal working hours are 9 hours per day, Monday to Friday.",
            "page": 2
          },
          "explanation": "Your standard work week is five days, from Monday through Friday.",
          "questions": [],
          "unverified": false
        },
        {
          "id": "shift",
          "title": "Rotational Shift",
          "status": "clear",
          "priority": "medium",
          "value": "Rotational shifts as required",
          "evidence": {
            "quote": "You may be required to work in rotational shifts, including night shifts, depending on project requirements.",
            "page": 2
          },
          "explanation": "Your daily schedule is not fixed and may change to rotational shifts based on client or project demands.",
          "questions": [
            "How much advance notice is provided before changing my shift schedule?"
          ],
          "unverified": false
        },
        {
          "id": "night_shift",
          "title": "Night Shift",
          "status": "clear",
          "priority": "medium",
          "value": "May be required; no allowance specified",
          "evidence": {
            "quote": "You may be required to work in rotational shifts, including night shifts, depending on project requirements.",
            "page": 2
          },
          "explanation": "You can be required to work night shifts, though no extra night shift allowance is mentioned in this letter.",
          "questions": [
            "Is extra allowance or company transport provided when working night shifts?"
          ],
          "unverified": false
        },
        {
          "id": "overtime",
          "title": "Overtime",
          "status": "clear",
          "priority": "medium",
          "value": "No extra pay; compensatory time off at manager discretion",
          "evidence": {
            "quote": "No separate overtime is payable; time off in lieu may be granted at your manager's discretion.",
            "page": 2
          },
          "explanation": "Working extra hours will not earn you extra pay, but your manager can optionally give you compensatory time off.",
          "questions": [],
          "unverified": false
        },
        {
          "id": "weekend_work",
          "title": "Weekend Work",
          "status": "not_specified",
          "priority": "medium",
          "value": null,
          "evidence": null,
          "explanation": "The letter does not specify whether weekend or holiday work is required.",
          "questions": [],
          "unverified": false
        },
        {
          "id": "work_location",
          "title": "Primary Location",
          "status": "clear",
          "priority": "medium",
          "value": "Bengaluru",
          "evidence": {
            "quote": "Your place of posting is Bengaluru.",
            "page": 2
          },
          "explanation": "Your primary base location for this role is Bengaluru.",
          "questions": [
            "Does the role involve on-site office work, or is there a hybrid working arrangement?"
          ],
          "unverified": false
        },
        {
          "id": "transfer_clause",
          "title": "Transfer Rights",
          "status": "clear",
          "priority": "high",
          "value": "Transferable to any location, office, group company, or client site in India or overseas",
          "evidence": {
            "quote": "The company reserves the right to transfer you to any other location, office, group company or client site in India or overseas.",
            "page": 2
          },
          "explanation": "The company can relocate you to different offices, clients, or group companies anywhere in India or internationally.",
          "questions": [
            "Are relocation allowances or housing assistance provided if the company transfers me to another city or country?"
          ],
          "unverified": false
        }
      ]
    },
    {
      "id": "leaves",
      "title": "Leaves & Benefits",
      "checks": [
        {
          "id": "annual_leave",
          "title": "Annual Leave",
          "status": "clear",
          "priority": "medium",
          "value": "18 days per calendar year",
          "evidence": {
            "quote": "You are entitled to 18 days of earned leave and 6 days of casual leave per calendar year.",
            "page": 3
          },
          "explanation": "You get 18 paid earned leave days every calendar year.",
          "questions": [],
          "unverified": false
        },
        {
          "id": "sick_leave",
          "title": "Sick Leave",
          "status": "not_specified",
          "priority": "low",
          "value": null,
          "evidence": null,
          "explanation": "The letter does not mention a separate allocation for sick leave.",
          "questions": [],
          "unverified": false
        },
        {
          "id": "casual_leave",
          "title": "Casual Leave",
          "status": "clear",
          "priority": "low",
          "value": "6 days per calendar year",
          "evidence": {
            "quote": "You are entitled to 18 days of earned leave and 6 days of casual leave per calendar year.",
            "page": 3
          },
          "explanation": "You receive 6 days of casual leave per calendar year.",
          "questions": [],
          "unverified": false
        },
        {
          "id": "paid_leave",
          "title": "Paid Leave",
          "status": "not_specified",
          "priority": "medium",
          "value": null,
          "evidence": null,
          "explanation": "The letter provides separate figures for earned and casual leave rather than a single combined total paid leave count.",
          "questions": [],
          "unverified": false
        },
        {
          "id": "leave_carry",
          "title": "Carry Forward",
          "status": "clear",
          "priority": "low",
          "value": "Up to 30 days of earned leave",
          "evidence": {
            "quote": "Up to 30 days of unused earned leave may be carried forward.",
            "page": 3
          },
          "explanation": "You can carry forward up to 30 unused earned leave days into subsequent years.",
          "questions": [],
          "unverified": false
        },
        {
          "id": "leave_encash",
          "title": "Leave Encashment",
          "status": "attention",
          "priority": "low",
          "value": "Governed by separate HR policy",
          "evidence": {
            "quote": "Encashment of leave is governed by the HR policy in force.",
            "page": 3
          },
          "explanation": "The terms for converting unused leaves to cash depend on an external HR policy document not detailed in this offer letter.",
          "questions": [
            "Could you share the HR policy on leave encashment and how unused leaves are paid out upon resignation?"
          ],
          "unverified": false
        }
      ]
    },
    {
      "id": "restrictions",
      "title": "Restrictions",
      "checks": [
        {
          "id": "moonlighting",
          "title": "Outside Employment",
          "status": "clear",
          "priority": "high",
          "value": "Prohibited without prior written consent",
          "evidence": {
            "quote": "You shall not take up any other employment, consultancy, freelance assignment or business, whether paid or unpaid, during the term of your employment without the prior written consent of the company.",
            "page": 3
          },
          "explanation": "You cannot work any second job, freelance gig, or side business without written permission from the company.",
          "questions": [],
          "unverified": false
        },
        {
          "id": "ip_ownership",
          "title": "Intellectual Property",
          "status": "clear",
          "priority": "high",
          "value": "All work product, inventions, designs, and code belong to company",
          "evidence": {
            "quote": "All work product, inventions, designs and code created by you during the course of your employment, whether during working hours or otherwise, shall vest solely and exclusively with the company.",
            "page": 3
          },
          "explanation": "Any software or work product you create during your employment, even outside work hours, belongs entirely to the company.",
          "questions": [],
          "unverified": false
        },
        {
          "id": "open_source",
          "title": "Open Source",
          "status": "not_specified",
          "priority": "medium",
          "value": null,
          "evidence": null,
          "explanation": "The document does not state any rules regarding contributing to or using open-source projects.",
          "questions": [],
          "unverified": false
        },
        {
          "id": "non_compete",
          "title": "Non Compete",
          "status": "clear",
          "priority": "high",
          "value": "12-month non-solicitation of clients and employees",
          "evidence": {
            "quote": "For a period of 12 months after leaving, you shall not solicit any client or employee of the company.",
            "page": 3
          },
          "explanation": "For one year after leaving the company, you are restricted from soliciting its clients or poaching its employees.",
          "questions": [],
          "unverified": false
        },
        {
          "id": "confidentiality",
          "title": "Confidentiality",
          "status": "clear",
          "priority": "medium",
          "value": "Applies indefinitely during and after employment",
          "evidence": {
            "quote": "You shall not disclose any confidential information of the company during your employment or at any time thereafter.",
            "page": 3
          },
          "explanation": "You must keep company business information secret indefinitely, even after you leave the company.",
          "questions": [],
          "unverified": false
        }
      ]
    },
    {
      "id": "other",
      "title": "Other Conditions",
      "checks": [
        {
          "id": "background_verification",
          "title": "Background Verification",
          "status": "clear",
          "priority": "medium",
          "value": "Offer contingent on background check; subject to withdrawal or termination",
          "evidence": {
            "quote": "This offer is contingent on satisfactory background and reference verification. The company reserves the right to withdraw this offer or terminate employment if any information furnished is found incorrect.",
            "page": 3
          },
          "explanation": "Your offer can be cancelled or employment terminated if background checks reveal inaccuracies in your provided details.",
          "questions": [],
          "unverified": false
        },
        {
          "id": "company_policy",
          "title": "Company Policy References",
          "status": "clear",
          "priority": "medium",
          "value": "Governed by company HR policies as amended",
          "evidence": {
            "quote": "Your employment is governed by the company's HR policies as amended from time to time.",
            "page": 3
          },
          "explanation": "Your working rules are governed by company HR policies, which the company can change over time.",
          "questions": [
            "Can I get access to a copy of the full HR policy handbook before my joining date?"
          ],
          "unverified": false
        }
      ]
    }
  ],
  "hrQuestions": [
    "Why is the employee required notice period 60 days after confirmation while the employer notice period is only 30 days?",
    "Does the company provide a formal warning or performance improvement plan before exercising immediate termination for unsatisfactory performance?",
    "Could you share the complete HR policy handbook, including rules on leave encashment, night shift allowances, and sick leaves?",
    "What criteria and performance metrics are used to calculate the annual variable pay?",
    "Are company-directed transfers to other locations accompanied by a relocation allowance or expense support?",
    "Under what specific circumstances does management consider approving a notice period buyout?"
  ],
  "disclaimer": "This is general information to help you read your offer letter. It is not legal advice."
}
