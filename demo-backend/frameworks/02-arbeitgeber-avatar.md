# Framework: Arbeitgeber-Avatar
Dokument-Nummer: 03 (intern), 02 (Framework-Reihenfolge)

## Zweck
Der Arbeitgeber-Avatar positioniert das Unternehmen als Arbeitgebermarke (Employer Brand). Er definiert die Kernpositionierung, USPs, Arbeitgeberversprechen, Differenzierung zum Wettbewerb sowie Tonalitaet und Anti-Muster. Dieses Dokument dient als Leitfaden fuer alle kommunikativen Massnahmen -- jeder Text, jedes Creative und jede Anzeige muss konsistent mit diesem Avatar sein.

## Input-Anforderungen
- **Aus dem Kickoff-Gespraech (Transkript):**
  - Firmenname, Gruendungsjahr, Standort
  - Teamgroesse und Zusammensetzung (wie viele Entwickler)
  - Finanzierungsart (Bootstrapped, VC, etc.)
  - Kundenprofil (wer, wie gross, welche Branche)
  - Kernleistung des Unternehmens
  - Was macht das Unternehmen besonders (aus Sicht des Gruenders/Hiring Managers)
  - Benefits (Urlaub, Budget, Hardware, Remote-Policy)
  - Bewerbungsprozess (Schritte, Dauer)
- **Aus vorherigen Dokumenten:**
  - 01 Zielgruppen-Avatar: Pain Points (USPs muessen diese adressieren), Einwaende (Differenzierung muss diese entkraeften)
- **Aus Unternehmensrecherche:**
  - Wettbewerber-Positionierung
  - Glassdoor/Kununu-Bewertungen

## Pflicht-Sections

### 1. Unternehmensprofil
- **Inhalt:** Firmenname, Gruendungsjahr, Standort, Mitarbeiterzahl, Durchschnittsalter Dev-Team, Finanzierung, Kunden, Kernleistung
- **Format:** Tabelle (2 Spalten: Merkmal | Detail)
- **Minimum:** 8 Zeilen

### 2. Kernpositionierung
- **Inhalt:** Ein praegnanter Positionierungssatz + Erklaerung
- **Format:** Highlight-Box (`<div class="highlight">`) mit grossem Statement
- **Minimum:** 1 Satz + 1 Erklaerung

### 3. Unique Selling Propositions (USPs)
- **Inhalt:** Jeder USP mit konkretem Beweis
- **Format:** Tabelle (3 Spalten: USP | Konkret | Beweis)
- **Minimum:** 5 USPs

### 4. Arbeitgeberversprechen
- **Inhalt:** Konkrete Versprechen an neue Mitarbeiter
- **Format:** Geordnete Liste (`<ol>`)
- **Minimum:** 5 Versprechen

### 5. Differenzierung vom Wettbewerb
- **Inhalt:** Direkter Vergleich: Was wir sagen vs. was Wettbewerber sagen
- **Format:** Tabelle (3 Spalten: Wir sagen | Wettbewerber sagen | Unterschied)
- **Minimum:** 4 Zeilen

### 6. Tonalitaet & Sprache
- **Inhalt:** Anrede, Sprachstil, Kommunikationsregeln
- **Format:** Ungeordnete Liste
- **Minimum:** 5 Regeln

