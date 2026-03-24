"""
Execution State Persistence — Speichert State als JSON, überlebt Restart.
"""

import fcntl
import json
import logging
import os
import tempfile
from datetime import datetime, timezone, timedelta
from typing import Any, Optional
from ..config import EXECUTIONS_DIR

log = logging.getLogger("v3.state")


class ExecutionState:
    """Persistent execution state per client."""

    def __init__(self, execution_id: str, client_name: str):
        self.execution_id = execution_id
        self.client_name = client_name
        self.started_at = datetime.now(timezone.utc).isoformat()
        self.completed_at: Optional[str] = None
        self.paused_at: Optional[str] = None
        self.context: dict[str, Any] = {}
        self.nodes: dict[str, dict[str, Any]] = {}
        self._file = EXECUTIONS_DIR / f"{execution_id}.json"

    def update_node(self, node_id: str, status: str, result: Any = None, error: str = None, duration_ms: int = None, retries: int = 0):
        self.nodes[node_id] = {
            "status": status, "result": result, "error": error,
            "duration_ms": duration_ms, "retries": retries,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
        self.save()

    def update_context(self, updates: dict):
        self.context.update(updates)
        self.save()

    def pause(self):
        self.paused_at = datetime.now(timezone.utc).isoformat()
        self.save()

    def resume(self):
        self.paused_at = None
        self.save()

    def save(self):
        """Atomic save with file locking."""
        data = {
            "execution_id": self.execution_id, "client_name": self.client_name,
            "started_at": self.started_at, "completed_at": self.completed_at,
            "paused_at": self.paused_at, "context": self.context, "nodes": self.nodes,
        }
        dir_path = self._file.parent
        fd, tmp_path = tempfile.mkstemp(dir=str(dir_path), suffix='.tmp')
        try:
            with os.fdopen(fd, 'w') as f:
                fcntl.flock(f, fcntl.LOCK_EX)
                json.dump(data, f, ensure_ascii=False, indent=2, default=str)
                fcntl.flock(f, fcntl.LOCK_UN)
            os.rename(tmp_path, str(self._file))
        except Exception:
            try:
                os.unlink(tmp_path)
            except OSError:
                pass
            raise

    @classmethod
    def load(cls, execution_id: str) -> Optional["ExecutionState"]:
        file = EXECUTIONS_DIR / f"{execution_id}.json"
        if not file.exists():
            return None
        try:
            with open(file) as f:
                fcntl.flock(f, fcntl.LOCK_SH)
                f.seek(0)
                data = json.load(f)
                fcntl.flock(f, fcntl.LOCK_UN)
            state = cls(data["execution_id"], data["client_name"])
            state.started_at = data.get("started_at", state.started_at)
            state.completed_at = data.get("completed_at")
            state.paused_at = data.get("paused_at")
            state.context = data.get("context", {})
            state.nodes = data.get("nodes", {})

            # S10: Recover stale "running" nodes (>5 min timeout)
            needs_save = False
            now = datetime.now(timezone.utc)
            for node_id, node_data in state.nodes.items():
                if node_data.get("status") == "running":
                    updated_at = node_data.get("updated_at", "")
                    if updated_at:
                        try:
                            node_time = datetime.fromisoformat(updated_at.replace("Z", "+00:00"))
                            if (now - node_time) > timedelta(minutes=5):
                                state.nodes[node_id]["status"] = "failed"
                                state.nodes[node_id]["error"] = "Timeout: Node war laenger als 5 Minuten im Status 'running'"
                                needs_save = True
                        except (ValueError, TypeError):
                            pass
            if needs_save:
                state.save()

            return state
        except Exception as e:
            log.error(f"State load error: {e}")
            return None

    @classmethod
    def list_all(cls) -> list[dict]:
        results = []
        for file in EXECUTIONS_DIR.glob("*.json"):
            try:
                data = json.loads(file.read_text())
                results.append({
                    "execution_id": data["execution_id"], "client_name": data["client_name"],
                    "started_at": data.get("started_at"), "paused_at": data.get("paused_at"),
                    "node_count": len(data.get("nodes", {})),
                    "completed_nodes": sum(1 for n in data.get("nodes", {}).values() if n["status"] == "completed"),
                })
            except Exception:
                continue
        return sorted(results, key=lambda x: x.get("started_at", ""), reverse=True)
