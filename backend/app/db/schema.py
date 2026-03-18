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


class GenderAlias(SQLModel, table=True):
    __tablename__ = "gender_aliases"  # type: ignore[assignment]
    id: int | None = Field(default=None, primary_key=True)
    aliase_type: str = Field()
    alias: str = Field(unique=True)


class GenderAliasCreate(SQLModel):
    alias: str


class GenderAliasRead(SQLModel):
    id: int
    aliase_type: str
    alias: str


class Name(SQLModel, table=True):
    __tablename__ = "names"  # type: ignore[assignment]
    id: int | None = Field(default=None, primary_key=True)
    name: str = Field()
    gender: str


class NameRead(SQLModel):
    id: int
    name: str
    gender: str


class NameLookupResult(SQLModel):
    name: str
    gender: str | None
    is_ambiguous: bool


class NameBatchResponse(SQLModel):
    created: int
    skipped: int
    created_names: list[str]
    skipped_names: list[str]


class Member(SQLModel, table=True):
    __tablename__ = "members"
    id: int | None = Field(default=None, primary_key=True)
    name: str = Field(max_length=50)
    email: str | None = Field(default=None, max_length=100)
    phone_number: str | None = Field(default=None, max_length=20)
    uni_id: str = Field(max_length=50, unique=True)
    gender: str
    uni_level: int
    uni_college: str = Field(max_length=100)
    created_at: datetime
    updated_at: datetime
    is_authenticated: bool = Field(default=False)


class MemberLookupRequest(SQLModel):
    name: str | None = None
    email: str | None = None
    phone_number: str | None = None


class MemberRead(SQLModel):
    id: int
    name: str
    email: str | None
    phone_number: str | None
    uni_id: str
    gender: str
    uni_level: int
    uni_college: str
    created_at: datetime
    updated_at: datetime
    is_authenticated: bool
