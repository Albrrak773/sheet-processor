from __future__ import annotations

import io
import re
from typing import Any

import httpx
import pandas as pd
from fastapi import HTTPException
from pydantic import HttpUrl

from app.models import RowData


class ExtractionResult:
    rows: list[RowData]
    raw_csv: str

    def __init__(self, rows: list[RowData], raw_csv: str):
        self.rows = rows
        self.raw_csv = raw_csv


async def extract_from_google_sheet(sheet_url: HttpUrl) -> ExtractionResult:
    sheet_id = _extract_sheet_id(sheet_url)
    if sheet_id is None:
        raise ValueError("Invalid Google Sheet URL")

    csv_url = f"https://docs.google.com/spreadsheets/d/{sheet_id}/export?format=csv"

    async with httpx.AsyncClient(follow_redirects=True) as client:
        response = await client.get(csv_url)
        if response.status_code == 401:
            raise HTTPException(status_code=400, detail="Google Sheet is not publicly accessible")
        response.raise_for_status()

    raw_csv = response.content.decode("utf-8")
    df = pd.read_csv(io.BytesIO(response.content))
    df = _normalize_columns(df)

    return ExtractionResult(_dataframe_to_rows(df), raw_csv)


async def extract_from_published_sheet(sheet_url: HttpUrl) -> ExtractionResult:
    url_str = str(sheet_url)
    url_str = re.sub(r"/pubhtml(?=[?#/]|$)", "/pub", url_str)
    url_str = re.sub(r"[?&]output=[^&]*", "", url_str)
    csv_url = f"{url_str}?output=csv"

    async with httpx.AsyncClient(follow_redirects=True) as client:
        response = await client.get(csv_url)
        if response.status_code in (401, 403, 404):
            raise HTTPException(status_code=400, detail="Google Sheet is not publicly accessible")
        response.raise_for_status()

    raw_csv = response.content.decode("utf-8")
    df = pd.read_csv(io.BytesIO(response.content))
    df = _normalize_columns(df)

    return ExtractionResult(_dataframe_to_rows(df), raw_csv)


def is_published_sheet_url(url: HttpUrl) -> bool:
    return bool(re.search(r"/spreadsheets/d/e/[a-zA-Z0-9-_]+/pub", str(url)))

async def is_file_url(url: HttpUrl) -> bool:
    extension = _get_extension(url)
    return extension in {".csv", ".xlsx", ".xls", ".tsv"}

async def extract_from_file_url(file_url: HttpUrl) -> ExtractionResult:

    extension = _get_extension(file_url)
    async with httpx.AsyncClient(follow_redirects=True, timeout=30.0) as client:
        response = await client.get(str(file_url))
        response.raise_for_status()

    raw_csv = response.content.decode("utf-8")
    df = _read_file(response.content, extension)
    df = _normalize_columns(df)

    return ExtractionResult(_dataframe_to_rows(df), raw_csv)


def extract_from_raw(data: str) -> ExtractionResult:
    df = _detect_and_parse_raw(data)
    df = _normalize_columns(df)

    return ExtractionResult(_dataframe_to_rows(df), df.to_csv(index=False))


def _extract_sheet_id(url: HttpUrl) -> str | None:
    patterns = [
        r"/spreadsheets/d/([a-zA-Z0-9-_]+)",
        r"/d/([a-zA-Z0-9-_]+)",
    ]

    for pattern in patterns:
        match = re.search(pattern, str(url))
        if match:
            return match.group(1)

    return None


def _get_extension(filename: HttpUrl) -> str:
    parts = str(filename).rsplit(".", 1)
    if len(parts) > 1:
        return f".{parts[-1].lower()}"
    return ""


def _read_file(content: bytes, extension: str) -> pd.DataFrame:
    if extension == ".csv":
        return pd.read_csv(io.BytesIO(content))
    elif extension in {".xlsx", ".xls"}:
        return pd.read_excel(io.BytesIO(content))
    elif extension == ".tsv":
        return pd.read_csv(io.BytesIO(content), sep="\t")
    else:
        raise ValueError(f"Unsupported file format: {extension}")


def _detect_and_parse_raw(data: str) -> pd.DataFrame:
    first_line = data.split("\n")[0] if data else ""
    if "\t" in first_line:
        return pd.read_csv(io.StringIO(data), sep="\t")
    return pd.read_csv(io.StringIO(data))


def _normalize_columns(df: pd.DataFrame) -> pd.DataFrame:
    df.columns = [str(col).lower().strip() for col in df.columns]
    return df


def _dataframe_to_rows(df: pd.DataFrame) -> list[RowData]:
    rows: list[RowData] = []
    for _idx, row in df.iterrows():
        row_dict: RowData = {}
        for col in df.columns:
            value: Any = row[col]
            if pd.isna(value):
                row_dict[col] = None
            else:
                row_dict[col] = value
        rows.append(row_dict)
    return rows
