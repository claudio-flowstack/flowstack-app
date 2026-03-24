#!/usr/bin/env python3
"""
Style-Test: Creates a beautifully formatted Google Doc using a multi-phase
approach (insert content → read structure → apply formatting).

Usage:
  doppler run -p fulfillment-automation -c dev_claudio -- python3 create-style-test.py
"""

import json
import os
import httpx

# ─── Auth ────────────────────────────────────────────────────────────────────

raw = os.environ.get("FLOWSTACK_GOOGLE_OAUTH_TOKEN", os.environ.get("GOOGLE_OAUTH_TOKEN", "{}"))
creds = json.loads(raw)
TOKEN = creds.get("token", "")
REFRESH = creds.get("refresh_token", "")
CLIENT_ID = creds.get("client_id", "")
CLIENT_SECRET = creds.get("client_secret", "")


def refresh_token():
    global TOKEN
    resp = httpx.post("https://oauth2.googleapis.com/token", data={
        "grant_type": "refresh_token",
        "refresh_token": REFRESH,
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
    })
    if resp.status_code == 200:
        TOKEN = resp.json()["access_token"]
    return TOKEN


def api(method, url, data=None):
    headers = {"Authorization": f"Bearer {TOKEN}"}
    resp = httpx.request(method, url, json=data, headers=headers, timeout=30)
    if resp.status_code == 401:
        refresh_token()
        headers = {"Authorization": f"Bearer {TOKEN}"}
        resp = httpx.request(method, url, json=data, headers=headers, timeout=30)
    if resp.status_code >= 400:
        print(f"ERROR {resp.status_code}: {resp.text[:500]}")
        raise Exception(f"API Error {resp.status_code}")
    if resp.status_code == 204 or not resp.content:
        return {}
    return resp.json()


# ─── Color Helpers ───────────────────────────────────────────────────────────

def rgb(hex_color):
    h = hex_color.lstrip("#")
    return {"red": int(h[0:2], 16) / 255, "green": int(h[2:4], 16) / 255, "blue": int(h[4:6], 16) / 255}

def pt(val):
    return {"magnitude": val, "unit": "PT"}


# ─── Brand Colors ───────────────────────────────────────────────────────────

C_DARK = "#0a1628"
C_ACCENT = "#6366f1"
C_ACCENT2 = "#00e5ff"
C_SUCCESS = "#10b981"
C_WARNING = "#f59e0b"
C_DANGER = "#ef4444"
C_LIGHT_BG = "#f8fafc"
C_CALLOUT_BG = "#eef2ff"
C_TEXT = "#1e293b"
C_MUTED = "#64748b"
C_WHITE = "#ffffff"
C_BORDER = "#e2e8f0"

FONT = "Google Sans"


# ─── Phase 1: Insert all content (text + tables) ────────────────────────────

