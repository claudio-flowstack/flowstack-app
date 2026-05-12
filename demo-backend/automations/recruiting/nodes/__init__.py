"""Node handlers for the Recruiting automation. One file per phase.

Each phase exports HANDLERS: dict[str, async fn(ctx) -> NodeResult].
The phase registry below combines all phases into one lookup.
"""
from __future__ import annotations
from typing import Any

from . import infrastruktur, kickoff, strategie, copy, campaigns, retention

# All node handlers, keyed by V1 node-id (no prefix).
ALL_HANDLERS: dict[str, Any] = {
    **infrastruktur.HANDLERS,
    **kickoff.HANDLERS,
    **strategie.HANDLERS,
    **copy.HANDLERS,
    **campaigns.HANDLERS,
    **retention.HANDLERS,
}

# Per-phase exports (for tooling that wants to enumerate phases).
PHASES = {
    "infrastruktur": infrastruktur.HANDLERS,
    "kickoff": kickoff.HANDLERS,
    "strategie": strategie.HANDLERS,
    "copy": copy.HANDLERS,
    "campaigns": campaigns.HANDLERS,
    "retention": retention.HANDLERS,
}
