"""Google Drive API wrapper."""
from __future__ import annotations
import logging
from typing import Optional, Any

from fastapi import HTTPException
from ..auth.google_oauth import flowstack_oauth
from ._http import get_http_client

log = logging.getLogger("shared.drive")

API_BASE = "https://www.googleapis.com/drive/v3"
UPLOAD_BASE = "https://www.googleapis.com/upload/drive/v3"


async def request(
    method: str,
    url: str,
    data: Optional[dict[str, Any]] = None,
    params: Optional[dict[str, Any]] = None,
) -> dict[str, Any]:
    http = get_http_client()
    headers = flowstack_oauth.auth_header() | {"Content-Type": "application/json"}
    resp = await http.request(method, url, json=data, headers=headers, params=params)
    if resp.status_code == 401:
        await flowstack_oauth.refresh(http)
        headers = flowstack_oauth.auth_header() | {"Content-Type": "application/json"}
        resp = await http.request(method, url, json=data, headers=headers, params=params)
    if resp.status_code >= 400:
        log.error(f"Drive API error: {resp.status_code} {resp.text}")
        raise HTTPException(status_code=resp.status_code, detail=resp.text)
    return resp.json() if resp.text else {}


async def create_folder(name: str, parent_id: Optional[str] = None) -> dict[str, Any]:
    body: dict[str, Any] = {"name": name, "mimeType": "application/vnd.google-apps.folder"}
    if parent_id:
        body["parents"] = [parent_id]
    return await request(
        "POST", f"{API_BASE}/files", body,
        params={"supportsAllDrives": "true"},
    )


async def copy_file(file_id: str, name: str, parent_id: Optional[str] = None) -> dict[str, Any]:
    body: dict[str, Any] = {"name": name}
    if parent_id:
        body["parents"] = [parent_id]
    return await request(
        "POST", f"{API_BASE}/files/{file_id}/copy", body,
        params={"supportsAllDrives": "true"},
    )


async def delete_file(file_id: str) -> None:
    await request(
        "DELETE", f"{API_BASE}/files/{file_id}",
        params={"supportsAllDrives": "true"},
    )


async def list_files(query: str, fields: str = "files(id,name,mimeType)", page_size: int = 100) -> list[dict[str, Any]]:
    result = await request(
        "GET", f"{API_BASE}/files",
        params={
            "q": query,
            "fields": f"{fields},nextPageToken",
            "pageSize": page_size,
            "supportsAllDrives": "true",
            "includeItemsFromAllDrives": "true",
        },
    )
    return result.get("files", [])
