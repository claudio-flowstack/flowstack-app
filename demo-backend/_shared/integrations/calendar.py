"""Google Calendar API wrapper."""
from __future__ import annotations
import logging
from typing import Optional, Any

from fastapi import HTTPException
from ..auth.google_oauth import flowstack_oauth
from ._http import get_http_client

log = logging.getLogger("shared.calendar")

API_BASE = "https://www.googleapis.com/calendar/v3"


async def _request(method: str, url: str, data: Optional[dict[str, Any]] = None) -> dict[str, Any]:
    http = get_http_client()
    headers = flowstack_oauth.auth_header() | {"Content-Type": "application/json"}
    resp = await http.request(method, url, json=data, headers=headers)
    if resp.status_code == 401:
        await flowstack_oauth.refresh(http)
        headers = flowstack_oauth.auth_header() | {"Content-Type": "application/json"}
        resp = await http.request(method, url, json=data, headers=headers)
    if resp.status_code >= 400:
        log.error(f"Calendar API error: {resp.status_code} {resp.text}")
        raise HTTPException(status_code=resp.status_code, detail=resp.text)
    return resp.json() if resp.text else {}


async def create_event(
    summary: str,
    start_iso: str,
    end_iso: str,
    attendee_emails: list[str],
    description: str = "",
    add_meet: bool = True,
    calendar_id: str = "primary",
) -> dict[str, Any]:
    body: dict[str, Any] = {
        "summary": summary,
        "description": description,
        "start": {"dateTime": start_iso, "timeZone": "Europe/Berlin"},
        "end": {"dateTime": end_iso, "timeZone": "Europe/Berlin"},
        "attendees": [{"email": e} for e in attendee_emails],
    }
    if add_meet:
        body["conferenceData"] = {
            "createRequest": {
                "requestId": f"flowstack-{summary[:10]}-{start_iso[:10]}",
                "conferenceSolutionKey": {"type": "hangoutsMeet"},
            }
        }
    url = f"{API_BASE}/calendars/{calendar_id}/events?conferenceDataVersion=1&sendUpdates=all"
    return await _request("POST", url, body)


async def delete_event(event_id: str, calendar_id: str = "primary") -> None:
    await _request("DELETE", f"{API_BASE}/calendars/{calendar_id}/events/{event_id}")
