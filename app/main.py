from __future__ import annotations

from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.db.database import create_db_and_tables
from app.routers import aliases, validation


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    await create_db_and_tables()
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
