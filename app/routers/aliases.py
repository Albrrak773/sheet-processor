from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.canonical_cache import refresh_cache
from app.db.database import get_session
from app.db.schema import (
    Header,
    HeaderAlias,
    HeaderAliasCreate,
    HeaderAliasRead,
)
from app.types import DEFAULT_ALIASES

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


@router.get("/", response_model=list[HeaderAliasRead])
async def list_aliases(
    session: AsyncSession = Depends(get_session),
) -> list[HeaderAlias]:
    stmt = select(HeaderAlias).options(joinedload(HeaderAlias.header))  # type: ignore[arg-type]
    result = await session.execute(stmt)
    return list(result.scalars().all())


@router.post("/", response_model=HeaderAliasRead, status_code=201)
async def create_alias(
    alias_data: HeaderAliasCreate,
    session: AsyncSession = Depends(get_session),
) -> HeaderAlias:
    stmt = select(Header).where(Header.id == alias_data.header_id)  # type: ignore[arg-type]
    result = await session.execute(stmt)
    header = result.scalar_one_or_none()
    if not header:
        raise HTTPException(status_code=404, detail="Header not found")

    stmt = select(HeaderAlias).where(HeaderAlias.alias_name == alias_data.alias_name.lower())  # type: ignore[arg-type]
    result = await session.execute(stmt)
    existing = result.scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=400, detail="Alias already exists")

    alias = HeaderAlias(
        header_id=alias_data.header_id,
        alias_name=alias_data.alias_name.lower(),
    )
    session.add(alias)
    await session.commit()
    await session.refresh(alias)
    return alias


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


@router.post("/seed", status_code=201)
async def seed_default_aliases(
    session: AsyncSession = Depends(get_session),
) -> dict[str, str]:
    seeded: dict[str, str] = {}

    for canonical, aliases in DEFAULT_ALIASES.items():
        stmt = select(Header).where(Header.name == canonical)  # type: ignore[arg-type]
        result = await session.execute(stmt)
        header = result.scalar_one_or_none()

        if not header:
            header = Header(name=canonical)
            session.add(header)
            await session.flush()

        for alias in aliases:
            stmt = select(HeaderAlias).where(HeaderAlias.alias_name == alias)  # type: ignore[arg-type]
            result = await session.execute(stmt)
            if not result.scalar_one_or_none():
                new_alias = HeaderAlias(
                    header_id=header.id,  # type: ignore
                    alias_name=alias,
                )
                session.add(new_alias)
                seeded[alias] = canonical

    await session.commit()
    return {"seeded": f"{len(seeded)} aliases added"}
