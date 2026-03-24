# Framework: Formularseite-Texte
Dokument-Nummer: 08 (intern), 07 (Framework-Reihenfolge)

## Zweck
Die Formularseite-Texte definieren alle Texte fuer das Bewerbungsformular (Schnellbewerbung). Das Dokument beschreibt Header, Titel, Intro-Bereich, alle Formularfelder mit Optionen und Validierungsregeln sowie Button und Footer. Es ist so detailliert, dass ein Frontend-Entwickler das Formular 1:1 umsetzen kann.

## Input-Anforderungen
- **Aus vorherigen Dokumenten:**
  - 01 Zielgruppen-Avatar: Rolle, Stack, Erfahrungslevel (fuer Formularoptionen)
  - 02 Arbeitgeber-Avatar: Tonalitaet (fuer Intro-Text)
  - 03 Messaging-Matrix: CTAs (fuer Button-Text)
  - 06 Landingpage-Texte: Bewerbungsprozess-Versprechen (48h Rueckmeldung etc.)
- **Aus dem Kickoff-Gespraech:**
  - Welche Informationen werden benoetigt (Pflicht vs. Optional)
  - Spezialisierungen / Fachbereiche
  - Erfahrungsstufen

## Pflicht-Sections

### 1. Header
- **Inhalt:** Markenname + Seitentyp
- **Format:** Paragraph mit Bold-Markenname
- **Minimum:** 1 Zeile

### 2. Title
- **Inhalt:** Seitentitel mit Kernversprechen
- **Format:** Styled Paragraph (22px, bold)
- **Minimum:** 1 Titel

### 3. Intro
- **Inhalt:** Headline, Zeitangabe, motivierender Satz, Erklaerungstext in Blockquote
- **Format:** h3 Headline (20px), Kursive Zeitangabe, Zitat-Paragraph (18px), Blockquote
- **Minimum:** 4 Elemente

### 4. Formularfelder
- **Inhalt:** Jedes Feld mit Label, Status (Required/Optional), Optionen
- **Format:** Jeweils eigene h3 + Tabelle oder Freitext-Vermerk
- **Pflichtfelder:** Spezialisierung (Dropdown/Radio), Berufserfahrung (Dropdown/Radio), Name, E-Mail
- **Optionale Felder:** Freitext ("Was nervt dich"), Telefon
- **Minimum:** 4 Felder (2 Pflicht-Auswahl + 2 Kontakt)

### 5. Button & Footer
- **Inhalt:** Submit-Button-Text, Datenschutz-Hinweis, rechtliche Links
- **Format:** CTA in Accent-Farbe (16px), Datenschutz (12px, grau), Links (12px, grau)
- **Minimum:** 3 Elemente

## Qualitaetskriterien
- Formular muss in unter 60 Sekunden ausfuellbar sein (Versprechen einhalten)
- Nur minimal noetige Felder als Pflicht markieren
- Spezialisierungen muessen branchenspezifisch und korrekt sein
- Erfahrungsstufen muessen zur Zielgruppe passen (keine "0-1 Jahre" bei Senior-Suche)
- Freitext-Frage muss optional sein und einen lockeren Ton haben
- Datenschutz-Hinweis ist rechtlich erforderlich

## Abhaengigkeiten
- **Input von:**
  - 01 Zielgruppen-Avatar (Rolle, Stack fuer Spezialisierungen)
  - 02 Arbeitgeber-Avatar (Tonalitaet)
  - 03 Messaging-Matrix (CTAs)
  - 06 Landingpage-Texte (Prozess-Versprechen)
- **Wird genutzt von:**
  - 08 Dankeseite-Texte (folgt nach Formular-Submit)

## HTML-Struktur

```html
<h1>Formularseite-Texte</h1>
<p class="meta">[Firma] &middot; Schnellbewerbung &middot; Exakte Texte</p>

<h2>Header</h2>
<p><strong>[Marke]</strong> -- Schnellbewerbung</p>
<hr>

<h2>Title</h2>
<p style="font-size:22px; font-weight:700; color:#0a1628;">[Seitentitel]</p>
<hr>

<h2>Intro</h2>
<h3>Headline</h3>
<p style="font-size:20px; font-weight:700;">[Headline]</p>
<p><em>[Zeitangabe]</em></p>
<p style="font-size:18px;">&bdquo;[Motivierender Satz]&ldquo;</p>
<blockquote>[Erklaerungstext]</blockquote>
<hr>

<h2>Formularfelder</h2>

<h3>[Feld-Label]* <span style="color:#cc0000;">(Required)</span></h3>
<table>
  <tr><th>Option</th><th>Beschreibung</th></tr>
  <tr><td><strong>[Option]</strong></td><td>[Beschreibung]</td></tr>
</table>

<h3>[Feld-Label]* <span style="color:#cc0000;">(Required)</span></h3>
<table>
  <tr><th>Option</th></tr>
  <tr><td>[Option]</td></tr>
</table>

<h3>[Feld-Label] <span style="color:#888;">(Optional)</span></h3>
<p><em>Freitextfeld</em></p>

<h3>Kontakt</h3>
<table>
  <tr><th>Feld</th><th>Status</th></tr>
  <tr><td>[Feldname]</td><td><strong style="color:#cc0000;">Required</strong></td></tr>
  <tr><td>[Feldname]</td><td><span style="color:#888;">Optional</span></td></tr>
</table>
<hr>

<h2>Button &amp; Footer</h2>
<p><strong style="color:#00e5ff; font-size:16px;">&#9654; [Button-Text]</strong></p>
<p style="font-size:12px; color:#888;">&bdquo;[Datenschutz-Hinweis]&ldquo;</p>
<p style="font-size:12px; color:#888;">[Rechtliche Links]</p>
```

