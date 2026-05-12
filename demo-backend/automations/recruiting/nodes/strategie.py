"""Strategy phase: st10.

Updates Close to 'Strategie erstellt', creates ClickUp follow-up tasks
(Texte reviewen, Videodreh durchführen), appends overview sheet rows.
"""
from __future__ import annotations
from _shared.models import AutomationContext, NodeResult
from .._v1_bridge import delegate_to_v1


async def st10(ctx: AutomationContext) -> NodeResult:
    """Strategy phase complete: stage update + follow-up tasks."""
    return await delegate_to_v1("st10", ctx)


HANDLERS = {"st10": st10}
