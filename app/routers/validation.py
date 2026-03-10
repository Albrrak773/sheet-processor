from __future__ import annotations

from fastapi import APIRouter, Body, HTTPException, Query

from app.canonical_cache import (
    get_alias_to_header_map,
    get_canonical_headers,
    get_optional_headers,
)
from app.models import ValidationResponse
from app.services.data_extractor import (
    extract_from_file_url,
    extract_from_google_sheet,
    extract_from_raw,
    is_google_sheet_url,
)
from app.services.header_validator import validate_headers
from app.services.row_validator import validate_all_rows
from app.models import RowData

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

    is_valid, missing_columns = validate_headers(rows, ignore_header)

    present_columns = _get_present_columns(rows)

    canonical_headers = get_canonical_headers()
    optional_headers = get_optional_headers()
    invalid_rows, details = validate_all_rows(rows, canonical_headers, optional_headers)

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


def _get_present_columns(rows: list[RowData]) -> list[str]:
    if not rows:
        return []

    canonical_headers = get_canonical_headers()
    aliases_map = get_alias_to_header_map()
    present: list[str] = []
    for col in rows[0].keys():
        col_lower = col.lower()
        if col_lower in canonical_headers:
            present.append(col_lower)
        elif col_lower in aliases_map:
            canonical = aliases_map[col_lower]
            if canonical not in present:
                present.append(canonical)

    return present
