"""
Flowstack Demo Backend — V1 - Novacode Recruiting.

═══════════════════════════════════════════════════════════════════════════════
AUTOMATION-VERSIONEN (Format: V# - Name):
  • V1 - Novacode Recruiting   → diese Datei (server.py). AKTIV für Demo.
                                  Demo-Automation für den Sales-Pitch.
                                  Endpoint: /api/execute-node, node-IDs ohne Prefix.
  • V2 - Recruiting Engine     → automations/recruiting/ (Production-Ready).
                                  Eigenständige Implementation, keine Demo-Daten.
                                  Endpoint: /api/recruiting/execute-node.
                                  Aktuell Strangler-Bridge zu V1 — wird später unabhängig.
  • V3 - Recruiting Modular    → v3/ (alter Prototyp, NICHT aktiv).
                                  Phase-orientierte Architektur mit Resilience-Layer,
                                  3 Indent-Bugs, halb-fertig.
═══════════════════════════════════════════════════════════════════════════════

Migrationsziel: V1 schrittweise durch V2 ersetzen (Strangler-Pattern).
Das alte V2 (Leadflow Marketing) wurde am 2026-04-30 gelöscht. Der V2-Begriff
bezieht sich jetzt auf die neue Recruiting Engine.

Gestartet mit: doppler run --project flowstack-claudio --config dev -- python server.py
Alle Credentials kommen aus Doppler Environment Variables.
"""
from __future__ import annotations

import os
import json
import logging
import random
import urllib.parse
from datetime import datetime, timedelta
from logging.handlers import TimedRotatingFileHandler
from typing import Any, Optional

import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from terminal_ws import router as terminal_router
from claude_ws import router as claude_router
from whisper_api import router as whisper_router
from prompt_optimizer import router as optimizer_router

# ── Logging: Stdout (wie bisher) PLUS Datei-Rotation pro Tag ──────────────────
_LOG_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "logs")
os.makedirs(_LOG_DIR, exist_ok=True)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
log = logging.getLogger("demo-backend")

_file_handler = TimedRotatingFileHandler(
    filename=os.path.join(_LOG_DIR, "server.log"),
    when="midnight",
    backupCount=14,
    encoding="utf-8",
)
_file_handler.setFormatter(logging.Formatter("%(asctime)s [%(levelname)s] %(name)s: %(message)s"))
log.addHandler(_file_handler)
# Auch das Root-Logger-Output (von uvicorn etc.) in dieselbe Datei
logging.getLogger().addHandler(_file_handler)
log.info(f"File-Logging aktiv: {os.path.join(_LOG_DIR, 'server.log')} (rotiert täglich, 14 Tage Retention)")

app = FastAPI(title="Flowstack Demo Backend", version="1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:4173", "http://localhost:5180", "http://localhost:4002"],
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(terminal_router)
app.include_router(claude_router)
app.include_router(whisper_router)
app.include_router(optimizer_router)

# Elite Architecture: per-domain automation routers (parallel to V1 endpoints)
from automations.recruiting.api import router as recruiting_router
app.include_router(recruiting_router)

# ── Credentials aus Environment (Doppler) ─────────────────────────────────────

CLOSE_API_KEY = os.environ.get("CLOSE_API", os.environ.get("CLOSE_API_KEY", os.environ.get("CLOSE_API_KEY_V2", "")))
CLICKUP_TOKEN = os.environ.get("CLICKUP_API_TOKEN")
SLACK_WEBHOOK = os.environ.get("SLACK_CLAUDIO_WEBHOOK", os.environ.get("SLACK_CLAUDIO_WEBHOOK_URL", os.environ.get("SLACK_WEBHOOK", os.environ.get("SLACK_WEBHOOK_URL"))))
SLACK_BOT_TOKEN = os.environ.get("SLACK_BOT_TOKEN", os.environ.get("SLACK_API_TOKEN"))
META_ACCESS_TOKEN = os.environ.get("META_ACCESS_TOKEN")
META_AD_ACCOUNT = os.environ.get("META_AD_ACCOUNT_ID")
META_PIXEL_ID = os.environ.get("META_PIXEL_ID", "1496553014661154")  # Leadflow-Marketing Pixel 1
META_PAGE_ID = os.environ.get("META_PAGE_ID")

# Close V2 (separate Org "Leadflow Marketing")
CLOSE_API_KEY_V2 = os.environ.get("CLOSE_API_KEY_V2", "")

# OpenRouter (AI-Generierung für V2 - NICHT für V3 nutzen, gehört Anak)
OPENROUTER_API_KEY = os.environ.get("OPENROUTER_API_KEY", os.environ.get("OPENAI_API_KEY", ""))

# Gemini (AI-Generierung für V3 - kostenlos)
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")

# Google OAuth Token (JSON string) - Flowstack Account
_google_raw = os.environ.get("FLOWSTACK_GOOGLE_OAUTH_TOKEN", os.environ.get("GOOGLE_OAUTH_TOKEN", "{}"))
try:
    _google_creds = json.loads(_google_raw)
except json.JSONDecodeError:
    _google_creds = {}

GOOGLE_ACCESS_TOKEN = _google_creds.get("token", "")
GOOGLE_REFRESH_TOKEN = _google_creds.get("refresh_token", "")
GOOGLE_CLIENT_ID = _google_creds.get("client_id", "")
GOOGLE_CLIENT_SECRET = _google_creds.get("client_secret", "")

# Google OAuth Token - Leadflow Marketing Account
_leadflow_raw = os.environ.get("LEADFLOW_MARKETING_GOOGLE_OAUTH_TOKEN", "{}")
try:
    _leadflow_creds = json.loads(_leadflow_raw)
except json.JSONDecodeError:
    _leadflow_creds = {}

LEADFLOW_ACCESS_TOKEN = _leadflow_creds.get("token", "")
LEADFLOW_REFRESH_TOKEN = _leadflow_creds.get("refresh_token", "")
LEADFLOW_CLIENT_ID = _leadflow_creds.get("client_id", "")
LEADFLOW_CLIENT_SECRET = _leadflow_creds.get("client_secret", "")

# ClickUp Config
CLICKUP_SPACE_ID = "90189542355"  # Client Projects
CLICKUP_TEAM_ID = "90182362705"   # Flowstack-systems Workspace

# Close Pipeline (Test Account / Trial — Fulfillment)
CLOSE_PIPELINE_ID = "pipe_29QVKx39dnXZrEdmC3Ea6v"

# Close Custom Field IDs (Test Account / Trial)
CLOSE_FIELDS = {
    "service_type": "cf_bihJnLLxKxpvjYAVZ9AqdWnzNH5S7O7rC1WFhgrs6xO",
    "account_manager": "cf_oNqqlOPL0AAZfowUSrkx5nFMbyKTVJxUxtAetXJtVAY",
    "onboarding_date": "cf_rCeI7tH70274qaBzeaCmtpSdqX6ofARBnolyWd08sA6",
    "automation_status": "cf_Lufb065GVOQWlWwIloY3sdO9sVc8HCAVLdIjnYkcXwZ",
}

# Close Stage IDs (will be populated on startup)
CLOSE_STAGES: dict[str, str] = {}

# ClickUp Member IDs
CLICKUP_CLAUDIO = 306633165  # Marketer
CLICKUP_ANAK = 107605639     # Developer

# Slack Member IDs (Flowstack Systems Workspace)
SLACK_TEAM_ID = "T0AAEHFN8GH"  # Flowstack Systems Workspace
SLACK_CLAUDIO = "U0AA1KHD0G2"
SLACK_ANAK = "U0A9L6KUT5M"
SLACK_TEAM_MEMBERS = [SLACK_CLAUDIO, SLACK_ANAK]  # Werden automatisch in neue Client-Channels eingeladen

# Airtable (V2 Baustein-System)
AIRTABLE_API_KEY = os.environ.get("AIRTABLE_API", os.environ.get("AIRTABLE_API_KEY", ""))
AIRTABLE_BASE_ID = os.environ.get("AIRTABLE_BASE_ID", "")

# Miro
MIRO_ACCESS_TOKEN = os.environ.get("MIRO_ACCESS_TOKEN", "")


# Master-Template-Docs (jedes mit Tabs) - werden in is07 pro Kunde dupliziert
MASTER_DOCS = {
    "Doc 1 Strategie": "https://docs.google.com/document/d/1kxjSIWDIN-ssN_i466a4dPX4TEluijaPm9J2ywLmB-M/edit",
    "Doc 2 Messaging": "https://docs.google.com/document/d/1pprK5yG15Vjbx7AmE7b-FMGZXxhHrXMjryB_cKbpGmo/edit",
    "Doc 3 Creative Briefing": "https://docs.google.com/document/d/1l6zo_I-Sb_PxbSdzbpoTeIGesuuHXvu7CiRcFOI9Yuw/edit",
    "Doc 4 Ads-Copy": "https://docs.google.com/document/d/1py5_IHRsst707gKzBnnEYjRkQO4SCixeZFAR8DUnPlo/edit",
    "Doc 5 Kickoff": "https://docs.google.com/document/d/1lKO8VjuYp47uOpWVl1Rh6dU_57Vx1DzRAwrcgJZonpo/edit",
    "Doc 6 Webseiten-Texte": "https://docs.google.com/document/d/1IMt8W5zKZrrJW6dOj6OfuZn5xA_iQjrwnAGj28h3c4M/edit",
    "Doc 7 Videoskript": "https://docs.google.com/document/d/171Eg7V8jKGOYrqdYOLUM6DvfDodet_mxPrUB5DmMqEs/edit",
}
# Client-seitige Anzeigenamen: "<Typ> - <Firma>" statt "Doc 1/2/..."
DOC_DISPLAY_NAME = {
    "Doc 1 Strategie": "Strategie",
    "Doc 2 Messaging": "Messaging-Matrix",
    "Doc 3 Creative Briefing": "Creative-Briefing",
    "Doc 4 Ads-Copy": "Ads-Copy",
    "Doc 5 Kickoff": "Kickoff-Transkript",
    "Doc 6 Webseiten-Texte": "Webseiten-Texte",
    "Doc 7 Videoskript": "Videoskript",
}
# Gruppen-Aliase für Handler (konsumieren kundenspezifische Kopien aus context, falls vorhanden)
STRATEGY_DOCS = {k: MASTER_DOCS[k] for k in ("Doc 1 Strategie", "Doc 2 Messaging", "Doc 3 Creative Briefing")}
COPY_DOCS = {"Doc 4 Ads-Copy": MASTER_DOCS["Doc 4 Ads-Copy"]}
TRANSCRIPT_DOC = MASTER_DOCS["Doc 5 Kickoff"]


def _client_docs(context: dict[str, Any]) -> dict[str, str]:
    """Gibt die kundenspezifischen Doc-Kopien zurueck, sonst Master-Docs als Fallback."""
    return context.get("client_docs") or MASTER_DOCS


def _resolve_docs(context: dict[str, Any], keys: list[str]) -> dict[str, str]:
    """Liefert Teil-Dict der client_docs (oder Master-Fallback) für angegebene Keys."""
    docs = _client_docs(context)
    return {k: docs[k] for k in keys if k in docs}
FUNNEL_LINKS = {
    "Landingpage": "https://www.flowstack-agentur.de/demo",
    "Bewerbungsseite": "https://www.flowstack-agentur.de/demo-bewerbung",
    "Dankeseite": "https://www.flowstack-agentur.de/demo-danke",
    "Impressum": "https://www.flowstack-agentur.de/demo-impressum",
    "Datenschutz": "https://www.flowstack-agentur.de/demo-datenschutz",
}
TRACKING_SHEET = "https://docs.google.com/spreadsheets/d/1EmgdSqPPpouA20wY3OhMu1PGCA-Y_aCeztDHUF2zXeY/edit"
TRACKING_DASHBOARD = "https://www.flowstack-agentur.de/demo-recruiting"

# ── Helpers ───────────────────────────────────────────────────────────────────

_http = httpx.AsyncClient(timeout=60)


async def _refresh_google_token() -> str:
    """Refresh Google OAuth token if expired."""
    global GOOGLE_ACCESS_TOKEN
    if not GOOGLE_REFRESH_TOKEN:
        return GOOGLE_ACCESS_TOKEN
    resp = await _http.post(
        "https://oauth2.googleapis.com/token",
        data={
            "grant_type": "refresh_token",
            "refresh_token": GOOGLE_REFRESH_TOKEN,
            "client_id": GOOGLE_CLIENT_ID,
            "client_secret": GOOGLE_CLIENT_SECRET,
        },
    )
    if resp.status_code == 200:
        GOOGLE_ACCESS_TOKEN = resp.json()["access_token"]
    return GOOGLE_ACCESS_TOKEN


async def _refresh_leadflow_token() -> str:
    """Refresh Leadflow Marketing Google OAuth token."""
    global LEADFLOW_ACCESS_TOKEN
    if not LEADFLOW_REFRESH_TOKEN:
        return LEADFLOW_ACCESS_TOKEN
    resp = await _http.post(
        "https://oauth2.googleapis.com/token",
        data={
            "grant_type": "refresh_token",
            "refresh_token": LEADFLOW_REFRESH_TOKEN,
            "client_id": LEADFLOW_CLIENT_ID,
            "client_secret": LEADFLOW_CLIENT_SECRET,
        },
    )
    if resp.status_code == 200:
        LEADFLOW_ACCESS_TOKEN = resp.json()["access_token"]
    return LEADFLOW_ACCESS_TOKEN


async def close_api(method: str, path: str, data: Optional[dict] = None) -> dict:
    """Close CRM API call."""
    resp = await _http.request(
        method,
        f"https://api.close.com/api/v1{path}",
        json=data,
        auth=(CLOSE_API_KEY, ""),
    )
    if resp.status_code >= 400:
        log.error(f"Close API error: {resp.status_code} {resp.text}")
        raise HTTPException(status_code=resp.status_code, detail=resp.text)
    return resp.json()


async def clickup_api(method: str, path: str, data: Optional[dict] = None) -> dict:
    """ClickUp API call."""
    resp = await _http.request(
        method,
        f"https://api.clickup.com/api/v2{path}",
        json=data,
        headers={"Authorization": CLICKUP_TOKEN},
    )
    if resp.status_code >= 400:
        log.error(f"ClickUp API error: {resp.status_code} {resp.text}")
        raise HTTPException(status_code=resp.status_code, detail=resp.text)
    return resp.json()


async def miro_api(method: str, path: str, data: Optional[dict] = None) -> dict:
    """Miro REST API v2 call."""
    if not MIRO_ACCESS_TOKEN:
        raise HTTPException(503, "Miro API nicht konfiguriert (kein Token)")
    resp = await _http.request(
        method,
        f"https://api.miro.com/v2{path}",
        json=data,
        headers={"Authorization": f"Bearer {MIRO_ACCESS_TOKEN}"},
    )
    if resp.status_code >= 400:
        log.error(f"Miro API error: {resp.status_code} {resp.text}")
        raise HTTPException(status_code=resp.status_code, detail=resp.text)
    if resp.status_code == 204 or not resp.text.strip():
        return {}
    return resp.json()


async def google_api(method: str, url: str, data: Optional[dict] = None) -> dict:
    """Google API call with auto-refresh."""
    token = await _refresh_google_token()
    resp = await _http.request(
        method,
        url,
        json=data,
        headers={"Authorization": f"Bearer {token}"},
    )
    if resp.status_code == 401:
        token = await _refresh_google_token()
        resp = await _http.request(
            method, url, json=data,
            headers={"Authorization": f"Bearer {token}"},
        )
    if resp.status_code >= 400:
        log.error(f"Google API error: {resp.status_code} {resp.text}")
        raise HTTPException(status_code=resp.status_code, detail=resp.text)
    if resp.status_code == 204 or not resp.text.strip():
        return {}
    return resp.json()


# ── Projekt-Übersicht Spreadsheet ─────────────────────────────────────────────

async def _create_project_overview_sheet(company: str) -> dict:
    """Erstellt ein Google Spreadsheet als zentrale Projekt-Übersicht.
    Gibt {"spreadsheet_id": ..., "url": ...} zurück.
    """
    sheet_title = f"{company} - Projekt-Übersicht"

    # Dedupe-Check: Existiert bereits ein Sheet mit diesem Titel?
    try:
        safe_title = sheet_title.replace("'", "\\'")
        q = f"name = '{safe_title}' and mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false"
        existing = await google_api(
            "GET",
            f"https://www.googleapis.com/drive/v3/files?q={urllib.parse.quote(q)}&fields=files(id,name)&pageSize=1",
        )
        existing_files = existing.get("files", []) if isinstance(existing, dict) else []
        if existing_files:
            dup_id = existing_files[0]["id"]
            url = f"https://docs.google.com/spreadsheets/d/{dup_id}/edit"
            log.info(f"Projekt-Übersicht '{sheet_title}' wiederverwendet (Dedupe): {dup_id}")
            return {"spreadsheet_id": dup_id, "url": url}
    except Exception as e:
        log.warning(f"Overview-Sheet Dedupe-Check fehlgeschlagen (fahre mit Create fort): {e}")

    body = {
        "properties": {"title": sheet_title},
        "sheets": [{
            "properties": {
                "title": "Übersicht",
                "gridProperties": {"frozenRowCount": 1},
            },
        }],
    }
    resp = await google_api("POST", "https://sheets.googleapis.com/v4/spreadsheets", body)
    sid = resp["spreadsheetId"]
    sheet_id = resp["sheets"][0]["properties"]["sheetId"]
    # Header-Zeile schreiben
    await google_api(
        "PUT",
        f"https://sheets.googleapis.com/v4/spreadsheets/{sid}/values/A1:E1?valueInputOption=RAW",
        {"values": [["Schritt", "Status", "Beschreibung", "Link", "Zeitstempel"]]},
    )
    # Formatierung: Header fett + Spaltenbreiten
    await google_api("POST", f"https://sheets.googleapis.com/v4/spreadsheets/{sid}:batchUpdate", {
        "requests": [
            {"repeatCell": {
                "range": {"sheetId": sheet_id, "startRowIndex": 0, "endRowIndex": 1},
                "cell": {"userEnteredFormat": {"textFormat": {"bold": True}}},
                "fields": "userEnteredFormat.textFormat.bold",
            }},
            *[{"updateDimensionProperties": {
                "range": {"sheetId": sheet_id, "dimension": "COLUMNS",
                           "startIndex": i, "endIndex": i + 1},
                "properties": {"pixelSize": w},
                "fields": "pixelSize",
            }} for i, w in enumerate([250, 120, 300, 400, 160])],
        ],
    })
    url = f"https://docs.google.com/spreadsheets/d/{sid}/edit"
    log.info(f"Projekt-Übersicht erstellt: {url}")
    return {"spreadsheet_id": sid, "url": url}


async def _append_sheet_row(spreadsheet_id: str, row: list) -> None:
    """Hängt eine Zeile an die Projekt-Übersicht an."""
    if not spreadsheet_id:
        log.warning("_append_sheet_row: Keine spreadsheet_id - übersprungen")
        return
    await google_api(
        "POST",
        f"https://sheets.googleapis.com/v4/spreadsheets/{spreadsheet_id}/values/A:E:append"
        f"?valueInputOption=RAW&insertDataOption=INSERT_ROWS",
        {"values": [row]},
    )


async def _append_sheet_rows(spreadsheet_id: str, rows: list[list]) -> None:
    """Hängt mehrere Zeilen auf einmal an die Projekt-Übersicht an."""
    if not spreadsheet_id or not rows:
        return
    await google_api(
        "POST",
        f"https://sheets.googleapis.com/v4/spreadsheets/{spreadsheet_id}/values/A:E:append"
        f"?valueInputOption=RAW&insertDataOption=INSERT_ROWS",
        {"values": rows},
    )


def _slack_link(url: str, label: str) -> str:
    """Slack mrkdwn Link-Alias: <url|Label>."""
    return f"<{url}|{label}>"


def _slack_blocks_message(
    header: str,
    sections: list[dict[str, Any]],
    buttons: list[tuple] | None = None,
    footer: str = "",
) -> list[dict]:
    """Block Kit Message - V5 Design (Color Bar, Fields mit Spacing, ein Divider).

    sections: Flexibel - jede Section kann enthalten:
      - "text": str → einfacher mrkdwn Text
      - "fields": [("Label", "Value"), ...] → 2-Spalten mit *Label:*\\nValue (Newline!)
      - "title": str → fetter Titel vor Items
      - "items": [...] → Link-Tuples → rich_text Bullet-Liste, Strings → Bullet-Liste
    buttons: [("Label", "url"), ("Label", "url", "primary"), ...]
    footer: Context-Zeile ganz unten (klein, grau)
    """
    blocks: list[dict] = [
        {"type": "header", "text": {"type": "plain_text", "text": header, "emoji": True}},
    ]
    btn_idx = 0
    for sec in sections:
        # Einfacher Text-Block
        text = sec.get("text")
        if text and not sec.get("items") and not sec.get("fields"):
            blocks.append({"type": "section", "text": {"type": "mrkdwn", "text": text}})
            continue
        # Titel
        title = sec.get("title", "")
        if title:
            blocks.append({"type": "section", "text": {"type": "mrkdwn", "text": f"*{title}*"}})
        # Fields (2-Spalten mit Newline-Spacing)
        field_items = sec.get("fields")
        if field_items:
            field_blocks: list[dict] = []
            for label, value in field_items:
                field_blocks.append({"type": "mrkdwn", "text": f"*{label}:*\n{value}"})
            for i in range(0, len(field_blocks), 10):
                blocks.append({"type": "section", "fields": field_blocks[i:i+10]})
            continue
        # Items
        items = sec.get("items", [])
        if not items:
            continue
        # Link-Tuples → Rich Text Bullet-Liste (klickbar)
        all_links = all(isinstance(i, tuple) and len(i) == 2 and str(i[1]).startswith("http") for i in items)
        if all_links:
            link_emoji = sec.get("emoji", "")
            prefix = f"{link_emoji}  " if link_emoji else ""
            link_fields = []
            for label, url in items:
                link_fields.append({"type": "mrkdwn", "text": f"{prefix}<{url}|{label}>"})
            for i in range(0, len(link_fields), 10):
                blocks.append({"type": "section", "fields": link_fields[i:i+10]})
        # Plain-Text → Bullet-Liste
        else:
            bullet_text = "\n".join(f"• {i}" for i in items)
            blocks.append({"type": "section", "text": {"type": "mrkdwn", "text": bullet_text}})
    # Divider + Buttons (ein Divider, nur vor Buttons)
    if buttons:
        blocks.append({"type": "divider"})
        elements = []
        for btn in buttons:
            label, url = btn[0], btn[1]
            style = btn[2] if len(btn) > 2 else None
            el: dict[str, Any] = {
                "type": "button",
                "text": {"type": "plain_text", "text": label, "emoji": True},
                "url": url,
                "action_id": f"btn_{btn_idx}",
            }
            if style:
                el["style"] = style
            elements.append(el)
            btn_idx += 1
        blocks.append({"type": "actions", "elements": elements[:5]})
    # Context-Footer (klein, grau)
    if footer:
        blocks.append({"type": "context", "elements": [{"type": "mrkdwn", "text": footer}]})
    return blocks


SLACK_OPS_CHANNEL = "C0AAEHG30NM"  # #alle-in-flowstack-system

# Farben für Color-Bar (links am Message-Rand)
SLACK_COLOR_SUCCESS = "#36a64f"   # Grün - abgeschlossen
SLACK_COLOR_INFO = "#1264a3"      # Blau - informational
SLACK_COLOR_WARNING = "#ff9900"   # Gelb - warte auf Aktion

async def slack_message(text: str, blocks: Optional[list] = None, color: Optional[str] = None) -> bool:
    """Slack Nachricht im Ops-Channel senden (via Bot API, damit löschbar).
    color: Hex-Farbe für Color-Bar links (via attachments wrapper).
    """
    if not SLACK_BOT_TOKEN:
        if not SLACK_WEBHOOK:
            log.warning("Kein Slack Token/Webhook konfiguriert")
            return False
        payload: dict[str, Any] = {"text": text}
        if color and blocks:
            payload["attachments"] = [{"color": color, "blocks": blocks}]
        elif blocks:
            payload["blocks"] = blocks
        resp = await _http.post(SLACK_WEBHOOK, json=payload)
        return resp.status_code == 200
    msg_payload: dict[str, Any] = {"channel": SLACK_OPS_CHANNEL, "text": text}
    if color and blocks:
        msg_payload["attachments"] = [{"color": color, "blocks": blocks}]
    elif blocks:
        msg_payload["blocks"] = blocks
    result = await slack_bot_api("chat.postMessage", msg_payload)
    return result.get("ok", False)


async def slack_bot_api(method: str, payload: dict) -> dict:
    """Slack Web API call via Bot Token."""
    if not SLACK_BOT_TOKEN:
        log.warning("Kein SLACK_BOT_TOKEN konfiguriert")
        return {"ok": False, "error": "no_token"}
    resp = await _http.post(
        f"https://slack.com/api/{method}",
        headers={"Authorization": f"Bearer {SLACK_BOT_TOKEN}"},
        json=payload,
    )
    data = resp.json()
    if not data.get("ok"):
        log.error(f"Slack API {method} fehlgeschlagen: {data.get('error')}")
    return data


def _meta_acct() -> str:
    """Ad Account ID mit act_ Prefix (für API calls)."""
    if not META_AD_ACCOUNT:
        return ""
    return META_AD_ACCOUNT if META_AD_ACCOUNT.startswith("act_") else f"act_{META_AD_ACCOUNT}"

def _meta_acct_numeric() -> str:
    """Ad Account ID ohne act_ Prefix (für Ads Manager URLs)."""
    if not META_AD_ACCOUNT:
        return ""
    return META_AD_ACCOUNT.removeprefix("act_")


async def meta_api(method: str, endpoint: str, data: dict | None = None) -> dict:
    """Meta Marketing API call (Graph API v21.0)."""
    if not META_ACCESS_TOKEN:
        raise HTTPException(503, "Meta API nicht konfiguriert (kein Token)")
    url = f"https://graph.facebook.com/v21.0/{endpoint}"
    if method.upper() == "GET":
        params = {"access_token": META_ACCESS_TOKEN, **(data or {})}
        resp = await _http.get(url, params=params)
    elif method.upper() == "DELETE":
        resp = await _http.delete(url, params={"access_token": META_ACCESS_TOKEN})
    else:
        # POST: Form-encoded, komplexe Werte als JSON-Strings, Booleans als lowercase
        form: dict[str, Any] = {"access_token": META_ACCESS_TOKEN}
        for k, v in (data or {}).items():
            if isinstance(v, (dict, list)):
                form[k] = json.dumps(v)
            elif isinstance(v, bool):
                form[k] = "true" if v else "false"
            else:
                form[k] = v
        resp = await _http.post(url, data=form)
    if resp.status_code >= 400:
        log.error(f"Meta API {method} {endpoint}: {resp.status_code} {resp.text}")
        raise HTTPException(resp.status_code, resp.text)
    return resp.json()


# ── Meta: Bilder & Anzeigentexte ─────────────────────────────────────────────

AD_IMAGE_DIR = os.path.join(os.path.dirname(__file__), "ad-images")