### 7. Anti-Muster (Was wir NICHT sagen)
- **Inhalt:** Verbotene Phrasen und Buzzwords
- **Format:** Ungeordnete Liste mit rotem Styling (color: #cc0000, Kreuz-Symbol)
- **Minimum:** 5 Anti-Muster

## Qualitaetskriterien
- USPs muessen konkret und beweisbar sein (nicht "tolles Team", sondern "14 Entwickler, Durchschnittsalter 32")
- Kernpositionierung muss ein Gegenpol zum typischen Arbeitgeber der Zielgruppe sein
- Differenzierung muss ehrlich sein -- keine uebertriebenen Claims
- Anti-Muster muessen branchenuebliche Buzzwords enthalten, die die Zielgruppe abstossen
- Tonalitaet muss zur Zielgruppe passen (bei Entwicklern: technisch, direkt, "Du")
- Arbeitgeberversprechen muessen verifizierbar sein

## Abhaengigkeiten
- **Input von:**
  - 01 Zielgruppen-Avatar (Pain Points bestimmen USPs, Einwaende bestimmen Differenzierung)
- **Wird genutzt von:**
  - 03 Messaging-Matrix (Botschaften basieren auf USPs)
  - 04 Stellenanzeige / Creative Briefing (Visuelles Branding)
  - 05 Karriereseiten / Marken-Richtlinien (Brand Guidelines)
  - 06 Landingpage-Texte (Tone of Voice)
  - 09-11 Anzeigentexte (Tonalitaet, Anti-Muster)

## HTML-Struktur

```html
<h1>Arbeitgeber-Avatar</h1>
<p class="meta">[Firma] &middot; Employer Brand Positioning</p>

<h2>Unternehmensprofil</h2>
<table>
  <tr><th>Merkmal</th><th>Detail</th></tr>
  <tr><td><strong>[Merkmal]</strong></td><td>[Detail]</td></tr>
  <!-- min. 8 Zeilen -->
</table>
<hr>

<h2>Kernpositionierung</h2>
<div class="highlight">
  <strong style="color:#0a1628; font-size:18px;">&bdquo;[Positionierungssatz]&ldquo;</strong><br><br>
  [Erklaerung der Positionierung]
</div>
<hr>

<h2>Unique Selling Propositions</h2>
<table>
  <tr><th>USP</th><th>Konkret</th><th>Beweis</th></tr>
  <tr><td><strong>[USP]</strong></td><td>[Konkretisierung]</td><td>[Beweis]</td></tr>
  <!-- min. 5 Zeilen -->
</table>
<hr>

<h2>Arbeitgeberversprechen</h2>
<ol>
  <li><strong>[Versprechen]</strong></li>
  <!-- min. 5 Items -->
</ol>
<hr>

<h2>Differenzierung vom Wettbewerb</h2>
<table>
  <tr><th>Wir sagen</th><th>Wettbewerber sagen</th><th>Unterschied</th></tr>
  <!-- min. 4 Zeilen -->
</table>
<hr>

<h2>Tonalitaet &amp; Sprache</h2>
<ul>
  <li><strong>[Regel-Label]</strong> statt [Anti-Regel]</li>
  <!-- min. 5 Items -->
</ul>
<hr>

<h2>Anti-Muster (Was wir NICHT sagen)</h2>
<ul>
  <li style="color:#cc0000;">&#10060; &bdquo;[Verbotene Phrase]&ldquo;</li>
  <!-- min. 5 Items -->
</ul>
```

Siehe `00-design-system.md` fuer CSS-Klassen und Styling.

## Benoetigte Bausteine
| Kategorie | Felder | Verwendung |
|-----------|--------|------------|
| H. Arbeitgeber-Daten | H.1-H.10 (alle) | USPs mit Beweis, Kernpositionierung, Differenzierung |
| C. Schmerzpunkte | C.1-C.12 (Kontext) | USPs muessen Pain Points adressieren |
| E. Benefits & Wuensche | E.1-E.8 (Kontext) | Arbeitgeberversprechen daraus ableiten |

## Regeln
- JEDER USP muss einen BEWEIS haben — nicht "tolles Team", sondern "14 Entwickler, Durchschnittsalter 32, 3 haben vorher bei Zalando gearbeitet"
- Kernpositionierung = 1 Satz der das GEGENTEIL des typischen Arbeitgebers der Zielgruppe beschreibt
- Differenzierung muss EHRLICH sein — keine uebertriebenen Claims
- Anti-Muster MUESSEN branchenuebliche Buzzwords enthalten die die Zielgruppe abstossen:
  - "Rockstar Developer", "Wir sind wie eine Familie", "Dynamisches Umfeld", "Flache Hierarchien", "Attraktives Gehalt"
- Tonalitaet bei Tech-Zielgruppen: IMMER "Du", technisch, direkt, keine HR-Sprache
- Arbeitgeberversprechen muessen VERIFIZIERBAR sein (Zahlen, nicht Adjektive)
- USP-Tabelle: Spalte "Beweis" muss konkrete Daten enthalten (Zahlen, Fakten, Referenzen)
- Mindestens 6 USPs (nicht nur 5)
- Anti-Muster mindestens 7 (nicht nur 5)

## Beispiel-Output
```html
<!-- Auszug USP-Tabelle -->
<table>
  <tr><th>USP</th><th>Konkret</th><th>Beweis</th></tr>
  <tr><td><strong>Code geht in Produktion</strong></td><td>CI/CD Pipeline, Feature Flags, wöchentliche Releases</td><td>Durchschnittlich 47 Deployments/Monat, Mean Time to Production: 2.3 Stunden</td></tr>
  <tr><td><strong>Moderner Stack, kein Legacy</strong></td><td>TypeScript, Next.js 14, PostgreSQL, Kubernetes</td><td>Stack-Migration 2023 abgeschlossen, 0% jQuery, 100% TypeScript seit Q2/2024</td></tr>
</table>
```

## Beispiel-Prompt

```
Du bist ein Employer-Branding-Stratege. Erstelle einen Arbeitgeber-Avatar basierend auf den folgenden Informationen.

**Unternehmen:** {{firmenname}}
**Gruendungsjahr:** {{gruendungsjahr}}
**Standort:** {{standort}}
**Teamgroesse:** {{teamgroesse}} (davon {{dev_anzahl}} Entwickler)
**Finanzierung:** {{finanzierung}}
**Kunden:** {{kundenprofil}}
**Kernleistung:** {{leistung}}

**Benefits:**
{{benefits_liste}}

**Informationen aus dem Kickoff-Gespraech:**
{{transkript_auszug}}

**Pain Points der Zielgruppe (aus Zielgruppen-Avatar):**
{{pain_points}}

**Einwaende der Zielgruppe:**
{{einwaende}}

Erstelle den Arbeitgeber-Avatar mit exakt diesen Sections:
1. Unternehmensprofil (min. 8 Zeilen als Tabelle)
2. Kernpositionierung (1 praegnanter Satz in Highlight-Box + Erklaerung)
3. Unique Selling Propositions (min. 5 USPs als Tabelle: USP | Konkret | Beweis)
4. Arbeitgeberversprechen (min. 5 Versprechen als nummerierte Liste)
5. Differenzierung vom Wettbewerb (min. 4 Zeilen als Tabelle: Wir sagen | Wettbewerber sagen | Unterschied)
6. Tonalitaet & Sprache (min. 5 Regeln als Liste)
7. Anti-Muster (min. 5 verbotene Phrasen mit rotem Kreuz-Symbol)

Jeder USP muss direkt einen Pain Point der Zielgruppe adressieren. Die Kernpositionierung muss ein klarer Gegenpol zum typischen Arbeitgeber sein. Anti-Muster muessen branchenuebliche Buzzwords sein.

Formatiere als HTML mit dem Design-System (h1, h2, .meta, .highlight, table, ol, ul, hr).
```
