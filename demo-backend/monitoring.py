"""
V3 Monitoring & Cron Jobs
- Daily/Weekly/Monthly Digests
- Zero-Lead Alert
- CPL Alert
- Ad Fatigue Detection
- Health Check
- Token Refresh
- Ghost Detection
- DLQ Digest
- Airtable/Close Sync Check
"""

import json
import logging
import ssl
import certifi
import urllib.request
from datetime import datetime, timezone, timedelta
from typing import Any, Optional, Callable

logger = logging.getLogger("v3.monitoring")

SSL_CTX = ssl.create_default_context(cafile=certifi.where())


# ============================================================
# SLACK HELPERS
# ============================================================

async def slack_post(channel: str, text: str, token: str):
    """Post a message to Slack."""
    try:
        data = json.dumps({"channel": channel, "text": text}).encode()
        req = urllib.request.Request(
            "https://slack.com/api/chat.postMessage",
            data=data,
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
            },
        )
        urllib.request.urlopen(req, timeout=10, context=SSL_CTX)
    except Exception as e:
        logger.error(f"Slack post failed: {e}")


async def slack_log(client_name: str, message: str, token: str):
    """Send one-liner to #ff-log."""
    await slack_post("#ff-log", f"✓ {client_name} — {message}", token)


async def slack_alert(message: str, token: str, severity: str = "critical"):
    """Send alert to #ff-alerts."""
    prefix = "🔴 CRITICAL" if severity == "critical" else "🟡 WARNING"
    mention = "<!here> " if severity == "critical" else ""
    await slack_post("#ff-alerts", f"{mention}{prefix} — {message}", token)