# Anzeigentexte - 3 Varianten (Meta-formatiert: kein Markdown, Zeilenumbrueche via \n)
AD_COPY_INITIAL = [
    # Variante 1: Klassisch/Strukturiert
    "{company} sucht: Senior Engineer (m/w/d) - Ledger und Reconciler\n\nDu willst wieder echte Engineering-Probleme lösen.\nNicht nur Tickets schieben.\n\nDann lies weiter.\n\nWir bauen Ledger- und Reconciler-Systeme.\nHochskalierende Finanzdaten-Infrastruktur. Strikte Konsistenz, hohe Last, harte Audit-Anforderungen.\n\nDein Stack:\nTypeScript für Services. Rust für die kritischen Pfade. PostgreSQL. Kafka. AWS.\n\nDein Arbeitsmodell:\nVoll remote in der EU oder Office in Berlin. Du entscheidest.\nAsynchron-First. Kernzeit nur wenn nötig.\n\nDas bekommst du:\n- 105-180k Jahresgehalt, transparent\n- 32 Urlaubstage\n- 3.000 Euro Lernbudget pro Jahr\n- Hardware deiner Wahl\n- Eigene Architektur-Verantwortung\n- Flache Hierarchien, kein Approval-Theater\n\nDas bringst du mit:\n- Mindestens 5 Jahre Erfahrung in Backend-Engineering\n- Solides Verständnis verteilter Systeme und Daten-Konsistenz\n- Erfahrung mit Finanzdaten oder regulierten Domänen ist Plus, kein Muss\n- Du schreibst Tests bevor sie eingefordert werden\n\nUnser Bewerbungsprozess:\nVier Fragen plus Code-Link. Kein Anschreiben.\nTech-Gespräch mit einem Senior Engineer.\nAntwort innerhalb von 48 Stunden.\n\nWir sind kein Startup. Kein Konzern. Profitabel seit Tag 1.\n\nBewerbung dauert unter 2 Minuten.\n\n→ Jetzt in nur 2 Minuten bewerben - ohne Anschreiben und ohne Lebenslauf\n{destination_url}",
    # Variante 2: Schmerzpunkt/Emotional
    "Du bist Senior Engineer.\nDu hast was drauf.\n\nAber jetzt mal ehrlich:\n\nWann hast du das letzte Mal an einem System gearbeitet, das wirklich nontrivial war?\n\nWann hast du das letzte Mal eine Architekturentscheidung getroffen, ohne dass drei Manager ihren Senf dazugeben?\n\nWann hat dein Code zum letzten Mal mehr getan als ein hübscheres Dashboard zu rendern?\n\nWenn du jetzt überlegen musst, weißt du wovon ich rede.\n\nWir bauen Ledger- und Reconciler-Systeme bei {company}.\nStrikte Konsistenz. Hohe Last. Echte Engineering-Probleme.\n\nStack:\nTypeScript für Services. Rust für die kritischen Pfade. PostgreSQL, Kafka, AWS.\n\nWas du bekommst:\n- 105-180k transparent\n- Voll remote in der EU oder Berlin Office, deine Wahl\n- 32 Urlaubstage\n- 3.000 Euro Lernbudget pro Jahr\n- Eigene Architektur-Verantwortung\n- Flache Hierarchien, kein Approval-Theater\n\nBewerbungsprozess:\nVier Fragen, ein Code-Link.\nTech-Gespräch mit einem Senior Engineer.\nAntwort in 48 Stunden.\n\nKein Anschreiben.\nKein Coding-Marathon.\nKein Assessment-Center.\n\nBewerbung in 2 Minuten.\n\n→ Jetzt in nur 2 Minuten bewerben - ohne Anschreiben und ohne Lebenslauf\n{destination_url}",
    # Variante 3: Contrarian/Pattern Interrupt
    "Diese Anzeige ist nichts für dich.\n\nNicht wenn du okay bist mit Stand-ups die zu Stand-ups bleiben.\nNicht wenn dein Code in den letzten 6 Monaten dreimal die JIRA-Umstrukturierung überlebt hat.\nNicht wenn du dir vorstellen kannst, weiter Tickets aus einem Backlog zu schieben in dem 800 stehen.\n\nWenn du aber abends denkst: «Ich will wieder bauen.»\nDann lies weiter.\n\nWir bauen bei {company} Ledger- und Reconciler-Systeme.\nHochskalierende Finanzdaten-Infrastruktur. Strikte Konsistenz. Echte Engineering-Probleme.\n\nBei uns triffst du Architekturentscheidungen.\nDu shippst Code in Produktion, nicht ins Approval-Theater.\nDu arbeitest mit Engineers die wissen was sie tun.\n\nWas bei uns anders ist:\n\nWir sagen nicht «flache Hierarchien».\nWir sagen: keine.\n\nWir sagen nicht «Startup-Mentalität».\nWir sagen: profitabel seit Tag 1, kein VC, keine Hype-Pitches.\n\nWir sagen nicht «Wir sind wie eine Familie».\nWir sagen: Profis die abliefern. Asynchron. Voll remote oder Berlin.\n\nKonkret:\n- 105-180k transparent\n- Voll remote in der EU oder Berlin Office\n- 32 Urlaubstage\n- 3.000 Euro Lernbudget\n\nBewerbungsprozess:\nVier Fragen, ein Code-Link.\nTech-Gespräch mit einem Senior Engineer.\n\nKein Anschreiben.\nKein Whiteboard.\nEntscheidung in 14 Tagen.\n\nBewerbung in 2 Minuten.\n\n→ Jetzt in nur 2 Minuten bewerben - ohne Anschreiben und ohne Lebenslauf\n{destination_url}",
]
AD_COPY_RETARGETING = [
    # Variante 1: Direkt/Erinnerung
    "Du hast dir die Stelle bei {company} angeschaut.\nAber du hast dich noch nicht beworben.\n\nWas hält dich auf?\n\nHier ein paar Dinge die du wissen solltest:\n- 105-180k transparent, kein «wir reden im Gespräch drüber»\n- Voll remote in der EU oder Berlin Office, deine Wahl\n- 32 Urlaubstage und 3.000 Euro Lernbudget pro Jahr\n- Ledger- und Reconciler-Systeme, kein Legacy-Frickeln\n- Flache Hierarchien, keine Approval-Theater\n\nUnd das Beste: die Bewerbung dauert 60 Sekunden.\nVier Fragen plus Code-Link. Kein Anschreiben, kein CV-Upload.\n\nAntwort in 48 Stunden.\n\n→ Jetzt in nur 2 Minuten bewerben - ohne Anschreiben und ohne Lebenslauf\n{destination_url}",
    # Variante 2: Einwand-Killer
    "«Bin ich gut genug?»\n\nDas denken die meisten Senior Engineers.\nUnd genau die sind oft die, die wir suchen.\n\nBei {company} suchen wir keine Engineer mit 47 Zertifikaten.\nWir suchen Leute die:\n\n- Sauberen Code schreiben wollen, nicht nur schnellen\n- Probleme lösen statt Tickets abzuarbeiten\n- Architektur-Verantwortung übernehmen wollen\n- Tests schreiben bevor sie eingefordert werden\n\nDu warst schon auf unserer Bewerbungsseite.\nDas zeigt, dass du neugierig bist.\n\nGib deiner Neugier eine Chance.\n60 Sekunden. Kein Anschreiben.\n\n→ Jetzt in nur 2 Minuten bewerben - ohne Anschreiben und ohne Lebenslauf\n{destination_url}",
    # Variante 3: Social Proof/Knappheit
    "Du warst auf unserer Bewerbungsseite.\nAber du bist noch unentschlossen?\n\nHier ein Update.\n\nIn der letzten Woche haben wir 23 Bewerbungen erhalten.\n\nWas Bewerber am häufigsten sagen:\n«Endlich mal ein Prozess der nicht nervt.»\n«Ich wusste nach 5 Minuten dass ich passe.»\n\n{company} ist kein Konzern.\nHier bist du nicht Engineer #847.\nHier baust du an Systemen die Geld bewegen, mit Leuten die wissen wie das geht.\n\nDie Stelle ist noch offen.\n60 Sekunden reichen.\n\n→ Jetzt in nur 2 Minuten bewerben - ohne Anschreiben und ohne Lebenslauf\n{destination_url}",
]
AD_COPY_WARMUP = [
    # Variante 1: Werte/Kultur
    "Die meisten Tech-Firmen labern von flachen Hierarchien.\nBei {company} gibt es einfach keine.\n\nWir bauen Ledger- und Reconciler-Systeme.\nHochskalierende Finanzdaten-Infrastruktur. Echte Engineering-Probleme.\n\nEntscheidungen fallen in Minuten, nicht in Meetings.\nCode geht in Produktion, nicht ins Approval-Theater.\nEngineers shippen, Manager dokumentieren nicht.\n\nVoll remote in der EU oder Berlin Office.\nProfitabel seit Tag 1.\n\n→ Mehr erfahren",
    # Variante 2: Storytelling/Behind the Scenes
    "Freitag 14:30 Uhr bei {company}.\n\nTim hat sein Reconciler-Modul gerade live gebracht.\nLisa reviewt den letzten PR vom Sprint.\nMax ist seit 12 Uhr im Deep Work und niemand stört ihn.\n\nUm 15 Uhr: Weekly. 20 Minuten. Keine Status-Updates die niemand braucht.\nDanach: Wochenende.\n\nKein Crunch. Keine Überstunden.\nNur Code auf den du stolz sein kannst.\n\n{company} baut Ledger- und Reconciler-Systeme für regulierte Finanzdaten.\nVoll remote in der EU oder Berlin Office.\n\n→ Mehr erfahren",
    # Variante 3: Provokant/Aufmerksamkeit
    "73 % der Senior Engineers in Europa denken über einen Jobwechsel nach.\nAber nur 12 % bewerben sich.\n\nWarum? Weil jede Stellenanzeige gleich klingt.\n«Dynamisches Team», «spannende Projekte», «attraktives Gehalt».\n\nWir bei {company} sagen dir lieber, was wir nicht bieten:\n\nKein Großraumbüro.\nKeine fünf Interview-Runden.\nKeine Legacy-Systeme aus den 2000ern.\nKeinen Chef der ständig «kurz mal schauen» will.\n\nWas wir bieten?\nLedger- und Reconciler-Systeme. 105-180k transparent. Voll remote oder Berlin.\n\n→ Mehr erfahren",
]


async def upload_meta_images(drive_target_folder_id: Optional[str] = None) -> list[str]:
    """Bilder aus ad-images/ zu Meta hochladen, gibt Liste von Image-Hashes zurück.
    Falls drive_target_folder_id angegeben ist, werden dieselben Bilder zusätzlich in den
    angegebenen Drive-Ordner hochgeladen (z.B. 04_Creatives/Bilder des Kundenordners)."""
    if not os.path.isdir(AD_IMAGE_DIR):
        log.warning(f"Ad-Images Ordner nicht gefunden: {AD_IMAGE_DIR}")
        return []
    acct = _meta_acct()
    hashes: list[str] = []
    for fname in sorted(os.listdir(AD_IMAGE_DIR)):
        if not fname.lower().endswith((".jpg", ".jpeg", ".png")):
            continue
        fpath = os.path.join(AD_IMAGE_DIR, fname)
        with open(fpath, "rb") as f:
            resp = await _http.post(
                f"https://graph.facebook.com/v21.0/{acct}/adimages",
                data={"access_token": META_ACCESS_TOKEN},
                files={"filename": (fname, f, "image/jpeg")},
            )
        if resp.status_code == 200:
            images = resp.json().get("images", {})
            for _key, val in images.items():
                h = val.get("hash", "")
                if h:
                    hashes.append(h)
                    log.info(f"Meta Bild hochgeladen: {fname} → {h}")
        else:
            log.error(f"Meta Bild-Upload fehlgeschlagen ({fname}): {resp.status_code} {resp.text}")

        if drive_target_folder_id:
            try:
                await _drive_upload_file(fpath, fname, drive_target_folder_id)
            except Exception as e:
                log.warning(f"Drive-Upload für {fname} fehlgeschlagen (non-critical): {e}")
    return hashes


async def _drive_upload_file(fpath: str, fname: str, parent_id: str) -> Optional[str]:
    """Multipart-Upload einer Datei in einen Drive-Ordner. Gibt Datei-ID zurueck."""
    token = await _refresh_google_token()
    mime = "image/png" if fname.lower().endswith(".png") else "image/jpeg"
    metadata = {"name": fname, "parents": [parent_id]}
    with open(fpath, "rb") as f:
        file_bytes = f.read()
    boundary = "fs_mpart_boundary"
    body = (
        f"--{boundary}\r\n"
        "Content-Type: application/json; charset=UTF-8\r\n\r\n"
        f"{json.dumps(metadata)}\r\n"
        f"--{boundary}\r\n"
        f"Content-Type: {mime}\r\n\r\n"
    ).encode("utf-8") + file_bytes + f"\r\n--{boundary}--\r\n".encode("utf-8")
    resp = await _http.post(
        "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true",
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": f"multipart/related; boundary={boundary}",
        },
        content=body,
    )
    if resp.status_code >= 400:
        raise RuntimeError(f"Drive upload {fname} failed: {resp.status_code} {resp.text}")
    return resp.json().get("id")


_AD_CONCEPTS = ["PainPoint", "SocialProof", "Testimonial"]
_AD_ANGLES = ["Fachkraefte", "Zeitersparnis", "ROI"]

# Headlines & Descriptions pro Funnel-Stage (Meta limitiert Headline ~40 / Description ~30 Zeichen)
AD_HEADLINES = {
    "TOF": [
        "Senior Engineer (m/w/d) — Bewerbung in 2 Min",
        "Ledger-Engineering — Bewerbung in 2 Min",
        "Senior Engineer 105-180k — In 2 Min bewerben",
    ],
    "RT": [
        "Senior Engineer — In 2 Min bewerben",
        "Vier Fragen, fertig — Bewerbung in 2 Min",
        "Senior Engineer @ {company} — In 2 Min",
    ],
    "WARMUP": [
        "Senior Engineer (m/w/d) — Bewerbung in 2 Min",
        "Ledger-Engineering — In 2 Min bewerben",
        "Senior Engineer @ {company} — In 2 Min",
    ],
}
# Alias: ca09 ruft mit funnel_stage="WU" auf
AD_HEADLINES["WU"] = AD_HEADLINES["WARMUP"]

AD_DESCRIPTIONS = {
    "TOF": [
        "Berlin oder voll remote in der EU.",
        "Bewerbung in zwei Minuten. Antwort 48h.",
        "Vier Fragen plus Code-Link.",
    ],
    "RT": [
        "Vier Fragen plus Code-Link.",
        "Antwort innerhalb von 48 Stunden.",
        "Stelle ist noch offen.",
    ],
    "WARMUP": [
        "Mehr über das Team.",
        "Wie wir Ledger-Systeme bauen.",
        "Karriere bei {company}.",
    ],
}
AD_DESCRIPTIONS["WU"] = AD_DESCRIPTIONS["WARMUP"]


async def create_meta_ads(
    acct: str,
    adset_id: str,
    image_hashes: list[str],
    copy_texts: list[str],
    company: str,
    destination_url: str,
    cta_type: str = "APPLY_NOW",
    funnel_stage: str = "TOF",
) -> list[str]:
    """Ads erstellen: 1 Ad pro Bild mit DACH Naming Convention."""
    if not META_PAGE_ID:
        log.warning("Kein META_PAGE_ID - Ads-Erstellung übersprungen")
        return []
    ad_ids: list[str] = []
    month = datetime.now().strftime("%Y-%m")

    # Dedupe: Bestehende Ads in diesem Ad Set per Name-Map einsammeln
    existing_ads: dict[str, str] = {}
    try:
        ads_lookup = await meta_api("GET", f"{adset_id}/ads?fields=id,name,effective_status&limit=200")
        for a in (ads_lookup.get("data") or []):
            if a.get("name") and a.get("id") and a.get("effective_status") != "DELETED":
                existing_ads[a["name"]] = a["id"]
    except Exception as e:
        log.warning(f"Meta Ad Dedupe-Lookup fehlgeschlagen: {e}")

    headlines = AD_HEADLINES.get(funnel_stage, AD_HEADLINES["TOF"])
    descriptions = AD_DESCRIPTIONS.get(funnel_stage, AD_DESCRIPTIONS["TOF"])

    for i, img_hash in enumerate(image_hashes):
        concept = _AD_CONCEPTS[i % len(_AD_CONCEPTS)]
        angle = _AD_ANGLES[i % len(_AD_ANGLES)]
        variant = f"V{i+1}"
        variant_text = (
            copy_texts[i % len(copy_texts)].format(company=company, destination_url=destination_url)
            if copy_texts else f"Jetzt bewerben bei {company}: {destination_url}"
        )
        headline = headlines[i % len(headlines)].format(company=company)
        description = descriptions[i % len(descriptions)].format(company=company)
        # DACH Naming: Format | Konzept | Angle | Creator | Variante | Datum
        creative_name = f"Image | {concept} | {angle} | Inhouse | {variant} | {month}"
        ad_name = f"{funnel_stage} | {concept} | {angle} | {variant} | {month}"
        if ad_name in existing_ads:
            log.info(f"Meta Ad '{ad_name}' wiederverwendet (Dedupe): {existing_ads[ad_name]}")
            ad_ids.append(existing_ads[ad_name])
            continue
        creative = await meta_api("POST", f"{acct}/adcreatives", {
            "name": creative_name,
            "object_story_spec": {
                "page_id": META_PAGE_ID,
                "link_data": {
                    "message": variant_text,
                    "link": destination_url,
                    "name": headline,
                    "description": description,
                    "image_hash": img_hash,
                    "call_to_action": {
                        "type": cta_type,
                        "value": {"link": destination_url},
                    },
                },
            },
        })
        ad = await meta_api("POST", f"{acct}/ads", {
            "name": ad_name,
            "adset_id": adset_id,
            "creative": {"creative_id": creative["id"]},
            "status": "PAUSED",
        })
        ad_ids.append(ad["id"])
    log.info(f"Meta Ads erstellt für AdSet {adset_id}: {ad_ids}")
    return ad_ids


# ── Startup ───────────────────────────────────────────────────────────────────

@app.on_event("startup")
async def load_close_stages():
    """Close Pipeline Stages laden."""
    try:
        data = await close_api("GET", f"/pipeline/{CLOSE_PIPELINE_ID}/")
        for s in data.get("statuses", []):
            CLOSE_STAGES[s["label"]] = s["id"]
        log.info(f"Close Stages geladen: {list(CLOSE_STAGES.keys())}")
    except Exception as e:
        log.error(f"Close Stages laden fehlgeschlagen: {e}")


@app.on_event("startup")
async def validate_staged_docs():
    """Prüft beim Start ob alle vorbereiteten Demo-Docs noch existieren."""
    manifest_path = os.path.join(os.path.dirname(__file__), "staged-docs-manifest.json")
    if not os.path.exists(manifest_path):
        log.warning("staged-docs-manifest.json nicht gefunden - Demo-Docs nicht validiert")
        return

    try:
        with open(manifest_path) as f:
            manifest = json.load(f)
    except Exception as e:
        log.error(f"Manifest laden fehlgeschlagen: {e}")
        return

    token = ""
    if GOOGLE_REFRESH_TOKEN:
        try:
            import ssl, certifi, urllib.request, urllib.parse
            _ctx = ssl.create_default_context(cafile=certifi.where())
            data = urllib.parse.urlencode({
                "client_id": GOOGLE_CLIENT_ID, "client_secret": GOOGLE_CLIENT_SECRET,
                "refresh_token": GOOGLE_REFRESH_TOKEN, "grant_type": "refresh_token",
            }).encode()
            req = urllib.request.Request("https://oauth2.googleapis.com/token", data=data)
            resp = urllib.request.urlopen(req, timeout=10, context=_ctx)
            token = json.loads(resp.read()).get("access_token", "")
        except Exception as e:
            log.warning(f"Google Token Refresh für Doc-Validation fehlgeschlagen: {e}")
            return
    if not token:
        token = GOOGLE_ACCESS_TOKEN

    if not token:
        log.warning("Kein Google Token - Demo-Docs nicht validiert")
        return

    missing = []
    for doc in manifest.get("documents", []):
        doc_id = doc.get("id", "")
        try:
            import urllib.request
            req = urllib.request.Request(
                f"https://docs.googleapis.com/v1/documents/{doc_id}?fields=title",
                headers={"Authorization": f"Bearer {token}"},
            )
            urllib.request.urlopen(req, timeout=10)
        except Exception:
            missing.append(doc.get("name", doc_id))

    if missing:
        log.error(f"DEMO-DOCS FEHLEN ({len(missing)}/{manifest.get('total', '?')}): {', '.join(missing)}")
    else:
        log.info(f"Alle {manifest.get('total', 12)} Demo-Docs validiert - bereit für Demo")


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "close": bool(CLOSE_API_KEY),
        "close_v2": bool(CLOSE_API_KEY_V2),
        "openrouter": bool(OPENROUTER_API_KEY),
        "clickup": bool(CLICKUP_TOKEN),
        "slack": bool(SLACK_WEBHOOK),
        "google": bool(GOOGLE_REFRESH_TOKEN),
        "meta": bool(META_ACCESS_TOKEN),
        "stages": list(CLOSE_STAGES.keys()),
        "v2_stages": list(CLOSE_V2_STAGES.keys()),
    }


# ══════════════════════════════════════════════════════════════════════════════
# PHASE 2: Infrastructure Setup
# ══════════════════════════════════════════════════════════════════════════════

@app.post("/api/close/create-lead")
async def create_close_lead(body: Optional[dict] = None):
    """is02: Lead in Close erstellen + Pipeline + Custom Fields.
    Dedupe: Wenn Lead mit dieser Email + vorhandener Opportunity schon existiert,
    wird er wiederverwendet - verhindert Duplikate bei Demo-Rerun ohne sauberen Cleanup.
    """
    company = (body or {}).get("company", "Novacode GmbH")
    contact_name = (body or {}).get("contact", "Claudio Di Franco")
    contact_email = (body or {}).get("email", "clazahlungskonto@gmail.com")
    contact_title = (body or {}).get("contact_title", "Head of People & Talent")
    contact_phone = (body or {}).get("phone", "+49 30 5683 4421")
    customer_url = (body or {}).get("url", "https://novacode.de")
    service_type = (body or {}).get("service_type", "Recruiting")
    description = (body or {}).get("description", "Senior Engineer (m/w/d) — Ledger- und Reconciler-Systeme. Berlin oder voll remote in der EU. 105–180k.")
    address = (body or {}).get("address") or {
        "label": "office",
        "address_1": "Friedrichstraße 76",
        "city": "Berlin",
        "zipcode": "10117",
        "country": "DE",
    }
    deal_value = (body or {}).get("deal_value", 299700)  # in Cents (2997 EUR)
    deal_period = (body or {}).get("deal_period", "one_time")  # one_time, monthly, annual

    # Dedupe-Check: Lead mit dieser Email schon vorhanden?
    try:
        existing = await close_api("GET", f'/lead/?query=email:"{contact_email}"&_limit=1')
        existing_leads = existing.get("data", []) if isinstance(existing, dict) else []
    except Exception as e:
        log.warning(f"Close Dedupe-Check fehlgeschlagen (fahre mit Create fort): {e}")
        existing_leads = []

    if existing_leads:
        dup = existing_leads[0]
        dup_id = dup.get("id")
        dup_opps = dup.get("opportunities") or []
        if dup_id and dup_opps:
            log.info(f"Close Lead wiederverwendet (Dedupe): {dup_id}, Opp: {dup_opps[0].get('id')}")
            return {
                "lead_id": dup_id,
                "opportunity_id": dup_opps[0].get("id"),
                "url": f"https://app.close.com/lead/{dup_id}/",
                "deduplicated": True,
            }

    # Lead erstellen (ohne Custom Fields - diese liegen am Opportunity-Objekt)
    lead = await close_api("POST", "/lead/", {
        "name": company,
        "url": customer_url,
        "description": description,
        "addresses": [address],
        "contacts": [{
            "name": contact_name,
            "title": contact_title,
            "emails": [{"email": contact_email, "type": "office"}],
            "phones": [{"phone": contact_phone, "type": "office"}],
        }],
    })
    lead_id = lead["id"]

    # Opportunity in Fulfillment Pipeline (Custom Fields gehoeren hier hin)
    opp = await close_api("POST", "/opportunity/", {
        "lead_id": lead_id,
        "pipeline_id": CLOSE_PIPELINE_ID,
        "status_id": CLOSE_STAGES.get("Onboarding gestartet"),
        "note": f"Fulfillment Automation gestartet für {company} · {description}",
        "value": deal_value,
        "value_period": deal_period,
        f"custom.{CLOSE_FIELDS['service_type']}": service_type,
        f"custom.{CLOSE_FIELDS['account_manager']}": "Claudio Di Franco",
        f"custom.{CLOSE_FIELDS['automation_status']}": "Läuft",
    })

    # Note
    addr_str = f"{address.get('address_1','')}, {address.get('zipcode','')} {address.get('city','')}".strip(", ")
    await close_api("POST", "/activity/note/", {
        "lead_id": lead_id,
        "note": (
            "Onboarding-Formular eingegangen. Fulfillment Automation gestartet.\n"
            f"Firma: {company}\n"
            f"Ansprechpartner: {contact_name} ({contact_title})\n"
            f"E-Mail: {contact_email}\n"
            f"Telefon: {contact_phone}\n"
            f"Webseite: {customer_url}\n"
            f"Adresse: {addr_str}\n"
            f"Service: {service_type}\n"
            f"Briefing: {description}"
        ),
    })

    log.info(f"Close Lead erstellt: {lead_id}, Opportunity: {opp['id']}")
    return {"lead_id": lead_id, "opportunity_id": opp["id"], "url": f"https://app.close.com/lead/{lead_id}/"}


@app.post("/api/close/update-stage")
async def update_close_stage(body: dict):
    """Close Opportunity Stage updaten."""
    opp_id = body.get("opportunity_id")
    if not opp_id:
        raise HTTPException(400, "opportunity_id fehlt im Context")
    stage = body.get("stage", "")
    automation_status_raw = body.get("automation_status", stage)
    # Map to valid choices: Wartend, Läuft, Abgeschlossen, Fehler
    automation_status_choice = "Abgeschlossen" if stage == "Live" else "Läuft"

    status_id = CLOSE_STAGES.get(stage)
    if not status_id:
        raise HTTPException(400, f"Unbekannte Stage: {stage}")

    # Stage + Automation Status beide auf die Opportunity (Custom Fields sind Opp-Level)
    await close_api("PUT", f"/opportunity/{opp_id}/", {
        "status_id": status_id,
        f"custom.{CLOSE_FIELDS['automation_status']}": automation_status_choice,
    })

    # Note mit dem detaillierten Status
    await close_api("POST", "/activity/note/", {
        "lead_id": body.get("lead_id", ""),
        "note": f"Stage aktualisiert: {stage}. Status: {automation_status_raw}.",
    })

    lead_id = body.get("lead_id", "")
    result = {"ok": True, "stage": stage}
    if lead_id:
        # Opportunity-View im Lead öffnen (statt nur Lead-Detail) damit Phase-Update sofort sichtbar
        result["url"] = f"https://app.close.com/lead/{lead_id}/?opportunityId={opp_id}"
    return result


@app.post("/api/slack/message")
async def send_slack_message(body: dict):
    """Slack Nachricht senden."""
    text = body.get("text", "")
    ok = await slack_message(text)
    return {"ok": ok}


@app.post("/api/google/create-folders")
async def create_drive_folders(body: Optional[dict] = None):
    """is06: Google Drive Ordnerstruktur erstellen."""
    company = (body or {}).get("company", "Novacode GmbH")

    # Dedupe-Check: Existiert bereits ein Root-Ordner mit diesem Namen?
    try:
        safe_name = company.replace("'", "\\'")
        q = f"name = '{safe_name}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false"
        existing = await google_api(
            "GET",
            f"https://www.googleapis.com/drive/v3/files?q={urllib.parse.quote(q)}&fields=files(id,name)&pageSize=1",
        )
        existing_files = existing.get("files", []) if isinstance(existing, dict) else []
    except Exception as e:
        log.warning(f"Drive Dedupe-Check fehlgeschlagen (fahre mit Create fort): {e}")
        existing_files = []

    if existing_files:
        existing_root_id = existing_files[0]["id"]
        log.info(f"Drive Root-Ordner '{company}' wiederverwendet (Dedupe): {existing_root_id}")
        # Subfolders im existierenden Ordner auflisten, damit is07 und Downstream sie finden
        sub_map: dict[str, str] = {}
        try:
            sub_q = f"'{existing_root_id}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false"
            sub_resp = await google_api(
                "GET",
                f"https://www.googleapis.com/drive/v3/files?q={urllib.parse.quote(sub_q)}&fields=files(id,name)&pageSize=50",
            )
            for f in (sub_resp.get("files") or []):
                sub_map[f["name"]] = f["id"]
        except Exception as e:
            log.warning(f"Drive Subfolder-Lookup fehlgeschlagen: {e}")
        # Bilder-Ordner (Upload-Ziel) in 04_Creatives suchen
        upload_id = None
        creatives_id = sub_map.get("04_Creatives")
        if creatives_id:
            try:
                img_q = f"'{creatives_id}' in parents and name = 'Bilder' and trashed = false"
                img_resp = await google_api(
                    "GET",
                    f"https://www.googleapis.com/drive/v3/files?q={urllib.parse.quote(img_q)}&fields=files(id)&pageSize=1",
                )
                img_files = img_resp.get("files", []) if isinstance(img_resp, dict) else []
                if img_files:
                    upload_id = img_files[0]["id"]
            except Exception as e:
                log.warning(f"Drive Bilder-Lookup fehlgeschlagen: {e}")
        share_id = upload_id or creatives_id or existing_root_id
        return {
            "root_id": existing_root_id,
            "upload_folder_id": share_id,
            "upload_url": f"https://drive.google.com/drive/folders/{share_id}",
            "url": f"https://drive.google.com/drive/folders/{existing_root_id}",
            "subfolders": sub_map,
            "deduplicated": True,
        }

    # Root-Ordner
    root = await google_api("POST", "https://www.googleapis.com/drive/v3/files", {
        "name": f"{company}",
        "mimeType": "application/vnd.google-apps.folder",
    })
    root_id = root["id"]

    # Unterordner
    subfolders = [
        "01_Verwaltung",
        "02_Strategie",
        "03_Texte",
        "04_Creatives",
        "05_Funnel",
        "06_Anzeigen",
        "07_Tracking",
        "08_Transkripte",
    ]

    created = {}
    for name in subfolders:
        folder = await google_api("POST", "https://www.googleapis.com/drive/v3/files", {
            "name": name,
            "mimeType": "application/vnd.google-apps.folder",
            "parents": [root_id],
        })
        created[name] = folder["id"]

    # Zusätzliche Unterordner für 02_Strategie
    strategy_subs = [
        "Zielgruppen_Avatar",
        "Arbeitgeber_Avatar",
        "Messaging_Framework",
        "Creative_Brief",
        "Brand_Design_Richtlinien",
    ]
    for name in strategy_subs:
        await google_api("POST", "https://www.googleapis.com/drive/v3/files", {
            "name": name,
            "mimeType": "application/vnd.google-apps.folder",
            "parents": [created["02_Strategie"]],
        })

    # Unterordner für 04_Creatives
    upload_folder_id = None
    for name in ["Bilder", "Bearbeitete_Creatives", "Finale_Anzeigen"]:
        sub = await google_api("POST", "https://www.googleapis.com/drive/v3/files", {
            "name": name,
            "mimeType": "application/vnd.google-apps.folder",
            "parents": [created["04_Creatives"]],
        })
        if name == "Bilder":
            upload_folder_id = sub["id"]

    # Nur den Upload-Ordner (Bilder) mit dem Kunden teilen - nicht den ganzen Root
    client_email = (body or {}).get("email")
    share_folder_id = upload_folder_id or created.get("04_Creatives") or root_id
    if client_email:
        try:
            await google_api("POST", f"https://www.googleapis.com/drive/v3/files/{share_folder_id}/permissions", {
                "role": "writer",
                "type": "user",
                "emailAddress": client_email,
            })
            log.info(f"Drive Upload-Ordner ({share_folder_id}) mit {client_email} geteilt")
        except Exception as e:
            log.warning(f"Drive Sharing fehlgeschlagen (non-critical): {e}")

    folder_url = f"https://drive.google.com/drive/folders/{root_id}"
    upload_url = f"https://drive.google.com/drive/folders/{share_folder_id}"
    log.info(f"Drive Ordnerstruktur erstellt: {folder_url}")
    return {"root_id": root_id, "upload_folder_id": share_folder_id, "upload_url": upload_url, "url": folder_url, "subfolders": created}


@app.post("/api/google/create-calendar-event")
async def create_calendar_event(body: Optional[dict] = None):
    """is05: Kickoff-Termin erstellen."""
    company = (body or {}).get("company", "Novacode GmbH")
    contact_email = (body or {}).get("email", "clazahlungskonto@gmail.com")

    # Dedupe-Check: Existiert bereits ein Kickoff-Event für diese Firma in den nächsten 30 Tagen?
    expected_summary = f"Kickoff - {company} - Recruiting"
    try:
        time_min = datetime.now().isoformat() + "Z"
        time_max = (datetime.now() + timedelta(days=30)).isoformat() + "Z"
        search_q = urllib.parse.quote(expected_summary)
        existing_events = await google_api(
            "GET",
            f"https://www.googleapis.com/calendar/v3/calendars/primary/events?q={search_q}&timeMin={urllib.parse.quote(time_min)}&timeMax={urllib.parse.quote(time_max)}&singleEvents=true&maxResults=5",
        )
        items = existing_events.get("items", []) if isinstance(existing_events, dict) else []
        dup = next((ev for ev in items if ev.get("summary") == expected_summary and ev.get("status") != "cancelled"), None)
    except Exception as e:
        log.warning(f"Calendar Dedupe-Check fehlgeschlagen (fahre mit Create fort): {e}")
        dup = None

    if dup:
        meet_link_existing = dup.get("hangoutLink", "")
        if not meet_link_existing:
            for ep in dup.get("conferenceData", {}).get("entryPoints", []):
                if ep.get("entryPointType") == "video":
                    meet_link_existing = ep.get("uri", "")
                    break
        log.info(f"Calendar Event '{expected_summary}' wiederverwendet (Dedupe): {dup.get('id')}")
        return {
            "event_id": dup.get("id"),
            "link": dup.get("htmlLink"),
            "meet_link": meet_link_existing,
            "url": dup.get("htmlLink"),
            "deduplicated": True,
        }

    # Freien Slot finden: Mo-Fr, 9-17 Uhr, keine Kollision mit bestehenden Terminen
    if not (body or {}).get("date"):
        now = datetime.now()
        # Busy-Fenster der nächsten 14 Tage abrufen
        window_end = now + timedelta(days=14)
        busy_resp = await google_api(
            "POST",
            "https://www.googleapis.com/calendar/v3/freeBusy",
            {
                "timeMin": now.isoformat() + "Z",
                "timeMax": window_end.isoformat() + "Z",
                "timeZone": "Europe/Berlin",
                "items": [{"id": "primary"}],
            },
        )
        busy_slots = [
            (b["start"], b["end"])
            for b in busy_resp.get("calendars", {}).get("primary", {}).get("busy", [])
        ]

        def _conflicts(slot_start: datetime, slot_end: datetime) -> bool:
            s_iso = slot_start.isoformat()
            e_iso = slot_end.isoformat()
            for b_start, b_end in busy_slots:
                # Overlap check with string prefixes works because all are ISO UTC
                if s_iso < b_end and e_iso > b_start:
                    return True
            return False

        date = None
        time = None
        candidate_slots = []
        for offset_days in range(2, 15):
            day = now + timedelta(days=offset_days)
            if day.weekday() >= 5:
                continue
            for hour in [9, 10, 11, 13, 14, 15, 16]:
                slot_start = day.replace(hour=hour, minute=0, second=0, microsecond=0)
                slot_end = slot_start + timedelta(hours=1)
                if not _conflicts(slot_start, slot_end):
                    candidate_slots.append((slot_start, slot_end))
        if candidate_slots:
            slot_start, slot_end = random.choice(candidate_slots)
            date = slot_start.strftime("%Y-%m-%d")
            time = slot_start.strftime("%H:%M")
        else:
            # Fallback: nächster Wochentag 10 Uhr
            for offset_days in range(2, 8):
                day = now + timedelta(days=offset_days)
                if day.weekday() < 5:
                    date = day.strftime("%Y-%m-%d")
                    time = "10:00"
                    break
    else:
        date = body["date"]
        time = (body or {}).get("time", "10:00")

    start = f"{date}T{time}:00"
    end_hour = int(time.split(":")[0]) + 1
    end = f"{date}T{end_hour:02d}:{time.split(':')[1]}:00"

    event = await google_api(
        "POST",
        "https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1&sendUpdates=all",
        {
            "summary": f"Kickoff - {company} - Recruiting",
            "description": (
                f"Kickoff-Call für {company}\n\n"
                "Agenda:\n"
                "- Kandidatenprofil & Zielgruppe\n"
                "- Aktuelle Recruiting-Herausforderungen\n"
                "- Arbeitgeber-USPs & Benefits\n"
                "- Brand & Design Präferenzen\n"
                "- Nächste Schritte\n\n"
                "Hinweis: Dieser Call wird aufgezeichnet."
            ),
            "start": {"dateTime": start, "timeZone": "Europe/Berlin"},
            "end": {"dateTime": end, "timeZone": "Europe/Berlin"},
            "attendees": [{"email": contact_email}],
            "conferenceData": {
                "createRequest": {
                    "requestId": f"kickoff-{company.lower().replace(' ', '-')}",
                    "conferenceSolutionKey": {"type": "hangoutsMeet"},
                }
            },
            "reminders": {
                "useDefault": False,
                "overrides": [
                    {"method": "email", "minutes": 1440},
                    {"method": "popup", "minutes": 30},
                ],
            },
        },
    )

    # Meet-Link: hangoutLink oder conferenceData.entryPoints (Fallback)
    meet_link = event.get("hangoutLink", "")
    if not meet_link:
        for ep in event.get("conferenceData", {}).get("entryPoints", []):
            if ep.get("entryPointType") == "video":
                meet_link = ep.get("uri", "")
                break
    if meet_link:
        log.info(f"Google Meet Link erstellt: {meet_link}")
    else:
        log.warning(f"Kein Google Meet Link im Response - conferenceData: {event.get('conferenceData')}")

    result = {
        "event_id": event.get("id"),
        "link": event.get("htmlLink"),
        "meet_link": meet_link,
    }
    if event.get("htmlLink"):
        result["url"] = event["htmlLink"]
    return result


