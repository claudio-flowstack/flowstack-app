"""
V3 CRUD API — Endpoints für die UI.
Clients, Dokumente, Bausteine, Health, Kunden-Hub.
"""

import asyncio
import logging
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException
from .integrations.airtable import AirtableClient
from .integrations.google import GoogleClient
from .integrations.slack import SlackClient
from .integrations.clickup import ClickUpClient
from .integrations.close import CloseClient
from .integrations.meta import MetaClient
from .integrations.ai import AIClient
from .resilience.state import ExecutionState
from .execution import start_execution, execute_node, APPROVAL_GATES

log = logging.getLogger("v3.api")

router = APIRouter(prefix="/api/v3", tags=["v3-crud"])

airtable = AirtableClient()
google = GoogleClient()
slack = SlackClient()
clickup = ClickUpClient()
close = CloseClient()
meta = MetaClient()
ai = AIClient()


# ── Clients ──────────────────────────────────────────────────

@router.get("/clients")
async def list_clients():
    """Alle Clients aus Airtable."""
    records = await airtable.get_records("CLIENTS", max_records=100)
    return [{"id": r["id"], **r.get("fields", {})} for r in records]


@router.post("/clients")
async def create_client(body: dict):
    """Client anlegen."""
    company = body.get("company", "")
    if not company:
        raise HTTPException(400, "company ist Pflicht")

    email = body.get("email", "")

    # Duplikat-Check: Email schon vorhanden?
    if email:
        existing = await airtable.get_records(
            "CLIENTS",
            filter_formula=f"{{Email}}='{email}'",
            max_records=1,
        )
        if existing:
            r = existing[0]
            return {"id": r["id"], "company": r.get("fields", {}).get("Client Name", company), "existing": True}

    record_id = await airtable.create_client(
        company=company,
        contact=body.get("contact", ""),
        email=email,
        branche=body.get("branche", ""),
        account_manager=body.get("account_manager", "Claudio"),
    )
    return {"id": record_id, "company": company}


@router.get("/clients/{record_id}")
async def get_client(record_id: str):
    """Einzelnen Client holen."""
    records = await airtable.get_records("CLIENTS", filter_formula=f"RECORD_ID()='{record_id}'", max_records=1)
    if not records:
        raise HTTPException(404, "Client nicht gefunden")
    r = records[0]
    return {"id": r["id"], **r.get("fields", {})}


@router.patch("/clients/{record_id}")
async def update_client(record_id: str, body: dict):
    """Client updaten."""
    await airtable.update_client(record_id, body)
    return {"updated": True, "id": record_id}


# ── Dokumente ────────────────────────────────────────────────

@router.get("/documents")
async def list_documents():
    """Alle Dokumente aus Airtable."""
    records = await airtable.get_records("DOKUMENTE", max_records=100)
    return [{"id": r["id"], **r.get("fields", {})} for r in records]


@router.post("/deliverables/{record_id}/approve")
async def approve_deliverable(record_id: str, body: dict = {}):
    """Deliverable freigeben."""
    await airtable.update_record("DOKUMENTE", record_id, {
        "Status": "approved",
        "Approved By": body.get("reviewer", "Claudio"),
    })
    return {"approved": True, "id": record_id}


@router.post("/deliverables/{record_id}/reject")
async def reject_deliverable(record_id: str, body: dict = {}):
    """Deliverable ablehnen."""
    await airtable.update_record("DOKUMENTE", record_id, {
        "Status": "rejected",
        "Feedback": body.get("feedback", ""),
    })
    return {"rejected": True, "id": record_id}


# ── Bausteine ────────────────────────────────────────────────

@router.get("/bausteine")
async def list_bausteine():
    """Alle Bausteine aus Airtable."""
    records = await airtable.get_records("BAUSTEINE", max_records=500)
    return [{"id": r["id"], **r.get("fields", {})} for r in records]


# ── Health ───────────────────────────────────────────────────

@router.get("/health/full")
async def full_health_check():
    """Alle Services prüfen."""
    results = {}

    for name, client in [
        ("google", google),
        ("slack", slack),
        ("clickup", clickup),
        ("close", close),
        ("meta", meta),
        ("airtable", airtable),
        ("ai", ai),
    ]:
        try:
            results[name] = await client.health_check()
        except Exception as e:
            results[name] = {"status": "error", "message": str(e)[:80]}

    healthy = all(r.get("status") == "ok" for r in results.values())
    return {"healthy": healthy, "services": results}


# ── Kunden-Hub: Constants ───────────────────────────────────

