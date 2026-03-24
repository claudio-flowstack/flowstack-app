"""
WebSocket handler for Claude Chat UI.

Spawns `claude -p --output-format stream-json` per message and streams
JSON lines back to the frontend. Supports conversation resume via session_id.

Always runs through Doppler for env secrets and with --dangerously-skip-permissions
when bypass=True.
"""
from __future__ import annotations

import asyncio
import json
import logging
import os
import signal
import time

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query

log = logging.getLogger("claude-chat")
router = APIRouter()

# Doppler wrapper for env secrets (configurable via ENV)
DOPPLER_PROJECT = os.environ.get("DOPPLER_PROJECT", "fulfillment-automation")
DOPPLER_CONFIG = os.environ.get("DOPPLER_CONFIG", "dev_claudio")
DOPPLER_PREFIX = ["doppler", "run", "-p", DOPPLER_PROJECT, "-c", DOPPLER_CONFIG, "--"]

# Optional auth token (set CLAUDE_WS_TOKEN env var to enable)
WS_AUTH_TOKEN: str | None = os.environ.get("CLAUDE_WS_TOKEN")

# Project root (one level up from demo-backend/)
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Track active Claude processes for cleanup
_active: dict[str, asyncio.subprocess.Process] = {}
_active_lock = asyncio.Lock()

# Rate limiting
_last_message: dict[str, float] = {}
MIN_INTERVAL = 1.0  # seconds between messages per tab

# Max time a single Claude invocation can run (seconds)
PROCESS_TIMEOUT = 180

# Max message size (bytes)
MAX_MESSAGE_SIZE = 1_000_000  # 1MB


def _load_project_knowledge() -> str:
    """Load CLAUDE.md + available skills/commands as automatic context."""
    parts: list[str] = []

    # 1. Load CLAUDE.md
    claude_md = os.path.join(PROJECT_ROOT, "CLAUDE.md")
    if os.path.isfile(claude_md):
        try:
            with open(claude_md, "r", encoding="utf-8") as f:
                parts.append(f"# Projekt-Wissen (CLAUDE.md)\n\n{f.read()}")
        except OSError:
            pass

    # 2. Available skills/commands
    skills = """# Verfuegbare Skills & Commands

Du hast Zugriff auf folgende Flowstack-Skripte (alle via Doppler mit Credentials):

## Wichtige Commands
- **Cleanup All** — `python3 demo-backend/cleanup-all.py` — Reset aller Test-Daten (DANGEROUS)
- **Cleanup Drive** — `python3 demo-backend/cleanup-drive.py` — Google Drive Cleanup (DANGEROUS)
- **Reauth Google** — `python3 demo-backend/reauth-google.py` — Google OAuth Token erneuern
- **Reauth Leadflow** — `python3 demo-backend/reauth-leadflow.py` — Leadflow Close OAuth erneuern
- **Reauth Leadflow Marketing** — `python3 demo-backend/reauth-leadflow-marketing.py` — Leadflow Marketing Close OAuth erneuern
- **Check Inbox** — `python3 demo-backend/check-inbox.py` — Letzte 20 Emails checken

## Standard Commands
- **Create Tracking Sheet** — `python3 demo-backend/create-tracking-sheet.py` — Neues Tracking Sheet
- **Update Staged Docs** — `python3 demo-backend/update-staged-docs.py` — Template Docs aktualisieren
- **Create Staged Docs** — `python3 demo-backend/create-staged-docs.py` — 12 Docs neu erstellen
- **Create Painpoint Doc** — `python3 demo-backend/create-painpoint-doc.py` — Pain-Point-Matrix erstellen
- **Set Gmail Signature** — `python3 demo-backend/set-gmail-signature.py` — Gmail Signatur setzen
- **Upload Signature Photo** — `python3 demo-backend/upload-signature-photo.py` — Signatur-Foto hochladen

## Workflows (Command-Chains)
- **Full Reset** — Cleanup → Create Docs → Create Tracking Sheet (DANGEROUS)
- **Auth Refresh** — Google + Leadflow + Leadflow Marketing OAuth erneuern
- **Docs Aktualisieren** — Staged Docs + Painpoint-Matrix

## Credentials
Alle Credentials kommen automatisch aus Doppler (fulfillment-automation / dev_claudio).
Du hast Zugriff auf Google APIs, ClickUp, Slack, Airtable, Close CRM etc. via Environment Variables.
Frag nicht nach API Keys — sie sind bereits als ENV verfuegbar.

## Cross-Tab Kontext
Wenn der User mehrere Claude-Tabs offen hat, bekommst du den Kontext aus den anderen Tabs
automatisch als <other_tabs_context> Block am Anfang der Nachricht mitgeliefert.
Du kannst dich auf Gespraeche aus anderen Tabs beziehen wenn der User danach fragt."""
    parts.append(skills)

    return "\n\n---\n\n".join(parts)


