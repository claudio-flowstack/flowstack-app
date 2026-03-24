"""
Phase 8: Post-Launch Monitoring
Nodes: v3-pl01 bis v3-cm08
Performance-Tracking, Alerts, Reports, Optimierungen nach Go-Live.
"""

import ssl
import certifi
import logging
import urllib.request

from ..integrations.meta import MetaClient
from ..integrations.slack import SlackClient
from ..integrations.ai import AIClient
from ..integrations.airtable import AirtableClient

log = logging.getLogger("v3.phase.monitoring")

meta = MetaClient()
slack = SlackClient()
ai = AIClient()
airtable = AirtableClient()

_SSL_CTX = ssl.create_default_context(cafile=certifi.where())


async def pl01(context: dict, state) -> dict:
    """Launch +24h Check — Impressions > 0?"""
    campaign_ids = context.get("campaign_ids", [])
    if not campaign_ids:
        single = context.get("campaign_id", "")
        if single:
            campaign_ids = [single]

    if not campaign_ids:
        return {"error": "Keine campaign_ids", "checked": False}

    results = {}
    all_delivering = True
    for cid in campaign_ids:
        try:
            insights = await meta._request("GET", f"{cid}/insights", {
                "fields": "impressions,clicks,spend,actions",
                "date_preset": "last_7d",
            })
            data = insights.get("data", [{}])
            row = data[0] if data else {}
            impressions = int(row.get("impressions", 0))
            results[cid] = {"impressions": impressions, "clicks": int(row.get("clicks", 0)), "spend": row.get("spend", "0")}
            if impressions == 0:
                all_delivering = False
        except Exception as e:
            log.warning(f"Insights fetch failed for {cid}: {e}")
            results[cid] = {"error": str(e)[:80]}
            all_delivering = False

    if not all_delivering:
        await slack.send_alert(f"{state.client_name} — Kampagne liefert nach 24h KEINE Impressions!", "critical")

    return {"all_delivering": all_delivering, "campaigns": results}


async def pl02(context: dict, state) -> dict:
    """Zero-Lead Alert — Leads == 0 nach Launch?"""
    campaign_ids = context.get("campaign_ids", [])
    if not campaign_ids:
        single = context.get("campaign_id", "")
        if single:
            campaign_ids = [single]

    total_leads = 0
    for cid in campaign_ids:
        try:
            insights = await meta._request("GET", f"{cid}/insights", {
                "fields": "actions",
                "date_preset": "last_7d",
            })
            data = insights.get("data", [{}])
            row = data[0] if data else {}
            actions = row.get("actions", [])
            for action in actions:
                if action.get("action_type") in ("lead", "onsite_conversion.messaging_conversation_started_7d", "offsite_conversion.fb_pixel_lead"):
                    total_leads += int(action.get("value", 0))
        except Exception as e:
            log.warning(f"Lead check failed for {cid}: {e}")

    if total_leads == 0:
        await slack.send_alert(f"{state.client_name} — ZERO Leads seit Launch! Sofortige Prüfung nötig.", "critical")

    return {"total_leads": total_leads, "zero_leads": total_leads == 0}


async def pl03(context: dict, state) -> dict:
    """Auto-Diagnose — LP erreichbar, Pixel aktiv, Formular funktioniert?"""
    checks = {}

    # LP Reachability
    lp_url = context.get("lp_url", "")
    if lp_url:
        try:
            req = urllib.request.Request(lp_url, headers={"User-Agent": "FlowstackBot/1.0"})
            resp = urllib.request.urlopen(req, timeout=15, context=_SSL_CTX)
            checks["lp"] = {"reachable": True, "status": resp.status}
        except Exception as e:
            checks["lp"] = {"reachable": False, "error": str(e)[:80]}
    else:
        checks["lp"] = {"reachable": False, "error": "Keine LP URL"}

    # Pixel Active
    try:
        pixel = await meta.verify_pixel()
        checks["pixel"] = {"active": pixel.get("active", False)}
    except Exception as e:
        checks["pixel"] = {"active": False, "error": str(e)[:80]}

    # Form Reachability
    form_url = context.get("form_url", "")
    if form_url:
        try:
            req = urllib.request.Request(form_url, headers={"User-Agent": "FlowstackBot/1.0"})
            resp = urllib.request.urlopen(req, timeout=15, context=_SSL_CTX)
            checks["form"] = {"reachable": True, "status": resp.status}
        except Exception as e:
            checks["form"] = {"reachable": False, "error": str(e)[:80]}
    else:
        checks["form"] = {"reachable": False, "error": "Keine Form URL"}

    all_ok = checks.get("lp", {}).get("reachable") and checks.get("pixel", {}).get("active") and checks.get("form", {}).get("reachable")

    if not all_ok:
        issues = []
        if not checks.get("lp", {}).get("reachable"):
            issues.append("LP nicht erreichbar")
        if not checks.get("pixel", {}).get("active"):
            issues.append("Pixel inaktiv")
        if not checks.get("form", {}).get("reachable"):
            issues.append("Formular nicht erreichbar")
        await slack.send_alert(f"{state.client_name} — Auto-Diagnose: {', '.join(issues)}", "critical")

    return {"all_ok": all_ok, "checks": checks}


