"""
Einmaliges Script: Erstellt ein Google Doc "Pain-Point-Matrix — Novacode GmbH"
mit sinnvollem Recruiting-Inhalt.

Ausführen:
  doppler run --project fulfillment-automation --config dev_claudio -- python create-painpoint-doc.py
"""
import json
import os
import httpx

raw = os.environ.get("FLOWSTACK_GOOGLE_OAUTH_TOKEN", os.environ.get("GOOGLE_OAUTH_TOKEN", "{}"))
creds = json.loads(raw)
TOKEN = creds.get("token", "")
REFRESH = creds.get("refresh_token", "")
CLIENT_ID = creds.get("client_id", "")
CLIENT_SECRET = creds.get("client_secret", "")


def refresh_token():
    global TOKEN
    resp = httpx.post("https://oauth2.googleapis.com/token", data={
        "grant_type": "refresh_token",
        "refresh_token": REFRESH,
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
    })
    if resp.status_code == 200:
        TOKEN = resp.json()["access_token"]
    return TOKEN


def api(method, url, data=None):
    headers = {"Authorization": f"Bearer {TOKEN}"}
    resp = httpx.request(method, url, json=data, headers=headers)
    if resp.status_code == 401:
        refresh_token()
        headers = {"Authorization": f"Bearer {TOKEN}"}
        resp = httpx.request(method, url, json=data, headers=headers)
    if resp.status_code >= 400:
        print(f"ERROR {resp.status_code}: {resp.text}")
        raise Exception(resp.text)
    return resp.json()


# 1. Dokument erstellen
doc = api("POST", "https://docs.googleapis.com/v1/documents", {
    "title": "Pain-Point-Matrix — Novacode GmbH"
})
doc_id = doc["documentId"]
print(f"Doc erstellt: https://docs.google.com/document/d/{doc_id}/edit")

# 2. Inhalt einfügen (Docs API: batchUpdate mit insertText)
requests = []

content_blocks = [
    # Rückwärts einfügen (Index 1 = Anfang des Dokuments)
    {
        "insertText": {
            "location": {"index": 1},
            "text": (
                "Pain-Point-Matrix — Novacode GmbH\n"
                "Recruiting-Projekt | Erstellt durch KI-Analyse des Kickoff-Transkripts\n\n"
                "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n"
                "1. KANDIDATEN-PAIN-POINTS\n\n"
                "Pain Point 1: Veralteter Tech-Stack\n"
                "  • Beschreibung: Kandidaten wollen mit modernen Technologien arbeiten (React, TypeScript, Cloud-Native)\n"
                "  • Intensität: Hoch (8/10)\n"
                "  • Quelle: Kickoff-Transkript, Arbeitsmarkt-Analyse\n"
                "  • Messaging-Ansatz: \"Bei Novacode arbeitest du mit dem Stack, den du dir wünschst\"\n\n"
                "Pain Point 2: Fehlende Remote-Optionen\n"
                "  • Beschreibung: 73% der Senior Developer erwarten Remote-First oder Hybrid-Modelle\n"
                "  • Intensität: Sehr hoch (9/10)\n"
                "  • Quelle: Branchen-Benchmarks, Kandidaten-Feedback\n"
                "  • Messaging-Ansatz: \"100% Remote-First — arbeite von wo du willst\"\n\n"
                "Pain Point 3: Mangelnde Karriereperspektiven\n"
                "  • Beschreibung: Flache Hierarchien werden gewünscht, aber klare Entwicklungspfade fehlen oft\n"
                "  • Intensität: Mittel (6/10)\n"
                "  • Quelle: Kickoff-Transkript\n"
                "  • Messaging-Ansatz: \"Wachse mit uns — vom Developer zum Tech Lead\"\n\n"
                "Pain Point 4: Schlechte Work-Life-Balance\n"
                "  • Beschreibung: Überstunden und ständige Erreichbarkeit als Hauptgrund für Jobwechsel\n"
                "  • Intensität: Hoch (8/10)\n"
                "  • Quelle: Arbeitsmarkt-Analyse\n"
                "  • Messaging-Ansatz: \"Flexible Arbeitszeiten, echte 4-Tage-Woche möglich\"\n\n"
                "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n"
                "2. ARBEITGEBER-PAIN-POINTS (Novacode GmbH)\n\n"
                "Pain Point A: Time-to-Hire zu lang\n"
                "  • Aktuell: Ø 47 Tage vom Posting bis zur Einstellung\n"
                "  • Ziel: < 30 Tage\n"
                "  • Ursache: Geringe Sichtbarkeit, kein Active Sourcing\n\n"
                "Pain Point B: Qualität der Bewerbungen\n"
                "  • Aktuell: 80% unqualifizierte Bewerbungen\n"
                "  • Ziel: > 40% qualifizierte Bewerbungen\n"
                "  • Ursache: Unspezifische Stellenanzeigen, falsche Kanäle\n\n"
                "Pain Point C: Employer Brand unbekannt\n"
                "  • Aktuell: Kaum Sichtbarkeit auf Arbeitgeber-Plattformen\n"
                "  • Ziel: Top-of-Mind bei Senior Developern in DACH\n"
                "  • Ursache: Kein systematisches Employer Branding\n\n"
                "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n"
                "3. BENEFITS & DIFFERENZIATOREN\n\n"
                "  • Remote-First Kultur mit optionalem Office in Berlin\n"
                "  • Moderner Stack: React 19, TypeScript, AWS, Terraform\n"
                "  • 30 Tage Urlaub + Sabbatical-Option\n"
                "  • Weiterbildungsbudget: 3.000€/Jahr pro Mitarbeiter\n"
                "  • Team-Events: Quartals-Offsites, Hackathons\n"
                "  • Transparente Gehaltsstruktur\n"
                "  • Equity-Beteiligung ab Senior-Level\n\n"
                "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n"
                "4. SPRACHMUSTER & TONALITÄT\n\n"
                "  • Kandidaten nutzen: \"moderner Stack\", \"Remote\", \"Work-Life-Balance\", \"Ownership\"\n"
                "  • Vermeiden: \"Rockstar\", \"Ninja\", \"dynamisches Team\", \"flache Hierarchien\" (abgenutzt)\n"
                "  • Tonalität: Authentisch, direkt, technisch kompetent\n"
                "  • Ansprache: Du-Form, auf Augenhöhe\n\n"
                "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n"
                "Erstellt: Flowstack KI-Analyse | Basierend auf Kickoff-Transkript vom 27.02.2026\n"
            )
        }
    }
]

api("POST", f"https://docs.googleapis.com/v1/documents/{doc_id}:batchUpdate", {
    "requests": content_blocks
})

print(f"\n✅ Pain-Point-Matrix erstellt:")
print(f"   ID: {doc_id}")
print(f"   URL: https://docs.google.com/document/d/{doc_id}/edit")
print(f"\n→ Diese URL in demo-data.ts bei st02 eintragen!")
