# PLAN: Kunden-Hub × V3 Automation — Vollständige Verbindung

## Context
Die Kunden-Hub UI existiert als vollständige React-App mit 6 Tabs (Pipeline, Inhalte, Notizen, Performance, Verbindung, Zeitstrahl), Zustand Store, Editor, und Onboarding-Wizard. Die V3 Automation hat 82 Handler, CRUD API, Execution State. **Aktuell läuft alles auf Mock-Daten.** Ziel: Echte Verbindung — UI zeigt live V3-Daten, steuert Freigaben, spiegelt Dokumente.

## Architektur-Übersicht

```
Kunden-Hub UI (React)
       ↕ HTTP/REST
V3 Server (FastAPI :3002)
       ↕
V3 Execution Engine → Close, Slack, Drive, Meta, Airtable, ClickUp
```

**Kern-Prinzip:** Der Zustand Store (`fulfillment-store.ts`) wird von Mock-Daten auf echte API-Calls umgestellt. Jede Store-Action wird zu einem `fetch()` gegen den V3 Server.

---

## Phase A: Backend-Erweiterung (neue API Endpoints)

### A1: Client-Execution Mapping
Aktuell sind Clients (Airtable) und Executions (JSON State) getrennt. Die UI braucht eine zusammengeführte Sicht.

**Neuer Endpoint:** `GET /api/v3/clients/{client_id}/execution`
- Findet die aktive Execution für einen Client
- Returned: Execution State + Nodes + Context
- Fallback: Wenn keine Execution → leere Response

**Neuer Endpoint:** `POST /api/v3/clients/{client_id}/start`
- Startet eine neue V3 Execution für den Client
- Nimmt Client-Daten aus Airtable, mapped sie auf Execution-Input
- Returned: execution_id

### A2: Deliverable-Endpoints (Dokument-Inhalte)
Die UI braucht Zugriff auf die generierten Dokumente — nicht nur URLs, sondern den echten Content.

**Neuer Endpoint:** `GET /api/v3/clients/{client_id}/deliverables`
- Liest `generated_docs` aus dem Execution Context
- Mapped jeden doc_key auf ein Deliverable-Objekt (id, title, content, status, url)
- Status kommt aus den Node-States (generating/draft/approved/etc.)

**Neuer Endpoint:** `PUT /api/v3/deliverables/{doc_key}/content`
- Updated den Content eines Deliverables
- Schreibt zurück in den Execution Context UND in das Google Doc
- Setzt Status auf "manually_edited"

**Neuer Endpoint:** `POST /api/v3/deliverables/{doc_key}/regenerate`
- Triggert die KI-Neugenerierung für dieses Dokument
- Führt den entsprechenden Node nochmal aus (z.B. v3-st01 für Zielgruppen-Avatar)
- Erhöht die Version-Nummer

### A3: Approval-Endpoints (erweitert)
Die bestehenden Approval-Endpoints sind zu simpel. Die UI braucht:

**Erweiterung:** `POST /api/v3/deliverables/{doc_key}/approve`
- Approved ein einzelnes Deliverable (nicht den ganzen Gate)
- Tracked wer, wann, mit Kommentar
- Wenn ALLE Deliverables einer Phase approved → Gate automatisch freigeben

**Erweiterung:** `POST /api/v3/deliverables/{doc_key}/reject`
- Setzt Status auf "rejected"
- Optionaler Kommentar warum
- Triggert optional KI-Neugenerierung

**Neuer Endpoint:** `POST /api/v3/deliverables/{doc_key}/request-changes`
- Setzt Status auf "changes_requested"
- Speichert Feedback-Kommentar

### A4: Pipeline-Status Endpoint
**Neuer Endpoint:** `GET /api/v3/clients/{client_id}/pipeline`
- Aggregiert Node-States zu Phasen-Fortschritt
- Returned: `{phases: [{name, status, progress, total_nodes, completed_nodes, current_node}]}`
- 7 Phasen: Onboarding → Strategy → Copy → Funnel → Campaigns → Review → Live

