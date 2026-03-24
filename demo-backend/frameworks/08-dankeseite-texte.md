# Framework: Dankeseite-Texte
Dokument-Nummer: 09 (intern), 08 (Framework-Reihenfolge)

## Zweck
Die Dankeseite-Texte definieren alle Inhalte der Thank-You-Page, die nach erfolgreicher Bewerbung angezeigt wird. Sie bestaetigt den Eingang der Bewerbung, setzt klare Erwartungen fuer die naechsten Schritte und haelt den positiven Eindruck aufrecht. Die Seite ist wichtig fuer Conversion-Tracking (Pixel-Event) und reduziert Post-Bewerbungs-Unsicherheit.

## Input-Anforderungen
- **Aus vorherigen Dokumenten:**
  - 02 Arbeitgeber-Avatar: Tonalitaet, Arbeitgeberversprechen (48h-Garantie)
  - 06 Landingpage-Texte: Bewerbungsprozess (3 Schritte muessen konsistent sein)
  - 07 Formularseite-Texte: Versprechen die auf der Formularseite gemacht wurden
- **Aus dem Kickoff-Gespraech:**
  - Tatsaechlicher interner Prozess nach Bewerbungseingang
  - Wer meldet sich (Engineer, HR, Gruender?)
  - Realistische Timeline

## Pflicht-Sections

### 1. Headline
- **Inhalt:** Dank + Versprechen der persoenlichen Rueckmeldung
- **Format:** Paragraph (24px, bold, Primary Dark)
- **Minimum:** 1 Headline

### 2. Body
- **Inhalt:** Bestaetigung des Eingangs + Timeline-Garantie
- **Format:** Paragraph
- **Minimum:** 1-2 Saetze

### 3. Subline
- **Inhalt:** Vorgeschmack auf das Gespraech (Tonalitaet: auf Augenhoehe)
- **Format:** Kursiver Paragraph
- **Minimum:** 1 Satz

### 4. Naechste Schritte ("So geht es weiter")
- **Inhalt:** 3 Schritte mit Titel und Beschreibung
- **Format:** Tabelle (3 Spalten: Schritt | Titel | Beschreibung), Schrittnummern in Accent-Farbe (24px, bold)
- **Minimum:** 3 Schritte

### 5. Zurueck-Link
- **Inhalt:** Link zurueck zur Startseite
- **Format:** Accent-farbiger Link mit Pfeil-links-Symbol
- **Minimum:** 1 Link

### 6. Footer
- **Inhalt:** Rechtliche Links + Copyright
- **Format:** Paragraph (12px, grau)

## Qualitaetskriterien
- Naechste-Schritte muessen mit dem Prozess auf der Landingpage uebereinstimmen
- Timeline muss realistisch sein (nicht "sofort", wenn es 48h dauert)
- Ton muss weiterhin authentisch und auf Augenhoehe sein
- Die Seite muss Vertrauen staerken, nicht Marketing-Floskeln wiederholen
- Schritt 2 muss betonen, dass ein Engineer (kein HR) sich meldet
- Datenschutz-Links muessen vorhanden sein

## Abhaengigkeiten
- **Input von:**
  - 02 Arbeitgeber-Avatar (Tonalitaet, Versprechen)
  - 06 Landingpage-Texte (Bewerbungsprozess-Schritte)
  - 07 Formularseite-Texte (Versprechen)
- **Wird genutzt von:**
  - Steht am Ende des Funnels, keine nachfolgenden Dokumente

## HTML-Struktur

```html
<h1>Dankeseite-Texte</h1>
<p class="meta">[Firma] &middot; Thank-You Page &middot; Exakte Texte</p>

<hr>

<h2>Headline</h2>
<p style="font-size:24px; font-weight:700; color:#0a1628;">[Headline]</p>

<h2>Body</h2>
<p>[Bestaetigungstext mit Timeline]</p>

<h2>Subline</h2>
<p><em>[Vorgeschmack auf Gespraech]</em></p>

<hr>

<h2>So geht es weiter:</h2>

<table>
  <tr><th style="width:10%">Schritt</th><th style="width:30%">Titel</th><th>Beschreibung</th></tr>
  <tr>
    <td style="text-align:center; font-size:24px; font-weight:700; color:#00e5ff;">[N]</td>
    <td><strong>[Titel]</strong></td>
    <td>[Beschreibung]</td>
  </tr>
  <!-- 3 Schritte -->
</table>

<hr>

<p><strong style="color:#00e5ff;">&#8592; Zurueck zur Startseite</strong></p>

<p style="font-size:12px; color:#888;">[Rechtliche Links] | &copy; [Jahr] [Firma]</p>
```

