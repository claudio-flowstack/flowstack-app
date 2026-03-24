# Framework: Anzeigentexte Hauptkampagne
Dokument-Nummer: 10 (intern), 09 (Framework-Reihenfolge)

## Zweck
Dieses Dokument liefert die vollstaendigen Anzeigentexte (Primary Text + Headline) fuer die Hauptkampagne (Meta Ads). Es enthaelt mindestens 3 Anzeigenvarianten, die verschiedene Message Angles abdecken, sowie eine Tabelle mit Headline-Variationen fuer A/B-Testing. Die Texte sind einsatzbereit fuer den Ads Manager.

## Input-Anforderungen
- **Aus vorherigen Dokumenten:**
  - 01 Zielgruppen-Avatar: Pain Points (Hooks), Zitate (Opener)
  - 02 Arbeitgeber-Avatar: USPs (Solution-Teil), Benefits, Teamgroesse, Stack
  - 03 Messaging-Matrix: Message Angles (Struktur), Hook-Bibliothek (Opener), CTAs (Closer), Tonalitaets-Profil
  - 05 Marken-Richtlinien: Verbotene Begriffe
- **Aus dem Kickoff-Gespraech:**
  - Stellenbezeichnung
  - Standort / Remote-Policy
  - Gehaltsrange (falls kommuniziert)

## Pflicht-Sections

### 1-3. Anzeigenvarianten (je eigene h2-Section)
- **Inhalt:** Pro Variante: Primaertext + Headline
- **Format:**
  - h2 mit Varianten-Nummer und Angle-Name
  - h3 "Primaertext" + Highlight-Box mit dem vollstaendigen Anzeigentext
  - h3 "Headline" + bold Paragraph
- **Minimum:** 3 Varianten mit unterschiedlichen Angles
- **Struktur jedes Primaertexts:**
  1. Hook (1-2 Zeilen, emotional)
  2. Problem-Verstaerkung (3-5 Zeilen)
  3. Wende/Solution (3-5 Zeilen mit konkreten USPs)
  4. Faktenliste (Rolle, Remote, Vertrag)
  5. CTA (niedrigschwellig, 1-2 Zeilen)
- **Formatierung:** Zeilenumbrueche nach jedem Gedanken (`<br>`), kurze Absaetze (`<p>`)

