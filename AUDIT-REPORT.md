# Technischer Architektur-Audit: Flowstack Platform

**Datum:** 14. Februar 2026
**Rolle:** Senior Software Architect / Staff Engineer
**Scope:** Gesamte Codebase (`/Flowstack-Platform/src/`)
**Kontext:** Frontend-only, Backend-Integration geplant

---

## 1. Einstufung

### **Early App — mit solider Modul-Architektur aber kritischen Infrastruktur-Lücken**

Die Codebase steht zwischen "UI-Prototype" und "Solide Plattform-Basis". Die **Modul-Architektur ist überraschend reif** (DDD-inspiriert, perfekte Isolation, saubere Dependency-Richtung), aber die **Infrastrukturschicht** (Persistence, State Management, Datenmodell) ist für eine echte Plattform **nicht tragfähig**. Die App funktioniert als localStorage-Demo, aber jede der drei kritischen Erweiterungen (Multi-User, Backend, Echtzeit) würde tiefgreifende Refactorings erfordern.

**Kurzformel:** Gute Hauswände, aber kein Fundament.

---

## 2. Die 10 kritischsten Probleme (nach Priorität)

### P0 — Blockiert Backend-Integration komplett

#### #1: Repository-Interface ist SQL-inkompatibel
- `Repository<T>` kennt nur `getAll()`, `getById()`, `create()`, `update()`, `delete()`
- Keine Pagination, keine Transactions, keine Batch-Operationen, kein `where()`-Filter
- `query()` unterstützt nur flache Key-Value-Gleichheit — kein `>`, `<`, `IN`, `LIKE`
- **Impact:** Supabase-Migration erfordert komplette Neuentwicklung des Repository-Interfaces
- **Datei:** `src/core/persistence/types.ts` (26 Zeilen — das ist das Problem)

#### #2: Kein `user_id` in irgendeinem Datenmodell
- `ContentItem`, `ContentFile`, `ContentPlan`, `AutomationSystem`, `SystemNode`, `NodeConnection` — keine einzige Entity hat ein `user_id`-Feld
- Multi-Tenancy ist nicht nachträglich "dranschraubbar" — es muss in jede Query, jeden Store, jede Berechtigung
- **Impact:** Jedes einzelne Interface und jeder Store muss angepasst werden
- **Dateien:** `src/modules/*/domain/types.ts`

#### #3: Kein Validierungslayer — nirgendwo
- Keine Runtime-Validierung (kein Zod, kein Yup, kein manuelles Checking)
- Stores schreiben blind in localStorage was reinkommt
- `create()` macht `as Omit<T, 'id'>` Type-Assertion — umgeht TypeScript-Sicherheit
- **Impact:** Korrupte Daten sind jederzeit möglich, Backend-Integration ohne Validierung = Sicherheitslücke
- **Datei:** `src/core/persistence/create-repository.ts`

### P1 — Verursacht technische Schulden bei Skalierung

#### #4: Duales State-Management im Canvas
- Zustand-Store (`automation-store.ts`) verwaltet CRUD für Systems/Nodes/Connections
- `useCanvasState` Hook (340 Zeilen) verwaltet **dieselben** Nodes/Connections plus UI-State
- Kein Single Source of Truth — bei Save muss Canvas-State → Zustand → Repository synchronisiert werden
- **Impact:** Race Conditions, State-Drift, nicht WebSocket-syncbar
- **Dateien:** `src/modules/automation/application/automation-store.ts` + `src/modules/automation/canvas/useCanvasState.ts`

#### #5: WorkflowCanvas ist ein God-Component
- 1.141 Zeilen, 21 `useState` Calls, ~15 `useEffect`-Dependencies
- Mischt Rendering, Event-Handling, Keyboard-Shortcuts, Drag-Logic, Zoom-Berechnung, Undo/Redo, Context-Menus
- **Impact:** Untestbar, nicht wartbar, jede Änderung riskiert Seiteneffekte
- **Datei:** `src/modules/automation/canvas/WorkflowCanvas.tsx`

#### #6: Array-basiertes Graph-Modell
- Nodes und Connections sind flache Arrays
- Jede Connection-Suche (`find from/to node`) ist O(n) — bei Render O(n²) weil pro Node alle Connections durchsucht werden
- Bei 500+ Nodes wird der Canvas spürbar langsam
- **Impact:** Performance-Decke bei ~200 Nodes ohne komplettes Rewrite des Graph-Modells
- **Dateien:** `useCanvasState.ts`, `WorkflowCanvas.tsx`

### P2 — Qualitäts- und Wartungsprobleme

