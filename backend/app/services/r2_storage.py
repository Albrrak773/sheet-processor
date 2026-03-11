from __future__ import annotations

from uuid import uuid4

import aioboto3
from fastapi import UploadFile

from app.config import settings

ALLOWED_EXTENSIONS = {".csv", ".tsv", ".xlsx", ".xls"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB


def _get_extension(filename: str) -> str:
    if "." not in filename:
        return ""
    return "." + filename.rsplit(".", 1)[-1].lower()


async def upload_file(file: UploadFile) -> str:
    if not file.filename:
        raise ValueError("Filename is required")

    ext = _get_extension(file.filename)
    if ext not in ALLOWED_EXTENSIONS:
        raise ValueError(f"File type not allowed. Allowed: {', '.join(ALLOWED_EXTENSIONS)}")

    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise ValueError(f"File too large. Max size: {MAX_FILE_SIZE // (1024 * 1024)}MB")

    key = f"{uuid4()}{ext}"

    session = aioboto3.Session()
    async with session.client(  # type: ignore[misc]
        "s3",
        endpoint_url=settings.r2_endpoint_url,
        aws_access_key_id=settings.r2_access_key_id,
        aws_secret_access_key=settings.r2_secret_access_key,
    ) as s3:
        await s3.put_object(
            Bucket=settings.r2_bucket_name,
            Key=key,
            Body=content,
            ContentType=file.content_type or "application/octet-stream",
        )

    return f"{settings.r2_public_url.rstrip('/')}/{key}"
