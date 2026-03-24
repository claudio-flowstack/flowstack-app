# Framework: Anzeigentexte Retargeting
Dokument-Nummer: 11 (intern), 10 (Framework-Reihenfolge)

## Zweck
Dieses Dokument liefert die vollstaendigen Anzeigentexte fuer die Retargeting-Kampagne (Meta Ads). Die Zielgruppe sind Besucher der Landingpage, die sich noch nicht beworben haben. Die Texte adressieren Einwaende, liefern Social Proof und erzeugen Urgency. Jede Variante hat einen anderen Retargeting-Angle.

## Input-Anforderungen
- **Aus vorherigen Dokumenten:**
  - 01 Zielgruppen-Avatar: Einwaende & Bedenken (Einwand-Behandlung), Entscheidungsprozess
  - 02 Arbeitgeber-Avatar: Fakten zur Einwand-Entkraeftung (Gruendungsjahr, Finanzierung, Teamgroesse, Vertragsart)
  - 03 Messaging-Matrix: CTAs, Tonalitaet
  - 09 Anzeigentexte Hauptkampagne: Welche Angles bereits genutzt wurden (Retargeting ergaenzt, wiederholt nicht)
- **Aus dem Kickoff-Gespraech:**
  - Konkrete Benefits-Liste (fuer Urgency-Variante)
  - Anzahl offener Stellen (fuer FOMO)
  - Gehaltsrange (falls kommuniziert)

## Pflicht-Sections

### 1. Retargeting Ad 1: Einwand-Behandlung
- **Inhalt:** Adressiert den Haupteinwand ("Bestimmt ein Chaos-Startup"), liefert Fakten als Gegenbeweis
- **Format:** h2 + h3 Primaertext in Highlight-Box + h3 Headline
- **Struktur:**
  1. Acknowledgment ("Du hast unsere Seite besucht")
  2. Einwand benennen (direktes Zitat)
  3. Fakten-Liste mit Pfeil-Symbolen
  4. Positionierung
  5. CTA

### 2. Retargeting Ad 2: Social Proof
- **Inhalt:** Konkretes Beispiel eines Wechslers (fiktiv), mit Feedback-Zitat
- **Format:** h2 + h3 Primaertext in Highlight-Box + h3 Headline
- **Struktur:**
  1. "Du ueberlegst noch?"
  2. Profil des Wechslers (Alter, Situation)
  3. Seine Ueberlegungszeit
  4. Sein Feedback nach X Monaten (Zitat)
  5. Prozess-Zusammenfassung
  6. CTA

### 3. Retargeting Ad 3: Urgency + Benefits
- **Inhalt:** Konkrete Stellenzahl, Stack, Benefits-Checkliste, Timeline
- **Format:** h2 + h3 Primaertext in Highlight-Box + h3 Headline
- **Struktur:**
  1. "Wir suchen genau [N] [Rolle]"
  2. Stack + Standort + Gehalt
  3. Benefits-Liste mit Haekchen
  4. Prozess-Zusammenfassung
  5. Urgency-Closer

## Qualitaetskriterien
- Einwand-Behandlung muss den Einwand direkt und ehrlich benennen, nicht umgehen
- Fakten muessen konkret und verifizierbar sein (Gruendungsjahr, Teamgroesse)
- Social-Proof-Person muss realistisch und relatable sein (Alter, Situation der Zielgruppe)
- Urgency darf nicht manipulativ sein -- tatsaechliche Stellenzahl verwenden
- Benefits-Liste mit Haekchen-Symbolen fuer Scannability
- Tone Shift: Retargeting ist persoenlicher und verstaendnisvoller als Hauptkampagne

## Abhaengigkeiten
- **Input von:**
  - 01 Zielgruppen-Avatar (Einwaende)
  - 02 Arbeitgeber-Avatar (Fakten, Benefits)
  - 03 Messaging-Matrix (CTAs, Tonalitaet)
  - 09 Anzeigentexte Hauptkampagne (Angles-Abgrenzung)
- **Wird genutzt von:**
  - Steht im Funnel nach der Hauptkampagne

## HTML-Struktur

```html
<h1>Anzeigentexte -- Retargeting</h1>
<p class="meta">[Firma] &middot; Meta Ads &middot; Retargeting-Kampagne &middot; [N] Varianten</p>
<p><em>Zielgruppe: Besucher der Landing Page, die sich noch nicht beworben haben.</em></p>

<hr>

<h2>RETARGETING AD 1 -- &bdquo;Einwand-Behandlung&ldquo;</h2>
<h3>Primaertext</h3>
<div class="highlight">
<p>[Acknowledgment]</p>
<p>[Verstaendnis]</p>
<p>[Einwand als Zitat]</p>
<p>[Fakten-Label]:<br>
&rarr; [Fakt 1]<br>
&rarr; [Fakt 2]<br>
&rarr; [Fakt 3]</p>
<p>[Positionierung]</p>
<p>[CTA]</p>
</div>
<h3>Headline</h3>
<p><strong>[Headline]</strong></p>

<hr>

<h2>RETARGETING AD 2 -- &bdquo;Social Proof&ldquo;</h2>
<h3>Primaertext</h3>
<div class="highlight">
<p>[Opener]</p>
<p>[Profil: Alter, Rolle, Situation]</p>
<p>[Ueberlegungszeit]</p>
<p>[Feedback-Zitat nach X Monaten]</p>
<p>[Prozess-Zusammenfassung]</p>
<p>[CTA]</p>
</div>
<h3>Headline</h3>
<p><strong>[Headline mit Zitat]</strong></p>

<hr>

<h2>RETARGETING AD 3 -- &bdquo;Urgency + Benefits&ldquo;</h2>
<h3>Primaertext</h3>
<div class="highlight">
<p>[Stellenzahl + Rolle]</p>
<p>[Stack, Standort, Gehalt]</p>
<p>[Benefits-Label]:<br>
&#10003; [Benefit 1]<br>
&#10003; [Benefit 2]<br>
&#10003; [Benefit 3]<br>
&#10003; [Benefit 4]<br>
&#10003; [Benefit 5]</p>
<p>[Prozess-Zusammenfassung]</p>
<p>[Urgency-Closer]</p>
</div>
<h3>Headline</h3>
<p><strong>[Headline]</strong></p>
```

