from __future__ import annotations

from collections import Counter

from app.canonical import resolve_column_key
from app.gender_cache import get_gender_alias_map
from app.models import RowData

CANONICAL_GENDERS = {"male", "female"}


def validate_genders_metadata(
    rows: list[RowData],
) -> tuple[list[str], list[str], list[dict[str, str | int]]]:
    """
    Analyze gender column values.

    Returns:
        - found_genders: List of valid gender values found (canonical + aliases)
        - missing_genders: Always ["male", "female"] - required values
        - unmapped_genders: List of {value: str, count: int} for unrecognized values
    """
    if not rows:
        return [], list(CANONICAL_GENDERS), []

    gender_key = resolve_column_key(rows[0], "gender")
    if not gender_key:
        return [], list(CANONICAL_GENDERS), []

    alias_map = get_gender_alias_map()
    alias_map_lower = {k.lower(): v for k, v in alias_map.items()}

    value_counts: Counter[str] = Counter()
    for row in rows:
        value = row.get(gender_key)
        if value is not None:
            value_str = str(value).strip()
            if value_str:
                value_counts[value_str.lower()] += 1

    found_genders: list[str] = []
    unmapped_genders: list[dict[str, str | int]] = []

    for value, count in value_counts.items():
        if value in CANONICAL_GENDERS:
            found_genders.append(value)
        elif value in alias_map_lower:
            found_genders.append(value)
        else:
            unmapped_genders.append({"value": value, "count": count})

    unmapped_genders.sort(key=lambda x: x["count"], reverse=True)

    return found_genders, list(CANONICAL_GENDERS), unmapped_genders
