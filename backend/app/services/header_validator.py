from __future__ import annotations

from app.canonical import get_alias_to_header_map, get_canonical_headers
from app.models import ColumnName, RowData


def validate_headers(
    rows: list[RowData],
    ignore_headers: list[str],
) -> tuple[bool, list[ColumnName], list[str], list[str]]:
    assert len(rows) > 0, "No data rows to validate headers"

    present_canonical = _get_present_canonical(rows[0])
    present_columns = _format_present_columns(rows[0])
    missing_columns = _get_missing_columns(present_canonical, ignore_headers)
    unmapped_columns = _get_unmapped_columns(rows[0])

    return len(missing_columns) == 0, missing_columns, present_columns, unmapped_columns


def _get_present_canonical(first_row: RowData) -> set[ColumnName]:
    aliases_map = get_alias_to_header_map()
    canonical_headers = get_canonical_headers()
    present: set[ColumnName] = set()

    for col in first_row.keys():
        col_lower = col.lower()
        if col_lower in canonical_headers:
            present.add(col_lower)
        elif col_lower in aliases_map:
            present.add(aliases_map[col_lower])

    return present


def _format_present_columns(first_row: RowData) -> list[str]:
    aliases_map = get_alias_to_header_map()
    canonical_headers = get_canonical_headers()
    present: list[str] = []

    for col in first_row.keys():
        col_lower = col.lower()
        if col_lower in canonical_headers:
            present.append(col)
        elif col_lower in aliases_map:
            present.append(f"{col} ({aliases_map[col_lower]})")

    return present


def _get_missing_columns(
    present_columns: set[ColumnName],
    ignore_headers: list[str],
) -> list[ColumnName]:
    canonical_headers = get_canonical_headers()
    ignore_set = {h.lower() for h in ignore_headers}

    return [col for col in canonical_headers if col not in present_columns and col not in ignore_set]


def _get_unmapped_columns(first_row: RowData) -> list[str]:
    aliases_map = get_alias_to_header_map()
    canonical_headers = get_canonical_headers()
    unmapped: list[str] = []

    for col in first_row.keys():
        col_lower = col.lower()
        if col_lower not in canonical_headers and col_lower not in aliases_map:
            unmapped.append(col)

    return unmapped
