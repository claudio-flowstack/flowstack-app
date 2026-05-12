"""Gmail API wrapper."""
from __future__ import annotations
import base64
import logging
from email.mime.text import MIMEText
from typing import Optional, Any

from fastapi import HTTPException
from ..auth.google_oauth import flowstack_oauth
from ._http import get_http_client

log = logging.getLogger("shared.gmail")

API_BASE = "https://gmail.googleapis.com/gmail/v1"


async def send(to: str, subject: str, body_html: str, sender: Optional[str] = None) -> dict[str, Any]:
    msg = MIMEText(body_html, "html", "utf-8")
    msg["to"] = to
    msg["subject"] = subject
    if sender:
        msg["from"] = sender
    raw = base64.urlsafe_b64encode(msg.as_bytes()).decode()

    http = get_http_client()
    headers = flowstack_oauth.auth_header() | {"Content-Type": "application/json"}
    url = f"{API_BASE}/users/me/messages/send"
    resp = await http.post(url, json={"raw": raw}, headers=headers)
    if resp.status_code == 401:
        await flowstack_oauth.refresh(http)
        headers = flowstack_oauth.auth_header() | {"Content-Type": "application/json"}
        resp = await http.post(url, json={"raw": raw}, headers=headers)
    if resp.status_code >= 400:
        log.error(f"Gmail send failed: {resp.status_code} {resp.text}")
        raise HTTPException(status_code=resp.status_code, detail=resp.text)
    return resp.json()
