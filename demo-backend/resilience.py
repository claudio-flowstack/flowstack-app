"""
V3 Resilience Layer
- Retry with exponential backoff
- Circuit Breaker per service
- Rate Limiter (Token Bucket)
- Context Validation
- Execution State Persistence
- Idempotency Checks
"""

import asyncio
import json
import os
import time
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Callable, Optional

logger = logging.getLogger("v3.resilience")

STATE_DIR = Path(__file__).parent / "state"
EXECUTIONS_DIR = STATE_DIR / "executions"
CIRCUIT_BREAKER_FILE = STATE_DIR / "circuit-breaker.json"
DLQ_FILE = STATE_DIR / "dlq.json"

# Ensure directories exist
EXECUTIONS_DIR.mkdir(parents=True, exist_ok=True)


# ============================================================
# RETRY PROFILES
# ============================================================

RETRY_PROFILES: dict[str, dict[str, Any]] = {
    "close":      {"max_retries": 3, "backoff": [2, 5, 15],     "timeout": 30},
    "google":     {"max_retries": 3, "backoff": [2, 5, 15],     "timeout": 30},
    "slack":      {"max_retries": 3, "backoff": [2, 5, 15],     "timeout": 30},
    "clickup":    {"max_retries": 3, "backoff": [2, 5, 15],     "timeout": 30},
    "meta":       {"max_retries": 3, "backoff": [60, 300, 600], "timeout": 30},
    "airtable":   {"max_retries": 3, "backoff": [1, 3, 10],     "timeout": 15},
    "openrouter": {"max_retries": 2, "backoff": [10, 30],       "timeout": 180},
    "miro":       {"max_retries": 2, "backoff": [2, 5],         "timeout": 15},
    "notion":     {"max_retries": 2, "backoff": [2, 5],         "timeout": 15},
}

# Services that are optional — failure should NOT stop the automation
OPTIONAL_SERVICES = {"slack", "miro", "notion", "clickup"}


async def retry_with_backoff(
    func: Callable,
    args: dict,
    service: str,
    node_id: str,
    client_name: str,
    slack_log_func: Optional[Callable] = None,
    slack_alert_func: Optional[Callable] = None,
) -> dict[str, Any]:
    """
    Execute func(**args) with service-specific retry profile.

    Returns:
        {'success': True, 'result': ...} on success
        {'success': False, 'error': ..., 'retries': N, 'optional': bool} on failure
    """
    profile = RETRY_PROFILES.get(service, RETRY_PROFILES["close"])
    max_retries = profile["max_retries"]
    backoff_schedule = profile["backoff"]
    is_optional = service in OPTIONAL_SERVICES

    # Check circuit breaker first
    cb = CircuitBreaker.get(service)
    if not cb.can_execute():
        msg = f"Circuit Breaker OPEN for {service} — skipping {node_id}"
        logger.warning(msg)
        if slack_alert_func:
            await slack_alert_func(f"{client_name} — {node_id}: {service} Circuit Breaker OPEN")
        return {"success": False, "error": msg, "retries": 0, "optional": is_optional, "circuit_open": True}

    # Check rate limiter
    rl = RateLimiter.get(service)
    if rl and not rl.can_acquire():
        wait = rl.wait_time()
        logger.info(f"Rate limit for {service} — waiting {wait:.1f}s")
        await asyncio.sleep(wait)

    last_error = None
    for attempt in range(max_retries + 1):
        try:
            if asyncio.iscoroutinefunction(func):
                result = await asyncio.wait_for(func(**args), timeout=profile["timeout"])
            else:
                result = func(**args)

            # Success — record it
            cb.record_success()
            if rl:
                rl.consume()
            return {"success": True, "result": result}

        except Exception as e:
            last_error = str(e)
            cb.record_failure()
            logger.warning(f"[{node_id}] {service} attempt {attempt + 1}/{max_retries + 1} failed: {last_error}")

            if attempt < max_retries:
                delay = backoff_schedule[min(attempt, len(backoff_schedule) - 1)]
                if slack_log_func:
                    await slack_log_func(
                        f"⟳ {client_name} — {node_id} Retry {attempt + 1}/{max_retries} ({service}: {last_error[:50]})"
                    )
                await asyncio.sleep(delay)

    # All retries exhausted
    logger.error(f"[{node_id}] {service} FAILED after {max_retries + 1} attempts: {last_error}")

    # Add to DLQ
    DeadLetterQueue.add(node_id, client_name, service, last_error)

    if slack_alert_func:
        await slack_alert_func(
            f"{client_name} — {node_id} FAILED nach {max_retries + 1} Versuchen ({service}: {last_error[:80]})"
        )

    return {"success": False, "error": last_error, "retries": max_retries, "optional": is_optional}


