from __future__ import annotations

from json import dump
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.config import settings
from app.db.schema import Header, HeaderAlias

_cache: dict = {"canonical": [], "aliases": {}}


def save_canonical_cache(data: dict[str, Any]) -> None:
    with open(settings.canonical_cache_file, "w") as f:
        dump(data, f, indent=4, ensure_ascii=False)


def get_canonical_headers() -> set[str]:
    return set(_cache["canonical"])


def get_aliases_map() -> dict[str, list[str]]:
    return _cache["aliases"]


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
            header_name = alias.header.name
            if header_name not in aliases_map:
                aliases_map[header_name] = []
            aliases_map[header_name].append(alias.alias_name)

    _cache = {
        "canonical": [h.name for h in headers],
        "aliases": aliases_map,
    }

    save_canonical_cache(_cache)

    return _cache
