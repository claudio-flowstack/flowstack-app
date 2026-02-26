"""
Test-Skript: Jeden Workflow-Node einzeln triggern und Ergebnisse prüfen.
Startet mit: python test-workflow.py

Voraussetzung: Server läuft auf http://localhost:3002
"""
import asyncio
import httpx
import json
import sys
from datetime import datetime

BASE = "http://localhost:3002"
PASS = "✅"
FAIL = "❌"
SKIP = "⏭️"

context = {
    "company": "Testfirma GmbH",
    "email": "clazahlungskonto@gmail.com",
}

created_resources = {}  # Für Cleanup am Ende


async def call(node_id: str, extra_context: dict | None = None):
    """Einen Node triggern und Ergebnis zurückgeben."""
    ctx = {**context, **(extra_context or {})}
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(
            f"{BASE}/api/execute-node",
            json={"nodeId": node_id, "context": ctx},
        )
    data = resp.json()
    return resp.status_code, data


def update_context(result: dict):
    """Context mit Node-Ergebnis anreichern (wie side-effects.ts)."""
    if not result:
        return
    if result.get("lead_id"):
        context["lead_id"] = result["lead_id"]
    if result.get("opportunity_id"):
        context["opportunity_id"] = result["opportunity_id"]
    if result.get("list_id"):
        context["list_id"] = result["list_id"]
    if result.get("root_id"):
        context["folder_root_id"] = result["root_id"]
    if result.get("event_id"):
        context["event_id"] = result["event_id"]
    if result.get("channel_id"):
        context["channel_id"] = result["channel_id"]
    if result.get("task_ids"):
        context["task_ids"] = {**context.get("task_ids", {}), **result["task_ids"]}
    if result.get("meta_campaigns"):
        context["meta_campaigns"] = {**context.get("meta_campaigns", {}), **result["meta_campaigns"]}
    if result.get("image_hashes"):
        context["image_hashes"] = result["image_hashes"]


def log_result(node_id: str, label: str, status: int, data: dict):
    """Ergebnis formatiert ausgeben."""
    ok = data.get("ok", False)
    result = data.get("result", {})
    error = data.get("error") or result.get("error")
    icon = PASS if ok and not error else FAIL

    print(f"\n{'='*60}")
    print(f"{icon} {node_id} — {label}")
    print(f"   HTTP: {status} | ok: {ok}")

    if error:
        print(f"   ERROR: {error}")

    # Wichtige Felder
    for key in ["lead_id", "opportunity_id", "list_id", "root_id", "event_id",
                 "channel_id", "meet_link", "link", "url", "campaign_id",
                 "meta_campaigns", "image_hashes", "adset_ids", "task_ids",
                 "sent", "skipped", "reason"]:
        val = result.get(key)
        if val is not None:
            if isinstance(val, (dict, list)):
                print(f"   {key}: {json.dumps(val, indent=2)[:200]}")
            else:
                print(f"   {key}: {val}")


async def test_node(node_id: str, label: str, extra_context: dict | None = None):
    """Node testen, Context updaten, Ergebnis loggen."""
    try:
        status, data = await call(node_id, extra_context)
        result = data.get("result", {})
        log_result(node_id, label, status, data)
        update_context(result)
        return data.get("ok", False), result
    except Exception as e:
        print(f"\n{FAIL} {node_id} — {label}")
        print(f"   EXCEPTION: {e}")
        return False, {}


async def cleanup():
    """Erstellte Ressourcen aufräumen."""
    print(f"\n{'='*60}")
    print("🧹 Cleanup...")
    payload = {
        "lead_id": context.get("lead_id"),
        "list_id": context.get("list_id"),
        "folder_root_id": context.get("folder_root_id"),
        "event_id": context.get("event_id"),
        "channel_id": context.get("channel_id"),
        "meta_campaign_ids": list((context.get("meta_campaigns") or {}).values()),
    }
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(f"{BASE}/api/cleanup", json=payload)
    data = resp.json()
    print(f"   Gelöscht: {data.get('deleted', [])}")
    if data.get("errors"):
        print(f"   Fehler: {data['errors']}")


