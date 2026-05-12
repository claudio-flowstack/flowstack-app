"""Google Sheets API wrapper."""
from __future__ import annotations
import logging
from typing import Optional, Any

from fastapi import HTTPException
from ..auth.google_oauth import flowstack_oauth
from ._http import get_http_client

log = logging.getLogger("shared.sheets")

API_BASE = "https://sheets.googleapis.com/v4/spreadsheets"


async def _request(method: str, url: str, data: Optional[dict[str, Any]] = None) -> dict[str, Any]:
    http = get_http_client()
    headers = flowstack_oauth.auth_header() | {"Content-Type": "application/json"}
    resp = await http.request(method, url, json=data, headers=headers)
    if resp.status_code == 401:
        await flowstack_oauth.refresh(http)
        headers = flowstack_oauth.auth_header() | {"Content-Type": "application/json"}
        resp = await http.request(method, url, json=data, headers=headers)
    if resp.status_code >= 400:
        log.error(f"Sheets API error: {resp.status_code} {resp.text}")
        raise HTTPException(status_code=resp.status_code, detail=resp.text)
    return resp.json()


async def create(title: str) -> dict[str, Any]:
    return await _request("POST", API_BASE, {"properties": {"title": title}})


async def append_row(spreadsheet_id: str, row: list[Any], range_: str = "A:Z") -> dict[str, Any]:
    url = f"{API_BASE}/{spreadsheet_id}/values/{range_}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS"
    return await _request("POST", url, {"values": [row]})


async def append_rows(spreadsheet_id: str, rows: list[list[Any]], range_: str = "A:Z") -> dict[str, Any]:
    url = f"{API_BASE}/{spreadsheet_id}/values/{range_}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS"
    return await _request("POST", url, {"values": rows})
