"""V3 Modularer Server — Execution + CRUD + Cron."""
import asyncio
import os, sys, logging
sys.path.insert(0, os.path.dirname(__file__))

from fastapi import FastAPI, HTTPException, Request, Depends
from fastapi.middleware.cors import CORSMiddleware

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("v3-server")

V3_API_KEY = os.environ.get("V3_API_KEY", "flowstack-demo-2026")

app = FastAPI(title="V3 Automation Server", version="3.0")
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:5173", "http://localhost:3000", "http://localhost:4173", "http://localhost:5180"], allow_methods=["*"], allow_headers=["*"])


async def verify_api_key(request: Request):
    """API-Key Pruefung. Health-Endpoints sind ausgenommen."""
    if request.url.path in ("/api/health", "/docs", "/openapi.json"):
        return
    key = request.headers.get("X-API-Key", "")
    if key != V3_API_KEY:
        raise HTTPException(401, "Invalid or missing API key")

from v3.execution import start_execution, execute_node, get_all_handler_ids, APPROVAL_GATES
from v3.resilience.state import ExecutionState


# ── Auto-Runner: Führt alle Nodes sequentiell im Hintergrund aus ──

# Definierte Reihenfolge aller Nodes über alle Phasen
AUTO_RUN_ORDER = [
    # Phase 1: Onboarding
    "v3-is02a", "v3-is02", "v3-is03", "v3-is04", "v3-is05",
    "v3-is06a", "v3-is06", "v3-is07", "v3-is08", "v3-is09",
    "v3-is10", "v3-is11", "v3-is-sheet",
    # Phase 2: Kickoff
    "v3-kc00", "v3-kc02a", "v3-kc02b", "v3-kc03", "v3-kc03a",
    "v3-kc03b", "v3-kc05", "v3-kc06",
    # Phase 3: Strategy
    "v3-st-extract", "v3-st00", "v3-st01", "v3-st02", "v3-st03",
    "v3-st04", "v3-st05", "v3-st02a", "v3-st-sync", "v3-st-close",
    "v3-st-approval",
    # Phase 4: Copy
    "v3-cc01", "v3-cc02", "v3-cc03", "v3-cc04", "v3-cc05",
    "v3-cc06", "v3-cc07", "v3-cc01a", "v3-cc01b", "v3-cc02a",
    "v3-cc02b", "v3-cc-brand", "v3-cc-sync", "v3-cc-close",
    "v3-cc-approval",
    # Phase 5: Funnel
    "v3-fn01", "v3-fn05a", "v3-fn10a", "v3-fn10b",
    "v3-fn-pixel", "v3-fn-screenshots", "v3-fn-approval",
    # Phase 6: Campaigns
    "v3-ca00", "v3-ca01", "v3-ca02", "v3-ca03", "v3-ca04",
    "v3-ca05", "v3-ca06", "v3-ca07", "v3-ca08", "v3-ca09",
    "v3-ca-approval",
    # Phase 7: Review & Launch
    "v3-rl-e2e", "v3-rl-url", "v3-rl-pixel", "v3-rl-policy",
    "v3-rl-activate", "v3-rl-close", "v3-rl-slack", "v3-rl-clickup",
    "v3-rl-sheet", "v3-rl-golive",
    # Phase 8: Monitoring
    "v3-pl01", "v3-pl02", "v3-pl03", "v3-pl05", "v3-pl06",
    "v3-pl09", "v3-pl10", "v3-pl11", "v3-pl12", "v3-pl-winners",
    "v3-cm08",
]


