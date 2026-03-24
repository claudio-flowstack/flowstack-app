# Kunden-Hub Masterplan — Von Gut zu Weltklasse

> Ziel: Jede Interaktion fühlt sich schnell, sicher und durchdacht an.
> Kein Feature darf crashen. Jeder State muss recoverable sein.
> Die UI soll so gut sein, dass man sie als SaaS verkaufen könnte.

---

## Grundprinzipien beim Bauen

1. **Kein Optimistic Update ohne Rollback** — Jede Aktion die State ändert muss den Originalzustand sichern und bei API-Fehler wiederherstellen
2. **Kein async ohne Cleanup** — Jeder useEffect mit fetch/polling braucht Cancellation (AbortController oder isMounted)
3. **Kein User-Action ohne Feedback** — Jeder Button zeigt Loading, jeder Fehler zeigt Toast, jeder Erfolg bestätigt
4. **Kein State ohne Validierung** — Status-Transitions werden geprüft, blockedBy wird enforced, Phasen-Reihenfolge wird erzwungen
5. **Build-Check nach jedem Schritt** — `npx vite build` muss grün sein bevor wir weitermachen

---

## Sprint 1: Store Hardening (Fundament)
> Alles baut auf dem Store auf. Wenn der Store buggy ist, ist alles buggy.

### 1.1 Pending-Flag System einführen
**Datei:** `store/fulfillment-store.ts`
**Was:** Neues State-Feld `pendingActions: Set<string>` das trackt welche Deliverable-IDs gerade in einer async Operation sind.
**Warum:** Verhindert Double-Approve, Double-Reject, Double-Regenerate.
**Wie:**
```
- State: pendingActions: new Set<string>()
- Vor jeder async Action: if (pendingActions.has(id)) return
- pendingActions.add(id) am Start
- pendingActions.delete(id) im finally
- UI: Button disabled wenn id in pendingActions
```
**Test:** Doppelklick auf Approve → nur 1 API-Call in Network Tab.

### 1.2 Echtes Rollback-Pattern
**Datei:** `store/fulfillment-store.ts`
**Was:** Vor jedem Optimistic Update den Originalzustand sichern. Bei Fehler: Originalzustand wiederherstellen + toastError().
**Betrifft:**
- `approveDeliverable` (aktuell: Rollback auf `draft` statt Original)
- `rejectDeliverable` (aktuell: Rollback auf `draft` statt Original)
- `deleteClient` (aktuell: kein Rollback)
- `updateDeliverableContent` (aktuell: kein Rollback, kein Toast)
**Pattern:**
```
const original = get().deliverables.find(d => d.id === id)
set(/* optimistic update */)
try { await api... }
catch {
  set(state => ({ deliverables: state.deliverables.map(d =>
    d.id === id ? original : d
  )}))
  toastError('Aktion fehlgeschlagen')
}
```
**Test:** Backend stoppen → Approve klicken → Deliverable springt zurück auf vorherigen Status, Toast erscheint.

### 1.3 Silent Failures eliminieren
**Datei:** `store/fulfillment-store.ts`
**Was:** Jeden `console.warn` in catch-Blöcken durch `toastError()` + Error-State ersetzen.
**Betrifft:** `updateDeliverableContent`, `deleteClient`, `loadPipeline`, `loadTimeline`, `loadPerformance`, `loadDeliverables`
**Test:** API stoppen → jede Aktion triggern → User sieht immer eine Fehlermeldung.

### 1.4 regenerateDeliverable Cancellation
**Datei:** `store/fulfillment-store.ts:572-642`
**Was:**
- Guard: wenn Status schon `generating` → return (kein zweiter Call)
- AbortController für Polling-Loop
- Bei Timeout: Status auf `draft` setzen + `toastWarning('Generierung dauert länger als erwartet')`
**Test:** Regenerate starten → Seite wechseln → kein Error in Console. Regenerate starten → nochmal klicken → kein zweiter API-Call.

### 1.5 executionMap persistieren
**Datei:** `store/fulfillment-store.ts`
**Was:** executionMap in localStorage speichern (Key: `flowstack-execution-map`). Bei Store-Init aus localStorage laden.
**Test:** Page Refresh → Approve funktioniert weiterhin ohne neuen API-Call für executionId.

**✅ Sprint 1 Done-Kriterium:** `npx vite build` grün + alle 5 Szenarien manuell getestet.

---

## Sprint 2: Business-Logik Enforcement
> Der Store muss die Pipeline-Regeln kennen und durchsetzen.

