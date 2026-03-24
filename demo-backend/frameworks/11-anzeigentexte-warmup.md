# Framework: Anzeigentexte Warmup
Dokument-Nummer: 12 (intern), 11 (Framework-Reihenfolge)

## Zweck
Dieses Dokument liefert die vollstaendigen Anzeigentexte fuer die Warmup/Awareness-Kampagne (Meta Ads). Ziel ist Video Views und Engagement, nicht direkte Bewerbungen. Die Texte sind weicher, markenbildend und zeigen das Unternehmen authentisch. Sie bauen die Custom Audience auf, die spaeter mit Hauptkampagne und Retargeting angesprochen wird.

## Input-Anforderungen
- **Aus vorherigen Dokumenten:**
  - 01 Zielgruppen-Avatar: Alltags-Frustrationen (fuer "Ein Tag bei uns" Kontrast)
  - 02 Arbeitgeber-Avatar: Anti-Muster (fuer Anti-Corporate Angle), Teamgroesse, Arbeitsweise
  - 03 Messaging-Matrix: Tonalitaet, Hook-Bibliothek (softere Hooks)
  - 05 Marken-Richtlinien: Verbotene vs. erlaubte Begriffe
- **Aus dem Kickoff-Gespraech:**
  - Wie sieht ein typischer Arbeitstag aus
  - Teamkultur-Details

## Pflicht-Sections

### 1. Warmup Ad 1: "Ein Tag bei [Firma]"
- **Inhalt:** Stundengenaue Beschreibung eines typischen Arbeitstags
- **Format:** h2 + h3 Primaertext in Highlight-Box + h3 Headline
- **Struktur:**
  1. "Ein normaler Tag bei [Firma]:"
  2. Zeitstrahl (09:00 - Feierabend) mit konkreten Aktivitaeten
  3. Anti-Meeting-Statement
  4. Tagline

### 2. Warmup Ad 2: "Anti-Corporate"
- **Inhalt:** "Was wir NICHT haben" vs. "Was wir HABEN" Listen
- **Format:** h2 + h3 Primaertext in Highlight-Box + h3 Headline
- **Struktur:**
  1. "Was wir NICHT haben:" + Kreuz-Liste (verbotene Buzzwords)
  2. "Was wir HABEN:" + Haekchen-Liste (konkrete Facts)
  3. Tagline

### 3. Warmup Ad 3: "Developer-Zitat"
- **Inhalt:** Zitat eines Entwicklers ueber fachlichen Stillstand, dann Loesung
- **Format:** h2 + h3 Primaertext in Highlight-Box + h3 Headline
- **Struktur:**
  1. Zitat-Hook
  2. Problem-Kontext
  3. Beschreibung des Unternehmens
  4. Dreiteilige Tagline

## Qualitaetskriterien
- Warmup-Ads duerfen KEINEN harten CTA ("Jetzt bewerben") enthalten
- Der Ton muss informativer und weicher sein als bei Hauptkampagne
- "Ein Tag bei"-Format muss realistisch sein (nicht idealisiert)
- Anti-Corporate-Liste muss exakt die verbotenen Begriffe aus Marken-Richtlinien verwenden
- HABEN-Liste muss konkrete, verifizierbare Fakten enthalten
- Developer-Zitat muss authentisch klingen
- Tagline am Ende jeder Ad fuer Brand-Wiedererkennung

## Abhaengigkeiten
- **Input von:**
  - 01 Zielgruppen-Avatar (Alltags-Frustrationen)
  - 02 Arbeitgeber-Avatar (Anti-Muster, Teamkultur)
  - 03 Messaging-Matrix (Tonalitaet)
  - 05 Marken-Richtlinien (Verbotene Begriffe)
- **Wird genutzt von:**
  - Baut die Audience auf fuer 09 Hauptkampagne und 10 Retargeting

## HTML-Struktur