async def pl05(context: dict, state) -> dict:
    """Daily Digest — Kampagnen-Performance Zusammenfassung."""
    campaign_ids = context.get("campaign_ids", [])
    if not campaign_ids:
        single = context.get("campaign_id", "")
        if single:
            campaign_ids = [single]

    total_impressions = 0
    total_clicks = 0
    total_spend = 0.0
    total_leads = 0

    for cid in campaign_ids:
        try:
            insights = await meta.get_campaign_insights(cid, "today")
            total_impressions += int(insights.get("impressions", 0))
            total_clicks += int(insights.get("clicks", 0))
            total_spend += float(insights.get("spend", 0))
            for action in insights.get("actions", []):
                if action.get("action_type") in ("lead", "offsite_conversion.fb_pixel_lead"):
                    total_leads += int(action.get("value", 0))
        except Exception as e:
            log.warning(f"Daily digest insights failed for {cid}: {e}")

    ctr = (total_clicks / total_impressions * 100) if total_impressions > 0 else 0
    cpl = (total_spend / total_leads) if total_leads > 0 else 0

    digest = (
        f"📊 Daily Digest — {state.client_name}\n"
        f"• Impressions: {total_impressions:,}\n"
        f"• Clicks: {total_clicks:,} (CTR: {ctr:.2f}%)\n"
        f"• Spend: {total_spend:.2f}€\n"
        f"• Leads: {total_leads} (CPL: {cpl:.2f}€)"
    )
    await slack.send_log(digest)

    return {
        "impressions": total_impressions,
        "clicks": total_clicks,
        "spend": total_spend,
        "leads": total_leads,
        "ctr": round(ctr, 2),
        "cpl": round(cpl, 2),
    }


async def pl06(context: dict, state) -> dict:
    """Weekly Report — Performance-Report via Gemini generieren."""
    campaign_ids = context.get("campaign_ids", [])
    if not campaign_ids:
        single = context.get("campaign_id", "")
        if single:
            campaign_ids = [single]

    weekly_data = {}
    for cid in campaign_ids:
        try:
            insights = await meta.get_campaign_insights(cid, "last_7d")
            weekly_data[cid] = insights
        except Exception as e:
            weekly_data[cid] = {"error": str(e)[:80]}

    try:
        import json
        report = await ai.generate(
            f"""Erstelle einen professionellen Wochenreport für eine Recruiting-Kampagne.

Client: {state.client_name}
Kampagnen-Daten (letzte 7 Tage):
{json.dumps(weekly_data, indent=2, ensure_ascii=False)[:4000]}

Format:
1. Executive Summary (3 Sätze)
2. Key Metrics Tabelle
3. Top-Erkenntnisse (3 Punkte)
4. Empfehlungen (3 konkrete Maßnahmen)
5. Ausblick nächste Woche

Schreibe professionell auf Deutsch.""",
            max_tokens=4000,
        )
    except Exception as e:
        log.warning(f"Weekly report generation failed: {e}")
        report = f"Weekly Report konnte nicht generiert werden: {e}"

    channel = context.get("channel_id", "")
    if channel:
        await slack.send_message(channel, f"📈 Wochenreport — {state.client_name}\n\n{report[:3000]}")

    return {"report": report, "campaigns_analyzed": len(weekly_data)}