async def slack_phase_complete(
    client_name: str,
    phase: str,
    deliverables_count: int,
    duration_s: float,
    token: str,
):
    """Send phase completion summary to #ff-log."""
    minutes = int(duration_s // 60)
    seconds = int(duration_s % 60)
    await slack_post(
        "#ff-log",
        f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
        f"✅ {client_name.upper()} — {phase} abgeschlossen\n\n"
        f"{deliverables_count} Deliverables erstellt in {minutes}min {seconds}s\n"
        f"→ Review-Aufgabe in ClickUp erstellt\n"
        f"→ Übersichts-Sheet aktualisiert\n\n"
        f"Nächster Schritt: {phase}-Docs prüfen und freigeben\n"
        f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
        token,
    )


# ============================================================
# DAILY DIGEST
# ============================================================

async def daily_digest(
    get_clients_func: Callable,
    get_performance_func: Callable,
    slack_token: str,
):
    """
    Send daily digest to #ff-digest at 09:00.
    Shows all clients with status and key metrics.
    """
    try:
        clients = await get_clients_func()
        lines = ["📊 *DAILY DIGEST* — " + datetime.now().strftime("%d.%m.%Y")]

        active = [c for c in clients if c.get("status") not in ("paused", "churned")]
        live = [c for c in clients if c.get("status") == "live"]
        paused = [c for c in clients if c.get("status") == "paused"]

        lines.append(f"\nAktiv: {len(active)} | Live: {len(live)} | Pausiert: {len(paused)}")

        if live:
            lines.append("\n*Live Clients:*")
            for client in live:
                perf = await get_performance_func(client["id"])
                leads = perf.get("leads", 0) if perf else 0
                cpl = perf.get("cpl", 0) if perf else 0
                spend = perf.get("spend", 0) if perf else 0
                emoji = "🟢" if cpl < 100 else "🟡" if cpl < 200 else "🔴"
                lines.append(f"  {emoji} {client['company']}: {leads} Leads, {cpl:.0f}€ CPL, {spend:.0f}€ Spend")

        if active and not live:
            lines.append("\n*In Bearbeitung:*")
            for client in active:
                if client["status"] != "live":
                    lines.append(f"  ⏳ {client['company']}: {client.get('status', '?')}")

        await slack_post("#ff-digest", "\n".join(lines), slack_token)
        logger.info("Daily digest sent")

    except Exception as e:
        logger.error(f"Daily digest failed: {e}")


# ============================================================
# ZERO-LEAD CHECK
# ============================================================

async def zero_lead_check(
    get_live_clients_func: Callable,
    get_performance_func: Callable,
    slack_token: str,
):
    """
    Check all live clients for 0 leads in the last 72h.
    CRITICAL alert if found.
    """
    try:
        clients = await get_live_clients_func()
        for client in clients:
            launch_date = client.get("launch_date")
            if not launch_date:
                continue

            launched = datetime.fromisoformat(launch_date)
            hours_since_launch = (datetime.now(timezone.utc) - launched).total_seconds() / 3600

            if hours_since_launch < 72:
                continue  # Too early to alert

            perf = await get_performance_func(client["id"])
            if perf and perf.get("leads", 0) == 0:
                await slack_alert(
                    f"{client['company']} — 0 LEADS seit {int(hours_since_launch)}h nach Launch! Auto-Diagnose empfohlen.",
                    slack_token,
                )
                logger.warning(f"Zero-lead alert for {client['company']}")

    except Exception as e:
        logger.error(f"Zero-lead check failed: {e}")


# ============================================================
# CPL ALERT
# ============================================================

async def cpl_alert_check(
    get_live_clients_func: Callable,
    get_performance_func: Callable,
    slack_token: str,
    threshold: float = 250.0,
):
    """Alert if CPL exceeds threshold for any live client."""
    try:
        clients = await get_live_clients_func()
        for client in clients:
            perf = await get_performance_func(client["id"])
            if perf and perf.get("cpl", 0) > threshold and perf.get("leads", 0) > 0:
                await slack_alert(
                    f"{client['company']} — CPL bei {perf['cpl']:.0f}€ (Schwellwert: {threshold:.0f}€)",
                    slack_token,
                    severity="warning",
                )

    except Exception as e:
        logger.error(f"CPL alert check failed: {e}")


# ============================================================
# GHOST DETECTION
# ============================================================

async def ghost_detection(
    get_clients_func: Callable,
    slack_token: str,
    days_threshold: int = 14,
):
    """
    Detect clients with no activity for X days.
    Suggest pausing the pipeline.
    """
    try:
        clients = await get_clients_func()
        now = datetime.now(timezone.utc)

        for client in clients:
            if client.get("status") in ("paused", "churned", "live"):
                continue

            # Check last activity (simplified — use last updated timestamp)
            last_activity = client.get("updated_at") or client.get("created_at")
            if not last_activity:
                continue

            last = datetime.fromisoformat(last_activity)
            days_idle = (now - last).days

            if days_idle >= days_threshold:
                await slack_alert(
                    f"{client['company']} — Keine Aktivität seit {days_idle} Tagen. Pipeline pausieren?",
                    slack_token,
                    severity="warning",
                )

    except Exception as e:
        logger.error(f"Ghost detection failed: {e}")


# ============================================================
# HEALTH CHECK
# ============================================================

async def health_check(tokens: dict[str, str]) -> dict[str, Any]:
    """
    Check all API connections and return status.
    Called every 5 minutes + exposed at GET /api/health.
    """
    results = {}

    checks = {
        "close": ("https://api.close.com/api/v1/me/", "CLOSE_API_KEY_V2", "basic"),
        "slack": ("https://slack.com/api/auth.test", "SLACK_BOT_TOKEN", "bearer"),
        "clickup": ("https://api.clickup.com/api/v2/user", "CLICKUP_API_TOKEN", "raw"),
        "airtable": (f"https://api.airtable.com/v0/meta/bases", "AIRTABLE_API", "bearer"),
        "openrouter": ("https://openrouter.ai/api/v1/auth/key", "OPENROUTER_API_KEY", "bearer"),
        "notion": ("https://api.notion.com/v1/users/me", "NOTION_API_KEY_CLAUDIO", "bearer"),
    }

    for service, (url, token_key, auth_type) in checks.items():
        token = tokens.get(token_key, "")
        try:
            req = urllib.request.Request(url)
            if auth_type == "basic":
                import base64
                req.add_header("Authorization", "Basic " + base64.b64encode(f"{token}:".encode()).decode())
            elif auth_type == "bearer":
                req.add_header("Authorization", f"Bearer {token}")
            elif auth_type == "raw":
                req.add_header("Authorization", token)

            if service == "notion":
                req.add_header("Notion-Version", "2022-06-28")

            urllib.request.urlopen(req, timeout=10, context=SSL_CTX)
            results[service] = {"status": "ok", "message": "Connected"}

        except Exception as e:
            results[service] = {"status": "error", "message": str(e)[:100]}

    # Meta check (different auth)
    meta_token = tokens.get("META_ACCESS_TOKEN", "")
    try:
        url = f"https://graph.facebook.com/v21.0/me?access_token={meta_token}"
        urllib.request.urlopen(url, timeout=10, context=SSL_CTX)
        results["meta"] = {"status": "ok", "message": "Connected"}
    except Exception as e:
        results["meta"] = {"status": "error", "message": str(e)[:100]}

    # Summary
    ok_count = sum(1 for r in results.values() if r["status"] == "ok")
    total = len(results)

    return {
        "healthy": ok_count == total,
        "services": results,
        "ok": ok_count,
        "total": total,
        "checked_at": datetime.now(timezone.utc).isoformat(),
    }


# ============================================================
# MILESTONE CELEBRATION
# ============================================================

async def check_milestones(
    client_id: str,
    client_name: str,
    current_leads: int,
    previous_leads: int,
    slack_token: str,
    slack_channel: str,
):
    """
    Check if a lead milestone was reached and celebrate in client Slack channel.
    Milestones: 1, 10, 25, 50, 100, 250, 500
    """
    milestones = [1, 10, 25, 50, 100, 250, 500]

    for milestone in milestones:
        if previous_leads < milestone <= current_leads:
            if milestone == 1:
                msg = f"🎉 Ihre erste Bewerbung ist da! Die Kampagne läuft."
            elif milestone == 10:
                msg = f"🎉 Bereits {milestone} Bewerbungen eingegangen!"
            elif milestone == 50:
                msg = f"🚀 {milestone} Bewerbungen! Ihre Kampagne performt hervorragend."
            elif milestone == 100:
                msg = f"💯 {milestone} Bewerbungen! Ein neuer Meilenstein."
            else:
                msg = f"🎯 {milestone} Bewerbungen erreicht!"

            await slack_post(slack_channel, msg, slack_token)
            logger.info(f"Milestone {milestone} for {client_name}")
