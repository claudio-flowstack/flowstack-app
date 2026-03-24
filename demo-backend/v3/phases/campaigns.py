"""
Phase 6: Meta Campaigns — Vollständige Portierung aus V1/V2.
Nodes: v3-ca00 bis v3-ca09
CBO OFF, Employment, Pixel Attribution, 3 Ad Sets, echte Ad-Erstellung.
"""

import logging
from datetime import datetime
from ..integrations.meta import MetaClient
from ..integrations.close import CloseClient
from ..integrations.airtable import AirtableClient

log = logging.getLogger("v3.phase.campaigns")

meta = MetaClient()
close = CloseClient()
airtable = AirtableClient()

# ── Ad Copy Texte (aus V1/V2) ───────────────────────────────

AD_COPY_INITIAL = [
    "{company} sucht Verstaerkung.\n\nDu willst wieder richtig arbeiten.\nNicht nur Dienst nach Vorschrift.\n\nDann lies weiter.\n\nWas dich erwartet:\n- Moderner Arbeitsplatz\n- Ueberdurchschnittliches Gehalt\n- Echte Wertschaetzung\n- Weiterbildungsmoeglichkeiten\n\nKein Assessment-Center.\nKein Anschreiben.\n\nDie Bewerbung dauert unter 3 Minuten.\n\n→ Jetzt bewerben",
    "Du bist gut in dem was du tust.\nAber wann hat das zuletzt jemand anerkannt?\n\nBei {company} ist das anders.\n\nHier zaehlt Qualitaet. Hier zaehlen die Menschen.\n\nWas wir bieten:\n- Faire Bezahlung\n- Flexible Arbeitszeiten\n- Ein Team das zusammenhaelt\n- Modernste Ausstattung\n\nKein endloses Bewerbungsverfahren.\n60 Sekunden reichen.\n\n→ Jetzt bewerben",
    "Diese Anzeige ist nichts fuer dich.\n\nNicht wenn du zufrieden bist mit dem Status quo.\nNicht wenn dir egal ist ob deine Arbeit wertgeschaetzt wird.\n\nAber wenn du abends denkst: Da muss doch mehr gehen.\nDann lies weiter.\n\n{company} sucht Leute die anpacken.\nDie Verantwortung wollen.\nDie stolz auf ihre Arbeit sein wollen.\n\n→ Unter 3 Minuten bewerben",
]

AD_COPY_RETARGETING = [
    "Du hast dir die Stelle bei {company} angeschaut.\nAber du hast dich noch nicht beworben.\n\nWarum nicht?\n\nHier sind die Fakten:\n- Faire Bezahlung\n- Moderner Arbeitsplatz\n- Echte Wertschaetzung\n\nDer Bewerbungsprozess dauert nur 60 Sekunden.\nKein Anschreiben noetig.\n\n→ Jetzt bewerben",
    "Bin ich gut genug?\n\nDas denken viele.\nUnd genau die sind oft die Besten.\n\nBei {company} suchen wir keine Zertifikate-Sammler.\nWir suchen Macher.\n\nDu warst schon auf unserer Seite.\nGib deiner Neugier eine Chance.\n60 Sekunden. Kein Risiko.",
    "Du warst auf unserer Karriereseite.\nAber du bist noch unentschlossen?\n\n{company} ist kein Grosskonzern.\nHier bist du kein Mitarbeiter Nr. 847.\nHier bist du Teil eines Teams.\n\n→ Die Stelle ist noch offen.\n60 Sekunden reichen.",
]

AD_COPY_WARMUP = [
    "Die meisten Unternehmen reden von Wertschaetzung.\nBei {company} lebt man sie.\n\nWir bauen auf Qualitaet. Nicht auf Masse.\nJeder kennt jeden. Entscheidungen fallen schnell.\n\nWillst du sehen wie wir arbeiten?\n→ Mehr erfahren",
    "Freitag 14:30 Uhr bei {company}:\n\nDas Team hat die Woche sauber abgeschlossen.\nKein Stress. Keine Ueberstunden.\nNur Arbeit auf die man stolz sein kann.\n\n{company} — wo Qualitaet zaehlt.\n\n→ Mehr ueber uns erfahren",
    "Wusstest du? Die meisten Fachkraefte denken ueber einen Wechsel nach.\nAber nur wenige bewerben sich.\n\nWarum? Weil jede Stellenanzeige gleich klingt.\n\nWir bei {company} sagen dir lieber was wir NICHT bieten:\nKein Grossraumbuero. Keine 5 Interview-Runden. Keine veraltete Ausstattung.\n\nWas wir bieten? Findest du raus.\n→ Mehr erfahren",
]

# ── Targeting Templates ──────────────────────────────────────

