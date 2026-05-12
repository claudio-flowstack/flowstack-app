"""ClickUp API wrapper with convenience helpers for tasks + checklists."""
from __future__ import annotations
import logging
import os
from datetime import datetime, timedelta
from typing import Optional, Any

from fastapi import HTTPException
from ._http import get_http_client

log = logging.getLogger("shared.clickup")

TOKEN = os.environ.get("CLICKUP_API_TOKEN", "")
BASE_URL = "https://api.clickup.com/api/v2"
SPACE_ID = "90189542355"
TEAM_ID = "90182362705"
USER_CLAUDIO = 306633165
USER_ANAK = 107605639


async def request(method: str, path: str, data: Optional[dict[str, Any]] = None) -> dict[str, Any]:
    http = get_http_client()
    resp = await http.request(
        method,
        f"{BASE_URL}{path}",
        json=data,
        headers={"Authorization": TOKEN},
    )
    if resp.status_code >= 400:
        log.error(f"ClickUp API error: {resp.status_code} {resp.text}")
        raise HTTPException(status_code=resp.status_code, detail=resp.text)
    return resp.json()


async def create_task(
    list_id: str,
    name: str,
    description: str,
    assignees: list[int],
    priority: int,
    due_days: int,
    checklist_items: Optional[list[str]] = None,
) -> dict[str, Any]:
    """Create a task with optional checklist. Returns {id, name}."""
    due_ms = int((datetime.now() + timedelta(days=due_days)).timestamp() * 1000)
    task = await request("POST", f"/list/{list_id}/task", {
        "name": name,
        "description": description,
        "assignees": assignees,
        "priority": priority,
        "due_date": due_ms,
        "status": "to do",
    })
    task_id = task["id"]

    if checklist_items:
        cl = await request("POST", f"/task/{task_id}/checklist", {"name": "Checkliste"})
        cl_id = cl["checklist"]["id"]
        for item in checklist_items:
            await request("POST", f"/checklist/{cl_id}/checklist_item", {"name": item})

    return {"id": task_id, "name": name}


async def attach_docs_to_task(task_id: str, docs: dict[str, str]) -> None:
    """Attach a list of (label, url) pairs as a comment on a task."""
    entries = [(n, u) for n, u in docs.items() if u]
    if not entries:
        return
    comment = "Ressourcen:\n" + "\n".join(f"- {n}: {u}" for n, u in entries)
    try:
        await request("POST", f"/task/{task_id}/comment", {"comment_text": comment})
    except Exception as e:
        log.warning(f"ClickUp comment with resources failed: {e}")


async def complete_task(
    task_id: str,
    comment: Optional[str] = None,
    docs: Optional[dict[str, str]] = None,
) -> None:
    """Mark task complete and optionally add a comment + docs."""
    await request("PUT", f"/task/{task_id}", {"status": "complete"})
    if comment:
        await request("POST", f"/task/{task_id}/comment", {"comment_text": comment})
    if docs:
        await attach_docs_to_task(task_id, docs)


async def update_task(task_id: str, fields: dict[str, Any]) -> dict[str, Any]:
    """Update arbitrary task fields (status, name, assignees, etc.)."""
    return await request("PUT", f"/task/{task_id}", fields)
