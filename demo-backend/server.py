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
    allow_origins=["http://localhost:5173", "http://localhost:4173"],
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
    return resp.json()


def _slack_link(url: str, label: str) -> str:
    """Slack mrkdwn Link-Alias: <url|Label>."""
    return f"<{url}|{label}>"


def _slack_blocks_message(header: str, sections: list[dict[str, Any]], footer: str = "") -> list[dict]:
    """Block Kit Nachricht mit Header, kategorisierten Sections und optionalem Footer.

    sections: [{"title": "Kategorie", "items": [("Label", "url_or_text"), ...]}]
    """
    blocks: list[dict] = [
        {"type": "header", "text": {"type": "plain_text", "text": header}},
        {"type": "divider"},
    ]
    for sec in sections:
        title = sec.get("title", "")
        items = sec.get("items", [])
        if title:
            blocks.append({"type": "section", "text": {"type": "mrkdwn", "text": f"*{title}*"}})
        # Items als 2-Spalten Fields (Label | Link)
        if items and all(isinstance(i, tuple) and len(i) == 2 for i in items):
            fields: list[dict] = []
            for label, value in items:
                if value.startswith("http"):
                    fields.append({"type": "mrkdwn", "text": f"{_slack_link(value, label)}"})
                else:
                    fields.append({"type": "mrkdwn", "text": f"*{label}:* {value}"})
            # Section fields max 10, batch if needed
            for i in range(0, len(fields), 10):
                blocks.append({"type": "section", "fields": fields[i:i+10]})
        elif items:
            text = "\n".join(str(i) for i in items)
            blocks.append({"type": "section", "text": {"type": "mrkdwn", "text": text}})
        blocks.append({"type": "divider"})
    if footer:
        blocks.append({"type": "context", "elements": [{"type": "mrkdwn", "text": footer}]})
    return blocks


async def slack_message(text: str, blocks: Optional[list] = None) -> bool:
    """Slack Incoming Webhook nachricht senden (Ops-Channel)."""
    if not SLACK_WEBHOOK:
        log.warning("Kein Slack Webhook konfiguriert")
        return False
    payload: dict[str, Any] = {"text": text}
    if blocks:
        payload["blocks"] = blocks
    resp = await _http.post(SLACK_WEBHOOK, json=payload)
    if resp.status_code != 200:
        log.error(f"Slack Webhook fehlgeschlagen: {resp.status_code} {resp.text}")
    return resp.status_code == 200


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


