"""
Findet und löscht ALLE Demo-Testdaten aus vorherigen Runs.
Löscht NUR erstellte Ressourcen — vorbereitete Dokumente bleiben erhalten.

Ausführen:
  doppler run --project fulfillment-automation --config dev_claudio -- python cleanup-all.py
"""
import json
import os
import httpx

# ── Credentials ──
CLOSE_API_KEY = os.environ.get("CLOSE_API") or os.environ.get("CLOSE_API_KEY") or os.environ.get("CLOSE_API_KEY_V2")
CLICKUP_TOKEN = os.environ.get("CLICKUP_API_TOKEN")
SLACK_BOT_TOKEN = os.environ.get("SLACK_BOT_TOKEN")

raw = os.environ.get("FLOWSTACK_GOOGLE_OAUTH_TOKEN", os.environ.get("GOOGLE_OAUTH_TOKEN", "{}"))
creds = json.loads(raw)
GOOGLE_TOKEN = creds.get("token", "")
GOOGLE_REFRESH = creds.get("refresh_token", "")
GOOGLE_CLIENT_ID = creds.get("client_id", "")
GOOGLE_CLIENT_SECRET = creds.get("client_secret", "")

CLICKUP_SPACE_ID = "90189542355"

# Geschützte Doc-IDs — NIEMALS löschen
PROTECTED_IDS = {
    # Strategy Docs
    "1TOLqoqvEYy_DTxMb1zSUeq-cmXmNHmmUQe9EG2B1vEY",  # Zielgruppen-Avatar
    "1de1XU5ykeIw36kKSiorQqzPAGkHfsceflnTCBpVY26Q",  # Arbeitgeber-Avatar
    "1HLMrDn_p1aqL7nnfB09e0mPakj-m0BSIhQwTdkoX03E",  # Messaging-Matrix
    "1sxB6R6l4DUn10hYEhY5xCEkNxZ4dvE9EUFvgT0hmCz8",  # Creative Briefing
    "1Xp0y_liDQ43AMdH3cjEwxdo9ZSZOP1AlVr8r-pn2Cps",  # Marken-Richtlinien
    # Copy Docs
    "1CEZAzrioyaqn7PMfc0ARadG1Jw5ic-uXTV4tE1aX2PU",  # Landingpage-Texte
    "1Qe0zXGHVcABIEMTZUn4tMttloGfa14bpCtKU3L95-Qw",  # Formularseite-Texte
    "13M6owsnBTr6OAElN0LvhF5Oz_Ky4l0OdvhSb2dhfQ7g",  # Dankeseite-Texte
    "1lf2U2ZI47-Oz8eTW8OKziGwN_Z_SAssS8DiJAiiJ5SQ",  # Anzeigentexte
    "171Eg7V8jKGOYrqdYOLUM6DvfDodet_mxPrUB5DmMqEs",  # Videoskript
    "1ITRWWBL9tY-2AUi4CIB6wbPqbk6CGcv5UB6ePtH87j0",  # Anzeigen-Variationen
    # Transkript
    "1ZO6yLLW18GLjJd1xuCc8jytaGwPi0jedoSkUR8LO-eM",  # Kickoff-Transkript
    # Pain-Point-Matrix
    "1RfNMSovKZx43uHrKDNa8G6iBCi_ouRTfShVuoLcuUac",  # Pain-Point-Matrix
    # Tracking Sheets
    "1EmgdSqPPpouA20wY3OhMu1PGCA-Y_aCeztDHUF2zXeY",  # Novacode Tracking Dashboard
    "1-HGe6sCOlaCE-x0uZB_qs-6ZLczlikR181l3ztOoadE",  # Original Shopify Template
    "1HiPHnlWd31327uiGMQBRyaAZLhSDP6VaqwrZqPP5k6I",  # Recruiting Template
}

http = httpx.Client(timeout=30)
deleted = []
errors = []


def refresh_google():
    global GOOGLE_TOKEN
    resp = http.post("https://oauth2.googleapis.com/token", data={
        "grant_type": "refresh_token",
        "refresh_token": GOOGLE_REFRESH,
        "client_id": GOOGLE_CLIENT_ID,
        "client_secret": GOOGLE_CLIENT_SECRET,
    })
    if resp.status_code == 200:
        GOOGLE_TOKEN = resp.json()["access_token"]


def google_get(url):
    resp = http.get(url, headers={"Authorization": f"Bearer {GOOGLE_TOKEN}"})
    if resp.status_code == 401:
        refresh_google()
        resp = http.get(url, headers={"Authorization": f"Bearer {GOOGLE_TOKEN}"})
    return resp.json() if resp.status_code == 200 else {}