Siehe `00-design-system.md` fuer CSS-Klassen und Styling.

## Benoetigte Bausteine
| Kategorie | Felder | Verwendung |
|-----------|--------|------------|
| E. Benefits & Wuensche | E.1-E.3 | Motivierender Intro-Text |
| F. Sprache & Wording | F.1, F.2 | Lockerer Ton, Fachbegriffe fuer Spezialisierungen |
| B. Berufliches Profil | B.1-B.5 | Spezialisierungen und Erfahrungsstufen |
| C. Schmerzpunkte | C.1 (Kontext) | Freitext-Frage an Pain Point ankoppeln |

## Regeln
- Formular MUSS in unter 60 Sekunden ausfuellbar sein — das Versprechen MUSS eingehalten werden
- Maximal 5 Felder (2 Pflicht-Auswahl + Name + E-Mail + 1 Optional)
- Zeitangabe im Intro PFLICHT: "Dauert 60 Sekunden. Wirklich."
- "Kein Lebenslauf noetig" MUSS im Title oder Intro vorkommen
- Spezialisierungen: Echte Fachbegriffe der Branche, keine HR-Kategorien
- Erfahrungsstufen: Passend zur gesuchten Senioritaet (keine "0-1 Jahre" bei Senior-Suche)
- Freitext-Frage: Optional, lockerer Ton, z.B. "Was nervt dich gerade am meisten an deinem Job?"
- Datenschutz-Hinweis ist RECHTLICH ERFORDERLICH
- Button-Text: Niedrigschwellig, nicht "Bewerbung absenden" sondern "Jetzt unverbindlich anfragen"
- Telefon-Feld IMMER optional

## Beispiel-Output
```html
<!-- Auszug Intro -->
<h2>Intro</h2>
<h3>Headline</h3>
<p style="font-size:20px; font-weight:700;">Kein Lebenslauf. Keine Formalitaeten.</p>
<p><em>Dauert 60 Sekunden. Wirklich.</em></p>
<p style="font-size:18px;">&bdquo;Wir wollen dich kennenlernen — nicht deinen CV durchblaettern.&ldquo;</p>
<blockquote>3 kurze Fragen und deine Kontaktdaten. Ein Engineer aus unserem Team meldet sich innerhalb von 48 Stunden persoenlich bei dir.</blockquote>
```

## Beispiel-Prompt

```
Du bist ein UX-Texter fuer Bewerbungsformulare. Erstelle die vollstaendigen Texte fuer eine Schnellbewerbungs-Formularseite.

**Unternehmen:** {{firmenname}}
**Rolle:** {{rolle}}
**Spezialisierungen:** {{spezialisierungen_liste}}
**Erfahrungsstufen:** {{erfahrungsstufen}}

**Tonalitaet (aus Arbeitgeber-Avatar):**
{{tonalitaet}}

**Prozess-Versprechen (aus Landingpage):**
{{prozess_versprechen}}

**CTAs (aus Messaging-Matrix):**
{{cta_varianten}}

Erstelle die Formularseite-Texte mit exakt diesen Sections:
1. Header (Markenname + "Schnellbewerbung")
2. Title (22px, bold, mit Kernversprechen z.B. "Kein Lebenslauf noetig")
3. Intro (Headline 20px, Zeitangabe kursiv, motivierender Satz in Anfuehrungszeichen 18px, Erklaerungstext als Blockquote)
4. Formularfelder:
   a. Spezialisierung (Required, Tabelle: Option | Beschreibung, min. 4 Optionen)
   b. Berufserfahrung (Required, Tabelle: Option, min. 4 Stufen passend zur Senioritaet)
   c. Optionale Freitext-Frage (lockerer Ton)
   d. Kontakt (Tabelle: Feld | Status, Name + E-Mail = Required, Telefon = Optional)
5. Button & Footer (CTA 16px in Accent, Datenschutz 12px grau, rechtliche Links 12px grau)

Das Formular muss in unter 60 Sekunden ausfuellbar sein. Lockerer, nicht-buerokratischer Ton.

Formatiere als HTML mit dem Design-System.
```
