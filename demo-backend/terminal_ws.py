"""
WebSocket PTY Handler for Flowstack Terminal.

Spawns a bash shell per WebSocket connection and relays I/O.
Mounted in server.py via: app.include_router(terminal_router)
"""
from __future__ import annotations

import asyncio
import fcntl
import json
import logging
import os
import pty
import signal
import struct
import termios

import pathlib
import subprocess

from fastapi import APIRouter, Query, WebSocket, WebSocketDisconnect

log = logging.getLogger("terminal")
router = APIRouter()

# Track active sessions for cleanup
_sessions: dict[str, dict] = {}


HOME = pathlib.Path.home()
PROJECT_ROOT = pathlib.Path(__file__).resolve().parent.parent

FLOWSTACK = HOME / "Desktop" / "Flowstack "

# Quick-access directories — Claudio's projects
BOOKMARKS = [
    {"label": "Flowstack Platform", "path": str(PROJECT_ROOT)},
    {"label": "Demo-Backend", "path": str(PROJECT_ROOT / "demo-backend")},
    {"label": "LeadFlow Marketing", "path": str(HOME / "Desktop" / "LeadFlow-Marketing")},
    {"label": "01 Kunden", "path": str(FLOWSTACK / "01_Kunden")},
    {"label": "02 Vertrieb", "path": str(FLOWSTACK / "02_Vertrieb")},
    {"label": "03 Automations", "path": str(FLOWSTACK / "03_Automations")},
    {"label": "04 Marketing", "path": str(FLOWSTACK / "04_Marketing")},
    {"label": "05 Finanzen", "path": str(FLOWSTACK / "05_Finanzen")},
    {"label": "06 Betrieb", "path": str(FLOWSTACK / "06_Betrieb")},
    {"label": "Desktop", "path": str(HOME / "Desktop")},
    {"label": "Downloads", "path": str(HOME / "Downloads")},
]


@router.get("/api/files/bookmarks")
async def file_bookmarks():
    return BOOKMARKS


@router.get("/api/files/browse")
async def file_browse(dir: str = Query(default="")):
    """List files in a directory."""
    target = pathlib.Path(dir) if dir else PROJECT_ROOT
    if not target.is_dir():
        return {"error": "Not a directory", "items": []}
    items = []
    try:
        for entry in sorted(target.iterdir(), key=lambda e: (not e.is_dir(), e.name.lower())):
            if entry.name.startswith("."):
                continue
            items.append({
                "name": entry.name,
                "path": str(entry),
                "isDir": entry.is_dir(),
                "size": entry.stat().st_size if entry.is_file() else None,
            })
    except PermissionError:
        pass
    return {"parent": str(target.parent), "current": str(target), "items": items}


@router.get("/api/files/search")
async def file_search(q: str = Query(default=""), dir: str = Query(default="")):
    """Fast file search using mdfind (Spotlight) with fallback to find."""
    if not q or len(q) < 2:
        return {"results": []}
    search_dir = dir or str(HOME)
    try:
        # Use macOS Spotlight for instant search
        result = subprocess.run(
            ["mdfind", "-onlyin", search_dir, "-name", q],
            capture_output=True, text=True, timeout=3,
        )
        paths = [p for p in result.stdout.strip().split("\n") if p][:40]
    except Exception:
        # Fallback: simple find
        try:
            result = subprocess.run(
                ["find", search_dir, "-maxdepth", "5", "-iname", f"*{q}*", "-not", "-path", "*/.*"],
                capture_output=True, text=True, timeout=3,
            )
            paths = [p for p in result.stdout.strip().split("\n") if p][:40]
        except Exception:
            paths = []

    results = []
    for p in paths:
        pp = pathlib.Path(p)
        results.append({
            "name": pp.name,
            "path": str(pp),
            "isDir": pp.is_dir(),
            "dir": str(pp.parent),
        })
    return {"results": results}