@app.post("/api/google/send-email")
async def send_welcome_email(body: Optional[dict] = None):
    """is04: Welcome Email senden."""
    company = (body or {}).get("company", "Novacode GmbH")
    contact_name = (body or {}).get("contact", "Claudio Di Franco")
    to_email = (body or {}).get("email", "clazahlungskonto@gmail.com")
    upload_link = (body or {}).get("upload_link", "#")
    kickoff_date = (body or {}).get("kickoff_date", "in den nächsten Tagen")

    import base64
    subject = f"Willkommen bei Flowstack - Ihr Recruiting Kickoff ({company})"
    body_html = f"""\
<!DOCTYPE html>
<html lang="de">
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;">

  <!-- Header -->
  <tr><td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px 40px;">
    <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">Flowstack</h1>
    <p style="margin:8px 0 0;color:#e0e7ff;font-size:14px;">Recruiting Automation Platform</p>
  </td></tr>

  <!-- Body -->
  <tr><td style="padding:40px;">
    <p style="margin:0 0 16px;color:#18181b;font-size:16px;">Hallo {contact_name},</p>

    <p style="margin:0 0 16px;color:#3f3f46;font-size:15px;line-height:1.6;">
      vielen Dank für dein Vertrauen in Flowstack. Wir freuen uns, <strong>{company}</strong>
      als neuen Kunden zu begrüßen und starten jetzt mit deinem Recruiting-Projekt.
    </p>

    <!-- Timeline -->
    <h2 style="margin:28px 0 16px;color:#18181b;font-size:17px;font-weight:600;">
      Deine nächsten Schritte
    </h2>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td style="padding:12px 16px;background:#f0fdf4;border-left:4px solid #22c55e;border-radius:0 8px 8px 0;margin-bottom:8px;">
          <strong style="color:#166534;">1. Kickoff-Termin</strong>
          <br><span style="color:#3f3f46;font-size:14px;">Geplant: {kickoff_date} - du bekommst eine separate Kalender-Einladung mit Google Meet Link.</span>
        </td>
      </tr>
      <tr><td style="height:8px;"></td></tr>
      <tr>
        <td style="padding:12px 16px;background:#eff6ff;border-left:4px solid #3b82f6;border-radius:0 8px 8px 0;">
          <strong style="color:#1e40af;">2. Materialien hochladen</strong>
          <br><span style="color:#3f3f46;font-size:14px;">Bitte lade deine Unterlagen über den Button unten hoch (Stellenanzeigen, Logos, Teamfotos, Brand Guidelines).</span>
        </td>
      </tr>
      <tr><td style="height:8px;"></td></tr>
      <tr>
        <td style="padding:12px 16px;background:#faf5ff;border-left:4px solid #8b5cf6;border-radius:0 8px 8px 0;">
          <strong style="color:#6b21a8;">3. Strategie &amp; Umsetzung</strong>
          <br><span style="color:#3f3f46;font-size:14px;">Nach dem Kickoff erstellen wir deine Recruiting-Strategie, Funnel, Creatives und Kampagnen.</span>
        </td>
      </tr>
    </table>

    <!-- What we create -->
    <h2 style="margin:28px 0 16px;color:#18181b;font-size:17px;font-weight:600;">
      Was unsere Automation für dich erstellt
    </h2>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td style="padding:12px 16px;background:#f9fafb;border-radius:8px;color:#3f3f46;font-size:14px;line-height:1.8;">
          &#10003; Zielgruppen-Analyse &amp; Kandidaten-Avatar<br>
          &#10003; Arbeitgeber-Positionierung &amp; Messaging<br>
          &#10003; Recruiting-Funnel mit Bewerbungsformular<br>
          &#10003; Ad Creatives &amp; Copy-Varianten<br>
          &#10003; Meta-Kampagnen mit Audience-Targeting<br>
          &#10003; Tracking-Setup &amp; Performance-Dashboard
        </td>
      </tr>
    </table>

    <!-- CTA Button -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:32px 0;">
      <tr><td align="center">
        <a href="{upload_link}" style="display:inline-block;padding:14px 32px;background:#6366f1;color:#ffffff;text-decoration:none;border-radius:8px;font-size:15px;font-weight:600;">
          Materialien hochladen
        </a>
      </td></tr>
    </table>

    <!-- Checklist -->
    <h2 style="margin:28px 0 12px;color:#18181b;font-size:17px;font-weight:600;">
      Bitte vorbereiten
    </h2>
    <ul style="margin:0 0 24px;padding-left:20px;color:#3f3f46;font-size:14px;line-height:1.8;">
      <li>Bestehende Stellenanzeigen / Job Descriptions</li>
      <li>Firmenlogo (PNG/SVG, möglichst hochauflösend)</li>
      <li>Teamfotos &amp; Arbeitsplatz-Bilder</li>
      <li>Brand Guidelines / CI-Dokument (falls vorhanden)</li>
      <li>Benefits &amp; USPs als Arbeitgeber</li>
    </ul>

    <p style="margin:0 0 8px;color:#3f3f46;font-size:15px;line-height:1.6;">
      Bei Fragen erreichst du uns jederzeit unter
      <a href="mailto:claudio@flowstack-system.de" style="color:#6366f1;">claudio@flowstack-system.de</a>.
    </p>

    <p style="margin:24px 0 0;color:#18181b;font-size:15px;">
      Beste Grüße,<br>
      <strong>Claudio Di Franco</strong><br>
      <span style="color:#6b7280;font-size:14px;">Account Manager - Flowstack</span>
    </p>
  </td></tr>

  <!-- Footer -->
  <tr><td style="padding:24px 40px;background:#f9fafb;border-top:1px solid #e5e7eb;">
    <p style="margin:0;color:#9ca3af;font-size:12px;text-align:center;">
      Flowstack - Recruiting Automation Platform<br>
      Diese E-Mail wurde automatisch versendet.
    </p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>"""
    # Dedupe-Check: Wurde in den letzten 24h bereits eine Willkommens-Mail
    # mit identischem Subject an diese Adresse gesendet?
    try:
        safe_subject = subject.replace('"', '\\"')
        q = f'in:sent to:{to_email} subject:"{safe_subject}" newer_than:1d'
        existing_sent = await google_api(
            "GET",
            f"https://www.googleapis.com/gmail/v1/users/me/messages?q={urllib.parse.quote(q)}&maxResults=1",
        )
        sent_messages = existing_sent.get("messages", []) if isinstance(existing_sent, dict) else []
    except Exception as e:
        log.warning(f"Gmail Dedupe-Check fehlgeschlagen (fahre mit Send fort): {e}")
        sent_messages = []

    if sent_messages:
        dup_id = sent_messages[0].get("id")
        log.info(f"Gmail Willkommens-Mail an {to_email} wiederverwendet (Dedupe): {dup_id}")
        return {"message_id": dup_id, "to": to_email, "url": "https://mail.google.com/", "deduplicated": True}

    raw = (
        f"To: {to_email}\n"
        f"Subject: {subject}\n"
        f"MIME-Version: 1.0\n"
        f"Content-Type: text/html; charset=utf-8\n"
        f"\n"
        f"{body_html}"
    )
    encoded = base64.urlsafe_b64encode(raw.encode()).decode()

    result = await google_api(
        "POST",
        "https://www.googleapis.com/gmail/v1/users/me/messages/send",
        {"raw": encoded},
    )
    return {"message_id": result.get("id"), "to": to_email, "url": "https://mail.google.com/"}


@app.post("/api/clickup/create-project")
async def create_clickup_project(body: Optional[dict] = None):
    """is08: ClickUp Projekt (List) erstellen."""
    company = (body or {}).get("company", "Novacode GmbH")
    list_name = f"{company} - Recruiting"

    # List direkt im Space erstellen (folderless)
    try:
        result = await clickup_api("POST", f"/space/{CLICKUP_SPACE_ID}/list", {
            "name": list_name,
            "content": f"Fulfillment-Projekt für {company}. Automatisch erstellt.",
        })
        list_id = result["id"]
        log.info(f"ClickUp List erstellt: {list_id}")
    except HTTPException as e:
        if "name taken" in str(e.detail).lower():
            # Liste existiert - wiederverwenden
            lists = await clickup_api("GET", f"/space/{CLICKUP_SPACE_ID}/list")
            for lst in lists.get("lists", []):
                if lst["name"] == list_name:
                    list_id = lst["id"]
                    log.info(f"ClickUp List existiert bereits: {list_id}")
                    return {"list_id": list_id, "name": lst["name"], "url": f"https://app.clickup.com/{CLICKUP_TEAM_ID}/v/li/{list_id}"}
            raise
        raise
    return {"list_id": list_id, "name": result["name"], "url": f"https://app.clickup.com/{CLICKUP_TEAM_ID}/v/li/{list_id}"}


async def _create_task(
    list_id: str,
    name: str,
    description: str,
    assignees: list[int],
    priority: int,
    due_days: int,
    checklist_items: list[str] | None = None,
) -> dict:
    """Helper: ClickUp Task mit Checklist, Assignees, Priority, Deadline erstellen."""
    due_ms = int((datetime.now() + timedelta(days=due_days)).timestamp() * 1000)
    task = await clickup_api("POST", f"/list/{list_id}/task", {
        "name": name,
        "description": description,
        "assignees": assignees,
        "priority": priority,
        "due_date": due_ms,
        "status": "to do",
    })
    task_id = task["id"]

    if checklist_items:
        cl = await clickup_api("POST", f"/task/{task_id}/checklist", {"name": "Checkliste"})
        cl_id = cl["checklist"]["id"]
        for item in checklist_items:
            await clickup_api("POST", f"/checklist/{cl_id}/checklist_item", {"name": item})

    return {"id": task_id, "name": name}


async def _attach_docs_to_task(task_id: str, docs: dict[str, str]) -> None:
    """Helper: Links als ClickUp-Kommentar anhängen (attachment-API erwartet multipart)."""
    entries = [(n, u) for n, u in docs.items() if u]
    if not entries:
        return
    comment = "Ressourcen:\n" + "\n".join(f"- {n}: {u}" for n, u in entries)
    try:
        await clickup_api("POST", f"/task/{task_id}/comment", {"comment_text": comment})
    except Exception as e:
        log.warning(f"ClickUp Kommentar mit Ressourcen fehlgeschlagen: {e}")


async def _complete_task(task_id: str, comment: str | None = None, docs: dict[str, str] | None = None) -> None:
    """Helper: ClickUp Task als erledigt markieren + optionaler Kommentar + Docs anhängen."""
    await clickup_api("PUT", f"/task/{task_id}", {"status": "complete"})
    if comment:
        await clickup_api("POST", f"/task/{task_id}/comment", {"comment_text": comment})
    if docs:
        await _attach_docs_to_task(task_id, docs)


@app.post("/api/clickup/create-tasks")
async def create_clickup_tasks(body: dict):
    """is09: Initiale ClickUp Tasks - nur echte menschliche Aufgaben, kein Auto-Complete."""
    list_id = body["list_id"]
    task_ids: dict[str, str] = {}
    company = body.get("company", "Novacode GmbH")

    # URLs aus Context aufbauen
    lead_id = body.get("lead_id", "")
    folder_root_id = body.get("folder_root_id", "")
    upload_folder_id = body.get("upload_folder_id", "")
    close_url = f"https://app.close.com/lead/{lead_id}/" if lead_id else ""
    drive_url = f"https://drive.google.com/drive/folders/{folder_root_id}" if folder_root_id else ""
    upload_url = f"https://drive.google.com/drive/folders/{upload_folder_id}" if upload_folder_id else drive_url
    clickup_url = f"https://app.clickup.com/{CLICKUP_TEAM_ID}/v/li/{list_id}"

    # Dedupe: Bestehende Tasks in der Liste per Name-Map einsammeln
    existing_by_name: dict[str, str] = {}
    try:
        existing_resp = await clickup_api("GET", f"/list/{list_id}/task?archived=false&subtasks=false&include_closed=true")
        for ex in (existing_resp.get("tasks") or []):
            n = ex.get("name")
            if n and ex.get("id"):
                existing_by_name[n] = ex["id"]
    except Exception as e:
        log.warning(f"ClickUp Task Dedupe-Lookup fehlgeschlagen (fahre mit Create fort): {e}")

    async def _create_or_reuse(name: str, *args, **kwargs) -> dict:
        if name in existing_by_name:
            log.info(f"ClickUp Task '{name}' wiederverwendet (Dedupe): {existing_by_name[name]}")
            return {"id": existing_by_name[name], "name": name}
        return await _create_task(list_id, name, *args, **kwargs)

    # Task 1: Pixel besorgen
    desc = f"Meta Pixel und Ad Account Zugänge für {company} sicherstellen.\n\n"
    desc += "Ressourcen:\n"
    if close_url: desc += f"- Close Deal: {close_url}\n"
    desc += f"- ClickUp Projekt: {clickup_url}\n"
    t = await _create_or_reuse(
        f"Pixel besorgen - {company}", desc,
        [CLICKUP_ANAK], 1, 2,  # Urgent, +2 Tage
        [
            "Meta Business Manager Zugang beim Kunden anfragen",
            "Ad Account Zugriff bestätigen (Werbekonto-Admin)",
            "Pixel-ID vom Kunden erhalten oder neuen Pixel erstellen",
            "Facebook Seite mit Ad Account verknüpft",
            "Alle Zugänge in Close dokumentiert",
        ],
    )
    task_ids["pixel_besorgen"] = t["id"]

    # Task 2: Kickoff vorbereiten
    desc2 = f"Kickoff-Call mit {company} vorbereiten.\n\n"
    desc2 += "Ressourcen:\n"
    if close_url: desc2 += f"- Close Deal: {close_url}\n"
    if drive_url: desc2 += f"- Google Drive: {drive_url}\n"
    t = await _create_or_reuse(
        f"Kickoff vorbereiten - {company}", desc2,
        [CLICKUP_CLAUDIO], 2, 3,  # High, +3 Tage
        [
            "Close Deal-Notizen und Opportunity gelesen",
            "Branche und Wettbewerber kurz recherchiert",
            "Kickoff-Leitfaden an Client angepasst",
            "Kalendereinladung und Meet-Link geprüft",
        ],
    )
    task_ids["kickoff"] = t["id"]

    # Task 3: Materialien vom Kunden einsammeln
    desc3 = f"Alle Materialien von {company} einsammeln für Strategie und Creatives.\n\n"
    desc3 += "Ressourcen:\n"
    if upload_url: desc3 += f"- Upload-Ordner (Bilder): {upload_url}\n"
    if drive_url: desc3 += f"- Google Drive: {drive_url}\n"
    t = await _create_or_reuse(
        f"Materialien vom Kunden einsammeln - {company}", desc3,
        [CLICKUP_CLAUDIO], 2, 5,  # High, +5 Tage
        [
            "Logo (PNG/SVG hochauflösend) erhalten",
            "Teamfotos / Arbeitsplatz-Bilder erhalten",
            "Brand Guidelines / CI erhalten (falls vorhanden)",
            "Bestehende Stellenanzeigen erhalten",
            "Benefits-Liste vom Kunden bekommen",
            "Alles im Drive Bilder-Ordner hochgeladen",
        ],
    )
    task_ids["materialien"] = t["id"]

    # Docs als Attachments an Tasks anhaengen
    shared_docs = {}
    if close_url: shared_docs["Close Deal"] = close_url
    if drive_url: shared_docs["Google Drive"] = drive_url
    if clickup_url: shared_docs["ClickUp Projekt"] = clickup_url
    for tid in task_ids.values():
        await _attach_docs_to_task(tid, shared_docs)

    log.info(f"ClickUp Tasks erstellt: {task_ids}")
    return {"tasks": [{"id": v, "name": k} for k, v in task_ids.items()], "task_ids": task_ids, "url": clickup_url}


# ══════════════════════════════════════════════════════════════════════════════
# Miro Integration - Kampagnen-Board
# ══════════════════════════════════════════════════════════════════════════════


async def create_miro_board(body: Optional[dict] = None):
    """Erstellt ein Miro Kampagnen-Board mit 5 Frames, Sticky Notes und Cards."""
    context = body or {}
    company = context.get("company", "Novacode GmbH")

    if not MIRO_ACCESS_TOKEN:
        log.warning("MIRO_ACCESS_TOKEN nicht konfiguriert - Miro-Call übersprungen")
        return {"url": "https://miro.com/app/board/", "miro_board_id": ""}

    # 1. Board erstellen
    board = await miro_api("POST", "/boards", {
        "name": f"{company} - Kampagnen-Übersicht",
        "description": f"Strategie- und Kampagnen-Board für {company}. Automatisch erstellt von Flowstack.",
    })
    board_id = board["id"]
    board_url = board.get("viewLink", f"https://miro.com/app/board/{board_id}/")
    log.info(f"Miro Board erstellt: {board_id} - {board_url}")

    # 2. Frames erstellen (5 Phasen, nebeneinander)
    frames_config = [
        {"title": "Zielgruppe",            "x": -2400, "color": "light_yellow"},
        {"title": "Messaging",             "x": -1200, "color": "light_green"},
        {"title": "Kampagnen-Struktur",     "x":     0, "color": "cyan"},
        {"title": "Creatives",             "x":  1200, "color": "yellow"},
        {"title": "Timeline",              "x":  2400, "color": "pink"},
    ]
    frame_ids = {}
    for fc in frames_config:
        frame = await miro_api("POST", f"/boards/{board_id}/frames", {
            "data": {"title": fc["title"], "format": "custom"},
            "style": {"fillColor": fc["color"]},
            "geometry": {"width": 1000, "height": 700},
            "position": {"x": fc["x"], "y": 0},
        })
        frame_ids[fc["title"]] = frame["id"]

    # 3. Sticky Notes pro Frame
    stickies_config = {
        "Zielgruppe": [
            ("Senior Developer, 28-40 Jahre", "light_yellow", -100, -100),
            ("Sucht: Remote, moderne Stacks, flache Hierarchien", "light_yellow", 100, -100),
            ("Pain: Veraltete Prozesse, keine Entwicklung", "yellow", -100, 80),
            ("Pain: Schlechte Work-Life-Balance", "yellow", 100, 80),
        ],
        "Messaging": [
            ("Hauptbotschaft: Bei Novacode baust du die Zukunft mit", "light_green", 0, -120),
            ("USP 1: 100% Remote-First", "light_green", -120, 40),
            ("USP 2: Moderner Tech-Stack (React, Go, K8s)", "light_green", 120, 40),
            ("Tonalität: Professionell, aber menschlich", "green", 0, 150),
        ],
        "Kampagnen-Struktur": [
            ("Hauptkampagne: Awareness + Conversions", "cyan", 0, -120),
            ("Retargeting: Website-Besucher + Formular-Abbrecher", "cyan", 0, 0),
            ("Warmup: Video Views + Engagement", "light_green", 0, 120),
        ],
        "Creatives": [
            ("Statische Bilder: Team-Fotos, Office, Code-Screens", "light_yellow", 0, -120),
            ("Video: 60s Recruiting-Spot", "light_yellow", -120, 40),
            ("Carousel: Benefits-Showcase", "yellow", 120, 40),
        ],
        "Timeline": [
            ("Woche 1-2: Strategie + Texte", "light_green", 0, -150),
            ("Woche 3: Funnel + Creatives", "light_green", 0, -50),
            ("Woche 4: Kampagnen-Setup + Review", "cyan", 0, 50),
            ("Woche 5: Go-Live + Optimierung", "pink", 0, 150),
        ],
    }

    for frame_title, stickies in stickies_config.items():
        frame_x = next(fc["x"] for fc in frames_config if fc["title"] == frame_title)
        for content, color, offset_x, offset_y in stickies:
            await miro_api("POST", f"/boards/{board_id}/sticky_notes", {
                "data": {"content": content, "shape": "square"},
                "style": {"fillColor": color},
                "position": {"x": frame_x + offset_x, "y": offset_y},
                "parent": {"id": frame_ids[frame_title]},
            })

    # 4. Cards (Action Items) pro Frame
    cards_config = {
        "Zielgruppe": [("Zielgruppen-Recherche abschließen", "Persona-Interviews + Datenanalyse")],
        "Messaging": [("Messaging-Matrix finalisieren", "USPs priorisieren und Tonalität festlegen")],
        "Kampagnen-Struktur": [
            ("Budget-Verteilung festlegen", "Hauptkampagne vs. Retargeting vs. Warmup"),
            ("Tracking-Setup prüfen", "Pixel, Events, Conversion-API"),
        ],
        "Creatives": [
            ("Creative Briefing an Designer", "Formate, Specs, Deadlines"),
            ("Video-Produktion planen", "Storyboard, Dreh-Location, Schnitt"),
        ],
        "Timeline": [("Meilensteine in ClickUp übertragen", "Alle Deadlines synchronisieren")],
    }

    for frame_title, cards in cards_config.items():
        frame_x = next(fc["x"] for fc in frames_config if fc["title"] == frame_title)
        for i, (title, desc) in enumerate(cards):
            await miro_api("POST", f"/boards/{board_id}/cards", {
                "data": {"title": title, "description": desc},
                "position": {"x": frame_x, "y": 250 + i * 80},
                "parent": {"id": frame_ids[frame_title]},
            })

    # 5. Connectors zwischen Frames (Flow von links nach rechts)
    frame_titles = ["Zielgruppe", "Messaging", "Kampagnen-Struktur", "Creatives", "Timeline"]
    for i in range(len(frame_titles) - 1):
        try:
            await miro_api("POST", f"/boards/{board_id}/connectors", {
                "startItem": {"id": frame_ids[frame_titles[i]]},
                "endItem": {"id": frame_ids[frame_titles[i + 1]]},
                "style": {"strokeColor": "#414bb2", "strokeWidth": 2.0},
            })
        except Exception:
            pass  # Connectors sind optional

    log.info(f"Miro Board komplett: {len(stickies_config)} Frames, Stickies + Cards erstellt")
    return {
        "miro_board_id": board_id,
        "url": board_url,
    }


# ══════════════════════════════════════════════════════════════════════════════
# V2 Airtable Integration - Baustein-System
# ══════════════════════════════════════════════════════════════════════════════

_airtable_http = httpx.AsyncClient(timeout=30)


async def airtable_request(method: str, path: str, data: Optional[dict] = None) -> dict:
    """Airtable API request."""
    if not AIRTABLE_API_KEY:
        log.warning("AIRTABLE_API_KEY nicht konfiguriert - Airtable-Calls übersprungen")
        return {}
    url = f"https://api.airtable.com/v0/{path}"
    resp = await _airtable_http.request(
        method, url, json=data,
        headers={
            "Authorization": f"Bearer {AIRTABLE_API_KEY}",
            "Content-Type": "application/json",
        },
    )
    if resp.status_code >= 400:
        log.error(f"Airtable API error: {resp.status_code} {resp.text}")
        return {"error": resp.text, "status": resp.status_code}
    return resp.json()


async def airtable_create_record(table: str, fields: dict) -> dict:
    """Erstellt einen Record in einer Airtable-Tabelle."""
    if not AIRTABLE_BASE_ID:
        return {}
    result = await airtable_request("POST", f"{AIRTABLE_BASE_ID}/{table}", {"fields": fields})
    return result


async def airtable_create_records(table: str, records: list[dict]) -> list[dict]:
    """Erstellt mehrere Records (Batch, max 10 pro Call)."""
    if not AIRTABLE_BASE_ID:
        return []
    all_results = []
    for i in range(0, len(records), 10):
        batch = records[i:i + 10]
        payload = {"records": [{"fields": r} for r in batch]}
        result = await airtable_request("POST", f"{AIRTABLE_BASE_ID}/{table}", payload)
        if "records" in result:
            all_results.extend(result["records"])
        elif "error" in result:
            log.error(f"Airtable batch write error: {result}")
    return all_results


async def airtable_get_records(table: str, formula: str = "") -> list[dict]:
    """Liest Records aus einer Airtable-Tabelle."""
    if not AIRTABLE_BASE_ID:
        return []
    path = f"{AIRTABLE_BASE_ID}/{table}"
    if formula:
        import urllib.parse
        path += f"?filterByFormula={urllib.parse.quote(formula)}"
    result = await airtable_request("GET", path)
    return result.get("records", [])


async def airtable_update_record(table: str, record_id: str, fields: dict) -> dict:
    """Aktualisiert einen Record."""
    if not AIRTABLE_BASE_ID:
        return {}
    return await airtable_request("PATCH", f"{AIRTABLE_BASE_ID}/{table}/{record_id}", {"fields": fields})


# ── Airtable Base Auto-Setup ─────────────────────────────────────────────────

AIRTABLE_TABLES_CONFIG = [
    {
        "name": "Clients",
        "fields": [
            {"name": "Client Name", "type": "singleLineText"},
            {"name": "Status", "type": "singleSelect", "options": {"choices": [
                {"name": "Onboarding"}, {"name": "Kickoff"}, {"name": "Extraktion"},
                {"name": "Strategie"}, {"name": "Copy"}, {"name": "Ads"},
                {"name": "Review"}, {"name": "Live"},
            ]}},
            {"name": "Branche", "type": "singleSelect", "options": {"choices": [
                {"name": "Recruiting"}, {"name": "E-Commerce"}, {"name": "Content"}, {"name": "SaaS"},
            ]}},
            {"name": "Close Lead URL", "type": "url"},
            {"name": "Google Drive URL", "type": "url"},
            {"name": "Slack Channel", "type": "singleLineText"},
            {"name": "Kickoff Datum", "type": "date", "options": {"dateFormat": {"name": "european"}}},
            {"name": "Ansprechpartner", "type": "singleLineText"},
            {"name": "Email", "type": "email"},
            {"name": "Rolle", "type": "singleLineText"},
        ],
    },
    {
        "name": "Bausteine",
        "fields": [
            {"name": "Feld-Name", "type": "singleLineText"},
            {"name": "Kategorie", "type": "singleSelect", "options": {"choices": [
                {"name": "A. Demografie"}, {"name": "B. Beruflich"}, {"name": "C. Schmerzpunkte"},
                {"name": "D. Psychologie"}, {"name": "E. Benefits"}, {"name": "F. Sprache"},
                {"name": "G. Einwände"}, {"name": "H. Arbeitgeber"}, {"name": "I. Messaging"},
                {"name": "J. Markt"},
            ]}},
            {"name": "Inhalt", "type": "multilineText"},
            {"name": "Quelle", "type": "singleSelect", "options": {"choices": [
                {"name": "Transkript"}, {"name": "AI-Extraktion"}, {"name": "Manuell"},
            ]}},
            {"name": "Sortierung", "type": "number", "options": {"precision": 0}},
        ],
    },
    {
        "name": "Dokumente",
        "fields": [
            {"name": "Dokument-Name", "type": "singleLineText"},
            {"name": "Dokument-Typ", "type": "singleSelect", "options": {"choices": [
                {"name": "Zielgruppen-Avatar"}, {"name": "Arbeitgeber-Avatar"},
                {"name": "Messaging-Matrix"}, {"name": "Creative Briefing"},
                {"name": "Marken-Richtlinien"}, {"name": "Landingpage-Texte"},
                {"name": "Formularseite-Texte"}, {"name": "Dankeseite-Texte"},
                {"name": "Ads Hauptkampagne"}, {"name": "Ads Retargeting"},
                {"name": "Ads Warmup"}, {"name": "Videoskript"},
            ]}},
            {"name": "Google Doc URL", "type": "url"},
            {"name": "Google Doc ID", "type": "singleLineText"},
            {"name": "Status", "type": "singleSelect", "options": {"choices": [
                {"name": "Generiert"}, {"name": "In Review"}, {"name": "Freigegeben"},
            ]}},
            {"name": "Version", "type": "number", "options": {"precision": 0}},
        ],
    },
    {
        "name": "Kampagnen",
        "fields": [
            {"name": "Kampagnen-Name", "type": "singleLineText"},
            {"name": "Typ", "type": "singleSelect", "options": {"choices": [
                {"name": "Initial"}, {"name": "Retargeting"}, {"name": "Warmup"},
            ]}},
            {"name": "Meta Campaign ID", "type": "singleLineText"},
            {"name": "Budget Tag", "type": "currency", "options": {"precision": 2, "symbol": "EUR"}},
            {"name": "Status", "type": "singleSelect", "options": {"choices": [
                {"name": "Draft"}, {"name": "Active"}, {"name": "Paused"},
            ]}},
            {"name": "Ads Manager URL", "type": "url"},
        ],
    },
    {
        "name": "Frameworks",
        "fields": [
            {"name": "Name", "type": "singleLineText"},
            {"name": "Nr", "type": "number", "options": {"precision": 0}},
            {"name": "Kategorie", "type": "singleSelect", "options": {"choices": [
                {"name": "Strategie"}, {"name": "Copy"}, {"name": "Ads"},
            ]}},
            {"name": "Regeln", "type": "multilineText"},
            {"name": "Beispiel URL", "type": "url"},
        ],
    },
    {
        "name": "Performance",
        "fields": [
            {"name": "Kampagnen-Name", "type": "singleLineText"},
            {"name": "Datum", "type": "date", "options": {"dateFormat": {"name": "european"}}},
            {"name": "Kampagnen-Typ", "type": "singleSelect", "options": {"choices": [
                {"name": "Initial"}, {"name": "Retargeting"}, {"name": "Warmup"},
            ]}},
            {"name": "Meta Campaign ID", "type": "singleLineText"},
            {"name": "Impressions", "type": "number", "options": {"precision": 0}},
            {"name": "Clicks", "type": "number", "options": {"precision": 0}},
            {"name": "CTR", "type": "percent", "options": {"precision": 2}},
            {"name": "CPM", "type": "currency", "options": {"precision": 2, "symbol": "EUR"}},
            {"name": "CPC", "type": "currency", "options": {"precision": 2, "symbol": "EUR"}},
            {"name": "Leads", "type": "number", "options": {"precision": 0}},
            {"name": "CPL", "type": "currency", "options": {"precision": 2, "symbol": "EUR"}},
            {"name": "Spend", "type": "currency", "options": {"precision": 2, "symbol": "EUR"}},
            {"name": "Reach", "type": "number", "options": {"precision": 0}},
            {"name": "Frequency", "type": "number", "options": {"precision": 2}},
        ],
    },
]

