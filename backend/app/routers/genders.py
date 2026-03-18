from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_session
from app.db.schema import GenderAlias, GenderAliasRead
from app.gender_cache import refresh_gender_cache

router = APIRouter(prefix="/genders", tags=["genders"])


@router.get("", response_model=list[GenderAliasRead])
async def list_gender_aliases(
    session: AsyncSession = Depends(get_session),
) -> list[GenderAliasRead]:
    result = await session.execute(select(GenderAlias))
    aliases = list(result.scalars().all())
    return [
        GenderAliasRead(id=a.id, aliase_type=a.aliase_type, alias=a.alias)  # type: ignore[arg-type]
        for a in aliases
    ]


@router.post("/male/{new_alias}", response_model=GenderAliasRead, status_code=201)
async def create_male_alias(
    new_alias: str,
    session: AsyncSession = Depends(get_session),
) -> GenderAliasRead:
    return await _create_alias(new_alias, "Male", session)


@router.post("/female/{new_alias}", response_model=GenderAliasRead, status_code=201)
async def create_female_alias(
    new_alias: str,
    session: AsyncSession = Depends(get_session),
) -> GenderAliasRead:
    return await _create_alias(new_alias, "Female", session)


async def _create_alias(
    alias: str, aliase_type: str, session: AsyncSession
) -> GenderAliasRead:
    alias_lower = alias.lower().strip()
    
    stmt = select(GenderAlias).where(GenderAlias.alias == alias_lower)  # type: ignore[arg-type]
    result = await session.execute(stmt)
    existing = result.scalar_one_or_none()
    
    if existing:
        raise HTTPException(status_code=400, detail="Alias already exists")

    new_alias = GenderAlias(alias=alias_lower, aliase_type=aliase_type)
    session.add(new_alias)
    await session.commit()
    await session.refresh(new_alias)
    await refresh_gender_cache(session)

    return GenderAliasRead(
        id=new_alias.id, aliase_type=new_alias.aliase_type, alias=new_alias.alias  # type: ignore[arg-type]
    )