TARGETING_FEEDS = {
    "geo_locations": {"countries": ["DE"]},
    "publisher_platforms": ["facebook", "instagram"],
    "facebook_positions": ["feed"],
    "instagram_positions": ["stream"],
}

TARGETING_AUTO = {
    "geo_locations": {"countries": ["DE"]},
}

TARGETING_WARMUP = {
    "geo_locations": {"countries": ["DE"]},
    "publisher_platforms": ["facebook", "instagram"],
    "facebook_positions": ["feed"],
    "instagram_positions": ["stream", "story"],
}


async def _track_campaign(company: str, campaign_name: str, typ: str, campaign_id: str, budget_tag: float):
    """Kampagne in Airtable tracken (non-fatal)."""
    try:
        await airtable.create_record("KAMPAGNEN", {
            "Kampagnen-Name": campaign_name,
            "Typ": typ,
            "Meta Campaign ID": campaign_id,
            "Budget Tag": budget_tag,
            "Status": "Draft",
            "Ads Manager URL": meta.ads_manager_url(),
        })
    except Exception as e:
        log.warning(f"Airtable campaign tracking failed: {e}")


# ── CA00: Account Health ─────────────────────────────────────

async def ca00(context: dict, state) -> dict:
    """Ad account health check."""
    health = await meta.check_account_health()
    return {"healthy": health.get("healthy", False), "account_name": health.get("name", ""), "status_code": health.get("status_code", 0), "passed": health.get("healthy", False)}


# ── CA01-CA03: Custom Audiences ──────────────────────────────

async def ca01(context: dict, state) -> dict:
    """Custom Audience: AllVisitors_30d. Non-fatal wenn Pixel keinen Traffic hat."""
    company = state.client_name.replace(" ", "_")
    try:
        result = await meta.create_custom_audience(
            f"AllVisitors_30d_{company}",
            retention_days=30,
            description="Alle Website-Besucher der letzten 30 Tage",
        )
        return {"audience_id": result.get("audience_id", "")}
    except Exception as e:
        log.warning(f"Custom Audience AllVisitors_30d fehlgeschlagen (non-fatal): {e}")
        return {"audience_id": "", "skipped": True, "reason": str(e)[:100]}


async def ca02(context: dict, state) -> dict:
    """Custom Audience: LP_NoApp_7d — LP-Besucher ohne Bewerbung. Non-fatal."""
    company = state.client_name.replace(" ", "_")
    lp_url = context.get("lp_url", "")
    form_url = context.get("form_url", "")
    rule = None
    if lp_url and meta.pixel_id:
        rule = {"inclusions": {"operator": "or", "rules": [
            {"event_sources": [{"id": meta.pixel_id, "type": "pixel"}], "retention_seconds": 604800,
             "filter": {"operator": "and", "filters": [{"field": "url", "operator": "i_contains", "value": lp_url}]}}
        ]}}
        if form_url:
            rule["exclusions"] = {"operator": "or", "rules": [
                {"event_sources": [{"id": meta.pixel_id, "type": "pixel"}], "retention_seconds": 604800,
                 "filter": {"operator": "and", "filters": [{"field": "url", "operator": "i_contains", "value": form_url}]}}
            ]}
    try:
        result = await meta.create_custom_audience(
            f"LP_Visitors_NoApplication_7d_{company}",
            retention_days=7, rule=rule,
            description="LP-Besucher ohne Bewerbung (7 Tage)",
        )
        return {"audience_id": result.get("audience_id", "")}
    except Exception as e:
        log.warning(f"Custom Audience LP_NoApp_7d fehlgeschlagen (non-fatal): {e}")
        return {"audience_id": "", "skipped": True, "reason": str(e)[:100]}


async def ca03(context: dict, state) -> dict:
    """Custom Audience: App_NoLead_7d — Formular ohne Lead. Non-fatal."""
    company = state.client_name.replace(" ", "_")
    form_url = context.get("form_url", "")
    thankyou_url = context.get("thankyou_url", "")
    rule = None
    if form_url and meta.pixel_id:
        rule = {"inclusions": {"operator": "or", "rules": [
            {"event_sources": [{"id": meta.pixel_id, "type": "pixel"}], "retention_seconds": 604800,
             "filter": {"operator": "and", "filters": [{"field": "url", "operator": "i_contains", "value": form_url}]}}
        ]}}
        if thankyou_url:
            rule["exclusions"] = {"operator": "or", "rules": [
                {"event_sources": [{"id": meta.pixel_id, "type": "pixel"}], "retention_seconds": 604800,
                 "filter": {"operator": "and", "filters": [{"field": "url", "operator": "i_contains", "value": thankyou_url}]}}
            ]}
    try:
        result = await meta.create_custom_audience(
            f"Application_Visitors_NoLead_7d_{company}",
            retention_days=7, rule=rule,
            description="Formular-Besucher ohne Lead (7 Tage)",
        )
        return {"audience_id": result.get("audience_id", "")}
    except Exception as e:
        log.warning(f"Custom Audience App_NoLead_7d fehlgeschlagen (non-fatal): {e}")
        return {"audience_id": "", "skipped": True, "reason": str(e)[:100]}