Siehe `00-design-system.md` fuer CSS-Klassen und Styling.

## Benoetigte Bausteine
| Kategorie | Felder | Verwendung |
|-----------|--------|------------|
| E. Benefits & Wuensche | E.1-E.3 | Vorfreude auf naechste Schritte wecken |
| H. Arbeitgeber-Daten | H.9 Kultur | Ton und Erwartungsmanagement |

## Regeln
- Naechste Schritte MUESSEN mit dem Prozess auf der Landingpage EXAKT uebereinstimmen
- Timeline MUSS realistisch sein (nicht "sofort", wenn es 48h dauert)
- Schritt 2 MUSS betonen: Ein ENGINEER meldet sich, kein HR-Mensch
- Ton: Authentisch, auf Augenhoehe, kein Marketing-Speak
- Erwartungsmanagement: Konkrete Zeitangaben (48h, nicht "zeitnah")
- Die Seite MUSS Vertrauen staerken — der Kandidat hat sich gerade verwundbar gemacht
- Zurueck-Link zur Startseite PFLICHT
- Datenschutz-Links MUESSEN vorhanden sein
- KEIN "Wir melden uns so schnell wie moeglich" — stattdessen "Innerhalb von 48 Stunden"

## Beispiel-Output
```html
<!-- Auszug Naechste Schritte -->
<h2>So geht es weiter:</h2>
<table>
  <tr><th style="width:10%">Schritt</th><th style="width:30%">Titel</th><th>Beschreibung</th></tr>
  <tr>
    <td style="text-align:center; font-size:24px; font-weight:700; color:#00e5ff;">1</td>
    <td><strong>Profil-Check</strong></td>
    <td>Ein Engineer aus unserem Team schaut sich dein Profil an — kein HR-Screening, sondern jemand der deinen Stack versteht.</td>
  </tr>
  <tr>
    <td style="text-align:center; font-size:24px; font-weight:700; color:#00e5ff;">2</td>
    <td><strong>Persoenliches Gespraech</strong></td>
    <td>Innerhalb von 48 Stunden meldet sich dein zukuenftiger Teamlead persoenlich. 30 Minuten, auf Augenhoehe, keine Trick-Fragen.</td>
  </tr>
  <tr>
    <td style="text-align:center; font-size:24px; font-weight:700; color:#00e5ff;">3</td>
    <td><strong>Fachgespraech + Angebot</strong></td>
    <td>Wenn es passt: Ein kurzes technisches Gespraech und ein konkretes Angebot — innerhalb von 2 Wochen.</td>
  </tr>
</table>
```

## Beispiel-Prompt

```
Du bist ein UX-Texter. Erstelle die vollstaendigen Texte fuer eine Dankeseite (Thank-You Page) nach einer Recruiting-Schnellbewerbung.

**Unternehmen:** {{firmenname}}
**Rueckmeldung-Timeline:** {{timeline}}
**Wer meldet sich:** {{kontaktperson_rolle}}

**Bewerbungsprozess (aus Landingpage):**
{{prozess_schritte}}

**Tonalitaet (aus Arbeitgeber-Avatar):**
{{tonalitaet}}

Erstelle die Dankeseite-Texte mit exakt diesen Sections:
1. Headline (24px, bold: Dank + Versprechen persoenlicher Rueckmeldung)
2. Body (Eingangsbestaetigung + konkrete Timeline-Garantie)
3. Subline (kursiv: Vorgeschmack auf Gespraech, Betonung "auf Augenhoehe")
4. Naechste Schritte (3 Schritte als Tabelle: Schritt[Accent 24px] | Titel | Beschreibung)
   - Schritt 1: Profil wird geprueft (von wem?)
   - Schritt 2: Persoenliche Kontaktaufnahme (kein HR, sondern Engineer)
   - Schritt 3: Fachgespraech + Angebot (mit Timeline)
5. Zurueck-Link (Accent-Farbe mit Pfeil-links)
6. Footer (12px, grau: rechtliche Links + Copyright)

Die Schritte muessen exakt mit dem Prozess auf der Landingpage uebereinstimmen. Authentischer Ton.

Formatiere als HTML mit dem Design-System.
```
