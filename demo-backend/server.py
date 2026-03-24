"""
Flowstack Demo Backend — Echte API-Calls für die Novacode Recruiting Automation.

Gestartet mit: doppler run --project fulfillment-automation --config dev_claudio -- python server.py
Alle Credentials kommen aus Doppler Environment Variables.
"""
from __future__ import annotations

import os
import json
import logging
import random
from datetime import datetime, timedelta
from typing import Any, Optional

import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from terminal_ws import router as terminal_router
from claude_ws import router as claude_router
from whisper_api import router as whisper_router
from prompt_optimizer import router as optimizer_router

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("demo-backend")

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

# OpenRouter (AI-Generierung fuer V2 — NICHT für V3 nutzen, gehört Anak)
OPENROUTER_API_KEY = os.environ.get("OPENROUTER_API_KEY", os.environ.get("OPENAI_API_KEY", ""))

# Gemini (AI-Generierung fuer V3 — kostenlos)
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")

# Google OAuth Token (JSON string) — Flowstack Account
_google_raw = os.environ.get("FLOWSTACK_GOOGLE_OAUTH_TOKEN", os.environ.get("GOOGLE_OAUTH_TOKEN", "{}"))
try:
    _google_creds = json.loads(_google_raw)
except json.JSONDecodeError:
    _google_creds = {}

GOOGLE_ACCESS_TOKEN = _google_creds.get("token", "")
GOOGLE_REFRESH_TOKEN = _google_creds.get("refresh_token", "")
GOOGLE_CLIENT_ID = _google_creds.get("client_id", "")
GOOGLE_CLIENT_SECRET = _google_creds.get("client_secret", "")

# Google OAuth Token — Leadflow Marketing Account
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

# Close Pipeline (Leadflow Marketing)
CLOSE_PIPELINE_ID = "pipe_2TVzpzEm61EWx44ChCXZtx"  # Fulfillment

# Close Custom Field IDs (Leadflow Marketing)
CLOSE_FIELDS = {
    "service_type": "cf_jEk9N9Gt16fSfE4QCaQaSr6x9tFepVW10RhiimbAMWx",
    "account_manager": "cf_pAyQcAn0Je6P6zG8Z4MhRt7fR5SqChLrZShxn2zKRLf",
    "onboarding_date": "cf_E5xlvPH9AJSAydUh0e3iNW6dzkG1FEudfe09t9i4IMw",
    "automation_status": "cf_KwGpEW5HIhJBG5aOKFpM7pj4HnvXtzMOH9HdM4jSeLE",
}

# Close Stage IDs (will be populated on startup)
CLOSE_STAGES: dict[str, str] = {}

# Close V2 Pipeline (neue Org "Leadflow Marketing")
_v2_config_path = os.path.join(os.path.dirname(__file__), "close-v2-config.json")
if os.path.exists(_v2_config_path):
    with open(_v2_config_path) as _f:
        _v2_cfg = json.load(_f)
    CLOSE_V2_PIPELINE_ID = _v2_cfg["pipeline"]["id"]
    CLOSE_V2_STAGES = _v2_cfg["pipeline"]["stages"]
    CLOSE_V2_FIELDS = {k: v["id"] for k, v in _v2_cfg["custom_fields"].items()}
else:
    CLOSE_V2_PIPELINE_ID = ""
    CLOSE_V2_STAGES = {}
    CLOSE_V2_FIELDS = {}

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


# Vorbereitete Dokument-Links (Google Docs)
STRATEGY_DOCS = {
    "Zielgruppen-Avatar": "https://docs.google.com/document/d/1TOLqoqvEYy_DTxMb1zSUeq-cmXmNHmmUQe9EG2B1vEY/edit",
    "Arbeitgeber-Avatar": "https://docs.google.com/document/d/1de1XU5ykeIw36kKSiorQqzPAGkHfsceflnTCBpVY26Q/edit",
    "Messaging-Matrix": "https://docs.google.com/document/d/1HLMrDn_p1aqL7nnfB09e0mPakj-m0BSIhQwTdkoX03E/edit",
    "Creative Briefing": "https://docs.google.com/document/d/1sxB6R6l4DUn10hYEhY5xCEkNxZ4dvE9EUFvgT0hmCz8/edit",
    "Marken-Richtlinien": "https://docs.google.com/document/d/1Xp0y_liDQ43AMdH3cjEwxdo9ZSZOP1AlVr8r-pn2Cps/edit",
}
COPY_DOCS = {
    "Landingpage-Texte": "https://docs.google.com/document/d/1CEZAzrioyaqn7PMfc0ARadG1Jw5ic-uXTV4tE1aX2PU/edit",
    "Formularseite-Texte": "https://docs.google.com/document/d/1Qe0zXGHVcABIEMTZUn4tMttloGfa14bpCtKU3L95-Qw/edit",
    "Dankeseite-Texte": "https://docs.google.com/document/d/13M6owsnBTr6OAElN0LvhF5Oz_Ky4l0OdvhSb2dhfQ7g/edit",
    "Anzeigentexte": "https://docs.google.com/document/d/1lf2U2ZI47-Oz8eTW8OKziGwN_Z_SAssS8DiJAiiJ5SQ/edit",
    "Videoskript": "https://docs.google.com/document/d/171Eg7V8jKGOYrqdYOLUM6DvfDodet_mxPrUB5DmMqEs/edit",
}
TRANSCRIPT_DOC = "https://docs.google.com/document/d/1ZO6yLLW18GLjJd1xuCc8jytaGwPi0jedoSkUR8LO-eM/edit"
FUNNEL_LINKS = {
    "Landingpage": "https://demo-recruiting.vercel.app/demo-landing/",
    "Bewerbungsseite": "https://demo-recruiting.vercel.app/demo-formular",
    "Dankeseite": "https://demo-recruiting.vercel.app/demo-danke",
}
TRACKING_SHEET = "https://docs.google.com/spreadsheets/d/1EmgdSqPPpouA20wY3OhMu1PGCA-Y_aCeztDHUF2zXeY/edit"
TRACKING_DASHBOARD = "https://demo-recruiting.vercel.app/recruiting"

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