### 2.1 blockedBy Guard
**Datei:** `store/fulfillment-store.ts` → `updateDeliverableStatus()`
**Was:** Vor Status-Änderung prüfen:
- Wenn Deliverable `blockedBy` hat → prüfen ob Blocker-Deliverable `approved` oder `live` ist
- Wenn nicht → `toastWarning('Dieses Deliverable ist noch blockiert')`, Status-Änderung ablehnen
**Ausnahme:** Status `blocked` und `outdated` dürfen immer gesetzt werden (System-intern).
**Test:** Weber Copy-Phase: Versuch d-w-13 (blocked) zu approven → wird abgelehnt mit Toast.

### 2.2 Rejection Cascade
**Datei:** `store/fulfillment-store.ts` → `rejectDeliverable()`
**Was:** Nach Rejection eines Deliverables:
- Alle Deliverables finden die `blockedBy` auf das rejected Deliverable zeigen
- Diese auf `outdated` setzen (nicht `blocked` — sie waren evtl. schon generiert)
- Timeline-Event für jeden betroffenen Deliverable
**Test:** Weber: d-w-06 rejecten → d-w-13, d-w-14, d-w-15 werden `outdated`.

### 2.3 Auto Phase-Transition
**Datei:** `store/fulfillment-store.ts`
**Was:** Neue Funktion `checkAndAdvancePhase(clientId)`:
- Nach jedem Approve: prüfen ob ALLE Deliverables der aktuellen Phase `approved` oder `live` sind
- Wenn ja: Client-Status auf nächste Phase setzen
- Wenn nächste Phase Deliverables hat die `generating` oder `draft` sind: automatisch starten
- Phase-Reihenfolge: strategy → copy → funnel → campaigns → review → live
**Test:** Weber: Alle 5 Strategy-Docs approven → Client wechselt automatisch auf `copy`.

### 2.4 Duplicate Client Guard
**Datei:** `store/fulfillment-store.ts` → `addClient()`
**Was:** Vor API-Call prüfen ob `clients.some(c => c.company.toLowerCase() === newClient.company.toLowerCase())`.
Wenn ja: `toastWarning('Kunde existiert bereits')`, return.
**Test:** "Müller Pflege GmbH" nochmal anlegen → wird abgelehnt.

### 2.5 Generating Timeout Detection
**Datei:** `store/fulfillment-store.ts` oder neuer Hook
**Was:** Bei `loadClients()` und `loadDeliverables()`: Deliverables checken die `status: 'generating'` haben und deren `updatedAt` älter als 10 Minuten ist → Alert erstellen.
**Test:** Mock-Deliverable mit altem updatedAt → Alert erscheint auf Dashboard.

**✅ Sprint 2 Done-Kriterium:** `npx vite build` grün + Pipeline-Szenarien getestet (Approve-Chain, Rejection-Cascade, Phase-Transition).

---

## Sprint 3: Doc Editor Cleanup
> Google Docs Look beibehalten, aber aufgeräumt und funktional.

### 3.1 Ruler entfernen + Padding reduzieren
**Datei:** `components/DocReviewView.tsx`
**Was:**
- `<Ruler />` Komponente (L102-146) komplett entfernen
- `PAPER_PADDING` von `72px 96px` auf `48px 64px` reduzieren
- Paper-Container responsive machen: `max-width: 816px; width: 100%` statt fixed 816px
**Test:** Visuell: Editor sieht cleaner aus, funktioniert auf iPad.

### 3.2 Sticky ApprovalBar
**Datei:** `components/DocReviewView.tsx`
**Was:**
- Approval-Buttons aus dem Header (L310-347) entfernen
- Stattdessen ApprovalBar.tsx Komponente am unteren Rand einbinden
- `position: sticky; bottom: 0; z-index: 10;` mit Backdrop-Blur
- Zeigt: Status-Badge + Reject-Button (links) + Approve-Button (rechts)
- Reject öffnet Feedback-Textarea (min 10 Zeichen)
**Test:** Langes Dokument scrollen → ApprovalBar bleibt sichtbar unten.

### 3.3 Dark Mode für Editor
**Datei:** `components/DocReviewView.tsx:817-880`
**Was:** Alle hardcoded Farben durch CSS Variablen ersetzen:
```
COLORS.toolbarBg → var(--editor-toolbar-bg)
COLORS.paperBg → var(--editor-paper-bg)
Font color → var(--editor-text)
```
Variablen in globals.css definieren für Light + Dark.
**Test:** Theme Toggle → Editor wechselt sauber mit.

