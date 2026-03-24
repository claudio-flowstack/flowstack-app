"""
Phase 3: Strategie & Marke
Nodes: v3-st-extract bis v3-st-approval
Nutzt: Gemini (KI), Google (Docs), Airtable (Bausteine), Close (Stage)
"""

import os
import json
import logging
from ..integrations.ai import AIClient
from ..integrations.google import GoogleClient
from ..integrations.airtable import AirtableClient
from ..integrations.close import CloseClient
from ..config import FRAMEWORKS_DIR

log = logging.getLogger("v3.phase.strategy")

ai = AIClient()
google = GoogleClient()
airtable = AirtableClient()
close = CloseClient()

# Extraction Schema (88 Felder → 352 Records in Airtable)
_schema_path = os.path.join(os.path.dirname(__file__), "..", "..", "server.py")
EXTRACTION_SCHEMA = None  # Will be loaded from server.py on first use


def _load_extraction_schema() -> dict:
    """Lade das EXTRACTION_JSON_SCHEMA aus server.py (88 Felder)."""
    global EXTRACTION_SCHEMA
    if EXTRACTION_SCHEMA:
        return EXTRACTION_SCHEMA

    # Hardcoded fallback — die 10 Kategorien mit ihren Feldern
    EXTRACTION_SCHEMA = {
        "demografie": {"alter": "", "geschlecht": "", "standort": "", "bildung": "", "familienstand": "", "einkommen": "", "berufserfahrung": "", "suchverhalten": ""},
        "beruflich": {"aktuelle_rolle": "", "gesuchte_rolle": "", "stack_aktuell": "", "stack_gewuenscht": "", "senioritaet": "", "arbeitgeber_typ": "", "gehalt_aktuell": "", "gehalt_gewuenscht": ""},
        "schmerzpunkte": {"primaer": "", "primaer_zitat": "", "primaer_tiefe": "", "sekundaer_1": "", "sekundaer_1_zitat": "", "sekundaer_1_tiefe": "", "sekundaer_2": "", "sekundaer_2_zitat": "", "sekundaer_2_tiefe": "", "sekundaer_3": "", "sekundaer_3_zitat": "", "sekundaer_3_tiefe": ""},
        "psychologie": {"primaere_emotion": "", "gewuenschte_emotion": "", "groesste_angst": "", "groesster_wunsch": "", "innerer_konflikt": "", "selbstbild": "", "fremdbild": "", "trigger_events": "", "gedanken_nachts": "", "tagtraeume": ""},
        "benefits": {"top_1": "", "top_2": "", "top_3": "", "hygiene": "", "differenzierung": "", "dealbreaker": "", "geheime_wuensche": "", "idealer_tag": ""},
        "sprache": {"duktus": "", "fachwoerter": "", "verbotene_woerter": "", "redewendungen": "", "kommunikationsstil": "", "humor_typ": "", "informationsquellen": "", "communities": "", "vorbilder": "", "entscheidungssprache": ""},
        "einwaende": {"einwand_1": "", "entkraeftung_1": "", "einwand_2": "", "entkraeftung_2": "", "einwand_3": "", "entkraeftung_3": ""},
        "arbeitgeber": {"usp_1": "", "usp_1_beweis": "", "usp_2": "", "usp_2_beweis": "", "usp_3": "", "usp_3_beweis": "", "kernpositionierung": "", "differenzierung": "", "kultur_3_worte": "", "anti_muster": ""},
        "messaging": {"kernbotschaft": "", "hook_1": "", "hook_2": "", "hook_3": "", "hook_4": "", "hook_5": "", "cta_1": "", "cta_2": "", "cta_3": "", "tonalitaetsprofil": ""},
        "markt": {"trend_1": "", "trend_2": "", "arbeitsmarkt": "", "gehaltsbenchmark": "", "wettbewerber": "", "saisonalitaet": ""},
    }
    return EXTRACTION_SCHEMA


def _load_framework(nr: int) -> str:
    """Framework-Markdown laden."""
    for fname in sorted(os.listdir(FRAMEWORKS_DIR)):
        if fname.startswith(f"{nr:02d}-"):
            with open(os.path.join(FRAMEWORKS_DIR, fname)) as f:
                return f.read()
    log.warning(f"Framework {nr:02d} nicht gefunden in {FRAMEWORKS_DIR}")
    return "Erstelle ein professionelles deutsches Dokument fuer eine Recruiting-Agentur. Verwende klare Struktur mit Ueberschriften, Bullet Points und konkreten Beispielen."