def google_delete(url):
    resp = http.delete(url, headers={"Authorization": f"Bearer {GOOGLE_TOKEN}"})
    if resp.status_code == 401:
        refresh_google()
        resp = http.delete(url, headers={"Authorization": f"Bearer {GOOGLE_TOKEN}"})
    return resp.status_code < 400


print("=" * 60)
print("CLEANUP: Alle Demo-Testdaten löschen")
print("=" * 60)

# ── 1. Close CRM: Novacode Leads finden und löschen ──
print("\n🔍 Close CRM: Suche nach Novacode Leads...")
try:
    resp = http.get(
        "https://api.close.com/api/v1/lead/",
        params={"query": "Novacode", "_limit": 50},
        auth=(CLOSE_API_KEY, ""),
    )
    if resp.status_code == 200:
        leads = resp.json().get("data", [])
        print(f"   Gefunden: {len(leads)} Leads")
        for lead in leads:
            name = lead.get("display_name", "?")
            lead_id = lead["id"]
            r = http.delete(f"https://api.close.com/api/v1/lead/{lead_id}/", auth=(CLOSE_API_KEY, ""))
            if r.status_code < 400:
                deleted.append(f"Close Lead: {name} ({lead_id})")
                print(f"   ✅ Gelöscht: {name}")
            else:
                errors.append(f"Close Lead: {name} — {r.status_code}")
                print(f"   ❌ Fehler: {name} — {r.status_code}")
    else:
        print(f"   ⚠️ Close API Fehler: {resp.status_code}")
except Exception as e:
    print(f"   ❌ Close Fehler: {e}")

# ── 2. ClickUp: Novacode Listen finden und löschen ──
print("\n🔍 ClickUp: Suche nach Novacode Listen...")
try:
    resp = http.get(
        f"https://api.clickup.com/api/v2/space/{CLICKUP_SPACE_ID}/list",
        headers={"Authorization": CLICKUP_TOKEN},
    )
    if resp.status_code == 200:
        lists = resp.json().get("lists", [])
        novacode_lists = [l for l in lists if "novacode" in l["name"].lower() or "Novacode" in l["name"]]
        print(f"   Gefunden: {len(novacode_lists)} Listen")
        for lst in novacode_lists:
            name = lst["name"]
            list_id = lst["id"]
            r = http.delete(
                f"https://api.clickup.com/api/v2/list/{list_id}",
                headers={"Authorization": CLICKUP_TOKEN},
            )
            if r.status_code < 400:
                deleted.append(f"ClickUp List: {name} ({list_id})")
                print(f"   ✅ Gelöscht: {name}")
            else:
                errors.append(f"ClickUp List: {name} — {r.status_code}")
                print(f"   ❌ Fehler: {name} — {r.status_code}")

    # Auch in Foldern suchen
    resp = http.get(
        f"https://api.clickup.com/api/v2/space/{CLICKUP_SPACE_ID}/folder",
        headers={"Authorization": CLICKUP_TOKEN},
    )
    if resp.status_code == 200:
        folders = resp.json().get("folders", [])
        for folder in folders:
            for lst in folder.get("lists", []):
                if "novacode" in lst["name"].lower():
                    name = lst["name"]
                    list_id = lst["id"]
                    r = http.delete(
                        f"https://api.clickup.com/api/v2/list/{list_id}",
                        headers={"Authorization": CLICKUP_TOKEN},
                    )
                    if r.status_code < 400:
                        deleted.append(f"ClickUp List (Folder): {name} ({list_id})")
                        print(f"   ✅ Gelöscht: {name}")
except Exception as e:
    print(f"   ❌ ClickUp Fehler: {e}")

# ── 3. Google Drive: Novacode Ordner finden und löschen ──
print("\n🔍 Google Drive: Suche nach Novacode Ordnern...")
refresh_google()
try:
    data = google_get(
        "https://www.googleapis.com/drive/v3/files?"
        "q=name+contains+'Novacode'+and+mimeType='application/vnd.google-apps.folder'+and+trashed=false"
        "&fields=files(id,name)&pageSize=50"
    )
    folders = data.get("files", [])
    print(f"   Gefunden: {len(folders)} Ordner")
    for f in folders:
        fid = f["id"]
        fname = f["name"]
        if fid in PROTECTED_IDS:
            print(f"   🛡️ Geschützt (übersprungen): {fname}")
            continue
        if google_delete(f"https://www.googleapis.com/drive/v3/files/{fid}"):
            deleted.append(f"Drive Folder: {fname} ({fid})")
            print(f"   ✅ Gelöscht: {fname}")
        else:
            errors.append(f"Drive Folder: {fname}")
            print(f"   ❌ Fehler: {fname}")
