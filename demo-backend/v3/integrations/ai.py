"""
KI Integration — Groq (primär) + Gemini (Fallback).
KEIN OpenRouter, KEIN OpenAI (gehört Anak).

Fallback-Chain:
1. Groq llama-3.3-70b-versatile (schnell, 30 RPM, kostenlos)
2. Gemini gemini-2.0-flash (kostenlos, aber Rate Limit)
3. Gemini gemini-2.0-flash-lite (leichteres Modell)
"""

import json
import ssl
import time
import asyncio
import certifi
import httpx
import logging
import urllib.request
import urllib.error
from collections import deque
from ..config import GEMINI_API_KEY, GROQ_API_KEY

log = logging.getLogger("v3.ai")

_SSL_CTX = ssl.create_default_context(cafile=certifi.where())

# ── Rate Limiter (für Gemini) ────────────────────────────────
_REQUEST_TIMESTAMPS: deque = deque()
_DAILY_COUNT = 0
_DAILY_RESET = 0.0
_RPM_LIMIT = 14
_RPD_LIMIT = 1400
_LOCK = asyncio.Lock()


async def _rate_limit():
    """Warte bis ein Slot frei ist (Gemini 15 RPM Limit)."""
    global _DAILY_COUNT, _DAILY_RESET
    now = time.time()
    if now - _DAILY_RESET > 86400:
        _DAILY_COUNT = 0
        _DAILY_RESET = now
    if _DAILY_COUNT >= _RPD_LIMIT:
        raise Exception(f"Gemini Tageslimit erreicht ({_RPD_LIMIT} Requests/Tag)")
    while _REQUEST_TIMESTAMPS and _REQUEST_TIMESTAMPS[0] < now - 60:
        _REQUEST_TIMESTAMPS.popleft()
    if len(_REQUEST_TIMESTAMPS) >= _RPM_LIMIT:
        wait_until = _REQUEST_TIMESTAMPS[0] + 60
        wait_time = wait_until - now
        if wait_time > 0:
            await asyncio.sleep(wait_time)
    _REQUEST_TIMESTAMPS.append(time.time())
    _DAILY_COUNT += 1


_groq_client = httpx.AsyncClient(timeout=120)


async def _call_groq(api_key: str, prompt: str, max_tokens: int, temperature: float, json_mode: bool = False) -> str:
    """Groq API Call (OpenAI-kompatibel) via httpx. Gibt Text zurück."""
    body: dict = {
        "model": "llama-3.3-70b-versatile",
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": max_tokens,
        "temperature": temperature,
    }
    if json_mode:
        body["response_format"] = {"type": "json_object"}
    resp = await _groq_client.post(
        "https://api.groq.com/openai/v1/chat/completions",
        headers={"Content-Type": "application/json", "Authorization": f"Bearer {api_key}"},
        json=body,
    )
    if resp.status_code == 429:
        raise urllib.error.HTTPError(resp.request.url, 429, "Rate Limit", {}, None)
    if resp.status_code >= 400:
        raise Exception(f"Groq HTTP {resp.status_code}: {resp.text[:200]}")
    result = resp.json()
    return result.get("choices", [{}])[0].get("message", {}).get("content", "")


def _call_gemini(api_key: str, model: str, prompt: str, max_tokens: int, temperature: float, json_mode: bool = False) -> str:
    """Gemini API Call. Gibt Text zurück."""
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
    gen_config: dict = {"maxOutputTokens": max_tokens, "temperature": temperature}
    if json_mode:
        gen_config["responseMimeType"] = "application/json"
    payload = json.dumps({
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": gen_config,
    }).encode()
    req = urllib.request.Request(url, data=payload, headers={"Content-Type": "application/json"})
    resp = urllib.request.urlopen(req, timeout=120, context=_SSL_CTX)
    result = json.loads(resp.read())
    return result.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")


