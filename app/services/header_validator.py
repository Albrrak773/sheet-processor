from __future__ import annotations

from app.canonical_cache import get_alias_to_header_map, get_canonical_headers
from app.models import ColumnName, RowData


def validate_headers(
    rows: list[RowData],
    ignore_headers: list[str],
) -> tuple[bool, list[ColumnName]]:
    canonical_headers = get_canonical_headers()
    if not rows:
        return False, list(canonical_headers)

    aliases_map = get_alias_to_header_map()
    present_columns = _get_present_columns(rows[0], aliases_map)
    missing_columns = _get_missing_columns(present_columns, ignore_headers)

    return len(missing_columns) == 0, missing_columns


def _get_present_columns(
    first_row: RowData,
    aliases_map: dict[ColumnName, ColumnName],
) -> set[ColumnName]:
    canonical_headers = get_canonical_headers()
    present: set[ColumnName] = set()

    for col in first_row.keys():
        col_lower = col.lower()

        if col_lower in canonical_headers:
            present.add(col_lower)
        elif col_lower in aliases_map:
            canonical = aliases_map[col_lower]
            present.add(canonical)

    return present


def _get_missing_columns(
    present_columns: set[ColumnName],
    ignore_headers: list[str],
) -> list[ColumnName]:
    canonical_headers = get_canonical_headers()
    ignore_set = {h.lower() for h in ignore_headers}

    missing: list[ColumnName] = []
    for col in canonical_headers:
        if col not in present_columns and col not in ignore_set:
            missing.append(col)

    return missing
