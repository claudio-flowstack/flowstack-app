"""
Speech-to-Text endpoint using OpenAI Whisper API.

Accepts audio file uploads and returns transcribed text.
OPENAI_API_KEY comes from Doppler environment.
"""
from __future__ import annotations

import logging
import os

import httpx
from fastapi import APIRouter, HTTPException, UploadFile

log = logging.getLogger("whisper")
router = APIRouter()

WHISPER_URL = "https://api.openai.com/v1/audio/transcriptions"


@router.post("/api/transcribe")
async def transcribe_audio(file: UploadFile):
    """Transcribe audio file using OpenAI Whisper API."""
    api_key = os.environ.get("OPENAI_API_KEY", "")
    if not api_key:
        raise HTTPException(500, "OPENAI_API_KEY not configured in Doppler")

    audio_bytes = await file.read()
    if not audio_bytes:
        raise HTTPException(400, "Empty audio file")

    filename = file.filename or "audio.webm"

    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(
            WHISPER_URL,
            headers={"Authorization": f"Bearer {api_key}"},
            files={"file": (filename, audio_bytes, file.content_type or "audio/webm")},
            data={"model": "whisper-1", "language": "de"},
        )

    if resp.status_code != 200:
        log.error(f"Whisper API error: {resp.status_code} — {resp.text}")
        raise HTTPException(502, f"Whisper API error: {resp.status_code}")

    result = resp.json()
    return {"text": result.get("text", "")}