def _build_file_context(attached_files: list[dict]) -> str | None:
    """Build context string from attached files. Supports inline content (from browser)
    and disk paths (from command palette). Validates paths against PROJECT_ROOT."""
    if not attached_files:
        return None

    project_real = os.path.realpath(PROJECT_ROOT)
    parts: list[str] = []
    for f in attached_files:
        path = f.get("path", "")
        name = f.get("name", "")
        is_dir = f.get("isDir", False)
        inline_content = f.get("content")

        # Prefer inline content (sent from browser file picker)
        if inline_content:
            # Truncate oversized inline content
            if isinstance(inline_content, str) and len(inline_content) > 500_000:
                inline_content = inline_content[:500_000] + "\n\n... [abgeschnitten, > 500KB]"
            parts.append(f"--- {name} ---\n{inline_content}")
        elif path:
            # Validate path is within project root (prevent path traversal)
            real_path = os.path.realpath(path)
            if not (real_path == project_real or real_path.startswith(project_real + os.sep)):
                parts.append(f"--- {name} --- [Pfad ausserhalb des Projekts]")
                continue

            if is_dir:
                try:
                    entries = os.listdir(real_path)
                    listing = "\n".join(f"  {e}" for e in sorted(entries)[:50])
                    if len(entries) > 50:
                        listing += f"\n  ... (+{len(entries) - 50} weitere)"
                    parts.append(f"--- {name}/ (Ordner) ---\n{listing}")
                except OSError:
                    parts.append(f"--- {name}/ (Ordner) --- [nicht lesbar]")
            else:
                try:
                    with open(real_path, "r", encoding="utf-8", errors="replace") as fh:
                        content = fh.read(100_000)
                    if len(content) == 100_000:
                        content += "\n\n... [abgeschnitten, Datei > 100KB]"
                    parts.append(f"--- {name} ---\n{content}")
                except OSError:
                    parts.append(f"--- {name} --- [nicht lesbar]")

    if not parts:
        return None

    return "Kontext-Dateien:\n\n" + "\n\n".join(parts)


async def _drain_stderr(proc: asyncio.subprocess.Process):
    """Read stderr to prevent pipe buffer deadlock. Log warnings."""
    lines_read = 0
    try:
        while True:
            line = await proc.stderr.readline()
            if not line:
                break
            lines_read += 1
            if lines_read > 1000:
                log.warning("Excessive stderr output, stopping drain")
                break
            text = line.decode("utf-8", errors="replace").strip()
            if text:
                log.warning(f"Claude stderr: {text}")
    except asyncio.CancelledError:
        raise  # Re-raise so task cancellation works
    except Exception as e:
        log.debug(f"Stderr drain ended: {e}")


async def _send_error(ws: WebSocket, message: str):
    """Send error event to frontend."""
    try:
        await ws.send_text(json.dumps({
            "type": "error",
            "message": message,
        }))
    except Exception:
        pass


