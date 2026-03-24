"""
V3 Notion Client
- Create Client Wiki pages
- Update with kickoff summary, links, access info
"""

import json
import ssl
import certifi
import logging
import urllib.request
from typing import Any, Optional

logger = logging.getLogger("v3.notion")

SSL_CTX = ssl.create_default_context(cafile=certifi.where())
NOTION_API_VERSION = "2022-06-28"


class NotionClient:
    def __init__(self, token: str):
        self.token = token
        self.headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "Notion-Version": NOTION_API_VERSION,
        }

    def _request(self, method: str, url: str, data: Optional[dict] = None) -> dict:
        body = json.dumps(data).encode() if data else None
        req = urllib.request.Request(url, data=body, headers=self.headers, method=method)
        response = urllib.request.urlopen(req, timeout=15, context=SSL_CTX)
        return json.loads(response.read())

    def find_page_by_title(self, title: str, parent_id: Optional[str] = None) -> Optional[str]:
        """Search for a page by title. Returns page_id or None."""
        try:
            data = {
                "query": title,
                "filter": {"property": "object", "value": "page"},
                "page_size": 5,
            }
            result = self._request("POST", "https://api.notion.com/v1/search", data)
            for page in result.get("results", []):
                page_title = ""
                for prop in page.get("properties", {}).values():
                    if prop.get("type") == "title":
                        for t in prop.get("title", []):
                            page_title += t.get("plain_text", "")
                if page_title.strip().lower() == title.strip().lower():
                    return page["id"]
            return None
        except Exception as e:
            logger.warning(f"Notion search failed: {e}")
            return None

    def create_client_wiki(
        self,
        parent_page_id: str,
        client_name: str,
        company: str,
        branche: str,
        ansprechpartner: str,
        email: str,
        phone: str,
        close_url: Optional[str] = None,
        drive_url: Optional[str] = None,
        slack_channel: Optional[str] = None,
        clickup_url: Optional[str] = None,
        miro_url: Optional[str] = None,
        meta_ad_account: Optional[str] = None,
        kickoff_summary: Optional[str] = None,
    ) -> dict[str, Any]:
        """
        Create a Notion page as Client Wiki.
        Returns: {'page_id': str, 'url': str}
        """
        # Check idempotency — does page already exist?
        existing = self.find_page_by_title(f"{company} — Client Wiki")
        if existing:
            logger.info(f"Notion wiki already exists for {company}: {existing}")
            return {"page_id": existing, "url": f"https://notion.so/{existing.replace('-', '')}", "reused": True}

        # Build page content
        children = []

        # Header section
        children.append(self._heading("Kontakt", level=2))
        children.append(self._paragraph(f"Ansprechpartner: {ansprechpartner}"))
        children.append(self._paragraph(f"Email: {email}"))
        children.append(self._paragraph(f"Telefon: {phone}"))
        children.append(self._paragraph(f"Branche: {branche}"))
        children.append(self._divider())

        # Links section
        children.append(self._heading("Links & Zugänge", level=2))
        links = [
            ("Close CRM", close_url),
            ("Google Drive", drive_url),
            ("Slack Channel", f"#{slack_channel}" if slack_channel else None),
            ("ClickUp", clickup_url),
            ("Miro Board", miro_url),
            ("Meta Ad Account", f"act_{meta_ad_account}" if meta_ad_account else None),
        ]
        for label, value in links:
            if value:
                children.append(self._paragraph(f"{label}: {value}"))
            else:
                children.append(self._paragraph(f"{label}: ⚪ Noch nicht eingerichtet"))
        children.append(self._divider())

        # Kickoff summary
        children.append(self._heading("Kickoff-Zusammenfassung", level=2))
        if kickoff_summary:
            children.append(self._paragraph(kickoff_summary))
        else:
            children.append(self._paragraph("Wird nach dem Kickoff-Call automatisch befüllt."))
        children.append(self._divider())

        # Documents section
        children.append(self._heading("Dokumente", level=2))
        children.append(self._paragraph("Werden automatisch verlinkt sobald sie erstellt sind."))
        children.append(self._divider())

        # Notes section
        children.append(self._heading("Notizen", level=2))
        children.append(self._paragraph("Hier können manuelle Notizen ergänzt werden."))

        # Create the page
        page_data = {
            "parent": {"page_id": parent_page_id},
            "properties": {
                "title": {
                    "title": [{"text": {"content": f"{company} — Client Wiki"}}]
                }
            },
            "icon": {"emoji": "📋"},
            "children": children[:100],  # Notion API limit: 100 blocks per request
        }

        try:
            result = self._request("POST", "https://api.notion.com/v1/pages", page_data)
            page_id = result["id"]
            page_url = result.get("url", f"https://notion.so/{page_id.replace('-', '')}")
            logger.info(f"Notion wiki created for {company}: {page_url}")
            return {"page_id": page_id, "url": page_url, "reused": False}
        except Exception as e:
            logger.error(f"Failed to create Notion wiki for {company}: {e}")
            raise

    def update_client_wiki(
        self,
        page_id: str,
        section: str,
        content: str,
    ):
        """Append content to a specific section of the wiki."""
        try:
            children = [self._paragraph(content)]
            self._request("PATCH", f"https://api.notion.com/v1/blocks/{page_id}/children", {"children": children})
            logger.info(f"Notion wiki {page_id} updated: {section}")
        except Exception as e:
            logger.warning(f"Failed to update Notion wiki: {e}")

    def add_document_link(self, page_id: str, doc_name: str, doc_url: str):
        """Add a document link to the wiki."""
        try:
            children = [self._paragraph(f"📄 {doc_name}: {doc_url}")]
            self._request("PATCH", f"https://api.notion.com/v1/blocks/{page_id}/children", {"children": children})
        except Exception as e:
            logger.warning(f"Failed to add doc link to Notion: {e}")

    # --- Block builders ---

    @staticmethod
    def _heading(text: str, level: int = 2) -> dict:
        return {
            "object": "block",
            f"type": f"heading_{level}",
            f"heading_{level}": {
                "rich_text": [{"type": "text", "text": {"content": text}}]
            },
        }

    @staticmethod
    def _paragraph(text: str) -> dict:
        return {
            "object": "block",
            "type": "paragraph",
            "paragraph": {
                "rich_text": [{"type": "text", "text": {"content": text}}]
            },
        }

    @staticmethod
    def _divider() -> dict:
        return {"object": "block", "type": "divider", "divider": {}}
