# Framework: Landingpage-Texte
Dokument-Nummer: 07 (intern), 06 (Framework-Reihenfolge)

## Zweck
Dieses Dokument liefert die vollstaendigen, einsatzbereiten Texte fuer die Recruiting-Landingpage. Es deckt alle Sections der Page ab: Navigation, Hero, Problem-Section, Benefits, Compensation, Bewerbungsprozess, Final CTA und Footer. Das Dokument ist so detailliert, dass ein Frontend-Entwickler die Seite 1:1 umsetzen kann, ohne Texte erfinden zu muessen.

## Input-Anforderungen
- **Aus vorherigen Dokumenten:**
  - 01 Zielgruppen-Avatar: Pain Points (Problem Section), Einwaende (werden adressiert)
  - 02 Arbeitgeber-Avatar: USPs (Benefits Section), Kernpositionierung (Hero), Arbeitgeberversprechen (Compensation)
  - 03 Messaging-Matrix: Kernbotschaft (Hero), Hooks (Problem Section), CTAs (Buttons)
  - 05 Marken-Richtlinien: Tonalitaet, verbotene Begriffe
- **Aus dem Kickoff-Gespraech:**
  - Konkrete Benefits (Urlaubstage, Gehalt, Hardware, Remote-Policy)
  - Bewerbungsprozess (Schritte, Dauer)
  - Stellenbezeichnung

## Pflicht-Sections

### 1. Navigation
- **Inhalt:** Markenname + Navigationspunkte + CTA-Button
- **Format:** Einzeiliger Paragraph mit Pipe-Trennern, CTA in Accent-Farbe
- **Minimum:** 4 Nav-Punkte + 1 CTA

### 2. Hero Section
- **Inhalt:** Headline, Subheadline, Body-Text, CTAs (primaer + sekundaer), Trust Badges
- **Format:** Headline (24px), Subheadline (18px), Body-Paragraph, CTA mit Play-Symbol, Trust Badges als Tabelle
- **Minimum:** 4 Trust Badges

### 3. Problem Section ("Kennst du das?")
- **Inhalt:** Headline, Intro-Text, 3 Pain-Point-Cards, Pain Quotes, Transition-Text
- **Format:** Headline (22px), Highlight-Boxes fuer Cards (je Titel + Beschreibung), Blockquotes fuer Zitate, Transition in Accent-Farbe
- **Minimum:** 3 Cards + 5 Quotes

### 4. Benefits Section ("So arbeiten wir wirklich")
- **Inhalt:** Headline, Intro-Paragraph, 3 konkrete Benefits mit Beschreibung, CTA
- **Format:** Headline (22px), h3 fuer jeden Benefit + Paragraph, CTA in Accent
- **Minimum:** 3 Benefits mit Beschreibung

