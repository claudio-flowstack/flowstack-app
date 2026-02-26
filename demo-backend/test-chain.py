#!/usr/bin/env python3
"""
Kompletter Workflow-Chain-Test — simuliert die UI-Execution.
Ruft alle 26 Side-Effect-Nodes in DAG-Reihenfolge auf,
propagiert Context zwischen Nodes (wie side-effects.ts).
"""
import asyncio
import httpx
import json
import time
from datetime import datetime

BACKEND = "http://localhost:3002"

# DAG-Reihenfolge (respektiert alle Edges inkl. der neuen ca04→ca07, ca04→ca09)
# Innerhalb einer Stage laufen Nodes parallel (wie die DAG-Engine)
WORKFLOW_STAGES = [
    # ── Subsystem 1: Infrastruktur-Setup ──
    {"name": "Infra: Handover (kein Side-Effect)", "nodes": []},
    {"name": "Infra: Lead erstellen", "nodes": ["is02"]},
    {"name": "Infra: Parallel (Slack, Email, Termin, Drive, ClickUp)", "nodes": ["is03", "is04", "is05", "is06", "is08"]},
    {"name": "Infra: Templates + Tasks", "nodes": ["is07", "is09"]},
    {"name": "Infra: Close Status", "nodes": ["is10"]},

    # ── Subsystem 2: Kickoff ──
    {"name": "Kickoff: Close + Slack", "nodes": ["kc05", "kc06"]},

    # ── Subsystem 3: Strategy ──
    {"name": "Strategy: Close Status", "nodes": ["st10"]},

    # ── Subsystem 4: Copy ──
    {"name": "Copy: Close Status", "nodes": ["cc05"]},

    # ── Subsystem 5: Funnel (keine Side-Effects) ──

    # ── Subsystem 6: Campaigns ──
    {"name": "Campaigns: Custom Audiences (3x parallel)", "nodes": ["ca01", "ca02", "ca03"]},
    {"name": "Campaigns: Kampagnen erstellen (3x parallel)", "nodes": ["ca04", "ca06", "ca08"]},
    {"name": "Campaigns: Initial Ad Sets (ca05)", "nodes": ["ca05"]},
    {"name": "Campaigns: Retargeting Ad Sets (ca07)", "nodes": ["ca07"]},
    {"name": "Campaigns: Warmup Ad Sets (ca09)", "nodes": ["ca09"]},

    # ── Subsystem 7: Review & Launch ──
    {"name": "Launch: Assets ready + Approval", "nodes": ["rl06", "rl07"]},
    {"name": "Launch: Ready + Live + Slack", "nodes": ["rl09", "rl11", "rl12"]},
]

# Context akkumuliert wie in side-effects.ts
context = {
    "company": "Novacode GmbH",
    "email": "clazahlungskonto@gmail.com",
}


def update_context(result: dict):
    """Exakt wie side-effects.ts Zeilen 157-167"""
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


async def execute_node(client: httpx.AsyncClient, node_id: str) -> dict:
    """Einen Node ausführen — wie executeSideEffect() in side-effects.ts"""
    start = time.time()
    try:
        resp = await client.post(
            f"{BACKEND}/api/execute-node",
            json={"nodeId": node_id, "context": {**context}},
            timeout=60.0,
        )
        duration = int((time.time() - start) * 1000)

        if resp.status_code != 200:
            return {"node_id": node_id, "status": "ERROR", "duration_ms": duration,
                    "error": f"HTTP {resp.status_code}: {resp.text[:200]}"}

        data = resp.json()
        result = data.get("result", data)

        # Context updaten (wie Frontend)
        update_context(result)

        return {"node_id": node_id, "status": "OK", "duration_ms": duration, "result": result}

    except Exception as e:
        duration = int((time.time() - start) * 1000)
        return {"node_id": node_id, "status": "ERROR", "duration_ms": duration, "error": str(e)}


