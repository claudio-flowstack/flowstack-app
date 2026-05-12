"""Strangler-Fig bridge to V1 server.py.

Phase-out target: each node should eventually be reimplemented natively in
the corresponding nodes/<phase>.py file (see kickoff.py as the reference port).
Until that migration happens, this bridge keeps node behavior identical to V1.
"""
from __future__ import annotations
from _shared.models import AutomationContext, NodeResult, NodeStatus


async def delegate_to_v1(node_id: str, ctx: AutomationContext) -> NodeResult:
    """Delegate node execution to V1 server.py.execute_node() and wrap the result."""
    from server import execute_node  # lazy import to avoid circular load
    body = {"nodeId": node_id, "context": ctx.as_dict()}
    response = await execute_node(body)
    if not response.get("ok"):
        return NodeResult(
            status=NodeStatus.FAILED,
            error=response.get("error") or "unknown V1 error",
        )
    result = response.get("result")
    if isinstance(result, dict):
        return NodeResult(
            status=NodeStatus.COMPLETED,
            data=result,
            url=result.get("url"),
        )
    return NodeResult(
        status=NodeStatus.COMPLETED,
        data={"raw": result},
        message=response.get("message", ""),
    )
