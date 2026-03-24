"""
Google Workspace Integration — Drive, Docs, Sheets, Calendar, Gmail.
+ Marketing Token (GTM, GA4) als zweite Token-Quelle.
"""

import httpx
import json
import base64
import logging
import ssl
import certifi
import urllib.request
from datetime import datetime, timezone, timedelta
from email.mime.text import MIMEText
from pathlib import Path
from ..config import GOOGLE_TOKEN, GOOGLE_REFRESH_TOKEN, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
from .errors import IntegrationError, AuthError

log = logging.getLogger("v3.google")

_cached_token = GOOGLE_TOKEN
_SSL_CTX = ssl.create_default_context(cafile=certifi.where())

# Marketing Token Pfad (GTM, GA4 — separater Token mit anderen Scopes)
_MARKETING_TOKEN_PATH = Path.home() / ".config" / "google_marketing_token.json"
_cached_marketing_token = ""


class GoogleClient:
    """Google Workspace API Wrapper mit automatischem Token-Refresh."""

    def __init__(self):
        self._token = GOOGLE_TOKEN

    def _get_token(self) -> str:
        """Token refreshen — Exception wenn fehlschlägt UND kein Cache."""
        global _cached_token

        if not GOOGLE_REFRESH_TOKEN:
            if not self._token:
                raise Exception("Google Token nicht konfiguriert — kein GOOGLE_REFRESH_TOKEN und kein cached Token")
            return self._token

        try:
            data = json.dumps({
                "client_id": GOOGLE_CLIENT_ID,
                "client_secret": GOOGLE_CLIENT_SECRET,
                "refresh_token": GOOGLE_REFRESH_TOKEN,
                "grant_type": "refresh_token",
            }).encode()
            req = urllib.request.Request("https://oauth2.googleapis.com/token", data=data, headers={"Content-Type": "application/json"})
            resp = urllib.request.urlopen(req, timeout=10, context=_SSL_CTX)
            new_token = json.loads(resp.read()).get("access_token", "")
            if new_token:
                _cached_token = new_token
                self._token = new_token
                return new_token
            # Kein neuer Token, aber alter existiert
            if self._token:
                log.warning("Google token refresh returned empty — verwende cached Token")
                return self._token
            raise Exception("Google Token Refresh lieferte leeren Token")
        except Exception as e:
            if self._token:
                log.warning(f"Google token refresh failed, verwende cached Token: {e}")
                return self._token
            raise Exception(f"Google Token ungültig — Re-Autorisierung nötig: {e}")

    def _headers(self) -> dict:
        return {"Authorization": f"Bearer {self._get_token()}", "Content-Type": "application/json"}

    # ── Marketing Token (GTM, GA4) ───────────────────────────

    def _get_marketing_token(self) -> str:
        """Marketing Token laden und refreshen (GTM/GA4 Scopes)."""
        global _cached_marketing_token

        if not _MARKETING_TOKEN_PATH.exists():
            raise Exception(f"Marketing Token nicht gefunden: {_MARKETING_TOKEN_PATH}")

        with open(_MARKETING_TOKEN_PATH) as f:
            creds = json.load(f)

        token = creds.get("access_token", "")
        refresh = creds.get("refresh_token", "")
        client_id = creds.get("client_id", GOOGLE_CLIENT_ID)
        client_secret = creds.get("client_secret", GOOGLE_CLIENT_SECRET)

        # Refresh wenn möglich
        if refresh:
            try:
                data = json.dumps({
                    "client_id": client_id,
                    "client_secret": client_secret,
                    "refresh_token": refresh,
                    "grant_type": "refresh_token",
                }).encode()
                req = urllib.request.Request("https://oauth2.googleapis.com/token", data=data, headers={"Content-Type": "application/json"})
                resp = urllib.request.urlopen(req, timeout=10, context=_SSL_CTX)
                new_token = json.loads(resp.read()).get("access_token", "")
                if new_token:
                    _cached_marketing_token = new_token
                    # Token in Datei zurückschreiben
                    creds["access_token"] = new_token
                    with open(_MARKETING_TOKEN_PATH, "w") as f:
                        json.dump(creds, f, indent=2)
                    return new_token
            except Exception as e:
                log.warning(f"Marketing token refresh failed: {e}")

        if token:
            _cached_marketing_token = token
            return token
        if _cached_marketing_token:
            return _cached_marketing_token

        raise Exception("Marketing Token ungültig — Re-Autorisierung nötig")

    def _marketing_headers(self) -> dict:
        return {"Authorization": f"Bearer {self._get_marketing_token()}", "Content-Type": "application/json"}

    def get_marketing_creds(self) -> dict:
        """Marketing Token Credentials laden (für GTM/GA4 Handlers)."""
        if not _MARKETING_TOKEN_PATH.exists():
            return {}
        with open(_MARKETING_TOKEN_PATH) as f:
            creds = json.load(f)
        # Token refreshen
        try:
            token = self._get_marketing_token()
            creds["access_token"] = token
        except Exception:
            pass
        return creds

    # ── Drive ────────────────────────────────────────────────

    async def _check_resp(self, resp, action: str):
        """Google API Response prüfen."""
        if resp.status_code in (401, 403):
            raise AuthError("google", action, f"HTTP {resp.status_code}")
        if resp.status_code >= 400:
            raise IntegrationError("google", action, f"HTTP {resp.status_code}: {resp.text[:200]}", retryable=resp.status_code >= 500)

    async def create_folder(self, name: str, parent_id: str = None) -> str:
        """Ordner in Drive erstellen. Idempotent: sucht erst ob Ordner existiert."""
        # Idempotenz: Suche by name+parent
        query = f"name='{name}' and mimeType='application/vnd.google-apps.folder' and trashed=false"
        if parent_id:
            query += f" and '{parent_id}' in parents"
        try:
            async with httpx.AsyncClient(timeout=15) as client:
                resp = await client.get(
                    "https://www.googleapis.com/drive/v3/files",
                    headers=self._headers(),
                    params={"q": query, "fields": "files(id,name)", "pageSize": 1},
                )
                files = resp.json().get("files", [])
                if files:
                    log.info("google.create_folder reuse", extra={"service": "google", "folder_id": files[0]["id"], "folder_name": name})
                    return files[0]["id"]
        except Exception:
            pass

        body = {"name": name, "mimeType": "application/vnd.google-apps.folder"}
        if parent_id:
            body["parents"] = [parent_id]

        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.post(
                "https://www.googleapis.com/drive/v3/files",
                headers=self._headers(),
                json=body,
            )
            await self._check_resp(resp, "create_folder")
            folder_id = resp.json().get("id", "")
            if not folder_id:
                raise IntegrationError("google", "create_folder", "API returned empty folder_id")
            log.info("google.create_folder", extra={"service": "google", "folder_id": folder_id, "folder_name": name})
            return folder_id

    async def create_folder_structure(self, company: str) -> dict:
        """9 Ordner erstellen: Root + 9 Sub-Ordner."""
        date_str = datetime.now().strftime("%Y-%m-%d")
        root_id = await self.create_folder(f"{company} — {date_str}")

        folders = {}
        for name in ["01_Verwaltung", "02_Kickoff", "03_Strategie", "04_Texte", "05_Design", "06_Funnel", "07_Kampagnen", "08_Reports", "09_Archiv"]:
            folder_id = await self.create_folder(name, root_id)
            folders[name] = folder_id

        return {"root_id": root_id, "folders": folders, "url": f"https://drive.google.com/drive/folders/{root_id}"}

    async def check_quota(self) -> dict:
        """Drive Speicherplatz prüfen."""
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(
                "https://www.googleapis.com/drive/v3/about",
                params={"fields": "storageQuota"},
                headers=self._headers(),
            )
            quota = resp.json().get("storageQuota", {})
            usage = int(quota.get("usage", "0"))
            limit_val = int(quota.get("limit", "0"))
            free_gb = (limit_val - usage) / (1024 ** 3) if limit_val > 0 else -1
            return {"free_gb": round(free_gb, 2), "usage_bytes": usage}

    # ── Docs ─────────────────────────────────────────────────

    async def create_doc(self, title: str, content: str) -> dict:
        """Google Doc erstellen mit Content."""
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                "https://docs.googleapis.com/v1/documents",
                headers=self._headers(),
                json={"title": title},
            )
            await self._check_resp(resp, "create_doc")
            doc_id = resp.json().get("documentId", "")
            if not doc_id:
                raise IntegrationError("google", "create_doc", "API returned empty documentId")

            if content:
                resp2 = await client.post(
                    f"https://docs.googleapis.com/v1/documents/{doc_id}:batchUpdate",
                    headers=self._headers(),
                    json={"requests": [{"insertText": {"location": {"index": 1}, "text": content}}]},
                )
                await self._check_resp(resp2, "create_doc:batchUpdate")

        log.info("google.create_doc", extra={"service": "google", "doc_id": doc_id, "doc_title": title})
        return {"doc_id": doc_id, "url": f"https://docs.google.com/document/d/{doc_id}/edit"}

    # ── Sheets ───────────────────────────────────────────────

    async def create_sheet(self, title: str) -> dict:
        """Google Sheet erstellen."""
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.post(
                "https://sheets.googleapis.com/v4/spreadsheets",
                headers=self._headers(),
                json={"properties": {"title": title}},
            )
            await self._check_resp(resp, "create_sheet")
            data = resp.json()
            sheet_id = data.get("spreadsheetId", "")
            if not sheet_id:
                raise IntegrationError("google", "create_sheet", "API returned empty spreadsheetId")
            return {"sheet_id": sheet_id, "url": data.get("spreadsheetUrl", "")}

    # ── Calendar ─────────────────────────────────────────────

    async def create_event(self, title: str, attendee_email: str = "", days_from_now: int = 3) -> dict:
        """Calendar Event mit Google Meet erstellen."""
        start = (datetime.now(timezone.utc) + timedelta(days=days_from_now)).replace(hour=10, minute=0, second=0)

        event_data = {
            "summary": title,
            "start": {"dateTime": start.isoformat(), "timeZone": "Europe/Berlin"},
            "end": {"dateTime": (start + timedelta(hours=1)).isoformat(), "timeZone": "Europe/Berlin"},
            "conferenceData": {"createRequest": {"requestId": f"v3-{title[:20]}", "conferenceSolutionKey": {"type": "hangoutsMeet"}}},
        }
        if attendee_email:
            event_data["attendees"] = [{"email": attendee_email}]

        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.post(
                "https://www.googleapis.com/calendar/v3/calendars/primary/events",
                headers=self._headers(),
                params={"conferenceDataVersion": 1},
                json=event_data,
            )
            await self._check_resp(resp, "create_event")
            event = resp.json()

        return {"event_id": event.get("id", ""), "meet_link": event.get("hangoutLink", "")}

    # ── Gmail ────────────────────────────────────────────────

    async def send_email(self, to: str, subject: str, body: str) -> dict:
        """Email senden."""
        msg = MIMEText(body, "plain", "utf-8")
        msg["to"] = to
        msg["subject"] = subject
        raw = base64.urlsafe_b64encode(msg.as_bytes()).decode()

        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.post(
                "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
                headers=self._headers(),
                json={"raw": raw},
            )
            await self._check_resp(resp, "send_email")

        return {"sent": True, "to": to}

    # ── Docs: Update ───────────────────────────────────────

    async def update_doc_content(self, doc_id: str, content: str):
        """Replace entire Google Doc content."""
        async with httpx.AsyncClient(timeout=30) as client:
            # First get current doc to find end index
            resp = await client.get(
                f"https://docs.googleapis.com/v1/documents/{doc_id}",
                headers=self._headers(),
            )
            await self._check_resp(resp, "update_doc_content:get")
            doc = resp.json()
            body = doc.get("body", {})
            end_index = body.get("content", [{}])[-1].get("endIndex", 1)

            # Delete all content then insert new
            requests = []
            if end_index > 2:
                requests.append({"deleteContentRange": {"range": {"startIndex": 1, "endIndex": end_index - 1}}})
            requests.append({"insertText": {"location": {"index": 1}, "text": content}})

            resp2 = await client.post(
                f"https://docs.googleapis.com/v1/documents/{doc_id}:batchUpdate",
                headers=self._headers(),
                json={"requests": requests},
            )
            await self._check_resp(resp2, "update_doc_content:batchUpdate")
        log.info("google.update_doc_content", extra={"service": "google", "doc_id": doc_id})

    # ── Docs: HTML Upload (V1-Style multipart) ─────────────

    async def create_doc_html(self, title: str, html_content: str, folder_id: str = "") -> dict:
        """Google Doc aus HTML erstellen (V1-Methode, multipart upload)."""
        import json as _json

        metadata = _json.dumps({
            "name": title,
            "mimeType": "application/vnd.google-apps.document",
            **({"parents": [folder_id]} if folder_id else {}),
        })

        css = """
        body { font-family: 'Inter', Arial, sans-serif; color: #1a1a2e; line-height: 1.6; }
        h1 { color: #0a1628; border-bottom: 2px solid #00e5ff; padding-bottom: 8px; }
        h2 { color: #16213e; margin-top: 24px; }
        h3 { color: #0f3460; }
        table { border-collapse: collapse; width: 100%; margin: 16px 0; }
        th { background: #0a1628; color: #fff; padding: 10px; text-align: left; }
        td { border: 1px solid #ddd; padding: 8px; }
        tr:nth-child(even) { background: #f8f9fa; }
        .highlight { background: #e8f5e9; padding: 12px; border-left: 4px solid #00e5ff; margin: 16px 0; }
        """

        full_html = f"<!DOCTYPE html><html><head><style>{css}</style></head><body>{html_content}</body></html>"

        boundary = "v3_doc_boundary_fs"
        body = (
            f"--{boundary}\r\n"
            f"Content-Type: application/json; charset=UTF-8\r\n\r\n"
            f"{metadata}\r\n"
            f"--{boundary}\r\n"
            f"Content-Type: text/html; charset=UTF-8\r\n\r\n"
            f"{full_html}\r\n"
            f"--{boundary}--"
        )

        token = self._get_token()
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": f"multipart/related; boundary={boundary}",
                },
                content=body.encode("utf-8"),
            )
            if resp.status_code not in (200, 201):
                raise Exception(f"Google Doc HTML erstellen fehlgeschlagen: {resp.status_code} {resp.text[:200]}")
            data = resp.json()
            doc_id = data.get("id", "")
            return {"doc_id": doc_id, "url": f"https://docs.google.com/document/d/{doc_id}/edit"}

    async def update_doc_html(self, doc_id: str, html_content: str) -> dict:
        """Google Doc Inhalt komplett ersetzen (V1-Methode, PATCH upload)."""
        css = """
        body { font-family: 'Inter', Arial, sans-serif; color: #1a1a2e; line-height: 1.6; }
        h1 { color: #0a1628; border-bottom: 2px solid #00e5ff; padding-bottom: 8px; }
        h2 { color: #16213e; margin-top: 24px; }
        h3 { color: #0f3460; }
        table { border-collapse: collapse; width: 100%; margin: 16px 0; }
        th { background: #0a1628; color: #fff; padding: 10px; text-align: left; }
        td { border: 1px solid #ddd; padding: 8px; }
        tr:nth-child(even) { background: #f8f9fa; }
        """
        full_html = f"<!DOCTYPE html><html><head><style>{css}</style></head><body>{html_content}</body></html>"

        token = self._get_token()
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.patch(
                f"https://www.googleapis.com/upload/drive/v3/files/{doc_id}?uploadType=media",
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "text/html; charset=UTF-8",
                },
                content=full_html.encode("utf-8"),
            )
            if resp.status_code not in (200, 201):
                raise Exception(f"Google Doc update fehlgeschlagen: {resp.status_code} {resp.text[:200]}")
            return {"updated": True, "doc_id": doc_id}

    async def read_doc_content(self, doc_id: str) -> str:
        """Google Doc Inhalt als Plain Text lesen."""
        token = self._get_token()
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(
                f"https://www.googleapis.com/drive/v3/files/{doc_id}/export?mimeType=text/plain",
                headers={"Authorization": f"Bearer {token}"},
            )
            if resp.status_code != 200:
                raise Exception(f"Google Doc lesen fehlgeschlagen: {resp.status_code}")
            return resp.text

    # ── Sheets ──────────────────────────────────────────────

    async def append_to_sheet(self, sheet_id: str, values: list) -> dict:
        """Zeilen an Google Sheet anhängen (mit Token Refresh)."""
        token = self._get_token()
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.post(
                f"https://sheets.googleapis.com/v4/spreadsheets/{sheet_id}/values/A1:append",
                headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
                params={"valueInputOption": "USER_ENTERED", "insertDataOption": "INSERT_ROWS"},
                json={"values": values},
            )
            if resp.status_code not in (200, 201):
                raise Exception(f"Sheet append failed: {resp.status_code}")
            return {"appended": True}

    # ── Health ───────────────────────────────────────────────

    async def health_check(self) -> dict:
        try:
            quota = await self.check_quota()
            return {"status": "ok", "free_gb": quota.get("free_gb")}
        except Exception as e:
            return {"status": "error", "message": str(e)[:80]}
