from __future__ import annotations

from app.canonical_cache import get_aliases_map
from app.models import ColumnName, InvalidRow, RowData


def validate_column_not_empty(
    rows: list[RowData],
    column: ColumnName,
    optional_columns: set[ColumnName],
) -> list[int]:
    if column.lower() in optional_columns:
        return []

    empty_row_indexes: list[int] = []
    for idx, row in enumerate(rows):
        value = row.get(column)
        if _is_empty(value):
            empty_row_indexes.append(idx)

    return empty_row_indexes


def validate_all_rows(
    rows: list[RowData],
    canonical_columns: set[ColumnName],
    optional_columns: set[ColumnName],
) -> tuple[list[InvalidRow], list[str]]:
    if not rows:
        return [], []

    aliases_map = get_aliases_map()
    invalid_rows: list[InvalidRow] = []
    details: list[str] = []

    required_columns = [col for col in canonical_columns if col not in optional_columns]

    empty_columns = _find_empty_columns(rows, required_columns, aliases_map)
    for col in empty_columns:
        details.append(f"column '{col}' is empty")

    for row_idx, row in enumerate(rows):
        missing_fields: list[str] = []
        for col in required_columns:
            if col in empty_columns:
                continue
            if _is_column_empty(row, col, aliases_map.get(col, [])):
                missing_fields.append(col)

        if missing_fields:
            invalid_rows.append(
                InvalidRow(
                    row=row_idx + 1,
                    column=",".join(missing_fields),
                    value=None,
                    reason=f"row {row_idx + 1}: missing {', '.join(missing_fields)}",
                )
            )

    return invalid_rows, details


def _find_empty_columns(
    rows: list[RowData],
    required_columns: list[ColumnName],
    aliases_map: dict[ColumnName, list[str]],
) -> set[ColumnName]:
    empty_columns: set[ColumnName] = set()

    for col in required_columns:
        all_empty = True
        for row in rows:
            if not _is_column_empty(row, col, aliases_map.get(col, [])):
                all_empty = False
                break
        if all_empty:
            empty_columns.add(col)

    return empty_columns


def _is_column_empty(
    row: RowData,
    canonical_col: ColumnName,
    aliases: list[str],
) -> bool:
    row_keys = {k.lower() for k in row.keys()}

    if canonical_col in row_keys:
        return _is_empty(row.get(canonical_col))

    for alias in aliases:
        if alias.lower() in row_keys:
            return _is_empty(row.get(alias))

    return True


def _is_empty(value) -> bool:
    if value is None:
        return True
    if isinstance(value, str) and value.strip() == "":
        return True
    return False
