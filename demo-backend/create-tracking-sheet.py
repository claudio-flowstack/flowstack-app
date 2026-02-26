"""
Create Recruiting Tracking Sheet — Duplicates the E-Commerce template,
adapts it for Recruiting funnel (Applicants instead of Purchases),
and places it in the client's 07_Tracking folder.

Usage:
  doppler run -p fulfillment-automation -c dev_claudio -- python3 create-tracking-sheet.py

Template: 1-HGe6sCOlaCE-x0uZB_qs-6ZLczlikR181l3ztOoadE (Shopify E-Commerce Tracking)
"""

import os, json, requests, random
from datetime import datetime, timedelta

# ── Auth ──────────────────────────────────────────────────────────────────────

_google_raw = os.environ.get("GOOGLE_CLAUDIO_OAUTH_TOKEN", os.environ.get("GOOGLE_OAUTH_TOKEN", "{}"))
_google_creds = json.loads(_google_raw) if _google_raw else {}
GOOGLE_ACCESS_TOKEN = _google_creds.get("token", "")
GOOGLE_REFRESH_TOKEN = _google_creds.get("refresh_token", "")
GOOGLE_CLIENT_ID = _google_creds.get("client_id", "")
GOOGLE_CLIENT_SECRET = _google_creds.get("client_secret", "")

TEMPLATE_SHEET_ID = "1-HGe6sCOlaCE-x0uZB_qs-6ZLczlikR181l3ztOoadE"

def refresh_token():
    global GOOGLE_ACCESS_TOKEN
    resp = requests.post("https://oauth2.googleapis.com/token", data={
        "client_id": GOOGLE_CLIENT_ID,
        "client_secret": GOOGLE_CLIENT_SECRET,
        "refresh_token": GOOGLE_REFRESH_TOKEN,
        "grant_type": "refresh_token",
    })
    if resp.ok:
        GOOGLE_ACCESS_TOKEN = resp.json()["access_token"]
        print(f"Token refreshed")
    else:
        print(f"Token refresh failed: {resp.text}")

def headers():
    return {"Authorization": f"Bearer {GOOGLE_ACCESS_TOKEN}"}

def sheets_api(spreadsheet_id, method="GET", path="", json_body=None):
    url = f"https://sheets.googleapis.com/v4/spreadsheets/{spreadsheet_id}{path}"
    if method == "GET":
        r = requests.get(url, headers=headers())
    elif method == "POST":
        r = requests.post(url, headers=headers(), json=json_body)
    elif method == "PUT":
        r = requests.put(url, headers=headers(), json=json_body)
    if r.status_code == 401:
        refresh_token()
        if method == "GET":
            r = requests.get(url, headers=headers())
        elif method == "POST":
            r = requests.post(url, headers=headers(), json=json_body)
        elif method == "PUT":
            r = requests.put(url, headers=headers(), json=json_body)
    return r

# ── Step 1: Copy the template ────────────────────────────────────────────────

def copy_template():
    """Copy the E-Commerce template sheet via Drive API"""
    url = f"https://www.googleapis.com/drive/v3/files/{TEMPLATE_SHEET_ID}/copy"
    body = {"name": "Novacode GmbH_TrackingDashboard"}
    r = requests.post(url, headers={**headers(), "Content-Type": "application/json"}, json=body)
    if r.status_code == 401:
        refresh_token()
        r = requests.post(url, headers={**headers(), "Content-Type": "application/json"}, json=body)
    if not r.ok:
        print(f"Copy failed: {r.status_code} {r.text}")
        return None
    data = r.json()
    print(f"Copied template -> {data['id']}")
    return data["id"]

# ── Step 2: Build the recruiting tracking data ────────────────────────────────

def get_kw(dt):
    """Get ISO calendar week"""
    return dt.isocalendar()[1]

def german_month(dt):
    months = ["", "Januar", "Februar", "März", "April", "Mai", "Juni",
              "Juli", "August", "September", "Oktober", "November", "Dezember"]
    return months[dt.month]

