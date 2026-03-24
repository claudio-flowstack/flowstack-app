# Framework: Marken-Richtlinien
Dokument-Nummer: 06 (intern), 05 (Framework-Reihenfolge)

## Zweck
Die Marken-Richtlinien dokumentieren die vollstaendigen Brand Guidelines des Unternehmens im Kontext der Recruiting-Kampagne. Sie definieren Logo-Nutzung, Farbsystem (mit RGB-Werten), Typografie-Spezifikationen, Bildsprache-Regeln, Tonalitaets-Regeln und eine Liste verbotener vs. erlaubter Begriffe. Dieses Dokument ist die verbindliche Referenz fuer alle externen Dienstleister (Designer, Texter, Agenturen).

## Input-Anforderungen
- **Aus vorherigen Dokumenten:**
  - 02 Arbeitgeber-Avatar: Tonalitaet, Anti-Muster
  - 04 Creative Briefing: Farbpalette, Typografie, Bildsprache
- **Aus dem Kickoff-Gespraech:**
  - Logo-Dateien und Nutzungsregeln
  - Bestehende CI/CD-Richtlinien
  - Markenname und Schreibweise
- **Aus Unternehmensrecherche:**
  - Bestehende Website fuer Konsistenz-Check

## Pflicht-Sections

### 1. Logo
- **Inhalt:** Logo-Name, Schreibweise, Mindestabstand, Farbvarianten
- **Format:** Ungeordnete Liste
- **Minimum:** 4 Regeln

### 2. Farben
- **Inhalt:** Alle Markenfarben mit Hex, RGB und Verwendung
- **Format:** Tabelle (4 Spalten: Farbe | Hex | RGB | Verwendung)
- **Minimum:** 4 Farben

### 3. Typografie
- **Inhalt:** Font-Stack, Gewichtungen, Mindestgroessen
- **Format:** Tabelle (2 Spalten: Element | Spezifikation)
- **Minimum:** 4 Zeilen

### 4. Bildsprache-Regeln
- **Inhalt:** Konkrete prozentuale oder qualitative Regeln fuer Bildmaterial
- **Format:** Ungeordnete Liste
- **Minimum:** 4 Regeln

### 5. Tonalitaets-Regeln
- **Inhalt:** Sprachliche Regeln (Anrede, Fakten-Basis, Humor)
- **Format:** Ungeordnete Liste
- **Minimum:** 5 Regeln

### 6. Verbotene Begriffe
- **Inhalt:** Zwei-Spalten-Tabelle: Verboten vs. Erlaubt
- **Format:** Tabelle mit farbigen Headers (rot: Verboten, gruen: Erlaubt)
- **Minimum:** 5 Begriffspaare

## Qualitaetskriterien
- Farben muessen mit Hex UND RGB angegeben werden
- Logo-Regeln muessen Mindestabstaende und Farbvarianten definieren
- Typografie muss einen konkreten Font-Stack angeben
- Verbotene Begriffe muessen jeweils eine erlaubte Alternative haben
- Alle Regeln muessen konkret und umsetzbar sein (nicht "professionell", sondern "Mindestgroesse 14px")

## Abhaengigkeiten
- **Input von:**
  - 02 Arbeitgeber-Avatar (Tonalitaet, Anti-Muster -> verbotene Begriffe)
  - 04 Creative Briefing (Farbpalette, Typografie)
- **Wird genutzt von:**
  - Alle nachfolgenden Dokumente als Brand-Referenz
  - Externe Dienstleister (Designer, Agenturen)

## HTML-Struktur

```html
<h1>Marken-Richtlinien</h1>
<p class="meta">[Firma] &middot; Brand Guidelines</p>

<h2>Logo</h2>
<ul>
  <li><strong>[Markenname]</strong> in [Schreibweise]</li>
  <li>Minimaler Abstand: [Regel]</li>
  <li>Auf dunklem Hintergrund: <strong>[Farbe]</strong></li>
  <li>Auf hellem Hintergrund: <strong>[Farbe]</strong></li>
</ul>
<hr>

<h2>Farben</h2>
<table>
  <tr><th>Farbe</th><th>Hex</th><th>RGB</th><th>Verwendung</th></tr>
  <tr><td><strong>[Name]</strong></td><td>[HEX]</td><td>[R, G, B]</td><td>[Verwendung]</td></tr>
  <!-- min. 4 Farben -->
</table>
<hr>

<h2>Typografie</h2>
<table>
  <tr><th>Element</th><th>Spezifikation</th></tr>
  <tr><td><strong>[Element]</strong></td><td>[Spezifikation]</td></tr>
  <!-- min. 4 Zeilen -->
</table>
<hr>

<h2>Bildsprache-Regeln</h2>
<ul>
  <li>[Regel]</li>
  <!-- min. 4 Regeln -->
</ul>
<hr>

<h2>Tonalitaets-Regeln</h2>
<ul>
  <li>Immer <strong>[Regel]</strong></li>
  <!-- min. 5 Regeln -->
</ul>
<hr>

<h2>Verbotene Begriffe</h2>
<table>
  <tr>
    <th style="background:#cc0000;">Verboten</th>
    <th style="background:#006600; color:#fff;">Erlaubt / Gewuenscht</th>
  </tr>
  <tr>
    <td style="color:#cc0000;">&bdquo;[Phrase]&ldquo;</td>
    <td style="color:#006600;">&bdquo;[Alternative]&ldquo;</td>
  </tr>
  <!-- min. 5 Begriffspaare -->
</table>
```

