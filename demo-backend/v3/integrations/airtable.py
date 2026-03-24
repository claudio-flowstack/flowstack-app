"""
Airtable Integration — CRUD für V3 Base.
"""

import httpx
import logging
from ..config import AIRTABLE_API_KEY, AIRTABLE_V3_BASE_ID
from .errors import IntegrationError, RateLimitError, AuthError, retryable

log = logging.getLogger("v3.airtable")


class AirtableClient:
    """Airtable API Wrapper für V3 Base."""

    def __init__(self, base_id: str = ""):
        self.api_key = AIRTABLE_API_KEY
        self.base_id = base_id or AIRTABLE_V3_BASE_ID
        self._client = httpx.AsyncClient(timeout=15)

    def _headers(self) -> dict:
        return {"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"}

    async def _check_response(self, resp, action: str):
        """Response Status prüfen und passenden Error raisen."""
        if resp.status_code == 401:
            raise AuthError("airtable", action)
        if resp.status_code == 429:
            raise RateLimitError("airtable", action, retry_after=int(resp.headers.get("Retry-After", "30")))
        if resp.status_code >= 400:
            raise IntegrationError("airtable", action, f"HTTP {resp.status_code}: {resp.text[:200]}", retryable=resp.status_code >= 500)

    @retryable()
    async def create_record(self, table: str, fields: dict) -> str:
        """Record erstellen. Returns record_id."""
        resp = await self._client.post(
            f"https://api.airtable.com/v0/{self.base_id}/{table}",
            headers=self._headers(),
            json={"records": [{"fields": fields}]},
        )
        await self._check_response(resp, f"create_record({table})")
        records = resp.json().get("records", [])
        if not records or not records[0].get("id"):
            raise IntegrationError("airtable", f"create_record({table})", "API returned empty record")
        return records[0]["id"]

    @retryable()
    async def update_record(self, table: str, record_id: str, fields: dict):
        """Record updaten."""
        resp = await self._client.patch(
            f"https://api.airtable.com/v0/{self.base_id}/{table}/{record_id}",
            headers=self._headers(),
            json={"fields": fields},
        )
        await self._check_response(resp, f"update_record({table}/{record_id})")

    @retryable()
    async def get_records(self, table: str, filter_formula: str = "", max_records: int = 100) -> list:
        """Records lesen."""
        params = {"maxRecords": max_records}
        if filter_formula:
            params["filterByFormula"] = filter_formula

        resp = await self._client.get(
            f"https://api.airtable.com/v0/{self.base_id}/{table}",
            headers={"Authorization": f"Bearer {self.api_key}"},
            params=params,
        )
        await self._check_response(resp, f"get_records({table})")
        return resp.json().get("records", [])

    async def create_client(self, company: str, contact: str, email: str, branche: str, account_manager: str = "Claudio") -> str:
        return await self.create_record("CLIENTS", {
            "Client Name": company,
            "Ansprechpartner": contact,
            "Email": email,
            "Branche": branche,
            "Account Manager": account_manager,
            "Status": "onboarding",
        })

    async def update_client(self, record_id: str, fields: dict):
        await self.update_record("CLIENTS", record_id, fields)

    async def create_document(self, doc_name: str, doc_type: str, google_doc_url: str = "", google_doc_id: str = "", status: str = "generated") -> str:
        fields = {
            "Dokument-Name": doc_name,
            "Google Doc URL": google_doc_url,
            "Google Doc ID": google_doc_id,
            "Status": status,
        }
        # Dokument-Typ nur setzen wenn es kein Select-Feld-Problem gibt
        try:
            fields["Dokument-Typ"] = doc_type
            return await self.create_record("DOKUMENTE", fields)
        except Exception:
            # Fallback ohne Dokument-Typ (falls Select-Feld nicht konfiguriert)
            fields.pop("Dokument-Typ", None)
            return await self.create_record("DOKUMENTE", fields)

    async def write_bausteine(self, blocks: dict, client_id: str = "") -> int:
        """Bausteine flattened in Airtable schreiben."""
        CATEGORY_NAMES = {
            "demografie": "A. Demografie", "beruflich": "B. Beruflich",
            "schmerzpunkte": "C. Schmerzpunkte", "psychologie": "D. Psychologie",
            "benefits": "E. Benefits", "sprache": "F. Sprache",
            "einwaende": "G. Einwaende", "arbeitgeber": "H. Arbeitgeber",
            "messaging": "I. Messaging", "markt": "J. Markt",
        }

        records = []
        for cat_key, fields in blocks.items():
            if not isinstance(fields, dict):
                continue
            cat_name = CATEGORY_NAMES.get(cat_key, cat_key)
            for field_key, value in fields.items():
                records.append({
                    "Kategorie": cat_name,
                    "Feld-Name": f"{cat_name.split('. ')[1] if '. ' in cat_name else cat_name} — {field_key}",
                    "Inhalt": str(value) if value else "",
                    "Quelle": "KI-Inferenz",
                })

        written = 0
        for i in range(0, len(records), 10):
            batch = records[i:i + 10]
            try:
                resp = await self._client.post(
                    f"https://api.airtable.com/v0/{self.base_id}/BAUSTEINE",
                    headers=self._headers(),
                    json={"records": [{"fields": r} for r in batch]},
                )
                await self._check_response(resp, f"write_bausteine(batch {i // 10 + 1})")
                written += len(batch)
            except Exception as e:
                log.warning(f"Airtable batch write failed (batch {i // 10 + 1}): {e}")

        log.info("airtable.write_bausteine", extra={"service": "airtable", "written": written, "total": len(records)})
        return written

    async def health_check(self) -> dict:
        try:
            records = await self.get_records("CLIENTS", max_records=1)
            return {"status": "ok", "base": self.base_id[:10] + "..."}
        except Exception as e:
            return {"status": "error", "message": str(e)[:80]}
