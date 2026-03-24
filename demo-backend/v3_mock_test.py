"""
V3 Kompletter Mock-Test — Novacode Recruiting
Testet ALLE V3 Nodes der Reihe nach mit echten API-Calls wo möglich,
Mock-Daten wo nötig.
"""

import asyncio
import json
import os
import sys
import time
import ssl
import certifi
import urllib.request

sys.path.insert(0, os.path.dirname(__file__))

# Suppress warnings
import logging
logging.basicConfig(level=logging.WARNING)

SSL_CTX = ssl.create_default_context(cafile=certifi.where())

BASE_URL = "http://localhost:3002"

def api(method, path, data=None):
    """Simple API caller."""
    url = f"{BASE_URL}{path}"
    body = json.dumps(data).encode() if data else None
    req = urllib.request.Request(url, data=body, method=method)
    req.add_header("Content-Type", "application/json")
    try:
        resp = urllib.request.urlopen(req, timeout=30)
        return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        return {"error": e.read().decode()[:200], "status": e.code}
    except Exception as e:
        return {"error": str(e)}


def execute_node(exec_id, node_id, extra_context=None):
    """Execute a V3 node and return result."""
    payload = {
        "nodeId": node_id,
        "executionId": exec_id,
        "context": extra_context or {},
    }
    return api("POST", "/api/v3/execute-node", payload)


# ============================================================
# MOCK DATA — Novacode Recruiting (Senior Fullstack Developer)
# ============================================================

NOVACODE_CLIENT = {
    "company": "Novacode GmbH",
    "contact": "Markus Richter",
    "email": "clazahlungskonto@gmail.com",
    "phone": "+49 721 9876543",
    "branche": "IT",
    "website": "https://novacode.dev",
    "stellen": "2x Senior Fullstack Developer (Go/React), 1x DevOps Engineer",
    "budget": "3000",
    "account_manager": "Claudio",
}