# ============================================================
# CIRCUIT BREAKER
# ============================================================

class CircuitBreaker:
    """
    States: CLOSED (normal) → OPEN (too many failures) → HALF_OPEN (testing)
    Persistent in state/circuit-breaker.json
    """
    _instances: dict[str, "CircuitBreaker"] = {}

    def __init__(self, service: str, failure_threshold: int = 5, window_seconds: int = 60, cooldown_seconds: int = 300):
        self.service = service
        self.failure_threshold = failure_threshold
        self.window_seconds = window_seconds
        self.cooldown_seconds = cooldown_seconds
        self._failures: list[float] = []
        self._state = "closed"
        self._opened_at: Optional[float] = None
        self._half_open_successes = 0
        self._load()

    @classmethod
    def get(cls, service: str) -> "CircuitBreaker":
        if service not in cls._instances:
            cls._instances[service] = CircuitBreaker(service)
        return cls._instances[service]

    def can_execute(self) -> bool:
        if self._state == "closed":
            return True
        if self._state == "open":
            if self._opened_at and (time.time() - self._opened_at) > self.cooldown_seconds:
                self._state = "half_open"
                self._half_open_successes = 0
                self._save()
                return True
            return False
        # half_open — allow one request
        return True

    def record_success(self):
        if self._state == "half_open":
            self._half_open_successes += 1
            if self._half_open_successes >= 2:
                self._state = "closed"
                self._failures.clear()
                self._opened_at = None
                logger.info(f"Circuit Breaker {self.service}: CLOSED (recovered)")
        self._save()

    def record_failure(self):
        now = time.time()
        self._failures = [t for t in self._failures if now - t < self.window_seconds]
        self._failures.append(now)

        if self._state == "half_open":
            self._state = "open"
            self._opened_at = time.time()
            logger.warning(f"Circuit Breaker {self.service}: OPEN (half-open test failed)")
        elif len(self._failures) >= self.failure_threshold:
            self._state = "open"
            self._opened_at = time.time()
            logger.warning(f"Circuit Breaker {self.service}: OPEN ({len(self._failures)} failures in {self.window_seconds}s)")
        self._save()

    def get_state(self) -> str:
        # Re-check if cooldown passed
        if self._state == "open" and self._opened_at:
            if time.time() - self._opened_at > self.cooldown_seconds:
                self._state = "half_open"
                self._save()
        return self._state

    def _load(self):
        if CIRCUIT_BREAKER_FILE.exists():
            try:
                data = json.loads(CIRCUIT_BREAKER_FILE.read_text())
                if self.service in data:
                    s = data[self.service]
                    self._state = s.get("state", "closed")
                    self._opened_at = s.get("opened_at")
                    self._failures = s.get("failures", [])
            except (json.JSONDecodeError, KeyError):
                pass

    def _save(self):
        data = {}
        if CIRCUIT_BREAKER_FILE.exists():
            try:
                data = json.loads(CIRCUIT_BREAKER_FILE.read_text())
            except json.JSONDecodeError:
                data = {}
        data[self.service] = {
            "state": self._state,
            "opened_at": self._opened_at,
            "failures": self._failures[-20:],  # Keep last 20
        }
        CIRCUIT_BREAKER_FILE.write_text(json.dumps(data, indent=2))


# ============================================================
# RATE LIMITER (Token Bucket)
# ============================================================

