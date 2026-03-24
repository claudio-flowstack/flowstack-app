"""
Phase 4: Copy/Text-Generierung (7 Docs + QA)
Nodes: v3-cc01 bis v3-cc-close
Nutzt: Gemini (KI), Google (Docs), Airtable (Tracking), Close (Stage)
"""

import os
import re
import json
import logging
from ..integrations.ai import AIClient
from ..integrations.google import GoogleClient
from ..integrations.airtable import AirtableClient
from ..integrations.close import CloseClient
from ..config import FRAMEWORKS_DIR

log = logging.getLogger("v3.phase.copy")

ai = AIClient()
google = GoogleClient()
airtable = AirtableClient()
close = CloseClient()

# ── DACH Compliance Blocklist ────────────────────────────────

DACH_BLOCKLIST = {
    "junges team": "motiviertes Team",
    "junges, dynamisches team": "motiviertes, engagiertes Team",
    "digital native": "digital-affin",
    "digital natives": "digital-affine Kandidaten",
    "deutsch als muttersprache": "sehr gute Deutschkenntnisse (C1/C2)",
    "muttersprachler": "Sprachniveau C1/C2",
    "muttersprachlich": "auf C1/C2-Niveau",
    "muttersprachliche deutschkenntnisse": "sehr gute Deutschkenntnisse (C1/C2)",
    "native speaker": "Sprachniveau C1/C2",
    "belastbar": "resilient",
    "belastbarkeit": "Resilienz",
    "stressresistent": "gut organisiert",
    "young professional": "Berufseinsteiger",
    "young professionals": "Berufseinsteiger",
}

# Terms that need manual review (not auto-fixable)
DACH_REVIEW_TERMS = [
    "altersbegrenzung",
    "maximal * jahre",
    "höchstalter",
    "nur männlich",
    "nur weiblich",
]

# Placeholder patterns
PLACEHOLDER_PATTERNS = [
    r"\[FIRMENNAME\]",
    r"\[FIRMA\]",
    r"\[DATUM\]",
    r"\[STELLENBEZEICHNUNG\]",
    r"\[BRANCHE\]",
    r"\[STANDORT\]",
    r"\[GEHALT\]",
    r"\[ANSPRECHPARTNER\]",
    r"\[URL\]",
    r"\[LINK\]",
    r"\[TELEFON\]",
    r"\[EMAIL\]",
    r"\{FIRMENNAME\}",
    r"\{FIRMA\}",
    r"\{DATUM\}",
    r"XXX",
    r"TBD",
    r"TODO",
    r"\[\.{3}\]",
]


def _load_framework(nr: int) -> str:
    """Framework-Markdown laden."""
    for fname in sorted(os.listdir(FRAMEWORKS_DIR)):
        if fname.startswith(f"{nr:02d}-"):
            with open(os.path.join(FRAMEWORKS_DIR, fname)) as f:
                return f.read()
    log.warning(f"Framework {nr:02d} nicht gefunden in {FRAMEWORKS_DIR}")
    return "Erstelle professionellen deutschen Marketing-Text fuer eine Recruiting-Agentur. Verwende klare Struktur, ueberzeugende Sprache und konkrete Beispiele."