NOVACODE_BAUSTEINE = {
    "demografie_1": {"kategorie": "Demografie", "inhalt": "Alter: 28-42 Jahre, überwiegend männlich (75/25), urbaner Raum (Karlsruhe, Stuttgart, Frankfurt), Hochschulabschluss Informatik oder vergleichbar"},
    "demografie_2": {"kategorie": "Demografie", "inhalt": "Familienstand: 60% in Partnerschaft, Work-Life-Balance sehr wichtig, Homeoffice-Affinität extrem hoch"},
    "beruflich_1": {"kategorie": "Beruflich", "inhalt": "Rolle: Senior Fullstack Developer mit 5-12 Jahren Erfahrung, Stack: Go/Python Backend + React/TypeScript Frontend, Cloud-native (AWS/GCP)"},
    "beruflich_2": {"kategorie": "Beruflich", "inhalt": "Aktueller Arbeitgeber: Mittelständisches IT-Unternehmen oder Konzern (SAP, Deutsche Telekom), Gehalt: 65-85k EUR, aktiv oder passiv suchend"},
    "beruflich_3": {"kategorie": "Beruflich", "inhalt": "Suchverhalten: Passive Kandidaten auf LinkedIn, aktive auf StepStone/Indeed nur bei akuter Unzufriedenheit, Tech-Community (GitHub, Stack Overflow) als Infoquelle"},
    "schmerzpunkte_1": {"kategorie": "Schmerzpunkte", "inhalt": "Kernfrustration: Zu viel Bürokratie, zu wenig echte Programmierung. 'Ich verschiebe nur noch Tickets und sitze in Meetings.'"},
    "schmerzpunkte_2": {"kategorie": "Schmerzpunkte", "inhalt": "Veralteter Tech-Stack: Legacy-Systeme, kein modernes Tooling, keine CI/CD. 'Wir deployen noch manuell per FTP.'"},
    "schmerzpunkte_3": {"kategorie": "Schmerzpunkte", "inhalt": "Fehlende Wertschätzung: '3% Gehaltserhöhung nach einem Top-Jahr? Ernsthaft?' + Return-to-Office Zwang"},
    "schmerzpunkte_4": {"kategorie": "Schmerzpunkte", "inhalt": "Keine Weiterentwicklung: Kein Budget für Konferenzen, kein Lernen neuer Technologien, Stillstand"},
    "psychologie_1": {"kategorie": "Psychologie", "inhalt": "Werte: Technische Exzellenz > Bürokratie, Autonomie und Eigenverantwortung, Work-Life-Balance als Grundvoraussetzung"},
    "psychologie_2": {"kategorie": "Psychologie", "inhalt": "Entscheidungsverhalten: Rational, faktenbasiert. Misstrauisch gegenüber Corporate-Buzzwords. Braucht Beweise (GitHub-Repos, Tech-Blog, Stack-Details)"},
    "psychologie_3": {"kategorie": "Psychologie", "inhalt": "Trigger-Events: Enttäuschende Gehaltsrunde, Return-to-Office, neuer CTO mit anderer Vision, Teamkollegen kündigen"},
    "benefits_1": {"kategorie": "Benefits", "inhalt": "Must-have: 100% Remote möglich, moderner Tech-Stack (Go, React, K8s), flache Hierarchien, eigene Projekte"},
    "benefits_2": {"kategorie": "Benefits", "inhalt": "Nice-to-have: 4-Tage-Woche Option, Konferenz-Budget, MacBook Pro, 30+ Urlaubstage"},
    "benefits_3": {"kategorie": "Benefits", "inhalt": "Deal-Breaker: Kein Remote, veralteter Stack, mehr als 3 Bewerbungsgespräche, Assessment Center"},
    "sprache_1": {"kategorie": "Sprache", "inhalt": "Tonalität: Direkt, ehrlich, kein Marketing-Sprech. 'Wir suchen Leute die coden wollen, nicht Leute die gut in Meetings sind.'"},
    "sprache_2": {"kategorie": "Sprache", "inhalt": "Trigger-Phrasen: 'Greenfield-Projekt', 'Du entscheidest welchen Stack', 'Kein Legacy', 'Pair Programming statt Jira-Tickets'"},
    "einwaende_1": {"kategorie": "Einwände", "inhalt": "Einwand: 'Klingt zu gut um wahr zu sein — jedes Startup sagt das.' → Antwort: Konkrete Beispiele, GitHub-Repos, Tech-Blog-Posts"},
    "einwaende_2": {"kategorie": "Einwände", "inhalt": "Einwand: 'Was wenn das Startup scheitert?' → Antwort: Finanzierungsrunde, Kundenliste, Wachstumszahlen transparent machen"},
    "arbeitgeber_1": {"kategorie": "Arbeitgeber", "inhalt": "USP: Tech-first Kultur, kein Middle-Management, jeder Developer hat Impact, Open-Source-Contributions in der Arbeitszeit erlaubt"},
    "arbeitgeber_2": {"kategorie": "Arbeitgeber", "inhalt": "Team: 25 Entwickler, Durchschnittsalter 32, 8 Nationalitäten, Kommunikation auf Englisch, Office in Karlsruhe Tech-Hub"},
    "messaging_1": {"kategorie": "Messaging", "inhalt": "Kernbotschaft: 'Bei Novacode baust du Produkte, nicht Powerpoints.' — Fokus auf echte Engineering-Kultur vs. Konzern-Bürokratie"},
    "markt_1": {"kategorie": "Markt", "inhalt": "Wettbewerb um Talente: SAP, 1&1, CAS, lokale Agenturen. Novacode differenziert sich durch Stack (Go statt Java) und Kultur (Remote-first)"},
}