class RateLimiter:
    """Token Bucket rate limiter per service."""
    _instances: dict[str, "RateLimiter"] = {}

    LIMITS: dict[str, tuple[int, int]] = {
        "meta":     (20, 900),    # 20 tokens per 15min
        "airtable": (4, 1),       # 4 tokens per second
        "clickup":  (80, 60),     # 80 tokens per minute
        "close":    (50, 60),     # 50 tokens per minute
    }

    def __init__(self, service: str, max_tokens: int, refill_seconds: int):
        self.service = service
        self.max_tokens = max_tokens
        self.refill_seconds = refill_seconds
        self._tokens = float(max_tokens)
        self._last_refill = time.time()

    @classmethod
    def get(cls, service: str) -> Optional["RateLimiter"]:
        if service not in cls.LIMITS:
            return None
        if service not in cls._instances:
            max_t, refill_s = cls.LIMITS[service]
            cls._instances[service] = RateLimiter(service, max_t, refill_s)
        return cls._instances[service]

    def _refill(self):
        now = time.time()
        elapsed = now - self._last_refill
        tokens_to_add = elapsed * (self.max_tokens / self.refill_seconds)
        self._tokens = min(self.max_tokens, self._tokens + tokens_to_add)
        self._last_refill = now

    def can_acquire(self) -> bool:
        self._refill()
        return self._tokens >= 1

    def consume(self):
        self._refill()
        self._tokens = max(0, self._tokens - 1)

    def wait_time(self) -> float:
        self._refill()
        if self._tokens >= 1:
            return 0
        deficit = 1 - self._tokens
        return deficit * (self.refill_seconds / self.max_tokens)


# ============================================================
# CONTEXT VALIDATION
# ============================================================

NODE_REQUIREMENTS: dict[str, list[str]] = {
    "is04":       ["lead_id"],
    "is05":       ["lead_id", "email"],
    "is06":       ["lead_id"],
    "is07":       ["folder_root_id"],
    "is08":       ["lead_id"],
    "is09":       ["list_id"],
    "is10":       ["opportunity_id"],
    "is11":       ["list_id"],
    "v2-extract": ["airtable_client_id"],
    "v2-st01":    ["bausteine"],
    "v2-st02":    ["bausteine"],
    "v2-st03":    ["bausteine"],
    "v2-st04":    ["bausteine"],
    "v2-st05":    ["bausteine"],
    "v2-cc01":    ["bausteine", "generated_docs"],
    "v2-cc02":    ["bausteine", "generated_docs"],
    "v2-cc03":    ["bausteine", "generated_docs"],
    "v2-cc04":    ["bausteine", "generated_docs"],
    "v2-cc05":    ["bausteine", "generated_docs"],
    "v2-cc06":    ["bausteine", "generated_docs"],
    "v2-cc07":    ["bausteine", "generated_docs"],
    "ca04":       ["meta_campaigns"],
    "ca05":       ["meta_campaigns", "image_hashes"],
    "ca07":       ["meta_campaigns"],
    "ca09":       ["meta_campaigns"],
    "rl09a":      ["meta_campaigns"],
    "fn10a":      ["folder_root_id"],
    "fn10b":      ["folder_root_id"],
    "notion-wiki":["lead_id", "folder_root_id"],
}


def validate_context(node_id: str, context: dict) -> tuple[bool, Optional[str]]:
    """
    Check if all required context fields exist for a given node.

    Returns:
        (True, None) if valid
        (False, "missing_field_name") if invalid
    """
    required = NODE_REQUIREMENTS.get(node_id, [])
    for field in required:
        if "." in field:
            # Nested field check: "meta_campaigns.initial"
            parts = field.split(".")
            obj = context
            for part in parts:
                if isinstance(obj, dict) and part in obj:
                    obj = obj[part]
                else:
                    return False, field
        elif field not in context or context[field] is None:
            return False, field
    return True, None


# ============================================================
# EXECUTION STATE PERSISTENCE
# ============================================================

