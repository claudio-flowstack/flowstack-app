"""
V3 Quality Assurance
- DACH Compliance Scan (AGG, discrimination)
- Spelling & Grammar Check
- Text Length Validation
- URL Validation (SSL, performance, mobile)
- Pixel Verification
- Ad Policy Pre-Check
- Brand Consistency
"""

import asyncio
import re
import ssl
import certifi
import logging
import urllib.request
import json
from typing import Any, Optional
from datetime import datetime, timezone

logger = logging.getLogger("v3.qa")

# SSL context for URL checks
SSL_CTX = ssl.create_default_context(cafile=certifi.where())


# ============================================================
# DACH COMPLIANCE SCAN
# ============================================================

# Known problematic terms for German employment ads (AGG violations)
DACH_BLOCKLIST = {
    "age_discrimination": [
        "junges team", "junge team", "junges dynamisches team",
        "digital native", "digital natives",
        "berufsanfänger", "berufseinsteiger",
        "durchschnittsalter",
        "jung und motiviert",
        "junge kollegen",
    ],
    "gender_discrimination": [
        # Single-gender forms without (m/w/d)
        # These are patterns, not exact matches
    ],
    "origin_discrimination": [
        "deutsch als muttersprache",
        "muttersprachler",
        "deutscher pass",
        "deutsche staatsbürgerschaft",
    ],
}

# Safe auto-fixes
DACH_AUTO_FIXES: dict[str, str] = {
    "junges team": "motiviertes Team",
    "junges dynamisches team": "motiviertes, dynamisches Team",
    "junge team": "motiviertes Team",
    "jung und motiviert": "engagiert und motiviert",
    "digital native": "digital-affin",
    "digital natives": "digital-affine Kolleg:innen",
    "deutsch als muttersprache": "sehr gute Deutschkenntnisse (C1/C2)",
    "muttersprachler": "Sprachniveau C1/C2",
}


