from __future__ import annotations

from typing import Any, Literal, TypeAlias

from pydantic import BaseModel

RowData: TypeAlias = dict[str, Any]
ColumnName: TypeAlias = str
InvalidType = Literal["empty_value", "invalid_value"]
DuplicateType = Literal["university id", "email", "phone number"]

DEFAULT_ALIASES: dict[ColumnName, list[str]] = {
    "name": ["full name", "full_name", "student name"],
    "email": ["e-mail", "email address", "email_address"],
    "university_id": ["university id", "universityid", "student id", "student_id", "id"],
    "gender": ["sex"],
    "phone": ["phone number", "phone_number", "mobile", "mobile number"],
}

OPTIONAL_COLUMNS: set[ColumnName] = {"phone"}


class InvalidRow(BaseModel):
    row: int
    column: str
    value: Any
    reason: str
    invalid_type: InvalidType


class SuggestedFix(BaseModel):
    row: int
    column: str
    current: Any
    suggested: Any


class DuplicateInfo(BaseModel):
    """Information about a set of duplicate rows."""

    duplicate_type: DuplicateType
    duplicate_rows: list[int]  # Row numbers (1-indexed, starting from 2 for data rows)
    value: str  # The duplicate value


class UploadResponse(BaseModel):
    url: str


class ValidationResponse(BaseModel):
    valid: bool
    total_rows: int
    columns_found: list[str]
    missing_columns: list[str]
    unmapped_columns: list[str] = []
    invalid_rows: list[InvalidRow]
    duplicate_rows: list[DuplicateInfo] = []
    details: list[str] = []
    data: list[RowData] = []
    raw_csv: str = ""
    found_genders: list[str] = []
    missing_genders: list[str] = []
    unmapped_genders: list[dict[str, str | int]] = []
