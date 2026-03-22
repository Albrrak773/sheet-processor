"""
Transform data to canonical form.

Converts header aliases and gender aliases to their canonical values.
Removes unmapped columns and sets unmapped gender values to null.
"""
from __future__ import annotations

from app.canonical import get_alias_to_header_map, get_canonical_headers
from app.gender_cache import get_gender_alias_map
from app.models import RowData


CANONICAL_GENDERS = {"male", "female"}


def transform_to_canonical(rows: list[RowData]) -> tuple[list[RowData], list[str]]:
    """
    Transform rows to canonical form.

    - Replaces header aliases with canonical names (e.g., "Full Name" -> "name")
    - Replaces gender aliases with canonical values (e.g., "m" -> "Male")
    - Removes columns that are not in the canonical/alias system
    - Sets unmapped gender values to null

    Returns:
        tuple of (canonical_rows, canonical_column_names)
    """
    if not rows:
        return [], []

    header_alias_map = get_alias_to_header_map()
    canonical_headers = get_canonical_headers()
    gender_alias_map = get_gender_alias_map()

    first_row = rows[0]
    column_mapping: dict[str, str] = {}
    canonical_columns: list[str] = []

    for col in first_row.keys():
        col_lower = col.lower()
        if col_lower in canonical_headers:
            column_mapping[col] = col_lower
            canonical_columns.append(col_lower)
        elif col_lower in header_alias_map:
            canonical_name = header_alias_map[col_lower]
            column_mapping[col] = canonical_name
            if canonical_name not in canonical_columns:
                canonical_columns.append(canonical_name)

    gender_aliases_lower = {k.lower(): v for k, v in gender_alias_map.items()}

    canonical_rows: list[RowData] = []
    for row in rows:
        canonical_row: RowData = {}
        for original_col, canonical_col in column_mapping.items():
            value = row.get(original_col)

            if canonical_col == "gender" and value is not None:
                value_str = str(value).strip().lower()
                if value_str in CANONICAL_GENDERS:
                    value = value_str.capitalize()
                elif value_str in gender_aliases_lower:
                    value = gender_aliases_lower[value_str]
                else:
                    value = None

            canonical_row[canonical_col] = value
        canonical_rows.append(canonical_row)

    return canonical_rows, canonical_columns