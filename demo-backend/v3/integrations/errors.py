"""
Custom Error Types für V3 Integrations.
Werden von retry.py erkannt und behandelt.
"""


class IntegrationError(Exception):
    """Basis-Error für alle Integration-Fehler."""

    def __init__(self, service: str, action: str, message: str, retryable: bool = True, status_code: int = 0):
        self.service = service
        self.action = action
        self.retryable = retryable
        self.status_code = status_code
        super().__init__(f"[{service}] {action}: {message}")


def retryable(max_retries: int = 1, delay: float = 2.0):
    """Decorator fuer Client-Methoden: 1x Retry bei Timeout/5xx/ConnectionError."""
    import asyncio
    import functools
    import logging
    _log = logging.getLogger("v3.retry-decorator")

    def decorator(func):
        @functools.wraps(func)
        async def wrapper(*args, **kwargs):
            last_err = None
            for attempt in range(max_retries + 1):
                try:
                    return await func(*args, **kwargs)
                except (AuthError, NotFoundError):
                    raise  # Never retry auth/404
                except IntegrationError as e:
                    if not e.retryable:
                        raise
                    last_err = e
                except Exception as e:
                    err_str = str(e).lower()
                    is_retryable = any(k in err_str for k in ("timeout", "connection", "connect", "reset", "broken pipe"))
                    if not is_retryable and not (hasattr(e, "status_code") and getattr(e, "status_code", 0) >= 500):
                        raise
                    last_err = e
                if attempt < max_retries:
                    _log.warning(f"[{func.__qualname__}] attempt {attempt + 1} failed, retry in {delay}s: {last_err}")
                    await asyncio.sleep(delay)
            raise last_err
        return wrapper
    return decorator


class RateLimitError(IntegrationError):
    """429 — Service Rate Limit erreicht."""

    def __init__(self, service: str, action: str, retry_after: int = 60):
        self.retry_after = retry_after
        super().__init__(service, action, f"Rate limited, retry after {retry_after}s", retryable=True, status_code=429)


class AuthError(IntegrationError):
    """401/403 — Token ungültig oder abgelaufen."""

    def __init__(self, service: str, action: str, message: str = "Authentication failed"):
        super().__init__(service, action, message, retryable=False, status_code=401)


class NotFoundError(IntegrationError):
    """404 — Resource nicht gefunden."""

    def __init__(self, service: str, action: str, resource_id: str = ""):
        super().__init__(service, action, f"Not found: {resource_id}", retryable=False, status_code=404)