# ── Airtable Views (Dashboards) ──────────────────────────────────────────────
AIRTABLE_VIEWS_CONFIG = [
    # Airtable Metadata API unterstützt nur "grid" und "form" - Kanban/Gallery/Calendar
    # müssen manuell in der Airtable UI erstellt werden.
    # Wir erstellen Grid-Views mit beschreibenden Namen als Ausgangspunkt.
    # ── Clients ──
    {"table": "Clients", "name": "Pipeline nach Status", "type": "grid"},
    {"table": "Clients", "name": "Alle Clients", "type": "grid"},
    # ── Bausteine ──
    {"table": "Bausteine", "name": "Nach Kategorie", "type": "grid"},
    {"table": "Bausteine", "name": "Alle Bausteine", "type": "grid"},
    # ── Dokumente ──
    {"table": "Dokumente", "name": "Status-Tracker", "type": "grid"},
    {"table": "Dokumente", "name": "Alle Dokumente", "type": "grid"},
    # ── Kampagnen ──
    {"table": "Kampagnen", "name": "Kampagnen-Tracker", "type": "grid"},
    {"table": "Kampagnen", "name": "Alle Kampagnen", "type": "grid"},
    # ── Frameworks ──
    {"table": "Frameworks", "name": "Nach Kategorie", "type": "grid"},
    {"table": "Frameworks", "name": "Alle Frameworks", "type": "grid"},
    # ── Performance ──
    {"table": "Performance", "name": "Performance Dashboard", "type": "grid"},
    {"table": "Performance", "name": "Tagesreport", "type": "grid"},
]


@app.post("/api/airtable/setup")
async def setup_airtable_base():
    """Erstellt alle Tabellen in der Airtable Base automatisch via Metadata API."""
    if not AIRTABLE_API_KEY or not AIRTABLE_BASE_ID:
        raise HTTPException(400, "AIRTABLE_API_KEY und AIRTABLE_BASE_ID müssen in Doppler konfiguriert sein")

    created_tables = []
    for table_cfg in AIRTABLE_TABLES_CONFIG:
        result = await airtable_request(
            "POST",
            f"meta/bases/{AIRTABLE_BASE_ID}/tables",
            {"name": table_cfg["name"], "fields": table_cfg["fields"]},
        )
        if "error" in result:
            log.warning(f"Tabelle {table_cfg['name']} evtl. schon vorhanden: {result}")
        else:
            created_tables.append({"name": table_cfg["name"], "id": result.get("id")})
            log.info(f"Airtable Tabelle erstellt: {table_cfg['name']}")

    # ── Views pro Tabelle erstellen ──────────────────────────────────────────
    table_id_map: dict[str, str] = {}
    for t in created_tables:
        table_id_map[t["name"]] = t["id"]

    # Bestehende Tabellen-IDs holen (falls Tabellen schon existierten)
    if len(table_id_map) < len(AIRTABLE_TABLES_CONFIG):
        meta = await airtable_request("GET", f"meta/bases/{AIRTABLE_BASE_ID}/tables")
        for tbl in meta.get("tables", []):
            if tbl["name"] not in table_id_map:
                table_id_map[tbl["name"]] = tbl["id"]

    # ── Linked Record Fields erstellen (Relationen zwischen Tabellen) ────────
    clients_id = table_id_map.get("Clients")
    linked_fields_created = []
    if clients_id:
        link_configs = [
            ("Bausteine", "Client", clients_id),
            ("Dokumente", "Client", clients_id),
            ("Kampagnen", "Client", clients_id),
        ]
        for table_name, field_name, linked_table_id in link_configs:
            tid = table_id_map.get(table_name)
            if not tid:
                continue
            lr = await airtable_request(
                "POST",
                f"meta/bases/{AIRTABLE_BASE_ID}/tables/{tid}/fields",
                {"name": field_name, "type": "multipleRecordLinks", "options": {"linkedTableId": linked_table_id}},
            )
            if "error" in lr:
                log.warning(f"Linked Field {field_name} in {table_name} evtl. schon vorhanden: {lr}")
            else:
                linked_fields_created.append({"table": table_name, "field": field_name})
                log.info(f"Linked Field erstellt: {table_name}.{field_name} → Clients")

    # ── Frameworks-Tabelle mit Framework-Daten befuellen ──────────────────
    frameworks_populated = 0
    frameworks_dir = os.path.join(os.path.dirname(__file__), "frameworks")
    if os.path.isdir(frameworks_dir) and table_id_map.get("Frameworks"):
        framework_files = sorted([f for f in os.listdir(frameworks_dir) if f.endswith(".md") and f != "00-design-system.md"])
        fw_records = []
        for fw_file in framework_files:
            nr_str = fw_file.split("-")[0]
            nr = int(nr_str) if nr_str.isdigit() else 0
            name = fw_file.replace(".md", "").split("-", 1)[1].replace("-", " ").title() if "-" in fw_file else fw_file
            kategorie = "Strategie" if nr <= 5 else ("Copy" if nr <= 12 else "Ads")
            # Regeln aus der Framework-Datei extrahieren (## Regeln Section)
            regeln = ""
            try:
                with open(os.path.join(frameworks_dir, fw_file), "r") as _fw:
                    fw_content = _fw.read()
                # "## Regeln" Section extrahieren
                if "## Regeln" in fw_content:
                    regeln_start = fw_content.index("## Regeln")
                    regeln_end = fw_content.find("\n## ", regeln_start + 10)
                    regeln = fw_content[regeln_start:regeln_end].strip() if regeln_end > 0 else fw_content[regeln_start:].strip()
                    regeln = regeln.replace("## Regeln\n", "").strip()
            except Exception:
                pass
            fw_records.append({"Name": name, "Nr": nr, "Kategorie": kategorie, "Regeln": regeln})
        if fw_records:
            created_fws = await airtable_create_records("Frameworks", fw_records)
            frameworks_populated = len(created_fws)
            log.info(f"Frameworks-Tabelle befuellt: {frameworks_populated} Records")

    created_views = []
    for view_cfg in AIRTABLE_VIEWS_CONFIG:
        table_name = view_cfg["table"]
        table_id = table_id_map.get(table_name)
        if not table_id:
            log.warning(f"Tabelle {table_name} nicht gefunden - View '{view_cfg['name']}' übersprungen")
            continue
        result = await airtable_request(
            "POST",
            f"meta/bases/{AIRTABLE_BASE_ID}/tables/{table_id}/views",
            {"name": view_cfg["name"], "type": view_cfg["type"]},
        )
        if "error" in result:
            log.warning(f"View {view_cfg['name']} evtl. schon vorhanden: {result}")
        else:
            created_views.append({"table": table_name, "name": view_cfg["name"], "type": view_cfg["type"], "id": result.get("id")})
            log.info(f"Airtable View erstellt: {view_cfg['name']} in {table_name}")

    return {
        "ok": True,
        "tables": created_tables,
        "linked_fields": linked_fields_created,
        "frameworks_populated": frameworks_populated,
        "views": created_views,
    }


# ── Google Doc Reader (V2) ────────────────────────────────────────────────────

async def read_google_doc_content(doc_id: str) -> str:
    """Liest den Inhalt eines Google Docs als Plain-Text."""
    token = await _refresh_google_token()
    resp = await _airtable_http.get(
        f"https://www.googleapis.com/drive/v3/files/{doc_id}/export?mimeType=text/plain",
        headers={"Authorization": f"Bearer {token}"},
        timeout=30,
    )
    if resp.status_code == 401:
        token = await _refresh_google_token()
        resp = await _airtable_http.get(
            f"https://www.googleapis.com/drive/v3/files/{doc_id}/export?mimeType=text/plain",
            headers={"Authorization": f"Bearer {token}"},
            timeout=30,
        )
    if resp.status_code >= 400:
        log.error(f"Google Doc read error ({doc_id}): {resp.status_code}")
        return ""
    return resp.text


@app.get("/api/docs/read/{doc_id}")
async def api_read_google_doc(doc_id: str):
    """API Endpoint: Google Doc lesen."""
    content = await read_google_doc_content(doc_id)
    word_count = len(content.split()) if content else 0
    return {"doc_id": doc_id, "content": content, "word_count": word_count}


# ── V2 Baustein-Extraktion ───────────────────────────────────────────────────

# Mapping: Welches Dokument braucht welche Baustein-Kategorien
DOC_BAUSTEIN_MAP = {
    1:  {"use": ["A","B","C","D","E","F","G"], "ctx": ["J"]},
    2:  {"use": ["H"], "ctx": ["C","E"]},
    3:  {"use": ["C","D","F","H","I"], "ctx": ["E","G"]},
    4:  {"use": ["H","F"], "ctx": ["C"]},
    5:  {"use": ["H","F"], "ctx": ["I"]},
    6:  {"use": ["C","D","E","F","H","I"], "ctx": ["G"]},
    7:  {"use": ["E","F","B"], "ctx": ["C"]},
    8:  {"use": ["E","H"], "ctx": []},
    9:  {"use": ["C","F","H","I"], "ctx": ["D","G"]},
    10: {"use": ["C","G","H","I"], "ctx": ["F"]},
    11: {"use": ["H","D","F"], "ctx": ["C"]},
    12: {"use": ["C","D","H","I","F"], "ctx": ["E"]},
}

# Kategorie-Buchstabe → Airtable Select-Name
KATEGORIE_MAP = {
    "A": "A. Demografie", "B": "B. Beruflich", "C": "C. Schmerzpunkte",
    "D": "D. Psychologie", "E": "E. Benefits", "F": "F. Sprache",
    "G": "G. Einwände", "H": "H. Arbeitgeber", "I": "I. Messaging",
    "J": "J. Markt",
}

EXTRACTION_JSON_SCHEMA = {
    "demografie": {
        "alter": "Altersbereich (z.B. '28-42')",
        "geschlecht": "Verteilung oder 'alle'",
        "standort": "Region/Stadt",
        "bildung": "Typischer Abschluss",
        "familienstand": "Typisch für Zielgruppe",
        "einkommen": "Gehaltsbereich",
        "berufserfahrung": "Jahre Erfahrung",
        "suchverhalten": "aktiv oder passiv",
    },
    "beruflich": {
        "aktuelle_rolle": "Aktueller Job-Titel",
        "gesuchte_rolle": "Rolle die besetzt werden soll",
        "stack_aktuell": "Technologien die sie aktuell nutzen",
        "stack_gewünscht": "Technologien die sie nutzen WOLLEN",
        "seniorität": "Junior/Mid/Senior/Lead",
        "arbeitgeber_typ": "Konzern/Agentur/Startup/Mittelstand",
        "gehalt_aktuell": "Gehaltsrange aktuell",
        "gehalt_gewünscht": "Gehaltsrange gewünscht",
    },
    "schmerzpunkte": {
        "primär": "Größter Schmerzpunkt",
        "primär_zitat": "Realistisches Zitat dazu (wie echte Person redet)",
        "primär_tiefe": "Schmerz hinter dem Schmerz - tiefere Emotion",
        "sekundär_1": "Zweitgrößter Schmerzpunkt",
        "sekundär_1_zitat": "Zitat",
        "sekundär_1_tiefe": "Tiefere Emotion",
        "sekundär_2": "Drittgrößter Schmerzpunkt",
        "sekundär_2_zitat": "Zitat",
        "sekundär_2_tiefe": "Tiefere Emotion",
        "sekundär_3": "Viertgrößter Schmerzpunkt",
        "sekundär_3_zitat": "Zitat",
        "sekundär_3_tiefe": "Tiefere Emotion",
    },
    "psychologie": {
        "primäre_emotion": "Was fühlt die Zielgruppe JETZT (z.B. Frustration, Resignation)",
        "gewünschte_emotion": "Was will sie FÜHLEN (z.B. Stolz, Kontrolle)",
        "größte_angst": "Was hält sie zurück (z.B. 'Neuer Job könnte schlimmer sein')",
        "größter_wunsch": "Was treibt sie an (z.B. 'Endlich Impact haben')",
        "innerer_konflikt": "z.B. 'Sicherheit vs. Wachstum'",
        "selbstbild": "Wie sieht sich die Zielgruppe selbst",
        "fremdbild": "Wie sehen andere sie",
        "trigger_events": "3-5 konkrete Situationen die den Wechsel auslösen",
        "gedanken_nachts": "Worüber grübeln sie vor dem Einschlafen",
        "tagträume": "Was stellen sie sich vor",
    },
    "benefits": {
        "top_1": "Stärkstes Argument/Benefit",
        "top_2": "Zweitstärkstes",
        "top_3": "Drittstärkstes",
        "hygiene": "Was wird ERWARTET (z.B. Gehalt, Vertrag)",
        "differenzierung": "Was macht den echten Unterschied",
        "dealbreaker": "Was geht GAR NICHT",
        "geheime_wünsche": "Was sie nie laut sagen würden",
        "idealer_tag": "Wie sieht der perfekte Arbeitstag aus",
    },
    "sprache": {
        "duktus": "Tonalität der Zielgruppe (direkt/locker/technisch)",
        "fachwörter": "Liste von Fachbegriffen die sie täglich nutzen",
        "verbotene_wörter": "Begriffe die sie abstoßen (z.B. Rockstar, Ninja)",
        "redewendungen": "Typische Phrasen und Ausdrücke",
        "kommunikationsstil": "Direkt/indirekt, formell/informell",
        "humor_typ": "Trocken, sarkastisch, kein Humor",
        "informationsquellen": "Wo lesen sie (Blogs, Podcasts, Newsletter)",
        "communities": "Reddit, HackerNews, LinkedIn, Discord, etc.",
        "vorbilder": "Influencer/Personen denen sie folgen",
        "entscheidungssprache": "Wie formulieren sie Anforderungen",
    },
    "einwaende": {
        "einwand_1": "Haupteinwand gegen Wechsel",
        "entkräftung_1": "Wie man ihn entkräftet",
        "einwand_2": "Zweiter Einwand",
        "entkräftung_2": "Entkräftung",
        "einwand_3": "Dritter Einwand",
        "entkräftung_3": "Entkräftung",
    },
    "arbeitgeber": {
        "usp_1": "Stärkstes USP",
        "usp_1_beweis": "Konkreter Beweis/Beleg dafür",
        "usp_2": "Zweites USP",
        "usp_2_beweis": "Beweis",
        "usp_3": "Drittes USP",
        "usp_3_beweis": "Beweis",
        "kernpositionierung": "1 Satz der alles zusammenfasst",
        "differenzierung": "Was unterscheidet vom Wettbewerb",
        "kultur_3_worte": "Unternehmenskultur in 3 Worten",
        "anti_muster": "Was das Unternehmen NICHT ist",
    },
    "messaging": {
        "kernbotschaft": "1 prägnanter Satz für die gesamte Kampagne",
        "hook_1": "Emotionalster Hook (<125 Zeichen, Loss Aversion)",
        "hook_2": "Zweiter Hook (andere Emotion)",
        "hook_3": "Dritter Hook (Provokation/Pattern Interrupt)",
        "hook_4": "Vierter Hook (Identity Play)",
        "hook_5": "Fünfter Hook (Social Proof/Neugier)",
        "cta_1": "Niedrigschwelligster CTA",
        "cta_2": "Alternativer CTA",
        "cta_3": "Dritter CTA",
        "tonalitätsprofil": "Stimme + Rhythmus + Formatierung",
    },
    "markt": {
        "trend_1": "Relevanter Branchentrend 1",
        "trend_2": "Relevanter Branchentrend 2",
        "arbeitsmarkt": "Angebot/Nachfrage-Situation",
        "gehaltsbenchmark": "Marktdurchschnitt-Gehalt",
        "wettbewerber": "Top 3 Wettbewerber um Talente",
        "saisonalitaet": "Beste Zeit für Kampagnen",
    },
}


async def extract_building_blocks(transcript: str, company: str, rolle: str = "") -> dict:
    """Extrahiert ~88 Bausteine aus dem Transkript via AI (1 Call)."""
    schema_str = json.dumps(EXTRACTION_JSON_SCHEMA, indent=2, ensure_ascii=False)

    system_prompt = """Du bist ein Senior Consumer-Psychologe und Recruiting-Marketing-Stratege mit 15 Jahren Erfahrung.

AUFGABE: Analysiere das Kickoff-Transkript und extrahiere ALLE relevanten Informationen in das vorgegebene JSON-Schema.

REGELN:
1. Jedes Feld MUSS befüllt werden - leite logisch ab wenn nicht explizit im Transkript
2. Zitate müssen klingen wie echte Menschen reden - Fachjargon, kurze Sätze, authentisch
3. "Schmerz hinter dem Schmerz" = die tiefere EMOTIONALE Ebene:
   - "Veralteter Stack" → "Angst, den Anschluss zu verlieren und irrelevant zu werden"
   - "Keine Remote-Option" → "Gefühl, nicht vertraut und respektiert zu werden"
   - "Schlechte Führung" → "Kontrollverlust über die eigene Karriere und Zukunft"
4. Hooks: Max 125 Zeichen, emotional triggern, Loss Aversion > Benefits
   - SCHLECHT: "Wir bieten tolle Jobs" / RICHTIG: "Dein Code landet nie in Produktion?"
5. CTAs müssen niedrigschwellig sein: "In 60 Sekunden", "Kein Lebenslauf", "Unverbindlich"
6. VERBOTENE Wörter für verbotene_wörter: "Rockstar", "Ninja", "Guru", "Dynamisches Team", "Flache Hierarchien", "Wir suchen dich!"
7. Fachwörter: Echte Begriffe die die Zielgruppe TÄGLICH nutzt (z.B. Stack-Namen, Tools, Methodiken)
8. Psychologie-Felder: Denke wie ein Therapeut - was FÜHLT die Person wirklich?
9. Trigger-Events: Konkrete Situationen (z.B. "Montag-Meeting wo der Chef die Idee abwürgt")
10. Kernbotschaft: MUSS in einem einzigen Satz die gesamte Kampagne kommunizieren

Antworte NUR mit validem JSON. Kein Markdown, kein Text davor/danach."""

    user_prompt = f"""Unternehmen: {company}
Gesuchte Rolle: {rolle or 'Siehe Transkript'}

TRANSKRIPT:
{transcript}

Extrahiere alle Informationen in exakt dieses JSON-Schema (jedes Feld befüllen!):
{schema_str}"""

    raw = await openrouter_generate(
        system_prompt,
        user_prompt,
        max_tokens=8000,
    )

    # JSON parsen (AI gibt manchmal ```json ... ``` zurueck)
    cleaned = raw.strip()
    if cleaned.startswith("```json"):
        cleaned = cleaned[7:]
    if cleaned.startswith("```"):
        cleaned = cleaned[3:]
    if cleaned.endswith("```"):
        cleaned = cleaned[:-3]
    cleaned = cleaned.strip()

    try:
        blocks = json.loads(cleaned)
    except json.JSONDecodeError as e:
        log.error(f"Baustein-Extraktion JSON parse error: {e}\nRaw: {raw[:500]}")
        raise HTTPException(500, f"AI-Extraktion: Ungültiges JSON - {e}")

    return blocks


def flatten_blocks_for_airtable(blocks: dict, client_record_id: str = "") -> list[dict]:
    """Wandelt das verschachtelte JSON in flache Airtable-Records um."""
    CATEGORY_NAMES = {
        "demografie": "A. Demografie", "beruflich": "B. Beruflich",
        "schmerzpunkte": "C. Schmerzpunkte", "psychologie": "D. Psychologie",
        "benefits": "E. Benefits", "sprache": "F. Sprache",
        "einwaende": "G. Einwände", "arbeitgeber": "H. Arbeitgeber",
        "messaging": "I. Messaging", "markt": "J. Markt",
    }
    records = []
    for cat_key, fields in blocks.items():
        if not isinstance(fields, dict):
            continue
        cat_name = CATEGORY_NAMES.get(cat_key, cat_key)
        for i, (field_key, value) in enumerate(fields.items()):
            record = {
                "Kategorie": cat_name,
                "Feld-Name": f"{cat_name.split('. ')[1] if '. ' in cat_name else cat_name} - {field_key}",
                "Inhalt": str(value) if value else "",
                "Quelle": "AI-Extraktion",
                "Sortierung": i + 1,
            }
            # Linked Record zum Client setzen (falls vorhanden)
            if client_record_id:
                record["Client"] = [client_record_id]
            records.append(record)
    return records


async def write_blocks_to_airtable(blocks: dict, client_record_id: str) -> int:
    """Schreibt alle Bausteine als Records in die Airtable Bausteine-Tabelle."""
    records = flatten_blocks_for_airtable(blocks, client_record_id)
    if not records:
        return 0
    created = await airtable_create_records("Bausteine", records)
    log.info(f"Airtable: {len(created)} Bausteine geschrieben für Client {client_record_id}")
    return len(created)


def filter_blocks_for_doc(all_blocks: dict, doc_number: int) -> dict:
    """Filtert Bausteine für ein bestimmtes Dokument basierend auf DOC_BAUSTEIN_MAP."""
    mapping = DOC_BAUSTEIN_MAP.get(doc_number)
    if not mapping:
        return all_blocks

    LETTER_TO_KEY = {
        "A": "demografie", "B": "beruflich", "C": "schmerzpunkte",
        "D": "psychologie", "E": "benefits", "F": "sprache",
        "G": "einwaende", "H": "arbeitgeber", "I": "messaging", "J": "markt",
    }

    result = {}
    for letter in mapping.get("use", []) + mapping.get("ctx", []):
        key = LETTER_TO_KEY.get(letter, "")
        if key and key in all_blocks:
            result[key] = all_blocks[key]
    return result


def format_bausteine_for_prompt(bausteine: dict, doc_number: int) -> str:
    """Formatiert Bausteine als lesbaren Text für den AI-Prompt.
    Filtert automatisch auf die für dieses Dokument relevanten Kategorien."""
    filtered = filter_blocks_for_doc(bausteine, doc_number)
    NICE_NAMES = {
        "demografie": "Zielgruppen-Demografie",
        "beruflich": "Berufliches Profil",
        "schmerzpunkte": "Schmerzpunkte & Frustrationen",
        "psychologie": "Psychologie & Emotionen",
        "benefits": "Benefits & Wünsche",
        "sprache": "Sprache & Wording",
        "einwaende": "Einwände & Bedenken",
        "arbeitgeber": "Arbeitgeber-Daten",
        "messaging": "Messaging-Bausteine",
        "markt": "Markt & Trends",
    }
    parts = []
    for cat_key, fields in filtered.items():
        if not isinstance(fields, dict):
            continue
        cat_name = NICE_NAMES.get(cat_key, cat_key)
        parts.append(f"\n### {cat_name}")
        for field_key, value in fields.items():
            parts.append(f"- **{field_key}:** {value}")
    return "\n".join(parts)



# ══════════════════════════════════════════════════════════════════════════════
# Batch-Endpoint: Führt mehrere Actions in Reihenfolge aus
# ══════════════════════════════════════════════════════════════════════════════