### 3.4 Preview Mode Toggle
**Datei:** `components/DocReviewView.tsx`
**Was:** Toggle-Button "Bearbeiten | Vorschau" oben rechts.
- Bearbeiten: TipTap Editor wie bisher (ohne Ruler)
- Vorschau: Selber Content aber TipTap read-only, keine Toolbar, clean Darstellung
- Reviewer braucht meistens nur Preview + Approve/Reject
**Test:** Toggle klicken → Editor wird read-only, Toolbar verschwindet, Content bleibt.

### 3.5 Editor Back behält Tab-State
**Datei:** `pages-deliverables/Editor.tsx:250`
**Was:** Statt `navigate(\`/kunden-hub/clients/${clientId}\`)` → `navigate(\`/kunden-hub/clients/${clientId}?tab=deliverables\`)`
In ClientDetail.tsx: URL-Parameter `tab` auslesen und als initialen Tab setzen.
**Test:** Editor öffnen → Back → landet auf Deliverables-Tab.

### 3.6 Unsaved Changes Warning
**Datei:** `pages-deliverables/Editor.tsx`
**Was:**
- `useEffect` mit `beforeunload` Listener wenn `hasChanged === true`
- Bei React-Router Navigation: `useBlocker` Hook (react-router-dom v7) wenn hasChanged
- Zeigt Confirm-Dialog: "Ungespeicherte Änderungen. Seite wirklich verlassen?"
**Test:** Text ändern → Tab schließen → Browser-Warning. Text ändern → Back klicken → Confirm-Dialog.

**✅ Sprint 3 Done-Kriterium:** `npx vite build` grün + Editor visuell auf Desktop + iPad getestet + Dark Mode + ApprovalBar sticky.

---

## Sprint 4: Operational UX
> Die tägliche Arbeit mit 10-50 Clients schneller machen.

### 4.1 Batch-Approve UI
**Datei:** `components/ContentReviewPanel.tsx`
**Was:**
- Pro Phase-Gruppe: "Alle Entwürfe freigeben" Button (nur sichtbar wenn Drafts/In-Review existieren)
- Confirmation Modal: "X Deliverables in Phase Y freigeben?"
- Nutzt bestehende `approveAllDrafts(clientId, phase)` Store-Methode
**Test:** Weber: "Alle Copy-Entwürfe freigeben" → 3 Deliverables werden approved.

### 4.2 Home Approval mit Status + Quick-Reject
**Datei:** `pages-dashboard/Home.tsx:515-556`
**Was:**
- Status-Badge (draft/in_review) neben Deliverable-Name
- Quick-Reject Button (neben Approve) der ein kleines Feedback-Input öffnet
- Phase-Badge zeigen (Strategy/Copy/Funnel/Campaigns)
**Test:** Dashboard → Pending Approvals zeigt Status + Phase + Approve/Reject.

### 4.3 Pagination + Filter für ClientList
**Datei:** `pages-clients/ClientList.tsx`
**Was:**
- Status-Filter Dropdown (zusätzlich zum bestehenden)
- Phase-Filter Dropdown
- Anzeige: 12 Clients pro Seite, "Mehr laden" Button oder Infinite Scroll
- Sortierung: nach Name, Status, Phase, Erstellt-Am
**Test:** 50+ Clients → nur 12 angezeigt → "Mehr laden" → nächste 12.

### 4.4 Generating Timeout UI
**Datei:** `pages-clients/ClientDetail.tsx`
**Was:**
- Im Deliverables-Tab: wenn ein Deliverable `status: 'generating'` und `updatedAt` > 10min:
  - Orange Warning Badge: "Generierung dauert länger als erwartet"
  - "Erneut versuchen" Button → ruft regenerateDeliverable auf
- Auf Dashboard: Globaler Alert wenn irgendein Deliverable > 30min generating

### 4.5 useExecutionPolling Memory Leak fixen
**Datei:** `hooks/useExecutionPolling.ts`
**Was:**
- `restartInterval()` muss IMMER alten Interval clearen
- Zusätzlich: `abortControllerRef` für fetch-Calls
- Cleanup in useEffect return: clearInterval + abort
**Test:** Schnell zwischen Clients wechseln → keine Memory-Leaks in DevTools Performance Tab.

**✅ Sprint 4 Done-Kriterium:** `npx vite build` grün + Batch-Approve + Pagination + Timeout-UI getestet.

---