def build_content_requests():
    """Build requests to insert all text and tables. Returns (requests, table_positions)."""
    reqs = []
    idx = 1
    table_positions = []  # (insert_idx, headers, rows, tag)

    def text(t):
        nonlocal idx
        reqs.append({"insertText": {"location": {"index": idx}, "text": t}})
        start = idx
        idx += len(t)
        return start, idx

    def table(headers, rows, tag=""):
        nonlocal idx
        n_rows = len(rows) + 1
        n_cols = len(headers)
        table_positions.append({"idx": idx, "headers": headers, "rows": rows, "tag": tag})
        reqs.append({"insertTable": {"location": {"index": idx}, "rows": n_rows, "columns": n_cols}})
        # Calculate table size: 1 (table) + n_rows * (1 (row) + n_cols * 2 (cell + \n))
        table_size = 1 + n_rows * (1 + n_cols * 2)
        idx += table_size
        # Insert newline after table for spacing
        reqs.append({"insertText": {"location": {"index": idx}, "text": "\n"}})
        idx += 1

    # ── Title Block ──────────────────────────────────────────────────────
    text("Pain-Point-Matrix\n")
    text("Novacode GmbH — Recruiting-Projekt  |  März 2026\n")
    text("\n")

    # ── Info Callout ─────────────────────────────────────────────────────
    text("💡  Dieses Dokument wurde automatisch durch Flowstack KI-Analyse generiert. Basierend auf dem Kickoff-Transkript vom 27.02.2026.\n")
    text("\n")

    # ── Executive Summary ────────────────────────────────────────────────
    text("Executive Summary\n")
    text("Übersicht der wichtigsten Recruiting-Kennzahlen für die Novacode GmbH Kampagne. Die Daten basieren auf der KI-Analyse des Kickoff-Gesprächs und aktuellen Marktdaten.\n")
    text("\n")

    # KPI Block
    text("Time-to-Hire (aktuell):  47 Tage  →  Ziel: < 30 Tage\n")
    text("Qualifizierte Bewerbungen:  20%  (+15% vs. Vormonat)\n")
    text("Employer Brand Score:  3.2 / 10  (Branche Ø: 5.8)\n")
    text("Cost per Hire:  € 4.200  (−12% vs. Budget)\n")
    text("\n")

    # ── Pain Points Table ────────────────────────────────────────────────
    text("Kandidaten-Pain-Points\n")
    text("Identifizierte Pain Points aus dem Kickoff-Transkript, gewichtet nach Intensität und Relevanz für die Zielgruppe.\n")
    text("\n")

    table(
        headers=["Pain Point", "Intensität", "Quelle", "Messaging-Ansatz"],
        rows=[
            ["Veralteter Tech-Stack", "🔴  Hoch (8/10)", "Kickoff + Marktanalyse", "\"Bei Novacode arbeitest du mit React 19, TypeScript, AWS\""],
            ["Fehlende Remote-Optionen", "🔴  Sehr hoch (9/10)", "Branchen-Benchmarks", "\"100% Remote-First — arbeite von wo du willst\""],
            ["Mangelnde Karriereperspektiven", "🟡  Mittel (6/10)", "Kickoff-Transkript", "\"Wachse mit uns — vom Developer zum Tech Lead\""],
            ["Schlechte Work-Life-Balance", "🔴  Hoch (8/10)", "Marktanalyse", "\"Flexible Arbeitszeiten, echte 4-Tage-Woche möglich\""],
            ["Intransparente Gehälter", "🟡  Mittel-Hoch (7/10)", "Kandidaten-Feedback", "\"Transparente Gehaltsstruktur ab Tag 1\""],
        ],
        tag="painpoints",
    )

    # Success Callout
    text("✅  Top-Insight: Remote-Optionen sind der stärkste Hebel. 73% der Senior Developer erwarten Remote-First oder Hybrid-Modelle.\n")
    text("\n")

    # ── Employer Pain Points ─────────────────────────────────────────────
    text("Arbeitgeber-Pain-Points\n")
    text("\n")
    text("Recruiting-Effizienz\n")

    table(
        headers=["Problem", "Aktuell", "Ziel", "Maßnahme"],
        rows=[
            ["Time-to-Hire", "47 Tage", "< 30 Tage", "Active Sourcing + Automation"],
            ["Bewerbungsqualität", "20% qualifiziert", "> 40%", "Gezielte Ansprache + Screening"],
            ["Employer Brand", "Unbekannt", "Top-of-Mind DACH", "Content-Strategie + LinkedIn"],
        ],
        tag="employer",
    )

    # ── Benefits ─────────────────────────────────────────────────────────
    text("Benefits & Differenziatoren\n")
    text("Remote-First Kultur mit optionalem Office in Berlin\n")
    text("Moderner Stack: React 19, TypeScript, AWS, Terraform\n")
    text("30 Tage Urlaub + Sabbatical-Option nach 2 Jahren\n")
    text("Weiterbildungsbudget: 3.000€/Jahr pro Mitarbeiter\n")
    text("Team-Events: Quartals-Offsites, Hackathons\n")
    text("Transparente Gehaltsstruktur (öffentliche Bänder)\n")
    text("Equity-Beteiligung ab Senior-Level\n")
    text("\n")

    # ── Next Steps ───────────────────────────────────────────────────────
    text("Nächste Schritte\n")
    text("⚠️  Deadline: Kampagnen-Launch bis 21.03.2026 — alle Assets müssen bis 18.03. finalisiert sein.\n")
    text("\n")

    text("Stellenanzeigen überarbeiten (Pain-Point-basiertes Messaging)\n")
    text("LinkedIn-Kampagne aufsetzen (Senior Developer DACH)\n")
    text("Karriereseite mit Benefits-Übersicht aktualisieren\n")
    text("Active Sourcing starten (50 Kandidaten/Woche)\n")
    text("Tracking-Dashboard konfigurieren\n")
    text("\n")

    # ── Footer ───────────────────────────────────────────────────────────
    text("Erstellt: Flowstack KI-Analyse  |  Basierend auf Kickoff-Transkript vom 27.02.2026  |  Vertraulich\n")

    return reqs, table_positions


