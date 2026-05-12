"""Airtable API wrapper."""
from __future__ import annotations
import logging
import os
from typing import Optional, Any
from urllib.parse import quote

from fastapi import HTTPException
from ._http import get_http_client

log = logging.getLogger("shared.airtable")

API_KEY = os.environ.get("AIRTABLE_API", os.environ.get("AIRTABLE_API_KEY", ""))
BASE_ID = os.environ.get("AIRTABLE_BASE_ID", "")
BASE_URL = "https://api.airtable.com/v0"


async def request(method: str, path: str, data: Optional[dict[str, Any]] = None) -> dict[str, Any]:
    http = get_http_client()
    resp = await http.request(
        method,
        f"{BASE_URL}/{BASE_ID}{path}",
        json=data,
        headers={"Authorization": f"Bearer {API_KEY}", "Content-Type": "application/json"},
    )
    if resp.status_code >= 400:
        log.error(f"Airtable API error: {resp.status_code} {resp.text}")
        raise HTTPException(status_code=resp.status_code, detail=resp.text)
    return resp.json()


async def create_record(table: str, fields: dict[str, Any]) -> dict[str, Any]:
    return await request("POST", f"/{table}", {"fields": fields, "typecast": True})


async def create_records(table: str, records: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Create up to 10 records per call. Splits longer lists into batches."""
    out: list[dict[str, Any]] = []
    for i in range(0, len(records), 10):
        batch = records[i:i + 10]
        result = await request("POST", f"/{table}", {
            "records": [{"fields": f} for f in batch],
            "typecast": True,
        })
        out.extend(result.get("records", []))
    return out


async def update_record(table: str, record_id: str, fields: dict[str, Any]) -> dict[str, Any]:
    return await request("PATCH", f"/{table}/{record_id}", {"fields": fields, "typecast": True})


async def get_records(table: str, formula: str = "") -> list[dict[str, Any]]:
    path = f"/{table}"
    if formula:
        path += f"?filterByFormula={quote(formula)}"
    result = await request("GET", path)
    return result.get("records", [])
