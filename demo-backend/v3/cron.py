"""
V3 Cron Jobs — APScheduler Tasks.
Health Checks, Token Refresh, Digests, Reports, Monitoring.
Alle Jobs sind ECHT implementiert — keine Stubs.
"""

import json as _json
import ssl
import logging
import certifi
import urllib.request
from .integrations.google import GoogleClient
from .integrations.slack import SlackClient
from .integrations.meta import MetaClient
from .integrations.ai import AIClient
from .integrations.airtable import AirtableClient
from .resilience.state import ExecutionState

import time as _time

log = logging.getLogger("v3.cron")

google = GoogleClient()
slack = SlackClient()
meta = MetaClient()
ai = AIClient()
airtable = AirtableClient()

# Alert deduplication: avoid spamming Slack with identical messages
_last_alerts: dict[int, float] = {}


def _should_alert(msg: str, cooldown_min: int = 30) -> bool:
    """Returns True if this message hasn't been sent recently."""
    h = hash(msg)
    now = _time.time()
    if h in _last_alerts and (now - _last_alerts[h]) < cooldown_min * 60:
        return False
    _last_alerts[h] = now
    return True

_SSL_CTX = ssl.create_default_context(cafile=certifi.where())


def _get_active_campaigns() -> list:
    """Alle aktiven Executions mit campaign_ids sammeln."""
    results = []
    for ex_summary in ExecutionState.list_all():
        state = ExecutionState.load(ex_summary["execution_id"])
        if not state or state.completed_at:
            continue
        campaign_ids = state.context.get("campaign_ids", [])
        single = state.context.get("campaign_id", "")
        if single and not campaign_ids:
            campaign_ids = [single]
        if campaign_ids:
            results.append({"state": state, "campaign_ids": campaign_ids})
    return results