async def pl09(context: dict, state) -> dict:
    """Ad Fatigue Detection — Frequency > 3 oder CTR dropping?"""
    campaign_ids = context.get("campaign_ids", [])
    if not campaign_ids:
        single = context.get("campaign_id", "")
        if single:
            campaign_ids = [single]

    fatigue_alerts = []
    for cid in campaign_ids:
        try:
            insights = await meta.get_campaign_insights(cid, "last_7d")
            frequency = float(insights.get("frequency", 0))
            ctr = float(insights.get("ctr", 0))

            if frequency > 3:
                fatigue_alerts.append({"campaign_id": cid, "issue": "high_frequency", "frequency": frequency})
            if ctr < 0.5 and int(insights.get("impressions", 0)) > 1000:
                fatigue_alerts.append({"campaign_id": cid, "issue": "low_ctr", "ctr": ctr})
        except Exception as e:
            log.warning(f"Fatigue check failed for {cid}: {e}")

    if fatigue_alerts:
        alerts_text = "\n".join(
            f"• {a['campaign_id']}: {a['issue']} ({'Freq: ' + str(a.get('frequency', '')) if a['issue'] == 'high_frequency' else 'CTR: ' + str(a.get('ctr', '')) + '%'})"
            for a in fatigue_alerts
        )
        await slack.send_alert(f"{state.client_name} — Ad Fatigue erkannt:\n{alerts_text}", "warning")

    return {"fatigue_detected": len(fatigue_alerts) > 0, "alerts": fatigue_alerts}


async def pl10(context: dict, state) -> dict:
    """A/B Test Empfehlungen via Gemini."""
    import json
    campaign_ids = context.get("campaign_ids", [])
    performance_data = {}
    for cid in campaign_ids:
        try:
            insights = await meta.get_campaign_insights(cid, "last_7d")
            performance_data[cid] = insights
        except Exception:
            pass

    ad_texts = context.get("ad_texts", [])
    texts_str = "\n---\n".join(ad_texts) if isinstance(ad_texts, list) else str(ad_texts)

    try:
        result = await ai.extract_json(
            f"""Analysiere diese Kampagnen-Performance und schlage A/B Tests vor.

Client: {state.client_name}
Performance:
{json.dumps(performance_data, indent=2, ensure_ascii=False)[:3000]}

Aktuelle Ad-Texte:
{texts_str[:2000]}

Antworte als JSON: {{"tests": [{{"name": "...", "hypothesis": "...", "variant_a": "...", "variant_b": "...", "metric": "...", "priority": "high|medium|low"}}], "summary": "..."}}"""
        )
    except Exception as e:
        log.warning(f"A/B test recommendations failed: {e}")
        result = {"tests": [], "summary": "AI-Empfehlungen konnten nicht generiert werden"}

    return {"ab_tests": result}


async def pl11(context: dict, state) -> dict:
    """Budget Scaling Suggestions — basierend auf Performance."""
    campaign_ids = context.get("campaign_ids", [])
    if not campaign_ids:
        single = context.get("campaign_id", "")
        if single:
            campaign_ids = [single]

    suggestions = []
    for cid in campaign_ids:
        try:
            insights = await meta.get_campaign_insights(cid, "last_7d")
            spend = float(insights.get("spend", 0))
            leads = 0
            for action in insights.get("actions", []):
                if action.get("action_type") in ("lead", "offsite_conversion.fb_pixel_lead"):
                    leads += int(action.get("value", 0))

            cpl = (spend / leads) if leads > 0 else 0
            target_cpl = float(context.get("target_cpl", 50))

            if leads > 0 and cpl < target_cpl * 0.7:
                suggestions.append({"campaign_id": cid, "action": "scale_up", "reason": f"CPL {cpl:.0f}€ deutlich unter Ziel {target_cpl:.0f}€", "recommendation": "Budget um 20-30% erhöhen"})
            elif leads > 0 and cpl > target_cpl * 1.5:
                suggestions.append({"campaign_id": cid, "action": "reduce", "reason": f"CPL {cpl:.0f}€ deutlich über Ziel {target_cpl:.0f}€", "recommendation": "Budget reduzieren, Creatives prüfen"})
            elif leads == 0 and spend > 50:
                suggestions.append({"campaign_id": cid, "action": "pause_review", "reason": f"{spend:.0f}€ Spend ohne Leads", "recommendation": "Kampagne pausieren und Funnel prüfen"})
        except Exception as e:
            log.warning(f"Budget analysis failed for {cid}: {e}")

    return {"suggestions": suggestions, "has_recommendations": len(suggestions) > 0}


