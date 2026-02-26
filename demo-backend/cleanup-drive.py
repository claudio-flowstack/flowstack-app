#!/usr/bin/env python3
"""Findet und löscht alle Test-Ordner 'Novacode GmbH' in Google Drive.
Lässt vorgefertigte Dokumente (Strategy, Copy, etc.) unangetastet."""
import os
import json
import httpx

_raw = os.environ.get("GOOGLE_CLAUDIO_OAUTH_TOKEN", os.environ.get("GOOGLE_OAUTH_TOKEN", "{}"))
try:
    _creds = json.loads(_raw)
except json.JSONDecodeError:
    _creds = {}
GOOGLE_TOKEN = _creds.get("token", "")
GOOGLE_REFRESH = _creds.get("refresh_token", "")
GOOGLE_CLIENT_ID = _creds.get("client_id", "")
GOOGLE_CLIENT_SECRET = _creds.get("client_secret", "")

# IDs der vorgefertigten Dokumente die NICHT gelöscht werden dürfen
PROTECTED_IDS = {
    "1TOLqoqvEYy_DTxMb1zSUeq-cmXmNHmmUQe9EG2B1vEY",  # Zielgruppen-Avatar
    "1de1XU5ykeIw36kKSiorQqzPAGkHfsceflnTCBpVY26Q",  # Arbeitgeber-Avatar
    "1HLMrDn_p1aqL7nnfB09e0mPakj-m0BSIhQwTdkoX03E",  # Messaging-Matrix
    "1sxB6R6l4DUn10hYEhY5xCEkNxZ4dvE9EUFvgT0hmCz8",  # Creative Briefing
    "1Xp0y_liDQ43AMdH3cjEwxdo9ZSZOP1AlVr8r-pn2Cps",  # Marken-Richtlinien
    "1CEZAzrioyaqn7PMfc0ARadG1Jw5ic-uXTV4tE1aX2PU",  # Landingpage-Texte
    "1Qe0zXGHVcABIEMTZUn4tMttloGfa14bpCtKU3L95-Qw",  # Formularseite-Texte
    "13M6owsnBTr6OAElN0LvhF5Oz_Ky4l0OdvhSb2dhfQ7g",  # Dankeseite-Texte
    "1lf2U2ZI47-Oz8eTW8OKziGwN_Z_SAssS8DiJAiiJ5SQ",  # Anzeigentexte
    "171Eg7V8jKGOYrqdYOLUM6DvfDodet_mxPrUB5DmMqEs",  # Videoskript
    "1ITRWWBL9tY-2AUi4CIB6wbPqbk6CGcv5UB6ePtH87j0",  # Anzeigen-Variationen
    "1ZO6yLLW18GLjJd1xuCc8jytaGwPi0jedoSkUR8LO-eM",  # Transcript
    "1EmgdSqPPpouA20wY3OhMu1PGCA-Y_aCeztDHUF2zXeY",  # Tracking Dashboard
}

_token = GOOGLE_TOKEN

def _refresh_token():
    global _token
    resp = httpx.post("https://oauth2.googleapis.com/token", data={
        "client_id": GOOGLE_CLIENT_ID,
        "client_secret": GOOGLE_CLIENT_SECRET,
        "refresh_token": GOOGLE_REFRESH,
        "grant_type": "refresh_token",
    })
    _token = resp.json()["access_token"]

def _headers():
    return {"Authorization": f"Bearer {_token}"}

def main():
    # Refresh token
    _refresh_token()
    print("Token refreshed.\n")

    # Suche nach "Novacode GmbH" Ordnern
    resp = httpx.get(
        "https://www.googleapis.com/drive/v3/files",
        headers=_headers(),
        params={
            "q": "name='Novacode GmbH' and mimeType='application/vnd.google-apps.folder' and trashed=false",
            "fields": "files(id,name,createdTime)",
            "pageSize": 50,
        },
    )
    folders = resp.json().get("files", [])
    print(f"Gefunden: {len(folders)} 'Novacode GmbH' Ordner\n")

    for f in folders:
        fid = f["id"]
        if fid in PROTECTED_IDS:
            print(f"  SKIP (geschützt): {fid} — {f['createdTime']}")
            continue
        print(f"  LÖSCHEN: {fid} — {f['createdTime']}", end="")
        try:
            resp = httpx.delete(
                f"https://www.googleapis.com/drive/v3/files/{fid}",
                headers=_headers(),
            )
            if resp.status_code in (204, 200):
                print(" ✅")
            else:
                print(f" ❌ {resp.status_code}: {resp.text[:100]}")
        except Exception as e:
            print(f" ❌ {e}")

    # Auch nach Unterordnern suchen die übrig geblieben sein könnten
    for name in ["01_Verwaltung", "02_Strategie", "03_Texte", "04_Creatives", "05_Funnel",
                  "06_Anzeigen", "07_Tracking", "08_Transkripte",
                  "01_Administration", "02_Strategy", "03_Copy", "06_Ads", "08_Transcripts"]:
        resp = httpx.get(
            "https://www.googleapis.com/drive/v3/files",
            headers=_headers(),
            params={
                "q": f"name='{name}' and mimeType='application/vnd.google-apps.folder' and trashed=false",
                "fields": "files(id,name,createdTime,parents)",
                "pageSize": 50,
            },
        )
        orphans = resp.json().get("files", [])
        for o in orphans:
            if o["id"] in PROTECTED_IDS:
                continue
            print(f"  Verwaister Ordner: {o['name']} ({o['id']}) — {o['createdTime']}", end="")
            try:
                dr = httpx.delete(f"https://www.googleapis.com/drive/v3/files/{o['id']}", headers=_headers())
                print(" ✅" if dr.status_code in (204, 200) else f" ❌ {dr.status_code}")
            except Exception as e:
                print(f" ❌ {e}")

    print("\nFertig.")

if __name__ == "__main__":
    main()
