"""
LIST-ONLY: Findet Demo-Testdaten aus vorherigen Runs OHNE zu löschen.
Zeigt was cleanup-all.py löschen würde — als Vorabprüfung.

Ausführen:
  doppler run --project flowstack-claudio --config dev -- python cleanup-list-only.py
"""
import json
import os
import httpx

CLOSE_API_KEY = os.environ.get("CLOSE_API") or os.environ.get("CLOSE_API_KEY") or os.environ.get("CLOSE_API_KEY_V2")
CLICKUP_TOKEN = os.environ.get("CLICKUP_API_TOKEN")
SLACK_BOT_TOKEN = os.environ.get("SLACK_BOT_TOKEN")
MIRO_ACCESS_TOKEN = os.environ.get("MIRO_ACCESS_TOKEN", "")

raw = os.environ.get("FLOWSTACK_GOOGLE_OAUTH_TOKEN", os.environ.get("GOOGLE_OAUTH_TOKEN", "{}"))
creds = json.loads(raw)
GOOGLE_TOKEN = creds.get("token", "")
GOOGLE_REFRESH = creds.get("refresh_token", "")
GOOGLE_CLIENT_ID = creds.get("client_id", "")
GOOGLE_CLIENT_SECRET = creds.get("client_secret", "")

CLICKUP_SPACE_ID = "90189542355"

PROTECTED_IDS = {
    "1TOLqoqvEYy_DTxMb1zSUeq-cmXmNHmmUQe9EG2B1vEY",
    "1de1XU5ykeIw36kKSiorQqzPAGkHfsceflnTCBpVY26Q",
    "1HLMrDn_p1aqL7nnfB09e0mPakj-m0BSIhQwTdkoX03E",
    "1sxB6R6l4DUn10hYEhY5xCEkNxZ4dvE9EUFvgT0hmCz8",
    "1Xp0y_liDQ43AMdH3cjEwxdo9ZSZOP1AlVr8r-pn2Cps",
    "1CEZAzrioyaqn7PMfc0ARadG1Jw5ic-uXTV4tE1aX2PU",
    "1Qe0zXGHVcABIEMTZUn4tMttloGfa14bpCtKU3L95-Qw",
    "13M6owsnBTr6OAElN0LvhF5Oz_Ky4l0OdvhSb2dhfQ7g",
    "1lf2U2ZI47-Oz8eTW8OKziGwN_Z_SAssS8DiJAiiJ5SQ",
    "171Eg7V8jKGOYrqdYOLUM6DvfDodet_mxPrUB5DmMqEs",
    "1ITRWWBL9tY-2AUi4CIB6wbPqbk6CGcv5UB6ePtH87j0",
    "1ZO6yLLW18GLjJd1xuCc8jytaGwPi0jedoSkUR8LO-eM",
    "1RfNMSovKZx43uHrKDNa8G6iBCi_ouRTfShVuoLcuUac",
    "1EmgdSqPPpouA20wY3OhMu1PGCA-Y_aCeztDHUF2zXeY",
    "1-HGe6sCOlaCE-x0uZB_qs-6ZLczlikR181l3ztOoadE",
    "1HiPHnlWd31327uiGMQBRyaAZLhSDP6VaqwrZqPP5k6I",
}

http = httpx.Client(timeout=30)


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


print("=" * 60)
print("LIST-ONLY: Was wuerde cleanup-all.py loeschen?")
print("=" * 60)

# 1. Close Leads
print("\n[Close CRM] Suche Novacode Leads...")
try:
    resp = http.get("https://api.close.com/api/v1/lead/", params={"query": "Novacode", "_limit": 50}, auth=(CLOSE_API_KEY, ""))
    if resp.status_code == 200:
        leads = resp.json().get("data", [])
        print(f"  -> {len(leads)} Leads gefunden")
        for lead in leads:
            print(f"     - {lead.get('display_name', '?')} (id={lead['id']})")
    else:
        print(f"  -> API Fehler: {resp.status_code}")
except Exception as e:
    print(f"  -> Fehler: {e}")

