from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_session
from app.db import members as db
from app.db.schema import MemberLookupRequest, MemberRead

router = APIRouter(prefix="/uni-id", tags=["members"])
logger = logging.getLogger(__name__)


@router.get("", response_model=list[MemberRead])
async def list_members(
    session: AsyncSession = Depends(get_session),
) -> list[MemberRead]:
    try:
        members = await db.list_members(session)
        return [
            MemberRead(
                id=m.id,  # type: ignore[arg-type]
                name=m.name,
                email=m.email,
                phone_number=m.phone_number,
                uni_id=m.uni_id,
                gender=m.gender,
                uni_level=m.uni_level,
                uni_college=m.uni_college,
                created_at=m.created_at,
                updated_at=m.updated_at,
                is_authenticated=m.is_authenticated,
            )
            for m in members
        ]
    except Exception as e:
        logger.exception("Failed to list members")
        raise HTTPException(status_code=500, detail="Internal server error") from e


@router.post("/lookup", response_model=MemberRead)
async def lookup_uni_id(
    request: MemberLookupRequest,
    session: AsyncSession = Depends(get_session),
) -> MemberRead:
    if not any([request.name, request.email, request.phone_number]):
        raise HTTPException(
            status_code=400,
            detail="At least one of name, email, or phone_number must be provided",
        )

    try:
        member = await db.lookup_member(
            session,
            name=request.name,
            email=request.email,
            phone_number=request.phone_number,
        )
        if member is None:
            raise HTTPException(status_code=404, detail="Member not found")

        return MemberRead(
            id=member.id,  # type: ignore[arg-type]
            name=member.name,
            email=member.email,
            phone_number=member.phone_number,
            uni_id=member.uni_id,
            gender=member.gender,
            uni_level=member.uni_level,
            uni_college=member.uni_college,
            created_at=member.created_at,
            updated_at=member.updated_at,
            is_authenticated=member.is_authenticated,
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Failed to lookup member")
        raise HTTPException(status_code=500, detail="Internal server error") from e
