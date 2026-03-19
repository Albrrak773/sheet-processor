"""
Duplicate detection for validation.

Finds duplicate values in phone number, email, and university id columns.
"""
from __future__ import annotations

from collections import defaultdict

from app.canonical import get_row_value
from app.models import DuplicateInfo, DuplicateType, RowData


def find_duplicates(rows: list[RowData]) -> list[DuplicateInfo]:
    """
    Find all duplicate values in phone number, email, and university id columns.

    Args:
        rows: List of row data dictionaries

    Returns:
        List of DuplicateInfo objects, one for each set of duplicates found
    """
    if not rows:
        return []

    duplicates: list[DuplicateInfo] = []

    # Check each column type for duplicates
    columns_to_check: list[DuplicateType] = ["university id", "email", "phone number"]

    for col_type in columns_to_check:
        col_duplicates = _find_column_duplicates(rows, col_type)
        duplicates.extend(col_duplicates)

    return duplicates


def _find_column_duplicates(
    rows: list[RowData], column: DuplicateType
) -> list[DuplicateInfo]:
    """
    Find duplicates in a specific column.

    Args:
        rows: List of row data dictionaries
        column: The canonical column name to check

    Returns:
        List of DuplicateInfo for each duplicate value found
    """
    # Group row numbers by value
    value_to_rows: dict[str, list[int]] = defaultdict(list)

    for row_idx, row in enumerate(rows):
        value = get_row_value(row, column)

        # Skip empty values
        if _is_empty(value):
            continue

        # Normalize value for comparison
        normalized = _normalize_value(value, column)
        if normalized:
            # Row numbers are 1-indexed, starting from row 2 (row 1 is header)
            row_num = row_idx + 2
            value_to_rows[normalized].append(row_num)

    # Create DuplicateInfo for each value that appears more than once
    duplicates: list[DuplicateInfo] = []
    for value, row_nums in value_to_rows.items():
        if len(row_nums) > 1:
            duplicates.append(
                DuplicateInfo(
                    duplicate_type=column,
                    duplicate_rows=row_nums,
                    value=value,
                )
            )

    return duplicates


def _normalize_value(value, column: DuplicateType) -> str | None:
    """
    Normalize a value for duplicate comparison.

    - Strings are trimmed and lowercased
    - University IDs are converted to string of digits
    - Empty strings return None
    """
    if value is None:
        return None

    if column == "university id":
        # Handle numeric university IDs (may come as float from Excel)
        try:
            value_str = str(int(float(value)))
        except (ValueError, TypeError):
            value_str = str(value).strip()
        return value_str if value_str else None

    # For phone number and email, normalize to lowercase trimmed string
    value_str = str(value).strip().lower()
    return value_str if value_str else None


def _is_empty(value) -> bool:
    """Check if a value is empty (None or whitespace-only string)."""
    if value is None:
        return True
    if isinstance(value, str) and value.strip() == "":
        return True
    return False