TITLE_MAP = {
    "zielgruppen_avatar": "Zielgruppen-Avatar",
    "arbeitgeber_avatar": "Arbeitgeber-Avatar",
    "messaging_matrix": "Messaging Matrix",
    "creative_briefing": "Creative Briefing",
    "marken_richtlinien": "Marken-Richtlinien",
    "landingpage_texte": "Landingpage-Texte",
    "formularseite_texte": "Formularseite-Texte",
    "dankeseite_texte": "Dankeseite-Texte",
    "anzeigentexte_hauptkampagne": "Anzeigentexte Hauptkampagne",
    "anzeigentexte_retargeting": "Anzeigentexte Retargeting",
    "anzeigentexte_warmup": "Anzeigentexte Warmup",
    "videoskript": "Videoskript",
}

NODE_LABELS = {
    "v3-is02": "CRM-Eintrag erstellt",
    "v3-is02a": "Duplikat-Check",
    "v3-is02-reuse": "CRM-Eintrag wiederverwendet",
    "v3-is03": "Slack-Channel erstellt",
    "v3-is04": "Welcome-Email gesendet",
    "v3-is05": "Kickoff-Termin erstellt",
    "v3-is06": "Drive-Ordner erstellt",
    "v3-is06a": "Drive-Quota geprueft",
    "v3-is07": "Dokument-Vorlagen erstellt",
    "v3-is08": "ClickUp-Projekt erstellt",
    "v3-is09": "ClickUp-Tasks erstellt",
    "v3-is10": "Close Stage aktualisiert",
    "v3-is11": "Miro Board erstellt",
    "v3-is-sheet": "Uebersichts-Sheet erstellt",
    "v3-kc00": "Kickoff-Reminder gesendet",
    "v3-kc03": "Transkript gespeichert",
    "v3-kc05": "Close: Kickoff abgeschlossen",
    "v3-kc06": "Slack: Kickoff Notification",
    "v3-st-extract": "Bausteine extrahiert",
    "v3-st00": "Bausteine Quality Gate",
    "v3-st01": "Zielgruppen-Avatar generiert",
    "v3-st02": "Arbeitgeber-Avatar generiert",
    "v3-st03": "Messaging Matrix generiert",
    "v3-st04": "Creative Briefing generiert",
    "v3-st05": "Marken-Richtlinien generiert",
    "v3-st-approval": "Strategie-Freigabe",
    "v3-cc01": "Landingpage-Texte generiert",
    "v3-cc02": "Formularseite-Texte generiert",
    "v3-cc03": "Dankeseite-Texte generiert",
    "v3-cc04": "Anzeigentexte Initial generiert",
    "v3-cc05": "Anzeigentexte Retargeting generiert",
    "v3-cc06": "Anzeigentexte Warmup generiert",
    "v3-cc07": "Videoskript generiert",
    "v3-cc-approval": "Texte-Freigabe",
    "v3-ca04": "Initial-Kampagne erstellt",
    "v3-ca05": "Initial AdSets + Ads erstellt",
    "v3-ca06": "Retargeting-Kampagne erstellt",
    "v3-ca07": "Retargeting AdSets + Ads erstellt",
    "v3-ca08": "Warmup-Kampagne erstellt",
    "v3-ca09": "Warmup AdSet + Ads erstellt",
    "v3-rl-e2e": "E2E Funnel-Test",
    "v3-rl-activate": "Kampagnen aktiviert",
    "v3-rl-golive": "Go-Live Freigabe",
    "v3-pl01": "Launch +24h Check",
}

DOC_NODE_MAP = {
    "zielgruppen_avatar": "v3-st01",
    "arbeitgeber_avatar": "v3-st02",
    "messaging_matrix": "v3-st03",
    "creative_briefing": "v3-st04",
    "marken_richtlinien": "v3-st05",
    "landingpage_texte": "v3-cc01",
    "formularseite_texte": "v3-cc02",
    "dankeseite_texte": "v3-cc03",
    "anzeigentexte_hauptkampagne": "v3-cc04",
    "anzeigentexte_retargeting": "v3-cc05",
    "anzeigentexte_warmup": "v3-cc06",
    "videoskript": "v3-cc07",
}

