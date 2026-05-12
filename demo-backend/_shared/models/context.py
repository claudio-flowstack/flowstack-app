"""AutomationContext: typed payload that flows through every node."""
from __future__ import annotations
from typing import Any
from pydantic import BaseModel, ConfigDict


class AutomationContext(BaseModel):
    """Context dictionary that flows through every node of an automation.

    Required fields are validated at start. Phase-specific fields
    (drive_folder_url, channel_id, lead_id etc.) are added dynamically
    via extra="allow".
    """
    model_config = ConfigDict(extra="allow")

    # Required input to start any automation
    company: str = ""
    contact: str = ""
    email: str = ""
    phone: str = ""
    branche: str = ""
    website: str = ""
    account_manager: str = "Claudio"

    def get(self, key: str, default: Any = None) -> Any:
        """Dict-compatible access for legacy node code that uses context.get(...)."""
        if hasattr(self, key):
            return getattr(self, key)
        extras = self.model_extra or {}
        return extras.get(key, default)

    def merge(self, **kwargs: Any) -> None:
        """Merge a dict of new fields into the context (mutates in place)."""
        for k, v in kwargs.items():
            setattr(self, k, v)

    def as_dict(self) -> dict[str, Any]:
        """Plain dict representation, useful for backward-compatible APIs."""
        return self.model_dump(exclude_none=False)