class AIClient:
    """Groq (primär) + Gemini (Fallback). Drop-in Replacement."""

    def __init__(self):
        self.groq_key = GROQ_API_KEY
        self.gemini_key = GEMINI_API_KEY
        self.model = "groq/llama-3.3-70b"  # Tracking welches Modell zuletzt genutzt wurde

    async def generate(self, prompt: str, max_tokens: int = 8000, temperature: float = 0.7, json_mode: bool = False) -> str:
        """Text generieren. Groq -> Gemini Fallback-Chain. json_mode=True fuer strukturierten JSON-Output."""
        if not self.groq_key and not self.gemini_key:
            raise Exception("Weder GROQ_API_KEY noch GEMINI_API_KEY konfiguriert")

        # ── 1. Groq (primaer) ────────────────────────────────
        if self.groq_key:
            try:
                text = await _call_groq(self.groq_key, prompt, max_tokens, temperature, json_mode=json_mode)
                if text:
                    self.model = "groq/llama-3.3-70b"
                    log.info(f"AI generate OK via Groq ({len(text)} chars)")
                    return text
            except urllib.error.HTTPError as e:
                body = ""
                try:
                    body = e.read().decode()[:200]
                except Exception:
                    pass
                log.warning(f"Groq HTTP {e.code}, Fallback auf Gemini: {body[:100]}")
            except Exception as e:
                log.warning(f"Groq Fehler, Fallback auf Gemini: {e}")

        # ── 2. Gemini Fallback-Chain ────────────────────────
        if not self.gemini_key:
            raise Exception("Groq fehlgeschlagen und kein GEMINI_API_KEY konfiguriert")

        async with _LOCK:
            await _rate_limit()

        gemini_models = ["gemini-2.0-flash", "gemini-2.0-flash-lite", "gemini-2.5-flash"]
        last_error = None

        for model in gemini_models:
            try:
                text = _call_gemini(self.gemini_key, model, prompt, max_tokens, temperature, json_mode=json_mode)
                if text:
                    self.model = f"gemini/{model}"
                    log.info(f"AI generate OK via {model} ({len(text)} chars)")
                    return text
            except urllib.error.HTTPError as e:
                if e.code == 429:
                    log.warning(f"{model} -> 429, versuche naechstes Modell")
                    last_error = f"{model}: Rate Limit"
                    continue
                elif e.code == 503:
                    log.warning(f"{model} -> 503, versuche naechstes Modell")
                    last_error = f"{model}: 503"
                    continue
                else:
                    body = ""
                    try:
                        body = e.read().decode()[:200]
                    except Exception:
                        pass
                    raise Exception(f"{model} HTTP {e.code}: {body}")
            except Exception as e:
                last_error = str(e)
                if "timeout" in str(e).lower():
                    continue
                raise

        raise Exception(f"KI nicht verfuegbar — Groq + alle Gemini-Modelle gescheitert: {last_error}")

    async def extract_json(self, prompt: str) -> dict:
        """Generiere und parse JSON. Nutzt structured output wenn verfuegbar."""
        raw = await self.generate(prompt, max_tokens=8000, json_mode=True)
        cleaned = raw.strip()

        if cleaned.startswith("```json"):
            cleaned = cleaned[7:]
        if cleaned.startswith("```"):
            cleaned = cleaned[3:]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]

        try:
            return json.loads(cleaned.strip())
        except json.JSONDecodeError:
            start = cleaned.find("{")
            end = cleaned.rfind("}")
            if start >= 0 and end > start:
                try:
                    return json.loads(cleaned[start:end + 1])
                except json.JSONDecodeError:
                    pass
            start = cleaned.find("[")
            end = cleaned.rfind("]")
            if start >= 0 and end > start:
                try:
                    return json.loads(cleaned[start:end + 1])
                except json.JSONDecodeError:
                    pass
            raise Exception(f"JSON parse failed, raw: {raw[:300]}")

    async def health_check(self) -> dict:
        try:
            result = await self.generate("Sage nur: OK", max_tokens=10)
            return {"status": "ok", "response": result.strip()[:20], "model": self.model}
        except Exception as e:
            return {"status": "error", "message": str(e)[:80]}
