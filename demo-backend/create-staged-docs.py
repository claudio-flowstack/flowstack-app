#!/usr/bin/env python3
"""
Create 12 professionally formatted Google Docs for NOVACODE Recruiting Campaign.
Uses Google Drive API with HTML upload → Google Docs conversion.
"""

import subprocess
import json
import sys
import time
import httpx
from datetime import datetime

# ─────────────────────────────────────────────
# Configuration
# ─────────────────────────────────────────────

DOPPLER_PATH = "/Users/claudiodifranco/.local/bin/doppler"
MANIFEST_PATH = "/Users/claudiodifranco/Desktop/Flowstack /04_Marketing/Webseite/Seiten code/Flowstack-Platform/demo-backend/staged-docs-manifest.json"

# Common CSS styles for all documents
STYLE = """
<style>
  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    color: #1a1a2e;
    line-height: 1.7;
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
  }
  h1 {
    color: #0a1628;
    font-size: 28px;
    font-weight: 700;
    border-bottom: 3px solid #00e5ff;
    padding-bottom: 12px;
    margin-bottom: 24px;
  }
  h2 {
    color: #0a1628;
    font-size: 22px;
    font-weight: 700;
    margin-top: 32px;
    margin-bottom: 16px;
    border-left: 4px solid #00e5ff;
    padding-left: 12px;
  }
  h3 {
    color: #0a1628;
    font-size: 18px;
    font-weight: 600;
    margin-top: 24px;
    margin-bottom: 12px;
  }
  table {
    border-collapse: collapse;
    width: 100%;
    margin: 16px 0;
  }
  th {
    background-color: #0a1628;
    color: #ffffff;
    padding: 10px 14px;
    text-align: left;
    font-weight: 600;
    font-size: 14px;
  }
  td {
    padding: 10px 14px;
    border: 1px solid #e0e0e0;
    font-size: 14px;
  }
  tr:nth-child(even) { background-color: #f8f9fa; }
  blockquote {
    border-left: 4px solid #00e5ff;
    margin: 16px 0;
    padding: 12px 20px;
    background-color: #f0fafe;
    font-style: italic;
    color: #333;
  }
  ul { margin: 12px 0; padding-left: 24px; }
  li { margin-bottom: 6px; }
  hr {
    border: none;
    border-top: 2px solid #e0e0e0;
    margin: 28px 0;
  }
  .accent { color: #00e5ff; font-weight: 600; }
  .highlight {
    background-color: #f0fafe;
    padding: 16px;
    border-radius: 8px;
    margin: 16px 0;
    border: 1px solid #00e5ff;
  }
  .tag {
    display: inline-block;
    background-color: #0a1628;
    color: #00e5ff;
    padding: 2px 10px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 600;
    margin-right: 6px;
  }
  .meta {
    color: #888;
    font-size: 13px;
    margin-bottom: 24px;
  }
</style>
"""

def wrap_html(body_content):
    return f"""<!DOCTYPE html>
<html lang="de">
<head><meta charset="UTF-8">{STYLE}</head>
<body>{body_content}</body>
</html>"""


# ─────────────────────────────────────────────
# Token Management
# ─────────────────────────────────────────────

def get_credentials():
    """Get OAuth credentials from Doppler."""
    print("[1/3] Fetching credentials from Doppler...")
    result = subprocess.run(
        [DOPPLER_PATH, "secrets", "get", "GOOGLE_CLAUDIO_OAUTH_TOKEN", "--plain",
         "--project", "fulfillment-automation", "--config", "dev_claudio"],
        capture_output=True, text=True
    )
    if result.returncode != 0:
        print(f"ERROR: Doppler failed: {result.stderr}")
        sys.exit(1)
    creds = json.loads(result.stdout)
    return {
        "token": creds["token"],
        "refresh_token": creds["refresh_token"],
        "client_id": creds["client_id"],
        "client_secret": creds["client_secret"],
    }


def refresh_token(creds):
    """Refresh the OAuth token if expired."""
    print("    Refreshing OAuth token...")
    resp = httpx.post("https://oauth2.googleapis.com/token", data={
        "client_id": creds["client_id"],
        "client_secret": creds["client_secret"],
        "refresh_token": creds["refresh_token"],
        "grant_type": "refresh_token",
    }, timeout=15)
    if resp.status_code == 200:
        new_token = resp.json().get("access_token")
        if new_token:
            creds["token"] = new_token
            print("    Token refreshed successfully.")
            return creds
    print(f"    WARNING: Token refresh failed ({resp.status_code}): {resp.text}")
    return creds


def ensure_valid_token(creds):
    """Test current token; refresh if invalid."""
    resp = httpx.get(
        "https://www.googleapis.com/drive/v3/about?fields=user",
        headers={"Authorization": f"Bearer {creds['token']}"},
        timeout=10,
    )
    if resp.status_code == 401:
        creds = refresh_token(creds)
    elif resp.status_code == 200:
        user = resp.json().get("user", {}).get("displayName", "Unknown")
        print(f"    Authenticated as: {user}")
    return creds


# ─────────────────────────────────────────────
# Google Docs Creation
# ─────────────────────────────────────────────

def create_doc(token, name, html_content, retries=2):
    """Create Google Doc from HTML via multipart upload."""
    metadata = json.dumps({
        "name": name,
        "mimeType": "application/vnd.google-apps.document"
    })
    boundary = "doc_boundary_fs_12345"
    body = (
        f"--{boundary}\r\n"
        f"Content-Type: application/json; charset=UTF-8\r\n\r\n"
        f"{metadata}\r\n"
        f"--{boundary}\r\n"
        f"Content-Type: text/html; charset=UTF-8\r\n\r\n"
        f"{html_content}\r\n"
        f"--{boundary}--"
    )

    for attempt in range(retries + 1):
        try:
            resp = httpx.post(
                "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": f"multipart/related; boundary={boundary}",
                },
                content=body.encode("utf-8"),
                timeout=30,
            )
            if resp.status_code in (200, 201):
                data = resp.json()
                doc_id = data.get("id", "")
                url = f"https://docs.google.com/document/d/{doc_id}/edit"
                return {"id": doc_id, "url": url, "name": name, "status": "created"}
            else:
                print(f"    WARN: Attempt {attempt+1} failed ({resp.status_code}): {resp.text[:200]}")
                if attempt < retries:
                    time.sleep(2)
        except Exception as e:
            print(f"    ERROR: Attempt {attempt+1} exception: {e}")
            if attempt < retries:
                time.sleep(2)

    return {"id": "", "url": "", "name": name, "status": "failed"}


# ─────────────────────────────────────────────
# Document Content Generators
# ─────────────────────────────────────────────

