# Framework: Messaging-Matrix
Dokument-Nummer: 04 (intern), 03 (Framework-Reihenfolge)

## Zweck
Die Messaging-Matrix definiert die zentrale Kommunikationsstrategie: eine Kernbotschaft, unterstuetzende Botschaften, mehrere Message Angles (jeweils mit Hook-Problem-Solution-CTA), eine Hook-Bibliothek, CTA-Varianten und ein Tonalitaets-Profil. Dieses Dokument ist die operative Grundlage fuer alle Anzeigentexte, Landingpage-Texte und Video-Skripte.

## Input-Anforderungen
- **Aus vorherigen Dokumenten:**
  - 01 Zielgruppen-Avatar: Pain Points (werden zu Message Angles), Zitate (werden zu Hooks), Einwaende (werden zu Retargeting-Angles)
  - 02 Arbeitgeber-Avatar: USPs (werden zu Solutions), Kernpositionierung (wird zu Kernbotschaft), Tonalitaet
- **Aus dem Kickoff-Gespraech:**
  - Welche Emotionen sollen angesprochen werden
  - Bewerbungsprozess-Details (fuer CTAs)

## Pflicht-Sections

### 1. Kernbotschaft
- **Inhalt:** Ein einziger praegnanter Satz, der die gesamte Kampagne zusammenfasst
- **Format:** Highlight-Box mit grossem Text (font-size: 20px)
- **Minimum:** 1 Satz

### 2. Unterstuetzende Botschaften
- **Inhalt:** 3-5 Sub-Botschaften, die die Kernbotschaft aus verschiedenen Blickwinkeln stuetzen
- **Format:** Geordnete Liste
- **Minimum:** 4 Botschaften

### 3. Message Angles (je ein eigener h2-Block)
- **Inhalt:** Pro Angle eine Tabelle mit Hook, Problem, Solution, CTA
- **Format:** Tabelle (2 Spalten: Element | Inhalt), jeweils eigene h2-Section
- **Minimum:** 5 Message Angles
- **Typische Angles:** Identitaetsverlust, Stagnation, Feature-Friedhof, Social Proof, Anti-Corporate