def build_recruiting_data():
    """Build the complete recruiting tracking sheet data for March 2026"""

    rows = []

    # ── Header row (row 1) ────────────────────────────────────────────────
    header = [
        "RECRUITING KAMPAGNEN-TRACKING\nZeit & Kontext\nMonat",
        "KW",
        "Datum",
        # Kosten & Reichweite
        "Kosten & Reichweite\nWerbekosten (EUR)",
        "Impressionen",
        "Klick-Ebene\nCTR (alle)",
        "Link-Klicks",
        "Kosten pro\nLink-Klick (EUR)",
        "CTR (Link)\nDurchklickrate (%)",
        # Recruiting Funnel: Landingpage
        "Recruiting: Landingpage\nLP-Besucher",
        "Kosten pro\nLP-Besuch (EUR)",
        "LP Funnel-\nConversion (%)",
        "LP Click-to-\nEvent-Rate (%)",
        # Recruiting Funnel: Bewerbung gestartet
        "Recruiting: Bewerbung\nBewerbung gestartet",
        "Kosten pro\nBew.-Start (EUR)",
        "Start Funnel-\nConversion (%)",
        "Start Click-to-\nEvent-Rate (%)",
        # Recruiting Funnel: Bewerbung abgeschickt
        "Recruiting: Lead\nBewerbung abgeschickt",
        "Kosten pro\nBewerbung (EUR)",
        "Bewerbung Funnel-\nConversion (%)",
        "Bewerbung Click-to-\nEvent-Rate (%)",
        # Recruiting Funnel: Erstgespräch
        "Recruiting: Gespräch\nErstgespräche",
        "Kosten pro\nErstgespräch (EUR)",
        "Gespräch Funnel-\nConversion (%)",
        "Gespräch Click-to-\nEvent-Rate (%)",
        # Recruiting Ergebnis
        "Ergebnis\nEinstellungen",
        "Kosten pro\nEinstellung (EUR)",
        "Einstellungs-\nquote (%)",
        # Pipeline & Performance
        "Pipeline & Performance\nOffene Bewerbungen",
        "Gespräche\ngeplant",
        "Conversion\nLP->Bewerbung (%)",
        "",
        ""
    ]
    rows.append(header)

    # ── Daily data for March 2026 ─────────────────────────────────────────
    # Realistic recruiting funnel data
    # Budget: ~90 EUR/day (3 campaigns x 30 EUR)
    # Typical recruiting metrics for NRW region

    start_date = datetime(2026, 3, 1)
    days_in_month = 31
    current_kw = None
    kw_rows = []  # collect rows per week for subtotals

    # Seed realistic daily patterns
    daily_data = []
    for day_offset in range(days_in_month):
        dt = start_date + timedelta(days=day_offset)
        dow = dt.weekday()  # 0=Mon, 6=Sun

        # Weekend = lower activity
        is_weekend = dow >= 5
        base_spend = 90.0 if not is_weekend else 45.0

        # Gradually improving performance over the month (optimization)
        week_num = day_offset // 7
        improvement = 1.0 + week_num * 0.08  # 8% improvement per week

        impressions = int(random.gauss(2800, 400) * improvement * (0.5 if is_weekend else 1.0))
        impressions = max(800, impressions)

        ctr_all = round(random.gauss(3.2, 0.4) * improvement, 2)
        ctr_all = max(1.5, min(6.0, ctr_all))

        link_clicks = int(impressions * ctr_all / 100)
        link_clicks = max(5, link_clicks)

        cpc = round(base_spend / max(link_clicks, 1), 2)
        ctr_link = round(link_clicks / max(impressions, 1) * 100, 2)

        # Recruiting funnel
        lp_visitors = int(link_clicks * random.gauss(0.82, 0.05))
        lp_visitors = max(3, lp_visitors)
        cost_per_lp = round(base_spend / max(lp_visitors, 1), 2)
        lp_funnel_conv = round(lp_visitors / max(link_clicks, 1) * 100, 1)
        lp_click_rate = round(lp_visitors / max(impressions, 1) * 100, 2)

        app_started = int(lp_visitors * random.gauss(0.18, 0.03) * improvement)
        app_started = max(0, app_started)
        cost_per_start = round(base_spend / max(app_started, 1), 2) if app_started > 0 else 0
        start_funnel_conv = round(app_started / max(lp_visitors, 1) * 100, 1)
        start_click_rate = round(app_started / max(link_clicks, 1) * 100, 2)

        app_submitted = int(app_started * random.gauss(0.55, 0.08))
        app_submitted = max(0, app_submitted)
        cost_per_app = round(base_spend / max(app_submitted, 1), 2) if app_submitted > 0 else 0
        app_funnel_conv = round(app_submitted / max(app_started, 1) * 100, 1) if app_started > 0 else 0
        app_click_rate = round(app_submitted / max(link_clicks, 1) * 100, 2)

        # Interviews happen with delay, but we track scheduling
        interviews = int(app_submitted * random.gauss(0.35, 0.1))
        interviews = max(0, min(interviews, app_submitted))
        cost_per_interview = round(base_spend / max(interviews, 1), 2) if interviews > 0 else 0
        interview_funnel_conv = round(interviews / max(app_submitted, 1) * 100, 1) if app_submitted > 0 else 0
        interview_click_rate = round(interviews / max(link_clicks, 1) * 100, 2)

        # Hires (very few per day, mostly 0, sometimes 1)
        hires = 1 if random.random() < 0.08 * improvement else 0
        cost_per_hire = round(base_spend / max(hires, 1), 2) if hires > 0 else 0
        hire_rate = round(hires / max(interviews, 1) * 100, 1) if interviews > 0 else 0

        # Pipeline
        open_apps = app_submitted - interviews
        planned_interviews = max(0, int(interviews * 0.7))
        lp_to_app_rate = round(app_submitted / max(lp_visitors, 1) * 100, 1) if lp_visitors > 0 else 0

        daily_data.append({
            "dt": dt,
            "spend": base_spend,
            "impressions": impressions,
            "ctr_all": ctr_all,
            "link_clicks": link_clicks,
            "cpc": cpc,
            "ctr_link": ctr_link,
            "lp_visitors": lp_visitors,
            "cost_per_lp": cost_per_lp,
            "lp_funnel_conv": lp_funnel_conv,
            "lp_click_rate": lp_click_rate,
            "app_started": app_started,
            "cost_per_start": cost_per_start,
            "start_funnel_conv": start_funnel_conv,
            "start_click_rate": start_click_rate,
            "app_submitted": app_submitted,
            "cost_per_app": cost_per_app,
            "app_funnel_conv": app_funnel_conv,
            "app_click_rate": app_click_rate,
            "interviews": interviews,
            "cost_per_interview": cost_per_interview,
            "interview_funnel_conv": interview_funnel_conv,
            "interview_click_rate": interview_click_rate,
            "hires": hires,
            "cost_per_hire": cost_per_hire,
            "hire_rate": hire_rate,
            "open_apps": open_apps,
            "planned_interviews": planned_interviews,
            "lp_to_app_rate": lp_to_app_rate,
        })

    # Build rows with weekly subtotals
    prev_kw = None
    week_days = []

    def fmt_eur(v):
        return f"{v:.2f} EUR" if v > 0 else "0,00 EUR"

    def fmt_pct(v):
        return f"{v:.1f}%" if v > 0 else "0,0%"

    def fmt_int(v):
        return str(v) if v > 0 else ""

    def make_row(d):
        dt = d["dt"]
        return [
            german_month(dt) + " 2026",
            str(get_kw(dt)),
            dt.strftime("%d.%m.%Y"),
            fmt_eur(d["spend"]),
            str(d["impressions"]),
            fmt_pct(d["ctr_all"]),
            str(d["link_clicks"]),
            fmt_eur(d["cpc"]),
            fmt_pct(d["ctr_link"]),
            fmt_int(d["lp_visitors"]),
            fmt_eur(d["cost_per_lp"]),
            fmt_pct(d["lp_funnel_conv"]),
            fmt_pct(d["lp_click_rate"]),
            fmt_int(d["app_started"]),
            fmt_eur(d["cost_per_start"]),
            fmt_pct(d["start_funnel_conv"]),
            fmt_pct(d["start_click_rate"]),
            fmt_int(d["app_submitted"]),
            fmt_eur(d["cost_per_app"]),
            fmt_pct(d["app_funnel_conv"]),
            fmt_pct(d["app_click_rate"]),
            fmt_int(d["interviews"]),
            fmt_eur(d["cost_per_interview"]),
            fmt_pct(d["interview_funnel_conv"]),
            fmt_pct(d["interview_click_rate"]),
            fmt_int(d["hires"]),
            fmt_eur(d["cost_per_hire"]),
            fmt_pct(d["hire_rate"]),
            fmt_int(d["open_apps"]),
            fmt_int(d["planned_interviews"]),
            fmt_pct(d["lp_to_app_rate"]),
            "",
            ""
        ]

    def make_subtotal(week_data):
        n = len(week_data)
        if n == 0:
            return None, None
        total = [
            "", "", "",
            fmt_eur(sum(d["spend"] for d in week_data)),
            str(sum(d["impressions"] for d in week_data)),
            "",
            str(sum(d["link_clicks"] for d in week_data)),
            "",
            "",
            str(sum(d["lp_visitors"] for d in week_data)),
            "", "", "",
            str(sum(d["app_started"] for d in week_data)),
            "", "", "",
            str(sum(d["app_submitted"] for d in week_data)),
            "", "", "",
            str(sum(d["interviews"] for d in week_data)),
            "", "", "",
            str(sum(d["hires"] for d in week_data)),
            "", "",
            str(sum(d["open_apps"] for d in week_data)),
            str(sum(d["planned_interviews"] for d in week_data)),
            "", "", ""
        ]
        s_spend = sum(d["spend"] for d in week_data)
        s_clicks = sum(d["link_clicks"] for d in week_data)
        s_lp = sum(d["lp_visitors"] for d in week_data)
        s_started = sum(d["app_started"] for d in week_data)
        s_submitted = sum(d["app_submitted"] for d in week_data)
        s_interviews = sum(d["interviews"] for d in week_data)
        s_hires = sum(d["hires"] for d in week_data)
        avg = [
            "", "", "",
            fmt_eur(s_spend / n),
            str(int(sum(d["impressions"] for d in week_data) / n)),
            "",
            str(int(s_clicks / n)),
            fmt_eur(s_spend / max(s_clicks, 1)),
            "",
            str(int(s_lp / n)),
            fmt_eur(s_spend / max(s_lp, 1)),
            "", "",
            str(int(s_started / n)) if s_started > 0 else "",
            fmt_eur(s_spend / max(s_started, 1)) if s_started > 0 else "",
            "", "",
            str(int(s_submitted / n)) if s_submitted > 0 else "",
            fmt_eur(s_spend / max(s_submitted, 1)) if s_submitted > 0 else "",
            "", "",
            str(int(s_interviews / n)) if s_interviews > 0 else "",
            fmt_eur(s_spend / max(s_interviews, 1)) if s_interviews > 0 else "",
            "", "",
            str(s_hires),
            fmt_eur(s_spend / max(s_hires, 1)) if s_hires > 0 else "",
            "",
            "", "", "", "", ""
        ]
        return total, avg

    for d in daily_data:
        kw = get_kw(d["dt"])
        if prev_kw is not None and kw != prev_kw:
            # Insert subtotal + avg for previous week
            total, avg = make_subtotal(week_days)
            if total:
                rows.append(total)
                rows.append(avg)
            week_days = []
        rows.append(make_row(d))
        week_days.append(d)
        prev_kw = kw

    # Final week subtotal
    total, avg = make_subtotal(week_days)
    if total:
        rows.append(total)
        rows.append(avg)

    # ── Monthly total ─────────────────────────────────────────────────────
    s_spend = sum(d["spend"] for d in daily_data)
    s_impressions = sum(d["impressions"] for d in daily_data)
    s_clicks = sum(d["link_clicks"] for d in daily_data)
    s_lp = sum(d["lp_visitors"] for d in daily_data)
    s_started = sum(d["app_started"] for d in daily_data)
    s_submitted = sum(d["app_submitted"] for d in daily_data)
    s_interviews = sum(d["interviews"] for d in daily_data)
    s_hires = sum(d["hires"] for d in daily_data)
    n = len(daily_data)

    monthly_total = [
        "", "", "",
        fmt_eur(s_spend),
        str(s_impressions),
        "",
        str(s_clicks),
        fmt_eur(s_spend / max(s_clicks, 1)),
        "",
        str(s_lp),
        fmt_eur(s_spend / max(s_lp, 1)),
        fmt_pct(s_lp / max(s_clicks, 1) * 100),
        "",
        str(s_started),
        fmt_eur(s_spend / max(s_started, 1)),
        fmt_pct(s_started / max(s_lp, 1) * 100),
        "",
        str(s_submitted),
        fmt_eur(s_spend / max(s_submitted, 1)),
        fmt_pct(s_submitted / max(s_started, 1) * 100),
        "",
        str(s_interviews),
        fmt_eur(s_spend / max(s_interviews, 1)),
        fmt_pct(s_interviews / max(s_submitted, 1) * 100),
        "",
        str(s_hires),
        fmt_eur(s_spend / max(s_hires, 1)),
        fmt_pct(s_hires / max(s_interviews, 1) * 100),
        str(s_submitted - s_interviews),
        "",
        fmt_pct(s_submitted / max(s_lp, 1) * 100),
        "", ""
    ]
    monthly_avg = [
        "", "", "",
        fmt_eur(s_spend / n),
        str(int(s_impressions / n)),
        "",
        str(int(s_clicks / n)),
        "",
        "",
        str(int(s_lp / n)),
        "", "", "",
        str(int(s_started / n)) if s_started > 0 else "",
        "", "", "",
        str(int(s_submitted / n)) if s_submitted > 0 else "",
        "", "", "",
        str(int(s_interviews / n)) if s_interviews > 0 else "",
        "", "", "",
        f"{s_hires / max(n, 1):.1f}",
        "", "",
        "", "", "", "", ""
    ]
    rows.append(monthly_total)
    rows.append(monthly_avg)

    return rows