```html
<h1>Anzeigentexte -- Warmup</h1>
<p class="meta">[Firma] &middot; Meta Ads &middot; Warmup / Awareness &middot; [N] Varianten</p>
<p><em>Ziel: Video Views / Engagement. Weichere, markenbildende Inhalte.</em></p>

<hr>

<h2>WARMUP AD 1 -- &bdquo;Ein Tag bei [Firma]&ldquo;</h2>
<h3>Primaertext</h3>
<div class="highlight">
<p>Ein normaler Tag bei [Firma]:</p>
<p>[HH:MM] -- [Aktivitaet]<br>
[HH:MM] -- [Aktivitaet]<br>
[HH:MM] -- [Aktivitaet]<br>
<!-- 6-8 Eintraege -->
</p>
<p>[Anti-Meeting-Statement]</p>
<p>[Firma] -- [Tagline]</p>
</div>
<h3>Headline</h3>
<p><strong>[Headline]</strong></p>

<hr>

<h2>WARMUP AD 2 -- &bdquo;Anti-Corporate&ldquo;</h2>
<h3>Primaertext</h3>
<div class="highlight">
<p>Was wir NICHT haben:<br>
&#10060; &bdquo;[Buzzword 1]&ldquo;<br>
&#10060; &bdquo;[Buzzword 2]&ldquo;<br>
&#10060; &bdquo;[Buzzword 3]&ldquo;<br>
&#10060; &bdquo;[Buzzword 4]&ldquo;<br>
&#10060; &bdquo;[Buzzword 5]&ldquo;</p>

<p>Was wir HABEN:<br>
&#10003; [Fakt 1]<br>
&#10003; [Fakt 2]<br>
&#10003; [Fakt 3]<br>
&#10003; [Fakt 4]<br>
&#10003; [Fakt 5]</p>

<p>[Firma] -- [Tagline]</p>
</div>
<h3>Headline</h3>
<p><strong>[Headline]</strong></p>

<hr>

<h2>WARMUP AD 3 -- &bdquo;Developer-Zitat&ldquo;</h2>
<h3>Primaertext</h3>
<div class="highlight">
<p>&bdquo;[Zitat]&ldquo;</p>
<p>[Problem-Kontext]</p>
<p>[Unternehmensbeschreibung]</p>
<p>[Dreiteilige Tagline: Du X. Du Y. Du Z.]</p>
<p>[Firma] -- [Tagline]</p>
</div>
<h3>Headline</h3>
<p><strong>[Headline]</strong></p>
```

Siehe `00-design-system.md` fuer CSS-Klassen und Styling.

## Benoetigte Bausteine
| Kategorie | Felder | Verwendung |
|-----------|--------|------------|
| H. Arbeitgeber-Daten | H.7-H.10 | Kernpositionierung, Kultur, Anti-Muster fuer Anti-Corporate |
| D. Psychologie & Emotionen | D.6 Selbstbild, D.8 Trigger-Events | Identity Play |
| F. Sprache & Wording | F.1-F.3 | Authentischer Ton, Fachwoerter |
| C. Schmerzpunkte | C.1-C.3 (Kontext) | Alltags-Frustrationen fuer "Ein Tag bei" Kontrast |

## Regeln
- Warmup-Ads DUERFEN KEINEN harten CTA enthalten — KEIN "Jetzt bewerben", KEIN "Bewirb dich"
- Ziel: Video Views + Engagement + Custom Audience aufbauen
- Ton: Informativer und WEICHER als Hauptkampagne, markenbildend
- Primaertext: 50-200 Zeichen (Kurzform fuer Awareness)
- 3 Varianten mit VERSCHIEDENEN Warmup-Frameworks:
  1. "Ein Tag bei [Firma]" (Zeitstrahl) — Identity Play: "So wuerde dein Tag aussehen"
    - Stundengenaue Tagesstruktur (09:00 bis Feierabend, 6-8 Eintraege)
    - REALISTISCH, nicht idealisiert (auch Mittagspause, auch mal Bugs fixen)
    - Anti-Meeting-Statement am Ende
  2. "Was wir NICHT haben" (Anti-Pattern) — Pattern Interrupt + Ehrlichkeit
    - "NICHT haben" Liste: Exakt die verbotenen Begriffe aus Marken-Richtlinien (Baustein F.3)
    - "HABEN" Liste: Konkrete, verifizierbare Fakten
    - 5 Eintraege pro Liste
  3. Developer-Zitat / Insider-Story — Authentizitaet + Social Proof
    - Authentisches Zitat als Hook
    - Problem-Kontext (2-3 Zeilen)
    - Dreiteilige Tagline ("Du X. Du Y. Du Z.")