PHASE_NODES = {
    "onboarding": [
        "v3-is02a", "v3-is02", "v3-is02-reuse", "v3-is03", "v3-is04",
        "v3-is05", "v3-is06a", "v3-is06", "v3-is07", "v3-is08",
        "v3-is09", "v3-is10", "v3-is11", "v3-is-sheet",
    ],
    "strategy": [
        "v3-st-extract", "v3-st00",
        "v3-st01", "v3-st02", "v3-st03", "v3-st04", "v3-st05",
        "v3-st02a", "v3-st-sync", "v3-st-close", "v3-st-approval",
    ],
    "copy": [
        "v3-cc01", "v3-cc02", "v3-cc03", "v3-cc04", "v3-cc05",
        "v3-cc06", "v3-cc07", "v3-cc01a", "v3-cc01b", "v3-cc02a",
        "v3-cc02b", "v3-cc-brand", "v3-cc-sync", "v3-cc-close",
        "v3-cc-approval",
    ],
    "funnel": [
        "v3-fn01", "v3-fn05a", "v3-fn10a", "v3-fn10b",
        "v3-fn-pixel", "v3-fn-screenshots", "v3-fn-approval",
    ],
    "campaigns": [
        "v3-ca00", "v3-ca01", "v3-ca02", "v3-ca03", "v3-ca04",
        "v3-ca05", "v3-ca06", "v3-ca07", "v3-ca08", "v3-ca09",
        "v3-ca-approval",
    ],
    "review": [
        "v3-rl-e2e", "v3-rl-url", "v3-rl-pixel", "v3-rl-policy",
        "v3-rl-activate", "v3-rl-close", "v3-rl-slack", "v3-rl-clickup",
        "v3-rl-sheet", "v3-rl-golive",
    ],
    "live": [
        "v3-pl01", "v3-pl02", "v3-pl03", "v3-pl05", "v3-pl06",
        "v3-pl09", "v3-pl10", "v3-pl11", "v3-pl12", "v3-pl-winners",
        "v3-cm08",
    ],
}

PHASE_LABELS = {
    "onboarding": "Onboarding & Infrastruktur",
    "strategy": "Strategie & Bausteine",
    "copy": "Texte & Copywriting",
    "funnel": "Funnel & Landingpages",
    "campaigns": "Kampagnen-Setup",
    "review": "Review & Go-Live",
    "live": "Live & Monitoring",
}


def _find_execution_for_client(client_id: str) -> ExecutionState | None:
    """Execution finden via execution_id, client_name oder partial match.

    Lookup-Reihenfolge:
    1. Direkt als execution_id laden
    2. Exakter client_name Match (case-insensitive)
    3. Partial Match: client_id in client_name oder umgekehrt
    """
    # 1) Direkt als execution_id
    state = ExecutionState.load(client_id)
    if state:
        return state

    # 2+3) Ueber list_all nach client_name suchen
    client_lower = client_id.lower()
    for summary in ExecutionState.list_all():
        name_lower = summary["client_name"].lower()
        # 2) Exakter Match
        if name_lower == client_lower:
            return ExecutionState.load(summary["execution_id"])
        # 3) Partial Match (beide Richtungen)
        if client_lower in name_lower or name_lower in client_lower:
            return ExecutionState.load(summary["execution_id"])

    return None


def _get_client_name(client_id: str, records: list) -> str | None:
    """Client Name aus Airtable Record ID extrahieren."""
    for r in records:
        if r["id"] == client_id:
            return r.get("fields", {}).get("Client Name", "")
    return None


def _get_deliverable_status(doc_key: str, nodes: dict, approvals: dict) -> str:
    """Deliverable Status aus Node-State ableiten."""
    node_id = DOC_NODE_MAP.get(doc_key)
    if not node_id:
        return "pending"

    # Pruefe ob explizit approved/rejected
    if doc_key in approvals:
        return approvals[doc_key].get("status", "draft")

    node = nodes.get(node_id, {})
    status = node.get("status", "")

    if status == "completed":
        # Pruefe ob Approval Gate aktiv ist
        phase = _get_phase(doc_key)
        gate_map = {"strategy": "v3-st-approval", "copy": "v3-cc-approval"}
        gate_id = gate_map.get(phase)
        if gate_id and nodes.get(gate_id, {}).get("status") == "waiting_approval":
            return "in_review"
        return "draft"
    elif status == "running":
        return "generating"
    elif status == "failed":
        return "failed"
    elif status == "blocked":
        return "blocked"
    else:
        return "pending"


def _get_phase(doc_key: str) -> str:
    """Phase eines Deliverables bestimmen."""
    node_id = DOC_NODE_MAP.get(doc_key, "")
    if node_id.startswith("v3-st"):
        return "strategy"
    if node_id.startswith("v3-cc"):
        return "copy"
    return "unknown"


# ── Kunden-Hub: Client Execution ────────────────────────────

@router.get("/clients/{client_id}/execution")
async def get_client_execution(client_id: str):
    """Aktive Execution fuer einen Client finden."""
    state = _find_execution_for_client(client_id)
    if not state:
        raise HTTPException(404, f"Keine Execution fuer {client_id}")

    return {
        "execution_id": state.execution_id,
        "client_name": state.client_name,
        "started_at": state.started_at,
        "completed_at": state.completed_at,
        "paused_at": state.paused_at,
        "context": state.context,
        "nodes": state.nodes,
    }