async def create_meta_ads(
    acct: str,
    adset_id: str,
    image_hashes: list[str],
    copy_texts: list[str],
    company: str,
    destination_url: str,
    cta_type: str = "APPLY_NOW",
) -> list[str]:
    """Ads erstellen: 1 Ad pro Bild, alle mit dem gleichen Copy-Text."""
    if not META_PAGE_ID:
        log.warning("Kein META_PAGE_ID — Ads-Erstellung übersprungen")
        return []
    ad_ids: list[str] = []
    copy_text = copy_texts[0].format(company=company) if copy_texts else f"Jetzt bewerben bei {company}!"
    for i, img_hash in enumerate(image_hashes):
        creative = await meta_api("POST", f"{acct}/adcreatives", {
            "name": f"Creative_{i+1}_{adset_id[:8]}",
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
            "name": f"Ad_{i+1}_{adset_id[:8]}",
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
    opp_id = body["opportunity_id"]
    stage = body["stage"]
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
        "01_Administration",
        "02_Strategy",
        "03_Copy",
        "04_Creatives",
        "05_Funnel",
        "06_Ads",
        "07_Tracking",
        "08_Transcripts",
    ]

    created = {}
    for name in subfolders:
        folder = await google_api("POST", "https://www.googleapis.com/drive/v3/files", {
            "name": name,
            "mimeType": "application/vnd.google-apps.folder",
            "parents": [root_id],
        })
        created[name] = folder["id"]

    # Zusätzliche Unterordner für 02_Strategy
    strategy_subs = [
        "Target_Audience_Avatar",
        "Employer_Avatar",
        "Messaging_Framework",
        "Creative_Brief",
        "Brand_Design_Guidelines",
    ]
    for name in strategy_subs:
        await google_api("POST", "https://www.googleapis.com/drive/v3/files", {
            "name": name,
            "mimeType": "application/vnd.google-apps.folder",
            "parents": [created["02_Strategy"]],
        })

    # Unterordner für 04_Creatives
    for name in ["Raw_Uploads", "Edited_Creatives", "Final_Ads"]:
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
    subject = f"Willkommen bei Flowstack — Ihr Recruiting Kickoff ({company})"
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

    # List direkt im Space erstellen (folderless)
    result = await clickup_api("POST", f"/space/{CLICKUP_SPACE_ID}/list", {
        "name": f"{company} - Recruiting",
        "content": f"Fulfillment-Projekt für {company}. Automatisch erstellt.",
    })
    list_id = result["id"]
    log.info(f"ClickUp List erstellt: {list_id}")
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
    """is09: Erste ClickUp Tasks erstellen (Zugänge + Kickoff)."""
    list_id = body["list_id"]
    task_ids: dict[str, str] = {}

    t = await _create_task(
        list_id,
        "Zugänge verifizieren",
        "Alle technischen Zugänge für das Recruiting-Projekt prüfen und dokumentieren.",
        [CLICKUP_ANAK], 1, 2,  # Urgent, +2 Tage
        [
            "Meta Business Manager Zugang bestätigen",
            "Meta Ad Account Zugang bestätigen",
            "Meta Pixel vorhanden bestätigen",
            "Website/CMS Zugang bestätigen",
            "Domain/DNS Zugang (falls nötig)",
            "Technischer Ansprechpartner bekannt",
            "Fehlende Zugänge dokumentieren",
        ],
    )
    task_ids["zugaenge"] = t["id"]

    t = await _create_task(
        list_id,
        "Kickoff vorbereiten",
        "Internes Briefing und Kickoff-Leitfaden für den Kundencall vorbereiten.",
        [CLICKUP_CLAUDIO], 2, 3,  # High, +3 Tage
        [
            "Close Deal-Notizen lesen",
            "Onboarding-Formular prüfen",
            "Recruiting Kickoff-Leitfaden öffnen",
            "Schlüsselfragen an Client anpassen",
            "Brand & Design Fragen vorbereiten",
        ],
    )
    task_ids["kickoff"] = t["id"]

    log.info(f"ClickUp Tasks erstellt: {task_ids}")
    return {"tasks": [{"id": v, "name": k} for k, v in task_ids.items()], "task_ids": task_ids, "url": f"https://app.clickup.com/{CLICKUP_SPACE_ID}/l/{list_id}"}


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
                f"Neuer Client: {company}",
                [
                    {"title": ":clipboard: Projekt-Details", "items": [
                        ("Service", "Recruiting Automation"),
                        ("Account Manager", "Claudio Di Franco"),
                        ("Status", "Automation gestartet"),
                    ]},
                    {"title": ":link: Verknüpfungen", "items": [
                        ("Lead in Close CRM", lead_url),
                    ]},
                ],
                footer=f"Flowstack Automation | {datetime.now().strftime('%d.%m.%Y %H:%M')}",
            )
            await slack_message(f"Neuer Client: {company}", blocks=blocks)
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
                # Willkommensnachricht im Kunden-Channel
                await slack_bot_api("chat.postMessage", {
                    "channel": channel_id,
                    "text": (
                        f"👋 *Willkommen im Projekt-Channel, {company}!*\n\n"
                        f"Hier koordinieren wir alles rund um euer Recruiting-Projekt.\n\n"
                        f"*Euer Team:*\n"
                        f"• Claudio Di Franco — Account Manager & Strategie\n"
                        f"• Anak — Development & Technik\n\n"
                        f"Bei Fragen einfach hier schreiben — wir sind für euch da! 🚀"
                    ),
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
                f"Kickoff-Termin erstellt — {company}",
                [{"title": ":calendar: Termin", "items": [
                    ("Kalender-Event öffnen", event_link),
                ] + ([("Google Meet beitreten", meet_link)] if meet_link else [])}],
                footer="Einladung an Client gesendet",
            )
            await slack_message(f"Kickoff-Termin erstellt — {company}", blocks=blocks)

        elif node_id == "is06":
            result = await create_drive_folders(context)
            # Slack: Drive-Ordner erstellt
            folder_url = result.get("url", "")
            if folder_url:
                company = context.get("company", "Novacode GmbH")
                blocks = _slack_blocks_message(
                    f"Google Drive — {company}",
                    [{"title": ":file_folder: Ordnerstruktur", "items": [
                        ("Projektordner öffnen", folder_url),
                    ]}],
                    footer="8 Hauptordner + Unterordner angelegt und geteilt",
                )
                await slack_message(f"Google Drive Ordner erstellt — {company}", blocks=blocks)

        elif node_id == "is08":
            result = await create_clickup_project(context)

        elif node_id == "is09":
            list_id = context.get("list_id")
            if list_id:
                result = await create_clickup_tasks({"list_id": list_id})
                # Slack: ClickUp Tasks erstellt
                company = context.get("company", "Novacode GmbH")
                clickup_url = f"https://app.clickup.com/{CLICKUP_SPACE_ID}/l/{list_id}"
                blocks = _slack_blocks_message(
                    f"ClickUp Projekt — {company}",
                    [{"title": ":white_check_mark: Projektmanagement", "items": [
                        ("Projekt in ClickUp öffnen", clickup_url),
                    ]},
                    {"title": ":memo: Erstellte Tasks", "items": [
                        ("Zugänge verifizieren", "Offen"),
                        ("Kickoff vorbereiten", "Offen"),
                    ]}],
                    footer="Automatisch erstellt via Flowstack Automation",
                )
                await slack_message(f"ClickUp Projekt erstellt — {company}", blocks=blocks)

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
            # ClickUp: Kickoff-Task abschließen + Strategie-Task erstellen
            list_id = context.get("list_id")
            task_ids = dict(context.get("task_ids", {}))
            if list_id:
                if task_ids.get("kickoff"):
                    await _complete_task(
                        task_ids["kickoff"],
                        f"✅ Kickoff abgeschlossen.\nTranskript: {TRANSCRIPT_DOC}",
                    )
                t = await _create_task(
                    list_id,
                    "Strategie & Brand erstellen",
                    "Zielgruppen-Analyse, Arbeitgeber-Positionierung, Messaging, Creative Brief und Brand Guidelines erstellen.",
                    [CLICKUP_CLAUDIO], 2, 5,  # High, +5 Tage
                    [
                        "Zielgruppen-Avatar erstellen",
                        "Arbeitgeber-Avatar erstellen",
                        "Messaging-Matrix erstellen",
                        "Creative Briefing erstellen",
                        "Marken-Richtlinien erstellen",
                    ],
                )
                task_ids["strategy"] = t["id"]
                result["task_ids"] = task_ids

        elif node_id == "kc06":
            company = context.get("company", "Novacode GmbH")
            blocks = _slack_blocks_message(
                f"Kickoff abgeschlossen — {company}",
                [{"title": ":phone: Kickoff", "items": [
                    ("Transkript ansehen", TRANSCRIPT_DOC),
                ]},
                {"title": ":arrow_forward: Nächster Schritt", "items": [
                    "Strategie-Erstellung startet automatisch",
                ]}],
            )
            await slack_message(f"Kickoff abgeschlossen — {company}", blocks=blocks)
            result = {"sent": True, "url": "https://app.slack.com/"}

        # ── Strategy & Brand ──
        elif node_id == "st10":
            result = await update_close_stage({
                **context,
                "stage": "Strategie erstellt",
                "automation_status": "Strategie erstellt",
            })
            # ClickUp: Strategie-Task abschließen + Docs verlinken + Copy-Task erstellen
            list_id = context.get("list_id")
            task_ids = dict(context.get("task_ids", {}))
            if list_id:
                if task_ids.get("strategy"):
                    comment = "✅ Strategie & Brand fertiggestellt:\n"
                    for name, url in STRATEGY_DOCS.items():
                        comment += f"• {name}: {url}\n"
                    await _complete_task(task_ids["strategy"], comment)
                t = await _create_task(
                    list_id,
                    "Texte erstellen",
                    "Landingpage-Texte, Anzeigentexte, Videoskript und Variationen auf Basis der Strategie erstellen.",
                    [CLICKUP_CLAUDIO], 2, 4,  # High, +4 Tage
                    [
                        "Landingpage-Texte (Hero, Benefits, Team, FAQ)",
                        "Formularseite-Texte",
                        "Dankeseite-Texte",
                        "Anzeigentexte (5 Varianten)",
                        "Videoskript (60s)",
                        "Retargeting-Variationen",
                    ],
                )
                task_ids["copy"] = t["id"]
                result["task_ids"] = task_ids
            # Slack: Strategie fertig
            company = context.get("company", "Novacode GmbH")
            blocks = _slack_blocks_message(
                f"Strategie & Brand — {company}",
                [{"title": ":dart: Strategie-Dokumente", "items": [
                    (name, url) for name, url in STRATEGY_DOCS.items()
                ]}],
                footer="Alle Dokumente erstellt und freigegeben",
            )
            await slack_message(f"Strategie & Brand fertiggestellt — {company}", blocks=blocks)

        # ── Copy Creation ──
        elif node_id == "cc05":
            result = await update_close_stage({
                **context,
                "stage": "Assets erstellt",
                "automation_status": "Assets erstellt",
            })
            # ClickUp: Copy-Task abschließen + Docs verlinken + Funnel/Tracking/Kampagnen-Tasks erstellen
            list_id = context.get("list_id")
            task_ids = dict(context.get("task_ids", {}))
            if list_id:
                if task_ids.get("copy"):
                    comment = "✅ Texte fertiggestellt:\n"
                    for name, url in COPY_DOCS.items():
                        comment += f"• {name}: {url}\n"
                    await _complete_task(task_ids["copy"], comment)
                t = await _create_task(
                    list_id,
                    "Funnel bauen & deployen",
                    "Recruiting-Funnel mit Landingpage, Bewerbungsformular und Dankeseite auf Vercel deployen.",
                    [CLICKUP_ANAK], 2, 4,  # High, +4 Tage
                    [
                        "Template auswählen & konfigurieren",
                        "Copy einsetzen",
                        "Design an Brand anpassen",
                        "Website bauen & deployen",
                        "Alle Seiten testen",
                    ],
                )
                task_ids["funnel"] = t["id"]
                t = await _create_task(
                    list_id,
                    "Pixel & Tracking einrichten",
                    "Meta Pixel installieren, Conversion-Events konfigurieren, Tracking-Dashboard einrichten.",
                    [CLICKUP_ANAK], 3, 4,  # Normal, +4 Tage
                    [
                        "Meta Pixel installieren",
                        "ViewContent Event (Landingpage)",
                        "AddToCart Event (Formular)",
                        "Lead Event (Dankeseite)",
                        "Tracking Dashboard prüfen",
                    ],
                )
                task_ids["tracking"] = t["id"]
                t = await _create_task(
                    list_id,
                    "Kampagnen-Setup",
                    "Zielgruppen erstellen, 3 Meta-Kampagnen (Kaltakquise, Retargeting, Warmup) konfigurieren.",
                    [CLICKUP_CLAUDIO], 2, 6,  # High, +6 Tage
                    [
                        "Custom Audiences erstellen",
                        "Kaltakquise-Kampagne konfigurieren",
                        "Retargeting-Kampagne konfigurieren",
                        "Warmup-Kampagne konfigurieren",
                        "Anzeigengruppen & Budgets prüfen",
                    ],
                )
                task_ids["campaigns"] = t["id"]
                result["task_ids"] = task_ids
            # Slack: Copy fertig
            company = context.get("company", "Novacode GmbH")
            blocks = _slack_blocks_message(
                f"Copy & Texte — {company}",
                [{"title": ":pencil2: Erstellte Texte", "items": [
                    (name, url) for name, url in COPY_DOCS.items()
                ]}],
                footer="Alle Texte auf Basis der Strategie erstellt",
            )
            await slack_message(f"Copy Assets fertiggestellt — {company}", blocks=blocks)

        # ── Review & Launch ──
        elif node_id == "rl06":
            company = context.get("company", "Novacode GmbH")
            blocks = _slack_blocks_message(
                f"Asset-Paket bereit zur Freigabe — {company}",
                [
                    {"title": ":dart: Strategie-Dokumente", "items": [
                        (name, url) for name, url in STRATEGY_DOCS.items()
                    ] + [("Pain-Point-Matrix", "https://docs.google.com/document/d/1RfNMSovKZx43uHrKDNa8G6iBCi_ouRTfShVuoLcuUac/edit")]},
                    {"title": ":phone: Kickoff", "items": [
                        ("Kickoff-Transkript", TRANSCRIPT_DOC),
                    ]},
                    {"title": ":pencil2: Copy & Texte", "items": [
                        (name, url) for name, url in COPY_DOCS.items()
                    ]},
                    {"title": ":globe_with_meridians: Funnel", "items": [
                        (name, url) for name, url in FUNNEL_LINKS.items()
                    ]},
                    {"title": ":bar_chart: Tracking", "items": [
                        ("Tracking Dashboard", "https://docs.google.com/spreadsheets/d/1EmgdSqPPpouA20wY3OhMu1PGCA-Y_aCeztDHUF2zXeY/edit"),
                    ]},
                ],
                footer=":hourglass_flowing_sand: Finale Freigabe steht aus",
            )
            await slack_message(f"Asset-Paket bereit — {company}", blocks=blocks)
            result = {"sent": True, "url": "https://app.slack.com/"}

        elif node_id == "rl07":
            result = await update_close_stage({
                **context,
                "stage": "Warte auf Freigabe",
                "automation_status": "Warte auf Freigabe",
            })
            # ClickUp: Finale Prüfung & Go-Live Task erstellen
            list_id = context.get("list_id")
            task_ids = dict(context.get("task_ids", {}))
            if list_id:
                t = await _create_task(
                    list_id,
                    "Finale Prüfung & Go-Live",
                    "Alle Reviews bestätigen, finale Freigabe erteilen, Kampagnen aktivieren und Go-Live durchführen.",
                    [CLICKUP_CLAUDIO, CLICKUP_ANAK], 1, 2,  # Urgent, +2 Tage
                    [
                        "Strategie-Review bestätigen",
                        "Text-Review bestätigen",
                        "Funnel-Review bestätigen",
                        "Zielgruppen-QA bestätigen",
                        "Kampagnen-Review bestätigen",
                        "Finale Freigabe erteilen",
                        "Kampagnen aktivieren",
                    ],
                )
                task_ids["golive"] = t["id"]
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
            # ClickUp: Go-Live Task abschließen + Funnel-Links + Meta Ads Link
            task_ids = dict(context.get("task_ids", {}))
            if task_ids.get("golive"):
                comment = "🚀 Go-Live abgeschlossen!\n\nFunnel:\n"
                for name, url in FUNNEL_LINKS.items():
                    comment += f"• {name}: {url}\n"
                comment += "\nMeta Ads Manager: https://adsmanager.facebook.com/adsmanager/manage/campaigns?act=1282595205992969"
                await _complete_task(task_ids["golive"], comment)
            if task_ids.get("funnel"):
                comment = "✅ Funnel deployed:\n"
                for name, url in FUNNEL_LINKS.items():
                    comment += f"• {name}: {url}\n"
                await _complete_task(task_ids["funnel"], comment)
            if task_ids.get("tracking"):
                await _complete_task(task_ids["tracking"], "✅ Pixel & Tracking eingerichtet und geprüft.")
            if task_ids.get("campaigns"):
                await _complete_task(
                    task_ids["campaigns"],
                    "✅ Kampagnen konfiguriert und aktiviert.\n"
                    "Meta Ads Manager: https://adsmanager.facebook.com/adsmanager/manage/campaigns?act=1282595205992969",
                )

        elif node_id == "rl12":
            company = context.get("company", "Novacode GmbH")
            launch_date = datetime.now().strftime('%d.%m.%Y %H:%M')
            acct = _meta_acct()
            ads_url = f"https://adsmanager.facebook.com/adsmanager/manage/campaigns?act={META_AD_ACCOUNT}"
            cname = company.replace(" ", "_")
            blocks = _slack_blocks_message(
                f":rocket: {company} Recruiting ist LIVE!",
                [
                    {"title": ":clipboard: Launch-Details", "items": [
                        ("Datum", launch_date),
                        ("Status", "Alle Kampagnen aktiviert"),
                    ]},
                    {"title": ":mega: Meta Kampagnen", "items": [
                        (f"TOF | Leads | DE | {cname}", ads_url),
                        (f"RT | Leads | DE | {cname}", ads_url),
                        (f"WU | Awareness | DE | {cname}", ads_url),
                    ]},
                    {"title": ":globe_with_meridians: Funnel", "items": [
                        (name, url) for name, url in FUNNEL_LINKS.items()
                    ]},
                    {"title": ":bar_chart: Ads & Tracking", "items": [
                        ("Meta Ads Manager", ads_url),
                        ("Tracking Dashboard", "https://docs.google.com/spreadsheets/d/1EmgdSqPPpouA20wY3OhMu1PGCA-Y_aCeztDHUF2zXeY/edit"),
                        ("Performance Dashboard", "https://demo-recruiting.vercel.app/recruiting"),
                    ]},
                    {"title": ":open_file_folder: Alle Dokumente", "items": [
                        (name, url) for name, url in {**STRATEGY_DOCS, **COPY_DOCS}.items()
                    ] + [("Kickoff-Transkript", TRANSCRIPT_DOC)]},
                ],
                footer=f"Flowstack Automation | Launch {launch_date}",
            )
            await slack_message(f"{company} Recruiting ist LIVE!", blocks=blocks)
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
                                AD_COPY_INITIAL, company, destination_url, "APPLY_NOW",
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
                                AD_COPY_RETARGETING, company, destination_url, "APPLY_NOW",
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
                            acct, adset_id, image_hashes[:1],  # 1 Bild für Warmup
                            AD_COPY_WARMUP, company, destination_url, "LEARN_MORE",
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

    # Slack Channel archivieren (nicht löschen — kann bei Bedarf wiederhergestellt werden)
    if channel_id and SLACK_BOT_TOKEN:
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.post(
                    "https://slack.com/api/conversations.archive",
                    headers={"Authorization": f"Bearer {SLACK_BOT_TOKEN}"},
                    json={"channel": channel_id},
                )
                r = resp.json()
                if r.get("ok"):
                    deleted.append(f"slack_channel:{channel_id}")
                    log.info(f"Cleanup: Slack Channel {channel_id} archiviert")
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


# ══════════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3002)