@router.websocket("/ws/terminal/{session_id}")
async def terminal_ws(ws: WebSocket, session_id: str):
    await ws.accept()
    log.info(f"Terminal WebSocket connected: {session_id}")

    # Clean up any existing session with the same id (prevents PTY leak)
    if session_id in _sessions:
        log.warning(f"Duplicate session_id, cleaning up old PTY: {session_id}")
        _cleanup_session(session_id)

    # Spawn PTY
    master_fd, slave_fd = pty.openpty()

    pid = os.fork()
    if pid == 0:
        # Child process — become the shell
        os.close(master_fd)
        os.setsid()
        fcntl.ioctl(slave_fd, termios.TIOCSCTTY, 0)
        os.dup2(slave_fd, 0)
        os.dup2(slave_fd, 1)
        os.dup2(slave_fd, 2)
        if slave_fd > 2:
            os.close(slave_fd)
        # Start bash in project directory
        env = os.environ.copy()
        env["TERM"] = "xterm-256color"
        env["COLORTERM"] = "truecolor"
        cwd = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        os.chdir(cwd)
        shell = os.environ.get("SHELL", "/bin/zsh")
        os.execvpe(shell, [shell], env)
        os._exit(1)

    # Parent process
    os.close(slave_fd)
    log.info(f"PTY spawned: pid={pid}, session={session_id}")

    _sessions[session_id] = {"pid": pid, "master_fd": master_fd}

    # Set master_fd to non-blocking
    flags = fcntl.fcntl(master_fd, fcntl.F_GETFL)
    fcntl.fcntl(master_fd, fcntl.F_SETFL, flags | os.O_NONBLOCK)

    async def read_pty():
        """Read PTY output and send to WebSocket (event-driven via add_reader)."""
        loop = asyncio.get_event_loop()
        queue: asyncio.Queue[bytes | None] = asyncio.Queue()

        def on_readable():
            try:
                data = os.read(master_fd, 4096)
                if data:
                    queue.put_nowait(data)
                else:
                    queue.put_nowait(None)
            except OSError:
                queue.put_nowait(None)

        loop.add_reader(master_fd, on_readable)
        try:
            while True:
                data = await queue.get()
                if data is None:
                    break
                await ws.send_bytes(data)
        finally:
            try:
                loop.remove_reader(master_fd)
            except Exception:
                pass

    read_task = asyncio.create_task(read_pty())

    try:
        while True:
            msg = await ws.receive()
            if msg.get("type") == "websocket.disconnect":
                break
            if "bytes" in msg and msg["bytes"]:
                os.write(master_fd, msg["bytes"])
            elif "text" in msg and msg["text"]:
                text = msg["text"]
                # Check for JSON control messages
                try:
                    ctrl = json.loads(text)
                    if ctrl.get("type") == "resize":
                        cols = ctrl.get("cols", 80)
                        rows = ctrl.get("rows", 24)
                        winsize = struct.pack("HHHH", rows, cols, 0, 0)
                        fcntl.ioctl(master_fd, termios.TIOCSWINSZ, winsize)
                        os.kill(pid, signal.SIGWINCH)
                        continue
                except (json.JSONDecodeError, ValueError):
                    pass
                os.write(master_fd, text.encode("utf-8"))
    except WebSocketDisconnect:
        log.info(f"Terminal WebSocket disconnected: {session_id}")
    except Exception as e:
        log.error(f"Terminal WebSocket error: {session_id}: {e}")
    finally:
        read_task.cancel()
        _cleanup_session(session_id)


def _cleanup_session(session_id: str):
    session = _sessions.pop(session_id, None)
    if not session:
        return
    log.info(f"Cleaning up terminal session: {session_id}")
    try:
        os.close(session["master_fd"])
    except OSError:
        pass
    try:
        # Kill entire process group (shell + all subprocesses)
        os.killpg(os.getpgid(session["pid"]), signal.SIGTERM)
    except (OSError, ChildProcessError):
        try:
            os.kill(session["pid"], signal.SIGTERM)
        except (OSError, ChildProcessError):
            pass
    try:
        os.waitpid(session["pid"], os.WNOHANG)
    except (OSError, ChildProcessError):
        pass
