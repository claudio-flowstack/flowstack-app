"""Shared Pydantic models for all automations."""
from .context import AutomationContext
from .result import NodeResult, NodeStatus

__all__ = ["AutomationContext", "NodeResult", "NodeStatus"]
