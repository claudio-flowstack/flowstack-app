"""Google Docs API wrapper."""
from __future__ import annotations
import logging
from typing import Optional, Any

from fastapi import HTTPException
from ..auth.google_oauth import flowstack_oauth
from ._http import get_http_client

log = logging.getLogger("shared.docs")

API_BASE = "https://docs.googleapis.com/v1/documents"


async def request(method: str, url: str, data: Optional[dict[str, Any]] = None) -> dict[str, Any]:
    http = get_http_client()
    headers = flowstack_oauth.auth_header() | {"Content-Type": "application/json"}
    resp = await http.request(method, url, json=data, headers=headers)
    if resp.status_code == 401:
        await flowstack_oauth.refresh(http)
        headers = flowstack_oauth.auth_header() | {"Content-Type": "application/json"}
        resp = await http.request(method, url, json=data, headers=headers)
    if resp.status_code >= 400:
        log.error(f"Docs API error: {resp.status_code} {resp.text}")
        raise HTTPException(status_code=resp.status_code, detail=resp.text)
    return resp.json() if resp.text else {}


async def get(doc_id: str) -> dict[str, Any]:
    return await request("GET", f"{API_BASE}/{doc_id}")


async def batch_update(doc_id: str, requests: list[dict[str, Any]]) -> dict[str, Any]:
    return await request("POST", f"{API_BASE}/{doc_id}:batchUpdate", {"requests": requests})


async def read_text(doc_id: str) -> str:
    """Extract plain text content from a Google Doc."""
    doc = await get(doc_id)
    parts: list[str] = []
    for el in doc.get("body", {}).get("content", []):
        para = el.get("paragraph")
        if not para:
            continue
        for run in para.get("elements", []):
            text = run.get("textRun", {}).get("content", "")
            if text:
                parts.append(text)
    return "".join(parts)
