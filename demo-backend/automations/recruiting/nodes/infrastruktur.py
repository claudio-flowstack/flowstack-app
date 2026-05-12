"""Infrastructure setup phase: is02 - is10.

Creates Close lead + opportunity, Slack channel + welcome thread, welcome email,
calendar kickoff event, Drive folder tree, master-doc copies, ClickUp project
list with onboarding tasks, and updates Close to the "Kickoff geplant" stage.

Currently delegates to V1 server.py. Migrate node-by-node to native handlers
that use _shared/integrations/* directly.
"""
from __future__ import annotations
from _shared.models import AutomationContext, NodeResult
from .._v1_bridge import delegate_to_v1


async def is02(ctx: AutomationContext) -> NodeResult:
    """Create Close lead + opportunity for the recruiting client."""
    return await delegate_to_v1("is02", ctx)


async def is03(ctx: AutomationContext) -> NodeResult:
    """Create project overview Sheet + Slack client channel + welcome thread."""
    return await delegate_to_v1("is03", ctx)


async def is04(ctx: AutomationContext) -> NodeResult:
    """Send welcome email with upload link to the client."""
    return await delegate_to_v1("is04", ctx)


async def is05(ctx: AutomationContext) -> NodeResult:
    """Create Google Calendar kickoff event + invite client."""
    return await delegate_to_v1("is05", ctx)


async def is06(ctx: AutomationContext) -> NodeResult:
    """Create Drive folder tree (root + 8 subfolders)."""
    return await delegate_to_v1("is06", ctx)


async def is07(ctx: AutomationContext) -> NodeResult:
    """Copy master Google Docs into client Drive folders (Strategie, Messaging, etc.)."""
    return await delegate_to_v1("is07", ctx)


async def is08(ctx: AutomationContext) -> NodeResult:
    """Create ClickUp client list."""
    return await delegate_to_v1("is08", ctx)


async def is09(ctx: AutomationContext) -> NodeResult:
    """Create ClickUp onboarding tasks (3 initial tasks)."""
    return await delegate_to_v1("is09", ctx)


async def is10(ctx: AutomationContext) -> NodeResult:
    """Update Close stage to 'Kickoff geplant' + write resources note to lead."""
    return await delegate_to_v1("is10", ctx)


HANDLERS = {
    "is02": is02, "is03": is03, "is04": is04, "is05": is05,
    "is06": is06, "is07": is07, "is08": is08, "is09": is09, "is10": is10,
}
