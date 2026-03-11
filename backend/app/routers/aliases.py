from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.canonical import refresh_cache
from app.db.database import get_session
from app.db.schema import (
    Header,
    HeaderAlias,
    HeaderAliasRead,
    HeaderRead,
)
from app.models import DEFAULT_ALIASES

router = APIRouter(prefix="/aliases", tags=["aliases"])


@router.post("/headers/seed", status_code=201)
async def seed_headers(
    session: AsyncSession = Depends(get_session),
) -> dict[str, str]:
    seeded: list[str] = []

    for canonical in DEFAULT_ALIASES.keys():
        stmt = select(Header).where(Header.name == canonical)  # type: ignore[arg-type]
        result = await session.execute(stmt)
        existing = result.scalar_one_or_none()

        if not existing:
            header = Header(name=canonical)
            session.add(header)
            seeded.append(canonical)

    await session.commit()
    await refresh_cache(session)

    return {"seeded": f"{len(seeded)} headers added"}


@router.get("/headers", response_model=list[HeaderRead])
async def list_headers(
    session: AsyncSession = Depends(get_session),
) -> list[HeaderRead]:
    stmt = select(Header)
    result = await session.execute(stmt)
    headers = list(result.scalars().all())
    return [HeaderRead(id=h.id, name=h.name) for h in headers]


@router.get("/", response_model=list[HeaderAliasRead])
async def list_aliases(
    session: AsyncSession = Depends(get_session),
) -> list[HeaderAliasRead]:
    stmt = select(HeaderAlias).options(joinedload(HeaderAlias.header))  # type: ignore[arg-type]
    result = await session.execute(stmt)
    aliases = list(result.scalars().all())
    return [
        HeaderAliasRead(
            id=alias.id,
            header_id=alias.header_id,
            header_name=alias.header.name,
            alias_name=alias.alias_name,
        )
        for alias in aliases
    ]


@router.post("/{header}/{new_alias}", response_model=HeaderAliasRead, status_code=201)
async def create_alias(
    header: str,
    new_alias: str,
    session: AsyncSession = Depends(get_session),
) -> HeaderAliasRead:
    header_lower = header.lower()
    stmt = select(Header).where(Header.name == header_lower)  # type: ignore[arg-type]
    result = await session.execute(stmt)
    canonical = result.scalar_one_or_none()

    if not canonical:
        stmt = (
            select(HeaderAlias)
            .options(joinedload(HeaderAlias.header))  # type: ignore[arg-type]
            .where(HeaderAlias.alias_name == header_lower)  # type: ignore[arg-type]
        )
        result = await session.execute(stmt)
        existing_alias = result.scalar_one_or_none()
        if existing_alias:
            canonical = existing_alias.header

    if not canonical:
        raise HTTPException(status_code=404, detail="Header not found")

    new_alias_lower = new_alias.lower()
    stmt = select(HeaderAlias).where(HeaderAlias.alias_name == new_alias_lower)  # type: ignore[arg-type]
    result = await session.execute(stmt)
    existing = result.scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=400, detail="Alias already exists")

    alias = HeaderAlias(
        header_id=canonical.id,
        alias_name=new_alias_lower,
    )
    session.add(alias)
    await session.commit()
    await session.refresh(alias)
    await refresh_cache(session)
    return HeaderAliasRead(
        id=alias.id,
        header_id=alias.header_id,
        header_name=canonical.name,
        alias_name=alias.alias_name,
    )


@router.delete("/{alias_id}", status_code=204)
async def delete_alias(
    alias_id: int,
    session: AsyncSession = Depends(get_session),
) -> None:
    stmt = select(HeaderAlias).where(HeaderAlias.id == alias_id)  # type: ignore[arg-type]
    result = await session.execute(stmt)
    alias = result.scalar_one_or_none()
    if not alias:
        raise HTTPException(status_code=404, detail="Alias not found")

    await session.execute(delete(HeaderAlias).where(HeaderAlias.id == alias_id))  # type: ignore[arg-type]
    await session.commit()
    await refresh_cache(session)
