from __future__ import annotations

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_session
from app.models import ColumnOptionalParams, ValidationRequest, ValidationResponse
from app.services.data_extractor import (
    extract_from_file,
    extract_from_google_sheet,
    extract_from_raw,
)
from app.services.header_validator import validate_headers
from app.types import CANONICAL_COLUMNS, RowData

router = APIRouter(prefix="/validate", tags=["validation"])


@router.post("/", response_model=ValidationResponse)
async def validate_sheet(
    session: AsyncSession = Depends(get_session),
    sheet_url: str | None = Form(None),
    data: str | None = Form(None),
    format: str | None = Form(None),
    file: UploadFile | None = File(None),
    name: bool = Form(False),
    email: bool = Form(False),
    university_id: bool = Form(False),
    gender: bool = Form(False),
    phone: bool = Form(True),
) -> ValidationResponse:
    optional_params = ColumnOptionalParams.from_query_params(
        name=name,
        email=email,
        university_id=university_id,
        gender=gender,
        phone=phone,
    )

    rows = _extract_rows(sheet_url, data, format, file)

    is_valid, missing_columns = await validate_headers(rows, optional_params, session)

    present_columns = _get_present_columns(rows)

    return ValidationResponse(
        valid=is_valid,
        total_rows=len(rows),
        columns_found=present_columns,
        missing_columns=missing_columns,
        invalid_rows=[],
        suggested_fixes=[],
    )


@router.post("/json", response_model=ValidationResponse)
async def validate_sheet_json(
    request: ValidationRequest,
    session: AsyncSession = Depends(get_session),
    name: bool = False,
    email: bool = False,
    university_id: bool = Form(False),
    gender: bool = Form(False),
    phone: bool = Form(True),
) -> ValidationResponse:
    optional_params = ColumnOptionalParams.from_query_params(
        name=name,
        email=email,
        university_id=university_id,
        gender=gender,
        phone=phone,
    )

    rows = _extract_rows(request.sheet_url, request.data, request.format, None)

    is_valid, missing_columns = await validate_headers(rows, optional_params, session)

    present_columns = _get_present_columns(rows)

    return ValidationResponse(
        valid=is_valid,
        total_rows=len(rows),
        columns_found=present_columns,
        missing_columns=missing_columns,
        invalid_rows=[],
        suggested_fixes=[],
    )


def _extract_rows(
    sheet_url: str | None,
    data: str | None,
    format: str | None,
    file: UploadFile | None,
) -> list[RowData]:
    if sheet_url:
        return extract_from_google_sheet(sheet_url)

    if file:
        return extract_from_file(file)

    if data and format:
        return extract_from_raw(data, format)

    raise HTTPException(
        status_code=400,
        detail="Provide either sheet_url, file upload, or data with format",
    )


def _get_present_columns(rows: list[RowData]) -> list[str]:
    if not rows:
        return []

    present: list[str] = []
    for col in rows[0].keys():
        col_lower = col.lower()
        if col_lower in CANONICAL_COLUMNS:
            present.append(col_lower)

    return present
