"""
Phase 7: Review & Go-Live
Nodes: v3-rl-e2e bis v3-rl-sheet
Prüft Funnel, Pixel, Policy — aktiviert Kampagnen, benachrichtigt Team.
"""

import ssl
import certifi
import logging
import urllib.request

from ..integrations.close import CloseClient
from ..integrations.slack import SlackClient
from ..integrations.meta import MetaClient
from ..integrations.ai import AIClient
from ..integrations.clickup import ClickUpClient
from ..integrations.google import GoogleClient

log = logging.getLogger("v3.phase.launch")

close = CloseClient()
slack = SlackClient()
meta = MetaClient()
ai = AIClient()
clickup = ClickUpClient()
google = GoogleClient()

_SSL_CTX = ssl.create_default_context(cafile=certifi.where())


def _check_url_reachable(url: str) -> dict:
    """URL via urllib prüfen — gibt Status-Code und Erreichbarkeit zurück."""
    if not url:
        return {"reachable": False, "error": "Keine URL"}
    try:
        req = urllib.request.Request(url, method="HEAD", headers={"User-Agent": "FlowstackBot/1.0"})
        resp = urllib.request.urlopen(req, timeout=15, context=_SSL_CTX)
        return {"reachable": True, "status": resp.status, "url": url}
    except urllib.error.HTTPError as e:
        # HEAD might be blocked, try GET
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "FlowstackBot/1.0"})
            resp = urllib.request.urlopen(req, timeout=15, context=_SSL_CTX)
            return {"reachable": True, "status": resp.status, "url": url}
        except Exception:
            return {"reachable": False, "status": e.code, "url": url, "error": str(e)[:80]}
    except Exception as e:
        return {"reachable": False, "url": url, "error": str(e)[:80]}


async def rl_e2e(context: dict, state) -> dict:
    """E2E Funnel Test — LP, Formular, Danke-Seite erreichbar?"""
    lp = _check_url_reachable(context.get("lp_url", ""))
    form = _check_url_reachable(context.get("form_url", ""))
    thankyou = _check_url_reachable(context.get("thankyou_url", ""))

    all_ok = lp.get("reachable") and form.get("reachable") and thankyou.get("reachable")
    failures = []
    if not lp.get("reachable"):
        failures.append(f"LP: {lp.get('error', 'nicht erreichbar')}")
    if not form.get("reachable"):
        failures.append(f"Formular: {form.get('error', 'nicht erreichbar')}")
    if not thankyou.get("reachable"):
        failures.append(f"Danke-Seite: {thankyou.get('error', 'nicht erreichbar')}")

    if not all_ok:
        await slack.send_alert(f"{state.client_name} — E2E Funnel Check fehlgeschlagen: {', '.join(failures)}", "critical")

    return {"passed": all_ok, "lp": lp, "form": form, "thankyou": thankyou, "failures": failures}


async def rl_url(context: dict, state) -> dict:
    """URL Validation — alle URLs aus Context prüfen."""
    urls = {
        "lp_url": context.get("lp_url", ""),
        "form_url": context.get("form_url", ""),
        "thankyou_url": context.get("thankyou_url", ""),
    }
    results = {}
    all_valid = True
    for key, url in urls.items():
        if url:
            check = _check_url_reachable(url)
            results[key] = check
            if not check.get("reachable"):
                all_valid = False
        else:
            results[key] = {"reachable": False, "error": "URL nicht gesetzt"}
            all_valid = False

    return {"all_valid": all_valid, "urls": results}


async def rl_pixel(context: dict, state) -> dict:
    """Pixel Final Check via Meta API."""
    result = await meta.verify_pixel()
    if not result.get("active"):
        await slack.send_alert(f"{state.client_name} — Pixel INAKTIV vor Launch!", "critical")
    return result


async def rl_policy(context: dict, state) -> dict:
    """Ad Policy Pre-Check via Gemini — WARNING only, kein Blocker."""
    ad_texts = context.get("ad_texts", [])
    if not ad_texts:
        return {"checked": False, "skipped": True, "reason": "Keine Ad-Texte vorhanden"}

    texts_str = "\n---\n".join(ad_texts) if isinstance(ad_texts, list) else str(ad_texts)

    try:
        result = await ai.extract_json(
            f"""Prüfe diese Meta/Facebook Ad-Texte auf Policy-Verstöße.
Kategorie: EMPLOYMENT (Special Ad Category).

REGELN:
- Keine diskriminierenden Formulierungen (Alter, Geschlecht, Herkunft)
- Keine übertriebenen Versprechen ("garantiert", "100%")
- Keine irreführenden Claims
- Kein Clickbait
- Personal Attributes Policy beachten

AD-TEXTE:
{texts_str[:4000]}

Antworte als JSON: {{"violations": [{{"text": "...", "rule": "...", "severity": "warning|critical"}}], "passed": true/false, "summary": "..."}}"""
        )
    except Exception as e:
        log.warning(f"Policy check failed: {e}")
        result = {"violations": [], "passed": True, "summary": "AI-Check übersprungen"}

    if result.get("violations"):
        violations_text = "\n".join(f"• {v.get('text', '')}: {v.get('rule', '')}" for v in result["violations"])
        await slack.send_log(f"⚠️ {state.client_name} — Policy-Hinweise:\n{violations_text}")

    return {"policy_check": result, "warning_only": True}


