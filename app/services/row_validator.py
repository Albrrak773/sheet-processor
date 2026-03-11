from __future__ import annotations

import re

from app.canonical import (
    get_canonical_headers,
    get_optional_headers,
    get_row_value,
    resolve_column_key,
)
from app.models import ColumnName, InvalidRow, RowData


def validate_all_rows(rows: list[RowData]) -> tuple[list[InvalidRow], list[str]]:

    invalid_rows: list[InvalidRow] = []
    details: list[str] = []

    canonical_headers = get_canonical_headers()
    optional_headers = get_optional_headers()
    required_columns = [col for col in canonical_headers if col not in optional_headers]

    empty_columns = _find_empty_columns(rows, required_columns)
    for col in empty_columns:
        input_name = _get_input_name(rows[0], col)
        details.append(f"column '{input_name}' is empty")

    for row_idx, row in enumerate(rows):
        missing_fields: list[str] = []
        for col in required_columns:
            if col in empty_columns:
                continue
            if _is_empty(get_row_value(row, col)):
                input_name = _get_input_name(rows[0], col)
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

    invalid_rows.extend(validate_uni_id(rows))

    return invalid_rows, details


def validate_uni_id(rows: list[RowData]) -> list[InvalidRow]:
    invalid_rows: list[InvalidRow] = []
    uni_id_col: ColumnName = "university id"

    if not rows:
        return invalid_rows

    input_name = _get_input_name(rows[0], uni_id_col)
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


def _find_empty_columns(
    rows: list[RowData],
    required_columns: list[ColumnName],
) -> set[ColumnName]:
    empty_columns: set[ColumnName] = set()

    for col in required_columns:
        all_empty = all(_is_empty(get_row_value(row, col)) for row in rows)
        if all_empty:
            empty_columns.add(col)

    return empty_columns


def _get_input_name(row: RowData, canonical_col: ColumnName) -> str:
    key = resolve_column_key(row, canonical_col)
    return key if key else canonical_col


def _is_empty(value) -> bool:
    if value is None:
        return True
    if isinstance(value, str) and value.strip() == "":
        return True
    return False
