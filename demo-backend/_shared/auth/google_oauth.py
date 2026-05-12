"""Google OAuth helper. One client per Google account, manual refresh on 401."""
from __future__ import annotations
import json
import os
import logging

import httpx

log = logging.getLogger("shared.auth.google")


class GoogleOAuthClient:
    """Holds an access token and refreshes it via the stored refresh_token."""

    def __init__(self, env_var: str):
        raw = os.environ.get(env_var, os.environ.get("GOOGLE_OAUTH_TOKEN", "{}"))
        try:
            creds = json.loads(raw)
        except json.JSONDecodeError:
            creds = {}
        self._access_token: str = creds.get("token", "")
        self._refresh_token: str = creds.get("refresh_token", "")
        self._client_id: str = creds.get("client_id", "")
        self._client_secret: str = creds.get("client_secret", "")
        self._env_var = env_var

    @property
    def access_token(self) -> str:
        return self._access_token

    def auth_header(self) -> dict[str, str]:
        return {"Authorization": f"Bearer {self._access_token}"} if self._access_token else {}

    async def refresh(self, http: httpx.AsyncClient) -> str:
        if not self._refresh_token:
            log.warning(f"Google OAuth refresh skipped ({self._env_var}): no refresh_token")
            return self._access_token
        resp = await http.post(
            "https://oauth2.googleapis.com/token",
            data={
                "client_id": self._client_id,
                "client_secret": self._client_secret,
                "refresh_token": self._refresh_token,
                "grant_type": "refresh_token",
            },
        )
        if resp.status_code >= 400:
            log.error(f"Google token refresh failed ({self._env_var}): {resp.status_code} {resp.text}")
            return self._access_token
        new_token = resp.json().get("access_token", "")
        if new_token:
            self._access_token = new_token
            log.info(f"Google access token refreshed ({self._env_var})")
        return self._access_token


flowstack_oauth = GoogleOAuthClient("FLOWSTACK_GOOGLE_OAUTH_TOKEN")
leadflow_oauth = GoogleOAuthClient("LEADFLOW_MARKETING_GOOGLE_OAUTH_TOKEN")