# ── Step 3: Update the copied sheet ──────────────────────────────────────────

def update_sheet(sheet_id, data):
    """Clear the sheet and write recruiting data"""
    # First, get sheet name
    r = sheets_api(sheet_id)
    if not r.ok:
        print(f"Failed to get sheet info: {r.status_code} {r.text}")
        return False
    sheet_name = r.json()["sheets"][0]["properties"]["title"]
    print(f"Sheet name: {sheet_name}")

    # Rename the sheet tab
    rename_body = {
        "requests": [{
            "updateSheetProperties": {
                "properties": {
                    "sheetId": r.json()["sheets"][0]["properties"]["sheetId"],
                    "title": "März 2026"
                },
                "fields": "title"
            }
        }]
    }
    sheets_api(sheet_id, "POST", ":batchUpdate", rename_body)

    # Clear all existing data
    clear_range = f"'{sheet_name}'!A1:AH100"
    sheets_api(sheet_id, "POST", f"/values/{clear_range}:clear")

    # Write new data
    range_name = f"'März 2026'!A1:AG{len(data)}"
    body = {
        "range": range_name,
        "majorDimension": "ROWS",
        "values": data
    }
    r = sheets_api(sheet_id, "PUT",
                   f"/values/{range_name}?valueInputOption=RAW",
                   body)
    if r.ok:
        print(f"Written {len(data)} rows")
        return True
    else:
        print(f"Write failed: {r.status_code} {r.text}")
        return False

# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    print("=== Creating Recruiting Tracking Sheet ===")
    print()

    # Step 1: Copy template
    print("Step 1: Copying E-Commerce template...")
    new_id = copy_template()
    if not new_id:
        return

    # Step 2: Build recruiting data
    print("Step 2: Building recruiting tracking data...")
    random.seed(42)  # Deterministic for demo
    data = build_recruiting_data()
    print(f"  Generated {len(data)} rows (header + {len(data)-1} data rows)")

    # Step 3: Update sheet content
    print("Step 3: Updating sheet with recruiting data...")
    ok = update_sheet(new_id, data)

    if ok:
        url = f"https://docs.google.com/spreadsheets/d/{new_id}/edit"
        print()
        print(f"Done! Recruiting Tracking Sheet created:")
        print(f"  ID:  {new_id}")
        print(f"  URL: {url}")
        print()
        print("Save this ID for the automation manifest.")
    else:
        print("Failed to update sheet content.")

if __name__ == "__main__":
    main()
