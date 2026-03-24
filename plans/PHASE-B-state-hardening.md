# Phase B: State Machine Hardening

## Kontext
Das Kunden-Hub ist eine Schaltzentrale für eine Automation-Pipeline. Der fulfillment-store.ts ist das Herzstück — wenn der Store buggy ist, ist alles buggy. Sprint 1+2 haben bereits Pending-Flags, Rollback-Pattern, Toast-Notifications und grundlegende Guards eingebaut. Diese Phase schließt die verbleibenden Lücken.

**Projekt:** `~/Desktop/Flowstack /04_Marketing/Webseite/Seiten code/Flowstack-Platform/`
**Modul:** `src/modules/kunden-hub/`
**Haupt-Datei:** `store/fulfillment-store.ts`
**Build-Check:** `npx vite build` muss nach jeder Änderung grün sein

---

## Bereits erledigt (NICHT nochmal machen):
- ✅ pendingActions Set (Double-Click Prevention)
- ✅ Rollback bei API-Fehler (approve, reject, delete, updateContent)
- ✅ toastError/toastSuccess statt console.warn
- ✅ regenerateDeliverable Guard + activeRegenerations
- ✅ executionMap localStorage Persistence
- ✅ blockedBy Guard in updateDeliverableStatus
- ✅ Rejection Cascade (downstream → outdated) — ABER: 2 separate set() Calls
- ✅ Auto Phase-Transition nach Approve

---

## Aufgabe B1: blockedBy Guard auch in approveDeliverable

**Datei:** `store/fulfillment-store.ts` → `approveDeliverable()`
**Problem:** Der blockedBy Guard existiert nur in `updateDeliverableStatus()`. Aber `approveDeliverable()` setzt Status direkt via `set()`, umgeht den Guard komplett. Man kann ein blockiertes Deliverable approven.

**Aktion:** Am Anfang von `approveDeliverable()` einfügen:
```typescript
const deliverable = get().deliverables.find((d) => d.id === id);
if (deliverable?.blockedBy) {
  const blocker = get().deliverables.find((d) => d.id === deliverable.blockedBy);
  if (blocker && blocker.status !== 'approved' && blocker.status !== 'live') {
    toastWarning('Dieses Deliverable ist noch blockiert');
    return;
  }
}
```

---

## Aufgabe B2: Rejection Cascade atomar machen

**Datei:** `store/fulfillment-store.ts` → `rejectDeliverable()`
**Problem:** Aktuell 2 separate `set()` Calls — erst reject, dann cascade. Zwischen beiden könnte eine andere Aktion (z.B. regenerate) starten.

**Aktion:** Die Cascade in den GLEICHEN `set()` Call integrieren:
```typescript
set((state) => ({
  deliverables: state.deliverables.map((d) => {
    if (d.id === id) return { ...d, status: 'rejected', updatedAt: now };
    if (d.blockedBy === id && d.status !== 'blocked' && d.status !== 'outdated') {
      return { ...d, status: 'outdated', updatedAt: now };
    }
    return d;
  }),
  // ... approvals + timeline updates im gleichen set()
}));
```
Den separaten Cascade-`set()` Call danach ENTFERNEN.

---

## Aufgabe B3: loadDeliverables Merge-Strategie

**Datei:** `store/fulfillment-store.ts` → `loadDeliverables()`
**Problem:** Ersetzt ALLE lokalen Deliverables mit API-Daten. Wenn User lokal editiert hat (`manually_edited`) und API neue Version liefert → User-Edits gehen verloren.

**Aktion:** Merge-Logik statt Replace:
```typescript
set((state) => {
  const otherDeliverables = state.deliverables.filter((d) => d.clientId !== clientId);
  const merged = mapped.map((apiDel) => {
    const local = state.deliverables.find((d) => d.id === apiDel.id);
    // Wenn User lokal editiert hat → lokale Version behalten
    if (local && local.status === 'manually_edited' && apiDel.status === 'draft') {
      return local;
    }
    return apiDel;
  });
  return { deliverables: [...otherDeliverables, ...merged] };
});
```

---

## Aufgabe B4: Regenerate-Guard verstärken

**Datei:** `store/fulfillment-store.ts` → `regenerateDeliverable()`
**Problem:** Guard nur gegen `generating`. Aber `approved` und `live` Deliverables sollten nicht regeneriert werden können.

**Aktion:**
```typescript
if (deliverable.status === 'approved' || deliverable.status === 'live') {
  toastWarning('Freigegebene Inhalte können nicht regeneriert werden');
  return null;
}
if (deliverable.status === 'manually_edited') {
  // Warnung aber erlauben (User hat bewusst Regenerate geklickt)
  toastWarning('Deine manuellen Änderungen werden überschrieben');
}
```

---

## Aufgabe B5: submitForReview → API-Sync

**Datei:** `store/fulfillment-store.ts` → `submitForReview()`
**Problem:** Nur lokaler State-Change. Backend weiß nicht dass Deliverable in Review ist.

**Aktion:** API-Call hinzufügen (nach dem lokalen set):
```typescript
try {
  const executionId = await get().getExecutionId(deliverable.clientId);
  if (executionId) {
    await api.clientDeliverables.updateContent(executionId, id, deliverable.content);
  }
} catch {
  // Non-critical — local state ist richtig, API ist optional hier
}
```

---

## Aufgabe B6: Approval-Versioning

**Datei:** `data/types.ts` → `Approval` Interface

**Aktion:** Neues Feld hinzufügen:
```typescript
export interface Approval {
  // ... bestehende Felder
  approvedVersion?: number; // Welche Version wurde freigegeben
}
```

In `approveDeliverable()`: `approvedVersion: deliverable.version` setzen.
In `regenerateDeliverable()`: Wenn Deliverable approved war und regeneriert wird → Approval invalidieren (status auf 'pending' zurücksetzen).

---

## Regeln
- `npx vite build` nach JEDER Änderung
- Keine neuen Dependencies
- `import type { X }` für Type-only Imports
- Echte Umlaute (ä, ö, ü, ß) in Toast-Messages