# ─── Phase 2: Read doc and build formatting ──────────────────────────────────

def find_text_ranges(body):
    """Walk the document body and find all text runs with their indices."""
    ranges = []
    for elem in body.get("content", []):
        if "paragraph" in elem:
            para = elem["paragraph"]
            p_start = elem["startIndex"]
            p_end = elem["endIndex"]
            style_type = para.get("paragraphStyle", {}).get("namedStyleType", "NORMAL_TEXT")
            text = ""
            for pe in para.get("elements", []):
                tr = pe.get("textRun")
                if tr:
                    text += tr.get("content", "")
            ranges.append({
                "type": "paragraph",
                "start": p_start,
                "end": p_end,
                "text": text.strip(),
                "style": style_type,
            })
        elif "table" in elem:
            tbl = elem["table"]
            ranges.append({
                "type": "table",
                "start": elem["startIndex"],
                "end": elem["endIndex"],
                "rows": tbl.get("rows", 0),
                "cols": tbl.get("columns", 0),
                "cells": [],
            })
            for ri, row in enumerate(tbl.get("tableRows", [])):
                for ci, cell in enumerate(row.get("tableCells", [])):
                    cell_text = ""
                    cell_start = None
                    cell_end = None
                    for ce in cell.get("content", []):
                        if "paragraph" in ce:
                            if cell_start is None:
                                cell_start = ce["startIndex"]
                            cell_end = ce["endIndex"]
                            for pe in ce["paragraph"].get("elements", []):
                                tr = pe.get("textRun")
                                if tr:
                                    cell_text += tr.get("content", "")
                    ranges[-1]["cells"].append({
                        "row": ri, "col": ci,
                        "start": cell_start, "end": cell_end,
                        "text": cell_text.strip(),
                    })
    return ranges


