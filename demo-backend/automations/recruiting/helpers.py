"""Domain helpers for the Recruiting automation."""
from __future__ import annotations
from typing import Any

from .config import MASTER_DOCS


def client_docs(context: Any) -> dict[str, str]:
    """Return client-specific Doc copies, falling back to master docs."""
    docs = context.get("client_docs") if hasattr(context, "get") else None
    return docs or MASTER_DOCS


def resolve_docs(context: Any, keys: list[str]) -> dict[str, str]:
    """Return a partial dict of client docs (or master fallback) for the given keys."""
    docs = client_docs(context)
    return {k: docs[k] for k in keys if k in docs}