### A5: Timeline-Endpoint
**Neuer Endpoint:** `GET /api/v3/clients/{client_id}/timeline`
- Aggregiert aus Node-States: wann was passiert ist
- Jeder Node-Completion → Timeline-Event
- Jede Approval → Timeline-Event
- Jeder Alert → Timeline-Event
- Returned: `[{type, title, description, timestamp, actor}]`

### A6: Performance-Endpoint
**Neuer Endpoint:** `GET /api/v3/clients/{client_id}/performance`
- Holt Meta Insights für alle campaign_ids des Clients
- Aggregiert: Impressions, Clicks, Spend, Leads, CTR, CPL, Frequency
- Tagesauflösung für Charts
- Returned: `{summary: {}, daily: [{date, impressions, clicks, spend, leads}]}`

### A7: Meta Ads Verwaltung
**Neuer Endpoint:** `GET /api/v3/clients/{client_id}/ads`
- Listet alle erstellten Ads mit Creative-Details
- Für jede Ad: Bild-URL, Headline, Body Text, CTA, Status

**Neuer Endpoint:** `PUT /api/v3/ads/{ad_id}`
- Updated Ad Creative (Text, CTA)
- Pushed Änderung direkt zu Meta API

**Datei:** `v3/api.py` (erweitern)

---

## Phase B: Store-Umbau (Mock → API)

### B1: API-Service Layer
**Neue Datei:** `src/modules/kunden-hub/services/api.ts`
```typescript
const API_BASE = 'http://localhost:3002/api/v3'
export const api = {
  clients: { list, get, create, update },
  executions: { start, getStatus, executeNode },
  deliverables: { list, getContent, updateContent, approve, reject, regenerate },
  pipeline: { getStatus },
  timeline: { getEvents },
  performance: { getSummary, getDaily },
  ads: { list, update },
  health: { check },
}
```

### B2: Store-Actions umschreiben
**Datei:** `src/modules/kunden-hub/store/fulfillment-store.ts`

Jede Aktion die aktuell Mock-Daten manipuliert → API-Call:
- `loadClients()` → `GET /api/v3/clients`
- `addClient(data)` → `POST /api/v3/clients` + `POST /api/v3/clients/{id}/start`
- `approveDeliverable(id)` → `POST /api/v3/deliverables/{id}/approve`
- `rejectDeliverable(id)` → `POST /api/v3/deliverables/{id}/reject`
- `updateDeliverableContent(id, content)` → `PUT /api/v3/deliverables/{id}/content`

### B3: Polling für Live-Updates
**Neues Hook:** `useExecutionPolling(clientId, intervalMs = 5000)`
- Pollt `GET /api/v3/clients/{client_id}/execution` alle 5s
- Updated Pipeline, Deliverables, Timeline automatisch
- Stoppt wenn Execution completed/paused

---

## Phase C: UI-Anbindung pro Tab

### C1: Onboarding Wizard → V3 Execution
**Datei:** `pages/NewClient.tsx` (Onboarding Wizard)
- Wizard-Submit → `POST /api/v3/execute` mit Formular-Daten
- Danach Redirect zu ClientDetail mit execution_id
- Pipeline zeigt sofort "Onboarding" als aktive Phase

### C2: Pipeline Tab — Live Automation Tracking
**Datei:** `pages-clients/ClientDetail.tsx` → Pipeline Tab
- `useExecutionPolling()` Hook für Live-Updates
- Phasen-Fortschritt aus `/pipeline` Endpoint
- Aktuelle Phase hervorgehoben
- Nodes die gerade laufen: Spinner
- Nodes die warten: Grau
- Nodes die fertig sind: Grün mit Checkmark
- Approval Gates: Gelber Stopper mit "Freigabe nötig" Button