### 4. Hook-Bibliothek
- **Inhalt:** 12-15 Hooks mit zugehoerigem Angle und Emotion
- **Format:** Tabelle (4 Spalten: # | Hook | Angle | Emotion)
- **Minimum:** 12 Hooks

### 5. CTA-Varianten
- **Inhalt:** 4-6 CTA-Texte mit Kontext und Staerke
- **Format:** Tabelle (3 Spalten: CTA | Kontext | Staerke)
- **Minimum:** 4 CTAs

### 6. Tonalitaets-Profil
- **Inhalt:** Stimme, Ton, Rhythmus, Sprache, Formatierung
- **Format:** Tabelle (2 Spalten: Dimension | Auspraegung)
- **Minimum:** 5 Dimensionen

## Qualitaetskriterien
- Kernbotschaft muss in einem Satz die gesamte Kampagne kommunizieren
- Hooks muessen emotional triggern -- Provokation, Angst, Frustration, Neugier, Humor
- Jeder Message Angle muss einem spezifischen Pain Point aus dem Zielgruppen-Avatar entsprechen
- Solutions muessen direkt auf USPs des Arbeitgeber-Avatars referenzieren
- CTAs muessen niedrigschwellig sein (60 Sekunden, kein CV)
- Hook-Bibliothek muss verschiedene Emotionen abdecken (nicht nur Frustration)
- Tonalitaets-Profil muss den Rhythmus definieren (kurze Saetze, Zeilenumbrueche)

## Abhaengigkeiten
- **Input von:**
  - 01 Zielgruppen-Avatar (Pain Points -> Angles, Zitate -> Hooks)
  - 02 Arbeitgeber-Avatar (USPs -> Solutions, Tonalitaet -> Tonalitaets-Profil)
- **Wird genutzt von:**
  - 06 Landingpage-Texte (Hooks, CTAs, Tonalitaet)
  - 09 Anzeigentexte Hauptkampagne (Message Angles direkt uebernommen)
  - 10 Anzeigentexte Retargeting (Einwand-Behandlung als Angle)
  - 11 Anzeigentexte Warmup (Awareness-Angles)
  - 12 Videoskript (Hook + Problem + Solution Struktur)

## HTML-Struktur

```html
<h1>Messaging-Matrix</h1>
<p class="meta">[Firma] &middot; Messaging Framework &middot; [Rolle]</p>

<h2>Kernbotschaft</h2>
<div class="highlight">
  <strong style="font-size:20px; color:#0a1628;">&bdquo;[Kernbotschaft]&ldquo;</strong>
</div>

<h2>Unterstuetzende Botschaften</h2>
<ol>
  <li>&bdquo;[Botschaft]&ldquo;</li>
  <!-- min. 4 Items -->
</ol>
<hr>

<!-- Fuer jeden Message Angle: -->
<h2>Message Angle [N]: [Name]</h2>
<table>
  <tr><th style="width:20%">Element</th><th>Inhalt</th></tr>
  <tr><td><strong>Hook</strong></td><td>&bdquo;[Hook-Text]&ldquo;</td></tr>
  <tr><td><strong>Problem</strong></td><td>[Problem-Beschreibung]</td></tr>
  <tr><td><strong>Solution</strong></td><td>[Solution mit USP-Bezug]</td></tr>
  <tr><td><strong>CTA</strong></td><td>&bdquo;[CTA-Text]&ldquo;</td></tr>
</table>
<!-- min. 5 Angles -->

<hr>

<h2>Hook-Bibliothek</h2>
<table>
  <tr><th>#</th><th>Hook</th><th>Angle</th><th>Emotion</th></tr>
  <tr><td>[N]</td><td>[Hook-Text]</td><td>[Angle-Name]</td><td>[Emotion]</td></tr>
  <!-- min. 12 Zeilen -->
</table>

<hr>

<h2>CTA-Varianten</h2>
<table>
  <tr><th>CTA</th><th>Kontext</th><th>Staerke</th></tr>
  <tr><td><strong>[CTA-Text]</strong></td><td>[Kontext]</td><td>[Staerke]</td></tr>
  <!-- min. 4 Zeilen -->
</table>

<hr>

<h2>Tonalitaets-Profil</h2>
<table>
  <tr><th>Dimension</th><th>Auspraegung</th></tr>
  <tr><td><strong>[Dimension]</strong></td><td>[Beschreibung]</td></tr>
  <!-- 5 Dimensionen: Stimme, Ton, Rhythmus, Sprache, Formatierung -->
</table>
```

Siehe `00-design-system.md` fuer CSS-Klassen und Styling.

## Benoetigte Bausteine
| Kategorie | Felder | Verwendung |
|-----------|--------|------------|
| C. Schmerzpunkte | C.1-C.12 (alle) | Jeder Message Angle adressiert einen Pain Point |
| D. Psychologie & Emotionen | D.1-D.10 (alle) | Emotionen fuer Hook-Bibliothek |
| F. Sprache & Wording | F.1-F.10 (alle) | Tonalitaetsprofil, Jargon in Hooks |
| H. Arbeitgeber-Daten | H.1-H.10 (alle) | Solutions referenzieren USPs |
| I. Messaging | I.1-I.10 (alle) | Kernbotschaft, Hooks, CTAs direkt uebernehmen |
| E. Benefits & Wuensche | E.1-E.8 (Kontext) | Benefits fuer Solution-Teile |
| G. Einwaende | G.1-G.6 (Kontext) | Retargeting-Angles vorbereiten |

## Regeln
- Kernbotschaft: 1 Satz, maximal 15 Woerter, muss Loss Aversion triggern
- Hooks MUESSEN in unter 125 Zeichen emotional triggern (Above-the-Fold im Meta Ads Feed)
- Hook-Emotionen VARIIEREN — nicht nur Frustration, sondern auch:
  - Provokation, Angst, FOMO, Neugier, Humor, Erleichterung, Stolz
- Mindestens 15 Hooks (nicht nur 12)
- Jeder Message Angle: Hook → Problem → Solution → CTA (vollstaendige Kette)
- Solutions MUESSEN direkt auf USPs aus Baustein H referenzieren
- CTAs niedrigschwellig: "60 Sekunden", "Kein Lebenslauf", "Unverbindlich"
- Tonalitaetsprofil: 5 Dimensionen (Stimme, Ton, Rhythmus, Sprache, Formatierung)
- Mindestens 6 Message Angles (nicht nur 5)
- Hook-Bibliothek: Jeder Hook muss unter 125 Zeichen sein

## Beispiel-Output
```html
<!-- Auszug Message Angle -->
<h2>Message Angle 1: Identitaetsverlust</h2>
<table>
  <tr><th style="width:20%">Element</th><th>Inhalt</th></tr>
  <tr><td><strong>Hook</strong></td><td>&bdquo;Du bist Entwickler. Aber wann hast du das letzte Mal wirklich entwickelt?&ldquo;</td></tr>
  <tr><td><strong>Problem</strong></td><td>Meetings, Ticket-Verwaltung, Legacy-Wartung. Dein Code verschwindet in endlosen Review-Schleifen. Du bist zum Verwalter geworden.</td></tr>
  <tr><td><strong>Solution</strong></td><td>Bei [Firma]: CI/CD mit Feature Flags, 47 Deployments/Monat. Dein Code geht live — nicht in die Schublade.</td></tr>
  <tr><td><strong>CTA</strong></td><td>&bdquo;60 Sekunden. Kein Lebenslauf. Finde raus, ob wir matchen.&ldquo;</td></tr>
</table>

<!-- Auszug Hook-Bibliothek -->
<table>
  <tr><th>#</th><th>Hook</th><th>Angle</th><th>Emotion</th></tr>
  <tr><td>1</td><td>&bdquo;Du bist kein Ticket-Schubser.&ldquo;</td><td>Identitaet</td><td>Provokation</td></tr>
  <tr><td>2</td><td>&bdquo;Dein letztes Feature? Deployed in... nie.&ldquo;</td><td>Stagnation</td><td>Frustration</td></tr>
  <tr><td>3</td><td>&bdquo;Lisa hat 4 Jahre gezweifelt. Dann 60 Sekunden investiert.&ldquo;</td><td>Social Proof</td><td>Neugier</td></tr>
</table>
```

## Beispiel-Prompt

```
Du bist ein Messaging-Stratege fuer Recruiting-Kampagnen. Erstelle eine vollstaendige Messaging-Matrix.

**Unternehmen:** {{firmenname}}
**Rolle:** {{rolle}}

**Pain Points der Zielgruppe (aus Zielgruppen-Avatar):**
{{pain_points_mit_zitaten}}

**USPs des Arbeitgebers (aus Arbeitgeber-Avatar):**
{{usps}}

**Kernpositionierung:**
{{kernpositionierung}}

**Tonalitaet:**
{{tonalitaet_regeln}}

**Bewerbungsprozess:**
{{bewerbungsprozess_details}}

Erstelle die Messaging-Matrix mit exakt diesen Sections:
1. Kernbotschaft (1 praegnanter Satz in Highlight-Box, font-size 20px)
2. Unterstuetzende Botschaften (min. 4 als nummerierte Liste)
3. Message Angles (min. 5, jeweils als eigene h2-Section mit Tabelle: Hook | Problem | Solution | CTA)
   - Jeder Angle adressiert einen spezifischen Pain Point
   - Solutions referenzieren USPs
4. Hook-Bibliothek (min. 12 Hooks als Tabelle: # | Hook | Angle | Emotion)
   - Emotionen variieren: Provokation, Angst, Frustration, Neugier, Humor, FOMO, Erleichterung
5. CTA-Varianten (min. 4 als Tabelle: CTA | Kontext | Staerke)
   - CTAs muessen niedrigschwellig sein (60 Sek, kein CV)
6. Tonalitaets-Profil (5 Dimensionen als Tabelle: Dimension | Auspraegung)
   - Dimensionen: Stimme, Ton, Rhythmus, Sprache, Formatierung

Hooks muessen emotional triggern. Kurze Saetze. Entwickler-Jargon wo passend.

Formatiere als HTML mit dem Design-System (h1, h2, .meta, .highlight, table, ol, hr).
```
