#!/usr/bin/env python3
"""
Uploads Claudio's profile photo to Google Drive (public) and updates Gmail signature.

Usage:
  doppler run -p fulfillment-automation -c dev_claudio -- python3 upload-signature-photo.py
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


def api(method, url, data=None, headers_extra=None, content=None, files=None):
    headers = {"Authorization": f"Bearer {TOKEN}"}
    if headers_extra:
        headers.update(headers_extra)
    if content:
        resp = httpx.request(method, url, headers=headers, content=content, timeout=60)
    elif files:
        resp = httpx.request(method, url, headers={"Authorization": f"Bearer {TOKEN}"}, files=files, timeout=60)
    else:
        resp = httpx.request(method, url, json=data, headers=headers, timeout=30)
    if resp.status_code == 401:
        refresh_token()
        headers["Authorization"] = f"Bearer {TOKEN}"
        if content:
            resp = httpx.request(method, url, headers=headers, content=content, timeout=60)
        elif files:
            resp = httpx.request(method, url, headers={"Authorization": f"Bearer {TOKEN}"}, files=files, timeout=60)
        else:
            resp = httpx.request(method, url, json=data, headers=headers, timeout=30)
    if resp.status_code >= 400:
        print(f"ERROR {resp.status_code}: {resp.text[:500]}")
        raise Exception(f"API Error {resp.status_code}")
    if resp.status_code == 204 or not resp.content:
        return {}
    return resp.json()


PHOTO_PATH = "/Users/claudiodifranco/Desktop/Flowstack /04_Marketing/Webseite/Seiten code/[CODE] - Ai Automation Seite V1/public/claudio.jpg"


def main():
    print("1. Profilbild auf Google Drive hochladen...")

    # Upload via multipart
    metadata = json.dumps({"name": "claudio-signature.jpg", "mimeType": "image/jpeg"})

    with open(PHOTO_PATH, "rb") as f:
        image_data = f.read()

    # Use resumable upload for simplicity with multipart
    boundary = "signature_upload_boundary"
    body = (
        f"--{boundary}\r\n"
        f"Content-Type: application/json; charset=UTF-8\r\n\r\n"
        f"{metadata}\r\n"
        f"--{boundary}\r\n"
        f"Content-Type: image/jpeg\r\n\r\n"
    ).encode("utf-8") + image_data + f"\r\n--{boundary}--".encode("utf-8")

    headers = {"Authorization": f"Bearer {TOKEN}", "Content-Type": f"multipart/related; boundary={boundary}"}
    resp = httpx.post(
        "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",
        headers=headers, content=body, timeout=60,
    )
    if resp.status_code == 401:
        refresh_token()
        headers["Authorization"] = f"Bearer {TOKEN}"
        resp = httpx.post(
            "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",
            headers=headers, content=body, timeout=60,
        )
    if resp.status_code >= 400:
        print(f"Upload ERROR: {resp.status_code} {resp.text[:300]}")
        return

    file_id = resp.json()["id"]
    print(f"   Hochgeladen: {file_id}")

    # Make file publicly readable
    print("2. Bild öffentlich machen...")
    api("POST", f"https://www.googleapis.com/drive/v3/files/{file_id}/permissions", {
        "role": "reader",
        "type": "anyone",
    })
    print("   ✓ Öffentlich")

    # Public URL for embedding
    photo_url = f"https://drive.google.com/uc?export=view&id={file_id}"
    print(f"   URL: {photo_url}")

    # Update signature with photo
    print("\n3. Gmail-Signatur mit Bild aktualisieren...")

    signature_html = f"""
<table cellpadding="0" cellspacing="0" border="0" style="font-family:'Google Sans',Helvetica,Arial,sans-serif;color:#1e293b;font-size:14px;line-height:1.4">
  <tr>
    <td style="padding-right:18px;vertical-align:top">
      <img src="{photo_url}" alt="Claudio Di Franco" width="90" height="90" style="border-radius:50%;object-fit:cover;display:block" />
    </td>
    <td style="padding-right:18px;border-right:3px solid #6366f1;vertical-align:top">
      <table cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="padding-bottom:2px">
            <span style="font-size:18px;font-weight:700;color:#0a1628;letter-spacing:-0.3px">Claudio Di Franco</span>
          </td>
        </tr>
        <tr>
          <td style="padding-bottom:10px">
            <span style="font-size:13px;color:#6366f1;font-weight:600">Gründer &amp; Geschäftsführer</span>
          </td>
        </tr>
        <tr>
          <td style="padding-bottom:3px">
            <a href="mailto:claudio@flowstack-system.de" style="font-size:12px;color:#1e293b;text-decoration:none">claudio@flowstack-system.de</a>
          </td>
        </tr>
        <tr>
          <td style="padding-bottom:3px">
            <a href="tel:+491735837927" style="font-size:12px;color:#1e293b;text-decoration:none">+49 173 583 7927</a>
          </td>
        </tr>
        <tr>
          <td>
            <span style="font-size:12px;color:#64748b">Falkenweg 2, 76327 Pfinztal</span>
          </td>
        </tr>
      </table>
    </td>
    <td style="padding-left:18px;vertical-align:top">
      <table cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="padding-bottom:4px">
            <span style="font-size:16px;font-weight:700;color:#0a1628">Flowstack</span><span style="font-size:16px;font-weight:300;color:#6366f1"> Systems</span>
          </td>
        </tr>
        <tr>
          <td style="padding-bottom:10px">
            <span style="font-size:11px;color:#64748b;line-height:1.5">KI-Automatisierung für Agenturen<br>&amp; B2B-Dienstleister</span>
          </td>
        </tr>
        <tr>
          <td>
            <a href="https://flowstack-systems.de" style="display:inline-block;background:#6366f1;color:#ffffff;font-size:11px;font-weight:600;padding:6px 14px;border-radius:4px;text-decoration:none">Website besuchen</a>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
""".strip()

    result = api("GET", "https://gmail.googleapis.com/gmail/v1/users/me/settings/sendAs")
    target_email = None
    for sa in result.get("sendAs", []):
        if sa.get("isPrimary"):
            target_email = sa["sendAsEmail"]

    if not target_email:
        print("Keine primary Email gefunden!")
        return

    api("PUT", f"https://gmail.googleapis.com/gmail/v1/users/me/settings/sendAs/{target_email}", {
        "signature": signature_html,
    })

    print(f"   ✓ Signatur mit Bild gesetzt für {target_email}!")
    print()
    print("Öffne Gmail und schreib eine neue Mail!")


if __name__ == "__main__":
    main()
