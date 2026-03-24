"""
Alert & Task — Generische Fehlerbehandlung mit Slack + ClickUp.
Wird von Handlern bei Fehler aufgerufen.
"""

import logging
from .integrations.slack import SlackClient
from .integrations.clickup import ClickUpClient

log = logging.getLogger("v3.alerts")

slack = SlackClient()
clickup = ClickUpClient()


async def alert_and_task(
    client_name: str,
    error_message: str,
    node_id: str = "",
    severity: str = "critical",
    list_id: str = "",
) -> dict:
    """Slack Alert senden + ClickUp Task erstellen bei Fehler."""
    result = {"slack_sent": False, "task_created": False}

    # 1. Slack Alert
    try:
        alert_msg = f"{client_name} — {node_id}: {error_message}" if node_id else f"{client_name}: {error_message}"
        await slack.send_alert(alert_msg, severity)
        result["slack_sent"] = True
    except Exception as e:
        log.warning(f"Alert Slack failed: {e}")

    # 2. ClickUp Task (wenn list_id vorhanden)
    if list_id:
        try:
            task = await clickup.create_task(
                list_id=list_id,
                name=f"Fehler: {node_id or 'System'} — {client_name}",
                priority=1 if severity == "critical" else 2,
                due_days=1,
                description=f"Automatisch erstellt.\n\nFehler: {error_message}\nNode: {node_id}\nSeverity: {severity}",
            )
            result["task_created"] = True
            result["task_id"] = task.get("task_id", "")
        except Exception as e:
            log.warning(f"Alert ClickUp failed: {e}")

    return result
