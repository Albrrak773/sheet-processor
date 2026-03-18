from __future__ import annotations

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.schema import GenderAlias, Name


async def lookup_names(session: AsyncSession, name: str) -> list[Name]:
    stmt = select(Name).where(Name.name == name)
    result = await session.execute(stmt)
    return list(result.scalars().all())


async def get_existing_names(session: AsyncSession, names: list[str]) -> dict[str, list[str]]:
    if not names:
        return {}
    stmt = select(Name).where(Name.name.in_(names))
    result = await session.execute(stmt)
    name_to_genders: dict[str, list[str]] = {}
    for row in result.scalars().all():
        name = row.name
        if name not in name_to_genders:
            name_to_genders[name] = []
        name_to_genders[name].append(row.gender)
    return name_to_genders


async def delete_names_by_name(session: AsyncSession, name: str) -> None:
    stmt = delete(Name).where(Name.name == name)
    await session.execute(stmt)
    await session.commit()


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