# 2. ClickUp Lists (Space + Folders)
print("\n[ClickUp] Suche Novacode Listen...")
try:
    resp = http.get(f"https://api.clickup.com/api/v2/space/{CLICKUP_SPACE_ID}/list", headers={"Authorization": CLICKUP_TOKEN})
    if resp.status_code == 200:
        lists = resp.json().get("lists", [])
        novacode = [l for l in lists if "novacode" in l["name"].lower()]
        print(f"  -> Space-Listen mit Novacode: {len(novacode)}")
        for lst in novacode:
            print(f"     - {lst['name']} (id={lst['id']})")

    resp = http.get(f"https://api.clickup.com/api/v2/space/{CLICKUP_SPACE_ID}/folder", headers={"Authorization": CLICKUP_TOKEN})
    if resp.status_code == 200:
        folders = resp.json().get("folders", [])
        for folder in folders:
            for lst in folder.get("lists", []):
                if "novacode" in lst["name"].lower():
                    print(f"     - {lst['name']} (id={lst['id']}) [in Folder: {folder.get('name')}]")
except Exception as e:
    print(f"  -> Fehler: {e}")

# 3. Drive Folders
print("\n[Google Drive] Suche Novacode Ordner...")
refresh_google()
try:
    data = google_get(
        "https://www.googleapis.com/drive/v3/files?"
        "q=name+contains+'Novacode'+and+mimeType='application/vnd.google-apps.folder'+and+trashed=false"
        "&fields=files(id,name,parents,createdTime,modifiedTime)&pageSize=50"
    )
    folders = data.get("files", [])
    print(f"  -> {len(folders)} Ordner gefunden")
    for f in folders:
        protected = " [GESCHUETZT - bleibt]" if f["id"] in PROTECTED_IDS else ""
        ct = f.get("createdTime", "")[:10]
        print(f"     - {f['name']} (id={f['id']}, created={ct}){protected}")
except Exception as e:
    print(f"  -> Fehler: {e}")

# 4. Calendar
print("\n[Google Calendar] Suche Kickoff Novacode...")
try:
    data = google_get("https://www.googleapis.com/calendar/v3/calendars/primary/events?q=Kickoff+Novacode&maxResults=50&singleEvents=true")
    events = data.get("items", [])
    print(f"  -> {len(events)} Events gefunden")
    for ev in events:
        start = ev.get("start", {}).get("dateTime", ev.get("start", {}).get("date", ""))
        print(f"     - {ev.get('summary', '?')} ({start}, id={ev['id']})")
except Exception as e:
    print(f"  -> Fehler: {e}")

# 5. Slack
print("\n[Slack] Suche client-novacode Channels...")
if SLACK_BOT_TOKEN:
    try:
        resp = http.get("https://slack.com/api/conversations.list", headers={"Authorization": f"Bearer {SLACK_BOT_TOKEN}"}, params={"types": "public_channel", "limit": 200})
        data = resp.json()
        if data.get("ok"):
            channels = [c for c in data.get("channels", []) if "novacode" in c["name"].lower() or "client-" in c["name"]]
            print(f"  -> {len(channels)} Channels gefunden")
            for ch in channels:
                state = " [bereits archiviert]" if ch.get("is_archived") else ""
                print(f"     - #{ch['name']} (id={ch['id']}){state}")
    except Exception as e:
        print(f"  -> Fehler: {e}")
else:
    print("  -> Kein SLACK_BOT_TOKEN")

# 6. Miro
print("\n[Miro] Suche Novacode Boards...")
if MIRO_ACCESS_TOKEN:
    try:
        resp = http.get("https://api.miro.com/v2/boards", headers={"Authorization": f"Bearer {MIRO_ACCESS_TOKEN}"}, params={"query": "Novacode", "limit": 50})
        if resp.status_code == 200:
            boards = resp.json().get("data", [])
            print(f"  -> {len(boards)} Boards gefunden")
            for b in boards:
                print(f"     - {b.get('name', '?')} (id={b['id']})")
    except Exception as e:
        print(f"  -> Fehler: {e}")
else:
    print("  -> Kein MIRO_ACCESS_TOKEN")

print("\n" + "=" * 60)
print("Nichts wurde geloescht. Bestaetige Cleanup, dann laeuft cleanup-all.py.")
print("=" * 60)