### C3: Inhalte Tab — Deliverables mit Content
**Datei:** `pages-clients/ClientDetail.tsx` → Deliverables Tab
- Deliverables aus `/deliverables` Endpoint
- Gruppiert nach Phase (Strategy, Copy, Funnel, Campaigns)
- Jedes Deliverable zeigt:
  - Status Badge (Generating/Draft/In Review/Approved/Live/Rejected)
  - Titel
  - Content-Preview (erste 200 Zeichen)
  - Google Docs Link
  - "Bearbeiten" Button → öffnet Editor
  - "Freigeben" / "Ablehnen" Buttons (inline)
- Batch-Approve pro Phase: "Alle [Strategy] freigeben"
- Wenn Deliverable abgelehnt → "Neu generieren" Button

### C4: Editor — Dokument-Bearbeitung in der App
**Datei:** `pages-deliverables/Editor.tsx`
- Lädt Content aus `/deliverables/{doc_key}/content`
- Texteditor (bestehende Textarea)
- Preview-Tab zeigt formatierten Content
- "Speichern" → `PUT /deliverables/{doc_key}/content` (updated Context + Google Doc)
- "Freigeben" → `POST /deliverables/{doc_key}/approve`
- "Ablehnen" → `POST /deliverables/{doc_key}/reject`
- "Neu generieren" → `POST /deliverables/{doc_key}/regenerate`
- Version History aus Execution State

### C5: Meta Ads Tab im Editor
**Datei:** `components/AdReviewView.tsx`
- Zeigt Ad Creative als Facebook Feed Preview
- Felder: Headline, Body Text, CTA Button, Bild, URL
- Alle Felder editierbar
- "Speichern & zu Meta pushen" → `PUT /ads/{ad_id}`
- Zeigt alle Varianten (3 pro Kampagne)

### C6: Performance Tab — Echte Meta Daten
**Datei:** `pages-clients/ClientDetail.tsx` → Performance Tab
- Daten aus `/performance` Endpoint
- KPI Cards: Spend, Leads, CPL, Impressions, CTR
- Chart: Täglicher CPL-Verlauf (Recharts)
- Chart: Tägliche Conversion Rate
- Tabelle: Kampagnen-Breakdown (TOF, RT, WU)

### C7: Timeline Tab — Automation-Verlauf
**Datei:** `pages-clients/ClientDetail.tsx` → Timeline Tab
- Events aus `/timeline` Endpoint
- Vertical Timeline (bestehende Komponente)
- Typen: node_completed, approval_requested, approval_resolved, alert, status_change, manual_edit
- Filter-Buttons: Alle, Approvals, Alerts, System
- Live-Update via Polling

### C8: Connections Tab — Service-Links
**Datei:** `pages-clients/ClientDetail.tsx` → Connections Tab
- Befüllt aus Execution Context:
  - Close: `close_lead_url`
  - Google Drive: `drive_folder_url`
  - Slack: `channel_name`
  - ClickUp: `clickup_list_url`
  - Google Meet: `meet_link`
  - Meta Ads: `ads_manager_url`
- Status: connected wenn URL vorhanden, disconnected wenn leer

---

## Phase D: Approval-Flow (Kernfunktion)

### D1: Einzeln-Freigabe
- User klickt "Freigeben" bei einem Deliverable
- `POST /deliverables/{doc_key}/approve` → Status → approved
- Wenn ALLE Deliverables einer Phase approved:
  - Approval Gate Node automatisch auf "completed" setzen
  - Nächste Phase startet automatisch
  - Timeline Event erstellt

### D2: Ablehnung + Neugenerierung
- User klickt "Ablehnen" → Kommentar-Dialog
- `POST /deliverables/{doc_key}/reject` mit Kommentar
- Optional: "Neu generieren" → führt den KI-Node nochmal aus
- Neue Version wird erstellt, alte bleibt in History

### D3: Manuelles Editieren
- User bearbeitet Content im Editor
- "Speichern" → Content wird in Context UND Google Doc aktualisiert
- Status → "manually_edited"
- "Freigeben" → Status → approved

