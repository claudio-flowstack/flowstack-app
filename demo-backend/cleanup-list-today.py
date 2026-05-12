"""LIST-ONLY: Was wurde im letzten Run (heute) angelegt?"""
import json
import os
from datetime import datetime, timezone

import httpx

CLOSE_API_KEY = os.environ.get("CLOSE_API") or os.environ.get("CLOSE_API_KEY")
CLICKUP_TOKEN = os.environ.get("CLICKUP_API_TOKEN")

raw = os.environ.get("FLOWSTACK_GOOGLE_OAUTH_TOKEN", os.environ.get("GOOGLE_OAUTH_TOKEN", "{}"))
creds = json.loads(raw)
GOOGLE_TOKEN = creds.get("token", "")
GOOGLE_REFRESH = creds.get("refresh_token", "")
GOOGLE_CLIENT_ID = creds.get("client_id", "")
GOOGLE_CLIENT_SECRET = creds.get("client_secret", "")

DRIVE_FOLDER_ID = "1B4XTzPOkuHitdz3Ci2UPpn2p4i88NJ7U"  # Novacode GmbH
CLICKUP_LIST_ID = "901817800476"  # Novacode GmbH - Recruiting

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
TODAY_UTC = datetime.now(timezone.utc).strftime("%Y-%m-%d")


def refresh_google():
    global GOOGLE_TOKEN
    resp = http.post("https://oauth2.googleapis.com/token", data={
        "grant_type": "refresh_token", "refresh_token": GOOGLE_REFRESH,
        "client_id": GOOGLE_CLIENT_ID, "client_secret": GOOGLE_CLIENT_SECRET,
    })
    if resp.status_code == 200:
        GOOGLE_TOKEN = resp.json()["access_token"]


def google_get(url):
    resp = http.get(url, headers={"Authorization": f"Bearer {GOOGLE_TOKEN}"})
    if resp.status_code == 401:
        refresh_google()
        resp = http.get(url, headers={"Authorization": f"Bearer {GOOGLE_TOKEN}"})
    return resp.json() if resp.status_code == 200 else {}


print(f"=== Letzter Run (UTC heute = {TODAY_UTC}) ===\n")

# Drive: Inhalt des Novacode GmbH Ordners, sortiert nach createdTime
print("[Drive] Inhalt von Novacode-GmbH-Ordner (createdTime desc):")
refresh_google()
data = google_get(
    f"https://www.googleapis.com/drive/v3/files?"
    f"q='{DRIVE_FOLDER_ID}'+in+parents+and+trashed=false"
    f"&fields=files(id,name,mimeType,createdTime,modifiedTime)"
    f"&orderBy=createdTime+desc&pageSize=200"
)
files = data.get("files", [])
today_files = []
older_files = []
for f in files:
    is_today = f.get("createdTime", "").startswith(TODAY_UTC)
    is_protected = f["id"] in PROTECTED_IDS
    flag = ""
    if is_protected: flag = " [GESCHUETZT]"
    elif is_today: flag = " [HEUTE]"
    line = f"  {f.get('createdTime', '')[:19]} | {f['name']} (id={f['id']}, type={f['mimeType'].split('.')[-1]}){flag}"
    if is_today: today_files.append(line)
    else: older_files.append(line)
print(f"  Total: {len(files)} | heute: {len(today_files)}\n")
print("  --- HEUTE ---")
for ln in today_files: print(ln)
print(f"\n  --- AELTER (erste 10 von {len(older_files)}) ---")
for ln in older_files[:10]: print(ln)

# ClickUp Tasks
print("\n[ClickUp] Tasks in 'Novacode GmbH - Recruiting' Liste:")
resp = http.get(
    f"https://api.clickup.com/api/v2/list/{CLICKUP_LIST_ID}/task",
    headers={"Authorization": CLICKUP_TOKEN},
    params={"include_closed": "true", "subtasks": "true"},
)
if resp.status_code == 200:
    tasks = resp.json().get("tasks", [])
    today_tasks = []
    older_tasks = []
    for t in tasks:
        date_created_ms = int(t.get("date_created", 0))
        date_str = datetime.fromtimestamp(date_created_ms / 1000, tz=timezone.utc).strftime("%Y-%m-%d %H:%M")
        is_today = date_str.startswith(TODAY_UTC)
        line = f"  {date_str} | {t['name']} (id={t['id']})"
        if is_today: today_tasks.append(line)
        else: older_tasks.append(line)
    print(f"  Total: {len(tasks)} | heute: {len(today_tasks)}\n")
    print("  --- HEUTE ---")
    for ln in today_tasks: print(ln)
    print(f"\n  --- AELTER (erste 10 von {len(older_tasks)}) ---")
    for ln in older_tasks[:10]: print(ln)
else:
    print(f"  Fehler: {resp.status_code} {resp.text[:200]}")

# Calendar — schon gefiltert, nur kurz
print(f"\n[Calendar] Kickoff-Events von heute schon im ersten Listing gesehen:")
print("  - 2026-05-06T19:00 ist HEUTE")
print("  - 2026-04-28T14:00 ist 8 Tage alt")

# Slack — schon gefiltert
print("\n[Slack] Aktive (nicht archivierte) Channels:")
print("  - #novacode-gmbh-5 (id=C0B1S28GCSU) — einzig aktiver (alles andere bereits archiviert)")
