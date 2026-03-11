from __future__ import annotations

from fastapi import APIRouter, File, HTTPException, UploadFile

from app.models import UploadResponse
from app.services.r2_storage import upload_file

router = APIRouter(prefix="/upload", tags=["upload"])


@router.post("", response_model=UploadResponse)
async def upload(file: UploadFile = File(...)) -> UploadResponse:
    try:
        url = await upload_file(file)
        return UploadResponse(url=url)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
