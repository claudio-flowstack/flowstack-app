"""
Phase 5: Funnel, Pixel & Tracking
Nodes: v3-fn01 bis v3-fn-screenshots
Nutzt: Google (GTM, GA4), Meta (Pixel), urllib (SSL/Performance)
"""

import json
import ssl
import time
import logging
import urllib.request
import certifi
from ..integrations.google import GoogleClient
from ..integrations.meta import MetaClient
from ..integrations.airtable import AirtableClient
from ..integrations.close import CloseClient

log = logging.getLogger("v3.phase.funnel")

google = GoogleClient()
meta = MetaClient()
airtable = AirtableClient()
close = CloseClient()

_SSL_CTX = ssl.create_default_context(cafile=certifi.where())


async def fn01(context: dict, state) -> dict:
    """Funnel-URLs aus Context erfassen. Seiten werden extern im Page-Builder erstellt."""
    funnel_url = context.get("funnel_url", context.get("website", ""))
    lp_url = context.get("lp_url", funnel_url)
    form_url = context.get("form_url", f"{funnel_url}/formular" if funnel_url else "")
    thankyou_url = context.get("thankyou_url", f"{funnel_url}/danke" if funnel_url else "")
    return {
        "funnel_url": funnel_url,
        "lp_url": lp_url,
        "form_url": form_url,
        "thankyou_url": thankyou_url,
        "pages": ["landingpage", "formular", "dankeseite"],
    }


async def fn05a(context: dict, state) -> dict:
    """SSL + Performance check — URL reachable, SSL valid, load time."""
    funnel_url = context.get("funnel_url", "")
    if not funnel_url:
        return {"error": "Keine funnel_url angegeben", "passed": False}

    # Ensure URL has protocol
    if not funnel_url.startswith("http"):
        funnel_url = f"https://{funnel_url}"

    result = {
        "url": funnel_url,
        "ssl_valid": False,
        "reachable": False,
        "load_time_ms": 0,
        "status_code": 0,
    }

    try:
        start = time.time()
        req = urllib.request.Request(funnel_url, method="GET", headers={
            "User-Agent": "Flowstack-V3-Check/1.0",
        })
        resp = urllib.request.urlopen(req, timeout=15, context=_SSL_CTX)
        load_time = (time.time() - start) * 1000

        result["reachable"] = True
        result["status_code"] = resp.getcode()
        result["load_time_ms"] = round(load_time)
        result["ssl_valid"] = funnel_url.startswith("https://")

        # Performance rating
        if load_time < 1000:
            result["performance"] = "excellent"
        elif load_time < 2500:
            result["performance"] = "good"
        elif load_time < 5000:
            result["performance"] = "acceptable"
        else:
            result["performance"] = "slow"

    except ssl.SSLError as e:
        result["ssl_valid"] = False
        result["ssl_error"] = str(e)[:100]
        log.warning(f"SSL error for {funnel_url}: {e}")
    except urllib.error.HTTPError as e:
        result["reachable"] = True
        result["status_code"] = e.code
        result["error"] = f"HTTP {e.code}"
    except urllib.error.URLError as e:
        result["error"] = str(e.reason)[:100]
    except Exception as e:
        result["error"] = str(e)[:100]

    result["passed"] = result["reachable"] and result["ssl_valid"] and result.get("status_code", 0) in (200, 301, 302)
    return result


async def fn10a(context: dict, state) -> dict:
    """GTM Container auto-setup — create container + Meta Pixel tag + GA4 tag, publish."""
    try:
        creds = google.get_marketing_creds()
    except Exception:
        creds = {}
    token = creds.get("access_token", "")

    if not token:
        return {"error": "Kein Google Marketing Token gefunden", "skipped": True}

    account_id = creds.get("account_id", "")
    pixel_id = context.get("pixel_id", meta.pixel_id)
    ga4_measurement_id = context.get("ga4_measurement_id", "")
    container_name = f"V3 — {state.client_name}"

    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    result = {"container_id": "", "pixel_tag_id": "", "ga4_tag_id": "", "published": False}

    try:
        # 1. Create GTM container
        create_data = json.dumps({
            "name": container_name,
            "usageContext": ["web"],
        }).encode()
        req = urllib.request.Request(
            f"https://www.googleapis.com/tagmanager/v2/accounts/{account_id}/containers",
            data=create_data, headers=headers, method="POST",
        )
        resp = urllib.request.urlopen(req, timeout=30, context=_SSL_CTX)
        container = json.loads(resp.read())
        container_id = container.get("containerId", "")
        container_path = container.get("path", "")
        result["container_id"] = container_id
        result["gtm_id"] = container.get("publicId", "")

        # 2. Create workspace (default)
        workspace_path = f"{container_path}/workspaces/default"

        # List workspaces to get the default one
        req = urllib.request.Request(
            f"https://www.googleapis.com/tagmanager/v2/{container_path}/workspaces",
            headers=headers,
        )
        resp = urllib.request.urlopen(req, timeout=15, context=_SSL_CTX)
        workspaces = json.loads(resp.read()).get("workspace", [])
        if workspaces:
            workspace_path = workspaces[0].get("path", workspace_path)

        # 3. Create Meta Pixel tag
        if pixel_id:
            pixel_tag_data = json.dumps({
                "name": "Meta Pixel — Base Code",
                "type": "html",
                "parameter": [{
                    "type": "template",
                    "key": "html",
                    "value": f"""<!-- Meta Pixel Code -->
<script>
!function(f,b,e,v,n,t,s){{if(f.fbq)return;n=f.fbq=function(){{n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)}};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}}(window,
document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '{pixel_id}');
fbq('track', 'PageView');
</script>""",
                }],
                "firingTriggerId": ["2147479553"],  # All Pages trigger
            }).encode()
            req = urllib.request.Request(
                f"https://www.googleapis.com/tagmanager/v2/{workspace_path}/tags",
                data=pixel_tag_data, headers=headers, method="POST",
            )
            resp = urllib.request.urlopen(req, timeout=15, context=_SSL_CTX)
            pixel_tag = json.loads(resp.read())
            result["pixel_tag_id"] = pixel_tag.get("tagId", "")

        # 4. Create GA4 tag
        if ga4_measurement_id:
            ga4_tag_data = json.dumps({
                "name": "GA4 Configuration",
                "type": "gaawc",
                "parameter": [{
                    "type": "template",
                    "key": "measurementId",
                    "value": ga4_measurement_id,
                }],
                "firingTriggerId": ["2147479553"],
            }).encode()
            req = urllib.request.Request(
                f"https://www.googleapis.com/tagmanager/v2/{workspace_path}/tags",
                data=ga4_tag_data, headers=headers, method="POST",
            )
            resp = urllib.request.urlopen(req, timeout=15, context=_SSL_CTX)
            ga4_tag = json.loads(resp.read())
            result["ga4_tag_id"] = ga4_tag.get("tagId", "")

        # 5. Publish container version
        version_data = json.dumps({"name": "V3 Auto-Setup"}).encode()
        req = urllib.request.Request(
            f"https://www.googleapis.com/tagmanager/v2/{workspace_path}:create_version",
            data=version_data, headers=headers, method="POST",
        )
        resp = urllib.request.urlopen(req, timeout=30, context=_SSL_CTX)
        version = json.loads(resp.read())
        version_path = version.get("containerVersion", {}).get("path", "")

        if version_path:
            req = urllib.request.Request(
                f"https://www.googleapis.com/tagmanager/v2/{version_path}:publish",
                headers=headers, method="POST", data=b"",
            )
            urllib.request.urlopen(req, timeout=30, context=_SSL_CTX)
            result["published"] = True

    except Exception as e:
        result["error"] = str(e)[:200]
        log.warning(f"GTM setup failed: {e}")

    return result