def doc_02_zielgruppen_avatar():
    name = "#02 – Zielgruppen-Avatar | NOVACODE Recruiting"
    html = wrap_html("""
<h1>Zielgruppen-Avatar</h1>
<p class="meta">NOVACODE Solutions GmbH &middot; Recruiting-Kampagne &middot; Senior Fullstack Developer</p>

<h2>Demografisches Profil</h2>
<ul>
  <li><strong>Alter:</strong> 30–40 Jahre</li>
  <li><strong>Geschlecht:</strong> Überwiegend männlich (Branchenrealität), aber inklusiv ansprechen</li>
  <li><strong>Standort:</strong> NRW, optional deutschlandweit</li>
  <li><strong>Familienstand:</strong> Häufig in fester Partnerschaft oder verheiratet, teilweise mit Kind</li>
  <li><strong>Bildung:</strong> Informatik-Studium oder vergleichbar, teilweise Quereinsteiger</li>
</ul>

<hr>

<h2>Berufliches Profil</h2>
<table border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse; width:100%">
  <tr><th>Merkmal</th><th>Detail</th></tr>
  <tr><td><strong>Rolle</strong></td><td>Senior Fullstack Developer</td></tr>
  <tr><td><strong>Stack</strong></td><td>React, TypeScript, Node.js, Go, PostgreSQL, AWS, Docker</td></tr>
  <tr><td><strong>Erfahrung</strong></td><td>4–10 Jahre</td></tr>
  <tr><td><strong>Aktueller AG</strong></td><td>Konzern / großes Unternehmen (500–2.000+ MA)</td></tr>
  <tr><td><strong>Gehalt aktuell</strong></td><td>70.000–90.000 €</td></tr>
  <tr><td><strong>Suchverhalten</strong></td><td>Passiv – nicht aktiv auf Jobsuche</td></tr>
</table>

<hr>

<h2>Psychografisches Profil</h2>
<ul>
  <li>Identifiziert sich als <strong>&bdquo;Engineer&ldquo;</strong>, nicht als &bdquo;Angestellter&ldquo;</li>
  <li>Hoher Anspruch an technische Exzellenz</li>
  <li>Autonomie und Eigenverantwortung sind Kernwerte</li>
  <li>Misstrauisch gegenüber Corporate-Sprache und Buzzwords</li>
  <li>Entscheidet rational, braucht konkrete Fakten</li>
  <li>Community-affin: GitHub, Stack Overflow, Tech-Twitter, Podcasts</li>
</ul>

<hr>

<h2>Pain Points &amp; Frustrationen</h2>
<blockquote>&bdquo;Ich programmiere eigentlich nicht mehr. Ich verschiebe Tickets.&ldquo; – <strong>Identitätsverlust</strong></blockquote>
<blockquote>&bdquo;Ich merke, dass ich mich fachlich zurückentwickle.&ldquo; – <strong>Stagnation</strong></blockquote>
<blockquote>&bdquo;6 Wochen an einem Feature – nie deployed.&ldquo; – <strong>Feature-Friedhof</strong></blockquote>
<blockquote>&bdquo;3 Meetings vormittags, nachmittags keine Energie mehr.&ldquo; – <strong>Meeting-Überflutung</strong></blockquote>
<ul>
  <li><strong>Kontrollverlust:</strong> Management bestimmt Architektur</li>
  <li><strong>Frustration:</strong> Technische Schulden werden ignoriert</li>
</ul>

<hr>

<h2>Wünsche &amp; Motivationen</h2>
<ol>
  <li><strong>&bdquo;Ich will wieder bauen.&ldquo;</strong> – Technische Ownership</li>
  <li>Architekturentscheidungen selbst treffen</li>
  <li>Code in Produktion sehen</li>
  <li>Mit einem starken Team arbeiten</li>
  <li>Fachliche Weiterentwicklung</li>
  <li>Work-Life-Balance ohne Überstundenkultur</li>
</ol>

<hr>

<h2>Einwände &amp; Bedenken</h2>
<ol>
  <li><strong>&bdquo;Bestimmt ein Chaos-Startup.&ldquo;</strong> – Angst vor Instabilität</li>
  <li>Überstunden und falsche Versprechen</li>
  <li><strong>&bdquo;Team könnte technisch schwach sein.&ldquo;</strong> – Qualitätsbedenken</li>
  <li>Gehaltsrisiko bei Wechsel</li>
  <li>Zu kleine Firma = keine Karriere?</li>
</ol>

<hr>

<h2>Entscheidungsprozess</h2>
<table border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse; width:100%">
  <tr><th>Phase</th><th>Beschreibung</th></tr>
  <tr><td><strong>Trigger</strong></td><td>Wird angeschrieben oder sieht Ad im Feed</td></tr>
  <tr><td><strong>Research</strong></td><td>Website, LinkedIn, Glassdoor, GitHub</td></tr>
  <tr><td><strong>Validation</strong></td><td>Gespräch mit echtem Developer, nicht HR</td></tr>
  <tr><td><strong>Entscheidung</strong></td><td>Rational, braucht Sicherheit (unbefristet, stabil, keine Überstunden)</td></tr>
  <tr><td><strong>Timeline</strong></td><td>2–6 Wochen vom Erstkontakt bis Zusage</td></tr>
</table>
""")
    return name, html


def doc_03_arbeitgeber_avatar():
    name = "#03 – Arbeitgeber-Avatar | NOVACODE Recruiting"
    html = wrap_html("""
<h1>Arbeitgeber-Avatar</h1>
<p class="meta">NOVACODE Solutions GmbH &middot; Employer Brand Positioning</p>

<h2>Unternehmensprofil</h2>
<table border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse; width:100%">
  <tr><th>Merkmal</th><th>Detail</th></tr>
  <tr><td><strong>Name</strong></td><td>NOVACODE Solutions GmbH</td></tr>
  <tr><td><strong>Gegründet</strong></td><td>2020</td></tr>
  <tr><td><strong>Standort</strong></td><td>Düsseldorf (Hybrid)</td></tr>
  <tr><td><strong>Mitarbeiter</strong></td><td>19 (14 Entwickler)</td></tr>
  <tr><td><strong>Durchschnittsalter Dev-Team</strong></td><td>32</td></tr>
  <tr><td><strong>Finanzierung</strong></td><td>Bootstrapped, profitabel</td></tr>
  <tr><td><strong>Kunden</strong></td><td>Mittelständische Industrieunternehmen (100–800 MA)</td></tr>
  <tr><td><strong>Leistung</strong></td><td>Individuelle Softwarelösungen, interne Tools, Prozessautomatisierung</td></tr>
</table>

<hr>

<h2>Kernpositionierung</h2>
<div class="highlight">
  <strong style="color:#0a1628; font-size:18px;">&bdquo;Bei NOVACODE baust du nicht nur Software — du gestaltest die Zukunft mit.&ldquo;</strong><br><br>
  Positionierung als Gegenpol zum Konzern: Hier ist jeder Engineer relevant, jede Entscheidung zählt, jeder Code geht live.
</div>

<hr>

<h2>Unique Selling Propositions</h2>
<table border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse; width:100%">
  <tr><th>USP</th><th>Konkret</th><th>Beweis</th></tr>
  <tr><td><strong>Technische Ownership</strong></td><td>Du entscheidest über Architektur</td><td>Kein Management-Override, direkte Projektverantwortung</td></tr>
  <tr><td><strong>Code geht live</strong></td><td>Features werden deployed, nicht archiviert</td><td>Reale Kundenprodukte im Einsatz</td></tr>
  <tr><td><strong>Senior-Team</strong></td><td>14 Entwickler, Durchschnittsalter 32</td><td>Keine Junior-Betreuung, Arbeit auf Augenhöhe</td></tr>
  <tr><td><strong>Ehrliche Kommunikation</strong></td><td>Kein Buzzword-Marketing</td><td>&bdquo;Wir haben auch Legacy-Code. Aber wir sind ehrlich darüber.&ldquo;</td></tr>
  <tr><td><strong>Stabilität ohne Konzern</strong></td><td>6 Jahre, bootstrapped, profitabel</td><td>Unbefristete Verträge, keine Überstundenkultur</td></tr>
  <tr><td><strong>Moderner Stack</strong></td><td>React, TypeScript, Node.js, Go</td><td>Keine veralteten Systeme als Hauptprojekte</td></tr>
</table>

<hr>

<h2>Arbeitgeberversprechen</h2>
<p>An Engineer who joins NOVACODE will:</p>
<ol>
  <li><strong>Deploy code on day 1</strong></li>
  <li><strong>Make architecture decisions</strong></li>
  <li><strong>Work on real products</strong> for real clients</li>
  <li>Have <strong>30 vacation days</strong>, <strong>3.000 € training budget</strong></li>
  <li>Choose their own hardware</li>
  <li>Work in a team that <strong>pushes each other technically</strong></li>
</ol>

<hr>

<h2>Differenzierung vom Wettbewerb</h2>
<table border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse; width:100%">
  <tr><th>Wir sagen</th><th>Wettbewerber sagen</th><th>Unterschied</th></tr>
  <tr><td>&bdquo;Wir haben auch Legacy-Code&ldquo;</td><td>&bdquo;100% Greenfield&ldquo;</td><td><strong>Ehrlichkeit</strong> vs. Marketing</td></tr>
  <tr><td>&bdquo;14 Entwickler&ldquo;</td><td>&bdquo;Wir sind 500+&ldquo;</td><td><strong>Persönlich</strong> vs. Anonymität</td></tr>
  <tr><td>&bdquo;Kein 6h Coding-Test&ldquo;</td><td>&bdquo;Mehrstufiges Assessment&ldquo;</td><td><strong>Respekt</strong> vs. Bürokratie</td></tr>
  <tr><td>&bdquo;Du entscheidest über Architektur&ldquo;</td><td>&bdquo;Flache Hierarchien&ldquo;</td><td><strong>Konkret</strong> vs. Buzzword</td></tr>
</table>

<hr>

<h2>Tonalität &amp; Sprache</h2>
<ul>
  <li><strong>Du</strong> statt Sie</li>
  <li><strong>Technisch</strong> statt Marketing-Sprech</li>
  <li><strong>Ehrlich</strong> statt übertrieben</li>
  <li><strong>Direkt</strong> statt diplomatisch</li>
  <li>Begriffe die Entwickler nutzen, nicht HR</li>
</ul>

<hr>

<h2>Anti-Muster (Was wir NICHT sagen)</h2>
<ul>
  <li style="color:#cc0000;">&#10060; &bdquo;Flache Hierarchien&ldquo;</li>
  <li style="color:#cc0000;">&#10060; &bdquo;Wir sind wie eine Familie&ldquo;</li>
  <li style="color:#cc0000;">&#10060; &bdquo;Startup-Mentalität&ldquo;</li>
  <li style="color:#cc0000;">&#10060; &bdquo;Dynamisches Umfeld&ldquo;</li>
  <li style="color:#cc0000;">&#10060; Unkonkrete Tech-Stacks</li>
</ul>
""")
    return name, html


