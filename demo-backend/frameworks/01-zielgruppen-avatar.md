# Framework: Zielgruppen-Avatar
Dokument-Nummer: 02 (intern), 01 (Framework-Reihenfolge)

## Zweck
Der Zielgruppen-Avatar definiert die ideale Zielperson fuer die Recruiting-Kampagne. Er beschreibt demografische, berufliche und psychografische Merkmale des Wunschkandidaten. Dieses Dokument bildet die Grundlage fuer alle nachfolgenden Dokumente -- jede Botschaft, jeder Anzeigentext und jede Landingpage referenziert die hier definierten Pain Points, Wuensche und Einwaende.

## Input-Anforderungen
- **Aus dem Kickoff-Gespraech (Transkript):**
  - Welche Rolle wird gesucht (Titel, Senioritaet)
  - Gewuenschter Tech-Stack
  - Erfahrungslevel (Jahre)
  - Region / Standort
  - Gehaltsrange
  - Typischer aktueller Arbeitgeber der Zielperson
  - Was die Zielperson frustriert (Pain Points aus Arbeitgebersicht)
- **Aus Unternehmensrecherche:**
  - Branche und Marktumfeld
  - Typische Wettbewerber um Talente
- **Vorherige Dokumente:** Keines (erstes Dokument in der Kette)

## Pflicht-Sections

### 1. Demografisches Profil
- **Inhalt:** Alter, Geschlecht, Standort, Familienstand, Bildung
- **Format:** Ungeordnete Liste (`<ul>`) mit `<strong>`-Labels
- **Minimum:** 5 Merkmale

### 2. Berufliches Profil
- **Inhalt:** Rolle, Stack, Erfahrung, aktueller Arbeitgeber, Gehalt, Suchverhalten
- **Format:** Tabelle (2 Spalten: Merkmal | Detail)
- **Minimum:** 6 Zeilen

### 3. Psychografisches Profil
- **Inhalt:** Selbstbild, Werte, Entscheidungsverhalten, Community-Affinitaet
- **Format:** Ungeordnete Liste
- **Minimum:** 5 Punkte

### 4. Pain Points & Frustrationen
- **Inhalt:** Konkrete Zitate + zugehoeriges Label, ergaenzt durch weitere Frustrationen
- **Format:** Blockquotes fuer Zitate (mit Label in `<strong>`), plus `<ul>` fuer weitere Punkte
- **Minimum:** 4 Blockquote-Zitate + 2 Listenpunkte

### 5. Wuensche & Motivationen
- **Inhalt:** Was die Zielperson sich vom naechsten Job wuenscht
- **Format:** Geordnete Liste (`<ol>`)
- **Minimum:** 5 Punkte

### 6. Einwaende & Bedenken
- **Inhalt:** Gruende, warum die Zielperson NICHT wechseln wuerde
- **Format:** Geordnete Liste mit Zitat + Erklaerung
- **Minimum:** 4 Einwaende

### 7. Entscheidungsprozess
- **Inhalt:** Phasen von Trigger bis Zusage mit Beschreibung und Timeline
- **Format:** Tabelle (2 Spalten: Phase | Beschreibung)
- **Minimum:** 5 Phasen (Trigger, Research, Validation, Entscheidung, Timeline)

## Qualitaetskriterien
- Zitate muessen realistisch klingen, wie von echten Entwicklern gesprochen
- Pain Points muessen spezifisch sein (nicht "unzufrieden", sondern "6 Wochen an einem Feature, nie deployed")
- Suchverhalten muss definiert werden (aktiv vs. passiv) -- bei Recruiting-Kampagnen meist "passiv"
- Einwaende muessen die realen Bedenken der Zielgruppe widerspiegeln
- Das Dokument muss genderneutral formuliert sein, auch wenn die Branchenrealitaet benannt wird
- Keine generischen Marketing-Floskeln

