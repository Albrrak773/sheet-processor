from __future__ import annotations

import logging
import re
from enum import StrEnum

from fastapi import APIRouter, Body, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import genders as db
from app.db.database import get_session
from app.db.schema import GenderAliasRead, NameBatchResponse, NameLookupResult
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
    overwrite: bool = False,
    session: AsyncSession = Depends(get_session),
) -> NameBatchResponse:
    try:
        gender = "Male" if gender_type == GenderType.male else "Female"

        names = list(dict.fromkeys(parse_names_text(names_text)))
        if not names:
            raise HTTPException(status_code=400, detail="No valid names provided")

        existing = await db.get_existing_names(session, names)
        
        created_names: list[str] = []
        skipped_names: list[str] = []
        
        for name in names:
            if name not in existing:
                created_names.append(name)
            else:
                existing_genders = existing[name]
                if overwrite:
                    await db.delete_names_by_name(session, name)
                    created_names.append(name)
                else:
                    if gender in existing_genders:
                        skipped_names.append(name)
                    else:
                        created_names.append(name)

        if created_names:
            await db.insert_names(session, created_names, gender)

        return NameBatchResponse(
            created=len(created_names),
            skipped=len(skipped_names),
            created_names=created_names,
            skipped_names=skipped_names,
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Failed to create names")
        raise HTTPException(status_code=500, detail="Internal server error") from e


@router.post("/lookup", response_model=list[NameLookupResult])
async def lookup_names(
    names_text: str = Body(media_type="text/plain"),
    session: AsyncSession = Depends(get_session),
) -> list[NameLookupResult]:
    try:
        results: list[NameLookupResult] = []
        seen_names: set[str] = set()
        
        for line in names_text.split("\n"):
            line = line.strip()
            if not line:
                continue
            
            first_name = line.split()[0] if line.split() else line
            normalized = normalize_name(first_name)
            
            if not normalized or normalized in seen_names:
                continue
            seen_names.add(normalized)
            
            matches = await db.lookup_names(session, normalized)
            
            if not matches:
                results.append(NameLookupResult(name=normalized, gender=None, is_ambiguous=False))
            else:
                genders = {m.gender for m in matches}
                is_ambiguous = len(genders) > 1
                first_match = matches[0]
                results.append(NameLookupResult(
                    name=normalized,
                    gender=first_match.gender,
                    is_ambiguous=is_ambiguous,
                ))
        
        return results
    except Exception as e:
        logger.exception("Failed to lookup names")
        raise HTTPException(status_code=500, detail="Internal server error") from e