### 5. Compensation Section ("Was du bekommst")
- **Inhalt:** Headline, Intro (Anti-Buzzword), Benefits-Tabelle
- **Format:** Headline (22px), Tabelle (3 Spalten: # | Benefit | Beschreibung)
- **Minimum:** 7 Benefits

### 6. Process Section ("Kein HR-Screening")
- **Inhalt:** Headline, Intro, 3 Prozessschritte
- **Format:** Headline (22px), Tabelle (3 Spalten: Schritt | Titel | Beschreibung), Schrittnummern in Accent-Farbe (20px, bold)
- **Minimum:** 3 Schritte

### 7. Final CTA
- **Inhalt:** Headline, Body, Subline, CTA-Button, Datenschutz-Hinweis
- **Format:** Highlight-Box mit allem Inhalt
- **Minimum:** Alle 5 Elemente

### 8. Footer
- **Inhalt:** Markenname, rechtliche Links, Copyright
- **Format:** Einzeiliger Paragraph mit Pipe-Trennern

## Qualitaetskriterien
- Alle Texte muessen einsatzbereit sein (Copy-Paste fuer Entwickler)
- Problem Section muss exakt die Pain Points aus dem Zielgruppen-Avatar widerspiegeln
- Benefits muessen konkret sein (Zahlen, nicht "attraktiv")
- Trust Badges muessen die wichtigsten Einwand-Killer sein
- Prozess muss einfach und niedrigschwellig klingen
- Anti-Buzzword-Intro in Compensation Section ist Pflicht
- Pain Quotes muessen in Anfuehrungszeichen stehen und realistisch klingen

## Abhaengigkeiten
- **Input von:**
  - 01 Zielgruppen-Avatar (Pain Points, Zitate)
  - 02 Arbeitgeber-Avatar (USPs, Benefits, Versprechen)
  - 03 Messaging-Matrix (Kernbotschaft, Hooks, CTAs)
  - 05 Marken-Richtlinien (Tonalitaet, verbotene Begriffe)
- **Wird genutzt von:**
  - 07 Formularseite-Texte (Bewerbungsformular folgt auf Landingpage)
  - 08 Dankeseite-Texte (Thank-You Page nach Formular)

## HTML-Struktur

```html
<h1>Landingpage-Texte</h1>
<p class="meta">[Firma] &middot; Recruiting Landing Page &middot; Exakte Texte</p>

<h2>Navigation</h2>
<p><strong>[Marke]</strong> | [Nav1] | [Nav2] | [Nav3] | <span style="color:#00e5ff; font-weight:600;">[CTA]</span></p>
<hr>

<h2>Hero Section</h2>
<h3>Headline</h3>
<p style="font-size:24px; font-weight:700; color:#0a1628;">[Headline]</p>
<h3>Subheadline</h3>
<p style="font-size:18px;">[Subheadline]</p>
<h3>Body</h3>
<p>[Body-Text]</p>
<h3>CTAs</h3>
<p><strong style="color:#00e5ff;">&#9654; [Primaer-CTA]</strong> &nbsp; | &nbsp; [Sekundaer-CTA]</p>
<h3>Trust Badges</h3>
<table>
  <tr>
    <td style="text-align:center;"><strong>[Badge 1]</strong></td>
    <td style="text-align:center;"><strong>[Badge 2]</strong></td>
    <!-- min. 4 Badges -->
  </tr>
</table>
<hr>

<h2>Problem Section -- &bdquo;[Titel]&ldquo;</h2>
<h3>Headline</h3>
<p style="font-size:22px; font-weight:700; color:#0a1628;">[Headline]</p>
<p><em>[Intro]</em></p>
<h3>Card 1: [Titel]</h3>
<div class="highlight">
  <strong>[Card-Titel]</strong><br>
  [Card-Beschreibung]
</div>
<!-- min. 3 Cards -->
<h3>Pain Quotes</h3>
<blockquote>&bdquo;[Zitat]&ldquo;</blockquote>
<!-- min. 5 Quotes -->
<p style="font-size:18px; font-weight:700; color:#00e5ff;">[Transition-Text]</p>
<hr>

<h2>Benefits Section -- &bdquo;[Titel]&ldquo;</h2>
<h3>Headline</h3>
<p style="font-size:22px; font-weight:700; color:#0a1628;">[Headline]</p>
<p>[Intro-Paragraph]</p>
<h3>Benefit 1: [Titel]</h3>
<p>[Beschreibung]</p>
<!-- min. 3 Benefits -->
<p><strong style="color:#00e5ff;">CTA: [CTA-Text]</strong></p>
<hr>

<h2>Compensation Section -- &bdquo;[Titel]&ldquo;</h2>
<h3>Headline</h3>
<p style="font-size:22px; font-weight:700; color:#0a1628;">[Headline]</p>
<p><em>[Anti-Buzzword-Intro]</em></p>
<table>
  <tr><th>#</th><th>Benefit</th><th>Beschreibung</th></tr>
  <!-- min. 7 Benefits -->
</table>
<hr>

<h2>Process Section -- &bdquo;[Titel]&ldquo;</h2>
<h3>Headline</h3>
<p style="font-size:22px; font-weight:700; color:#0a1628;">[Headline]</p>
<p><em>[Intro]</em></p>
<table>
  <tr><th>Schritt</th><th>Titel</th><th>Beschreibung</th></tr>
  <tr>
    <td style="text-align:center; font-size:20px; font-weight:700; color:#00e5ff;">[N]</td>
    <td><strong>[Titel]</strong></td>
    <td>[Beschreibung]</td>
  </tr>
  <!-- 3 Schritte -->
</table>
<hr>

<h2>Final CTA</h2>
<div class="highlight">
  <p style="font-size:22px; font-weight:700; color:#0a1628;">[Headline]</p>
  <p>[Body]</p>
  <p><em>[Subline]</em></p>
  <p><strong style="color:#00e5ff;">&#9654; [CTA-Button]</strong></p>
  <p style="font-size:12px; color:#888;">[Datenschutz-Hinweis]</p>
</div>
<hr>

<h2>Footer</h2>
<p><strong>[Marke]</strong> | [Link1] | [Link2] | [Link3] | &copy; [Jahr] [Firma]</p>
```

Siehe `00-design-system.md` fuer CSS-Klassen und Styling.

## Benoetigte Bausteine
| Kategorie | Felder | Verwendung |
|-----------|--------|------------|
| C. Schmerzpunkte | C.1-C.12 (alle) | Problem Section: Pain-Point-Cards + Pain Quotes |
| D. Psychologie & Emotionen | D.1-D.10 (alle) | Hero Headline: Emotionaler Trigger |
| E. Benefits & Wuensche | E.1-E.8 (alle) | Benefits Section + Compensation Section |
| F. Sprache & Wording | F.1-F.3 | Tonalitaet, Fachwoerter, verbotene Woerter |
| H. Arbeitgeber-Daten | H.1-H.10 (alle) | Hero: Kernpositionierung, Benefits: USPs mit Beweis |
| I. Messaging | I.1-I.9 (alle) | Hero: Kernbotschaft, CTAs fuer Buttons |
| G. Einwaende | G.1-G.6 (Kontext) | Trust Badges muessen Einwaende entkraeften |

## Regeln
- Hero Section (Above the Fold = 84% der Aufmerksamkeit):
  - Headline: Schmerzpunkt spiegeln, NICHT Solution ("Du verdienst Code, der live geht" > "Wir haben CI/CD")
  - Subheadline: Solution anteasen
  - 2 CTAs: Primaer ("Jetzt bewerben") + Sekundaer ("Mehr erfahren")
  - Trust Badges: Die wichtigsten Einwand-Killer
- Problem Section:
  - 3 Pain-Point-Cards mit konkreten Situationen (nicht abstrakt)
  - Mindestens 5 Pain Quotes in deutschen Anfuehrungszeichen
  - Transition-Text in Accent-Farbe als Bruecke zu Benefits
- Benefits Section:
  - NICHT "Wir bieten" sondern "Bei dir sieht das so aus:" / "Dein Alltag:"
  - Konkret statt generisch ("Freitags ab 14 Uhr frei" statt "Flexible Arbeitszeiten")
- Compensation Section:
  - Anti-Buzzword-Intro ist PFLICHT ("Keine Buzzwords. Nur Fakten.")
  - Mindestens 7 Benefits mit konkreten Zahlen
- Process Section:
  - Maximal 3 Schritte
  - Zeitangabe PFLICHT ("Dauert 60 Sekunden")
  - "Kein Lebenslauf" MUSS prominent vorkommen
- Mobile First: 83% aller LP-Visits sind Mobile → Texte kurz halten, Scannability
- KEINE generischen Floskeln: "Spannende Aufgaben", "Dynamisches Team" etc.

## Beispiel-Output
```html
<!-- Auszug Hero Section -->
<h2>Hero Section</h2>
<h3>Headline</h3>
<p style="font-size:24px; font-weight:700; color:#0a1628;">Du verdienst Code, der in Produktion geht.</p>
<h3>Subheadline</h3>
<p style="font-size:18px;">Nicht in die Schublade. Nicht in endlose Reviews. In Produktion.</p>
<h3>Trust Badges</h3>
<table>
  <tr>
    <td style="text-align:center;"><strong>Kein Lebenslauf noetig</strong></td>
    <td style="text-align:center;"><strong>Antwort in 48h</strong></td>
    <td style="text-align:center;"><strong>100% Remote moeglich</strong></td>
    <td style="text-align:center;"><strong>Gespraech mit Engineer</strong></td>
  </tr>
</table>
```

## Beispiel-Prompt

```
Du bist ein Conversion-Texter fuer Recruiting-Landingpages. Erstelle die vollstaendigen, einsatzbereiten Texte fuer eine Recruiting-Landingpage.

**Unternehmen:** {{firmenname}}
**Rolle:** {{rolle}}
**Benefits:** {{benefits_liste}}
**Bewerbungsprozess:** {{prozess_schritte}}

**Pain Points (aus Zielgruppen-Avatar):**
{{pain_points_mit_zitaten}}

**USPs (aus Arbeitgeber-Avatar):**
{{usps}}

**Kernbotschaft (aus Messaging-Matrix):**
{{kernbotschaft}}

**CTAs (aus Messaging-Matrix):**
{{cta_varianten}}

**Verbotene Begriffe (aus Marken-Richtlinien):**
{{verbotene_begriffe}}

Erstelle die Landingpage-Texte mit exakt diesen Sections:
1. Navigation (Markenname + 4 Nav-Punkte + CTA-Button in Accent)
2. Hero Section (Headline 24px, Subheadline 18px, Body, 2 CTAs, 4 Trust Badges)
3. Problem Section (Headline 22px, Intro, 3 Pain-Point-Cards als Highlight-Boxes, min. 5 Pain Quotes als Blockquotes, Transition-Text in Accent)
4. Benefits Section (Headline 22px, Intro, 3 Benefits mit h3 + Paragraph, CTA)
5. Compensation Section (Headline 22px, Anti-Buzzword-Intro kursiv, min. 7 Benefits als Tabelle: # | Benefit | Beschreibung)
6. Process Section (Headline 22px, Intro, 3 Schritte als Tabelle mit Accent-Nummern)
7. Final CTA (Highlight-Box mit Headline, Body, Subline, CTA-Button, Datenschutz)
8. Footer (Markenname + rechtliche Links + Copyright)

Alle Texte muessen einsatzbereit und Copy-Paste-faehig sein. Keine Platzhalter. Anti-Buzzword-Intro ist Pflicht. Pain Quotes in deutschen Anfuehrungszeichen.

Formatiere als HTML mit dem Design-System.
```
