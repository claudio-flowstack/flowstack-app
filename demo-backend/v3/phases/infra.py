"""
Phase 1: Infrastruktur-Setup
Nodes: v3-is02 bis v3-is-sheet
Erstellt: Close Deal, Slack Channel, Drive Ordner, ClickUp Projekt, Miro Board, Calendar Event, Email, Sheet
"""

import logging
from ..integrations.close import CloseClient
from ..integrations.slack import SlackClient
from ..integrations.google import GoogleClient
from ..integrations.clickup import ClickUpClient
from ..integrations.miro import MiroClient

log = logging.getLogger("v3.phase.infra")

close = CloseClient()
slack = SlackClient()
google = GoogleClient()
clickup = ClickUpClient()
miro = MiroClient()


async def is02a(context: dict, state) -> dict:
    """Duplikat-Check: Lead existiert schon in Close?"""
    existing = await close.search_lead_by_email(context.get("email", ""))
    if existing:
        return {
            "duplicate": True,
            "lead_id": existing["id"],
            "opportunity_id": existing.get("opportunities", [{}])[0].get("id") if existing.get("opportunities") else None,
        }
    return {"duplicate": False}


async def is02(context: dict, state) -> dict:
    """Close: Lead + Opportunity erstellen."""
    lead = await close.create_lead(
        company=context.get("company", ""),
        contact=context.get("contact", ""),
        email=context.get("email", ""),
        phone=context.get("phone", ""),
    )
    opp = await close.create_opportunity(
        lead_id=lead["lead_id"],
        stage="onboarding_gestartet",
        note=f"V3 Automation gestartet — {state.client_name}",
    )
    return {**lead, **opp, "close_lead_url": lead.get("url", "")}


async def is02_reuse(context: dict, state) -> dict:
    """Bestehende Close IDs wiederverwenden + Note hinzufuegen."""
    lead_id = context.get("lead_id", "")
    opp_id = context.get("opportunity_id", "")
    if lead_id:
        try:
            await close.add_note(lead_id, f"V3 Automation gestartet (bestehender Lead) — {state.client_name}")
        except Exception as e:
            log.warning(f"Note fuer bestehenden Lead fehlgeschlagen: {e}")
    return {"lead_id": lead_id, "opportunity_id": opp_id, "close_lead_url": f"https://app.close.com/lead/{lead_id}" if lead_id else "", "reused": True}


async def is03(context: dict, state) -> dict:
    """Slack: Client-Channel erstellen."""
    return await slack.create_channel(f"client-{state.client_name}")


async def is04(context: dict, state) -> dict:
    """Welcome Email senden."""
    return await google.send_email(
        to=context.get("email", ""),
        subject=f"Willkommen bei Flowstack — {state.client_name}",
        body=f"Hallo {context.get('contact', '')},\n\nwillkommen an Bord! Wir freuen uns auf die Zusammenarbeit.\n\nIhr Projekt wurde angelegt und wir starten jetzt mit der Vorbereitung.\n\nNächster Schritt: Kickoff-Call (Einladung folgt)\n\nViele Grüße\nIhr Flowstack Team",
    )


async def is05(context: dict, state) -> dict:
    """Google Calendar: Kickoff-Termin."""
    return await google.create_event(
        title=f"Kickoff — {state.client_name}",
        attendee_email=context.get("email", ""),
        days_from_now=3,
    )


async def is06a(context: dict, state) -> dict:
    """Drive Quota Check."""
    quota = await google.check_quota()
    if quota.get("free_gb", 100) < 0.1:
        raise Exception(f"Drive Speicher KRITISCH: nur {quota['free_gb']} GB frei")
    return quota


async def is06(context: dict, state) -> dict:
    """Drive: 9 Ordner erstellen."""
    result = await google.create_folder_structure(state.client_name)
    return {
        "folder_root_id": result["root_id"],
        "drive_folder_url": result["url"],
        "folders": result["folders"],
    }


