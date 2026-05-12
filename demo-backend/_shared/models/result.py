"""NodeResult: structured response from any node handler."""
from __future__ import annotations
from enum import Enum
from typing import Any, Optional
from pydantic import BaseModel


class NodeStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    SKIPPED = "skipped"
    WAITING_APPROVAL = "waiting_approval"


class NodeResult(BaseModel):
    """Result returned by a node handler. Fields in `data` are merged into the AutomationContext."""
    status: NodeStatus = NodeStatus.COMPLETED
    data: dict[str, Any] = {}
    error: Optional[str] = None
    url: Optional[str] = None
    message: Optional[str] = None
