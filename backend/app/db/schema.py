from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING, Any

from sqlalchemy import JSON, Column
from sqlalchemy.orm import relationship
from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    pass


class HeaderAlias(SQLModel, table=True):
    __tablename__ = "header_aliases"  # type: ignore[assignment]
    id: int | None = Field(default=None, primary_key=True)
    header_id: int = Field(foreign_key="headers.id")
    alias_name: str = Field(unique=True)
    header: Header = Relationship(back_populates="aliases")


class Header(SQLModel, table=True):
    __tablename__ = "headers"  # type: ignore[assignment]
    id: int | None = Field(default=None, primary_key=True)
    name: str = Field(unique=True)
    is_optional: int = Field(default=0)
    aliases: list[HeaderAlias] = Relationship(
        sa_relationship=relationship("HeaderAlias", back_populates="header")
    )


class ValidationSession(SQLModel, table=True):
    __tablename__ = "sessions"  # type: ignore[assignment]
    id: str = Field(primary_key=True)
    user_id: str = Field(index=True)
    title: str
    original_csv: str
    data: dict[str, Any] = Field(sa_column=Column(JSON, nullable=False))  # type: ignore[assignment]
    created_at: datetime
    updated_at: datetime


class HeaderCreate(SQLModel):
    name: str


class HeaderAliasCreate(SQLModel):
    header_id: int
    alias_name: str


class HeaderRead(SQLModel):
    id: int
    name: str
    is_optional: bool


class HeaderAliasRead(SQLModel):
    id: int
    header_id: int
    header_name: str
    alias_name: str


class HeaderWithAliases(SQLModel):
    id: int
    name: str
    aliases: list[HeaderAliasRead]


class SessionCreate(SQLModel):
    title: str | None = None
    original_csv: str
    data: list[dict[str, Any]]


class SessionUpdate(SQLModel):
    title: str | None = None
    data: list[dict[str, Any]] | None = None


class SessionRead(SQLModel):
    id: str
    title: str
    created_at: datetime
    updated_at: datetime


class SessionDetail(SQLModel):
    id: str
    title: str
    original_csv: str
    data: list[dict[str, Any]]
    created_at: datetime
    updated_at: datetime
