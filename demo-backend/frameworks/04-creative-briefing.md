# Framework: Creative Briefing
Dokument-Nummer: 05 (intern), 04 (Framework-Reihenfolge)

## Zweck
Das Creative Briefing definiert die visuellen und gestalterischen Richtlinien fuer die gesamte Recruiting-Kampagne. Es legt Farbpalette, Bildsprache, Typografie, Formate und Creative-Typen fest. Designer und Content-Creator nutzen dieses Dokument als verbindliche Referenz fuer alle visuellen Inhalte (Ads, Landingpages, Videos).

## Input-Anforderungen
- **Aus vorherigen Dokumenten:**
  - 01 Zielgruppen-Avatar: Zielgruppe (Alter, Branche, Aesthetik-Praeferenzen)
  - 02 Arbeitgeber-Avatar: Markenfarben, Tonalitaet, Anti-Muster
- **Aus dem Kickoff-Gespraech:**
  - Bestehende Markenfarben / CI
  - Vorhandene Fotos oder Bildmaterial
  - Kanaele (Meta, LinkedIn, etc.)
  - Gewuenschte Formate (Feed, Story, Carousel)
- **Aus Unternehmensrecherche:**
  - Bestehende Website/Social-Media-Auftritte (visuelle Konsistenz)

## Pflicht-Sections

### 1. Projekt-Uebersicht
- **Inhalt:** Kampagnenname, Zielgruppe (kurz), Kanaele
- **Format:** Tabelle (2 Spalten: Detail | Beschreibung)
- **Minimum:** 3 Zeilen

### 2. Farbpalette
- **Inhalt:** Alle Kampagnenfarben mit Hex-Code und Verwendungszweck
- **Format:** Tabelle (3 Spalten: Farbe | Hex | Verwendung), optional mit Farbswatch-Inline-Style
- **Minimum:** 4 Farben

### 3. Bildsprache
- **Inhalt:** Regeln fuer Fotografie und visuelle Inhalte
- **Format:** Ungeordnete Liste
- **Minimum:** 5 Regeln + Referenzbilder

### 4. Typografie
- **Inhalt:** Font-Regeln fuer Headlines, Body, verbotene Fonts
- **Format:** Ungeordnete Liste
- **Minimum:** 4 Punkte

### 5. Formate
- **Inhalt:** Alle benoetigten Bildformate mit Groessen und Kanaelen
- **Format:** Tabelle (3 Spalten: Format | Groesse | Kanal)
- **Minimum:** 3 Formate

### 6. Creative-Typen
- **Inhalt:** Arten von Creatives mit Zuordnung zum Kampagnen-Funnel
- **Format:** Geordnete Liste mit Pfeil-Zuordnung
- **Minimum:** 3 Creative-Typen

