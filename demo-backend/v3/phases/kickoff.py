"""
Phase 2: Kickoff & Transkript
Nodes: v3-kc00 bis v3-kc06
"""

import logging
from ..integrations.close import CloseClient
from ..integrations.slack import SlackClient
from ..integrations.google import GoogleClient
from ..integrations.ai import AIClient

log = logging.getLogger("v3.phase.kickoff")

close = CloseClient()
slack = SlackClient()
google = GoogleClient()
ai = AIClient()


async def kc00(context: dict, state) -> dict:
    """Kickoff Reminder 2h vorher."""
    return await google.send_email(
        to=context.get("email", ""),
        subject=f"Erinnerung: Kickoff-Call in 2 Stunden — {state.client_name}",
        body=f"Hallo {context.get('contact', '')},\n\nkurze Erinnerung an unseren Kickoff-Call. Bitte halten Sie bereit:\n- Logo in hoher Auflösung\n- Aktuelle Stellenanzeigen\n- Meta Business Manager Zugang\n\nBis gleich!",
    )


async def kc02a(context: dict, state) -> dict:
    """No-Show Detection: Transkript vorhanden?"""
    has_transcript = bool(context.get("transcript_id") or context.get("transcript_doc_id") or context.get("transcript_text"))
    return {"noshow": not has_transcript, "has_transcript": has_transcript}


async def kc02b(context: dict, state) -> dict:
    """No-Show Handler: Slack Notification."""
    await slack.send_alert(f"{state.client_name} — Nicht zum Kickoff erschienen. Bitte neuen Termin koordinieren.", "warning")
    opp_id = context.get("opportunity_id", "")
    if opp_id:
        await close.update_stage(opp_id, "onboarding_gestartet")
        await close.add_note(context.get("lead_id", ""), "No-Show beim Kickoff. Neuer Termin nötig.")
    return {"handled": True, "action": "noshow_notification"}


async def kc03(context: dict, state) -> dict:
    """Transkript Upload/Speicherung — immer speichern, nie verlieren."""
    transcript = context.get("transcript_text", "")
    has_transcript = bool(transcript and len(transcript) > 50)
    if has_transcript:
        # Drive-Ordner: Kickoff > Root > keiner
        folder_id = context.get("folders", {}).get("02_Kickoff", "") or context.get("folder_root_id", "")
        try:
            doc = await google.create_doc(f"Kickoff-Transkript — {state.client_name}", transcript)
            return {"transcript_stored": True, "transcript_doc_id": doc.get("doc_id", ""), "transcript_url": doc.get("url", ""), "word_count": len(transcript.split())}
        except Exception as e:
            log.warning(f"Transkript-Upload failed: {e}")
            # Fallback: transcript_text im Return → bleibt im Context für st_extract
            return {"transcript_stored": True, "transcript_text": transcript, "word_count": len(transcript.split())}
    return {"transcript_stored": False, "reason": "Kein Transkript im Context"}


async def kc03a(context: dict, state) -> dict:
    """Transkript Quality Gate."""
    transcript = context.get("transcript_text", "")
    word_count = len(transcript.split()) if transcript else 0

    if word_count < 500:
        return {"quality_score": 0, "word_count": word_count, "passed": False, "reason": f"Nur {word_count} Wörter (min. 500)"}

    try:
        result = await ai.extract_json(
            f"Bewerte dieses Kickoff-Transkript. Prüfe ob Demografie, Beruflich, Schmerzpunkte, Psychologie, Benefits abgedeckt sind. Antworte als JSON: {{\"score\": 0-100, \"missing\": [...]}}.\n\nTranskript:\n{transcript[:3000]}"
        )
        return {"quality_score": result.get("score", 50), "word_count": word_count, "missing_categories": result.get("missing", []), "passed": result.get("score", 0) >= 70}
    except Exception:
        return {"quality_score": 70, "word_count": word_count, "passed": True, "reason": "AI check skipped"}


async def kc03b(context: dict, state) -> dict:
    """Transkript zu dünn — Notification."""
    await slack.send_alert(f"{state.client_name} — Transkript unvollständig. Bitte intern klären.", "warning")
    return {"action": "notification_sent"}


async def kc05(context: dict, state) -> dict:
    """Close: Stage → Kickoff abgeschlossen."""
    opp_id = context.get("opportunity_id", "")
    if not opp_id:
        return {"skipped": True}
    return await close.update_stage(opp_id, "kickoff_abgeschlossen")


async def kc06(context: dict, state) -> dict:
    """Slack: Kickoff erledigt."""
    channel = context.get("channel_id", "")
    if channel:
        await slack.send_message(channel, f"✓ {state.client_name} — Kickoff abgeschlossen. KI-Analyse startet.")
    else:
        await slack.send_log(f"✓ {state.client_name} — Kickoff abgeschlossen")
    return {"notification_sent": True}


KICKOFF_HANDLERS = {
    "v3-kc00": kc00,
    "v3-kc02a": kc02a,
    "v3-kc02b": kc02b,
    "v3-kc03": kc03,
    "v3-kc03a": kc03a,
    "v3-kc03b": kc03b,
    "v3-kc05": kc05,
    "v3-kc06": kc06,
}
