"""
ClickUp Integration — Projekte, Tasks, Checklisten.
"""

import httpx
import logging
from datetime import datetime, timedelta
from ..config import CLICKUP_TOKEN, CLICKUP_SPACE_ID, CLICKUP_CLAUDIO, CLICKUP_ANAK
from .errors import IntegrationError, RateLimitError, AuthError, NotFoundError, retryable

log = logging.getLogger("v3.clickup")


class ClickUpClient:
    """ClickUp API Wrapper."""

    def __init__(self):
        self.token = CLICKUP_TOKEN
        self.space_id = CLICKUP_SPACE_ID
        self._client = httpx.AsyncClient(timeout=15)

    @retryable()
    async def _request(self, method: str, path: str, data: dict = None) -> dict:
        resp = await self._client.request(
            method,
            f"https://api.clickup.com/api/v2{path}",
            headers={"Authorization": self.token, "Content-Type": "application/json"},
            json=data,
        )
            if resp.status_code == 401:
                raise AuthError("clickup", f"{method} {path}")
            if resp.status_code == 404:
                raise NotFoundError("clickup", f"{method} {path}", path)
            if resp.status_code == 429:
                raise RateLimitError("clickup", f"{method} {path}", retry_after=int(resp.headers.get("Retry-After", "30")))
            if resp.status_code >= 400:
                raise IntegrationError("clickup", f"{method} {path}", f"HTTP {resp.status_code}: {resp.text[:200]}", retryable=resp.status_code >= 500)
            return resp.json()

    async def create_list(self, name: str) -> dict:
        """Projekt-Liste erstellen. Idempotent: sucht erst ob Liste existiert."""
        # Suche in allen Listen (Top-Level + Folder)
        try:
            existing = await self._request("GET", f"/space/{self.space_id}/list")
            for lst in existing.get("lists", []):
                if lst.get("name") == name:
                    list_id = lst.get("id", "")
                    log.info("clickup.create_list reuse", extra={"service": "clickup", "list_id": list_id, "list_name": name})
                    return {"list_id": list_id, "url": f"https://app.clickup.com/list/{list_id}"}
        except Exception:
            pass

        try:
            result = await self._request("POST", f"/space/{self.space_id}/list", {"name": name})
            list_id = result.get("id", "")
            if not list_id:
                raise IntegrationError("clickup", "create_list", "API returned empty list_id")
            log.info("clickup.create_list", extra={"service": "clickup", "list_id": list_id, "list_name": name})
            return {"list_id": list_id, "url": f"https://app.clickup.com/list/{list_id}"}
        except IntegrationError as e:
            # "List name taken" → Suche in Foldern
            if "name taken" in str(e).lower() or "SUBCAT_016" in str(e):
                try:
                    folders = await self._request("GET", f"/space/{self.space_id}/folder")
                    for folder in folders.get("folders", []):
                        for lst in folder.get("lists", []):
                            if lst.get("name") == name:
                                list_id = lst.get("id", "")
                                log.info("clickup.create_list reuse (folder)", extra={"service": "clickup", "list_id": list_id, "list_name": name})
                                return {"list_id": list_id, "url": f"https://app.clickup.com/list/{list_id}"}
                except Exception:
                    pass
            raise

    async def create_task(self, list_id: str, name: str, assignee: int = None, priority: int = 3, due_days: int = 3, description: str = "") -> dict:
        """Task erstellen."""
        data = {
            "name": name,
            "priority": priority,
            "due_date": int((datetime.now() + timedelta(days=due_days)).timestamp() * 1000),
        }
        if assignee:
            data["assignees"] = [assignee]
        if description:
            data["description"] = description

        result = await self._request("POST", f"/list/{list_id}/task", data)
        task_id = result.get("id", "")
        if not task_id:
            raise IntegrationError("clickup", "create_task", "API returned empty task_id")
        return {"task_id": task_id, "name": name}

    async def create_checklist(self, task_id: str, name: str, items: list[str]) -> dict:
        """Checklist mit Items erstellen."""
        result = await self._request("POST", f"/task/{task_id}/checklist", {"name": name})
        checklist_id = result.get("checklist", {}).get("id", "")
        if not checklist_id:
            return {"checklist_id": "", "items_created": 0}

        items_created = 0
        for item_name in items:
            try:
                await self._request("POST", f"/checklist/{checklist_id}/checklist_item", {"name": item_name})
                items_created += 1
            except Exception as e:
                log.warning(f"Checklist-Item '{item_name}' fehlgeschlagen: {e}")

        return {"checklist_id": checklist_id, "items_created": items_created}

    async def create_initial_tasks(self, list_id: str, company: str) -> dict:
        """V3-spezifische Onboarding-Tasks mit Checklisten."""
        tasks = {}

        # Task 1: Bausteine prüfen
        t1 = await self.create_task(
            list_id, f"Bausteine prüfen — {company}",
            assignee=CLICKUP_CLAUDIO, priority=1, due_days=3,
            description=f"Alle Strategie-Bausteine für {company} prüfen und freigeben.",
        )
        tasks["bausteine"] = t1.get("task_id", "")
        try:
            await self.create_checklist(t1["task_id"], "Bausteine-Review", [
                "Schmerzpunkte & Probleme geprüft",
                "Benefits & Vorteile geprüft",
                "Psychologische Trigger geprüft",
                "Zielgruppen-Avatar geprüft",
                "Arbeitgeber-Avatar geprüft",
                "Messaging Matrix geprüft",
            ])
        except Exception as e:
            log.warning(f"Checklist fuer Bausteine-Task fehlgeschlagen: {e}")

        # Task 2: Strategie-Docs reviewen
        t2 = await self.create_task(
            list_id, f"Strategie-Docs reviewen — {company}",
            assignee=CLICKUP_CLAUDIO, priority=2, due_days=5,
            description=f"Alle KI-generierten Strategie-Dokumente für {company} reviewen.",
        )
        tasks["strategie_docs"] = t2.get("task_id", "")
        try:
            await self.create_checklist(t2["task_id"], "Strategie-Docs", [
                "Zielgruppen-Avatar",
                "Arbeitgeber-Avatar",
                "Messaging Matrix",
                "Creative Briefing",
                "Marken-Richtlinien",
            ])
        except Exception as e:
            log.warning(f"Checklist fuer Strategie-Docs fehlgeschlagen: {e}")

        # Task 3: Copy-Texte reviewen
        t3 = await self.create_task(
            list_id, f"Copy-Texte reviewen — {company}",
            assignee=CLICKUP_CLAUDIO, priority=2, due_days=7,
            description=f"Alle Copy-Texte für {company} reviewen und freigeben.",
        )
        tasks["copy_texte"] = t3.get("task_id", "")
        try:
            await self.create_checklist(t3["task_id"], "Copy-Texte", [
                "Landingpage-Texte",
                "Formularseite-Texte",
                "Dankeseite-Texte",
                "Anzeigentexte Initial",
                "Anzeigentexte Retargeting",
                "Anzeigentexte Warmup",
                "Videoskript",
            ])
        except Exception as e:
            log.warning(f"Checklist fuer Copy-Texte fehlgeschlagen: {e}")

        # Task 4: Pixel einbauen (Anak)
        t4 = await self.create_task(
            list_id, f"Pixel einbauen — {company}",
            assignee=CLICKUP_ANAK, priority=1, due_days=2,
            description=f"Meta Pixel und Conversion API für {company} einrichten.",
        )
        tasks["pixel"] = t4.get("task_id", "")

        return {"task_ids": tasks}

    async def create_review_task(self, list_id: str, company: str, details: str = "") -> dict:
        """Review-Task nach Launch erstellen."""
        return await self.create_task(
            list_id, f"Review: {company} — Alle Sachen pruefen",
            assignee=CLICKUP_CLAUDIO, priority=2, due_days=2,
            description=details or f"Client ist live. Bitte alle Deliverables, Funnel und Kampagnen pruefen.",
        )

    async def health_check(self) -> dict:
        try:
            result = await self._request("GET", "/user")
            return {"status": "ok", "user": result.get("user", {}).get("username", "?")}
        except Exception as e:
            return {"status": "error", "message": str(e)[:80]}
