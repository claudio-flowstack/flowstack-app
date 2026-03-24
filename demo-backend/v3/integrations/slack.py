"""
Slack Integration — Channels, Messages, Buttons.
"""

import httpx
import logging
from ..config import SLACK_BOT_TOKEN, SLACK_CHANNELS
from .errors import IntegrationError, RateLimitError, AuthError, retryable

log = logging.getLogger("v3.slack")


class SlackClient:
    """Slack API Wrapper."""

    def __init__(self, token: str = ""):
        self.token = token or SLACK_BOT_TOKEN
        self._client = httpx.AsyncClient(timeout=15)

    @retryable()
    async def _post(self, method: str, data: dict) -> dict:
        resp = await self._client.post(
            f"https://slack.com/api/{method}",
            headers={"Authorization": f"Bearer {self.token}"},
            json=data,
        )
            if resp.status_code >= 400:
                raise IntegrationError("slack", method, f"HTTP {resp.status_code}", retryable=resp.status_code >= 500)
            result = resp.json()
            if not result.get("ok"):
                err = result.get("error", "unknown")
                if err in ("invalid_auth", "account_inactive", "token_revoked", "not_authed"):
                    raise AuthError("slack", method, err)
                if err == "ratelimited":
                    raise RateLimitError("slack", method, retry_after=int(resp.headers.get("Retry-After", "30")))
                if err != "name_taken":
                    raise IntegrationError("slack", method, err, retryable=err in ("timeout", "service_unavailable", "internal_error"))
            return result

    async def _ensure_joined(self, channel_id: str):
        """Bot dem Channel beitreten lassen (idempotent)."""
        try:
            await self._post("conversations.join", {"channel": channel_id})
        except Exception:
            pass  # already_in_channel oder anderer harmloser Fehler

    async def create_channel(self, name: str) -> dict:
        """Channel erstellen. Naming: kd-firmenname-YYMM (z.B. kd-novacode-2603)."""
        from datetime import datetime
        # Firmenname bereinigen: nur Kleinbuchstaben, Bindestriche
        clean = name.lower().replace("client-", "").replace("gmbh", "").replace("ag", "").replace("ug", "")
        clean = clean.replace(" ", "-").replace("ä", "ae").replace("ö", "oe").replace("ü", "ue").replace("&", "und")
        clean = "-".join(part for part in clean.split("-") if part)[:30]
        date_suffix = datetime.now().strftime("%y%m")
        safe_name = f"kd-{clean}-{date_suffix}"

        result = await self._post("conversations.create", {"name": safe_name, "is_private": False})

        if result.get("ok"):
            channel_id = result.get("channel", {}).get("id", "")
            await self._ensure_joined(channel_id)
            log.info("slack.create_channel", extra={"service": "slack", "channel_id": channel_id, "channel_name": safe_name})
            return {"channel_id": channel_id, "channel_name": safe_name}

        # name_taken: existierenden Channel finden (auch archivierte)
        if result.get("error") == "name_taken":
            try:
                list_result = await self._post("conversations.list", {"types": "public_channel", "limit": 500, "exclude_archived": False})
                for ch in list_result.get("channels", []):
                    if ch.get("name") == safe_name:
                        channel_id = ch["id"]
                        # Archivierte Channels unarchivieren
                        if ch.get("is_archived"):
                            try:
                                await self._post("conversations.unarchive", {"channel": channel_id})
                                await self._ensure_joined(channel_id)
                                log.info("slack.create_channel unarchived", extra={"service": "slack", "channel_id": channel_id, "channel_name": safe_name})
                                return {"channel_id": channel_id, "channel_name": safe_name}
                            except Exception:
                                # Unarchive fehlgeschlagen — weiter mit Timestamp-Suffix
                                break
                        else:
                            await self._ensure_joined(channel_id)
                            log.info("slack.create_channel reuse", extra={"service": "slack", "channel_id": channel_id, "channel_name": safe_name})
                            return {"channel_id": channel_id, "channel_name": safe_name}
            except Exception:
                pass

            # UUID-Suffix statt Zähler (vermeidet weitere name_taken)
            import uuid
            uid = uuid.uuid4().hex[:6]
            suffixed = f"{safe_name}-{uid}"
            try:
                r = await self._post("conversations.create", {"name": suffixed, "is_private": False})
                if r.get("ok"):
                    channel_id = r.get("channel", {}).get("id", "")
                    await self._ensure_joined(channel_id)
                    log.info("slack.create_channel", extra={"service": "slack", "channel_id": channel_id, "channel_name": suffixed})
                    return {"channel_id": channel_id, "channel_name": suffixed}
            except IntegrationError:
                pass

        raise IntegrationError("slack", "create_channel", f"Channel konnte nicht erstellt werden: {safe_name}")

    async def send_message(self, channel: str, text: str) -> dict:
        """Nachricht senden. Bei channel_not_found: Fallback an #ff-log."""
        try:
            return await self._post("chat.postMessage", {"channel": channel, "text": text})
        except IntegrationError as e:
            err_str = str(e)
            if "channel_not_found" in err_str or "not_in_channel" in err_str:
                # Fallback: an Log-Channel statt failen
                log.warning(f"Channel {channel} nicht erreichbar, Fallback an #ff-log")
                try:
                    return await self._post("chat.postMessage", {
                        "channel": SLACK_CHANNELS["log"],
                        "text": f"[Fallback → {channel}] {text}",
                    })
                except Exception:
                    return {"ok": True, "fallback": True}
            raise

    async def send_log(self, message: str):
        """Einzeiler an #ff-log."""
        await self.send_message(SLACK_CHANNELS["log"], message)

    async def send_alert(self, message: str, severity: str = "critical"):
        """Alert an #ff-alerts."""
        prefix = "CRITICAL" if severity == "critical" else "WARNING"
        mention = "<!here> " if severity == "critical" else ""
        await self.send_message(SLACK_CHANNELS["alerts"], f"{mention}{prefix} — {message}")

    async def send_approval_request(self, channel: str, client_name: str, gate_label: str, deliverables: list, node_id: str, deadline: str) -> dict:
        """Approval-Request mit Buttons an #ff-approvals."""
        deliverable_text = "\n".join(f"• {d}" for d in deliverables) if isinstance(deliverables, list) else str(deliverables)

        blocks = [
            {"type": "header", "text": {"type": "plain_text", "text": f"Review — {client_name}"}},
            {"type": "section", "text": {"type": "mrkdwn", "text": f"*{gate_label}*\n\n{deliverable_text}"}},
            {"type": "section", "text": {"type": "mrkdwn", "text": f"Deadline: {deadline}"}},
            {"type": "actions", "elements": [
                {"type": "button", "text": {"type": "plain_text", "text": "Freigeben"}, "style": "primary", "action_id": f"approve_{node_id}"},
                {"type": "button", "text": {"type": "plain_text", "text": "Ablehnen"}, "style": "danger", "action_id": f"reject_{node_id}"},
                {"type": "button", "text": {"type": "plain_text", "text": "Aenderungen"}, "action_id": f"changes_{node_id}"},
            ]},
        ]

        return await self._post("chat.postMessage", {
            "channel": SLACK_CHANNELS["approvals"],
            "text": f"Review: {client_name} — {gate_label}",
            "blocks": blocks,
        })

    async def health_check(self) -> dict:
        try:
            result = await self._post("auth.test", {})
            return {"status": "ok", "team": result.get("team", "?")}
        except Exception as e:
            return {"status": "error", "message": str(e)[:80]}
