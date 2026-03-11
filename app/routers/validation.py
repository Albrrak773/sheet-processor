from __future__ import annotations

from fastapi import APIRouter, Body, HTTPException, Query

from app.models import RowData, ValidationResponse
from app.services.data_extractor import (
    extract_from_file_url,
    extract_from_google_sheet,
    extract_from_raw,
    is_google_sheet_url,
)
from app.services.header_validator import validate_headers
from app.services.row_validator import validate_all_rows

router = APIRouter(prefix="/validate", tags=["validation"])


@router.post("", response_model=ValidationResponse)
async def validate(
    data_source: str = Query(
        ..., description="URL to Google Sheet, file URL, or 'raw'"
    ),
    ignore_header: list[str] = Query(
        default=[], description="Headers to consider optional"
    ),
    raw_data: str | None = Body(
        default=None, description="Raw CSV/TSV data when data_source='raw'"
    ),
) -> ValidationResponse:
    rows = await _extract_rows(data_source, raw_data)

    is_valid, missing_columns, present_columns = validate_headers(rows, ignore_header)

    invalid_rows, details = validate_all_rows(rows)

    if missing_columns or invalid_rows or details:
        is_valid = False

    return ValidationResponse(
        valid=is_valid,
        total_rows=len(rows),
        columns_found=present_columns,
        missing_columns=missing_columns,
        invalid_rows=invalid_rows,
        suggested_fixes=[],
        details=details,
    )


async def _extract_rows(data_source: str, raw_data: str | None) -> list[RowData]:
    if data_source == "raw":
        if raw_data is None:
            raise HTTPException(
                status_code=400,
                detail="Raw data required in body when data_source='raw'",
            )
        return extract_from_raw(raw_data)

    if is_google_sheet_url(data_source):
        return await extract_from_google_sheet(data_source)

    return await extract_from_file_url(data_source)
