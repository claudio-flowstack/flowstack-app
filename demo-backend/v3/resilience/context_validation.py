"""
Context Validation — Prüft ob alle nötigen Felder vorhanden sind bevor ein Node läuft.
"""

from typing import Optional

NODE_REQUIREMENTS: dict[str, list[str]] = {
    "v3-is04": ["email"],
    "v3-is05": ["email"],
    "v3-is09": ["list_id"],
    "v3-is10": ["opportunity_id"],
    "v3-kc05": ["opportunity_id"],
    "v3-kc06": ["channel_id"],
    "v3-st-extract": ["transcript_text|transcript_doc_id"],
    "v3-st01": ["bausteine"],
    "v3-st02": ["bausteine"],
    "v3-st03": ["bausteine"],
    "v3-st04": ["bausteine"],
    "v3-st05": ["bausteine"],
    "v3-cc01": ["bausteine"],
    "v3-cc02": ["bausteine"],
    "v3-cc03": ["bausteine"],
    "v3-cc04": ["bausteine"],
    "v3-cc05": ["bausteine"],
    "v3-cc06": ["bausteine"],
    "v3-cc07": ["bausteine"],
    "v3-ca04": ["company"],
    "v3-ca05": ["campaign_id"],
    "v3-ca07": ["retargeting_campaign_id"],
    "v3-ca09": ["warmup_campaign_id"],
    "v3-fn10a": ["lp_url"],
    "v3-fn10b": ["lp_url"],
    "v3-fn-pixel": ["lp_url"],
    "v3-rl-activate": ["campaign_id"],
    "v3-rl-close": ["opportunity_id"],
    "v3-st-close": ["opportunity_id"],
    "v3-cc-close": ["opportunity_id"],
}


def validate_context(node_id: str, context: dict) -> tuple[bool, Optional[str]]:
    """Prüft ob alle Required-Felder vorhanden sind. Returns (valid, missing_field).

    Supports OR-syntax: 'field_a|field_b' means at least one must be present.
    """
    required = NODE_REQUIREMENTS.get(node_id, [])
    for field in required:
        if "|" in field:
            # OR: mindestens eines der Felder muss vorhanden sein
            alternatives = field.split("|")
            if not any(alt in context and context[alt] is not None for alt in alternatives):
                return False, field
        else:
            if field not in context or context[field] is None:
                return False, field
    return True, None
