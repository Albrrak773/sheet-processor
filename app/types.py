from __future__ import annotations

from typing import Any, TypeAlias

RowData: TypeAlias = dict[str, Any]
ColumnName: TypeAlias = str


CANONICAL_COLUMNS: frozenset[ColumnName] = frozenset({
    "name",
    "email",
    "university_id",
    "gender",
    "phone",
})

REQUIRED_COLUMNS: frozenset[ColumnName] = frozenset({
    "name",
    "email",
    "university_id",
    "gender",
})

OPTIONAL_COLUMNS: frozenset[ColumnName] = frozenset({
    "phone",
})


DEFAULT_ALIASES: dict[ColumnName, list[str]] = {
    "name": ["full name", "full_name", "student name"],
    "email": ["e-mail", "email address", "email_address"],
    "university_id": ["university id", "universityid", "student id", "student_id", "id"],
    "gender": ["sex"],
    "phone": ["phone number", "phone_number", "mobile", "mobile number"],
}