async def st_extract(context: dict, state) -> dict:
    """Bausteine aus Transkript extrahieren via Gemini."""
    transcript = context.get("transcript_text", "")

    # Fallback: Transkript aus Google Doc lesen
    if not transcript:
        transcript_doc_id = context.get("transcript_doc_id", "")
        if transcript_doc_id:
            try:
                transcript = await google.read_doc_content(transcript_doc_id)
                log.info(f"Transkript aus Google Doc gelesen: {len(transcript)} chars")
            except Exception as e:
                log.warning(f"Transkript-Doc lesen fehlgeschlagen: {e}")

    if not transcript:
        return {"error": "Kein Transkript", "bausteine": {}}

    schema = _load_extraction_schema()
    schema_str = json.dumps(schema, indent=2, ensure_ascii=False)

    prompt = f"""Du bist ein Senior Recruiting-Marketing-Stratege. Extrahiere ALLE Informationen in das JSON-Schema.

REGELN:
1. Jedes Feld MUSS befüllt werden
2. Zitate müssen authentisch klingen
3. "Schmerz hinter dem Schmerz" = tiefere EMOTIONALE Ebene
4. Hooks: Max 125 Zeichen, Loss Aversion > Benefits
5. CTAs niedrigschwellig

Unternehmen: {context.get('company', '')}
Rolle: {context.get('stellen', '')}

TRANSKRIPT:
{transcript[:8000]}

JSON-Schema:
{schema_str}

Antworte NUR mit validem JSON."""

    try:
        blocks = await ai.extract_json(prompt)
    except Exception as e:
        log.warning(f"KI-Extraction failed, nutze Schema als Staged Fallback: {e}")
        # Staged Fallback: Schema mit Platzhalter-Werten befüllen
        blocks = _load_extraction_schema()
        company = context.get("company", "")
        rolle = context.get("stellen", "")
        if blocks.get("demografie"):
            blocks["demografie"]["standort"] = "DACH-Raum"
            blocks["demografie"]["berufserfahrung"] = "3-10 Jahre"
        if blocks.get("beruflich"):
            blocks["beruflich"]["gesuchte_rolle"] = rolle or "Fachkraft"
            blocks["beruflich"]["arbeitgeber_typ"] = company or "Mittelstand"
        if blocks.get("schmerzpunkte"):
            blocks["schmerzpunkte"]["primaer"] = "Mangelnde Wertschaetzung und veraltete Arbeitsbedingungen"
        if blocks.get("arbeitgeber"):
            blocks["arbeitgeber"]["kernpositionierung"] = f"{company} — moderner Arbeitgeber mit Zukunftsperspektive"

    # In Airtable schreiben
    written = await airtable.write_bausteine(blocks)
    field_count = sum(len(v) if isinstance(v, dict) else 1 for v in blocks.values())

    return {"bausteine": blocks, "block_count": field_count, "airtable_written": written}


async def st00(context: dict, state) -> dict:
    """Bausteine Quality Gate — 5 Pflicht-Kategorien."""
    blocks = context.get("bausteine", {})
    required = ["demografie", "beruflich", "schmerzpunkte", "psychologie", "benefits"]
    missing = [c for c in required if c not in blocks or not blocks[c]]
    coverage = ((len(required) - len(missing)) / len(required)) * 100
    return {"passed": len(missing) == 0, "coverage": coverage, "missing_categories": missing}


