"""
Gemini AI Integration — Kostenlose KI-Generierung. KEIN OpenRouter.
"""

import json
import ssl
import certifi
import logging
import urllib.request
from ..config import GEMINI_API_KEY

log = logging.getLogger("v3.gemini")

_SSL_CTX = ssl.create_default_context(cafile=certifi.where())


class GeminiClient:
    """Google Gemini API Wrapper."""

    def __init__(self, api_key: str = ""):
        self.api_key = api_key or GEMINI_API_KEY
        self.model = "gemini-2.0-flash"

    async def generate(self, prompt: str, max_tokens: int = 8000, temperature: float = 0.7) -> str:
        """Text generieren via Gemini. Gibt den generierten Text zurück."""
        if not self.api_key:
            raise Exception("GEMINI_API_KEY nicht konfiguriert")

        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent?key={self.api_key}"
        payload = json.dumps({
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"maxOutputTokens": max_tokens, "temperature": temperature},
        }).encode()

        req = urllib.request.Request(url, data=payload, headers={"Content-Type": "application/json"})
        resp = urllib.request.urlopen(req, timeout=120, context=_SSL_CTX)
        result = json.loads(resp.read())

        text = result.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
        return text

    async def extract_json(self, prompt: str) -> dict:
        """Generiere und parse JSON. Bereinigt Markdown-Wrapper."""
        raw = await self.generate(prompt, max_tokens=8000)
        cleaned = raw.strip()
        if cleaned.startswith("```json"):
            cleaned = cleaned[7:]
        if cleaned.startswith("```"):
            cleaned = cleaned[3:]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]
        return json.loads(cleaned.strip())

    async def health_check(self) -> dict:
        try:
            result = await self.generate("Sage nur: OK", max_tokens=10)
            return {"status": "ok", "response": result.strip()[:20]}
        except Exception as e:
            return {"status": "error", "message": str(e)[:80]}