async def main():
    # Health Check
    print("🏥 Health Check...")
    async with httpx.AsyncClient(timeout=5) as client:
        try:
            resp = await client.get(f"{BASE}/health")
            health = resp.json()
            print(f"   Status: {health.get('status')}")
            print(f"   Close: {health.get('close')} | ClickUp: {health.get('clickup')}")
            print(f"   Slack: {health.get('slack')} | Google: {health.get('google')}")
            print(f"   Meta: {health.get('meta')} | Stages: {health.get('stages')}")
        except Exception as e:
            print(f"   {FAIL} Server nicht erreichbar: {e}")
            sys.exit(1)

    print(f"\n{'#'*60}")
    print(f"# WORKFLOW TEST — {datetime.now().strftime('%d.%m.%Y %H:%M')}")
    print(f"# Company: {context['company']}")
    print(f"{'#'*60}")

    # ── Phase 2: Infrastructure Setup ──
    print(f"\n{'─'*60}")
    print("📋 PHASE 2: Infrastructure Setup")
    print(f"{'─'*60}")

    await test_node("is02", "Close: Lead erstellen")
    await test_node("is03", "Slack: Neuer Client + Channel")
    await test_node("is04", "Gmail: Welcome Email")
    await test_node("is05", "Google Calendar: Kickoff + Meet")
    await test_node("is06", "Google Drive: Ordnerstruktur")
    await test_node("is08", "ClickUp: Projekt erstellen")
    await test_node("is09", "ClickUp: Tasks erstellen")
    await test_node("is10", "Close: Kickoff Scheduled")

    # ── Phase 3: Kickoff ──
    print(f"\n{'─'*60}")
    print("📞 PHASE 3: Kickoff")
    print(f"{'─'*60}")

    await test_node("kc05", "Close: Kickoff Completed")
    await test_node("kc06", "Slack: Call fertig")

    # ── Phase 4: Strategy ──
    print(f"\n{'─'*60}")
    print("🎯 PHASE 4: Strategy")
    print(f"{'─'*60}")

    await test_node("st10", "Close: Strategy Generated")

    # ── Phase 5: Copy ──
    print(f"\n{'─'*60}")
    print("✏️ PHASE 5: Copy Creation")
    print(f"{'─'*60}")

    await test_node("cc05", "Close: Assets Generated")

    # ── Phase 7: Meta Kampagnen ──
    print(f"\n{'─'*60}")
    print("📣 PHASE 7: Meta Kampagnen")
    print(f"{'─'*60}")

    # Audiences (parallel im Workflow, hier sequentiell)
    await test_node("ca01", "Meta: Custom Audience AllVisitors")
    await test_node("ca02", "Meta: Custom Audience LP_NoApp")
    await test_node("ca03", "Meta: Custom Audience App_NoLead")

    # Kampagnen + Ad Sets (sequentiell, wie im Workflow)
    await test_node("ca04", "Meta: Initial-Kampagne + Bild-Upload")
    await test_node("ca05", "Meta: Initial Ad Sets + Ads")
    await test_node("ca06", "Meta: Retargeting-Kampagne")
    await test_node("ca07", "Meta: Retargeting Ad Sets + Ads")
    await test_node("ca08", "Meta: Warmup-Kampagne")
    await test_node("ca09", "Meta: Warmup Ad Sets + Ads")

    # ── Phase 8: Review & Launch ──
    print(f"\n{'─'*60}")
    print("🚀 PHASE 8: Review & Launch")
    print(f"{'─'*60}")

    await test_node("rl06", "Slack: Assets ready")
    await test_node("rl07", "Close: Waiting for Approval")
    await test_node("rl09", "Close: Ready for Launch")
    await test_node("rl11", "Close: Live")
    await test_node("rl12", "Slack: Wir sind live")

    # ── Zusammenfassung ──
    print(f"\n{'#'*60}")
    print("# CONTEXT NACH WORKFLOW:")
    print(f"{'#'*60}")
    for key, val in context.items():
        if isinstance(val, (dict, list)):
            print(f"  {key}: {json.dumps(val, indent=4)[:300]}")
        else:
            print(f"  {key}: {val}")

    # Cleanup?
    print(f"\n{'─'*60}")
    answer = input("🧹 Testdaten aufräumen? (j/n): ").strip().lower()
    if answer == "j":
        await cleanup()
    else:
        print("   Übersprungen — manuelle Cleanup nötig!")


if __name__ == "__main__":
    asyncio.run(main())
