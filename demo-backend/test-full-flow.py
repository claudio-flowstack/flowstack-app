#!/usr/bin/env python3
"""Simuliert den kompletten Automationsfluss wie die UI ihn triggern würde.
Ruft /api/execute-node für jeden Side-Effect-Node in korrekter Reihenfolge auf,
propagiert Context wie side-effects.ts es tut."""

import httpx
import json
import time
import sys

BASE = "http://localhost:3002"
TIMEOUT = 60  # Meta-Calls können lange dauern

# Initial-Context (wie in side-effects.ts)
context = {
    "company": "Novacode GmbH",
    "email": "clazahlungskonto@gmail.com",
}

results_log = []
all_ok = True


def execute(node_id: str, label: str):
    """Node ausführen und Context propagieren (wie side-effects.ts)."""
    global context, all_ok
    t0 = time.time()
    try:
        resp = httpx.post(
            f"{BASE}/api/execute-node",
            json={"nodeId": node_id, "context": context},
            timeout=TIMEOUT,
        )
        elapsed = time.time() - t0
        data = resp.json()
        ok = data.get("ok", False)
        result = data.get("result") or {}
        error = data.get("error", "")

        if ok and result:
            # Context propagieren (exakt wie side-effects.ts lines 165-174)
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
                existing = context.get("task_ids", {})
                context["task_ids"] = {**existing, **result["task_ids"]}
            if result.get("meta_campaigns"):
                existing = context.get("meta_campaigns", {})
                context["meta_campaigns"] = {**existing, **result["meta_campaigns"]}
            if result.get("image_hashes"):
                context["image_hashes"] = result["image_hashes"]

        status = "OK" if ok else "FAIL"
        if not ok:
            all_ok = False
        results_log.append((node_id, label, status, f"{elapsed:.1f}s", error))
        icon = "✅" if ok else "❌"
        print(f"  {icon} {node_id:6} {label:40} {elapsed:5.1f}s  {error[:60] if error else ''}")
        return ok, result

    except Exception as e:
        elapsed = time.time() - t0
        all_ok = False
        results_log.append((node_id, label, "ERROR", f"{elapsed:.1f}s", str(e)))
        print(f"  ❌ {node_id:6} {label:40} {elapsed:5.1f}s  {str(e)[:60]}")
        return False, {}