## Abhaengigkeiten
- **Input von:** Keinem vorherigen Dokument (Stammdokument)
- **Wird genutzt von:** Alle nachfolgenden Dokumente (02-12), insbesondere:
  - 02 Arbeitgeber-Avatar (USPs als Antwort auf Pain Points)
  - 03 Messaging-Matrix (Hooks basieren auf Pain Points)
  - 09 Anzeigentexte (Pain Points als Hooks)
  - 12 Videoskript (Pain-Point-Zitate als Skript-Grundlage)

## HTML-Struktur

```html
<h1>Zielgruppen-Avatar</h1>
<p class="meta">[Firma] &middot; [Kampagne] &middot; [Rolle]</p>

<h2>Demografisches Profil</h2>
<ul>
  <li><strong>[Merkmal]:</strong> [Wert]</li>
  <!-- min. 5 Items -->
</ul>
<hr>

<h2>Berufliches Profil</h2>
<table>
  <tr><th>Merkmal</th><th>Detail</th></tr>
  <tr><td><strong>[Merkmal]</strong></td><td>[Detail]</td></tr>
  <!-- min. 6 Zeilen -->
</table>
<hr>

<h2>Psychografisches Profil</h2>
<ul>
  <li>[Eigenschaft/Verhalten]</li>
  <!-- min. 5 Items -->
</ul>
<hr>

<h2>Pain Points &amp; Frustrationen</h2>
<blockquote>&bdquo;[Zitat]&ldquo; -- <strong>[Label]</strong></blockquote>
<!-- min. 4 Blockquotes -->
<ul>
  <li><strong>[Thema]:</strong> [Beschreibung]</li>
  <!-- min. 2 Items -->
</ul>
<hr>

<h2>Wuensche &amp; Motivationen</h2>
<ol>
  <li><strong>[Wunsch]</strong> -- [Erklaerung]</li>
  <!-- min. 5 Items -->
</ol>
<hr>

<h2>Einwaende &amp; Bedenken</h2>
<ol>
  <li><strong>&bdquo;[Einwand-Zitat]&ldquo;</strong> -- [Erklaerung]</li>
  <!-- min. 4 Items -->
</ol>
<hr>

<h2>Entscheidungsprozess</h2>
<table>
  <tr><th>Phase</th><th>Beschreibung</th></tr>
  <tr><td><strong>[Phase]</strong></td><td>[Beschreibung]</td></tr>
  <!-- 5 Phasen -->
</table>
```

Siehe `00-design-system.md` fuer CSS-Klassen und Styling.

## Benoetigte Bausteine
| Kategorie | Felder | Verwendung |
|-----------|--------|------------|
| A. Zielgruppen-Demografie | A.1-A.8 (alle) | Demografisches Profil direkt uebernehmen |
| B. Berufliches Profil | B.1-B.8 (alle) | Berufliches Profil als Tabelle |
| C. Schmerzpunkte | C.1-C.12 (alle) | Pain Points mit Zitaten und "Schmerz hinter dem Schmerz" |
| D. Psychologie & Emotionen | D.1-D.10 (alle) | Psychografisches Profil, Entscheidungsprozess |
| E. Benefits & Wuensche | E.1-E.8 (alle) | Wuensche & Motivationen |
| F. Sprache & Wording | F.1-F.10 (alle) | Zitate realistisch formulieren, Jargon verwenden |
| G. Einwaende | G.1-G.6 (alle) | Einwaende & Bedenken Section |
| J. Markt & Trends | J.1-J.6 (Kontext) | Branchenkontext fuer Einordnung |

## Regeln
- Zitate muessen klingen wie ECHTE Gespraeche — Fachjargon, Abkuerzungen, unvollstaendige Saetze
- "Schmerz hinter dem Schmerz" bei JEDEM Pain Point angeben:
  - "Veralteter Stack" → "Angst, den Anschluss zu verlieren und auf dem Arbeitsmarkt irrelevant zu werden"
  - "Keine Remote-Option" → "Gefuehl, nicht als erwachsener Mensch behandelt zu werden"
  - "Schlechte Fuehrung" → "Kontrollverlust ueber die eigene Karriere und berufliche Entwicklung"