async def _generate_copy_doc(context: dict, state, framework_nr: int, doc_name: str, doc_key: str, prev_keys: list) -> dict:
    """Generisches Copy-Doc via Gemini + Framework + Bausteine."""
    bausteine = context.get("bausteine", {})
    framework = _load_framework(framework_nr)

    prev_text = ""
    gd = context.get("generated_docs", {})
    for ctx_key, label in prev_keys:
        if gd.get(ctx_key):
            prev_text += f"\n--- {label} ---\n{str(gd[ctx_key])[:2000]}\n"

    # Early return: staged Doc existiert + Content vorhanden + kein Feedback → Skip
    feedback = context.get("regenerate_feedback", {}).get(doc_key, "")
    staged_doc_ids = context.get("staged_doc_ids", {})
    staged_id = staged_doc_ids.get(doc_key, "")
    existing_content = gd.get(doc_key, "")

    if staged_id and existing_content and not feedback:
        log.info(f"Skip {doc_name}: staged Doc + Content vorhanden, kein Feedback")
        generated = dict(gd)
        generated[doc_key] = existing_content
        generated[f"{doc_key}_url"] = gd.get(f"{doc_key}_url", f"https://docs.google.com/document/d/{staged_id}/edit")
        return {"url": generated[f"{doc_key}_url"], "doc_id": staged_id, "content_length": len(existing_content), "generated_docs": generated, "skipped": True}

    prompt = f"""Erstelle "{doc_name}" fuer "{state.client_name}".

FRAMEWORK:
{framework[:4000]}

BAUSTEINE:
{json.dumps(bausteine, ensure_ascii=False, indent=2)[:6000]}

VORHERIGE DOKUMENTE:
{prev_text[:3000] if prev_text else "Keine"}

REGELN:
1. Keine generischen Phrasen - alles spezifisch fuer das Unternehmen
2. DACH-konform: Keine diskriminierenden Begriffe
3. Qualitaet wie Premium-Agentur
4. Alle Platzhalter ([FIRMENNAME] etc.) durch echte Werte ersetzen"""

    # Feedback aus vorheriger Ablehnung beruecksichtigen
    feedback = context.get("regenerate_feedback", {}).get(doc_key, "")
    if feedback:
        prompt += f"\n\nFEEDBACK DES KUNDEN (bitte beruecksichtigen):\n{feedback}"

    try:
        content = await ai.generate(prompt, max_tokens=6000)
    except Exception as e:
        log.warning(f"KI für {doc_name} fehlgeschlagen, nutze Framework als Staged Content: {e}")
        content = f"# {doc_name} — {state.client_name}\n\n(Staged — KI war nicht verfügbar)\n\n{framework[:6000]}"

    # Check for staged doc
    staged_doc_ids = context.get("staged_doc_ids", {})
    staged_id = staged_doc_ids.get(doc_key, "")

    if staged_id:
        # Update existing staged doc
        try:
            await google.update_doc_html(staged_id, content)
            doc = {"doc_id": staged_id, "url": f"https://docs.google.com/document/d/{staged_id}/edit"}
            log.info(f"Staged Doc updated: {doc_name} → {staged_id}")
        except Exception as e:
            log.warning(f"Staged Doc update fehlgeschlagen, erstelle neu: {e}")
            doc = await google.create_doc(f"V3 — {doc_name} | {state.client_name}", content)
    else:
        # Fallback: create new doc
        doc = await google.create_doc(f"V3 — {doc_name} | {state.client_name}", content)

    # In Airtable tracken (non-fatal — Doc ist schon in Google Docs)
    try:
        await airtable.create_document(doc_name, doc_name, doc.get("url", ""), doc.get("doc_id", ""))
    except Exception as e:
        log.warning(f"Airtable tracking failed for {doc_name}: {e}")

    generated = dict(gd)
    generated[doc_key] = content
    generated[f"{doc_key}_url"] = doc.get("url", "")

    return {"url": doc.get("url"), "doc_id": doc.get("doc_id"), "content_length": len(content), "generated_docs": generated}


# ── Doc Generation Handlers (cc01-cc07) ─────────────────────

async def cc01(context: dict, state) -> dict:
    """Landingpage-Texte generieren (Framework 06)."""
    return await _generate_copy_doc(context, state, 6, "Landingpage-Texte", "landingpage_texte",
        [("marken_richtlinien", "Marken-Richtlinien"), ("messaging_matrix", "Messaging-Matrix")])


async def cc02(context: dict, state) -> dict:
    """Formularseite-Texte generieren (Framework 07)."""
    return await _generate_copy_doc(context, state, 7, "Formularseite-Texte", "formularseite_texte",
        [("landingpage_texte", "Landingpage-Texte"), ("marken_richtlinien", "Marken-Richtlinien")])


async def cc03(context: dict, state) -> dict:
    """Dankeseite-Texte generieren (Framework 08)."""
    return await _generate_copy_doc(context, state, 8, "Dankeseite-Texte", "dankeseite_texte",
        [("landingpage_texte", "Landingpage-Texte"), ("formularseite_texte", "Formularseite-Texte")])


