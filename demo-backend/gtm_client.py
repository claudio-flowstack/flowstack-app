"""
V3 GTM + GA4 Auto-Setup per Client
- Create GTM container
- Add Meta Pixel + GA4 tags with consent
- Publish container
- Create GA4 property + data stream
"""

import os
import json
import logging
from typing import Any, Optional
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from googleapiclient.discovery import build

logger = logging.getLogger("v3.gtm")

MARKETING_TOKEN_PATH = os.path.expanduser("~/.config/google_marketing_token.json")
GTM_ACCOUNT_ID = "6344924987"  # Flowstack-system GTM account


def _get_creds() -> Credentials:
    """Load and refresh Google Marketing credentials."""
    creds = Credentials.from_authorized_user_file(MARKETING_TOKEN_PATH)
    if creds.expired:
        creds.refresh(Request())
    return creds


# ============================================================
# GTM AUTO-SETUP
# ============================================================

async def setup_gtm_for_client(
    client_name: str,
    client_domain: str,
    meta_pixel_id: str,
    ga4_measurement_id: Optional[str] = None,
) -> dict[str, Any]:
    """
    Create a GTM container for a client with Meta Pixel + GA4 tags.

    Returns:
        {
            'container_id': str,
            'gtm_public_id': str,   # GTM-XXXXXXX
            'ga4_measurement_id': str,
            'published': bool,
        }
    """
    creds = _get_creds()
    gtm = build("tagmanager", "v2", credentials=creds)

    container_name = f"{client_name} — {client_domain}"

    # Idempotency: Check if container exists
    existing = gtm.accounts().containers().list(
        parent=f"accounts/{GTM_ACCOUNT_ID}"
    ).execute()

    for c in existing.get("container", []):
        if c["name"] == container_name:
            logger.info(f"GTM container already exists: {c['publicId']}")
            return {
                "container_id": c["containerId"],
                "gtm_public_id": c["publicId"],
                "reused": True,
            }

    # Create container
    container = gtm.accounts().containers().create(
        parent=f"accounts/{GTM_ACCOUNT_ID}",
        body={
            "name": container_name,
            "usageContext": ["web"],
            "domainName": [client_domain],
        },
    ).execute()

    container_id = container["containerId"]
    public_id = container["publicId"]
    container_path = container["path"]

    logger.info(f"GTM container created: {public_id} for {client_name}")

    # Get default workspace
    workspaces = gtm.accounts().containers().workspaces().list(
        parent=container_path
    ).execute()
    ws_path = workspaces["workspace"][0]["path"]

    # Create "All Pages" trigger
    trigger = gtm.accounts().containers().workspaces().triggers().create(
        parent=ws_path,
        body={"name": "All Pages", "type": "pageview"},
    ).execute()
    trigger_id = trigger["triggerId"]

    # Create Meta Pixel tag (with consent)
    fb_html = (
        '<script>'
        '!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?'
        'n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;'
        'n.push=n;n.loaded=!0;n.version="2.0";n.queue=[];t=b.createElement(e);t.async=!0;'
        't.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}'
        '(window,document,"script","https://connect.facebook.net/en_US/fbevents.js");'
        f'fbq("init","{meta_pixel_id}");fbq("track","PageView");'
        '</script>'
    )

    gtm.accounts().containers().workspaces().tags().create(
        parent=ws_path,
        body={
            "name": "Meta Pixel",
            "type": "html",
            "parameter": [{"type": "template", "key": "html", "value": fb_html}],
            "firingTriggerId": [trigger_id],
            "consentSettings": {
                "consentStatus": "needed",
                "consentType": {
                    "type": "list",
                    "list": [
                        {"type": "template", "value": "ad_storage"},
                        {"type": "template", "value": "ad_user_data"},
                        {"type": "template", "value": "ad_personalization"},
                    ],
                },
            },
        },
    ).execute()

    # Create GA4 tag (if measurement ID provided)
    if ga4_measurement_id:
        gtm.accounts().containers().workspaces().tags().create(
            parent=ws_path,
            body={
                "name": "GA4 Configuration",
                "type": "googtag",
                "parameter": [{"type": "template", "key": "tagId", "value": ga4_measurement_id}],
                "firingTriggerId": [trigger_id],
                "consentSettings": {
                    "consentStatus": "needed",
                    "consentType": {
                        "type": "list",
                        "list": [{"type": "template", "value": "analytics_storage"}],
                    },
                },
            },
        ).execute()

    # Publish container
    version = gtm.accounts().containers().workspaces().create_version(
        path=ws_path,
        body={"name": "v1 — Auto-Setup", "notes": f"Meta Pixel + GA4 for {client_name}"},
    ).execute()

    version_id = version["containerVersion"]["containerVersionId"]
    gtm.accounts().containers().versions().publish(
        path=f"{container_path}/versions/{version_id}"
    ).execute()

    logger.info(f"GTM container {public_id} published for {client_name}")

    return {
        "container_id": container_id,
        "gtm_public_id": public_id,
        "ga4_measurement_id": ga4_measurement_id,
        "published": True,
        "reused": False,
    }


# ============================================================
# GA4 AUTO-SETUP
# ============================================================

async def setup_ga4_for_client(
    client_name: str,
    client_domain: str,
    ga4_account_id: str = "accounts/388017645",  # Flowstack Systems GA4 Account
) -> dict[str, Any]:
    """
    Create a GA4 property + web data stream for a client.

    Returns:
        {
            'property_id': str,
            'measurement_id': str,   # G-XXXXXXX
        }
    """
    creds = _get_creds()
    ga_admin = build("analyticsadmin", "v1beta", credentials=creds)

    # Idempotency: Check existing properties
    properties = ga_admin.properties().list(
        filter=f"parent:{ga4_account_id}"
    ).execute()

    for prop in properties.get("properties", []):
        if prop["displayName"] == f"{client_name} Website":
            logger.info(f"GA4 property already exists: {prop['name']}")
            # Get measurement ID from data stream
            streams = ga_admin.properties().dataStreams().list(
                parent=prop["name"]
            ).execute()
            mid = None
            for s in streams.get("dataStreams", []):
                mid = s.get("webStreamData", {}).get("measurementId")
                if mid:
                    break
            return {
                "property_id": prop["name"],
                "measurement_id": mid,
                "reused": True,
            }

    # Create property
    prop = ga_admin.properties().create(
        body={
            "parent": ga4_account_id,
            "displayName": f"{client_name} Website",
            "timeZone": "Europe/Berlin",
            "currencyCode": "EUR",
            "industryCategory": "JOBS_AND_EDUCATION",
        },
    ).execute()

    # Create web data stream
    stream = ga_admin.properties().dataStreams().create(
        parent=prop["name"],
        body={
            "type": "WEB_DATA_STREAM",
            "displayName": client_domain,
            "webStreamData": {"defaultUri": f"https://{client_domain}"},
        },
    ).execute()

    measurement_id = stream.get("webStreamData", {}).get("measurementId", "")

    logger.info(f"GA4 property created for {client_name}: {measurement_id}")

    return {
        "property_id": prop["name"],
        "measurement_id": measurement_id,
        "reused": False,
    }
