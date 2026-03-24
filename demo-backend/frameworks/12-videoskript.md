# Framework: Videoskript
Dokument-Nummer: 13 (intern), 12 (Framework-Reihenfolge)

## Zweck
Das Videoskript liefert ein vollstaendiges, produktionsbereites Skript fuer ein 60-Sekunden-Recruiting-Video (Talking Head + Screen Recording). Es definiert jeden Zeitabschnitt mit visueller Anweisung, Voiceover-Text und On-Screen-Text. Zusaetzlich enthaelt es technische Produktionshinweise (Musik, Schnitt, Farbkorrektur, Untertitel, Aspect Ratios).

## Input-Anforderungen
- **Aus vorherigen Dokumenten:**
  - 01 Zielgruppen-Avatar: Haupt-Pain-Point (Hook + Problem-Teil)
  - 02 Arbeitgeber-Avatar: USPs, Teamgroesse, Stack (Loesung-Teil), Benefits (Proof-Teil)
  - 03 Messaging-Matrix: Hook-Bibliothek (bester Hook fuer Video), Kernbotschaft
  - 04 Creative Briefing: Farbpalette, Bildsprache (visuelle Anweisungen)
- **Aus dem Kickoff-Gespraech:**
  - Wer spricht im Video (Rolle, Name)
  - Vorhandenes Videomaterial oder Drehorte
  - Gewuenschte Stimmung

## Pflicht-Sections

### 1. Video-Uebersicht (Header-Tabelle)
- **Inhalt:** Format, Sprecher, Stimmung, Laenge
- **Format:** Tabelle (2 Spalten: Detail | Beschreibung)
- **Minimum:** 4 Zeilen

### 2. [0:00-0:05] HOOK
- **Inhalt:** Visuelle Anweisung + On-Screen-Text (2 Saetze mit Beat/Pause)
- **Format:** h2 mit Timecode, kursive Regieanweisung, Highlight-Box mit Text (20px, bold)
- **Minimum:** 2 Saetze mit dramatischer Pause

### 3. [0:05-0:15] PROBLEM
- **Inhalt:** Visuelle Anweisung + Voiceover (Pain Point der Zielgruppe)
- **Format:** h2 mit Timecode, kursive Regieanweisung, h3 "Voiceover", Blockquote
- **Minimum:** 4-5 Zeilen Voiceover

### 4. [0:15-0:25] WENDEPUNKT
- **Inhalt:** Visuelle Anweisung + Voiceover (Uebergang zur Loesung)
- **Format:** h2 mit Timecode, kursive Regieanweisung, h3 "Voiceover", Blockquote
- **Minimum:** 3-4 Zeilen Voiceover

### 5. [0:25-0:40] LOESUNG
- **Inhalt:** Visuelle Anweisung (Team-Shots) + Voiceover (USPs und Stack)
- **Format:** h2 mit Timecode, kursive Regieanweisung, h3 "Voiceover", Blockquote
- **Minimum:** 5-6 Zeilen Voiceover

### 6. [0:40-0:50] PROOF
- **Inhalt:** Visuelle Anweisung (Zahlen eingeblendet) + Voiceover (Benefits)
- **Format:** h2 mit Timecode, kursive Regieanweisung, h3 "Voiceover", Blockquote
- **Minimum:** 4-5 Zeilen Voiceover (konkrete Zahlen)

### 7. [0:50-0:60] CTA
- **Inhalt:** Visuelle Anweisung (Logo + Link), On-Screen-Text, Voiceover (Abschluss)
- **Format:** h2 mit Timecode, kursive Regieanweisung, h3 "Text auf Screen" in Highlight-Box, h3 "Voiceover" in Blockquote, End Card Vermerk
- **Minimum:** 3 On-Screen-Texte + 3 Zeilen Voiceover

### 8. Technische Hinweise
- **Inhalt:** Musik, Schnittrhythmus, Farbkorrektur, Untertitel, Aspect Ratios
- **Format:** Tabelle (2 Spalten: Element | Spezifikation)
- **Minimum:** 5 Zeilen

## Qualitaetskriterien
- Gesamtlaenge muss realistisch in 60 Sekunden sprechbar sein
- Hook muss in den ersten 3 Sekunden Aufmerksamkeit fangen (Scroll-Stopper)
- Voiceover muss natuerlich klingen (nicht vorgelesen)
- Visuelle Anweisungen muessen umsetzbar sein
- PROBLEM-Teil muss den Haupt-Pain-Point der Zielgruppe spiegeln
- PROOF-Teil muss konkrete Zahlen enthalten (Urlaub, Budget, etc.)
- CTA muss die URL / den Bewerbungslink zeigen
- Aspect Ratios fuer alle relevanten Plattformen (9:16, 1:1, 16:9)

## Abhaengigkeiten
- **Input von:**
  - 01 Zielgruppen-Avatar (Pain Points fuer PROBLEM)
  - 02 Arbeitgeber-Avatar (USPs fuer LOESUNG, Benefits fuer PROOF)
  - 03 Messaging-Matrix (Hook, Kernbotschaft)
  - 04 Creative Briefing (Bildsprache, Farbpalette)