NOVACODE_GENERATED_DOCS = {
    "zielgruppen_avatar": {
        "content": "Zielgruppen-Avatar: Senior Fullstack Developer, 28-42 Jahre, Go/React Stack, aktuell in Konzern oder Mittelstand. Kernfrustration: Zu viel Bürokratie. Wunsch: Moderner Stack, Remote, echtes Engineering.",
        "subtype": "zielgruppen_avatar",
    },
    "arbeitgeber_avatar": {
        "content": "Arbeitgeber-Avatar: Novacode GmbH, Tech-first Startup in Karlsruhe, 25 Entwickler, Go/React/K8s Stack, Remote-first, Open-Source-Kultur, flache Hierarchien.",
        "subtype": "arbeitgeber_avatar",
    },
    "messaging_matrix": {
        "content": "Kernbotschaft: 'Bei Novacode baust du Produkte, nicht Powerpoints.' Schmerzpunkt-Angle: Bürokratie-Flucht. Benefit-Angle: Tech-Freiheit. Social-Proof: GitHub Stars.",
        "subtype": "messaging_matrix",
    },
    "lp_text": {
        "content": "Headline: Du willst wieder coden statt Tickets verschieben? Subline: Novacode sucht Senior Fullstack Developer die echte Produkte bauen wollen. 100% Remote, moderner Go/React Stack, kein Legacy. Body: Wir sind 25 Entwickler die glauben dass Software-Engineering mehr ist als Jira-Boards und Daily Standups. Bei uns entscheidest DU welchen Ansatz du wählst...",
        "subtype": "lp_text",
    },
    "anzeigen_haupt": {
        "content": "Ad 1 (Schmerzpunkt): Meetings, Tickets, Bürokratie — und zwischendurch vielleicht mal coden? Wenn dir das bekannt vorkommt, haben wir was Besseres. Novacode sucht Senior Fullstack Developer die echte Produkte bauen wollen. Kein Legacy, kein Konzern, kein Bullshit. Go, React, Kubernetes. Remote-first. Bewirb dich in 60 Sekunden. Ad 2 (Benefit): 100% Remote. Moderner Stack. Kein Middle-Management. Bei Novacode baust du Produkte, nicht Powerpoints. Wir suchen Senior Fullstack Developer mit Go/React Erfahrung. Ad 3 (Contrarian): Jedes Startup verspricht flache Hierarchien. Wir beweisen es: Unser gesamter Code ist Open Source. Schau dir an wie wir arbeiten bevor du dich bewirbst.",
        "subtype": "anzeigen_haupt",
        "sections": {"primary_text": "Meetings, Tickets, Bürokratie — und zwischendurch vielleicht mal coden?", "headline": "Senior Fullstack Developer gesucht"},
    },
    "anzeigen_retargeting": {
        "content": "Retargeting Ad 1: Du hast dir unsere Stelle angeschaut aber noch nicht beworben. Verstehen wir — jeder sagt 'moderner Stack'. Deshalb: Hier ist unser GitHub. Überzeug dich selbst. Retargeting Ad 2: Noch unentschlossen? Hier sind 3 Gründe warum unsere Entwickler bei uns bleiben: 1) Kein Return-to-Office 2) Konferenz-Budget 3) 4-Tage-Woche Option.",
        "subtype": "anzeigen_retargeting",
    },
    "anzeigen_warmup": {
        "content": "Warmup Ad 1: Was passiert wenn 25 Entwickler einen Tech-Stack WIRKLICH frei wählen dürfen? Go, React, Kubernetes, Terraform. Kein Java, kein Legacy. Das ist Novacode. Warmup Ad 2: Remote-first seit Tag 1. Nicht seit Corona. 8 Nationalitäten, 25 Entwickler, 1 Mission: Software bauen die funktioniert.",
        "subtype": "anzeigen_warmup",
    },
    "videoskript": {
        "content": "Hook (0-3s): 'Meetings, Tickets, Bürokratie...' Problem (3-15s): '...und zwischendurch vielleicht mal coden. Das war mein Alltag bei [Konzern].' Lösung (15-30s): 'Bei Novacode baue ich Produkte. Echte Produkte. Mit einem Stack den ich selbst gewählt habe.' CTA (30-35s): 'Wenn du wieder coden willst statt Tickets zu verschieben — Link in der Bio.'",
        "subtype": "videoskript",
    },
}


