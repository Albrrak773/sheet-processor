from __future__ import annotations

from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.schema import Member


async def list_members(session: AsyncSession) -> list[Member]:
    stmt = select(Member)
    result = await session.execute(stmt)
    return list(result.scalars().all())


async def lookup_member(
    session: AsyncSession,
    name: str | None,
    email: str | None,
    phone_number: str | None,
) -> Member | None:
    conditions = []
    if name is not None:
        conditions.append(Member.name == name)
    if email is not None:
        conditions.append(Member.email == email)
    if phone_number is not None:
        conditions.append(Member.phone_number == phone_number)

    if not conditions:
        return None

    stmt = select(Member).where(or_(*conditions)).limit(1)
    result = await session.execute(stmt)
    return result.scalar_one_or_none()


async def lookup_members(
    session: AsyncSession,
    name: str | None,
    email: str | None,
    phone_number: str | None,
) -> list[Member]:
    conditions = []
    if name is not None:
        conditions.append(Member.name == name)
    if email is not None:
        conditions.append(Member.email == email)
    if phone_number is not None:
        conditions.append(Member.phone_number == phone_number)

    if not conditions:
        return []

    stmt = select(Member).where(or_(*conditions))
    result = await session.execute(stmt)
    return list(result.scalars().all())
