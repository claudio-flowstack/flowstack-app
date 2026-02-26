# Novacode Recruiting Automation — Demo-Spezifikation

> Letzte Aktualisierung: 26.02.2026 (Abends)
> Status: Funktionsfaehig — 27/27 Nodes getestet
> Firma: Novacode GmbH | Service: Recruiting | Region: NRW

---

## Inhaltsverzeichnis

1. [Uebersicht](#1-uebersicht)
2. [Systeme & Tools](#2-systeme--tools)
3. [Phase 1: Trigger](#3-phase-1-trigger)
4. [Phase 2: Infrastruktur-Setup](#4-phase-2-infrastruktur-setup)
5. [Phase 3: Kickoff & Transkript](#5-phase-3-kickoff--transkript)
6. [Phase 4: Strategie & Markenentwicklung](#6-phase-4-strategie--markenentwicklung)
7. [Phase 5: Text-Erstellung](#7-phase-5-text-erstellung)
8. [Phase 6: Funnel, Pixel & Tracking](#8-phase-6-funnel-pixel--tracking)
9. [Phase 7: Zielgruppen & Kampagnen](#9-phase-7-zielgruppen--kampagnen)
10. [Phase 8: Pruefung & Go-Live](#10-phase-8-pruefung--go-live)
11. [Close CRM Pipeline](#11-close-crm-pipeline)
12. [Slack-Nachrichten](#12-slack-nachrichten)
13. [Vorbereitete Dokumente](#13-vorbereitete-dokumente)
14. [Naming Conventions](#14-naming-conventions)
15. [UI-Steuerung](#15-ui-steuerung)
16. [Offene Punkte / Backlog](#16-offene-punkte--backlog)

---

## 1. Uebersicht

Die Automation bildet den kompletten Fulfillment-Prozess einer Recruiting-Agentur ab:
Vom Onboarding-Formular ueber Infrastruktur-Setup, Kickoff, Strategie, Text-Erstellung,
Funnel-Bau, Kampagnen-Setup bis zum Go-Live.

**Gesamtdauer Demo:** ~7-10 Minuten
**Echte API-Calls:** 27 (Close, Google, Slack, ClickUp, Meta Ads)
**Simulierte Schritte:** KI-Analyse, Funnel-Bau
**Vorbereitete Dokumente:** 12 Google Docs (Strategie + Copy)

### Teamstruktur
- **Claudio** und **Anak** sind die einzigen internen Personen
- Alle Rollen (Account Manager, Fulfillment Lead, Strategy Lead, Copy Lead, Funnel Specialist, Paid Ads Specialist) werden auf diese zwei gemappt

---

## 2. Systeme & Tools

| System | Verwendung | API-Integration |
|--------|-----------|-----------------|
| **Close CRM** | Leads, Pipeline, Stages, Notizen | Ja (echte API) |
| **Google Drive** | Ordnerstruktur, Dokumente, Sharing | Ja (echte API) |
| **Google Calendar** | Kickoff-Termin mit Meet | Ja (echte API) |
| **Gmail** | Willkommens-E-Mail | Ja (echte API) |
| **Slack** | Ops-Nachrichten + Kundenkanal | Ja (Webhook + API) |
| **ClickUp** | Projekt, Tasks, Checklisten | Ja (echte API) |
| **Meta Ads** | Kampagnen, Anzeigengruppen, Ads, Audiences | Ja (echte API) |

---

## 3. Phase 1: Trigger (Master)

**Nodes:** nc-t1, nc-t2 | **Dauer:** ~7s

| Node | Aktion | Output |
|------|--------|--------|
| nc-t1 | Onboarding-Formular eingegangen | Novacode GmbH, clazahlungskonto@gmail.com, Service: Recruiting |
| nc-t2 | Daten validieren | Firma, Ansprechpartner, Service-Typ, Kickoff-Termin geprueft |

---

## 4. Phase 2: Infrastruktur-Setup

**Nodes:** is01-is10 | **Dauer:** ~84s | **Echte API-Calls:** 8

### Ablauf

| Node | Aktion | Tool | Echt? | Details |
|------|--------|------|-------|---------|
| is01 | Handover-Daten | — | Nein | Formulardaten uebernommen |
| **is02** | **Close: Lead erstellen** | Close | **Ja** | Lead "Novacode GmbH", Opportunity in Fulfillment Pipeline, Stage "Onboarding gestartet", Custom Fields (Service Type, Automation Status), interne Notiz |
| **is03** | **Slack: Neuer Client** | Slack | **Ja** | Ops-Channel: Client-Info + Links. **Kundenkanal #client-novacode erstellen** mit Willkommensnachricht |
| **is04** | **Willkommens-E-Mail** | Gmail | **Ja** | An clazahlungskonto@gmail.com. Inhalt: Begruessung, Kickoff-Datum/-Uhrzeit, Vorbereitung (Job Ads, Fotos, Brand Assets), Upload-Link zu Drive (04_Creatives/Raw_Uploads), Ansprechpartner |
| **is05** | **Kickoff-Termin** | Calendar | **Ja** | Titel: "Kickoff - Novacode GmbH - Recruiting", 60 Min, Google Meet Link, Teilnehmer: Kunde + Claudio, Agenda + Vorbereitung in Beschreibung, Erinnerungen 24h + 30min |
| **is06** | **Drive: Ordnerstruktur** | Drive | **Ja** | Root: Novacode GmbH_Recruiting, 8 Hauptordner + Unterordner, **Root mit Kunden-E-Mail teilen** (Writer) |
| is07 | Drive: Templates | — | Nein | Tracking Dashboard + Onboarding Brief dupliziert |
| **is08** | **ClickUp: Projekt** | ClickUp | **Ja** | "Novacode GmbH - Recruiting" in Client Projects Space |
| **is09** | **ClickUp: Tasks** | ClickUp | **Ja** | 3 Tasks: "Zugaenge verifizieren" (Checkliste: Meta BM, Ad Account, Pixel, Website, Domain, Tech-Kontakt), "Kickoff vorbereiten" (Checkliste: Deal-Notizen, Formular, Leitfaden, Fragen, Brand-Fragen), ggf. "Fehlende Zugaenge sammeln" |
| **is10** | **Close: Kickoff geplant** | Close | **Ja** | Stage -> "Kickoff geplant", Automation Status -> "Warte auf Kickoff" |

### Datenfluss
```
is01 -> is02 (erstellt lead_id, opportunity_id)
is02 -> is03, is04, is05, is06, is08 (parallel)
is06 -> is07
is08 -> is09 (braucht list_id)
is07 + is09 -> is10 (Konvergenz)
```

### Was der Kunde erhaelt
- Willkommens-E-Mail mit allen Infos
- Kalendereinladung mit Google Meet Link
- Zugriff auf Drive-Ordner
- Slack-Kanal #client-novacode

---

## 5. Phase 3: Kickoff & Transkript

**Nodes:** kc01-kc06 | **Dauer:** ~30s (Demo-verkuerzt) | **Echte API-Calls:** 2

| Node | Aktion | Tool | Echt? | Details |
|------|--------|------|-------|---------|
| kc01 | Kickoff starten | — | Nein | Call-Start (simuliert) |
| kc02 | Call aufzeichnen | — | Nein | Demo: ~5s (kein echter Call) |
| kc03 | KI-Transkription | — | Nein | Transkript-Dokument wird als Output verlinkt |
| kc04 | Transkript speichern | — | Nein | In 08_Transcripts abgelegt |
| **kc05** | **Close: Kickoff abgeschlossen** | Close | **Ja** | Stage -> "Kickoff abgeschlossen", Status -> "Strategie in Arbeit" |
| **kc06** | **Slack: Call fertig** | Slack | **Ja** | "Kickoff abgeschlossen - Novacode GmbH", Transkript-Link |

### Datenfluss
```
kc01 -> kc02 -> kc03 -> kc04 + kc05 (parallel) -> kc06 (Konvergenz)
```

---

## 6. Phase 4: Strategie & Markenentwicklung

**Nodes:** st01-st10 | **Dauer:** ~108s | **Echte API-Calls:** 1 (+1 Slack)

### Vorbereitete Dokumente (5 Google Docs)

| Node | Dokument | Inhalt |
|------|----------|--------|
| st03 | Zielgruppen-Avatar | Kandidatenprofil (Senior Dev, 28-45), Pain Points, Jobs-to-be-Done, Medienkonsum |
| st04 | Arbeitgeber-Avatar | Positionierung, EVP, 4 P's (People, Purpose, Place, Product) |
| st05 | Messaging-Matrix | USP-Matrix, Pain-Point-Mapping, Tone of Voice, Wording-Glossar |
| st06 | Creative Briefing | Farbpalette, Typografie, Bildsprache, Format-Specs, Mood-Boards |
| st07 | Marken-Richtlinien | Brand Story, Kommunikations-Dos/Don'ts, Narrative Building Blocks |

### Ablauf

| Node | Aktion | Details |
|------|--------|---------|
| st01 | Transkript-Analyse | Schluesselthemen, Sentiment, Kernaussagen |
| st02 | Daten extrahieren | Pain-Point-Matrix: 8 Pain Points, 12 Benefits, 5 Sprachmuster |
| st03-st05 | 3 Dokumente parallel | Zielgruppe, Arbeitgeber, Messaging (aus vorbereiteten Docs) |
| st06 | Creative Briefing | Haengt von st03 ab (Zielgruppe -> Design-Richtung) |
| st07 | Marken-Richtlinien | Haengt von st04 ab (Arbeitgeber -> Brand) |
| st08 | Zusammenfuehren | Alle Dokumente als Single Source of Truth |
| st09 | Strategie-Review | Auto-Approved (keine echte Freigabe in Demo) |
| **st10** | **Close: Strategie erstellt** | Stage -> "Strategie erstellt" + **Slack: "Strategie & Brand fertig"** |

### Datenfluss
```
st01 -> st02 -> st03 + st04 + st05 (parallel)
st03 -> st06, st04 -> st07
st05 + st06 + st07 -> st08 -> st09 -> st10
```

---

## 7. Phase 5: Text-Erstellung

**Nodes:** cc01-cc05 | **Dauer:** ~64s | **Echte API-Calls:** 1 (+1 Slack)

### Vorbereitete Dokumente (7 Google Docs)

| Node | Dokument | Inhalt |
|------|----------|--------|
| cc01 | Landingpage-Texte | Hero (3 Varianten), Benefits, Team, Testimonials, FAQ |
| cc01 | Formularseite-Texte | Felder, Labels, Placeholders, Validierung, Privacy |
| cc01 | Dankeseite-Texte | Bestaetigung, Naechste Schritte, Social Proof |
| cc02 | Anzeigentexte (Haupt) | 5 Kaltakquise-Varianten (PAS, AIDA, Social Proof, Frage, Statistik) |
| cc02 | Videoskript | 60s Recruiting-Video (Hook-Problem-Loesung-CTA) |
| cc03 | Anzeigentexte-Variationen | Retargeting, Warm Audience, Objection Handling, FOMO |

### Ablauf

| Node | Aktion | Details |
|------|--------|---------|
| cc01 | KI: Landingpage-Texte | 3 Docs parallel (LP, Formular, Danke) |
| cc02 | KI: Anzeigentexte | 2 Docs (Ads + Videoskript) — parallel zu cc01 |
| cc03 | Variationen | Retargeting + Warmup Variationen, haengt von cc02 ab |
| cc04 | Text-Review | Auto-Approved |
| **cc05** | **Close: Assets erstellt** | Stage -> "Assets erstellt" + **Slack: "Copy Assets fertig"** |

### Datenfluss
```
cc01 ---------> cc04 (Konvergenz)
cc02 -> cc03 -> cc04 -> cc05
```

### Ad-Texte Qualitaet
Die Anzeigentexte muessen:
- Laenger und detaillierter sein als generische KI-Texte
- Die Situation des Kandidaten beschreiben
- Auf echte Schmerzen eingehen (schlechte Fuehrung, veralteter Stack, kein Remote)
- Wie professionelle Performance-Ads aufgebaut sein
- Verschiedene Frameworks nutzen: PAS, AIDA, Social Proof, Story-driven
- Die vorhandenen Ad-Texte aus den vorbereiteten Docs verwenden

---

## 8. Phase 6: Funnel, Pixel & Tracking

**Nodes:** fn01-fn11 | **Dauer:** ~108s | **Echte API-Calls:** 0 (simuliert)

| Node | Aktion | Output |
|------|--------|--------|
| fn01 | Template auswaehlen | "Recruiting Pro" Template |
| fn02 | Copy einsetzen | Texte aus Phase 5 in Template |
| fn03 | Bilder vorbereiten | Logo, Teamfotos, OG-Image (parallel zu fn01-02) |
| fn04 | Design anpassen | Brand Colors, Fonts, Layout |
| fn05 | Website bauen | 5 Seiten zusammenfuegen & deployen |
| fn06 | **Landingpage** | https://demo-recruiting.vercel.app/demo-landing/ |
| fn07 | **Bewerbungsseite** | https://demo-recruiting.vercel.app/demo-formular |
| fn08 | **Dankeseite** | https://demo-recruiting.vercel.app/demo-danke |
| fn09 | Datenschutz & Impressum | Rechtliche Seiten |
| fn10 | Pixel- & Event-Setup | Meta Pixel: ViewContent (LP), AddToCart (Form), Lead (Danke) |
| fn11 | Funnel-Review | Auto-Approved |

### Tracking Dashboard
Das Tracking Dashboard ist ein **Google Sheet** (dupliziert vom E-Commerce-Template).
- **Template:** `1-HGe6sCOlaCE-x0uZB_qs-6ZLczlikR181l3ztOoadE` (Shopify E-Commerce Tracking)
- **Kopie:** `1EmgdSqPPpouA20wY3OhMu1PGCA-Y_aCeztDHUF2zXeY` (Novacode GmbH_TrackingDashboard)
- **Angepasst auf:** Recruiting-Funnel (LP-Besucher, Bewerbungen, Erstgespraeche, Einstellungen)
- **Zeitraum:** Maerz 2026
- **Wird in 07_Tracking abgelegt** und beim Zuruecksetzen NICHT geloescht (ist ein Template-Duplikat)

### Datenfluss
```
fn01 -> fn02 -----> fn04 -> fn05 -> fn06 + fn07 + fn08 + fn09 (parallel)
fn03 -> fn04         fn06 + fn07 + fn08 -> fn10 -> fn11
                     fn09 -> fn11 (Konvergenz)
```

---

## 9. Phase 7: Zielgruppen & Kampagnen

**Nodes:** ca01-ca11 | **Dauer:** ~85s | **Echte API-Calls:** 9 (Meta Ads API)

### Zielgruppen (Website Retargeting Audiences)

| Audience | Beschreibung |
|----------|-------------|
| AllVisitors_30d | Alle Besucher der letzten 30 Tage |
| LP_Visitors_NoApplication_7d | LP-Besucher ohne Bewerbung (7 Tage) |
| Application_Visitors_NoLead_7d | Formular-Besucher ohne Lead (7 Tage) |

### 3 Kampagnen

#### Initial (Kaltakquise)
- **Name:** Initial_Novacode GmbH_Recruiting_Leads
- **Objective:** Leads | **Special Ad Category:** Employment
- **Budget:** 30 EUR/Tag pro Ad Set
- **Placements:** Nur Facebook Feed + Instagram Feed
- **Advantage/Expansion:** Alles OFF
- **3 Ad Sets:**
  - NRW_Broad_20-55 (kein Targeting)
  - NRW_Interest_Recruiting_20-55 (Job-bezogene Interessen)
  - NRW_Interest_Management_20-55 (andere Interessen-Cluster)
- **Pro Ad Set:** 3 Creatives, 1 Copy-Variante, Ziel: Bewerbungsseite

#### Retargeting
- **Name:** Retargeting_Novacode GmbH_Recruiting_Leads
- **Objective:** Leads
- **Budget:** 5-10 EUR/Tag pro Ad Set
- **Placements:** Auto (alle)
- **3 Ad Sets:**
  - NRW_RT_AllVisitors_30d
  - NRW_RT_LP_NoApplication_7d
  - NRW_RT_Application_NoLead_7d
- **Pro Ad Set:** 3 Creatives (Reminder, Objection-Handling, Urgency)

#### Warmup
- **Name:** Warmup_Novacode GmbH_Recruiting_Views
- **Objective:** Video Views
- **Budget:** 5-10 EUR/Tag
- **Placements:** Feeds, Stories, Reels
- **1-2 Ad Sets:** NRW_Warmup_Views_30d
- **1-2 Video-Creatives** (Employer Insights, Team Culture)

### Datenfluss (mit Dependency-Edges)
```
ca01 -> ca04 -> ca05 -> ca07 -> ca09 -> ca11
ca02 -> ca06 -> ca07              (ca07 wartet auf ca06 UND ca05)
ca03 -> ca08 -> ca09              (ca09 wartet auf ca08 UND ca07)
ca04 -> ca07                      (image_hashes Dependency)
ca04 -> ca09                      (image_hashes Dependency)
ca05 -> ca10 -> ca11
ca07 -> ca10
```
**Wichtig:** Ad Sets laufen sequentiell (ca05 -> ca07 -> ca09) wegen Meta API Rate-Limiting.
Bilder werden einmalig in ca04 hochgeladen und via Context an ca05/ca07/ca09 weitergegeben.

---

## 10. Phase 8: Pruefung & Go-Live

**Nodes:** rl01-rl13 | **Dauer:** ~59s | **Echte API-Calls:** 5

| Node | Aktion | Tool | Details |
|------|--------|------|---------|
| rl01-05 | Review-Bestaetigungen | — | Strategie, Text, Funnel, Zielgruppen, Kampagnen (parallel) |
| **rl06** | **Slack: Assets bereit** | Slack | "Gesamtes Asset-Paket bereit - Novacode GmbH" + alle Links |
| **rl07** | **Close: Warte auf Freigabe** | Close | Stage -> "Warte auf Freigabe" |
| rl08 | Finale Freigabe | — | Auto-Approved (internes Go) |
| **rl09** | **Close: Bereit fuer Launch** | Close | Stage -> "Bereit fuer Launch" |
| rl10 | Kampagnen aktivieren | — | Status -> Aktiv in Meta (simuliert, Datum: aktuelles Datum) |
| **rl11** | **Close: Live** | Close | Stage -> "Live", Automation Status -> "Live" |
| **rl12** | **Slack: Wir sind live** | Slack | Launch-Datum, Kampagnennamen, Funnel-URL |
| rl13 | Dashboard | — | Live-Dashboard URL |

### Datenfluss
```
rl01 + rl02 + rl03 -> rl06 -> rl08
rl04 + rl05 -> rl07 -> rl08
rl08 -> rl09 -> rl10 -> rl11 -> rl13
                rl10 -> rl12 -> rl13 (Konvergenz)
```

---

## 11. Close CRM Pipeline

### Fulfillment Pipeline Stages

| Stage | Automation Status | Gesetzt bei |
|-------|-------------------|-------------|
| Onboarding gestartet | Infrastructure Setup | is02 (Lead erstellen) |
| Kickoff geplant | Warte auf Kickoff | is10 (Infrastruktur fertig) |
| Kickoff abgeschlossen | Strategie in Arbeit | kc05 (Transkript fertig) |
| Strategie erstellt | Strategie erstellt | st10 (Review approved) |
| Assets erstellt | Assets erstellt | cc05 (Copy Review approved) |
| Warte auf Freigabe | Warte auf Freigabe | rl07 (alle Reviews done) |
| Bereit fuer Launch | Bereit fuer Launch | rl09 (interne Freigabe) |
| Live | Live | rl11 (Kampagnen aktiviert) |
| Pausiert | Pausiert | (manuell) |
| Abgebrochen | Abgebrochen | (manuell) |

---

## 12. Slack-Nachrichten

| Zeitpunkt | Node | Nachricht | Links |
|-----------|------|-----------|-------|
| Infrastruktur fertig | is03 | "Neuer Client Novacode GmbH" | Drive, ClickUp, Close |
| (Kundenkanal) | is03 | #client-novacode Willkommen | Drive, ClickUp |
| Kickoff fertig | kc06 | "Kickoff abgeschlossen" | Transkript |
| Strategie fertig | st10 | "Strategie & Brand fertig" | Strategy-Ordner, Brand Guidelines, Close |
| Copy fertig | cc05 | "Copy Assets fertig" | LP Copy, Ad Copy, Variationen |
| Alle Reviews done | rl06 | "Asset-Paket bereit zur Freigabe" | Strategy, Copy, Funnel, Tracking, Kampagnen, ClickUp, Close |
| Go-Live | rl12 | "Kampagnen LIVE!" | Launch-Datum, Kampagnen, Funnel-URL |

---

## 13. Vorbereitete Dokumente

12 Google Docs mit echtem, professionellem Inhalt. Werden bei der Execution als Outputs verlinkt.

### Strategie (5 Docs)
1. Zielgruppen-Avatar (st03)
2. Arbeitgeber-Avatar (st04)
3. Messaging-Matrix (st05)
4. Creative Briefing (st06)
5. Marken-Richtlinien (st07)

### Copy (7 Docs)
6. Landingpage-Texte (cc01)
7. Formularseite-Texte (cc01)
8. Dankeseite-Texte (cc01)
9. Anzeigentexte Hauptkampagne (cc02)
10. Videoskript (cc02)
11. Anzeigentexte-Variationen / Retargeting (cc03)
12. (Reserve: alternatives Videoskript)

### Zusaetzlich
- Kickoff-Transkript (kc03) — separates Google Doc

---

## 14. Naming Conventions

### Google Drive
- Root: `{Firma}_Recruiting`
- Unterordner: 01_Verwaltung, 02_Strategie, 03_Texte, 04_Creatives, 05_Funnel, 06_Anzeigen, 07_Tracking, 08_Transkripte
- Strategie-Unterordner: Zielgruppen_Avatar, Arbeitgeber_Avatar, Messaging_Framework, Creative_Brief, Brand_Design_Richtlinien
- Creatives-Unterordner: Roh_Uploads, Bearbeitete_Creatives, Finale_Anzeigen

### ClickUp
- Projekt: `{Firma} - Recruiting`
- Tasks enthalten Firmennamen NICHT (sind bereits im Projekt-Kontext)

### Meta Kampagnen (DACH Best Practice, Pipe-getrennt)
- `[Funnel] | [Datum] | [Ziel] | [Land] | [Firma] Recruiting`
- Beispiel: `TOF | 2026-02 | Leads | DE | Novacode GmbH Recruiting`

### Meta Ad Sets
- `[Targeting] | [Gender] | [Alter] | [Land] | [Platzierung] | [Event] | [Datum]`
- Beispiel: `Broad | Alle | 25-55 | DE | Feed | LEAD | 2026-02`
- Retargeting: `WV-30d-AllPages | Alle | 25-55 | DE | Auto | LEAD | 2026-02`

### Meta Ads/Creatives
- `[Format] | [Konzept] | [Angle] | [Creator] | [Variante] | [Datum]`
- Beispiel: `Image | PainPoint | Fachkraefte | Inhouse | V1 | 2026-02`

### Slack
- Kundenkanal: #client-{firma-lowercase}
- Beispiel: #client-novacode

---

## 15. UI-Steuerung

### Buttons (Editor + Praesentationsmodus)
- **Starten** — Startet die komplette Automation (DAG Execution)
- **Stoppen** — Stoppt die Execution sofort
- **Zuruecksetzen** — Loescht alle erstellten Ressourcen (Close Lead, Drive Ordner, ClickUp Projekt, Calendar Event), leert Outputs, setzt Kontext zurueck. Vorbereitete Docs bleiben erhalten.

### Dokumente-Panel (Praesentationsmodus)
- Button immer sichtbar in der Bottom-Bar
- Zeigt Empty State vor Execution
- Fuellt sich automatisch nach Execution mit allen generierten Outputs

### Approval-Gates
- In der Demo: Auto-Approved (keine manuelle Freigabe noetig)
- Slack-Nachrichten erwaehnen Freigabe-Workflows

---

## 16. Offene Punkte / Backlog

### Erledigt
- [x] "Novacode Solutions GmbH" -> "Novacode GmbH" (ueberall)
- [x] Slack: Kundenkanal #client-novacode erstellen + Team einladen + Block-Kit Welcome
- [x] Kalender: Random Arbeitszeit Mo-Fr 9-16 Uhr + Google Meet + Teilnehmer
- [x] Drive: Root-Ordner mit Kunden-E-Mail teilen (Writer)
- [x] E-Mail: HTML mit Kickoff-Termin, Vorbereitung, Upload-Link
- [x] Slack nach Strategie (st10): Block-Kit mit Strategy-Docs
- [x] Slack nach Copy (cc05): Block-Kit mit Copy-Docs
- [x] Kampagnen: Aktuelles Datum, DACH Naming Convention
- [x] Meta Ads: Echte API-Integration (3 Kampagnen, 7 Ad Sets, Ads mit Bildern)
- [x] fn08 -> fn10 Edge (Dankeseite -> Pixel-Tracking)
- [x] Kickoff-Delays reduziert
- [x] Alle Outputs auf Deutsch
- [x] Tracking Sheet Recruiting-Version
- [x] Zuruecksetzen-Button sichtbar
- [x] Dokumente-Panel reaktiv
- [x] Cleanup: Template-Dateien geschuetzt
- [x] Race Condition gefixt (image_hashes + Meta Rate-Limit via DAG-Edges)
- [x] Drive-Ordner auf Deutsch (01_Verwaltung, 02_Strategie, etc.)
- [x] Email-Betreff Encoding gefixt (kein em-dash)
- [x] Ad/Creative Naming Convention (DACH: Format | Konzept | Angle | Creator | Variante | Datum)
- [x] Slack Cleanup: Bot joined vor Archive
- [x] ClickUp "name taken" Fallback

### Noch offen
- [ ] st05 Doc-ID fixen (teilt sich aktuell mit st02)
- [ ] Tracking Sheet in 07_Tracking ablegen (is07 Node)
- [ ] ClickUp Tasks mit Links zu Dokumenten in Beschreibungen
- [ ] Node Labels/Beschreibungen pruefen (nicht abgeschnitten)
- [ ] Systemname im Editor nicht abgeschnitten
- [ ] Tracking Sheet Inhalt auf Recruiting anpassen (manuell in Google Sheets)

### Regeln fuer Zuruecksetzen (Cleanup)
Folgende Dinge werden beim Zuruecksetzen **NICHT** geloescht:
- 12 vorbereitete Google Docs (Strategie + Copy)
- Tracking Sheet Template (Original)
- Tracking Sheet Kopie (Novacode GmbH_TrackingDashboard)
- Alle Dateien die als Templates dupliziert wurden

Folgende Dinge werden geloescht:
- Close Lead + Opportunity
- Google Drive Ordnerstruktur (Root + alle Unterordner)
- Google Calendar Event
- ClickUp Projekt + Tasks
- Slack-Nachrichten bleiben (koennen nicht geloescht werden)

### Optionale Erweiterungen
- [ ] ClickUp: Weitere Review-Tasks (Strategy Review, Copy Review, Funnel Review, Campaign Review)
- [ ] Meta Ads: Echte API-Integration fuer Kampagnen-Erstellung
- [ ] E-Mail-Sequenz: Follow-up Mails nach Kickoff
- [ ] Bedingte Tasks: "Fehlende Zugaenge sammeln" nur wenn "Zugaenge verifizieren" Luecken zeigt