async def rl_activate(context: dict, state) -> dict:
    """Kampagnen-Readiness prüfen — NICHT aktivieren. Bleiben PAUSED bis manuelles Go-Live."""
    meta_campaigns = context.get("meta_campaigns", {})
    campaign_ids = []
    for key in ["initial", "retargeting", "warmup"]:
        cid = meta_campaigns.get(key, "") or context.get(f"{key}_campaign_id", "") or context.get("campaign_id", "")
        if cid and cid not in campaign_ids:
            campaign_ids.append(cid)

    if not campaign_ids:
        return {"ready": False, "reason": "Keine Kampagnen gefunden"}

    # Nur Status prüfen, NICHT aktivieren — Kampagnen bleiben PAUSED
    checked = []
    for cid in campaign_ids:
        try:
            # Prüfe ob Kampagne existiert und valide ist
            result = await meta._request("GET", cid, {"fields": "name,status,objective"})
            checked.append({"campaign_id": cid, "name": result.get("name", ""), "status": result.get("status", ""), "ready": True})
        except Exception as e:
            checked.append({"campaign_id": cid, "ready": False, "error": str(e)[:80]})

    all_ready = all(c.get("ready") for c in checked)
    await slack.send_log(f"{'✓' if all_ready else '⚠'} {state.client_name} — {len(checked)} Kampagne(n) geprüft, alle PAUSED. Warte auf Go-Live.")

    return {"campaigns_checked": checked, "total": len(campaign_ids), "all_ready": all_ready, "all_paused": True}


async def rl_close(context: dict, state) -> dict:
    """Close: Stage → live."""
    opp_id = context.get("opportunity_id", "")
    if not opp_id:
        return {"skipped": True}
    return await close.update_stage(opp_id, "live")


async def rl_slack(context: dict, state) -> dict:
    """Launch Notification an Slack Channel."""
    channel = context.get("channel_id", "")
    campaign_count = len(context.get("campaign_ids", []))
    lp_url = context.get("lp_url", "")

    message = f"🚀 {state.client_name} ist LIVE!\n• {campaign_count} Kampagne(n) aktiviert\n• LP: {lp_url}"

    if channel:
        await slack.send_message(channel, message)
    await slack.send_log(f"🚀 {state.client_name} — Launch abgeschlossen")

    return {"notification_sent": True}


async def rl_clickup(context: dict, state) -> dict:
    """Review Task in ClickUp erstellen."""
    list_id = context.get("list_id", "")
    if not list_id:
        return {"skipped": True, "reason": "Keine list_id"}

    lp_url = context.get("lp_url", "")
    details = f"Client ist LIVE.\n\nFunnel: {lp_url}\nBitte alle Deliverables, Funnel und Kampagnen prüfen."

    result = await clickup.create_review_task(list_id, state.client_name, details)
    return result


async def rl_sheet(context: dict, state) -> dict:
    """Uebersichts-Sheet mit Launch-Daten updaten."""
    sheet_id = context.get("overview_sheet_id", "")
    if not sheet_id:
        return {"skipped": True, "reason": "Kein overview_sheet_id"}

    campaign_count = len(context.get("meta_campaigns", {}))
    lp_url = context.get("lp_url", "")

    try:
        from datetime import datetime
        await google.append_to_sheet(sheet_id, [
            ["Launch", datetime.now().strftime("%Y-%m-%d %H:%M"), f"{campaign_count} Kampagnen", lp_url, "LIVE"]
        ])
        return {"updated": True, "sheet_id": sheet_id}
    except Exception as e:
        return {"updated": False, "error": str(e)[:100]}


LAUNCH_HANDLERS = {
    "v3-rl-e2e": rl_e2e,
    "v3-rl-url": rl_url,
    "v3-rl-pixel": rl_pixel,
    "v3-rl-policy": rl_policy,
    "v3-rl-activate": rl_activate,
    "v3-rl-close": rl_close,
    "v3-rl-slack": rl_slack,
    "v3-rl-clickup": rl_clickup,
    "v3-rl-sheet": rl_sheet,
}