async def fn10b(context: dict, state) -> dict:
    """GA4 property + data stream auto-setup."""
    try:
        creds = google.get_marketing_creds()
    except Exception:
        creds = {}
    token = creds.get("access_token", "")

    if not token:
        return {"error": "Kein Google Marketing Token gefunden", "skipped": True}

    account_id = creds.get("analytics_account_id", creds.get("account_id", ""))
    funnel_url = context.get("funnel_url", "")
    property_name = f"V3 — {state.client_name}"

    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    result = {"property_id": "", "data_stream_id": "", "measurement_id": ""}

    try:
        # 1. Create GA4 property
        property_data = json.dumps({
            "displayName": property_name,
            "timeZone": "Europe/Berlin",
            "currencyCode": "EUR",
            "parent": f"accounts/{account_id}",
        }).encode()
        req = urllib.request.Request(
            "https://analyticsadmin.googleapis.com/v1beta/properties",
            data=property_data, headers=headers, method="POST",
        )
        resp = urllib.request.urlopen(req, timeout=30, context=_SSL_CTX)
        prop = json.loads(resp.read())
        property_id = prop.get("name", "").split("/")[-1]
        result["property_id"] = property_id

        # 2. Create web data stream
        if property_id and funnel_url:
            # Strip protocol for defaultUri
            clean_url = funnel_url.replace("https://", "").replace("http://", "").rstrip("/")

            stream_data = json.dumps({
                "displayName": f"{state.client_name} — Funnel",
                "webStreamData": {"defaultUri": f"https://{clean_url}"},
            }).encode()
            req = urllib.request.Request(
                f"https://analyticsadmin.googleapis.com/v1beta/properties/{property_id}/dataStreams",
                data=stream_data, headers=headers, method="POST",
            )
            resp = urllib.request.urlopen(req, timeout=15, context=_SSL_CTX)
            stream = json.loads(resp.read())
            result["data_stream_id"] = stream.get("name", "").split("/")[-1]
            result["measurement_id"] = stream.get("webStreamData", {}).get("measurementId", "")

    except Exception as e:
        result["error"] = str(e)[:200]
        log.warning(f"GA4 setup failed: {e}")

    return result


async def fn_pixel(context: dict, state) -> dict:
    """Pixel verification — check Meta pixel is active via Graph API."""
    pixel_result = await meta.verify_pixel()
    return {
        "pixel_active": pixel_result.get("active", False),
        "pixel_name": pixel_result.get("pixel_name", ""),
        "pixel_id": pixel_result.get("pixel_id", ""),
        "passed": pixel_result.get("active", False),
    }


async def fn_screenshots(context: dict, state) -> dict:
    """Screenshot-Check — URLs vorhanden fuer manuelles Review."""
    lp = context.get("lp_url", "")
    form = context.get("form_url", "")
    thankyou = context.get("thankyou_url", "")
    urls_set = sum(1 for u in [lp, form, thankyou] if u)
    return {
        "lp_url": lp,
        "form_url": form,
        "thankyou_url": thankyou,
        "urls_configured": urls_set,
        "ready_for_review": urls_set >= 2,
    }


FUNNEL_HANDLERS = {
    "v3-fn01": fn01,
    "v3-fn05a": fn05a,
    "v3-fn10a": fn10a,
    "v3-fn10b": fn10b,
    "v3-fn-pixel": fn_pixel,
    "v3-fn-screenshots": fn_screenshots,
}