### D4: Partial Approval (Tag-für-Tag)
- Strategy hat 5 Docs + 1 Gate
- User approved heute Doc 1 und 2, morgen Doc 3, übermorgen Doc 4+5
- Gate löst erst aus wenn 5/5 approved
- Automation wartet geduldig (State ist persistent)

---

## Implementierungsreihenfolge

| # | Was | Wo | Abhängigkeit |
|---|-----|-----|-------------|
| 1 | Backend: Client-Execution Mapping | `v3/api.py` | — |
| 2 | Backend: Deliverable Endpoints | `v3/api.py` | #1 |
| 3 | Backend: Pipeline Status | `v3/api.py` | #1 |
| 4 | Backend: Timeline | `v3/api.py` | #1 |
| 5 | Backend: Performance | `v3/api.py` | #1 |
| 6 | Backend: Ads Verwaltung | `v3/api.py` | — |
| 7 | Frontend: API Service Layer | `services/api.ts` | #1-6 |
| 8 | Frontend: Store Umbau | `fulfillment-store.ts` | #7 |
| 9 | Frontend: Onboarding → Execution | `NewClient.tsx` | #8 |
| 10 | Frontend: Pipeline Live | `ClientDetail.tsx` | #3, #8 |
| 11 | Frontend: Deliverables | `ClientDetail.tsx` | #2, #8 |
| 12 | Frontend: Editor | `Editor.tsx` | #2, #8 |
| 13 | Frontend: Meta Ads | `AdReviewView.tsx` | #6, #8 |
| 14 | Frontend: Performance | `ClientDetail.tsx` | #5, #8 |
| 15 | Frontend: Timeline | `ClientDetail.tsx` | #4, #8 |
| 16 | Frontend: Connections | `ClientDetail.tsx` | #1, #8 |
| 17 | Approval Flow | Backend + Frontend | #2, #11, #12 |

---

## Kritische Dateien

### Backend (erweitern)
| Datei | Änderung |
|-------|---------|
| `v3/api.py` | ~200 Zeilen — 8 neue Endpoints |
| `v3_server.py` | Keine Änderung (Router schon registriert) |
| `v3/execution.py` | Kleine Erweiterung: Node-Re-Execution für Regenerate |

### Frontend (modifizieren)
| Datei | Änderung |
|-------|---------|
| `kunden-hub/services/api.ts` | NEU — API Service Layer |
| `kunden-hub/store/fulfillment-store.ts` | Mock → API Calls |
| `kunden-hub/pages/NewClient.tsx` | Submit → V3 Execute |
| `kunden-hub/pages-clients/ClientDetail.tsx` | Alle 6 Tabs auf echte Daten |
| `kunden-hub/pages-deliverables/Editor.tsx` | Save/Approve/Reject → API |
| `kunden-hub/components/AdReviewView.tsx` | Edit → Push to Meta |
| `kunden-hub/hooks/useExecutionPolling.ts` | NEU — Live Polling Hook |

---

## Verification

### Backend
```bash
# Pipeline Status
curl http://localhost:3002/api/v3/clients/{id}/pipeline

# Deliverables mit Content
curl http://localhost:3002/api/v3/clients/{id}/deliverables

# Timeline
curl http://localhost:3002/api/v3/clients/{id}/timeline

# Performance
curl http://localhost:3002/api/v3/clients/{id}/performance
```

### Frontend
1. Onboarding Wizard ausfüllen → V3 Execution startet
2. Pipeline Tab zeigt Live-Fortschritt
3. Inhalte Tab zeigt generierte Dokumente mit Content
4. Ein Dokument ablehnen → "Neu generieren" → neue Version erscheint
5. Ein Dokument freigeben → Gate löst aus → nächste Phase startet
6. Performance Tab zeigt echte Meta-Daten
7. Timeline zeigt chronologischen Verlauf