async def is07(context: dict, state) -> dict:
    """Drive: 12 Staged Docs mit Struktur erstellen."""
    import os
    from ..config import FRAMEWORKS_DIR

    folders = context.get("folders", {})
    root_id = context.get("folder_root_id", "")
    if not root_id:
        return {"skipped": True, "reason": "Kein folder_root_id"}

    company = state.client_name

    # Mapping: doc_key, title, framework_nr, folder_key
    DOC_SPECS = [
        ("zielgruppen_avatar", "Zielgruppen-Avatar", 1, "03_Strategie"),
        ("arbeitgeber_avatar", "Arbeitgeber-Avatar", 2, "03_Strategie"),
        ("messaging_matrix", "Messaging Matrix", 3, "03_Strategie"),
        ("creative_briefing", "Creative Briefing", 4, "03_Strategie"),
        ("marken_richtlinien", "Marken-Richtlinien", 5, "03_Strategie"),
        ("landingpage_texte", "Landingpage-Texte", 6, "04_Texte"),
        ("formularseite_texte", "Formularseite-Texte", 7, "04_Texte"),
        ("dankeseite_texte", "Dankeseite-Texte", 8, "04_Texte"),
        ("anzeigentexte_hauptkampagne", "Anzeigentexte Initial", 9, "06_Anzeigen"),
        ("anzeigentexte_retargeting", "Anzeigentexte Retargeting", 10, "06_Anzeigen"),
        ("anzeigentexte_warmup", "Anzeigentexte Warmup", 11, "06_Anzeigen"),
        ("videoskript", "Videoskript", 12, "04_Texte"),
    ]

    # Bereits erstellte Docs aus Context übernehmen (Idempotenz bei Retry)
    existing_staged = dict(state.context.get("staged_doc_ids", {}))
    existing_docs = dict(state.context.get("generated_docs", {}))
    staged_doc_ids = dict(existing_staged)
    generated_docs = dict(existing_docs)

    for doc_key, title, fw_nr, folder_key in DOC_SPECS:
        # Skip wenn bereits erstellt
        if doc_key in staged_doc_ids and staged_doc_ids[doc_key]:
            log.info(f"Staged Doc bereits vorhanden: {title} → {staged_doc_ids[doc_key]}")
            continue

        folder_id = folders.get(folder_key, root_id)
        full_title = f"{title} — {company}"

        # Load framework as initial placeholder content
        placeholder = f"<h1>{title}</h1><p><em>Wird durch KI-generierte Inhalte ersetzt...</em></p><p>Client: {company}</p>"
        try:
            for fname in sorted(os.listdir(str(FRAMEWORKS_DIR))):
                if fname.startswith(f"{fw_nr:02d}-"):
                    with open(os.path.join(str(FRAMEWORKS_DIR), fname)) as f:
                        fw_content = f.read()
                    # Convert markdown headers to HTML
                    placeholder = f"<h1>{title} — {company}</h1><p><em>Staged — wartet auf KI-Generierung</em></p><hr/><pre>{fw_content[:2000]}</pre>"
                    break
        except Exception:
            pass

        try:
            doc = await google.create_doc_html(full_title, placeholder, folder_id)
            doc_id = doc.get("doc_id", "")
            doc_url = doc.get("url", "")
            staged_doc_ids[doc_key] = doc_id
            generated_docs[f"{doc_key}_url"] = doc_url
            # Zwischenspeichern damit bei Timeout die bisherigen Docs nicht verloren gehen
            state.update_context({"staged_doc_ids": staged_doc_ids, "generated_docs": generated_docs})
            log.info(f"Staged Doc erstellt: {title} → {doc_id}")
        except Exception as e:
            log.warning(f"Staged Doc {title} fehlgeschlagen: {e}")

    return {
        "staged_doc_ids": staged_doc_ids,
        "generated_docs": generated_docs,
        "templates_created": len(staged_doc_ids),
    }


async def is08(context: dict, state) -> dict:
    """ClickUp: Projekt erstellen."""
    result = await clickup.create_list(state.client_name)
    return {"list_id": result["list_id"], "clickup_list_url": result["url"]}


async def is09(context: dict, state) -> dict:
    """ClickUp: V3 Initial-Tasks mit Checklisten."""
    list_id = context.get("list_id", "")
    if not list_id:
        return {"error": "Kein list_id"}
    return await clickup.create_initial_tasks(list_id, state.client_name)


async def is10(context: dict, state) -> dict:
    """Close: Stage → Kickoff geplant."""
    opp_id = context.get("opportunity_id", "")
    if not opp_id:
        return {"skipped": True}
    return await close.update_stage(opp_id, "kickoff_geplant")


async def is11(context: dict, state) -> dict:
    """Miro: Kampagnen-Board (optional)."""
    result = await miro.create_board(
        name=f"{state.client_name} — Kampagnen-Planung",
        description=f"V3 Automation Board",
    )
    return {"miro_board_id": result.get("board_id", ""), "miro_board_url": result.get("url", "")}


async def is_sheet(context: dict, state) -> dict:
    """Google Sheets: Übersichts-Sheet."""
    result = await google.create_sheet(f"Projekt-Übersicht — {state.client_name}")
    return {"overview_sheet_id": result["sheet_id"], "overview_sheet_url": result["url"]}


# Handler Registry für diese Phase
INFRA_HANDLERS = {
    "v3-is02a": is02a,
    "v3-is02": is02,
    "v3-is02-reuse": is02_reuse,
    "v3-is03": is03,
    "v3-is04": is04,
    "v3-is05": is05,
    "v3-is06a": is06a,
    "v3-is06": is06,
    "v3-is07": is07,
    "v3-is08": is08,
    "v3-is09": is09,
    "v3-is10": is10,
    "v3-is11": is11,
    "v3-is-sheet": is_sheet,
}
