# Backend Architektur-Regeln

> Destilliert aus dem Technik Playbook. Erklärt nicht WAS Patterns sind, sondern WIE sie hier angewandt werden.

## Neuer Integration-Client bauen

1. Eigener `httpx.AsyncClient` im `__init__` — nie pro Request erstellen
2. `@retryable()` Decorator auf `_request()` oder `_post()` Methode
3. Custom Errors werfen: `AuthError` (nie retry), `RateLimitError` (retry mit Delay), `NotFoundError` (nie retry), `IntegrationError(retryable=True)` für 5xx
4. Error-Mapping: Jede API hat andere Error-Formate. Im Client auf unsere Hierarchy mappen
5. `health_check()` Methode für Cron-basiertes Monitoring
6. Circuit Breaker: Passiert automatisch über `retry_with_backoff()` in `v3/resilience/retry.py`
7. Alle Imports: `from .errors import IntegrationError, RateLimitError, AuthError, NotFoundError, retryable`

```python
class NewClient:
    def __init__(self):
        self._client = httpx.AsyncClient(timeout=30)

    @retryable()
    async def _request(self, method, path, data=None):
        resp = await self._client.request(method, f"{self.base_url}{path}", ...)
        if resp.status_code == 401: raise AuthError("new_service", f"{method} {path}")
        if resp.status_code == 429: raise RateLimitError("new_service", f"{method} {path}")
        if resp.status_code >= 400: raise IntegrationError("new_service", f"{method} {path}", resp.text[:200], retryable=resp.status_code >= 500)
        return resp.json()
```

## Neuer Workflow-Node bauen

1. Handler: `async def node_id(context: dict, state) -> dict`
2. In `PHASE_HANDLERS` dict des Phase-Moduls registrieren (z.B. `v3/phases/infra.py`)
3. In `AUTO_RUN_ORDER` in `v3_server.py` an der richtigen Stelle einfügen
4. Context Requirements in `v3/resilience/context_validation.py` eintragen
5. Rückgabe-dict mit allen Context-Keys die andere Nodes brauchen
6. Context-Keys in `execution.py` CONTEXT_KEYS Liste eintragen damit sie automatisch propagiert werden
7. Idempotenz: Prüfe ob Ergebnis schon existiert bevor du API aufrufst
8. Bei Fehler: IntegrationError werfen, retry_with_backoff handled den Rest

```python
async def new_node(context: dict, state) -> dict:
    """Was dieser Node tut."""
    company = context.get("company", "")
    # Idempotenz-Check
    existing = await client.search(company)
    if existing:
        return {"resource_id": existing["id"], "reused": True}
    # Erstellen
    result = await client.create(company=company)
    return {"resource_id": result["id"]}
```

## Retry & Resilience Hierarchie

```
Schicht 1: @retryable() auf Client._request()
  → 1x Retry mit 2s Delay bei Timeout/5xx/ConnectionError
  → AuthError/NotFoundError werden NIE retried

Schicht 2: retry_with_backoff() auf Node-Level (execution.py)
  → Service-spezifische Profile (Meta=60s, Google=2/5/15s, Airtable=1/3/10s)
  → RateLimitError nutzt Server Retry-After Header
  → Optional Services (Miro) werden bei Fehler übersprungen

Schicht 3: Circuit Breaker (resilience/circuit_breaker.py)
  → Nach 3 Fehlern: Service für 5 Min deaktiviert (Meta: 10 Min)
  → HALF-OPEN: Ein Probe-Request zum Testen
  → Nodes für deaktivierten Service werden übersprungen
```

## State & Persistence

- `ExecutionState` in `v3/resilience/state.py` — JSON Files in `state/executions/`
- Atomic Writes: `tempfile.mkstemp()` + `os.rename()` — nie direkt in die Datei schreiben
- File Locking: `fcntl.flock()` — shared read, exclusive write
- Stale Recovery: Nodes die >5 Min im Status "running" sind werden automatisch auf "failed" gesetzt
- Idempotenz: Node mit status "completed" gibt cached Result zurück

## Logging

- Alle Logs mit `logging.getLogger("v3.xxx")` — nie `print()`
- Log-Format: `log.info("was_passiert", extra={"service": "close", "key": "value"})`
- Fehler immer mit Context loggen: `log.warning(f"[{node_id}] {service}: {error[:80]}")`

## Cron Jobs (v3/cron.py)

- Jeder Job hat try/except — ein fehlerhafter Job killt nicht die anderen
- Alert-Deduplication: `_should_alert(msg)` prüft ob gleicher Alert in letzten 30 Min schon gesendet
- Health Check alle 5 Min, Token Refresh alle 25 Min, Escalation stündlich
- Neue Jobs: `scheduler.add_job(func, "interval"/"cron", id="v3_xxx")`

## API Security

- CORS: Nur eigene Origins (localhost:5173/3000/4173/5180)
- API-Key: `X-API-Key` Header auf allen mutierenden Endpoints
- Health + Docs Endpoints bleiben offen
- Pydantic Validation auf allen Inputs wenn Endpoints gebaut werden

## KI-Calls (ai.py)

- `json_mode=True` bei `extract_json()` — Groq + Gemini unterstützen es
- Framework-Files als Prompt-Templates laden (`_load_framework(nr)`)
- Fallback: Groq → Gemini Flash → Flash-Lite → 2.5 Flash
- Bei JSON-Parse-Fehler: Markdown-Bereinigung, dann Fallback-Parsing (erste { bis letzte })
- Leere Felder in Bausteine zählen, bei >20% warnen
