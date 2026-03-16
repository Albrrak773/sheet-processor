from __future__ import annotations

from pathlib import Path

from fastapi_clerk_auth import ClerkConfig, ClerkHTTPBearer
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file_encoding="utf-8")

    database_url: str = Field(
        default="mysql+aiomysql://sheetuser:sheetpassword@localhost:3306/sheet_processor"
    )
    environment: str = Field(default="development")
    canonical_cache_file: Path = Field(default=Path("canonical_cache.json"))

    # R2 / S3-compatible storage
    r2_account_id: str = Field(default="")
    r2_access_key_id: str = Field(default="")
    r2_secret_access_key: str = Field(default="")
    r2_bucket_name: str = Field(default="")
    r2_public_url: str = Field(default="")

    # Clerk authentication
    clerk_jwks_url: str = Field(default="")

    @property
    def r2_endpoint_url(self) -> str:
        return f"https://{self.r2_account_id}.r2.cloudflarestorage.com"


settings = Settings()


def get_clerk_config() -> ClerkConfig:
    if not settings.clerk_jwks_url:
        raise ValueError("CLERK_JWKS_URL must be set")
    return ClerkConfig(jwks_url=settings.clerk_jwks_url)


def get_clerk_auth_guard() -> ClerkHTTPBearer:
    return ClerkHTTPBearer(config=get_clerk_config(), add_state=True)
