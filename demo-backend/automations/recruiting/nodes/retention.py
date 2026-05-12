"""Review and Launch phase: rl06 - rl13.

Asset package ready, QA + campaign review tasks, Close stage progression
through 'Warte auf Freigabe' -> 'Bereit für Launch' -> 'Live', launch
notification, and Meta performance sync to overview sheet.
"""
from __future__ import annotations
from _shared.models import AutomationContext, NodeResult
from .._v1_bridge import delegate_to_v1


async def rl06(ctx: AutomationContext) -> NodeResult:
    """Asset package ready: Slack notification + sheet rows for funnel and tracking."""
    return await delegate_to_v1("rl06", ctx)


async def rl07(ctx: AutomationContext) -> NodeResult:
    """Awaiting approval: Close stage update + audience and campaign QA tasks."""
    return await delegate_to_v1("rl07", ctx)


async def rl09(ctx: AutomationContext) -> NodeResult:
    """Ready to launch: Close stage to 'Bereit für Launch'."""
    return await delegate_to_v1("rl09", ctx)


async def rl11(ctx: AutomationContext) -> NodeResult:
    """Live: Close stage update + activation and monitoring tasks."""
    return await delegate_to_v1("rl11", ctx)


async def rl12(ctx: AutomationContext) -> NodeResult:
    """Launch announcement: rich Slack block-kit message with overview link."""
    return await delegate_to_v1("rl12", ctx)


async def rl13(ctx: AutomationContext) -> NodeResult:
    """Performance sync: Meta Ads insights -> client overview sheet (last 7d)."""
    return await delegate_to_v1("rl13", ctx)


HANDLERS = {
    "rl06": rl06, "rl07": rl07, "rl09": rl09,
    "rl11": rl11, "rl12": rl12, "rl13": rl13,
}