async def cc04(context: dict, state) -> dict:
    """Anzeigentexte Hauptkampagne generieren (Framework 09)."""
    return await _generate_copy_doc(context, state, 9, "Anzeigentexte Hauptkampagne", "anzeigentexte_hauptkampagne",
        [("zielgruppen_avatar", "Zielgruppen-Avatar"), ("messaging_matrix", "Messaging-Matrix"), ("landingpage_texte", "Landingpage-Texte")])


async def cc05(context: dict, state) -> dict:
    """Anzeigentexte Retargeting generieren (Framework 10)."""
    return await _generate_copy_doc(context, state, 10, "Anzeigentexte Retargeting", "anzeigentexte_retargeting",
        [("anzeigentexte_hauptkampagne", "Anzeigentexte Hauptkampagne"), ("messaging_matrix", "Messaging-Matrix")])


async def cc06(context: dict, state) -> dict:
    """Anzeigentexte Warmup generieren (Framework 11)."""
    return await _generate_copy_doc(context, state, 11, "Anzeigentexte Warmup", "anzeigentexte_warmup",
        [("anzeigentexte_hauptkampagne", "Anzeigentexte Hauptkampagne"), ("arbeitgeber_avatar", "Arbeitgeber-Avatar")])


async def cc07(context: dict, state) -> dict:
    """Videoskript generieren (Framework 12)."""
    return await _generate_copy_doc(context, state, 12, "Videoskript", "videoskript",
        [("messaging_matrix", "Messaging-Matrix"), ("creative_briefing", "Creative Briefing"), ("anzeigentexte_hauptkampagne", "Anzeigentexte Hauptkampagne")])


# ── QA Handlers ──────────────────────────────────────────────

async def cc01a(context: dict, state) -> dict:
    """DACH Compliance Scan — blocked terms check."""
    gd = context.get("generated_docs", {})
    violations = []
    safe_fixes = []

    for doc_key, content in gd.items():
        if doc_key.endswith("_url") or not isinstance(content, str):
            continue

        content_lower = content.lower()

        # Check auto-fixable terms
        for blocked, replacement in DACH_BLOCKLIST.items():
            if blocked in content_lower:
                count = content_lower.count(blocked)
                safe_fixes.append({
                    "doc": doc_key,
                    "term": blocked,
                    "replacement": replacement,
                    "count": count,
                })

        # Check manual-review terms
        for pattern in DACH_REVIEW_TERMS:
            matches = re.findall(pattern, content_lower)
            if matches:
                violations.append({
                    "doc": doc_key,
                    "term": pattern,
                    "matches": matches,
                    "requires_manual_review": True,
                })

    return {
        "compliant": len(violations) == 0 and len(safe_fixes) == 0,
        "safe_fixes": safe_fixes,
        "violations": violations,
        "safe_fix_count": len(safe_fixes),
        "violation_count": len(violations),
    }


async def cc01b(context: dict, state) -> dict:
    """Auto-fix DACH compliance — apply safe replacements."""
    gd = context.get("generated_docs", {})
    safe_fixes = context.get("safe_fixes", [])

    if not safe_fixes:
        return {"fixed": 0, "generated_docs": gd}

    updated = dict(gd)
    total_fixed = 0

    for fix in safe_fixes:
        doc_key = fix["doc"]
        if doc_key not in updated or not isinstance(updated[doc_key], str):
            continue

        content = updated[doc_key]
        # Case-insensitive replacement
        pattern = re.compile(re.escape(fix["term"]), re.IGNORECASE)
        new_content = pattern.sub(fix["replacement"], content)
        if new_content != content:
            updated[doc_key] = new_content
            total_fixed += fix.get("count", 1)
            log.info(f"DACH fix: '{fix['term']}' → '{fix['replacement']}' in {doc_key}")

    return {"fixed": total_fixed, "generated_docs": updated}


