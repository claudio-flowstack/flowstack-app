"""V2 - Recruiting Engine.

Production-ready recruiting automation for recruiting-marketing agencies.
Generic (no demo data hardcoded), modular architecture with Pydantic models
and shared integration layer.

V1 (V1 - Novacode Recruiting) lives in demo-backend/server.py and is currently
active for the demo. V2 runs in parallel and delegates to V1 via Strangler-Fig
until each node is natively reimplemented.

Drives the complete go-to-market funnel:
infrastructure -> kickoff -> strategy -> copy -> funnel -> ads -> campaigns -> retention.

Quick reference:
- nodes/<phase>.py: per-phase async handlers (input: AutomationContext, output: NodeResult)
- nodes/__init__.py: ALL_HANDLERS lookup + PHASES dict
- config.py: domain constants (MASTER_DOCS, FUNNEL_LINKS, AD_COPY_*)
- helpers.py: client_docs, resolve_docs
- _v1_bridge.py: Strangler-Fig delegation to V1 (server.py) — phase-out target
"""
from .nodes import ALL_HANDLERS, PHASES

__all__ = ["ALL_HANDLERS", "PHASES"]