- Suchverhalten ist IMMER "passiv" bei Recruiting-Kampagnen (nicht aktiv auf Jobsuche)
- Genderneutral formulieren, auch wenn Branchenrealitaet benannt wird
- KEINE Marketing-Floskeln ("dynamisch", "spannend", "innovativ")
- Pain Points SPEZIFISCH: nicht "unzufrieden", sondern "6 Wochen an einem Feature gearbeitet, das nie deployed wurde"
- Psychografisches Profil: Identity Play nutzen — wie sieht sich die Person SELBST vs. wie ANDERE sie sehen
- Entscheidungsprozess: Trigger-Events konkret benennen (z.B. "Kolleg:in kuendigt", "Gehaltsverhandlung abgelehnt")
- Mindestens 6 Blockquote-Zitate (nicht nur 4)
- Einwaende muessen die ECHTEN Bedenken sein, nicht was Unternehmen denken

## Beispiel-Output
```html
<!-- Auszug Pain Points Section -->
<h2>Pain Points &amp; Frustrationen</h2>
<blockquote>&bdquo;Ich hab letzte Woche nen Fix geschrieben, der seit 3 Sprints ueberfaellig war. Ging in 2 Stunden. Aber die Review haengt jetzt seit 5 Tagen, weil niemand Zeit hat.&ldquo; -- <strong>Prozess-Frust</strong></blockquote>
<p><em>Schmerz dahinter: Das Gefuehl, dass die eigene Arbeit nicht wertgeschaetzt wird und im System versickert.</em></p>

<blockquote>&bdquo;Unser Stack ist von 2018. jQuery, PHP 7.2, kein TypeScript. Ich lern privat Next.js, aber auf der Arbeit fuehlt es sich an wie Zeitreise.&ldquo; -- <strong>Technologische Stagnation</strong></blockquote>
<p><em>Schmerz dahinter: Angst, den Anschluss zu verlieren und in 3 Jahren nicht mehr vermittelbar zu sein.</em></p>
```

## Beispiel-Prompt

```
Du bist ein erfahrener Recruiting-Stratege. Erstelle einen detaillierten Zielgruppen-Avatar fuer eine Recruiting-Kampagne.

**Unternehmen:** {{firmenname}}
**Branche:** {{branche}}
**Gesuchte Rolle:** {{rolle}}
**Senioritaet:** {{senioritaet}}
**Tech-Stack:** {{stack}}
**Standort:** {{standort}}
**Gehaltsrange:** {{gehalt}}
**Teamgroesse:** {{teamgroesse}}

**Informationen aus dem Kickoff-Gespraech:**
{{transkript_auszug}}

Erstelle den Zielgruppen-Avatar mit exakt diesen Sections:
1. Demografisches Profil (mind. 5 Merkmale als Liste)
2. Berufliches Profil (mind. 6 Zeilen als Tabelle: Merkmal | Detail)
3. Psychografisches Profil (mind. 5 Punkte als Liste)
4. Pain Points & Frustrationen (mind. 4 realistische Zitate als Blockquotes mit Label + 2 weitere Punkte)
5. Wuensche & Motivationen (mind. 5 Punkte als nummerierte Liste)
6. Einwaende & Bedenken (mind. 4 Einwaende als nummerierte Liste mit Zitat)
7. Entscheidungsprozess (5 Phasen als Tabelle: Phase | Beschreibung)

Die Zitate muessen realistisch klingen -- so wie echte {{rolle}} sprechen wuerden. Keine Marketing-Floskeln. Suchverhalten ist "passiv" (nicht aktiv auf Jobsuche). Formuliere genderneutral.

Formatiere das Ergebnis als HTML mit den CSS-Klassen aus dem Design-System (h1, h2, .meta, table, blockquote, ul, ol, hr als Section-Trenner).
```
