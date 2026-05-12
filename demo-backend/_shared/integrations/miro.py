"""Miro API wrapper."""
from __future__ import annotations
import logging
import os
from typing import Optional, Any

from fastapi import HTTPException
from ._http import get_http_client

log = logging.getLogger("shared.miro")

ACCESS_TOKEN = os.environ.get("MIRO_ACCESS_TOKEN", "")
BASE_URL = "https://api.miro.com/v2"


async def request(method: str, path: str, data: Optional[dict[str, Any]] = None) -> dict[str, Any]:
    http = get_http_client()
    resp = await http.request(
        method,
        f"{BASE_URL}{path}",
        json=data,
        headers={"Authorization": f"Bearer {ACCESS_TOKEN}", "Content-Type": "application/json"},
    )
    if resp.status_code >= 400:
        log.error(f"Miro API error: {resp.status_code} {resp.text}")
        raise HTTPException(status_code=resp.status_code, detail=resp.text)
    return resp.json()