def doc_04_messaging_matrix():
    name = "#04 – Messaging-Matrix | NOVACODE Recruiting"
    html = wrap_html("""
<h1>Messaging-Matrix</h1>
<p class="meta">NOVACODE Solutions GmbH &middot; Messaging Framework &middot; Senior Fullstack Developer</p>

<h2>Kernbotschaft</h2>
<div class="highlight">
  <strong style="font-size:20px; color:#0a1628;">&bdquo;Triff Architekturentscheidungen statt Jira-Felder zu pflegen.&ldquo;</strong>
</div>

<h2>Unterstützende Botschaften</h2>
<ol>
  <li>&bdquo;Hier bist du wieder Entwickler.&ldquo;</li>
  <li>&bdquo;Code, der in Produktion geht.&ldquo;</li>
  <li>&bdquo;Ein Team aus Seniors, das sich gegenseitig pusht.&ldquo;</li>
  <li>&bdquo;Kein Buzzword-Marketing. Nur Fakten.&ldquo;</li>
</ol>

<hr>

<h2>Message Angle 1: Identitätsverlust</h2>
<table border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse; width:100%">
  <tr><th style="width:20%">Element</th><th>Inhalt</th></tr>
  <tr><td><strong>Hook</strong></td><td>&bdquo;Programmierst du noch – oder verwaltest du nur noch Tickets?&ldquo;</td></tr>
  <tr><td><strong>Problem</strong></td><td>Senior Engineers haben aufgehört, Entwickler zu sein</td></tr>
  <tr><td><strong>Solution</strong></td><td>Bei NOVACODE triffst du Architekturentscheidungen</td></tr>
  <tr><td><strong>CTA</strong></td><td>&bdquo;Bewirb dich in 60 Sekunden.&ldquo;</td></tr>
</table>

<h2>Message Angle 2: Stagnation</h2>
<table border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse; width:100%">
  <tr><th style="width:20%">Element</th><th>Inhalt</th></tr>
  <tr><td><strong>Hook</strong></td><td>&bdquo;Ich merke, dass ich mich fachlich zurückentwickle.&ldquo;</td></tr>
  <tr><td><strong>Problem</strong></td><td>Kein Wachstum trotz gutem Gehalt</td></tr>
  <tr><td><strong>Solution</strong></td><td>Team aus Seniors, 3.000 € Weiterbildung, echte Herausforderungen</td></tr>
  <tr><td><strong>CTA</strong></td><td>&bdquo;Kein CV nötig. Nur du und dein Tech-Profil.&ldquo;</td></tr>
</table>

<h2>Message Angle 3: Feature-Friedhof</h2>
<table border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse; width:100%">
  <tr><th style="width:20%">Element</th><th>Inhalt</th></tr>
  <tr><td><strong>Hook</strong></td><td>&bdquo;6 Wochen an einem Feature – nie deployed.&ldquo;</td></tr>
  <tr><td><strong>Problem</strong></td><td>Arbeit ohne Impact, Management-Chaos</td></tr>
  <tr><td><strong>Solution</strong></td><td>Bei NOVACODE geht Code live. Du siehst den Impact.</td></tr>
  <tr><td><strong>CTA</strong></td><td>&bdquo;Direkt deployen ab Tag 1.&ldquo;</td></tr>
</table>

<h2>Message Angle 4: Social Proof</h2>
<table border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse; width:100%">
  <tr><th style="width:20%">Element</th><th>Inhalt</th></tr>
  <tr><td><strong>Hook</strong></td><td>&bdquo;Er war 34, verheiratet, ein Kind. Und hat gewechselt.&ldquo;</td></tr>
  <tr><td><strong>Problem</strong></td><td>Komfortzone vs. fachlicher Stillstand</td></tr>
  <tr><td><strong>Solution</strong></td><td>Konkretes Beispiel eines Wechslers</td></tr>
  <tr><td><strong>CTA</strong></td><td>&bdquo;Die Bewerbung dauert 60 Sekunden.&ldquo;</td></tr>
</table>

<h2>Message Angle 5: Anti-Corporate</h2>
<table border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse; width:100%">
  <tr><th style="width:20%">Element</th><th>Inhalt</th></tr>
  <tr><td><strong>Hook</strong></td><td>&bdquo;Was wir NICHT haben: Flache Hierarchien.&ldquo;</td></tr>
  <tr><td><strong>Problem</strong></td><td>Buzzwords und leere Versprechen überall</td></tr>
  <tr><td><strong>Solution</strong></td><td>NOVACODE ist ehrlich statt Marketing-getrieben</td></tr>
  <tr><td><strong>CTA</strong></td><td>&bdquo;Kein HR-Screening. Tech-Talk unter Profis.&ldquo;</td></tr>
</table>

<hr>

<h2>Hook-Bibliothek</h2>
<table border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse; width:100%">
  <tr><th>#</th><th>Hook</th><th>Angle</th><th>Emotion</th></tr>
  <tr><td>1</td><td>Programmierst du noch – oder verwaltest du nur noch Tickets?</td><td>Identität</td><td>Provokation</td></tr>
  <tr><td>2</td><td>Ich merke, dass ich mich fachlich zurückentwickle.</td><td>Stagnation</td><td>Angst</td></tr>
  <tr><td>3</td><td>6 Wochen an einem Feature. Nie deployed.</td><td>Feature-Friedhof</td><td>Frustration</td></tr>
  <tr><td>4</td><td>Heute wieder nichts geschafft.</td><td>Alltag</td><td>Resignation</td></tr>
  <tr><td>5</td><td>Er war 34, verheiratet, ein Kind. Und hat gewechselt.</td><td>Social Proof</td><td>Neugier</td></tr>
  <tr><td>6</td><td>Was wir NICHT haben: Flache Hierarchien.</td><td>Anti-Corporate</td><td>Humor</td></tr>
  <tr><td>7</td><td>Jira-Felder pflegen ist kein Engineering.</td><td>Identität</td><td>Provokation</td></tr>
  <tr><td>8</td><td>Meeting-Marathon: Dailys, Weeklys, Retros, Alignment-Calls.</td><td>Alltag</td><td>Wiedererkennung</td></tr>
  <tr><td>9</td><td>Dein Code geht nie live? Unserer schon.</td><td>Feature-Friedhof</td><td>Kontrast</td></tr>
  <tr><td>10</td><td>Nicht frustriert. Nicht wütend. Eher: gleichgültig.</td><td>Stagnation</td><td>Selbstreflektion</td></tr>
  <tr><td>11</td><td>PowerPoint-Engineering ist kein Stack.</td><td>Humor</td><td>Provokation</td></tr>
  <tr><td>12</td><td>Überall ist es so? Nein.</td><td>Komfortzone</td><td>Challenge</td></tr>
  <tr><td>13</td><td>Kein 6-Stunden-Coding-Test. Versprochen.</td><td>Prozess</td><td>Erleichterung</td></tr>
  <tr><td>14</td><td>3.000 € Weiterbildungsbudget. Pro Jahr. Echt.</td><td>Benefits</td><td>Überraschung</td></tr>
  <tr><td>15</td><td>Wir suchen genau 2 Engineers.</td><td>Urgency</td><td>FOMO</td></tr>
</table>

<hr>

<h2>CTA-Varianten</h2>
<table border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse; width:100%">
  <tr><th>CTA</th><th>Kontext</th><th>Stärke</th></tr>
  <tr><td><strong>Bewirb dich in 60 Sekunden.</strong></td><td>Universal</td><td>Niedrige Hürde</td></tr>
  <tr><td><strong>Ohne Lebenslauf. Ohne Anschreiben.</strong></td><td>Hauptkampagne</td><td>Friktionsabbau</td></tr>
  <tr><td><strong>Kein CV nötig. Nur du und dein Tech-Profil.</strong></td><td>Retargeting</td><td>Persönlich</td></tr>
  <tr><td><strong>Die Stellen bleiben nicht lange offen.</strong></td><td>FOMO</td><td>Urgency</td></tr>
  <tr><td><strong>Gespräch unter Entwicklern. Kein HR.</strong></td><td>Retargeting</td><td>Vertrauen</td></tr>
</table>

<hr>

<h2>Tonalität-Profil</h2>
<table border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse; width:100%">
  <tr><th>Dimension</th><th>Ausprägung</th></tr>
  <tr><td><strong>Stimme</strong></td><td>Senior Developer spricht zu Senior Developer</td></tr>
  <tr><td><strong>Ton</strong></td><td>Direkt, ehrlich, technisch, respektvoll</td></tr>
  <tr><td><strong>Rhythmus</strong></td><td>Kurze Sätze. Einzelne Worte als Absatz. Aufzählungen.</td></tr>
  <tr><td><strong>Sprache</strong></td><td>Du, keine Floskeln, Entwickler-Jargon wo passend</td></tr>
  <tr><td><strong>Formatierung</strong></td><td>Zeilenumbrüche nach jedem Gedanken (Meta Ads Stil)</td></tr>
</table>
""")
    return name, html