async def run_chain():
    print("=" * 70)
    print(f"  WORKFLOW CHAIN TEST — {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 70)

    total_start = time.time()
    results_log = []
    errors = []

    async with httpx.AsyncClient() as client:
        # Health Check
        health = await client.get(f"{BACKEND}/health")
        print(f"\nBackend: {health.json()['status'].upper()}")
        print(f"APIs: Close={health.json()['close']}, Meta={health.json()['meta']}, "
              f"Slack={health.json()['slack']}, Google={health.json()['google']}, ClickUp={health.json()['clickup']}")

        for stage in WORKFLOW_STAGES:
            if not stage["nodes"]:
                continue

            print(f"\n{'─' * 70}")
            print(f"  STAGE: {stage['name']}")
            print(f"{'─' * 70}")

            # Nodes in dieser Stage parallel ausführen (wie DAG-Engine)
            tasks = [execute_node(client, nid) for nid in stage["nodes"]]
            stage_results = await asyncio.gather(*tasks)

            for r in stage_results:
                status_icon = "✅" if r["status"] == "OK" else "❌"
                print(f"  {status_icon} {r['node_id']:6s} — {r['duration_ms']:5d}ms", end="")

                if r["status"] == "ERROR":
                    print(f"  ERROR: {r['error'][:80]}")
                    errors.append(r)
                else:
                    # Wichtige Output-Keys anzeigen
                    result = r.get("result") or {}
                    highlights = []
                    if result.get("lead_id"):
                        highlights.append(f"lead_id={result['lead_id'][:20]}")
                    if result.get("channel_id"):
                        highlights.append(f"channel={result['channel_id'][:15]}")
                    if result.get("campaign_id"):
                        highlights.append(f"campaign={result['campaign_id'][:15]}")
                    if result.get("image_hashes"):
                        highlights.append(f"images={len(result['image_hashes'])}")
                    if result.get("adset_ids"):
                        highlights.append(f"adsets={len(result['adset_ids'])}")
                    if result.get("count"):
                        highlights.append(f"count={result['count']}")
                    if result.get("skipped"):
                        highlights.append(f"SKIPPED: {result.get('reason', '?')}")
                    if result.get("meta_campaigns"):
                        highlights.append(f"campaigns={list(result['meta_campaigns'].keys())}")
                    if highlights:
                        print(f"  → {', '.join(highlights)}")
                    else:
                        print()

                results_log.append(r)

            # Context-Snapshot nach jeder Stage für kritische Keys
            if any(nid.startswith("ca") for nid in stage["nodes"]):
                print(f"\n  📋 Context nach Stage:")
                if context.get("image_hashes"):
                    print(f"     image_hashes: {len(context['image_hashes'])} Hashes")
                else:
                    print(f"     image_hashes: ⚠️  LEER")
                if context.get("meta_campaigns"):
                    print(f"     meta_campaigns: {json.dumps(context['meta_campaigns'], indent=0)}")

    # ── Zusammenfassung ──
    total_duration = int((time.time() - total_start) * 1000)
    ok_count = sum(1 for r in results_log if r["status"] == "OK")
    err_count = sum(1 for r in results_log if r["status"] == "ERROR")

    print(f"\n{'=' * 70}")
    print(f"  ERGEBNIS: {ok_count} OK / {err_count} FEHLER — {total_duration}ms gesamt")
    print(f"{'=' * 70}")

    if errors:
        print(f"\n❌ FEHLER DETAILS:")
        for e in errors:
            print(f"  {e['node_id']}: {e['error']}")

    # Context am Ende
    print(f"\n📋 FINALER CONTEXT:")
    for k, v in context.items():
        if k in ("company", "email"):
            continue
        if isinstance(v, dict):
            print(f"  {k}: {json.dumps(v)}")
        elif isinstance(v, list):
            print(f"  {k}: [{len(v)} items]")
        else:
            print(f"  {k}: {v}")

    # Kritischer Check: image_hashes bei ca07/ca09
    print(f"\n🔍 KRITISCHER CHECK (Race Condition Fix):")
    ca04_result = next((r for r in results_log if r["node_id"] == "ca04"), None)
    ca07_result = next((r for r in results_log if r["node_id"] == "ca07"), None)
    ca09_result = next((r for r in results_log if r["node_id"] == "ca09"), None)

    if ca04_result and ca04_result["status"] == "OK":
        img_count = len(ca04_result.get("result", {}).get("image_hashes", []))
        print(f"  ca04 image_hashes: {img_count} Bilder hochgeladen")
    else:
        print(f"  ca04: ❌ FEHLER — keine Bilder")

    if ca07_result and ca07_result["status"] == "OK":
        count = len((ca07_result.get("result") or {}).get("adset_ids", []))
        print(f"  ca07 Retargeting Ad Sets: {count} erstellt {'✅' if count > 0 else '⚠️  LEER'}")
    else:
        print(f"  ca07: ❌ FEHLER")

    if ca09_result and ca09_result["status"] == "OK":
        count = len((ca09_result.get("result") or {}).get("adset_ids", []))
        print(f"  ca09 Warmup Ad Sets: {count} erstellt {'✅' if count > 0 else '⚠️  LEER'}")
    else:
        print(f"  ca09: ❌ FEHLER")

    return errors


if __name__ == "__main__":
    errors = asyncio.run(run_chain())

    # Cleanup anbieten
    if not errors:
        print(f"\n{'─' * 70}")
        print("  Alle Nodes erfolgreich. Cleanup wird ausgeführt...")
        print(f"{'─' * 70}")

        async def cleanup():
            async with httpx.AsyncClient() as client:
                resp = await client.post(f"{BACKEND}/api/cleanup", json={
                    "lead_id": context.get("lead_id"),
                    "opportunity_id": context.get("opportunity_id"),
                    "list_id": context.get("list_id"),
                    "folder_root_id": context.get("folder_root_id"),
                    "event_id": context.get("event_id"),
                    "channel_id": context.get("channel_id"),
                    "meta_campaign_ids": list(context.get("meta_campaigns", {}).values()) if context.get("meta_campaigns") else None,
                }, timeout=30.0)
                data = resp.json()
                print(f"  Cleanup: {json.dumps(data, indent=2)}")

        asyncio.run(cleanup())
