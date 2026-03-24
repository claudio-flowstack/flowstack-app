"""
V3 Execution Engine — Zentrale Steuerung.
Sammelt alle Phase-Handler, routet Nodes, managed State + Context.
KEIN V1/V2 Fallback.
"""

import logging
import re
import time
from datetime import datetime, timezone
from typing import Any

from .resilience.state import ExecutionState
from .resilience.retry import retry_with_backoff, get_service_for_node
from .resilience.context_validation import validate_context
from .alerts import alert_and_task
from .config import AIRTABLE_V3_BASE_ID

log = logging.getLogger("v3.execution")

# ── Alle Handler aus den Phase-Modulen zusammenführen ────────

_ALL_HANDLERS: dict[str, Any] = {}
_handlers_loaded = False


def _load_all_handlers():
    """Lazy-load aller Phase-Handler beim ersten Aufruf."""
    global _ALL_HANDLERS, _handlers_loaded
    if _handlers_loaded:
        return

    try:
        from .phases.infra import INFRA_HANDLERS
        _ALL_HANDLERS.update(INFRA_HANDLERS)
    except ImportError as e:
        log.warning(f"Infra handlers not loaded: {e}")

    try:
        from .phases.kickoff import KICKOFF_HANDLERS
        _ALL_HANDLERS.update(KICKOFF_HANDLERS)
    except ImportError as e:
        log.warning(f"Kickoff handlers not loaded: {e}")

    try:
        from .phases.strategy import STRATEGY_HANDLERS
        _ALL_HANDLERS.update(STRATEGY_HANDLERS)
    except ImportError as e:
        log.warning(f"Strategy handlers not loaded: {e}")

    try:
        from .phases.copy import COPY_HANDLERS
        _ALL_HANDLERS.update(COPY_HANDLERS)
    except ImportError as e:
        log.warning(f"Copy handlers not loaded: {e}")

    try:
        from .phases.funnel import FUNNEL_HANDLERS
        _ALL_HANDLERS.update(FUNNEL_HANDLERS)
    except ImportError as e:
        log.warning(f"Funnel handlers not loaded: {e}")

    try:
        from .phases.campaigns import CAMPAIGN_HANDLERS
        _ALL_HANDLERS.update(CAMPAIGN_HANDLERS)
    except ImportError as e:
        log.warning(f"Campaign handlers not loaded: {e}")

    try:
        from .phases.launch import LAUNCH_HANDLERS
        _ALL_HANDLERS.update(LAUNCH_HANDLERS)
    except ImportError as e:
        log.warning(f"Launch handlers not loaded: {e}")

    try:
        from .phases.monitoring import MONITORING_HANDLERS
        _ALL_HANDLERS.update(MONITORING_HANDLERS)
    except ImportError as e:
        log.warning(f"Monitoring handlers not loaded: {e}")

    _handlers_loaded = True
    log.info(f"V3 Handler geladen: {len(_ALL_HANDLERS)} Nodes aus {8} Phasen")


def get_handler(node_id: str):
    """Handler für einen Node finden."""
    _load_all_handlers()
    return _ALL_HANDLERS.get(node_id)


def get_all_handler_ids() -> list[str]:
    """Alle registrierten Node-IDs."""
    _load_all_handlers()
    return sorted(_ALL_HANDLERS.keys())


# ── Execution ────────────────────────────────────────────────

# Approval Gate Config (welche Nodes sind Approval Gates)
APPROVAL_GATES = {
    "v3-st-approval", "v3-cc-approval", "v3-fn-approval",
    "v3-ca-approval", "v3-rl-golive",
}

# Execution Locks (in-memory, ein Client gleichzeitig)
_execution_locks: dict[str, str] = {}


def acquire_lock(client_name: str, execution_id: str) -> bool:
    """Lock für Client. Returns False wenn schon belegt."""
    # Check in-memory lock
    if client_name in _execution_locks:
        existing = _execution_locks[client_name]
        state = ExecutionState.load(existing)
        if state and not state.completed_at and not state.paused_at:
            return False

    # Also check disk for active executions (survives restart)
    for summary in ExecutionState.list_all():
        if summary["client_name"].lower() == client_name.lower():
            existing_state = ExecutionState.load(summary["execution_id"])
            if existing_state and not existing_state.completed_at and not existing_state.paused_at:
                # Already running from before restart
                _execution_locks[client_name] = summary["execution_id"]
                return False

    _execution_locks[client_name] = execution_id
    return True


def release_lock(client_name: str):
    _execution_locks.pop(client_name, None)


async def start_execution(data: dict) -> dict:
    """Neue Execution starten."""
    company = data.get("company", "")
    email = data.get("email", "")

    if not company or not email:
        return {"error": "company und email sind Pflicht"}

    if "@" not in email or "." not in email.split("@")[-1]:
        return {"error": "Ungueltige Email-Adresse"}

    safe_name = company.lower().replace("ä", "ae").replace("ö", "oe").replace("ü", "ue").replace("ß", "ss").replace("&", "und")
    safe_name = re.sub(r'[^a-z0-9-]', '-', safe_name)  # Replace all non-alphanumeric
    safe_name = re.sub(r'-+', '-', safe_name).strip('-')  # Collapse multiple dashes
    execution_id = f"v3_{safe_name}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"

    if not acquire_lock(company, execution_id):
        return {"error": f"Execution für {company} läuft bereits"}

    try:
        state = ExecutionState(execution_id, company)
        state.update_context({
            "company": company,
            "contact": data.get("contact", data.get("name", "")),
            "email": email,
            "phone": data.get("phone", ""),
            "branche": data.get("branche", ""),
            "website": data.get("website", ""),
            "stellen": data.get("stellen", ""),
            "budget": data.get("budget", ""),
            "account_manager": data.get("account_manager", "Claudio"),
            "execution_id": execution_id,
        })
        state.save()
    except Exception as e:
        release_lock(company)
        return {"error": f"Execution konnte nicht erstellt werden: {e}"}

    return {"execution_id": execution_id, "client_name": company, "status": "running"}