def main():
    global all_ok

    # Health-Check
    try:
        h = httpx.get(f"{BASE}/health", timeout=5).json()
        if h.get("status") != "ok":
            print("❌ Backend nicht bereit!")
            sys.exit(1)
        print(f"Backend OK — APIs: Close={h['close']}, ClickUp={h['clickup']}, Slack={h['slack']}, Google={h['google']}, Meta={h['meta']}")
    except Exception as e:
        print(f"❌ Backend nicht erreichbar: {e}")
        sys.exit(1)

    print()
    t_start = time.time()

    # ═══ Phase 1: Infrastructure Setup ═══
    print("═══ Phase 1: Infrastructure Setup ═══")
    execute("is02", "Close: Lead erstellen")
    execute("is03", "Slack: Neuer Client + Channel")
    execute("is04", "Gmail: Willkommens-E-Mail")
    execute("is05", "Calendar: Kickoff-Termin")
    execute("is06", "Drive: Ordnerstruktur")
    execute("is08", "ClickUp: Projekt erstellen")
    execute("is09", "ClickUp: Tasks erstellen")
    execute("is10", "Close: Stage → Kickoff geplant")

    print(f"\n  Context: lead_id={context.get('lead_id','?')[:20]}, list_id={context.get('list_id','?')[:20]}, folder={context.get('folder_root_id','?')[:20]}")
    print(f"  task_ids: {list(context.get('task_ids', {}).keys())}")
    print()

    # ═══ Phase 2: Kickoff & Transkript ═══
    print("═══ Phase 2: Kickoff & Transkript ═══")
    execute("kc05", "Close: Kickoff abgeschlossen + Tasks")
    execute("kc06", "Slack: Kickoff fertig")

    print(f"\n  task_ids: {list(context.get('task_ids', {}).keys())}")
    print()

    # ═══ Phase 3: Strategie & Brand ═══
    print("═══ Phase 3: Strategie & Brand ═══")
    execute("st10", "Close: Strategie erstellt + Tasks")

    print(f"\n  task_ids: {list(context.get('task_ids', {}).keys())}")
    print()

    # ═══ Phase 4: Copy-Erstellung ═══
    print("═══ Phase 4: Copy-Erstellung ═══")
    execute("cc05", "Close: Assets erstellt + Tasks")

    print(f"\n  task_ids: {list(context.get('task_ids', {}).keys())}")
    print()

    # ═══ Phase 5: Zielgruppen & Kampagnen ═══
    print("═══ Phase 5: Zielgruppen & Kampagnen ═══")
    execute("ca01", "Meta: Custom Audience AllVisitors")
    execute("ca02", "Meta: Custom Audience LP_NoApp")
    execute("ca03", "Meta: Custom Audience Form_NoLead")
    execute("ca04", "Meta: Initial-Kampagne + Images")

    print(f"\n  image_hashes: {len(context.get('image_hashes', []))} Bilder")
    print(f"  meta_campaigns: {list(context.get('meta_campaigns', {}).keys())}")

    execute("ca05", "Meta: Initial Ad Sets + Ads")
    execute("ca06", "Meta: Retargeting-Kampagne")
    execute("ca07", "Meta: Retargeting Ad Sets + Ads")
    execute("ca08", "Meta: Warmup-Kampagne")
    execute("ca09", "Meta: Warmup Ad Sets + Ads")

    print(f"\n  meta_campaigns: {list(context.get('meta_campaigns', {}).keys())}")
    print()

    # ═══ Phase 6: Review & Go-Live ═══
    print("═══ Phase 6: Review & Go-Live ═══")
    execute("rl06", "Slack: Asset-Paket bereit")
    execute("rl07", "Close: Warte auf Freigabe + Tasks")
    execute("rl09", "Close: Bereit für Launch")
    execute("rl11", "Close: LIVE + Tasks abschließen")
    execute("rl12", "Slack: Wir sind LIVE!")

    print(f"\n  task_ids: {list(context.get('task_ids', {}).keys())}")

    # ═══ Zusammenfassung ═══
    elapsed_total = time.time() - t_start
    print(f"\n{'═' * 70}")
    ok_count = sum(1 for r in results_log if r[2] == "OK")
    fail_count = len(results_log) - ok_count
    print(f"  ERGEBNIS: {ok_count}/{len(results_log)} Nodes erfolgreich | {fail_count} Fehler | {elapsed_total:.0f}s gesamt")

    if fail_count:
        print(f"\n  Fehler:")
        for r in results_log:
            if r[2] != "OK":
                print(f"    ❌ {r[0]} {r[1]} — {r[4]}")

    # Cleanup-Daten ausgeben
    print(f"\n{'═' * 70}")
    print("  CLEANUP-DATEN (für /api/cleanup):")
    cleanup = {}
    if context.get("lead_id"): cleanup["lead_id"] = context["lead_id"]
    if context.get("opportunity_id"): cleanup["opportunity_id"] = context["opportunity_id"]
    if context.get("list_id"): cleanup["list_id"] = context["list_id"]
    if context.get("folder_root_id"): cleanup["folder_root_id"] = context["folder_root_id"]
    if context.get("event_id"): cleanup["event_id"] = context["event_id"]
    if context.get("channel_id"): cleanup["channel_id"] = context["channel_id"]
    campaigns = context.get("meta_campaigns", {})
    if campaigns:
        cleanup["meta_campaign_ids"] = [v for v in campaigns.values() if isinstance(v, str)]
    print(f"  {json.dumps(cleanup, indent=2)}")

    # Auto-Cleanup?
    if "--cleanup" in sys.argv:
        print(f"\n  Cleanup starten...")
        try:
            cr = httpx.post(f"{BASE}/api/cleanup", json=cleanup, timeout=60).json()
            print(f"  Cleanup: {cr.get('deleted', [])} gelöscht, {cr.get('errors', [])} Fehler")
        except Exception as e:
            print(f"  Cleanup Fehler: {e}")

    sys.exit(0 if all_ok else 1)


if __name__ == "__main__":
    main()
