from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.db.schema import HeaderAlias
from app.types import CANONICAL_COLUMNS, ColumnName, RowData


async def validate_headers(
    rows: list[RowData],
    ignore_headers: list[str],
    session: AsyncSession,
) -> tuple[bool, list[ColumnName]]:
    if not rows:
        return False, list(CANONICAL_COLUMNS)

    aliases_map = await _load_aliases(session)
    present_columns = _get_present_columns(rows[0], aliases_map)
    missing_columns = _get_missing_columns(present_columns, ignore_headers)

    return len(missing_columns) == 0, missing_columns


async def _load_aliases(session: AsyncSession) -> dict[ColumnName, ColumnName]:
    stmt = select(HeaderAlias).options(joinedload(HeaderAlias.header))  # type: ignore[arg-type]
    result = await session.execute(stmt)
    aliases = result.scalars().all()

    aliases_map: dict[ColumnName, ColumnName] = {}
    for alias in aliases:
        if alias.header:
            aliases_map[alias.alias_name.lower()] = alias.header.name.lower()

    return aliases_map


def _get_present_columns(
    first_row: RowData,
    aliases_map: dict[ColumnName, ColumnName],
) -> set[ColumnName]:
    present: set[ColumnName] = set()

    for col in first_row.keys():
        col_lower = col.lower()

        if col_lower in CANONICAL_COLUMNS:
            present.add(col_lower)
        elif col_lower in aliases_map:
            canonical = aliases_map[col_lower]
            present.add(canonical)

    return present


def _get_missing_columns(
    present_columns: set[ColumnName],
    ignore_headers: list[str],
) -> list[ColumnName]:
    ignore_set = {h.lower() for h in ignore_headers}

    missing: list[ColumnName] = []
    for col in CANONICAL_COLUMNS:
        if col not in present_columns and col not in ignore_set:
            missing.append(col)

    return missing