Siehe `00-design-system.md` fuer CSS-Klassen und Styling.

## Benoetigte Bausteine
| Kategorie | Felder | Verwendung |
|-----------|--------|------------|
| H. Arbeitgeber-Daten | H.7-H.10 | Kernpositionierung, Kultur, Anti-Muster → verbotene Begriffe |
| F. Sprache & Wording | F.1-F.3 | Duktus, Fachwoerter, Verbotene Woerter direkt uebernehmen |
| I. Messaging | I.10 Tonalitaetsprofil | Tonalitaetsregeln ableiten |

## Regeln
- Farben IMMER mit Hex UND RGB angeben
- Logo-Regeln: Mindestabstaende in px definieren, nicht "genuegend Abstand"
- Typografie: Konkreten Font-Stack angeben mit Fallbacks
- Mindestgroessen: In px, nicht "gross genug"
- Verbotene Begriffe: JEDER muss eine erlaubte Alternative haben
- Verbotene Liste MUSS enthalten: "Rockstar", "Ninja", "Dynamisches Team", "Flache Hierarchien", "Attraktives Gehalt", "Spannende Aufgaben", "Wir suchen dich!"
- Erlaubte Alternativen muessen SPEZIFISCH sein (nicht "gutes Gehalt" → sondern "65-80k, transparent kommuniziert")
- Tonalitaetsregeln: "Du" statt "Sie", Fachbegriffe der Zielgruppe, kurze Saetze
- Mindestens 8 Begriffspaare (nicht nur 5)

## Beispiel-Output
```html
<!-- Auszug Verbotene Begriffe -->
<table>
  <tr>
    <th style="background:#cc0000; color:#fff;">Verboten</th>
    <th style="background:#006600; color:#fff;">Erlaubt / Gewuenscht</th>
  </tr>
  <tr>
    <td style="color:#cc0000;">&bdquo;Flache Hierarchien&ldquo;</td>
    <td style="color:#006600;">&bdquo;14-Personen-Team, direkte Kommunikation mit dem CTO&ldquo;</td>
  </tr>
  <tr>
    <td style="color:#cc0000;">&bdquo;Attraktives Gehalt&ldquo;</td>
    <td style="color:#006600;">&bdquo;65-80k, transparent ab dem ersten Gespraech&ldquo;</td>
  </tr>
  <tr>
    <td style="color:#cc0000;">&bdquo;Spannende Aufgaben&ldquo;</td>
    <td style="color:#006600;">&bdquo;Du baust die Payment-Integration fuer 2.4 Mio. Nutzer&ldquo;</td>
  </tr>
</table>
```

## Beispiel-Prompt

```
Du bist ein Brand-Stratege. Erstelle vollstaendige Marken-Richtlinien fuer eine Recruiting-Kampagne.

**Unternehmen:** {{firmenname}}
**Markenname Schreibweise:** {{schreibweise}}
**Bestehende Farben:** {{farben_mit_hex}}

**Tonalitaet (aus Arbeitgeber-Avatar):**
{{tonalitaet_regeln}}

**Anti-Muster (aus Arbeitgeber-Avatar):**
{{anti_muster}}

**Creative Briefing Farben und Typografie:**
{{creative_briefing_auszug}}

Erstelle die Marken-Richtlinien mit exakt diesen Sections:
1. Logo (min. 4 Regeln als Liste: Schreibweise, Mindestabstand, Farbvarianten)
2. Farben (min. 4 Farben als Tabelle mit Hex, RGB und Verwendung)
3. Typografie (min. 4 Zeilen als Tabelle: Element | Spezifikation, inkl. Font-Stack)
4. Bildsprache-Regeln (min. 4 konkrete Regeln als Liste)
5. Tonalitaets-Regeln (min. 5 Regeln als Liste)
6. Verbotene Begriffe (min. 5 Paare als Tabelle mit farbigen Headers: rot=Verboten, gruen=Erlaubt)

Alle Angaben muessen konkret und umsetzbar sein. Keine vagen Beschreibungen.

Formatiere als HTML mit dem Design-System (h1, h2, .meta, table, ul, hr).
```