@app.post("/api/execute-node")
async def execute_node(body: dict):
    """
    Universeller Endpoint: Führt die echte API-Aktion für einen Node aus.
    Body: { "nodeId": "is02", "systemId": "demo-novacode-infra", "context": {...} }
    Gibt { "ok": true, "result": {...} } zurück.
    """
    node_id = body.get("nodeId", "")
    context = body.get("context", {})
    result: dict[str, Any] = {}

    try:
        # ═══════════════════════════════════════════════════════════════════
        # V1 LIVE — Novacode Recruiting Demo (AKTIV)
        # Node-IDs: is01-is11, kc01-kc06, st01-st10, cc01-cc05,
        #           fn01-fn11, ca01-ca09, rl01-rl12 (rl13 entfernt)
        # ═══════════════════════════════════════════════════════════════════
        # ── Infrastructure Setup ──
        if node_id == "is02":
            result = await create_close_lead(context)

        elif node_id == "is03":
            company = context.get("company", "Novacode GmbH")
            lead_id = context.get("lead_id", "")
            lead_url = f"https://app.close.com/lead/{lead_id}/" if lead_id else "https://app.close.com/"
            # Projekt-Übersicht Spreadsheet erstellen
            sheet_info = await _create_project_overview_sheet(company)
            result["overview_sheet_id"] = sheet_info["spreadsheet_id"]
            result["overview_sheet_url"] = sheet_info["url"]
            ts = datetime.now().strftime('%d.%m.%Y %H:%M')
            await _append_sheet_row(sheet_info["spreadsheet_id"], ["CRM Lead", "Erledigt", "Lead erstellt und Pipeline gestartet", lead_url, ts])
            # Slack: kurzer Einzeiler
            await slack_message(f":white_check_mark: {company} - CRM Lead wurde erstellt")
            # Kunden-Channel = Firmenname (sauber, ohne Prefix).
            base_name = company.lower().replace(" ", "-").replace("ü", "ue").replace("ä", "ae").replace("ö", "oe").replace("ß", "ss")

            # Auto-Cleanup: bestehende AKTIVE Channels die den Firmennamen enthalten
            # (z.B. von früheren Runs: novacode-gmbh, client-novacode-gmbh-*) erst
            # umbenennen damit der Name freigegeben wird, dann archivieren.
            try:
                list_resp = await slack_bot_api("conversations.list", {
                    "exclude_archived": "true",
                    "types": "public_channel",
                    "limit": 1000,
                })
                if list_resp.get("ok"):
                    old_active = [c for c in list_resp.get("channels", [])
                                  if base_name in c.get("name", "").lower()]
                    for old in old_active:
                        old_id = old.get("id")
                        old_name = old.get("name", "")
                        if not old_id:
                            continue
                        try:
                            arch_name = f"zz-arch-{old_name}"[:80]
                            rename_resp = await slack_bot_api("conversations.rename", {
                                "channel": old_id,
                                "name": arch_name,
                            })
                            if not rename_resp.get("ok"):
                                log.warning(f"Slack rename #{old_name}: {rename_resp.get('error')}")
                            await slack_bot_api("conversations.archive", {"channel": old_id})
                            log.info(f"Slack: alter Channel #{old_name} → #{arch_name} (archiviert)")
                        except Exception as e:
                            log.warning(f"Slack: konnte #{old_name} nicht aufräumen: {e}")
            except Exception as e:
                log.warning(f"Slack Auto-Cleanup übersprungen: {e}")

            channel_name = base_name[:80]
            ch = await slack_bot_api("conversations.create", {
                "name": channel_name,
                "is_private": False,
            })
            channel_id = None
            # Fallback bei name_taken (z.B. weil sehr alter archivierter Channel den Namen reserviert)
            if ch.get("error") == "name_taken":
                for i in range(2, 10):
                    candidate = f"{base_name}-{i}"[:80]
                    ch = await slack_bot_api("conversations.create", {
                        "name": candidate,
                        "is_private": False,
                    })
                    if ch.get("ok"):
                        channel_name = candidate
                        break
                    if ch.get("error") != "name_taken":
                        break
            if ch.get("ok"):
                channel_id = ch["channel"]["id"]
                log.info(f"Slack Channel erstellt: #{channel_name} ({channel_id})")
                # Team-Mitglieder zum Channel einladen
                if SLACK_TEAM_MEMBERS:
                    invite_resp = await slack_bot_api("conversations.invite", {
                        "channel": channel_id,
                        "users": ",".join(SLACK_TEAM_MEMBERS),
                    })
                    if invite_resp.get("ok"):
                        log.info(f"Slack: {len(SLACK_TEAM_MEMBERS)} Team-Mitglieder eingeladen")
                    else:
                        log.warning(f"Slack Invite: {invite_resp.get('error')}")
                # Kunden per Slack Connect einladen (externer Gast)
                client_email = context.get("email")
                if client_email:
                    invite_shared = await slack_bot_api("conversations.inviteShared", {
                        "channel": channel_id,
                        "emails": client_email,
                    })
                    if invite_shared.get("ok"):
                        log.info(f"Slack: Kunde {client_email} per Slack Connect eingeladen")
                    else:
                        err = invite_shared.get("error", "unknown")
                        log.warning(f"Slack Connect Invite fehlgeschlagen: {err} (kein Fallback-Post im Channel)")

                # Channel-Beschreibung setzen
                await slack_bot_api("conversations.setTopic", {
                    "channel": channel_id,
                    "topic": f"Recruiting Automation - {company}",
                })
                # Willkommensnachricht: Projekt-Uebersicht
                welcome_blocks = _slack_blocks_message(
                    f":wave: Willkommen, {company}!",
                    [
                        {"text": "Hier koordinieren wir alles rund um euer Recruiting-Projekt. Wir melden uns hier mit Updates und ihr könnt jederzeit Fragen stellen."},
                    ],
                    footer="Flowstack Recruiting Automation",
                )
                await slack_bot_api("chat.postMessage", {
                    "channel": channel_id,
                    "text": f"Willkommen im Projekt-Channel, {company}!",
                    "blocks": welcome_blocks,
                })
                # Persoenliche Willkommensnachrichten von jedem Teammitglied
                import asyncio
                contact_name = context.get("contact", "").split()[0] if context.get("contact") else company
                await asyncio.sleep(1)
                await slack_bot_api("chat.postMessage", {
                    "channel": channel_id,
                    "text": f"Hey {contact_name}! :wave: Ich bin Claudio und kümmere mich um eure Strategie, Positionierung und den gesamten Projektablauf. Wenn irgendwas unklar ist oder ihr Fragen habt, einfach hier rein damit. Freue mich auf die Zusammenarbeit mit euch!",
                    "username": "Claudio Di Franco",
                    "icon_url": "https://ca.slack-edge.com/T0AAEHFN8GH-U0AA1KHD0G2-gae40f8c7598-512",
                })
                await asyncio.sleep(0.5)
                await slack_bot_api("chat.postMessage", {
                    "channel": channel_id,
                    "text": f"Hey {contact_name}! :rocket: Ich bin Anak - bei mir liegt die technische Umsetzung: Funnel, Tracking, Kampagnen-Setup, alles was mit Tech zu tun hat. Falls technisch irgendwas klemmt, bin ich euer Ansprechpartner. Willkommen an Bord!",
                    "username": "Anak",
                    "icon_url": "https://ca.slack-edge.com/T0AAEHFN8GH-U0A9L6KUT5M-g2f3e8b1c4d7-512",
                })
            else:
                log.error(f"Slack Channel erstellen fehlgeschlagen: {ch.get('error')}")
            # Deep-Link zum Channel (nur wenn Channel erstellt) - Sheet-IDs im result behalten,
            # damit sie via side-effects.ts Context-Merge für is05/is06/is09/kc06/cc05/rl06/rl12 verfügbar sind.
            result = {
                "sent": True,
                "channel_id": channel_id,
                "channel_name": channel_name,
                "overview_sheet_id": sheet_info["spreadsheet_id"],
                "overview_sheet_url": sheet_info["url"],
            }
            if channel_id:
                result["url"] = f"https://app.slack.com/client/{SLACK_TEAM_ID}/{channel_id}"
                ts2 = datetime.now().strftime('%d.%m.%Y %H:%M')
                await _append_sheet_row(sheet_info["spreadsheet_id"], ["Slack Channel", "Erstellt", f"#{channel_name} mit Team + Kunde", result["url"], ts2])

        elif node_id == "is04":
            # Upload-Link: Bilder-Ordner (Bilder/Materialien für den Kunden)
            # Prioritaet: upload_folder_id (= Bilder) > folder_root_id > Fallback
            upload_folder_id = context.get("upload_folder_id")
            folder_root_id = context.get("folder_root_id")
            if upload_folder_id:
                context["upload_link"] = f"https://drive.google.com/drive/folders/{upload_folder_id}"
                log.info(f"Email Upload-Link: Bilder Ordner ({upload_folder_id})")
            elif folder_root_id:
                context["upload_link"] = f"https://drive.google.com/drive/folders/{folder_root_id}"
                log.warning(f"Email Upload-Link: Fallback auf Root-Ordner ({folder_root_id}) - upload_folder_id fehlt im Context")
            else:
                log.error("Email Upload-Link: Weder upload_folder_id noch folder_root_id im Context! is06 muss vor is04 laufen.")
            result = await send_welcome_email(context)
            # Gmail-Inbox-Link für Klick-Through (statt Deep-Link auf einzelne Message)
            result["url"] = "https://mail.google.com/mail/u/0/#sent"
            ts = datetime.now().strftime('%d.%m.%Y %H:%M')
            upload_link = context.get("upload_link", "")
            await _append_sheet_row(context.get("overview_sheet_id"), ["Willkommens-E-Mail", "Erledigt", f"An {context.get('email', '')} gesendet", upload_link, ts])

        elif node_id == "is05":
            result = await create_calendar_event(context)
            event_id = result.get("event_id") or context.get("event_id") if isinstance(result, dict) else None
            if event_id:
                result["url"] = f"https://calendar.google.com/calendar/u/0/r/eventedit/{event_id}"
            # Projekt-Übersicht: Zeile anhängen
            company = context.get("company", "Novacode GmbH")
            event_link = result.get("link", "")
            ts = datetime.now().strftime('%d.%m.%Y %H:%M')
            await _append_sheet_row(context.get("overview_sheet_id"), ["Kickoff-Termin", "Erledigt", "Einladung an Client gesendet", event_link, ts])
            await slack_message(f":calendar: {company} - Kickoff-Termin wurde erstellt")

        elif node_id == "is06":
            result = await create_drive_folders(context)
            # Context sofort mit Folder-IDs anreichern, damit is04/is07/is09 im selben Request-Batch
            # die korrekten IDs lesen, selbst wenn Frontend noch nicht re-sended hat.
            if result.get("root_id"):
                context["folder_root_id"] = result["root_id"]
            if result.get("upload_folder_id"):
                context["upload_folder_id"] = result["upload_folder_id"]
            if result.get("subfolders"):
                context["subfolders"] = result["subfolders"]
            folder_url = result.get("url", "")
            company = context.get("company", "Novacode GmbH")
            if folder_url:
                # Projekt-Übersicht: Zeile anhängen
                ts = datetime.now().strftime('%d.%m.%Y %H:%M')
                await _append_sheet_row(context.get("overview_sheet_id"), ["Google Drive", "Erledigt", "8 Hauptordner + Unterordner angelegt", folder_url, ts])
                # Spreadsheet in Client-Ordner verschieben
                sheet_id = context.get("overview_sheet_id")
                folder_root_id = context.get("folder_root_id")
                if sheet_id and folder_root_id:
                    try:
                        await google_api("PATCH", f"https://www.googleapis.com/drive/v3/files/{sheet_id}?addParents={folder_root_id}", {})
                    except Exception as e:
                        log.warning(f"Spreadsheet in Drive verschieben fehlgeschlagen: {e}")
                await slack_message(f":file_folder: {company} - Google Drive Ordner wurde erstellt")

        elif node_id == "is07":
            # Drive: Master-Docs pro Kunde in die passenden Unterordner duplizieren
            folder_root_id = context.get("folder_root_id")
            subfolders: dict[str, str] = context.get("subfolders") or {}
            # Fachlich sinnvolle Ablage pro Doc-Typ
            DOC_TARGET_FOLDER = {
                "Doc 1 Strategie": "02_Strategie",
                "Doc 2 Messaging": "02_Strategie",
                "Doc 3 Creative Briefing": "02_Strategie",
                "Doc 4 Ads-Copy": "06_Anzeigen",
                "Doc 5 Kickoff": "08_Transkripte",
            }
            if not folder_root_id:
                result = {"templates_duplicated": False, "url": ""}
            else:
                company = context.get("company", "Novacode GmbH")
                client_docs: dict[str, str] = {}
                for label, master_url in MASTER_DOCS.items():
                    try:
                        master_id = master_url.split("/d/")[1].split("/")[0]
                        target_folder_name = DOC_TARGET_FOLDER.get(label)
                        target_parent = subfolders.get(target_folder_name) if target_folder_name else None
                        parent_id = target_parent or folder_root_id
                        display = DOC_DISPLAY_NAME.get(label, label)
                        copy = await google_api(
                            "POST",
                            f"https://www.googleapis.com/drive/v3/files/{master_id}/copy?supportsAllDrives=true",
                            {"name": f"{display} - {company}", "parents": [parent_id]},
                        )
                        client_docs[label] = f"https://docs.google.com/document/d/{copy['id']}/edit"
                    except Exception as e:
                        log.warning(f"is07 Template-Copy {label} fehlgeschlagen: {e}")
                        client_docs[label] = master_url  # Fallback auf Master
                result = {
                    "url": f"https://drive.google.com/drive/folders/{folder_root_id}",
                    "templates_duplicated": len(client_docs) > 0,
                    "client_docs": client_docs,
                }
                # Projekt-Übersicht: eine Zeile pro dupliziertem Dokument
                sheet_id = context.get("overview_sheet_id")
                if sheet_id:
                    ts = datetime.now().strftime('%d.%m.%Y %H:%M')
                    rows = [["Client-Dokumente", "Erstellt", f"{len(client_docs)} Master-Docs dupliziert", result["url"], ts]]
                    for label, url in client_docs.items():
                        display = DOC_DISPLAY_NAME.get(label, label)
                        rows.append([f"  → {display}", "-", "", url, ""])
                    await _append_sheet_rows(sheet_id, rows)

        elif node_id == "is08":
            result = await create_clickup_project(context)
            # Projekt-Übersicht: Zeile anhängen (Liste existiert, aber Tasks kommen in is09)
            list_id = result.get("list_id") if isinstance(result, dict) else None
            if list_id:
                result["url"] = f"https://app.clickup.com/{CLICKUP_TEAM_ID}/v/li/{list_id}"
            if list_id:
                ts = datetime.now().strftime('%d.%m.%Y %H:%M')
                clickup_url = f"https://app.clickup.com/{CLICKUP_TEAM_ID}/v/li/{list_id}"
                await _append_sheet_row(context.get("overview_sheet_id"), ["ClickUp List angelegt", "Erledigt", "Kundenliste in ClickUp erstellt", clickup_url, ts])

        elif node_id == "is09":
            list_id = context.get("list_id")
            if list_id:
                result = await create_clickup_tasks(context)
                if isinstance(result, dict):
                    result["url"] = f"https://app.clickup.com/{CLICKUP_TEAM_ID}/v/li/{list_id}"
                company = context.get("company", "Novacode GmbH")
                clickup_url = f"https://app.clickup.com/{CLICKUP_TEAM_ID}/v/li/{list_id}"
                ts = datetime.now().strftime('%d.%m.%Y %H:%M')
                await _append_sheet_row(context.get("overview_sheet_id"), ["ClickUp Projekt", "Erledigt", "3 Tasks erstellt", clickup_url, ts])
                await slack_message(f":memo: {company} - ClickUp Projekt wurde erstellt")

        elif node_id == "is10":
            result = await update_close_stage({
                **context,
                "stage": "Kickoff geplant",
                "automation_status": "Warte auf Kickoff",
            })
            if isinstance(result, dict) and not result.get("url"):
                lead_id_for_url = context.get("lead_id", "")
                if lead_id_for_url:
                    result["url"] = f"https://app.close.com/lead/{lead_id_for_url}/"
            ts = datetime.now().strftime('%d.%m.%Y %H:%M')
            lead_id = context.get("lead_id", "")
            close_url = f"https://app.close.com/lead/{lead_id}/" if lead_id else ""
            await _append_sheet_row(context.get("overview_sheet_id"), ["Close: Kickoff geplant", "Warte auf Kickoff", "Automations-Status aktualisiert", close_url, ts])

            # Konsolidierte Ressourcen-Note in Close: alle erzeugten Links an einem Platz
            if lead_id:
                try:
                    cdocs = context.get("client_docs") or {}
                    folder_root_id = context.get("folder_root_id")
                    upload_folder_id = context.get("upload_folder_id")
                    sheet_id = context.get("overview_sheet_id")
                    channel_id = context.get("channel_id")
                    channel_name = context.get("channel_name")
                    list_id = context.get("list_id")
                    event_id = context.get("event_id")

                    lines: list[str] = ["Fulfillment-Ressourcen für diesen Lead:"]
                    if folder_root_id:
                        lines.append(f"- Drive Kundenordner: https://drive.google.com/drive/folders/{folder_root_id}")
                    if upload_folder_id:
                        lines.append(f"- Upload-Ordner (für Client): https://drive.google.com/drive/folders/{upload_folder_id}")
                    if sheet_id:
                        lines.append(f"- Projekt-Übersicht: https://docs.google.com/spreadsheets/d/{sheet_id}/edit")
                    if list_id:
                        lines.append(f"- ClickUp-Liste: https://app.clickup.com/{CLICKUP_TEAM_ID}/v/li/{list_id}")
                    if channel_id:
                        label = channel_name or channel_id
                        lines.append(f"- Slack-Channel: #{label} (id {channel_id})")
                    if event_id:
                        lines.append(f"- Kickoff-Termin (Event-ID): {event_id}")
                    if cdocs:
                        lines.append("- Client-Dokumente:")
                        for label, url in cdocs.items():
                            display = DOC_DISPLAY_NAME.get(label, label)
                            lines.append(f"    * {display}: {url}")
                    await close_api("POST", "/activity/note/", {
                        "lead_id": lead_id,
                        "note": "\n".join(lines),
                    })
                    log.info(f"Close Ressourcen-Note angehängt an Lead {lead_id}")
                except Exception as e:
                    log.warning(f"Close Ressourcen-Note fehlgeschlagen: {e}")

        # is11 (Miro) gehört nicht zu V1 - nur V3 nutzt v3-is11 über /api/v3/execute-node.

        # ── Kickoff & Transcript ──
        elif node_id == "kc05":
            result = await update_close_stage({
                **context,
                "stage": "Kickoff abgeschlossen",
                "automation_status": "Strategie in Arbeit",
            })
            if isinstance(result, dict) and not result.get("url"):
                lead_id_for_url = context.get("lead_id", "")
                if lead_id_for_url:
                    result["url"] = f"https://app.close.com/lead/{lead_id_for_url}/"
            ts = datetime.now().strftime('%d.%m.%Y %H:%M')
            lead_id = context.get("lead_id", "")
            close_url = f"https://app.close.com/lead/{lead_id}/" if lead_id else ""
            await _append_sheet_row(context.get("overview_sheet_id"), ["Close: Kickoff abgeschlossen", "Strategie in Arbeit", "Strategie-Erstellung startet", close_url, ts])
            # ClickUp: Neue Tasks für nächste manuelle Schritte (KEIN Auto-Complete)
            list_id = context.get("list_id")
            task_ids = dict(context.get("task_ids", {}))
            company = context.get("company", "Novacode GmbH")
            if list_id:
                folder_root_id = context.get("folder_root_id", "")
                drive_url = f"https://drive.google.com/drive/folders/{folder_root_id}" if folder_root_id else ""

                # Task: Videodreh planen
                desc_vid = f"Videodreh mit {company} organisieren für Recruiting-Content.\n"
                if drive_url: desc_vid += f"\nGoogle Drive: {drive_url}\n"
                t = await _create_task(
                    list_id, f"Videodreh planen - {company}", desc_vid,
                    [CLICKUP_CLAUDIO], 2, 5,  # High, +5 Tage
                    [
                        "Drehtag mit Kunden abstimmen",
                        "Shot-Liste erstellen (Büro, Team, Arbeitsalltag)",
                        "Equipment organisieren",
                        "Anfahrt und Zeitplan klären",
                    ],
                )
                task_ids["videodreh_planen"] = t["id"]

                # Task: Strategie reviewen
                desc = f"KI-generierte Strategie-Dokumente für {company} prüfen.\n\n"
                if drive_url: desc += f"Google Drive: {drive_url}\n"
                t = await _create_task(
                    list_id, f"Strategie reviewen - {company}", desc,
                    [CLICKUP_CLAUDIO], 2, 3,  # High, +3 Tage
                    [
                        "Zielgruppen-Avatar: Passt zur Branche und Position?",
                        "Messaging: USPs differenzieren sich vom Wettbewerb?",
                        "Creative Briefing: Bildsprache passt zur Marke?",
                        "Feedback an KI-Docs einarbeiten falls nötig",
                    ],
                )
                task_ids["strategy_review"] = t["id"]
                result["task_ids"] = task_ids

        elif node_id == "kc06":
            company = context.get("company", "Novacode GmbH")
            ts = datetime.now().strftime('%d.%m.%Y %H:%M')
            kickoff_doc = _client_docs(context).get("Doc 5 Kickoff", TRANSCRIPT_DOC)
            channel_id_kc06 = context.get("channel_id")
            if channel_id_kc06 and SLACK_TEAM_ID:
                result = result if isinstance(result, dict) else {}
                result["url"] = f"https://app.slack.com/client/{SLACK_TEAM_ID}/{channel_id_kc06}"
            await _append_sheet_row(context.get("overview_sheet_id"), ["Kickoff", "Abgeschlossen", "Strategie-Erstellung startet automatisch", kickoff_doc, ts])
            await slack_message(f":white_check_mark: {company} - Kickoff wurde abgeschlossen")
            result = {"sent": True}
            if context.get("channel_id"):
                result["url"] = f"https://app.slack.com/client/{SLACK_TEAM_ID}/{context['channel_id']}"

        # ── Strategy & Brand ──
        elif node_id == "st10":
            result = await update_close_stage({
                **context,
                "stage": "Strategie erstellt",
                "automation_status": "Strategie erstellt",
            })
            if isinstance(result, dict) and not result.get("url"):
                lead_id_for_url = context.get("lead_id", "")
                if lead_id_for_url:
                    result["url"] = f"https://app.close.com/lead/{lead_id_for_url}/"
            # ClickUp: Neue Tasks für nächste manuelle Schritte (KEIN Auto-Complete)
            list_id = context.get("list_id")
            task_ids = dict(context.get("task_ids", {}))
            company = context.get("company", "Novacode GmbH")
            strategy_docs = _resolve_docs(context, ["Doc 1 Strategie", "Doc 2 Messaging", "Doc 3 Creative Briefing"])
            if list_id:
                # Task: Texte reviewen & freigeben
                desc = f"KI-generierte Texte für {company} prüfen und freigeben.\n\n"
                desc += "Strategie-Docs als Referenz:\n"
                for label, url in strategy_docs.items():
                    display = DOC_DISPLAY_NAME.get(label, label)
                    desc += f"- {display}: {url}\n"
                t = await _create_task(
                    list_id, f"Texte reviewen & freigeben - {company}", desc,
                    [CLICKUP_CLAUDIO], 2, 4,  # High, +4 Tage
                    [
                        "Strategie-Doc: Tabs Kandidaten-Persona und Arbeitgeber-Profil prüfen",
                        "Messaging-Doc: Kern-Botschaft und Angles freigegeben",
                        "Creative Briefing: Brand-Basics und Format-Specs final",
                        "Kein Bullshit-Marketing, authentisch und direkt?",
                        "Kundenfeedback einholen falls gewünscht",
                    ],
                )
                task_ids["copy_review"] = t["id"]
                await _attach_docs_to_task(t["id"], strategy_docs)

                # Task: Videodreh durchführen
                t = await _create_task(
                    list_id, f"Videodreh durchführen - {company}",
                    f"Recruiting-Video für {company} drehen.\n",
                    [CLICKUP_CLAUDIO], 1, 7,  # Urgent, +7 Tage
                    [
                        "Drehtag durchgeführt",
                        "Rohmaterial gesichtet und gesichert",
                        "Beste Takes markiert",
                        "Rohmaterial im Drive Bilder-Ordner hochgeladen",
                    ],
                )
                task_ids["videodreh"] = t["id"]
                result["task_ids"] = task_ids
            # Projekt-Übersicht + Slack: Strategie fertig
            company = context.get("company", "Novacode GmbH")
            folder_root_id_slack = context.get("folder_root_id", "")
            drive_url_slack = f"https://drive.google.com/drive/folders/{folder_root_id_slack}" if folder_root_id_slack else ""
            ts = datetime.now().strftime('%d.%m.%Y %H:%M')
            sheet_id = context.get("overview_sheet_id")
            rows = [["Strategie & Brand", "Erledigt", f"{len(strategy_docs)} Dokumente erstellt", drive_url_slack, ts]]
            for label, url in strategy_docs.items():
                display = DOC_DISPLAY_NAME.get(label, label)
                rows.append([f"  → {display}", "-", "", url, ""])
            await _append_sheet_rows(sheet_id, rows)
            await slack_message(f":dart: {company} - Strategie & Brand wurde fertiggestellt")

        # ── Copy Creation ──
        elif node_id == "cc05":
            result = await update_close_stage({
                **context,
                "stage": "Assets erstellt",
                "automation_status": "Assets erstellt",
            })
            if isinstance(result, dict) and not result.get("url"):
                lead_id_for_url = context.get("lead_id", "")
                if lead_id_for_url:
                    result["url"] = f"https://app.close.com/lead/{lead_id_for_url}/"
            # ClickUp: Neue Tasks für nächste manuelle Schritte (KEIN Auto-Complete)
            list_id = context.get("list_id")
            task_ids = dict(context.get("task_ids", {}))
            company = context.get("company", "Novacode GmbH")
            if list_id:
                # Task: Video schneiden
                t = await _create_task(
                    list_id, f"Video schneiden - {company}",
                    f"Recruiting-Video für {company} schneiden und exportieren.\n",
                    [CLICKUP_ANAK], 2, 5,  # High, +5 Tage
                    [
                        "60s Recruiting-Video geschnitten (Hook-Problem-Lösung-CTA)",
                        "3 kurze Varianten für Retargeting (15-20s)",
                        "Untertitel eingebaut",
                        "Formate: 1080x1080 + 1080x1920 exportiert",
                        "Im Drive Bilder-Ordner hochgeladen",
                    ],
                )
                task_ids["video_schneiden"] = t["id"]

                # Task: Funnel & Pixel prüfen
                events_url = f"https://business.facebook.com/events_manager2/list/pixel/{META_PIXEL_ID}/overview" if META_PIXEL_ID else ""
                desc2 = f"Recruiting-Funnel und Pixel für {company} testen.\n\n"
                desc2 += "Ressourcen:\n"
                for name, url in FUNNEL_LINKS.items():
                    desc2 += f"- {name}: {url}\n"
                if events_url: desc2 += f"- Meta Events Manager: {events_url}\n"
                t = await _create_task(
                    list_id, f"Funnel & Pixel prüfen - {company}", desc2,
                    [CLICKUP_ANAK], 1, 3,  # Urgent, +3 Tage
                    [
                        "Alle Seiten auf Desktop + Mobile getestet",
                        "Formular-Submit funktioniert",
                        "Pixel feuert: ViewContent, AddToCart, Lead",
                        "Events im Meta Events Manager sichtbar",
                        "Ladezeit unter 3 Sekunden",
                    ],
                )
                task_ids["funnel_review"] = t["id"]
                funnel_docs = {**FUNNEL_LINKS}
                if events_url: funnel_docs["Meta Events Manager"] = events_url
                await _attach_docs_to_task(t["id"], funnel_docs)
                result["task_ids"] = task_ids
            # Projekt-Übersicht + Slack: Copy fertig
            company = context.get("company", "Novacode GmbH")
            folder_root_id_slack = context.get("folder_root_id", "")
            drive_url_slack = f"https://drive.google.com/drive/folders/{folder_root_id_slack}" if folder_root_id_slack else ""
            ts = datetime.now().strftime('%d.%m.%Y %H:%M')
            sheet_id = context.get("overview_sheet_id")
            copy_docs = _resolve_docs(context, ["Doc 4 Ads-Copy"])
            rows = [["Copy & Texte", "Erledigt", f"{len(copy_docs)} Dokumente erstellt", drive_url_slack, ts]]
            for label, url in copy_docs.items():
                display = DOC_DISPLAY_NAME.get(label, label)
                rows.append([f"  → {display}", "-", "", url, ""])
            await _append_sheet_rows(sheet_id, rows)
            await slack_message(f":pencil2: {company} - Copy Assets wurden fertiggestellt")

        # ── Review & Launch ──
        elif node_id == "rl06":
            channel_id_rl06 = context.get("channel_id")
            if channel_id_rl06 and SLACK_TEAM_ID:
                if not isinstance(result, dict): result = {}
                result["url"] = f"https://app.slack.com/client/{SLACK_TEAM_ID}/{channel_id_rl06}"
            company = context.get("company", "Novacode GmbH")
            # Projekt-Übersicht + Slack: Asset-Paket bereit
            ts = datetime.now().strftime('%d.%m.%Y %H:%M')
            sheet_id = context.get("overview_sheet_id")
            rows = [["Asset-Paket", "Bereit", "Alle Assets zusammengestellt", "", ts]]
            for name, url in FUNNEL_LINKS.items():
                rows.append([f"  → {name}", "-", "", url, ""])
            rows.append(["  → Tracking Sheet", "-", "", TRACKING_SHEET, ""])
            rows.append(["  → Tracking Dashboard", "-", "", TRACKING_DASHBOARD, ""])
            await _append_sheet_rows(sheet_id, rows)
            await slack_message(f":package: {company} - Asset-Paket ist bereit")
            result = {"sent": True}
            if context.get("channel_id"):
                result["url"] = f"https://app.slack.com/client/{SLACK_TEAM_ID}/{context['channel_id']}"

        elif node_id == "rl07":
            result = await update_close_stage({
                **context,
                "stage": "Warte auf Freigabe",
                "automation_status": "Warte auf Freigabe",
            })
            if isinstance(result, dict) and not result.get("url"):
                lead_id_for_url = context.get("lead_id", "")
                if lead_id_for_url:
                    result["url"] = f"https://app.close.com/lead/{lead_id_for_url}/"
            # ClickUp: Zielgruppen-QA + Kampagnen-Review erstellen
            list_id = context.get("list_id")
            task_ids = dict(context.get("task_ids", {}))
            if list_id:
                ads_url = f"https://adsmanager.facebook.com/adsmanager/manage/campaigns?act={_meta_acct_numeric()}" if META_AD_ACCOUNT else ""
                events_url = f"https://business.facebook.com/events_manager2/list/pixel/{META_PIXEL_ID}/overview" if META_PIXEL_ID else ""
                # Task 8: Zielgruppen- & Pixel-QA
                desc = "Custom Audiences und Pixel-Events final prüfen vor Kampagnen-Launch.\n\n"
                desc += "Ressourcen:\n"
                if ads_url: desc += f"- Meta Ads Manager: {ads_url}\n"
                if events_url: desc += f"- Meta Events Manager: {events_url}\n"
                desc += f"- Tracking Sheet: {TRACKING_SHEET}\n"
                desc += f"- Tracking Dashboard: {TRACKING_DASHBOARD}\n"
                t = await _create_task(
                    list_id, "Zielgruppen- & Pixel-QA", desc,
                    [CLICKUP_CLAUDIO], 1, 2,  # Urgent, +2 Tage
                    [
                        "Custom Audience 'AllVisitors_30d': Erstellt und Status aktiv",
                        "Custom Audience 'LP_Visitors_NoApplication_7d': Erstellt und Status aktiv",
                        "Custom Audience 'Application_Visitors_NoLead_7d': Erstellt und Status aktiv",
                        "Pixel-Events der letzten 24h im Events Manager sichtbar",
                        "Event-Matching-Qualität: Gut oder Sehr gut",
                        "Aggregated Event Measurement: Lead auf Priorität 1",
                        "Alle Audiences korrekt in Anzeigengruppen zugewiesen",
                    ],
                )
                task_ids["audience_qa"] = t["id"]
                qa_docs = {"Tracking Sheet": TRACKING_SHEET, "Tracking Dashboard": TRACKING_DASHBOARD}
                if ads_url: qa_docs["Meta Ads Manager"] = ads_url
                if events_url: qa_docs["Meta Events Manager"] = events_url
                await _attach_docs_to_task(t["id"], qa_docs)
                # Task 9: Kampagnen-Review
                desc2 = "Alle 3 Meta-Kampagnen (Kaltakquise, Retargeting, Warmup) vor Launch prüfen.\n\n"
                desc2 += "Ressourcen:\n"
                if ads_url: desc2 += f"- Meta Ads Manager: {ads_url}\n"
                ads_copy_url = _client_docs(context).get("Doc 4 Ads-Copy", "")
                desc2 += f"- Ads-Copy (Kalt/Retargeting/Warmup/Videoskripte): {ads_copy_url}\n"
                desc2 += f"- Funnel: {FUNNEL_LINKS.get('Landingpage', '')}\n"
                t = await _create_task(
                    list_id, "Kampagnen-Review", desc2,
                    [CLICKUP_CLAUDIO], 1, 2,  # Urgent, +2 Tage
                    [
                        "TOF: Objective = Leads, Special Ad Category = Employment",
                        "TOF: 3 Ad Sets (Broad, Interest Recruiting, Interest Management)",
                        "TOF: Budget 30 EUR/Tag pro Ad Set",
                        "TOF: Placement Facebook Feed + Instagram Feed (NICHT Advantage+)",
                        "TOF: Region NRW/DE, Alter 20-55",
                        "TOF: Je 3 Creatives pro Ad Set mit korrekten Bildern",
                        "TOF: CTA 'Jetzt bewerben', Ziel-URL = Landingpage",
                        "RT: 3 Ad Sets mit je einer Custom Audience verknüpft",
                        "RT: Budget 5-10 EUR/Tag pro Ad Set",
                        "RT: Placement Auto",
                        "RT: Creatives = Reminder, Objection-Handling, Urgency",
                        "WU: Objective = Video Views (Awareness)",
                        "WU: Budget 5-10 EUR/Tag",
                        "Alle Anzeigentexte korrekt (keine Tippfehler)",
                        "Alle Bilder/Videos hochgeladen und zugewiesen",
                        "Ziel-URLs korrekt (Landingpage für TOF+WU, Formular für RT)",
                    ],
                )
                task_ids["campaign_review"] = t["id"]
                campaign_docs = {
                    "Meta Ads Manager": ads_url,
                    "Ads-Copy": ads_copy_url,
                    "Landingpage": FUNNEL_LINKS.get("Landingpage", ""),
                }
                await _attach_docs_to_task(t["id"], {k: v for k, v in campaign_docs.items() if v})
                result["task_ids"] = task_ids
            ts = datetime.now().strftime('%d.%m.%Y %H:%M')
            lead_id = context.get("lead_id", "")
            close_url = f"https://app.close.com/lead/{lead_id}/" if lead_id else ""
            await _append_sheet_row(context.get("overview_sheet_id"), ["Close: Warte auf Freigabe", "Offen", "QA- und Review-Tasks erstellt", close_url, ts])

        elif node_id == "rl09":
            result = await update_close_stage({
                **context,
                "stage": "Bereit für Launch",
                "automation_status": "Bereit für Launch",
            })
            if isinstance(result, dict) and not result.get("url"):
                lead_id_for_url = context.get("lead_id", "")
                if lead_id_for_url:
                    result["url"] = f"https://app.close.com/lead/{lead_id_for_url}/"
            ts = datetime.now().strftime('%d.%m.%Y %H:%M')
            lead_id = context.get("lead_id", "")
            close_url = f"https://app.close.com/lead/{lead_id}/" if lead_id else ""
            await _append_sheet_row(context.get("overview_sheet_id"), ["Close: Bereit für Launch", "Freigegeben", "Launch kann starten", close_url, ts])

        elif node_id == "rl11":
            result = await update_close_stage({
                **context,
                "stage": "Live",
                "automation_status": "Live",
            })
            if isinstance(result, dict) and not result.get("url"):
                lead_id_for_url = context.get("lead_id", "")
                if lead_id_for_url:
                    result["url"] = f"https://app.close.com/lead/{lead_id_for_url}/"
            # ClickUp: Neue Tasks für Launch (KEIN Auto-Complete)
            list_id = context.get("list_id")
            task_ids = dict(context.get("task_ids", {}))
            ads_url = f"https://adsmanager.facebook.com/adsmanager/manage/campaigns?act={_meta_acct_numeric()}" if META_AD_ACCOUNT else ""
            if list_id:
                company = context.get("company", "Novacode GmbH")
                # Task: Kampagnen prüfen & aktivieren
                desc = f"Alle Kampagnen für {company} prüfen und live schalten.\n\n"
                if ads_url: desc += f"Meta Ads Manager: {ads_url}\n"
                t = await _create_task(
                    list_id, f"Kampagnen prüfen & aktivieren - {company}", desc,
                    [CLICKUP_CLAUDIO], 1, 2,  # Urgent, +2 Tage
                    [
                        "Alle Creatives korrekt zugewiesen?",
                        "Budgets stimmen (30 EUR/Tag TOF, 5-10 EUR/Tag RT+WU)?",
                        "Zielgruppen korrekt (Region, Alter)?",
                        "Ziel-URLs alle richtig?",
                        "Kampagnen auf Aktiv schalten",
                    ],
                )
                task_ids["kampagnen_aktivieren"] = t["id"]
                if ads_url:
                    await _attach_docs_to_task(t["id"], {"Meta Ads Manager": ads_url})

                # Task: Erste Woche Monitoring
                desc2 = f"Kampagnen-Performance für {company} in der ersten Woche überwachen.\n\n"
                desc2 += "Ressourcen:\n"
                if ads_url: desc2 += f"- Meta Ads Manager: {ads_url}\n"
                desc2 += f"- Tracking Sheet: {TRACKING_SHEET}\n"
                desc2 += f"- Tracking Dashboard: {TRACKING_DASHBOARD}\n"
                t = await _create_task(
                    list_id, f"Erste Woche Monitoring - {company}", desc2,
                    [CLICKUP_CLAUDIO, CLICKUP_ANAK], 2, 7,  # High, +7 Tage
                    [
                        "Tag 1: Auslieferung gestartet (Impressions > 0)",
                        "Tag 3: CPM < 15 EUR, CTR > 0.5%?",
                        "Tag 3: Erste Bewerbungen eingegangen?",
                        "Tag 5: Budget wird ausgeschöpft?",
                        "Tag 7: Performance-Report erstellen",
                        "Tag 7: Underperformer pausieren",
                        "Kunde über Ergebnisse informieren",
                    ],
                )
                task_ids["monitoring"] = t["id"]
                result["task_ids"] = task_ids
            ts = datetime.now().strftime('%d.%m.%Y %H:%M')
            lead_id = context.get("lead_id", "")
            close_url = f"https://app.close.com/lead/{lead_id}/" if lead_id else ""
            await _append_sheet_row(context.get("overview_sheet_id"), ["Close: Live", "Live", "Recruiting-Funnel ist aktiv", close_url, ts])

        elif node_id == "rl12":
            channel_id_rl12 = context.get("channel_id")
            if channel_id_rl12 and SLACK_TEAM_ID:
                if not isinstance(result, dict): result = {}
                result["url"] = f"https://app.slack.com/client/{SLACK_TEAM_ID}/{channel_id_rl12}"
            company = context.get("company", "Novacode GmbH")
            launch_date = datetime.now().strftime('%d.%m.%Y %H:%M')
            ads_url = f"https://adsmanager.facebook.com/adsmanager/manage/campaigns?act={_meta_acct_numeric()}"
            # Projekt-Übersicht: letzte Zeile
            ts = launch_date
            await _append_sheet_row(context.get("overview_sheet_id"), ["Recruiting LIVE", "Gestartet", "3 Kampagnen aktiviert", ads_url, ts])
            # Slack: EINE finale Block Kit Nachricht mit Spreadsheet-Link
            overview_url = context.get("overview_sheet_url", "")
            blocks = _slack_blocks_message(
                f":rocket: {company} - Recruiting ist LIVE!",
                [{"text": "Alle Schritte abgeschlossen. Komplette Projekt-Übersicht:"}],
                buttons=[("Projekt-Übersicht öffnen", overview_url, "primary")] if overview_url else [],
                footer=f":zap: Flowstack Automation | {launch_date}",
            )
            await slack_message(f"{company} Recruiting ist LIVE!", blocks=blocks, color=SLACK_COLOR_SUCCESS)
            result = {"sent": True}
            if context.get("channel_id"):
                result["url"] = f"https://app.slack.com/client/{SLACK_TEAM_ID}/{context['channel_id']}"

        elif node_id == "rl13":
            # Performance-Sync - Meta Ads Insights → Client-Overview Sheet
            campaign_ids = []
            meta_campaigns = context.get("meta_campaigns", {})
            if meta_campaigns:
                campaign_ids = list(meta_campaigns.values())
            overview_sheet_id = context.get("overview_sheet_id")
            overview_sheet_url = context.get("overview_sheet_url") or TRACKING_SHEET

            synced_total = 0
            if campaign_ids and META_ACCESS_TOKEN and overview_sheet_id:
                ts = datetime.now().strftime('%d.%m.%Y %H:%M')
                rows: list[list] = [["Performance-Sync", "Start", f"{len(campaign_ids)} Kampagnen", "", ts]]
                for cid in campaign_ids:
                    insights = await _fetch_meta_campaign_insights(cid, "last_7d")
                    for day in insights:
                        spend = float(day.get("spend", 0))
                        leads = _extract_leads_from_actions(day.get("actions"))
                        cpl = round(spend / leads, 2) if leads > 0 else 0
                        name = day.get("campaign_name", f"Campaign {cid}")
                        date = day.get("date_start", "")
                        rows.append([name, date, f"Spend {spend:.2f} EUR", f"Leads {leads} / CPL {cpl:.2f}", ""])
                        synced_total += 1
                if synced_total > 0:
                    await _append_sheet_rows(overview_sheet_id, rows)
                result = {"synced": synced_total, "campaigns": len(campaign_ids), "url": overview_sheet_url}
            else:
                result = {"synced": 0, "note": "Meta oder Overview-Sheet nicht konfiguriert - Dashboard-Sync übersprungen", "url": overview_sheet_url}

        # ── Meta Zielgruppen & Kampagnen ──────────────────────────────────────
        # Spec: Phase 7 - Audience & Campaign Setup (Meta Ads)
        # Order: Audiences → Campaigns → Ad Sets → Ads

        elif node_id in ("ca01", "ca02", "ca03"):
            # Website Custom Audiences (Pixel-basiert)
            company = context.get("company", "Novacode GmbH")
            acct = _meta_acct()
            LP_URL = "www.flowstack-agentur.de/demo"
            FORM_URL = "www.flowstack-agentur.de/demo-bewerbung"
            THANKS_URL = "www.flowstack-agentur.de/demo-danke"

            if node_id == "ca01":
                name = "AllVisitors_30d"
                desc = "Alle Website-Besucher der letzten 30 Tage"
                rule = {"inclusions": {"operator": "or", "rules": [
                    {"event_sources": [{"id": META_PIXEL_ID, "type": "pixel"}], "retention_seconds": 2592000,
                     "filter": {"operator": "and", "filters": [{"field": "event", "operator": "=", "value": "PageView"}]}}
                ]}} if META_PIXEL_ID else None
                retention = 30
            elif node_id == "ca02":
                name = "LP_Visitors_NoApplication_7d"
                desc = "LP-Besucher ohne Bewerbung (7 Tage)"
                rule = {"inclusions": {"operator": "or", "rules": [
                    {"event_sources": [{"id": META_PIXEL_ID, "type": "pixel"}], "retention_seconds": 604800,
                     "filter": {"operator": "and", "filters": [{"field": "url", "operator": "i_contains", "value": LP_URL}]}}
                ]}, "exclusions": {"operator": "or", "rules": [
                    {"event_sources": [{"id": META_PIXEL_ID, "type": "pixel"}], "retention_seconds": 604800,
                     "filter": {"operator": "and", "filters": [{"field": "url", "operator": "i_contains", "value": FORM_URL}]}}
                ]}} if META_PIXEL_ID else None
                retention = 7
            else:  # ca03
                name = "Application_Visitors_NoLead_7d"
                desc = "Formular-Besucher ohne Lead (7 Tage)"
                rule = {"inclusions": {"operator": "or", "rules": [
                    {"event_sources": [{"id": META_PIXEL_ID, "type": "pixel"}], "retention_seconds": 604800,
                     "filter": {"operator": "and", "filters": [{"field": "url", "operator": "i_contains", "value": FORM_URL}]}}
                ]}, "exclusions": {"operator": "or", "rules": [
                    {"event_sources": [{"id": META_PIXEL_ID, "type": "pixel"}], "retention_seconds": 604800,
                     "filter": {"operator": "and", "filters": [{"field": "url", "operator": "i_contains", "value": THANKS_URL}]}}
                ]}} if META_PIXEL_ID else None
                retention = 7

            try:
                audience_name = f"{name}_{company.replace(' ', '_')}"
                payload: dict[str, Any] = {
                    "name": audience_name,
                    "description": desc,
                }
                if rule and META_PIXEL_ID:
                    # Meta erwartet rule als JSON-String, nicht als Dict
                    payload["rule"] = json.dumps(rule)
                    payload["retention_days"] = retention
                    payload["pixel_id"] = META_PIXEL_ID
                    payload["prefill"] = True
                else:
                    payload["customer_file_source"] = "USER_PROVIDED_ONLY"
                # Dedupe-Check: Audience mit diesem Namen schon vorhanden?
                aud_id = None
                try:
                    lookup = await meta_api("GET", f"{acct}/customaudiences?fields=id,name&limit=200")
                    for a in (lookup.get("data") or []):
                        if a.get("name") == audience_name and a.get("id"):
                            aud_id = a["id"]
                            log.info(f"Meta Audience '{audience_name}' wiederverwendet (Dedupe): {aud_id}")
                            break
                except Exception as e:
                    log.warning(f"Meta Audience Dedupe-Lookup fehlgeschlagen: {e}")
                if not aud_id:
                    resp_data = await meta_api("POST", f"{acct}/customaudiences", payload)
                    aud_id = resp_data.get("id")
                acct_num = _meta_acct_numeric()
                audience_url = f"https://adsmanager.facebook.com/adsmanager/audiences/detail?act={acct_num}&selected_audience_id={aud_id}" if aud_id else f"https://adsmanager.facebook.com/adsmanager/manage/audiences?act={acct_num}"
                result = {"audience_id": aud_id, "name": name, "url": audience_url}
                log.info(f"Meta Audience erstellt: {name} ({aud_id})")
                ts = datetime.now().strftime('%d.%m.%Y %H:%M')
                await _append_sheet_row(context.get("overview_sheet_id"), [f"Audience: {name}", "Erstellt", desc, audience_url, ts])
            except Exception as e:
                log.warning(f"Meta Audience {name} übersprungen: {e}")
                meta_audiences_url = f"https://adsmanager.facebook.com/adsmanager/manage/audiences?act={_meta_acct_numeric()}"
                result = {"name": name, "audience_id": f"skipped_{name}", "note": f"Audience-Erstellung übersprungen: {e}", "url": meta_audiences_url}

        elif node_id == "ca04":
            # Initial (Cold) Campaign - Objective: Leads, CBO: OFF
            company = context.get("company", "Novacode GmbH")
            acct = _meta_acct()
            try:
                # Bilder einmalig hochladen (für alle Ad Sets/Kampagnen) + Kopie in Drive-Kundenordner
                drive_images_folder = context.get("upload_folder_id") or (context.get("subfolders") or {}).get("04_Creatives")
                image_hashes = await upload_meta_images(drive_target_folder_id=drive_images_folder)
                log.info(f"Meta Bilder hochgeladen: {len(image_hashes)} Hashes, Drive-Kopie: {drive_images_folder}")
                campaign_name = f"TOF | {datetime.now().strftime('%Y-%m')} | Leads | DE | {company} Recruiting"
                # Dedupe-Check: Kampagne mit diesem Namen schon vorhanden?
                cid = None
                try:
                    lookup = await meta_api("GET", f"{acct}/campaigns?fields=id,name,effective_status&limit=200")
                    for c in (lookup.get("data") or []):
                        if c.get("name") == campaign_name and c.get("effective_status") != "DELETED" and c.get("id"):
                            cid = c["id"]
                            log.info(f"Meta TOF-Kampagne '{campaign_name}' wiederverwendet (Dedupe): {cid}")
                            break
                except Exception as e:
                    log.warning(f"Meta Kampagne Dedupe-Lookup fehlgeschlagen: {e}")
                if not cid:
                    campaign = await meta_api("POST", f"{acct}/campaigns", {
                        "name": campaign_name,
                        "objective": "OUTCOME_LEADS",
                        "status": "PAUSED",
                        "special_ad_categories": ["EMPLOYMENT"],
                        "is_campaign_budget_optimization": False,  # Advantage Campaign Budget: OFF
                        "is_adset_budget_sharing_enabled": False,
                    })
                    cid = campaign["id"]
                meta_campaigns = dict(context.get("meta_campaigns", {}))
                meta_campaigns["initial"] = cid
                acct_num = _meta_acct_numeric()
                campaign_url = f"https://adsmanager.facebook.com/adsmanager/manage/campaigns?act={acct_num}&selected_campaign_ids={cid}"
                result = {
                    "campaign_id": cid,
                    "meta_campaigns": meta_campaigns,
                    "image_hashes": image_hashes,
                    "url": campaign_url,
                }
                log.info(f"Meta Initial-Kampagne erstellt: {cid}, {len(image_hashes)} Bilder hochgeladen")
                ts = datetime.now().strftime('%d.%m.%Y %H:%M')
                await _append_sheet_row(context.get("overview_sheet_id"), ["Meta: Initial-Kampagne (TOF)", "Pausiert", "Objective Leads, Special Ad Category Employment", campaign_url, ts])
            except Exception as e:
                log.error(f"Meta ca04 Initial-Kampagne fehlgeschlagen: {e}")
                result = {"error": str(e), "image_hashes": [], "meta_campaigns": dict(context.get("meta_campaigns", {})), "url": f"https://adsmanager.facebook.com/adsmanager/manage/campaigns?act={_meta_acct_numeric()}"}

        elif node_id == "ca05":
            # Initial Ad Sets (3x) - Manuelle Placements: nur Facebook Feed + Instagram Feed

            campaign_id = context.get("meta_campaigns", {}).get("initial")
            if not campaign_id:
                result = {"skipped": True, "reason": "Keine Initial-Kampagne"}
            else:
                try:
                    company = context.get("company", "Novacode GmbH")
                    acct = _meta_acct()
                    image_hashes = context.get("image_hashes", []) or []
                    if not image_hashes:
                        log.warning("ca05 Initial: image_hashes fehlen im context, lade Bilder neu hoch")
                        drive_images_folder = context.get("upload_folder_id") or (context.get("subfolders") or {}).get("04_Creatives")
                        image_hashes = await upload_meta_images(drive_target_folder_id=drive_images_folder)
                    destination_url = "https://www.flowstack-agentur.de/demo"

                    # Employment: Country-Level DE, manuelle Placements (nur Feeds)
                    base_targeting = {
                        "geo_locations": {"countries": ["DE"]},
                        "publisher_platforms": ["facebook", "instagram"],
                        "facebook_positions": ["feed"],
                        "instagram_positions": ["stream"],
                    }
                    month = datetime.now().strftime('%Y-%m')
                    adset_names = [
                        f"Broad | Alle | 25-55 | DE | Feed | LEAD | {month}",
                        f"Interest_Recruiting | Alle | 25-55 | DE | Feed | LEAD | {month}",
                        f"Interest_Management | Alle | 25-55 | DE | Feed | LEAD | {month}",
                    ]
                    # Dedupe: Bestehende Ad Sets dieser Kampagne per Name-Map einsammeln
                    existing_adsets: dict[str, str] = {}
                    try:
                        adset_lookup = await meta_api("GET", f"{campaign_id}/adsets?fields=id,name&limit=200")
                        for a in (adset_lookup.get("data") or []):
                            if a.get("name") and a.get("id"):
                                existing_adsets[a["name"]] = a["id"]
                    except Exception as e:
                        log.warning(f"Meta Ad Set Dedupe-Lookup fehlgeschlagen: {e}")
                    adset_ids = []
                    for adset_name in adset_names:
                        if adset_name in existing_adsets:
                            log.info(f"Meta Ad Set '{adset_name}' wiederverwendet (Dedupe): {existing_adsets[adset_name]}")
                            adset_ids.append(existing_adsets[adset_name])
                            continue
                        resp_data = await meta_api("POST", f"{acct}/adsets", {
                            "name": adset_name,
                            "campaign_id": campaign_id,
                            "billing_event": "IMPRESSIONS",
                            "optimization_goal": "OFFSITE_CONVERSIONS",
                            "bid_strategy": "LOWEST_COST_WITHOUT_CAP",
                            "promoted_object": {"pixel_id": META_PIXEL_ID, "custom_event_type": "LEAD"},
                            "daily_budget": 3000,  # 30€/Tag
                            "targeting": base_targeting,
                            "attribution_spec": [{"event_type": "CLICK_THROUGH", "window_days": 7}],
                            "start_time": (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%dT00:00:00+0000"),
                            "status": "PAUSED",
                        })
                        adset_ids.append(resp_data["id"])
                        # Ads erstellen (3 Bilder pro Ad Set)
                        if image_hashes:
                            await create_meta_ads(
                                acct, resp_data["id"], image_hashes,
                                AD_COPY_INITIAL, company, destination_url, "APPLY_NOW", "TOF",
                            )
                    acct_num = _meta_acct_numeric()
                    adsets_url = f"https://adsmanager.facebook.com/adsmanager/manage/adsets?act={acct_num}&selected_campaign_ids={campaign_id}"
                    result = {"adset_ids": adset_ids, "count": len(adset_ids), "url": adsets_url}
                    log.info(f"Meta Initial Ad Sets + Ads erstellt: {adset_ids}")
                    ts = datetime.now().strftime('%d.%m.%Y %H:%M')
                    await _append_sheet_row(context.get("overview_sheet_id"), ["Meta: Initial Ad Sets", "Pausiert", f"{len(adset_ids)} Ad Sets (Broad + Interests), 30 EUR/Tag", adsets_url, ts])
                except Exception as e:
                    log.error(f"Meta ca05 Initial Ad Sets fehlgeschlagen: {e}")
                    result = {"error": str(e), "url": f"https://adsmanager.facebook.com/adsmanager/manage/campaigns?act={_meta_acct_numeric()}"}


        elif node_id == "ca06":
            # Retargeting Campaign - Objective: Leads, CBO: OFF
            company = context.get("company", "Novacode GmbH")
            acct = _meta_acct()
            try:
                campaign_name = f"RT | {datetime.now().strftime('%Y-%m')} | Leads | DE | {company} Recruiting"
                # Dedupe-Check: Retargeting-Kampagne mit diesem Namen schon vorhanden?
                cid = None
                try:
                    lookup = await meta_api("GET", f"{acct}/campaigns?fields=id,name,effective_status&limit=200")
                    for c in (lookup.get("data") or []):
                        if c.get("name") == campaign_name and c.get("effective_status") != "DELETED" and c.get("id"):
                            cid = c["id"]
                            log.info(f"Meta RT-Kampagne '{campaign_name}' wiederverwendet (Dedupe): {cid}")
                            break
                except Exception as e:
                    log.warning(f"Meta Kampagne Dedupe-Lookup fehlgeschlagen: {e}")
                if not cid:
                    campaign = await meta_api("POST", f"{acct}/campaigns", {
                        "name": campaign_name,
                        "objective": "OUTCOME_LEADS",
                        "status": "PAUSED",
                        "special_ad_categories": ["EMPLOYMENT"],
                        "is_campaign_budget_optimization": False,  # Advantage Campaign Budget: OFF
                        "is_adset_budget_sharing_enabled": False,
                    })
                    cid = campaign["id"]
                meta_campaigns = dict(context.get("meta_campaigns", {}))
                meta_campaigns["retargeting"] = cid
                acct_num = _meta_acct_numeric()
                campaign_url = f"https://adsmanager.facebook.com/adsmanager/manage/campaigns?act={acct_num}&selected_campaign_ids={cid}"
                result = {"campaign_id": cid, "meta_campaigns": meta_campaigns, "url": campaign_url}
                log.info(f"Meta Retargeting-Kampagne erstellt: {cid}")
                ts = datetime.now().strftime('%d.%m.%Y %H:%M')
                await _append_sheet_row(context.get("overview_sheet_id"), ["Meta: Retargeting-Kampagne", "Pausiert", "Objective Leads, Retargeting auf Website-Besucher", campaign_url, ts])
            except Exception as e:
                log.error(f"Meta ca06 Retargeting-Kampagne fehlgeschlagen: {e}")
                result = {"error": str(e), "meta_campaigns": dict(context.get("meta_campaigns", {})), "url": f"https://adsmanager.facebook.com/adsmanager/manage/campaigns?act={_meta_acct_numeric()}"}

        elif node_id == "ca07":
            # Retargeting Ad Sets (3x) - Auto-Placements, 10€/Tag

            campaign_id = context.get("meta_campaigns", {}).get("retargeting")
            if not campaign_id:
                result = {"skipped": True, "reason": "Keine Retargeting-Kampagne"}
            else:
                try:
                    company = context.get("company", "Novacode GmbH")
                    acct = _meta_acct()
                    image_hashes = context.get("image_hashes", []) or []
                    if not image_hashes:
                        log.warning("ca07 Retargeting: image_hashes fehlen im context, lade Bilder neu hoch")
                        drive_images_folder = context.get("upload_folder_id") or (context.get("subfolders") or {}).get("04_Creatives")
                        image_hashes = await upload_meta_images(drive_target_folder_id=drive_images_folder)
                    destination_url = "https://www.flowstack-agentur.de/demo-bewerbung"

                    # Auto-Placements (Employment: nur Country-Level)
                    base_targeting = {
                        "geo_locations": {"countries": ["DE"]},
                    }
                    month = datetime.now().strftime('%Y-%m')
                    adset_names = [
                        f"WV-30d-AllPages | Alle | 25-55 | DE | Auto | LEAD | {month}",
                        f"WV-7d-LP_NoBewerbung | Alle | 25-55 | DE | Auto | LEAD | {month}",
                        f"WV-7d-Bewerbung_NoLead | Alle | 25-55 | DE | Auto | LEAD | {month}",
                    ]
                    # Dedupe: Bestehende RT Ad Sets per Name-Map einsammeln
                    existing_adsets: dict[str, str] = {}
                    try:
                        adset_lookup = await meta_api("GET", f"{campaign_id}/adsets?fields=id,name&limit=200")
                        for a in (adset_lookup.get("data") or []):
                            if a.get("name") and a.get("id"):
                                existing_adsets[a["name"]] = a["id"]
                    except Exception as e:
                        log.warning(f"Meta RT Ad Set Dedupe-Lookup fehlgeschlagen: {e}")
                    adset_ids = []
                    for adset_name in adset_names:
                        if adset_name in existing_adsets:
                            log.info(f"Meta RT Ad Set '{adset_name}' wiederverwendet (Dedupe): {existing_adsets[adset_name]}")
                            adset_ids.append(existing_adsets[adset_name])
                            continue
                        resp_data = await meta_api("POST", f"{acct}/adsets", {
                            "name": adset_name,
                            "campaign_id": campaign_id,
                            "billing_event": "IMPRESSIONS",
                            "optimization_goal": "OFFSITE_CONVERSIONS",
                            "bid_strategy": "LOWEST_COST_WITHOUT_CAP",
                            "promoted_object": {"pixel_id": META_PIXEL_ID, "custom_event_type": "LEAD"},
                            "daily_budget": 1000,  # 10€/Tag
                            "targeting": base_targeting,
                            "attribution_spec": [{"event_type": "CLICK_THROUGH", "window_days": 7}],
                            "start_time": (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%dT00:00:00+0000"),
                            "status": "PAUSED",
                        })
                        adset_ids.append(resp_data["id"])
                        if image_hashes:
                            await create_meta_ads(
                                acct, resp_data["id"], image_hashes,
                                AD_COPY_RETARGETING, company, destination_url, "APPLY_NOW", "RT",
                            )
                        else:
                            log.error(f"ca07 Retargeting: 0 Ads für AdSet {resp_data['id']} (keine image_hashes)")
                    acct_num = _meta_acct_numeric()
                    adsets_url = f"https://adsmanager.facebook.com/adsmanager/manage/adsets?act={acct_num}&selected_campaign_ids={campaign_id}"
                    result = {"adset_ids": adset_ids, "count": len(adset_ids), "url": adsets_url}
                    log.info(f"Meta Retargeting Ad Sets + Ads erstellt: {adset_ids}")
                    ts = datetime.now().strftime('%d.%m.%Y %H:%M')
                    await _append_sheet_row(context.get("overview_sheet_id"), ["Meta: Retargeting Ad Sets", "Pausiert", f"{len(adset_ids)} Ad Sets auf Custom Audiences", adsets_url, ts])
                except Exception as e:
                    log.error(f"Meta ca07 Retargeting Ad Sets fehlgeschlagen: {e}")
                    result = {"error": str(e), "url": f"https://adsmanager.facebook.com/adsmanager/manage/campaigns?act={_meta_acct_numeric()}"}


        elif node_id == "ca08":
            # Warmup Campaign - Objective: Awareness, CBO: OFF
            company = context.get("company", "Novacode GmbH")
            acct = _meta_acct()
            try:
                campaign = await meta_api("POST", f"{acct}/campaigns", {
                    "name": f"WU | {datetime.now().strftime('%Y-%m')} | Awareness | DE | {company} Recruiting",
                    "objective": "OUTCOME_AWARENESS",
                    "status": "PAUSED",
                    "special_ad_categories": ["EMPLOYMENT"],
                    "is_campaign_budget_optimization": False,  # Advantage Campaign Budget: OFF
                    "is_adset_budget_sharing_enabled": False,
                })
                cid = campaign["id"]
                meta_campaigns = dict(context.get("meta_campaigns", {}))
                meta_campaigns["warmup"] = cid
                acct_num = _meta_acct_numeric()
                campaign_url = f"https://adsmanager.facebook.com/adsmanager/manage/campaigns?act={acct_num}&selected_campaign_ids={cid}"
                result = {"campaign_id": cid, "meta_campaigns": meta_campaigns, "url": campaign_url}
                log.info(f"Meta Warmup-Kampagne erstellt: {cid}")
                ts = datetime.now().strftime('%d.%m.%Y %H:%M')
                await _append_sheet_row(context.get("overview_sheet_id"), ["Meta: Warmup-Kampagne", "Pausiert", "Objective Awareness, Markenaufbau", campaign_url, ts])
            except Exception as e:
                log.error(f"Meta ca08 Warmup-Kampagne fehlgeschlagen: {e}")
                result = {"error": str(e), "meta_campaigns": dict(context.get("meta_campaigns", {})), "url": f"https://adsmanager.facebook.com/adsmanager/manage/campaigns?act={_meta_acct_numeric()}"}

        elif node_id == "ca09":
            # Warmup Ad Sets - Video-freundliche Placements, 10€/Tag

            campaign_id = context.get("meta_campaigns", {}).get("warmup")
            if not campaign_id:
                result = {"skipped": True, "reason": "Keine Warmup-Kampagne"}
            else:
                try:
                    company = context.get("company", "Novacode GmbH")
                    acct = _meta_acct()
                    image_hashes = context.get("image_hashes", []) or []
                    if not image_hashes:
                        log.warning("ca09 Warmup: image_hashes fehlen im context, lade Bilder neu hoch")
                        drive_images_folder = context.get("upload_folder_id") or (context.get("subfolders") or {}).get("04_Creatives")
                        image_hashes = await upload_meta_images(drive_target_folder_id=drive_images_folder)
                    destination_url = "https://www.flowstack-agentur.de/demo"

                    # Reach-optimierte Placements (Employment: Country-Level)
                    targeting = {
                        "geo_locations": {"countries": ["DE"]},
                        "publisher_platforms": ["facebook", "instagram"],
                        "facebook_positions": ["feed"],
                        "instagram_positions": ["stream", "story"],
                    }
                    resp_data = await meta_api("POST", f"{acct}/adsets", {
                        "name": f"WV-30d-Warmup | Alle | 25-55 | DE | Feed | REACH | {datetime.now().strftime('%Y-%m')}",
                        "campaign_id": campaign_id,
                        "billing_event": "IMPRESSIONS",
                        "optimization_goal": "REACH",
                        "bid_strategy": "LOWEST_COST_WITHOUT_CAP",
                        "daily_budget": 1000,  # 10€/Tag
                        "targeting": targeting,
                        "start_time": (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%dT00:00:00+0000"),
                        "status": "PAUSED",
                    })
                    adset_id = resp_data["id"]
                    # Warmup: Bild-Ads als Platzhalter (Video-Ads können später ergänzt werden)
                    if image_hashes:
                        await create_meta_ads(
                            acct, adset_id, image_hashes[:1],  # 1 Bild für Warmup
                            AD_COPY_WARMUP, company, destination_url, "LEARN_MORE", "WU",
                        )
                    else:
                        log.error(f"ca09 Warmup: 0 Ads für AdSet {adset_id} (keine image_hashes)")
                    acct_num = _meta_acct_numeric()
                    adsets_url = f"https://adsmanager.facebook.com/adsmanager/manage/adsets?act={acct_num}&selected_campaign_ids={campaign_id}"
                    result = {"adset_ids": [adset_id], "count": 1, "url": adsets_url}
                    log.info(f"Meta Warmup Ad Set + Ads erstellt: {adset_id}")
                    ts = datetime.now().strftime('%d.%m.%Y %H:%M')
                    await _append_sheet_row(context.get("overview_sheet_id"), ["Meta: Warmup Ad Sets", "Pausiert", "Video Views in Feed, Stories, Reels", adsets_url, ts])
                except Exception as e:
                    log.error(f"Meta ca09 Warmup Ad Sets fehlgeschlagen: {e}")
                    result = {"error": str(e), "url": f"https://adsmanager.facebook.com/adsmanager/manage/campaigns?act={_meta_acct_numeric()}"}


        else:
            return {"ok": True, "result": None, "message": f"Kein Side-Effect für {node_id}"}

    except Exception as e:
        log.error(f"Side-Effect für {node_id} fehlgeschlagen: {e}")
        return {"ok": False, "error": str(e)}

    return {"ok": True, "result": result}


# ══════════════════════════════════════════════════════════════════════════════
# Meta Performance Sync → Airtable
# ══════════════════════════════════════════════════════════════════════════════

async def _fetch_meta_campaign_insights(campaign_id: str, date_preset: str = "last_30d") -> list[dict]:
    """Holt taegliche Insights einer Meta-Kampagne."""
    try:
        data = await meta_api("GET", f"{campaign_id}/insights", {
            "fields": "campaign_name,impressions,clicks,ctr,cpm,cpc,spend,reach,frequency,actions",
            "time_increment": 1,
            "date_preset": date_preset,
        })
        return data.get("data", [])
    except Exception as e:
        log.warning(f"Meta Insights für {campaign_id} fehlgeschlagen: {e}")
        return []


def _extract_leads_from_actions(actions: list[dict] | None) -> int:
    """Extrahiert Lead-Count aus Meta actions Array."""
    if not actions:
        return 0
    for action in actions:
        if action.get("action_type") in ("offsite_conversion.fb_pixel_lead", "lead"):
            return int(action.get("value", 0))
    return 0


@app.post("/api/meta/sync-performance")
async def sync_meta_performance(body: Optional[dict] = None):
    """
    Zieht Kampagnen-Performance aus der Meta Marketing API und schreibt sie in Airtable.
    Body (optional): { "campaign_ids": [...], "date_preset": "last_30d" }
    Ohne campaign_ids werden alle aktiven Kampagnen des Ad Accounts synchronisiert.
    """
    if not META_ACCESS_TOKEN or not _meta_acct():
        raise HTTPException(503, "Meta API nicht konfiguriert")
    if not AIRTABLE_API_KEY or not AIRTABLE_BASE_ID:
        raise HTTPException(503, "Airtable nicht konfiguriert")

    payload = body or {}
    campaign_ids = payload.get("campaign_ids", [])
    date_preset = payload.get("date_preset", "last_30d")

    # Wenn keine IDs angegeben, alle Kampagnen des Ad Accounts holen
    if not campaign_ids:
        try:
            campaigns_resp = await meta_api("GET", f"{_meta_acct()}/campaigns", {
                "fields": "id,name,status",
                "limit": "50",
            })
            campaign_ids = [c["id"] for c in campaigns_resp.get("data", [])]
        except Exception as e:
            raise HTTPException(500, f"Kampagnen konnten nicht geladen werden: {e}")

    synced_records = []
    errors = []

    for cid in campaign_ids:
        insights = await _fetch_meta_campaign_insights(cid, date_preset)
        for day in insights:
            impressions = int(day.get("impressions", 0))
            clicks = int(day.get("clicks", 0))
            spend = float(day.get("spend", 0))
            leads = _extract_leads_from_actions(day.get("actions"))

            record = {
                "Kampagnen-Name": day.get("campaign_name", f"Campaign {cid}"),
                "Datum": day.get("date_start", ""),
                "Meta Campaign ID": cid,
                "Impressions": impressions,
                "Clicks": clicks,
                "CTR": float(day.get("ctr", 0)) / 100,  # Meta gibt % als Zahl, Airtable will Dezimal
                "CPM": float(day.get("cpm", 0)),
                "CPC": float(day.get("cpc", 0)) if clicks > 0 else 0,
                "Leads": leads,
                "CPL": round(spend / leads, 2) if leads > 0 else 0,
                "Spend": spend,
                "Reach": int(day.get("reach", 0)),
                "Frequency": float(day.get("frequency", 0)),
            }

            # Kampagnen-Typ aus Name ableiten
            name_lower = record["Kampagnen-Name"].lower()
            if "retarget" in name_lower or "rt" in name_lower:
                record["Kampagnen-Typ"] = "Retargeting"
            elif "warmup" in name_lower or "wu" in name_lower or "awareness" in name_lower:
                record["Kampagnen-Typ"] = "Warmup"
            else:
                record["Kampagnen-Typ"] = "Initial"

            synced_records.append(record)

    # Batch-Write zu Airtable (max 10 pro Call)
    written = 0
    for i in range(0, len(synced_records), 10):
        batch = synced_records[i:i+10]
        try:
            await airtable_create_records("Performance", batch)
            written += len(batch)
        except Exception as e:
            errors.append(f"Batch {i//10}: {e}")

    return {
        "synced": written,
        "campaigns": len(campaign_ids),
        "days": len(synced_records),
        "errors": errors,
    }


@app.get("/api/meta/campaigns")
async def list_meta_campaigns():
    """Listet alle Kampagnen des Ad Accounts mit aktuellem Status."""
    if not META_ACCESS_TOKEN or not _meta_acct():
        raise HTTPException(503, "Meta API nicht konfiguriert")

    campaigns = await meta_api("GET", f"{_meta_acct()}/campaigns", {
        "fields": "id,name,status,objective,daily_budget,lifetime_budget,created_time",
        "limit": "100",
    })
    return campaigns


@app.get("/api/meta/campaign/{campaign_id}/insights")
async def get_campaign_insights(campaign_id: str, date_preset: str = "last_30d"):
    """Holt Insights für eine einzelne Kampagne."""
    insights = await _fetch_meta_campaign_insights(campaign_id, date_preset)
    return {"data": insights, "campaign_id": campaign_id}


# ══════════════════════════════════════════════════════════════════════════════
# Cleanup Endpoint: Demo-Daten bereinigen
# ══════════════════════════════════════════════════════════════════════════════

@app.post("/api/cleanup")
async def cleanup_demo_data(body: Optional[dict] = None):
    """
    Löscht Demo-Ressourcen und setzt den Zustand zurück.
    Body (alle optional): { "lead_id", "opportunity_id", "list_id", "folder_root_id", "event_id", "channel_id" }
    WICHTIG: Es werden NUR die während der Automation erstellten Ressourcen gelöscht.
    Vorbereitete Master-Template-Dokumente (MASTER_DOCS) bleiben IMMER erhalten.
    Kunden-Kopien (client_docs) werden über den folder_root_id-Delete mit gelöscht.
    """
    payload = body or {}
    lead_id = payload.get("lead_id")
    opportunity_id = payload.get("opportunity_id")
    list_id = payload.get("list_id")
    folder_root_id = payload.get("folder_root_id")
    event_id = payload.get("event_id")
    channel_id = payload.get("channel_id")

    deleted: list[str] = []
    errors: list[str] = []

    # Close CRM Lead löschen (Leadflow Marketing Org - Opportunity wird mit-gelöscht)
    if lead_id:
        # Versuche V2 API (Leadflow Marketing), Fallback auf V1
        api_fn = close_api_v2 if CLOSE_API_KEY_V2 else close_api
        try:
            await api_fn("DELETE", f"/lead/{lead_id}/")
            deleted.append(f"close_lead:{lead_id}")
            log.info(f"Cleanup: Close Lead {lead_id} gelöscht")
        except Exception as e:
            errors.append(f"close_lead:{lead_id} - {e}")
            log.error(f"Cleanup: Close Lead {lead_id} fehlgeschlagen: {e}")

    # ClickUp List löschen
    if list_id:
        try:
            await clickup_api("DELETE", f"/list/{list_id}")
            deleted.append(f"clickup_list:{list_id}")
            log.info(f"Cleanup: ClickUp List {list_id} gelöscht")
        except Exception as e:
            errors.append(f"clickup_list:{list_id} - {e}")
            log.error(f"Cleanup: ClickUp List {list_id} fehlgeschlagen: {e}")

    # Google Drive Ordner löschen
    if folder_root_id:
        try:
            await google_api(
                "DELETE",
                f"https://www.googleapis.com/drive/v3/files/{folder_root_id}",
            )
            deleted.append(f"drive_folder:{folder_root_id}")
            log.info(f"Cleanup: Drive Folder {folder_root_id} gelöscht")
        except Exception as e:
            errors.append(f"drive_folder:{folder_root_id} - {e}")
            log.error(f"Cleanup: Drive Folder {folder_root_id} fehlgeschlagen: {e}")

    # Google Calendar Event löschen
    if event_id:
        try:
            await google_api(
                "DELETE",
                f"https://www.googleapis.com/calendar/v3/calendars/primary/events/{event_id}",
            )
            deleted.append(f"calendar_event:{event_id}")
            log.info(f"Cleanup: Calendar Event {event_id} gelöscht")
        except Exception as e:
            errors.append(f"calendar_event:{event_id} - {e}")
            log.error(f"Cleanup: Calendar Event {event_id} fehlgeschlagen: {e}")

    # Slack Channel archivieren (Bot muss erst joinen falls nicht mehr drin)
    if channel_id and SLACK_BOT_TOKEN:
        try:
            async with httpx.AsyncClient() as client:
                # Erst joinen (falls Bot nicht mehr im Channel)
                await client.post(
                    "https://slack.com/api/conversations.join",
                    headers={"Authorization": f"Bearer {SLACK_BOT_TOKEN}"},
                    json={"channel": channel_id},
                )
                # Dann archivieren
                resp = await client.post(
                    "https://slack.com/api/conversations.archive",
                    headers={"Authorization": f"Bearer {SLACK_BOT_TOKEN}"},
                    json={"channel": channel_id},
                )
                r = resp.json()
                if r.get("ok"):
                    deleted.append(f"slack_channel:{channel_id}")
                    log.info(f"Cleanup: Slack Channel {channel_id} archiviert")
                elif r.get("error") == "already_archived":
                    deleted.append(f"slack_channel:{channel_id}")
                else:
                    errors.append(f"slack_channel:{channel_id} - {r.get('error')}")
        except Exception as e:
            errors.append(f"slack_channel:{channel_id} - {e}")
            log.error(f"Cleanup: Slack Channel {channel_id} fehlgeschlagen: {e}")

    # Meta Kampagnen löschen (Löschen einer Kampagne löscht auch ihre Ad Sets)
    meta_campaign_ids = payload.get("meta_campaign_ids", [])
    for cid in meta_campaign_ids:
        try:
            await meta_api("DELETE", cid)
            deleted.append(f"meta_campaign:{cid}")
            log.info(f"Cleanup: Meta Kampagne {cid} gelöscht")
        except Exception as e:
            errors.append(f"meta_campaign:{cid} - {e}")
            log.error(f"Cleanup: Meta Kampagne {cid} fehlgeschlagen: {e}")

    # Meta Custom Audiences löschen (ca01/ca02/ca03 erstellen je eine pro Run)
    meta_audience_ids = payload.get("meta_audience_ids", []) or []
    for aid in meta_audience_ids:
        if not aid or str(aid).startswith("skipped_"):
            continue
        try:
            await meta_api("DELETE", str(aid))
            deleted.append(f"meta_audience:{aid}")
            log.info(f"Cleanup: Meta Audience {aid} gelöscht")
        except Exception as e:
            errors.append(f"meta_audience:{aid} - {e}")
            log.warning(f"Cleanup: Meta Audience {aid} fehlgeschlagen: {e}")

    # Airtable Records bereinigen (Clients, Bausteine, Dokumente, Performance)
    airtable_client_id = payload.get("airtable_client_id")
    if airtable_client_id and AIRTABLE_API_KEY and AIRTABLE_BASE_ID:
        for table_name in ["Bausteine", "Dokumente", "Kampagnen", "Performance"]:
            try:
                records = await airtable_get_records(table_name)
                record_ids = [r["id"] for r in records]
                if record_ids:
                    # Airtable batch delete: max 10 pro Call
                    for i in range(0, len(record_ids), 10):
                        batch = record_ids[i:i+10]
                        params = "&".join([f"records[]={rid}" for rid in batch])
                        await airtable_request("DELETE", f"{AIRTABLE_BASE_ID}/{table_name}?{params}")
                    deleted.append(f"airtable_{table_name.lower()}:{len(record_ids)}_records")
                    log.info(f"Cleanup: {len(record_ids)} {table_name} Records gelöscht")
            except Exception as e:
                errors.append(f"airtable_{table_name.lower()} - {e}")
                log.warning(f"Cleanup: Airtable {table_name} fehlgeschlagen: {e}")
        # Client Record selbst löschen
        try:
            await airtable_request("DELETE", f"{AIRTABLE_BASE_ID}/Clients/{airtable_client_id}")
            deleted.append(f"airtable_client:{airtable_client_id}")
            log.info(f"Cleanup: Airtable Client {airtable_client_id} gelöscht")
        except Exception as e:
            errors.append(f"airtable_client:{airtable_client_id} - {e}")
            log.warning(f"Cleanup: Airtable Client fehlgeschlagen: {e}")

    # Overview Sheet löschen (liegt außerhalb folder_root_id in Drive-Root)
    overview_sheet_id = payload.get("overview_sheet_id")
    if overview_sheet_id:
        try:
            await google_api(
                "DELETE",
                f"https://www.googleapis.com/drive/v3/files/{overview_sheet_id}",
            )
            deleted.append(f"overview_sheet:{overview_sheet_id}")
            log.info(f"Cleanup: Overview Sheet {overview_sheet_id} gelöscht")
        except Exception as e:
            errors.append(f"overview_sheet:{overview_sheet_id} - {e}")
            log.warning(f"Cleanup: Overview Sheet fehlgeschlagen: {e}")

    # Miro Board löschen
    miro_board_id = payload.get("miro_board_id")
    if miro_board_id and MIRO_ACCESS_TOKEN:
        try:
            await miro_api("DELETE", f"/boards/{miro_board_id}")
            deleted.append(f"miro_board:{miro_board_id}")
            log.info(f"Cleanup: Miro Board {miro_board_id} gelöscht")
        except Exception as e:
            errors.append(f"miro_board:{miro_board_id} - {e}")
            log.warning(f"Cleanup: Miro Board fehlgeschlagen: {e}")

    # Slack Benachrichtigung
    await slack_message("\U0001f504 Demo zurückgesetzt - Testdaten bereinigt")

    log.info(f"Cleanup abgeschlossen: {len(deleted)} gelöscht, {len(errors)} Fehler")
    return {"ok": True, "deleted": deleted, "errors": errors}


@app.post("/api/clear-channel")
async def clear_slack_channel(body: Optional[dict] = None):
    """Löscht alle Nachrichten in einem Slack-Channel (Bot-Messages + Webhook-Messages).

    Body: { "channel_id": "C..." }
    Nutzt conversations.history + chat.delete. Bot braucht channels:history + chat:write Scopes.
    """
    payload = body or {}
    channel_id = payload.get("channel_id")
    if not channel_id:
        raise HTTPException(status_code=400, detail="channel_id required")
    if not SLACK_BOT_TOKEN:
        raise HTTPException(status_code=500, detail="SLACK_BOT_TOKEN not configured")

    import asyncio
    deleted_count = 0
    skipped_count = 0
    cursor = None

    while True:
        params: dict[str, Any] = {"channel": channel_id, "limit": 100}
        if cursor:
            params["cursor"] = cursor
        hist = await slack_bot_api("conversations.history", params)
        if not hist.get("ok"):
            return {"ok": False, "error": hist.get("error"), "deleted": deleted_count}
        messages = hist.get("messages", [])
        if not messages:
            break
        for msg in messages:
            ts = msg.get("ts")
            if not ts:
                continue
            resp = await slack_bot_api("chat.delete", {"channel": channel_id, "ts": ts})
            if resp.get("ok"):
                deleted_count += 1
            elif resp.get("error") == "ratelimited":
                await asyncio.sleep(1.5)
                resp2 = await slack_bot_api("chat.delete", {"channel": channel_id, "ts": ts})
                if resp2.get("ok"):
                    deleted_count += 1
                else:
                    skipped_count += 1
            else:
                skipped_count += 1
            await asyncio.sleep(0.3)  # Rate-Limit vorbeugen
        cursor = hist.get("response_metadata", {}).get("next_cursor")
        if not cursor:
            break

    log.info(f"Channel {channel_id} gecleared: {deleted_count} gelöscht, {skipped_count} übersprungen")
    return {"ok": True, "deleted": deleted_count, "skipped": skipped_count}


# ══════════════════════════════════════════════════════════════════════════════
# DriveVault - Google Docs, Sheets & Gmail durchsuchbar machen
# ══════════════════════════════════════════════════════════════════════════════

# ── Hierarchisches Kategorie-System ───────────────────────────────────────
# Format: (keywords, category, subcategory)
# category = Hauptbereich, subcategory = spezifischer Unterbereich

_DRIVE_HIERARCHY_RULES: list[tuple[list[str], str, str]] = [
    # ── DEMO: [CLIENT] Novacode Demo-Dokumente (VOR client-output!) ──────────
    (["[client]", "[flowstack] deliverables", "novacode"], "demo", ""),

    # ── CLIENT-OUTPUT: Echte Kunden-Skripte (Hussein, Maurice, etc.) ─────────
    (["videoskript", "anzeigentexte", "landingpage-texte", "formularseite-texte", "dankeseite-texte",
      "marken-richtlinien", "creative briefing", "messaging-matrix", "arbeitgeber-avatar", "zielgruppen-avatar"], "client-output", ""),

    # ── SALES: Spezifische Sub-Kategorien ─────────────────────────────────
    (["cold call", "cold-call", "kaltakquise", "coldcall", "cc -", "cc-"], "sales", "cold-call"),
    (["gatekeeper", "vorzimmer", "sekretärin", "sekretaerin", "sekraeterin"], "sales", "gatekeeper"),
    (["pvc", "pvc skript", "pvc-", "pvc video"], "sales", "pvc"),
    (["dmc", "dmc skript", "dmc-", "dmc "], "sales", "dmc"),
    (["testkunde", "testkunden", "testkundentraining", "testkundenskript"], "sales", "testkunden"),
    (["setting", "settingcall", "settingskript", "settercall", "setter", "vorqualifizierung"], "sales", "setting"),
    (["closing", "closer", "closingskript", "abschluss", "abschlussgespräch"], "sales", "closing"),
    (["cold email", "cold-email", "kalt-email", "cold emails", "kaltemail"], "sales", "cold-email"),
    (["linkedin", "li profile", "opener", "outreach", "li-profil"], "sales", "linkedin"),
    (["einwand", "objection", "einwandbehandlung"], "sales", "einwand"),
    (["setterskript", "saleskript", "verkaufsskript", "akquise", "telefon akquise", "telefonakquise",
      "verkaufs-skript", "vk skript", "empfehlungsskript", "sales skript"], "sales", "allgemein"),

    # ── LEADS (echte Listen + Lead-Dateien, NICHT Leadmagnet-Guides) ─────
    (["leadlist", "leadliste", "leadspec", "lead tabelle", "leads tabelle", "fb leads",
      "ccx mastermind", "agenturmarkt", "branchenliste", "ocean leads", "sma leads",
      "dl leadlisten", "zugänge leadflow", "lead kai", "ccelite fb gruppe leads",
      "leads - baulig", "hot leads"], "leads", ""),

    # ── TRACKING ──────────────────────────────────────────────────────────
    (["tracking", "dashboard", "pipeline tracker", "kpi", "performance", "metrik", "auswertung"], "tracking", ""),

    # ── BEWERBUNGEN & KARRIERE ──────────────────────────────────────────
    (["bewerbung", "anschreiben", "lebenslauf", "cv claudio", "claudio_difranco_cv",
      "karriere", "closer & marketing", "bewerbungstabelle", "bewerbungsvideo",
      "closery -", "closerbase -", "closerfinden -", "interlead",
      "bewerbungen & karriere"], "bewerbungen", ""),

    # ── FINANZEN ──────────────────────────────────────────────────────────
    (["buchhaltung", "rechnung", "invoice", "revolut", "mahnung", "saas", "subscription",
      "reise", "verpflegung", "ausgaben", "einnahmen", "finan", "kontakte",
      "steuer", "umsatz", "gewinn", "bilanz", "lohn", "gehalt"], "finanzen", ""),

    # ── STRATEGIE (inkl. Leadmagnet-Konzepte, Analysen) ─────────────────
    (["zielgruppe", "pain-point", "analyse", "avatar", "strategie", "briefing", "messaging",
      "marke", "brand", "framing", "positionierung", "wettbewerb", "konkurrenz", "markt",
      "zg ", "zg-", "nische", "icp", "ideal customer", "leadmagnet", "leadgenerierung",
      "hochpreislead", "persona", "ist-analyse", "ist analyse", "fallstudie",
      "marketing message", "marketing accelerator", "marketing action"], "strategie", ""),

    # ── COPYWRITING (inkl. VSL, Ads-Texte) ──────────────────────────────
    (["copywriting", "copy principal", "psychological structure", "landing page", "formularseite",
      "dankeseite", "werbeanzeige", "hook", "headline", "cta", "anzeigentext", "ad text", "werbetexte",
      "anzeige", "vsl", "video sales letter", "swipe stack", "texte für"], "copywriting", ""),

    # ── ADS (Werbeanzeigen, Kampagnen) ───────────────────────────────────
    (["ads ", "ads-", " ads", "mitarbeiter ads", "facebook ads", "video ads",
      "kampagne", "kampagnen"], "ads", ""),

    # ── CLIENT-SKRIPTE (erkennbar an Kunden-Kontext) ─────────────────────
    (["webseiten skript", "webseiten video", "testimonial skript", "dreh skript",
      "video skript", "onesales"], "client-output", ""),

    # ── TEMPLATES ─────────────────────────────────────────────────────────
    (["template", "vorlage", "muster", "[template]", "blueprint"], "templates", ""),

    # ── TRAINING ─────────────────────────────────────────────────────────
    (["training", "schulung", "workshop", "kurs", "lektion", "modul", "learnings",
      "learning", "bc -", "bc -", "notizen training", "zusammenfassung"], "training", ""),

    # ── CONTENT ──────────────────────────────────────────────────────────
    (["content", "social media", "instagram", "tiktok", "youtube", "reel",
      "podcast", "newsletter", "blog", "artikel"], "content", ""),

    # ── PROZESSE ─────────────────────────────────────────────────────────
    (["prozess", "sop", "ablauf", "workflow", "checkliste", "checklist",
      "struktur", "leitfaden", "anleitung", "how to", "how-to", "guide"], "prozesse", ""),

    # ── FLOWSTACK ─────────────────────────────────────────────────────────
    (["flowstack", "fulfillment automation", "fulfillment pipeline"], "flowstack", ""),

    # ── DEMO ──────────────────────────────────────────────────────────────
    (["demo", "stage doc"], "demo", ""),

    # ── UMFRAGEN ──────────────────────────────────────────────────────────
    (["umfrage", "survey", "feedback"], "umfragen", ""),

    # ── ONBOARDING ────────────────────────────────────────────────────────
    (["onboarding", "kickoff", "transkript", "protokoll"], "onboarding", ""),

    # ── ANGEBOTE & PITCHES ───────────────────────────────────────────────
    (["angebot", "proposal", "pitch", "präsentation", "praesentation", "deck"], "angebote", ""),

    # ── NOTIZEN ──────────────────────────────────────────────────────────
    (["notiz", "notes", "ideen", "brainstorm", "gedanken", "planung", "todo",
      "to-do", "plan ", "memo"], "notizen", ""),
]

# Baulig Roh-Erkennung - Original Baulig-Vorlagen (mit Rechtshinweis)
# Erkannt an typischen Prefix-Patterns: BC -, CCET, CCM2, ET - (am Anfang)
import re as _re

# Manuelle Kategorie-Overrides (persistent in JSON-Datei)
_OVERRIDES_PATH = os.path.join(os.path.dirname(__file__), "drive-overrides.json")

def _load_overrides() -> dict:
    if os.path.exists(_OVERRIDES_PATH):
        try:
            with open(_OVERRIDES_PATH) as f:
                return json.load(f)
        except (json.JSONDecodeError, IOError):
            pass
    return {}

def _save_overrides(overrides: dict):
    with open(_OVERRIDES_PATH, "w") as f:
        json.dump(overrides, f, indent=2)


def _is_baulig_original(name: str) -> bool:
    """Prüft ob eine Datei ein Original-Baulig-Dokument ist (Coaching-Material mit Rechtshinweis).
    Erkennung über Name-Patterns:
    - BC - / BC - (Baulig Consulting Vorlage)
    - Kopie von BC - (Kopie einer Baulig Vorlage)
    - CCET (CC Elite Training Modul)
    - CCM2 (CCM2 Modul)
    - ET - am Anfang (Entscheider Training, NICHT 'Sheet -')
    - Baulig Consulting - (Baulig Kurs-Videos)
    - Baulig Elite / Baulig Training / Baulig Agentur
    - BAULIG - (Totaler Guide etc.)
    - Beispiel skripte Baulig
    """
    nl = name.strip().lower()
    # Prefix-basierte Erkennung (sehr zuverlässig)
    if nl.startswith("bc -") or nl.startswith("bc -") or nl.startswith("bc -"):
        return True
    if nl.startswith("kopie von bc"):
        return True
    if nl.startswith("et -") and "sheet" not in nl:
        return True
    if nl.startswith("ccet") or nl.startswith("ccm2"):
        return True
    if "kopie von ccet" in nl or "kopie von ccm2" in nl:
        return True
    # Baulig-spezifische Titel
    if nl.startswith("baulig consulting") or nl.startswith("baulig elite") or nl.startswith("baulig training"):
        return True
    if nl.startswith("baulig agentur") or nl.startswith("baulig -"):
        return True
    if "totaler guide" in nl and "baulig" in nl:
        return True
    if nl.startswith("beispiel skripte baulig"):
        return True
    if "transkriptierter text von andreas baulig" in nl:
        return True
    return False

# Ordner-Struktur für Auto-Sorting
_DRIVE_FOLDER_STRUCTURE = {
    "sales": {
        "name": "Sales & Akquise",
        "children": {
            "cold-call": "Cold Call",
            "gatekeeper": "Gatekeeper",
            "pvc": "PVC",
            "dmc": "DMC",
            "testkunden": "Testkunden",
            "setting": "Setting",
            "closing": "Closing",
            "cold-email": "Cold Email",
            "linkedin": "LinkedIn",
            "einwand": "Einwandbehandlung",
            "allgemein": "Allgemein",
        },
    },
    "client-output": {"name": "Client-Deliverables", "children": {}},
    "leads": {"name": "Leads", "children": {}},
    "tracking": {"name": "Tracking & Analytics", "children": {}},
    "finanzen": {"name": "Finanzen & Buchhaltung", "children": {}},
    "strategie": {"name": "Strategie & Analyse", "children": {}},
    "copywriting": {"name": "Copywriting", "children": {}},
    "templates": {"name": "Vorlagen", "children": {}},
    "training": {"name": "Training & Schulung", "children": {}},
    "content": {"name": "Content & Social Media", "children": {}},
    "prozesse": {"name": "Prozesse & SOPs", "children": {}},
    "flowstack": {"name": "Flowstack", "children": {}},
    "demo": {"name": "Demo", "children": {}},
    "umfragen": {"name": "Umfragen", "children": {}},
    "onboarding": {"name": "Onboarding", "children": {}},
    "ads": {"name": "Werbeanzeigen & Ads", "children": {}},
    "angebote": {"name": "Angebote & Pitches", "children": {}},
    "notizen": {"name": "Notizen & Ideen", "children": {}},
    "baulig-roh": {"name": "Baulig Roh", "children": {}},
    "sonstiges": {"name": "Sonstiges", "children": {}},
}


# Projekt/Zielgruppen-Erkennung
_PROJECT_RULES: list[tuple[list[str], str, str]] = [
    # (keywords, project_key, display_label)
    # ── Zielgruppen ──
    (["sma ", "sma-", "sma ", "social media agentur"], "sma", "SMA (Social Media Agentur)"),
    (["shk", "sanitär", "heizung", "handwerk"], "shk", "SHK / Handwerk"),
    (["immobilien", "makler", "baufinanzierung"], "immobilien", "Immobilienmakler"),
    (["recruiting", "recruit", "personalgewinnung", "mitarbeitergewinnung"], "recruiting", "Recruiting"),
    (["ecom", "e-commerce", "shopify"], "ecommerce", "E-Commerce"),
    (["beauty", "kosmetik"], "beauty", "Beauty"),
    (["b2b"], "b2b", "B2B"),
    (["b2c"], "b2c", "B2C"),
    # ── Kunden-Projekte ──
    (["novacode", "nova "], "novacode", "Novacode"),
    (["hussein", "husse "], "hussein", "Hussein OneSales"),
    (["sarullo"], "sarullo", "Sarullo"),
    (["petri"], "petri", "Petri GmbH"),
    (["benjamin"], "benjamin", "Benjamin"),
    (["maurice", "mws "], "maurice", "Maurice / MWS"),
    (["maryell"], "maryelle", "Maryelle"),
    (["martin vsl", "martin skript", "martin ads"], "martin", "Martin"),
    (["lukas"], "lukas", "Lukas"),
    (["kck", "kck productions"], "kck", "KCK Productions"),
    (["alentis"], "alentis", "Alentis"),
    (["kamo"], "kamo", "Kamo Marketing"),
    (["resonads"], "resonads", "Resonads"),
    (["europcare"], "europcare", "Europcare"),
    (["onesales"], "onesales", "OneSales"),
    (["levi"], "levi", "Levi"),
    # ── Eigene Projekte ──
    (["flowstack"], "flowstack", "Flowstack"),
    (["leadflow"], "leadflow", "Leadflow Marketing"),
]


def _detect_project(name: str, folder_path: str = "") -> str:
    """Erkennt Projekt/Zielgruppe anhand Dateiname."""
    combined = f"{name} {folder_path}".lower()
    for keywords, project_key, _label in _PROJECT_RULES:
        if any(kw in combined for kw in keywords):
            return project_key
    return ""


def _categorize_drive_item(name: str, folder_path: str = "", file_id: str = "") -> str:
    """Kategorie anhand Name + Ordnerpfad erkennen. Manuelle Overrides haben Vorrang."""
    # Manuelles Override prüfen
    if file_id:
        overrides = _load_overrides()
        ov = overrides.get(file_id)
        if ov and ov.get("category"):
            return ov["category"]
    # Baulig Originale ZUERST erkennen (haben Vorrang)
    if _is_baulig_original(name):
        return "baulig-roh"
    combined = f"{name} {folder_path}".lower()
    # Reguläre Hierarchie-Regeln
    for keywords, category, _sub in _DRIVE_HIERARCHY_RULES:
        if any(kw in combined for kw in keywords):
            return category
    return "sonstiges"


def _get_subcategory(name: str, folder_path: str = "", file_id: str = "") -> str:
    """Sub-Kategorie ermitteln (z.B. 'cold-call', 'gatekeeper').
    Auch für Baulig-Roh-Dateien, damit man nach Sales-Typ filtern kann.
    """
    if file_id:
        overrides = _load_overrides()
        ov = overrides.get(file_id)
        if ov and ov.get("subcategory") is not None:
            return ov["subcategory"]
    combined = f"{name} {folder_path}".lower()
    for keywords, _cat, sub in _DRIVE_HIERARCHY_RULES:
        if sub and any(kw in combined for kw in keywords):
            return sub
    return ""


def _detect_document_type(name: str, mime_type: str) -> str:
    """Erkennt den Dokument-Typ: skript, template, leadliste, training, tracker, analyse, notizen, angebot."""
    nl = name.lower()
    if any(kw in nl for kw in ["skript", "script", "call sheet", "gesprächsleitfaden", "leitfaden"]):
        return "skript"
    if any(kw in nl for kw in ["template", "vorlage", "muster", "blueprint"]):
        return "template"
    if any(kw in nl for kw in ["lead", "leadlist", "leadspec", "branchenliste", "kontaktliste"]):
        return "leadliste"
    if any(kw in nl for kw in ["training", "schulung", "learnings", "learning", "workshop", "kurs"]):
        return "training"
    if any(kw in nl for kw in ["tracking", "tracker", "dashboard", "kpi", "auswertung"]):
        return "tracker"
    if any(kw in nl for kw in ["analyse", "avatar", "research", "studie", "marktanalyse"]):
        return "analyse"
    if any(kw in nl for kw in ["notiz", "notes", "ideen", "brainstorm", "memo", "gedanken"]):
        return "notizen"
    if any(kw in nl for kw in ["angebot", "proposal", "pitch", "deck"]):
        return "angebot"
    if any(kw in nl for kw in ["checkliste", "checklist", "sop", "prozess", "ablauf"]):
        return "checkliste"
    if "spreadsheet" in mime_type:
        return "tabelle"
    return ""


def _auto_tag_drive_item(name: str, mime_type: str) -> list[str]:
    """Automatische Tags anhand von Name und MIME-Typ generieren."""
    tags: list[str] = []
    name_lower = name.lower()

    # Format-Tags
    if "spreadsheet" in mime_type:
        tags.append("Spreadsheet")
    elif "document" in mime_type:
        tags.append("Dokument")
    elif "presentation" in mime_type:
        tags.append("Präsentation")
    elif "form" in mime_type:
        tags.append("Formular")

    # Quell-Tags
    if _is_baulig_original(name):
        tags.append("Baulig Roh")
    else:
        tags.append("Eigen")

    # Status-Tags
    if any(kw in name_lower for kw in ["entwurf", "draft", "wip", "unfertig"]):
        tags.append("Entwurf")
    elif any(kw in name_lower for kw in ["final", "freigabe", "approved"]):
        tags.append("Final")

    # Version-Tags
    if "v3" in name_lower:
        tags.append("V3")
    elif "v2" in name_lower:
        tags.append("V2")
    elif "v1" in name_lower or "version 1" in name_lower:
        tags.append("V1")

    # Inhalts-Tags
    content_rules = [
        (["novacode", "nova"], "Novacode"), (["flowstack"], "Flowstack"),
        (["recruiting", "recruit"], "Recruiting"), (["client", "kunde", "klient"], "Client"),
        (["shk", "handwerk"], "SHK"), (["sarullo"], "Sarullo"),
        (["et ", "entscheider"], "Entscheider"), (["follow-up", "follow up", "nachfass"], "Follow-Up"),
    ]
    for keywords, tag in content_rules:
        if any(kw in name_lower for kw in keywords):
            tags.append(tag)

    # Sub-Kategorie als Tag (z.B. "Gatekeeper", "PVC")
    sub = _get_subcategory(name)
    sub_labels = {
        "cold-call": "Cold Call", "gatekeeper": "Gatekeeper", "pvc": "PVC",
        "dmc": "DMC", "testkunden": "Testkunden", "setting": "Setting", "closing": "Closing",
        "cold-email": "Cold Email", "linkedin": "LinkedIn", "einwand": "Einwandbehandlung",
    }
    if sub in sub_labels:
        tags.append(sub_labels[sub])

    return tags


def _is_already_named(name: str) -> bool:
    """Prüft ob Datei bereits nach Naming Convention benannt ist."""
    import re
    return bool(re.match(r'^\[[\w\s]+\]', name))


def _generate_standard_name(name: str, category: str, subcategory: str) -> str:
    """Generiert standardisierten Dateinamen nach Naming Convention.

    Format: [BEREICH] Typ - Name (Details)
    """
    # Bereits benannte Dateien nicht nochmal umbenennen
    if _is_already_named(name):
        return name

    name_lower = name.lower()

    # Bereich-Prefix bestimmen
    prefix_map = {
        "cold-call": "COLD CALL", "gatekeeper": "GATEKEEPER", "pvc": "PVC",
        "dmc": "DMC", "setting": "SETTING", "closing": "CLOSING",
        "cold-email": "COLD EMAIL", "linkedin": "LINKEDIN", "einwand": "EINWAND",
    }
    cat_prefix_map = {
        "client-output": "CLIENT", "leads": "LEADS", "tracking": "TRACKING",
        "finanzen": "FINANZEN", "strategie": "STRATEGIE", "copywriting": "COPY",
        "templates": "TEMPLATE", "flowstack": "FLOWSTACK", "demo": "DEMO",
        "umfragen": "UMFRAGE", "onboarding": "ONBOARDING", "baulig-roh": "BAULIG ROH",
    }

    prefix = prefix_map.get(subcategory, cat_prefix_map.get(category, ""))
    if not prefix:
        return name  # Kann nicht zugeordnet werden

    # Typ bestimmen
    doc_type = ""
    if any(kw in name_lower for kw in ["skript", "script"]):
        doc_type = "Skript"
    elif any(kw in name_lower for kw in ["template", "vorlage"]):
        doc_type = "Vorlage"
    elif any(kw in name_lower for kw in ["dashboard", "tracker"]):
        doc_type = "Dashboard"
    elif any(kw in name_lower for kw in ["liste", "list", "leads"]):
        doc_type = "Liste"
    elif any(kw in name_lower for kw in ["analyse", "analysis"]):
        doc_type = "Analyse"
    elif any(kw in name_lower for kw in ["briefing", "brief"]):
        doc_type = "Briefing"
    elif any(kw in name_lower for kw in ["avatar"]):
        doc_type = "Avatar"
    elif any(kw in name_lower for kw in ["texte", "copy", "anzeige"]):
        doc_type = "Texte"
    elif any(kw in name_lower for kw in ["protokoll", "transkript"]):
        doc_type = "Protokoll"
    elif any(kw in name_lower for kw in ["rechnung", "invoice"]):
        doc_type = "Rechnung"
    elif any(kw in name_lower for kw in ["spec", "specification"]):
        doc_type = "Spec"

    # Version extrahieren
    version = ""
    for v in ["v3", "v2", "v1"]:
        if v in name_lower:
            version = f" {v.upper()}"
            break

    # Quelle (Baulig Roh)
    source = ""
    if any(kw in name_lower for kw in _BAULIG_KEYWORDS):
        source = " (Baulig Roh)"

    # Status
    status = ""
    if any(kw in name_lower for kw in ["unfertig", "draft", "wip", "entwurf"]):
        status = " (Entwurf)"

    # Kern-Name bereinigen: Prefix/Typ/Version/Status entfernen
    clean = name
    # Bekannte Patterns entfernen
    for remove in ["[V2]", "[V1]", "[Unfertig]", "[TEMPLATE]", " - ", " - ", " | "]:
        clean = clean.replace(remove, " ")
    clean = clean.strip(" --|")

    if doc_type:
        return f"[{prefix}] {doc_type} - {clean}{version}{source}{status}"
    return f"[{prefix}] {clean}{version}{source}{status}"


async def _fetch_drive_files(token: str, q: str, doc_type: str, limit: int, account: str = "flowstack") -> list[dict]:
    """Holt Dateien von einem Google Drive Account."""
    if not token:
        return []

    # MIME-Types für Google Workspace
    mime_types = {
        "docs": "application/vnd.google-apps.document",
        "sheets": "application/vnd.google-apps.spreadsheet",
        "slides": "application/vnd.google-apps.presentation",
    }

    # Query bauen
    mime_filter_parts = []
    if doc_type == "all" or doc_type == "":
        for mt in mime_types.values():
            mime_filter_parts.append(f"mimeType='{mt}'")
    elif doc_type in mime_types:
        mime_filter_parts.append(f"mimeType='{mime_types[doc_type]}'")

    drive_query = f"({' or '.join(mime_filter_parts)}) and trashed=false"
    if q.strip():
        # Escape single quotes in search query
        safe_q = q.replace("'", "\\'")
        drive_query += f" and fullText contains '{safe_q}'"

    # Google Drive API: files.list
    params = {
        "q": drive_query,
        "fields": "files(id,name,mimeType,modifiedTime,createdTime,owners,size,webViewLink,iconLink,parents,starred,thumbnailLink),nextPageToken",
        "orderBy": "modifiedTime desc",
        "pageSize": str(min(limit, 100)),
        "supportsAllDrives": "true",
        "includeItemsFromAllDrives": "true",
    }

    all_files = []
    page_token = None

    for _ in range(5):  # Max 5 Seiten (500 Dateien)
        if page_token:
            params["pageToken"] = page_token

        resp = await _http.get(
            "https://www.googleapis.com/drive/v3/files",
            headers={"Authorization": f"Bearer {token}"},
            params=params,
            timeout=15,
        )

        if resp.status_code == 401:
            token = await _refresh_google_token()
            resp = await _http.get(
                "https://www.googleapis.com/drive/v3/files",
                headers={"Authorization": f"Bearer {token}"},
                params=params,
                timeout=15,
            )

        if resp.status_code >= 400:
            log.error(f"Drive API error: {resp.status_code} {resp.text}")
            raise HTTPException(resp.status_code, f"Google Drive API: {resp.text}")

        data = resp.json()
        all_files.extend(data.get("files", []))

        page_token = data.get("nextPageToken")
        if not page_token or len(all_files) >= limit:
            break

    # Ordner-Namen für Parent-IDs auflösen (Batch)
    parent_ids = set()
    for f in all_files:
        if f.get("parents"):
            parent_ids.update(f["parents"])

    folder_names: dict[str, str] = {}
    for pid in list(parent_ids)[:50]:  # Max 50 Ordner auflösen
        try:
            fr = await _http.get(
                f"https://www.googleapis.com/drive/v3/files/{pid}",
                headers={"Authorization": f"Bearer {token}"},
                params={"fields": "name"},
                timeout=5,
            )
            if fr.status_code == 200:
                folder_names[pid] = fr.json().get("name", "")
        except Exception:
            pass

    # Ergebnisse aufbereiten
    results = []
    for f in all_files[:limit]:
        mime = f.get("mimeType", "")
        name = f.get("name", "Ohne Titel")

        # Ordnerpfad
        parent_name = ""
        if f.get("parents"):
            parent_name = folder_names.get(f["parents"][0], "")

        fid = f["id"]
        cat = _categorize_drive_item(name, parent_name, fid)

        # Doc-Typ bestimmen
        if "document" in mime:
            dtype = "docs"
        elif "spreadsheet" in mime:
            dtype = "sheets"
        elif "presentation" in mime:
            dtype = "slides"
        else:
            dtype = "other"

        tags = _auto_tag_drive_item(name, mime)

        # Thumbnail URL bauen (Google Drive Thumbnail API)
        thumb = f.get("thumbnailLink", "")
        if thumb:
            # Höhere Auflösung anfordern: =s220 → =s800
            thumb = thumb.replace("=s220", "=s800").replace("=s200", "=s800")
        if not thumb and f.get("id"):
            # Fallback: Google Drive export thumbnail (hohe Auflösung)
            thumb = f"https://drive.google.com/thumbnail?id={f['id']}&sz=w800-h600"

        sub = _get_subcategory(name, parent_name, fid)
        doc_type_label = _detect_document_type(name, mime)
        project = _detect_project(name, parent_name)

        results.append({
            "id": f["id"],
            "name": name,
            "type": dtype,
            "mimeType": mime,
            "category": cat,
            "subcategory": sub,
            "documentType": doc_type_label,
            "project": project,
            "tags": tags,
            "url": f.get("webViewLink", f"https://docs.google.com/document/d/{f['id']}/edit"),
            "folder": parent_name,
            "folderId": f["parents"][0] if f.get("parents") else "",
            "modifiedTime": f.get("modifiedTime", ""),
            "createdTime": f.get("createdTime", ""),
            "owner": f.get("owners", [{}])[0].get("displayName", "") if f.get("owners") else "",
            "starred": f.get("starred", False),
            "thumbnailUrl": thumb,
            "account": account,
        })

    return results


@app.get("/api/drive-vault")
async def drive_vault_search(
    q: str = "",
    category: str = "all",
    doc_type: str = "all",
    limit: int = 100,
):
    """Durchsucht Google Drive nach Docs, Sheets und Slides (beide Accounts)."""
    import asyncio

    # Beide Accounts parallel abfragen
    flowstack_token = await _refresh_google_token()
    leadflow_token = await _refresh_leadflow_token()

    flowstack_task = _fetch_drive_files(flowstack_token, q, doc_type, limit, "flowstack")
    leadflow_task = _fetch_drive_files(leadflow_token, q, doc_type, limit, "leadflow")

    flowstack_files, leadflow_files = await asyncio.gather(flowstack_task, leadflow_task)

    # Merge + deduplizieren (nach ID)
    seen_ids: set[str] = set()
    results: list[dict] = []
    for f in flowstack_files + leadflow_files:
        if f["id"] not in seen_ids:
            seen_ids.add(f["id"])
            # Kategorie-Filter
            if category != "all" and f["category"] != category:
                continue
            results.append(f)

    # Nach modifiedTime sortieren
    results.sort(key=lambda x: x.get("modifiedTime", ""), reverse=True)

    # Kategorien-Zusammenfassung
    cat_counts: dict[str, int] = {}
    for r in results:
        cat_counts[r["category"]] = cat_counts.get(r["category"], 0) + 1

    return {
        "ok": True,
        "total": len(results),
        "categories": cat_counts,
        "files": results,
    }


@app.get("/api/gmail-vault")
async def gmail_vault_search(
    q: str = "",
    category: str = "all",
    limit: int = 50,
):
    """
    Durchsucht Gmail nach E-Mails. Kategorisiert automatisch.
    """
    token = await _refresh_google_token()
    if not token:
        raise HTTPException(503, "Google OAuth nicht konfiguriert")

    # Gmail API: messages.list
    gmail_query = q.strip() if q.strip() else "in:inbox OR in:sent"
    # Kategorie-basierte Query-Erweiterung
    _GMAIL_CATEGORY_QUERIES = {
        "clients": "subject:(onboarding OR kickoff OR client OR kunde)",
        "invoices": "subject:(rechnung OR invoice OR zahlung OR payment)",
        "automation": "subject:(automation OR flowstack OR campaign OR kampagne)",
        "team": "from:me OR to:me subject:(team OR meeting OR standup)",
    }
    if category != "all" and category in _GMAIL_CATEGORY_QUERIES:
        gmail_query = f"({gmail_query}) AND ({_GMAIL_CATEGORY_QUERIES[category]})"

    params = {
        "q": gmail_query,
        "maxResults": str(min(limit, 50)),
    }

    resp = await _http.get(
        "https://gmail.googleapis.com/gmail/v1/users/me/messages",
        headers={"Authorization": f"Bearer {token}"},
        params=params,
        timeout=15,
    )

    if resp.status_code == 401:
        token = await _refresh_google_token()
        resp = await _http.get(
            "https://gmail.googleapis.com/gmail/v1/users/me/messages",
            headers={"Authorization": f"Bearer {token}"},
            params=params,
            timeout=15,
        )

    if resp.status_code >= 400:
        log.error(f"Gmail API error: {resp.status_code} {resp.text}")
        raise HTTPException(resp.status_code, f"Gmail API: {resp.text}")

    data = resp.json()
    message_ids = [m["id"] for m in data.get("messages", [])]

    # Jede Nachricht einzeln holen (Header-Details)
    emails = []
    for mid in message_ids[:limit]:
        try:
            mr = await _http.get(
                f"https://gmail.googleapis.com/gmail/v1/users/me/messages/{mid}",
                headers={"Authorization": f"Bearer {token}"},
                params=[
                    ("format", "metadata"),
                    ("metadataHeaders", "Subject"),
                    ("metadataHeaders", "From"),
                    ("metadataHeaders", "To"),
                    ("metadataHeaders", "Date"),
                ],
                timeout=10,
            )
            if mr.status_code != 200:
                continue

            msg = mr.json()
            headers = {h["name"]: h["value"] for h in msg.get("payload", {}).get("headers", [])}

            subject = headers.get("Subject", "(Kein Betreff)")
            from_addr = headers.get("From", "")
            to_addr = headers.get("To", "")
            date_str = headers.get("Date", "")
            snippet = msg.get("snippet", "")
            labels = msg.get("labelIds", [])

            # Automatische Kategorisierung
            combined = f"{subject} {from_addr} {snippet}".lower()
            email_cat = "sonstiges"
            for keywords, ecat in [
                (["onboarding", "kickoff", "client", "kunde", "willkommen"], "clients"),
                (["rechnung", "invoice", "zahlung", "payment", "billing"], "invoices"),
                (["automation", "flowstack", "campaign", "kampagne", "meta ads"], "automation"),
                (["meeting", "standup", "call", "termin", "agenda"], "meetings"),
                (["bewerbung", "application", "recruiting", "stelle", "position"], "recruiting"),
            ]:
                if any(kw in combined for kw in keywords):
                    email_cat = ecat
                    break

            # Tags
            email_tags: list[str] = []
            if "IMPORTANT" in labels:
                email_tags.append("Wichtig")
            if "STARRED" in labels:
                email_tags.append("Markiert")
            if "SENT" in labels:
                email_tags.append("Gesendet")
            if "INBOX" in labels:
                email_tags.append("Posteingang")
            if msg.get("payload", {}).get("parts"):
                has_attachment = any(
                    p.get("filename") for p in msg["payload"]["parts"] if p.get("filename")
                )
                if has_attachment:
                    email_tags.append("Anhang")

            emails.append({
                "id": mid,
                "subject": subject,
                "from": from_addr,
                "to": to_addr,
                "date": date_str,
                "snippet": snippet,
                "category": email_cat,
                "tags": email_tags,
                "url": f"https://mail.google.com/mail/u/0/#inbox/{mid}",
                "starred": "STARRED" in labels,
            })
        except Exception as e:
            log.warning(f"Gmail Message {mid} fehlgeschlagen: {e}")
            continue

    # Kategorien-Zusammenfassung
    cat_counts: dict[str, int] = {}
    for e in emails:
        cat_counts[e["category"]] = cat_counts.get(e["category"], 0) + 1

    return {
        "ok": True,
        "total": len(emails),
        "categories": cat_counts,
        "emails": emails,
    }


# ══════════════════════════════════════════════════════════════════════════════
# DriveVault - Auto-Organize: Rename + Sort + Tag
# ══════════════════════════════════════════════════════════════════════════════


async def _rename_drive_file(file_id: str, new_name: str) -> bool:
    """Datei in Google Drive umbenennen."""
    token = await _refresh_google_token()
    resp = await _http.patch(
        f"https://www.googleapis.com/drive/v3/files/{file_id}",
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
        json={"name": new_name},
        timeout=10,
    )
    if resp.status_code == 200:
        log.info(f"Renamed: {file_id} → {new_name}")
        return True
    log.error(f"Rename failed ({resp.status_code}): {resp.text}")
    return False


async def _ensure_folder(name: str, parent_id: Optional[str] = None) -> str:
    """Ordner in Google Drive finden oder erstellen. Gibt folder_id zurück."""
    token = await _refresh_google_token()

    # Erst suchen ob Ordner schon existiert
    q = f"mimeType='application/vnd.google-apps.folder' and name='{name}' and trashed=false"
    if parent_id:
        q += f" and '{parent_id}' in parents"

    resp = await _http.get(
        "https://www.googleapis.com/drive/v3/files",
        headers={"Authorization": f"Bearer {token}"},
        params={"q": q, "fields": "files(id,name)", "pageSize": "1"},
        timeout=10,
    )
    if resp.status_code == 200:
        files = resp.json().get("files", [])
        if files:
            return files[0]["id"]

    # Ordner erstellen
    body: dict = {
        "name": name,
        "mimeType": "application/vnd.google-apps.folder",
    }
    if parent_id:
        body["parents"] = [parent_id]

    resp = await _http.post(
        "https://www.googleapis.com/drive/v3/files",
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
        json=body,
        timeout=10,
    )
    if resp.status_code == 200:
        folder_id = resp.json()["id"]
        log.info(f"Created folder: {name} ({folder_id})")
        return folder_id
    log.error(f"Create folder failed: {resp.text}")
    return ""


@app.post("/api/drive-vault/create-folders")
async def create_vault_folders():
    """Erstellt die komplette Ordner-Hierarchie für DriveVault in Google Drive."""
    token = await _refresh_google_token()
    if not token:
        raise HTTPException(503, "Google OAuth nicht konfiguriert")

    # Root-Ordner: "Flowstack Vault"
    root_id = await _ensure_folder("Flowstack Vault")
    if not root_id:
        raise HTTPException(500, "Root-Ordner konnte nicht erstellt werden")

    created: dict[str, dict] = {}

    for cat_key, cat_cfg in _DRIVE_FOLDER_STRUCTURE.items():
        cat_folder_id = await _ensure_folder(cat_cfg["name"], root_id)
        children_ids: dict[str, str] = {}

        for sub_key, sub_name in cat_cfg.get("children", {}).items():
            sub_id = await _ensure_folder(sub_name, cat_folder_id)
            children_ids[sub_key] = sub_id

        created[cat_key] = {"id": cat_folder_id, "name": cat_cfg["name"], "children": children_ids}

    log.info(f"Vault folders created: {len(created)} categories")
    return {"ok": True, "root_id": root_id, "folders": created}


@app.post("/api/drive-vault/organize")
async def organize_drive_files(body: Optional[dict] = None):
    """Alle Drive-Dateien analysieren, umbenennen und in richtige Ordner sortieren.

    Body options:
      dry_run: bool (default true) - nur Preview, keine Änderungen
      rename: bool (default true) - Dateien umbenennen
      move: bool (default true) - Dateien in Ordner verschieben
      file_ids: list[str] (optional) - nur bestimmte Dateien verarbeiten
    """
    opts = body or {}
    dry_run = opts.get("dry_run", True)
    do_rename = opts.get("rename", True)
    do_move = opts.get("move", True)
    target_ids = set(opts.get("file_ids", []))

    # Alle Dateien laden
    vault_resp = await drive_vault_search(q="", category="all", doc_type="all", limit=500)
    all_files = vault_resp["files"]

    if target_ids:
        all_files = [f for f in all_files if f["id"] in target_ids]

    # Ordner-Struktur sicherstellen (nur wenn move aktiv und nicht dry_run)
    folder_map: dict[str, dict] = {}
    if do_move and not dry_run:
        folders_resp = await create_vault_folders()
        folder_map = folders_resp["folders"]

    actions: list[dict] = []

    for f in all_files:
        file_id = f["id"]
        current_name = f["name"]
        category = f["category"]
        subcategory = f.get("subcategory", "")

        # Skip "Unbenanntes Dokument" - markieren als zu prüfen
        if current_name.startswith("Unbenanntes Dokument"):
            actions.append({
                "id": file_id,
                "current_name": current_name,
                "new_name": None,
                "action": "skip",
                "reason": "Unbenanntes Dokument - manuell benennen",
                "category": category,
                "subcategory": subcategory,
            })
            continue

        # Neuen Namen generieren
        new_name = _generate_standard_name(current_name, category, subcategory)
        name_changed = new_name != current_name

        # Ziel-Ordner bestimmen
        target_folder_id = ""
        target_folder_name = ""
        if category in _DRIVE_FOLDER_STRUCTURE:
            cat_cfg = _DRIVE_FOLDER_STRUCTURE[category]
            target_folder_name = cat_cfg["name"]
            if subcategory and subcategory in cat_cfg.get("children", {}):
                target_folder_name += f" / {cat_cfg['children'][subcategory]}"
                if category in folder_map:
                    target_folder_id = folder_map[category]["children"].get(subcategory, "")
            elif category in folder_map:
                target_folder_id = folder_map[category]["id"]

        action: dict = {
            "id": file_id,
            "current_name": current_name,
            "new_name": new_name if name_changed else None,
            "category": category,
            "subcategory": subcategory,
            "target_folder": target_folder_name,
            "action": "rename+move" if name_changed else "move",
            "tags": f.get("tags", []),
        }

        if not dry_run:
            # Umbenennen
            if do_rename and name_changed:
                renamed = await _rename_drive_file(file_id, new_name)
                action["renamed"] = renamed

            # In Ordner verschieben
            if do_move and target_folder_id:
                await move_to_drive_folder(file_id, target_folder_id)
                action["moved"] = True

        actions.append(action)

    summary = {
        "total": len(actions),
        "rename": sum(1 for a in actions if a.get("new_name")),
        "move": sum(1 for a in actions if a.get("target_folder")),
        "skip": sum(1 for a in actions if a.get("action") == "skip"),
    }

    return {
        "ok": True,
        "dry_run": dry_run,
        "summary": summary,
        "actions": actions,
    }


@app.get("/api/drive-vault/hierarchy")
async def drive_vault_hierarchy():
    """Gibt die Kategorie-Hierarchie mit Sub-Kategorien zurück.

    Wird vom Frontend für die hierarchische Filter-Navigation verwendet.
    """
    hierarchy: dict = {}
    for cat_key, cat_cfg in _DRIVE_FOLDER_STRUCTURE.items():
        hierarchy[cat_key] = {
            "name": cat_cfg["name"],
            "children": {k: v for k, v in cat_cfg.get("children", {}).items()},
        }
    return {"ok": True, "hierarchy": hierarchy}


@app.delete("/api/drive-vault/{file_id}")
async def delete_drive_file(file_id: str):
    """Datei in Google Drive in den Papierkorb verschieben (trashed=true)."""
    token = await _refresh_google_token()
    if not token:
        raise HTTPException(503, "Google OAuth nicht konfiguriert")
    resp = await _http.patch(
        f"https://www.googleapis.com/drive/v3/files/{file_id}",
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
        json={"trashed": True},
        timeout=10,
    )
    if resp.status_code == 200:
        log.info(f"Trashed file: {file_id}")
        return {"ok": True, "file_id": file_id}
    log.error(f"Trash failed ({resp.status_code}): {resp.text}")
    raise HTTPException(resp.status_code, f"Delete failed: {resp.text}")


@app.post("/api/drive-vault/rename")
async def rename_drive_file_endpoint(body: dict):
    """Einzelne Datei umbenennen. Body: {file_id, new_name}"""
    file_id = body.get("file_id", "")
    new_name = body.get("new_name", "")
    if not file_id or not new_name:
        raise HTTPException(400, "file_id und new_name erforderlich")
    ok = await _rename_drive_file(file_id, new_name)
    return {"ok": ok, "file_id": file_id, "new_name": new_name}


@app.post("/api/drive-vault/fix-names")
async def fix_file_names():
    """Repariert alle Naming-Probleme: doppelte Prefixe, doppelte Typen, etc."""
    import re
    vault_resp = await drive_vault_search(q="", category="all", doc_type="all", limit=500)
    all_files = vault_resp["files"]

    fixed = []
    for f in all_files:
        name = f["name"]
        clean = name

        # 1. Doppelte [PREFIX] [PREFIX] → [PREFIX]
        m = re.match(r'^(\[[\w\s]+\])\s+\1\s*(.*)', clean)
        if m:
            clean = f"{m.group(1)} {m.group(2)}".strip()

        # 2. [X] Typ - [X] Typ Rest → [X] Typ - Rest
        m = re.match(r'^(\[[\w\s]+\])\s+(\w+)\s*-\s*\1\s+\2\s*(.*)', clean)
        if m:
            clean = f"{m.group(1)} {m.group(2)} - {m.group(3)}".strip()

        # 3. [X] Typ - Typ Rest → [X] Typ - Rest (doppelter Typ nach Dash)
        m = re.match(r'^(\[[\w\s]+\])\s+(\w+)\s+-\s+\2\s+(.*)', clean)
        if m:
            clean = f"{m.group(1)} {m.group(2)} - {m.group(3)}".strip()

        # 4. Doppelte Versionen: V2 V2 → V2
        clean = re.sub(r'\b(V\d)\s+\1\b', r'\1', clean)

        # 5. Doppeltes (Baulig Roh)
        clean = clean.replace("(Baulig Roh) (Baulig Roh)", "(Baulig Roh)")

        # 6. Mehrfache Leerzeichen
        clean = re.sub(r'\s+', ' ', clean).strip()

        # 7. Trailing -
        clean = clean.rstrip(' -')

        if clean != name:
            renamed = await _rename_drive_file(f["id"], clean)
            fixed.append({"id": f["id"], "old": name, "new": clean, "ok": renamed})

    return {"ok": True, "fixed": len(fixed), "details": fixed}


@app.post("/api/drive-vault/retag")
async def retag_drive_file(body: dict):
    """Manuelles Umtaggen einer Datei. Body: {file_id, category?, subcategory?}
    Speichert Override in drive-overrides.json.
    """
    file_id = body.get("file_id", "")
    if not file_id:
        raise HTTPException(400, "file_id erforderlich")
    overrides = _load_overrides()
    ov = overrides.get(file_id, {})
    if "category" in body:
        ov["category"] = body["category"]
    if "subcategory" in body:
        ov["subcategory"] = body["subcategory"]
    overrides[file_id] = ov
    _save_overrides(overrides)
    log.info(f"Retag {file_id}: {ov}")
    return {"ok": True, "file_id": file_id, "override": ov}


@app.delete("/api/drive-vault/retag/{file_id}")
async def remove_retag(file_id: str):
    """Manuelles Override entfernen (zurück zur automatischen Erkennung)."""
    overrides = _load_overrides()
    if file_id in overrides:
        del overrides[file_id]
        _save_overrides(overrides)
    return {"ok": True, "file_id": file_id}


@app.get("/api/drive-vault/categories")
async def list_all_categories():
    """Gibt alle verfügbaren Kategorien und Sub-Kategorien zurück."""
    cats = {k: v["name"] for k, v in _DRIVE_FOLDER_STRUCTURE.items()}
    subcats = {}
    for k, v in _DRIVE_FOLDER_STRUCTURE.items():
        if v.get("children"):
            subcats[k] = v["children"]
    return {"ok": True, "categories": cats, "subcategories": subcats}


@app.post("/api/drive-vault/copy-to-flowstack")
async def copy_files_to_flowstack(body: dict):
    """Kopiert Dateien von Leadflow nach Flowstack (Cross-Account Copy).
    Body: {file_ids: [str]} - Liste von Leadflow-File-IDs.
    Exportiert als docx/xlsx und importiert in Flowstack Account.
    """
    import asyncio
    file_ids = body.get("file_ids", [])
    if not file_ids:
        raise HTTPException(400, "file_ids erforderlich")

    leadflow_token = await _refresh_leadflow_token()
    flowstack_token = await _refresh_google_token()
    if not leadflow_token or not flowstack_token:
        raise HTTPException(503, "OAuth Tokens fehlen")

    results = []
    mime_export_map = {
        "application/vnd.google-apps.document": ("application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/vnd.google-apps.document"),
        "application/vnd.google-apps.spreadsheet": ("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/vnd.google-apps.spreadsheet"),
        "application/vnd.google-apps.presentation": ("application/vnd.openxmlformats-officedocument.presentationml.presentation", "application/vnd.google-apps.presentation"),
    }

    for fid in file_ids:
        try:
            # 1. Datei-Metadaten von Leadflow holen
            meta_resp = await _http.get(
                f"https://www.googleapis.com/drive/v3/files/{fid}",
                headers={"Authorization": f"Bearer {leadflow_token}"},
                params={"fields": "name,mimeType"},
                timeout=10,
            )
            if meta_resp.status_code != 200:
                results.append({"id": fid, "ok": False, "error": f"Meta: {meta_resp.status_code}"})
                continue

            meta = meta_resp.json()
            name = meta["name"]
            mime = meta["mimeType"]

            if mime not in mime_export_map:
                results.append({"id": fid, "ok": False, "error": f"Unsupported type: {mime}"})
                continue

            export_mime, import_mime = mime_export_map[mime]

            # 2. Content von Leadflow exportieren
            export_resp = await _http.get(
                f"https://www.googleapis.com/drive/v3/files/{fid}/export",
                headers={"Authorization": f"Bearer {leadflow_token}"},
                params={"mimeType": export_mime},
                timeout=30,
            )
            if export_resp.status_code != 200:
                results.append({"id": fid, "ok": False, "error": f"Export: {export_resp.status_code}"})
                continue

            content = export_resp.content

            # 3. In Flowstack importieren (multipart upload)
            import json as _json
            metadata = _json.dumps({"name": name, "mimeType": import_mime}).encode()
            boundary = b"flowstack_boundary_12345"
            body_parts = (
                b"--" + boundary + b"\r\n"
                b"Content-Type: application/json; charset=UTF-8\r\n\r\n"
                + metadata + b"\r\n"
                b"--" + boundary + b"\r\n"
                b"Content-Type: " + export_mime.encode() + b"\r\n\r\n"
                + content + b"\r\n"
                b"--" + boundary + b"--"
            )

            upload_resp = await _http.post(
                "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",
                headers={
                    "Authorization": f"Bearer {flowstack_token}",
                    "Content-Type": f"multipart/related; boundary={boundary.decode()}",
                },
                content=body_parts,
                timeout=30,
            )
            if upload_resp.status_code == 200:
                new_file = upload_resp.json()
                results.append({"id": fid, "ok": True, "name": name, "new_id": new_file.get("id", "")})
                log.info(f"Copied {name} → Flowstack (new ID: {new_file.get('id', '')})")
            else:
                results.append({"id": fid, "ok": False, "error": f"Upload: {upload_resp.status_code}"})
        except Exception as e:
            results.append({"id": fid, "ok": False, "error": str(e)})

    success = sum(1 for r in results if r.get("ok"))
    return {"ok": True, "copied": success, "total": len(file_ids), "results": results}


async def _get_doc_content(token: str, file_id: str) -> Optional[str]:
    """Liest den Textinhalt eines Google Docs Dokuments."""
    try:
        resp = await _http.get(
            f"https://docs.googleapis.com/v1/documents/{file_id}",
            headers={"Authorization": f"Bearer {token}"},
            params={"fields": "body"},
            timeout=10,
        )
        if resp.status_code != 200:
            return None
        body = resp.json().get("body", {})
        # Extrahiere den reinen Text aus allen StructuralElements
        text_parts: list[str] = []
        for elem in body.get("content", []):
            paragraph = elem.get("paragraph", {})
            for pe in paragraph.get("elements", []):
                text_run = pe.get("textRun", {})
                content = text_run.get("content", "")
                if content:
                    text_parts.append(content)
        return "".join(text_parts).strip()
    except Exception as e:
        log.warning(f"Doc content read failed for {file_id}: {e}")
        return None


async def _get_sheet_content(token: str, file_id: str) -> Optional[str]:
    """Liest den Zellinhalt eines Google Sheets."""
    try:
        resp = await _http.get(
            f"https://sheets.googleapis.com/v4/spreadsheets/{file_id}/values/A:ZZ",
            headers={"Authorization": f"Bearer {token}"},
            timeout=10,
        )
        if resp.status_code != 200:
            return None
        values = resp.json().get("values", [])
        # Alle Zellen als einen String zusammenfügen
        parts: list[str] = []
        for row in values:
            parts.append("\t".join(str(cell) for cell in row))
        return "\n".join(parts).strip()
    except Exception as e:
        log.warning(f"Sheet content read failed for {file_id}: {e}")
        return None


@app.get("/api/drive-vault/duplicates")
async def find_content_duplicates(limit: int = 500):
    """Findet Dokumente mit 1:1 identischem Inhalt (Content-Level Dedup)."""
    import asyncio
    import hashlib

    # Alle Dateien laden
    vault_resp = await drive_vault_search(q="", category="all", doc_type="all", limit=limit)
    all_files = vault_resp["files"]

    # Tokens refreshen
    flowstack_token = await _refresh_google_token()
    leadflow_token = await _refresh_leadflow_token()

    def _token_for(f: dict) -> str:
        return leadflow_token if f.get("account") == "leadflow" else flowstack_token

    # Content-Hashes berechnen - in Batches um Rate Limits zu vermeiden
    file_hashes: dict[str, str] = {}  # file_id → hash
    batch_size = 10

    for i in range(0, len(all_files), batch_size):
        batch = all_files[i:i + batch_size]
        tasks = []
        for f in batch:
            token = _token_for(f)
            if f["type"] == "docs":
                tasks.append(_get_doc_content(token, f["id"]))
            elif f["type"] == "sheets":
                tasks.append(_get_sheet_content(token, f["id"]))
            else:
                async def _noop():
                    return None
                tasks.append(_noop())

        contents = await asyncio.gather(*tasks)

        for f, content in zip(batch, contents):
            if content is not None and content != "":
                h = hashlib.sha256(content.encode("utf-8")).hexdigest()
                file_hashes[f["id"]] = h
            elif content == "":
                # Leere Dokumente bekommen einen speziellen Hash
                file_hashes[f["id"]] = "EMPTY_DOCUMENT"

    # Duplikate gruppieren (gleicher Hash → gleicher Inhalt)
    hash_groups: dict[str, list[str]] = {}
    for fid, h in file_hashes.items():
        hash_groups.setdefault(h, []).append(fid)

    # Nur Gruppen mit >1 Datei = Duplikate
    file_lookup = {f["id"]: f for f in all_files}
    duplicate_groups = []
    for h, fids in hash_groups.items():
        if len(fids) > 1:
            group_files = []
            for fid in fids:
                f = file_lookup.get(fid, {})
                group_files.append({
                    "id": fid,
                    "name": f.get("name", ""),
                    "type": f.get("type", ""),
                    "account": f.get("account", ""),
                    "folder": f.get("folder", ""),
                    "modifiedTime": f.get("modifiedTime", ""),
                    "url": f.get("url", ""),
                })
            is_empty = h == "EMPTY_DOCUMENT"
            duplicate_groups.append({
                "hash": h[:12],
                "count": len(fids),
                "empty": is_empty,
                "files": group_files,
            })

    # Sortieren: größte Gruppen zuerst
    duplicate_groups.sort(key=lambda g: g["count"], reverse=True)

    total_dupes = sum(g["count"] - 1 for g in duplicate_groups)  # -1 weil 1 Original bleibt

    return {
        "ok": True,
        "total_files_checked": len(all_files),
        "files_with_content": len(file_hashes),
        "duplicate_groups": len(duplicate_groups),
        "total_duplicates": total_dupes,
        "groups": duplicate_groups,
    }




if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="0.0.0.0", port=3002, reload=True)
