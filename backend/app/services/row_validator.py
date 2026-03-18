from __future__ import annotations

import re

from app.canonical import (
    get_canonical_headers,
    get_optional_headers,
    get_row_value,
    resolve_column_key,
)
from app.gender_cache import get_gender_alias_map
from app.models import ColumnName, InvalidRow, RowData


def validate_all_rows(rows: list[RowData], ignore_headers: list[str]) -> tuple[list[InvalidRow], list[str]]:

    invalid_rows: list[InvalidRow] = []
    details: list[str] = []

    canonical_headers = get_canonical_headers()
    optional_headers = get_optional_headers()
    required_columns = [col for col in canonical_headers if col not in optional_headers and col not in ignore_headers]

    empty_column = get_empty_columns(rows, required_columns)

    details.extend([f"required column '{col}' is empty" for col in empty_column])

    invalid_rows.extend(validate_missing_values(rows, required_columns, empty_column))

    invalid_rows.extend(validate_uni_id(rows))

    invalid_rows.extend(validate_genders(rows))

    return invalid_rows, details


# ======== validation functions ========


def get_empty_columns(rows: list[RowData], required_columns: list[ColumnName]) -> set[ColumnName]:
    details: list[str] = []

    empty_columns: set[ColumnName] = set()

    for col in required_columns:
        all_empty = all(_is_empty(get_row_value(row, col)) for row in rows)
        if all_empty:
            empty_columns.add(col)

    for col in empty_columns:
        input_name = _get_input_header(rows[0], col)
        details.append(f"column '{input_name}' is empty")
    return empty_columns


def validate_missing_values(rows: list[RowData], required_columns: list[ColumnName], empty_columns: set[ColumnName]) -> list[InvalidRow]:

    invalid_rows: list[InvalidRow] = []
    for row_idx, row in enumerate(rows):
        missing_fields: list[str] = []
        for col in required_columns:
            if col in empty_columns:
                continue
            if _is_empty(get_row_value(row, col)):
                input_name = _get_input_header(rows[0], col)
                missing_fields.append(input_name)

        if missing_fields:
            invalid_rows.append(
                InvalidRow(
                    row=row_idx + 2,
                    column=",".join(missing_fields),
                    value=None,
                    reason=f"row {row_idx + 2}: missing {', '.join(missing_fields)}",
                )
            )
    return invalid_rows

def validate_uni_id(rows: list[RowData]) -> list[InvalidRow]:
    invalid_rows: list[InvalidRow] = []
    uni_id_col: ColumnName = "university id"

    if not rows:
        return invalid_rows

    input_name = _get_input_header(rows[0], uni_id_col)
    if input_name is None:
        return invalid_rows

    for row_idx, row in enumerate(rows):
        value = get_row_value(row, uni_id_col)
        if _is_empty(value):
            continue

        try:
            value_str = str(int(float(value)))
        except (ValueError, TypeError):
            value_str = str(value).strip()

        if not re.match(r"^\d{9}$", value_str):
            invalid_rows.append(
                InvalidRow(
                    row=row_idx + 2,
                    column=input_name,
                    value=value,
                    reason=f"row {row_idx + 2}: {uni_id_col} must be 9 digits",
                )
            )

    return invalid_rows

def validate_genders(rows: list[RowData]) -> list[InvalidRow]:
    invalid_rows: list[InvalidRow] = []
    gender_col: ColumnName = "gender"

    if not rows:
        return invalid_rows

    input_name = _get_input_header(rows[0], gender_col)
    if input_name is None:
        return invalid_rows

    gender_map = get_gender_alias_map()
    valid_values = {"male", "female"}

    for row_idx, row in enumerate(rows):
        value = get_row_value(row, gender_col)
        if _is_empty(value):
            continue

        value_str = str(value).strip().lower()

        if value_str not in valid_values and value_str not in gender_map:
            invalid_rows.append(
                InvalidRow(
                    row=row_idx + 2,
                    column=input_name,
                    value=value,
                    reason=f"row {row_idx + 2}: invalid gender value '{value}'",
                )
            )

    return invalid_rows


# ======== helper functions ========


def _get_input_header(row: RowData, canonical_col: ColumnName) -> str:
    key = resolve_column_key(row, canonical_col)
    return key if key else canonical_col


def _is_empty(value) -> bool:
    if value is None:
        return True
    if isinstance(value, str) and value.strip() == "":
        return True
    return False