def doc_05_creative_briefing():
    name = "#05 – Creative Briefing | NOVACODE Recruiting"
    html = wrap_html("""
<h1>Creative Briefing</h1>
<p class="meta">NOVACODE Solutions GmbH &middot; Recruiting-Kampagne &middot; Visual &amp; Creative Guidelines</p>

<h2>Projekt-Übersicht</h2>
<table border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse; width:100%">
  <tr><th>Detail</th><th>Beschreibung</th></tr>
  <tr><td><strong>Kampagne</strong></td><td>NOVACODE Recruiting – Senior Fullstack Developer</td></tr>
  <tr><td><strong>Zielgruppe</strong></td><td>Passive Senior Engineers, 30–40, NRW</td></tr>
  <tr><td><strong>Kanäle</strong></td><td>Meta (Instagram/Facebook), ggf. LinkedIn</td></tr>
</table>

<hr>

<h2>Farbpalette</h2>
<table border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse; width:100%">
  <tr><th>Farbe</th><th>Hex</th><th>Verwendung</th></tr>
  <tr><td><span style="display:inline-block;width:20px;height:20px;background:#0a1628;border:1px solid #ccc;vertical-align:middle;margin-right:8px;"></span> <strong>Navy Blue</strong></td><td>#0a1628</td><td>Hintergrund, Primärfarbe</td></tr>
  <tr><td><span style="display:inline-block;width:20px;height:20px;background:#FFFFFF;border:1px solid #ccc;vertical-align:middle;margin-right:8px;"></span> <strong>White</strong></td><td>#FFFFFF</td><td>Text, Akzente</td></tr>
  <tr><td><span style="display:inline-block;width:20px;height:20px;background:#00e5ff;border:1px solid #ccc;vertical-align:middle;margin-right:8px;"></span> <strong>Cyan</strong></td><td>#00e5ff</td><td>Highlights, CTAs</td></tr>
  <tr><td><span style="display:inline-block;width:20px;height:20px;background:#f5f5f5;border:1px solid #ccc;vertical-align:middle;margin-right:8px;"></span> <strong>Light Gray</strong></td><td>#f5f5f5</td><td>Sekundärer Hintergrund</td></tr>
  <tr><td><span style="display:inline-block;width:20px;height:20px;background:#1a1a2e;border:1px solid #ccc;vertical-align:middle;margin-right:8px;"></span> <strong>Dark Gray</strong></td><td>#1a1a2e</td><td>Alternative Hintergründe</td></tr>
</table>

<hr>

<h2>Bildsprache</h2>
<ul>
  <li>Echte Menschen an echten Arbeitsplätzen</li>
  <li>Code auf Bildschirmen sichtbar (IDE, Terminal)</li>
  <li>Warme, natürliche Lichtstimmung</li>
  <li>Keine Stockfotos, keine gestellten Posen</li>
  <li>Diversität im Team zeigen</li>
  <li><strong>Referenzbilder:</strong> Team working together (annie-spratt), Developer coding (arif-riyanto)</li>
</ul>

<hr>

<h2>Typografie</h2>
<ul>
  <li><strong>Headlines:</strong> Bold, groß, maximal 2 Zeilen</li>
  <li><strong>Body:</strong> Clean, gut lesbar</li>
  <li><strong>Stil:</strong> Technisch, minimalistisch</li>
  <li><strong>KEINE:</strong> Handschrift-Fonts, verspielte Elemente</li>
</ul>

<hr>

<h2>Formate</h2>
<table border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse; width:100%">
  <tr><th>Format</th><th>Größe</th><th>Kanal</th></tr>
  <tr><td>Feed Post</td><td>1080 &times; 1080</td><td>Instagram/Facebook Feed</td></tr>
  <tr><td>Story/Reel</td><td>1080 &times; 1920</td><td>Instagram/Facebook Stories</td></tr>
  <tr><td>Carousel</td><td>1080 &times; 1080 (5 Slides)</td><td>Instagram Feed</td></tr>
</table>

<hr>

<h2>Creative-Typen</h2>
<ol>
  <li><strong>Static Image + Text Overlay</strong> &rarr; Hauptkampagne</li>
  <li><strong>Carousel</strong> (Problem &rarr; Solution &rarr; CTA) &rarr; Retargeting</li>
  <li><strong>Video Testimonial / Behind-the-scenes</strong> &rarr; Warmup</li>
</ol>

<hr>

<h2>Do's</h2>
<ul>
  <li style="color:#006600;">&#10004; Code sichtbar auf Bildschirmen</li>
  <li style="color:#006600;">&#10004; Dunkle Hintergründe (passend zu Developer-IDEs)</li>
  <li style="color:#006600;">&#10004; Klare visuelle Hierarchie</li>
  <li style="color:#006600;">&#10004; Ein Gedanke pro Slide</li>
</ul>

<h2>Don'ts</h2>
<ul>
  <li style="color:#cc0000;">&#10060; Keine Stockfotos</li>
  <li style="color:#cc0000;">&#10060; Keine Clip-Art oder Icons</li>
  <li style="color:#cc0000;">&#10060; Kein überfülltes Layout</li>
  <li style="color:#cc0000;">&#10060; Keine Corporate-Sprache in Overlays</li>
  <li style="color:#cc0000;">&#10060; Kein &bdquo;Jetzt bewerben!&ldquo; als einziger Content</li>
</ul>
""")
    return name, html


def doc_06_marken_richtlinien():
    name = "#06 – Marken-Richtlinien | NOVACODE Recruiting"
    html = wrap_html("""
<h1>Marken-Richtlinien</h1>
<p class="meta">NOVACODE Solutions GmbH &middot; Brand Guidelines</p>

<h2>Logo</h2>
<ul>
  <li><strong>NOVACODE</strong> in Caps, Bold</li>
  <li>Minimaler Abstand: 1x Buchstabenhöhe rundherum</li>
  <li>Auf dunklem Hintergrund: <strong>Weiß</strong></li>
  <li>Auf hellem Hintergrund: <strong>Navy Blue</strong></li>
</ul>

<hr>

<h2>Farben</h2>
<table border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse; width:100%">
  <tr><th>Farbe</th><th>Hex</th><th>RGB</th><th>Verwendung</th></tr>
  <tr><td><strong>Navy Blue</strong></td><td>#0a1628</td><td>10, 22, 40</td><td>Hintergrund, Primärfarbe, Headlines</td></tr>
  <tr><td><strong>White</strong></td><td>#FFFFFF</td><td>255, 255, 255</td><td>Text auf dunklem Hintergrund, Akzente</td></tr>
  <tr><td><strong>Cyan</strong></td><td>#00e5ff</td><td>0, 229, 255</td><td>Highlights, CTAs, Akzentelemente</td></tr>
  <tr><td><strong>Light Gray</strong></td><td>#f5f5f5</td><td>245, 245, 245</td><td>Sekundärer Hintergrund, Cards</td></tr>
  <tr><td><strong>Dark Gray</strong></td><td>#1a1a2e</td><td>26, 26, 46</td><td>Alternative Hintergründe, Text</td></tr>
</table>

<hr>

<h2>Typografie</h2>
<table border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse; width:100%">
  <tr><th>Element</th><th>Spezifikation</th></tr>
  <tr><td><strong>Primary Font</strong></td><td>System-Font Stack (Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto)</td></tr>
  <tr><td><strong>Headlines</strong></td><td>Bold 700</td></tr>
  <tr><td><strong>Body</strong></td><td>Regular 400</td></tr>
  <tr><td><strong>Minimum Schriftgröße</strong></td><td>14px</td></tr>
</table>

<hr>

<h2>Bildsprache-Regeln</h2>
<ul>
  <li>Mind. 50% der Bilder zeigen echte Arbeitssituationen</li>
  <li>Code auf Screens muss realistisch sein (kein Lorem Ipsum)</li>
  <li>Gesichter sind sichtbar aber nicht inszeniert</li>
  <li>Natürliches Licht bevorzugt</li>
</ul>

<hr>

<h2>Tonalität-Regeln</h2>
<ul>
  <li>Immer <strong>Du</strong></li>
  <li>Technisch korrekt</li>
  <li>Ehrlich über Schwächen</li>
  <li>Kein Superlativ ohne Beweis</li>
  <li>Humor ist erlaubt, aber nie auf Kosten anderer</li>
</ul>

<hr>

<h2>Verbotene Begriffe</h2>
<table border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse; width:100%">
  <tr><th style="background:#cc0000;">Verboten</th><th style="background:#006600; color:#fff;">Erlaubt / Gewünscht</th></tr>
  <tr><td style="color:#cc0000;">&bdquo;Flache Hierarchien&ldquo;</td><td style="color:#006600;">&bdquo;Architekturentscheidungen&ldquo;</td></tr>
  <tr><td style="color:#cc0000;">&bdquo;Wie eine Familie&ldquo;</td><td style="color:#006600;">&bdquo;Deploy&ldquo;</td></tr>
  <tr><td style="color:#cc0000;">&bdquo;Startup-Mentalität&ldquo;</td><td style="color:#006600;">&bdquo;Engineering&ldquo;</td></tr>
  <tr><td style="color:#cc0000;">&bdquo;Dynamisches Team&ldquo;</td><td style="color:#006600;">&bdquo;Stack&ldquo;</td></tr>
  <tr><td style="color:#cc0000;">&bdquo;Spannende Aufgaben&ldquo;</td><td style="color:#006600;">&bdquo;Ownership&ldquo;</td></tr>
  <tr><td style="color:#cc0000;">&bdquo;Attraktive Vergütung&ldquo;</td><td style="color:#006600;">&bdquo;Impact&ldquo; / &bdquo;Senior-Team&ldquo;</td></tr>
</table>
""")
    return name, html


