"""
Transform endpoint for canonicalizing data.

Provides a stateless transformation that converts header aliases and
gender aliases to their canonical values.
"""
from __future__ import annotations

from typing import Any

from fastapi import APIRouter
from pydantic import BaseModel

from app.services.transformer import transform_to_canonical

router = APIRouter(prefix="/transforms", tags=["transforms"])


class TransformRequest(BaseModel):
    data: list[dict[str, Any]]


class TransformResponse(BaseModel):
    data: list[dict[str, Any]]
    columns: list[str]


@router.post("", response_model=TransformResponse)
async def transform_data(request: TransformRequest) -> TransformResponse:
    """
    Transform data to canonical form.

    - Replaces header aliases with canonical names
    - Replaces gender aliases with canonical values
    - Removes unmapped columns
    - Sets unmapped gender values to null
    """
    canonical_data, canonical_columns = transform_to_canonical(request.data)
    return TransformResponse(data=canonical_data, columns=canonical_columns)