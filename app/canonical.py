"""
Canonical column name management.

Provides centralized access to canonical header names, their aliases, and optional status.
Headers are cached for fast lookups and include helper functions to resolve column names
and retrieve values from row data using either canonical names or aliases.
"""
from __future__ import annotations

from json import dump
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.config import settings
from app.db.schema import Header, HeaderAlias
from app.models import ColumnName, RowData

_cache: dict = {"canonical": [], "aliases": {}, "optional": set()}


def save_canonical_cache(data: dict[str, Any]) -> None:
    with open(settings.canonical_cache_file, "w") as f:
        dump(data, f, indent=4, ensure_ascii=False)


def get_canonical_headers() -> set[str]:
    return {h.lower() for h in _cache["canonical"]}


def get_aliases_map() -> dict[str, list[str]]:
    return _cache["aliases"]


def get_alias_to_header_map() -> dict[str, str]:
    result: dict[str, str] = {}
    for header_name, aliases in _cache["aliases"].items():
        for alias in aliases:
            result[alias.lower()] = header_name.lower()
    return result


def get_optional_headers() -> set[str]:
    return _cache.get("optional", set())


def resolve_column_key(row: RowData, canonical_col: ColumnName) -> str | None:
    """
    Returns the actual key name in row for a canonical column.
    Checks canonical name first, then aliases.
    Returns None if column not found in row.
    """
    canonical_lower = canonical_col.lower()
    row_key_by_lower = {k.lower(): k for k in row.keys()}

    if canonical_lower in row_key_by_lower:
        return row_key_by_lower[canonical_lower]

    aliases_map = get_aliases_map()
    for alias in aliases_map.get(canonical_lower, []):
        if alias in row_key_by_lower:
            return row_key_by_lower[alias]

    return None


def get_row_value(row: RowData, canonical_col: ColumnName) -> Any:
    """
    Returns the value for a canonical column from a row.
    Looks up using canonical name or any of its aliases.
    Returns None if column not found in row.
    """
    key = resolve_column_key(row, canonical_col)
    return row.get(key) if key else None


async def refresh_cache(session: AsyncSession) -> dict:
    global _cache

    header_result = await session.execute(select(Header))
    headers = list(header_result.scalars().all())

    alias_result = await session.execute(
        select(HeaderAlias).options(joinedload(HeaderAlias.header))  # type: ignore[arg-type]
    )
    aliases = list(alias_result.scalars().all())

    aliases_map: dict[str, list[str]] = {}
    for alias in aliases:
        if alias.header:
            header_name = alias.header.name.lower()
            if header_name not in aliases_map:
                aliases_map[header_name] = []
            aliases_map[header_name].append(alias.alias_name.lower())

    optional_headers: set[str] = {
        h.name.lower() for h in headers if getattr(h, "is_optional", 0) == 1
    }

    _cache = {
        "canonical": [h.name for h in headers],
        "aliases": aliases_map,
        "optional": optional_headers,
    }

    save_canonical_cache(
        {
            "canonical": [h.name for h in headers],
            "aliases": aliases_map,
            "optional": list(optional_headers),
        }
    )

    return _cache