DEMO_TRANSCRIPT = (
    "Kickoff-Call mit dem Kunden. "
    "Das Unternehmen ist in der {branche}-Branche taetig und sucht dringend qualifizierte Mitarbeiter. "
    "Zielgruppe: 25-45 Jahre, maennlich und weiblich, Hochschulabschluss oder vergleichbare Qualifikation, "
    "2-8 Jahre Berufserfahrung. Standort flexibel, Remote moeglich. "
    "Aktuelle Herausforderungen: Zu wenig qualifizierte Bewerbungen ueber klassische Kanaele wie Indeed und StepStone, "
    "hohe Konkurrenz um Fachkraefte, lange Time-to-Hire von durchschnittlich 3 Monaten. "
    "Staerken als Arbeitgeber: Moderne Arbeitskultur, flexible Arbeitszeiten, Home-Office Policy, "
    "ueberdurchschnittliches Gehalt, Weiterbildungsbudget, flache Hierarchien, Team-Events. "
    "Schmerzpunkte der Zielgruppe: Langweilige Routinearbeit, starre Arbeitszeiten, fehlende Wertschaetzung, "
    "keine Karriereperspektiven, toxische Teamkultur, veraltete Technologie. "
    "Psychologische Trigger: Wunsch nach Anerkennung und Sichtbarkeit, Angst vor Karrierestillstand, "
    "Sehnsucht nach sinnvoller Arbeit und modernem Arbeitsumfeld. "
    "Budget: {budget} Euro monatlich fuer Meta Ads. "
    "Gewuenschte Ergebnisse: Mindestens 30 qualifizierte Bewerbungen pro Monat, CPL unter 50 Euro. "
    "Die Landingpage soll auf der Unternehmenswebsite laufen. "
    "Wichtig ist authentische Kommunikation mit echten Teamfotos. "
    "Der Kunde hat bereits LinkedIn und Xing probiert, aber ohne messbaren Erfolg. "
    "Meeting-Protokoll Ende."
)


async def auto_run_execution(execution_id: str):
    """Führt alle Nodes sequentiell aus. Approval Gates pausieren bis externe Freigabe."""
    log.info(f"Auto-Runner gestartet für {execution_id}")
    completed = 0
    skipped = 0
    failed = 0

    # Demo-Transcript stagen bevor Kickoff-Phase startet
    state = ExecutionState.load(execution_id)
    if state and not state.context.get("transcript_text"):
        ctx = state.context
        transcript = DEMO_TRANSCRIPT.format(
            branche=ctx.get("branche", "Dienstleistung"),
            budget=ctx.get("budget", "2500"),
        )
        state.update_context({"transcript_text": transcript})
        log.info(f"Demo-Transcript gestaged ({len(transcript)} Zeichen)")

    for node_id in AUTO_RUN_ORDER:
        # Pause-Check
        state = ExecutionState.load(execution_id)
        if not state:
            log.warning(f"Auto-Runner: State {execution_id} nicht gefunden, abgebrochen")
            return
        if state.paused_at:
            log.info(f"Auto-Runner: {execution_id} pausiert, warte...")
            while state.paused_at:
                await asyncio.sleep(2)
                state = ExecutionState.load(execution_id)
                if not state:
                    return

        # Approval Gates: STOP and wait for external signal
        if node_id in APPROVAL_GATES:
            result = await execute_node(execution_id, node_id)
            if result.get("status") == "waiting_approval":
                log.info(f"  {node_id}: waiting for approval — Auto-Runner pausing")
                # Wait until node is approved externally (via API call)
                while True:
                    await asyncio.sleep(3)
                    state = ExecutionState.load(execution_id)
                    if not state:
                        return
                    node_state = state.nodes.get(node_id, {})
                    if node_state.get("status") == "completed":
                        log.info(f"  {node_id}: approved externally, resuming")
                        completed += 1
                        break
                    if state.paused_at:
                        log.info(f"  {node_id}: execution paused, waiting")
                        continue
            else:
                completed += 1
            continue

        result = await execute_node(execution_id, node_id)
        status = result.get("status", "?")

        if status == "completed":
            completed += 1
        elif status == "blocked":
            skipped += 1
            log.info(f"  {node_id}: blocked ({result.get('missing', '')})")
        elif status == "failed":
            failed += 1
            log.warning(f"  {node_id}: failed ({result.get('error', '')[:60]})")
        else:
            skipped += 1

    log.info(f"Auto-Runner fertig: {completed} completed, {failed} failed, {skipped} skipped")

# ── CRUD Endpoints registrieren ─────────────────────────────
from v3.api import router as crud_router
app.include_router(crud_router)

# ── Cron Jobs registrieren ──────────────────────────────────
from v3.cron import setup_cron
setup_cron(app)


# ── Execution Endpoints ─────────────────────────────────────

@app.get("/api/health")
async def health():
    from v3.resilience.circuit_breaker import all_breaker_status
    handlers = get_all_handler_ids()
    breakers = all_breaker_status()
    open_circuits = [b for b in breakers if b["state"] == "open"]
    return {
        "status": "degraded" if open_circuits else "ok",
        "handlers": len(handlers),
        "version": "v3-modular",
        "circuits": breakers if breakers else None,
    }


