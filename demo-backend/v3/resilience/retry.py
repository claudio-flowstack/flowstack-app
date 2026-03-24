"""
Retry mit Exponential Backoff + Service-Mapping.
Erkennt Custom Error Types (AuthError, RateLimitError).
"""

import asyncio
import logging
from typing import Any, Callable, Optional
from ..integrations.errors import IntegrationError, AuthError, RateLimitError
from .circuit_breaker import get_breaker

log = logging.getLogger("v3.retry")

RETRY_PROFILES = {
    "close":      {"max_retries": 3, "backoff": [2, 5, 15],     "timeout": 30},
    "google":     {"max_retries": 3, "backoff": [2, 5, 15],     "timeout": 90},
    "slack":      {"max_retries": 3, "backoff": [2, 5, 15],     "timeout": 30},
    "clickup":    {"max_retries": 3, "backoff": [2, 5, 15],     "timeout": 30},
    "meta":       {"max_retries": 2, "backoff": [60, 300],       "timeout": 120},
    "airtable":   {"max_retries": 3, "backoff": [1, 3, 10],     "timeout": 15},
    "gemini":     {"max_retries": 2, "backoff": [10, 30],       "timeout": 180},
    "miro":       {"max_retries": 2, "backoff": [2, 5],         "timeout": 15},
}

OPTIONAL_SERVICES = {"miro"}

NODE_SERVICE_MAP = {
    "v3-is02a": "close", "v3-is02": "close", "v3-is02-reuse": "close", "v3-is10": "close",
    "v3-is03": "slack", "v3-kc06": "slack", "v3-rl-slack": "slack",
    "v3-is04": "google", "v3-is05": "google", "v3-is06a": "google", "v3-is06": "google",
    "v3-is07": "google", "v3-is-sheet": "google",
    "v3-is08": "clickup", "v3-is09": "clickup", "v3-rl-clickup": "clickup",
    "v3-is11": "miro",
    "v3-st-extract": "gemini", "v3-st01": "gemini", "v3-st02": "gemini",
    "v3-st03": "gemini", "v3-st04": "gemini", "v3-st05": "gemini",
    "v3-cc01": "gemini", "v3-cc02": "gemini", "v3-cc03": "gemini",
    "v3-cc04": "gemini", "v3-cc05": "gemini", "v3-cc06": "gemini", "v3-cc07": "gemini",
    "v3-cc01a": "gemini", "v3-cc02a": "gemini",
    "v3-st-sync": "airtable", "v3-cc-sync": "airtable",
    "v3-ca00": "meta", "v3-ca01": "meta", "v3-ca02": "meta", "v3-ca03": "meta",
    "v3-ca04": "meta", "v3-ca05": "meta", "v3-ca06": "meta", "v3-ca07": "meta",
    "v3-ca08": "meta", "v3-ca09": "meta",
    "v3-fn10a": "google", "v3-fn10b": "google",
    "v3-kc05": "close", "v3-st-close": "close", "v3-cc-close": "close", "v3-rl-close": "close",
    "v3-rl-activate": "meta",
}


def get_service_for_node(node_id: str) -> str:
    return NODE_SERVICE_MAP.get(node_id, "close")


async def retry_with_backoff(
    func: Callable,
    args: dict,
    service: str,
    node_id: str,
    client_name: str,
) -> dict[str, Any]:
    """Execute mit Retry + Circuit Breaker. Returns {'success': True, 'result': ...} oder {'success': False, 'error': ...}."""
    profile = RETRY_PROFILES.get(service, RETRY_PROFILES["close"])
    max_retries = profile["max_retries"]
    backoff = profile["backoff"]
    is_optional = service in OPTIONAL_SERVICES
    breaker = get_breaker(service)

    # Circuit Breaker: skip wenn Service als down markiert
    if breaker.is_open:
        msg = f"{service} Circuit OPEN, Node {node_id} uebersprungen"
        log.warning(msg)
        return {"success": False, "error": msg, "retries": 0, "optional": is_optional, "circuit_open": True}

    last_error = None
    for attempt in range(max_retries + 1):
        try:
            if asyncio.iscoroutinefunction(func):
                result = await asyncio.wait_for(func(**args), timeout=profile["timeout"])
            else:
                result = func(**args)
            breaker.record_success()
            return {"success": True, "result": result}
        except Exception as e:
            last_error = str(e)
            log.warning(f"[{node_id}] {service} attempt {attempt + 1}/{max_retries + 1}: {last_error[:80]}")

            # AuthError / non-retryable → sofort abbrechen
            if isinstance(e, AuthError) or (isinstance(e, IntegrationError) and not e.retryable):
                log.error(f"[{node_id}] {service} non-retryable: {last_error[:120]}")
                breaker.record_failure()
                break

            if attempt < max_retries:
                # RateLimitError → Server-Delay nutzen
                if isinstance(e, RateLimitError):
                    delay = e.retry_after
                else:
                    delay = backoff[min(attempt, len(backoff) - 1)]
                await asyncio.sleep(delay)

    breaker.record_failure()
    return {"success": False, "error": last_error, "retries": max_retries, "optional": is_optional}