Siehe `00-design-system.md` fuer CSS-Klassen und Styling.

## Benoetigte Bausteine
| Kategorie | Felder | Verwendung |
|-----------|--------|------------|
| C. Schmerzpunkte | C.1-C.3 (Kontext) | Einwand-Behandlung referenziert Pain Points |
| G. Einwaende | G.1-G.6 (alle) | Einwand-Behandlung: Einwaende direkt benennen und entkraeften |
| H. Arbeitgeber-Daten | H.1-H.6 | Fakten zur Einwand-Entkraeftung |
| I. Messaging | I.7-I.9 CTAs | Niedrigschwellige CTAs |
| F. Sprache & Wording | F.1-F.3 (Kontext) | Tonalitaet, verbotene Woerter |

## Regeln
- Primaertext: 150-350 Zeichen (Mittelform fuer Retargeting — kuerzer als Hauptkampagne)
- Headline: 25-35 Zeichen
- 3 Varianten mit VERSCHIEDENEN Retargeting-Frameworks:
  1. Einwand-Entkraeftung — Kognitive Dissonanz aufloesen, Einwand DIREKT benennen (nicht umgehen)
  2. Social Proof + Testimonial — Fiktive Person mit Name, Alter, konkreter Wechsel-Story
  3. Urgency + Benefits-Stack — Konkrete Stellenzahl, Benefits-Checkliste mit Haekchen
- Tone Shift: Retargeting ist PERSOENLICHER und VERSTAENDNISVOLLER als Hauptkampagne
- Acknowledgment: "Du hast unsere Seite besucht" / "Du ueberlegst noch?" (zeigt: wir verstehen)
- Einwand-Behandlung: Einwand als DIREKTES ZITAT benennen, dann Fakten als Gegenbeweis
- Fakten mit Pfeil-Symbolen (→) auflisten fuer Scannability
- Social-Proof-Person: Realistisch und relatable (Alter, Situation, Ueberlegungszeit)
- Urgency: NICHT manipulativ — tatsaechliche Stellenzahl verwenden
- Benefits-Liste mit Haekchen-Symbolen (✓) fuer Scannability
- KEINE Ausrufezeichen-Inflation
- CTA: Noch niedrigschwelliger als Hauptkampagne ("Fragen kostet nichts")

## Beispiel-Output
```html
<!-- Auszug Retargeting Ad 1 -->
<h2>RETARGETING AD 1 -- &bdquo;Einwand-Behandlung&ldquo;</h2>
<h3>Primaertext</h3>
<div class="highlight">
<p>Du warst auf unserer Seite.<br>
Und hast nicht geklickt.</p>

<p>Verstehen wir.</p>

<p>&bdquo;Bestimmt wieder so ein Chaos-Startup.&ldquo;</p>

<p>Die Fakten:<br>
&rarr; Gegruendet 2019, profitabel seit 2021<br>
&rarr; 14 Entwickler, Durchschnittsalter 32<br>
&rarr; Unbefristete Vertraege, kein VC-Druck</p>

<p>Kein Chaos. Nur Code, der in Produktion geht.</p>

<p>60 Sekunden. Kein CV. Kein Risiko.</p>
</div>
<h3>Headline</h3>
<p><strong>Fakten statt Versprechen.</strong></p>
```

## Beispiel-Prompt

```
Du bist ein Performance-Marketing-Texter fuer Meta Ads Retargeting. Erstelle Retargeting-Anzeigentexte fuer Besucher, die die Landingpage gesehen aber sich nicht beworben haben.

**Unternehmen:** {{firmenname}}
**Rolle:** {{rolle}}
**Offene Stellen:** {{anzahl_stellen}}
**Stack:** {{stack}}
**Gehaltsrange:** {{gehalt}}
**Benefits:** {{benefits_liste}}

**Einwaende der Zielgruppe (aus Zielgruppen-Avatar):**
{{einwaende}}

**Firmenfakten (aus Arbeitgeber-Avatar):**
- Gruendungsjahr: {{gruendungsjahr}}
- Finanzierung: {{finanzierung}}
- Teamgroesse: {{teamgroesse}}
- Vertragsart: {{vertragsart}}

**CTAs (aus Messaging-Matrix):**
{{ctas}}

Erstelle 3 Retargeting-Anzeigen:

1. **Einwand-Behandlung:**
   - Einwand direkt benennen (Zitat aus Zielgruppen-Avatar)
   - Fakten mit Pfeil-Symbolen auflisten
   - Ehrlich positionieren
   - CTA niedrigschwellig

2. **Social Proof:**
   - Fiktive Person (Alter, Situation passend zur Zielgruppe)
   - Ueberlegungszeit realistisch (2-4 Wochen)
   - Feedback-Zitat nach 6 Monaten
   - Prozess kurz zusammenfassen

3. **Urgency + Benefits:**
   - Exakte Stellenzahl
   - Stack, Standort, Gehalt
   - Benefits mit Haekchen-Symbolen
   - Echte Urgency (keine Manipulation)

Ton: Persoenlicher und verstaendnisvoller als Hauptkampagne. Meta-Ads-Rhythmus beibehalten.

Formatiere als HTML mit dem Design-System.
```
