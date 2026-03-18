"""
Gender alias caching.

Provides in-memory cache for gender aliases for fast lookups in validators.
"""
from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.schema import GenderAlias

_cache: dict[str, str] = {}


def get_gender_alias_map() -> dict[str, str]:
    return _cache


async def refresh_gender_cache(session: AsyncSession) -> dict[str, str]:
    global _cache

    result = await session.execute(select(GenderAlias))
    aliases = list(result.scalars().all())

    _cache = {alias.alias.lower(): alias.aliase_type for alias in aliases}

    return _cache