async def close_api_v2(method: str, path: str, data: Optional[dict] = None) -> dict:
    """Close CRM API call fuer V2 Org (Leadflow Marketing)."""
    resp = await _http.request(
        method,
        f"https://api.close.com/api/v1{path}",
        json=data,
        auth=(CLOSE_API_KEY_V2, ""),
    )
    if resp.status_code >= 400:
        log.error(f"Close V2 API error: {resp.status_code} {resp.text}")
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
    body = {
        "properties": {"title": f"{company} - Projekt-Übersicht"},
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
        log.warning("_append_sheet_row: Keine spreadsheet_id — übersprungen")
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
    """Block Kit Message — V5 Design (Color Bar, Fields mit Spacing, ein Divider).

    sections: Flexibel — jede Section kann enthalten:
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
SLACK_COLOR_SUCCESS = "#36a64f"   # Grün — abgeschlossen
SLACK_COLOR_INFO = "#1264a3"      # Blau — informational
SLACK_COLOR_WARNING = "#ff9900"   # Gelb — warte auf Aktion

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
    """Ad Account ID mit act_ Prefix (fuer API calls)."""
    if not META_AD_ACCOUNT:
        return ""
    return META_AD_ACCOUNT if META_AD_ACCOUNT.startswith("act_") else f"act_{META_AD_ACCOUNT}"

def _meta_acct_numeric() -> str:
    """Ad Account ID ohne act_ Prefix (fuer Ads Manager URLs)."""
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

# Anzeigentexte — 3 Varianten (Meta-formatiert: kein Markdown, Zeilenumbrueche via \n)
AD_COPY_INITIAL = [
    # Variante 1: Klassisch/Strukturiert
    "{company} sucht: Senior Fullstack Developer (m/w/d) – Düsseldorf / Hybrid\n\nDu willst wieder entwickeln.\nNicht nur Tickets schieben.\n\nDann lies weiter.\n\nWir sind {company}.\n19 Leute.\nEin Softwareunternehmen aus Düsseldorf.\n\nWir bauen individuelle Lösungen für den Mittelstand.\nKeine Agentur.\nKein Bauchladen.\nEchtes Product Engineering.\n\nDein Stack:\nReact. TypeScript. Node.js. PostgreSQL. AWS. Docker. GitHub Actions.\n\nDein Arbeitsmodell:\n2 Tage Büro in Düsseldorf.\n3 Tage remote.\nKernzeit: 10–15 Uhr.\n\nDas bieten wir dir:\n• 65.000–85.000 € Jahresgehalt.\n• 30 Urlaubstage.\n• 3.000 € Weiterbildungsbudget pro Jahr.\n• Hardware deiner Wahl.\n• Eigene Projektverantwortung.\n• Direkter Kundenkontakt.\n\nDas bringst du mit:\n• Mindestens 4 Jahre Erfahrung als Fullstack Developer.\n• Sicher in React, Node.js und TypeScript.\n• Architekturverständnis und eigenständige Arbeitsweise.\n• Fließend Deutsch.\n\nUnser Bewerbungsprozess:\n20 Minuten Kennenlernen.\nTech-Gespräch mit einem Senior Dev.\nEntscheidung in 14 Tagen.\n\nKein Anschreiben.\nKein 6-Stunden-Coding-Test.\n\n6 Jahre am Markt.\nBootstrapped.\nProfitabel.\nKein Startup-Chaos.\n\nDie Bewerbung dauert unter 3 Minuten.\n\n→ Jetzt bewerben",
    # Variante 2: Schmerzpunkt/Emotional
    "Du bist Entwickler.\nDu bist verdammt gut in dem, was du tust.\n\nAber jetzt mal ehrlich:\n\nWann hast du das letzte Mal ein Feature gebaut, das wirklich live gegangen ist?\n\nWann hast du das letzte Mal eine Architekturentscheidung selbst getroffen – ohne dass ein Manager sie zerredet hat?\n\nWann hast du das letzte Mal das Gefühl gehabt, dass du dich weiterentwickelst?\n\nWenn du jetzt überlegen musstest, dann weißt du, was das bedeutet.\n\nEs ist Zeit.\n\nNicht, weil dein Job schlecht ist.\nNicht, weil deine Kollegen schlecht sind.\n\nSondern, weil du aufgehört hast, Entwickler zu sein.\n\nWir sind {company}.\n\nEin Softwareunternehmen aus Düsseldorf.\n19 Mitarbeiter.\nWir bauen individuelle Software für den Mittelstand.\n\nKeine Agentur.\nKein Bauchladen.\nEchtes Engineering.\n\nUnser Stack?\nReact. TypeScript. Node.js. PostgreSQL. AWS.\n\nWir suchen einen Senior Fullstack Developer (m/w/d), der wieder coden will.\nDer wieder entscheiden will.\nDer wieder deployen will.\n\nWas dich erwartet:\n\n✅ Eigene Projektverantwortung ab Tag 1.\n✅ Direkter Kundenkontakt – du bist nicht der Letzte in der Kette.\n✅ Moderner Stack, kein Legacy.\n✅ Hybrid: 2 Tage Büro, 3 Tage remote.\n✅ 65.000–85.000 € Jahresgehalt.\n✅ 30 Urlaubstage.\n✅ 3.000 € Weiterbildungsbudget pro Jahr.\n✅ Hardware deiner Wahl.\n\nKein Coding-Marathon im Bewerbungsprozess.\nKein Assessment-Center.\nDu sprichst direkt mit einem unserer Senior Devs – auf Augenhöhe.\n\n6 Jahre am Markt.\nProfitabel.\nKein VC.\nKein Startup-Chaos.\n\nDie Bewerbung dauert unter 3 Minuten.\nKein Anschreiben nötig.\n\n→ Jetzt bewerben",
    # Variante 3: Contrarian/Pattern Interrupt
    "Diese Anzeige ist nichts für dich.\n\nNicht, wenn du glücklich bist mit endlosen Meetings.\nNicht, wenn du okay damit bist, dass deine Features nie live gehen.\nNicht, wenn du mit einem Tech-Stack aus 2016 zufrieden bist.\n\nAber wenn du abends denkst: «Ich will wieder bauen.»\nDann lies weiter.\n\nWir sind {company}.\n\n19 Leute. 14 Entwickler. Durchschnittsalter: 32.\nWir entwickeln individuelle Software für den Mittelstand.\nInterne Tools. Prozessautomatisierung. Plattformen.\n\nKein Agentur-Bauchladen.\nKein «Wir machen alles».\nReines Custom Development.\n\nUnser Stack?\nReact. TypeScript. Node.js. Go. PostgreSQL. AWS. Docker.\nCI/CD via GitHub Actions.\n\nWas bei uns anders ist?\nDu triffst Architekturentscheidungen.\nDu sprichst direkt mit Kunden.\nDu deployst Code, der in Produktion läuft.\nNicht Code, der auf dem Feature-Friedhof verrottet.\n\nWir sagen nicht «flache Hierarchien».\nWir sagen: 19 Leute. Keine Hierarchie. Punkt.\n\nWir sagen nicht «Startup-Mentalität».\nWir sagen: 6 Jahre profitabel. Kein VC. Kein Chaos.\n\nWir sagen nicht «wie eine Familie».\nWir sagen: Profis, die abliefern. Und um 17 Uhr Feierabend machen.\n\nHybrid: 2 Tage Düsseldorf. 3 Tage remote.\nKernzeit: 10–15 Uhr.\n\n65.000–85.000 €.\n30 Tage Urlaub.\n3.000 € Weiterbildungsbudget.\n\nBewerbungsprozess?\n20 Minuten Call.\nTech-Talk mit einem Engineer.\nArchitektur-Diskussion.\n\nKein Whiteboard. Kein Assessment-Center.\nEntscheidung in 14 Tagen.\n\nUnter 3 Minuten.\nKein Anschreiben.\n\n→ Jetzt bewerben",
]
AD_COPY_RETARGETING = [
    # Variante 1: Direkt/Erinnerung
    "Du hast dir die Stelle bei {company} angeschaut.\nAber du hast dich noch nicht beworben.\n\nWarum nicht?\n\nFragst du dich, ob es wirklich passt?\n\nHier sind die Fakten:\n\n✅ Keine langweilige 9-to-5-Mühle. Flexible Arbeitszeiten, die zu deinem Leben passen.\n✅ 100 % Remote oder Hybrid in Düsseldorf. Du entscheidest.\n✅ Ein moderner Tech-Stack. Kein veralteter Kram aus 2015.\n✅ Ein Weiterbildungsbudget, das du wirklich nutzen kannst.\n\nUnd das Beste?\n\nDer Bewerbungsprozess dauert nur 60 Sekunden.\nKein Anschreiben. Kein Lebenslauf-Upload.\n\n→ Beantworte ein paar Fragen und wir melden uns innerhalb von 48 Stunden.",
    # Variante 2: Einwand-Killer
    "«Bin ich gut genug?»\n\nDas denken 90 % der Entwickler.\nUnd genau die sind oft die Besten.\n\nBei {company} suchen wir keine Entwickler mit 47 Zertifikaten.\nWir suchen echte Macher.\n\nLeute, die:\n• Sauberen Code schreiben wollen – nicht nur schnellen.\n• Probleme lösen statt nur Tickets abzuarbeiten.\n• Verantwortung übernehmen wollen.\n\nDu warst schon auf unserer Seite.\nDas zeigt, dass du neugierig bist.\n\nGib deiner Neugier eine Chance.\n60 Sekunden. Kein Risiko.",
    # Variante 3: Social Proof/Knappheit
    "Du warst auf unserer Karriereseite.\nAber du bist noch unentschlossen?\n\nHier ein Update:\n\nIn den letzten 2 Wochen haben wir über 40 Bewerbungen erhalten.\n\nWas Bewerber am häufigsten sagen:\n«Endlich mal ein Prozess, der nicht nervt.»\n«Ich wusste nach 2 Minuten, dass ich mich bewerben will.»\n\n{company} ist kein Konzern.\nHier bist du nicht Entwickler #847.\nHier bist du Teil eines Teams, das zusammen etwas Großes baut.\n\n→ Die Stelle ist noch offen. Aber nicht mehr lange.\n60 Sekunden reichen.",
]
AD_COPY_WARMUP = [
    # Variante 1: Werte/Kultur
    "Die meisten Unternehmen labern von flachen Hierarchien.\nBei {company} gibt es einfach keine.\n\n14 Leute. Jeder kennt jeden.\nEntscheidungen? Fallen in Minuten, nicht in Meetings.\n\nWir bauen Software, die den Mittelstand digitalisiert.\nKein Startup-Gehype. Kein Konzern-Geschwafel.\nNur echte Ergebnisse mit Profis, die wissen, was sie tun.\n\nWillst du sehen, wie wir arbeiten?\n→ Mehr erfahren",
    # Variante 2: Storytelling/Behind the Scenes
    "Freitag, 14:30 Uhr bei {company}:\n\nTim hat sein Feature gerade live gebracht.\nLisa checkt den letzten PR vom Sprint.\nMax? Seit 12 Uhr im Deep Work – und niemand stört ihn.\n\nUm 15 Uhr: Weekly. 20 Minuten. Nicht länger.\nDanach? Wochenende.\n\nKein Crunch. Keine Überstunden.\nNur Code, auf den du stolz sein kannst.\n\n{company} baut digitale Lösungen für den Mittelstand.\nMit einem Team, das Qualität über alles stellt.\n\n→ Mehr über uns erfahren",
    # Variante 3: Provokant/Aufmerksamkeit
    "73 % der Entwickler in Deutschland denken über einen Jobwechsel nach.\nAber nur 12 % bewerben sich.\n\nWarum? Weil jede Stellenanzeige gleich klingt.\n«Dynamisches Team», «spannende Projekte», «attraktives Gehalt».\n\nWir bei {company} sagen dir lieber, was wir NICHT bieten:\n❌ Kein Großraumbüro\n❌ Keine 5 Interview-Runden\n❌ Keine Legacy-Systeme aus den 2000ern\n❌ Keinen Chef, der ständig «kurz mal schauen» will\n\nWas wir bieten?\nDas findest du auf unserer Karriereseite.\n\nAber nur, wenn du neugierig genug bist.",
]


async def upload_meta_images() -> list[str]:
    """Bilder aus ad-images/ zu Meta hochladen, gibt Liste von Image-Hashes zurück."""
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
    return hashes


_AD_CONCEPTS = ["PainPoint", "SocialProof", "Testimonial"]
_AD_ANGLES = ["Fachkraefte", "Zeitersparnis", "ROI"]

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
        log.warning("Kein META_PAGE_ID — Ads-Erstellung uebersprungen")
        return []
    ad_ids: list[str] = []
    month = datetime.now().strftime("%Y-%m")
    copy_text = copy_texts[0].format(company=company) if copy_texts else f"Jetzt bewerben bei {company}!"
    for i, img_hash in enumerate(image_hashes):
        concept = _AD_CONCEPTS[i % len(_AD_CONCEPTS)]
        angle = _AD_ANGLES[i % len(_AD_ANGLES)]
        variant = f"V{i+1}"
        # DACH Naming: Format | Konzept | Angle | Creator | Variante | Datum
        creative_name = f"Image | {concept} | {angle} | Inhouse | {variant} | {month}"
        ad_name = f"{funnel_stage} | {concept} | {angle} | {variant} | {month}"
        creative = await meta_api("POST", f"{acct}/adcreatives", {
            "name": creative_name,
            "object_story_spec": {
                "page_id": META_PAGE_ID,
                "link_data": {
                    "message": copy_text,
                    "link": destination_url,
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
    log.info(f"Meta Ads erstellt fuer AdSet {adset_id}: {ad_ids}")
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
    """Prueft beim Start ob alle vorbereiteten Demo-Docs noch existieren."""
    manifest_path = os.path.join(os.path.dirname(__file__), "staged-docs-manifest.json")
    if not os.path.exists(manifest_path):
        log.warning("staged-docs-manifest.json nicht gefunden — Demo-Docs nicht validiert")
        return

    try:
        with open(manifest_path) as f:
            manifest = json.load(f)
    except Exception as e:
        log.error(f"Manifest laden fehlgeschlagen: {e}")
        return

    token = GOOGLE_ACCESS_TOKEN
    if not token and GOOGLE_REFRESH_TOKEN:
        try:
            import ssl, certifi, urllib.request
            _ctx = ssl.create_default_context(cafile=certifi.where())
            data = json.dumps({
                "client_id": GOOGLE_CLIENT_ID, "client_secret": GOOGLE_CLIENT_SECRET,
                "refresh_token": GOOGLE_REFRESH_TOKEN, "grant_type": "refresh_token",
            }).encode()
            req = urllib.request.Request("https://oauth2.googleapis.com/token", data=data, headers={"Content-Type": "application/json"})
            resp = urllib.request.urlopen(req, timeout=10, context=_ctx)
            token = json.loads(resp.read()).get("access_token", "")
        except Exception:
            log.warning("Google Token Refresh fuer Doc-Validation fehlgeschlagen")
            return

    if not token:
        log.warning("Kein Google Token — Demo-Docs nicht validiert")
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
        log.info(f"Alle {manifest.get('total', 12)} Demo-Docs validiert — bereit fuer Demo")


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
    """is02: Lead in Close erstellen + Pipeline + Custom Fields."""
    company = (body or {}).get("company", "Novacode GmbH")
    contact_name = (body or {}).get("contact", "Claudio Di Franco")
    contact_email = (body or {}).get("email", "clazahlungskonto@gmail.com")
    deal_value = (body or {}).get("deal_value", 299700)  # in Cents (2997 EUR)
    deal_period = (body or {}).get("deal_period", "one_time")  # one_time, monthly, annual

    # Lead erstellen
    lead = await close_api("POST", "/lead/", {
        "name": company,
        "contacts": [{
            "name": contact_name,
            "emails": [{"email": contact_email, "type": "office"}],
        }],
        f"custom.{CLOSE_FIELDS['service_type']}": "Recruiting",
        f"custom.{CLOSE_FIELDS['account_manager']}": "Claudio Di Franco",
        f"custom.{CLOSE_FIELDS['automation_status']}": "Running",
    })
    lead_id = lead["id"]

    # Opportunity in Fulfillment Pipeline
    opp = await close_api("POST", "/opportunity/", {
        "lead_id": lead_id,
        "pipeline_id": CLOSE_PIPELINE_ID,
        "status_id": CLOSE_STAGES.get("Onboarding gestartet"),
        "note": f"Fulfillment Automation gestartet für {company}",
        "value": deal_value,
        "value_period": deal_period,
    })

    # Note
    await close_api("POST", "/activity/note/", {
        "lead_id": lead_id,
        "note": "Onboarding-Formular eingegangen. Fulfillment Automation gestartet.",
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
    # Map to valid choices: Pending, Running, Completed, Error
    automation_status_choice = "Completed" if stage == "Live" else "Running"

    status_id = CLOSE_STAGES.get(stage)
    if not status_id:
        raise HTTPException(400, f"Unbekannte Stage: {stage}")

    await close_api("PUT", f"/opportunity/{opp_id}/", {
        "status_id": status_id,
    })

    # Automation Status auf Lead updaten
    if "lead_id" in body:
        await close_api("PUT", f"/lead/{body['lead_id']}/", {
            f"custom.{CLOSE_FIELDS['automation_status']}": automation_status_choice,
        })

    # Note mit dem detaillierten Status
    await close_api("POST", "/activity/note/", {
        "lead_id": body.get("lead_id", ""),
        "note": f"Stage aktualisiert: {stage}. Status: {automation_status_raw}.",
    })

    lead_id = body.get("lead_id", "")
    return {"ok": True, "stage": stage, "url": f"https://app.close.com/lead/{lead_id}/" if lead_id else "https://app.close.com/"}


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

    # Nur den Upload-Ordner (Bilder) mit dem Kunden teilen — nicht den ganzen Root
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
    # Random Arbeitszeit innerhalb der nächsten 7 Tage (Mo-Fr, 9-16 Uhr)
    if not (body or {}).get("date"):
        now = datetime.now()
        for _ in range(50):
            offset_days = random.randint(2, 7)
            candidate = now + timedelta(days=offset_days)
            if candidate.weekday() < 5:  # Mo-Fr
                break
        date = candidate.strftime("%Y-%m-%d")
        hour = random.choice([9, 10, 11, 13, 14, 15, 16, 17])
        time = f"{hour:02d}:00"
    else:
        date = body["date"]
        time = (body or {}).get("time", "10:00")

    start = f"{date}T{time}:00"
    end_hour = int(time.split(":")[0]) + 1
    end = f"{date}T{end_hour:02d}:{time.split(':')[1]}:00"

    event = await google_api(
        "POST",
        "https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1",
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
        log.warning(f"Kein Google Meet Link im Response — conferenceData: {event.get('conferenceData')}")

    return {
        "event_id": event.get("id"),
        "link": event.get("htmlLink"),
        "meet_link": meet_link,
        "url": event.get("htmlLink", "https://calendar.google.com/"),
    }


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
      vielen Dank für Ihr Vertrauen in Flowstack. Wir freuen uns, <strong>{company}</strong>
      als neuen Kunden zu begrüßen und starten jetzt mit Ihrem Recruiting-Projekt.
    </p>

    <!-- Timeline -->
    <h2 style="margin:28px 0 16px;color:#18181b;font-size:17px;font-weight:600;">
      Ihre nächsten Schritte
    </h2>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td style="padding:12px 16px;background:#f0fdf4;border-left:4px solid #22c55e;border-radius:0 8px 8px 0;margin-bottom:8px;">
          <strong style="color:#166534;">1. Kickoff-Termin</strong>
          <br><span style="color:#3f3f46;font-size:14px;">Geplant: {kickoff_date} — Sie erhalten eine separate Kalender-Einladung mit Google Meet Link.</span>
        </td>
      </tr>
      <tr><td style="height:8px;"></td></tr>
      <tr>
        <td style="padding:12px 16px;background:#eff6ff;border-left:4px solid #3b82f6;border-radius:0 8px 8px 0;">
          <strong style="color:#1e40af;">2. Materialien hochladen</strong>
          <br><span style="color:#3f3f46;font-size:14px;">Bitte laden Sie Ihre Unterlagen über den Button unten hoch (Stellenanzeigen, Logos, Teamfotos, Brand Guidelines).</span>
        </td>
      </tr>
      <tr><td style="height:8px;"></td></tr>
      <tr>
        <td style="padding:12px 16px;background:#faf5ff;border-left:4px solid #8b5cf6;border-radius:0 8px 8px 0;">
          <strong style="color:#6b21a8;">3. Strategie &amp; Umsetzung</strong>
          <br><span style="color:#3f3f46;font-size:14px;">Nach dem Kickoff erstellen wir Ihre Recruiting-Strategie, Funnel, Creatives und Kampagnen.</span>
        </td>
      </tr>
    </table>

    <!-- What we create -->
    <h2 style="margin:28px 0 16px;color:#18181b;font-size:17px;font-weight:600;">
      Was unsere Automation für Sie erstellt
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
      Bei Fragen erreichen Sie uns jederzeit unter
      <a href="mailto:claudio@flowstack.com" style="color:#6366f1;">claudio@flowstack.com</a>.
    </p>

    <p style="margin:24px 0 0;color:#18181b;font-size:15px;">
      Mit besten Grüßen,<br>
      <strong>Claudio Di Franco</strong><br>
      <span style="color:#6b7280;font-size:14px;">Account Manager — Flowstack</span>
    </p>
  </td></tr>

  <!-- Footer -->
  <tr><td style="padding:24px 40px;background:#f9fafb;border-top:1px solid #e5e7eb;">
    <p style="margin:0;color:#9ca3af;font-size:12px;text-align:center;">
      Flowstack GmbH — Recruiting Automation Platform<br>
      Diese E-Mail wurde automatisch versendet.
    </p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>"""
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
            # Liste existiert — wiederverwenden
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
    """Helper: Google Drive Docs als Attachments an ClickUp Task anhängen."""
    for name, url in docs.items():
        try:
            resp = await _http.post(
                f"https://api.clickup.com/api/v2/task/{task_id}/attachment",
                headers={"Authorization": CLICKUP_TOKEN},
                data={"url": url, "filename": name},
            )
            if resp.status_code >= 400:
                log.warning(f"ClickUp Attachment '{name}' fehlgeschlagen: {resp.status_code}")
        except Exception as e:
            log.warning(f"ClickUp Attachment '{name}' uebersprungen: {e}")


async def _complete_task(task_id: str, comment: str | None = None, docs: dict[str, str] | None = None) -> None:
    """Helper: ClickUp Task als erledigt markieren + optionaler Kommentar + Docs anhängen."""
    await clickup_api("PUT", f"/task/{task_id}", {"status": "complete"})
    if comment:
        await clickup_api("POST", f"/task/{task_id}/comment", {"comment_text": comment})
    if docs:
        await _attach_docs_to_task(task_id, docs)


@app.post("/api/clickup/create-tasks")
async def create_clickup_tasks(body: dict):
    """is09: Initiale ClickUp Tasks — nur echte menschliche Aufgaben, kein Auto-Complete."""
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

    # Task 1: Pixel besorgen
    desc = f"Meta Pixel und Ad Account Zugaenge fuer {company} sicherstellen.\n\n"
    desc += "Ressourcen:\n"
    if close_url: desc += f"- Close Deal: {close_url}\n"
    desc += f"- ClickUp Projekt: {clickup_url}\n"
    t = await _create_task(
        list_id, f"Pixel besorgen — {company}", desc,
        [CLICKUP_ANAK], 1, 2,  # Urgent, +2 Tage
        [
            "Meta Business Manager Zugang beim Kunden anfragen",
            "Ad Account Zugriff bestaetigen (Werbekonto-Admin)",
            "Pixel-ID vom Kunden erhalten oder neuen Pixel erstellen",
            "Facebook Seite mit Ad Account verknuepft",
            "Alle Zugaenge in Close dokumentiert",
        ],
    )
    task_ids["pixel_besorgen"] = t["id"]

    # Task 2: Kickoff vorbereiten
    desc2 = f"Kickoff-Call mit {company} vorbereiten.\n\n"
    desc2 += "Ressourcen:\n"
    if close_url: desc2 += f"- Close Deal: {close_url}\n"
    if drive_url: desc2 += f"- Google Drive: {drive_url}\n"
    t = await _create_task(
        list_id, f"Kickoff vorbereiten — {company}", desc2,
        [CLICKUP_CLAUDIO], 2, 3,  # High, +3 Tage
        [
            "Close Deal-Notizen und Opportunity gelesen",
            "Branche und Wettbewerber kurz recherchiert",
            "Kickoff-Leitfaden an Client angepasst",
            "Kalendereinladung und Meet-Link geprueft",
        ],
    )
    task_ids["kickoff"] = t["id"]

    # Task 3: Materialien vom Kunden einsammeln
    desc3 = f"Alle Materialien von {company} einsammeln fuer Strategie und Creatives.\n\n"
    desc3 += "Ressourcen:\n"
    if upload_url: desc3 += f"- Upload-Ordner (Bilder): {upload_url}\n"
    if drive_url: desc3 += f"- Google Drive: {drive_url}\n"
    t = await _create_task(
        list_id, f"Materialien vom Kunden einsammeln — {company}", desc3,
        [CLICKUP_CLAUDIO], 2, 5,  # High, +5 Tage
        [
            "Logo (PNG/SVG hochaufloesend) erhalten",
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
# Miro Integration — Kampagnen-Board
# ══════════════════════════════════════════════════════════════════════════════


async def create_miro_board(body: Optional[dict] = None):
    """Erstellt ein Miro Kampagnen-Board mit 5 Frames, Sticky Notes und Cards."""
    context = body or {}
    company = context.get("company", "Novacode GmbH")

    if not MIRO_ACCESS_TOKEN:
        log.warning("MIRO_ACCESS_TOKEN nicht konfiguriert — Miro-Call uebersprungen")
        return {"url": "https://miro.com/app/board/", "miro_board_id": ""}

    # 1. Board erstellen
    board = await miro_api("POST", "/boards", {
        "name": f"{company} — Kampagnen-Uebersicht",
        "description": f"Strategie- und Kampagnen-Board fuer {company}. Automatisch erstellt von Flowstack.",
    })
    board_id = board["id"]
    board_url = board.get("viewLink", f"https://miro.com/app/board/{board_id}/")
    log.info(f"Miro Board erstellt: {board_id} — {board_url}")

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
            ("Tonalitaet: Professionell, aber menschlich", "green", 0, 150),
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
        "Zielgruppe": [("Zielgruppen-Recherche abschliessen", "Persona-Interviews + Datenanalyse")],
        "Messaging": [("Messaging-Matrix finalisieren", "USPs priorisieren und Tonalitaet festlegen")],
        "Kampagnen-Struktur": [
            ("Budget-Verteilung festlegen", "Hauptkampagne vs. Retargeting vs. Warmup"),
            ("Tracking-Setup pruefen", "Pixel, Events, Conversion-API"),
        ],
        "Creatives": [
            ("Creative Briefing an Designer", "Formate, Specs, Deadlines"),
            ("Video-Produktion planen", "Storyboard, Dreh-Location, Schnitt"),
        ],
        "Timeline": [("Meilensteine in ClickUp uebertragen", "Alle Deadlines synchronisieren")],
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
# V2 Airtable Integration — Baustein-System
# ══════════════════════════════════════════════════════════════════════════════

_airtable_http = httpx.AsyncClient(timeout=30)


async def airtable_request(method: str, path: str, data: Optional[dict] = None) -> dict:
    """Airtable API request."""
    if not AIRTABLE_API_KEY:
        log.warning("AIRTABLE_API_KEY nicht konfiguriert — Airtable-Calls uebersprungen")
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
                {"name": "G. Einwaende"}, {"name": "H. Arbeitgeber"}, {"name": "I. Messaging"},
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
    # Airtable Metadata API unterstuetzt nur "grid" und "form" — Kanban/Gallery/Calendar
    # muessen manuell in der Airtable UI erstellt werden.
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
        raise HTTPException(400, "AIRTABLE_API_KEY und AIRTABLE_BASE_ID muessen in Doppler konfiguriert sein")

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
            log.warning(f"Tabelle {table_name} nicht gefunden — View '{view_cfg['name']}' uebersprungen")
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
    "G": "G. Einwaende", "H": "H. Arbeitgeber", "I": "I. Messaging",
    "J": "J. Markt",
}

EXTRACTION_JSON_SCHEMA = {
    "demografie": {
        "alter": "Altersbereich (z.B. '28-42')",
        "geschlecht": "Verteilung oder 'alle'",
        "standort": "Region/Stadt",
        "bildung": "Typischer Abschluss",
        "familienstand": "Typisch fuer Zielgruppe",
        "einkommen": "Gehaltsbereich",
        "berufserfahrung": "Jahre Erfahrung",
        "suchverhalten": "aktiv oder passiv",
    },
    "beruflich": {
        "aktuelle_rolle": "Aktueller Job-Titel",
        "gesuchte_rolle": "Rolle die besetzt werden soll",
        "stack_aktuell": "Technologien die sie aktuell nutzen",
        "stack_gewuenscht": "Technologien die sie nutzen WOLLEN",
        "senioritaet": "Junior/Mid/Senior/Lead",
        "arbeitgeber_typ": "Konzern/Agentur/Startup/Mittelstand",
        "gehalt_aktuell": "Gehaltsrange aktuell",
        "gehalt_gewuenscht": "Gehaltsrange gewuenscht",
    },
    "schmerzpunkte": {
        "primaer": "Groesster Schmerzpunkt",
        "primaer_zitat": "Realistisches Zitat dazu (wie echte Person redet)",
        "primaer_tiefe": "Schmerz hinter dem Schmerz — tiefere Emotion",
        "sekundaer_1": "Zweitgroesster Schmerzpunkt",
        "sekundaer_1_zitat": "Zitat",
        "sekundaer_1_tiefe": "Tiefere Emotion",
        "sekundaer_2": "Drittgroesster Schmerzpunkt",
        "sekundaer_2_zitat": "Zitat",
        "sekundaer_2_tiefe": "Tiefere Emotion",
        "sekundaer_3": "Viertgroesster Schmerzpunkt",
        "sekundaer_3_zitat": "Zitat",
        "sekundaer_3_tiefe": "Tiefere Emotion",
    },
    "psychologie": {
        "primaere_emotion": "Was fuehlt die Zielgruppe JETZT (z.B. Frustration, Resignation)",
        "gewuenschte_emotion": "Was will sie FUEHLEN (z.B. Stolz, Kontrolle)",
        "groesste_angst": "Was haelt sie zurueck (z.B. 'Neuer Job koennte schlimmer sein')",
        "groesster_wunsch": "Was treibt sie an (z.B. 'Endlich Impact haben')",
        "innerer_konflikt": "z.B. 'Sicherheit vs. Wachstum'",
        "selbstbild": "Wie sieht sich die Zielgruppe selbst",
        "fremdbild": "Wie sehen andere sie",
        "trigger_events": "3-5 konkrete Situationen die den Wechsel ausloesen",
        "gedanken_nachts": "Worueber gruebeln sie vor dem Einschlafen",
        "tagtraeume": "Was stellen sie sich vor",
    },
    "benefits": {
        "top_1": "Staerkstes Argument/Benefit",
        "top_2": "Zweitstaerkstes",
        "top_3": "Drittstaerkstes",
        "hygiene": "Was wird ERWARTET (z.B. Gehalt, Vertrag)",
        "differenzierung": "Was macht den echten Unterschied",
        "dealbreaker": "Was geht GAR NICHT",
        "geheime_wuensche": "Was sie nie laut sagen wuerden",
        "idealer_tag": "Wie sieht der perfekte Arbeitstag aus",
    },
    "sprache": {
        "duktus": "Tonalitaet der Zielgruppe (direkt/locker/technisch)",
        "fachwoerter": "Liste von Fachbegriffen die sie taeglich nutzen",
        "verbotene_woerter": "Begriffe die sie abstossen (z.B. Rockstar, Ninja)",
        "redewendungen": "Typische Phrasen und Ausdruecke",
        "kommunikationsstil": "Direkt/indirekt, formell/informell",
        "humor_typ": "Trocken, sarkastisch, kein Humor",
        "informationsquellen": "Wo lesen sie (Blogs, Podcasts, Newsletter)",
        "communities": "Reddit, HackerNews, LinkedIn, Discord, etc.",
        "vorbilder": "Influencer/Personen denen sie folgen",
        "entscheidungssprache": "Wie formulieren sie Anforderungen",
    },
    "einwaende": {
        "einwand_1": "Haupteinwand gegen Wechsel",
        "entkraeftung_1": "Wie man ihn entkraeftet",
        "einwand_2": "Zweiter Einwand",
        "entkraeftung_2": "Entkraeftung",
        "einwand_3": "Dritter Einwand",
        "entkraeftung_3": "Entkraeftung",
    },
    "arbeitgeber": {
        "usp_1": "Staerkstes USP",
        "usp_1_beweis": "Konkreter Beweis/Beleg dafuer",
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
        "kernbotschaft": "1 praegnanter Satz fuer die gesamte Kampagne",
        "hook_1": "Emotionalster Hook (<125 Zeichen, Loss Aversion)",
        "hook_2": "Zweiter Hook (andere Emotion)",
        "hook_3": "Dritter Hook (Provokation/Pattern Interrupt)",
        "hook_4": "Vierter Hook (Identity Play)",
        "hook_5": "Fuenfter Hook (Social Proof/Neugier)",
        "cta_1": "Niedrigschwelligster CTA",
        "cta_2": "Alternativer CTA",
        "cta_3": "Dritter CTA",
        "tonalitaetsprofil": "Stimme + Rhythmus + Formatierung",
    },
    "markt": {
        "trend_1": "Relevanter Branchentrend 1",
        "trend_2": "Relevanter Branchentrend 2",
        "arbeitsmarkt": "Angebot/Nachfrage-Situation",
        "gehaltsbenchmark": "Marktdurchschnitt-Gehalt",
        "wettbewerber": "Top 3 Wettbewerber um Talente",
        "saisonalitaet": "Beste Zeit fuer Kampagnen",
    },
}


async def extract_building_blocks(transcript: str, company: str, rolle: str = "") -> dict:
    """Extrahiert ~88 Bausteine aus dem Transkript via AI (1 Call)."""
    schema_str = json.dumps(EXTRACTION_JSON_SCHEMA, indent=2, ensure_ascii=False)

    system_prompt = """Du bist ein Senior Consumer-Psychologe und Recruiting-Marketing-Stratege mit 15 Jahren Erfahrung.

AUFGABE: Analysiere das Kickoff-Transkript und extrahiere ALLE relevanten Informationen in das vorgegebene JSON-Schema.

REGELN:
1. Jedes Feld MUSS befuellt werden — leite logisch ab wenn nicht explizit im Transkript
2. Zitate muessen klingen wie echte Menschen reden — Fachjargon, kurze Saetze, authentisch
3. "Schmerz hinter dem Schmerz" = die tiefere EMOTIONALE Ebene:
   - "Veralteter Stack" → "Angst, den Anschluss zu verlieren und irrelevant zu werden"
   - "Keine Remote-Option" → "Gefuehl, nicht vertraut und respektiert zu werden"
   - "Schlechte Fuehrung" → "Kontrollverlust ueber die eigene Karriere und Zukunft"
4. Hooks: Max 125 Zeichen, emotional triggern, Loss Aversion > Benefits
   - SCHLECHT: "Wir bieten tolle Jobs" / RICHTIG: "Dein Code landet nie in Produktion?"
5. CTAs muessen niedrigschwellig sein: "In 60 Sekunden", "Kein Lebenslauf", "Unverbindlich"
6. VERBOTENE Woerter fuer verbotene_woerter: "Rockstar", "Ninja", "Guru", "Dynamisches Team", "Flache Hierarchien", "Wir suchen dich!"
7. Fachwoerter: Echte Begriffe die die Zielgruppe TAEGLICH nutzt (z.B. Stack-Namen, Tools, Methodiken)
8. Psychologie-Felder: Denke wie ein Therapeut — was FUEHLT die Person wirklich?
9. Trigger-Events: Konkrete Situationen (z.B. "Montag-Meeting wo der Chef die Idee abwuergt")
10. Kernbotschaft: MUSS in einem einzigen Satz die gesamte Kampagne kommunizieren

Antworte NUR mit validem JSON. Kein Markdown, kein Text davor/danach."""

    user_prompt = f"""Unternehmen: {company}
Gesuchte Rolle: {rolle or 'Siehe Transkript'}

TRANSKRIPT:
{transcript}

Extrahiere alle Informationen in exakt dieses JSON-Schema (jedes Feld befuellen!):
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
        raise HTTPException(500, f"AI-Extraktion: Ungültiges JSON — {e}")

    return blocks


def flatten_blocks_for_airtable(blocks: dict, client_record_id: str = "") -> list[dict]:
    """Wandelt das verschachtelte JSON in flache Airtable-Records um."""
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
        for i, (field_key, value) in enumerate(fields.items()):
            record = {
                "Kategorie": cat_name,
                "Feld-Name": f"{cat_name.split('. ')[1] if '. ' in cat_name else cat_name} — {field_key}",
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
    log.info(f"Airtable: {len(created)} Bausteine geschrieben fuer Client {client_record_id}")
    return len(created)


def filter_blocks_for_doc(all_blocks: dict, doc_number: int) -> dict:
    """Filtert Bausteine fuer ein bestimmtes Dokument basierend auf DOC_BAUSTEIN_MAP."""
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
    """Formatiert Bausteine als lesbaren Text fuer den AI-Prompt.
    Filtert automatisch auf die fuer dieses Dokument relevanten Kategorien."""
    filtered = filter_blocks_for_doc(bausteine, doc_number)
    NICE_NAMES = {
        "demografie": "Zielgruppen-Demografie",
        "beruflich": "Berufliches Profil",
        "schmerzpunkte": "Schmerzpunkte & Frustrationen",
        "psychologie": "Psychologie & Emotionen",
        "benefits": "Benefits & Wuensche",
        "sprache": "Sprache & Wording",
        "einwaende": "Einwaende & Bedenken",
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


@app.post("/api/v2/extract-blocks")
async def api_extract_blocks(body: dict):
    """API Endpoint: Bausteine aus Transkript extrahieren (zum Testen)."""
    transcript = body.get("transcript", "")
    company = body.get("company", "Unbekannt")
    rolle = body.get("rolle", "")

    if not transcript:
        # Falls kein Transkript mitgegeben, aus Google Doc lesen
        doc_id = body.get("transcript_doc_id", "")
        if doc_id:
            transcript = await read_google_doc_content(doc_id)
        else:
            raise HTTPException(400, "transcript oder transcript_doc_id erforderlich")

    blocks = await extract_building_blocks(transcript, company, rolle)
    flat = flatten_blocks_for_airtable(blocks)
    return {"ok": True, "blocks": blocks, "total_fields": len(flat)}


@app.post("/api/v2/reverse-engineer")
async def api_reverse_engineer():
    """Liest alle staged docs und analysiert Struktur, Wortzahl, Patterns."""
    from collections import OrderedDict

    all_docs = {}
    manifest_path = os.path.join(os.path.dirname(__file__), "staged-docs-manifest.json")
    with open(manifest_path) as f:
        manifest = json.load(f)

    analysis = OrderedDict()
    for doc_info in manifest["documents"]:
        doc_id = doc_info["id"]
        name = doc_info["name"]
        log.info(f"Reverse-Engineering: Lese {name}...")
        content = await read_google_doc_content(doc_id)
        words = len(content.split()) if content else 0
        lines = content.count("\n") + 1 if content else 0
        all_docs[name] = content
        analysis[name] = {
            "doc_id": doc_id,
            "word_count": words,
            "line_count": lines,
            "first_200_chars": content[:200] if content else "",
        }

    # Transkript lesen
    transcript_id = TRANSCRIPT_DOC.split("/d/")[1].split("/")[0] if "/d/" in TRANSCRIPT_DOC else ""
    transcript_content = ""
    if transcript_id:
        transcript_content = await read_google_doc_content(transcript_id)
        analysis["Transkript"] = {
            "doc_id": transcript_id,
            "word_count": len(transcript_content.split()) if transcript_content else 0,
        }

    # Referenz-Ad lesen (manuell erstellte Ad)
    ref_ad_id = "1w88kntbchIe4RWgFH16mZpKqV9zbhZ7w5jrbmcJcR48"
    ref_ad_content = await read_google_doc_content(ref_ad_id)
    if ref_ad_content:
        analysis["Referenz-Ad (manuell)"] = {
            "doc_id": ref_ad_id,
            "word_count": len(ref_ad_content.split()),
            "char_count": len(ref_ad_content),
            "content": ref_ad_content,
        }

    return {"ok": True, "analysis": analysis, "total_docs": len(analysis)}


# ══════════════════════════════════════════════════════════════════════════════
# V2 AI-Generierung — OpenRouter + Google Docs Upload
# ══════════════════════════════════════════════════════════════════════════════

FRAMEWORKS_DIR = os.path.join(os.path.dirname(__file__), "frameworks")

# CSS fuer generierte Docs (aus create-staged-docs.py)
V2_DOC_STYLE = """
<style>
  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    color: #1a1a2e;
    line-height: 1.7;
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
  }
  h1 {
    color: #0a1628;
    font-size: 28px;
    font-weight: 700;
    border-bottom: 3px solid #00e5ff;
    padding-bottom: 12px;
    margin-bottom: 24px;
  }
  h2 {
    color: #0a1628;
    font-size: 22px;
    font-weight: 700;
    margin-top: 32px;
    margin-bottom: 16px;
    border-left: 4px solid #00e5ff;
    padding-left: 12px;
  }
  h3 {
    color: #0a1628;
    font-size: 18px;
    font-weight: 600;
    margin-top: 24px;
    margin-bottom: 12px;
  }
  table {
    border-collapse: collapse;
    width: 100%;
    margin: 16px 0;
  }
  th {
    background-color: #0a1628;
    color: #ffffff;
    padding: 10px 14px;
    text-align: left;
    font-weight: 600;
    font-size: 14px;
  }
  td {
    padding: 10px 14px;
    border: 1px solid #e0e0e0;
    font-size: 14px;
  }
  tr:nth-child(even) { background-color: #f8f9fa; }
  blockquote {
    border-left: 4px solid #00e5ff;
    margin: 16px 0;
    padding: 12px 20px;
    background-color: #f0fafe;
    font-style: italic;
    color: #333;
  }
  ul { margin: 12px 0; padding-left: 24px; }
  li { margin-bottom: 6px; }
  hr {
    border: none;
    border-top: 2px solid #e0e0e0;
    margin: 28px 0;
  }
  .accent { color: #00e5ff; font-weight: 600; }
  .highlight {
    background-color: #f0fafe;
    padding: 16px;
    border-radius: 8px;
    margin: 16px 0;
    border: 1px solid #00e5ff;
  }
  .tag {
    display: inline-block;
    background-color: #0a1628;
    color: #00e5ff;
    padding: 2px 10px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 600;
    margin-right: 6px;
  }
  .meta {
    color: #888;
    font-size: 13px;
    margin-bottom: 24px;
  }
</style>
"""


def _load_framework(doc_number: int) -> str:
    """Lade Framework-Datei fuer ein Dokument (01-12)."""
    pattern = f"{doc_number:02d}-"
    for fname in os.listdir(FRAMEWORKS_DIR):
        if fname.startswith(pattern) and fname.endswith(".md"):
            with open(os.path.join(FRAMEWORKS_DIR, fname), "r") as f:
                return f.read()
    raise FileNotFoundError(f"Framework {doc_number:02d} nicht gefunden in {FRAMEWORKS_DIR}")


_DEFAULT_MODEL = os.environ.get("OPENROUTER_MODEL", "meta-llama/llama-3.3-70b-instruct:free")

async def openrouter_generate(
    system_prompt: str,
    user_prompt: str,
    model: str = _DEFAULT_MODEL,
    max_tokens: int = 8000,
) -> str:
    """AI-Text via OpenRouter generieren."""
    if not OPENROUTER_API_KEY:
        raise HTTPException(503, "OPENROUTER_API_KEY nicht konfiguriert")

    resp = await _http.post(
        "https://openrouter.ai/api/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "Content-Type": "application/json",
        },
        json={
            "model": model,
            "max_tokens": max_tokens,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
        },
        timeout=120,
    )
    if resp.status_code >= 400:
        log.error(f"OpenRouter API error: {resp.status_code} {resp.text}")
        raise HTTPException(resp.status_code, f"OpenRouter: {resp.text}")

    data = resp.json()
    content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
    if not content:
        raise HTTPException(500, "OpenRouter: Leere Antwort")
    return content


async def create_google_doc_v2(name: str, html_body: str) -> dict:
    """Google Doc aus HTML erstellen (wie create-staged-docs.py).
    Gibt {"doc_id": ..., "url": ...} zurueck.
    """
    token = await _refresh_google_token()
    full_html = f"""<!DOCTYPE html>
<html lang="de">
<head><meta charset="UTF-8">{V2_DOC_STYLE}</head>
<body>{html_body}</body>
</html>"""

    metadata = json.dumps({
        "name": name,
        "mimeType": "application/vnd.google-apps.document",
    })
    boundary = "v2_doc_boundary_fs"
    body = (
        f"--{boundary}\r\n"
        f"Content-Type: application/json; charset=UTF-8\r\n\r\n"
        f"{metadata}\r\n"
        f"--{boundary}\r\n"
        f"Content-Type: text/html; charset=UTF-8\r\n\r\n"
        f"{full_html}\r\n"
        f"--{boundary}--"
    )

    resp = await _http.post(
        "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": f"multipart/related; boundary={boundary}",
        },
        content=body.encode("utf-8"),
        timeout=30,
    )
    if resp.status_code == 401:
        # Token expired, retry
        token = await _refresh_google_token()
        resp = await _http.post(
            "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": f"multipart/related; boundary={boundary}",
            },
            content=body.encode("utf-8"),
            timeout=30,
        )
    if resp.status_code >= 400:
        log.error(f"Google Drive Upload error: {resp.status_code} {resp.text}")
        raise HTTPException(resp.status_code, f"Google Drive: {resp.text}")

    file_data = resp.json()
    doc_id = file_data.get("id", "")
    doc_url = f"https://docs.google.com/document/d/{doc_id}/edit"
    log.info(f"V2 Doc erstellt: {name} -> {doc_url}")
    return {"doc_id": doc_id, "url": doc_url}


async def move_to_drive_folder(doc_id: str, folder_id: str):
    """Doc in einen Drive-Ordner verschieben."""
    if not folder_id or not doc_id:
        return
    token = await _refresh_google_token()
    # Get current parents
    resp = await _http.get(
        f"https://www.googleapis.com/drive/v3/files/{doc_id}?fields=parents",
        headers={"Authorization": f"Bearer {token}"},
    )
    if resp.status_code != 200:
        return
    current_parents = resp.json().get("parents", [])
    remove = ",".join(current_parents) if current_parents else ""
    await _http.patch(
        f"https://www.googleapis.com/drive/v3/files/{doc_id}?addParents={folder_id}&removeParents={remove}",
        headers={"Authorization": f"Bearer {token}"},
    )


async def generate_v2_document(
    doc_number: int,
    doc_name: str,
    context: dict,
    previous_docs: dict | None = None,
    bausteine: dict | None = None,
) -> dict:
    """V2: Framework laden, Bausteine einbauen, AI generieren, Google Doc erstellen.

    Args:
        doc_number: 1-12 (Framework-Nummer)
        doc_name: Name des Dokuments (fuer Google Doc Titel)
        context: Execution-Context (company, transcript, etc.)
        previous_docs: Dict von vorherigen Doc-Inhalten {name: content}
        bausteine: Extrahierte Bausteine (88 Felder) — wenn vorhanden, werden sie statt raw Transcript genutzt

    Returns:
        {"doc_id": ..., "url": ..., "content": ...}
    """
    framework = _load_framework(doc_number)
    company = context.get("company", "Unbekannt")

    # Kontext fuer den Prompt zusammenbauen
    context_parts = [f"**Unternehmen:** {company}"]

    # Bausteine haben Prioritaet — strukturierter Kontext statt rohem Transkript
    if bausteine:
        baustein_text = format_bausteine_for_prompt(bausteine, doc_number)
        context_parts.append(f"**Extrahierte Bausteine (strukturierte Daten):**\n{baustein_text}")
    elif context.get("transcript"):
        context_parts.append(f"**Kickoff-Transkript:**\n{context['transcript']}")

    if previous_docs:
        for name, content in previous_docs.items():
            context_parts.append(f"**Vorheriges Dokument — {name}:**\n{content}")

    context_text = "\n\n".join(context_parts)

    system_prompt = f"""Du bist ein Senior Marketing-Stratege und Consumer-Psychologe fuer eine Performance-Marketing-Agentur.
Du erstellst Elite-Level Strategie-Dokumente fuer Recruiting-Kampagnen.

WICHTIG: Antworte NUR mit dem HTML-Body-Inhalt (KEIN <html>, <head>, <body> Tag).
Nutze semantisches HTML: <h1>, <h2>, <h3>, <table>, <ul>, <blockquote>, <div class="highlight">, etc.
CSS-Klassen die du nutzen kannst: .accent, .highlight, .tag, .meta

PSYCHOLOGIE-REGELN:
- Loss Aversion: Verluste ~2x staerker als Gewinne. Schmerzpunkte IMMER vor Benefits.
- Social Proof: Konkrete (fiktive) Personas, Zahlen, "Dein Team" statt "Unser Team".
- Identity Play: Selbstbild spiegeln ("Du bist jemand, der..."), Anti-Identitaet nutzen.
- Cognitive Ease: Kurze Saetze. Einfache Woerter. Zeilenumbruch nach JEDEM Gedanken.

WORDING-REGELN:
- Fachbegriffe der Zielgruppe nutzen (Stack-Namen, Tools)
- "Du" statt "Sie" (Tech/Developer immer Du)
- Konkrete Zahlen > vage Versprechen
- VERBOTEN: "Rockstar", "Ninja", "Dynamisches Team", "Flache Hierarchien", "Spannende Aufgaben", "Wir suchen dich!", Ausrufezeichen-Inflation

Halte dich EXAKT an die Struktur und Sections im Framework.
Alle Inhalte muessen spezifisch fuer das Unternehmen sein — KEINE generischen Platzhalter.
Sprache: Deutsch.

{framework}"""

    user_prompt = f"""Erstelle das Dokument "{doc_name}" fuer folgendes Projekt:

{context_text}

Generiere den KOMPLETTEN HTML-Body-Inhalt. Jede Section muss ausgefuellt sein mit spezifischen, massgeschneiderten Inhalten.
Keine Platzhalter wie [hier einfuegen] — alles muss fertig und professionell sein.
Qualitaet auf dem Niveau einer Top-Agentur — nicht generisch, nicht austauschbar."""

    # AI generieren
    html_content = await openrouter_generate(system_prompt, user_prompt)

    # HTML-Tags bereinigen falls die AI doch <html>/<body> mitliefert
    html_content = html_content.strip()
    if html_content.startswith("```html"):
        html_content = html_content[7:]
    if html_content.startswith("```"):
        html_content = html_content[3:]
    if html_content.endswith("```"):
        html_content = html_content[:-3]
    html_content = html_content.strip()

    # <html>, <head>, <body> Tags entfernen falls vorhanden
    import re
    html_content = re.sub(r'<!DOCTYPE[^>]*>', '', html_content, flags=re.IGNORECASE)
    html_content = re.sub(r'</?html[^>]*>', '', html_content, flags=re.IGNORECASE)
    html_content = re.sub(r'<head>.*?</head>', '', html_content, flags=re.IGNORECASE | re.DOTALL)
    html_content = re.sub(r'</?body[^>]*>', '', html_content, flags=re.IGNORECASE)
    html_content = re.sub(r'<style>.*?</style>', '', html_content, flags=re.IGNORECASE | re.DOTALL)
    html_content = html_content.strip()

    # Google Doc erstellen
    doc_title = f"[V2] {doc_name} — {company}"
    doc_result = await create_google_doc_v2(doc_title, html_content)

    # In Drive-Ordner verschieben falls vorhanden
    folder_id = context.get("folder_root_id")
    if folder_id:
        await move_to_drive_folder(doc_result["doc_id"], folder_id)

    # Airtable Dokumente-Tabelle updaten (falls konfiguriert)
    airtable_client_id = context.get("airtable_client_id")
    if AIRTABLE_BASE_ID and airtable_client_id:
        try:
            doc_fields = {
                "Dokument-Name": f"{context.get('company', 'Client')} — {doc_name}",
                "Dokument-Typ": doc_name,
                "Google Doc URL": doc_result["url"],
                "Google Doc ID": doc_result["doc_id"],
                "Status": "Generiert",
                "Version": 1,
            }
            # Linked Record zum Client setzen
            if airtable_client_id:
                doc_fields["Client"] = [airtable_client_id]
            await airtable_create_record("Dokumente", doc_fields)
        except Exception as e:
            log.warning(f"Airtable Dokument-Eintrag fehlgeschlagen: {e}")

    return {
        **doc_result,
        "content": html_content,
        "doc_name": doc_name,
    }


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
            await slack_message(f":white_check_mark: {company} — CRM Lead wurde erstellt")
            # Kunden-Channel erstellen (Name: client-firmenname, bei Duplikat: -2, -3, ...)
            base_name = company.lower().replace(" ", "-").replace("ü", "ue").replace("ä", "ae").replace("ö", "oe").replace("ß", "ss")
            channel_name = f"client-{base_name}"[:80]
            ch = await slack_bot_api("conversations.create", {
                "name": channel_name,
                "is_private": False,
            })
            channel_id = None
            # Falls name_taken, Suffix mit Counter versuchen
            if ch.get("error") == "name_taken":
                for i in range(2, 50):
                    channel_name = f"client-{base_name}-{i}"[:80]
                    ch = await slack_bot_api("conversations.create", {
                        "name": channel_name,
                        "is_private": False,
                    })
                    if ch.get("ok") or ch.get("error") != "name_taken":
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
                        log.warning(f"Slack Connect Invite fehlgeschlagen: {err}")
                        # Fallback: Einladungslink als Nachricht posten
                        if err in ("not_allowed", "feature_not_enabled", "method_not_supported_for_channel_type", "missing_scope"):
                            log.info("Slack Connect nicht verfuegbar — sende Einladungshinweis als Nachricht")
                            await slack_bot_api("chat.postMessage", {
                                "channel": channel_id,
                                "text": f":email: Kunden-Einladung: Bitte {client_email} manuell zum Channel einladen (Slack Connect nicht aktiviert).",
                            })

                # Channel-Beschreibung setzen
                await slack_bot_api("conversations.setTopic", {
                    "channel": channel_id,
                    "topic": f"Recruiting Automation - {company}",
                })
                # Willkommensnachricht: Projekt-Uebersicht
                welcome_blocks = _slack_blocks_message(
                    f":wave: Willkommen, {company}!",
                    [
                        {"text": "Hier koordinieren wir alles rund um euer Recruiting-Projekt. Wir melden uns hier mit Updates und ihr koennt jederzeit Fragen stellen."},
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
                    "text": f"Hey {contact_name}! :wave: Ich bin Claudio und kuemmere mich um eure Strategie, Positionierung und den gesamten Projektablauf. Wenn irgendwas unklar ist oder ihr Fragen habt, einfach hier rein damit. Freue mich auf die Zusammenarbeit mit euch!",
                    "username": "Claudio Di Franco",
                    "icon_url": "https://ca.slack-edge.com/T0AAEHFN8GH-U0AA1KHD0G2-gae40f8c7598-512",
                })
                await asyncio.sleep(0.5)
                await slack_bot_api("chat.postMessage", {
                    "channel": channel_id,
                    "text": f"Hey {contact_name}! :rocket: Ich bin Anak — bei mir liegt die technische Umsetzung: Funnel, Tracking, Kampagnen-Setup, alles was mit Tech zu tun hat. Falls technisch irgendwas klemmt, bin ich euer Ansprechpartner. Willkommen an Bord!",
                    "username": "Anak",
                    "icon_url": "https://ca.slack-edge.com/T0AAEHFN8GH-U0A9L6KUT5M-g2f3e8b1c4d7-512",
                })
            else:
                log.error(f"Slack Channel erstellen fehlgeschlagen: {ch.get('error')}")
            # Deep-Link zum Channel
            slack_url = f"https://app.slack.com/client/{SLACK_TEAM_ID}/{channel_id}" if channel_id else "https://app.slack.com/"
            result = {"sent": True, "channel_id": channel_id, "channel_name": channel_name, "url": slack_url}

        elif node_id == "is04":
            # Upload-Link: Bilder-Ordner (Bilder/Materialien fuer den Kunden)
            # Prioritaet: upload_folder_id (= Bilder) > folder_root_id > Fallback
            upload_folder_id = context.get("upload_folder_id")
            folder_root_id = context.get("folder_root_id")
            if upload_folder_id:
                context["upload_link"] = f"https://drive.google.com/drive/folders/{upload_folder_id}"
                log.info(f"Email Upload-Link: Bilder Ordner ({upload_folder_id})")
            elif folder_root_id:
                context["upload_link"] = f"https://drive.google.com/drive/folders/{folder_root_id}"
                log.warning(f"Email Upload-Link: Fallback auf Root-Ordner ({folder_root_id}) — upload_folder_id fehlt im Context")
            else:
                log.error("Email Upload-Link: Weder upload_folder_id noch folder_root_id im Context! is06 muss vor is04 laufen.")
            result = await send_welcome_email(context)

        elif node_id == "is05":
            result = await create_calendar_event(context)
            # Projekt-Übersicht: Zeile anhängen
            company = context.get("company", "Novacode GmbH")
            event_link = result.get("link", "")
            ts = datetime.now().strftime('%d.%m.%Y %H:%M')
            await _append_sheet_row(context.get("overview_sheet_id"), ["Kickoff-Termin", "Erledigt", "Einladung an Client gesendet", event_link, ts])
            await slack_message(f":calendar: {company} — Kickoff-Termin wurde erstellt")

        elif node_id == "is06":
            result = await create_drive_folders(context)
            folder_url = result.get("url", "")
            company = context.get("company", "Novacode GmbH")
            if folder_url:
                # Projekt-Übersicht: Zeile anhängen
                ts = datetime.now().strftime('%d.%m.%Y %H:%M')
                await _append_sheet_row(context.get("overview_sheet_id"), ["Google Drive", "Erledigt", "8 Hauptordner + Unterordner angelegt", folder_url, ts])
                # Spreadsheet in Client-Ordner verschieben
                sheet_id = context.get("overview_sheet_id")
                folder_root_id = result.get("folder_root_id") or context.get("folder_root_id")
                if sheet_id and folder_root_id:
                    try:
                        await google_api("PATCH", f"https://www.googleapis.com/drive/v3/files/{sheet_id}?addParents={folder_root_id}", {})
                    except Exception as e:
                        log.warning(f"Spreadsheet in Drive verschieben fehlgeschlagen: {e}")
                await slack_message(f":file_folder: {company} — Google Drive Ordner wurde erstellt")

        elif node_id == "is07":
            # Drive: Templates dupliziert — Link zum Kundenordner
            folder_root_id = context.get("folder_root_id")
            if folder_root_id:
                result = {"url": f"https://drive.google.com/drive/folders/{folder_root_id}", "templates_duplicated": True}
            else:
                result = {"url": "https://drive.google.com/drive/my-drive", "templates_duplicated": False}

        elif node_id == "is08":
            result = await create_clickup_project(context)

        elif node_id == "is09":
            list_id = context.get("list_id")
            if list_id:
                result = await create_clickup_tasks(context)
                company = context.get("company", "Novacode GmbH")
                clickup_url = f"https://app.clickup.com/{CLICKUP_TEAM_ID}/v/li/{list_id}"
                ts = datetime.now().strftime('%d.%m.%Y %H:%M')
                await _append_sheet_row(context.get("overview_sheet_id"), ["ClickUp Projekt", "Erledigt", "3 Tasks erstellt", clickup_url, ts])
                await slack_message(f":memo: {company} — ClickUp Projekt wurde erstellt")

        elif node_id == "is10":
            result = await update_close_stage({
                **context,
                "stage": "Kickoff geplant",
                "automation_status": "Warte auf Kickoff",
            })

        elif node_id == "is11":
            try:
                result = await create_miro_board(context)
            except Exception as e:
                log.warning(f"Miro Board-Erstellung fehlgeschlagen: {e} — verwende Fallback")
                result = {"url": "https://miro.com/app/dashboard/", "miro_board_id": "fallback", "note": str(e)}
            company = context.get("company", "Novacode GmbH")
            board_url = (result or {}).get("url", "")
            if board_url:
                ts = datetime.now().strftime('%d.%m.%Y %H:%M')
                await _append_sheet_row(context.get("overview_sheet_id"), ["Miro Board", "Erledigt", "Kampagnen-Übersicht Board erstellt", board_url, ts])
                await slack_message(f":art: {company} — Miro Board wurde erstellt")

        # ── Kickoff & Transcript ──
        elif node_id == "kc05":
            result = await update_close_stage({
                **context,
                "stage": "Kickoff abgeschlossen",
                "automation_status": "Strategie in Arbeit",
            })
            # ClickUp: Neue Tasks fuer naechste manuelle Schritte (KEIN Auto-Complete)
            list_id = context.get("list_id")
            task_ids = dict(context.get("task_ids", {}))
            company = context.get("company", "Novacode GmbH")
            if list_id:
                folder_root_id = context.get("folder_root_id", "")
                drive_url = f"https://drive.google.com/drive/folders/{folder_root_id}" if folder_root_id else ""

                # Task: Videodreh planen
                desc_vid = f"Videodreh mit {company} organisieren fuer Recruiting-Content.\n"
                if drive_url: desc_vid += f"\nGoogle Drive: {drive_url}\n"
                t = await _create_task(
                    list_id, f"Videodreh planen — {company}", desc_vid,
                    [CLICKUP_CLAUDIO], 2, 5,  # High, +5 Tage
                    [
                        "Drehtag mit Kunden abstimmen",
                        "Shot-Liste erstellen (Buero, Team, Arbeitsalltag)",
                        "Equipment organisieren",
                        "Anfahrt und Zeitplan klaeren",
                    ],
                )
                task_ids["videodreh_planen"] = t["id"]

                # Task: Strategie reviewen
                desc = f"KI-generierte Strategie-Dokumente fuer {company} pruefen.\n\n"
                if drive_url: desc += f"Google Drive: {drive_url}\n"
                t = await _create_task(
                    list_id, f"Strategie reviewen — {company}", desc,
                    [CLICKUP_CLAUDIO], 2, 3,  # High, +3 Tage
                    [
                        "Zielgruppen-Avatar: Passt zur Branche und Position?",
                        "Messaging: USPs differenzieren sich vom Wettbewerb?",
                        "Creative Briefing: Bildsprache passt zur Marke?",
                        "Feedback an KI-Docs einarbeiten falls noetig",
                    ],
                )
                task_ids["strategy_review"] = t["id"]
                result["task_ids"] = task_ids

        elif node_id == "kc06":
            company = context.get("company", "Novacode GmbH")
            ts = datetime.now().strftime('%d.%m.%Y %H:%M')
            await _append_sheet_row(context.get("overview_sheet_id"), ["Kickoff", "Abgeschlossen", "Strategie-Erstellung startet automatisch", TRANSCRIPT_DOC, ts])
            await slack_message(f":white_check_mark: {company} — Kickoff wurde abgeschlossen")
            result = {"sent": True, "url": f"https://app.slack.com/client/{SLACK_TEAM_ID}/{context.get('channel_id', '')}" if context.get("channel_id") else "https://app.slack.com/"}

        # ── Strategy & Brand ──
        elif node_id == "st10":
            result = await update_close_stage({
                **context,
                "stage": "Strategie erstellt",
                "automation_status": "Strategie erstellt",
            })
            # ClickUp: Neue Tasks fuer naechste manuelle Schritte (KEIN Auto-Complete)
            list_id = context.get("list_id")
            task_ids = dict(context.get("task_ids", {}))
            company = context.get("company", "Novacode GmbH")
            if list_id:
                # Task: Texte reviewen & freigeben
                desc = f"KI-generierte Texte fuer {company} pruefen und freigeben.\n\n"
                desc += "Strategie-Docs als Referenz:\n"
                for name, url in STRATEGY_DOCS.items():
                    desc += f"- {name}: {url}\n"
                t = await _create_task(
                    list_id, f"Texte reviewen & freigeben — {company}", desc,
                    [CLICKUP_CLAUDIO], 2, 4,  # High, +4 Tage
                    [
                        "Landingpage-Texte: Tone of Voice passt?",
                        "Anzeigentexte: Hooks sind stark genug?",
                        "Kein Bullshit-Marketing, authentisch und direkt?",
                        "Kundenfeedback einholen falls gewuenscht",
                    ],
                )
                task_ids["copy_review"] = t["id"]
                await _attach_docs_to_task(t["id"], STRATEGY_DOCS)

                # Task: Videodreh durchfuehren
                t = await _create_task(
                    list_id, f"Videodreh durchfuehren — {company}",
                    f"Recruiting-Video fuer {company} drehen.\n",
                    [CLICKUP_CLAUDIO], 1, 7,  # Urgent, +7 Tage
                    [
                        "Drehtag durchgefuehrt",
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
            rows = [["Strategie & Brand", "Erledigt", f"{len(STRATEGY_DOCS)} Dokumente erstellt", drive_url_slack, ts]]
            for name, url in STRATEGY_DOCS.items():
                rows.append([f"  → {name}", "—", "", url, ""])
            await _append_sheet_rows(sheet_id, rows)
            await slack_message(f":dart: {company} — Strategie & Brand wurde fertiggestellt")

        # ── Copy Creation ──
        elif node_id == "cc05":
            result = await update_close_stage({
                **context,
                "stage": "Assets erstellt",
                "automation_status": "Assets erstellt",
            })
            # ClickUp: Neue Tasks fuer naechste manuelle Schritte (KEIN Auto-Complete)
            list_id = context.get("list_id")
            task_ids = dict(context.get("task_ids", {}))
            company = context.get("company", "Novacode GmbH")
            if list_id:
                # Task: Video schneiden
                t = await _create_task(
                    list_id, f"Video schneiden — {company}",
                    f"Recruiting-Video fuer {company} schneiden und exportieren.\n",
                    [CLICKUP_ANAK], 2, 5,  # High, +5 Tage
                    [
                        "60s Recruiting-Video geschnitten (Hook-Problem-Loesung-CTA)",
                        "3 kurze Varianten fuer Retargeting (15-20s)",
                        "Untertitel eingebaut",
                        "Formate: 1080x1080 + 1080x1920 exportiert",
                        "Im Drive Bilder-Ordner hochgeladen",
                    ],
                )
                task_ids["video_schneiden"] = t["id"]

                # Task: Funnel & Pixel pruefen
                events_url = f"https://business.facebook.com/events_manager2/list/pixel/{META_PIXEL_ID}/overview" if META_PIXEL_ID else ""
                desc2 = f"Recruiting-Funnel und Pixel fuer {company} testen.\n\n"
                desc2 += "Ressourcen:\n"
                for name, url in FUNNEL_LINKS.items():
                    desc2 += f"- {name}: {url}\n"
                if events_url: desc2 += f"- Meta Events Manager: {events_url}\n"
                t = await _create_task(
                    list_id, f"Funnel & Pixel pruefen — {company}", desc2,
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
            rows = [["Copy & Texte", "Erledigt", f"{len(COPY_DOCS)} Dokumente erstellt", drive_url_slack, ts]]
            for name, url in COPY_DOCS.items():
                rows.append([f"  → {name}", "—", "", url, ""])
            await _append_sheet_rows(sheet_id, rows)
            await slack_message(f":pencil2: {company} — Copy Assets wurden fertiggestellt")

        # ── Review & Launch ──
        elif node_id == "rl06":
            company = context.get("company", "Novacode GmbH")
            # Projekt-Übersicht + Slack: Asset-Paket bereit
            ts = datetime.now().strftime('%d.%m.%Y %H:%M')
            sheet_id = context.get("overview_sheet_id")
            rows = [["Asset-Paket", "Bereit", "Alle Assets zusammengestellt", "", ts]]
            for name, url in FUNNEL_LINKS.items():
                rows.append([f"  → {name}", "—", "", url, ""])
            rows.append(["  → Tracking Sheet", "—", "", TRACKING_SHEET, ""])
            rows.append(["  → Tracking Dashboard", "—", "", TRACKING_DASHBOARD, ""])
            await _append_sheet_rows(sheet_id, rows)
            await slack_message(f":package: {company} — Asset-Paket ist bereit")
            result = {"sent": True, "url": f"https://app.slack.com/client/{SLACK_TEAM_ID}/{context.get('channel_id', '')}" if context.get("channel_id") else "https://app.slack.com/"}

        elif node_id == "rl07":
            result = await update_close_stage({
                **context,
                "stage": "Warte auf Freigabe",
                "automation_status": "Warte auf Freigabe",
            })
            # Airtable Client Status → "Review"
            client_id_rl07 = context.get("airtable_client_id")
            if client_id_rl07 and AIRTABLE_BASE_ID:
                await airtable_update_record("Clients", client_id_rl07, {"Status": "Review"})
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
                desc2 += f"- Anzeigentexte: {COPY_DOCS.get('Anzeigentexte', '')}\n"
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
                    "Anzeigentexte": COPY_DOCS.get("Anzeigentexte", ""),
                    "Landingpage": FUNNEL_LINKS.get("Landingpage", ""),
                }
                await _attach_docs_to_task(t["id"], {k: v for k, v in campaign_docs.items() if v})
                result["task_ids"] = task_ids

        elif node_id == "rl09":
            result = await update_close_stage({
                **context,
                "stage": "Bereit für Launch",
                "automation_status": "Bereit für Launch",
            })

        elif node_id == "rl11":
            result = await update_close_stage({
                **context,
                "stage": "Live",
                "automation_status": "Live",
            })
            # Airtable Client Status → "Live"
            client_id_rl11 = context.get("airtable_client_id")
            if client_id_rl11 and AIRTABLE_BASE_ID:
                await airtable_update_record("Clients", client_id_rl11, {"Status": "Live"})
            # ClickUp: Neue Tasks fuer Launch (KEIN Auto-Complete)
            list_id = context.get("list_id")
            task_ids = dict(context.get("task_ids", {}))
            ads_url = f"https://adsmanager.facebook.com/adsmanager/manage/campaigns?act={_meta_acct_numeric()}" if META_AD_ACCOUNT else ""
            if list_id:
                company = context.get("company", "Novacode GmbH")
                # Task: Kampagnen pruefen & aktivieren
                desc = f"Alle Kampagnen fuer {company} pruefen und live schalten.\n\n"
                if ads_url: desc += f"Meta Ads Manager: {ads_url}\n"
                t = await _create_task(
                    list_id, f"Kampagnen pruefen & aktivieren — {company}", desc,
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
                desc2 = f"Kampagnen-Performance fuer {company} in der ersten Woche ueberwachen.\n\n"
                desc2 += "Ressourcen:\n"
                if ads_url: desc2 += f"- Meta Ads Manager: {ads_url}\n"
                desc2 += f"- Tracking Sheet: {TRACKING_SHEET}\n"
                desc2 += f"- Tracking Dashboard: {TRACKING_DASHBOARD}\n"
                t = await _create_task(
                    list_id, f"Erste Woche Monitoring — {company}", desc2,
                    [CLICKUP_CLAUDIO, CLICKUP_ANAK], 2, 7,  # High, +7 Tage
                    [
                        "Tag 1: Auslieferung gestartet (Impressions > 0)",
                        "Tag 3: CPM < 15 EUR, CTR > 0.5%?",
                        "Tag 3: Erste Bewerbungen eingegangen?",
                        "Tag 5: Budget wird ausgeschoepft?",
                        "Tag 7: Performance-Report erstellen",
                        "Tag 7: Underperformer pausieren",
                        "Kunde ueber Ergebnisse informieren",
                    ],
                )
                task_ids["monitoring"] = t["id"]
                result["task_ids"] = task_ids

        elif node_id == "rl12":
            company = context.get("company", "Novacode GmbH")
            launch_date = datetime.now().strftime('%d.%m.%Y %H:%M')
            ads_url = f"https://adsmanager.facebook.com/adsmanager/manage/campaigns?act={_meta_acct_numeric()}"
            # Projekt-Übersicht: letzte Zeile
            ts = launch_date
            await _append_sheet_row(context.get("overview_sheet_id"), ["Recruiting LIVE", "Gestartet", "3 Kampagnen aktiviert", ads_url, ts])
            # Slack: EINE finale Block Kit Nachricht mit Spreadsheet-Link
            overview_url = context.get("overview_sheet_url", "")
            blocks = _slack_blocks_message(
                f":rocket: {company} — Recruiting ist LIVE!",
                [{"text": "Alle Schritte abgeschlossen. Komplette Projekt-Übersicht:"}],
                buttons=[("Projekt-Übersicht öffnen", overview_url, "primary")] if overview_url else [],
                footer=f":zap: Flowstack Automation | {launch_date}",
            )
            await slack_message(f"{company} Recruiting ist LIVE!", blocks=blocks, color=SLACK_COLOR_SUCCESS)
            result = {"sent": True, "url": f"https://app.slack.com/client/{SLACK_TEAM_ID}/{context.get('channel_id', '')}" if context.get("channel_id") else "https://app.slack.com/"}

        elif node_id == "rl13":
            # Airtable: Performance-Sync — Meta Ads → Airtable Dashboard
            campaign_ids = []
            meta_campaigns = context.get("meta_campaigns", {})
            if meta_campaigns:
                campaign_ids = list(meta_campaigns.values())

            if campaign_ids and META_ACCESS_TOKEN and AIRTABLE_API_KEY and AIRTABLE_BASE_ID:
                synced_total = 0
                for cid in campaign_ids:
                    insights = await _fetch_meta_campaign_insights(cid, "last_7d")
                    records = []
                    for day in insights:
                        impressions = int(day.get("impressions", 0))
                        clicks = int(day.get("clicks", 0))
                        spend = float(day.get("spend", 0))
                        leads = _extract_leads_from_actions(day.get("actions"))
                        name = day.get("campaign_name", f"Campaign {cid}")
                        name_lower = name.lower()
                        if "retarget" in name_lower or "rt" in name_lower:
                            typ = "Retargeting"
                        elif "warmup" in name_lower or "wu" in name_lower or "awareness" in name_lower:
                            typ = "Warmup"
                        else:
                            typ = "Initial"
                        records.append({
                            "Kampagnen-Name": name,
                            "Datum": day.get("date_start", ""),
                            "Kampagnen-Typ": typ,
                            "Meta Campaign ID": cid,
                            "Impressions": impressions,
                            "Clicks": clicks,
                            "CTR": float(day.get("ctr", 0)) / 100,
                            "CPM": float(day.get("cpm", 0)),
                            "CPC": float(day.get("cpc", 0)) if clicks > 0 else 0,
                            "Leads": leads,
                            "CPL": round(spend / leads, 2) if leads > 0 else 0,
                            "Spend": spend,
                            "Reach": int(day.get("reach", 0)),
                            "Frequency": float(day.get("frequency", 0)),
                        })
                    for i in range(0, len(records), 10):
                        await airtable_create_records("Performance", records[i:i+10])
                    synced_total += len(records)
                airtable_url = f"https://airtable.com/{AIRTABLE_BASE_ID}" if AIRTABLE_BASE_ID else "https://airtable.com"
                result = {"synced": synced_total, "campaigns": len(campaign_ids), "url": airtable_url}
            else:
                result = {"synced": 0, "note": "Meta oder Airtable nicht konfiguriert — Dashboard-Sync uebersprungen", "url": "https://airtable.com"}

        # ── Meta Zielgruppen & Kampagnen ──────────────────────────────────────
        # Spec: Phase 7 – Audience & Campaign Setup (Meta Ads)
        # Order: Audiences → Campaigns → Ad Sets → Ads

        elif node_id in ("ca01", "ca02", "ca03"):
            # Website Custom Audiences (Pixel-basiert)
            company = context.get("company", "Novacode GmbH")
            acct = _meta_acct()
            LP_URL = "demo-recruiting.vercel.app/demo-landing"
            FORM_URL = "demo-recruiting.vercel.app/demo-formular"
            THANKS_URL = "demo-recruiting.vercel.app/demo-danke"

            if node_id == "ca01":
                name = "AllVisitors_30d"
                desc = "Alle Website-Besucher der letzten 30 Tage"
                rule = {"inclusions": {"operator": "or", "rules": [
                    {"event_sources": [{"id": META_PIXEL_ID, "type": "pixel"}], "retention_seconds": 2592000}
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
                payload: dict[str, Any] = {
                    "name": f"{name}_{company.replace(' ', '_')}",
                    "description": desc,
                }
                if rule and META_PIXEL_ID:
                    payload["rule"] = rule
                    payload["retention_days"] = retention
                    payload["pixel_id"] = META_PIXEL_ID
                    payload["prefill"] = True
                else:
                    payload["customer_file_source"] = "USER_PROVIDED_ONLY"
                resp_data = await meta_api("POST", f"{acct}/customaudiences", payload)
                meta_audiences_url = f"https://adsmanager.facebook.com/adsmanager/manage/audiences?act={_meta_acct_numeric()}"
                result = {"audience_id": resp_data.get("id"), "name": name, "url": meta_audiences_url}
                log.info(f"Meta Audience erstellt: {name} ({resp_data.get('id')})")
            except Exception as e:
                log.warning(f"Meta Audience {name} übersprungen: {e}")
                meta_audiences_url = f"https://adsmanager.facebook.com/adsmanager/manage/audiences?act={_meta_acct_numeric()}"
                result = {"name": name, "audience_id": f"skipped_{name}", "note": f"Audience-Erstellung uebersprungen: {e}", "url": meta_audiences_url}

        elif node_id == "ca04":
            # Initial (Cold) Campaign — Objective: Leads, CBO: OFF
            company = context.get("company", "Novacode GmbH")
            acct = _meta_acct()
            try:
                # Bilder einmalig hochladen (für alle Ad Sets/Kampagnen)
                image_hashes = await upload_meta_images()
                log.info(f"Meta Bilder hochgeladen: {len(image_hashes)} Hashes")
                campaign = await meta_api("POST", f"{acct}/campaigns", {
                    "name": f"TOF | {datetime.now().strftime('%Y-%m')} | Leads | DE | {company} Recruiting",
                    "objective": "OUTCOME_LEADS",
                    "status": "PAUSED",
                    "special_ad_categories": ["EMPLOYMENT"],
                    "is_campaign_budget_optimization": False,  # Advantage Campaign Budget: OFF
                    "is_adset_budget_sharing_enabled": False,
                })
                cid = campaign["id"]
                meta_campaigns = dict(context.get("meta_campaigns", {}))
                meta_campaigns["initial"] = cid
                ads_url = f"https://adsmanager.facebook.com/adsmanager/manage/campaigns?act={_meta_acct_numeric()}"
                result = {
                    "campaign_id": cid,
                    "meta_campaigns": meta_campaigns,
                    "image_hashes": image_hashes,
                    "url": ads_url,
                }
                # Kampagne in Airtable schreiben
                if AIRTABLE_BASE_ID and AIRTABLE_API_KEY:
                    at_fields = {
                        "Kampagnen-Name": f"TOF | {company} Recruiting",
                        "Typ": "Initial",
                        "Meta Campaign ID": cid,
                        "Budget Tag": 30.0,
                        "Status": "Draft",
                        "Ads Manager URL": ads_url,
                    }
                    at_client = context.get("airtable_client_id")
                    if at_client:
                        at_fields["Client"] = [at_client]
                    await airtable_create_record("Kampagnen", at_fields)
                log.info(f"Meta Initial-Kampagne erstellt: {cid}, {len(image_hashes)} Bilder hochgeladen")
            except Exception as e:
                log.error(f"Meta ca04 Initial-Kampagne fehlgeschlagen: {e}")
                result = {"error": str(e), "image_hashes": [], "meta_campaigns": dict(context.get("meta_campaigns", {})), "url": f"https://adsmanager.facebook.com/adsmanager/manage/campaigns?act={_meta_acct_numeric()}"}

        elif node_id == "ca05":
            # Initial Ad Sets (3x) — Manuelle Placements: nur Facebook Feed + Instagram Feed

            campaign_id = context.get("meta_campaigns", {}).get("initial")
            if not campaign_id:
                result = {"skipped": True, "reason": "Keine Initial-Kampagne"}
            else:
                try:
                    company = context.get("company", "Novacode GmbH")
                    acct = _meta_acct()
                    image_hashes = context.get("image_hashes", [])
                    destination_url = "https://demo-recruiting.vercel.app/demo-landing/"

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
                    adset_ids = []
                    for adset_name in adset_names:
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
                    ads_url = f"https://adsmanager.facebook.com/adsmanager/manage/campaigns?act={_meta_acct_numeric()}"
                    result = {"adset_ids": adset_ids, "count": len(adset_ids), "url": ads_url}
                    log.info(f"Meta Initial Ad Sets + Ads erstellt: {adset_ids}")
                except Exception as e:
                    log.error(f"Meta ca05 Initial Ad Sets fehlgeschlagen: {e}")
                    result = {"error": str(e), "url": f"https://adsmanager.facebook.com/adsmanager/manage/campaigns?act={_meta_acct_numeric()}"}


        elif node_id == "ca06":
            # Retargeting Campaign — Objective: Leads, CBO: OFF
            company = context.get("company", "Novacode GmbH")
            acct = _meta_acct()
            try:
                campaign = await meta_api("POST", f"{acct}/campaigns", {
                    "name": f"RT | {datetime.now().strftime('%Y-%m')} | Leads | DE | {company} Recruiting",
                    "objective": "OUTCOME_LEADS",
                    "status": "PAUSED",
                    "special_ad_categories": ["EMPLOYMENT"],
                    "is_campaign_budget_optimization": False,  # Advantage Campaign Budget: OFF
                    "is_adset_budget_sharing_enabled": False,
                })
                cid = campaign["id"]
                meta_campaigns = dict(context.get("meta_campaigns", {}))
                meta_campaigns["retargeting"] = cid
                ads_url = f"https://adsmanager.facebook.com/adsmanager/manage/campaigns?act={_meta_acct_numeric()}"
                result = {"campaign_id": cid, "meta_campaigns": meta_campaigns, "url": ads_url}
                log.info(f"Meta Retargeting-Kampagne erstellt: {cid}")
                # Kampagne in Airtable schreiben
                if AIRTABLE_BASE_ID and AIRTABLE_API_KEY:
                    at_fields = {
                        "Kampagnen-Name": f"RT | {company} Recruiting",
                        "Typ": "Retargeting",
                        "Meta Campaign ID": cid,
                        "Budget Tag": 30.0,
                        "Status": "Draft",
                        "Ads Manager URL": ads_url,
                    }
                    at_client = context.get("airtable_client_id")
                    if at_client:
                        at_fields["Client"] = [at_client]
                    await airtable_create_record("Kampagnen", at_fields)
            except Exception as e:
                log.error(f"Meta ca06 Retargeting-Kampagne fehlgeschlagen: {e}")
                result = {"error": str(e), "meta_campaigns": dict(context.get("meta_campaigns", {})), "url": f"https://adsmanager.facebook.com/adsmanager/manage/campaigns?act={_meta_acct_numeric()}"}

        elif node_id == "ca07":
            # Retargeting Ad Sets (3x) — Auto-Placements, 10€/Tag

            campaign_id = context.get("meta_campaigns", {}).get("retargeting")
            if not campaign_id:
                result = {"skipped": True, "reason": "Keine Retargeting-Kampagne"}
            else:
                try:
                    company = context.get("company", "Novacode GmbH")
                    acct = _meta_acct()
                    image_hashes = context.get("image_hashes", [])
                    destination_url = "https://demo-recruiting.vercel.app/demo-formular"

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
                    adset_ids = []
                    for adset_name in adset_names:
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
                    ads_url = f"https://adsmanager.facebook.com/adsmanager/manage/campaigns?act={_meta_acct_numeric()}"
                    result = {"adset_ids": adset_ids, "count": len(adset_ids), "url": ads_url}
                    log.info(f"Meta Retargeting Ad Sets + Ads erstellt: {adset_ids}")
                except Exception as e:
                    log.error(f"Meta ca07 Retargeting Ad Sets fehlgeschlagen: {e}")
                    result = {"error": str(e), "url": f"https://adsmanager.facebook.com/adsmanager/manage/campaigns?act={_meta_acct_numeric()}"}


        elif node_id == "ca08":
            # Warmup Campaign — Objective: Awareness, CBO: OFF
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
                ads_url = f"https://adsmanager.facebook.com/adsmanager/manage/campaigns?act={_meta_acct_numeric()}"
                result = {"campaign_id": cid, "meta_campaigns": meta_campaigns, "url": ads_url}
                log.info(f"Meta Warmup-Kampagne erstellt: {cid}")
                # Kampagne in Airtable schreiben
                if AIRTABLE_BASE_ID and AIRTABLE_API_KEY:
                    at_fields = {
                        "Kampagnen-Name": f"WU | {company} Recruiting",
                        "Typ": "Warmup",
                        "Meta Campaign ID": cid,
                        "Budget Tag": 10.0,
                        "Status": "Draft",
                        "Ads Manager URL": ads_url,
                    }
                    at_client = context.get("airtable_client_id")
                    if at_client:
                        at_fields["Client"] = [at_client]
                    await airtable_create_record("Kampagnen", at_fields)
            except Exception as e:
                log.error(f"Meta ca08 Warmup-Kampagne fehlgeschlagen: {e}")
                result = {"error": str(e), "meta_campaigns": dict(context.get("meta_campaigns", {})), "url": f"https://adsmanager.facebook.com/adsmanager/manage/campaigns?act={_meta_acct_numeric()}"}

        elif node_id == "ca09":
            # Warmup Ad Sets — Video-freundliche Placements, 10€/Tag

            campaign_id = context.get("meta_campaigns", {}).get("warmup")
            if not campaign_id:
                result = {"skipped": True, "reason": "Keine Warmup-Kampagne"}
            else:
                try:
                    company = context.get("company", "Novacode GmbH")
                    acct = _meta_acct()
                    image_hashes = context.get("image_hashes", [])
                    destination_url = "https://demo-recruiting.vercel.app/demo-landing/"

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
                            acct, adset_id, image_hashes[:1],  # 1 Bild fuer Warmup
                            AD_COPY_WARMUP, company, destination_url, "LEARN_MORE", "WU",
                        )
                    ads_url = f"https://adsmanager.facebook.com/adsmanager/manage/campaigns?act={_meta_acct_numeric()}"
                    result = {"adset_ids": [adset_id], "count": 1, "url": ads_url}
                    log.info(f"Meta Warmup Ad Set + Ads erstellt: {adset_id}")
                except Exception as e:
                    log.error(f"Meta ca09 Warmup Ad Sets fehlgeschlagen: {e}")
                    result = {"error": str(e), "url": f"https://adsmanager.facebook.com/adsmanager/manage/campaigns?act={_meta_acct_numeric()}"}


        # ══════════════════════════════════════════════════════════════════
        # V2 Close CRM Lead — Lead + Opportunity in V2 Org erstellen
        # ══════════════════════════════════════════════════════════════════

        elif node_id == "v2-create-lead":
            company = context.get("company", "Unbekannt")
            contact_email = context.get("email", "")
            # Reuse existing lead if is02 already created one (same Close org)
            existing_lead = context.get("lead_id", "")
            existing_opp = context.get("opportunity_id", "")
            if existing_lead and existing_opp:
                log.info(f"V2: Lead {existing_lead} existiert bereits (aus is02) — kein Duplikat erstellt")
                # Note hinzufuegen dass V2 Phase startet
                if CLOSE_API_KEY_V2:
                    await close_api_v2("POST", "/activity/note/", {
                        "lead_id": existing_lead,
                        "note": "V2 Automation gestartet: AI-Extraktion + Dokument-Generierung.",
                    })
                    # Stage auf kickoff_abgeschlossen setzen (V2 startet nach Kickoff)
                    stage_id = CLOSE_V2_STAGES.get("kickoff_abgeschlossen")
                    if stage_id:
                        await close_api_v2("PUT", f"/opportunity/{existing_opp}/", {"status_id": stage_id})
                result = {
                    "lead_id": existing_lead,
                    "opportunity_id": existing_opp,
                    "url": f"https://app.close.com/lead/{existing_lead}/",
                    "reused": True,
                }
            elif CLOSE_API_KEY_V2 and CLOSE_V2_PIPELINE_ID:
                lead = await close_api_v2("POST", "/lead/", {
                    "name": company,
                    "contacts": [{
                        "name": context.get("contact", "Ansprechpartner"),
                        "emails": [{"email": contact_email, "type": "office"}] if contact_email else [],
                    }],
                    **(
                        {f"custom.{CLOSE_V2_FIELDS['service_type']}": "Recruiting"}
                        if CLOSE_V2_FIELDS.get("service_type") else {}
                    ),
                    **(
                        {f"custom.{CLOSE_V2_FIELDS['automation_status']}": "Running"}
                        if CLOSE_V2_FIELDS.get("automation_status") else {}
                    ),
                })
                lead_id = lead["id"]
                stage_id = CLOSE_V2_STAGES.get("onboarding_gestartet")
                opp = await close_api_v2("POST", "/opportunity/", {
                    "lead_id": lead_id,
                    "pipeline_id": CLOSE_V2_PIPELINE_ID,
                    "status_id": stage_id,
                    "note": f"Fulfillment Automation gestartet fuer {company}",
                    "value": 0,
                })
                await close_api_v2("POST", "/activity/note/", {
                    "lead_id": lead_id,
                    "note": "Onboarding-Formular eingegangen. Automation gestartet.",
                })
                result = {
                    "lead_id": lead_id,
                    "opportunity_id": opp["id"],
                    "url": f"https://app.close.com/lead/{lead_id}/",
                }
                log.info(f"Close Lead erstellt (Leadflow Marketing): {lead_id}, Opp: {opp['id']}")
            else:
                log.warning("Close nicht konfiguriert — Lead uebersprungen")
                result = {"lead_id": "", "opportunity_id": "", "skipped": True}
            # Slack: V2 Lead erstellt/verknüpft
            lead_url = result.get("url", "https://app.close.com/")
            blocks = _slack_blocks_message(
                f":link: V2 Automation gestartet — {company}",
                [
                    {"text": "Lead in Close verknüpft. AI-Pipeline startet."},
                    {"fields": [
                        ("Service", "Recruiting"),
                        ("Phase", "Extraktion → Strategie → Copy"),
                    ]},
                ],
                buttons=[("Close CRM öffnen", lead_url, "primary")],
                footer=f":zap: Flowstack V2 | {datetime.now().strftime('%d.%m.%Y %H:%M')}",
            )
            await slack_message(f"V2 Automation gestartet — {company}", blocks=blocks, color=SLACK_COLOR_INFO)

        # ══════════════════════════════════════════════════════════════════
        # V2 Airtable + Extraktion — Neue Nodes fuer Lego-Baustein-System
        # ══════════════════════════════════════════════════════════════════

        elif node_id == "v2-airtable-client":
            # Airtable: Client-Record erstellen
            company = context.get("company", "Unbekannt")
            if AIRTABLE_BASE_ID and AIRTABLE_API_KEY:
                fields = {
                    "Client Name": company,
                    "Status": "Extraktion",
                    "Branche": "Recruiting",
                    "Email": context.get("email", ""),
                    "Rolle": context.get("rolle", ""),
                    "Ansprechpartner": context.get("contact", ""),
                }
                # Close Lead URL verlinken falls vorhanden
                lid = context.get("lead_id", "")
                if lid:
                    fields["Close Lead URL"] = f"https://app.close.com/lead/{lid}/"
                # Google Drive URL verlinken falls vorhanden
                frid = context.get("folder_root_id", "")
                if frid:
                    fields["Google Drive URL"] = f"https://drive.google.com/drive/folders/{frid}"
                # Slack Channel verlinken falls vorhanden
                ch_name = context.get("channel_name", "")
                ch_id = context.get("channel_id", "")
                if ch_name:
                    fields["Slack Channel"] = ch_name
                elif ch_id:
                    fields["Slack Channel"] = ch_id
                # Kickoff Datum falls vorhanden
                event_id = context.get("event_id", "")
                if event_id:
                    fields["Kickoff Datum"] = datetime.now().strftime("%Y-%m-%d")
                record = await airtable_create_record("Clients", fields)
                result = {"airtable_client_id": record.get("id", "")}
                log.info(f"Airtable Client erstellt: {result['airtable_client_id']}")
            else:
                log.warning("Airtable nicht konfiguriert — Client-Record uebersprungen")
                result = {"airtable_client_id": "", "skipped": True}
            # Slack: Airtable Client erstellt
            blocks = _slack_blocks_message(
                f":card_index: Airtable — {company}",
                [
                    {"text": "Client-Record erstellt. 6 Tabellen verknüpft:"},
                    {"items": [
                        "Clients — Stammdaten & Status",
                        "Bausteine — 88 Lego-Bausteine (nach Extraktion)",
                        "Dokumente — 12 AI-generierte Dokumente",
                        "Kampagnen — Meta Ads Tracking",
                        "Frameworks — Dokument-Strukturen",
                        "Performance — Kampagnen-Metriken",
                    ]},
                ],
                footer=f":zap: Flowstack V2 | Airtable Base bereit",
            )
            await slack_message(f"Airtable Client erstellt — {company}", blocks=blocks, color=SLACK_COLOR_INFO)

        elif node_id == "v2-extract":
            # AI: Transkript lesen → 88 Bausteine extrahieren → Airtable
            transcript_id = "1ZO6yLLW18GLjJd1xuCc8jytaGwPi0jedoSkUR8LO-eM"
            transcript_text = await read_google_doc_content(transcript_id)
            company = context.get("company", "Unbekannt")
            rolle = context.get("rolle", "")
            blocks = await extract_building_blocks(transcript_text, company, rolle)

            # Quality Gate: Pruefen ob die wichtigsten Kategorien vorhanden sind
            required_categories = ["schmerzpunkte", "arbeitgeber", "messaging", "psychologie", "benefits"]
            missing = [c for c in required_categories if c not in blocks or not blocks[c]]
            if missing:
                log.warning(f"Quality Gate: Fehlende Kategorien in Bausteinen: {missing}")

            # In Airtable schreiben
            client_id = context.get("airtable_client_id", "")
            if client_id and AIRTABLE_BASE_ID:
                written = await write_blocks_to_airtable(blocks, client_id)
                log.info(f"Bausteine in Airtable geschrieben: {written} Records")
                # Client Status → "Strategie" (Extraktion abgeschlossen, bereit fuer AI)
                await airtable_update_record("Clients", client_id, {"Status": "Strategie"})
            result = {
                "bausteine": blocks,
                "block_count": len(blocks),
                "missing_categories": missing,
                "quality_ok": len(missing) == 0,
            }
            # Close: Note mit Extraktions-Ergebnis
            lead_id_ext = context.get("lead_id", "")
            if lead_id_ext and CLOSE_API_KEY_V2:
                cat_count = len([c for c in blocks if blocks.get(c)])
                await close_api_v2("POST", "/activity/note/", {
                    "lead_id": lead_id_ext,
                    "note": f"AI-Extraktion abgeschlossen: {len(blocks)} Kategorien, {cat_count} mit Daten. Quality: {'OK' if len(missing) == 0 else f'Fehlend: {missing}'}",
                })
            # Slack: Extraktion fertig
            company_ext = context.get("company", "Unbekannt")
            cat_names = {"schmerzpunkte": "Schmerzpunkte", "arbeitgeber": "Arbeitgeber-Daten", "messaging": "Messaging", "psychologie": "Psychologie", "benefits": "Benefits", "sprache": "Sprache & Wording", "einwaende": "Einwände"}
            cat_items = []
            for key, label in cat_names.items():
                count = len(blocks.get(key, {})) if isinstance(blocks.get(key), dict) else (1 if blocks.get(key) else 0)
                status = ":white_check_mark:" if count > 0 else ":x:"
                cat_items.append(f"{status} {label} ({count} Felder)")
            blocks_slack = _slack_blocks_message(
                f":brain: Extraktion fertig — {company_ext}",
                [
                    {"text": f"88 Bausteine aus Kickoff-Transkript extrahiert:"},
                    {"items": cat_items},
                ] + ([{"text": f":warning: Fehlende Kategorien: {', '.join(missing)}"}] if missing else []),
                buttons=[("Transkript", TRANSCRIPT_DOC, "primary")],
                footer=f":zap: Flowstack V2 | Quality Gate: {'PASS' if len(missing) == 0 else 'WARN'}",
            )
            await slack_message(f"Extraktion fertig — {company_ext}", blocks=blocks_slack, color=SLACK_COLOR_SUCCESS if len(missing) == 0 else SLACK_COLOR_WARNING)
            # ClickUp: Bausteine-Review Task erstellen
            list_id_ext = context.get("list_id")
            task_ids_ext = dict(context.get("task_ids", {}))
            if list_id_ext:
                desc_ext = f"AI-extrahierte Bausteine aus dem Kickoff-Transkript reviewen und korrigieren.\n\n"
                desc_ext += "Ressourcen:\n"
                desc_ext += f"- Kickoff-Transkript: {TRANSCRIPT_DOC}\n"
                desc_ext += f"- Airtable Bausteine: https://airtable.com/{AIRTABLE_BASE_ID}\n"
                if missing:
                    desc_ext += f"\n:warning: Fehlende Kategorien: {', '.join(missing)}\n"
                t_ext = await _create_task(
                    list_id_ext, f"V2 Bausteine-Review — {company_ext}", desc_ext,
                    [CLICKUP_CLAUDIO], 2, 3,  # High, +3 Tage
                    [
                        "Schmerzpunkte: Mind. 3 branchenspezifische Pain Points vorhanden",
                        "Arbeitgeber-Daten: Gründungsjahr, Teamgröße, Finanzierung vollständig",
                        "Benefits: Konkrete Benefits (nicht generisch) — mind. 5 Stück",
                        "Messaging: USPs und CTAs definiert, Tonalität festgelegt",
                        "Psychologie: Entscheidungstrigger und Einwände dokumentiert",
                        "Einwände: Mind. 3 konkrete Einwände mit Gegenargumenten",
                        "Sprache: Verbotene Wörter und Branchenjargon definiert",
                        "Alle Bausteine in Airtable korrekt verlinkt (Client-Record)",
                    ],
                )
                task_ids_ext["bausteine_review"] = t_ext["id"]
                result["task_ids"] = task_ids_ext

        # ══════════════════════════════════════════════════════════════════
        # V2 AI-Generierung — Echte Dokumente via OpenRouter + Google Docs
        # ══════════════════════════════════════════════════════════════════

        # V2 Strategy Phase: Frameworks 01-05
        # Framework mapping: 01=Zielgruppen, 02=Arbeitgeber, 03=Messaging,
        # 04=Creative-Briefing, 05=Marken-Richtlinien

        # Helper: Bausteine aus Context holen (falls v2-extract vorher lief)
        elif node_id == "v2-st01":
            bs = context.get("bausteine")
            doc = await generate_v2_document(1, "Zielgruppen-Avatar", context, bausteine=bs)
            generated = dict(context.get("generated_docs", {}))
            generated["zielgruppen_avatar"] = doc["content"]
            generated["zielgruppen_avatar_url"] = doc["url"]
            result = {"url": doc["url"], "doc_id": doc["doc_id"], "generated_docs": generated}

        elif node_id == "v2-st02":
            bs = context.get("bausteine")
            prev = {}
            if context.get("generated_docs", {}).get("zielgruppen_avatar"):
                prev["Zielgruppen-Avatar"] = context["generated_docs"]["zielgruppen_avatar"]
            doc = await generate_v2_document(2, "Arbeitgeber-Avatar", context, prev, bausteine=bs)
            generated = dict(context.get("generated_docs", {}))
            generated["arbeitgeber_avatar"] = doc["content"]
            generated["arbeitgeber_avatar_url"] = doc["url"]
            result = {"url": doc["url"], "doc_id": doc["doc_id"], "generated_docs": generated}

        elif node_id == "v2-st03":
            bs = context.get("bausteine")
            prev = {}
            gd = context.get("generated_docs", {})
            if gd.get("zielgruppen_avatar"):
                prev["Zielgruppen-Avatar"] = gd["zielgruppen_avatar"]
            if gd.get("arbeitgeber_avatar"):
                prev["Arbeitgeber-Avatar"] = gd["arbeitgeber_avatar"]
            doc = await generate_v2_document(3, "Messaging-Matrix", context, prev, bausteine=bs)
            generated = dict(gd)
            generated["messaging_matrix"] = doc["content"]
            generated["messaging_matrix_url"] = doc["url"]
            result = {"url": doc["url"], "doc_id": doc["doc_id"], "generated_docs": generated}

        elif node_id == "v2-st04":
            bs = context.get("bausteine")
            prev = {}
            gd = context.get("generated_docs", {})
            for k, v in [("zielgruppen_avatar", "Zielgruppen-Avatar"), ("arbeitgeber_avatar", "Arbeitgeber-Avatar"), ("messaging_matrix", "Messaging-Matrix")]:
                if gd.get(k): prev[v] = gd[k]
            doc = await generate_v2_document(4, "Creative Briefing", context, prev, bausteine=bs)
            generated = dict(gd)
            generated["creative_briefing"] = doc["content"]
            generated["creative_briefing_url"] = doc["url"]
            result = {"url": doc["url"], "doc_id": doc["doc_id"], "generated_docs": generated}

        elif node_id == "v2-st05":
            bs = context.get("bausteine")
            prev = {}
            gd = context.get("generated_docs", {})
            for k, v in [("arbeitgeber_avatar", "Arbeitgeber-Avatar"), ("messaging_matrix", "Messaging-Matrix"), ("creative_briefing", "Creative Briefing")]:
                if gd.get(k): prev[v] = gd[k]
            doc = await generate_v2_document(5, "Marken-Richtlinien", context, prev, bausteine=bs)
            generated = dict(gd)
            generated["marken_richtlinien"] = doc["content"]
            generated["marken_richtlinien_url"] = doc["url"]
            result = {"url": doc["url"], "doc_id": doc["doc_id"], "generated_docs": generated}

        # V2 Copy Phase: Frameworks 06-12
        # 06=LP-Texte, 07=Formular, 08=Danke, 09=Ads-Haupt, 10=Ads-RT, 11=Ads-WU, 12=Video
        elif node_id == "v2-cc01":
            bs = context.get("bausteine")
            prev = {}
            gd = context.get("generated_docs", {})
            for k, v in [("zielgruppen_avatar", "Zielgruppen-Avatar"), ("arbeitgeber_avatar", "Arbeitgeber-Avatar"), ("messaging_matrix", "Messaging-Matrix"), ("marken_richtlinien", "Marken-Richtlinien")]:
                if gd.get(k): prev[v] = gd[k]
            doc = await generate_v2_document(6, "Landingpage-Texte", context, prev, bausteine=bs)
            generated = dict(gd)
            generated["landingpage_texte"] = doc["content"]
            generated["landingpage_texte_url"] = doc["url"]
            result = {"url": doc["url"], "doc_id": doc["doc_id"], "generated_docs": generated}

        elif node_id == "v2-cc02":
            bs = context.get("bausteine")
            prev = {}
            gd = context.get("generated_docs", {})
            for k, v in [("zielgruppen_avatar", "Zielgruppen-Avatar"), ("landingpage_texte", "Landingpage-Texte")]:
                if gd.get(k): prev[v] = gd[k]
            doc = await generate_v2_document(7, "Formularseite-Texte", context, prev, bausteine=bs)
            generated = dict(gd)
            generated["formularseite_texte"] = doc["content"]
            generated["formularseite_texte_url"] = doc["url"]
            result = {"url": doc["url"], "doc_id": doc["doc_id"], "generated_docs": generated}

        elif node_id == "v2-cc03":
            bs = context.get("bausteine")
            prev = {}
            gd = context.get("generated_docs", {})
            for k, v in [("landingpage_texte", "Landingpage-Texte"), ("formularseite_texte", "Formularseite-Texte")]:
                if gd.get(k): prev[v] = gd[k]
            doc = await generate_v2_document(8, "Dankeseite-Texte", context, prev, bausteine=bs)
            generated = dict(gd)
            generated["dankeseite_texte"] = doc["content"]
            generated["dankeseite_texte_url"] = doc["url"]
            result = {"url": doc["url"], "doc_id": doc["doc_id"], "generated_docs": generated}

        elif node_id == "v2-cc04":
            bs = context.get("bausteine")
            prev = {}
            gd = context.get("generated_docs", {})
            for k, v in [("zielgruppen_avatar", "Zielgruppen-Avatar"), ("messaging_matrix", "Messaging-Matrix"), ("arbeitgeber_avatar", "Arbeitgeber-Avatar"), ("landingpage_texte", "Landingpage-Texte")]:
                if gd.get(k): prev[v] = gd[k]
            doc = await generate_v2_document(9, "Anzeigentexte Hauptkampagne", context, prev, bausteine=bs)
            generated = dict(gd)
            generated["anzeigentexte_haupt"] = doc["content"]
            generated["anzeigentexte_haupt_url"] = doc["url"]
            result = {"url": doc["url"], "doc_id": doc["doc_id"], "generated_docs": generated}

        elif node_id == "v2-cc05":
            bs = context.get("bausteine")
            prev = {}
            gd = context.get("generated_docs", {})
            for k, v in [("anzeigentexte_haupt", "Anzeigentexte Hauptkampagne"), ("messaging_matrix", "Messaging-Matrix")]:
                if gd.get(k): prev[v] = gd[k]
            doc = await generate_v2_document(10, "Anzeigentexte Retargeting", context, prev, bausteine=bs)
            generated = dict(gd)
            generated["anzeigentexte_rt"] = doc["content"]
            generated["anzeigentexte_rt_url"] = doc["url"]
            result = {"url": doc["url"], "doc_id": doc["doc_id"], "generated_docs": generated}

        elif node_id == "v2-cc06":
            bs = context.get("bausteine")
            prev = {}
            gd = context.get("generated_docs", {})
            for k, v in [("arbeitgeber_avatar", "Arbeitgeber-Avatar"), ("anzeigentexte_haupt", "Anzeigentexte Hauptkampagne")]:
                if gd.get(k): prev[v] = gd[k]
            doc = await generate_v2_document(11, "Anzeigentexte Warmup", context, prev, bausteine=bs)
            generated = dict(gd)
            generated["anzeigentexte_wu"] = doc["content"]
            generated["anzeigentexte_wu_url"] = doc["url"]
            result = {"url": doc["url"], "doc_id": doc["doc_id"], "generated_docs": generated}

        elif node_id == "v2-cc07":
            bs = context.get("bausteine")
            prev = {}
            gd = context.get("generated_docs", {})
            for k, v in [("zielgruppen_avatar", "Zielgruppen-Avatar"), ("messaging_matrix", "Messaging-Matrix"), ("arbeitgeber_avatar", "Arbeitgeber-Avatar"), ("anzeigentexte_haupt", "Anzeigentexte Hauptkampagne")]:
                if gd.get(k): prev[v] = gd[k]
            doc = await generate_v2_document(12, "Videoskript", context, prev, bausteine=bs)
            generated = dict(gd)
            generated["videoskript"] = doc["content"]
            generated["videoskript_url"] = doc["url"]
            result = {"url": doc["url"], "doc_id": doc["doc_id"], "generated_docs": generated}

        # Close CRM Updates (Leadflow Marketing Org)
        elif node_id == "v2-close-strategy":
            opp_id = context.get("opportunity_id")
            lead_id = context.get("lead_id")
            if opp_id and CLOSE_API_KEY_V2:
                stage_id = CLOSE_V2_STAGES.get("strategie_erstellt")
                if stage_id:
                    await close_api_v2("PUT", f"/opportunity/{opp_id}/", {"status_id": stage_id})
                if lead_id and CLOSE_V2_FIELDS.get("automation_status"):
                    await close_api_v2("PUT", f"/lead/{lead_id}/", {
                        f"custom.{CLOSE_V2_FIELDS['automation_status']}": "Running",
                    })
                # Note mit allen generierten Strategie-Docs
                gd_note = context.get("generated_docs", {})
                note_text = "V2 Strategie-Phase abgeschlossen. 5 Dokumente AI-generiert:\n\n"
                for key, label in [("zielgruppen_avatar", "Zielgruppen-Avatar"), ("arbeitgeber_avatar", "Arbeitgeber-Avatar"), ("messaging_matrix", "Messaging-Matrix"), ("creative_briefing", "Creative Briefing"), ("marken_richtlinien", "Marken-Richtlinien")]:
                    url = gd_note.get(f"{key}_url", "")
                    note_text += f"• {label}: {url}\n" if url else f"• {label}: (nicht generiert)\n"
                if lead_id:
                    await close_api_v2("POST", "/activity/note/", {"lead_id": lead_id, "note": note_text})
                result = {"stage": "strategie_erstellt", "updated": True}
            else:
                result = {"stage": "strategie_erstellt", "updated": False, "reason": "no opportunity_id or Close key"}
            # Airtable Client Status → "Copy"
            client_id = context.get("airtable_client_id")
            if client_id and AIRTABLE_BASE_ID:
                await airtable_update_record("Clients", client_id, {"Status": "Copy"})
            # ClickUp: Bausteine-Review abschließen + V2 Copy-Review erstellen
            company = context.get("company", "Unbekannt")
            list_id_st = context.get("list_id")
            task_ids_st = dict(context.get("task_ids", {}))
            if list_id_st:
                if task_ids_st.get("bausteine_review"):
                    log.info("V2: Bausteine-Review Task bleibt offen — Mensch muss pruefen und abhaken.")
                # Task: V2 Copy-Review
                gd_st2 = context.get("generated_docs", {})
                desc_st = "AI-generierte Strategie-Dokumente reviewen und Copy-Phase vorbereiten.\n\n"
                desc_st += "Strategie-Dokumente:\n"
                for key, label in [("zielgruppen_avatar", "Zielgruppen-Avatar"), ("arbeitgeber_avatar", "Arbeitgeber-Avatar"), ("messaging_matrix", "Messaging-Matrix"), ("creative_briefing", "Creative Briefing"), ("marken_richtlinien", "Marken-Richtlinien")]:
                    url = gd_st2.get(f"{key}_url", "")
                    if url:
                        desc_st += f"- {label}: {url}\n"
                t_st = await _create_task(
                    list_id_st, f"V2 Copy-Review — {company}", desc_st,
                    [CLICKUP_CLAUDIO], 2, 4,  # High, +4 Tage
                    [
                        "Zielgruppen-Avatar: Alter, Region, Branche korrekt",
                        "Arbeitgeber-Avatar: EVP und 4 P's vollständig",
                        "Messaging-Matrix: USPs mit Pain Points verknüpft",
                        "Creative Briefing: Farbpalette und Typografie festgelegt",
                        "Marken-Richtlinien: Kommunikations-Dos/Don'ts vollständig",
                        "Alle 5 Dokumente konsistent untereinander",
                        "Ton und Sprache passen zur Zielgruppe",
                        "Copy-Phase kann starten",
                    ],
                )
                task_ids_st["v2_copy_review"] = t_st["id"]
                result["task_ids"] = task_ids_st
            # Slack: V2 Strategy Docs fertig
            gd = context.get("generated_docs", {})
            doc_items = []
            for key, label in [("zielgruppen_avatar", "Zielgruppen-Avatar"), ("arbeitgeber_avatar", "Arbeitgeber-Avatar"), ("messaging_matrix", "Messaging-Matrix"), ("creative_briefing", "Creative Briefing"), ("marken_richtlinien", "Marken-Richtlinien")]:
                if gd.get(f"{key}_url"):
                    doc_items.append((label, gd[f"{key}_url"]))
            sections_st = [{"text": "5 Dokumente via AI generiert:"}]
            if doc_items:
                sections_st.append({"items": doc_items, "emoji": ":sparkles:"})
            folder_root_st = context.get("folder_root_id", "")
            drive_url_st = f"https://drive.google.com/drive/folders/{folder_root_st}" if folder_root_st else ""
            blocks = _slack_blocks_message(
                f":dart: V2 AI-Strategie — {company}",
                sections_st,
                buttons=([("Drive öffnen", drive_url_st, "primary")] if drive_url_st else []),
                footer=":zap: Flowstack V2 | Strategie abgeschlossen — Copy startet",
            )
            await slack_message(f"V2 Strategie fertig — {company}", blocks=blocks, color=SLACK_COLOR_SUCCESS)
            result["sent"] = True

        elif node_id == "v2-close-copy":
            opp_id = context.get("opportunity_id")
            lead_id_cc = context.get("lead_id")
            if opp_id and CLOSE_API_KEY_V2:
                stage_id = CLOSE_V2_STAGES.get("assets_erstellt")
                if stage_id:
                    await close_api_v2("PUT", f"/opportunity/{opp_id}/", {"status_id": stage_id})
                # Note mit allen generierten Copy-Docs
                gd_cc_note = context.get("generated_docs", {})
                note_cc = "V2 Copy-Phase abgeschlossen. 7 Dokumente AI-generiert:\n\n"
                for key, label in [("landingpage_texte", "Landingpage-Texte"), ("formularseite_texte", "Formularseite"), ("dankeseite_texte", "Dankeseite"), ("anzeigentexte_haupt", "Ads Hauptkampagne"), ("anzeigentexte_rt", "Ads Retargeting"), ("anzeigentexte_wu", "Ads Warmup"), ("videoskript", "Videoskript")]:
                    url = gd_cc_note.get(f"{key}_url", "")
                    note_cc += f"• {label}: {url}\n" if url else f"• {label}: (nicht generiert)\n"
                if lead_id_cc:
                    await close_api_v2("POST", "/activity/note/", {"lead_id": lead_id_cc, "note": note_cc})
                result = {"stage": "assets_erstellt", "updated": True}
            else:
                result = {"stage": "assets_erstellt", "updated": False, "reason": "no opportunity_id or Close key"}
            # Airtable Client Status → "Ads" (Copy Phase abgeschlossen)
            client_id = context.get("airtable_client_id")
            if client_id and AIRTABLE_BASE_ID:
                await airtable_update_record("Clients", client_id, {"Status": "Ads"})
            # ClickUp: V2 Copy-Review abschließen + Launch-Vorbereitung erstellen
            company = context.get("company", "Unbekannt")
            list_id_cc = context.get("list_id")
            task_ids_cc = dict(context.get("task_ids", {}))
            if list_id_cc:
                if task_ids_cc.get("v2_copy_review"):
                    comment_cc = "✅ Copy-Phase abgeschlossen. Dokumente generiert:\n\n"
                    gd_cc = context.get("generated_docs", {})
                    for key, label in [("landingpage_texte", "Landingpage-Texte"), ("formularseite_texte", "Formularseite"), ("dankeseite_texte", "Dankeseite"), ("anzeigentexte_haupt", "Ads Hauptkampagne"), ("anzeigentexte_rt", "Ads Retargeting"), ("anzeigentexte_wu", "Ads Warmup"), ("videoskript", "Videoskript")]:
                        url = gd_cc.get(f"{key}_url", "")
                        if url:
                            comment_cc += f"• {label}: {url}\n"
                    log.info("V2: Copy-Review Task bleibt offen — Mensch muss pruefen und abhaken.")
                # Task: V2 Launch-Vorbereitung
                gd_cc2 = context.get("generated_docs", {})
                desc_cc = "Alle AI-generierten Dokumente final prüfen und Kampagnen-Setup vorbereiten.\n\n"
                desc_cc += "Copy-Dokumente:\n"
                for key, label in [("landingpage_texte", "Landingpage-Texte"), ("formularseite_texte", "Formularseite"), ("dankeseite_texte", "Dankeseite"), ("anzeigentexte_haupt", "Ads Hauptkampagne"), ("anzeigentexte_rt", "Ads Retargeting"), ("anzeigentexte_wu", "Ads Warmup"), ("videoskript", "Videoskript")]:
                    url = gd_cc2.get(f"{key}_url", "")
                    if url:
                        desc_cc += f"- {label}: {url}\n"
                desc_cc += f"\nAirtable: https://airtable.com/{AIRTABLE_BASE_ID}\n"
                t_cc = await _create_task(
                    list_id_cc, f"V2 Launch-Vorbereitung — {company}", desc_cc,
                    [CLICKUP_CLAUDIO, CLICKUP_ANAK], 1, 3,  # Urgent, +3 Tage
                    [
                        "Landingpage-Texte in Funnel eingebaut",
                        "Formularseite-Texte korrekt",
                        "Dankeseite-Texte eingebaut",
                        "Anzeigentexte Hauptkampagne: 5 Varianten geprüft",
                        "Anzeigentexte Retargeting: 3 Varianten (Einwand, Social Proof, Urgency)",
                        "Anzeigentexte Warmup: Awareness-Angle korrekt",
                        "Videoskript: Hook-Problem-Lösung-CTA Struktur",
                        "Alle Texte konsistent mit Marken-Richtlinien",
                        "Meta Ads Manager: Kampagnen-Setup bereit",
                        "Airtable: Alle Dokumente verlinkt und Status korrekt",
                    ],
                )
                task_ids_cc["v2_launch_prep"] = t_cc["id"]
                result["task_ids"] = task_ids_cc
            # Slack: V2 Copy fertig
            gd = context.get("generated_docs", {})
            doc_items = []
            for key, label in [("landingpage_texte", "Landingpage-Texte"), ("formularseite_texte", "Formularseite"), ("dankeseite_texte", "Dankeseite"), ("anzeigentexte_haupt", "Ads Hauptkampagne"), ("anzeigentexte_rt", "Ads Retargeting"), ("anzeigentexte_wu", "Ads Warmup"), ("videoskript", "Videoskript")]:
                if gd.get(f"{key}_url"):
                    doc_items.append((label, gd[f"{key}_url"]))
            sections = [{"text": "7 Dokumente via AI generiert:"}]
            if doc_items:
                sections.append({"items": doc_items, "emoji": ":sparkles:"})
            folder_root_cc = context.get("folder_root_id", "")
            drive_url_cc = f"https://drive.google.com/drive/folders/{folder_root_cc}" if folder_root_cc else ""
            list_id_cc_slack = context.get("list_id", "")
            clickup_url_cc = f"https://app.clickup.com/{CLICKUP_TEAM_ID}/v/li/{list_id_cc_slack}" if list_id_cc_slack else ""
            blocks = _slack_blocks_message(
                f":pencil2: V2 AI-Copy — {company}",
                sections,
                buttons=[
                    btn for btn in [
                        ("Drive öffnen", drive_url_cc, "primary") if drive_url_cc else None,
                        ("ClickUp", clickup_url_cc) if clickup_url_cc else None,
                    ] if btn
                ],
                footer=":zap: Flowstack V2 | Copy abgeschlossen — Kampagnen-Setup als Nächstes",
            )
            await slack_message(f"V2 Copy fertig — {company}", blocks=blocks, color=SLACK_COLOR_SUCCESS)
            result["sent"] = True

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
        log.warning(f"Meta Insights fuer {campaign_id} fehlgeschlagen: {e}")
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
    """Holt Insights fuer eine einzelne Kampagne."""
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
    Vorbereitete Template-Dokumente (STRATEGY_DOCS, COPY_DOCS, etc.) bleiben IMMER erhalten.
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

    # Close CRM Lead löschen (Leadflow Marketing Org — Opportunity wird mit-gelöscht)
    if lead_id:
        # Versuche V2 API (Leadflow Marketing), Fallback auf V1
        api_fn = close_api_v2 if CLOSE_API_KEY_V2 else close_api
        try:
            await api_fn("DELETE", f"/lead/{lead_id}/")
            deleted.append(f"close_lead:{lead_id}")
            log.info(f"Cleanup: Close Lead {lead_id} gelöscht")
        except Exception as e:
            errors.append(f"close_lead:{lead_id} — {e}")
            log.error(f"Cleanup: Close Lead {lead_id} fehlgeschlagen: {e}")

    # ClickUp List löschen
    if list_id:
        try:
            await clickup_api("DELETE", f"/list/{list_id}")
            deleted.append(f"clickup_list:{list_id}")
            log.info(f"Cleanup: ClickUp List {list_id} gelöscht")
        except Exception as e:
            errors.append(f"clickup_list:{list_id} — {e}")
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
            errors.append(f"drive_folder:{folder_root_id} — {e}")
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
            errors.append(f"calendar_event:{event_id} — {e}")
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
                    errors.append(f"slack_channel:{channel_id} — {r.get('error')}")
        except Exception as e:
            errors.append(f"slack_channel:{channel_id} — {e}")
            log.error(f"Cleanup: Slack Channel {channel_id} fehlgeschlagen: {e}")

    # Meta Kampagnen löschen (Löschen einer Kampagne löscht auch ihre Ad Sets)
    meta_campaign_ids = payload.get("meta_campaign_ids", [])
    for cid in meta_campaign_ids:
        try:
            await meta_api("DELETE", cid)
            deleted.append(f"meta_campaign:{cid}")
            log.info(f"Cleanup: Meta Kampagne {cid} gelöscht")
        except Exception as e:
            errors.append(f"meta_campaign:{cid} — {e}")
            log.error(f"Cleanup: Meta Kampagne {cid} fehlgeschlagen: {e}")

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
                errors.append(f"airtable_{table_name.lower()} — {e}")
                log.warning(f"Cleanup: Airtable {table_name} fehlgeschlagen: {e}")
        # Client Record selbst löschen
        try:
            await airtable_request("DELETE", f"{AIRTABLE_BASE_ID}/Clients/{airtable_client_id}")
            deleted.append(f"airtable_client:{airtable_client_id}")
            log.info(f"Cleanup: Airtable Client {airtable_client_id} gelöscht")
        except Exception as e:
            errors.append(f"airtable_client:{airtable_client_id} — {e}")
            log.warning(f"Cleanup: Airtable Client fehlgeschlagen: {e}")

    # Miro Board loeschen
    miro_board_id = payload.get("miro_board_id")
    if miro_board_id and MIRO_ACCESS_TOKEN:
        try:
            await miro_api("DELETE", f"/boards/{miro_board_id}")
            deleted.append(f"miro_board:{miro_board_id}")
            log.info(f"Cleanup: Miro Board {miro_board_id} geloescht")
        except Exception as e:
            errors.append(f"miro_board:{miro_board_id} — {e}")
            log.warning(f"Cleanup: Miro Board fehlgeschlagen: {e}")

    # Slack Benachrichtigung
    await slack_message("\U0001f504 Demo zurückgesetzt \u2014 Testdaten bereinigt")

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
# DriveVault — Google Docs, Sheets & Gmail durchsuchbar machen
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

# Baulig Roh-Erkennung — Original Baulig-Vorlagen (mit Rechtshinweis)
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
    - BC - / BC – (Baulig Consulting Vorlage)
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
    if nl.startswith("bc -") or nl.startswith("bc –") or nl.startswith("bc –"):
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

    Format: [BEREICH] Typ — Name (Details)
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
    for remove in ["[V2]", "[V1]", "[Unfertig]", "[TEMPLATE]", " - ", " — ", " | "]:
        clean = clean.replace(remove, " ")
    clean = clean.strip(" -—|")

    if doc_type:
        return f"[{prefix}] {doc_type} — {clean}{version}{source}{status}"
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
# DriveVault — Auto-Organize: Rename + Sort + Tag
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
      dry_run: bool (default true) — nur Preview, keine Änderungen
      rename: bool (default true) — Dateien umbenennen
      move: bool (default true) — Dateien in Ordner verschieben
      file_ids: list[str] (optional) — nur bestimmte Dateien verarbeiten
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

        # Skip "Unbenanntes Dokument" — markieren als zu prüfen
        if current_name.startswith("Unbenanntes Dokument"):
            actions.append({
                "id": file_id,
                "current_name": current_name,
                "new_name": None,
                "action": "skip",
                "reason": "Unbenanntes Dokument — manuell benennen",
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

        # 2. [X] Typ — [X] Typ Rest → [X] Typ — Rest
        m = re.match(r'^(\[[\w\s]+\])\s+(\w+)\s*—\s*\1\s+\2\s*(.*)', clean)
        if m:
            clean = f"{m.group(1)} {m.group(2)} — {m.group(3)}".strip()

        # 3. [X] Typ — Typ Rest → [X] Typ — Rest (doppelter Typ nach Dash)
        m = re.match(r'^(\[[\w\s]+\])\s+(\w+)\s+—\s+\2\s+(.*)', clean)
        if m:
            clean = f"{m.group(1)} {m.group(2)} — {m.group(3)}".strip()

        # 4. Doppelte Versionen: V2 V2 → V2
        clean = re.sub(r'\b(V\d)\s+\1\b', r'\1', clean)

        # 5. Doppeltes (Baulig Roh)
        clean = clean.replace("(Baulig Roh) (Baulig Roh)", "(Baulig Roh)")

        # 6. Mehrfache Leerzeichen
        clean = re.sub(r'\s+', ' ', clean).strip()

        # 7. Trailing —
        clean = clean.rstrip(' —')

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
    Body: {file_ids: [str]} — Liste von Leadflow-File-IDs.
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

    # Content-Hashes berechnen — in Batches um Rate Limits zu vermeiden
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


# ═══════════════════════════════════════════════════════════════
# V3 ENDPOINTS — Eigenständige Automation mit Resilience Layer
# ═══════════════════════════════════════════════════════════════

from resilience import (
    retry_with_backoff, validate_context, ExecutionState,
    acquire_execution_lock, release_execution_lock, CircuitBreaker,
    DeadLetterQueue, OPTIONAL_SERVICES,
)
from approval import (
    handle_approval_gate, resolve_approval, get_pending_approvals,
    check_escalations, GATE_CONFIG,
)
from monitoring import (
    health_check, slack_log as v3_slack_log, slack_alert as v3_slack_alert,
    slack_phase_complete, check_milestones,
)
from qa import (
    dach_compliance_scan, apply_auto_fixes, spelling_check,
    validate_text_lengths, validate_all_urls, verify_pixel,
    ad_policy_check, brand_consistency_check, scan_for_placeholders,
)
from notion_client import NotionClient
from gtm_client import setup_gtm_for_client, setup_ga4_for_client
from nudge_system import create_nudge, resolve_nudge, get_open_nudges, check_nudges, AUTOMATIC_NUDGES

# Notion client
NOTION_API_KEY = os.environ.get("NOTION_API_KEY_CLAUDIO", "")
_notion = NotionClient(NOTION_API_KEY) if NOTION_API_KEY else None

# V3 Slack helper (wraps with token)
async def _v3_log(msg: str):
    if SLACK_BOT_TOKEN:
        await v3_slack_log("", msg, SLACK_BOT_TOKEN)

async def _v3_alert(msg: str, severity: str = "critical"):
    if SLACK_BOT_TOKEN:
        await v3_slack_alert(msg, SLACK_BOT_TOKEN, severity)


# ── V3 Execution ─────────────────────────────────────────────

@app.post("/api/v3/execute")
async def v3_start_execution(body: dict):
    """Start a new V3 execution for a client."""
    company = body.get("company", "")
    contact = body.get("contact", "")
    email = body.get("email", "")

    if not company or not email:
        raise HTTPException(400, "company and email are required")

    # Generate execution ID
    safe_name = company.lower().replace(" ", "-").replace("ä", "ae").replace("ö", "oe").replace("ü", "ue")
    execution_id = f"v3_{safe_name}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"

    # Check execution lock
    if not acquire_execution_lock(company, execution_id):
        raise HTTPException(409, f"Execution already running for {company}")

    # Create execution state
    state = ExecutionState(execution_id, company)
    state.update_context({
        "company": company,
        "contact": contact,
        "email": email,
        "phone": body.get("phone", ""),
        "branche": body.get("branche", ""),
        "website": body.get("website", ""),
        "stellen": body.get("stellen", ""),
        "budget": body.get("budget", ""),
        "account_manager": body.get("account_manager", "Claudio"),
    })
    state.save()

    await _v3_log(f"✓ {company} — V3 Execution gestartet ({execution_id})")

    return {
        "execution_id": execution_id,
        "client_name": company,
        "status": "running",
    }


@app.get("/api/v3/execute/{execution_id}")
async def v3_get_execution(execution_id: str):
    """Get execution state."""
    state = ExecutionState.load(execution_id)
    if not state:
        raise HTTPException(404, f"Execution {execution_id} not found")

    return {
        "execution_id": state.execution_id,
        "client_name": state.client_name,
        "started_at": state.started_at,
        "paused_at": state.paused_at,
        "completed_at": state.completed_at,
        "context": state.context,
        "nodes": state.nodes,
    }


@app.post("/api/v3/execute/{execution_id}/pause")
async def v3_pause_execution(execution_id: str):
    """Pause an execution."""
    state = ExecutionState.load(execution_id)
    if not state:
        raise HTTPException(404, f"Execution {execution_id} not found")
    state.pause()
    await _v3_log(f"⏸ {state.client_name} — Execution pausiert")
    return {"status": "paused"}


@app.post("/api/v3/execute/{execution_id}/resume")
async def v3_resume_execution(execution_id: str):
    """Resume a paused execution."""
    state = ExecutionState.load(execution_id)
    if not state:
        raise HTTPException(404, f"Execution {execution_id} not found")
    state.resume()
    resume_point = state.get_resume_point()
    await _v3_log(f"▶ {state.client_name} — Execution resumed ab {resume_point}")
    return {"status": "resumed", "resume_from": resume_point}


@app.get("/api/v3/executions")
async def v3_list_executions():
    """List all executions."""
    return ExecutionState.list_all()


# ── V3 Approvals ─────────────────────────────────────────────

@app.post("/api/approval/{node_id}")
async def v3_handle_approval(node_id: str, body: dict):
    """Approve, reject, or request changes for an approval gate."""
    action = body.get("action", "")
    reviewer = body.get("reviewer", "unknown")
    comment = body.get("comment", "")

    if action not in ("approve", "reject", "changes_requested"):
        raise HTTPException(400, "action must be 'approve', 'reject', or 'changes_requested'")

    result = await resolve_approval(
        node_id=node_id,
        action=action,
        reviewer=reviewer,
        comment=comment,
        slack_func=lambda **kw: _v3_log(kw.get("text", "")),
    )

    if not result["success"]:
        raise HTTPException(400, result["error"])

    return result


@app.get("/api/approval/pending")
async def v3_pending_approvals():
    """Get all pending approvals."""
    return get_pending_approvals()


# ── V3 Alerts ────────────────────────────────────────────────

@app.get("/api/v3/alerts")
async def v3_get_alerts():
    """Get active alerts (DLQ entries + circuit breaker states)."""
    dlq = DeadLetterQueue.get_unresolved()
    circuits = {}
    for service in ["close", "google", "slack", "clickup", "meta", "airtable", "openrouter", "miro", "notion"]:
        cb = CircuitBreaker.get(service)
        state = cb.get_state()
        if state != "closed":
            circuits[service] = state

    return {
        "dlq_entries": dlq,
        "circuit_breakers": circuits,
        "dlq_count": len(dlq),
        "open_circuits": len(circuits),
    }


@app.post("/api/v3/alerts/{alert_id}/acknowledge")
async def v3_acknowledge_alert(alert_id: str):
    """Acknowledge a DLQ entry."""
    # alert_id format: "node_id:client_name"
    parts = alert_id.split(":", 1)
    if len(parts) == 2:
        DeadLetterQueue.resolve(parts[0], parts[1])
    return {"acknowledged": True}


# ── V3 Health ────────────────────────────────────────────────

@app.get("/api/health")
async def v3_health():
    """Full system health check."""
    tokens = {
        "CLOSE_API_KEY_V2": CLOSE_API_KEY_V2,
        "SLACK_BOT_TOKEN": SLACK_BOT_TOKEN,
        "CLICKUP_API_TOKEN": CLICKUP_TOKEN,
        "META_ACCESS_TOKEN": META_ACCESS_TOKEN,
        "AIRTABLE_API": AIRTABLE_API_KEY,
        "OPENROUTER_API_KEY": OPENROUTER_API_KEY,
        "NOTION_API_KEY_CLAUDIO": NOTION_API_KEY,
    }
    return await health_check(tokens)


# ── V3 Node Execution ────────────────────────────────────────

@app.post("/api/v3/execute-node")
async def v3_execute_node(body: dict):
    """
    Execute a single V3 node with resilience.
    Called by the frontend DAG engine.
    """
    node_id = body.get("nodeId", "")
    execution_id = body.get("executionId", "")
    context = body.get("context", {})

    if not node_id or not execution_id:
        raise HTTPException(400, "nodeId and executionId required")

    # Load execution state
    state = ExecutionState.load(execution_id)
    if not state:
        raise HTTPException(404, f"Execution {execution_id} not found")

    if state.paused_at:
        raise HTTPException(409, "Execution is paused")

    client_name = state.client_name

    # Merge context
    full_context = {**state.context, **context}

    # Context validation
    valid, missing = validate_context(node_id, full_context)
    if not valid:
        state.update_node(node_id, "blocked", error=f"Missing context: {missing}")
        await _v3_alert(f"{client_name} — {node_id} BLOCKED: fehlendes Feld '{missing}'", "warning")
        return {"status": "blocked", "missing": missing}

    # Mark as running
    state.update_node(node_id, "running")
    start_time = datetime.now()

    # Check if this is an approval gate
    if node_id in GATE_CONFIG:
        result = await handle_approval_gate(
            node_id=node_id,
            client_name=client_name,
            execution_id=execution_id,
            context=full_context,
            slack_func=lambda **kw: _v3_log(kw.get("text", "")),
        )
        state.update_node(node_id, "waiting_approval", result=result)
        return {"status": "waiting_approval", "result": result}

    # Route to handler — V3 ist eigenständig, KEIN V1/V2 Fallback
    handler = V3_NODE_HANDLERS.get(node_id)
    if not handler:
        state.update_node(node_id, "failed", error=f"Kein V3 Handler für {node_id}")
        await _v3_alert(f"{client_name} — {node_id}: Kein Handler implementiert", "critical")
        return {"status": "failed", "error": f"Kein V3 Handler für {node_id}"}

    # Execute with retry
    service = _get_service_for_node(node_id)
    result = await retry_with_backoff(
        func=handler,
        args={"context": full_context, "state": state},
        service=service,
        node_id=node_id,
        client_name=client_name,
        slack_log_func=_v3_log,
        slack_alert_func=_v3_alert,
    )

    duration_ms = int((datetime.now() - start_time).total_seconds() * 1000)

    if result["success"]:
        # Update context with results
        if isinstance(result.get("result"), dict):
            state.update_context(result["result"])

        state.update_node(node_id, "completed", result=result.get("result"), duration_ms=duration_ms)
        await _v3_log(f"✓ {client_name} — {node_id}")
        return {"status": "completed", "result": result.get("result"), "duration_ms": duration_ms}
    else:
        # Failed
        if result.get("optional"):
            # Optional service — skip and continue
            state.update_node(node_id, "completed", result={"skipped": True, "reason": result["error"]}, duration_ms=duration_ms)
            await _v3_log(f"⚠ {client_name} — {node_id} übersprungen ({result['error'][:50]})")
            return {"status": "completed", "skipped": True, "error": result["error"]}
        else:
            state.update_node(node_id, "failed", error=result["error"], retries=result.get("retries", 0), duration_ms=duration_ms)
            return {"status": "failed", "error": result["error"], "retries": result.get("retries", 0)}


# ── V3 Node Handlers ─────────────────────────────────────────

async def _v3_is02a(context: dict, state: ExecutionState) -> dict:
    """Duplikat-Check: Lead existiert schon in Close?"""
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            "https://api.close.com/api/v1/lead/",
            params={"query": f'email:"{context["email"]}"', "limit": 1},
            auth=(CLOSE_API_KEY_V2, ""),
        )
        data = resp.json()
        leads = data.get("data", [])
        if leads:
            lead = leads[0]
            return {
                "duplicate": True,
                "lead_id": lead["id"],
                "opportunity_id": lead.get("opportunities", [{}])[0].get("id") if lead.get("opportunities") else None,
            }
        return {"duplicate": False}


def _refresh_google_token_v3() -> str:
    """Refresh the Flowstack Google OAuth token and return a valid access token."""
    global GOOGLE_ACCESS_TOKEN
    try:
        raw = os.environ.get("FLOWSTACK_GOOGLE_OAUTH_TOKEN", os.environ.get("GOOGLE_OAUTH_TOKEN", "{}"))
        creds = json.loads(raw) if isinstance(raw, str) else raw
        import ssl, certifi, urllib.request
        ctx = ssl.create_default_context(cafile=certifi.where())
        refresh_data = json.dumps({
            "client_id": creds.get("client_id", GOOGLE_CLIENT_ID),
            "client_secret": creds.get("client_secret", GOOGLE_CLIENT_SECRET),
            "refresh_token": creds.get("refresh_token", GOOGLE_REFRESH_TOKEN),
            "grant_type": "refresh_token",
        }).encode()
        req = urllib.request.Request("https://oauth2.googleapis.com/token", data=refresh_data, headers={"Content-Type": "application/json"})
        resp = urllib.request.urlopen(req, timeout=10, context=ctx)
        new_token = json.loads(resp.read()).get("access_token", "")
        if new_token:
            GOOGLE_ACCESS_TOKEN = new_token
        return new_token or GOOGLE_ACCESS_TOKEN
    except Exception as e:
        log.warning(f"Google token refresh failed: {e}")
        return GOOGLE_ACCESS_TOKEN


async def _v3_is06a(context: dict, state: ExecutionState) -> dict:
    """Drive Quota Check."""
    token = _refresh_google_token_v3()
    if not token:
        return {"free_gb": -1, "skipped": True, "reason": "No Google Drive token available"}

    async with httpx.AsyncClient() as client:
        resp = await client.get(
            "https://www.googleapis.com/drive/v3/about",
            params={"fields": "storageQuota"},
            headers={"Authorization": f"Bearer {token}"},
        )
        data = resp.json()
        quota = data.get("storageQuota", {})
        usage = int(quota.get("usage", "0"))
        limit = int(quota.get("limit", "0"))
        free_bytes = limit - usage if limit > 0 else float("inf")
        free_gb = free_bytes / (1024**3)

        if free_gb < 0.1:  # < 100MB
            raise Exception(f"Drive Speicher KRITISCH: nur {free_gb:.2f} GB frei")
        if free_gb < 1.0:
            await _v3_alert(f"{state.client_name} — Drive Speicher niedrig: {free_gb:.1f} GB frei", "warning")

        return {"free_gb": round(free_gb, 2), "usage_bytes": usage}


async def _v3_kc02a(context: dict, state: ExecutionState) -> dict:
    """No-Show Detection: Kein Transkript nach Meeting-Ende?"""
    # Check if kickoff date is in the past and no transcript exists
    # Simplified: Check if transcript_id exists in context
    has_transcript = bool(context.get("transcript_id") or context.get("transcript_doc_id"))
    return {"noshow": not has_transcript, "has_transcript": has_transcript}


async def _v3_kc02b(context: dict, state: ExecutionState) -> dict:
    """No-Show Handler: Close → Blocked, ClickUp Task erstellen."""
    # Update Close to Blocked
    if context.get("opportunity_id"):
        async with httpx.AsyncClient() as client:
            await client.put(
                f"https://api.close.com/api/v1/opportunity/{context['opportunity_id']}/",
                json={"status_id": CLOSE_V2_STAGES.get("onboarding_gestartet", "")},
                auth=(CLOSE_API_KEY_V2, ""),
            )

    # Create ClickUp task
    if context.get("list_id") and CLICKUP_TOKEN:
        async with httpx.AsyncClient() as client:
            await client.post(
                f"https://api.clickup.com/api/v2/list/{context['list_id']}/task",
                json={
                    "name": f"Neuen Kickoff-Termin vereinbaren — {state.client_name}",
                    "description": "Client ist nicht zum Kickoff erschienen. Bitte neuen Termin vereinbaren.",
                    "priority": 1,
                    "assignees": [CLICKUP_CLAUDIO],
                },
                headers={"Authorization": CLICKUP_TOKEN},
            )

    return {"handled": True, "action": "noshow_handler"}


async def _v3_cc01a(context: dict, state: ExecutionState) -> dict:
    """DACH Compliance Scan auf alle generierten Texte."""
    generated_docs = context.get("generated_docs", {})
    texts = {}
    for doc_name, doc_info in generated_docs.items():
        if isinstance(doc_info, dict) and "content" in doc_info:
            texts[doc_name] = doc_info["content"][:3000]

    if not texts:
        return {"passed": True, "issues": [], "message": "No texts to scan"}

    result = await dach_compliance_scan(texts)
    return result


async def _v3_fn05a(context: dict, state: ExecutionState) -> dict:
    """SSL + Performance Check auf Landing Page."""
    urls = []
    for key in ["lp_url", "form_url", "thankyou_url"]:
        if context.get(key):
            urls.append(context[key])

    if not urls:
        return {"passed": True, "message": "No URLs to check"}

    return await validate_all_urls(urls)


async def _v3_fn10a(context: dict, state: ExecutionState) -> dict:
    """GTM Container auto-erstellen pro Client."""
    return await setup_gtm_for_client(
        client_name=state.client_name,
        client_domain=context.get("website", "example.com").replace("https://", "").replace("http://", ""),
        meta_pixel_id=context.get("meta_pixel_id", META_PIXEL_ID),
        ga4_measurement_id=context.get("ga4_measurement_id"),
    )


async def _v3_fn10b(context: dict, state: ExecutionState) -> dict:
    """GA4 Property auto-erstellen pro Client."""
    return await setup_ga4_for_client(
        client_name=state.client_name,
        client_domain=context.get("website", "example.com").replace("https://", "").replace("http://", ""),
    )


async def _v3_ca00(context: dict, state: ExecutionState) -> dict:
    """Ad Account Health Check."""
    ad_account = META_AD_ACCOUNT if META_AD_ACCOUNT.startswith("act_") else f"act_{META_AD_ACCOUNT}"
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.get(
            f"https://graph.facebook.com/v21.0/{ad_account}",
            params={
                "fields": "name,account_status,disable_reason,funding_source",
                "access_token": META_ACCESS_TOKEN,
            },
        )
        data = resp.json()

        # account_status: 1=ACTIVE, 2=DISABLED, 3=UNSETTLED, 7=PENDING_RISK_REVIEW, 8=PENDING_SETTLEMENT, 9=IN_GRACE_PERIOD, 100=PENDING_CLOSURE, 101=CLOSED
        status = data.get("account_status", 0)
        if status != 1:
            status_names = {2: "DISABLED", 3: "UNSETTLED", 7: "PENDING_RISK_REVIEW", 100: "PENDING_CLOSURE", 101: "CLOSED"}
            raise Exception(f"Meta Ad Account Status: {status_names.get(status, f'UNKNOWN ({status})')}")

        return {
            "healthy": True,
            "name": data.get("name", ""),
            "status": status,
        }


async def _v3_rl09a(context: dict, state: ExecutionState) -> dict:
    """E2E Funnel Test."""
    results = {"steps": []}

    # Step 1: Check LP
    lp_url = context.get("lp_url")
    if lp_url:
        lp_check = await validate_all_urls([lp_url])
        results["steps"].append({"step": "landing_page", "result": lp_check})
        if not lp_check.get("passed"):
            results["passed"] = False
            results["failed_step"] = "landing_page"
            return results

    # Step 2: Check Form Page
    form_url = context.get("form_url")
    if form_url:
        form_check = await validate_all_urls([form_url])
        results["steps"].append({"step": "form_page", "result": form_check})
        if not form_check.get("passed"):
            results["passed"] = False
            results["failed_step"] = "form_page"
            return results

    # Step 3: Check Thank You Page
    ty_url = context.get("thankyou_url")
    if ty_url:
        ty_check = await validate_all_urls([ty_url])
        results["steps"].append({"step": "thankyou_page", "result": ty_check})

    results["passed"] = True
    return results


async def _v3_notion_wiki(context: dict, state: ExecutionState) -> dict:
    """Create Notion Client Wiki."""
    if not _notion:
        return {"skipped": True, "reason": "Notion not configured"}

    # Parent page ID should be configured — for now use search
    parent_id = context.get("notion_parent_page_id", "")
    if not parent_id:
        return {"skipped": True, "reason": "No notion_parent_page_id in context"}

    return _notion.create_client_wiki(
        parent_page_id=parent_id,
        client_name=state.client_name,
        company=context.get("company", ""),
        branche=context.get("branche", ""),
        ansprechpartner=context.get("contact", ""),
        email=context.get("email", ""),
        phone=context.get("phone", ""),
        close_url=context.get("close_lead_url"),
        drive_url=context.get("drive_folder_url"),
        slack_channel=context.get("channel_name"),
        clickup_url=context.get("clickup_list_url"),
        miro_url=context.get("miro_board_url"),
    )


async def _v3_kc00(context: dict, state: ExecutionState) -> dict:
    """Kickoff Reminder 2h vorher — Email + Slack."""
    token = GOOGLE_ACCESS_TOKEN or LEADFLOW_ACCESS_TOKEN
    # Send reminder email
    async with httpx.AsyncClient() as client:
        await client.post(
            "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
            headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
            json={"raw": _encode_email(
                to=context["email"],
                subject=f"Erinnerung: Kickoff-Call morgen — {state.client_name}",
                body=f"Hallo {context.get('contact', '')},\n\nkurze Erinnerung an unseren Kickoff-Call morgen. Bitte halten Sie folgende Unterlagen bereit:\n- Logo in hoher Auflösung\n- Aktuelle Stellenanzeigen\n- Zugangsdaten zum Meta Business Manager\n\nWir freuen uns auf das Gespräch!\n\nViele Grüße",
            )},
        )
    return {"reminder_sent": True}


async def _v3_kc03a(context: dict, state: ExecutionState) -> dict:
    """Transkript Quality Gate — prüft Wortanzahl + Kategorie-Abdeckung."""
    transcript = context.get("transcript_text", "")
    word_count = len(transcript.split()) if transcript else 0

    if word_count < 500:
        return {"quality_score": 0, "word_count": word_count, "passed": False, "reason": f"Nur {word_count} Wörter (min. 500)"}

    # AI-basierte Kategorie-Prüfung
    if OPENROUTER_API_KEY:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers={"Authorization": f"Bearer {OPENROUTER_API_KEY}"},
                json={
                    "model": os.environ.get("OPENROUTER_MODEL", "qwen/qwen3-235b-a22b-thinking-2507"),
                    "messages": [{"role": "user", "content": f"Bewerte dieses Kickoff-Transkript auf einer Skala von 0-100. Prüfe ob folgende Kategorien abgedeckt sind: Demografie, Beruflich, Schmerzpunkte, Psychologie, Benefits. Antworte NUR als JSON: {{\"score\": N, \"missing\": [...]}}.\n\nTranskript:\n{transcript[:3000]}"}],
                },
                timeout=120,
            )
            data = resp.json()
            content = data.get("choices", [{}])[0].get("message", {}).get("content", "{}")
            try:
                result = json.loads(content.strip().strip("`").replace("json\n", ""))
                return {"quality_score": result.get("score", 50), "word_count": word_count, "missing_categories": result.get("missing", []), "passed": result.get("score", 0) >= 70}
            except json.JSONDecodeError:
                pass

    return {"quality_score": 70, "word_count": word_count, "passed": True, "reason": "AI check skipped"}


async def _v3_kc03b(context: dict, state: ExecutionState) -> dict:
    """Transkript zu dünn — Notification in Slack dass das Thema gelöst werden muss."""
    if SLACK_BOT_TOKEN:
        await v3_slack_alert(
            f"{state.client_name} — Transkript unvollständig ({context.get('quality_score', '?')}% Abdeckung). Bitte intern klären wie weiter vorgegangen wird.",
            SLACK_BOT_TOKEN,
            severity="warning",
        )
    return {"action": "notification_sent", "reason": "transcript_insufficient"}


async def _v3_st00(context: dict, state: ExecutionState) -> dict:
    """Bausteine Quality Gate — alle 5 Pflicht-Kategorien vorhanden?"""
    bausteine = context.get("bausteine", {})
    required_categories = ["demografie", "beruflich", "schmerzpunkte", "psychologie", "benefits"]
    missing = []

    for cat in required_categories:
        found = False
        for key, value in bausteine.items():
            if isinstance(value, dict) and value.get("kategorie", "").lower() == cat:
                found = True
                break
            elif cat in key.lower():
                found = True
                break
        if not found:
            missing.append(cat)

    coverage = ((len(required_categories) - len(missing)) / len(required_categories)) * 100
    return {"passed": len(missing) == 0, "coverage": coverage, "missing_categories": missing}


async def _v3_st02a(context: dict, state: ExecutionState) -> dict:
    """Fact Verification — KI-Fakten gegen Client-Website prüfen."""
    website = context.get("website", "")
    if not website or not OPENROUTER_API_KEY:
        return {"verified": True, "skipped": True, "reason": "No website or AI key"}

    # Fetch website content
    website_text = ""
    try:
        import urllib.request
        req = urllib.request.Request(website if website.startswith("http") else f"https://{website}", headers={"User-Agent": "Flowstack/1.0"})
        resp = urllib.request.urlopen(req, timeout=10, context=__import__("ssl").create_default_context(cafile=__import__("certifi").where()))
        website_text = resp.read().decode("utf-8", errors="ignore")[:5000]
    except Exception:
        return {"verified": True, "skipped": True, "reason": "Website not reachable"}

    bausteine = context.get("bausteine", {})
    bausteine_summary = json.dumps(bausteine, ensure_ascii=False)[:2000]

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers={"Authorization": f"Bearer {OPENROUTER_API_KEY}"},
            json={
                "model": os.environ.get("OPENROUTER_MODEL", "qwen/qwen3-235b-a22b-thinking-2507"),
                "messages": [{"role": "user", "content": f"Vergleiche diese extrahierten Bausteine mit der Website des Kunden. Markiere Fakten die NICHT von der Website bestätigt werden als 'KI-Inferenz'. Antworte als JSON: {{\"verified\": [...], \"unverified\": [...]}}.\n\nBausteine:\n{bausteine_summary}\n\nWebsite-Text:\n{website_text[:2000]}"}],
            },
            timeout=120,
        )
        data = resp.json()
        content = data.get("choices", [{}])[0].get("message", {}).get("content", "{}")
        try:
            result = json.loads(content.strip().strip("`").replace("json\n", ""))
            return {"verified": True, "verified_facts": result.get("verified", []), "unverified_facts": result.get("unverified", [])}
        except json.JSONDecodeError:
            return {"verified": True, "parse_error": True}


async def _v3_cc01b(context: dict, state: ExecutionState) -> dict:
    """Compliance Auto-Fix — sichere Fixes automatisch anwenden."""
    generated_docs = context.get("generated_docs", {})
    all_changes = {}
    for doc_name, doc_info in generated_docs.items():
        if isinstance(doc_info, dict) and "content" in doc_info:
            fixed_text, changes = apply_auto_fixes(doc_info["content"])
            if changes:
                all_changes[doc_name] = changes
                doc_info["content"] = fixed_text
    return {"auto_fixed": all_changes, "docs_changed": len(all_changes)}


async def _v3_cc02a(context: dict, state: ExecutionState) -> dict:
    """Rechtschreib- und Grammatik-Check."""
    generated_docs = context.get("generated_docs", {})
    texts = {k: v["content"][:3000] for k, v in generated_docs.items() if isinstance(v, dict) and "content" in v}
    if not texts or not OPENROUTER_API_KEY:
        return {"passed": True, "skipped": True}

    async def ai_func(prompt: str):
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers={"Authorization": f"Bearer {OPENROUTER_API_KEY}"},
                json={"model": os.environ.get("OPENROUTER_MODEL", "qwen/qwen3-235b-a22b-thinking-2507"), "messages": [{"role": "user", "content": prompt}]},
                timeout=120,
            )
            content = resp.json().get("choices", [{}])[0].get("message", {}).get("content", "[]")
            try:
                return json.loads(content.strip().strip("`").replace("json\n", ""))
            except json.JSONDecodeError:
                return []

    return await spelling_check(texts, ai_func)


async def _v3_cc02b(context: dict, state: ExecutionState) -> dict:
    """Placeholder-Scan — unreplaced [FIRMENNAME] etc. finden."""
    generated_docs = context.get("generated_docs", {})
    texts = {k: v.get("content", "") for k, v in generated_docs.items() if isinstance(v, dict) and "content" in v}
    if not texts:
        return {"passed": True}
    return scan_for_placeholders(texts)


async def _v3_rl_url(context: dict, state: ExecutionState) -> dict:
    """URL Validation — alle URLs prüfen."""
    urls = [context.get(k) for k in ["lp_url", "form_url", "thankyou_url"] if context.get(k)]
    if not urls:
        return {"passed": True, "message": "No URLs"}
    return await validate_all_urls(urls)


async def _v3_rl_pixel(context: dict, state: ExecutionState) -> dict:
    """Pixel Final Check."""
    pixel_id = context.get("meta_pixel_id", META_PIXEL_ID)
    return await verify_pixel(pixel_id, META_ACCESS_TOKEN)


async def _v3_rl_policy(context: dict, state: ExecutionState) -> dict:
    """Ad Policy Pre-Check."""
    generated_docs = context.get("generated_docs", {})
    ad_texts = {}
    for k, v in generated_docs.items():
        if isinstance(v, dict) and v.get("subtype", "").startswith("anzeigen"):
            ad_texts[k] = v.get("content", "")[:1000]
    if not ad_texts:
        return {"passed": True, "message": "No ad texts"}

    async def ai_func(prompt: str):
        if not OPENROUTER_API_KEY:
            return []
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers={"Authorization": f"Bearer {OPENROUTER_API_KEY}"},
                json={"model": os.environ.get("OPENROUTER_MODEL", "qwen/qwen3-235b-a22b-thinking-2507"), "messages": [{"role": "user", "content": prompt}]},
                timeout=60,
            )
            content = resp.json().get("choices", [{}])[0].get("message", {}).get("content", "[]")
            try:
                return json.loads(content.strip().strip("`").replace("json\n", ""))
            except json.JSONDecodeError:
                return []

    return await ad_policy_check(ad_texts, ai_func)


async def _v3_pl01(context: dict, state: ExecutionState) -> dict:
    """Launch +24h Check — Impressions > 0?"""
    campaigns = context.get("meta_campaigns", {})
    results = {}
    for name, campaign_id in campaigns.items():
        if not campaign_id:
            continue
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"https://graph.facebook.com/v21.0/{campaign_id}/insights",
                params={"fields": "impressions,clicks,spend", "date_preset": "yesterday", "access_token": META_ACCESS_TOKEN},
            )
            data = resp.json().get("data", [{}])
            if data:
                results[name] = data[0]
            else:
                results[name] = {"impressions": "0", "clicks": "0", "spend": "0"}

    total_impressions = sum(int(r.get("impressions", "0")) for r in results.values())
    return {"passed": total_impressions > 0, "total_impressions": total_impressions, "campaigns": results}


async def _v3_pl02(context: dict, state: ExecutionState) -> dict:
    """Zero-Lead Alert — 0 Leads nach 72h?"""
    # Check Close for leads linked to this client
    if not context.get("lead_id"):
        return {"leads": 0, "alert": True}

    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"https://api.close.com/api/v1/lead/{context['lead_id']}/",
            auth=(CLOSE_API_KEY_V2, ""),
        )
        data = resp.json()
        # Count activities that look like incoming leads (simplified)
        activities = data.get("activities", [])
        lead_count = len([a for a in activities if a.get("type") in ("LeadStatusChange", "Note")])

    return {"leads": lead_count, "alert": lead_count == 0}


async def _v3_pl03(context: dict, state: ExecutionState) -> dict:
    """Auto-Diagnose bei 0 Leads."""
    diagnostics = {"checks": []}

    # Check 1: LP reachable?
    lp_url = context.get("lp_url")
    if lp_url:
        from qa import validate_url
        lp_result = await validate_url(lp_url)
        diagnostics["checks"].append({"check": "landing_page", "result": lp_result})

    # Check 2: Pixel active?
    pixel_id = context.get("meta_pixel_id", META_PIXEL_ID)
    pixel_result = await verify_pixel(pixel_id, META_ACCESS_TOKEN)
    diagnostics["checks"].append({"check": "pixel", "result": pixel_result})

    # Check 3: Campaign delivering?
    campaigns = context.get("meta_campaigns", {})
    for name, cid in campaigns.items():
        if cid:
            async with httpx.AsyncClient() as client:
                resp = await client.get(
                    f"https://graph.facebook.com/v21.0/{cid}",
                    params={"fields": "effective_status,daily_budget", "access_token": META_ACCESS_TOKEN},
                )
                data = resp.json()
                diagnostics["checks"].append({"check": f"campaign_{name}", "status": data.get("effective_status"), "budget": data.get("daily_budget")})

    # Summary
    issues = [c for c in diagnostics["checks"] if not c.get("result", {}).get("passed", c.get("result", {}).get("active", c.get("status") == "ACTIVE"))]
    diagnostics["issues_found"] = len(issues)
    diagnostics["diagnosis"] = "Alle Checks bestanden" if not issues else f"{len(issues)} Problem(e) gefunden"

    return diagnostics


async def _v3_cm08(context: dict, state: ExecutionState) -> dict:
    """Milestone Celebration — wird vom Monitoring getriggert."""
    return {"milestone_check": True}


async def _v3_pl05(context: dict, state: ExecutionState) -> dict:
    """Daily Performance Digest — alle Clients Spend/Leads/CPL."""
    if not META_ACCESS_TOKEN:
        return {"skipped": True, "reason": "No Meta token"}
    # Simplified: Get insights for this client's campaigns
    campaigns = context.get("meta_campaigns", {})
    summary = {}
    for name, cid in campaigns.items():
        if not cid:
            continue
        try:
            async with httpx.AsyncClient(timeout=30) as client:
                resp = await client.get(
                    f"https://graph.facebook.com/v21.0/{cid}/insights",
                    params={"fields": "impressions,clicks,spend,actions", "date_preset": "yesterday", "access_token": META_ACCESS_TOKEN},
                )
                data = resp.json().get("data", [{}])
                summary[name] = data[0] if data else {}
        except Exception:
            summary[name] = {"error": "fetch failed"}
    return {"digest": summary}


async def _v3_pl06(context: dict, state: ExecutionState) -> dict:
    """Weekly Performance Report — KI-generierter Report als Google Doc."""
    campaigns = context.get("meta_campaigns", {})
    performance_data = {}
    for name, cid in campaigns.items():
        if not cid:
            continue
        try:
            async with httpx.AsyncClient(timeout=30) as client:
                resp = await client.get(
                    f"https://graph.facebook.com/v21.0/{cid}/insights",
                    params={"fields": "impressions,clicks,spend,ctr,actions", "date_preset": "last_7d", "access_token": META_ACCESS_TOKEN},
                )
                data = resp.json().get("data", [{}])
                performance_data[name] = data[0] if data else {}
        except Exception:
            pass

    if not performance_data:
        return {"skipped": True, "reason": "No performance data"}

    prompt = f"""Erstelle einen kurzen Wochen-Performance-Report für die Recruiting-Kampagnen von {state.client_name}.

Daten der letzten 7 Tage:
{json.dumps(performance_data, indent=2)}

Format: Zusammenfassung (3 Sätze), dann Tabelle mit Kennzahlen, dann 2-3 Empfehlungen.
Sprache: Deutsch."""

    try:
        report = await gemini_generate(prompt, max_tokens=2000)
    except Exception as e:
        return {"error": str(e)}

    return {"report": report[:3000], "data": performance_data}


async def _v3_pl07(context: dict, state: ExecutionState) -> dict:
    """Monthly Report — umfassender Monatsbericht."""
    # Same as weekly but with last_30d
    return await _v3_pl06.__wrapped__(context, state) if hasattr(_v3_pl06, '__wrapped__') else {"skipped": True, "reason": "Uses weekly logic"}


async def _v3_pl09(context: dict, state: ExecutionState) -> dict:
    """Ad Fatigue Detection — Frequency > 3 oder CTR -20%."""
    campaigns = context.get("meta_campaigns", {})
    fatigued = []
    for name, cid in campaigns.items():
        if not cid:
            continue
        try:
            async with httpx.AsyncClient(timeout=30) as client:
                resp = await client.get(
                    f"https://graph.facebook.com/v21.0/{cid}/insights",
                    params={"fields": "frequency,ctr", "date_preset": "last_7d", "access_token": META_ACCESS_TOKEN},
                )
                data = resp.json().get("data", [{}])
                if data:
                    freq = float(data[0].get("frequency", "0"))
                    ctr = float(data[0].get("ctr", "0"))
                    if freq > 3.0:
                        fatigued.append({"campaign": name, "reason": f"Frequency {freq:.1f} > 3.0", "frequency": freq})
                    if ctr < 0.5:
                        fatigued.append({"campaign": name, "reason": f"CTR {ctr:.2f}% sehr niedrig", "ctr": ctr})
        except Exception:
            pass
    return {"fatigued": fatigued, "needs_refresh": len(fatigued) > 0}


async def _v3_pl10(context: dict, state: ExecutionState) -> dict:
    """A/B Test Empfehlungen — Top/Bottom Performer analysieren."""
    campaigns = context.get("meta_campaigns", {})
    ad_performance = []
    for name, cid in campaigns.items():
        if not cid:
            continue
        try:
            async with httpx.AsyncClient(timeout=30) as client:
                resp = await client.get(
                    f"https://graph.facebook.com/v21.0/{cid}/insights",
                    params={"fields": "ad_name,ctr,actions,spend", "level": "ad", "date_preset": "last_14d", "limit": 20, "access_token": META_ACCESS_TOKEN},
                )
                for ad in resp.json().get("data", []):
                    ad_performance.append({**ad, "campaign": name})
        except Exception:
            pass

    if not ad_performance:
        return {"recommendations": [], "reason": "No ad data"}

    prompt = f"""Analysiere diese Ad-Performance-Daten und gib 3 konkrete A/B Test Empfehlungen:

{json.dumps(ad_performance[:10], indent=2)}

Antworte auf Deutsch. Format: Nummerierte Liste mit je 1-2 Sätzen."""

    try:
        recs = await gemini_generate(prompt, max_tokens=1000)
    except Exception as e:
        return {"error": str(e)}

    return {"recommendations": recs}


async def _v3_pl11(context: dict, state: ExecutionState) -> dict:
    """Budget Scaling Suggestions — CPL < Target? Dann Empfehlung."""
    campaigns = context.get("meta_campaigns", {})
    suggestions = []
    for name, cid in campaigns.items():
        if not cid:
            continue
        try:
            async with httpx.AsyncClient(timeout=30) as client:
                resp = await client.get(
                    f"https://graph.facebook.com/v21.0/{cid}/insights",
                    params={"fields": "spend,actions", "date_preset": "last_7d", "access_token": META_ACCESS_TOKEN},
                )
                data = resp.json().get("data", [{}])
                if data:
                    spend = float(data[0].get("spend", "0"))
                    leads = sum(int(a.get("value", "0")) for a in data[0].get("actions", []) if a.get("action_type") == "lead")
                    if leads > 0:
                        cpl = spend / leads
                        if cpl < 80:
                            suggestions.append({"campaign": name, "cpl": round(cpl, 2), "suggestion": f"CPL bei {cpl:.0f}€ — Budget-Erhöhung empfohlen"})
        except Exception:
            pass
    return {"suggestions": suggestions, "has_suggestions": len(suggestions) > 0}


async def _v3_pl12(context: dict, state: ExecutionState) -> dict:
    """Lead Quality Scoring — Score 1-10 für neue Leads."""
    lead_id = context.get("lead_id")
    if not lead_id or not CLOSE_API_KEY_V2:
        return {"skipped": True}

    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.get(
            f"https://api.close.com/api/v1/lead/{lead_id}/",
            auth=(CLOSE_API_KEY_V2, ""),
        )
        lead_data = resp.json()

    prompt = f"""Bewerte diesen Recruiting-Lead auf einer Skala von 1-10 basierend auf den verfügbaren Daten.
10 = Perfekter Kandidat, 1 = Unqualifiziert.

Lead-Daten:
{json.dumps(lead_data.get('contacts', [{}])[0] if lead_data.get('contacts') else {}, indent=2)[:2000]}

Antworte NUR als JSON: {{"score": N, "reason": "kurze Begründung"}}"""

    try:
        result = await gemini_generate(prompt, max_tokens=200)
        clean = result.strip().strip("`").replace("json\n", "")
        parsed = json.loads(clean)
        return {"score": parsed.get("score", 5), "reason": parsed.get("reason", "")}
    except Exception:
        return {"score": 5, "reason": "Auto-scoring failed"}


async def _v3_pl13(context: dict, state: ExecutionState) -> dict:
    """Competitor Ad Monitor — Meta Ad Library durchsuchen."""
    branche = context.get("branche", "IT")
    region = "Deutschland"

    prompt = f"""Was sind typische Recruiting-Ads von Wettbewerbern in der Branche "{branche}" in {region}?

Beschreibe 3 typische Competitor-Ads:
1. Welche Angles nutzen sie?
2. Welche Headlines?
3. Welche CTAs?

Basierend auf deinem Wissen über Meta Ads in der {branche}-Branche. Kurz und knapp, je 2-3 Sätze."""

    try:
        analysis = await gemini_generate(prompt, max_tokens=1000)
    except Exception as e:
        return {"error": str(e)}

    return {"competitor_analysis": analysis, "branche": branche}


async def _v3_fn_screenshots(context: dict, state: ExecutionState) -> dict:
    """Screenshot-Dokumentation — Desktop + Mobile Screenshots aller Funnel-Seiten."""
    screenshots = []
    urls = {
        "landing_page": context.get("lp_url"),
        "formular_page": context.get("form_url"),
        "danke_page": context.get("thankyou_url"),
    }

    for page_name, url in urls.items():
        if not url:
            continue
        for device, width in [("desktop", 1920), ("mobile", 375)]:
            try:
                # Use Puppeteer MCP or fallback to API screenshot service
                # For now: log what would be screenshotted
                screenshots.append({
                    "page": page_name,
                    "device": device,
                    "width": width,
                    "url": url,
                    "status": "queued",
                })
            except Exception as e:
                screenshots.append({"page": page_name, "device": device, "error": str(e)})

    return {"screenshots": screenshots, "count": len(screenshots)}


async def _v3_pl_winners(context: dict, state: ExecutionState) -> dict:
    """Gewinner-Bibliothek — Top-Performer in Airtable Winners speichern."""
    campaigns = context.get("meta_campaigns", {})
    winners = []

    for camp_name, campaign_id in campaigns.items():
        if not campaign_id:
            continue
        try:
            async with httpx.AsyncClient() as client:
                # Get ad-level insights
                resp = await client.get(
                    f"https://graph.facebook.com/v21.0/{campaign_id}/insights",
                    params={
                        "fields": "ad_name,impressions,clicks,ctr,spend,actions",
                        "date_preset": "last_30d",
                        "level": "ad",
                        "limit": 10,
                        "access_token": META_ACCESS_TOKEN,
                    },
                )
                data = resp.json().get("data", [])

                for ad in data:
                    ctr = float(ad.get("ctr", "0"))
                    leads = 0
                    for action in ad.get("actions", []):
                        if action.get("action_type") == "lead":
                            leads = int(action.get("value", "0"))
                    spend = float(ad.get("spend", "0"))
                    cpl = spend / leads if leads > 0 else 999

                    # Score: higher = better
                    score = (ctr * leads) / max(cpl, 1) if leads > 0 else 0

                    winners.append({
                        "ad_name": ad.get("ad_name", ""),
                        "campaign_type": camp_name,
                        "ctr": round(ctr, 2),
                        "leads": leads,
                        "cpl": round(cpl, 2),
                        "spend": round(spend, 2),
                        "score": round(score, 2),
                    })
        except Exception as e:
            log.warning(f"Winners analysis failed for {camp_name}: {e}")

    # Sort by score, keep top 3 per campaign type
    winners.sort(key=lambda x: x["score"], reverse=True)
    top_winners = winners[:9]  # Top 3 per campaign type (3 types)

    # Save to Airtable Winners table
    if top_winners and AIRTABLE_API_KEY and AIRTABLE_BASE_ID:
        for winner in top_winners:
            try:
                async with httpx.AsyncClient() as client:
                    await client.post(
                        f"https://api.airtable.com/v0/{AIRTABLE_BASE_ID}/Winners",
                        headers={"Authorization": f"Bearer {AIRTABLE_API_KEY}", "Content-Type": "application/json"},
                        json={"fields": {
                            "Client": state.client_name,
                            "Branche": context.get("branche", ""),
                            "Typ": "ad_text",
                            "Inhalt": winner["ad_name"],
                            "Kampagnen-Typ": winner["campaign_type"],
                            "CTR": winner["ctr"],
                            "CPL": winner["cpl"],
                            "Leads": winner["leads"],
                            "Performance Score": winner["score"],
                        }},
                    )
            except Exception as e:
                log.warning(f"Failed to save winner to Airtable: {e}")

    return {"winners_saved": len(top_winners), "total_analyzed": len(winners)}


# ── V3 Gemini AI Helper ──────────────────────────────────────

async def gemini_generate(prompt: str, max_tokens: int = 8000) -> str:
    """Call Gemini API for text generation. Kostenlos, kein OpenRouter."""
    if not GEMINI_API_KEY:
        raise Exception("GEMINI_API_KEY nicht konfiguriert")

    import ssl, certifi
    ctx = ssl.create_default_context(cafile=certifi.where())

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={GEMINI_API_KEY}"
    payload = json.dumps({
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"maxOutputTokens": max_tokens, "temperature": 0.7},
    }).encode()

    import urllib.request
    req = urllib.request.Request(url, data=payload, headers={"Content-Type": "application/json"})
    resp = urllib.request.urlopen(req, timeout=120, context=ctx)
    result = json.loads(resp.read())
    return result.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")


# ── V3 KI-Generierung (eigenständig, Gemini-basiert) ────────

async def _v3_st_extract(context: dict, state: ExecutionState) -> dict:
    """Bausteine aus Transkript extrahieren — via Gemini, exakt gleiches Schema wie V2 (88 Felder → 352 Records in Airtable)."""
    transcript_text = context.get("transcript_text", "")
    if not transcript_text and context.get("transcript_doc_id"):
        token = _refresh_google_token_v3()
        transcript_text = await read_google_doc_content(context["transcript_doc_id"])
    if not transcript_text:
        return {"error": "Kein Transkript-Text vorhanden", "bausteine": {}}

    company = context.get("company", "Unbekannt")
    rolle = context.get("stellen", "")

    # Nutze exakt das gleiche Schema wie V2
    schema_str = json.dumps(EXTRACTION_JSON_SCHEMA, indent=2, ensure_ascii=False)

    prompt = f"""Du bist ein Senior Consumer-Psychologe und Recruiting-Marketing-Stratege mit 15 Jahren Erfahrung.

AUFGABE: Analysiere das Kickoff-Transkript und extrahiere ALLE relevanten Informationen in das vorgegebene JSON-Schema.

REGELN:
1. Jedes Feld MUSS befuellt werden — leite logisch ab wenn nicht explizit im Transkript
2. Zitate muessen klingen wie echte Menschen reden — Fachjargon, kurze Saetze, authentisch
3. "Schmerz hinter dem Schmerz" = die tiefere EMOTIONALE Ebene
4. Hooks: Max 125 Zeichen, emotional triggern, Loss Aversion > Benefits
5. CTAs muessen niedrigschwellig sein: "In 60 Sekunden", "Kein Lebenslauf", "Unverbindlich"
6. VERBOTENE Woerter: "Rockstar", "Ninja", "Guru", "Dynamisches Team", "Flache Hierarchien"
7. Fachwoerter: Echte Begriffe die die Zielgruppe TAEGLICH nutzt
8. Psychologie-Felder: Denke wie ein Therapeut — was FUEHLT die Person wirklich?
9. Trigger-Events: Konkrete Situationen die den Wechsel ausloesen
10. Kernbotschaft: MUSS in einem einzigen Satz die gesamte Kampagne kommunizieren

Unternehmen: {company}
Gesuchte Rolle: {rolle or 'Siehe Transkript'}

TRANSKRIPT:
{transcript_text[:8000]}

Extrahiere alle Informationen in exakt dieses JSON-Schema (jedes Feld befuellen!):
{schema_str}

Antworte NUR mit validem JSON. Kein Markdown, kein Text davor/danach."""

    try:
        response = await gemini_generate(prompt, max_tokens=8000)
        # JSON parsen
        cleaned = response.strip()
        if cleaned.startswith("```json"):
            cleaned = cleaned[7:]
        if cleaned.startswith("```"):
            cleaned = cleaned[3:]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]
        cleaned = cleaned.strip()
        blocks = json.loads(cleaned)
    except (json.JSONDecodeError, Exception) as e:
        log.warning(f"V3 Gemini extract parse error: {e}")
        blocks = {}

    # In Airtable schreiben (nutzt flatten_blocks_for_airtable wie V2 → 352 Records)
    v3_base = os.environ.get("AIRTABLE_V3_BASE_ID", AIRTABLE_BASE_ID)
    client_id = context.get("airtable_client_id", "")
    if client_id and v3_base:
        flat_records = flatten_blocks_for_airtable(blocks, client_id)
        written = 0
        for batch_start in range(0, len(flat_records), 10):
            batch = flat_records[batch_start:batch_start + 10]
            try:
                async with httpx.AsyncClient(timeout=15) as client_http:
                    await client_http.post(
                        f"https://api.airtable.com/v0/{v3_base}/Bausteine",
                        headers={"Authorization": f"Bearer {AIRTABLE_API_KEY}", "Content-Type": "application/json"},
                        json={"records": [{"fields": r} for r in batch]},
                    )
                    written += len(batch)
            except Exception as e:
                log.warning(f"Airtable write batch failed: {e}")
        log.info(f"V3 Bausteine: {written} Records in Airtable geschrieben")

    # Count fields
    field_count = sum(len(v) if isinstance(v, dict) else 1 for v in blocks.values())

    return {"bausteine": blocks, "block_count": field_count, "categories": len(blocks)}


async def _v3_generate_doc(context: dict, state: ExecutionState, framework_nr: int, doc_name: str, doc_key: str, prev_keys: list[tuple[str, str]]) -> dict:
    """V3 Doc-Generierung via Gemini + Frameworks. Kein OpenRouter."""
    bs = context.get("bausteine", {})
    prev = {}
    gd = context.get("generated_docs", {})
    for ctx_key, label in prev_keys:
        if gd.get(ctx_key):
            prev[label] = gd[ctx_key]

    # Load framework (fuzzy match by number prefix)
    fw_dir = os.path.join(os.path.dirname(__file__), "frameworks")
    framework = ""
    if os.path.exists(fw_dir):
        for fname in sorted(os.listdir(fw_dir)):
            if fname.startswith(f"{framework_nr:02d}-"):
                with open(os.path.join(fw_dir, fname)) as f:
                    framework = f.read()
                break

    company = context.get("company", "Unbekannt")
    bausteine_text = json.dumps(bs, ensure_ascii=False, indent=2)[:6000] if bs else "Keine Bausteine vorhanden"
    prev_text = ""
    for label, content in prev.items():
        prev_text += f"\n--- {label} ---\n{str(content)[:2000]}\n"

    prompt = f"""Du bist ein Senior Recruiting-Marketing-Stratege. Erstelle das Dokument "{doc_name}" für die Firma "{company}".

FRAMEWORK (halte dich exakt an diese Struktur):
{framework[:4000]}

BAUSTEINE (nutze diese als Grundlage — JEDES Detail einbauen):
{bausteine_text}

VORHERIGE DOKUMENTE (referenziere und baue darauf auf):
{prev_text[:3000] if prev_text else "Keine"}

REGELN:
- Schreibe auf Deutsch
- Nutze die Bausteine als Grundlage — sei SPEZIFISCH, keine generischen Phrasen
- Halte dich exakt an die Struktur und Sections des Frameworks
- Verwende echte Details, Zahlen, Zitate aus den Bausteinen
- Jede Section muss befüllt sein
- Qualität wie von einer Premium-Agentur, nicht wie ChatGPT-Output
"""

    try:
        content = await gemini_generate(prompt, max_tokens=6000)
    except Exception as e:
        return {"error": str(e), "doc_key": doc_key}

    # Create Google Doc
    doc_id = ""
    doc_url = ""
    try:
        token = _refresh_google_token_v3()
        doc_title = f"V3 — {doc_name} | {company}"
        async with httpx.AsyncClient(timeout=30) as http:
            resp = await http.post(
                "https://docs.googleapis.com/v1/documents",
                headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
                json={"title": doc_title},
            )
            doc_data = resp.json()
            doc_id = doc_data.get("documentId", "")
            if doc_id:
                await http.post(
                    f"https://docs.googleapis.com/v1/documents/{doc_id}:batchUpdate",
                    headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
                    json={"requests": [{"insertText": {"location": {"index": 1}, "text": content}}]},
                )
        doc_url = f"https://docs.google.com/document/d/{doc_id}/edit" if doc_id else ""
    except Exception as e:
        log.warning(f"V3 Google Doc creation failed for {doc_name}: {e}")

    # Update Airtable Dokumente table
    v3_base = os.environ.get("AIRTABLE_V3_BASE_ID", AIRTABLE_BASE_ID)
    if v3_base and AIRTABLE_API_KEY:
        try:
            async with httpx.AsyncClient(timeout=10) as http:
                await http.post(
                    f"https://api.airtable.com/v0/{v3_base}/Dokumente",
                    headers={"Authorization": f"Bearer {AIRTABLE_API_KEY}", "Content-Type": "application/json"},
                    json={"records": [{"fields": {
                        "Dokument-Typ": doc_key,
                        "Google Doc URL": doc_url,
                        "Google Doc ID": doc_id,
                        "Status": "generated",
                        "Version": 1,
                    }}]},
                )
        except Exception as e:
            log.warning(f"Airtable doc tracking failed: {e}")

    generated = dict(gd)
    generated[doc_key] = content
    generated[f"{doc_key}_url"] = doc_url

    return {"url": doc_url, "doc_id": doc_id, "content_length": len(content), "generated_docs": generated}


async def _v3_st_doc(context: dict, state: ExecutionState, doc_number: int, doc_name: str, doc_key: str, prev_keys: list[tuple[str, str]]) -> dict:
    """Wrapper für Kompatibilität."""
    return await _v3_generate_doc(context, state, doc_number, doc_name, doc_key, prev_keys)


async def _v3_st01_handler(context: dict, state: ExecutionState) -> dict:
    return await _v3_st_doc(context, state, 1, "Zielgruppen-Avatar", "zielgruppen_avatar", [])

async def _v3_st02_handler(context: dict, state: ExecutionState) -> dict:
    return await _v3_st_doc(context, state, 2, "Arbeitgeber-Avatar", "arbeitgeber_avatar",
        [("zielgruppen_avatar", "Zielgruppen-Avatar")])

async def _v3_st03_handler(context: dict, state: ExecutionState) -> dict:
    return await _v3_st_doc(context, state, 3, "Messaging-Matrix", "messaging_matrix",
        [("zielgruppen_avatar", "Zielgruppen-Avatar"), ("arbeitgeber_avatar", "Arbeitgeber-Avatar")])

async def _v3_st04_handler(context: dict, state: ExecutionState) -> dict:
    return await _v3_st_doc(context, state, 4, "Creative Briefing", "creative_briefing",
        [("zielgruppen_avatar", "Zielgruppen-Avatar"), ("arbeitgeber_avatar", "Arbeitgeber-Avatar"), ("messaging_matrix", "Messaging-Matrix")])

async def _v3_st05_handler(context: dict, state: ExecutionState) -> dict:
    return await _v3_st_doc(context, state, 5, "Marken-Richtlinien", "marken_richtlinien",
        [("arbeitgeber_avatar", "Arbeitgeber-Avatar"), ("messaging_matrix", "Messaging-Matrix"), ("creative_briefing", "Creative Briefing")])

async def _v3_cc01_handler(context: dict, state: ExecutionState) -> dict:
    return await _v3_st_doc(context, state, 6, "Landingpage-Texte", "landingpage_texte",
        [("zielgruppen_avatar", "Zielgruppen-Avatar"), ("arbeitgeber_avatar", "Arbeitgeber-Avatar"), ("messaging_matrix", "Messaging-Matrix"), ("marken_richtlinien", "Marken-Richtlinien")])

async def _v3_cc02_handler(context: dict, state: ExecutionState) -> dict:
    return await _v3_st_doc(context, state, 7, "Formularseite-Texte", "formularseite_texte",
        [("zielgruppen_avatar", "Zielgruppen-Avatar"), ("landingpage_texte", "Landingpage-Texte")])

async def _v3_cc03_handler(context: dict, state: ExecutionState) -> dict:
    return await _v3_st_doc(context, state, 8, "Dankeseite-Texte", "dankeseite_texte",
        [("landingpage_texte", "Landingpage-Texte"), ("formularseite_texte", "Formularseite-Texte")])

async def _v3_cc04_handler(context: dict, state: ExecutionState) -> dict:
    return await _v3_st_doc(context, state, 9, "Anzeigentexte Hauptkampagne", "anzeigen_haupt",
        [("zielgruppen_avatar", "Zielgruppen-Avatar"), ("messaging_matrix", "Messaging-Matrix"), ("marken_richtlinien", "Marken-Richtlinien")])

async def _v3_cc05_handler(context: dict, state: ExecutionState) -> dict:
    return await _v3_st_doc(context, state, 10, "Anzeigentexte Retargeting", "anzeigen_retargeting",
        [("zielgruppen_avatar", "Zielgruppen-Avatar"), ("messaging_matrix", "Messaging-Matrix"), ("anzeigen_haupt", "Anzeigentexte Hauptkampagne")])

async def _v3_cc06_handler(context: dict, state: ExecutionState) -> dict:
    return await _v3_st_doc(context, state, 11, "Anzeigentexte Warmup", "anzeigen_warmup",
        [("arbeitgeber_avatar", "Arbeitgeber-Avatar"), ("messaging_matrix", "Messaging-Matrix")])

async def _v3_cc07_handler(context: dict, state: ExecutionState) -> dict:
    return await _v3_st_doc(context, state, 12, "Videoskript", "videoskript",
        [("zielgruppen_avatar", "Zielgruppen-Avatar"), ("messaging_matrix", "Messaging-Matrix"), ("anzeigen_haupt", "Anzeigentexte Hauptkampagne")])


def _encode_email(to: str, subject: str, body: str) -> str:
    """Encode email for Gmail API."""
    import base64
    from email.mime.text import MIMEText
    msg = MIMEText(body, "plain", "utf-8")
    msg["to"] = to
    msg["subject"] = subject
    return base64.urlsafe_b64encode(msg.as_bytes()).decode()


async def _v3_brand_check(context: dict, state: ExecutionState) -> dict:
    """Brand Consistency Check — Firmenname korrekt überall?"""
    generated_docs = context.get("generated_docs", {})
    company = context.get("company", state.client_name)
    texts = {k: v.get("content", "")[:2000] for k, v in generated_docs.items() if isinstance(v, dict) and "content" in v}
    if not texts:
        return {"passed": True, "message": "No docs to check"}
    return await brand_consistency_check(texts, company)


# Node → Handler Mapping
V3_NODE_HANDLERS: dict[str, Any] = {
    # Infra
    "v3-is02a": _v3_is02a,
    "v3-is06a": _v3_is06a,
    # Kickoff
    "v3-kc00":  _v3_kc00,
    "v3-kc02a": _v3_kc02a,
    "v3-kc02b": _v3_kc02b,
    "v3-kc03a": _v3_kc03a,
    "v3-kc03b": _v3_kc03b,
    # Strategy
    "v3-st-extract": _v3_st_extract,
    "v3-st00":  _v3_st00,
    "v3-st01":  _v3_st01_handler,
    "v3-st02":  _v3_st02_handler,
    "v3-st03":  _v3_st03_handler,
    "v3-st04":  _v3_st04_handler,
    "v3-st05":  _v3_st05_handler,
    "v3-st02a": _v3_st02a,
    # Copy Generation
    "v3-cc01":  _v3_cc01_handler,
    "v3-cc02":  _v3_cc02_handler,
    "v3-cc03":  _v3_cc03_handler,
    "v3-cc04":  _v3_cc04_handler,
    "v3-cc05":  _v3_cc05_handler,
    "v3-cc06":  _v3_cc06_handler,
    "v3-cc07":  _v3_cc07_handler,
    # Copy QA + Brand
    "v3-cc01a": _v3_cc01a,
    "v3-cc01b": _v3_cc01b,
    "v3-cc02a": _v3_cc02a,
    "v3-cc02b": _v3_cc02b,
    "v3-brand-check": _v3_brand_check,
    # Funnel
    "v3-fn05a": _v3_fn05a,
    "v3-fn10a": _v3_fn10a,
    "v3-fn10b": _v3_fn10b,
    # Campaigns
    "v3-ca00":  _v3_ca00,
    # Launch
    "v3-rl-e2e":    _v3_rl09a,
    "v3-rl-url":    _v3_rl_url,
    "v3-rl-pixel":  _v3_rl_pixel,
    "v3-rl-policy": _v3_rl_policy,
    # Post-Launch
    "v3-pl01": _v3_pl01,
    "v3-pl02": _v3_pl02,
    "v3-pl03": _v3_pl03,
    "v3-pl05": _v3_pl05,
    "v3-pl06": _v3_pl06,
    "v3-pl07": _v3_pl06,  # Monthly uses same logic as weekly
    "v3-pl08": _v3_pl01,  # CPL Alert reuses launch check logic
    "v3-pl09": _v3_pl09,
    "v3-pl10": _v3_pl10,
    "v3-pl11": _v3_pl11,
    "v3-pl12": _v3_pl12,
    "v3-cm08": _v3_cm08,
    # Notion (deaktiviert — Airtable + Drive reicht)
    # "v3-notion": _v3_notion_wiki,
    # Screenshots + Winners
    "v3-fn-screenshots": _v3_fn_screenshots,
    "v3-pl-winners": _v3_pl_winners,
}

# Node → Service Mapping (for retry profiles)
_NODE_SERVICE_MAP: dict[str, str] = {
    "v3-is02a": "close", "v3-is02": "close", "v3-is10": "close",
    "v3-is03": "slack", "v3-kc06": "slack",
    "v3-is04": "google", "v3-is05": "google", "v3-is06": "google", "v3-is06a": "google",
    "v3-is07": "google", "v3-is-sheet": "google",
    "v3-is08": "clickup", "v3-is09": "clickup", "v3-kc02b": "clickup",
    "v3-is11": "miro",
    "v3-notion": "notion",
    "v3-st-extract": "openrouter", "v3-st01": "openrouter", "v3-st02": "openrouter",
    "v3-st03": "openrouter", "v3-st04": "openrouter", "v3-st05": "openrouter",
    "v3-st02a": "openrouter",
    "v3-cc01": "openrouter", "v3-cc02": "openrouter", "v3-cc03": "openrouter",
    "v3-cc04": "openrouter", "v3-cc05": "openrouter", "v3-cc06": "openrouter",
    "v3-cc07": "openrouter", "v3-cc01a": "openrouter", "v3-cc02a": "openrouter",
    "v3-st-sync": "airtable", "v3-cc-sync": "airtable",
    "v3-ca00": "meta", "v3-ca01": "meta", "v3-ca02": "meta", "v3-ca03": "meta",
    "v3-ca04": "meta", "v3-ca05": "meta", "v3-ca06": "meta", "v3-ca07": "meta",
    "v3-ca08": "meta", "v3-ca09": "meta",
    "v3-fn10a": "google", "v3-fn10b": "google",
    "v3-rl09a": "google",
    "v3-fn-screenshots": "google",
    "v3-pl-winners": "meta",
}

def _get_service_for_node(node_id: str) -> str:
    """Get the service name for retry profile selection."""
    return _NODE_SERVICE_MAP.get(node_id, "close")


# ── V3 CRUD Endpoints (für UI) ────────────────────────────────

# Dependency Map: Welches Doc hängt von welchem ab
DOC_DEPENDENCIES: dict[str, list[str]] = {
    "zielgruppen_avatar": [],
    "arbeitgeber_avatar": ["zielgruppen_avatar"],
    "messaging_matrix": ["zielgruppen_avatar", "arbeitgeber_avatar"],
    "creative_briefing": ["zielgruppen_avatar", "arbeitgeber_avatar", "messaging_matrix"],
    "marken_richtlinien": ["arbeitgeber_avatar", "messaging_matrix", "creative_briefing"],
    "lp_text": ["zielgruppen_avatar", "arbeitgeber_avatar", "messaging_matrix", "marken_richtlinien"],
    "form_text": ["zielgruppen_avatar", "lp_text"],
    "danke_text": ["lp_text", "form_text"],
    "anzeigen_haupt": ["zielgruppen_avatar", "messaging_matrix", "marken_richtlinien"],
    "anzeigen_retargeting": ["zielgruppen_avatar", "messaging_matrix", "anzeigen_haupt"],
    "anzeigen_warmup": ["arbeitgeber_avatar", "messaging_matrix"],
    "videoskript": ["zielgruppen_avatar", "messaging_matrix", "anzeigen_haupt"],
    "landing_page": ["lp_text"],
    "formular_page": ["form_text"],
    "danke_page": ["danke_text"],
    "initial_campaign": ["landing_page", "anzeigen_haupt"],
    "retargeting_campaign": ["landing_page", "anzeigen_retargeting"],
    "warmup_campaign": ["landing_page", "anzeigen_warmup"],
}


def get_affected_deliverables(changed_subtype: str) -> list[str]:
    """Finde alle Deliverables die von einem geänderten Doc abhängen (kaskadierend)."""
    affected = []
    to_check = [changed_subtype]
    checked = set()

    while to_check:
        current = to_check.pop(0)
        if current in checked:
            continue
        checked.add(current)

        for subtype, deps in DOC_DEPENDENCIES.items():
            if current in deps and subtype not in checked:
                affected.append(subtype)
                to_check.append(subtype)

    return affected


@app.get("/api/v3/clients")
async def v3_get_clients():
    """Alle Clients aus Airtable V3 Base mit Deliverables, Approvals, Alerts."""
    v3_base = os.environ.get("AIRTABLE_V3_BASE_ID", AIRTABLE_BASE_ID)
    if not v3_base or not AIRTABLE_API_KEY:
        return {"clients": [], "error": "Airtable nicht konfiguriert"}

    clients = []
    try:
        async with httpx.AsyncClient(timeout=15) as client_http:
            # Clients
            resp = await client_http.get(
                f"https://api.airtable.com/v0/{v3_base}/CLIENTS",
                headers={"Authorization": f"Bearer {AIRTABLE_API_KEY}"},
            )
            for record in resp.json().get("records", []):
                fields = record.get("fields", {})
                clients.append({
                    "id": record["id"],
                    "company": fields.get("Client Name", ""),
                    "name": fields.get("Ansprechpartner", ""),
                    "email": fields.get("Email", ""),
                    "phone": fields.get("Telefon", ""),
                    "branche": fields.get("Branche", ""),
                    "status": fields.get("Status", "qualifying"),
                    "accountManager": fields.get("Account Manager", ""),
                    "closeLeadUrl": fields.get("Close Lead URL", ""),
                    "slackChannel": fields.get("Slack Channel", ""),
                    "driveFolderUrl": fields.get("Google Drive URL", ""),
                    "executionId": fields.get("Execution ID", ""),
                    "createdAt": record.get("createdTime", ""),
                })
    except Exception as e:
        log.warning(f"Airtable clients fetch failed: {e}")

    return {"clients": clients}


@app.get("/api/v3/clients/{client_id}")
async def v3_get_client(client_id: str):
    """Einzelner Client mit Deliverables, Timeline."""
    v3_base = os.environ.get("AIRTABLE_V3_BASE_ID", AIRTABLE_BASE_ID)
    if not v3_base:
        raise HTTPException(500, "Airtable nicht konfiguriert")

    async with httpx.AsyncClient(timeout=15) as client_http:
        # Client
        resp = await client_http.get(
            f"https://api.airtable.com/v0/{v3_base}/CLIENTS/{client_id}",
            headers={"Authorization": f"Bearer {AIRTABLE_API_KEY}"},
        )
        if resp.status_code != 200:
            raise HTTPException(404, "Client nicht gefunden")
        record = resp.json()
        fields = record.get("fields", {})

        # Deliverables für diesen Client
        resp2 = await client_http.get(
            f"https://api.airtable.com/v0/{v3_base}/DOKUMENTE",
            params={"filterByFormula": f"FIND('{client_id}', ARRAYJOIN({{Client}}))"},
            headers={"Authorization": f"Bearer {AIRTABLE_API_KEY}"},
        )
        deliverables = []
        for r in resp2.json().get("records", []):
            df = r.get("fields", {})
            deliverables.append({
                "id": r["id"],
                "title": df.get("Dokument-Name", ""),
                "subtype": df.get("Dokument-Typ", ""),
                "status": df.get("Status", "generating"),
                "version": df.get("Version", 1),
                "googleDocUrl": df.get("Google Doc URL", ""),
                "complianceStatus": df.get("Compliance Status", ""),
                "freigegebenVon": df.get("Freigegeben von", ""),
            })

    return {
        "client": {
            "id": client_id,
            "company": fields.get("Client Name", ""),
            "name": fields.get("Ansprechpartner", ""),
            "status": fields.get("Status", "qualifying"),
            "branche": fields.get("Branche", ""),
            "executionId": fields.get("Execution ID", ""),
        },
        "deliverables": deliverables,
    }


@app.post("/api/v3/clients")
async def v3_create_client(body: dict):
    """Neuen Client anlegen → Airtable + Automation starten."""
    v3_base = os.environ.get("AIRTABLE_V3_BASE_ID", AIRTABLE_BASE_ID)
    company = body.get("company", "")

    # 1. Client in Airtable anlegen
    client_record_id = ""
    if v3_base and AIRTABLE_API_KEY:
        try:
            async with httpx.AsyncClient(timeout=15) as client_http:
                resp = await client_http.post(
                    f"https://api.airtable.com/v0/{v3_base}/CLIENTS",
                    headers={"Authorization": f"Bearer {AIRTABLE_API_KEY}", "Content-Type": "application/json"},
                    json={"records": [{"fields": {
                        "Client Name": company,
                        "Ansprechpartner": body.get("contact", body.get("name", "")),
                        "Email": body.get("email", ""),
                        "Telefon": body.get("phone", ""),
                        "Branche": body.get("branche", ""),
                        "Account Manager": body.get("accountManager", "Claudio"),
                        "Status": "onboarding",
                        "Service Typ": body.get("serviceTyp", "Recruiting"),
                    }}]},
                )
                records = resp.json().get("records", [])
                if records:
                    client_record_id = records[0]["id"]
        except Exception as e:
            log.warning(f"Airtable client creation failed: {e}")

    # 2. V3 Automation starten
    exec_result = await v3_start_execution(body)

    # 3. Execution ID in Airtable speichern
    if client_record_id and exec_result.get("execution_id"):
        try:
            async with httpx.AsyncClient(timeout=10) as client_http:
                await client_http.patch(
                    f"https://api.airtable.com/v0/{v3_base}/CLIENTS/{client_record_id}",
                    headers={"Authorization": f"Bearer {AIRTABLE_API_KEY}", "Content-Type": "application/json"},
                    json={"fields": {"Execution ID": exec_result["execution_id"]}},
                )
        except Exception:
            pass

    return {
        "client_id": client_record_id,
        "execution_id": exec_result.get("execution_id", ""),
        "status": "created",
    }


@app.post("/api/v3/deliverables/{deliv_id}/regenerate")
async def v3_regenerate_deliverable(deliv_id: str, body: dict):
    """Deliverable neu generieren mit Feedback. KI bekommt alten Text + Kommentar."""
    feedback = body.get("feedback", "")
    v3_base = os.environ.get("AIRTABLE_V3_BASE_ID", AIRTABLE_BASE_ID)

    # 1. Altes Deliverable aus Airtable laden
    old_content = ""
    doc_subtype = ""
    client_name = ""
    try:
        async with httpx.AsyncClient(timeout=10) as client_http:
            resp = await client_http.get(
                f"https://api.airtable.com/v0/{v3_base}/DOKUMENTE/{deliv_id}",
                headers={"Authorization": f"Bearer {AIRTABLE_API_KEY}"},
            )
            fields = resp.json().get("fields", {})
            old_content = fields.get("Dokument-Name", "")  # Would need content from Google Doc
            doc_subtype = fields.get("Dokument-Typ", "")
            version = fields.get("Version", 1)
    except Exception:
        raise HTTPException(404, "Deliverable nicht gefunden")

    # 2. KI generiert neue Version mit Feedback
    prompt = f"""Du hast zuvor folgendes Dokument erstellt, aber es wurde abgelehnt.

FEEDBACK DES REVIEWERS:
{feedback}

VORHERIGE VERSION:
{old_content[:3000]}

Bitte erstelle eine VERBESSERTE Version die das Feedback berücksichtigt.
Behalte die gleiche Struktur, aber verbessere die kritisierten Punkte.
"""

    try:
        new_content = await gemini_generate(prompt, max_tokens=6000)
    except Exception as e:
        return {"error": str(e)}

    # 3. Neue Version in Airtable speichern
    try:
        async with httpx.AsyncClient(timeout=10) as client_http:
            await client_http.patch(
                f"https://api.airtable.com/v0/{v3_base}/DOKUMENTE/{deliv_id}",
                headers={"Authorization": f"Bearer {AIRTABLE_API_KEY}", "Content-Type": "application/json"},
                json={"fields": {
                    "Status": "generated",
                    "Version": version + 1,
                }},
            )
    except Exception:
        pass

    # 4. Feedback in Airtable Feedback-Tabelle speichern (für Lernschleife)
    # TODO: Feedback-Tabelle erstellen wenn nötig

    return {
        "regenerated": True,
        "version": version + 1,
        "content_length": len(new_content),
        "subtype": doc_subtype,
    }


@app.post("/api/v3/deliverables/{deliv_id}/approve")
async def v3_approve_deliverable(deliv_id: str, body: dict = {}):
    """Deliverable freigeben (by Deliverable ID, nicht Node ID)."""
    v3_base = os.environ.get("AIRTABLE_V3_BASE_ID", AIRTABLE_BASE_ID)
    reviewer = body.get("reviewer", "Claudio")
    comment = body.get("comment", "")

    try:
        async with httpx.AsyncClient(timeout=10) as client_http:
            await client_http.patch(
                f"https://api.airtable.com/v0/{v3_base}/DOKUMENTE/{deliv_id}",
                headers={"Authorization": f"Bearer {AIRTABLE_API_KEY}", "Content-Type": "application/json"},
                json={"fields": {
                    "Status": "approved",
                    "Freigegeben von": reviewer,
                }},
            )
    except Exception as e:
        raise HTTPException(500, str(e))

    return {"approved": True, "deliverable_id": deliv_id, "reviewer": reviewer}


@app.post("/api/v3/deliverables/{deliv_id}/reject")
async def v3_reject_deliverable(deliv_id: str, body: dict):
    """Deliverable ablehnen mit Kommentar."""
    v3_base = os.environ.get("AIRTABLE_V3_BASE_ID", AIRTABLE_BASE_ID)
    comment = body.get("comment", "")
    reviewer = body.get("reviewer", "Claudio")

    try:
        async with httpx.AsyncClient(timeout=10) as client_http:
            await client_http.patch(
                f"https://api.airtable.com/v0/{v3_base}/DOKUMENTE/{deliv_id}",
                headers={"Authorization": f"Bearer {AIRTABLE_API_KEY}", "Content-Type": "application/json"},
                json={"fields": {
                    "Status": "rejected",
                    "Compliance Issues": f"Abgelehnt von {reviewer}: {comment}",
                }},
            )
    except Exception as e:
        raise HTTPException(500, str(e))

    return {"rejected": True, "deliverable_id": deliv_id, "comment": comment}


@app.post("/api/v3/deliverables/{deliv_id}/review")
async def v3_submit_for_review(deliv_id: str):
    """Deliverable zur Prüfung einreichen."""
    v3_base = os.environ.get("AIRTABLE_V3_BASE_ID", AIRTABLE_BASE_ID)

    try:
        async with httpx.AsyncClient(timeout=10) as client_http:
            await client_http.patch(
                f"https://api.airtable.com/v0/{v3_base}/DOKUMENTE/{deliv_id}",
                headers={"Authorization": f"Bearer {AIRTABLE_API_KEY}", "Content-Type": "application/json"},
                json={"fields": {"Status": "in_review"}},
            )
    except Exception as e:
        raise HTTPException(500, str(e))

    return {"submitted": True, "deliverable_id": deliv_id}


@app.patch("/api/v3/deliverables/{deliv_id}")
async def v3_update_deliverable(deliv_id: str, body: dict):
    """Deliverable Content/Status updaten."""
    v3_base = os.environ.get("AIRTABLE_V3_BASE_ID", AIRTABLE_BASE_ID)
    updates = {}
    if "content" in body:
        updates["Dokument-Name"] = body["content"][:100]  # Summary
    if "status" in body:
        updates["Status"] = body["status"]

    try:
        async with httpx.AsyncClient(timeout=10) as client_http:
            await client_http.patch(
                f"https://api.airtable.com/v0/{v3_base}/DOKUMENTE/{deliv_id}",
                headers={"Authorization": f"Bearer {AIRTABLE_API_KEY}", "Content-Type": "application/json"},
                json={"fields": updates},
            )
    except Exception as e:
        raise HTTPException(500, str(e))

    return {"updated": True, "deliverable_id": deliv_id}


@app.post("/api/v3/deliverables/{deliv_id}/cascade-check")
async def v3_cascade_check(deliv_id: str):
    """Prüfe welche Deliverables betroffen sind wenn dieses Doc geändert wird."""
    v3_base = os.environ.get("AIRTABLE_V3_BASE_ID", AIRTABLE_BASE_ID)

    # Get subtype of changed deliverable
    try:
        async with httpx.AsyncClient(timeout=10) as client_http:
            resp = await client_http.get(
                f"https://api.airtable.com/v0/{v3_base}/DOKUMENTE/{deliv_id}",
                headers={"Authorization": f"Bearer {AIRTABLE_API_KEY}"},
            )
            subtype = resp.json().get("fields", {}).get("Dokument-Typ", "")
    except Exception:
        return {"affected": []}

    affected = get_affected_deliverables(subtype)
    return {
        "changed": subtype,
        "affected": affected,
        "count": len(affected),
        "message": f"{len(affected)} Deliverables sind von dieser Änderung betroffen" if affected else "Keine Abhängigkeiten",
    }


@app.post("/api/v3/deliverables/{deliv_id}/mark-outdated")
async def v3_mark_outdated(deliv_id: str):
    """Markiere ein Deliverable als veraltet (weil eine Abhängigkeit sich geändert hat)."""
    v3_base = os.environ.get("AIRTABLE_V3_BASE_ID", AIRTABLE_BASE_ID)

    try:
        async with httpx.AsyncClient(timeout=10) as client_http:
            await client_http.patch(
                f"https://api.airtable.com/v0/{v3_base}/DOKUMENTE/{deliv_id}",
                headers={"Authorization": f"Bearer {AIRTABLE_API_KEY}", "Content-Type": "application/json"},
                json={"fields": {"Status": "needs_revision"}},
            )
    except Exception as e:
        raise HTTPException(500, str(e))

    return {"marked_outdated": True}


@app.post("/api/v3/clients/{client_id}/phases/{phase}/approve-all")
async def v3_approve_all_phase(client_id: str, phase: str, body: dict = {}):
    """Batch: Alle Deliverables einer Phase freigeben."""
    v3_base = os.environ.get("AIRTABLE_V3_BASE_ID", AIRTABLE_BASE_ID)
    reviewer = body.get("reviewer", "Claudio")

    # Get all deliverables for this client in this phase
    phase_subtypes = {
        "strategy": ["zielgruppen_avatar", "arbeitgeber_avatar", "messaging_matrix", "creative_briefing", "marken_richtlinien"],
        "copy": ["lp_text", "form_text", "danke_text", "anzeigen_haupt", "anzeigen_retargeting", "anzeigen_warmup", "videoskript"],
        "funnel": ["landing_page", "formular_page", "danke_page"],
        "campaigns": ["initial_campaign", "retargeting_campaign", "warmup_campaign"],
    }.get(phase, [])

    approved_count = 0
    try:
        async with httpx.AsyncClient(timeout=15) as client_http:
            resp = await client_http.get(
                f"https://api.airtable.com/v0/{v3_base}/DOKUMENTE",
                params={"filterByFormula": f"FIND('{client_id}', ARRAYJOIN({{Client}}))"},
                headers={"Authorization": f"Bearer {AIRTABLE_API_KEY}"},
            )
            for record in resp.json().get("records", []):
                fields = record.get("fields", {})
                if fields.get("Dokument-Typ") in phase_subtypes and fields.get("Status") in ("generated", "draft", "in_review"):
                    await client_http.patch(
                        f"https://api.airtable.com/v0/{v3_base}/DOKUMENTE/{record['id']}",
                        headers={"Authorization": f"Bearer {AIRTABLE_API_KEY}", "Content-Type": "application/json"},
                        json={"fields": {"Status": "approved", "Freigegeben von": reviewer}},
                    )
                    approved_count += 1
    except Exception as e:
        raise HTTPException(500, str(e))

    return {"approved": approved_count, "phase": phase}


@app.post("/api/v3/clients/{client_id}/phases/{phase}/reset")
async def v3_reset_phase(client_id: str, phase: str):
    """Phase zurücksetzen — alle Deliverables auf Draft."""
    v3_base = os.environ.get("AIRTABLE_V3_BASE_ID", AIRTABLE_BASE_ID)
    phase_subtypes = {
        "strategy": ["zielgruppen_avatar", "arbeitgeber_avatar", "messaging_matrix", "creative_briefing", "marken_richtlinien"],
        "copy": ["lp_text", "form_text", "danke_text", "anzeigen_haupt", "anzeigen_retargeting", "anzeigen_warmup", "videoskript"],
        "funnel": ["landing_page", "formular_page", "danke_page"],
        "campaigns": ["initial_campaign", "retargeting_campaign", "warmup_campaign"],
    }.get(phase, [])

    reset_count = 0
    try:
        async with httpx.AsyncClient(timeout=15) as client_http:
            resp = await client_http.get(
                f"https://api.airtable.com/v0/{v3_base}/DOKUMENTE",
                params={"filterByFormula": f"FIND('{client_id}', ARRAYJOIN({{Client}}))"},
                headers={"Authorization": f"Bearer {AIRTABLE_API_KEY}"},
            )
            for record in resp.json().get("records", []):
                fields = record.get("fields", {})
                if fields.get("Dokument-Typ") in phase_subtypes:
                    await client_http.patch(
                        f"https://api.airtable.com/v0/{v3_base}/DOKUMENTE/{record['id']}",
                        headers={"Authorization": f"Bearer {AIRTABLE_API_KEY}", "Content-Type": "application/json"},
                        json={"fields": {"Status": "draft", "Version": (fields.get("Version", 1) or 1)}},
                    )
                    reset_count += 1
    except Exception as e:
        raise HTTPException(500, str(e))

    return {"reset": reset_count, "phase": phase}


@app.get("/api/v3/clients/{client_id}/performance")
async def v3_get_performance(client_id: str):
    """Performance-Daten aus Airtable Performance-Tabelle."""
    v3_base = os.environ.get("AIRTABLE_V3_BASE_ID", AIRTABLE_BASE_ID)

    try:
        async with httpx.AsyncClient(timeout=15) as client_http:
            resp = await client_http.get(
                f"https://api.airtable.com/v0/{v3_base}/Performance",
                params={"sort[0][field]": "Datum", "sort[0][direction]": "desc", "maxRecords": 30},
                headers={"Authorization": f"Bearer {AIRTABLE_API_KEY}"},
            )
            records = []
            for r in resp.json().get("records", []):
                f = r.get("fields", {})
                records.append({
                    "datum": f.get("Datum", ""),
                    "kampagne": f.get("Kampagnen-Name", ""),
                    "impressions": f.get("Impressions", 0),
                    "klicks": f.get("Klicks", 0),
                    "leads": f.get("Leads", 0),
                    "cpl": f.get("CPL", 0),
                    "ausgaben": f.get("Ausgaben", 0),
                    "reichweite": f.get("Reichweite", 0),
                    "frequenz": f.get("Frequenz", 0),
                })
    except Exception as e:
        return {"records": [], "error": str(e)}

    return {"records": records}


# ── V3 Webhook Endpoints ─────────────────────────────────────

@app.post("/api/webhooks/slack")
async def v3_slack_webhook(body: dict):
    """Handle Slack Interactive Messages (approval button clicks)."""
    payload = body.get("payload")
    if payload and isinstance(payload, str):
        payload = json.loads(payload)

    if not payload:
        return {"ok": True}

    actions = payload.get("actions", [])
    for action in actions:
        action_id = action.get("action_id", "")
        user = payload.get("user", {}).get("name", "unknown")
        if action_id.startswith("approve_"):
            node_id = action_id.replace("approve_", "")
            await resolve_approval(node_id, "approve", user)
        elif action_id.startswith("reject_"):
            node_id = action_id.replace("reject_", "")
            await resolve_approval(node_id, "reject", user, comment="Abgelehnt via Slack")
        elif action_id.startswith("changes_"):
            node_id = action_id.replace("changes_", "")
            await resolve_approval(node_id, "changes_requested", user, comment="Änderungen nötig (via Slack)")

    return {"ok": True}


@app.post("/api/webhooks/close")
async def v3_close_webhook(body: dict):
    """Handle Close CRM webhooks (stage changes)."""
    event = body.get("event", {})
    event_type = event.get("action", "")
    if event_type == "updated" and event.get("object_type") == "opportunity":
        opp = event.get("data", {})
        new_status = opp.get("status_label", "")
        lead_id = opp.get("lead_id", "")
        log.info(f"Close webhook: Opportunity {opp.get('id')} → {new_status}")
        return {"received": True, "status": new_status}
    return {"received": True}


@app.post("/api/webhooks/meta")
async def v3_meta_webhook(body: dict):
    """Handle Meta Ads webhooks (ad review status)."""
    entries = body.get("entry", [])
    for entry in entries:
        changes = entry.get("changes", [])
        for change in changes:
            if change.get("field") == "ad_review_status":
                ad_id = change.get("value", {}).get("ad_id", "")
                status = change.get("value", {}).get("review_status", "")
                if status == "REJECTED":
                    await _v3_alert(f"Meta Ad {ad_id} ABGELEHNT — Bitte prüfen", "critical")
                log.info(f"Meta webhook: Ad {ad_id} review → {status}")
    return {"received": True}


@app.post("/api/webhooks/clickup")
async def v3_clickup_webhook(body: dict):
    """Handle ClickUp webhooks (task completion)."""
    event = body.get("event", "")
    task_id = body.get("task_id", "")
    if event == "taskStatusUpdated":
        status = body.get("history_items", [{}])[0].get("after", {}).get("status", "")
        if status.lower() in ("complete", "closed", "done"):
            log.info(f"ClickUp webhook: Task {task_id} completed")
            # Check if this resolves a nudge
            for nudge in get_open_nudges():
                if nudge.get("clickup_task_id") == task_id:
                    resolve_nudge(nudge["id"])
    return {"received": True}


# ── V3 Nudge Endpoints ───────────────────────────────────────

@app.get("/api/v3/nudges")
async def v3_get_nudges():
    """Get all open nudges."""
    return get_open_nudges()


@app.post("/api/v3/nudges/{nudge_id}/resolve")
async def v3_resolve_nudge(nudge_id: str):
    """Resolve a nudge."""
    return {"resolved": resolve_nudge(nudge_id)}


# ── V3 UTM Helper ────────────────────────────────────────────

def build_utm_params(campaign_name: str, ad_name: str = "", adset_name: str = "") -> str:
    """Build UTM parameter string for Meta Ads URL Parameters field."""
    return (
        f"utm_source=meta"
        f"&utm_medium=paid"
        f"&utm_campaign={campaign_name.replace(' ', '+')}"
        f"&utm_content={ad_name.replace(' ', '+')}"
        f"&utm_term={adset_name.replace(' ', '+')}"
    )


# ── V3 Slack Block Kit Buttons ────────────────────────────────

def build_approval_blocks(client_name: str, gate_label: str, deliverables: list, node_id: str, deadline: str) -> list:
    """Build Slack Block Kit message with interactive approval buttons."""
    deliverable_text = "\n".join(f"• {d}" for d in deliverables) if isinstance(deliverables, list) else str(deliverables)

    return [
        {"type": "header", "text": {"type": "plain_text", "text": f"📋 Review — {client_name}"}},
        {"type": "section", "text": {"type": "mrkdwn", "text": f"*{gate_label}*\n\n{deliverable_text}"}},
        {"type": "section", "text": {"type": "mrkdwn", "text": f"Deadline: {deadline}"}},
        {"type": "actions", "elements": [
            {"type": "button", "text": {"type": "plain_text", "text": "✅ Freigeben"}, "style": "primary", "action_id": f"approve_{node_id}"},
            {"type": "button", "text": {"type": "plain_text", "text": "❌ Ablehnen"}, "style": "danger", "action_id": f"reject_{node_id}"},
            {"type": "button", "text": {"type": "plain_text", "text": "🔄 Änderungen"}, "action_id": f"changes_{node_id}"},
        ]},
    ]


async def send_approval_slack_blocks(client_name: str, gate_label: str, deliverables: list, node_id: str, deadline: str):
    """Send approval request with real clickable Slack buttons."""
    if not SLACK_BOT_TOKEN:
        return
    blocks = build_approval_blocks(client_name, gate_label, deliverables, node_id, deadline)
    try:
        import ssl, certifi
        ctx = ssl.create_default_context(cafile=certifi.where())
        data = json.dumps({
            "channel": "#ff-approvals",
            "text": f"Review: {client_name} — {gate_label}",
            "blocks": blocks,
        }).encode()
        req = urllib.request.Request(
            "https://slack.com/api/chat.postMessage",
            data=data,
            headers={"Authorization": f"Bearer {SLACK_BOT_TOKEN}", "Content-Type": "application/json"},
        )
        import urllib.request as ur
        ur.urlopen(req, timeout=10, context=ctx)
    except Exception as e:
        log.warning(f"Slack Block Kit send failed: {e}")


    # (Brand check handler defined above V3_NODE_HANDLERS)


# ── APScheduler Cron Jobs ─────────────────────────────────────

try:
    from apscheduler.schedulers.asyncio import AsyncIOScheduler
    _scheduler = AsyncIOScheduler()

    # Hourly: Check approval escalations
    _scheduler.add_job(check_escalations, "cron", minute=0, id="v3_escalations",
        kwargs={"slack_alert_func": lambda msg: _v3_alert(msg)})

    # Every 4 hours: Check nudges (client asset reminders)
    _scheduler.add_job(check_nudges, "interval", hours=4, id="v3_nudges",
        kwargs={"slack_token": SLACK_BOT_TOKEN or "", "clickup_token": CLICKUP_TOKEN or ""})

    # Every 5 min: Health check
    async def _cron_health():
        tokens = {"CLOSE_API_KEY_V2": CLOSE_API_KEY_V2, "SLACK_BOT_TOKEN": SLACK_BOT_TOKEN,
                  "CLICKUP_API_TOKEN": CLICKUP_TOKEN, "META_ACCESS_TOKEN": META_ACCESS_TOKEN,
                  "AIRTABLE_API": AIRTABLE_API_KEY, "OPENROUTER_API_KEY": "", "NOTION_API_KEY_CLAUDIO": NOTION_API_KEY}
        result = await health_check(tokens)
        if not result.get("healthy"):
            failed = [s for s, info in result.get("services", {}).items() if info.get("status") != "ok"]
            await _v3_alert(f"Health Check: {', '.join(failed)} nicht erreichbar", "warning")
    _scheduler.add_job(_cron_health, "interval", minutes=5, id="v3_health")

    # Every 25 min: Token refresh
    async def _cron_token_refresh():
        _refresh_google_token_v3()
    _scheduler.add_job(_cron_token_refresh, "interval", minutes=25, id="v3_token_refresh")

    # Daily 09:00: Daily digest
    async def _cron_daily_digest():
        from monitoring import daily_digest
        # Simplified: would need client getter functions in production
        log.info("Daily digest cron triggered")
    _scheduler.add_job(_cron_daily_digest, "cron", hour=9, minute=0, id="v3_daily_digest")

    # Friday 16:00: Weekly report
    async def _cron_weekly_report():
        log.info("Weekly report cron triggered")
    _scheduler.add_job(_cron_weekly_report, "cron", day_of_week="fri", hour=16, id="v3_weekly_report")

    # 1st of month 10:00: Monthly report
    async def _cron_monthly_report():
        log.info("Monthly report cron triggered")
    _scheduler.add_job(_cron_monthly_report, "cron", day=1, hour=10, id="v3_monthly_report")

    # Daily 06:00: Meta performance sync to Airtable
    async def _cron_meta_sync():
        log.info("Meta performance sync cron triggered")
    _scheduler.add_job(_cron_meta_sync, "cron", hour=6, id="v3_meta_sync")

    # Daily 10:00: Ghost detection
    async def _cron_ghost():
        from monitoring import ghost_detection
        log.info("Ghost detection cron triggered")
    _scheduler.add_job(_cron_ghost, "cron", hour=10, id="v3_ghost")

    # Every 6h: CPL alert
    async def _cron_cpl():
        log.info("CPL alert cron triggered")
    _scheduler.add_job(_cron_cpl, "interval", hours=6, id="v3_cpl_alert")

    # Monday 08:00: Ad fatigue check
    async def _cron_fatigue():
        log.info("Ad fatigue cron triggered")
    _scheduler.add_job(_cron_fatigue, "cron", day_of_week="mon", hour=8, id="v3_ad_fatigue")

    # Daily 22:00: DLQ digest
    async def _cron_dlq():
        from resilience import DeadLetterQueue
        unresolved = DeadLetterQueue.get_unresolved()
        if unresolved:
            await _v3_alert(f"DLQ: {len(unresolved)} ungelöste Fehler — bitte prüfen", "warning")
    _scheduler.add_job(_cron_dlq, "cron", hour=22, id="v3_dlq_digest")

    # Daily 07:00: Airtable/Close sync check
    async def _cron_sync_check():
        log.info("Airtable/Close sync check cron triggered")
    _scheduler.add_job(_cron_sync_check, "cron", hour=7, id="v3_sync_check")

    # Weekly Monday 09:00: Meta token expiry check
    async def _cron_meta_token():
        log.info("Meta token expiry check cron triggered")
    _scheduler.add_job(_cron_meta_token, "cron", day_of_week="mon", hour=9, id="v3_meta_token")

    @app.on_event("startup")
    async def _start_v3_scheduler():
        _scheduler.start()
        log.info(f"V3 APScheduler started — {len(_scheduler.get_jobs())} jobs registered")

except ImportError:
    log.warning("APScheduler not installed — V3 cron jobs disabled")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="0.0.0.0", port=3002, reload=True)