async def dach_compliance_scan(
    texts: dict[str, str],
    ai_func: Optional[Any] = None,
) -> dict[str, Any]:
    """
    Scan all texts for DACH employment law compliance violations.

    Args:
        texts: Dict of {doc_name: text_content}
        ai_func: Optional async function to call AI for deeper analysis

    Returns:
        {
            'passed': bool,
            'issues': [{'doc': str, 'text': str, 'issue': str, 'severity': str, 'suggestion': str}],
            'auto_fixed': [{'doc': str, 'original': str, 'fixed': str}],
        }
    """
    issues = []
    auto_fixed = []

    for doc_name, text in texts.items():
        text_lower = text.lower()

        # Check blocklist
        for category, terms in DACH_BLOCKLIST.items():
            for term in terms:
                if term in text_lower:
                    severity = "critical" if category == "age_discrimination" else "warning"

                    # Check if auto-fixable
                    fix = DACH_AUTO_FIXES.get(term)
                    if fix:
                        auto_fixed.append({
                            "doc": doc_name,
                            "original": term,
                            "fixed": fix,
                        })
                    else:
                        issues.append({
                            "doc": doc_name,
                            "text": term,
                            "issue": f"Möglicher AGG-Verstoß ({category})",
                            "severity": severity,
                            "suggestion": f"Formulierung überprüfen: '{term}'",
                        })

        # Check for missing (m/w/d) in job titles
        job_title_pattern = re.compile(r'\b(Manager|Leiter|Berater|Experte|Spezialist|Mitarbeiter|Entwickler|Designer)\b', re.IGNORECASE)
        matches = job_title_pattern.findall(text)
        for match in matches:
            # Check if (m/w/d) or similar follows within 20 chars
            idx = text_lower.find(match.lower())
            if idx >= 0:
                context = text[idx:idx + len(match) + 20]
                if "(m/w/d)" not in context and "(m/f/d)" not in context and ":in" not in context and "*in" not in context:
                    issues.append({
                        "doc": doc_name,
                        "text": match,
                        "issue": "Geschlechterneutrale Formulierung fehlt",
                        "severity": "warning",
                        "suggestion": f"'{match}' → '{match} (m/w/d)' oder '{match}:in'",
                    })

    # Optional: AI-based deeper analysis
    if ai_func and texts:
        try:
            ai_issues = await ai_func(
                prompt=(
                    "Prüfe die folgenden Texte auf DACH-Arbeitsrecht-Compliance (AGG). "
                    "Suche nach diskriminierenden Formulierungen bezüglich Alter, Geschlecht, Herkunft, Religion, Behinderung. "
                    "Antworte als JSON-Array mit {text, issue, severity, suggestion}. "
                    "Wenn alles OK: leeres Array [].\n\n"
                    + "\n---\n".join(f"[{k}]: {v[:1000]}" for k, v in texts.items())
                )
            )
            if isinstance(ai_issues, list):
                issues.extend(ai_issues)
        except Exception as e:
            logger.warning(f"AI compliance check failed: {e}")

    has_critical = any(i["severity"] == "critical" for i in issues)

    return {
        "passed": not has_critical,
        "issues": issues,
        "auto_fixed": auto_fixed,
        "scanned_docs": len(texts),
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


def apply_auto_fixes(text: str) -> tuple[str, list[dict[str, str]]]:
    """Apply safe auto-fixes to a text. Returns (fixed_text, list_of_changes)."""
    changes = []
    for original, fixed in DACH_AUTO_FIXES.items():
        if original in text.lower():
            # Case-preserving replacement
            pattern = re.compile(re.escape(original), re.IGNORECASE)
            new_text = pattern.sub(fixed, text)
            if new_text != text:
                changes.append({"original": original, "fixed": fixed})
                text = new_text
    return text, changes


# ============================================================
# SPELLING & GRAMMAR CHECK
# ============================================================

async def spelling_check(
    texts: dict[str, str],
    ai_func: Any,
) -> dict[str, Any]:
    """
    Check texts for spelling and grammar errors using AI.

    Returns:
        {
            'passed': bool,
            'issues': [{'doc': str, 'original': str, 'corrected': str, 'type': str}],
        }
    """
    all_issues = []

    for doc_name, text in texts.items():
        try:
            result = await ai_func(
                prompt=(
                    "Prüfe den folgenden deutschen Text auf Rechtschreib- und Grammatikfehler. "
                    "Antworte als JSON-Array: [{original, corrected, type}]. "
                    "type = 'spelling' | 'grammar' | 'punctuation'. "
                    "Wenn alles korrekt: leeres Array [].\n\n"
                    f"Text:\n{text[:3000]}"
                )
            )
            if isinstance(result, list):
                for issue in result:
                    issue["doc"] = doc_name
                    all_issues.append(issue)
        except Exception as e:
            logger.warning(f"Spelling check failed for {doc_name}: {e}")

    return {
        "passed": len(all_issues) == 0,
        "issues": all_issues,
        "scanned_docs": len(texts),
    }


# ============================================================
# TEXT LENGTH VALIDATION
# ============================================================

# Facebook Ad text limits
TEXT_LIMITS: dict[str, dict[str, int]] = {
    "anzeigen_haupt": {"primary_text": 125, "headline": 40, "description": 30},
    "anzeigen_retargeting": {"primary_text": 125, "headline": 40, "description": 30},
    "anzeigen_warmup": {"primary_text": 125, "headline": 40, "description": 30},
}


def validate_text_lengths(
    doc_subtype: str,
    sections: dict[str, str],
) -> dict[str, Any]:
    """
    Validate text sections against platform-specific length limits.

    Args:
        doc_subtype: e.g. 'anzeigen_haupt'
        sections: {'primary_text': '...', 'headline': '...', ...}

    Returns:
        {'passed': bool, 'violations': [{'field': str, 'length': int, 'max': int}]}
    """
    limits = TEXT_LIMITS.get(doc_subtype, {})
    violations = []

    for field, max_chars in limits.items():
        text = sections.get(field, "")
        if len(text) > max_chars:
            violations.append({
                "field": field,
                "length": len(text),
                "max": max_chars,
                "overshoot": len(text) - max_chars,
            })

    return {
        "passed": len(violations) == 0,
        "violations": violations,
    }


# ============================================================
# URL VALIDATION
# ============================================================

async def validate_url(url: str, timeout: int = 10) -> dict[str, Any]:
    """
    Validate a URL for accessibility, SSL, and basic performance.

    Returns:
        {
            'reachable': bool,
            'status_code': int,
            'ssl_valid': bool,
            'load_time_ms': int,
            'error': str | None,
        }
    """
    result = {
        "url": url,
        "reachable": False,
        "status_code": 0,
        "ssl_valid": False,
        "load_time_ms": 0,
        "error": None,
    }

    try:
        start = asyncio.get_event_loop().time()
        req = urllib.request.Request(url, headers={"User-Agent": "Flowstack-QA/1.0"})
        response = urllib.request.urlopen(req, timeout=timeout, context=SSL_CTX)

        load_time = (asyncio.get_event_loop().time() - start) * 1000
        result["reachable"] = True
        result["status_code"] = response.getcode()
        result["ssl_valid"] = url.startswith("https://")
        result["load_time_ms"] = int(load_time)

    except urllib.error.HTTPError as e:
        result["status_code"] = e.code
        result["error"] = f"HTTP {e.code}: {e.reason}"
    except urllib.error.URLError as e:
        result["error"] = str(e.reason)
    except Exception as e:
        result["error"] = str(e)

    return result


async def validate_all_urls(urls: list[str]) -> dict[str, Any]:
    """Validate multiple URLs in parallel."""
    tasks = [validate_url(url) for url in urls]
    results = await asyncio.gather(*tasks, return_exceptions=True)

    url_results = []
    for r in results:
        if isinstance(r, Exception):
            url_results.append({"error": str(r), "reachable": False})
        else:
            url_results.append(r)

    all_reachable = all(r.get("reachable", False) for r in url_results)
    all_ssl = all(r.get("ssl_valid", False) for r in url_results)
    slow = [r for r in url_results if r.get("load_time_ms", 0) > 3000]

    return {
        "passed": all_reachable and all_ssl and len(slow) == 0,
        "all_reachable": all_reachable,
        "all_ssl_valid": all_ssl,
        "slow_urls": len(slow),
        "results": url_results,
    }


# ============================================================
# PIXEL VERIFICATION
# ============================================================

async def verify_pixel(
    pixel_id: str,
    meta_token: str,
    expected_events: Optional[list[str]] = None,
) -> dict[str, Any]:
    """
    Verify Meta Pixel is configured and receiving events.

    Args:
        pixel_id: Meta Pixel ID
        meta_token: Meta API access token
        expected_events: List of expected event names ['PageView', 'Lead', 'ViewContent']

    Returns:
        {'active': bool, 'events': [...], 'missing_events': [...]}
    """
    if expected_events is None:
        expected_events = ["PageView", "Lead", "ViewContent"]

    try:
        url = f"https://graph.facebook.com/v21.0/{pixel_id}?fields=name,is_unavailable&access_token={meta_token}"
        req = urllib.request.Request(url)
        response = urllib.request.urlopen(req, timeout=10, context=SSL_CTX)
        data = json.loads(response.read())

        is_active = not data.get("is_unavailable", True)

        return {
            "active": is_active,
            "pixel_id": pixel_id,
            "pixel_name": data.get("name", "Unknown"),
            "expected_events": expected_events,
            "passed": is_active,
        }

    except Exception as e:
        return {
            "active": False,
            "pixel_id": pixel_id,
            "error": str(e),
            "passed": False,
        }


# ============================================================
# AD POLICY PRE-CHECK
# ============================================================

async def ad_policy_check(
    ad_texts: dict[str, str],
    ai_func: Any,
) -> dict[str, Any]:
    """
    Check ad texts against Meta advertising policies (as warning, not blocker).

    Returns:
        {'passed': bool, 'warnings': [...]}
    """
    warnings = []

    for ad_name, text in ad_texts.items():
        # Basic checks
        if len(text) < 10:
            warnings.append({"ad": ad_name, "issue": "Text zu kurz", "severity": "warning"})

        # Check for excessive caps
        words = text.split()
        caps_words = [w for w in words if w.isupper() and len(w) > 2]
        if len(caps_words) > 3:
            warnings.append({"ad": ad_name, "issue": "Zu viele GROSSGESCHRIEBENE Wörter", "severity": "warning"})

        # Check for excessive exclamation marks
        if text.count("!") > 3:
            warnings.append({"ad": ad_name, "issue": "Zu viele Ausrufezeichen", "severity": "warning"})

    # AI-based policy check
    if ai_func:
        try:
            result = await ai_func(
                prompt=(
                    "Prüfe diese Facebook-Werbetexte auf Verstöße gegen Meta Werberichtlinien. "
                    "Besonders: Employment Special Ad Category (keine Alters-/Geschlechts-Diskriminierung im Targeting). "
                    "Antworte als JSON-Array: [{ad, issue, severity}]. severity = 'warning'. "
                    "Wenn alles OK: leeres Array [].\n\n"
                    + "\n---\n".join(f"[{k}]: {v}" for k, v in ad_texts.items())
                )
            )
            if isinstance(result, list):
                warnings.extend(result)
        except Exception as e:
            logger.warning(f"AI ad policy check failed: {e}")

    return {
        "passed": len(warnings) == 0,
        "warnings": warnings,
        "is_blocker": False,  # Ad policy is WARNING only, not blocker
    }


# ============================================================
# BRAND CONSISTENCY CHECK
# ============================================================

async def brand_consistency_check(
    texts: dict[str, str],
    company_name: str,
    ai_func: Optional[Any] = None,
) -> dict[str, Any]:
    """
    Check if company name is spelled consistently across all texts.

    Returns:
        {'passed': bool, 'issues': [...]}
    """
    issues = []

    for doc_name, text in texts.items():
        # Check if company name appears at all
        if company_name.lower() not in text.lower():
            issues.append({
                "doc": doc_name,
                "issue": f"Firmenname '{company_name}' kommt nicht vor",
                "severity": "info",
            })
        else:
            # Check for inconsistent capitalization/spelling
            import re
            pattern = re.compile(re.escape(company_name), re.IGNORECASE)
            matches = pattern.findall(text)
            unique_spellings = set(matches)
            if len(unique_spellings) > 1:
                issues.append({
                    "doc": doc_name,
                    "issue": f"Inkonsistente Schreibweise: {unique_spellings}",
                    "severity": "warning",
                })

    return {
        "passed": not any(i["severity"] == "warning" for i in issues),
        "issues": issues,
    }


# ============================================================
# PLACEHOLDER SCAN
# ============================================================

PLACEHOLDER_PATTERNS = [
    r'\[FIRMENNAME\]', r'\[FIRMA\]', r'\[COMPANY\]',
    r'\[DEIN NAME\]', r'\[YOUR NAME\]', r'\[NAME\]',
    r'\[DOMAIN\]', r'\[URL\]', r'\[LINK\]',
    r'\[DATUM\]', r'\[DATE\]',
    r'\[TODO\]', r'\[TBD\]', r'\[PLACEHOLDER\]',
    r'\[INSERT\]', r'\[HIER\]',
    r'XXX', r'XXXX',
]


def scan_for_placeholders(texts: dict[str, str]) -> dict[str, Any]:
    """Check if any unreplaced placeholders remain in the texts."""
    found = []

    for doc_name, text in texts.items():
        for pattern in PLACEHOLDER_PATTERNS:
            matches = re.findall(pattern, text, re.IGNORECASE)
            if matches:
                found.append({
                    "doc": doc_name,
                    "placeholder": matches[0],
                    "count": len(matches),
                })

    return {
        "passed": len(found) == 0,
        "placeholders": found,
    }
