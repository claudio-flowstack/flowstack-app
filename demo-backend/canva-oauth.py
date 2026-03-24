"""
Canva OAuth Token holen — einmalig ausführen.

Usage:
  doppler run -p fulfillment-automation -c dev_claudio -- python3 canva-oauth.py

1. Öffnet Browser → Canva Login → "Erlauben" klicken
2. Fängt Token ab
3. Speichert in Doppler als CANVA_OAUTH_TOKEN
"""

import os, json, webbrowser, subprocess
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import requests

CLIENT_ID = os.environ.get("CANVA_CLIENT_ID", "")
CLIENT_SECRET = os.environ.get("CANVA_CLIENT_SECRET", "")
REDIRECT_URI = "http://127.0.0.1:8090/callback"
SCOPES = "design:content:read design:content:write design:meta:read asset:read asset:write brandtemplate:meta:read brandtemplate:content:read profile:read"

if not CLIENT_ID or not CLIENT_SECRET:
    print("FEHLER: CANVA_CLIENT_ID oder CANVA_CLIENT_SECRET nicht in Doppler gefunden!")
    exit(1)

# --- Code Verifier für PKCE (Canva braucht das) ---
import hashlib, base64, secrets

code_verifier = secrets.token_urlsafe(64)[:128]
code_challenge = base64.urlsafe_b64encode(
    hashlib.sha256(code_verifier.encode()).digest()
).decode().rstrip("=")

auth_url = (
    f"https://www.canva.com/api/oauth/authorize"
    f"?client_id={CLIENT_ID}"
    f"&redirect_uri={REDIRECT_URI}"
    f"&response_type=code"
    f"&scope={SCOPES.replace(' ', '%20')}"
    f"&code_challenge={code_challenge}"
    f"&code_challenge_method=S256"
)

token_data = {}


class CallbackHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        global token_data
        parsed = urlparse(self.path)
        params = parse_qs(parsed.query)

        if "code" not in params:
            self.send_response(400)
            self.end_headers()
            self.wfile.write(b"Fehler: Kein Code erhalten.")
            print(f"\nFEHLER: {params}")
            return

        code = params["code"][0]
        print(f"\nCode erhalten, tausche gegen Token...")

        # Code gegen Token tauschen
        resp = requests.post(
            "https://api.canva.com/rest/v1/oauth/token",
            data={
                "grant_type": "authorization_code",
                "code": code,
                "client_id": CLIENT_ID,
                "client_secret": CLIENT_SECRET,
                "redirect_uri": REDIRECT_URI,
                "code_verifier": code_verifier,
            },
        )

        if resp.status_code != 200:
            self.send_response(500)
            self.end_headers()
            self.wfile.write(f"Token-Fehler: {resp.status_code} {resp.text}".encode())
            print(f"TOKEN FEHLER: {resp.status_code} {resp.text}")
            return

        token_data = resp.json()
        print(f"Token erhalten!")
        print(f"  access_token: {token_data.get('access_token', '')[:20]}...")
        print(f"  refresh_token: {token_data.get('refresh_token', '')[:20]}...")
        print(f"  expires_in: {token_data.get('expires_in', '')}s")

        self.send_response(200)
        self.send_header("Content-Type", "text/html")
        self.end_headers()
        self.wfile.write(b"<html><body><h1>Canva Token erhalten!</h1><p>Du kannst dieses Fenster schliessen.</p></body></html>")

    def log_message(self, format, *args):
        pass  # Kein Server-Log Spam


print("=" * 50)
print("Canva OAuth — Token holen")
print("=" * 50)
print(f"\nClient ID: {CLIENT_ID}")
print(f"Redirect:  {REDIRECT_URI}")
print(f"\nOeffne Browser...")

webbrowser.open(auth_url)

print("Warte auf Callback auf http://127.0.0.1:8090 ...")
print("(Im Browser 'Erlauben' klicken)\n")

server = HTTPServer(("127.0.0.1", 8090), CallbackHandler)
server.handle_request()  # Nur ein Request, dann weiter

if not token_data:
    print("\nKein Token erhalten. Abbruch.")
    exit(1)

# In Doppler speichern
print("\nSpeichere in Doppler als CANVA_OAUTH_TOKEN...")

doppler_value = json.dumps({
    "access_token": token_data.get("access_token", ""),
    "refresh_token": token_data.get("refresh_token", ""),
    "token_type": token_data.get("token_type", "Bearer"),
    "expires_in": token_data.get("expires_in", 0),
    "scope": token_data.get("scope", ""),
})

result = subprocess.run(
    ["doppler", "secrets", "set", "-p", "fulfillment-automation", "-c", "dev_claudio", f"CANVA_OAUTH_TOKEN={doppler_value}"],
    capture_output=True, text=True,
)

if result.returncode == 0:
    print("Fertig! CANVA_OAUTH_TOKEN in Doppler gespeichert.")
else:
    print(f"Doppler Fehler: {result.stderr}")
    print(f"\nFallback — Token manuell speichern:")
    print(doppler_value)