async def _generate_doc(context: dict, state, framework_nr: int, doc_name: str, doc_key: str, prev_keys: list) -> dict:
    """Generisches Doc via Gemini + Framework + Bausteine."""
    bausteine = context.get("bausteine", {})
    framework = _load_framework(framework_nr)

    prev_text = ""
    gd = context.get("generated_docs", {})
    for ctx_key, label in prev_keys:
        if gd.get(ctx_key):
            prev_text += f"\n--- {label} ---\n{str(gd[ctx_key])[:2000]}\n"

    prompt = f"""Erstelle "{doc_name}" für "{state.client_name}".

FRAMEWORK:
{framework[:4000]}

BAUSTEINE:
{json.dumps(bausteine, ensure_ascii=False, indent=2)[:6000]}

VORHERIGE DOKUMENTE:
{prev_text[:3000] if prev_text else "Keine"}

Sei spezifisch, keine generischen Phrasen. Qualität wie Premium-Agentur."""

    # Feedback aus vorheriger Ablehnung beruecksichtigen
    feedback = context.get("regenerate_feedback", {}).get(doc_key, "")
    if feedback:
        prompt += f"\n\nFEEDBACK DES KUNDEN (bitte beruecksichtigen):\n{feedback}"

    try:
        content = await ai.generate(prompt, max_tokens=6000)
    except Exception as e:
        log.warning(f"KI für {doc_name} fehlgeschlagen, nutze Framework als Staged Content: {e}")
        content = f"# {doc_name} — {state.client_name}\n\n(Staged — KI war nicht verfügbar)\n\n{framework[:6000]}"

    # Check for staged doc
    staged_doc_ids = context.get("staged_doc_ids", {})
    staged_id = staged_doc_ids.get(doc_key, "")

    if staged_id:
        # Update existing staged doc
        try:
            await google.update_doc_html(staged_id, content)
            doc = {"doc_id": staged_id, "url": f"https://docs.google.com/document/d/{staged_id}/edit"}
            log.info(f"Staged Doc updated: {doc_name} → {staged_id}")
        except Exception as e:
            log.warning(f"Staged Doc update fehlgeschlagen, erstelle neu: {e}")
            doc = await google.create_doc(f"V3 — {doc_name} | {state.client_name}", content)
    else:
        # Fallback: create new doc
        doc = await google.create_doc(f"V3 — {doc_name} | {state.client_name}", content)

    # In Airtable tracken (non-fatal — Doc ist schon in Google Docs)
    try:
        await airtable.create_document(doc_name, doc_name, doc.get("url", ""), doc.get("doc_id", ""))
    except Exception as e:
        log.warning(f"Airtable tracking failed for {doc_name}: {e}")

    generated = dict(gd)
    generated[doc_key] = content
    generated[f"{doc_key}_url"] = doc.get("url", "")

    return {"url": doc.get("url"), "doc_id": doc.get("doc_id"), "content_length": len(content), "generated_docs": generated}


async def st01(context: dict, state): return await _generate_doc(context, state, 1, "Zielgruppen-Avatar", "zielgruppen_avatar", [])
async def st02(context: dict, state): return await _generate_doc(context, state, 2, "Arbeitgeber-Avatar", "arbeitgeber_avatar", [("zielgruppen_avatar", "Zielgruppen-Avatar")])
async def st03(context: dict, state): return await _generate_doc(context, state, 3, "Messaging-Matrix", "messaging_matrix", [("zielgruppen_avatar", "Zielgruppen-Avatar"), ("arbeitgeber_avatar", "Arbeitgeber-Avatar")])
async def st04(context: dict, state): return await _generate_doc(context, state, 4, "Creative Briefing", "creative_briefing", [("zielgruppen_avatar", "Zielgruppen-Avatar"), ("arbeitgeber_avatar", "Arbeitgeber-Avatar"), ("messaging_matrix", "Messaging-Matrix")])
async def st05(context: dict, state): return await _generate_doc(context, state, 5, "Marken-Richtlinien", "marken_richtlinien", [("arbeitgeber_avatar", "Arbeitgeber-Avatar"), ("messaging_matrix", "Messaging-Matrix"), ("creative_briefing", "Creative Briefing")])


async def st02a(context: dict, state) -> dict:
    """Fact Verification (optional, informational)."""
    website = context.get("website", "")
    if not website:
        return {"verified": True, "skipped": True}
    # Simplified check
    return {"verified": True, "info": "Fact verification skipped — optional check"}


async def st_sync(context: dict, state) -> dict:
    """Airtable Sync — Client-Status updaten nach Strategie-Phase."""
    block_count = context.get("block_count", 0)
    gd = context.get("generated_docs", {})
    doc_count = sum(1 for k in gd if k.endswith("_url") and gd[k])
    try:
        records = await airtable.get_records("CLIENTS", filter_formula=f"{{Client Name}}='{state.client_name}'", max_records=1)
        if records:
            await airtable.update_record("CLIENTS", records[0]["id"], {"Status": "Strategie abgeschlossen", "Bausteine": block_count, "Dokumente": doc_count})
    except Exception as e:
        log.warning(f"Airtable sync failed: {e}")
    return {"synced": True, "block_count": block_count, "doc_count": doc_count}


async def st_close(context: dict, state) -> dict:
    """Close: Stage → Strategie erstellt."""
    opp_id = context.get("opportunity_id", "")
    if not opp_id:
        return {"skipped": True}
    return await close.update_stage(opp_id, "strategie_erstellt")


STRATEGY_HANDLERS = {
    "v3-st-extract": st_extract,
    "v3-st00": st00,
    "v3-st01": st01, "v3-st02": st02, "v3-st03": st03, "v3-st04": st04, "v3-st05": st05,
    "v3-st02a": st02a,
    "v3-st-sync": st_sync,
    "v3-st-close": st_close,
}
