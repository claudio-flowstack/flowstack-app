# Phase A: Radikale UI-Vereinfachung

## Kontext
Das Kunden-Hub ist eine Schaltzentrale für eine Automation-Pipeline, KEIN Editor-Tool. Inhalte werden durch Automation generiert und in die UI eingespeist. Der User reviewed, bearbeitet optional, und gibt frei oder lehnt ab.

**Projekt:** `~/Desktop/Flowstack /04_Marketing/Webseite/Seiten code/Flowstack-Platform/`
**Modul:** `src/modules/kunden-hub/`
**Build-Check:** `npx vite build` muss nach jeder Änderung grün sein
**Sprache:** UI-Texte Deutsch, Code-Kommentare Englisch, Umlaute (ä, ö, ü, ß)

---

## Aufgabe A1: Kategorien radikal vereinfachen

**Datei:** `components/ContentReviewPanel.tsx`
**Zeilen:** 17-48 (CATEGORIES Array)

**Problem:** 5 Kategorien, davon 3 tote Platzhalter (Google Ads, LinkedIn Ads, TikTok Ads haben `subtypes: []`). Website-Texte sind faktisch Dokumente.

**Aktion:**
- CATEGORIES Array auf 2 Einträge reduzieren: `documents` + `meta_ads`
- `website_texts` Kategorie entfernen — stattdessen `lp_text`, `form_text`, `danke_text`, `videoskript` in die `documents` subtypes verschieben
- Google Ads, LinkedIn Ads, TikTok Ads komplett entfernen

**Vorher:**
```
documents: [zielgruppen_avatar, arbeitgeber_avatar, messaging_matrix, creative_briefing, marken_richtlinien]
meta_ads: [anzeigen_haupt, anzeigen_retargeting, anzeigen_warmup]
google_ads: []  ← TOT
linkedin_ads: []  ← TOT
tiktok_ads: []  ← TOT
website_texts: [lp_text, form_text, danke_text, videoskript]
```

**Nachher:**
```
documents: [zielgruppen_avatar, arbeitgeber_avatar, messaging_matrix, creative_briefing, marken_richtlinien, lp_text, form_text, danke_text, videoskript]
meta_ads: [anzeigen_haupt, anzeigen_retargeting, anzeigen_warmup]
```

**Test:** Kategorie-Dropdown zeigt nur 2 Optionen. Keine leeren Kategorien mehr.

---

## Aufgabe A2: Dual-Navigation eliminieren

**Dateien:**
- `components/ContentReviewPanel.tsx` (Haupt-Panel)
- `components/ItemTabs.tsx` (horizontale Tabs — ENTFERNEN)
- `components/DeliverableSelector.tsx` (Dropdown — BEHALTEN)

**Problem:** 4+ Navigations-Patterns für die gleiche Aufgabe: CategoryDropdown, ItemTabs, DeliverableSelector, Sidebar-Tabs, Arrow-Keys. Verwirrung statt Flexibilität.

**Aktion:**
- `ItemTabs.tsx` Nutzung aus ContentReviewPanel entfernen
- Für Ads: DeliverableSelector (Dropdown mit Phase-Gruppierung) als einzige Auswahl
- Für Docs: Gleicher DeliverableSelector
- Kein separates Tab-System mehr

**Test:** Ein Weg Deliverables auszuwählen: Dropdown. Kein Tab-Switching mehr.

---

## Aufgabe A3: Doc-Ansicht Read-First

**Datei:** `components/DocReviewView.tsx`

**Problem:** TipTap Editor mit 14 Toolbar-Buttons, Ruler, Paper-Simulation. Aber 90% der Zeit will der User nur LESEN und FREIGEBEN.

**Aktion:**
1. Default: TipTap mit `editable: false` — sauber formatierter Text, KEINE Toolbar, kein Cursor
2. "Bearbeiten" Button der:
   - `editor.setEditable(true)` setzt
   - Toolbar einblendet (mit Transition)
3. Ruler komplett ENTFERNEN (Zeilen 86-145)
4. Paper-Container: `max-width: 816px; width: 100%` statt fixed `width: 816px`
5. Zoom-Scaling (ResizeObserver, Zeilen 188-199) ENTFERNEN — responsive reicht
6. Sticky ApprovalBar am unteren Rand:
   - Links: Status-Badge + "Ungespeicherte Änderungen" Indicator
   - Rechts: "Ablehnen" (öffnet Feedback-Textarea, min 10 Zeichen) + "Freigeben" (grün)
   - `position: sticky; bottom: 0; backdrop-filter: blur(8px);`
7. Approval-Buttons aus dem Header (Zeilen 229-257) ENTFERNEN

**Test:**
- Deliverable öffnen → Read-Only Ansicht, keine Toolbar
- "Bearbeiten" klicken → Toolbar erscheint, Text editierbar
- Langes Dokument scrollen → ApprovalBar bleibt unten sichtbar

---

## Aufgabe A5: Nur Meta Ads

**Dateien:**
- `components/AdReviewView.tsx` (Zeilen 74-79: CATEGORY_PLATFORMS)
- `components/PlatformSwitcher.tsx` (Zeilen 10-15: alle 5 Platforms)
- `components/ContentReviewPanel.tsx` (Category-Detection Zeile 314)

**Aktion:**
- PlatformSwitcher: Nur `facebook` + `instagram` als Optionen zeigen
- PlacementSwitcher beibehalten (Feed/Story/Reel — relevant für Meta)
- In AdReviewView: Default-Platform auf `facebook` wenn Kategorie `meta_ads`
- Code für Google/LinkedIn/TikTok in AdPreview.tsx NICHT löschen (für später), nur nicht auswählbar

**Test:** PlatformSwitcher zeigt nur Facebook + Instagram. Kein Google/LinkedIn/TikTok.

---

## Regeln

- `npx vite build` nach JEDER Datei-Änderung
- Keine neuen Dependencies
- Alle UI-Texte als i18n Keys (deutsch + englisch)
- Named Exports, kein default export (AUSNAHME: bestehende default exports beibehalten wenn Imports davon abhängen)
- `cn()` für classNames, `@/` Alias für Imports