### 4. Headline-Variationen
- **Inhalt:** 8-10 Headlines mit Angle-Zuordnung
- **Format:** Tabelle (3 Spalten: # | Headline | Angle)
- **Minimum:** 8 Headlines

## Qualitaetskriterien
- Jede Variante muss einen anderen Angle haben (z.B. Identitaetsverlust, Stagnation, Social Proof)
- Primaertexte muessen dem Meta-Ads-Rhythmus folgen: kurze Zeilen, Zeilenumbrueche, keine langen Absaetze
- Hooks muessen in den ersten 2 Zeilen greifen (Above-the-Fold im Ad)
- CTAs muessen die Huerden senken ("60 Sekunden", "kein CV")
- Keine verbotenen Begriffe aus den Marken-Richtlinien
- Headlines muessen kurz und praegnant sein (unter 40 Zeichen ideal)
- Social-Proof-Variante muss eine konkrete (fiktive) Person beschreiben

## Abhaengigkeiten
- **Input von:**
  - 01 Zielgruppen-Avatar (Pain Points)
  - 02 Arbeitgeber-Avatar (USPs, Benefits)
  - 03 Messaging-Matrix (Angles, Hooks, CTAs, Tonalitaet)
  - 05 Marken-Richtlinien (verbotene Begriffe)
- **Wird genutzt von:**
  - 10 Anzeigentexte Retargeting (gleiche Struktur, anderer Fokus)
  - 11 Anzeigentexte Warmup (gleiche Struktur, weicherer Ton)

## HTML-Struktur

```html
<h1>Anzeigentexte -- Hauptkampagne</h1>
<p class="meta">[Firma] &middot; Meta Ads &middot; [N] Varianten + Headline-Variationen</p>

<hr>

<!-- Fuer jede Variante: -->
<h2>VARIANTE [N] -- &bdquo;[Angle-Name]&ldquo;</h2>

<h3>Primaertext</h3>
<div class="highlight">
<p>[Hook-Zeile 1]<br>
[Hook-Zeile 2]</p>

<p>[Problem-Zeile 1]<br>
[Problem-Zeile 2]<br>
[Problem-Zeile 3]</p>

<p>[Wende/Intro]</p>

<p>[Solution-Zeile 1]<br>
[Solution-Zeile 2]<br>
[Solution-Zeile 3]</p>

<p>[Fakten: Rolle, Remote, Vertrag]</p>

<p>[CTA-Zeile 1]<br>
[CTA-Zeile 2]</p>
</div>

<h3>Headline</h3>
<p><strong>[Headline-Text]</strong></p>

<hr>
<!-- min. 3 Varianten -->

<h2>Headline-Variationen</h2>
<table>
  <tr><th>#</th><th>Headline</th><th>Angle</th></tr>
  <tr><td>[N]</td><td>[Headline]</td><td>[Angle]</td></tr>
  <!-- min. 8 Zeilen -->
</table>
```

Siehe `00-design-system.md` fuer CSS-Klassen und Styling.

## Benoetigte Bausteine
| Kategorie | Felder | Verwendung |
|-----------|--------|------------|
| C. Schmerzpunkte | C.1-C.12 (alle) | Hooks, Problem-Verstaerkung |
| F. Sprache & Wording | F.1-F.3 | Jargon in Hooks, verbotene Woerter vermeiden |
| H. Arbeitgeber-Daten | H.1-H.6, H.7 | USPs fuer Solution-Teil |
| I. Messaging | I.1-I.9 | Kernbotschaft, Hooks, CTAs direkt nutzen |
| D. Psychologie & Emotionen | D.1-D.6 (Kontext) | Emotionale Trigger fuer verschiedene Angles |
| G. Einwaende | G.1-G.6 (Kontext) | Social-Proof-Variante muss Einwaende adressieren |

## Regeln
- Primaertext: 300-500 Zeichen (Langform fuer Conversion, NICHT kuerzer)
- Headline: 25-35 Zeichen (MAXIMUM 40)
- 3 Varianten mit VERSCHIEDENEN Copywriting-Frameworks:
  1. PAS (Problem-Agitation-Solution) — Loss Aversion, Schmerz verstaerken
  2. Story-driven (Persona-basiert) — Social Proof + Identity Play, fiktive Person mit Name/Alter/Situation
  3. Anti-Corporate / Provokation — Pattern Interrupt + Identity, provokanter Ton
- Hook MUSS in 2 Zeilen greifen (wird im Feed abgeschnitten bei 125 Zeichen)
- Loss Aversion > Benefits: IMMER erst Schmerz, DANN Loesung
- Zeilenumbruch nach JEDEM Gedanken (Facebook Scroll-Pattern)
- Mindestens 1 konkretes Zitat aus Baustein C
- Fachwoerter aus Baustein F.2 MUESSEN vorkommen
- Woerter aus Baustein F.3 DUERFEN NICHT vorkommen
- CTA: "In 60 Sekunden" / "Kein Lebenslauf" / "Unverbindlich"
- Social-Proof-Variante: Fiktive Person mit Name, Alter, vorherigem Job, konkreter Situation
- KEINE Ausrufezeichen-Inflation
- KEINE generischen Floskeln ("Spannende Aufgaben", "Wir suchen dich", "Dynamisches Team")
- Meta Ads Rhythmus: Kurze Saetze. Einzelne Worte als Absatz. Zeilenumbrueche nach jedem Gedanken.

## Beispiel-Output
```html
<!-- Auszug Variante 1: PAS -->
<h2>VARIANTE 1 -- &bdquo;Identitaetsverlust&ldquo;</h2>
<h3>Primaertext</h3>
<div class="highlight">
<p>Du bist Entwickler.<br>
Aber wann hast du das letzte Mal wirklich entwickelt?</p>

<p>Meetings. Ticket-Verwaltung. Legacy-Wartung.<br>
Dein Code verschwindet in Review-Schleifen.<br>
Features, die nie live gehen.</p>

<p>Stell dir vor, dein Code waere in 2 Stunden in Produktion.</p>

<p>Bei [Firma]:<br>
47 Deployments im Monat.<br>
TypeScript, Next.js, Feature Flags.<br>
Dein Code geht live — nicht in die Schublade.</p>

<p>Senior [Rolle] &middot; Remote moeglich &middot; Unbefristet</p>

<p>60 Sekunden. Kein Lebenslauf.<br>
Finde raus, ob wir matchen.</p>
</div>

<h3>Headline</h3>
<p><strong>Code schreiben, der live geht.</strong></p>
```

## Beispiel-Prompt

```
Du bist ein Performance-Marketing-Texter fuer Meta Ads (Facebook/Instagram). Erstelle die Anzeigentexte fuer die Hauptkampagne einer Recruiting-Kampagne.

**Unternehmen:** {{firmenname}}
**Rolle:** {{rolle}}
**Standort/Remote:** {{standort}}
**Gehaltsrange:** {{gehalt}} (falls kommuniziert)

**Pain Points (aus Zielgruppen-Avatar):**
{{pain_points_mit_zitaten}}

**USPs (aus Arbeitgeber-Avatar):**
{{usps}}

**Message Angles (aus Messaging-Matrix):**
{{message_angles}}

**Hook-Bibliothek (aus Messaging-Matrix):**
{{hooks}}

**CTAs (aus Messaging-Matrix):**
{{ctas}}

**Verbotene Begriffe (aus Marken-Richtlinien):**
{{verbotene_begriffe}}

Erstelle die Anzeigentexte mit exakt dieser Struktur:

**3 Varianten**, jeweils:
- h2 mit Varianten-Nummer und Angle-Name in Anfuehrungszeichen
- Primaertext in Highlight-Box mit dieser Struktur:
  1. Hook (1-2 Zeilen, emotional, muss sofort greifen)
  2. Problem-Verstaerkung (3-5 Zeilen, konkret)
  3. Wende/Solution (3-5 Zeilen mit USPs)
  4. Fakten (Rolle, Remote, Vertrag)
  5. CTA (niedrigschwellig)
- Formatierung: Jede Zeile als eigener Gedanke, <br> fuer Umbrueche, kurze <p>-Absaetze
- Headline (bold, unter 40 Zeichen)

**Varianten-Angles:**
1. [z.B. Identitaetsverlust / Ticket-Schubser]
2. [z.B. Stagnation]
3. [z.B. Social Proof mit konkreter fiktiver Person]

**Headline-Variationen:** min. 8 als Tabelle (# | Headline | Angle)

Meta-Ads-Rhythmus: Kurze Saetze. Einzelne Worte als Absatz. Zeilenumbrueche nach jedem Gedanken.

Formatiere als HTML mit dem Design-System.
```
