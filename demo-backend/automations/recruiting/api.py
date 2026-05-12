"""FastAPI router for V2 - Recruiting Engine.

Mounts under /api/recruiting/* in the main app. Runs alongside V1 endpoints
(/api/execute-node, server.py) during the migration window.
"""
from __future__ import annotations
import logging
from typing import Any

from fastapi import APIRouter, HTTPException

from _shared.models import AutomationContext, NodeResult, NodeStatus
from .nodes import ALL_HANDLERS, PHASES

log = logging.getLogger("recruiting.api")

router = APIRouter(prefix="/api/recruiting", tags=["recruiting"])


@router.get("/")
async def root() -> dict[str, Any]:
    """Quick overview: registered phases and node count."""
    return {
        "automation": "recruiting",
        "version": "1.0",
        "phases": {name: list(handlers.keys()) for name, handlers in PHASES.items()},
        "total_nodes": len(ALL_HANDLERS),
    }


@router.get("/nodes")
async def list_nodes() -> dict[str, list[str]]:
    """List all node-ids per phase."""
    return {name: list(handlers.keys()) for name, handlers in PHASES.items()}


@router.post("/execute-node")
async def execute_node(body: dict[str, Any]) -> dict[str, Any]:
    """Execute a single recruiting node.

    Body shape: {"nodeId": "is02", "context": {"company": "...", "email": "...", ...}}
    Returns: {"ok": True, "result": {...}, "url": "..."} or {"ok": False, "error": "..."}
    """
    node_id = body.get("nodeId", "")
    if not node_id:
        raise HTTPException(400, "nodeId missing")

    handler = ALL_HANDLERS.get(node_id)
    if not handler:
        raise HTTPException(404, f"Unknown node: {node_id}")

    raw_ctx = body.get("context", {}) or {}
    ctx = AutomationContext(**{k: v for k, v in raw_ctx.items() if k in AutomationContext.model_fields})
    # Merge any extra fields not in the strict model
    extras = {k: v for k, v in raw_ctx.items() if k not in AutomationContext.model_fields}
    if extras:
        ctx.merge(**extras)

    try:
        result: NodeResult = await handler(ctx)
    except HTTPException:
        raise
    except Exception as e:
        log.error(f"Node {node_id} crashed: {e}", exc_info=True)
        return {"ok": False, "error": str(e), "node_id": node_id}

    return {
        "ok": result.status != NodeStatus.FAILED,
        "node_id": node_id,
        "status": result.status.value,
        "result": result.data,
        "url": result.url,
        "error": result.error,
        "message": result.message,
    }


@router.get("/phases/{phase_name}")
async def get_phase(phase_name: str) -> dict[str, Any]:
    """Get info about one phase: its node-ids and order."""
    handlers = PHASES.get(phase_name)
    if not handlers:
        raise HTTPException(404, f"Unknown phase: {phase_name}")
    return {
        "phase": phase_name,
        "nodes": list(handlers.keys()),
        "node_count": len(handlers),
    }