def _kill_proc_tree(proc: asyncio.subprocess.Process):
    """Kill process and its entire process group."""
    try:
        pgid = os.getpgid(proc.pid)
        os.killpg(pgid, signal.SIGKILL)
    except (ProcessLookupError, OSError):
        try:
            proc.kill()
        except ProcessLookupError:
            pass


@router.websocket("/ws/claude/{tab_id}")
async def claude_ws(ws: WebSocket, tab_id: str, token: str = Query(default="")):
    # Auth check (if CLAUDE_WS_TOKEN is set)
    if WS_AUTH_TOKEN is not None and token != WS_AUTH_TOKEN:
        await ws.close(code=4001, reason="Unauthorized")
        return

    await ws.accept()
    log.info(f"Claude chat connected: {tab_id}")

    claude_session_id: str | None = None

    try:
        while True:
            raw = await ws.receive_text()
            try:
                msg = json.loads(raw)
            except json.JSONDecodeError:
                await _send_error(ws, "Ungültige Nachricht (kein JSON)")
                continue

            user_message = msg.get("message", "")
            model = msg.get("model", "opus")
            system_prompt = msg.get("system_prompt")
            bypass = msg.get("bypass", False)
            attached_files = msg.get("attached_files", [])
            other_tabs = msg.get("other_tabs")
            incoming_session_id = msg.get("claude_session_id")
            if incoming_session_id:
                claude_session_id = incoming_session_id
            if not user_message:
                continue

            # Input validation
            if not isinstance(user_message, str):
                continue
            if len(user_message) > MAX_MESSAGE_SIZE:
                await _send_error(ws, f"Nachricht zu lang ({len(user_message) // 1000}KB, max 1MB)")
                continue
            # Sanitize null bytes
            user_message = user_message.replace('\x00', '')

            # Rate limiting
            now = time.monotonic()
            if now - _last_message.get(tab_id, 0) < MIN_INTERVAL:
                await _send_error(ws, "Bitte warte kurz zwischen Nachrichten.")
                continue
            _last_message[tab_id] = now

            # Inject cross-tab context (max 50KB to avoid token waste)
            if other_tabs:
                ctx_parts: list[str] = ["<other_tabs_context>"]
                total_chars = 0
                overflow = False
                for tab in other_tabs:
                    label = tab.get("tabLabel", "Tab")
                    msgs = tab.get("messages", [])[-5:]  # Last 5 per tab
                    ctx_parts.append(f"\n--- {label} ---")
                    for m in msgs:
                        role = m.get("role", "user")
                        content = m.get("content", "")[:500]
                        line = f"[{role}]: {content}"
                        total_chars += len(line)
                        if total_chars > 50_000:
                            overflow = True
                            break
                        ctx_parts.append(line)
                    if overflow:
                        break
                ctx_parts.append("</other_tabs_context>\n")
                user_message = "\n".join(ctx_parts) + user_message

            # Build file context (every message, not just first)
            file_ctx = _build_file_context(attached_files) if attached_files else None

            # Build claude command
            cmd = [
                *DOPPLER_PREFIX,
                "claude", "-p",
                "--output-format", "stream-json",
                "--verbose",
                "--model", model,
            ]

            if bypass:
                cmd.append("--dangerously-skip-permissions")

            if claude_session_id:
                cmd.extend(["--resume", claude_session_id])

            # System prompt on first message; for resumed sessions inject context into user message
            if not claude_session_id:
                prompt_parts: list[str] = []
                prompt_parts.append(_load_project_knowledge())

                if file_ctx:
                    prompt_parts.append(file_ctx)

                if system_prompt:
                    prompt_parts.append(system_prompt)

                cmd.extend(["--system-prompt", "\n\n".join(prompt_parts)])
            else:
                # For resumed sessions, prepend file context to user message
                if file_ctx:
                    user_message = file_ctx + "\n\n" + user_message

            # Spawn claude process
            try:
                proc = await asyncio.create_subprocess_exec(
                    *cmd,
                    stdin=asyncio.subprocess.PIPE,
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE,
                    env={**os.environ, "NO_COLOR": "1"},
                    start_new_session=True,  # Own process group for clean kill
                )
            except FileNotFoundError:
                await _send_error(ws, "Claude CLI oder Doppler nicht gefunden. Bitte installieren.")
                continue
            except OSError as e:
                await _send_error(ws, f"Prozess-Fehler: {e}")
                continue

            async with _active_lock:
                _active[tab_id] = proc

            # Drain stderr concurrently (prevents pipe deadlock)
            stderr_task = asyncio.create_task(_drain_stderr(proc))

            try:
                # Send user message to stdin
                try:
                    proc.stdin.write(user_message.encode("utf-8"))
                    proc.stdin.write(b"\n")
                    await proc.stdin.drain()
                    proc.stdin.close()
                except (BrokenPipeError, ConnectionResetError) as e:
                    log.error(f"Stdin write failed: {e}")
                    _kill_proc_tree(proc)
                    await _send_error(ws, "Claude-Prozess unerwartet beendet.")
                    continue

                # Stream stdout lines back to frontend with total timeout
                deadline = time.monotonic() + PROCESS_TIMEOUT
                while True:
                    remaining = deadline - time.monotonic()
                    if remaining <= 0:
                        log.error(f"Claude process timeout ({PROCESS_TIMEOUT}s): {tab_id}")
                        await _send_error(ws, f"Die Anfrage hat zu lange gedauert ({PROCESS_TIMEOUT}s). Versuche es erneut oder vereinfache deine Anfrage.")
                        _kill_proc_tree(proc)
                        break
                    try:
                        line = await asyncio.wait_for(
                            proc.stdout.readline(),
                            timeout=remaining,
                        )
                    except asyncio.TimeoutError:
                        log.error(f"Claude process timeout ({PROCESS_TIMEOUT}s): {tab_id}")
                        await _send_error(ws, f"Die Anfrage hat zu lange gedauert ({PROCESS_TIMEOUT}s). Versuche es erneut oder vereinfache deine Anfrage.")
                        _kill_proc_tree(proc)
                        break

                    if not line:
                        break
                    text = line.decode("utf-8").strip()
                    if not text:
                        continue

                    # Forward JSON line to frontend
                    try:
                        await ws.send_text(text)
                    except Exception:
                        # WS disconnected mid-stream — kill process
                        log.info(f"WS send failed, killing process: {tab_id}")
                        _kill_proc_tree(proc)
                        raise

                    # Extract session_id
                    try:
                        event = json.loads(text)
                        if event.get("type") == "system" and event.get("session_id"):
                            claude_session_id = event["session_id"]
                        elif event.get("type") == "result" and event.get("session_id"):
                            claude_session_id = event["session_id"]
                    except json.JSONDecodeError:
                        log.debug(f"Non-JSON line from Claude: {text[:200]}")

                await proc.wait()

            finally:
                # Clean up process tracking
                async with _active_lock:
                    _active.pop(tab_id, None)

                # Cancel and await stderr drain
                stderr_task.cancel()
                try:
                    await asyncio.wait_for(stderr_task, timeout=2)
                except (asyncio.CancelledError, asyncio.TimeoutError):
                    pass

                # Ensure process is dead
                if proc.returncode is None:
                    try:
                        _kill_proc_tree(proc)
                        await proc.wait()
                    except ProcessLookupError:
                        pass

    except WebSocketDisconnect:
        log.info(f"Claude chat disconnected: {tab_id}")
    except Exception as e:
        log.error(f"Claude chat error: {tab_id}: {e}")
    finally:
        # Safety net: kill any leftover process
        async with _active_lock:
            leftover = _active.pop(tab_id, None)
        if leftover and leftover.returncode is None:
            try:
                _kill_proc_tree(leftover)
                await asyncio.wait_for(leftover.wait(), timeout=3)
            except (ProcessLookupError, asyncio.TimeoutError, OSError):
                pass
        # Clean up rate limit entry
        _last_message.pop(tab_id, None)