def build_format_requests(elements):
    """Build formatting requests based on actual document structure."""
    reqs = []
    table_idx = 0

    def style_text(start, end, bold=False, italic=False, size=None, color=None, font=None, underline=False):
        if start >= end:
            return
        style = {}
        fields = []
        if bold: style["bold"] = True; fields.append("bold")
        if italic: style["italic"] = True; fields.append("italic")
        if underline: style["underline"] = True; fields.append("underline")
        if size: style["fontSize"] = pt(size); fields.append("fontSize")
        if color: style["foregroundColor"] = {"color": {"rgbColor": rgb(color)}}; fields.append("foregroundColor")
        if font: style["weightedFontFamily"] = {"fontFamily": font}; fields.append("weightedFontFamily")
        if fields:
            reqs.append({"updateTextStyle": {"range": {"startIndex": start, "endIndex": end}, "textStyle": style, "fields": ",".join(fields)}})

    def style_para(start, end, named=None, align=None, above=None, below=None, indent=None,
                   border_left_color=None, border_left_width=3, shading=None, spacing=None):
        style = {}
        fields = []
        if named: style["namedStyleType"] = named; fields.append("namedStyleType")
        if align: style["alignment"] = align; fields.append("alignment")
        if above is not None: style["spaceAbove"] = pt(above); fields.append("spaceAbove")
        if below is not None: style["spaceBelow"] = pt(below); fields.append("spaceBelow")
        if indent is not None: style["indentStart"] = pt(indent); fields.append("indentStart")
        if spacing: style["lineSpacing"] = spacing; fields.append("lineSpacing")
        if border_left_color:
            style["borderLeft"] = {"color": {"color": {"rgbColor": rgb(border_left_color)}}, "width": pt(border_left_width), "padding": pt(10), "dashStyle": "SOLID"}
            fields.append("borderLeft")
        if shading:
            style["shading"] = {"backgroundColor": {"color": {"rgbColor": rgb(shading)}}}
            fields.append("shading")
        if fields:
            reqs.append({"updateParagraphStyle": {"range": {"startIndex": start, "endIndex": end}, "paragraphStyle": style, "fields": ",".join(fields)}})

    def bullets(start, end, preset="BULLET_DISC_CIRCLE_SQUARE"):
        reqs.append({"createParagraphBullets": {"range": {"startIndex": start, "endIndex": end}, "bulletPreset": preset}})

    def style_table_cell(table_start, row, col, bg=None, pad_top=6, pad_bottom=6):
        cell_style = {"paddingTop": pt(pad_top), "paddingBottom": pt(pad_bottom), "paddingLeft": pt(10), "paddingRight": pt(10)}
        fields = ["paddingTop", "paddingBottom", "paddingLeft", "paddingRight"]
        if bg:
            cell_style["backgroundColor"] = {"color": {"rgbColor": rgb(bg)}}
            fields.append("backgroundColor")
        reqs.append({"updateTableCellStyle": {
            "tableRange": {"tableCellLocation": {"tableStartLocation": {"index": table_start}, "rowIndex": row, "columnIndex": col}, "rowSpan": 1, "columnSpan": 1},
            "tableCellStyle": cell_style, "fields": ",".join(fields),
        }})

    for el in elements:
        if el["type"] == "paragraph":
            s, e, txt = el["start"], el["end"], el["text"]
            if not txt:
                continue

            # ── Title ────────────────────────────────────────────────
            if txt == "Pain-Point-Matrix":
                style_para(s, e, named="TITLE", below=2)
                style_text(s, max(s + 1, e - 1), font=FONT, size=28, color=C_DARK, bold=True)

            # ── Subtitle ─────────────────────────────────────────────
            elif txt.startswith("Novacode GmbH"):
                style_para(s, e, named="SUBTITLE", below=20)
                style_text(s, max(s + 1, e - 1), font=FONT, size=13, color=C_MUTED)

            # ── Info Callout (💡) ────────────────────────────────────
            elif txt.startswith("💡"):
                style_para(s, e, border_left_color=C_ACCENT, border_left_width=4, shading=C_CALLOUT_BG, indent=8, above=14, below=14, spacing=150)
                style_text(s, max(s + 1, e - 1), font=FONT, size=10, color=C_TEXT)

            # ── Success Callout (✅) ─────────────────────────────────
            elif txt.startswith("✅"):
                style_para(s, e, border_left_color=C_SUCCESS, border_left_width=4, shading="#ecfdf5", indent=8, above=14, below=14, spacing=150)
                style_text(s, max(s + 1, e - 1), font=FONT, size=10, color=C_TEXT)

            # ── Warning Callout (⚠️) ─────────────────────────────────
            elif txt.startswith("⚠️") or txt.startswith("⚠"):
                style_para(s, e, border_left_color=C_WARNING, border_left_width=4, shading="#fffbeb", indent=8, above=14, below=14, spacing=150)
                style_text(s, max(s + 1, e - 1), font=FONT, size=10, color=C_TEXT)

            # ── H1 Headings ──────────────────────────────────────────
            elif txt in ("Executive Summary", "Kandidaten-Pain-Points", "Arbeitgeber-Pain-Points", "Nächste Schritte"):
                style_para(s, e, named="HEADING_1", above=32, below=12)
                style_text(s, max(s + 1, e - 1), font=FONT, size=22, color=C_DARK, bold=True)
                # Add bottom border as divider above heading
                reqs.append({"updateParagraphStyle": {"range": {"startIndex": s, "endIndex": e}, "paragraphStyle": {
                    "borderBottom": {"color": {"color": {"rgbColor": rgb(C_BORDER)}}, "width": pt(1), "padding": pt(8), "dashStyle": "SOLID"}
                }, "fields": "borderBottom"}})

            # ── H2 Headings (with accent border) ─────────────────────
            elif txt in ("Recruiting-Effizienz", "Benefits & Differenziatoren"):
                style_para(s, e, named="HEADING_2", above=24, below=10, border_left_color=C_ACCENT, border_left_width=4)
                style_text(s, max(s + 1, e - 1), font=FONT, size=16, color=C_DARK, bold=True)

            # ── KPI Rows ─────────────────────────────────────────────
            elif txt.startswith("Time-to-Hire") or txt.startswith("Qualifizierte") or txt.startswith("Employer Brand") or txt.startswith("Cost per"):
                style_para(s, e, spacing=150, below=4)
                # Find the colon to split label/value
                colon_pos = txt.find(":")
                if colon_pos > 0:
                    label_end = s + colon_pos + 1
                    style_text(s, label_end, font=FONT, size=11, color=C_MUTED)
                    style_text(label_end, e - 1, font=FONT, size=12, color=C_DARK, bold=True)
                    # Color positive/negative indicators
                    if "+" in txt or "−12%" in txt:
                        paren_start = txt.find("(")
                        if paren_start > 0:
                            style_text(s + paren_start, e - 1, color=C_SUCCESS, bold=True)
                    elif "Ziel:" in txt or "Branche" in txt:
                        arrow_pos = txt.find("→")
                        if arrow_pos < 0:
                            arrow_pos = txt.find("(")
                        if arrow_pos > 0:
                            style_text(s + arrow_pos, e - 1, color=C_DANGER, bold=True, size=10)

            # ── Body Paragraphs ──────────────────────────────────────
            elif txt.startswith("Übersicht") or txt.startswith("Identifizierte"):
                style_para(s, e, spacing=160, below=8)
                style_text(s, max(s + 1, e - 1), font=FONT, size=11, color=C_TEXT)

            # ── Bullet Items (Benefits) ──────────────────────────────
            elif txt.startswith("Remote-First") or txt.startswith("Moderner Stack") or txt.startswith("30 Tage") or txt.startswith("Weiterbildungsbudget") or txt.startswith("Team-Events") or txt.startswith("Transparente Gehalts") or txt.startswith("Equity"):
                style_para(s, e, spacing=145, below=3)
                style_text(s, max(s + 1, e - 1), font=FONT, size=11, color=C_TEXT)
                bullets(s, e)

            # ── Numbered Items (Next Steps) ──────────────────────────
            elif txt.startswith("Stellenanzeigen") or txt.startswith("LinkedIn-Kampagne") or txt.startswith("Karriereseite") or txt.startswith("Active Sourcing") or txt.startswith("Tracking-Dashboard"):
                style_para(s, e, spacing=145, below=3)
                style_text(s, max(s + 1, e - 1), font=FONT, size=11, color=C_TEXT)
                bullets(s, e, preset="NUMBERED_DECIMAL_ALPHA_ROMAN")

            # ── Footer ───────────────────────────────────────────────
            elif txt.startswith("Erstellt: Flowstack"):
                style_para(s, e, above=24, spacing=140)
                style_text(s, max(s + 1, e - 1), font=FONT, size=9, color=C_MUTED, italic=True)
                reqs.append({"updateParagraphStyle": {"range": {"startIndex": s, "endIndex": e}, "paragraphStyle": {
                    "borderTop": {"color": {"color": {"rgbColor": rgb(C_BORDER)}}, "width": pt(1), "padding": pt(12), "dashStyle": "SOLID"}
                }, "fields": "borderTop"}})

        elif el["type"] == "table":
            table_start = el["start"]
            n_cols = el["cols"]
            n_rows = el["rows"]

            # Style ALL cell text
            for cell in el["cells"]:
                cs, ce = cell["start"], cell["end"]
                if cs is None or ce is None:
                    continue
                if cell["row"] == 0:
                    # Header row text: white, bold
                    style_text(cs, ce - 1, font=FONT, size=10, color=C_WHITE, bold=True)
                else:
                    style_text(cs, ce - 1, font=FONT, size=10, color=C_TEXT)

            # Style header cells background
            header_bg = C_DARK if table_idx == 0 else C_ACCENT
            for c in range(n_cols):
                style_table_cell(table_start, 0, c, bg=header_bg, pad_top=10, pad_bottom=10)

            # Style body cells with alternating backgrounds
            for r in range(1, n_rows):
                for c in range(n_cols):
                    bg = C_LIGHT_BG if r % 2 == 0 else None
                    style_table_cell(table_start, r, c, bg=bg)

            # Pin header row
            reqs.append({"pinTableHeaderRows": {"tableStartLocation": {"index": table_start}, "pinnedHeaderRowsCount": 1}})

            table_idx += 1

    return reqs


