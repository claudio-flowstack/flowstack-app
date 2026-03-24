"""
Prompt Optimizer — Takes rough text/thoughts and transforms them into
a well-structured Claude prompt using Anthropic's prompting best practices.

Runs `claude -p` with a meta-prompt that restructures the input.
"""
from __future__ import annotations

import asyncio
import json
import logging
import os

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

log = logging.getLogger("prompt-optimizer")
router = APIRouter()

DOPPLER_PREFIX = ["doppler", "run", "-p", "fulfillment-automation", "-c", "dev_claudio", "--"]

OPTIMIZER_SYSTEM_PROMPT = """Du bist ein Prompt-Engineering-Experte. Deine Aufgabe: Verwandle den rohen Gedanken-Text des Users in einen perfekt strukturierten Prompt.

## Regeln fuer den optimierten Prompt

1. **Klar & Spezifisch** — Vage Formulierungen in praezise Anweisungen umwandeln
2. **Kontext geben** — Relevanten Hintergrund/Rolle definieren wenn noetig
3. **Struktur nutzen** — Markdown-Ueberschriften, Bullet-Points, nummerierte Schritte
4. **Output-Format definieren** — Klar sagen was als Ergebnis erwartet wird
5. **Constraints setzen** — Grenzen, Laenge, Stil, Sprache angeben wenn sinnvoll
6. **Schritt-fuer-Schritt** — Komplexe Aufgaben in klare Steps zerlegen

## Anthropic Best Practices

- Nutze <tags> fuer klar getrennte Sektionen wenn es Sinn macht
- Gib dem Modell eine Rolle/Perspektive wenn hilfreich
- Sei explizit ueber gewuenschtes Format und Detailgrad
- Vermeide Negationen ("tue X" statt "tue nicht Y")
- Bei Code-Aufgaben: Sprache, Framework, Constraints angeben

## Wichtig

- Behalte die SPRACHE des Inputs bei (Deutsch bleibt Deutsch, Englisch bleibt Englisch)
- Behalte die INTENTION und alle inhaltlichen Details des Users bei — nichts weglassen
- Fuege KEINE eigenen Annahmen oder Extra-Anforderungen hinzu die der User nicht meinte
- Der optimierte Prompt soll direkt kopierbar sein — kein Meta-Kommentar drumherum
- Antworte NUR mit dem optimierten Prompt, OHNE Erklaerung, OHNE Einleitung, OHNE "Hier ist dein optimierter Prompt:"
"""


class OptimizeRequest(BaseModel):
    text: str
    model: str = "sonnet"


@router.post("/api/optimize-prompt")
async def optimize_prompt(req: OptimizeRequest):
    if not req.text.strip():
        raise HTTPException(400, "Empty text")

    cmd = [
        *DOPPLER_PREFIX,
        "claude", "-p",
        "--output-format", "json",
        "--model", req.model,
        "--dangerously-skip-permissions",
        "--system-prompt", OPTIMIZER_SYSTEM_PROMPT,
    ]

    proc = await asyncio.create_subprocess_exec(
        *cmd,
        stdin=asyncio.subprocess.PIPE,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
        env={**os.environ, "NO_COLOR": "1"},
    )

    try:
        stdout, stderr = await asyncio.wait_for(
            proc.communicate(input=req.text.encode("utf-8")),
            timeout=30,
        )
    except asyncio.TimeoutError:
        proc.kill()
        raise HTTPException(504, "Prompt-Optimierung Timeout (30s)")

    if proc.returncode != 0:
        log.error(f"Claude prompt optimizer failed: {stderr.decode()[:2000]}")
        raise HTTPException(502, "Prompt optimization failed")

    try:
        result = json.loads(stdout.decode("utf-8"))
        return {"optimized": result.get("result", "")}
    except json.JSONDecodeError:
        # Fallback: raw text
        return {"optimized": stdout.decode("utf-8").strip()}