## Sprint 5: Polish & Performance
> Die letzten 10% die aus gut → großartig machen.

### 5.1 API Retry Logic
**Datei:** `services/api.ts`
**Was:** Wrapper um `fetch` mit:
- 3 Retries bei 5xx und Network Errors
- Exponential Backoff (1s, 2s, 4s)
- Kein Retry bei 4xx (Client Error)
**Test:** Backend kurz stoppen → Request wird automatisch 3x versucht.

### 5.2 Keyboard Shortcuts (Cmd+K)
**Datei:** Neues Shared Component `CommandPalette.tsx`
**Was:**
- Cmd+K öffnet Overlay mit Suchfeld
- Suche nach: Clients, Deliverables, Actions (Approve, Reject)
- Navigation: Enter = ausführen, Esc = schließen, Arrow Keys = navigieren
- In Editor: Cmd+S = Speichern, Cmd+Enter = Approve
**Test:** Cmd+K → "Müller" tippen → Client auswählen → Navigation.

### 5.3 VersionHistory echte Daten
**Datei:** `components/VersionHistory.tsx`
**Was:**
- Mock-Funktion `getMockVersions()` ersetzen durch API-Call
- Fallback auf Mock wenn API nicht verfügbar
- Diff-Anzeige beibehalten (die ist gut)
**Test:** Version-Tab → zeigt echte Versionen aus API (oder Mock-Fallback).

### 5.4 Type Safety verbessern
**Datei:** `store/fulfillment-store.ts`
**Was:**
- `as DeliverableStatus` Assertions durch Runtime-Guard ersetzen:
  ```
  function isDeliverableStatus(s: string): s is DeliverableStatus {
    return ['generating','draft','in_review','approved','live','rejected','manually_edited','outdated','blocked'].includes(s)
  }
  ```
- Bei ungültigem Status: Fallback auf `'draft'` + console.warn
**Test:** API gibt unerwarteten Status zurück → wird sauber auf draft gefallt.

### 5.5 Chart-Label Fix
**Datei:** `pages-dashboard/Home.tsx:188-197`
**Was:** Dependency-Array von `useMemo` auf `[new Date().toDateString()]` setzen, damit Labels täglich aktualisiert werden.

### 5.6 Missing useMemo/useCallback
**Dateien:** `Editor.tsx:137-142`, `Home.tsx:76-81`
**Was:**
- `hasChanged` in useMemo wrappen
- Store-Selektoren in useCallback oder als stabile Referenzen
- Chart-Optionen in useMemo (bereits teilweise vorhanden)

**✅ Sprint 5 Done-Kriterium:** `npx vite build` grün + Cmd+K funktioniert + Performance-Check in DevTools.

---

## Checkliste pro Sprint

Vor dem Merge jedes Sprints:
- [ ] `npx vite build` grün (keine TypeScript-Fehler)
- [ ] Kein `console.error` in Browser DevTools
- [ ] Dark Mode getestet (Toggle in Header)
- [ ] Mobile/Tablet Viewport getestet (DevTools Responsive)
- [ ] Alle neuen UI-Texte als i18n Keys (deutsch + englisch)
- [ ] Keine neuen `@ts-nocheck` oder `as any`
- [ ] Keine neuen Dependencies ohne Absprache

---

## Nicht im Scope (bewusst ausgelassen)

Diese Features sind business-relevant aber nicht Teil dieses Plans:
- RBAC (Rollen-System) — kommt wenn Team wächst
- Client-Portal (Kunden-Login) — separates Projekt
- Email/Slack Notifications — braucht Backend-Arbeit
- Billing/Invoice Integration — separates Feature
- SLA-Tracking Dashboard — nach Sprint 2 möglich, aber eigener Sprint
- Ghost-Detection automatisieren — braucht Backend-Cron-Job

---

## Fortschritt

| Sprint | Status | Notizen |
|--------|--------|---------|
| Sprint 1: Store Hardening | ✅ Done | Pending-Flags, Rollback, Toasts, Cancellation, executionMap Persistence |
| Sprint 2: Business-Logik | ✅ Done | blockedBy Guard, Rejection Cascade, Auto Phase-Transition, Duplicate Guard, resetClient, Dark Mode → Light only |
| Sprint 3: Doc Editor | ✅ Done | Ruler raus, Padding reduziert, Sticky ApprovalBar, Preview Toggle, Responsive Paper, Line-height 1.5 |
| Sprint 4: Operational UX | ⬜ Offen | |
| Sprint 5: Polish | ⬜ Offen | |
