from __future__ import annotations

import logging
import re
from enum import StrEnum

from fastapi import APIRouter, Body, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import genders as db
from app.db.database import get_session
from app.db.schema import GenderAliasRead, NameBatchResponse, NameRead
from app.gender_cache import refresh_gender_cache

router = APIRouter(prefix="/genders", tags=["genders"])
logger = logging.getLogger(__name__)


class GenderType(StrEnum):
    male = "male"
    female = "female"


def normalize_name(text: str) -> str:
    no_diacritics = re.sub(r"[\u0610-\u061A\u064B-\u065F\u0670]", "", text)
    return no_diacritics.lower().strip()


def parse_names_text(text: str) -> list[str]:
    names = []
    for line in text.split("\n"):
        for part in line.split(","):
            normalized = normalize_name(part)
            if normalized:
                names.append(normalized)
    return names


@router.get("", response_model=list[GenderAliasRead])
async def list_gender_aliases(
    session: AsyncSession = Depends(get_session),
) -> list[GenderAliasRead]:
    try:
        aliases = await db.list_gender_aliases(session)
        return [
            GenderAliasRead(id=a.id, aliase_type=a.aliase_type, alias=a.alias)  # type: ignore[arg-type]
            for a in aliases
        ]
    except Exception as e:
        logger.exception("Failed to list gender aliases")
        raise HTTPException(status_code=500, detail="Internal server error") from e


@router.post("/male/{new_alias}", response_model=GenderAliasRead, status_code=201)
async def create_male_alias(
    new_alias: str,
    session: AsyncSession = Depends(get_session),
) -> GenderAliasRead:
    try:
        alias_lower = normalize_name(new_alias)
        existing = await db.get_alias_by_name(session, alias_lower)
        if existing:
            raise HTTPException(status_code=400, detail="Alias already exists")

        new = await db.insert_alias(session, alias_lower, "Male")
        await refresh_gender_cache(session)
        return GenderAliasRead(id=new.id, aliase_type=new.aliase_type, alias=new.alias)  # type: ignore[arg-type]
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Failed to create male alias")
        raise HTTPException(status_code=500, detail="Internal server error") from e


@router.post("/female/{new_alias}", response_model=GenderAliasRead, status_code=201)
async def create_female_alias(
    new_alias: str,
    session: AsyncSession = Depends(get_session),
) -> GenderAliasRead:
    try:
        alias_lower = normalize_name(new_alias)
        existing = await db.get_alias_by_name(session, alias_lower)
        if existing:
            raise HTTPException(status_code=400, detail="Alias already exists")

        new = await db.insert_alias(session, alias_lower, "Female")
        await refresh_gender_cache(session)
        return GenderAliasRead(id=new.id, aliase_type=new.aliase_type, alias=new.alias)  # type: ignore[arg-type]
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Failed to create female alias")
        raise HTTPException(status_code=500, detail="Internal server error") from e


@router.post("/{gender_type}/", response_model=NameBatchResponse, status_code=201)
async def create_names(
    gender_type: GenderType,
    names_text: str = Body(media_type="text/plain"),
    session: AsyncSession = Depends(get_session),
) -> NameBatchResponse:
    try:
        gender = "Male" if gender_type == GenderType.male else "Female"

        names = list(dict.fromkeys(parse_names_text(names_text)))
        if not names:
            raise HTTPException(status_code=400, detail="No valid names provided")

        existing = await db.get_existing_names(session, names)
        to_create = [n for n in names if n not in existing]
        skipped = [n for n in names if n in existing]

        if to_create:
            await db.insert_names(session, to_create, gender)

        return NameBatchResponse(
            created=len(to_create),
            skipped=len(skipped),
            created_names=to_create,
            skipped_names=skipped,
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Failed to create names")
        raise HTTPException(status_code=500, detail="Internal server error") from e


@router.get("/lookup/{name}", response_model=NameRead)
async def lookup_name(
    name: str,
    session: AsyncSession = Depends(get_session),
) -> NameRead:
    try:
        normalized = normalize_name(name)
        result = await db.lookup_name(session, normalized)
        if not result:
            raise HTTPException(status_code=404, detail="Name not found")
        return NameRead(id=result.id, name=result.name, gender=result.gender)  # type: ignore[arg-type]
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Failed to lookup name")
        raise HTTPException(status_code=500, detail="Internal server error") from e
