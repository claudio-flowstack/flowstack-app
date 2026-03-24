"""
V3 Approval System
- Approval Gates with Slack integration
- Escalation with ClickUp task creation
- Pending approval tracking
"""

import json
import logging
import time
from datetime import datetime, timezone, timedelta
from typing import Any, Optional

logger = logging.getLogger("v3.approval")


# ============================================================
# GATE CONFIGURATION
# ============================================================

GATE_CONFIG: dict[str, dict[str, Any]] = {
    "v3-st-approval": {
        "phase": "strategy",
        "label": "Strategy Review",
        "reviewer": "Claudio",
        "deliverables": [
            "Zielgruppen-Avatar",
            "Arbeitgeber-Avatar",
            "Messaging-Matrix",
            "Creative Briefing",
            "Marken-Richtlinien",
        ],
        "deadline_hours": 48,
    },
    "v3-cc-approval": {
        "phase": "copy",
        "label": "Copy Review",
        "reviewer": "Claudio",
        "deliverables": [
            "Landingpage-Texte",
            "Formularseite-Texte",
            "Dankeseite-Texte",
            "Anzeigentexte Hauptkampagne",
            "Anzeigentexte Retargeting",
            "Anzeigentexte Warmup",
            "Videoskript",
        ],
        "deadline_hours": 48,
    },
    "v3-fn-approval": {
        "phase": "funnel",
        "label": "Funnel Review",
        "reviewer": "Anak",
        "deliverables": [
            "Landingpage",
            "Formularseite",
            "Dankeseite",
        ],
        "deadline_hours": 24,
    },
    "v3-ca-approval": {
        "phase": "campaigns",
        "label": "Campaign Review",
        "reviewer": "Claudio",
        "deliverables": [
            "Initial-Kampagne",
            "Retargeting-Kampagne",
            "Warmup-Kampagne",
        ],
        "deadline_hours": 24,
    },
    "v3-rl-golive": {
        "phase": "launch",
        "label": "Go-Live Gate",
        "reviewer": "Claudio",
        "deliverables": "all",
        "deadline_hours": 24,
    },
}


# ============================================================
# PENDING APPROVALS STORE (in-memory + file-backed)
# ============================================================

_pending_approvals: dict[str, dict[str, Any]] = {}


def get_pending_approvals() -> list[dict[str, Any]]:
    """Return all currently pending approvals."""
    return [
        {**v, "node_id": k}
        for k, v in _pending_approvals.items()
        if v.get("status") == "pending"
    ]


def get_approval(node_id: str) -> Optional[dict[str, Any]]:
    """Get a specific approval by node_id."""
    return _pending_approvals.get(node_id)


# ============================================================
# APPROVAL GATE HANDLER
# ============================================================

async def handle_approval_gate(
    node_id: str,
    client_name: str,
    execution_id: str,
    context: dict,
    slack_func: Optional[Any] = None,
    clickup_func: Optional[Any] = None,
) -> dict[str, Any]:
    """
    Called when an approval node is executed.
    Sends Slack notification, creates ClickUp task, and returns 'waiting'.
    The execution pauses here until POST /api/approval/{node_id} is called.
    """
    gate = GATE_CONFIG.get(node_id)
    if not gate:
        logger.error(f"No gate config for {node_id}")
        return {"success": False, "error": f"Unknown approval gate: {node_id}"}

    deadline = datetime.now(timezone.utc) + timedelta(hours=gate["deadline_hours"])

    approval_data = {
        "node_id": node_id,
        "execution_id": execution_id,
        "client_name": client_name,
        "phase": gate["phase"],
        "label": gate["label"],
        "reviewer": gate["reviewer"],
        "deliverables": gate["deliverables"],
        "status": "pending",
        "requested_at": datetime.now(timezone.utc).isoformat(),
        "deadline": deadline.isoformat(),
        "escalation_level": 0,
        "comment": None,
        "responded_at": None,
        "clickup_task_id": None,
    }

    _pending_approvals[node_id] = approval_data

    # Send Slack approval request
    if slack_func:
        deliverable_list = gate["deliverables"]
        if deliverable_list == "all":
            deliverable_text = "Alle Deliverables — Finaler Go-Live Check"
        else:
            deliverable_text = "\n".join(f"  • {d}" for d in deliverable_list)

        await slack_func(
            channel="#ff-approvals",
            text=(
                f"📋 REVIEW ANGEFORDERT — {client_name}\n\n"
                f"{gate['label']}:\n{deliverable_text}\n\n"
                f"Reviewer: {gate['reviewer']}\n"
                f"Deadline: {deadline.strftime('%d.%m.%Y %H:%M')}"
            ),
            # Slack Block Kit with buttons would go here in production
            # For now: plain text with instructions
        )

    logger.info(f"Approval gate {node_id} created for {client_name} — waiting for review")

    return {
        "success": True,
        "waiting": True,
        "status": "waiting_approval",
        "gate": gate["label"],
        "reviewer": gate["reviewer"],
        "deadline": deadline.isoformat(),
    }


