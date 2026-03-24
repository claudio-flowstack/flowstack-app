# Kunden-Hub: Komplett-Checkliste aller Anforderungen

## Editor (DocReviewView)
- [x] "Erweiterungen" + "Hilfe" aus Menü entfernt
- [x] Menüleiste komplett entfernt (Bearbeiten/Format hatten keine Funktion)
- [x] Toolbar zentriert
- [x] Blockquote + Horizontale Linie Buttons hinzugefügt
- [x] Nicht-funktionale Buttons entfernt (Print, Paint, Zoom, Font, FontSize, Color, Highlight, Link, Image, Indent, Clear)
- [x] Blattbreite 816px (exakt Google Docs)
- [x] Paper Shadow hochwertig (Dreifach-Shadow)
- [x] Canvas-Hintergrund #f8f9fa (Google Docs Grau)
- [x] Ruler mit Zoll-Markierungen + blaue Indent-Markers
- [x] Blockquote CSS Styling (linker Border)
- [x] HR Styling
- [x] Text-Selektion in Google-Docs-Blau
- [x] Placeholder kursiv
- [x] Container borderRadius 12, subtile Shadow
- [x] Google Docs Tab-Funktion links (vertikale Dokument-Liste neben Editor)

## Freigeben/Ablehnen Buttons
- [x] Doc-Editor: Buttons oben rechts in Title Bar
- [x] Ad-Preview: Buttons oben in eigenem Header
- [x] ApprovalBar unten komplett entfernt
- [x] "Ablehnen" Button in Rot, "Freigeben" in Blau
- [x] Buttons prominent + klickbar mit Hover-Effekten
- [x] Approved-Status zeigt grünes Badge

## Übersetzungen
- [x] "Deliverables" → "Inhalte"
- [x] "Timeline" → "Zeitstrahl"
- [x] Alle deutschen "Deliverable" → "Dokument" (~15 Keys)
- [x] "Alle Drafts" → "Alle Entwürfe"

## Dashboard (Home)
- [x] Chart Labels: tickAmount 6, rotate -45, hideOverlapping
- [x] Fake-Badges entfernt (+12%, -5%, +2k, +1)
- [x] Back-Button Crash Fix (navigate Pfade)

## Pipeline
- [x] Phasen-Übersicht entfernt (redundant mit Zeitstrahl)
- [x] "Offene Aufgaben" Section mit nächsten 5 offenen Deliverables + Status

## Ad-Kategorien
- [x] LinkedIn Ads + TikTok Ads als eigene Kategorien
- [x] Icons für LinkedIn + TikTok
- [x] isAdCategory Check erweitert
- [x] Translations hinzugefügt

## Performance Tab
- [x] Dropdown durch Pill-Tabs ersetzt
- [x] Funnel-Typ Toggle (Recruiting / Kundengewinnung)
- [x] Conversion-Funnel Visualisierung (horizontale Balken)
- [x] Recruiting: Impressionen→Klicks→Bewerbungen→Qualifiziert→Vorstellungsgespräche→Eingestellt
- [x] Kundengewinnung: Impressionen→Klicks→Leads→Qualifiziert→Termin→Abschluss
- [x] Schritt-CR + Gesamt-CR pro Stufe
- [x] Kosten pro Stufe
- [x] Key Insights Cards
- [x] Chart: Kosten pro Ergebnis (Area, 30 Tage)
- [x] Chart: Conversion Rate (Area, 30 Tage)
- [x] Mock-Daten: platformData für Müller Pflege
- [x] Mock-Daten: Recruiting KPIs
- [x] Types erweitert (FunnelType, PlatformKpis, etc.)

## Connections Tab
- [x] Echte API-Felder pro Service (Meta, Google, Slack, etc.)
- [x] Premium Card-Design mit Service-Icons
- [x] Status-Pill (Verbunden/Fehler/Nicht verbunden)
- [x] Bearbeiten Button bei verbundenen Services
- [x] Trennen Button in Rot (klar unterscheidbar)
- [x] Account-ID/Name inline sichtbar

## KI-Assistent
- [x] Von Floating-Button zu eigener Sidebar-Seite
- [x] Route /kunden-hub/ai-assistant
- [x] Sidebar Nav-Eintrag mit Sparkles-Icon

## Sidebar
- [x] Animation schneller (200ms ease-out statt 300ms ease-in-out)

## Kundenkarten (ClientList)
- [x] Hover-Lift Effect (-translate-y-0.5 + shadow-lg)
- [x] Company-Name wird blau beim Hover
- [x] KPI-Boxen immer 3 Stück (Platzhalter "-" wenn keine Daten)
- [x] Labels uppercase tracking-wide
- [x] Initials-Badge: rounded-xl, 48x48, shadow-sm
- [x] Ampel-Dot mit Ring-Effect
- [x] "Neuer Kunde" Button: Eigener sauberer Button mit rounded-xl
- [x] Filter-Dropdown: rounded-xl, shadow-sm, hover-border, cleaner look

## Settings
- [x] Profil-Felder editierbar (disabled entfernt)

## Sonstiges
- [x] index.html: class="dark" entfernt
- [x] Core ThemeProvider: Default auf 'light'
- [x] ThemeContext: Originale Platform-Version beibehalten
- [x] import type für ApexOptions
