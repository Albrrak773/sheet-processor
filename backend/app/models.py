from __future__ import annotations

from typing import Any, TypeAlias

from pydantic import BaseModel

RowData: TypeAlias = dict[str, Any]
ColumnName: TypeAlias = str

DEFAULT_ALIASES: dict[ColumnName, list[str]] = {
    "name": ["full name", "full_name", "student name"],
    "email": ["e-mail", "email address", "email_address"],
    "university_id": ["university id", "universityid", "student id", "student_id", "id"],
    "gender": ["sex"],
    "phone": ["phone number", "phone_number", "mobile", "mobile number"],
}


class InvalidRow(BaseModel):
    row: int
    column: str
    value: Any
    reason: str


class SuggestedFix(BaseModel):
    row: int
    column: str
    current: Any
    suggested: Any


class UploadResponse(BaseModel):
    url: str


class ValidationResponse(BaseModel):
    valid: bool
    total_rows: int
    columns_found: list[str]
    missing_columns: list[str]
    invalid_rows: list[InvalidRow]
    suggested_fixes: list[SuggestedFix]
    details: list[str] = []
    data: list[RowData] = []
