from __future__ import annotations

import io
import re
from typing import Any

import httpx
import pandas as pd
from fastapi import HTTPException, UploadFile

from app.types import RowData


def extract_from_google_sheet(sheet_url: str) -> list[RowData]:
    sheet_id = _extract_sheet_id(sheet_url)
    if sheet_id is None:
        raise ValueError("Invalid Google Sheet URL")

    csv_url = f"https://docs.google.com/spreadsheets/d/{sheet_id}/export?format=csv"

    with httpx.Client(follow_redirects=True) as client:
        response = client.get(csv_url)
        response.raise_for_status()

    df = pd.read_csv(io.BytesIO(response.content))
    df = _normalize_columns(df)

    return _dataframe_to_rows(df)


def extract_from_file(file: UploadFile) -> list[RowData]:
    content = file.file.read()
    filename = file.filename or "unknown"

    extension = _get_extension(filename)

    df = _read_file(content, extension)
    df = _normalize_columns(df)

    return _dataframe_to_rows(df)


def extract_from_raw(data: str, format: str) -> list[RowData]:
    format_lower = format.lower()

    df = _read_raw_data(data, format_lower)
    df = _normalize_columns(df)

    return _dataframe_to_rows(df)


def extract_rows(
    sheet_url: str | None,
    data: str | None,
    format: str | None,
    file: UploadFile | None,
) -> list[RowData]:
    if sheet_url:
        return extract_from_google_sheet(sheet_url)

    if file:
        return extract_from_file(file)

    if data and format:
        return extract_from_raw(data, format)

    raise HTTPException(
        status_code=400,
        detail="Provide either sheet_url, file upload, or data with format",
    )


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


def _read_raw_data(data: str, format: str) -> pd.DataFrame:
    if format == "csv":
        return pd.read_csv(io.StringIO(data))
    elif format == "tsv":
        return pd.read_csv(io.StringIO(data), sep="\t")
    else:
        raise ValueError(f"Unsupported format: {format}. Use 'csv' or 'tsv'.")


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