#### #7: Undo/Redo mit Shallow Copies
- `useCanvasState` speichert Undo-History als `[...nodes]` (Spread-Operator)
- Shallow Copy = geteilte Referenzen auf Node-Objekte → Undo kann aktuellen State korrumpieren
- 50-Snapshot-Limit ohne Memory-Management
- **Impact:** Daten-Korruption bei intensiver Nutzung, Memory-Leaks bei langen Sessions
- **Datei:** `useCanvasState.ts`

#### #8: Event-Bus ist synchron-only und hat API-Fehler
- `off(event)` entfernt **alle** Handler für ein Event — nicht einen spezifischen
- Kein async/await Support, keine Error-Boundaries
- Kein typisiertes Event-Schema (nur `string` → `any`)
- **Impact:** Cross-Module-Kommunikation funktioniert, aber jedes `off()` ist ein potenzieller Bug
- **Datei:** `src/core/events/event-bus.ts` (50 Zeilen)

#### #9: localStorage-Adapter schluckt Fehler still
- `try/catch` um jede Operation mit leerem `catch`-Block
- Kein Size-Checking (localStorage hat 5-10MB Limit)
- Keine Multi-Tab-Synchronisation (kein `storage`-Event-Listener)
- **Impact:** Datenverlust ohne Fehlermeldung wenn Speicher voll
- **Datei:** `src/core/persistence/local-storage-adapter.ts`

#### #10: Race Conditions in Zustand-Stores
- Async Operations lesen State am Anfang, schreiben am Ende — dazwischen kann State sich ändern
- Einzelner `loading: boolean` für alle gleichzeitigen Operationen
- Kein Optimistic-Update-Pattern, kein Conflict-Resolution
- **Impact:** Bei gleichzeitigen Aktionen (z.B. schnelles Klicken) können Daten verloren gehen
- **Dateien:** `automation-store.ts`, `content-store.ts`

---

## 3. Was MUSS vor Backend-Integration refactored werden

### Zwingend (ohne diese kein stabiles Backend möglich)

| # | Refactoring | Aufwand | Warum |
|---|------------|---------|-------|
| 1 | **Repository-Interface v2** — Pagination (`offset/limit`), Filter-Builder (`where`, `orderBy`), Transactions, Batch-Ops | 2-3 Tage | Supabase-Adapter kann sonst nicht gebaut werden |
| 2 | **`user_id` in alle Domain-Types** + Row-Level-Security-Konzept | 1-2 Tage | Ohne Multi-Tenancy kein Auth |
| 3 | **Zod-Validation-Layer** zwischen Store und Repository | 1-2 Tage | Backend akzeptiert keine unvalidierten Daten |
| 4 | **Canvas State → Zustand konsolidieren** — `useCanvasState` in den automation-store integrieren, UI-State vom Domain-State trennen | 3-4 Tage | Sonst ist Backend-Sync des Workflow-Builders unmöglich |
| 5 | **Event-Bus: `off()` fixen + Typed Events** | 0.5 Tage | Jeder Subscriber der sich abmeldet killt alle anderen |
| 6 | **Error-Handling-Strategie** — Fehler propagieren statt schlucken, User-facing Error-Toasts | 1 Tag | User muss wissen wenn etwas schiefgeht |

### Empfohlen (nicht blockierend aber schmerzhaft wenn aufgeschoben)

| # | Refactoring | Aufwand |
|---|------------|---------|
| 7 | WorkflowCanvas in 5-6 Custom Hooks aufsplitten | 2-3 Tage |
| 8 | Graph-Modell: Arrays → `Map<id, Node>` + Adjacency-Index | 1-2 Tage |
| 9 | Undo/Redo: `structuredClone()` statt Spread, Command-Pattern | 1-2 Tage |
| 10 | Radix-UI Dropdown/Select statt native `<select>` | 1 Tag |

---

## 4. Was ist überraschend gut gelöst

**Modul-Isolation: Perfekt.** Zero cross-module imports. Jedes Modul (automation, content, cold-mail, linkedin, hub) ist eine eigenständige Unit mit eigenem `domain/`, `application/`, `components/`, `pages/`. Man kann jedes Modul komplett löschen ohne dass irgendwas anderes bricht. Das ist besser als in vielen Production-Apps.

**DDD-inspirierte Ordnerstruktur:** Die Trennung `domain/types.ts` → `domain/constants.ts` → `application/store.ts` → `components/` → `pages/` ist sauber und konsequent durchgezogen. Neue Entwickler finden sich sofort zurecht.

**Shell-Layer als Integrationsschicht:** `src/shell/` (App, Sidebar, Header) ist der einzige Ort der Module zusammenführt — über Lazy-Loading-Routes. Kein Modul kennt ein anderes Modul. Das ist architektonisch die richtige Entscheidung.