def doc_07_landingpage_texte():
    name = "#07 – Landingpage-Texte | NOVACODE Recruiting"
    html = wrap_html("""
<h1>Landingpage-Texte</h1>
<p class="meta">NOVACODE Solutions GmbH &middot; Recruiting Landing Page &middot; Exakte Texte</p>

<h2>Navigation</h2>
<p><strong>NOVACODE</strong> | Kennst du das? | So arbeiten wir | Bewerbung | <span style="color:#00e5ff; font-weight:600;">Jetzt bewerben</span></p>

<hr>

<h2>Hero Section</h2>
<h3>Headline</h3>
<p style="font-size:24px; font-weight:700; color:#0a1628;">Offene Stellen – Jetzt bewerben</p>
<h3>Subheadline</h3>
<p style="font-size:18px;">Wir suchen Senior Software Engineers (m/w/d)</p>
<h3>Body</h3>
<p>Remote, unbefristet, ab sofort. Bewirb dich in 60 Sekunden – ohne Lebenslauf, ohne Anschreiben. Triff Architekturentscheidungen statt Jira-Felder zu pflegen.</p>
<h3>CTAs</h3>
<p><strong style="color:#00e5ff;">&#9654; In 60 Sek. bewerben</strong> &nbsp; | &nbsp; Mehr erfahren</p>
<h3>Trust Badges</h3>
<table border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse; width:100%">
  <tr>
    <td style="text-align:center;"><strong>Kein Lebenslauf nötig</strong></td>
    <td style="text-align:center;"><strong>100% Remote</strong></td>
    <td style="text-align:center;"><strong>Rückmeldung in 48h</strong></td>
    <td style="text-align:center;"><strong>Direkt deployen ab Tag 1</strong></td>
  </tr>
</table>

<hr>

<h2>Problem Section – &bdquo;Kennst du das?&ldquo;</h2>
<h3>Headline</h3>
<p style="font-size:22px; font-weight:700; color:#0a1628;">Du hast aufgehört, Entwickler zu sein.</p>
<p><em>Die meisten Seniors kündigen nicht wegen dem Gehalt – sondern weil sie sich fachlich zurückentwickeln.</em></p>

<h3>Card 1: Ticket-Schubser statt Engineer</h3>
<div class="highlight">
  <strong>Ticket-Schubser statt Engineer</strong><br>
  Du programmierst nicht mehr – du verschiebst Tickets zwischen Boards. Den ganzen Tag Jira statt Code.
</div>

<h3>Card 2: Meeting-Marathon</h3>
<div class="highlight">
  <strong>Meeting-Marathon</strong><br>
  Dailys, Weeklys, Retros, Alignment-Calls. Dein Kalender sieht aus wie Tetris – coden darfst du nach Feierabend.
</div>

<h3>Card 3: Feature-Friedhof</h3>
<div class="highlight">
  <strong>Feature-Friedhof</strong><br>
  6 Wochen an einem Feature arbeiten, das nie online geht. Management ändert seine Meinung – dein Code landet in der Tonne.
</div>

<h3>Pain Quotes</h3>
<blockquote>&bdquo;Heute wieder nichts geschafft.&ldquo;</blockquote>
<blockquote>&bdquo;Ich verstehe nicht mehr, warum wir das bauen.&ldquo;</blockquote>
<blockquote>&bdquo;Ich bin nur noch Umsetzer, kein Entwickler.&ldquo;</blockquote>
<blockquote>&bdquo;Mein Tech-Stack ist komplett veraltet.&ldquo;</blockquote>
<blockquote>&bdquo;Ich darf nichts entscheiden.&ldquo;</blockquote>
<blockquote>&bdquo;Ich merke, dass ich mich fachlich zurückentwickle.&ldquo;</blockquote>

<p style="font-size:18px; font-weight:700; color:#00e5ff; margin-top:20px;">Dann bist du hier richtig.</p>

<hr>

<h2>Benefits Section – &bdquo;So arbeiten wir wirklich&ldquo;</h2>
<h3>Headline</h3>
<p style="font-size:22px; font-weight:700; color:#0a1628;">Hier triffst du Architekturentscheidungen. Nicht Jira-Felder.</p>
<p>Bei NOVACODE baust du wirklich. Kein PowerPoint-Engineering. Kein &bdquo;agiles&ldquo; Micromanagement. Du bekommst echte Verantwortung über deine Systeme. Und ja – wir haben auch Legacy-Code. Aber wir sind ehrlich darüber, statt dir &bdquo;Greenfield&ldquo; zu verkaufen und dich dann 10 Jahre alten Spaghetti-Code fixen zu lassen.</p>

<h3>Benefit 1: Direkt deployen ab Tag 1</h3>
<p>Kein 3-monatiges Onboarding. Du baust, du deployest, du siehst den Impact.</p>

<h3>Benefit 2: Deine Meinung ist technisch relevant</h3>
<p>Du entscheidest über Architektur, nicht das Management. Echte Verantwortung.</p>

<h3>Benefit 3: Moderner Stack, wenige Meetings</h3>
<p>Rust, Go, Kubernetes. Wenige Meetings. Fokuszeit ist heilig.</p>

<p><strong style="color:#00e5ff;">CTA: Jetzt in 60 Sekunden bewerben</strong><br>
<em>Badge: Deployment erfolgreich</em></p>

<hr>

<h2>Compensation Section – &bdquo;Was du bekommst&ldquo;</h2>
<h3>Headline</h3>
<p style="font-size:22px; font-weight:700; color:#0a1628;">Keine leeren Versprechen. Echte Benefits.</p>
<p><em>Wir wissen: &bdquo;Flache Hierarchien&ldquo; und &bdquo;Startup-Mentalität&ldquo; sind für dich Warnsignale. Deshalb hier Klartext.</em></p>

<table border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse; width:100%">
  <tr><th>#</th><th>Benefit</th><th>Beschreibung</th></tr>
  <tr><td>1</td><td><strong>Top-Gehalt</strong></td><td>Überdurchschnittliche Vergütung, transparent kommuniziert. Keine Verhandlungsspielchen.</td></tr>
  <tr><td>2</td><td><strong>100% Remote</strong></td><td>Arbeite von wo du willst. Kein Pflicht-Büro, keine &bdquo;Hybrid&ldquo;-Mogelpackung.</td></tr>
  <tr><td>3</td><td><strong>Top-Hardware</strong></td><td>MacBook Pro, 4K-Monitor, ergonomisches Setup. Du wählst, was du brauchst.</td></tr>
  <tr><td>4</td><td><strong>Weiterbildung</strong></td><td>Konferenzen, Kurse, Bücher – alles bezahlt. Plus feste Lernzeit im Arbeitsalltag.</td></tr>
  <tr><td>5</td><td><strong>30 Tage Urlaub</strong></td><td>Plus flexible Arbeitszeiten. Keine Kernarbeitszeit, kein Stempeln.</td></tr>
  <tr><td>6</td><td><strong>Moderner Stack</strong></td><td>Rust, Go, Kubernetes, Terraform. Kein veralteter Tech-Stack, kein Legacy-Zwang.</td></tr>
  <tr><td>7</td><td><strong>Team aus Seniors</strong></td><td>Arbeite mit Leuten, die mindestens so gut sind wie du. Zusammenarbeit auf Augenhöhe.</td></tr>
  <tr><td>8</td><td><strong>Sicherheit</strong></td><td>Unbefristeter Vertrag, stabile Firma. Kein Chaos-Startup, keine Überstunden-Kultur.</td></tr>
</table>

<hr>

<h2>Process Section – &bdquo;Kein HR-Screening&ldquo;</h2>
<h3>Headline</h3>
<p style="font-size:22px; font-weight:700; color:#0a1628;">In 3 Schritten zum neuen Job.</p>
<p><em>Kein Lebenslauf. Kein Anschreiben. Kein mehrstufiges Auswahlverfahren.</em></p>

<table border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse; width:100%">
  <tr><th>Schritt</th><th>Titel</th><th>Beschreibung</th></tr>
  <tr><td style="text-align:center; font-size:20px; font-weight:700; color:#00e5ff;">1</td><td><strong>60-Sekunden-Profil</strong></td><td>Spezialisierung, Erfahrung, Kontaktdaten – das reicht uns. Kein CV-Upload, kein Motivationsschreiben.</td></tr>
  <tr><td style="text-align:center; font-size:20px; font-weight:700; color:#00e5ff;">2</td><td><strong>Gespräch unter Entwicklern</strong></td><td>Innerhalb von 48h meldet sich ein Engineer – auf Augenhöhe. Kein HR, kein Sales-Pitch.</td></tr>
  <tr><td style="text-align:center; font-size:20px; font-weight:700; color:#00e5ff;">3</td><td><strong>Tech-Talk &amp; Angebot</strong></td><td>Ein lockerer Fachgespräch. Danach hast du innerhalb einer Woche dein Angebot auf dem Tisch.</td></tr>
</table>

<hr>

<h2>Final CTA</h2>
<div class="highlight">
  <p style="font-size:22px; font-weight:700; color:#0a1628;">Jetzt als Entwickler bewerben.</p>
  <p>Wir suchen aktuell Senior Backend Engineers und Staff Engineers – bewirb dich jetzt in 60 Sekunden.</p>
  <p><em>Kein Lebenslauf. Kein Anschreiben. Nur du und dein Tech-Profil.</em></p>
  <p><strong style="color:#00e5ff;">&#9654; Jetzt bewerben</strong></p>
  <p style="font-size:12px; color:#888;">Deine Daten werden verschlüsselt und vertraulich behandelt.</p>
</div>

<hr>

<h2>Footer</h2>
<p><strong>NOVACODE</strong> | Impressum | Datenschutz | AGB | &copy; 2026 NOVACODE Solutions GmbH</p>
""")
    return name, html


