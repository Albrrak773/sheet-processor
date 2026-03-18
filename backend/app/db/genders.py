from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.schema import GenderAlias, Name


async def lookup_name(session: AsyncSession, name: str) -> Name | None:
    stmt = select(Name).where(Name.name == name)
    result = await session.execute(stmt)
    return result.scalar_one_or_none()


async def get_existing_names(session: AsyncSession, names: list[str]) -> set[str]:
    if not names:
        return set()
    stmt = select(Name.name).where(Name.name.in_(names))
    result = await session.execute(stmt)
    return set(result.scalars().all())


async def insert_names(session: AsyncSession, names: list[str], gender: str) -> None:
    for name in names:
        session.add(Name(name=name, gender=gender))
    await session.commit()


async def list_gender_aliases(session: AsyncSession) -> list[GenderAlias]:
    result = await session.execute(select(GenderAlias))
    return list(result.scalars().all())


async def get_alias_by_name(session: AsyncSession, alias: str) -> GenderAlias | None:
    stmt = select(GenderAlias).where(GenderAlias.alias == alias)
    result = await session.execute(stmt)
    return result.scalar_one_or_none()


async def insert_alias(session: AsyncSession, alias: str, aliase_type: str) -> GenderAlias:
    new_alias = GenderAlias(alias=alias, aliase_type=aliase_type)
    session.add(new_alias)
    await session.commit()
    await session.refresh(new_alias)
    return new_alias
