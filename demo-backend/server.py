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

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("demo-backend")

app = FastAPI(title="Flowstack Demo Backend", version="1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:4173", "http://localhost:5180"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Credentials aus Environment (Doppler) ─────────────────────────────────────

CLOSE_API_KEY = os.environ.get("CLOSE_API", os.environ.get("CLOSE_API_KEY", ""))
CLICKUP_TOKEN = os.environ.get("CLICKUP_API_TOKEN")
SLACK_WEBHOOK = os.environ.get("SLACK_CLAUDIO_WEBHOOK", os.environ.get("SLACK_CLAUDIO_WEBHOOK_URL", os.environ.get("SLACK_WEBHOOK", os.environ.get("SLACK_WEBHOOK_URL"))))
SLACK_BOT_TOKEN = os.environ.get("SLACK_BOT_TOKEN", os.environ.get("SLACK_API_TOKEN"))
META_ACCESS_TOKEN = os.environ.get("META_ACCESS_TOKEN")
META_AD_ACCOUNT = os.environ.get("META_AD_ACCOUNT_ID")
META_PIXEL_ID = os.environ.get("META_PIXEL_ID", "1496553014661154")  # Leadflow-Marketing Pixel 1
META_PAGE_ID = os.environ.get("META_PAGE_ID")

# Google OAuth Token (JSON string)
_google_raw = os.environ.get("GOOGLE_CLAUDIO_OAUTH_TOKEN", os.environ.get("GOOGLE_OAUTH_TOKEN", "{}"))
try:
    _google_creds = json.loads(_google_raw)
except json.JSONDecodeError:
    _google_creds = {}

GOOGLE_ACCESS_TOKEN = _google_creds.get("token", "")
GOOGLE_REFRESH_TOKEN = _google_creds.get("refresh_token", "")
GOOGLE_CLIENT_ID = _google_creds.get("client_id", "")
GOOGLE_CLIENT_SECRET = _google_creds.get("client_secret", "")

# ClickUp Config
CLICKUP_SPACE_ID = "90189542355"  # Client Projects

# Close Pipeline
CLOSE_PIPELINE_ID = "pipe_2Zs3qMCbUuykBfzFT8qDdh"  # Fulfillment

# Close Custom Field IDs
CLOSE_FIELDS = {
    "service_type": "cf_eINXkDoLj2S5nSWJQAxgG9MMghx7RG2BqerArg4EbMj",
    "account_manager": "cf_47UBYEZjhDxwA8ERz4JWryeFxlV43POXYaaoNHSKCkO",
    "onboarding_date": "cf_jLGwUwi7oJLxg97dC29PxCingn8chdqHQs3wHXJXjku",
    "automation_status": "cf_JfiPvtH7suFKVpB06kFnP5aNjGAyL65v7mDUM3dd1xX",
}

# Close Stage IDs (will be populated on startup)
CLOSE_STAGES: dict[str, str] = {}

# ClickUp Member IDs
CLICKUP_CLAUDIO = 306633165  # Marketer
CLICKUP_ANAK = 107605639     # Developer

# Slack Member IDs (Flowstack Systems Workspace)
SLACK_CLAUDIO = "U0AA1KHD0G2"
SLACK_ANAK = "U0A9L6KUT5M"
SLACK_TEAM_MEMBERS = [SLACK_CLAUDIO, SLACK_ANAK]  # Werden automatisch in neue Client-Channels eingeladen


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
    "Anzeigen-Variationen": "https://docs.google.com/document/d/1ITRWWBL9tY-2AUi4CIB6wbPqbk6CGcv5UB6ePtH87j0/edit",
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

_http = httpx.AsyncClient(timeout=30)


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
    """Ad Account ID mit act_ Prefix."""
    if not META_AD_ACCOUNT:
        return ""
    return META_AD_ACCOUNT if META_AD_ACCOUNT.startswith("act_") else f"act_{META_AD_ACCOUNT}"


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

# Anzeigentexte (Deutsch, Recruiting-Kontext)
AD_COPY_INITIAL = [
    "Du willst mehr als nur einen Job? Bei {company} findest du moderne Technologien, echtes Remote-First und ein Team, das zusammenhält. Jetzt bewerben!",
    "Senior Developer gesucht! React, TypeScript, Cloud-Native — und das alles 100% remote. Entdecke {company}.",
    "Bereit für den nächsten Karriereschritt? {company} sucht Talente, die Technologie lieben. Flexible Arbeitszeiten, starkes Team, spannende Projekte.",
]
AD_COPY_RETARGETING = [
    "Du warst schon auf unserer Seite — jetzt fehlt nur noch deine Bewerbung! {company} wartet auf dich.",
    "Noch unentschlossen? Hier sind 3 Gründe, warum {company} dein nächster Arbeitgeber sein sollte.",
    "Die besten Chancen warten nicht ewig. Bewirb dich jetzt bei {company}!",
]
AD_COPY_WARMUP = [
    "So arbeiten wir bei {company} — ein Blick hinter die Kulissen unseres Entwicklerteams.",
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


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "close": bool(CLOSE_API_KEY),
        "clickup": bool(CLICKUP_TOKEN),
        "slack": bool(SLACK_WEBHOOK),
        "google": bool(GOOGLE_REFRESH_TOKEN),
        "meta": bool(META_ACCESS_TOKEN),
        "stages": list(CLOSE_STAGES.keys()),
    }


# ══════════════════════════════════════════════════════════════════════════════
# PHASE 2: Infrastructure Setup
# ══════════════════════════════════════════════════════════════════════════════

@app.post("/api/close/create-lead")
async def create_close_lead(body: Optional[dict] = None):
    """is02: Lead in Close erstellen + Pipeline + Custom Fields."""
    company = (body or {}).get("company", "Novacode GmbH")
    contact_name = (body or {}).get("contact", "Max Weber")
    contact_email = (body or {}).get("email", "clazahlungskonto@gmail.com")

    # Lead erstellen
    lead = await close_api("POST", "/lead/", {
        "name": company,
        "contacts": [{
            "name": contact_name,
            "emails": [{"email": contact_email, "type": "office"}],
        }],
        f"custom.{CLOSE_FIELDS['service_type']}": "Recruiting",
        f"custom.{CLOSE_FIELDS['account_manager']}": "Claudio Di Franco",
        f"custom.{CLOSE_FIELDS['automation_status']}": "Infrastruktur-Setup",
    })
    lead_id = lead["id"]

    # Opportunity in Fulfillment Pipeline
    opp = await close_api("POST", "/opportunity/", {
        "lead_id": lead_id,
        "pipeline_id": CLOSE_PIPELINE_ID,
        "status_id": CLOSE_STAGES.get("Onboarding gestartet"),
        "note": f"Fulfillment Automation gestartet für {company}",
        "value": 0,
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
    automation_status = body.get("automation_status", stage)

    status_id = CLOSE_STAGES.get(stage)
    if not status_id:
        raise HTTPException(400, f"Unbekannte Stage: {stage}")

    await close_api("PUT", f"/opportunity/{opp_id}/", {
        "status_id": status_id,
    })

    # Automation Status auf Lead updaten
    if "lead_id" in body:
        await close_api("PUT", f"/lead/{body['lead_id']}/", {
            f"custom.{CLOSE_FIELDS['automation_status']}": automation_status,
        })

    # Note
    await close_api("POST", "/activity/note/", {
        "lead_id": body.get("lead_id", ""),
        "note": f"Stage aktualisiert: {stage}. Automation Status: {automation_status}.",
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
    for name in ["Roh_Uploads", "Bearbeitete_Creatives", "Finale_Anzeigen"]:
        await google_api("POST", "https://www.googleapis.com/drive/v3/files", {
            "name": name,
            "mimeType": "application/vnd.google-apps.folder",
            "parents": [created["04_Creatives"]],
        })

    # Root-Ordner mit Kunden-E-Mail teilen (Writer)
    client_email = (body or {}).get("email")
    if client_email:
        try:
            await google_api("POST", f"https://www.googleapis.com/drive/v3/files/{root_id}/permissions", {
                "role": "writer",
                "type": "user",
                "emailAddress": client_email,
            })
            log.info(f"Drive Ordner mit {client_email} geteilt")
        except Exception as e:
            log.warning(f"Drive Sharing fehlgeschlagen (non-critical): {e}")

    folder_url = f"https://drive.google.com/drive/folders/{root_id}"
    log.info(f"Drive Ordnerstruktur erstellt: {folder_url}")
    return {"root_id": root_id, "url": folder_url, "subfolders": created}


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
    contact_name = (body or {}).get("contact", "Max Weber")
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
                    return {"list_id": list_id, "name": lst["name"], "url": f"https://app.clickup.com/{CLICKUP_SPACE_ID}/l/{list_id}"}
            raise
        raise
    return {"list_id": list_id, "name": result["name"], "url": f"https://app.clickup.com/{CLICKUP_SPACE_ID}/l/{list_id}"}


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


async def _complete_task(task_id: str, comment: str | None = None) -> None:
    """Helper: ClickUp Task als erledigt markieren + optionaler Kommentar."""
    await clickup_api("PUT", f"/task/{task_id}", {"status": "complete"})
    if comment:
        await clickup_api("POST", f"/task/{task_id}/comment", {"comment_text": comment})


@app.post("/api/clickup/create-tasks")
async def create_clickup_tasks(body: dict):
    """is09: Initiale ClickUp Tasks erstellen (Zugänge + Zugänge beschaffen + Kickoff)."""
    list_id = body["list_id"]
    task_ids: dict[str, str] = {}
    company = body.get("company", "Novacode GmbH")

    # URLs aus Context aufbauen
    lead_id = body.get("lead_id", "")
    folder_root_id = body.get("folder_root_id", "")
    close_url = f"https://app.close.com/lead/{lead_id}/" if lead_id else ""
    drive_url = f"https://drive.google.com/drive/folders/{folder_root_id}" if folder_root_id else ""
    ads_url = f"https://adsmanager.facebook.com/adsmanager/manage/campaigns?act={META_AD_ACCOUNT}" if META_AD_ACCOUNT else ""
    events_url = f"https://business.facebook.com/events_manager2/list/pixel/{META_PIXEL_ID}/overview" if META_PIXEL_ID else ""
    clickup_url = f"https://app.clickup.com/{CLICKUP_SPACE_ID}/l/{list_id}"

    # Task 1: Zugriff prüfen
    desc = f"Alle technischen Zugänge für das Recruiting-Projekt prüfen und dokumentieren.\n\n"
    desc += f"Ressourcen:\n"
    if close_url: desc += f"- Close Deal: {close_url}\n"
    if drive_url: desc += f"- Google Drive: {drive_url}\n"
    if ads_url: desc += f"- Meta Ads Manager: {ads_url}\n"
    if events_url: desc += f"- Meta Events Manager: {events_url}\n"
    desc += f"- ClickUp Projekt: {clickup_url}\n"
    t = await _create_task(
        list_id, "Zugriff prüfen", desc,
        [CLICKUP_ANAK], 1, 2,  # Urgent, +2 Tage
        [
            "Meta Business Manager: Admin-Zugang vorhanden",
            "Meta Ad Account: Zugang und Werberechte bestätigt",
            f"Meta Pixel: ID {META_PIXEL_ID} vorhanden und aktiv" if META_PIXEL_ID else "Meta Pixel: Vorhanden und aktiv",
            "Facebook Seite: Vorhanden und mit Ad Account verknüpft",
            "Website/CMS: Login-Daten erhalten und Zugang getestet",
            "Domain/DNS: Zugang vorhanden (falls Pixel/CNAME nötig)",
            "Technischer Ansprechpartner beim Kunden identifiziert",
            "Alle Zugänge im Close Deal dokumentiert",
            "Ergebnis: Fehlende Zugänge identifiziert und als Aufgabe erfasst",
        ],
    )
    task_ids["zugaenge"] = t["id"]

    # Task 2: Fehlende Zugänge beschaffen (bedingt — in Demo immer erstellt)
    desc2 = f"Falls Zugänge fehlen: Beim Kunden anfordern und einrichten.\n\n"
    desc2 += f"Ressourcen:\n"
    if close_url: desc2 += f"- Close Deal: {close_url}\n"
    desc2 += f"- ClickUp Projekt: {clickup_url}\n"
    t = await _create_task(
        list_id, "Fehlende Zugänge beschaffen", desc2,
        [CLICKUP_ANAK], 2, 3,  # High, +3 Tage
        [
            "Fehlende Zugänge aus 'Zugriff prüfen' identifiziert",
            "Kunden per Slack oder E-Mail kontaktiert",
            "Business Manager Einladung versendet (falls nötig)",
            "Ad Account Zugriff bestätigt (mind. Werbekonto-Admin)",
            "Pixel-Zugang gesichert (Events Manager Zugriff)",
            "Website-Zugang getestet (Login funktioniert)",
            "Alle Zugänge erneut verifiziert und dokumentiert",
        ],
    )
    task_ids["zugaenge_beschaffen"] = t["id"]

    # Task 3: Kickoff vorbereiten
    desc3 = f"Internes Briefing und Kickoff-Leitfaden für den Kundencall vorbereiten.\n\n"
    desc3 += f"Ressourcen:\n"
    if close_url: desc3 += f"- Close Deal: {close_url}\n"
    if drive_url: desc3 += f"- Google Drive: {drive_url}\n"
    desc3 += f"- Kalendereinladung mit Google Meet-Link liegt bereit\n"
    t = await _create_task(
        list_id, "Kickoff vorbereiten", desc3,
        [CLICKUP_CLAUDIO], 2, 3,  # High, +3 Tage
        [
            "Close Deal-Notizen und Opportunity-Details gelesen",
            "Onboarding-Formular Antworten geprüft",
            "Branche und Wettbewerber kurz recherchiert",
            "Recruiting Kickoff-Leitfaden geöffnet und angepasst",
            "Schlüsselfragen an Client-Situation angepasst",
            "Brand & Design Fragen vorbereitet (Logo, Farben, Bilder)",
            "Kalendereinladung und Google Meet-Link verifiziert",
        ],
    )
    task_ids["kickoff"] = t["id"]

    log.info(f"ClickUp Tasks erstellt: {task_ids}")
    return {"tasks": [{"id": v, "name": k} for k, v in task_ids.items()], "task_ids": task_ids, "url": clickup_url}


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
            # Ops-Channel Benachrichtigung (Block Kit)
            blocks = _slack_blocks_message(
                f":white_check_mark: Neuer Client: {company}",
                [
                    {"text": "*Recruiting Automation*\nLead erstellt und Pipeline gestartet."},
                    {"fields": [
                        ("Service", "Recruiting"),
                        ("Account Manager", "Claudio Di Franco"),
                    ]},
                ],
                buttons=[("Close CRM öffnen", lead_url, "primary")],
                footer=f":zap: Flowstack Automation | {datetime.now().strftime('%d.%m.%Y %H:%M')}",
            )
            await slack_message(f"Neuer Client: {company}", blocks=blocks, color=SLACK_COLOR_SUCCESS)
            # Kunden-Channel erstellen
            channel_name = company.lower().replace(" ", "-").replace("ü", "ue").replace("ä", "ae").replace("ö", "oe")
            channel_name = f"client-{channel_name}"[:80]
            ch = await slack_bot_api("conversations.create", {
                "name": channel_name,
                "is_private": False,
            })
            channel_id = None
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
                # Channel-Beschreibung setzen
                await slack_bot_api("conversations.setTopic", {
                    "channel": channel_id,
                    "topic": f"Recruiting Automation — {company}",
                })
                # Willkommensnachricht im Kunden-Channel (Block Kit)
                welcome_blocks = _slack_blocks_message(
                    f":wave: Willkommen, {company}!",
                    [
                        {"text": "Hier koordinieren wir alles rund um euer Recruiting-Projekt."},
                        {"fields": [
                            ("Claudio Di Franco", "Account Manager & Strategie"),
                            ("Anak", "Development & Technik"),
                        ]},
                    ],
                    footer="Bei Fragen einfach hier schreiben - wir sind fuer euch da!",
                )
                await slack_bot_api("chat.postMessage", {
                    "channel": channel_id,
                    "text": f"Willkommen im Projekt-Channel, {company}!",
                    "blocks": welcome_blocks,
                })
            elif ch.get("error") == "name_taken":
                # Channel existiert schon — wiederverwenden
                existing = await slack_bot_api("conversations.list", {
                    "types": "public_channel",
                    "limit": 200,
                })
                for c in existing.get("channels", []):
                    if c["name"] == channel_name:
                        channel_id = c["id"]
                        # Falls archiviert, wieder öffnen
                        if c.get("is_archived"):
                            await slack_bot_api("conversations.unarchive", {"channel": channel_id})
                        # Sicherstellen dass Team-Mitglieder drin sind
                        if SLACK_TEAM_MEMBERS:
                            await slack_bot_api("conversations.invite", {
                                "channel": channel_id,
                                "users": ",".join(SLACK_TEAM_MEMBERS),
                            })
                        break
                log.info(f"Slack Channel existiert bereits: #{channel_name} ({channel_id})")
            result = {"sent": True, "channel_id": channel_id, "channel_name": channel_name, "url": "https://app.slack.com/"}

        elif node_id == "is04":
            result = await send_welcome_email(context)

        elif node_id == "is05":
            result = await create_calendar_event(context)
            # Slack: Kickoff-Termin erstellt
            company = context.get("company", "Novacode GmbH")
            event_link = result.get("link", "")
            meet_link = result.get("meet_link", "")
            blocks = _slack_blocks_message(
                f":calendar: Kickoff-Termin — {company}",
                [{"text": "Einladung an Client gesendet."}],
                buttons=[("Kalender öffnen", event_link, "primary")] + ([("Google Meet", meet_link)] if meet_link else []),
                footer=f":zap: Flowstack Automation | {datetime.now().strftime('%d.%m.%Y %H:%M')}",
            )
            await slack_message(f"Kickoff-Termin erstellt — {company}", blocks=blocks, color=SLACK_COLOR_INFO)

        elif node_id == "is06":
            result = await create_drive_folders(context)
            # Slack: Drive-Ordner erstellt
            folder_url = result.get("url", "")
            if folder_url:
                company = context.get("company", "Novacode GmbH")
                blocks = _slack_blocks_message(
                    f":file_folder: Google Drive — {company}",
                    [
                        {"text": "8 Hauptordner + Unterordner angelegt und geteilt."},
                        {"fields": [("Geteilt mit", context.get("email", "Kunde"))]},
                    ],
                    buttons=[("Drive öffnen", folder_url, "primary")],
                    footer=f":zap: Flowstack Automation | {datetime.now().strftime('%d.%m.%Y %H:%M')}",
                )
                await slack_message(f"Google Drive Ordner erstellt — {company}", blocks=blocks, color=SLACK_COLOR_INFO)

        elif node_id == "is08":
            result = await create_clickup_project(context)

        elif node_id == "is09":
            list_id = context.get("list_id")
            if list_id:
                result = await create_clickup_tasks(context)
                # Slack: ClickUp Tasks erstellt
                company = context.get("company", "Novacode GmbH")
                clickup_url = f"https://app.clickup.com/{CLICKUP_SPACE_ID}/l/{list_id}"
                blocks = _slack_blocks_message(
                    f":memo: ClickUp — {company}",
                    [
                        {"text": "3 Tasks erstellt:"},
                        {"items": [
                            ":red_circle: Zugriff prüfen — Urgent",
                            ":large_orange_circle: Fehlende Zugänge beschaffen",
                            ":large_orange_circle: Kickoff vorbereiten",
                        ]},
                    ],
                    buttons=[("ClickUp öffnen", clickup_url, "primary")],
                    footer=":zap: Flowstack Automation | Projekt angelegt",
                )
                await slack_message(f"ClickUp Projekt erstellt — {company}", blocks=blocks, color=SLACK_COLOR_INFO)

        elif node_id == "is10":
            result = await update_close_stage({
                **context,
                "stage": "Kickoff geplant",
                "automation_status": "Warte auf Kickoff",
            })

        # ── Kickoff & Transcript ──
        elif node_id == "kc05":
            result = await update_close_stage({
                **context,
                "stage": "Kickoff abgeschlossen",
                "automation_status": "Strategie in Arbeit",
            })
            # ClickUp: Infra-Tasks abschließen + Strategie-Review erstellen
            list_id = context.get("list_id")
            task_ids = dict(context.get("task_ids", {}))
            if list_id:
                if task_ids.get("zugaenge"):
                    await _complete_task(task_ids["zugaenge"], "✅ Alle Zugänge geprüft und dokumentiert.")
                if task_ids.get("zugaenge_beschaffen"):
                    await _complete_task(task_ids["zugaenge_beschaffen"], "✅ Alle fehlenden Zugänge beschafft.")
                if task_ids.get("kickoff"):
                    await _complete_task(
                        task_ids["kickoff"],
                        f"✅ Kickoff abgeschlossen.\n\nTranskript: {TRANSCRIPT_DOC}",
                    )
                # Task 4: Strategie- & Marken-Review
                lead_id = context.get("lead_id", "")
                folder_root_id = context.get("folder_root_id", "")
                close_url = f"https://app.close.com/lead/{lead_id}/" if lead_id else ""
                drive_url = f"https://drive.google.com/drive/folders/{folder_root_id}" if folder_root_id else ""
                desc = "Strategie-Dokumente auf Basis des Kickoff-Transkripts erstellen und reviewen.\n\n"
                desc += "Ressourcen:\n"
                desc += f"- Kickoff-Transkript: {TRANSCRIPT_DOC}\n"
                if drive_url: desc += f"- Google Drive (Strategie): {drive_url}\n"
                if close_url: desc += f"- Close Deal: {close_url}\n"
                t = await _create_task(
                    list_id, "Strategie- & Marken-Review", desc,
                    [CLICKUP_CLAUDIO], 2, 5,  # High, +5 Tage
                    [
                        "Zielgruppen-Avatar: Alter, Region, Branche vollständig",
                        "Zielgruppen-Avatar: Mind. 5 Pain Points branchenspezifisch",
                        "Zielgruppen-Avatar: Jobs-to-be-Done und Medienkonsum definiert",
                        "Arbeitgeber-Avatar: EVP klar formuliert",
                        "Arbeitgeber-Avatar: 4 P's ausgefüllt (People, Purpose, Place, Product)",
                        "Messaging-Matrix: USPs mit Pain Points verknüpft",
                        "Messaging-Matrix: Tone of Voice definiert",
                        "Creative Briefing: Farbpalette und Typografie festgelegt",
                        "Creative Briefing: Bildsprache und Format-Specs (1080x1080, 1080x1920)",
                        "Marken-Richtlinien: Kommunikations-Dos/Don'ts vollständig",
                        "Alle 5 Strategie-Dokumente intern freigegeben",
                    ],
                )
                task_ids["strategy_review"] = t["id"]
                result["task_ids"] = task_ids

        elif node_id == "kc06":
            company = context.get("company", "Novacode GmbH")
            blocks = _slack_blocks_message(
                f":white_check_mark: Kickoff abgeschlossen — {company}",
                [{"text": "Strategie-Erstellung startet automatisch."}],
                buttons=[("Transkript lesen", TRANSCRIPT_DOC, "primary")],
                footer=f":zap: Flowstack Automation | Nächster Schritt: Strategie & Brand",
            )
            await slack_message(f"Kickoff abgeschlossen — {company}", blocks=blocks, color=SLACK_COLOR_SUCCESS)
            result = {"sent": True, "url": "https://app.slack.com/"}

        # ── Strategy & Brand ──
        elif node_id == "st10":
            result = await update_close_stage({
                **context,
                "stage": "Strategie erstellt",
                "automation_status": "Strategie erstellt",
            })
            # ClickUp: Strategie-Review abschließen + Docs verlinken + Copy-Review erstellen
            list_id = context.get("list_id")
            task_ids = dict(context.get("task_ids", {}))
            if list_id:
                if task_ids.get("strategy_review"):
                    comment = "✅ Strategie & Brand fertiggestellt:\n\n"
                    for name, url in STRATEGY_DOCS.items():
                        comment += f"• {name}: {url}\n"
                    await _complete_task(task_ids["strategy_review"], comment)
                # Task 5: Copy-Review
                lead_id = context.get("lead_id", "")
                folder_root_id = context.get("folder_root_id", "")
                close_url = f"https://app.close.com/lead/{lead_id}/" if lead_id else ""
                drive_url = f"https://drive.google.com/drive/folders/{folder_root_id}" if folder_root_id else ""
                desc = "Alle Texte (Landingpage, Anzeigen, Videoskript) auf Basis der Strategie reviewen.\n\n"
                desc += "Ressourcen:\n"
                for name, url in STRATEGY_DOCS.items():
                    desc += f"- {name}: {url}\n"
                if drive_url: desc += f"- Google Drive (Texte): {drive_url}\n"
                if close_url: desc += f"- Close Deal: {close_url}\n"
                t = await _create_task(
                    list_id, "Copy-Review", desc,
                    [CLICKUP_CLAUDIO], 2, 4,  # High, +4 Tage
                    [
                        "Landingpage Hero: Mind. 3 Headline-Varianten vorhanden",
                        "Landingpage: Benefits-Section mit konkreten Arbeitgeber-Vorteilen",
                        "Landingpage: Team-Section und Testimonials vorhanden",
                        "Landingpage: FAQ vollständig und relevant",
                        "Formularseite: Felder, Labels, Placeholders korrekt",
                        "Formularseite: Datenschutz-Hinweis vorhanden",
                        "Dankeseite: Bestätigung und nächste Schritte klar",
                        "Anzeigentexte: 5 Varianten (PAS, AIDA, Social Proof, Frage, Statistik)",
                        "Videoskript: Hook-Problem-Lösung-CTA Struktur (60s)",
                        "Retargeting-Variationen: Reminder, Objection-Handling, Urgency, FOMO",
                        "Alle Texte konsistent mit Messaging-Matrix und Tone of Voice",
                    ],
                )
                task_ids["copy_review"] = t["id"]
                result["task_ids"] = task_ids
            # Slack: Strategie fertig
            company = context.get("company", "Novacode GmbH")
            folder_root_id_slack = context.get("folder_root_id", "")
            drive_url_slack = f"https://drive.google.com/drive/folders/{folder_root_id_slack}" if folder_root_id_slack else ""
            blocks = _slack_blocks_message(
                f":dart: Strategie & Brand — {company}",
                [
                    {"text": "5 Dokumente erstellt und freigegeben:"},
                    {"items": [(name, url) for name, url in STRATEGY_DOCS.items()], "emoji": ":blue_book:"},
                ],
                buttons=([("Drive öffnen", drive_url_slack, "primary")] if drive_url_slack else []),
                footer=":zap: Flowstack Automation | Strategie abgeschlossen",
            )
            await slack_message(f"Strategie & Brand fertiggestellt — {company}", blocks=blocks, color=SLACK_COLOR_SUCCESS)

        # ── Copy Creation ──
        elif node_id == "cc05":
            result = await update_close_stage({
                **context,
                "stage": "Assets erstellt",
                "automation_status": "Assets erstellt",
            })
            # ClickUp: Copy-Review abschließen + Pixel/Funnel-Tasks erstellen
            list_id = context.get("list_id")
            task_ids = dict(context.get("task_ids", {}))
            if list_id:
                if task_ids.get("copy_review"):
                    comment = "✅ Texte fertiggestellt und freigegeben:\n\n"
                    for name, url in COPY_DOCS.items():
                        comment += f"• {name}: {url}\n"
                    await _complete_task(task_ids["copy_review"], comment)
                # URLs
                ads_url = f"https://adsmanager.facebook.com/adsmanager/manage/campaigns?act={META_AD_ACCOUNT}" if META_AD_ACCOUNT else ""
                events_url = f"https://business.facebook.com/events_manager2/list/pixel/{META_PIXEL_ID}/overview" if META_PIXEL_ID else ""
                # Task 6: Meta-Pixel & Domain einrichten
                desc = "Meta Pixel auf dem Recruiting-Funnel installieren und Conversion-Events konfigurieren.\n\n"
                desc += "Ressourcen:\n"
                for name, url in FUNNEL_LINKS.items():
                    desc += f"- {name}: {url}\n"
                if events_url: desc += f"- Meta Events Manager: {events_url}\n"
                if ads_url: desc += f"- Meta Ads Manager: {ads_url}\n"
                t = await _create_task(
                    list_id, "Meta-Pixel & Domain einrichten", desc,
                    [CLICKUP_ANAK], 2, 4,  # High, +4 Tage
                    [
                        f"Meta Pixel ID korrekt: {META_PIXEL_ID}" if META_PIXEL_ID else "Meta Pixel ID korrekt",
                        "Pixel Base Code im <head> aller Funnel-Seiten installiert",
                        "ViewContent Event feuert auf Landingpage",
                        "AddToCart Event feuert auf Bewerbungsseite",
                        "Lead Event feuert auf Dankeseite",
                        "Alle 3 Events im Meta Events Manager sichtbar (Test-Events senden)",
                        "Domain im Business Manager verifiziert",
                        "Aggregated Event Measurement: Lead-Event auf Priorität 1",
                        "Tracking Sheet vorbereitet (Google Spreadsheet)",
                    ],
                )
                task_ids["pixel_setup"] = t["id"]
                # Task 7: Funnel- & Pixel-Review
                desc2 = "Recruiting-Funnel und Pixel-Setup auf Qualität und Funktionalität prüfen.\n\n"
                desc2 += "Ressourcen:\n"
                for name, url in FUNNEL_LINKS.items():
                    desc2 += f"- {name}: {url}\n"
                if events_url: desc2 += f"- Meta Events Manager: {events_url}\n"
                desc2 += f"- Tracking Sheet: {TRACKING_SHEET}\n"
                desc2 += f"- Tracking Dashboard: {TRACKING_DASHBOARD}\n"
                t = await _create_task(
                    list_id, "Funnel- & Pixel-Review", desc2,
                    [CLICKUP_CLAUDIO, CLICKUP_ANAK], 2, 4,  # High, +4 Tage
                    [
                        "Landingpage: Desktop-Layout korrekt (Hero, Benefits, Team, FAQ, CTA)",
                        "Landingpage: Mobile-Layout korrekt (responsive)",
                        "Landingpage: Alle Links und CTAs funktionieren",
                        "Landingpage: Ladezeit unter 3 Sekunden",
                        "Bewerbungsseite: Formular-Validierung getestet",
                        "Bewerbungsseite: Datenschutz-Checkbox vorhanden",
                        "Bewerbungsseite: Submit leitet korrekt auf Dankeseite weiter",
                        "Dankeseite: Bestätigungstext und nächste Schritte sichtbar",
                        "OG-Image und Meta-Tags korrekt gesetzt",
                        "Pixel: ViewContent, AddToCart, Lead im Events Manager verifiziert",
                        "Tracking Sheet: Test-Eintrag im Spreadsheet vorhanden",
                    ],
                )
                task_ids["funnel_review"] = t["id"]
                result["task_ids"] = task_ids
            # Slack: Copy fertig
            company = context.get("company", "Novacode GmbH")
            folder_root_id_slack = context.get("folder_root_id", "")
            drive_url_slack = f"https://drive.google.com/drive/folders/{folder_root_id_slack}" if folder_root_id_slack else ""
            blocks = _slack_blocks_message(
                f":pencil2: Copy & Texte — {company}",
                [
                    {"text": "6 Dokumente erstellt:"},
                    {"items": [(name, url) for name, url in COPY_DOCS.items()], "emoji": ":ledger:"},
                ],
                buttons=([("Drive öffnen", drive_url_slack, "primary")] if drive_url_slack else []),
                footer=":zap: Flowstack Automation | Copy abgeschlossen",
            )
            await slack_message(f"Copy Assets fertiggestellt — {company}", blocks=blocks, color=SLACK_COLOR_SUCCESS)

        # ── Review & Launch ──
        elif node_id == "rl06":
            company = context.get("company", "Novacode GmbH")
            lead_id_rl = context.get("lead_id", "")
            close_url_rl = f"https://app.close.com/lead/{lead_id_rl}/" if lead_id_rl else ""
            list_id_rl = context.get("list_id", "")
            clickup_url_rl = f"https://app.clickup.com/{CLICKUP_SPACE_ID}/l/{list_id_rl}" if list_id_rl else ""
            blocks = _slack_blocks_message(
                f":package: Asset-Paket bereit — {company}",
                [
                    {"title": ":dart: Strategie", "items": [
                        (name, url) for name, url in STRATEGY_DOCS.items()
                    ], "emoji": ":blue_book:"},
                    {"title": ":pencil2: Texte", "items": [
                        (name, url) for name, url in COPY_DOCS.items()
                    ], "emoji": ":ledger:"},
                    {"title": ":globe_with_meridians: Funnel & Tracking", "items": [
                        (name, url) for name, url in FUNNEL_LINKS.items()
                    ] + [("Tracking Sheet", TRACKING_SHEET), ("Tracking Dashboard", TRACKING_DASHBOARD)], "emoji": ":link:"},
                ],
                buttons=[
                    ("Funnel ansehen", FUNNEL_LINKS.get("Landingpage", ""), "primary"),
                ] + ([("ClickUp", clickup_url_rl)] if clickup_url_rl else [])
                  + ([("Close CRM", close_url_rl)] if close_url_rl else []),
                footer=":zap: Flowstack Automation | Finale Freigabe steht aus",
            )
            await slack_message(f"Asset-Paket bereit — {company}", blocks=blocks, color=SLACK_COLOR_WARNING)
            result = {"sent": True, "url": "https://app.slack.com/"}

        elif node_id == "rl07":
            result = await update_close_stage({
                **context,
                "stage": "Warte auf Freigabe",
                "automation_status": "Warte auf Freigabe",
            })
            # ClickUp: Zielgruppen-QA + Kampagnen-Review erstellen
            list_id = context.get("list_id")
            task_ids = dict(context.get("task_ids", {}))
            if list_id:
                ads_url = f"https://adsmanager.facebook.com/adsmanager/manage/campaigns?act={META_AD_ACCOUNT}" if META_AD_ACCOUNT else ""
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
                # Task 9: Kampagnen-Review
                desc2 = "Alle 3 Meta-Kampagnen (Kaltakquise, Retargeting, Warmup) vor Launch prüfen.\n\n"
                desc2 += "Ressourcen:\n"
                if ads_url: desc2 += f"- Meta Ads Manager: {ads_url}\n"
                desc2 += f"- Anzeigentexte: {COPY_DOCS.get('Anzeigentexte', '')}\n"
                desc2 += f"- Anzeigen-Variationen: {COPY_DOCS.get('Anzeigen-Variationen', '')}\n"
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
                        "TOF: CTA 'Jetzt bewerben', Ziel-URL = Bewerbungsseite",
                        "RT: 3 Ad Sets mit je einer Custom Audience verknüpft",
                        "RT: Budget 5-10 EUR/Tag pro Ad Set",
                        "RT: Placement Auto",
                        "RT: Creatives = Reminder, Objection-Handling, Urgency",
                        "WU: Objective = Video Views (Awareness)",
                        "WU: Budget 5-10 EUR/Tag",
                        "Alle Anzeigentexte korrekt (keine Tippfehler)",
                        "Alle Bilder/Videos hochgeladen und zugewiesen",
                        "Ziel-URLs korrekt (Landingpage für TOF, Formular für RT)",
                    ],
                )
                task_ids["campaign_review"] = t["id"]
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
            # ClickUp: Alle offenen Tasks abschließen + Monitoring-Task erstellen
            list_id = context.get("list_id")
            task_ids = dict(context.get("task_ids", {}))
            ads_url = f"https://adsmanager.facebook.com/adsmanager/manage/campaigns?act={META_AD_ACCOUNT}" if META_AD_ACCOUNT else ""
            if task_ids.get("pixel_setup"):
                comment = "✅ Pixel & Tracking eingerichtet:\n\n"
                for name, url in FUNNEL_LINKS.items():
                    comment += f"• {name}: {url}\n"
                await _complete_task(task_ids["pixel_setup"], comment)
            if task_ids.get("funnel_review"):
                comment = "✅ Funnel geprüft und freigegeben:\n\n"
                for name, url in FUNNEL_LINKS.items():
                    comment += f"• {name}: {url}\n"
                await _complete_task(task_ids["funnel_review"], comment)
            if task_ids.get("audience_qa"):
                await _complete_task(task_ids["audience_qa"], "✅ Alle Custom Audiences aktiv und korrekt zugewiesen.")
            if task_ids.get("campaign_review"):
                comment = "✅ Alle Kampagnen geprüft und aktiviert.\n\n"
                if ads_url: comment += f"Meta Ads Manager: {ads_url}"
                await _complete_task(task_ids["campaign_review"], comment)
            # Task 10: Erste Woche Monitoring
            if list_id:
                company = context.get("company", "Novacode GmbH")
                lead_id = context.get("lead_id", "")
                close_url = f"https://app.close.com/lead/{lead_id}/" if lead_id else ""
                desc = f"Kampagnen-Performance in der ersten Woche nach Launch überwachen.\n\n"
                desc += "Ressourcen:\n"
                if ads_url: desc += f"- Meta Ads Manager: {ads_url}\n"
                desc += f"- Tracking Sheet: {TRACKING_SHEET}\n"
                desc += f"- Tracking Dashboard: {TRACKING_DASHBOARD}\n"
                desc += f"- Funnel: {FUNNEL_LINKS.get('Landingpage', '')}\n"
                if close_url: desc += f"- Close Deal: {close_url}\n"
                t = await _create_task(
                    list_id, f"Erste Woche Monitoring - {company}", desc,
                    [CLICKUP_CLAUDIO, CLICKUP_ANAK], 2, 7,  # High, +7 Tage
                    [
                        "Tag 1: Kampagnen-Status 'Aktiv' im Ads Manager bestätigt",
                        "Tag 1: Anzeigenauslieferung gestartet (Impressions > 0)",
                        "Tag 2: CPM und CTR im normalen Bereich (CPM < 15 EUR, CTR > 0.5%)",
                        "Tag 3: Erste Leads/Bewerbungen eingegangen prüfen",
                        "Tag 3: Tracking Sheet mit echten Daten aktualisiert",
                        "Tag 5: Budget-Pacing prüfen (Tagesbudget wird ausgeschöpft)",
                        "Tag 7: Performance-Report erstellen (KPIs: CPC, CPL, CTR, Conversions)",
                        "Tag 7: Underperformer identifizieren und pausieren",
                        "Tag 7: Kunde über erste Ergebnisse informieren",
                    ],
                )
                task_ids["monitoring"] = t["id"]
                result["task_ids"] = task_ids

        elif node_id == "rl12":
            company = context.get("company", "Novacode GmbH")
            launch_date = datetime.now().strftime('%d.%m.%Y %H:%M')
            acct = _meta_acct()
            ads_url = f"https://adsmanager.facebook.com/adsmanager/manage/campaigns?act={META_AD_ACCOUNT}"
            cname = company.replace(" ", "_")
            blocks = _slack_blocks_message(
                f":rocket: {company} Recruiting ist LIVE!",
                [
                    {"text": "3 Kampagnen aktiviert:"},
                    {"items": [
                        f"TOF | Leads | DE | {cname}",
                        f"RT | Leads | DE | {cname}",
                        f"WU | Awareness | DE | {cname}",
                    ]},
                ],
                buttons=[
                    ("Meta Ads Manager", ads_url, "primary"),
                    ("Funnel ansehen", FUNNEL_LINKS.get("Landingpage", "")),
                    ("Tracking Dashboard", TRACKING_DASHBOARD),
                ],
                footer=f":zap: Flowstack Automation | Alle Kampagnen live | {launch_date}",
            )
            await slack_message(f"{company} Recruiting ist LIVE!", blocks=blocks, color=SLACK_COLOR_SUCCESS)
            result = {"sent": True, "url": "https://app.slack.com/"}

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
                    payload["subtype"] = "WEBSITE"
                    payload["rule"] = rule
                    payload["retention_days"] = retention
                    payload["pixel_id"] = META_PIXEL_ID
                    payload["prefill"] = True
                else:
                    payload["subtype"] = "CUSTOM"
                    payload["customer_file_source"] = "USER_PROVIDED_ONLY"
                resp_data = await meta_api("POST", f"{acct}/customaudiences", payload)
                meta_audiences_url = f"https://adsmanager.facebook.com/adsmanager/manage/audiences?act={META_AD_ACCOUNT}"
                result = {"audience_id": resp_data.get("id"), "name": name, "url": meta_audiences_url}
                log.info(f"Meta Audience erstellt: {name} ({resp_data.get('id')})")
            except Exception as e:
                log.warning(f"Meta Audience {name} übersprungen: {e}")
                result = {"name": name, "note": "Audience-Erstellung übersprungen"}

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
                ads_url = f"https://adsmanager.facebook.com/adsmanager/manage/campaigns?act={META_AD_ACCOUNT}"
                result = {
                    "campaign_id": cid,
                    "meta_campaigns": meta_campaigns,
                    "image_hashes": image_hashes,
                    "url": ads_url,
                }
                log.info(f"Meta Initial-Kampagne erstellt: {cid}, {len(image_hashes)} Bilder hochgeladen")
            except Exception as e:
                log.error(f"Meta ca04 Initial-Kampagne fehlgeschlagen: {e}")
                result = {"error": str(e), "image_hashes": [], "meta_campaigns": dict(context.get("meta_campaigns", {})), "url": f"https://adsmanager.facebook.com/adsmanager/manage/campaigns?act={META_AD_ACCOUNT}"}

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
                    destination_url = "https://demo-recruiting.vercel.app/demo-formular"

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
                    ads_url = f"https://adsmanager.facebook.com/adsmanager/manage/campaigns?act={META_AD_ACCOUNT}"
                    result = {"adset_ids": adset_ids, "count": len(adset_ids), "url": ads_url}
                    log.info(f"Meta Initial Ad Sets + Ads erstellt: {adset_ids}")
                except Exception as e:
                    log.error(f"Meta ca05 Initial Ad Sets fehlgeschlagen: {e}")
                    result = {"error": str(e), "url": f"https://adsmanager.facebook.com/adsmanager/manage/campaigns?act={META_AD_ACCOUNT}"}


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
                ads_url = f"https://adsmanager.facebook.com/adsmanager/manage/campaigns?act={META_AD_ACCOUNT}"
                result = {"campaign_id": cid, "meta_campaigns": meta_campaigns, "url": ads_url}
                log.info(f"Meta Retargeting-Kampagne erstellt: {cid}")
            except Exception as e:
                log.error(f"Meta ca06 Retargeting-Kampagne fehlgeschlagen: {e}")
                result = {"error": str(e), "meta_campaigns": dict(context.get("meta_campaigns", {})), "url": f"https://adsmanager.facebook.com/adsmanager/manage/campaigns?act={META_AD_ACCOUNT}"}

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
                    ads_url = f"https://adsmanager.facebook.com/adsmanager/manage/campaigns?act={META_AD_ACCOUNT}"
                    result = {"adset_ids": adset_ids, "count": len(adset_ids), "url": ads_url}
                    log.info(f"Meta Retargeting Ad Sets + Ads erstellt: {adset_ids}")
                except Exception as e:
                    log.error(f"Meta ca07 Retargeting Ad Sets fehlgeschlagen: {e}")
                    result = {"error": str(e), "url": f"https://adsmanager.facebook.com/adsmanager/manage/campaigns?act={META_AD_ACCOUNT}"}


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
                ads_url = f"https://adsmanager.facebook.com/adsmanager/manage/campaigns?act={META_AD_ACCOUNT}"
                result = {"campaign_id": cid, "meta_campaigns": meta_campaigns, "url": ads_url}
                log.info(f"Meta Warmup-Kampagne erstellt: {cid}")
            except Exception as e:
                log.error(f"Meta ca08 Warmup-Kampagne fehlgeschlagen: {e}")
                result = {"error": str(e), "meta_campaigns": dict(context.get("meta_campaigns", {})), "url": f"https://adsmanager.facebook.com/adsmanager/manage/campaigns?act={META_AD_ACCOUNT}"}

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
                    ads_url = f"https://adsmanager.facebook.com/adsmanager/manage/campaigns?act={META_AD_ACCOUNT}"
                    result = {"adset_ids": [adset_id], "count": 1, "url": ads_url}
                    log.info(f"Meta Warmup Ad Set + Ads erstellt: {adset_id}")
                except Exception as e:
                    log.error(f"Meta ca09 Warmup Ad Sets fehlgeschlagen: {e}")
                    result = {"error": str(e), "url": f"https://adsmanager.facebook.com/adsmanager/manage/campaigns?act={META_AD_ACCOUNT}"}


        else:
            return {"ok": True, "result": None, "message": f"Kein Side-Effect für {node_id}"}

    except Exception as e:
        log.error(f"Side-Effect für {node_id} fehlgeschlagen: {e}")
        return {"ok": False, "error": str(e)}

    return {"ok": True, "result": result}


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

    # Close CRM Lead löschen (Opportunity wird mit-gelöscht da sie zum Lead gehört)
    if lead_id:
        try:
            await close_api("DELETE", f"/lead/{lead_id}/")
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3002)
