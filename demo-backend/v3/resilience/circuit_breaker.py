"""
Circuit Breaker — Verhindert dass ein kaputtes Service den ganzen Flow blockiert.
Wenn ein Service >N Mal hintereinander fehlschlaegt, wird er fuer X Sekunden deaktiviert.
"""

import time
import logging

log = logging.getLogger("v3.circuit-breaker")


class CircuitBreaker:
    """Per-Service Circuit Breaker. States: CLOSED (normal), OPEN (skip), HALF_OPEN (probe)."""

    def __init__(self, service: str, failure_threshold: int = 3, recovery_timeout: int = 300):
        self.service = service
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self._failures = 0
        self._last_failure_time = 0.0
        self._state = "closed"  # closed | open | half_open

    @property
    def is_open(self) -> bool:
        if self._state == "open":
            # Check if recovery timeout has passed
            if time.time() - self._last_failure_time >= self.recovery_timeout:
                self._state = "half_open"
                log.info(f"[{self.service}] Circuit half-open, probing...")
                return False
            return True
        return False

    def record_success(self):
        if self._state == "half_open":
            log.info(f"[{self.service}] Circuit closed (probe succeeded)")
        self._failures = 0
        self._state = "closed"

    def record_failure(self):
        self._failures += 1
        self._last_failure_time = time.time()
        if self._failures >= self.failure_threshold:
            self._state = "open"
            log.warning(f"[{self.service}] Circuit OPEN nach {self._failures} Fehlern, skip fuer {self.recovery_timeout}s")

    def status(self) -> dict:
        return {
            "service": self.service,
            "state": self._state,
            "failures": self._failures,
            "threshold": self.failure_threshold,
        }


# Global registry
_breakers: dict[str, CircuitBreaker] = {}


def get_breaker(service: str) -> CircuitBreaker:
    if service not in _breakers:
        # Meta gets longer recovery (rate limits are aggressive)
        timeout = 600 if service == "meta" else 300
        _breakers[service] = CircuitBreaker(service, failure_threshold=3, recovery_timeout=timeout)
    return _breakers[service]


def all_breaker_status() -> list[dict]:
    return [b.status() for b in _breakers.values()]
