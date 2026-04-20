from __future__ import annotations

import unicodedata
from typing import Annotated, Literal

from fastapi import APIRouter, Body, HTTPException, Query
from pydantic import HttpUrl, ValidationError

from app.models import ValidationResponse
from app.services.data_extractor import (
    extract_from_file_url,
    extract_from_google_sheet,
    extract_from_published_sheet,
    extract_from_raw,
    is_file_url,
    is_published_sheet_url,
)
from app.services.duplicates_validator import find_duplicates
from app.services.gender_validator import validate_genders_metadata
from app.services.header_validator import validate_headers
from app.services.row_validator import validate_all_rows

# Unicode bidirectional formatting categories that contain invisible/breaking characters
_BIDI_CONTROL_CATEGORIES = {"LRE", "RLE", "LRO", "RLO", "PDF", "LRI", "RLI", "FSI", "PDI", "BN"}


def _strip_bidi_controls(value: str) -> str:
    """Remove Unicode bidirectional control/invisible formatting characters from a string."""
    return "".join(c for c in value if unicodedata.category(c) not in _BIDI_CONTROL_CATEGORIES)


def _parse_data_source(value: str) -> HttpUrl | Literal["raw"]:
    """Parse and clean data_source, stripping invisible bidirectional characters before URL validation."""
    cleaned = _strip_bidi_controls(value).strip()
    if cleaned == "raw":
        return "raw"  # type: ignore[return-value]
    try:
        return HttpUrl(cleaned)
    except ValidationError as err:
        raise HTTPException(
            status_code=422,
            detail=f"Invalid URL: {cleaned}",
        ) from err


router = APIRouter(prefix="/validate", tags=["validation"])


@router.post("", response_model=ValidationResponse)
async def validate(
    data_source: Annotated[str, Query(description="URL to a Google Sheet or a file or 'raw' for inline data")],
    ignore_header: Annotated[list[str] | None, Query(description="Headers to ignore")] = None,
    raw_data: Annotated[str | None, Body(media_type="text/plain", description="Raw CSV/TSV data when data_source='raw'")] = None,
) -> ValidationResponse:

    # 1. validate source and extract data
    if ignore_header is None:
        ignore_header = []

    parsed_source = _parse_data_source(data_source)

    if parsed_source == "raw":
        if raw_data is None:
            raise HTTPException(
                status_code=400,
                detail="Raw data required in body when data_source='raw'",
            )
        result = extract_from_raw(raw_data)
    elif is_published_sheet_url(parsed_source):
        result = await extract_from_published_sheet(parsed_source)
    elif "docs.google.com/spreadsheets" in str(parsed_source) or "/spreadsheets/d/" in str(parsed_source):
        result = await extract_from_google_sheet(parsed_source)
    elif await is_file_url(parsed_source):
        result = await extract_from_file_url(parsed_source)
    else:
        raise HTTPException(
            status_code=400,
            detail="Unsupported data source URL",
        )

    rows = result.rows
    raw_csv = result.raw_csv

    if not rows:
        raise HTTPException(
            status_code=400,
            detail="The provided data is empty — no rows found to validate",
        )

    # 2. validate headers
    is_valid, missing_columns, present_columns, unmapped_columns = validate_headers(rows, ignore_header)

    # 3. validate rows
    invalid_rows, details = validate_all_rows(rows, ignore_header)

    # 4. validate gender metadata
    found_genders, missing_genders, unmapped_genders = validate_genders_metadata(rows)

    # 5. find duplicate rows
    duplicate_rows = find_duplicates(rows)

    if missing_columns or invalid_rows or details or unmapped_genders or duplicate_rows:
        is_valid = False

    return ValidationResponse(
        valid=is_valid,
        total_rows=len(rows),
        columns_found=present_columns,
        missing_columns=missing_columns,
        unmapped_columns=unmapped_columns,
        invalid_rows=invalid_rows,
        duplicate_rows=duplicate_rows,
        details=details,
        data=rows,
        raw_csv=raw_csv,
        found_genders=found_genders,
        missing_genders=missing_genders,
        unmapped_genders=unmapped_genders,
    )
