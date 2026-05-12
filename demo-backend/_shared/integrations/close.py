"""Close CRM API wrapper with pipeline stage management."""
from __future__ import annotations
import logging
import os
from typing import Optional, Any

from fastapi import HTTPException
from ._http import get_http_client

log = logging.getLogger("shared.close")

API_KEY = os.environ.get("CLOSE_API", os.environ.get("CLOSE_API_KEY", ""))
BASE_URL = "https://api.close.com/api/v1"

# Recruiting Pipeline (Test Account / Trial - Fulfillment)
PIPELINE_ID = "pipe_29QVKx39dnXZrEdmC3Ea6v"
CUSTOM_FIELDS = {
    "service_type": "cf_bihJnLLxKxpvjYAVZ9AqdWnzNH5S7O7rC1WFhgrs6xO",
    "account_manager": "cf_oNqqlOPL0AAZfowUSrkx5nFMbyKTVJxUxtAetXJtVAY",
    "onboarding_date": "cf_rCeI7tH70274qaBzeaCmtpSdqX6ofARBnolyWd08sA6",
    "automation_status": "cf_Lufb065GVOQWlWwIloY3sdO9sVc8HCAVLdIjnYkcXwZ",
}

# Stage cache: name -> id (loaded on first use, cached for process lifetime)
_STAGES: dict[str, str] = {}


async def request(method: str, path: str, data: Optional[dict[str, Any]] = None) -> dict[str, Any]:
    http = get_http_client()
    resp = await http.request(method, f"{BASE_URL}{path}", json=data, auth=(API_KEY, ""))
    if resp.status_code >= 400:
        log.error(f"Close API error: {resp.status_code} {resp.text}")
        raise HTTPException(status_code=resp.status_code, detail=resp.text)
    return resp.json()


async def load_stages(pipeline_id: str = PIPELINE_ID, force: bool = False) -> dict[str, str]:
    """Load pipeline stages once and cache. Returns name -> id mapping."""
    global _STAGES
    if _STAGES and not force:
        return _STAGES
    result = await request("GET", f"/pipeline/{pipeline_id}/")
    stages = {s["label"]: s["id"] for s in result.get("statuses", [])}
    _STAGES = stages
    log.info(f"Loaded {len(stages)} Close pipeline stages")
    return stages


async def find_lead_by_email(email: str) -> Optional[dict[str, Any]]:
    if not email:
        return None
    result = await request("GET", f"/lead/?query=email:{email}&_limit=1")
    leads = result.get("data", [])
    return leads[0] if leads else None


async def update_opportunity_stage(
    opportunity_id: str,
    stage_name: str,
    lead_id: str = "",
    automation_status: str = "",
) -> dict[str, Any]:
    """Update Close opportunity stage by name. Adds a note with the change."""
    stages = await load_stages()
    status_id = stages.get(stage_name)
    if not status_id:
        raise HTTPException(400, f"Unknown stage: {stage_name}. Available: {list(stages.keys())}")

    automation_status_choice = "Abgeschlossen" if stage_name == "Live" else "Läuft"

    await request("PUT", f"/opportunity/{opportunity_id}/", {
        "status_id": status_id,
        f"custom.{CUSTOM_FIELDS['automation_status']}": automation_status_choice,
    })

    detail = automation_status or stage_name
    if lead_id:
        await request("POST", "/activity/note/", {
            "lead_id": lead_id,
            "note": f"Stage aktualisiert: {stage_name}. Status: {detail}.",
        })

    return {
        "stage": stage_name,
        "automation_status": automation_status_choice,
        "url": f"https://app.close.com/lead/{lead_id}/" if lead_id else "",
    }


async def add_note(lead_id: str, note: str) -> dict[str, Any]:
    return await request("POST", "/activity/note/", {"lead_id": lead_id, "note": note})