@app.post("/api/v3/execute", dependencies=[Depends(verify_api_key)])
async def api_start(body: dict):
    result = await start_execution(body)
    if "error" in result:
        raise HTTPException(400, result["error"])

    # Auto-Runner im Hintergrund starten
    execution_id = result.get("execution_id", "")
    if execution_id:
        asyncio.create_task(auto_run_execution(execution_id))

    return result


@app.post("/api/v3/execute-node", dependencies=[Depends(verify_api_key)])
async def api_execute_node(body: dict):
    node_id = body.get("nodeId", "")
    execution_id = body.get("executionId", "")
    context = body.get("context", {})
    if not node_id or not execution_id:
        raise HTTPException(400, "nodeId und executionId sind Pflicht")
    return await execute_node(execution_id, node_id, context)


@app.get("/api/v3/execute/{execution_id}")
async def api_get_execution(execution_id: str):
    state = ExecutionState.load(execution_id)
    if not state:
        raise HTTPException(404, "Nicht gefunden")
    return {"execution_id": state.execution_id, "client_name": state.client_name, "context": state.context, "nodes": state.nodes, "paused_at": state.paused_at}


@app.get("/api/v3/executions")
async def api_list():
    return ExecutionState.list_all()


@app.post("/api/v3/executions/{execution_id}/pause")
async def api_pause(execution_id: str):
    state = ExecutionState.load(execution_id)
    if not state:
        raise HTTPException(404, "Nicht gefunden")
    if state.completed_at:
        raise HTTPException(400, "Execution bereits abgeschlossen")
    if state.paused_at:
        return {"status": "already_paused", "paused_at": state.paused_at}
    state.pause()
    return {"status": "paused", "paused_at": state.paused_at}


@app.post("/api/v3/executions/{execution_id}/resume")
async def api_resume(execution_id: str):
    state = ExecutionState.load(execution_id)
    if not state:
        raise HTTPException(404, "Nicht gefunden")
    if not state.paused_at:
        return {"status": "already_running"}
    state.resume()
    return {"status": "resumed"}


@app.post("/api/approval/{node_id}", dependencies=[Depends(verify_api_key)])
async def api_approve(node_id: str, body: dict = {}):
    for ex in ExecutionState.list_all():
        state = ExecutionState.load(ex["execution_id"])
        if state and node_id in state.nodes and state.nodes[node_id].get("status") == "waiting_approval":
            state.update_node(node_id, "completed", result={"approved_by": body.get("reviewer", "Auto")})
            return {"approved": True}
    return {"approved": False, "error": "Kein wartender Approval für diesen Node"}


# ── Startup Health Check ────────────────────────────────────

@app.on_event("startup")
async def startup_health():
    """Beim Start: Google Token + Services prüfen."""
    from v3.integrations.google import GoogleClient
    from v3.integrations.slack import SlackClient

    google = GoogleClient()
    slack = SlackClient()

    # Google Workspace Token prüfen
    try:
        token = google._get_token()
        if not token:
            log.error("Google Workspace Token leer beim Start!")
            try:
                await slack.send_alert("Google Workspace Token ungültig beim Server-Start — Re-Autorisierung nötig!", "critical")
            except Exception:
                pass
        else:
            log.info("Google Workspace Token OK")
    except Exception as e:
        log.error(f"Google Token Check fehlgeschlagen: {e}")
        try:
            await slack.send_alert(f"Google Token ungültig — Re-Autorisierung nötig: {str(e)[:100]}", "critical")
        except Exception:
            pass

    # Marketing Token prüfen
    try:
        creds = google.get_marketing_creds()
        if creds.get("access_token"):
            log.info("Google Marketing Token OK")
        else:
            log.warning("Google Marketing Token leer — GTM/GA4 wird nicht funktionieren")
    except Exception as e:
        log.warning(f"Google Marketing Token nicht verfügbar: {e}")

    log.info(f"V3 Server gestartet — {len(get_all_handler_ids())} Handler geladen")


@app.on_event("shutdown")
async def shutdown_cleanup():
    """httpx AsyncClients sauber schliessen."""
    from v3.integrations.ai import _groq_client
    clients_to_close = [_groq_client]
    # Collect all integration clients from phase modules
    try:
        from v3.phases.infra import close, slack, google, clickup, miro
        for c in [close, slack, clickup, miro]:
            if hasattr(c, '_client'):
                clients_to_close.append(c._client)
    except Exception:
        pass
    for client in clients_to_close:
        try:
            await client.aclose()
        except Exception:
            pass
    log.info("V3 Server shutdown — Clients geschlossen")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("v3_server:app", host="0.0.0.0", port=3002, reload=False)
