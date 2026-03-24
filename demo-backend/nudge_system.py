"""
V3 Client Nudge System
- Tracks what the client needs to deliver (assets, access, feedback)
- Sends reminders after 2 days
- Creates ClickUp tasks after 4 days
- No blockers, no pipeline pauses — just reminders and tasks
"""

import json
import logging
import ssl
import certifi
import urllib.request
from datetime import datetime, timezone, timedelta
from typing import Any, Optional

logger = logging.getLogger("v3.nudge")

SSL_CTX = ssl.create_default_context(cafile=certifi.where())

# In-memory nudge store (backed by Airtable)
_nudges: list[dict] = []


def create_nudge(
    client_name: str,
    client_id: str,
    what_missing: str,
    nudge_type: str = "asset",  # asset | access | feedback | approval
    email: str = "",
) -> dict:
    """Create a new nudge for a client."""
    nudge = {
        "id": f"nudge_{len(_nudges) + 1}",
        "client_name": client_name,
        "client_id": client_id,
        "what_missing": what_missing,
        "type": nudge_type,
        "status": "waiting",
        "email": email,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "reminder_sent_at": None,
        "task_created_at": None,
        "clickup_task_id": None,
        "resolved_at": None,
    }
    _nudges.append(nudge)
    logger.info(f"Nudge created: {client_name} — {what_missing}")
    return nudge


def resolve_nudge(nudge_id: str):
    """Mark a nudge as resolved."""
    for n in _nudges:
        if n["id"] == nudge_id:
            n["status"] = "resolved"
            n["resolved_at"] = datetime.now(timezone.utc).isoformat()
            logger.info(f"Nudge resolved: {n['client_name']} — {n['what_missing']}")
            return True
    return False


def get_open_nudges() -> list[dict]:
    """Get all unresolved nudges."""
    return [n for n in _nudges if n["status"] != "resolved"]


def get_client_nudges(client_id: str) -> list[dict]:
    """Get nudges for a specific client."""
    return [n for n in _nudges if n["client_id"] == client_id and n["status"] != "resolved"]


async def check_nudges(
    slack_token: str = "",
    clickup_token: str = "",
    clickup_list_getter=None,
    email_sender=None,
):
    """
    Cron job: Check all open nudges and escalate if needed.
    - Day 2: Send reminder email
    - Day 4: Create ClickUp task
    Runs every 4 hours.
    """
    now = datetime.now(timezone.utc)
    actions = []

    for nudge in _nudges:
        if nudge["status"] == "resolved":
            continue

        created = datetime.fromisoformat(nudge["created_at"])
        days_waiting = (now - created).days

        # Day 4+: Create ClickUp task (if not already created)
        if days_waiting >= 4 and not nudge.get("task_created_at"):
            if clickup_token and clickup_list_getter:
                list_id = clickup_list_getter(nudge["client_id"])
                if list_id:
                    try:
                        data = json.dumps({
                            "name": f"Ausstehend: {nudge['what_missing']} — {nudge['client_name']}",
                            "description": f"Der Kunde hat nach {days_waiting} Tagen noch nicht geliefert:\n\n{nudge['what_missing']}\n\nBitte nachfassen.",
                            "priority": 2,
                        }).encode()
                        req = urllib.request.Request(
                            f"https://api.clickup.com/api/v2/list/{list_id}/task",
                            data=data,
                            headers={"Authorization": clickup_token, "Content-Type": "application/json"},
                        )
                        resp = urllib.request.urlopen(req, timeout=15, context=SSL_CTX)
                        task_data = json.loads(resp.read())
                        nudge["clickup_task_id"] = task_data.get("id")
                        nudge["task_created_at"] = now.isoformat()
                        nudge["status"] = "task_created"
                        actions.append({"nudge": nudge["id"], "action": "clickup_task_created"})
                        logger.info(f"Nudge ClickUp task created: {nudge['client_name']} — {nudge['what_missing']}")
                    except Exception as e:
                        logger.warning(f"ClickUp task creation failed: {e}")

        # Day 2+: Send reminder email (if not already sent)
        elif days_waiting >= 2 and not nudge.get("reminder_sent_at"):
            if email_sender and nudge.get("email"):
                try:
                    await email_sender(
                        to=nudge["email"],
                        subject=f"Erinnerung: {nudge['what_missing']}",
                        body=f"Hallo,\n\nkurze Erinnerung: Wir benötigen noch folgendes von Ihnen:\n\n{nudge['what_missing']}\n\nBitte senden Sie uns die fehlenden Unterlagen zu.\n\nViele Grüße",
                    )
                    nudge["reminder_sent_at"] = now.isoformat()
                    nudge["status"] = "reminded"
                    actions.append({"nudge": nudge["id"], "action": "reminder_sent"})
                    logger.info(f"Nudge reminder sent: {nudge['client_name']} — {nudge['what_missing']}")
                except Exception as e:
                    logger.warning(f"Reminder email failed: {e}")

    return actions


# Pre-defined nudges that get created automatically at specific points
AUTOMATIC_NUDGES = [
    {"after_node": "v3-is06", "what": "Logo in hoher Auflösung + Markenfarben", "type": "asset"},
    {"after_node": "v3-is06", "what": "Bilder für Ad Creatives (Team, Büro, Arbeit)", "type": "asset"},
    {"after_node": "v3-is06", "what": "Meta Business Manager Zugang teilen", "type": "access"},
    {"after_node": "v3-is06", "what": "Aktuelle Stellenanzeigen / Jobbeschreibungen", "type": "asset"},
    {"after_node": "v3-fn01", "what": "Domain-Zugang / CMS-Login für Funnel", "type": "access"},
]
