"""UTM parameter builder for Meta Ads URL Parameters."""
from __future__ import annotations


def build_utm_params(campaign_name: str, ad_name: str = "", adset_name: str = "") -> str:
    return (
        "utm_source=meta"
        "&utm_medium=paid"
        f"&utm_campaign={campaign_name.replace(' ', '+')}"
        f"&utm_content={ad_name.replace(' ', '+')}"
        f"&utm_term={adset_name.replace(' ', '+')}"
    )
