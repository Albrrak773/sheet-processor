from __future__ import annotations

from typing import Annotated, Literal

from fastapi import APIRouter, Body, HTTPException, Query
from pydantic import HttpUrl

from app.models import ValidationResponse
from app.services.data_extractor import (
    extract_from_file_url,
    extract_from_google_sheet,
    extract_from_published_sheet,
    extract_from_raw,
    is_file_url,
    is_published_sheet_url,
)
from app.services.header_validator import validate_headers
from app.services.row_validator import validate_all_rows

router = APIRouter(prefix="/validate", tags=["validation"])


@router.post("", response_model=ValidationResponse)
async def validate(
    data_source: Annotated[HttpUrl | Literal["raw"], Query(description="URL to a Google Sheet or a file or 'raw' for inline data")],
    ignore_header: Annotated[list[str] | None, Query(description="Headers to ignore")] = None,
    raw_data: Annotated[str | None, Body(media_type="text/plain", description="Raw CSV/TSV data when data_source='raw'")] = None,
) -> ValidationResponse:


    # 1. validate source and extract data
    if ignore_header is None:
        ignore_header = []

    if data_source == "raw":
        if raw_data is None:
            raise HTTPException(
                status_code=400,
                detail="Raw data required in body when data_source='raw'",
            )
        result = extract_from_raw(raw_data)
    elif is_published_sheet_url(data_source):
        result = await extract_from_published_sheet(data_source)
    elif "docs.google.com/spreadsheets" in str(data_source) or "/spreadsheets/d/" in str(data_source):
        result = await extract_from_google_sheet(data_source)
    elif await is_file_url(data_source):
        result = await extract_from_file_url(data_source)
    else:
        raise HTTPException(
            status_code=400,
            detail="Unsupported data source URL",
        )
    
    rows = result.rows
    raw_csv = result.raw_csv

    # 2. validate headers
    is_valid, missing_columns, present_columns, unmapped_columns = validate_headers(rows, ignore_header)


    # 3. validate rows
    invalid_rows, details = validate_all_rows(rows)

    if missing_columns or invalid_rows or details:
        is_valid = False

    return ValidationResponse(
        valid=is_valid,
        total_rows=len(rows),
        columns_found=present_columns,
        missing_columns=missing_columns,
        unmapped_columns=unmapped_columns,
        invalid_rows=invalid_rows,
        suggested_fixes=[],
        details=details,
        data=rows,
        raw_csv=raw_csv,
    )

