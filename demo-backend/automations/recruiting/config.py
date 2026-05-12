"""Recruiting domain constants. Master-Doc IDs, funnel URLs, ad copy variants.

This is the single source of truth for everything domain-specific.
Migration from server.py lines 142-621.
"""
from __future__ import annotations

# ── Master Document Templates (NEVER delete from Drive — these are templates) ──
MASTER_DOCS: dict[str, str] = {
    "Doc 1 Strategie": "https://docs.google.com/document/d/1kxjSIWDIN-ssN_i466a4dPX4TEluijaPm9J2ywLmB-M/edit",
    "Doc 2 Messaging": "https://docs.google.com/document/d/1pprK5yG15Vjbx7AmE7b-FMGZXxhHrXMjryB_cKbpGmo/edit",
    "Doc 3 Creative Briefing": "https://docs.google.com/document/d/1l6zo_I-Sb_PxbSdzbpoTeIGesuuHXvu7CiRcFOI9Yuw/edit",
    "Doc 4 Ads-Copy": "https://docs.google.com/document/d/1py5_IHRsst707gKzBnnEYjRkQO4SCixeZFAR8DUnPlo/edit",
    "Doc 5 Kickoff": "https://docs.google.com/document/d/1lKO8VjuYp47uOpWVl1Rh6dU_57Vx1DzRAwrcgJZonpo/edit",
    "Doc 6 Webseiten-Texte": "https://docs.google.com/document/d/1IMt8W5zKZrrJW6dOj6OfuZn5xA_iQjrwnAGj28h3c4M/edit",
    "Doc 7 Videoskript": "https://docs.google.com/document/d/171Eg7V8jKGOYrqdYOLUM6DvfDodet_mxPrUB5DmMqEs/edit",
}

# Master parent folder in Shared Drive "Flowstack - Fulfillment Automation"
MASTER_PARENT_FOLDER_ID = "1zP_i6aN_y6NPAn_khY_J0VyH9okV6h08"

# Doc display names (shown to clients in their copies)
DOC_DISPLAY_NAME: dict[str, str] = {
    "Doc 1 Strategie": "Strategie",
    "Doc 2 Messaging": "Messaging-Matrix",
    "Doc 3 Creative Briefing": "Creative-Briefing",
    "Doc 4 Ads-Copy": "Ads-Copy",
    "Doc 5 Kickoff": "Kickoff-Transkript",
    "Doc 6 Webseiten-Texte": "Webseiten-Texte",
    "Doc 7 Videoskript": "Videoskript",
}

# Doc groups for handlers (consume client copies from context if available)
STRATEGY_DOCS: dict[str, str] = {
    k: MASTER_DOCS[k] for k in ("Doc 1 Strategie", "Doc 2 Messaging", "Doc 3 Creative Briefing")
}
COPY_DOCS: dict[str, str] = {"Doc 4 Ads-Copy": MASTER_DOCS["Doc 4 Ads-Copy"]}
TRANSCRIPT_DOC: str = MASTER_DOCS["Doc 5 Kickoff"]


# ── Funnel demo URLs (live on flowstack-agentur.de) ─────────────────────────────
FUNNEL_LINKS: dict[str, str] = {
    "Landingpage": "https://www.flowstack-agentur.de/demo",
    "Bewerbungsseite": "https://www.flowstack-agentur.de/demo-bewerbung",
    "Dankeseite": "https://www.flowstack-agentur.de/demo-danke",
    "Impressum": "https://www.flowstack-agentur.de/demo-impressum",
    "Datenschutz": "https://www.flowstack-agentur.de/demo-datenschutz",
}

TRACKING_SHEET = "https://docs.google.com/spreadsheets/d/1EmgdSqPPpouA20wY3OhMu1PGCA-Y_aCeztDHUF2zXeY/edit"
TRACKING_DASHBOARD = "https://lookerstudio.google.com/reporting/00000000-0000-0000-0000-000000000000"

# ── Ad copy variants (placeholders {company} and {destination_url}) ────────────
AD_COPY_INITIAL: list[dict[str, str]] = [
    {
        "primary_text": "Wir suchen Verstärkung bei {company}.\n\nKein Lebenslauf, kein Anschreiben. In 2 Minuten bewerben.",
        "headline": "Jetzt bewerben",
        "description": "Schnelle Rückmeldung",
        "cta": "Jetzt in nur 2 Minuten Bewerben ohne Anschreiben und ohne Lebenslauf — {destination_url}",
    },
    {
        "primary_text": "{company} sucht dich.\n\nFaire Bezahlung, gutes Team, klare Kommunikation. Ohne Stress bewerben.",
        "headline": "Bewerbung in 2 Minuten",
        "description": "Ohne Lebenslauf",
        "cta": "Jetzt in nur 2 Minuten Bewerben ohne Anschreiben und ohne Lebenslauf — {destination_url}",
    },
    {
        "primary_text": "Du suchst einen neuen Job? {company} sucht neue Kollegen.\n\nBewirb dich in 2 Minuten ohne Lebenslauf.",
        "headline": "Neuer Job",
        "description": "Schnell bewerben",
        "cta": "Jetzt in nur 2 Minuten Bewerben ohne Anschreiben und ohne Lebenslauf — {destination_url}",
    },
]

AD_COPY_RETARGETING: list[dict[str, str]] = [
    {
        "primary_text": "Du hast unsere Anzeige gesehen? {company} freut sich auf deine Bewerbung.\n\nIn 2 Minuten erledigt.",
        "headline": "Jetzt zurückkommen",
        "description": "Bewerbung in 2 Min",
        "cta": "Jetzt in nur 2 Minuten Bewerben ohne Anschreiben und ohne Lebenslauf — {destination_url}",
    },
    {
        "primary_text": "Verpass die Chance bei {company} nicht.\n\nFaires Gehalt, gutes Team. Bewirb dich jetzt.",
        "headline": "Letzte Chance",
        "description": "Ohne Lebenslauf",
        "cta": "Jetzt in nur 2 Minuten Bewerben ohne Anschreiben und ohne Lebenslauf — {destination_url}",
    },
    {
        "primary_text": "Du hast Interesse an einem Job bei {company}?\n\nBewerbung dauert nur 2 Minuten.",
        "headline": "Interessiert?",
        "description": "Schnell bewerben",
        "cta": "Jetzt in nur 2 Minuten Bewerben ohne Anschreiben und ohne Lebenslauf — {destination_url}",
    },
]

AD_COPY_WARMUP: list[dict[str, str]] = [
    {
        "primary_text": "{company} - dein neuer Arbeitgeber.\n\nFaires Team, klare Aufgaben. Lerne uns kennen.",
        "headline": "Lerne uns kennen",
        "description": "Mehr erfahren",
        "cta": "Mehr erfahren",
    },
]
