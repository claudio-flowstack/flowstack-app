"""
Miro Integration — Board erstellen. OPTIONAL Service.
"""

import httpx
import logging
from ..config import MIRO_ACCESS_TOKEN
from .errors import IntegrationError

log = logging.getLogger("v3.miro")


class MiroClient:
    """Miro API Wrapper. Optional — Fehler stoppen die Automation NICHT."""

    def __init__(self):
        self.token = MIRO_ACCESS_TOKEN

    async def create_board(self, name: str, description: str = "") -> dict:
        if not self.token:
            return {"skipped": True, "reason": "Kein Miro Token"}

        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.post(
                "https://api.miro.com/v2/boards",
                headers={"Authorization": f"Bearer {self.token}", "Content-Type": "application/json"},
                json={"name": name, "description": description},
            )
            if resp.status_code >= 400:
                raise IntegrationError("miro", "create_board", f"HTTP {resp.status_code}: {resp.text[:200]}", retryable=resp.status_code >= 500)
            data = resp.json()

        board_id = data.get("id", "")
        return {"board_id": board_id, "url": f"https://miro.com/app/board/{board_id}"}

    async def health_check(self) -> dict:
        if not self.token:
            return {"status": "not_configured"}
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.get("https://api.miro.com/v2/boards?limit=1", headers={"Authorization": f"Bearer {self.token}"})
                if resp.status_code >= 400:
                    return {"status": "error", "message": f"HTTP {resp.status_code}"}
                return {"status": "ok"}
        except Exception as e:
            return {"status": "error", "message": str(e)[:80]}
