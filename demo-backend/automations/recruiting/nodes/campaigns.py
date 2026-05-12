"""Meta Ads campaigns phase: ca01 - ca09.

Creates 3 Custom Audiences (pixel-based), 3 campaigns (Initial / Retargeting /
Warmup) with their respective AdSets and Ads. All start PAUSED for review.
"""
from __future__ import annotations
from _shared.models import AutomationContext, NodeResult
from .._v1_bridge import delegate_to_v1


async def ca01(ctx: AutomationContext) -> NodeResult:
    """Custom Audience: AllVisitors_30d (all website visitors, 30d retention)."""
    return await delegate_to_v1("ca01", ctx)


async def ca02(ctx: AutomationContext) -> NodeResult:
    """Custom Audience: LP_Visitors_NoApplication_7d."""
    return await delegate_to_v1("ca02", ctx)


async def ca03(ctx: AutomationContext) -> NodeResult:
    """Custom Audience: Application_Visitors_NoLead_7d."""
    return await delegate_to_v1("ca03", ctx)


async def ca04(ctx: AutomationContext) -> NodeResult:
    """Initial (TOF) campaign: Objective Leads, EUR 30/day per AdSet."""
    return await delegate_to_v1("ca04", ctx)


async def ca05(ctx: AutomationContext) -> NodeResult:
    """Initial AdSets x3 (Broad + 2 Interest), EUR 30/day each, with creatives."""
    return await delegate_to_v1("ca05", ctx)


async def ca06(ctx: AutomationContext) -> NodeResult:
    """Retargeting campaign: Objective Leads, targets website visitors."""
    return await delegate_to_v1("ca06", ctx)


async def ca07(ctx: AutomationContext) -> NodeResult:
    """Retargeting AdSets x3 with custom audiences, EUR 10/day each."""
    return await delegate_to_v1("ca07", ctx)


async def ca08(ctx: AutomationContext) -> NodeResult:
    """Warmup campaign: Objective Awareness for brand building."""
    return await delegate_to_v1("ca08", ctx)


async def ca09(ctx: AutomationContext) -> NodeResult:
    """Warmup AdSets: Reach-optimized placements."""
    return await delegate_to_v1("ca09", ctx)


HANDLERS = {
    "ca01": ca01, "ca02": ca02, "ca03": ca03,
    "ca04": ca04, "ca05": ca05, "ca06": ca06,
    "ca07": ca07, "ca08": ca08, "ca09": ca09,
}