- **Wird genutzt von:**
  - Kann als Warmup-Content in Kampagne 11 (Warmup) eingesetzt werden

## HTML-Struktur

```html
<h1>Videoskript: &bdquo;[Titel]&ldquo;</h1>
<p class="meta">[Firma] &middot; 60-Sekunden Recruiting Video &middot; [Format]</p>

<table>
  <tr><th>Detail</th><th>Beschreibung</th></tr>
  <tr><td><strong>Format</strong></td><td>[z.B. Talking Head + Screen Recording]</td></tr>
  <tr><td><strong>Sprecher</strong></td><td>[Rolle, Authentizitaets-Vermerk]</td></tr>
  <tr><td><strong>Stimmung</strong></td><td>[z.B. Ehrlich, ruhig, technisch]</td></tr>
  <tr><td><strong>Laenge</strong></td><td>[z.B. 60 Sekunden]</td></tr>
</table>
<hr>

<h2>[0:00-0:05] HOOK</h2>
<p><em>([Visuelle Anweisung])</em></p>
<div class="highlight">
  <p style="font-size:20px; font-weight:700;">&bdquo;[Hook-Zeile 1]&ldquo;</p>
  <p><em>(Beat)</em></p>
  <p style="font-size:20px; font-weight:700;">&bdquo;[Hook-Zeile 2]&ldquo;</p>
</div>
<hr>

<h2>[0:05-0:15] PROBLEM</h2>
<p><em>([Visuelle Anweisung])</em></p>
<h3>Voiceover:</h3>
<blockquote>
&bdquo;[Voiceover-Text Zeile 1]<br>
[Zeile 2]<br>
[Zeile 3]<br>
[Zeile 4]&ldquo;
</blockquote>
<hr>

<h2>[0:15-0:25] WENDEPUNKT</h2>
<p><em>([Visuelle Anweisung])</em></p>
<h3>Voiceover:</h3>
<blockquote>
&bdquo;[Voiceover-Text]&ldquo;
</blockquote>
<hr>

<h2>[0:25-0:40] LOESUNG</h2>
<p><em>([Visuelle Anweisung])</em></p>
<h3>Voiceover:</h3>
<blockquote>
&bdquo;[Voiceover-Text mit USPs und Stack]&ldquo;
</blockquote>
<hr>

<h2>[0:40-0:50] PROOF</h2>
<p><em>([Visuelle Anweisung])</em></p>
<h3>Voiceover:</h3>
<blockquote>
&bdquo;[Voiceover-Text mit konkreten Zahlen]&ldquo;
</blockquote>
<hr>

<h2>[0:50-0:60] CTA</h2>
<p><em>([Visuelle Anweisung])</em></p>
<h3>Text auf Screen:</h3>
<div class="highlight">
  <p style="font-size:18px; font-weight:700;">[Rolle gesucht]</p>
  <p style="font-size:16px;">[CTA-Text]</p>
  <p style="color:#00e5ff; font-weight:600;">[URL]</p>
</div>
<h3>Voiceover:</h3>
<blockquote>
&bdquo;[Abschluss-Voiceover]&ldquo;
</blockquote>
<p><em>(End Card: [Firma] Logo)</em></p>
<hr>

<h2>Technische Hinweise</h2>
<table>
  <tr><th>Element</th><th>Spezifikation</th></tr>
  <tr><td><strong>Musik</strong></td><td>[Stil]</td></tr>
  <tr><td><strong>Schnittrhythmus</strong></td><td>[Beschreibung]</td></tr>
  <tr><td><strong>Farbkorrektur</strong></td><td>[Beschreibung]</td></tr>
  <tr><td><strong>Untertitel</strong></td><td>[Format]</td></tr>
  <tr><td><strong>Aspect Ratios</strong></td><td>[Formate]</td></tr>
</table>
```

Siehe `00-design-system.md` fuer CSS-Klassen und Styling.

## Benoetigte Bausteine
| Kategorie | Felder | Verwendung |
|-----------|--------|------------|
| C. Schmerzpunkte | C.1-C.3 | HOOK + PROBLEM: Haupt-Pain-Point als Scroll-Stopper |
| D. Psychologie & Emotionen | D.1-D.4 | Emotionaler Wendepunkt |
| H. Arbeitgeber-Daten | H.1-H.6 | LOESUNG: USPs und Stack |
| I. Messaging | I.2-I.6 Hooks | HOOK: Bester Hook aus Bibliothek |
| E. Benefits & Wuensche | E.1-E.3 (Kontext) | PROOF: Konkrete Benefits mit Zahlen |
| F. Sprache & Wording | F.1-F.2 | Natuerlicher Sprechrhythmus, Fachwoerter |

## Regeln
- Gesamtlaenge: EXAKT 60 Sekunden — Text muss realistisch sprechbar sein
- HOOK (0-5s): Scroll-Stopper, muss in 3 Sekunden Aufmerksamkeit fangen
  - Schwarzer Bildschirm + weisse Schrift
  - 2 kurze Saetze mit dramatischer Pause (Beat)
  - KEIN Logo am Anfang (erst am Ende)