### 7. Do's
- **Inhalt:** Gewuenschte visuelle Elemente
- **Format:** Ungeordnete Liste mit gruenem Haekchen (color: #006600)
- **Minimum:** 4 Punkte

### 8. Don'ts
- **Inhalt:** Verbotene visuelle Elemente
- **Format:** Ungeordnete Liste mit rotem Kreuz (color: #cc0000)
- **Minimum:** 4 Punkte

## Qualitaetskriterien
- Farbpalette muss zum bestehenden CI passen oder begruendet abweichen
- Bildsprache muss authentisch sein (keine Stockfotos bei Tech-Zielgruppen)
- Formate muessen kanalspezifisch sein (Instagram: 1080x1080, Story: 1080x1920)
- Do's und Don'ts muessen spezifisch genug sein, um Fehler zu verhindern
- Creative-Typen muessen dem Funnel zugeordnet sein (Warmup, Hauptkampagne, Retargeting)

## Abhaengigkeiten
- **Input von:**
  - 01 Zielgruppen-Avatar (Zielgruppen-Aesthetik)
  - 02 Arbeitgeber-Avatar (Markenidentitaet, Tonalitaet)
- **Wird genutzt von:**
  - 05 Marken-Richtlinien (detaillierte Brand Guidelines)
  - 09-11 Anzeigentexte (visuelle Begleitung der Texte)
  - 12 Videoskript (Farbkorrektur, Stimmung)

## HTML-Struktur

```html
<h1>Creative Briefing</h1>
<p class="meta">[Firma] &middot; [Kampagne] &middot; Visual &amp; Creative Guidelines</p>

<h2>Projekt-Uebersicht</h2>
<table>
  <tr><th>Detail</th><th>Beschreibung</th></tr>
  <tr><td><strong>[Detail]</strong></td><td>[Beschreibung]</td></tr>
  <!-- min. 3 Zeilen -->
</table>
<hr>

<h2>Farbpalette</h2>
<table>
  <tr><th>Farbe</th><th>Hex</th><th>Verwendung</th></tr>
  <tr>
    <td><span style="display:inline-block;width:20px;height:20px;background:[HEX];border:1px solid #ccc;vertical-align:middle;margin-right:8px;"></span> <strong>[Name]</strong></td>
    <td>[HEX]</td>
    <td>[Verwendung]</td>
  </tr>
  <!-- min. 4 Farben -->
</table>
<hr>

<h2>Bildsprache</h2>
<ul>
  <li>[Regel]</li>
  <li><strong>Referenzbilder:</strong> [Beschreibung]</li>
  <!-- min. 5 Regeln -->
</ul>
<hr>

<h2>Typografie</h2>
<ul>
  <li><strong>Headlines:</strong> [Spezifikation]</li>
  <li><strong>Body:</strong> [Spezifikation]</li>
  <li><strong>KEINE:</strong> [Verbote]</li>
  <!-- min. 4 Punkte -->
</ul>
<hr>

<h2>Formate</h2>
<table>
  <tr><th>Format</th><th>Groesse</th><th>Kanal</th></tr>
  <!-- min. 3 Zeilen -->
</table>
<hr>

<h2>Creative-Typen</h2>
<ol>
  <li><strong>[Typ]</strong> &rarr; [Funnel-Phase]</li>
  <!-- min. 3 Items -->
</ol>
<hr>

<h2>Do's</h2>
<ul>
  <li style="color:#006600;">&#10004; [Regel]</li>
  <!-- min. 4 Items -->
</ul>

<h2>Don'ts</h2>
<ul>
  <li style="color:#cc0000;">&#10060; [Regel]</li>
  <!-- min. 4 Items -->
</ul>
```

Siehe `00-design-system.md` fuer CSS-Klassen und Styling.

## Benoetigte Bausteine
| Kategorie | Felder | Verwendung |
|-----------|--------|------------|
| H. Arbeitgeber-Daten | H.7 Kernpositionierung, H.9 Kultur | Visuelles Branding ableiten |
| F. Sprache & Wording | F.1 Duktus, F.5 Kommunikationsstil | Bildsprache-Tonalitaet |
| C. Schmerzpunkte | C.1-C.3 (Kontext) | Zielgruppen-Aesthetik verstehen |

## Regeln
- Farben IMMER als Hex-Code angeben (nicht "blau", sondern "#0066FF")
- Formate mit exakten px-Angaben: 1080x1080 (Feed), 1080x1920 (Story), 1200x628 (Link Ad)
- Bildsprache bei Tech-Zielgruppen: Echte Menschen in echten Arbeitsumgebungen, KEINE Stockfotos
- Typografie: Konkreten Font-Stack angeben (z.B. "Inter, -apple-system, sans-serif")
- Creative-Typen MUESSEN dem Funnel zugeordnet sein (Warmup → Awareness, Haupt → Conversion, RT → Re-engagement)
- Do's und Don'ts SPEZIFISCH genug, um Fehler zu verhindern
- Farbpalette muss zum bestehenden CI passen
- Mindestens 5 Farben (nicht nur 4)

## Beispiel-Output
```html
<!-- Auszug Farbpalette -->
<table>
  <tr><th>Farbe</th><th>Hex</th><th>Verwendung</th></tr>
  <tr>
    <td><span style="display:inline-block;width:20px;height:20px;background:#0a1628;border:1px solid #ccc;vertical-align:middle;margin-right:8px;"></span> <strong>Primary Dark</strong></td>
    <td>#0a1628</td>
    <td>Headlines, Hintergruende</td>
  </tr>
  <tr>
    <td><span style="display:inline-block;width:20px;height:20px;background:#00e5ff;border:1px solid #ccc;vertical-align:middle;margin-right:8px;"></span> <strong>Accent Cyan</strong></td>
    <td>#00e5ff</td>
    <td>CTAs, Highlights, Hover</td>
  </tr>
</table>
```

## Beispiel-Prompt

```
Du bist ein Creative Director fuer Performance-Marketing-Kampagnen. Erstelle ein Creative Briefing fuer eine Recruiting-Kampagne.

**Unternehmen:** {{firmenname}}
**Kampagne:** {{kampagnenname}}
**Zielgruppe:** {{zielgruppe_kurzprofil}}
**Kanaele:** {{kanaele}}
**Markenfarben:** {{farben_hex}}

**Vorhandenes Bildmaterial:**
{{bildmaterial_beschreibung}}

**Tonalitaet (aus Arbeitgeber-Avatar):**
{{tonalitaet}}

**Anti-Muster (aus Arbeitgeber-Avatar):**
{{anti_muster}}

Erstelle das Creative Briefing mit exakt diesen Sections:
1. Projekt-Uebersicht (min. 3 Zeilen als Tabelle: Detail | Beschreibung)
2. Farbpalette (min. 4 Farben als Tabelle mit Hex und Verwendung, inkl. Farbswatch-Spans)
3. Bildsprache (min. 5 Regeln als Liste + Referenzbilder)
4. Typografie (min. 4 Punkte: Headlines, Body, Stil, Verbote)
5. Formate (min. 3 als Tabelle: Format | Groesse | Kanal)
6. Creative-Typen (min. 3 als nummerierte Liste mit Funnel-Phase)
7. Do's (min. 4 Punkte mit gruenem Haekchen)
8. Don'ts (min. 4 Punkte mit rotem Kreuz)

Bildsprache muss authentisch und zur Branche passend sein. Keine Stockfotos bei Tech-Zielgruppen.

Formatiere als HTML mit dem Design-System (h1, h2, .meta, table, ul, ol, hr).
```