def setup_cron(app):
    """APScheduler Cron Jobs registrieren."""
    try:
        from apscheduler.schedulers.asyncio import AsyncIOScheduler
    except ImportError:
        log.warning("APScheduler nicht installiert — Cron Jobs deaktiviert")
        return

    scheduler = AsyncIOScheduler()

    # ── Every 5 min: Health Check ────────────────────────────
    async def _health():
        services = {}
        for name, client in [("google", google), ("slack", slack), ("meta", meta), ("ai", ai), ("airtable", airtable)]:
            try:
                services[name] = await client.health_check()
            except Exception as e:
                services[name] = {"status": "error", "message": str(e)[:80]}

        failed = [s for s, info in services.items() if info.get("status") != "ok"]
        if failed:
            msg = f"Health Check: {', '.join(failed)} nicht erreichbar"
            if _should_alert(msg):
                try:
                    await slack.send_alert(msg, "warning")
                except Exception:
                    log.error(f"Health check failed services: {failed}")
        else:
            log.info("Health check: alle Services OK")

    scheduler.add_job(_health, "interval", minutes=5, id="v3_health")

    # ── Every 25 min: Google Token Refresh ───────────────────
    async def _token_refresh():
        try:
            token = google._get_token()
            if token:
                log.info("Google Token refreshed OK")
            else:
                await slack.send_alert("Google Token Refresh fehlgeschlagen — Token leer", "critical")
        except Exception as e:
            log.error(f"Token refresh failed: {e}")
            try:
                await slack.send_alert(f"Google Token Refresh Fehler: {str(e)[:100]}", "critical")
            except Exception:
                pass

    scheduler.add_job(_token_refresh, "interval", minutes=25, id="v3_token_refresh")

    # ── Hourly: Approval Escalation Check ────────────────────
    async def _escalations():
        from datetime import datetime, timezone, timedelta
        cutoff_24h = (datetime.now(timezone.utc) - timedelta(hours=24)).isoformat()
        cutoff_48h = (datetime.now(timezone.utc) - timedelta(hours=48)).isoformat()

        for ex_summary in ExecutionState.list_all():
            state = ExecutionState.load(ex_summary["execution_id"])
            if not state:
                continue
            for node_id, node_info in state.nodes.items():
                if node_info.get("status") == "waiting_approval":
                    updated = node_info.get("updated_at", "")
                    if not updated:
                        continue
                    if updated < cutoff_48h:
                        try:
                            channel = state.context.get("channel_id", "")
                            msg = (
                                f"KRITISCH: {state.client_name} — Approval '{node_id}' wartet seit >48h!\n"
                                f"Execution blockiert. Bitte SOFORT freigeben oder ablehnen."
                            )
                            await slack.send_alert(msg, "critical")
                            if channel:
                                await slack.send_message(channel, msg)
                        except Exception:
                            pass
                    elif updated < cutoff_24h:
                        try:
                            await slack.send_alert(
                                f"{state.client_name} — Approval '{node_id}' wartet seit >24h! Bitte pruefen.",
                                "warning",
                            )
                        except Exception:
                            pass

    scheduler.add_job(_escalations, "cron", minute=0, id="v3_escalations")

    # ── Every 4h: Nudge Check ────────────────────────────────
    async def _nudges():
        for ex_summary in ExecutionState.list_all():
            state = ExecutionState.load(ex_summary["execution_id"])
            if not state or state.completed_at or state.paused_at:
                continue
            for node_id, node_info in state.nodes.items():
                if node_info.get("status") in ("waiting_approval", "blocked"):
                    channel = state.context.get("channel_id", "")
                    if channel:
                        try:
                            await slack.send_message(
                                channel,
                                f"Erinnerung: {state.client_name} — Node '{node_id}' wartet auf Aktion.",
                            )
                        except Exception:
                            pass

    scheduler.add_job(_nudges, "interval", hours=4, id="v3_nudges")

    # ── Daily 09:00: Daily Digest ────────────────────────────
    async def _daily_digest():
        active = [e for e in ExecutionState.list_all() if not e.get("completed_at")]
        summary = f"V3 Daily Digest — {len(active)} aktive Clients"
        for ex in active[:10]:
            summary += f"\n  {ex.get('client_name', '?')}: {ex.get('completed_nodes', 0)}/{ex.get('node_count', 0)} Nodes"
        try:
            await slack.send_log(summary)
        except Exception as e:
            log.warning(f"Daily digest failed: {e}")

    scheduler.add_job(_daily_digest, "cron", hour=9, minute=0, id="v3_daily_digest")

    # ── Friday 16:00: Weekly Report ──────────────────────────
    async def _weekly_report():
        for entry in _get_active_campaigns():
            state = entry["state"]
            weekly_data = {}
            for cid in entry["campaign_ids"]:
                try:
                    insights = await meta.get_campaign_insights(cid, "last_7d")
                    weekly_data[cid] = insights
                except Exception as e:
                    weekly_data[cid] = {"error": str(e)[:80]}

            try:
                report = await ai.generate(
                    f"Erstelle einen kurzen Wochenreport fuer {state.client_name}.\n"
                    f"Daten: {_json.dumps(weekly_data, indent=2, ensure_ascii=False)[:3000]}\n"
                    f"Format: Executive Summary, Key Metrics, 3 Empfehlungen. Deutsch.",
                    max_tokens=2000,
                )
            except Exception as e:
                report = f"Report konnte nicht generiert werden: {e}"

            channel = state.context.get("channel_id", "")
            if channel:
                try:
                    await slack.send_message(channel, f"Weekly Report — {state.client_name}\n\n{report[:3000]}")
                except Exception:
                    pass

        try:
            await slack.send_log("V3 Weekly Reports abgeschlossen")
        except Exception:
            pass

    scheduler.add_job(_weekly_report, "cron", day_of_week="fri", hour=16, id="v3_weekly_report")

    # ── 1st of Month 10:00: Monthly Report ───────────────────
    async def _monthly_report():
        active = _get_active_campaigns()
        if not active:
            log.info("Monthly report: keine aktiven Kampagnen")
            return

        summary = f"V3 Monthly Report — {len(active)} aktive Clients\n"
        for entry in active:
            state = entry["state"]
            total_spend = 0.0
            total_leads = 0
            for cid in entry["campaign_ids"]:
                try:
                    insights = await meta.get_campaign_insights(cid, "last_30d")
                    total_spend += float(insights.get("spend", 0))
                    for action in insights.get("actions", []):
                        if action.get("action_type") in ("lead", "offsite_conversion.fb_pixel_lead"):
                            total_leads += int(action.get("value", 0))
                except Exception:
                    pass
            cpl = (total_spend / total_leads) if total_leads > 0 else 0
            summary += f"\n  {state.client_name}: {total_spend:.0f}EUR Spend, {total_leads} Leads, CPL {cpl:.0f}EUR"

        try:
            await slack.send_log(summary)
        except Exception as e:
            log.warning(f"Monthly report failed: {e}")

    scheduler.add_job(_monthly_report, "cron", day=1, hour=10, id="v3_monthly_report")

    # ── Daily 06:00: Meta Performance Sync ───────────────────
    async def _meta_sync():
        for entry in _get_active_campaigns():
            state = entry["state"]
            for cid in entry["campaign_ids"]:
                try:
                    insights = await meta.get_campaign_insights(cid, "yesterday")
                    await airtable.create_record("PERFORMANCE", {
                        "Client": state.client_name,
                        "Campaign ID": cid,
                        "Impressions": int(insights.get("impressions", 0)),
                        "Clicks": int(insights.get("clicks", 0)),
                        "Spend": str(round(float(insights.get("spend", 0)), 2)),
                        "CTR": str(round(float(insights.get("ctr", 0)), 2)),
                    })
                except Exception as e:
                    log.warning(f"Meta sync failed for {cid}: {e}")

        log.info("Meta performance sync completed")

    scheduler.add_job(_meta_sync, "cron", hour=6, id="v3_meta_sync")

    # ── Daily 10:00: Ghost Detection ─────────────────────────
    async def _ghost_detection():
        for entry in _get_active_campaigns():
            state = entry["state"]
            if state.nodes.get("v3-rl-activate", {}).get("status") != "completed":
                continue
            for cid in entry["campaign_ids"]:
                try:
                    insights = await meta.get_campaign_insights(cid, "last_7d")
                    if int(insights.get("impressions", 0)) == 0:
                        await slack.send_alert(f"{state.client_name} — Kampagne {cid} hat 0 Impressions nach Launch!", "critical")
                except Exception as e:
                    log.warning(f"Ghost detection failed for {cid}: {e}")

    scheduler.add_job(_ghost_detection, "cron", hour=10, id="v3_ghost")

    # ── Every 6h: CPL Alert ──────────────────────────────────
    async def _cpl_alert():
        for entry in _get_active_campaigns():
            state = entry["state"]
            target_cpl = float(state.context.get("target_cpl", 50))
            for cid in entry["campaign_ids"]:
                try:
                    insights = await meta.get_campaign_insights(cid, "last_7d")
                    spend = float(insights.get("spend", 0))
                    leads = 0
                    for action in insights.get("actions", []):
                        if action.get("action_type") in ("lead", "offsite_conversion.fb_pixel_lead"):
                            leads += int(action.get("value", 0))
                    if leads > 0:
                        cpl = spend / leads
                        if cpl > target_cpl * 1.5:
                            await slack.send_alert(
                                f"{state.client_name} — CPL {cpl:.0f}EUR liegt {((cpl / target_cpl) - 1) * 100:.0f}% ueber Ziel ({target_cpl:.0f}EUR)!",
                                "warning",
                            )
                except Exception as e:
                    log.warning(f"CPL alert failed for {cid}: {e}")

    scheduler.add_job(_cpl_alert, "interval", hours=6, id="v3_cpl_alert")

    # ── Monday 08:00: Ad Fatigue ─────────────────────────────
    async def _ad_fatigue():
        for entry in _get_active_campaigns():
            state = entry["state"]
            for cid in entry["campaign_ids"]:
                try:
                    insights = await meta.get_campaign_insights(cid, "last_7d")
                    frequency = float(insights.get("frequency", 0))
                    ctr = float(insights.get("ctr", 0))
                    impressions = int(insights.get("impressions", 0))
                    if frequency > 3:
                        await slack.send_alert(f"{state.client_name} — Ad Fatigue: Frequency {frequency:.1f} (Kampagne {cid})", "warning")
                    if ctr < 0.5 and impressions > 1000:
                        await slack.send_alert(f"{state.client_name} — Niedrige CTR: {ctr:.2f}% bei {impressions} Impressions ({cid})", "warning")
                except Exception as e:
                    log.warning(f"Ad fatigue check failed for {cid}: {e}")

    scheduler.add_job(_ad_fatigue, "cron", day_of_week="mon", hour=8, id="v3_ad_fatigue")

    # ── Daily 22:00: DLQ Digest ──────────────────────────────
    async def _dlq_digest():
        failed_nodes = []
        for ex_summary in ExecutionState.list_all():
            state = ExecutionState.load(ex_summary["execution_id"])
            if not state:
                continue
            for node_id, node_info in state.nodes.items():
                if node_info.get("status") in ("failed", "blocked"):
                    failed_nodes.append(f"  {state.client_name} — {node_id}: {node_info.get('error', '?')[:60]}")

        if failed_nodes:
            summary = f"DLQ Digest — {len(failed_nodes)} fehlgeschlagene Nodes:\n" + "\n".join(failed_nodes[:20])
            try:
                await slack.send_alert(summary, "warning")
            except Exception as e:
                log.warning(f"DLQ digest failed: {e}")
        else:
            log.info("DLQ digest: keine fehlgeschlagenen Nodes")

    scheduler.add_job(_dlq_digest, "cron", hour=22, id="v3_dlq_digest")

    # ── Sunday 06:00: URL Re-Check (NEU) ─────────────────────
    async def _url_recheck():
        for ex_summary in ExecutionState.list_all():
            state = ExecutionState.load(ex_summary["execution_id"])
            if not state or state.completed_at:
                continue
            for url_key in ("lp_url", "form_url", "thankyou_url"):
                url = state.context.get(url_key, "")
                if not url:
                    continue
                try:
                    req = urllib.request.Request(url, headers={"User-Agent": "FlowstackBot/1.0"})
                    urllib.request.urlopen(req, timeout=15, context=_SSL_CTX)
                except Exception as e:
                    try:
                        await slack.send_alert(f"{state.client_name} — {url_key} nicht erreichbar: {str(e)[:80]}", "warning")
                    except Exception:
                        pass

        log.info("URL recheck completed")

    scheduler.add_job(_url_recheck, "cron", day_of_week="sun", hour=6, id="v3_url_recheck")

    # ── Sunday 07:00: Pixel Re-Check (NEU) ───────────────────
    async def _pixel_recheck():
        for entry in _get_active_campaigns():
            state = entry["state"]
            if state.nodes.get("v3-rl-activate", {}).get("status") != "completed":
                continue
            try:
                pixel = await meta.verify_pixel()
                if not pixel.get("active"):
                    await slack.send_alert(f"{state.client_name} — Pixel inaktiv bei Recheck!", "critical")
            except Exception as e:
                log.warning(f"Pixel recheck failed for {state.client_name}: {e}")

        log.info("Pixel recheck completed")

    scheduler.add_job(_pixel_recheck, "cron", day_of_week="sun", hour=7, id="v3_pixel_recheck")

    # ── Startup ──────────────────────────────────────────────
    @app.on_event("startup")
    async def _start_scheduler():
        scheduler.start()
        log.info(f"V3 APScheduler gestartet — {len(scheduler.get_jobs())} Jobs registriert")

    return scheduler
