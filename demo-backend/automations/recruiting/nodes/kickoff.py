"""Kickoff phase nodes: kc05 (close-stage update + new tasks) and kc06 (slack notify).

Migration from server.py lines 2748-2814 (V1 V1 Novacode).
"""
from __future__ import annotations
import logging
from datetime import datetime
from typing import Any

from _shared.integrations import clickup, close, sheets, slack
from _shared.integrations.clickup import USER_CLAUDIO
from _shared.integrations.slack import TEAM_ID as SLACK_TEAM_ID
from _shared.models import AutomationContext, NodeResult, NodeStatus

from ..config import MASTER_DOCS, TRANSCRIPT_DOC
from ..helpers import client_docs

log = logging.getLogger("recruiting.kickoff")


async def kc05(ctx: AutomationContext) -> NodeResult:
    """Kickoff abgeschlossen: Close stage update + ClickUp follow-up tasks."""
    opportunity_id = ctx.get("opportunity_id", "")
    lead_id = ctx.get("lead_id", "")
    company = ctx.get("company", "Novacode GmbH")

    if not opportunity_id:
        return NodeResult(status=NodeStatus.FAILED, error="opportunity_id missing in context")

    # 1. Close stage -> "Kickoff abgeschlossen"
    close_result = await close.update_opportunity_stage(
        opportunity_id=opportunity_id,
        stage_name="Kickoff abgeschlossen",
        lead_id=lead_id,
        automation_status="Strategie in Arbeit",
    )

    # 2. Append row to overview sheet
    sheet_id = ctx.get("overview_sheet_id", "")
    if sheet_id:
        ts = datetime.now().strftime("%d.%m.%Y %H:%M")
        close_url = close_result.get("url", "")
        try:
            await sheets.append_row(sheet_id, [
                "Close: Kickoff abgeschlossen",
                "Strategie in Arbeit",
                "Strategie-Erstellung startet",
                close_url,
                ts,
            ])
        except Exception as e:
            log.warning(f"Sheet append failed: {e}")

    # 3. Create follow-up ClickUp tasks
    list_id = ctx.get("list_id", "")
    task_ids: dict[str, str] = dict(ctx.get("task_ids", {}))

    if list_id:
        folder_root_id = ctx.get("folder_root_id", "")
        drive_url = f"https://drive.google.com/drive/folders/{folder_root_id}" if folder_root_id else ""

        # Task 1: Videodreh planen
        desc_vid = f"Videodreh mit {company} organisieren für Recruiting-Content.\n"
        if drive_url:
            desc_vid += f"\nGoogle Drive: {drive_url}\n"
        t = await clickup.create_task(
            list_id=list_id,
            name=f"Videodreh planen - {company}",
            description=desc_vid,
            assignees=[USER_CLAUDIO],
            priority=2,
            due_days=5,
            checklist_items=[
                "Drehtag mit Kunden abstimmen",
                "Shot-Liste erstellen (Büro, Team, Arbeitsalltag)",
                "Equipment organisieren",
                "Anfahrt und Zeitplan klären",
            ],
        )
        task_ids["videodreh_planen"] = t["id"]

        # Task 2: Strategie reviewen
        desc = f"KI-generierte Strategie-Dokumente für {company} prüfen.\n\n"
        if drive_url:
            desc += f"Google Drive: {drive_url}\n"
        t = await clickup.create_task(
            list_id=list_id,
            name=f"Strategie reviewen - {company}",
            description=desc,
            assignees=[USER_CLAUDIO],
            priority=2,
            due_days=3,
            checklist_items=[
                "Zielgruppen-Avatar: Passt zur Branche und Position?",
                "Messaging: USPs differenzieren sich vom Wettbewerb?",
                "Creative Briefing: Bildsprache passt zur Marke?",
                "Feedback an KI-Docs einarbeiten falls nötig",
            ],
        )
        task_ids["strategy_review"] = t["id"]

    return NodeResult(
        status=NodeStatus.COMPLETED,
        data={
            "stage": close_result.get("stage", ""),
            "automation_status": close_result.get("automation_status", ""),
            "task_ids": task_ids,
        },
        url=close_result.get("url", ""),
    )


async def kc06(ctx: AutomationContext) -> NodeResult:
    """Kickoff Slack notification."""
    company = ctx.get("company", "Novacode GmbH")
    channel_id = ctx.get("channel_id", "")
    sheet_id = ctx.get("overview_sheet_id", "")

    # Append to overview sheet
    if sheet_id:
        ts = datetime.now().strftime("%d.%m.%Y %H:%M")
        kickoff_doc = client_docs(ctx).get("Doc 5 Kickoff", TRANSCRIPT_DOC)
        try:
            await sheets.append_row(sheet_id, [
                "Kickoff", "Abgeschlossen",
                "Strategie-Erstellung startet automatisch",
                kickoff_doc, ts,
            ])
        except Exception as e:
            log.warning(f"Sheet append failed: {e}")

    # Slack message
    await slack.post_webhook(f":white_check_mark: {company} - Kickoff wurde abgeschlossen")

    url = f"https://app.slack.com/client/{SLACK_TEAM_ID}/{channel_id}" if channel_id else ""

    return NodeResult(
        status=NodeStatus.COMPLETED,
        data={"sent": True},
        url=url,
    )


# Handler registry for this phase. Keyed by V1 node-id (no prefix).
HANDLERS: dict[str, Any] = {
    "kc05": kc05,
    "kc06": kc06,
}