- PROBLEM (5-15s): Pain Point der Zielgruppe spiegeln
  - Voiceover muss klingen wie ein ECHTES Gespraech, nicht vorgelesen
  - Konkrete Situation beschreiben, nicht abstrakt
- WENDEPUNKT (15-25s): Emotionaler Shift bei Sekunde 15-20
  - Von Problem zu Loesung — nicht abrupt, sondern als natuerlicher Gedanke
  - "Stell dir vor..." oder "Was waere, wenn..."
- LOESUNG (25-40s): USPs und Stack konkret benennen
  - Visuelle Unterstuetzung: Team-Shots, Code-Bildschirme
  - Zahlen und Fakten, keine Adjektive
- PROOF (40-50s): Konkrete Benefits mit Zahlen
  - Zahlen auf Screen einblenden
  - Urlaub, Gehalt, Remote, Budget — konkret
- CTA (50-60s): URL + Link + Logo
  - "Kein Lebenslauf" auf Screen
  - End Card mit Logo
- Technische Hinweise MUESSEN enthalten:
  - Musik: Lo-fi/Ambient (lizenzfrei)
  - Untertitel: PFLICHT (85% schauen ohne Ton)
  - Aspect Ratios: 9:16 (Story/Reels), 1:1 (Feed), 16:9 (YouTube)
  - Farbkorrektur: Zur Markenfarbe passend

## Beispiel-Output
```html
<!-- Auszug HOOK -->
<h2>[0:00-0:05] HOOK</h2>
<p><em>(Schwarzer Bildschirm. Weisse Schrift. Kein Logo.)</em></p>
<div class="highlight">
  <p style="font-size:20px; font-weight:700;">&bdquo;Du bist Entwickler.&ldquo;</p>
  <p><em>(Beat — 1.5 Sekunden Stille)</em></p>
  <p style="font-size:20px; font-weight:700;">&bdquo;Aber wann hast du das letzte Mal wirklich entwickelt?&ldquo;</p>
</div>

<!-- Auszug Technische Hinweise -->
<h2>Technische Hinweise</h2>
<table>
  <tr><th>Element</th><th>Spezifikation</th></tr>
  <tr><td><strong>Musik</strong></td><td>Lo-fi Ambient, leise unter Voiceover, lauter in Transitions</td></tr>
  <tr><td><strong>Untertitel</strong></td><td>PFLICHT — Weiss auf halbtransparentem schwarzen Balken, max. 2 Zeilen</td></tr>
  <tr><td><strong>Aspect Ratios</strong></td><td>9:16 (Instagram Story/Reels, TikTok), 1:1 (Feed), 16:9 (YouTube Pre-Roll)</td></tr>
</table>
```

## Beispiel-Prompt

```
Du bist ein Video-Creative-Director fuer Recruiting-Kampagnen. Erstelle ein vollstaendiges 60-Sekunden-Videoskript.

**Unternehmen:** {{firmenname}}
**Rolle gesucht:** {{rolle}}
**Sprecher:** {{sprecher_rolle}}
**Stack:** {{stack}}

**Haupt-Pain-Point (aus Zielgruppen-Avatar):**
{{haupt_pain_point_mit_zitat}}

**USPs (aus Arbeitgeber-Avatar):**
{{usps}}

**Benefits (aus Arbeitgeber-Avatar):**
{{benefits_mit_zahlen}}

**Bester Hook (aus Messaging-Matrix):**
{{hook}}

**Bildsprache (aus Creative Briefing):**
{{bildsprache_regeln}}

**Bewerbungs-URL:** {{url}}

Erstelle das Videoskript mit exakt diesen Sections:

1. **Header-Tabelle** (Format, Sprecher, Stimmung, Laenge)
2. **[0:00-0:05] HOOK** (Schwarzer Bildschirm + weisse Schrift, 2 Saetze mit Beat/Pause, in Highlight-Box 20px bold)
3. **[0:05-0:15] PROBLEM** (Regieanweisung kursiv + Voiceover in Blockquote, 4-5 Zeilen, Pain Point)
4. **[0:15-0:25] WENDEPUNKT** (Screen Recording + Voiceover, Uebergang zur Loesung)
5. **[0:25-0:40] LOESUNG** (Team-Shots + Voiceover mit USPs und Stack, 5-6 Zeilen)
6. **[0:40-0:50] PROOF** (Zahlen eingeblendet + Voiceover mit konkreten Benefits)
7. **[0:50-0:60] CTA** (Logo + URL, Text auf Screen in Highlight-Box, Voiceover-Abschluss, End Card)
8. **Technische Hinweise** (Tabelle: Musik, Schnitt, Farbkorrektur, Untertitel, Aspect Ratios)

Voiceover muss natuerlich klingen -- wie ein Gespraech, nicht wie ein Skript. Gesamttext muss realistisch in 60 Sekunden sprechbar sein.

Formatiere als HTML mit dem Design-System.
```
