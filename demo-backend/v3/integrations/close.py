"""
Close CRM Integration — Leads, Opportunities, Notes, Stage Updates.
"""

import httpx
import logging
from typing import Optional
from ..config import CLOSE_API_KEY, CLOSE_PIPELINE_ID, CLOSE_STAGES
from .errors import IntegrationError, RateLimitError, AuthError, NotFoundError, retryable

log = logging.getLogger("v3.close")


class CloseClient:
    """Close CRM API Wrapper."""

    def __init__(self, api_key: str = ""):
        self.api_key = api_key or CLOSE_API_KEY
        self.base_url = "https://api.close.com/api/v1"
        self._client = httpx.AsyncClient(timeout=30)

    @retryable()
    async def _request(self, method: str, path: str, data: dict = None) -> dict:
        resp = await self._client.request(
            method,
            f"{self.base_url}{path}",
            auth=(self.api_key, ""),
            json=data,
        )
            if resp.status_code == 401:
                raise AuthError("close", f"{method} {path}")
            if resp.status_code == 404:
                raise NotFoundError("close", f"{method} {path}", path)
            if resp.status_code == 429:
                raise RateLimitError("close", f"{method} {path}", retry_after=int(resp.headers.get("Retry-After", "60")))
            if resp.status_code >= 400:
                raise IntegrationError("close", f"{method} {path}", f"HTTP {resp.status_code}: {resp.text[:200]}", retryable=resp.status_code >= 500)
            if resp.status_code == 204:
                return {}
            return resp.json()

    async def search_lead_by_email(self, email: str) -> Optional[dict]:
        """Suche Lead by Email — für Duplikat-Check."""
        result = await self._request("GET", f"/lead/?query=email%3A%22{email}%22&limit=1")
        leads = result.get("data", [])
        return leads[0] if leads else None

    async def create_lead(self, company: str, contact: str, email: str, phone: str = "") -> dict:
        """Erstelle Lead + Kontakt."""
        contacts = [{"name": contact, "emails": [{"email": email, "type": "office"}]}]
        if phone:
            contacts[0]["phones"] = [{"phone": phone, "type": "office"}]

        result = await self._request("POST", "/lead/", {
            "name": company,
            "contacts": contacts,
        })
        lead_id = result.get("id", "")
        if not lead_id:
            raise IntegrationError("close", "create_lead", "API returned empty lead_id")
        log.info("close.create_lead", extra={"service": "close", "lead_id": lead_id, "company": company, "email": email})
        return {"lead_id": lead_id, "url": f"https://app.close.com/lead/{lead_id}"}

    async def create_opportunity(self, lead_id: str, stage: str = "onboarding_gestartet", note: str = "") -> dict:
        """Erstelle Opportunity im Fulfillment-Pipeline."""
        stage_id = CLOSE_STAGES.get(stage, "")
        result = await self._request("POST", "/opportunity/", {
            "lead_id": lead_id,
            "pipeline_id": CLOSE_PIPELINE_ID,
            "status_id": stage_id,
            "note": note,
        })
        opp_id = result.get("id", "")
        if not opp_id:
            raise IntegrationError("close", "create_opportunity", "API returned empty opportunity_id")
        log.info("close.create_opportunity", extra={"service": "close", "opportunity_id": opp_id, "lead_id": lead_id, "stage": stage})
        return {"opportunity_id": opp_id}

    async def update_stage(self, opportunity_id: str, stage: str) -> dict:
        """Stage einer Opportunity updaten."""
        stage_id = CLOSE_STAGES.get(stage, "")
        if not stage_id:
            log.warning(f"Unbekannte Stage: {stage}")
            return {"error": f"Unbekannte Stage: {stage}"}

        await self._request("PUT", f"/opportunity/{opportunity_id}/", {
            "status_id": stage_id,
        })
        return {"stage": stage}

    async def add_note(self, lead_id: str, note: str) -> dict:
        """Notiz zu einem Lead hinzufügen."""
        result = await self._request("POST", "/activity/note/", {
            "lead_id": lead_id,
            "note": note,
        })
        return {"note_id": result.get("id", "")}

    async def health_check(self) -> dict:
        try:
            result = await self._request("GET", "/me/")
            return {"status": "ok", "org": result.get("organizations", [{}])[0].get("name", "?")}
        except Exception as e:
            return {"status": "error", "message": str(e)[:80]}