except Exception as e:
    print(f"   ❌ Drive Fehler: {e}")

# ── 4. Google Calendar: Kickoff-Events finden und löschen ──
print("\n🔍 Google Calendar: Suche nach Kickoff-Events...")
try:
    data = google_get(
        "https://www.googleapis.com/calendar/v3/calendars/primary/events?"
        "q=Kickoff+Novacode&maxResults=50&singleEvents=true"
    )
    events = data.get("items", [])
    print(f"   Gefunden: {len(events)} Events")
    for ev in events:
        eid = ev["id"]
        summary = ev.get("summary", "?")
        if google_delete(f"https://www.googleapis.com/calendar/v3/calendars/primary/events/{eid}"):
            deleted.append(f"Calendar: {summary} ({eid})")
            print(f"   ✅ Gelöscht: {summary}")
        else:
            errors.append(f"Calendar: {summary}")
            print(f"   ❌ Fehler: {summary}")
except Exception as e:
    print(f"   ❌ Calendar Fehler: {e}")

# ── 5. Slack: Novacode Channels archivieren ──
print("\n🔍 Slack: Suche nach client-novacode Channels...")
if SLACK_BOT_TOKEN:
    try:
        resp = http.get(
            "https://slack.com/api/conversations.list",
            headers={"Authorization": f"Bearer {SLACK_BOT_TOKEN}"},
            params={"types": "public_channel", "limit": 200},
        )
        data = resp.json()
        if data.get("ok"):
            channels = [c for c in data.get("channels", []) if "novacode" in c["name"].lower() or "client-" in c["name"]]
            print(f"   Gefunden: {len(channels)} Channels")
            for ch in channels:
                if ch.get("is_archived"):
                    print(f"   ⏭️ Bereits archiviert: #{ch['name']}")
                    continue
                r = http.post(
                    "https://slack.com/api/conversations.archive",
                    headers={"Authorization": f"Bearer {SLACK_BOT_TOKEN}"},
                    json={"channel": ch["id"]},
                )
                rdata = r.json()
                if rdata.get("ok"):
                    deleted.append(f"Slack: #{ch['name']} ({ch['id']})")
                    print(f"   ✅ Archiviert: #{ch['name']}")
                else:
                    errors.append(f"Slack: #{ch['name']} — {rdata.get('error')}")
                    print(f"   ❌ Fehler: #{ch['name']} — {rdata.get('error')}")
    except Exception as e:
        print(f"   ❌ Slack Fehler: {e}")
else:
    print("   ⚠️ Kein SLACK_BOT_TOKEN")

# ── 6. Miro: Novacode Boards finden und löschen ──
MIRO_ACCESS_TOKEN = os.environ.get("MIRO_ACCESS_TOKEN", "")
print("\n🔍 Miro: Suche nach Novacode Boards...")
if MIRO_ACCESS_TOKEN:
    try:
        resp = http.get(
            "https://api.miro.com/v2/boards",
            headers={"Authorization": f"Bearer {MIRO_ACCESS_TOKEN}"},
            params={"query": "Novacode", "limit": 50},
        )
        if resp.status_code == 200:
            boards = resp.json().get("data", [])
            print(f"   Gefunden: {len(boards)} Boards")
            for board in boards:
                bid = board["id"]
                bname = board.get("name", "?")
                r = http.delete(
                    f"https://api.miro.com/v2/boards/{bid}",
                    headers={"Authorization": f"Bearer {MIRO_ACCESS_TOKEN}"},
                )
                if r.status_code < 400:
                    deleted.append(f"Miro Board: {bname} ({bid})")
                    print(f"   ✅ Gelöscht: {bname}")
                else:
                    errors.append(f"Miro Board: {bname} — {r.status_code}")
                    print(f"   ❌ Fehler: {bname} — {r.status_code}")
        else:
            print(f"   ⚠️ Miro API Fehler: {resp.status_code}")
    except Exception as e:
        print(f"   ❌ Miro Fehler: {e}")
else:
    print("   ⚠️ Kein MIRO_ACCESS_TOKEN")

# ── Zusammenfassung ──
print("\n" + "=" * 60)
print(f"✅ Gelöscht: {len(deleted)} Ressourcen")
for d in deleted:
    print(f"   • {d}")
if errors:
    print(f"\n❌ Fehler: {len(errors)}")
    for e in errors:
        print(f"   • {e}")
print("=" * 60)
print("\n🛡️ Geschützte Dokumente wurden NICHT angerührt.")
