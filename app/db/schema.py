from __future__ import annotations

from typing import TYPE_CHECKING

from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    pass


class Header(SQLModel, table=True):
    __tablename__ = "headers"
    id: int | None = Field(default=None, primary_key=True)
    name: str = Field(unique=True)
    aliases: list[HeaderAlias] = Relationship(back_populates="header")


class HeaderAlias(SQLModel, table=True):
    __tablename__ = "header_aliases"
    id: int | None = Field(default=None, primary_key=True)
    header_id: int = Field(foreign_key="headers.id")
    alias_name: str = Field(unique=True)
    header: Header = Relationship(back_populates="aliases")


class HeaderCreate(SQLModel):
    name: str


class HeaderAliasCreate(SQLModel):
    header_id: int
    alias_name: str


class HeaderRead(SQLModel):
    id: int
    name: str


class HeaderAliasRead(SQLModel):
    id: int
    header_id: int
    alias_name: str


class HeaderWithAliases(SQLModel):
    id: int
    name: str
    aliases: list[HeaderAliasRead]