# ── CA04: Initial Campaign + Image Upload ────────────────────

async def ca04(context: dict, state) -> dict:
    """Initial Campaign (TOF) + Image Upload."""
    company = state.client_name
    month = datetime.now().strftime("%Y-%m")
    campaign_name = f"TOF | {month} | Leads | DE | {company} Recruiting"

    # Bilder hochladen
    image_hashes = await meta.upload_images()

    # Campaign erstellen
    result = await meta.create_campaign(campaign_name, objective="OUTCOME_LEADS")
    campaign_id = result.get("campaign_id", "")

    meta_campaigns = dict(context.get("meta_campaigns", {}))
    meta_campaigns["initial"] = campaign_id

    await _track_campaign(company, f"TOF | {month} | Leads | DE | {company} Recruiting", "Initial", campaign_id, 30.0)

    return {
        "campaign_id": campaign_id,
        "meta_campaigns": meta_campaigns,
        "image_hashes": image_hashes,
        "url": meta.ads_manager_url(),
        "meta_ad_account": meta.ad_account,
    }


# ── CA05: Initial Ad Sets (3x) + Ads ────────────────────────

async def ca05(context: dict, state) -> dict:
    """3 Ad Sets + Ads: Broad, Interest_Recruiting, Interest_Management."""
    campaign_id = context.get("meta_campaigns", {}).get("initial") or context.get("campaign_id", "")
    if not campaign_id:
        return {"skipped": True, "reason": "Keine Initial-Kampagne"}

    company = state.client_name
    image_hashes = context.get("image_hashes", [])
    if not image_hashes:
        return {"skipped": True, "reason": "Keine Bilder hochgeladen (image_hashes leer)"}
    website = context.get("website", "") or context.get("lp_url", "")
    destination_url = context.get("lp_url", "") or (f"https://{website}" if website else "https://flowstack.de")
    month = datetime.now().strftime("%Y-%m")
    utm = meta.build_utm(f"TOF | {company}")

    adset_names = [
        f"Broad | Alle | 25-55 | DE | Feed | LEAD | {month}",
        f"Interest_Recruiting | Alle | 25-55 | DE | Feed | LEAD | {month}",
        f"Interest_Management | Alle | 25-55 | DE | Feed | LEAD | {month}",
    ]

    adset_ids = []
    all_ad_ids = []
    for name in adset_names:
        result = await meta.create_ad_set(
            campaign_id=campaign_id, name=name, daily_budget=3000,
            targeting=TARGETING_FEEDS, optimization_goal="OFFSITE_CONVERSIONS", utm_params=utm,
        )
        adset_id = result.get("adset_id", "")
        adset_ids.append(adset_id)

        # Ads erstellen
        if image_hashes and adset_id:
            ad_ids = await meta.create_ads(
                adset_id, image_hashes, AD_COPY_INITIAL,
                company, destination_url, "APPLY_NOW", "TOF",
            )
            all_ad_ids.extend(ad_ids)

    return {"adset_ids": adset_ids, "ad_ids": all_ad_ids, "ad_set_count": len(adset_ids), "ad_count": len(all_ad_ids), "url": meta.ads_manager_url()}


# ── CA06: Retargeting Campaign ───────────────────────────────

async def ca06(context: dict, state) -> dict:
    """Retargeting Campaign (RT)."""
    company = state.client_name
    month = datetime.now().strftime("%Y-%m")
    campaign_name = f"RT | {month} | Leads | DE | {company} Recruiting"

    result = await meta.create_campaign(campaign_name, objective="OUTCOME_LEADS")
    campaign_id = result.get("campaign_id", "")

    meta_campaigns = dict(context.get("meta_campaigns", {}))
    meta_campaigns["retargeting"] = campaign_id

    await _track_campaign(company, f"RT | {month} | Leads | DE | {company} Recruiting", "Retargeting", campaign_id, 30.0)

    return {"retargeting_campaign_id": campaign_id, "meta_campaigns": meta_campaigns, "url": meta.ads_manager_url()}


# ── CA07: Retargeting Ad Sets (3x) + Ads ────────────────────

