from __future__ import annotations

from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.canonical import refresh_cache
from app.db.database import get_session
from app.routers import aliases, validation


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    async for session in get_session():
        await refresh_cache(session)
        break
    yield


app = FastAPI(
    title="Sheet Processor",
    description="A service to validate and process spreadsheet data",
    version="0.1.0",
    lifespan=lifespan,
)

app.include_router(validation.router)
app.include_router(aliases.router)


@app.get("/health")
async def health_check() -> dict[str, str]:
    return {"status": "healthy"}
