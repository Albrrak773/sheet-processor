"""Authentication and authorization utilities."""

from __future__ import annotations

from typing import Annotated

from fastapi import Depends, HTTPException
from fastapi_clerk_auth import HTTPAuthorizationCredentials

from app.config import get_clerk_auth_guard

clerk_auth = get_clerk_auth_guard()


def get_user_id_from_request(
    credentials: HTTPAuthorizationCredentials,
) -> str:
    """Extract user ID from Clerk auth credentials."""
    decoded = credentials.model_dump()["decoded"]
    user_id = decoded.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token")
    return str(user_id)


def is_admin_from_credentials(
    credentials: HTTPAuthorizationCredentials,
) -> bool:
    """Check if user has admin role from Clerk auth credentials."""
    decoded = credentials.model_dump()["decoded"]
    metadata = decoded.get("metadata", {})
    return metadata.get("role") == "admin"


def require_admin(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(clerk_auth)],
) -> None:
    """Dependency that requires admin role. Raises 403 if not admin."""
    if not is_admin_from_credentials(credentials):
        raise HTTPException(
            status_code=403,
            detail="Admin access required",
        )


def require_auth(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(clerk_auth)],
) -> str:
    """Dependency that requires authentication. Returns user_id."""
    return get_user_id_from_request(credentials)
