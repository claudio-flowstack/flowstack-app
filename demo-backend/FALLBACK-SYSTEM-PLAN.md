# Fallback-System & Error-Handling — Detailplan

> Dieses Dokument beschreibt alle Stellen, an denen die Automation brechen kann,
> und wie das System darauf reagieren soll. Grundlage: technische Code-Analyse
> + reale Agentur-Szenarien aus 50+ Client-Durchlaeufen.

---

## Inhalt

1. [Aktueller Zustand](#1-aktueller-zustand)
2. [Failure-Kategorien](#2-failure-kategorien)
3. [Phase-fuer-Phase Analyse](#3-phase-fuer-phase-analyse)
4. [Reale Agentur-Szenarien](#4-reale-agentur-szenarien)
5. [Architektur: Error-Handling System](#5-architektur-error-handling-system)
6. [Implementierungsplan](#6-implementierungsplan)

---

## 1. Aktueller Zustand

### Was existiert
- HTTP Error Logging (console.warn/error)
- Context-Snapshots pro Node (in-memory)
- Side-Effect Toggle (enable/disable)
- Backend Health Check (`/health`)
- Cleanup Endpoint (manuelle Bereinigung)
- Quality Gate nach Baustein-Extraktion (5 Pflichtkategorien)

### Was NICHT existiert
| Feature | Status | Auswirkung |
|---------|--------|------------|
| Retry mit Backoff | Fehlt | 1 Timeout = totaler Fehler |
| Pause/Resume | Fehlt | Kein Fortsetzen nach Netzwerk-Ausfall |
| Error-Benachrichtigungen | Fehlt | User merkt nicht wenn Node fehlschlaegt |
| Rollback bei Fehler | Fehlt | Manuelles Cleanup noetig |
| Retry ab Checkpoint | Fehlt | Muss gesamten Flow neu starten |
| Rate-Limit Handling | Fehlt | Meta API 429 → kompletter Fehlschlag |
| Kontext-Validierung | Fehlt | Fehlende IDs brechen nachfolgende Nodes |
| Approval Deadlines | Fehlt | Unendliches Warten moeglich |
| Duplikat-Erkennung | Fehlt | Re-Run erstellt doppelte Leads |
| Manuelles Node Re-Trigger | Eingeschraenkt | Nur im Canvas, kein Error-State sichtbar |
| Performance-Monitoring | Fehlt | Niemand merkt 0 Leads nach 2 Wochen |
| Budget-Guardrails | Fehlt | Dezimalfehler → 10x Budget verbrannt |

### Grundproblem: Stille Kaskade

```
Node A fehlschlaegt → gibt null zurueck
    → Node B startet trotzdem → hat keine Daten von A
        → Node C startet trotzdem → produziert Muell
            → Gesamte Phase "durchgelaufen" aber nichts Brauchbares erstellt
```

Niemand wird benachrichtigt. Im UI sieht alles "gruen" aus.

---

## 2. Failure-Kategorien

### A. API/Technische Fehler
- Auth Token abgelaufen (Google, Close, Meta, Airtable)
- Rate Limits (Meta: 20 Kampagnen/15min, Airtable: 5 req/s)
- Timeout (OpenRouter AI: 90-120s Generierung)
- Service Down (OpenRouter Wartung, Slack Outage)
- Quota erschoepft (Google Drive 15GB, OpenRouter 100 calls/day)

### B. Client-seitige Fehler
- Falsche Daten im Onboarding (Name, Email, Rolle)
- Rolle aendern nach Strategy-Phase
- Client antwortet nicht (Ghosting)
- Client lehnt Docs 3x ab mit vagem Feedback
- Brand Guidelines kommen NACH der Generierung
- Kein Google Workspace (Microsoft 365 only)
- Website kaputt / under construction

### C. Business-Logik Fehler
- Kickoff No-Show (Kunde kommt nicht zum Termin)
- Kickoff zu kurz (15 statt 45 Min → duenne Bausteine)
- Zahlung ueberfaellig → Automation laeuft trotzdem weiter
- Kampagne pausieren/unpausieren
- Saisonales Hiring (vorbereiten jetzt, launchen spaeter)
- Mehrere Rollen pro Client (3 Kampagnen, 1 Ad Account)
- Account Manager krank, niemand monitort
- Werbekonto gesperrt

### D. Datenqualitaets-Fehler
- AI halluziniert Firmendaten (falsches Gruendungsjahr, falsche Teamgroesse)
- Anzeigentexte verletzen Meta Employment-Richtlinien (DACH)
- Landingpage-Texte referenzieren Features die nicht existieren
- Duplikat-Leads in Close bei Re-Run

### E. Handoff-Fehler
- Alles erstellt, aber Client nicht informiert
- Budget falsch konfiguriert (Dezimalfehler)
- Kampagne laeuft 2 Wochen mit 0 Leads, niemand merkt's
- Performance schlecht, aber kein Alert

---

## 3. Phase-fuer-Phase Analyse

### Phase 1: Infrastructure Setup (is01-is10)

| Node | API | Was kann brechen | Kaskaden-Effekt | Loesung |
|------|-----|-----------------|-----------------|---------|
| is02 Close: Lead | Close API | Key abgelaufen, Rate Limit | Keine `lead_id` → alle Close-Updates danach fehlschlagen | Retry 3x, dann Slack Alert + ClickUp Task |
| is03 Slack: Channel | Slack Bot API | Bot Token ungueltig | Kein Channel → alle Slack-Nachrichten danach ins Leere | Retry 3x, Fallback: Webhook statt Bot |
| is04 Welcome Email | Gmail API | Refresh Token expired, Bounce | Client weiss nicht dass es losgeht | Retry, bei Bounce: AM manuell benachrichtigen |
| is05 Kickoff-Termin | Calendar API | Kalender voll, Google Meet Quota | Kein Termin → Kickoff findet nicht statt | Alternative Slot vorschlagen, AM benachrichtigen |
| is06 Drive: Ordner | Drive API | Quota voll (15GB) | Keine `folder_root_id` → Docs landen nirgends | Quota-Check VOR Erstellung, Alert bei <1GB frei |
| is08 ClickUp: Projekt | ClickUp API | Space ID ungueltig | Keine `list_id` → Tasks in is09 fehlschlagen | Space-ID validieren bei Backend-Start |
| is09 ClickUp: Tasks | ClickUp API | `list_id` fehlt (Kaskade von is08) | Keine Task-Verwaltung fuer Client | Kontext-Validierung: braucht `list_id` |
| is10 Close: Status | Close API | `opportunity_id` fehlt (Kaskade von is02) | Pipeline-Status nicht aktualisiert | Skip wenn `opportunity_id` fehlt, Warning loggen |

**Kritischster Node:** `is02` — wenn der Lead nicht erstellt wird, bricht die
gesamte Close-Integration zusammen.

### Phase 2: Kickoff (kc01-kc06)

| Szenario | Aktuell | Soll |
|----------|---------|------|
| Kunde kommt nicht zum Termin | Automation laeuft weiter ohne Transkript | Check nach Termin-Zeitpunkt: Transkript vorhanden? Nein → Close Status "Blocked — Kickoff No-Show", ClickUp Task "Neuen Termin vereinbaren", Automation pausiert |
| Verbindung bricht ab | Transkript unvollstaendig, Automation merkt nichts | Transkript-Laenge pruefen: <500 Woerter → Warning "Kickoff zu kurz", AM entscheidet ob Follow-Up noetig |
| Transkript zu kurz (15min statt 45min) | AI generiert duenne Bausteine, niemand merkt's | Quality Gate: Completeness Score der Bausteine. <70% → Block, Follow-Up Fragebogen an Client senden |

### Phase 3: V2 Extraktion & AI-Generierung

| Node | Was kann brechen | Aktuell | Soll |
|------|-----------------|---------|------|
| v2-extract (88 Bausteine) | 90s Timeout, Context Window exceeded, Transkript zu lang | `null` zurueck → ALLE 12 AI-Docs orphaned | Chunking bei langen Transkripten, Checkpoint-Saving, Retry mit laengerem Timeout (180s) |
| v2-st01 bis v2-st05 | 120s Timeout, Token-Limit, vorherige Docs fehlen | Stiller Fehler, naechster Node startet trotzdem | Kontext-Validierung (braucht `bausteine`), bei Fehler: Partial Save + Retry |
| v2-cc01 bis v2-cc07 | Gleiche Probleme + vorherige Docs nicht im Context | Copy-Phase komplett ohne Input | Abbruch wenn Strategy-Phase fehlgeschlagen, nicht blind weitermachen |
| v2-close-strategy | `opportunity_id` fehlt | Close-Update schlaegt fehl | Skip + Warning wenn ID fehlt |

**Kritischster Node:** `v2-extract` — wenn die Baustein-Extraktion fehlschlaegt,
sind alle 12 nachfolgenden AI-Dokumente wertlos.

### Phase 4: Meta Kampagnen (ca01-ca11)

| Node | Was kann brechen | Auswirkung | Loesung |
|------|-----------------|------------|---------|
| ca01-ca03 Custom Audiences | Pixel hat <100 Events | Audience zu klein, Ads nicht auslieferbar | Check Pixel-Daten VOR Audience-Erstellung |
| ca04 Initial-Kampagne | **Werbekonto gesperrt**, Rate Limit | Kampagne nicht erstellt, kein `campaign_id` fuer Ad Sets | Werbekonto-Status pruefen VOR Erstellung, bei Sperre: Sofort-Alert + ClickUp Task |
| ca05 Initial Ad Sets | `campaign_id` fehlt (Kaskade von ca04) | Keine Ads | Kontext-Validierung |
| ca06-ca09 RT + WU | Rate Limit (20 Kampagnen/15min) | 1/3 Kampagnen erstellt, Rest fehlt, kein Resume | **Rate-Limiter:** 429 erkennen → 10 Min warten → Retry |
| rl10 Kampagnen aktivieren | Budget falsch, Account restricted | Geld wird verbrannt oder nichts passiert | **Budget-Bestaetigung:** AM muss Budget explizit bestaetigen vor Launch |
| rl13 Performance-Sync | Kampagne erst 5 Min alt, keine Daten | Leeres Airtable Dashboard | Nur syncen wenn Kampagne >24h laeuft |

**Kritischste Szenarien:**
1. Werbekonto gesperrt → betrifft ALLE Clients auf diesem Account
2. Budget-Dezimalfehler → 500 EUR statt 50 EUR/Tag = 15.000 EUR/Monat verschwendet
3. 0 Leads nach 2 Wochen → 3.000 EUR verbrannt, Client wuetend

### Phase 5: Launch & Live (rl01-rl13)

| Pruefung | Wann | Was |
|----------|------|-----|
| End-to-End Funnel Test | VOR Launch | Ad klicken → Landing Page → Formular ausfuellen → Test-Lead pruefen |
| Budget-Bestaetigung | VOR Launch | AM bestaetigt: "Tagesbudget 50 EUR, geschaetzt 1.500 EUR/Monat" |
| Performance-Check | 24h nach Launch | Impressions > 0? Clicks > 0? Landing Page erreichbar? |
| Zero-Lead-Alert | 72h nach Launch | **KRITISCH:** 0 Leads nach 3 Tagen = sofortige Untersuchung |
| Taeglicher Digest | Taeglich 09:00 | Pro Client: Spend, Leads, CPL, Status (Gruen/Gelb/Rot) |
| Overspend-Alert | Alle 4h (erste 48h) | Spend >120% vom erwarteten → sofortiger Alert |

---

## 4. Reale Agentur-Szenarien

### Szenario 1: "Client aendert die Rolle"

**Haeufigkeit:** ~30% aller Clients

**Ablauf:**
1. Client signed fuer "Frontend Developer"
2. Im Kickoff: "Eigentlich brauchen wir Fullstack"
3. Oder schlimmer: NACH Strategy-Approval: "Doch lieber DevOps"

**Loesung — Gate-System:**

| Gate | Aenderung | Konsequenz |
|------|-----------|------------|
| Vor Strategy-Approval | Kostenlos | Bausteine neu extrahieren, Docs neu generieren |
| Nach Strategy-Approval, vor Copy | 2 Tage Verzoegerung | Alte Docs archivieren, neue generieren |
| Nach Copy, vor Ads | Erheblicher Aufwand | Neues Kampagnen-Setup, Commercial Impact besprechen |
| Nach Launch | Neue Kampagne | Laufende Kampagne pausieren, komplett neues Setup |

**Automation-Verhalten:**
- Alte Artifacts archivieren (nicht loeschen)
- Ab dem Gate neu starten wo die Aenderung relevant wird
- AM bekommt automatische Impact-Analyse

### Szenario 2: "Client ghostet, dann Rush-Anfrage"

**Haeufigkeit:** Extrem haeufig

**Loesung — Auto-Follow-Up Sequenz:**

| Tag | Aktion |
|-----|--------|
| Tag 2 nach Delivery | Slack: "Strategie liegt zur Freigabe bereit" |
| Tag 5 | Slack: "Freigabe steht noch aus — wir benoetigen Feedback um im Zeitplan zu bleiben" |
| Tag 10 | Slack + AM: "Projekt wird auf Pause gesetzt" |
| Tag 14 | Auto-Pause: Close Status → "Paused — No Response", alle Timer eingefroren |

**Bei Reaktivierung:**
- Timeline wird NEU berechnet ab Reaktivierung, nicht ab Original-Start
- Rush-Anfrage → Kapazitaets-Check: Wie viele andere Clients sind gerade in-flight?
- Realistischen neuen Zeitplan kommunizieren

### Szenario 3: "Werbekonto gesperrt"

**Ablauf:**
1. ca04 versucht Kampagne zu erstellen → HTTP 403
2. Aktuell: Stiller Fehler, `null` zurueck, Automation "laeuft weiter"

**Soll:**
1. 403/Account-Disabled erkennen
2. Sofort: Slack Alert an AM + Team Lead
3. ClickUp Task erstellen: "Werbekonto pruefen — [Client]"
   - Checkliste:
     - [ ] Werbekonto-Status in Business Manager pruefen
     - [ ] Zahlungsmethode checken
     - [ ] Ggf. Support-Ticket bei Meta eroeffnen
     - [ ] Wenn geloest: Automation ab Node ca04 fortsetzen
4. Close: Lead-Status → "Blocked — Werbekonto"
5. Airtable: Client Status → "Blocked"
6. Automation pausiert an diesem Punkt
7. Wenn AM bestaetigt "geloest" → Automation setzt ab ca04 fort

### Szenario 4: "0 Leads nach 2 Wochen"

**Das Nightmare-Szenario:** 3.000 EUR verbrannt, Client hat nichts.

**Ursachen:**
- Tracking Pixel kaputt
- Formular auf Landing Page defekt
- Leads kommen an, gehen aber an falsche Email
- Conversion Event falsch konfiguriert
- Ads laufen, aber Targeting ist komplett falsch

**Loesung — Mehrstufiges Alert-System:**

| Zeitpunkt | Alert | Empfaenger |
|-----------|-------|-----------|
| Launch +24h | "Impressions: [X], Clicks: [X], Leads: [X]" | AM |
| Launch +72h, 0 Leads | **URGENT:** "0 Leads nach 3 Tagen. Budget verbrannt: [X] EUR" | AM + Team Lead + Automation Owner |
| Launch +72h, 0 Leads | Auto-Diagnose: Pixel feuert? LP erreichbar? Formular funktioniert? | Automatisch |
| Taeglich | Performance Digest mit Ampel (Gruen/Gelb/Rot) | AM |
| CPL >250 EUR | "Kritische Unterperformance" | AM + Team Lead |

**Pflicht bei Launch:**
- End-to-End Test: Ad klicken → LP → Formular → Test-Lead verifizieren
- Dieser Test ist NICHT optional
- Automation blockiert Launch bis Test-Lead bestaetigt

### Szenario 5: "Mehrere Rollen pro Client"

**Problem:** Client will Frontend + Backend + PM einstellen.
Ein Ad Account, ein Budget, drei Kampagnen.

**Datenmodell-Anpassung:**

```
Client (1)
  ├── Kampagne A: Frontend Developer (eigene Docs, eigene Ads)
  ├── Kampagne B: Backend Developer (eigene Docs, eigene Ads)
  └── Kampagne C: Project Manager (eigene Docs, eigene Ads)

Shared Resources (Client-Level):
  - Ad Account
  - Slack Channel
  - Drive Ordner (mit Unterordnern pro Kampagne)
  - Close Lead (mit mehreren Opportunities)

Kampagnen-spezifisch:
  - Bausteine (pro Rolle anders)
  - Strategy + Copy Docs
  - Meta Kampagnen + Ad Sets
  - Performance Tracking
```

### Szenario 6: "AI halluziniert Firmendaten"

**Problem:** AI schreibt "Gegruendet 2018" obwohl die Firma seit 2015 existiert.
Klingt plausibel → faellt beim Review nicht auf → geht in die Ads.

**Loesung:**
- Jeder Fakt der in die Docs geht muss getaggt sein: "Quelle: Transkript" vs "Quelle: AI-Inferenz"
- AI-inferierte Fakten werden highlighted und muessen manuell bestaetigt werden
- Cross-Check: AI-Aussagen gegen Website-Impressum validieren
- "Verified Facts" Datenbank pro Client — einmal bestaetigt, fuer alle Docs gueltig

### Szenario 7: "Anzeigentexte verletzen DACH Employment-Regeln"

**Problem:** AI generiert "junges dynamisches Team" (Altersdiskriminierung)
oder "Entwicklerin gesucht" (geschlechtsspezifisch). Meta sperrt die Ads —
manchmal erst nach 3 Tagen, nachdem Budget verbrannt wurde.

**Loesung — Compliance-Scan:**

Blocklist (waechst mit jeder Ablehnung):
- "jung/junges/jungen" im Kontext von Team/Mitarbeiter
- Geschlechtsspezifische Endungen (-in, -innen wenn exklusiv)
- Altersangaben im Targeting (<25 oder >55)
- PLZ-Targeting unter Mindestradius
- "Special Ad Category: Employment" nicht gesetzt

Scan laeuft NACH AI-Generierung, VOR Client-Review:
- Auto-Fix wo moeglich ("junges" → "motiviertes")
- Flag wo Auto-Fix riskant ist → menschliche Pruefung
- Kein Ads-Upload ohne bestandenen Compliance-Scan

### Szenario 8: "Account Manager ist krank"

**Problem:** AM betreut 15 Clients, faellt 1 Woche aus. 4 Clients warten auf Approval,
2 Clients haben Feedback geschickt, 1 Client-Kampagne laeuft unmonitored.

**Loesung:**
- Jeder Task hat Primary Owner + Backup Owner
- 24h keine Aktion → automatisch an Backup routen
- 48h keine Aktion → Team Lead benachrichtigen
- Kritische Aktionen (Launch, Budget-Aenderungen) brauchen IMMER menschliche Bestaetigung

### Szenario 9: "Client zahlt nicht"

**Loesung — Payment Gates:**

| Phase | Payment erforderlich? |
|-------|-----------------------|
| Onboarding | Nein (Engagement aufbauen) |
| Strategy Docs | Nein |
| Copy Docs | Nein |
| Ad Creation | **Ja — erste Zahlung** |
| Campaign Launch | **Ja — Zahlung bestaetigt** |
| Laufende Kampagne | 14 Tage ueberfaellig → Auto-Pause |

### Szenario 10: "Kampagne pausieren/unpausieren"

**Pause:**
- Meta Kampagnen → Status "PAUSED" (nicht loeschen)
- Performance Tracking laeuft weiter (Vergleich vor/nach)
- Alle Timer eingefroren
- Close Status → "Paused"

**Unpause:**
- Health Check: Alle Integrationen noch aktiv?
- Landing Page noch erreichbar?
- Ad Account noch aktiv?
- Budget noch korrekt?
- Erst nach bestandenem Health Check wieder aktivieren

**Geplante Pause:**
- "Pause am 23.12., Unpause am 07.01."
- Automation handhabt das automatisch
- Pause >60 Tage → Content Refresh noetig (Ad Fatigue, veraltete Texte)

---

## 5. Architektur: Error-Handling System

### 5.1 Node-Status-Modell

```
                    ┌──────────┐
           ┌───────│  pending  │
           │        └────┬─────┘
           │             │ start
           │        ┌────▼─────┐
           │        │ running  │
           │        └────┬─────┘
           │             │
           │    ┌────────┼────────┐
           │    │        │        │
      ┌────▼───▼┐  ┌────▼────┐  ┌▼────────┐
      │  failed  │  │completed│  │ blocked  │
      └────┬─────┘  └─────────┘  └────┬─────┘
           │                          │
      ┌────▼─────┐              ┌─────▼─────┐
      │ retrying │              │  waiting   │
      │ (1/3)    │              │ (manual)   │
      └────┬─────┘              └─────┬──────┘
           │                          │
      ┌────▼─────┐              ┌─────▼─────┐
      │ completed│              │  resumed   │
      │ or       │              │  → running │
      │ escalated│              └────────────┘
      └──────────┘
```

Neue Status:
- **blocked** — Vorbedingung nicht erfuellt (fehlende ID, gesperrtes Konto)
- **retrying** — Automatischer Retry laeuft (1/3, 2/3, 3/3)
- **waiting** — Manueller Eingriff noetig, Automation pausiert
- **escalated** — Retries erschoepft, menschliche Intervention noetig

### 5.2 Retry-Strategie

| Node-Typ | Max Retries | Backoff | Timeout |
|-----------|-------------|---------|---------|
| API-Calls (Close, Slack, ClickUp) | 3 | 2s → 5s → 15s | 30s |
| AI-Generierung (OpenRouter) | 2 | 10s → 30s | 120s → 180s |
| Meta API | 3 | 60s → 300s → 600s (Rate-Limit aware) | 30s |
| Airtable | 3 | 1s → 3s → 10s | 15s |
| Google APIs | 3 | 2s → 5s → 15s (Auto OAuth Refresh bei 401) | 30s |

### 5.3 Kontext-Validierung (Required Fields pro Node)

```python
NODE_REQUIREMENTS = {
    "is09": ["list_id"],           # ClickUp Tasks braucht list_id von is08
    "is10": ["opportunity_id"],    # Close Stage braucht opp_id von is02
    "kc05": ["opportunity_id", "list_id"],
    "v2-airtable-client": [],      # Kann ohne Vorbedingung laufen
    "v2-extract": ["airtable_client_id"],
    "v2-st01": ["bausteine"],      # Braucht Bausteine von v2-extract
    "v2-st02": ["bausteine", "generated_docs.zielgruppen_avatar"],
    "v2-close-strategy": ["opportunity_id"],
    "ca04": [],                    # Kann ohne Vorbedingung laufen
    "ca05": ["meta_campaigns.initial", "image_hashes"],
    "ca06": [],
    "ca07": ["meta_campaigns.retargeting"],
    "rl10": ["meta_campaigns"],    # Braucht alle Kampagnen-IDs
    "rl13": ["meta_campaigns"],
}
```

Wenn Required Fields fehlen:
1. Node geht in Status "blocked"
2. Error-Message: "Node [X] blockiert: [field] fehlt (sollte von [Y] kommen)"
3. Slack Alert an AM
4. ClickUp Task: "Pruefen warum [Y] fehlgeschlagen ist"

### 5.4 Benachrichtigungs-Architektur

**3 Kanaele mit unterschiedlicher Dringlichkeit:**

| Kanal | Dringlichkeit | Beispiele |
|-------|---------------|-----------|
| Slack #fulfillment-digest | Taeglich 09:00 | Performance Digest, Status aller Clients |
| Slack DM an AM | Innerhalb 24h | Approval noetig, Client-Feedback eingegangen |
| Slack #fulfillment-alerts | **Sofort** | 0 Leads, Werbekonto gesperrt, Budget-Ueberschreitung |

**Alert-Struktur:**

```
⚠️ [SEVERITY] — [Client Name]

Problem: [Beschreibung]
Node: [Node ID + Label]
Phase: [Infrastructure / Kickoff / Strategy / Copy / Campaigns / Launch]
Zeitpunkt: [Timestamp]

Auswirkung: [Was ist kaputt]
Vermutliche Ursache: [API Error / Missing Data / Rate Limit]

Empfohlene Aktion:
1. [Konkreter Schritt]
2. [Konkreter Schritt]

Nach Behebung: Automation ab Node [X] fortsetzen
```

### 5.5 Close Lead-Status als Steuerungsebene

Bestehende Pipeline-Stages bleiben (Opportunity-Level).
Zusaetzlich: **Lead-Status** (Lead-Level) fuer Steuerung:

| Lead-Status | Bedeutung | Automation-Verhalten |
|-------------|-----------|---------------------|
| Active | Alles laeuft | Normal fortsetzen |
| Blocked — [Grund] | Manueller Eingriff noetig | Automation pausiert, Alert gesendet |
| Paused — Client | Client hat Pause angefragt | Alles eingefroren |
| Paused — No Response | Client antwortet nicht | Auto-Pause nach 14 Tagen |
| Paused — Payment | Zahlung ueberfaellig | Keine neuen Ausgaben |
| Waiting for Approval | Deliverable liegt beim Client | Follow-Up Sequenz aktiv |
| Resumed | Fix bestaetigt, weiter gehts | Automation setzt fort ab letztem Node |

### 5.6 Persistierung (nicht nur in-memory)

Aktuell: `_context` und `_nodeResults` sind in-memory → weg bei Server-Neustart.

**Soll:** Execution State in Datei oder DB persistieren:

```json
{
  "execution_id": "exec_2026-03-09_novacode",
  "client": "Novacode GmbH",
  "started_at": "2026-03-09T10:00:00Z",
  "current_phase": "v2-strategy",
  "context": { "lead_id": "...", "opportunity_id": "...", ... },
  "node_results": {
    "v2-create-lead": { "status": "completed", "result": {...}, "duration_ms": 3200 },
    "v2-airtable-client": { "status": "completed", "result": {...}, "duration_ms": 1800 },
    "v2-extract": { "status": "failed", "error": "Timeout after 90s", "retries": 2 },
    "v2-st01": { "status": "blocked", "reason": "bausteine fehlt (v2-extract fehlgeschlagen)" }
  },
  "paused_at": "2026-03-09T10:05:00Z",
  "pause_reason": "v2-extract fehlgeschlagen nach 2 Retries",
  "resume_from": "v2-extract"
}
```

So kann man:
- Nach Server-Neustart den State wiederherstellen
- Ab jedem beliebigen Node fortsetzen
- Execution-History pro Client einsehen

---

## 6. Implementierungsplan

### Prioritaet 1 — Sofort-Schutz (verhindert Geldverbrennung)

| # | Task | Aufwand | Impact |
|---|------|---------|--------|
| 1.1 | **Error → Slack Alert** fuer jeden fehlgeschlagenen Node | 1 Tag | Sofort sichtbar wenn was bricht |
| 1.2 | **Zero-Lead-Alert** nach 72h | 0.5 Tage | Verhindert das Nightmare-Szenario |
| 1.3 | **Budget-Bestaetigung** vor Campaign Launch | 0.5 Tage | Verhindert 10x Budget |
| 1.4 | **End-to-End Funnel Test** bei Launch (Pflicht) | 1 Tag | Verhindert 0-Leads wegen kaputtem Tracking |

### Prioritaet 2 — Robustheit (80% der Zufallsfehler loesen sich selbst)

| # | Task | Aufwand | Impact |
|---|------|---------|--------|
| 2.1 | **Retry mit Backoff** (3x, konfigurierbar pro Node-Typ) | 1.5 Tage | Timeouts, kurze Ausfaelle → kein Problem mehr |
| 2.2 | **Kontext-Validierung** (Required-Checks vor Node-Start) | 1 Tag | Kaskaden-Fehler verhindern |
| 2.3 | **Meta Rate-Limiter** (429 erkennen, 10min warten, retry) | 1 Tag | Kampagnen-Phase robust |
| 2.4 | **Google OAuth proaktiver Refresh** (bei 50% Lifetime) | 0.5 Tage | Weekend-Ausfaelle verhindern |

### Prioritaet 3 — Steuerung (Kontrolle ueber den Prozess)

| # | Task | Aufwand | Impact |
|---|------|---------|--------|
| 3.1 | **Close Lead-Status** als Steuerungsebene (Blocked/Paused/Resumed) | 1 Tag | Sichtbar wo es haengt |
| 3.2 | **Pause/Resume** ab beliebigem Node | 2 Tage | Manuelles Fortsetzen nach Fix |
| 3.3 | **Execution State Persistierung** (JSON-Datei pro Run) | 1 Tag | State ueberlebt Server-Neustart |
| 3.4 | **ClickUp Task bei Fehler** mit Checkliste | 1 Tag | Klare Handlungsanweisung fuer AM |

### Prioritaet 4 — Qualitaetssicherung

| # | Task | Aufwand | Impact |
|---|------|---------|--------|
| 4.1 | **Approval SLAs + Follow-Up Sequenz** (Tag 2/5/10/14) | 1 Tag | Keine unendlichen Wartezeiten |
| 4.2 | **DACH Compliance-Scan** fuer Anzeigentexte | 1.5 Tage | Meta-Ablehnungen verhindern |
| 4.3 | **Kickoff Completeness Score** (<70% → Follow-Up) | 1 Tag | Duenne Transkripte erkennen |
| 4.4 | **Duplikat-Erkennung** in Close (vor Lead-Erstellung) | 0.5 Tage | Keine doppelten Leads bei Re-Run |

### Prioritaet 5 — Skalierung (ab Client #10+)

| # | Task | Aufwand | Impact |
|---|------|---------|--------|
| 5.1 | **Performance Digest** (taeglich 09:00, Ampel pro Client) | 1.5 Tage | Proaktives Monitoring |
| 5.2 | **Multi-Kampagnen pro Client** (Datenmodell-Anpassung) | 2 Tage | Mehrere Rollen pro Client |
| 5.3 | **Onboarding-Queue** (FIFO, kein paralleles Processing) | 1 Tag | Race Conditions verhindern |
| 5.4 | **API Health Dashboard** (alle 6h Status aller Integrationen) | 1 Tag | Proaktiv statt reaktiv |
| 5.5 | **Client Data Correction Workflow** (Name/Rolle aendern propagiert) | 2 Tage | Aenderungen sauber durchziehen |

---

## Zusammenfassung

**Gesamtaufwand Prio 1-3:** ~12 Tage
**Gesamtaufwand Prio 4-5:** ~12 Tage

**Reihenfolge:**
1. Zuerst Prio 1 (Sofort-Schutz) → kein Geld mehr verbrennen
2. Dann Prio 2 (Retry + Validierung) → 80% der technischen Fehler weg
3. Dann Prio 3 (Steuerung) → Kontrolle ueber den Prozess
4. Prio 4+5 iterativ, basierend auf echten Client-Erfahrungen

Die wichtigste Erkenntnis: **Es geht nicht darum, Fehler zu verhindern
(die passieren immer), sondern darum, sie sofort zu erkennen, klar zu
kommunizieren, und einen definierten Weg zur Behebung zu haben.**