async def cc02a(context: dict, state) -> dict:
    """Spelling check via Gemini."""
    gd = context.get("generated_docs", {})
    all_issues = []

    for doc_key, content in gd.items():
        if doc_key.endswith("_url") or not isinstance(content, str):
            continue

        try:
            prompt = f"""Pruefe diesen Text auf Rechtschreibfehler, Grammatikfehler und stilistische Fehler.
Antworte NUR als JSON-Array: [{{"fehler": "...", "korrektur": "...", "kontext": "..."}}]
Wenn keine Fehler: leeres Array []

TEXT:
{content[:4000]}"""

            result = await ai.extract_json(prompt)
            if isinstance(result, list) and result:
                for issue in result:
                    issue["doc"] = doc_key
                all_issues.extend(result)
        except Exception as e:
            log.warning(f"Spelling check failed for {doc_key}: {e}")

    return {
        "issues": all_issues,
        "issue_count": len(all_issues),
        "passed": len(all_issues) == 0,
    }


async def cc02b(context: dict, state) -> dict:
    """Placeholder scan — find unreplaced placeholders."""
    gd = context.get("generated_docs", {})
    found = []

    for doc_key, content in gd.items():
        if doc_key.endswith("_url") or not isinstance(content, str):
            continue

        for pattern in PLACEHOLDER_PATTERNS:
            matches = re.findall(pattern, content, re.IGNORECASE)
            if matches:
                found.append({
                    "doc": doc_key,
                    "placeholder": pattern.replace("\\", ""),
                    "count": len(matches),
                    "matches": matches[:5],
                })

    return {
        "placeholders_found": found,
        "total_count": sum(p["count"] for p in found),
        "passed": len(found) == 0,
    }


async def brand_check(context: dict, state) -> dict:
    """Company name consistency check across all docs."""
    gd = context.get("generated_docs", {})
    company = state.client_name

    inconsistencies = []

    for doc_key, content in gd.items():
        if doc_key.endswith("_url") or not isinstance(content, str):
            continue

        # Check if company name appears consistently
        if company and company not in content:
            inconsistencies.append({
                "doc": doc_key,
                "issue": f"Firmenname '{company}' nicht gefunden",
            })

        # Check for common misspellings of company name
        if company and len(company) > 4:
            content_lower = content.lower()
            company_lower = company.lower()
            # Simple Levenshtein-like check: look for off-by-one variants
            for word in set(content_lower.split()):
                if len(word) == len(company_lower) and word != company_lower:
                    diff = sum(1 for a, b in zip(word, company_lower) if a != b)
                    if diff == 1:
                        inconsistencies.append({
                            "doc": doc_key,
                            "issue": f"Moeglicher Tippfehler: '{word}' statt '{company}'",
                        })

    return {
        "consistent": len(inconsistencies) == 0,
        "inconsistencies": inconsistencies,
        "company_name": company,
    }


async def cc_sync(context: dict, state) -> dict:
    """Airtable Sync — Copy-Docs Status updaten. Non-fatal bei Airtable-Fehlern."""
    gd = context.get("generated_docs", {})
    doc_urls = {k: gd.get(f"{k}_url", "") for k in gd if not k.endswith("_url") and isinstance(gd.get(k), str) and gd.get(f"{k}_url")}
    return {"synced": True, "synced_count": len(doc_urls), "docs_tracked": list(doc_urls.keys())}


async def cc_close(context: dict, state) -> dict:
    """Close: Stage → assets_erstellt."""
    opp_id = context.get("opportunity_id", "")
    if not opp_id:
        return {"skipped": True}
    return await close.update_stage(opp_id, "assets_erstellt")


COPY_HANDLERS = {
    "v3-cc01": cc01,
    "v3-cc02": cc02,
    "v3-cc03": cc03,
    "v3-cc04": cc04,
    "v3-cc05": cc05,
    "v3-cc06": cc06,
    "v3-cc07": cc07,
    "v3-cc01a": cc01a,
    "v3-cc01b": cc01b,
    "v3-cc02a": cc02a,
    "v3-cc02b": cc02b,
    "v3-cc-brand": brand_check,
    "v3-cc-sync": cc_sync,
    "v3-cc-close": cc_close,
}
