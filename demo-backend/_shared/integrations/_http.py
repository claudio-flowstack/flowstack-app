"""Shared httpx AsyncClient. One pool, used by all integrations."""
from __future__ import annotations
import httpx

_http: httpx.AsyncClient = httpx.AsyncClient(
    timeout=httpx.Timeout(30.0, connect=10.0),
    limits=httpx.Limits(max_connections=20, max_keepalive_connections=10),
)


def get_http_client() -> httpx.AsyncClient:
    return _http


async def close_http_client() -> None:
    await _http.aclose()
