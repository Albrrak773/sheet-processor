from __future__ import annotations

from typing import Any

from pydantic import BaseModel


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


class ValidationRequest(BaseModel):
    sheet_url: str | None = None
    data: str | None = None
    format: str | None = None


class ValidationResponse(BaseModel):
    valid: bool
    total_rows: int
    columns_found: list[str]
    missing_columns: list[str]
    invalid_rows: list[InvalidRow]
    suggested_fixes: list[SuggestedFix]


class ColumnOptionalParams(BaseModel):
    name: bool = False
    email: bool = False
    university_id: bool = False
    gender: bool = False
    phone: bool = True

    @classmethod
    def from_query_params(
        cls,
        name: bool = False,
        email: bool = False,
        university_id: bool = False,
        gender: bool = False,
        phone: bool = True,
    ) -> ColumnOptionalParams:
        return cls(
            name=name,
            email=email,
            university_id=university_id,
            gender=gender,
            phone=phone,
        )