@router.post("/clients/{client_id}/start")
async def start_client_execution(client_id: str):
    """Neue V3 Execution fuer einen Client starten."""
    records = await airtable.get_records(
        "CLIENTS", filter_formula=f"RECORD_ID()='{client_id}'", max_records=1
    )
    if not records:
        raise HTTPException(404, "Client nicht gefunden")

    fields = records[0].get("fields", {})
    data = {
        "company": fields.get("Client Name", ""),
        "contact": fields.get("Ansprechpartner", ""),
        "email": fields.get("Email", ""),
        "branche": fields.get("Branche", ""),
        "account_manager": fields.get("Account Manager", "Claudio"),
    }

    if not data["company"] or not data["email"]:
        raise HTTPException(400, "Client braucht company und email")

    result = await start_execution(data)
    if "error" in result:
        raise HTTPException(409, result["error"])

    # Auto-Runner im Hintergrund starten
    import asyncio
    execution_id = result.get("execution_id", "")
    if execution_id:
        from v3_server import auto_run_execution
        asyncio.create_task(auto_run_execution(execution_id))

    return result


# ── Kunden-Hub: Deliverables ────────────────────────────────

@router.get("/clients/{client_id}/deliverables")
async def get_client_deliverables(client_id: str):
    """Alle Deliverables eines Clients aus der Execution."""
    state = _find_execution_for_client(client_id)
    if not state:
        raise HTTPException(404, f"Keine Execution fuer {client_id}")

    generated_docs = state.context.get("generated_docs", {})
    approvals = state.context.get("deliverable_approvals", {})
    deliverables = []

    # 1) KI-generierte Dokumente (Strategie + Copywriting)
    for doc_key in DOC_NODE_MAP:
        deliverables.append({
            "id": doc_key,
            "title": TITLE_MAP.get(doc_key, doc_key),
            "content": generated_docs.get(doc_key, ""),
            "url": generated_docs.get(f"{doc_key}_url", ""),
            "status": _get_deliverable_status(doc_key, state.nodes, approvals),
            "phase": _get_phase(doc_key),
            "version": approvals.get(doc_key, {}).get("version", 1),
        })

    # 2) Funnel URLs (Landingpage, Formular, Dankeseite)
    ctx = state.context
    for url_key, title in [("lp_url", "Landingpage"), ("form_url", "Formularseite"), ("thankyou_url", "Dankeseite")]:
        url = ctx.get(url_key, "")
        if url:
            deliverables.append({
                "id": url_key,
                "title": title,
                "content": "",
                "url": url,
                "status": "completed",
                "phase": "funnel",
                "version": 1,
            })

    # 3) Meta-Kampagnen als Deliverables
    meta_campaigns = ctx.get("meta_campaigns", {})
    ads_manager_base = meta.ads_manager_url()
    campaign_type_map = {
        "campaign_id": "initial",
        "retargeting_campaign_id": "retargeting",
        "warmup_campaign_id": "warmup",
    }
    for key, campaign_type in campaign_type_map.items():
        campaign_id = ctx.get(key, "") or meta_campaigns.get(key, "")
        if campaign_id:
            deliverables.append({
                "id": f"campaign_{campaign_type}",
                "title": f"Meta Kampagne: {campaign_type.title()}",
                "content": "",
                "url": ads_manager_base,
                "status": "completed",
                "phase": "campaigns",
                "version": 1,
                "campaign_id": campaign_id,
                "campaign_type": campaign_type,
            })

    # AdSets
    adset_ids = ctx.get("adset_ids", [])
    if isinstance(adset_ids, str):
        adset_ids = [adset_ids] if adset_ids else []
    for i, adset_id in enumerate(adset_ids):
        deliverables.append({
            "id": f"adset_{i}",
            "title": f"Ad Set #{i + 1}",
            "content": "",
            "url": ads_manager_base,
            "status": "completed",
            "phase": "campaigns",
            "version": 1,
            "adset_id": adset_id,
        })

    return {
        "execution_id": state.execution_id,
        "client_name": state.client_name,
        "deliverables": deliverables,
    }