def doc_08_formularseite_texte():
    name = "#08 – Formularseite-Texte | NOVACODE Recruiting"
    html = wrap_html("""
<h1>Formularseite-Texte</h1>
<p class="meta">NOVACODE Solutions GmbH &middot; Schnellbewerbung &middot; Exakte Texte</p>

<h2>Header</h2>
<p><strong>NOVACODE</strong> – Schnellbewerbung</p>

<hr>

<h2>Title</h2>
<p style="font-size:22px; font-weight:700; color:#0a1628;">Schnellbewerbung | Kein Lebenslauf nötig</p>

<hr>

<h2>Intro</h2>
<h3>Headline</h3>
<p style="font-size:20px; font-weight:700;">Dein Tech-Profil</p>
<p><em>ca. 60 Sekunden</em></p>
<p style="font-size:18px;">&bdquo;Erzähl uns, was du drauf hast.&ldquo;</p>
<blockquote>Kein Lebenslauf, kein Anschreiben. Wähle deine Spezialisierung – wir melden uns innerhalb von 48h persönlich bei dir.</blockquote>

<hr>

<h2>Formularfelder</h2>

<h3>Deine Spezialisierung* <span style="color:#cc0000;">(Required)</span></h3>
<table border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse; width:100%">
  <tr><th>Option</th><th>Beschreibung</th></tr>
  <tr><td><strong>Frontend-Entwicklung</strong></td><td>React, Vue, Angular, Svelte</td></tr>
  <tr><td><strong>Backend-Systeme</strong></td><td>Node, Java, Go, Python, Rust</td></tr>
  <tr><td><strong>Full Stack</strong></td><td>Gesamtarchitektur</td></tr>
  <tr><td><strong>DevOps / SRE</strong></td><td>CI/CD, K8s, Terraform, AWS</td></tr>
</table>

<h3>Berufserfahrung* <span style="color:#cc0000;">(Required)</span></h3>
<table border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse; width:100%">
  <tr><th>Option</th></tr>
  <tr><td>3–5 Jahre</td></tr>
  <tr><td>5–8 Jahre</td></tr>
  <tr><td>8–12 Jahre</td></tr>
  <tr><td>12+ Jahre</td></tr>
</table>

<h3>Was nervt dich am meisten in deinem aktuellen Job? <span style="color:#888;">(Optional)</span></h3>
<p><em>Freitextfeld</em></p>

<h3>Kontakt</h3>
<table border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse; width:100%">
  <tr><th>Feld</th><th>Status</th></tr>
  <tr><td>Vollständiger Name</td><td><strong style="color:#cc0000;">Required</strong></td></tr>
  <tr><td>E-Mail-Adresse</td><td><strong style="color:#cc0000;">Required</strong></td></tr>
  <tr><td>Telefonnummer</td><td><span style="color:#888;">Optional</span></td></tr>
</table>

<hr>

<h2>Button &amp; Footer</h2>
<p><strong style="color:#00e5ff; font-size:16px;">&#9654; Bewerbung absenden</strong></p>
<p style="font-size:12px; color:#888;">&bdquo;Deine Daten werden verschlüsselt und vertraulich behandelt.&ldquo;</p>
<p style="font-size:12px; color:#888;">Datenschutz | Impressum | AGB</p>
""")
    return name, html


def doc_09_dankeseite_texte():
    name = "#09 – Dankeseite-Texte | NOVACODE Recruiting"
    html = wrap_html("""
<h1>Dankeseite-Texte</h1>
<p class="meta">NOVACODE Solutions GmbH &middot; Thank-You Page &middot; Exakte Texte</p>

<hr>

<h2>Headline</h2>
<p style="font-size:24px; font-weight:700; color:#0a1628;">Danke – wir melden uns persönlich bei dir.</p>

<h2>Body</h2>
<p>Deine Bewerbung ist bei uns eingegangen. Wir garantieren dir eine Rückmeldung innerhalb von 48 Stunden.</p>

<h2>Subline</h2>
<p><em>Freu dich auf ein ehrliches Gespräch auf Augenhöhe – kein HR-Screening, sondern Tech-Talk unter Profis.</em></p>

<hr>

<h2>So geht es weiter:</h2>

<table border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse; width:100%">
  <tr><th style="width:10%">Schritt</th><th style="width:30%">Titel</th><th>Beschreibung</th></tr>
  <tr>
    <td style="text-align:center; font-size:24px; font-weight:700; color:#00e5ff;">1</td>
    <td><strong>Wir prüfen dein Profil</strong></td>
    <td>Ein Engineer aus unserem Team schaut sich deine Angaben an.</td>
  </tr>
  <tr>
    <td style="text-align:center; font-size:24px; font-weight:700; color:#00e5ff;">2</td>
    <td><strong>Persönlicher Anruf innerhalb von 48h</strong></td>
    <td>Kein automatisiertes Screening – ein echtes Gespräch unter Entwicklern.</td>
  </tr>
  <tr>
    <td style="text-align:center; font-size:24px; font-weight:700; color:#00e5ff;">3</td>
    <td><strong>Tech-Talk &amp; Angebot</strong></td>
    <td>Lockeres Fachgespräch, danach bekommst du innerhalb einer Woche dein Angebot.</td>
  </tr>
</table>

<hr>

<p><strong style="color:#00e5ff;">&#8592; Zurück zur Startseite</strong></p>

<p style="font-size:12px; color:#888;">Impressum | Datenschutz | AGB | &copy; 2026 NOVACODE Solutions GmbH</p>
""")
    return name, html


