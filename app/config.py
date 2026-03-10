from __future__ import annotations

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    database_url: str = Field(
        default="mysql+aiomysql://sheetuser:sheetpassword@localhost:3306/sheet_processor"
    )
    environment: str = Field(default="development")


settings = Settings()
