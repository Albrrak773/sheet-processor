from __future__ import annotations

from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.canonical import refresh_cache
from app.db.database import get_session
from app.gender_cache import refresh_gender_cache
from app.routers import aliases, genders, members, sessions, upload, validation


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    async for session in get_session():
        await refresh_cache(session)
        await refresh_gender_cache(session)
        break
    yield


app = FastAPI(
    title="Sheet Processor",
    description="A service to validate and process spreadsheet data",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(validation.router)
app.include_router(aliases.router)
app.include_router(genders.router)
app.include_router(members.router)
app.include_router(upload.router)
app.include_router(sessions.router)


@app.get("/health")
async def health_check() -> dict[str, str]:
    return {"status": "healthy"}