def doc_10_anzeigentexte_hauptkampagne():
    name = "#10 – Anzeigentexte Hauptkampagne | NOVACODE Recruiting"
    html = wrap_html("""
<h1>Anzeigentexte – Hauptkampagne</h1>
<p class="meta">NOVACODE Solutions GmbH &middot; Meta Ads &middot; 3 Varianten + Headline-Variationen</p>

<hr>

<h2>VARIANTE 1 – &bdquo;Ticket-Schubser&ldquo; (Original)</h2>

<h3>Primärtext</h3>
<div class="highlight">
<p>Programmierst du noch –<br>
oder verwaltest du nur noch Tickets?</p>

<p>Viele Senior Engineers verdienen gut.<br>
Aber sie haben aufgehört, Entwickler zu sein.</p>

<p>Meetings.<br>
Jira.<br>
Features, die nie live gehen.<br>
Architektur durch Management.</p>

<p>Wenn du abends den Laptop zuklappst und denkst:<br>
&bdquo;Heute wieder nichts geschafft.&ldquo;</p>

<p>Dann liegt das nicht an dir.<br>
Sondern am System.</p>

<p>Bei NOVACODE triffst du Architekturentscheidungen.<br>
Du baust.<br>
Du deployest.<br>
Du siehst den Impact.</p>

<p>Senior Backend / Staff Engineer.<br>
100% Remote.<br>
Unbefristet.<br>
Direkt deployen ab Tag 1.</p>

<p>Bewirb dich in 60 Sekunden.<br>
Ohne Lebenslauf. Ohne Anschreiben.</p>
</div>

<h3>Headline</h3>
<p><strong>Jetzt als Software Engineer bewerben</strong></p>

<hr>

<h2>VARIANTE 2 – &bdquo;Stagnation&ldquo;</h2>

<h3>Primärtext</h3>
<div class="highlight">
<p>&bdquo;Ich merke, dass ich mich fachlich zurückentwickle.&ldquo;</p>

<p>Das hören wir von Senior Engineers,<br>
die eigentlich alles haben:<br>
Gutes Gehalt. Sicherer Job. Nette Kollegen.</p>

<p>Aber keinen einzigen Tag,<br>
an dem sie wirklich gebaut haben.</p>

<p>6 Wochen an einem Feature arbeiten –<br>
das nie live geht.</p>

<p>3 Meetings vor dem Mittagessen –<br>
und danach keine Energie mehr zum Coden.</p>

<p>Das Problem ist nicht mangelnde Motivation.<br>
Das Problem ist das Umfeld.</p>

<p>Bei NOVACODE:<br>
&rarr; Du entscheidest über Architektur<br>
&rarr; Du deployest am ersten Tag<br>
&rarr; Du arbeitest mit einem Team aus Seniors</p>

<p>19 Entwickler. Keine PowerPoint-Kultur.<br>
Reale Projekte. Realer Impact.</p>

<p>Bewirb dich in 60 Sekunden.<br>
Kein CV. Kein Anschreiben.</p>
</div>

<h3>Headline</h3>
<p><strong>Senior Developer? Hier baust du wieder.</strong></p>

<hr>

<h2>VARIANTE 3 – &bdquo;Social Proof&ldquo;</h2>

<h3>Primärtext</h3>
<div class="highlight">
<p>Er war 34, verheiratet, ein Kind.<br>
Senior Developer in einem Konzern mit 2.000 Mitarbeitern.</p>

<p>Sein Satz:<br>
&bdquo;Ich programmiere eigentlich nicht mehr. Ich verschiebe Tickets.&ldquo;</p>

<p>Nicht frustriert.<br>
Nicht wütend.<br>
Eher: gleichgültig.</p>

<p>Und genau das war das Problem.</p>

<p>Heute baut er bei NOVACODE individuelle<br>
Softwarelösungen für Industrieunternehmen.<br>
Trifft Architekturentscheidungen.<br>
Sieht seinen Code in Produktion.</p>

<p>Der Unterschied?<br>
14 Entwickler statt 2.000 Mitarbeiter.<br>
Reale Projekte statt Feature-Friedhof.</p>

<p>Senior Fullstack Developer.<br>
React, TypeScript, Node.js, Go.<br>
Hybrid Düsseldorf oder 100% Remote.</p>

<p>60 Sekunden Bewerbung.<br>
Kein Lebenslauf nötig.</p>
</div>

<h3>Headline</h3>
<p><strong>Von Konzern zu Impact – in 60 Sekunden bewerben</strong></p>

<hr>

<h2>Headline-Variationen</h2>
<table border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse; width:100%">
  <tr><th>#</th><th>Headline</th><th>Angle</th></tr>
  <tr><td>1</td><td>Jetzt als Software Engineer bewerben</td><td>Standard / Direct</td></tr>
  <tr><td>2</td><td>Senior Developer? Hier baust du wieder.</td><td>Stagnation</td></tr>
  <tr><td>3</td><td>Von Konzern zu Impact – in 60 Sekunden bewerben</td><td>Social Proof</td></tr>
  <tr><td>4</td><td>Architekturentscheidungen statt Jira-Felder</td><td>Identität</td></tr>
  <tr><td>5</td><td>Kein Lebenslauf. Kein Anschreiben. Kein BS.</td><td>Anti-Corporate</td></tr>
  <tr><td>6</td><td>19 Entwickler. Kein Konzern. Kein Startup.</td><td>Positionierung</td></tr>
  <tr><td>7</td><td>Dein Code geht hier tatsächlich live.</td><td>Feature-Friedhof</td></tr>
  <tr><td>8</td><td>Bewirb dich in 60 Sek. – ohne Lebenslauf</td><td>Niedrige Hürde</td></tr>
  <tr><td>9</td><td>Senior Engineers: Schluss mit Ticket-Schieben</td><td>Provokation</td></tr>
  <tr><td>10</td><td>React, TypeScript, Go – echte Projekte bei NOVACODE</td><td>Stack-Targeting</td></tr>
</table>
""")
    return name, html


def doc_11_anzeigentexte_retargeting():
    name = "#11 – Anzeigentexte Retargeting | NOVACODE Recruiting"
    html = wrap_html("""
<h1>Anzeigentexte – Retargeting</h1>
<p class="meta">NOVACODE Solutions GmbH &middot; Meta Ads &middot; Retargeting-Kampagne &middot; 3 Varianten</p>
<p><em>Zielgruppe: Besucher der Landing Page, die sich noch nicht beworben haben.</em></p>

<hr>

<h2>RETARGETING AD 1 – &bdquo;Einwand-Behandlung&ldquo;</h2>

<h3>Primärtext</h3>
<div class="highlight">
<p>Du hast unsere Seite besucht –<br>
aber noch nicht beworben.</p>

<p>Verstehen wir.</p>

<p>Vielleicht denkst du:<br>
&bdquo;Klingt zu gut. Bestimmt ein Chaos-Startup.&ldquo;</p>

<p>Hier die Fakten:<br>
&rarr; 6 Jahre am Markt<br>
&rarr; Bootstrapped, kein VC<br>
&rarr; 19 Mitarbeiter, 14 davon Entwickler<br>
&rarr; Unbefristeter Vertrag<br>
&rarr; Keine Überstundenkultur</p>

<p>Wir sind kein Startup.<br>
Wir sind ein stabiles Tech-Unternehmen,<br>
das ehrlich ist statt Buzzwords zu nutzen.</p>

<p>Die Bewerbung dauert 60 Sekunden.<br>
Kein Risiko. Kein Anschreiben. Nur du.</p>
</div>

<h3>Headline</h3>
<p><strong>Kein Chaos-Startup. Versprochen.</strong></p>

<hr>

<h2>RETARGETING AD 2 – &bdquo;Social Proof&ldquo;</h2>

<h3>Primärtext</h3>
<div class="highlight">
<p>Du überlegst noch?</p>

<p>Das ging unserem letzten Hire genauso.</p>

<p>Senior Fullstack, 34, verheiratet, ein Kind.<br>
Sicherer Job im Konzern.</p>

<p>Er hat 3 Wochen überlegt.<br>
Dann hat er sich beworben.</p>

<p>Sein Feedback nach 6 Monaten:<br>
&bdquo;Ich bin wieder Entwickler.&ldquo;</p>

<p>20 Minuten Kennenlernen-Call.<br>
Gespräch unter Entwicklern, kein HR-Screening.<br>
Entscheidung in 14 Tagen.</p>

<p>Du musst dich nicht entscheiden.<br>
Nur bewerben. In 60 Sekunden.</p>
</div>

<h3>Headline</h3>
<p><strong>&bdquo;Ich bin wieder Entwickler.&ldquo; – Unser letzter Hire</strong></p>

<hr>

<h2>RETARGETING AD 3 – &bdquo;Urgency + Benefits&ldquo;</h2>

<h3>Primärtext</h3>
<div class="highlight">
<p>Wir suchen genau 2 Senior Engineers.</p>

<p>React, TypeScript, Node.js oder Go.<br>
Hybrid Düsseldorf oder Remote.<br>
65.000 – 85.000 €.</p>

<p>Was du bekommst:<br>
&#10003; 30 Urlaubstage<br>
&#10003; 3.000 € Weiterbildungsbudget<br>
&#10003; Hardware frei wählbar<br>
&#10003; Direkte Projektverantwortung<br>
&#10003; Kein 6-Stunden-Coding-Test</p>

<p>Bewerbungsprozess: 3 Schritte, 14 Tage.<br>
Start: 60 Sekunden.</p>

<p>Die Stellen bleiben nicht lange offen.</p>
</div>

<h3>Headline</h3>
<p><strong>2 Stellen. Dein Stack. Jetzt bewerben.</strong></p>
""")
    return name, html


def doc_12_anzeigentexte_warmup():
    name = "#12 – Anzeigentexte Warmup | NOVACODE Recruiting"
    html = wrap_html("""
<h1>Anzeigentexte – Warmup</h1>
<p class="meta">NOVACODE Solutions GmbH &middot; Meta Ads &middot; Warmup / Awareness &middot; 3 Varianten</p>
<p><em>Ziel: Video Views / Engagement. Weichere, markenbildende Inhalte.</em></p>

<hr>

<h2>WARMUP AD 1 – &bdquo;Ein Tag bei NOVACODE&ldquo;</h2>

<h3>Primärtext</h3>
<div class="highlight">
<p>Ein normaler Tag bei NOVACODE:</p>

<p>09:00 – Kaffee, Slack checken<br>
09:15 – Code Review für Kollegen<br>
09:45 – Feature bauen<br>
12:00 – Mittagspause<br>
12:45 – Deployment vorbereiten<br>
13:30 – Architektur-Entscheidung treffen<br>
15:00 – Code geht live<br>
15:30 – Feierabend (freitags)</p>

<p>Keine Dailys.<br>
Kein Jira-Theater.<br>
Einfach: Bauen.</p>

<p>NOVACODE – Hier bist du wieder Entwickler.</p>
</div>

<h3>Headline</h3>
<p><strong>So sieht ein Tag bei uns aus.</strong></p>

<hr>

<h2>WARMUP AD 2 – &bdquo;Anti-Corporate&ldquo;</h2>

<h3>Primärtext</h3>
<div class="highlight">
<p>Was wir NICHT haben:<br>
&#10060; &bdquo;Flache Hierarchien&ldquo;<br>
&#10060; &bdquo;Wir sind wie eine Familie&ldquo;<br>
&#10060; &bdquo;Startup-Mentalität&ldquo;<br>
&#10060; &bdquo;Dynamisches Umfeld&ldquo;<br>
&#10060; &bdquo;Spannende Aufgaben&ldquo;</p>

<p>Was wir HABEN:<br>
&#10003; 14 Entwickler, Durchschnittsalter 32<br>
&#10003; Echte Projektverantwortung<br>
&#10003; Code, der in Produktion geht<br>
&#10003; Meetings nur wenn nötig<br>
&#10003; Ein Team, das sich fachlich pusht</p>

<p>NOVACODE – Custom Software.<br>
Für Entwickler, die bauen wollen.</p>
</div>

<h3>Headline</h3>
<p><strong>Keine Buzzwords. Nur Fakten.</strong></p>

<hr>

<h2>WARMUP AD 3 – &bdquo;Developer-Zitat&ldquo;</h2>

<h3>Primärtext</h3>
<div class="highlight">
<p>&bdquo;Ich werde fachlich langsam schlechter.&ldquo;</p>

<p>Das hören wir von Entwicklern,<br>
die in großen Unternehmen festhängen.</p>

<p>Gutes Gehalt. Sicherer Job.<br>
Aber kein Wachstum.</p>

<p>Bei NOVACODE arbeiten 14 Entwickler<br>
an individuellen Softwarelösungen<br>
für mittelständische Industrieunternehmen.<br>
Kein Agentur-Bauchladen.<br>
Reines Custom Development.</p>

<p>Du entscheidest. Du baust. Du wächst.</p>

<p>NOVACODE – Hier bist du wieder Entwickler.</p>
</div>

<h3>Headline</h3>
<p><strong>Bau Software, die zählt.</strong></p>
""")
    return name, html