# ─── Main ────────────────────────────────────────────────────────────────────

def main():
    print("=" * 60)
    print("  Flowstack Style Test — Google Docs Formatting")
    print("=" * 60)
    print()

    # Phase 1: Create doc and insert content
    print("Phase 1: Dokument erstellen + Content einfügen...")
    doc = api("POST", "https://docs.googleapis.com/v1/documents", {"title": "Flowstack Style Test — Pain-Point-Matrix"})
    doc_id = doc["documentId"]
    print(f"  Doc: {doc_id}")

    content_reqs, table_positions = build_content_requests()
    print(f"  {len(content_reqs)} Content-Requests...")
    api("POST", f"https://docs.googleapis.com/v1/documents/{doc_id}:batchUpdate", {"requests": content_reqs})
    print("  ✓ Content eingefügt")

    # Phase 2: Read document structure
    print("\nPhase 2: Dokument-Struktur lesen...")
    doc_data = api("GET", f"https://docs.googleapis.com/v1/documents/{doc_id}")
    elements = find_text_ranges(doc_data.get("body", {}))
    print(f"  {len(elements)} Elemente gefunden ({sum(1 for e in elements if e['type'] == 'table')} Tabellen)")

    # Phase 3: Apply formatting
    print("\nPhase 3: Formatting anwenden...")
    format_reqs = build_format_requests(elements)
    print(f"  {len(format_reqs)} Formatting-Requests...")
    api("POST", f"https://docs.googleapis.com/v1/documents/{doc_id}:batchUpdate", {"requests": format_reqs})
    print("  ✓ Formatting angewendet")

    # Phase 4: Fill table cells
    print("\nPhase 4: Tabellen befüllen...")
    # Re-read doc to get updated table structure
    doc_data = api("GET", f"https://docs.googleapis.com/v1/documents/{doc_id}")
    elements = find_text_ranges(doc_data.get("body", {}))

    # For each table, check if cells need content
    table_elements = [e for e in elements if e["type"] == "table"]
    for ti, tbl in enumerate(table_elements):
        if ti < len(table_positions):
            tp = table_positions[ti]
            all_data = [tp["headers"]] + tp["rows"]
            # Insert text into cells in REVERSE order
            cell_inserts = []
            for cell in tbl["cells"]:
                r, c = cell["row"], cell["col"]
                if r < len(all_data) and c < len(all_data[r]):
                    cell_text = str(all_data[r][c])
                    if cell_text and not cell["text"]:  # Only if cell is empty
                        cell_inserts.append({"insertText": {"location": {"index": cell["start"]}, "text": cell_text}})
            # Sort by index descending
            cell_inserts.sort(key=lambda x: -x["insertText"]["location"]["index"])
            if cell_inserts:
                print(f"  Tabelle {ti+1}: {len(cell_inserts)} Zellen befüllen...")
                api("POST", f"https://docs.googleapis.com/v1/documents/{doc_id}:batchUpdate", {"requests": cell_inserts})

    # Phase 5: Re-format table text (after cell content was inserted)
    print("\nPhase 5: Tabellen-Text formatieren...")
    doc_data = api("GET", f"https://docs.googleapis.com/v1/documents/{doc_id}")
    elements = find_text_ranges(doc_data.get("body", {}))
    table_elements = [e for e in elements if e["type"] == "table"]

    table_text_reqs = []
    for ti, tbl in enumerate(table_elements):
        header_bg = C_DARK if ti == 0 else C_ACCENT
        for cell in tbl["cells"]:
            cs, ce = cell["start"], cell["end"]
            if cs is None or ce is None or cs >= ce - 1:
                continue
            if cell["row"] == 0:
                table_text_reqs.append({"updateTextStyle": {
                    "range": {"startIndex": cs, "endIndex": ce - 1},
                    "textStyle": {"bold": True, "foregroundColor": {"color": {"rgbColor": rgb(C_WHITE)}}, "weightedFontFamily": {"fontFamily": FONT}, "fontSize": pt(10)},
                    "fields": "bold,foregroundColor,weightedFontFamily,fontSize",
                }})
            else:
                table_text_reqs.append({"updateTextStyle": {
                    "range": {"startIndex": cs, "endIndex": ce - 1},
                    "textStyle": {"foregroundColor": {"color": {"rgbColor": rgb(C_TEXT)}}, "weightedFontFamily": {"fontFamily": FONT}, "fontSize": pt(10)},
                    "fields": "foregroundColor,weightedFontFamily,fontSize",
                }})

    if table_text_reqs:
        print(f"  {len(table_text_reqs)} Text-Style Requests...")
        api("POST", f"https://docs.googleapis.com/v1/documents/{doc_id}:batchUpdate", {"requests": table_text_reqs})

    url = f"https://docs.google.com/document/d/{doc_id}/edit"
    print()
    print(f"✅ Fertig!")
    print(f"🔗 {url}")


if __name__ == "__main__":
    main()
