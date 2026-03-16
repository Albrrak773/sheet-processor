from __future__ import annotations

import uuid
from datetime import UTC, datetime
from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi_clerk_auth import HTTPAuthorizationCredentials
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_clerk_auth_guard
from app.db.database import get_session
from app.db.schema import SessionCreate, SessionDetail, SessionRead, SessionUpdate, ValidationSession

router = APIRouter(prefix="/sessions", tags=["sessions"])
clerk_auth = get_clerk_auth_guard()


def get_user_id(request: Request) -> str:
    auth: HTTPAuthorizationCredentials = request.state.clerk_auth
    user_id = auth.decoded.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token")
    return user_id


@router.get("", response_model=list[SessionRead])
async def list_sessions(
    request: Request,
    db: Annotated[AsyncSession, Depends(get_session)],
    _: Annotated[HTTPAuthorizationCredentials, Depends(clerk_auth)],
) -> list[SessionRead]:
    user_id = get_user_id(request)
    stmt = (
        select(ValidationSession)
        .where(ValidationSession.user_id == user_id)
        .order_by(desc(ValidationSession.updated_at))
    )
    result = await db.execute(stmt)
    sessions = result.scalars().all()
    return [
        SessionRead(
            id=s.id,
            title=s.title,
            created_at=s.created_at,
            updated_at=s.updated_at,
        )
        for s in sessions
    ]


@router.get("/{session_id}", response_model=SessionDetail)
async def get_session_detail(
    session_id: str,
    request: Request,
    db: Annotated[AsyncSession, Depends(get_session)],
    _: Annotated[HTTPAuthorizationCredentials, Depends(clerk_auth)],
) -> SessionDetail:
    user_id = get_user_id(request)
    stmt = select(ValidationSession).where(
        ValidationSession.id == session_id,
        ValidationSession.user_id == user_id,
    )
    result = await db.execute(stmt)
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    data: list[dict[str, Any]] = []
    if isinstance(session.data, dict) and "rows" in session.data:
        data = session.data["rows"]
    return SessionDetail(
        id=session.id,
        title=session.title,
        original_csv=session.original_csv,
        data=data,
        created_at=session.created_at,
        updated_at=session.updated_at,
    )


@router.post("", response_model=SessionDetail)
async def create_session(
    request: Request,
    data: SessionCreate,
    db: Annotated[AsyncSession, Depends(get_session)],
    _: Annotated[HTTPAuthorizationCredentials, Depends(clerk_auth)],
) -> SessionDetail:
    user_id = get_user_id(request)
    now = datetime.now(UTC)

    title = data.title or f"Session {now.strftime('%Y-%m-%d %H:%M')}"

    session = ValidationSession(
        id=str(uuid.uuid4()),
        user_id=user_id,
        title=title,
        original_csv=data.original_csv,
        data={"rows": data.data},
        created_at=now,
        updated_at=now,
    )

    db.add(session)
    await db.commit()
    await db.refresh(session)

    return SessionDetail(
        id=session.id,
        title=session.title,
        original_csv=session.original_csv,
        data=data.data,
        created_at=session.created_at,
        updated_at=session.updated_at,
    )


@router.patch("/{session_id}", response_model=SessionDetail)
async def update_session(
    session_id: str,
    request: Request,
    data: SessionUpdate,
    db: Annotated[AsyncSession, Depends(get_session)],
    _: Annotated[HTTPAuthorizationCredentials, Depends(clerk_auth)],
) -> SessionDetail:
    user_id = get_user_id(request)
    stmt = select(ValidationSession).where(
        ValidationSession.id == session_id,
        ValidationSession.user_id == user_id,
    )
    result = await db.execute(stmt)
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    if data.title is not None:
        session.title = data.title
    if data.data is not None:
        session.data = {"rows": data.data}
    session.updated_at = datetime.now(UTC)

    await db.commit()
    await db.refresh(session)

    rows: list[dict[str, Any]] = []
    if isinstance(session.data, dict) and "rows" in session.data:
        rows = session.data["rows"]

    return SessionDetail(
        id=session.id,
        title=session.title,
        original_csv=session.original_csv,
        data=rows,
        created_at=session.created_at,
        updated_at=session.updated_at,
    )


@router.delete("/{session_id}")
async def delete_session(
    session_id: str,
    request: Request,
    db: Annotated[AsyncSession, Depends(get_session)],
    _: Annotated[HTTPAuthorizationCredentials, Depends(clerk_auth)],
) -> dict[str, str]:
    user_id = get_user_id(request)
    stmt = select(ValidationSession).where(
        ValidationSession.id == session_id,
        ValidationSession.user_id == user_id,
    )
    result = await db.execute(stmt)
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    await db.delete(session)
    await db.commit()

    return {"status": "deleted"}