def doc_13_videoskript():
    name = "#13 – Videoskript | NOVACODE Recruiting"
    html = wrap_html("""
<h1>Videoskript: &bdquo;Ich bin wieder Entwickler&ldquo;</h1>
<p class="meta">NOVACODE Solutions GmbH &middot; 60-Sekunden Recruiting Video &middot; Talking Head + Screen Recording</p>

<table border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse; width:100%">
  <tr><th>Detail</th><th>Beschreibung</th></tr>
  <tr><td><strong>Format</strong></td><td>Talking Head + Screen Recording</td></tr>
  <tr><td><strong>Sprecher</strong></td><td>Developer bei NOVACODE (authentisch, nicht scripted)</td></tr>
  <tr><td><strong>Stimmung</strong></td><td>Ehrlich, ruhig, technisch</td></tr>
  <tr><td><strong>Länge</strong></td><td>60 Sekunden</td></tr>
</table>

<hr>

<h2>[0:00–0:05] HOOK</h2>
<p><em>(Schwarzer Bildschirm, weiße Schrift)</em></p>
<div class="highlight">
  <p style="font-size:20px; font-weight:700;">&bdquo;Programmierst du noch?&ldquo;</p>
  <p><em>(Beat)</em></p>
  <p style="font-size:20px; font-weight:700;">&bdquo;Oder verwaltest du nur noch Tickets?&ldquo;</p>
</div>

<hr>

<h2>[0:05–0:15] PROBLEM</h2>
<p><em>(Developer vor Laptop, frustriert)</em></p>
<h3>Voiceover:</h3>
<blockquote>
&bdquo;Ich war Senior Dev in einem Konzern mit 2.000 Leuten.<br>
Gutes Gehalt. Sicherer Job.<br>
Aber irgendwann hab ich gemerkt:<br>
Ich programmiere nicht mehr.<br>
Ich verschiebe Tickets.&ldquo;
</blockquote>

<hr>

<h2>[0:15–0:25] WENDEPUNKT</h2>
<p><em>(Screen Recording: IDE mit Code)</em></p>
<h3>Voiceover:</h3>
<blockquote>
&bdquo;Dann bin ich auf NOVACODE gestoßen.<br>
19 Leute. 14 Entwickler.<br>
Kein PowerPoint-Engineering.<br>
Kein 'agiles' Micromanagement.&ldquo;
</blockquote>

<hr>

<h2>[0:25–0:40] LÖSUNG</h2>
<p><em>(Team-Shots, echte Arbeitssituationen)</em></p>
<h3>Voiceover:</h3>
<blockquote>
&bdquo;Hier treffe ich Architekturentscheidungen.<br>
Ich baue Features, die am selben Tag live gehen.<br>
Ich arbeite mit einem Team,<br>
das fachlich mindestens so stark ist wie ich.<br>
React, TypeScript, Node, Go – moderner Stack.<br>
Keine Legacy-Hölle.&ldquo;
</blockquote>

<hr>

<h2>[0:40–0:50] PROOF</h2>
<p><em>(Zahlen eingeblendet)</em></p>
<h3>Voiceover:</h3>
<blockquote>
&bdquo;30 Urlaubstage.<br>
3.000 Euro Weiterbildungsbudget.<br>
100% Remote möglich.<br>
Bewerbungsprozess in 14 Tagen.<br>
Kein 6-Stunden-Coding-Test.&ldquo;
</blockquote>

<hr>

<h2>[0:50–0:60] CTA</h2>
<p><em>(NOVACODE Logo + Bewerbungslink)</em></p>

<h3>Text auf Screen:</h3>
<div class="highlight">
  <p style="font-size:18px; font-weight:700;">Senior Fullstack Developer gesucht.</p>
  <p style="font-size:16px;">Bewirb dich in 60 Sekunden.</p>
  <p style="color:#00e5ff; font-weight:600;">novacode-karriere.de</p>
</div>

<h3>Voiceover:</h3>
<blockquote>
&bdquo;Wenn du wieder Entwickler sein willst –<br>
bewirb dich. In 60 Sekunden.<br>
Ohne Lebenslauf. Ohne Anschreiben.&ldquo;
</blockquote>

<p><em>(End Card: NOVACODE Logo)</em></p>

<hr>

<h2>Technische Hinweise</h2>
<table border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse; width:100%">
  <tr><th>Element</th><th>Spezifikation</th></tr>
  <tr><td><strong>Musik</strong></td><td>Lo-fi / Ambient, dezent</td></tr>
  <tr><td><strong>Schnittrhythmus</strong></td><td>Ruhig, keine schnellen Cuts</td></tr>
  <tr><td><strong>Farbkorrektur</strong></td><td>Leicht entsättigt, professionell</td></tr>
  <tr><td><strong>Untertitel</strong></td><td>Weiß auf halbtransparentem schwarzen Balken</td></tr>
  <tr><td><strong>Aspect Ratios</strong></td><td>9:16 (Story/Reel) + 1:1 (Feed) + 16:9 (YouTube)</td></tr>
</table>
""")
    return name, html


# ─────────────────────────────────────────────
# Main Execution
# ─────────────────────────────────────────────

def main():
    print("=" * 60)
    print("  NOVACODE Recruiting – Staged Docs Creator")
    print(f"  {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)
    print()

    # Step 1: Get credentials
    creds = get_credentials()
    print("[2/3] Validating token...")
    creds = ensure_valid_token(creds)
    print()

    # Step 2: Define all documents
    doc_generators = [
        doc_02_zielgruppen_avatar,
        doc_03_arbeitgeber_avatar,
        doc_04_messaging_matrix,
        doc_05_creative_briefing,
        doc_06_marken_richtlinien,
        doc_07_landingpage_texte,
        doc_08_formularseite_texte,
        doc_09_dankeseite_texte,
        doc_10_anzeigentexte_hauptkampagne,
        doc_11_anzeigentexte_retargeting,
        doc_12_anzeigentexte_warmup,
        doc_13_videoskript,
    ]

    # Step 3: Create docs
    print(f"[3/3] Creating {len(doc_generators)} documents...")
    print("-" * 60)

    results = []
    for i, gen in enumerate(doc_generators, 1):
        name, html = gen()
        print(f"\n  [{i:2d}/{len(doc_generators)}] Creating: {name}")
        result = create_doc(creds["token"], name, html)

        if result["status"] == "created":
            print(f"         URL: {result['url']}")
        else:
            # Try token refresh and retry once
            print("         Retrying with refreshed token...")
            creds = refresh_token(creds)
            result = create_doc(creds["token"], name, html, retries=1)
            if result["status"] == "created":
                print(f"         URL: {result['url']}")
            else:
                print(f"         FAILED to create document.")

        results.append(result)
        time.sleep(0.5)  # Be nice to the API

    # Step 4: Save manifest
    print("\n" + "=" * 60)
    manifest = {
        "created_at": datetime.now().isoformat(),
        "total": len(results),
        "successful": sum(1 for r in results if r["status"] == "created"),
        "failed": sum(1 for r in results if r["status"] == "failed"),
        "documents": results,
    }

    with open(MANIFEST_PATH, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)
    print(f"  Manifest saved to: {MANIFEST_PATH}")

    # Summary
    print("\n" + "=" * 60)
    print("  SUMMARY")
    print("=" * 60)
    for r in results:
        status = "OK" if r["status"] == "created" else "FAIL"
        print(f"  [{status}] {r['name']}")
        if r["url"]:
            print(f"        {r['url']}")
    print()
    print(f"  Total: {manifest['successful']}/{manifest['total']} documents created successfully.")
    print("=" * 60)


if __name__ == "__main__":
    main()
