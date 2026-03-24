"""
Re-authorize Google OAuth with Desktop Client (gmail.readonly scope).
Run: doppler run -- python3 reauth-google.py
Opens Chrome with Flowstack-system profile (Profile 22).
"""
import os, json, subprocess, http.server, threading, urllib.parse, urllib.request

CLIENT_ID = os.environ["FLOWSTACK_GOOGLE_DESKTOP_CLIENT_ID"]
CLIENT_SECRET = os.environ["FLOWSTACK_GOOGLE_DESKTOP_CLIENT_SECRET"]

SCOPES = [
    "https://www.googleapis.com/auth/drive",
    "https://www.googleapis.com/auth/documents",
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/calendar",
    "https://www.googleapis.com/auth/gmail.send",
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/gmail.modify",
    "https://www.googleapis.com/auth/gmail.settings.basic",
]

REDIRECT_URI = "http://localhost:8085"
auth_code = None

class Handler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        global auth_code
        qs = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)
        auth_code = qs.get("code", [None])[0]
        self.send_response(200)
        self.send_header("Content-Type", "text/html")
        self.end_headers()
        self.wfile.write(b"<h2>Done! Du kannst diesen Tab schliessen.</h2>")
    def log_message(self, *args):
        pass

server = http.server.HTTPServer(("localhost", 8085), Handler)
thread = threading.Thread(target=server.handle_request)
thread.start()

auth_url = (
    "https://accounts.google.com/o/oauth2/v2/auth?"
    + urllib.parse.urlencode({
        "client_id": CLIENT_ID,
        "redirect_uri": REDIRECT_URI,
        "response_type": "code",
        "scope": " ".join(SCOPES),
        "access_type": "offline",
        "prompt": "consent",
    })
)

print("\nChrome oeffnet sich mit Flowstack-system Profil...\n")
subprocess.Popen([
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "--profile-directory=Profile 22",
    auth_url,
], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

print("Warte auf Google Login... (max 2 Min)")
thread.join(timeout=120)
server.server_close()

if not auth_code:
    print("\nERROR: Kein Auth-Code erhalten.")
    exit(1)

# Exchange code for tokens
data = urllib.parse.urlencode({
    "code": auth_code,
    "client_id": CLIENT_ID,
    "client_secret": CLIENT_SECRET,
    "redirect_uri": REDIRECT_URI,
    "grant_type": "authorization_code",
}).encode()

req = urllib.request.Request("https://oauth2.googleapis.com/token", data=data)
resp = urllib.request.urlopen(req)
tokens = json.loads(resp.read())

new_creds = {
    "token": tokens["access_token"],
    "refresh_token": tokens.get("refresh_token"),
    "token_uri": "https://oauth2.googleapis.com/token",
    "client_id": CLIENT_ID,
    "client_secret": CLIENT_SECRET,
    "scopes": SCOPES,
}

token_json = json.dumps(new_creds)

# Direkt in Doppler speichern
result = subprocess.run(
    ["doppler", "secrets", "set", "FLOWSTACK_GOOGLE_OAUTH_TOKEN",
     "--project", "fulfillment-automation", "--config", "dev_claudio"],
    input=token_json,
    capture_output=True, text=True,
)

if result.returncode == 0:
    print("\n--- Flowstack OAuth Token in Doppler gespeichert! ---\n")
else:
    print("\nFehler beim Speichern in Doppler:")
    print(result.stderr)
    print("\nManuell speichern:\n")
    print(token_json)
    print()
