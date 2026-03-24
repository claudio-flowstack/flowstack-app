# Phase E: Fehlende System-Konzepte

## Kontext
Nach der UI-Vereinfachung (Phase A) und State-Hardening (Phase B) fehlen noch zwei System-Konzepte die für den täglichen Betrieb nötig sind: Dirty State Tracking und ein Client-Reset-Button in der UI.

**Projekt:** `~/Desktop/Flowstack /04_Marketing/Webseite/Seiten code/Flowstack-Platform/`
**Modul:** `src/modules/kunden-hub/`
**Build-Check:** `npx vite build` muss nach jeder Änderung grün sein
**Abhängigkeit:** Phase B sollte vorher erledigt sein (Store-Hardening)

---

## Aufgabe E1: Dirty State Tracking

**Datei:** `store/fulfillment-store.ts`

**Problem:** Wenn Automation neue Inhalte generiert während User alte Version reviewt → loadDeliverables() überschreibt alles. Kein Tracking welche Deliverables lokal modifiziert wurden.

**Aktion:**

1. Neues State-Feld im Store:
```typescript
dirtyEdits: Record<string, { content: string; editedAt: string }>;
```

2. In `updateDeliverableContent()`: Auch in dirtyEdits speichern
```typescript
set((state) => ({
  dirtyEdits: { ...state.dirtyEdits, [id]: { content, editedAt: new Date().toISOString() } },
}));
```

3. In `loadDeliverables()`: Dirty Edits nicht überschreiben
```typescript
// Wenn ein Deliverable in dirtyEdits ist → lokale Version behalten
// Toast zeigen: "Neue Version vom Server verfügbar"
```

4. Nach erfolgreichem Save → aus dirtyEdits entfernen

5. Interface erweitern:
```typescript
interface FulfillmentState {
  // ... bestehende Felder
  dirtyEdits: Record<string, { content: string; editedAt: string }>;
  hasDirtyEdits: () => boolean;
  clearDirtyEdit: (id: string) => void;
}
```

---

## Aufgabe E2: Client Reset Button in der UI

**Datei:** `pages-clients/ClientDetail.tsx`

**Voraussetzung:** `resetClient(clientId)` existiert bereits im Store (Sprint 2 implementiert). Setzt Client auf Onboarding zurück, Strategy → draft, Rest → blocked.

**Aktion:**

1. In ClientDetail Header-Bereich (neben Delete Button):
```tsx
<button onClick={() => setShowResetModal(true)} className="text-orange-600 hover:text-orange-700">
  <RotateCcw className="h-4 w-4" /> {/* oder passendes Icon */}
</button>
```

2. Confirmation Modal:
```
⚠️ Kunde zurücksetzen?

Alle Deliverables werden auf den Anfangsstatus zurückgesetzt:
- Strategy-Dokumente → Entwurf
- Alle anderen → Blockiert
- Freigaben werden gelöscht

[Abbrechen]  [Zurücksetzen]
```

3. State:
```typescript
const [showResetModal, setShowResetModal] = useState(false);
const resetClient = useFulfillmentStore((s) => s.resetClient);
```

4. Handler:
```typescript
const handleReset = () => {
  resetClient(clientId);
  setShowResetModal(false);
};
```

**Test:** Client öffnen → Reset klicken → Confirmation → Client ist auf Onboarding, alle Deliverables zurückgesetzt.

---

## Regeln
- `npx vite build` nach JEDER Änderung
- Keine neuen Dependencies
- i18n Keys für Modal-Texte
- Echte Umlaute (ä, ö, ü, ß)