async def execute_node(execution_id: str, node_id: str, extra_context: dict = None) -> dict:
    """Einzelnen Node ausführen mit Retry + State Persistence."""
    _load_all_handlers()

    # State laden
    state = ExecutionState.load(execution_id)
    if not state:
        return {"status": "error", "error": f"Execution {execution_id} nicht gefunden"}

    if state.paused_at:
        return {"status": "error", "error": "Execution ist pausiert"}

    # Idempotenz: Node schon completed → cached Result
    existing_node = state.nodes.get(node_id, {})
    if existing_node.get("status") == "completed":
        log.info(f"Node {node_id} bereits completed, verwende cached Result")
        return {"status": "completed", "result": existing_node.get("result", {}), "cached": True}

    client_name = state.client_name
    full_context = {**state.context, **(extra_context or {})}

    # Context Validation
    valid, missing = validate_context(node_id, full_context)
    if not valid:
        state.update_node(node_id, "blocked", error=f"Fehlendes Feld: {missing}")
        return {"status": "blocked", "missing": missing}

    # Approval Gate Check
    if node_id in APPROVAL_GATES:
        state.update_node(node_id, "waiting_approval")
        return {"status": "waiting_approval", "gate": node_id}

    # Handler finden
    handler = get_handler(node_id)
    if not handler:
        state.update_node(node_id, "failed", error=f"Kein Handler für {node_id}")
        return {"status": "failed", "error": f"Kein Handler für {node_id}"}

    # Ausführen mit Retry
    state.update_node(node_id, "running")
    start_time = time.time()

    service = get_service_for_node(node_id)
    result = await retry_with_backoff(
        func=handler,
        args={"context": full_context, "state": state},
        service=service,
        node_id=node_id,
        client_name=client_name,
    )

    duration_ms = int((time.time() - start_time) * 1000)

    if result["success"]:
        data = result.get("result", {})

        # Context mit Ergebnissen updaten
        if isinstance(data, dict):
            for key in [
                "lead_id", "opportunity_id", "close_lead_url",
                "channel_id", "channel_name",
                "folder_root_id", "drive_folder_url", "folders",
                "list_id", "clickup_list_url", "task_ids",
                "event_id", "meet_link",
                "miro_board_id", "miro_board_url",
                "overview_sheet_id", "overview_sheet_url",
                "bausteine", "block_count", "airtable_written",
                "generated_docs", "staged_doc_ids",
                "meta_campaigns",
                "campaign_id", "retargeting_campaign_id", "warmup_campaign_id",
                "audience_id", "image_hashes",
                "adset_ids", "ad_ids",
                "meta_ad_account",
                "lp_url", "form_url", "thankyou_url",
                "transcript_text", "transcript_doc_id",
            ]:
                if key in data:
                    state.update_context({key: data[key]})

            # generated_docs mergen statt überschreiben
            if "generated_docs" in data and isinstance(data["generated_docs"], dict):
                existing_docs = dict(state.context.get("generated_docs", {}))
                existing_docs.update(data["generated_docs"])
                state.update_context({"generated_docs": existing_docs})

            # staged_doc_ids mergen
            if "staged_doc_ids" in data and isinstance(data["staged_doc_ids"], dict):
                existing_staged = dict(state.context.get("staged_doc_ids", {}))
                existing_staged.update(data["staged_doc_ids"])
                state.update_context({"staged_doc_ids": existing_staged})

            # adset_ids und ad_ids mergen (kommen von ca05, ca07, ca09)
            for list_key in ["adset_ids", "ad_ids"]:
                if list_key in data and isinstance(data[list_key], list):
                    existing = list(state.context.get(list_key, []))
                    existing.extend(data[list_key])
                    state.update_context({list_key: existing})

        state.update_node(node_id, "completed", result=data, duration_ms=duration_ms)
        _check_execution_complete(state)
        return {"status": "completed", "result": data, "duration_ms": duration_ms}
    else:
        error = result.get("error", "Unknown error")
        # Optional Service → Skip
        if result.get("optional"):
            state.update_node(node_id, "completed", result={"skipped": True, "reason": error}, duration_ms=duration_ms)
            _check_execution_complete(state)
            return {"status": "completed", "skipped": True}
        else:
            state.update_node(node_id, "failed", error=error, duration_ms=duration_ms)
            try:
                await alert_and_task(client_name, error, node_id, list_id=full_context.get("list_id", ""))
            except Exception:
                log.warning(f"alert_and_task failed for {node_id}")
            return {"status": "failed", "error": error, "duration_ms": duration_ms}


def _check_execution_complete(state: ExecutionState):
    """Prüfe ob alle Nodes fertig sind und gib Lock frei."""
    if not state.nodes:
        return
    all_terminal = all(
        n.get("status") in ("completed", "failed")
        for n in state.nodes.values()
    )
    if all_terminal and len(state.nodes) >= len(_ALL_HANDLERS):
        state.completed_at = datetime.now(timezone.utc).isoformat()
        state.save()
        release_lock(state.client_name)
        log.info(f"Execution {state.execution_id} abgeschlossen, Lock freigegeben")
