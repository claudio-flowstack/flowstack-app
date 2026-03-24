#!/usr/bin/env python3
"""
Sets a professional Gmail signature for claudio@flowstack.com

Usage:
  doppler run -p fulfillment-automation -c dev_claudio -- python3 set-gmail-signature.py
"""

import json
import os
import httpx

# ─── Auth ────────────────────────────────────────────────────────────────────

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
    resp = httpx.request(method, url, json=data, headers=headers, timeout=30)
    if resp.status_code == 401:
        refresh_token()
        headers = {"Authorization": f"Bearer {TOKEN}"}
        resp = httpx.request(method, url, json=data, headers=headers, timeout=30)
    if resp.status_code >= 400:
        print(f"ERROR {resp.status_code}: {resp.text[:500]}")
        raise Exception(f"API Error {resp.status_code}")
    if resp.status_code == 204 or not resp.content:
        return {}
    return resp.json()


# ─── Signature HTML ──────────────────────────────────────────────────────────

SIGNATURE_HTML = """
<table cellpadding="0" cellspacing="0" border="0" style="font-family:'Google Sans',Helvetica,Arial,sans-serif;color:#1e293b;font-size:14px;line-height:1.4">
  <tr>
    <td style="padding-right:20px;border-right:3px solid #6366f1;vertical-align:top">
      <table cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="padding-bottom:4px">
            <span style="font-size:18px;font-weight:700;color:#0a1628;letter-spacing:-0.3px">Claudio Di Franco</span>
          </td>
        </tr>
        <tr>
          <td style="padding-bottom:12px">
            <span style="font-size:13px;color:#6366f1;font-weight:600">Gründer & Geschäftsführer</span>
          </td>
        </tr>
        <tr>
          <td style="padding-bottom:4px">
            <span style="font-size:12px;color:#64748b">✉&nbsp;</span>
            <a href="mailto:claudio@flowstack.com" style="font-size:12px;color:#1e293b;text-decoration:none">claudio@flowstack.com</a>
          </td>
        </tr>
        <tr>
          <td style="padding-bottom:4px">
            <span style="font-size:12px;color:#64748b">✆&nbsp;</span>
            <a href="tel:+491735837927" style="font-size:12px;color:#1e293b;text-decoration:none">+49 173 583 7927</a>
          </td>
        </tr>
        <tr>
          <td>
            <span style="font-size:12px;color:#64748b">⌂&nbsp;</span>
            <span style="font-size:12px;color:#1e293b">Falkenweg 2, 76327 Pfinztal</span>
          </td>
        </tr>
      </table>
    </td>
    <td style="padding-left:20px;vertical-align:top">
      <table cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="padding-bottom:6px">
            <span style="font-size:16px;font-weight:700;color:#0a1628;letter-spacing:-0.2px">Flowstack</span><span style="font-size:16px;font-weight:300;color:#6366f1"> Systems</span>
          </td>
        </tr>
        <tr>
          <td style="padding-bottom:10px">
            <span style="font-size:11px;color:#64748b;line-height:1.5">KI-Automatisierung für Agenturen<br>&amp; B2B-Dienstleister</span>
          </td>
        </tr>
        <tr>
          <td>
            <a href="https://flowstack-systems.de" style="display:inline-block;background:#6366f1;color:#ffffff;font-size:11px;font-weight:600;padding:6px 14px;border-radius:4px;text-decoration:none;letter-spacing:0.3px">Website besuchen</a>
          </td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td colspan="2" style="padding-top:14px">
      <table cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td style="border-top:1px solid #e2e8f0;padding-top:10px">
            <span style="font-size:10px;color:#94a3b8;line-height:1.4">Diese Nachricht kann vertrauliche Informationen enthalten. Wenn Sie nicht der beabsichtigte Empfänger sind, löschen Sie diese Nachricht bitte.</span>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
""".strip()


# ─── Main ────────────────────────────────────────────────────────────────────

def main():
    print("Gmail Signatur setzen für claudio@flowstack.com")
    print()

    # Step 1: Get current sendAs settings to find the right alias
    print("1. SendAs-Einstellungen abrufen...")
    result = api("GET", "https://gmail.googleapis.com/gmail/v1/users/me/settings/sendAs")
    send_as_list = result.get("sendAs", [])

    target_email = None
    for sa in send_as_list:
        email = sa.get("sendAsEmail", "")
        print(f"   Gefunden: {email} (primary: {sa.get('isPrimary', False)})")
        if "flowstack" in email.lower() or "claudio" in email.lower():
            target_email = email
        if not target_email and sa.get("isPrimary"):
            target_email = email

    if not target_email:
        print("Keine passende Email gefunden!")
        return

    print(f"\n2. Signatur setzen für: {target_email}")

    # Step 2: Update signature
    api("PUT", f"https://gmail.googleapis.com/gmail/v1/users/me/settings/sendAs/{target_email}", {
        "signature": SIGNATURE_HTML,
    })

    print("   ✓ Signatur gesetzt!")
    print()
    print("=" * 50)
    print("VORSCHAU:")
    print("=" * 50)
    print()
    print("  Claudio Di Franco")
    print("  Gründer & Geschäftsführer")
    print()
    print("  ✉ claudio@flowstack.com")
    print("  ✆ +49 173 583 7927")
    print("  ⌂ Falkenweg 2, 76327 Pfinztal")
    print()
    print("  Flowstack Systems")
    print("  KI-Automatisierung für Agenturen")
    print("  & B2B-Dienstleister")
    print()
    print("  [Website besuchen]")
    print()
    print("Öffne Gmail um die neue Signatur zu sehen!")


if __name__ == "__main__":
    main()