class ExecutionState:
    """Persistent execution state per client, stored as JSON."""

    def __init__(self, execution_id: str, client_name: str):
        self.execution_id = execution_id
        self.client_name = client_name
        self.started_at = datetime.now(timezone.utc).isoformat()
        self.completed_at: Optional[str] = None
        self.paused_at: Optional[str] = None
        self.context: dict[str, Any] = {}
        self.nodes: dict[str, dict[str, Any]] = {}
        self._file = EXECUTIONS_DIR / f"{execution_id}.json"

    def update_node(
        self,
        node_id: str,
        status: str,
        result: Optional[dict] = None,
        error: Optional[str] = None,
        duration_ms: Optional[int] = None,
        retries: int = 0,
    ):
        self.nodes[node_id] = {
            "status": status,
            "result": result,
            "error": error,
            "duration_ms": duration_ms,
            "retries": retries,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
        self.save()

    def update_context(self, updates: dict):
        self.context.update(updates)
        self.save()

    def get_resume_point(self) -> Optional[str]:
        """Find first node that is not 'completed' or 'failed'."""
        for node_id, data in self.nodes.items():
            if data["status"] not in ("completed", "failed"):
                return node_id
        return None

    def get_failed_nodes(self) -> list[str]:
        return [nid for nid, data in self.nodes.items() if data["status"] == "failed"]

    def is_complete(self) -> bool:
        return all(data["status"] == "completed" for data in self.nodes.values())

    def pause(self):
        self.paused_at = datetime.now(timezone.utc).isoformat()
        self.save()

    def resume(self):
        self.paused_at = None
        self.save()

    def save(self):
        data = {
            "execution_id": self.execution_id,
            "client_name": self.client_name,
            "started_at": self.started_at,
            "completed_at": self.completed_at,
            "paused_at": self.paused_at,
            "context": self.context,
            "nodes": self.nodes,
        }
        self._file.write_text(json.dumps(data, indent=2, default=str))

    @classmethod
    def load(cls, execution_id: str) -> Optional["ExecutionState"]:
        file = EXECUTIONS_DIR / f"{execution_id}.json"
        if not file.exists():
            return None
        try:
            data = json.loads(file.read_text())
            state = cls(data["execution_id"], data["client_name"])
            state.started_at = data.get("started_at", state.started_at)
            state.completed_at = data.get("completed_at")
            state.paused_at = data.get("paused_at")
            state.context = data.get("context", {})
            state.nodes = data.get("nodes", {})
            return state
        except (json.JSONDecodeError, KeyError) as e:
            logger.error(f"Failed to load execution state {execution_id}: {e}")
            return None

    @classmethod
    def list_all(cls) -> list[dict[str, Any]]:
        results = []
        for file in EXECUTIONS_DIR.glob("*.json"):
            try:
                data = json.loads(file.read_text())
                results.append({
                    "execution_id": data["execution_id"],
                    "client_name": data["client_name"],
                    "started_at": data.get("started_at"),
                    "paused_at": data.get("paused_at"),
                    "completed_at": data.get("completed_at"),
                    "node_count": len(data.get("nodes", {})),
                    "completed_nodes": sum(1 for n in data.get("nodes", {}).values() if n["status"] == "completed"),
                    "failed_nodes": sum(1 for n in data.get("nodes", {}).values() if n["status"] == "failed"),
                })
            except (json.JSONDecodeError, KeyError):
                continue
        return sorted(results, key=lambda x: x.get("started_at", ""), reverse=True)


# ============================================================
# DEAD LETTER QUEUE
# ============================================================

class DeadLetterQueue:
    """Failed nodes that exhausted all retries."""

    @staticmethod
    def add(node_id: str, client_name: str, service: str, error: str):
        entries = DeadLetterQueue._load()
        entries.append({
            "node_id": node_id,
            "client_name": client_name,
            "service": service,
            "error": error,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "resolved": False,
        })
        DLQ_FILE.write_text(json.dumps(entries, indent=2))
        logger.error(f"DLQ: Added {node_id} ({client_name}) — {service}: {error[:80]}")

    @staticmethod
    def get_unresolved() -> list[dict]:
        return [e for e in DeadLetterQueue._load() if not e.get("resolved")]

    @staticmethod
    def resolve(node_id: str, client_name: str):
        entries = DeadLetterQueue._load()
        for e in entries:
            if e["node_id"] == node_id and e["client_name"] == client_name and not e["resolved"]:
                e["resolved"] = True
                e["resolved_at"] = datetime.now(timezone.utc).isoformat()
        DLQ_FILE.write_text(json.dumps(entries, indent=2))

    @staticmethod
    def _load() -> list[dict]:
        if not DLQ_FILE.exists():
            return []
        try:
            return json.loads(DLQ_FILE.read_text())
        except json.JSONDecodeError:
            return []


# ============================================================
# EXECUTION LOCK (prevent concurrent runs for same client)
# ============================================================

_execution_locks: dict[str, str] = {}  # client_name → execution_id


def acquire_execution_lock(client_name: str, execution_id: str) -> bool:
    """Try to acquire a lock for a client. Returns False if already running."""
    if client_name in _execution_locks:
        existing = _execution_locks[client_name]
        # Check if the existing execution is still active
        state = ExecutionState.load(existing)
        if state and not state.completed_at and not state.paused_at:
            logger.warning(f"Execution lock: {client_name} already running ({existing})")
            return False
    _execution_locks[client_name] = execution_id
    return True


def release_execution_lock(client_name: str):
    _execution_locks.pop(client_name, None)