# ============================================================
# RESOLVE APPROVAL
# ============================================================

async def resolve_approval(
    node_id: str,
    action: str,
    reviewer: str,
    comment: Optional[str] = None,
    slack_func: Optional[Any] = None,
) -> dict[str, Any]:
    """
    Called when POST /api/approval/{node_id} is received.

    Args:
        action: 'approve' | 'reject' | 'changes_requested'
        reviewer: Who clicked the button
        comment: Optional comment (required for reject/changes_requested)
    """
    approval = _pending_approvals.get(node_id)
    if not approval:
        return {"success": False, "error": f"No pending approval for {node_id}"}

    if approval["status"] != "pending":
        return {"success": False, "error": f"Approval {node_id} is already {approval['status']}"}

    if action not in ("approve", "reject", "changes_requested"):
        return {"success": False, "error": f"Invalid action: {action}"}

    if action in ("reject", "changes_requested") and not comment:
        return {"success": False, "error": "Comment is required for reject/changes_requested"}

    approval["status"] = action + "d" if action == "approve" else action
    approval["responded_at"] = datetime.now(timezone.utc).isoformat()
    approval["comment"] = comment
    approval["resolved_by"] = reviewer

    if slack_func:
        icon = "✅" if action == "approve" else "❌" if action == "reject" else "🔄"
        action_label = "Freigegeben" if action == "approve" else "Abgelehnt" if action == "reject" else "Änderungen angefordert"
        msg = f"{icon} {approval['client_name']} — {approval['label']}: {action_label} von {reviewer}"
        if comment:
            msg += f"\nKommentar: {comment}"
        await slack_func(channel="#ff-approvals", text=msg)

    logger.info(f"Approval {node_id} resolved: {action} by {reviewer}")

    return {
        "success": True,
        "action": action,
        "node_id": node_id,
        "execution_id": approval["execution_id"],
        "should_resume": action == "approve",
    }


# ============================================================
# ESCALATION
# ============================================================

ESCALATION_THRESHOLDS = [
    (24, "reminder", "DM Reminder an Reviewer"),
    (48, "urgent", "ClickUp Task → Urgent + Backup-Reviewer"),
    (72, "critical", "Slack @here in #ff-alerts"),
    (168, "pause", "Pipeline wird pausiert"),
]


async def check_escalations(
    slack_dm_func: Optional[Any] = None,
    slack_alert_func: Optional[Any] = None,
    clickup_func: Optional[Any] = None,
) -> list[dict[str, str]]:
    """
    Check all pending approvals for escalation.
    Called hourly by APScheduler.
    Returns list of actions taken.
    """
    actions = []
    now = datetime.now(timezone.utc)

    for node_id, approval in _pending_approvals.items():
        if approval["status"] != "pending":
            continue

        requested = datetime.fromisoformat(approval["requested_at"])
        hours_waiting = (now - requested).total_seconds() / 3600
        current_level = approval.get("escalation_level", 0)

        for threshold_hours, level, description in ESCALATION_THRESHOLDS:
            level_num = ESCALATION_THRESHOLDS.index((threshold_hours, level, description))

            if hours_waiting >= threshold_hours and current_level < level_num + 1:
                approval["escalation_level"] = level_num + 1

                if level == "reminder" and slack_dm_func:
                    await slack_dm_func(
                        approval["reviewer"],
                        f"Reminder: {approval['label']} für {approval['client_name']} wartet seit {int(hours_waiting)}h auf Review"
                    )
                    actions.append({"node_id": node_id, "action": "reminder_sent"})

                elif level == "urgent" and clickup_func:
                    await clickup_func(
                        title=f"URGENT Review: {approval['client_name']} — {approval['label']}",
                        assignee=approval["reviewer"],
                        priority="urgent",
                    )
                    actions.append({"node_id": node_id, "action": "clickup_urgent"})

                elif level == "critical" and slack_alert_func:
                    await slack_alert_func(
                        f"@here Review überfällig ({int(hours_waiting)}h): {approval['client_name']} — {approval['label']}"
                    )
                    actions.append({"node_id": node_id, "action": "critical_alert"})

                elif level == "pause":
                    approval["status"] = "auto_paused"
                    if slack_alert_func:
                        await slack_alert_func(
                            f"🔴 Pipeline PAUSIERT: {approval['client_name']} — {approval['label']} seit {int(hours_waiting)}h ohne Review"
                        )
                    actions.append({"node_id": node_id, "action": "pipeline_paused"})

                logger.info(f"Escalation {level} for {node_id} ({approval['client_name']}) — {int(hours_waiting)}h waiting")
                break  # Only one escalation per check

    return actions