@router.put("/deliverables/{execution_id}/{doc_key}/content")
async def update_deliverable_content(execution_id: str, doc_key: str, body: dict):
    """Deliverable-Inhalt in Execution Context updaten."""
    state = ExecutionState.load(execution_id)
    if not state:
        raise HTTPException(404, f"Execution {execution_id} nicht gefunden")

    if doc_key not in DOC_NODE_MAP:
        raise HTTPException(400, f"Unbekannter doc_key: {doc_key}")

    content = body.get("content", "")
    if not content:
        raise HTTPException(400, "content ist Pflicht")

    generated_docs = dict(state.context.get("generated_docs", {}))
    generated_docs[doc_key] = content
    state.update_context({"generated_docs": generated_docs})

    # Write-back to Google Doc
    doc_url = generated_docs.get(f"{doc_key}_url", "")
    if doc_url and "/d/" in doc_url:
        doc_id = doc_url.split("/d/")[1].split("/")[0]
        try:
            await google.update_doc_content(doc_id, content)
        except Exception as e:
            log.warning(f"Google Doc update failed for {doc_key}: {e}")

    return {"updated": True, "doc_key": doc_key, "execution_id": execution_id}


@router.post("/deliverables/{execution_id}/{doc_key}/approve")
async def approve_execution_deliverable(execution_id: str, doc_key: str, body: dict = {}):
    """Deliverable in Execution als approved markieren."""
    state = ExecutionState.load(execution_id)
    if not state:
        raise HTTPException(404, f"Execution {execution_id} nicht gefunden")

    if doc_key not in DOC_NODE_MAP:
        raise HTTPException(400, f"Unbekannter doc_key: {doc_key}")

    reviewer = body.get("reviewer", "Claudio")
    approvals = dict(state.context.get("deliverable_approvals", {}))
    approvals[doc_key] = {
        "status": "approved",
        "reviewer": reviewer,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "version": approvals.get(doc_key, {}).get("version", 1),
    }
    state.update_context({"deliverable_approvals": approvals})

    # Pruefe ob alle Deliverables in der Phase approved sind
    phase = _get_phase(doc_key)
    phase_docs = [k for k, v in DOC_NODE_MAP.items() if _get_phase(k) == phase]
    all_approved = all(
        approvals.get(dk, {}).get("status") == "approved" for dk in phase_docs
    )

    gate_released = False
    if all_approved:
        gate_map = {"strategy": "v3-st-approval", "copy": "v3-cc-approval"}
        gate_id = gate_map.get(phase)
        if gate_id:
            gate_status = state.nodes.get(gate_id, {}).get("status", "")
            if gate_status == "waiting_approval" or not gate_status:
                state.update_node(gate_id, "completed", result={"auto_released": True, "reviewer": reviewer})
                gate_released = True
                log.info(f"Gate {gate_id} auto-released fuer {state.client_name}")

    return {
        "approved": True,
        "doc_key": doc_key,
        "reviewer": reviewer,
        "gate_released": gate_released,
        "phase": phase,
    }


@router.post("/deliverables/{execution_id}/{doc_key}/reject")
async def reject_execution_deliverable(execution_id: str, doc_key: str, body: dict = {}):
    """Deliverable in Execution als rejected markieren."""
    state = ExecutionState.load(execution_id)
    if not state:
        raise HTTPException(404, f"Execution {execution_id} nicht gefunden")

    if doc_key not in DOC_NODE_MAP:
        raise HTTPException(400, f"Unbekannter doc_key: {doc_key}")

    comment = body.get("comment", "")
    reviewer = body.get("reviewer", "Claudio")
    approvals = dict(state.context.get("deliverable_approvals", {}))
    prev_version = approvals.get(doc_key, {}).get("version", 1)
    approvals[doc_key] = {
        "status": "rejected",
        "reviewer": reviewer,
        "comment": comment,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "version": prev_version,
    }
    state.update_context({"deliverable_approvals": approvals})

    # Reset gate if it was already auto-released
    phase = _get_phase(doc_key)
    gate_map = {"strategy": "v3-st-approval", "copy": "v3-cc-approval"}
    gate_id = gate_map.get(phase)
    gate_reset = False
    if gate_id and state.nodes.get(gate_id, {}).get("status") == "completed":
        auto_released = state.nodes.get(gate_id, {}).get("result", {}).get("auto_released", False)
        if auto_released:
            state.update_node(gate_id, "waiting_approval")
            gate_reset = True
            log.info(f"Gate {gate_id} re-locked nach Rejection von {doc_key}")

    return {
        "rejected": True,
        "doc_key": doc_key,
        "reviewer": reviewer,
        "comment": comment,
        "gate_reset": gate_reset,
    }


