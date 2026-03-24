"""
Canva API Test — Verbindung prüfen + Test-Design erstellen.

Usage:
  doppler run -p fulfillment-automation -c dev_claudio -- python3 canva-test.py
"""

import os, json, requests

# Token laden
_raw = os.environ.get("CANVA_OAUTH_TOKEN", "{}")
_creds = json.loads(_raw) if _raw else {}
ACCESS_TOKEN = _creds.get("access_token", "")
REFRESH_TOKEN = _creds.get("refresh_token", "")
CLIENT_ID = os.environ.get("CANVA_CLIENT_ID", "")
CLIENT_SECRET = os.environ.get("CANVA_CLIENT_SECRET", "")

BASE = "https://api.canva.com/rest/v1"

def headers():
    return {"Authorization": f"Bearer {ACCESS_TOKEN}", "Content-Type": "application/json"}

def refresh():
    global ACCESS_TOKEN
    resp = requests.post(f"{BASE}/oauth/token", data={
        "grant_type": "refresh_token",
        "refresh_token": REFRESH_TOKEN,
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
    })
    if resp.ok:
        ACCESS_TOKEN = resp.json()["access_token"]
        print("Token refreshed")
    else:
        print(f"Refresh fehlgeschlagen: {resp.status_code} {resp.text}")

def api(method, path, data=None):
    resp = requests.request(method, f"{BASE}{path}", headers=headers(), json=data)
    if resp.status_code == 401:
        refresh()
        resp = requests.request(method, f"{BASE}{path}", headers=headers(), json=data)
    return resp

print("=" * 50)
print("Canva API Test")
print("=" * 50)

# Test 1: Profil abrufen
print("\n1. Profil abrufen...")
r = api("GET", "/users/me")
if r.ok:
    user = r.json()
    name = user.get("display_name", user.get("profile", {}).get("display_name", "?"))
    print(f"   Verbunden als: {name}")
    print(f"   Response: {json.dumps(user, indent=2)[:300]}")
else:
    print(f"   FEHLER: {r.status_code} {r.text[:200]}")

# Test 2: Brand Templates auflisten
print("\n2. Brand Templates suchen...")
r = api("GET", "/brand-templates?limit=5")
if r.ok:
    data = r.json()
    templates = data.get("items", [])
    if templates:
        print(f"   {len(templates)} Brand Template(s) gefunden:")
        for t in templates:
            tid = t.get("id", "?")
            title = t.get("title", "Ohne Titel")
            print(f"   - {title} (ID: {tid})")
    else:
        print("   Keine Brand Templates gefunden.")
        print("   (Du musst erst ein Design als Brand Template veröffentlichen)")
else:
    print(f"   FEHLER: {r.status_code} {r.text[:200]}")

# Test 3: Design erstellen
print("\n3. Test-Design erstellen...")
r = api("POST", "/designs", {
    "design_type": {"type": "custom", "width": 1080, "height": 1080},
    "title": "Flowstack Test — Canva API",
})
if r.ok:
    design = r.json().get("design", {})
    design_id = design.get("id", "?")
    design_url = design.get("urls", {}).get("edit_url", "?")
    print(f"   Design erstellt!")
    print(f"   ID: {design_id}")
    print(f"   URL: {design_url}")
else:
    print(f"   FEHLER: {r.status_code} {r.text[:300]}")

print("\n" + "=" * 50)
print("Test abgeschlossen.")
print("=" * 50)
