from __future__ import annotations

import io
import re
from typing import Any

import httpx
import pandas as pd
from fastapi import HTTPException

from app.types import RowData


async def extract_from_google_sheet(sheet_url: str) -> list[RowData]:
    sheet_id = _extract_sheet_id(sheet_url)
    if sheet_id is None:
        raise ValueError("Invalid Google Sheet URL")

    csv_url = f"https://docs.google.com/spreadsheets/d/{sheet_id}/export?format=csv"

    async with httpx.AsyncClient(follow_redirects=True) as client:
        response = await client.get(csv_url)
        response.raise_for_status()

    df = pd.read_csv(io.BytesIO(response.content))
    df = _normalize_columns(df)

    return _dataframe_to_rows(df)


async def extract_from_file_url(file_url: str) -> list[RowData]:
    extension = _get_extension(file_url)
    if extension not in {".csv", ".xlsx", ".xls", ".tsv"}:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Unsupported file format: {extension or 'none'}. "
                "Use .csv, .xlsx, .xls, or .tsv"
            ),
        )

    async with httpx.AsyncClient(follow_redirects=True, timeout=30.0) as client:
        response = await client.get(file_url)
        response.raise_for_status()

    df = _read_file(response.content, extension)
    df = _normalize_columns(df)

    return _dataframe_to_rows(df)


def extract_from_raw(data: str) -> list[RowData]:
    df = _detect_and_parse_raw(data)
    df = _normalize_columns(df)

    return _dataframe_to_rows(df)


def _extract_sheet_id(url: str) -> str | None:
    patterns = [
        r"/spreadsheets/d/([a-zA-Z0-9-_]+)",
        r"/d/([a-zA-Z0-9-_]+)",
    ]

    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)

    return None


def _get_extension(filename: str) -> str:
    parts = filename.rsplit(".", 1)
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


def is_google_sheet_url(url: str) -> bool:
    return "docs.google.com/spreadsheets" in url or "/spreadsheets/d/" in url


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
