"""Copy creation phase: cc05.

Updates Close to 'Assets erstellt', creates ClickUp follow-up tasks
(Video schneiden, Funnel und Pixel prüfen), notifies via Slack.
"""
from __future__ import annotations
from _shared.models import AutomationContext, NodeResult
from .._v1_bridge import delegate_to_v1


async def cc05(ctx: AutomationContext) -> NodeResult:
    """Copy phase complete: stage update + Video/Funnel review tasks."""
    return await delegate_to_v1("cc05", ctx)


HANDLERS = {"cc05": cc05}
