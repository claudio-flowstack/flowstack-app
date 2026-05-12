"""Slack integration: incoming webhook + Bot API."""
from __future__ import annotations
import json
import logging
import os
import ssl
import urllib.request
from typing import Optional, Any

import certifi
from ._http import get_http_client

log = logging.getLogger("shared.slack")

WEBHOOK_URL = os.environ.get("SLACK_CLAUDIO_WEBHOOK", os.environ.get("SLACK_WEBHOOK", ""))
BOT_TOKEN = os.environ.get("SLACK_BOT_TOKEN", os.environ.get("SLACK_API_TOKEN", ""))
TEAM_ID = "T0AAEHFN8GH"
USER_CLAUDIO = "U0AA1KHD0G2"
USER_ANAK = "U0A9L6KUT5M"
TEAM_MEMBERS = [USER_CLAUDIO, USER_ANAK]

COLOR_SUCCESS = "#00ff00"
COLOR_INFO = "#36a64f"
COLOR_WARN = "#ff9900"
COLOR_ERROR = "#ff0000"


def link(url: str, label: str) -> str:
    return f"<{url}|{label}>"


async def post_webhook(text: str, blocks: Optional[list] = None, color: Optional[str] = None) -> bool:
    if not WEBHOOK_URL:
        return False
    payload: dict[str, Any] = {"text": text}
    if blocks:
        payload["attachments"] = [{"color": color or COLOR_INFO, "blocks": blocks}]
    try:
        ctx = ssl.create_default_context(cafile=certifi.where())
        req = urllib.request.Request(
            WEBHOOK_URL,
            data=json.dumps(payload).encode(),
            headers={"Content-Type": "application/json"},
        )
        urllib.request.urlopen(req, timeout=10, context=ctx)
        return True
    except Exception as e:
        log.error(f"Slack webhook failed: {e}")
        return False


async def bot_request(method: str, payload: dict[str, Any]) -> dict[str, Any]:
    if not BOT_TOKEN:
        return {"ok": False, "error": "no_bot_token"}
    http = get_http_client()
    resp = await http.post(
        f"https://slack.com/api/{method}",
        json=payload,
        headers={
            "Authorization": f"Bearer {BOT_TOKEN}",
            "Content-Type": "application/json; charset=utf-8",
        },
    )
    return resp.json()
