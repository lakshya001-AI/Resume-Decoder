"""Offer-letter analysis: PDF in, 38 structured findings out.

The pipeline, in the order a request runs through it:

    pdf_parser        PDF bytes -> text, one entry per page
    extraction_prompt the instructions the model reads, built from checks.py
    extractor         the model call; returns an ExtractionResult
    validator         checks that answer against the document it came from
    report_builder    shapes the validated clauses into the API response
    storage           saves the report (never the PDF)

    checks            the 38 clauses — the catalogue everything else reads
    models            the Pydantic shapes, both the model's and the wire's

The HTTP layer is not here. It lives in routes/analysis_routes.py, beside
routes/auth_routes.py, so every router in the app is in one place.
"""