@router.post("/deliverables/{execution_id}/{doc_key}/regenerate")
async def regenerate_deliverable(execution_id: str, doc_key: str, body: dict = {}):
    """Deliverable neu generieren durch Re-Execution des Nodes."""
    state = ExecutionState.load(execution_id)
    if not state:
        raise HTTPException(404, f"Execution {execution_id} nicht gefunden")

    node_id = DOC_NODE_MAP.get(doc_key)
    if not node_id:
        raise HTTPException(400, f"Unbekannter doc_key: {doc_key}")

    # Feedback speichern falls vorhanden
    feedback = body.get("feedback", "")
    if feedback:
        regen_feedback = dict(state.context.get("regenerate_feedback", {}))
        regen_feedback[doc_key] = feedback
        state.update_context({"regenerate_feedback": regen_feedback})

    # Version hochzaehlen
    approvals = dict(state.context.get("deliverable_approvals", {}))
    prev_version = approvals.get(doc_key, {}).get("version", 1)
    approvals[doc_key] = {
        "status": "regenerating",
        "version": prev_version + 1,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    state.update_context({"deliverable_approvals": approvals})

    # Node neu ausfuehren
    result = await execute_node(execution_id, node_id)

    return {
        "regenerated": result.get("status") == "completed",
        "doc_key": doc_key,
        "node_id": node_id,
        "version": prev_version + 1,
        "result": result,
    }


# ── Kunden-Hub: Pipeline ────────────────────────────────────

@router.get("/clients/{client_id}/pipeline")
async def get_client_pipeline(client_id: str):
    """Pipeline-Fortschritt aggregiert nach Phasen."""
    state = _find_execution_for_client(client_id)
    if not state:
        raise HTTPException(404, f"Keine Execution fuer {client_id}")

    phases = []
    found_current = False

    for phase_key, node_ids in PHASE_NODES.items():
        completed = sum(
            1 for nid in node_ids
            if state.nodes.get(nid, {}).get("status") == "completed"
        )
        total = len(node_ids)
        has_running = any(
            state.nodes.get(nid, {}).get("status") in ("running", "waiting_approval")
            for nid in node_ids
        )
        has_failed = any(
            state.nodes.get(nid, {}).get("status") == "failed"
            for nid in node_ids
        )

        if completed == total:
            status = "completed"
        elif has_failed:
            status = "failed"
        elif has_running:
            status = "active"
        elif completed > 0:
            status = "active"
        else:
            status = "pending"

        is_current = False
        if not found_current and status == "active":
            is_current = True
            found_current = True

        phases.append({
            "name": phase_key,
            "label": PHASE_LABELS[phase_key],
            "status": status,
            "completed_nodes": completed,
            "total_nodes": total,
            "is_current": is_current,
        })

    return {
        "execution_id": state.execution_id,
        "client_name": state.client_name,
        "phases": phases,
    }


# ── Kunden-Hub: Timeline ────────────────────────────────────

@router.get("/clients/{client_id}/timeline")
async def get_client_timeline(client_id: str):
    """Timeline-Events aus abgeschlossenen Nodes."""
    state = _find_execution_for_client(client_id)
    if not state:
        raise HTTPException(404, f"Keine Execution fuer {client_id}")

    events = []
    for node_id, node_data in state.nodes.items():
        status = node_data.get("status", "")
        updated_at = node_data.get("updated_at", "")

        # Bestimme Phase fuer den Node
        phase = "unknown"
        for phase_key, node_ids in PHASE_NODES.items():
            if node_id in node_ids:
                phase = phase_key
                break

        # Ergebnis-Details / Summary
        if status == "completed":
            result = node_data.get("result", {})
            if isinstance(result, dict):
                summary = result.get("skipped", False) and "Uebersprungen" or "Abgeschlossen"
            else:
                summary = "Abgeschlossen"
        elif status == "failed":
            summary = f"Fehler: {node_data.get('error', 'Unbekannt')[:100]}"
        elif status == "waiting_approval":
            summary = "Wartet auf Freigabe"
        elif status == "running":
            summary = "Laeuft..."
        elif status == "blocked":
            summary = f"Blockiert: {node_data.get('error', '')[:100]}"
        else:
            summary = ""

        # Bestimme event type
        if status == "waiting_approval":
            event_type = "approval_requested"
        elif status == "completed":
            event_type = "node_completed"
        elif status == "failed":
            event_type = "alert"
        else:
            event_type = "status_change"

        # Menschenlesbarer Titel aus NODE_LABELS
        title = NODE_LABELS.get(node_id, node_id.replace("v3-", "").replace("-", " ").title())

        event = {
            "id": f"evt-{node_id}",
            "node_id": node_id,
            "type": event_type,
            "title": title,
            "description": summary,
            "timestamp": updated_at,
            "actor": "review" if status == "waiting_approval" else "system",
            "status": status,
            "phase": phase,
            "updated_at": updated_at,
            "duration_ms": node_data.get("duration_ms"),
            "summary": summary,
        }

        events.append(event)

    # Sortieren nach updated_at absteigend
    events.sort(key=lambda e: e.get("updated_at", ""), reverse=True)

    return {
        "execution_id": state.execution_id,
        "client_name": state.client_name,
        "events": events,
    }


# ── Kunden-Hub: Performance ─────────────────────────────────

@router.get("/clients/{client_id}/performance")
async def get_client_performance(client_id: str):
    """Meta-Kampagnen Performance aggregiert."""
    state = _find_execution_for_client(client_id)
    if not state:
        raise HTTPException(404, f"Keine Execution fuer {client_id}")

    meta_campaigns = state.context.get("meta_campaigns", {})
    campaign_ids = []

    # Sammle alle Campaign IDs
    for key in ["campaign_id", "retargeting_campaign_id", "warmup_campaign_id"]:
        cid = state.context.get(key, "") or meta_campaigns.get(key, "")
        if cid:
            campaign_ids.append({"key": key, "id": cid})

    if not campaign_ids:
        return {
            "execution_id": state.execution_id,
            "client_name": state.client_name,
            "campaigns": [],
            "totals": {"impressions": 0, "clicks": 0, "spend": "0", "leads": 0},
        }

    campaigns = []
    total_impressions = 0
    total_clicks = 0
    total_spend = 0.0
    total_leads = 0

    for camp in campaign_ids:
        try:
            insights = await asyncio.wait_for(
                meta.get_campaign_insights(camp["id"]),
                timeout=10.0,
            )
            impressions = int(insights.get("impressions", 0))
            clicks = int(insights.get("clicks", 0))
            spend = float(insights.get("spend", "0"))

            # Leads aus actions extrahieren
            leads = 0
            for action in insights.get("actions", []):
                if action.get("action_type") == "lead":
                    leads = int(action.get("value", 0))

            campaigns.append({
                "campaign_key": camp["key"],
                "campaign_id": camp["id"],
                "impressions": impressions,
                "clicks": clicks,
                "spend": f"{spend:.2f}",
                "ctr": insights.get("ctr", "0"),
                "frequency": insights.get("frequency", "0"),
                "leads": leads,
            })

            total_impressions += impressions
            total_clicks += clicks
            total_spend += spend
            total_leads += leads
        except asyncio.TimeoutError:
            log.warning(f"Meta Insights Timeout fuer {camp['id']}")
            campaigns.append({
                "campaign_key": camp["key"],
                "campaign_id": camp["id"],
                "error": "Timeout nach 10s",
            })
        except Exception as e:
            log.warning(f"Meta Insights fuer {camp['id']} fehlgeschlagen: {e}")
            campaigns.append({
                "campaign_key": camp["key"],
                "campaign_id": camp["id"],
                "error": str(e)[:100],
            })

    # Daily breakdown (last 14 days, per campaign)
    daily = []
    campaign_type_map = {
        "campaign_id": "initial",
        "retargeting_campaign_id": "retargeting",
        "warmup_campaign_id": "warmup",
    }
    for camp in campaign_ids:
        try:
            result = await asyncio.wait_for(
                meta._request("GET", f"{camp['id']}/insights", {
                    "fields": "impressions,clicks,spend,actions",
                    "date_preset": "last_14d",
                    "time_increment": "1",
                }),
                timeout=10.0,
            )
            for row in result.get("data", []):
                leads = 0
                for action in row.get("actions", []):
                    if action.get("action_type") in ("lead", "offsite_conversion.fb_pixel_lead"):
                        leads += int(action.get("value", 0))
                daily.append({
                    "date": row.get("date_start", ""),
                    "campaign_id": camp["id"],
                    "impressions": int(row.get("impressions", 0)),
                    "clicks": int(row.get("clicks", 0)),
                    "spend": float(row.get("spend", 0)),
                    "leads": leads,
                })
        except (asyncio.TimeoutError, Exception):
            pass

    # Campaign breakdown by type
    campaigns_breakdown = {}
    for key in ["campaign_id", "retargeting_campaign_id", "warmup_campaign_id"]:
        cid = state.context.get(key, "") or meta_campaigns.get(key, "")
        typ = campaign_type_map.get(key, key)
        if cid:
            try:
                insights = await asyncio.wait_for(
                    meta.get_campaign_insights(cid, "last_7d"),
                    timeout=10.0,
                )
                campaigns_breakdown[typ] = insights
            except (asyncio.TimeoutError, Exception):
                campaigns_breakdown[typ] = {}

    return {
        "execution_id": state.execution_id,
        "client_name": state.client_name,
        "campaigns": campaigns,
        "totals": {
            "impressions": total_impressions,
            "clicks": total_clicks,
            "spend": f"{total_spend:.2f}",
            "leads": total_leads,
        },
        "daily": daily,
        "campaigns_breakdown": campaigns_breakdown,
    }


# ── Kunden-Hub: Ads ─────────────────────────────────────────

@router.get("/clients/{client_id}/ads")
async def get_client_ads(client_id: str):
    """Alle Ads eines Clients mit Creative Details aus Meta."""
    state = _find_execution_for_client(client_id)
    if not state:
        raise HTTPException(404, f"Keine Execution fuer {client_id}")

    ctx = state.context
    ad_ids = ctx.get("ad_ids", [])
    if isinstance(ad_ids, str):
        ad_ids = [ad_ids] if ad_ids else []
    adset_ids = ctx.get("adset_ids", [])
    image_hashes = ctx.get("image_hashes", [])
    campaign_ids = {}

    for key in ["campaign_id", "retargeting_campaign_id", "warmup_campaign_id"]:
        val = ctx.get(key, "")
        if val:
            campaign_ids[key] = val

    # Fetch creative details for each ad
    ads = []
    for ad_id in ad_ids:
        try:
            details = await meta.get_ad_details(ad_id)
            ads.append(details)
        except Exception as e:
            log.warning(f"Ad Details fuer {ad_id} fehlgeschlagen: {e}")
            ads.append({"id": ad_id, "error": str(e)[:100]})

    return {
        "execution_id": state.execution_id,
        "client_name": state.client_name,
        "campaign_ids": campaign_ids,
        "adset_ids": adset_ids if isinstance(adset_ids, list) else [adset_ids],
        "ads": ads,
        "ad_ids": [a.get("id", "") for a in ads],
        "image_hashes": image_hashes if isinstance(image_hashes, list) else [image_hashes],
        "ads_manager_url": meta.ads_manager_url(),
        "total_ads": len(ads),
    }


@router.put("/ads/{ad_id}")
async def update_ad(ad_id: str, body: dict):
    """Update a Meta ad creative."""
    fields = {k: v for k, v in body.items() if k in ("body", "title", "cta_type", "link_url")}
    if not fields:
        raise HTTPException(400, "Mindestens ein Feld (body, title, cta_type, link_url) ist noetig")
    result = await meta.update_ad_creative(ad_id, fields)
    return result


# ── Kunden-Hub: Client Delete/Cleanup ────────────────────────

@router.delete("/clients/{client_id}")
async def delete_client(client_id: str):
    """Client-Execution loeschen und Ressourcen aufraeumen."""
    state = _find_execution_for_client(client_id)
    if not state:
        raise HTTPException(404, "Client nicht gefunden")

    context = state.context
    cleanup_results = {}

    # 1. Close Lead loeschen
    lead_id = context.get("lead_id", "")
    if lead_id:
        try:
            await close._request("DELETE", f"/lead/{lead_id}/")
            cleanup_results["close"] = "deleted"
        except Exception as e:
            cleanup_results["close"] = f"error: {str(e)[:80]}"

    # 2. Slack Channel archivieren
    channel_id = context.get("channel_id", "")
    if channel_id:
        try:
            await slack._post("conversations.archive", {"channel": channel_id})
            cleanup_results["slack"] = "archived"
        except Exception as e:
            cleanup_results["slack"] = f"error: {str(e)[:80]}"

    # 3. ClickUp Liste loeschen
    list_id = context.get("list_id", "")
    if list_id:
        try:
            await clickup._request("DELETE", f"/list/{list_id}")
            cleanup_results["clickup"] = "deleted"
        except Exception as e:
            cleanup_results["clickup"] = f"error: {str(e)[:80]}"

    # 4. Meta Kampagnen loeschen
    meta_campaigns = context.get("meta_campaigns", {})
    for camp_key in ["campaign_id", "retargeting_campaign_id", "warmup_campaign_id"]:
        camp_id = context.get(camp_key, "") or meta_campaigns.get(camp_key, "")
        if camp_id:
            try:
                await meta._request("DELETE", camp_id)
                cleanup_results[f"meta_{camp_key}"] = "deleted"
            except Exception as e:
                cleanup_results[f"meta_{camp_key}"] = f"error: {str(e)[:80]}"

    # 5. Execution State Datei loeschen
    import os
    state_file = str(state._file)
    try:
        os.remove(state_file)
        cleanup_results["state"] = "deleted"
    except FileNotFoundError:
        cleanup_results["state"] = "already_deleted"
    except OSError as e:
        cleanup_results["state"] = f"error: {str(e)[:80]}"

    # 6. Execution Lock freigeben
    from .execution import release_lock
    release_lock(state.client_name)

    log.info(f"Client {state.client_name} geloescht: {cleanup_results}")

    return {"deleted": True, "client_name": state.client_name, "cleanup": cleanup_results}