**Repository-Pattern als Abstraktion:** Obwohl das Interface zu primitiv ist, ist die **Idee** richtig: `createRepository<T>('key')` → austauschbarer Adapter. Der Weg zu Supabase ist konzeptionell klar, auch wenn das Interface erweitert werden muss.

**Canvas-Komponenten-Zerlegung:** `CanvasNode`, `CanvasConnection`, `CanvasToolbar`, `CanvasSettingsPanel`, `NodeEditModal` sind sauber extrahiert und `memo()`-optimiert. Die Rendering-Pipeline ist richtig gedacht.

**TypeScript-Disziplin:** Null Compiler-Errors. Typen sind konsistent. Interfaces sind klar definiert. Das ist die Basis auf der man aufbauen kann.

---

## 5. Konkreter Minimal-Plan: Von Early App zum System-Fundament

### Ziel: Eine Codebase die ein Backend-Entwickler anschließen kann ohne alles neu zu schreiben.

```
Phase 0: Foundation-Fix (5-7 Arbeitstage, 1 Entwickler)
├── Tag 1-2: Repository Interface v2
│   ├── QueryBuilder: where(), orderBy(), limit(), offset()
│   ├── Transaction-Support: beginTransaction(), commit(), rollback()
│   ├── Batch-Operationen: createMany(), updateMany(), deleteMany()
│   └── localStorage-Adapter aktualisieren (bleibt als Dev-Fallback)
│
├── Tag 2-3: Domain-Model-Upgrade
│   ├── BaseEntity: { id, user_id, created_at, updated_at, version }
│   ├── Alle Types erweitern (Content, Automation, etc.)
│   ├── Zod-Schemas für alle Entities
│   └── Validation in Repository.create() / .update() einbauen
│
├── Tag 3-4: Store-Konsolidierung
│   ├── useCanvasState → in automation-store integrieren
│   ├── Klare Trennung: DomainSlice vs UISlice
│   ├── Optimistic-Update-Pattern einführen
│   └── Loading-States: per Operation statt global
│
├── Tag 4-5: Event-Bus v2
│   ├── off() → off(event, handler) (spezifisch)
│   ├── Typed Event Registry
│   ├── Async Handler Support
│   └── Error Boundaries pro Handler
│
├── Tag 5-6: Error & Storage
│   ├── Error-Propagation statt Silent-Swallow
│   ├── Toast-Notification-System
│   ├── localStorage Size-Monitoring
│   └── Multi-Tab-Sync via storage-Event
│
└── Tag 6-7: Quality Gate
    ├── Vitest Setup + Tests für Repository + Stores
    ├── Mindestens 1 Test pro Store-Operation
    └── CI-Pipeline-Template (GitHub Actions)
```

### Nach Phase 0 hat euer Coder:

- Ein Repository-Interface das 1:1 auf Supabase gemappt werden kann
- Domain-Models die Multi-User-fähig sind
- Validierte Daten in und aus dem Store
- Einen einzigen State-Management-Ansatz
- Fehler die der User sieht statt die still verschwinden
- Tests die beweisen dass die Grundlagen funktionieren

### Was Phase 0 NICHT löst (bewusst):

- WorkflowCanvas God-Component (aufteilen lohnt sich erst wenn aktiv daran gearbeitet wird)
- Graph-Modell Performance (erst relevant bei >200 Nodes)
- Design-Konsistenz (parallel machbar, blockiert nichts)
- Canvas-Virtualisierung (erst bei >500 Nodes nötig)

---

## Fazit

Die Codebase hat eine **ungewöhnlich gute Architektur-Entscheidung** getroffen: perfekte Modul-Isolation. Das ist die härteste Sache um sie nachträglich einzubauen, und ihr habt sie von Anfang an. Die Probleme liegen eine Schicht tiefer — im Persistence-Layer, im Datenmodell, im State-Management. Diese Probleme sind alle lösbar, und zwar **ohne die Modul-Struktur anzufassen**. Das ist die gute Nachricht.

Die schlechte: Ohne Phase 0 wird jede Backend-Integration zu einem Flickwerk. Der Coder wird gegen das Repository-Interface kämpfen, wird `user_id` überall nachträglich einbauen müssen, wird nicht wissen ob Canvas-State aus Zustand oder aus dem Hook kommt. Phase 0 kostet 5-7 Tage. Diese nicht zu investieren kostet Wochen an technischen Schulden später.

**Empfehlung:** Phase 0 vor jeder Feature-Arbeit. Kein Backend, keine Integrations, keine neuen Module — erst das Fundament.