async def pl12(context: dict, state) -> dict:
    """Lead Quality Scoring via Gemini."""
    import json
    leads_data = context.get("leads_data", [])
    if not leads_data:
        return {"scored": False, "reason": "Keine Lead-Daten vorhanden"}

    try:
        result = await ai.extract_json(
            f"""Bewerte die Qualität dieser Recruiting-Leads für {state.client_name}.

LEADS:
{json.dumps(leads_data, indent=2, ensure_ascii=False)[:5000]}

Bewertungskriterien:
- Vollständigkeit der Angaben (Name, Kontakt, Rolle)
- Relevanz für die ausgeschriebene Stelle
- Berufserfahrung
- Verfügbarkeit/Wechselbereitschaft

Antworte als JSON: {{"leads": [{{"lead_index": 0, "score": 0-100, "tier": "A|B|C", "reason": "..."}}], "avg_score": 0-100, "tier_distribution": {{"A": 0, "B": 0, "C": 0}}, "summary": "..."}}"""
        )
    except Exception as e:
        log.warning(f"Lead quality scoring failed: {e}")
        result = {"leads": [], "avg_score": 0, "summary": "Scoring fehlgeschlagen"}

    return {"quality_scoring": result}


async def pl_winners(context: dict, state) -> dict:
    """Winners Library — Top Ads identifizieren und in Airtable speichern."""
    campaign_ids = context.get("campaign_ids", [])
    if not campaign_ids:
        single = context.get("campaign_id", "")
        if single:
            campaign_ids = [single]

    top_ads = []
    for cid in campaign_ids:
        try:
            insights = await meta._request("GET", f"{cid}/insights", {
                "fields": "impressions,clicks,spend,actions,ctr",
                "date_preset": "last_7d",
                "level": "ad",
            })
            for row in insights.get("data", []):
                impressions = int(row.get("impressions", 0))
                ctr = float(row.get("ctr", 0))
                leads = 0
                for action in row.get("actions", []):
                    if action.get("action_type") in ("lead", "offsite_conversion.fb_pixel_lead"):
                        leads += int(action.get("value", 0))
                if ctr > 1.0 or leads > 0:
                    top_ads.append({
                        "campaign_id": cid,
                        "impressions": impressions,
                        "ctr": ctr,
                        "leads": leads,
                        "spend": row.get("spend", "0"),
                    })
        except Exception as e:
            log.warning(f"Winners fetch failed for {cid}: {e}")

    # Top Ads nach CTR sortieren
    top_ads.sort(key=lambda x: x.get("ctr", 0), reverse=True)
    winners = top_ads[:5]

    # In Airtable Winners Tabelle speichern
    saved = 0
    for ad in winners:
        try:
            await airtable.create_record("WINNERS", {
                "Client": state.client_name,
                "Campaign ID": ad.get("campaign_id", ""),
                "Impressions": ad.get("impressions", 0),
                "CTR": ad.get("ctr", 0),
                "Leads": ad.get("leads", 0),
                "Spend": ad.get("spend", "0"),
            })
            saved += 1
        except Exception as e:
            log.warning(f"Airtable winner save failed: {e}")

    return {"winners": winners, "saved_to_airtable": saved}


async def cm08(context: dict, state) -> dict:
    """Milestone Celebration — Slack bei Lead-Meilensteinen."""
    total_leads = context.get("total_leads", 0)
    milestones = [10, 25, 50, 100, 250, 500, 1000]

    hit_milestone = None
    for m in milestones:
        if total_leads >= m:
            hit_milestone = m

    if not hit_milestone:
        return {"milestone": None, "celebrated": False}

    # Prüfen ob Milestone schon gefeiert wurde
    celebrated_key = f"milestone_{hit_milestone}_celebrated"
    if context.get(celebrated_key):
        return {"milestone": hit_milestone, "celebrated": False, "already_done": True}

    channel = context.get("channel_id", "")
    message = f"🎉 {state.client_name} — Meilenstein erreicht: {hit_milestone} Leads! Weiter so!"

    if channel:
        await slack.send_message(channel, message)
    await slack.send_log(message)

    return {"milestone": hit_milestone, "celebrated": True, celebrated_key: True}


MONITORING_HANDLERS = {
    "v3-pl01": pl01,
    "v3-pl02": pl02,
    "v3-pl03": pl03,
    "v3-pl05": pl05,
    "v3-pl06": pl06,
    "v3-pl09": pl09,
    "v3-pl10": pl10,
    "v3-pl11": pl11,
    "v3-pl12": pl12,
    "v3-pl-winners": pl_winners,
    "v3-cm08": cm08,
}