async def ca07(context: dict, state) -> dict:
    """3 Ad Sets + Ads: AllPages_30d, LP_NoApp_7d, App_NoLead_7d."""
    campaign_id = context.get("meta_campaigns", {}).get("retargeting") or context.get("retargeting_campaign_id", "")
    if not campaign_id:
        return {"skipped": True, "reason": "Keine Retargeting-Kampagne"}

    company = state.client_name
    image_hashes = context.get("image_hashes", [])
    if not image_hashes:
        return {"skipped": True, "reason": "Keine Bilder hochgeladen (image_hashes leer)"}
    website = context.get("website", "") or context.get("lp_url", "")
    destination_url = context.get("form_url", "") or context.get("lp_url", "") or (f"https://{website}" if website else "https://flowstack.de")
    month = datetime.now().strftime("%Y-%m")
    utm = meta.build_utm(f"RT | {company}")

    adset_names = [
        f"WV-30d-AllPages | Alle | 25-55 | DE | Auto | LEAD | {month}",
        f"WV-7d-LP_NoBewerbung | Alle | 25-55 | DE | Auto | LEAD | {month}",
        f"WV-7d-Bewerbung_NoLead | Alle | 25-55 | DE | Auto | LEAD | {month}",
    ]

    adset_ids = []
    all_ad_ids = []
    for name in adset_names:
        result = await meta.create_ad_set(
            campaign_id=campaign_id, name=name, daily_budget=1000,
            targeting=TARGETING_AUTO, optimization_goal="OFFSITE_CONVERSIONS", utm_params=utm,
        )
        adset_id = result.get("adset_id", "")
        adset_ids.append(adset_id)

        if image_hashes and adset_id:
            ad_ids = await meta.create_ads(
                adset_id, image_hashes, AD_COPY_RETARGETING,
                company, destination_url, "APPLY_NOW", "RT",
            )
            all_ad_ids.extend(ad_ids)

    return {"adset_ids": adset_ids, "ad_ids": all_ad_ids, "ad_set_count": len(adset_ids), "ad_count": len(all_ad_ids), "retargeting_campaign_id": campaign_id, "url": meta.ads_manager_url()}


# ── CA08: Warmup Campaign ───────────────────────────────────

async def ca08(context: dict, state) -> dict:
    """Warmup Campaign (WU) — OUTCOME_AWARENESS."""
    company = state.client_name
    month = datetime.now().strftime("%Y-%m")
    campaign_name = f"WU | {month} | Awareness | DE | {company} Recruiting"

    result = await meta.create_campaign(campaign_name, objective="OUTCOME_AWARENESS")
    campaign_id = result.get("campaign_id", "")

    meta_campaigns = dict(context.get("meta_campaigns", {}))
    meta_campaigns["warmup"] = campaign_id

    await _track_campaign(company, f"WU | {month} | Awareness | DE | {company} Recruiting", "Warmup", campaign_id, 10.0)

    return {"warmup_campaign_id": campaign_id, "meta_campaigns": meta_campaigns, "url": meta.ads_manager_url()}


# ── CA09: Warmup Ad Set (1x) + Ads ──────────────────────────

async def ca09(context: dict, state) -> dict:
    """1 Ad Set + Ads: Warmup Broad. REACH-optimiert, Feed+Story."""
    campaign_id = context.get("meta_campaigns", {}).get("warmup") or context.get("warmup_campaign_id", "")
    if not campaign_id:
        return {"skipped": True, "reason": "Keine Warmup-Kampagne"}

    company = state.client_name
    image_hashes = context.get("image_hashes", [])
    if not image_hashes:
        return {"skipped": True, "reason": "Keine Bilder hochgeladen (image_hashes leer)"}
    website = context.get("website", "") or context.get("lp_url", "")
    destination_url = context.get("lp_url", "") or (f"https://{website}" if website else "https://flowstack.de")
    month = datetime.now().strftime("%Y-%m")
    utm = meta.build_utm(f"WU | {company}")

    result = await meta.create_ad_set(
        campaign_id=campaign_id,
        name=f"WV-30d-Warmup | Alle | 25-55 | DE | Feed | REACH | {month}",
        daily_budget=1000, targeting=TARGETING_WARMUP,
        optimization_goal="REACH", use_pixel=False, utm_params=utm,
    )
    adset_id = result.get("adset_id", "")

    ad_ids = []
    if image_hashes[:1] and adset_id:
        ad_ids = await meta.create_ads(
            adset_id, image_hashes[:1], AD_COPY_WARMUP,
            company, destination_url, "LEARN_MORE", "WU",
        )

    return {"adset_ids": [adset_id], "ad_ids": ad_ids, "ad_set_count": 1, "ad_count": len(ad_ids), "warmup_campaign_id": campaign_id, "url": meta.ads_manager_url()}


CAMPAIGN_HANDLERS = {
    "v3-ca00": ca00,
    "v3-ca01": ca01, "v3-ca02": ca02, "v3-ca03": ca03,
    "v3-ca04": ca04, "v3-ca05": ca05,
    "v3-ca06": ca06, "v3-ca07": ca07,
    "v3-ca08": ca08, "v3-ca09": ca09,
}