def main():
    print("=" * 60)
    print("  V3 KOMPLETTER MOCK-TEST — Novacode Recruiting")
    print("=" * 60)
    print()

    results = {}
    start_total = time.time()

    # ── STEP 1: Start Execution ──────────────────────────────
    print("1. V3 Execution starten...")
    resp = api("POST", "/api/v3/execute", NOVACODE_CLIENT)
    exec_id = resp.get("execution_id", "")
    if not exec_id:
        print(f"   ❌ FAILED: {resp}")
        return
    print(f"   ✅ Execution: {exec_id}")
    results["start"] = "✅"

    # ── STEP 2: Duplikat-Check ───────────────────────────────
    print("\n2. Duplikat-Check (Close CRM)...")
    r = execute_node(exec_id, "v3-is02a")
    dup = r.get("result", {}).get("duplicate", "?")
    print(f"   {'✅' if r.get('status')=='completed' else '❌'} Duplicate: {dup}")
    results["is02a"] = r.get("status")

    # ── STEP 3: Drive Quota ──────────────────────────────────
    print("\n3. Drive Quota Check...")
    r = execute_node(exec_id, "v3-is06a")
    gb = r.get("result", {}).get("free_gb", "?")
    print(f"   {'✅' if r.get('status')=='completed' else '❌'} Free: {gb} GB")
    results["is06a"] = r.get("status")

    # ── STEP 4: No-Show Detection (no transcript) ────────────
    print("\n4. No-Show Detection (kein Transkript)...")
    r = execute_node(exec_id, "v3-kc02a")
    noshow = r.get("result", {}).get("noshow", "?")
    print(f"   {'✅' if r.get('status')=='completed' else '❌'} No-Show: {noshow}")
    results["kc02a"] = r.get("status")

    # ── STEP 5: No-Show with transcript ──────────────────────
    print("\n5. No-Show Detection (MIT Transkript)...")
    r = execute_node(exec_id, "v3-kc02a", {"transcript_id": "doc_123"})
    noshow2 = r.get("result", {}).get("noshow", "?")
    print(f"   {'✅' if r.get('status')=='completed' else '❌'} No-Show: {noshow2} (erwartet: False)")
    results["kc02a_with"] = r.get("status")

    # ── STEP 6: Bausteine Quality Gate ───────────────────────
    print("\n6. Bausteine Quality Gate...")
    r = execute_node(exec_id, "v3-st00", {"bausteine": NOVACODE_BAUSTEINE})
    coverage = r.get("result", {}).get("coverage", "?")
    missing = r.get("result", {}).get("missing_categories", [])
    print(f"   {'✅' if r.get('status')=='completed' else '❌'} Coverage: {coverage}%, Missing: {missing}")
    results["st00"] = r.get("status")

    # ── STEP 7: DACH Compliance ──────────────────────────────
    print("\n7. DACH Compliance Scan (mit absichtlichen Verstößen)...")
    test_docs = {
        "ad_test": {"content": "Wir sind ein junges dynamisches Team und suchen digital natives mit Deutsch als Muttersprache für unser motiviertes Team in Karlsruhe."},
        "lp_good": {"content": "Senior Fullstack Developer gesucht (m/w/d). Moderner Tech-Stack, 100% Remote, flache Hierarchien."},
    }
    r = execute_node(exec_id, "v3-cc01a", {"generated_docs": test_docs})
    res = r.get("result", {})
    print(f"   {'✅' if r.get('status')=='completed' else '❌'} Passed: {res.get('passed')}")
    print(f"   Issues: {len(res.get('issues', []))}")
    for fix in res.get("auto_fixed", []):
        print(f"   Auto-Fix: '{fix['original']}' → '{fix['fixed']}'")
    results["cc01a"] = r.get("status")

    # ── STEP 8: Placeholder Scan ─────────────────────────────
    print("\n8. Placeholder Scan...")
    placeholder_docs = {
        "lp": {"content": "Willkommen bei [FIRMENNAME]. Bewirb dich auf [DOMAIN]/karriere. Stand: [DATUM]"},
        "clean": {"content": "Novacode sucht Senior Developer. Bewirb dich jetzt auf novacode.dev/karriere"},
    }
    r = execute_node(exec_id, "v3-cc02b", {"generated_docs": placeholder_docs})
    res = r.get("result", {})
    print(f"   {'✅' if r.get('status')=='completed' else '❌'} Passed: {res.get('passed')}")
    for p in res.get("placeholders", []):
        print(f"   Found: '{p['placeholder']}' in {p['doc']} ({p['count']}x)")
    results["cc02b"] = r.get("status")

    # ── STEP 9: URL Validation ───────────────────────────────
    print("\n9. URL Validation (flowstack-system.de)...")
    r = execute_node(exec_id, "v3-fn05a", {"lp_url": "https://flowstack-system.de"})
    res = r.get("result", {})
    print(f"   {'✅' if r.get('status')=='completed' else '❌'} Passed: {res.get('passed')}")
    for url_res in res.get("results", []):
        print(f"   {url_res.get('url','?')}: reachable={url_res.get('reachable')}, SSL={url_res.get('ssl_valid')}, {url_res.get('load_time_ms',0)}ms")
    results["fn05a"] = r.get("status")

    # ── STEP 10: Meta Ad Account Health ──────────────────────
    print("\n10. Meta Ad Account Health Check...")
    r = execute_node(exec_id, "v3-ca00")
    res = r.get("result", {})
    if r.get("status") == "completed":
        print(f"   ✅ Healthy: {res.get('healthy')}, Account: {res.get('name','?')}")
    else:
        print(f"   ❌ {r.get('error', '?')[:80]}")
    results["ca00"] = r.get("status")

    # ── STEP 11: Approval Gate ───────────────────────────────
    print("\n11. Strategy Approval Gate...")
    r = execute_node(exec_id, "v3-st-approval")
    print(f"   {'✅' if r.get('status')=='waiting_approval' else '❌'} Status: {r.get('status')}")
    results["st_approval"] = r.get("status")

    # ── STEP 12: Resolve Approval ────────────────────────────
    print("\n12. Approve Strategy...")
    r = api("POST", "/api/approval/v3-st-approval", {"action": "approve", "reviewer": "Claudio", "comment": "Alles top"})
    print(f"   {'✅' if r.get('success') else '❌'} Approved, Resume: {r.get('should_resume')}")
    results["approve"] = "✅" if r.get("success") else "❌"

    # ── STEP 13: Context Validation (should block) ───────────
    print("\n13. Context Validation (v3-is09 ohne list_id → soll blocken)...")
    r = execute_node(exec_id, "is09")  # Uses V1/V2 node ID with V3 validation
    print(f"   {'✅' if r.get('status')=='blocked' else '❌'} Status: {r.get('status')}, Missing: {r.get('missing','?')}")
    results["context_block"] = r.get("status")

    # ── STEP 14: Pixel Verification ──────────────────────────
    print("\n14. Pixel Verification...")
    r = execute_node(exec_id, "v3-rl-pixel")
    res = r.get("result", {})
    if r.get("status") == "completed":
        print(f"   ✅ Active: {res.get('active')}, Pixel: {res.get('pixel_name','?')}")
    else:
        print(f"   ⚠ {r.get('status')}: {r.get('error','?')[:80]}")
    results["pixel"] = r.get("status")

    # ── STEP 15: All Approval Gates ──────────────────────────
    print("\n15. Alle restlichen Approval Gates testen...")
    for gate in ["v3-cc-approval", "v3-fn-approval", "v3-ca-approval", "v3-rl-golive"]:
        r = execute_node(exec_id, gate)
        status = r.get("status", "?")
        print(f"   {gate}: {status}")
        # Auto-approve
        if status == "waiting_approval":
            api("POST", f"/api/approval/{gate}", {"action": "approve", "reviewer": "Claudio"})
            print(f"   → Approved")
        results[gate] = status

    # ── STEP 16: Final State ─────────────────────────────────
    print("\n" + "=" * 60)
    print("  ERGEBNIS")
    print("=" * 60)

    state = api("GET", f"/api/v3/execute/{exec_id}")
    nodes = state.get("nodes", {})
    completed = sum(1 for n in nodes.values() if n.get("status") == "completed")
    waiting = sum(1 for n in nodes.values() if n.get("status") == "waiting_approval")
    blocked = sum(1 for n in nodes.values() if n.get("status") == "blocked")
    failed = sum(1 for n in nodes.values() if n.get("status") == "failed")

    print(f"\n  Nodes gesamt: {len(nodes)}")
    print(f"  ✅ Completed:  {completed}")
    print(f"  🟡 Waiting:    {waiting}")
    print(f"  ⏳ Blocked:    {blocked}")
    print(f"  ❌ Failed:     {failed}")

    duration = time.time() - start_total
    print(f"\n  Gesamtdauer: {duration:.1f}s")

    # Alerts
    alerts = api("GET", "/api/v3/alerts")
    print(f"\n  DLQ Entries: {alerts.get('dlq_count', 0)}")
    print(f"  Open Circuits: {alerts.get('open_circuits', 0)}")

    # Pending Approvals
    pending = api("GET", "/api/approval/pending")
    print(f"  Pending Approvals: {len(pending) if isinstance(pending, list) else 0}")

    print("\n" + "=" * 60)
    print("  NODE DETAILS")
    print("=" * 60)
    for nid, ndata in nodes.items():
        s = ndata.get("status", "?")
        icon = "✅" if s == "completed" else "❌" if s == "failed" else "🟡" if s == "waiting_approval" else "⏳"
        dur = ndata.get("duration_ms", 0)
        err = f" — {ndata['error'][:60]}" if ndata.get("error") else ""
        print(f"  {icon} {nid:25s} {s:20s} {dur:6d}ms{err}")

    # Health
    print("\n" + "=" * 60)
    print("  SYSTEM HEALTH")
    print("=" * 60)
    health = api("GET", "/api/health")
    for service, info in health.get("services", {}).items():
        icon = "✅" if info.get("status") == "ok" else "❌"
        print(f"  {icon} {service:15s} {info.get('message','?')[:40]}")

    print("\n" + "=" * 60)
    print("  TEST ABGESCHLOSSEN")
    print("=" * 60)


if __name__ == "__main__":
    main()
