"""Meta Marketing API (Facebook Ads) wrapper."""
from __future__ import annotations
import logging
import os
from typing import Optional, Any

from fastapi import HTTPException
from ._http import get_http_client

log = logging.getLogger("shared.meta")

ACCESS_TOKEN = os.environ.get("META_ACCESS_TOKEN", "")
AD_ACCOUNT = os.environ.get("META_AD_ACCOUNT_ID", "")
PIXEL_ID = os.environ.get("META_PIXEL_ID", "1496553014661154")
PAGE_ID = os.environ.get("META_PAGE_ID", "")
GRAPH_VERSION = "v21.0"


def ad_account() -> str:
    if not AD_ACCOUNT:
        return ""
    return AD_ACCOUNT if AD_ACCOUNT.startswith("act_") else f"act_{AD_ACCOUNT}"


def ad_account_numeric() -> str:
    return AD_ACCOUNT.replace("act_", "") if AD_ACCOUNT else ""


async def request(method: str, endpoint: str, data: Optional[dict[str, Any]] = None) -> dict[str, Any]:
    http = get_http_client()
    url = f"https://graph.facebook.com/{GRAPH_VERSION}/{endpoint.lstrip('/')}"
    params: dict[str, Any] = {"access_token": ACCESS_TOKEN}
    if method.upper() == "GET" and data:
        params.update({k: str(v) for k, v in data.items()})
        resp = await http.request(method, url, params=params)
    else:
        resp = await http.request(method, url, params=params, json=data)
    if resp.status_code >= 400:
        log.error(f"Meta API error: {resp.status_code} {resp.text}")
        raise HTTPException(status_code=resp.status_code, detail=resp.text)
    return resp.json()
