# Phase G: Predict-Audit Fixes — 35 Issues, priorisiert

> Basierend auf dem 5-Persona Predict-Audit vom 24.03.2026
> 11 Critical, 20 High, 16 Medium — hier nur die die wir JETZT fixen

---

## Sprint G1: Security (SOFORT) — ~1 Tag

### G1.1 Hardcoded API Key entfernen
**Datei:** `services/api.ts:176`
**Problem:** `'flowstack-demo-2026'` als Fallback im Bundle
**Fix:** Fallback entfernen, Error werfen wenn Key fehlt:
```typescript
const API_KEY = import.meta.env.VITE_API_KEY;
if (!API_KEY) console.warn('[API] VITE_API_KEY not set — API calls will fail');
```

### G1.2 XSS Sanitization
**Dateien:** `pages-deliverables/Editor.tsx:354`, `components/DocPreview.tsx`
**Problem:** `dangerouslySetInnerHTML={{ __html: content }}` ohne Sanitization
**Fix:** DOMPurify installieren und Content sanitizen:
```
npm install dompurify @types/dompurify
```
```typescript
import DOMPurify from 'dompurify';
dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content || '') }}
```

### G1.3 Error Message Sanitization
**Datei:** `services/api.ts:193-195`
**Problem:** Backend Stack Traces werden an Client durchgereicht
**Fix:** Bei 5xx nur generische Meldung:
```typescript
const errorMsg = resp.status >= 500 ? 'Server-Fehler' : text;
throw new ApiError(resp.status, errorMsg);
```

---

## Sprint G2: Kritische State-Bugs — ~2 Tage

### G2.1 Phase-Advance bei ALL rejected fixen
**Datei:** `store/fulfillment-store.ts:528-530`
**Problem:** Wenn alle Deliverables einer Phase rejected sind, springt Client trotzdem zur nächsten Phase
**Fix:** Mindestens 1 Deliverable muss approved/live sein:
```typescript
const hasApproved = phaseDeliverables.some(
  (d) => d.status === 'approved' || d.status === 'live'
);
const allPhaseDecided = phaseDeliverables.length > 0 && hasApproved && phaseDeliverables.every(
  (d) => d.status === 'approved' || d.status === 'live' || d.status === 'rejected'
);
```

### G2.2 Pipeline Status per Client statt global
**Datei:** `store/fulfillment-store.ts:140, 924-933`
**Problem:** Ein `pipeline: PipelineStatus | null` Feld für alle Clients. Client A sieht Pipeline von Client B.
**Fix:** `pipeline` → `pipelineByClient: Record<string, PipelineStatus>`:
```typescript
// Interface:
pipelineByClient: Record<string, PipelineStatus>;

// loadPipeline:
set((state) => ({
  pipelineByClient: { ...state.pipelineByClient, [clientId]: pipeline }
}));
```
Dann in PipelineDetail: `useFulfillmentStore(s => s.pipelineByClient[clientId])`

### G2.3 Partial Rollback fixen (Timeline + Phase)
**Datei:** `store/fulfillment-store.ts:550-560`
**Problem:** Bei API-Fehler wird Deliverable zurückgesetzt, aber Timeline-Event und Client-Phase bleiben
**Fix:** Timeline-Event ID merken und im Rollback entfernen:
```typescript
const timelineEventId = `tl-auto-${Date.now()}`;
// ... im catch:
set((state) => ({
  deliverables: ..., // rollback
  approvals: ..., // rollback
  timeline: state.timeline.filter(t => t.id !== timelineEventId), // rollback timeline
}));
```

### G2.4 loadClients Mock-Fallback transparent machen
**Datei:** `store/fulfillment-store.ts:299-307`
**Problem:** Bei API-Fehler werden Mock-Daten geladen, User merkt nichts
**Fix:** Neues State-Feld `isUsingMockData: boolean`:
```typescript
// Bei Mock-Fallback:
set({ clients: mockClients, ..., isUsingMockData: true });

// Im UI (Home.tsx):
if (isUsingMockData) {
  // Orange Banner: "Demo-Modus — Backend nicht erreichbar"
}
```

---

## Sprint G3: Performance — ~1-2 Tage

### G3.1 O(N²) Loop in loadClients fixen
**Datei:** `store/fulfillment-store.ts:266-289`
**Problem:** `clients.find()` in Loop über Executions = O(N²)
**Fix:** Map für O(1) Lookup:
```typescript
const clientMap = new Map(clients.map(c => [c.company.toLowerCase(), c]));
for (const ex of executions.value) {
  const existing = clientMap.get(ex.client_name.toLowerCase())
    || clients.find(c => c.id === ex.execution_id);
}
```

### G3.2 ClientList Pagination
**Datei:** `pages-clients/ClientList.tsx`
**Problem:** Alle Cards rendern auf einmal bei 100+ Clients
**Fix:** "Mehr laden" Button, initial 24 Cards:
```typescript
const [visibleCount, setVisibleCount] = useState(24);
const visibleClients = filteredClients.slice(0, visibleCount);
// Button: setVisibleCount(prev => prev + 24)
```

### G3.3 getAmpelColor memoizen
**Datei:** `pages-clients/ClientList.tsx:123-133`
**Problem:** Funktion wird bei jedem Render neu erstellt
**Fix:** `useCallback` wrappen

---

## Sprint G4: UX Consistency — ~1-2 Tage

### G4.1 Approval-Flow standardisieren
**Dateien:** `Home.tsx`, `ApprovalBar.tsx`, `DeliverableList.tsx`, `Editor.tsx`
**Problem:** 3 verschiedene Approval-Patterns
**Fix:** Überall Modal-Confirmation:
- Klick "Freigeben" → Modal: "Deliverable X freigeben?" → [Abbrechen] [Freigeben]
- Kein Two-State-Toggle, kein Inline-Confirm

### G4.2 Table Header accessible machen
**Datei:** `pages-dashboard/Home.tsx:425-468`
**Problem:** `<span onClick>` statt `<button>` für Sort
**Fix:** `<span>` → `<button>`, plus `aria-sort` Attribut

### G4.3 Status-Dots mit aria-label
**Dateien:** `Home.tsx:486`, `ClientList.tsx:280`
**Problem:** Farbige Punkte ohne Screen-Reader-Label
**Fix:** `aria-label={statusLabel}` hinzufügen

### G4.4 KPI Trends nicht hardcoden
**Datei:** `Home.tsx:212, 234, 257, 280`
**Problem:** "+50%", "+12%" sind hardcoded
**Fix:** Entfernen oder aus Daten berechnen. Wenn keine echten Daten: Trend-Badge weglassen.

---

## Reihenfolge

| Sprint | Fokus | Dauer | Dateien |
|--------|-------|-------|---------|
| **G1** | Security | 1 Tag | api.ts, Editor.tsx, DocPreview.tsx |
| **G2** | State-Bugs | 2 Tage | fulfillment-store.ts, Home.tsx |
| **G3** | Performance | 1-2 Tage | fulfillment-store.ts, ClientList.tsx |
| **G4** | UX Consistency | 1-2 Tage | Home.tsx, ApprovalBar.tsx |

**G1 und G2 können parallel laufen** (verschiedene Dateien).
**G3 und G4 können parallel laufen** (verschiedene Dateien, ausser Home.tsx).

---

## Nicht in Scope

- Echte Auth (OAuth/Session) — braucht Backend-Arbeit
- CSRF-Token — Backend muss generieren
- Client-Side Authorization — sinnlos ohne echte Auth
- react-window Virtualisierung — Pagination reicht erstmal
- Modal Focus Trap — prüfen ob Radix Dialog das schon hat
