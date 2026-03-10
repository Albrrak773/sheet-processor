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


class ValidationResponse(BaseModel):
    valid: bool
    total_rows: int
    columns_found: list[str]
    missing_columns: list[str]
    invalid_rows: list[InvalidRow]
    suggested_fixes: list[SuggestedFix]