- Tagline am Ende JEDER Ad fuer Brand-Wiedererkennung: "[Firma] — [Tagline]"
- KEINE Scarcity/Urgency bei Warmup (das kommt spaeter)
- KEINE Stockfoto-Sprache ("Werde Teil unseres Teams")

## Beispiel-Output
```html
<!-- Auszug Warmup Ad 2 -->
<h2>WARMUP AD 2 -- &bdquo;Anti-Corporate&ldquo;</h2>
<h3>Primaertext</h3>
<div class="highlight">
<p>Was wir NICHT haben:<br>
&#10060; &bdquo;Flache Hierarchien&ldquo;<br>
&#10060; &bdquo;Dynamisches Umfeld&ldquo;<br>
&#10060; &bdquo;Attraktives Gehaltspaket&ldquo;<br>
&#10060; &bdquo;Spannende Aufgaben&ldquo;<br>
&#10060; &bdquo;Wir sind wie eine Familie&ldquo;</p>

<p>Was wir HABEN:<br>
&#10003; 14-Personen-Team, CTO antwortet auf Slack in unter 10 Min<br>
&#10003; 65-80k, transparent ab Gespraech 1<br>
&#10003; TypeScript, Next.js, kein Legacy-Code<br>
&#10003; Dein Code geht in Ø 2.3h in Produktion<br>
&#10003; 30 Urlaubstage + Remote-First</p>

<p>[Firma] -- Weniger Buzzwords. Mehr Code.</p>
</div>
<h3>Headline</h3>
<p><strong>Keine Buzzwords. Nur Fakten.</strong></p>
```

## Beispiel-Prompt

```
Du bist ein Brand-Marketing-Texter fuer Meta Ads Awareness-Kampagnen. Erstelle Warmup-Anzeigentexte, die Markenbekanntheit aufbauen (KEIN harter CTA).

**Unternehmen:** {{firmenname}}
**Branche:** {{branche}}
**Teamgroesse:** {{teamgroesse}} (davon {{dev_anzahl}} Entwickler)
**Durchschnittsalter:** {{durchschnittsalter}}

**Typischer Arbeitstag (aus Kickoff):**
{{arbeitstag_beschreibung}}

**Anti-Muster / Verbotene Begriffe (aus Marken-Richtlinien):**
{{anti_muster}}

**Konkrete Fakten (aus Arbeitgeber-Avatar):**
{{fakten_liste}}

**Alltags-Frustrationen der Zielgruppe (aus Zielgruppen-Avatar):**
{{alltags_frustrationen}}

Erstelle 3 Warmup-Ads:

1. **"Ein Tag bei [Firma]":**
   - Stundengenaue Tagesstruktur (09:00 bis Feierabend, 6-8 Eintraege)
   - Realistisch, nicht idealisiert
   - Anti-Meeting-Statement am Ende
   - Tagline

2. **"Anti-Corporate":**
   - "Was wir NICHT haben:" mit 5 Kreuz-Eintraegen (exakt die verbotenen Begriffe)
   - "Was wir HABEN:" mit 5 Haekchen-Eintraegen (konkrete Fakten)
   - Tagline

3. **"Developer-Zitat":**
   - Authentisches Zitat als Hook
   - Problem-Kontext (2-3 Zeilen)
   - Unternehmensbeschreibung (was wird gebaut, fuer wen)
   - Dreiteilige Tagline ("Du X. Du Y. Du Z.")

KEIN "Jetzt bewerben"-CTA. Weicher, informativer Ton. Brand-Wiedererkennung durch Tagline.

Formatiere als HTML mit dem Design-System.
```
