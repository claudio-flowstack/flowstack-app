"""
Meta Ads Integration — Audiences, Campaigns, Ad Sets, Ads, Insights.
1:1 Portierung der V1/V2 Logik aus server.py.
"""

import httpx
import json
import logging
import os
from datetime import datetime, timedelta
from ..config import META_ACCESS_TOKEN, META_AD_ACCOUNT, META_PIXEL_ID, META_PAGE_ID, BASE_DIR
from .errors import IntegrationError, RateLimitError, AuthError, NotFoundError, retryable

log = logging.getLogger("v3.meta")


class MetaClient:
    """Meta Graph API Wrapper."""

    def __init__(self):
        self.token = META_ACCESS_TOKEN
        self.ad_account = META_AD_ACCOUNT if META_AD_ACCOUNT.startswith("act_") else f"act_{META_AD_ACCOUNT}"
        self.pixel_id = META_PIXEL_ID
        self.page_id = META_PAGE_ID
        self.api_version = "v21.0"
        self.ad_image_dir = str(BASE_DIR / "ad-images")
        self._client = httpx.AsyncClient(timeout=30)

    def _acct_numeric(self) -> str:
        return self.ad_account.replace("act_", "")

    def ads_manager_url(self) -> str:
        return f"https://adsmanager.facebook.com/adsmanager/manage/campaigns?act={self._acct_numeric()}"

    @retryable(max_retries=1, delay=3.0)
    async def _request(self, method: str, path: str, data: dict = None) -> dict:
        url = f"https://graph.facebook.com/{self.api_version}/{path}"
        params = {"access_token": self.token}

        if method == "POST":
            # Meta API erwartet Form-encoded POST, nicht JSON
            form = {"access_token": self.token}
            for k, v in (data or {}).items():
                if isinstance(v, (dict, list)):
                    form[k] = json.dumps(v)
                elif isinstance(v, bool):
                    form[k] = "true" if v else "false"
                else:
                    form[k] = v
            resp = await self._client.post(url, data=form)
        elif method == "GET":
            resp = await self._client.get(url, params={**params, **(data or {})})
        elif method == "DELETE":
            resp = await self._client.delete(url, params=params)
        else:
            resp = await self._client.request(method, url, params=params, data=data or {})

            body = resp.json()

            if "error" in body:
                err = body["error"]
                code = err.get("code", 0)
                msg = err.get("message", "Unknown error")[:200]
                if code in (190, 102):
                    raise AuthError("meta", f"{method} {path}", msg)
                if code in (4, 17, 32):
                    raise RateLimitError("meta", f"{method} {path}", retry_after=600)
                if code == 100 and "does not exist" in msg.lower():
                    raise NotFoundError("meta", f"{method} {path}", path)
                raise IntegrationError("meta", f"{method} {path}", f"Code {code}: {msg}", retryable=code >= 500 or code in (1, 2))

            return body

    # ── Account ──────────────────────────────────────────────

    async def check_account_health(self) -> dict:
        result = await self._request("GET", self.ad_account, {"fields": "name,account_status,disable_reason"})
        status = result.get("account_status", 0)
        return {"healthy": status == 1, "name": result.get("name", ""), "status_code": status}

    # ── Audiences ────────────────────────────────────────────

    async def create_custom_audience(self, name: str, retention_days: int = 30, rule: dict = None, description: str = "") -> dict:
        """Custom Audience erstellen — 1:1 V1/V2 Logik."""
        payload = {
            "name": name,
            "description": description or f"Automatisch erstellt — {retention_days} Tage",
        }
        if self.pixel_id:
            payload["rule"] = rule or {"inclusions": {"operator": "or", "rules": [
                {"event_sources": [{"id": self.pixel_id, "type": "pixel"}], "retention_seconds": retention_days * 86400}
            ]}}
            payload["retention_days"] = retention_days
            payload["pixel_id"] = self.pixel_id
            payload["prefill"] = True
        else:
            payload["customer_file_source"] = "USER_PROVIDED_ONLY"

        result = await self._request("POST", f"{self.ad_account}/customaudiences", payload)
        audience_id = result.get("id", "")
        if not audience_id:
            raise IntegrationError("meta", "create_custom_audience", "API returned empty audience_id")
        log.info("meta.create_custom_audience", extra={"service": "meta", "audience_id": audience_id, "resource_name": name})
        return {"audience_id": audience_id, "name": name}

    # ── Campaigns ────────────────────────────────────────────

    async def create_campaign(self, name: str, objective: str = "OUTCOME_LEADS") -> dict:
        """Kampagne erstellen. CBO OFF, PAUSED, Employment Category."""
        # Idempotenz: prüfe ob Kampagne existiert
        try:
            existing = await self._request("GET", f"{self.ad_account}/campaigns", {"fields": "name,id", "limit": "100"})
            for camp in existing.get("data", []):
                if camp.get("name") == name:
                    log.info("meta.create_campaign reuse", extra={"service": "meta", "campaign_id": camp["id"], "resource_name": name})
                    return {"campaign_id": camp["id"], "name": name}
        except Exception:
            pass

        result = await self._request("POST", f"{self.ad_account}/campaigns", {
            "name": name,
            "objective": objective,
            "status": "PAUSED",
            "special_ad_categories": ["EMPLOYMENT"],
            "is_campaign_budget_optimization": False,
            "is_adset_budget_sharing_enabled": False,
        })
        campaign_id = result.get("id", "")
        if not campaign_id:
            raise IntegrationError("meta", "create_campaign", "API returned empty campaign_id")
        log.info("meta.create_campaign", extra={"service": "meta", "campaign_id": campaign_id, "resource_name": name})
        return {"campaign_id": campaign_id, "name": name}

    # ── Ad Sets ──────────────────────────────────────────────

    async def create_ad_set(self, campaign_id: str, name: str, daily_budget: int = 3000,
                            targeting: dict = None, optimization_goal: str = "OFFSITE_CONVERSIONS",
                            bid_strategy: str = "LOWEST_COST_WITHOUT_CAP",
                            use_pixel: bool = True, utm_params: str = "") -> dict:
        """Ad Set erstellen — 1:1 wie V1, ohne Idempotenz-Check."""
        data = {
            "name": name,
            "campaign_id": campaign_id,
            "daily_budget": daily_budget,
            "billing_event": "IMPRESSIONS",
            "optimization_goal": optimization_goal,
            "bid_strategy": bid_strategy,
            "status": "PAUSED",
            "targeting": targeting or {"geo_locations": {"countries": ["DE"]}},
            "start_time": (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%dT00:00:00+0000"),
        }
        if use_pixel and self.pixel_id and optimization_goal != "REACH":
            data["promoted_object"] = {"pixel_id": self.pixel_id, "custom_event_type": "LEAD"}
            data["attribution_spec"] = [{"event_type": "CLICK_THROUGH", "window_days": 7}]
        if utm_params:
            data["url_tags"] = utm_params

        result = await self._request("POST", f"{self.ad_account}/adsets", data)
        adset_id = result.get("id", "")
        if not adset_id:
            raise IntegrationError("meta", "create_ad_set", "API returned empty adset_id")
        return {"adset_id": adset_id, "name": name}

    # ── Campaign Management ──────────────────────────────────

    async def activate_campaign(self, campaign_id: str) -> dict:
        await self._request("POST", campaign_id, {"status": "ACTIVE"})
        return {"activated": True, "campaign_id": campaign_id}

    async def pause_campaign(self, campaign_id: str) -> dict:
        await self._request("POST", campaign_id, {"status": "PAUSED"})
        return {"paused": True}

    # ── Insights ─────────────────────────────────────────────

    async def get_campaign_insights(self, campaign_id: str, date_preset: str = "last_7d") -> dict:
        result = await self._request("GET", f"{campaign_id}/insights", {
            "fields": "impressions,clicks,spend,ctr,actions,frequency",
            "date_preset": date_preset,
        })
        data = result.get("data", [{}])
        return data[0] if data else {}

    # ── Pixel ────────────────────────────────────────────────

    async def verify_pixel(self) -> dict:
        result = await self._request("GET", self.pixel_id, {"fields": "name,is_unavailable"})
        return {
            "active": not result.get("is_unavailable", True),
            "pixel_name": result.get("name", ""),
            "pixel_id": self.pixel_id,
        }

    # ── UTM ──────────────────────────────────────────────────

    @staticmethod
    def build_utm(campaign_name: str) -> str:
        return f"utm_source=meta&utm_medium=paid&utm_campaign={campaign_name.replace(' ', '+')}&utm_content={{{{ad.name}}}}&utm_term={{{{adset.name}}}}"

    # ── Health ───────────────────────────────────────────────

    # ── Image Upload ───────────────────────────────────────────

    async def upload_images(self) -> list[str]:
        """Bilder aus ad-images/ hochladen. Returns Image-Hashes."""
        if not os.path.isdir(self.ad_image_dir):
            log.warning(f"Ad-Images Ordner nicht gefunden: {self.ad_image_dir}")
            return []

        hashes = []
        async with httpx.AsyncClient(timeout=60) as client:
            for fname in sorted(os.listdir(self.ad_image_dir)):
                if not fname.lower().endswith((".jpg", ".jpeg", ".png")):
                    continue
                fpath = os.path.join(self.ad_image_dir, fname)
                with open(fpath, "rb") as f:
                    resp = await client.post(
                        f"https://graph.facebook.com/{self.api_version}/{self.ad_account}/adimages",
                        data={"access_token": self.token},
                        files={"filename": (fname, f, "image/jpeg")},
                    )
                if resp.status_code == 200:
                    images = resp.json().get("images", {})
                    for _key, val in images.items():
                        h = val.get("hash", "")
                        if h:
                            hashes.append(h)
                            log.info(f"Meta Bild hochgeladen: {fname}")
                else:
                    log.warning(f"Meta Bild-Upload fehlgeschlagen ({fname}): {resp.status_code}")
        return hashes

    # ── Ad Creation ──────────────────────────────────────────

    async def create_ads(self, adset_id: str, image_hashes: list[str], copy_texts: list[str],
                         company: str, destination_url: str, cta_type: str = "APPLY_NOW",
                         funnel_stage: str = "TOF") -> list[str]:
        """Ads erstellen — 1:1 wie V1, ohne Idempotenz-Check."""
        if not self.page_id:
            log.warning("Kein META_PAGE_ID — Ads-Erstellung uebersprungen")
            return []

        concepts = ["PainPoint", "SocialProof", "Testimonial"]
        angles = ["Fachkraefte", "Zeitersparnis", "ROI"]
        month = datetime.now().strftime("%Y-%m")
        copy_text = copy_texts[0].format(company=company) if copy_texts else f"Jetzt bewerben bei {company}!"

        ad_ids = []
        for i, img_hash in enumerate(image_hashes):
            concept = concepts[i % len(concepts)]
            angle = angles[i % len(angles)]
            variant = f"V{i + 1}"

            creative_name = f"Image | {concept} | {angle} | Inhouse | {variant} | {month}"
            ad_name = f"{funnel_stage} | {concept} | {angle} | {variant} | {month}"

            creative = await self._request("POST", f"{self.ad_account}/adcreatives", {
                "name": creative_name,
                "object_story_spec": {
                    "page_id": self.page_id,
                    "link_data": {
                        "message": copy_text,
                        "link": destination_url,
                        "image_hash": img_hash,
                        "call_to_action": {"type": cta_type, "value": {"link": destination_url}},
                    },
                },
            })

            ad = await self._request("POST", f"{self.ad_account}/ads", {
                "name": ad_name,
                "adset_id": adset_id,
                "creative": {"creative_id": creative["id"]},
                "status": "PAUSED",
            })
            ad_ids.append(ad["id"])

        log.info(f"Meta Ads erstellt fuer AdSet {adset_id}: {len(ad_ids)} Ads")
        return ad_ids

    # ── Ad Details ───────────────────────────────────────────

    async def get_ad_details(self, ad_id: str) -> dict:
        """Get ad creative details."""
        result = await self._request("GET", ad_id, {
            "fields": "name,status,creative{thumbnail_url,body,title,link_url,call_to_action_type,image_url}"
        })
        creative = result.get("creative", {})
        return {
            "id": ad_id,
            "name": result.get("name", ""),
            "status": result.get("status", ""),
            "body": creative.get("body", ""),
            "title": creative.get("title", ""),
            "image_url": creative.get("thumbnail_url", creative.get("image_url", "")),
            "link_url": creative.get("link_url", ""),
            "cta_type": creative.get("call_to_action_type", ""),
        }

    async def update_ad_creative(self, ad_id: str, fields: dict) -> dict:
        """Update ad creative text/CTA."""
        # Get current creative_id
        ad = await self._request("GET", ad_id, {"fields": "creative"})
        creative_id = ad.get("creative", {}).get("id", "")
        if not creative_id:
            raise IntegrationError("meta", "update_ad_creative", "No creative_id found")

        # Update creative
        update_data = {}
        if "body" in fields:
            update_data["body"] = fields["body"]
        if "title" in fields:
            update_data["title"] = fields["title"]

        if update_data:
            await self._request("POST", creative_id, update_data)

        return {"updated": True, "ad_id": ad_id}

    # ── Health ───────────────────────────────────────────────

    async def health_check(self) -> dict:
        try:
            result = await self._request("GET", "me", {"fields": "id,name"})
            return {"status": "ok", "name": result.get("name", "?")}
        except Exception as e:
            return {"status": "error", "message": str(e)[:80]}
