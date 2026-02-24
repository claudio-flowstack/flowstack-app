# Flowstack Platform — Fundament-Reparatur Masterplan

**Version:** 1.0
**Datum:** 14. Februar 2026
**Scope:** Bestehende Codebase stabilisieren, Backend-ready machen
**Constraint:** Modul-Architektur bleibt unverändert

---

## Übersicht: Phasen-Reihenfolge

```
Phase 1: BaseEntity + Domain-Types           ← Fundament (alles andere baut darauf auf)
Phase 2: Repository-Interface v2             ← braucht Phase 1 (neue Types)
Phase 3: Validation-Layer                    ← braucht Phase 2 (validiert vor Repo-Calls)
Phase 4: Event-Bus Fix                       ← unabhängig, aber low-risk warm-up
Phase 5: Store-Konsolidierung                ← braucht Phase 2+3 (Stores nutzen neue Repos)
Phase 6: Canvas State-Konsolidierung         ← braucht Phase 5 (Canvas-Store wird Teil von automation-store)
Phase 7: Error-Handling + localStorage-Fix   ← braucht Phase 5 (Stores propagieren Errors)
Phase 8: Undo/Redo + Graph-Modell Fix        ← braucht Phase 6 (Canvas-State ist konsolidiert)
Phase 9: Minimal-Tests                       ← braucht alles (testet finalen Zustand)
```

### Abhängigkeits-Graph

```
Phase 1 ──→ Phase 2 ──→ Phase 3 ──→ Phase 5 ──→ Phase 6 ──→ Phase 8
                                         ↓            ↓
                                     Phase 7       Phase 9
Phase 4 (parallel zu Phase 1-3 möglich)
```

---

## Was während des gesamten Umbaus NICHT angefasst werden darf

| Bereich | Grund |
|---------|-------|
| `src/shell/` (App.tsx, Sidebar, DashboardLayout, Header) | Routing + Layout funktioniert, Änderungen haben globale Seiteneffekte |
| `src/core/theme/context.tsx` | Sauber implementiert, kein Refactoring nötig |
| `src/core/i18n/context.tsx` + `translations.ts` | Funktioniert korrekt |
| `src/shared/components/` (ConfirmDialog, EmptyState, SearchInput, Toast, StatusBadge) | UI-Komponenten, kein Infrastruktur-Problem |
| `src/shared/stores/ui-store.ts` | Einfach, korrekt, kein Refactoring nötig |
| `src/modules/*/components/` | UI-Komponenten, werden durch Infrastruktur-Fixes nicht betroffen |
| `src/modules/*/domain/constants.ts` | Statische Konfiguration, kein Problem |
| `src/modules/*/domain/demo-data.ts` | Demo-Daten, werden durch Type-Änderungen minimal angepasst |
| Canvas-Rendering-Komponenten (CanvasNode, CanvasConnection, etc.) | Nur Rendering, kein State-Problem |
| Jegliches CSS/Design | Separate Aufgabe, blockiert nichts |

---

## Was bewusst verschoben wird (kein Overengineering)

| Was | Warum verschieben |
|-----|------------------|
| WorkflowCanvas in Hooks aufsplitten | Funktioniert als God-Component, Aufsplitten ist nice-to-have, nicht blockierend |
| Canvas-Virtualisierung | Erst relevant bei >500 Nodes, aktuell 2 User |
| Graph-Modell → Map + Adjacency-Index | Phase 8 macht Arrays sicher, Map-Rewrite erst bei Performance-Problemen |
| CRDT/OT für Echtzeit-Collaboration | Enterprise-Feature, aktuell 2 User |
| Service-Worker für Offline-Support | Overkill für aktuelle Größe |
| Full i18n mit Namespaces | Aktuelles System funktioniert |
| Pagination in der UI | Bei 2 Usern unnötig, Repo-Interface unterstützt es aber für später |
| Role-Based Access Control | Erst mit Auth relevant |
| WebSocket-Integration | Erst mit Backend relevant |
| CI/CD Pipeline | Nach Tests einrichten, nicht vorher |

---

## Was zwingend VOR Supabase-Integration passieren muss

| # | Was | Aus Phase | Warum |
|---|-----|-----------|-------|
| 1 | `user_id` in allen Domain-Types | Phase 1 | Supabase RLS filtert per `user_id` |
| 2 | `created_at`, `updated_at` als ISO-Strings | Phase 1 | Supabase `timestamptz` erwartet ISO |
| 3 | Repository mit `query()`, `getByUserId()`, Pagination | Phase 2 | Supabase-Adapter braucht diese Methoden |
| 4 | Zod-Validation vor `create()`/`update()` | Phase 3 | Supabase wirft harte Fehler bei invaliden Daten |
| 5 | Event-Bus `off(event, handler)` Fix | Phase 4 | Supabase Realtime-Subscriptions müssen sauber unsubscriben |
| 6 | Stores: Optimistic Updates + Error Rollback | Phase 5 | Netzwerk-Latenz erfordert optimistic UI |
| 7 | Canvas-State in Zustand | Phase 6 | Supabase-Sync braucht einen Store, keinen Hook |
| 8 | Error-Propagation statt Silent Swallow | Phase 7 | Netzwerk-Fehler müssen sichtbar sein |

---

## Rollback-Strategie

**Vor jeder Phase:**
```bash
git checkout -b phase-X-refactor
```

**Nach jeder Phase:**
```bash
# Prüfen ob App startet
npm run dev
# Prüfen ob TypeScript kompiliert
npx tsc --noEmit
# Manueller Smoke-Test: Dashboard öffnen, Content erstellen, Automation Canvas öffnen
# Wenn alles geht:
git add -A && git commit -m "Phase X: [Beschreibung]"
git checkout main && git merge phase-X-refactor
```

**Bei Fehler:**
```bash
git checkout main
git branch -D phase-X-refactor
# Neu anfangen mit Erkenntnissen aus dem fehlgeschlagenen Versuch
```

**Kritische Regel:** Jede Phase muss in sich abgeschlossen sein. Nach jeder Phase muss die App vollständig funktionieren. Kein "Work in Progress" über Phasen-Grenzen hinweg.

---

## Phase 1: BaseEntity + Domain-Types

**Ziel:** Alle Entities bekommen eine einheitliche Basis mit `user_id`, Timestamps und Version-Feld. Die App funktioniert danach exakt wie vorher, aber die Datenstruktur ist backend-ready.

**Betroffene Layer:** `domain`

**Aufwand:** ~4-5 Stunden

**Risiko:** NIEDRIG — reine Type-Erweiterung, keine Logik-Änderung

### Schritt 1.1: BaseEntity-Interface erstellen

**Datei:** `src/core/persistence/types.ts` (erweitern)

```typescript
// NEU: Am Anfang der Datei einfügen
export interface BaseEntity {
  id: string
  user_id: string
  created_at: string   // ISO 8601
  updated_at: string   // ISO 8601
}
```

**Warum `user_id` und nicht `userId`:** Supabase/PostgreSQL Convention ist snake_case. Wenn wir jetzt schon snake_case verwenden, entfällt später das Mapping.

**Warum kein `version`-Feld:** Optimistic Locking ist für 2 User ohne Echtzeit-Collaboration Overengineering. Kann bei Bedarf später ergänzt werden.

### Schritt 1.2: Automation-Domain-Types anpassen

**Datei:** `src/modules/automation/domain/types.ts`

Änderungen:

```typescript
import type { BaseEntity } from '@/core/persistence/types'

// AutomationSystem: extends BaseEntity statt eigenes id
export interface AutomationSystem extends BaseEntity {
  // id: string          ← ENTFERNEN (kommt aus BaseEntity)
  name: string
  description: string
  category: string
  icon: string
  status: SystemStatus
  webhookUrl: string
  nodes: SystemNode[]
  connections: NodeConnection[]
  groups?: CanvasGroup[]
  stickyNotes?: StickyNote[]
  outputs: SystemOutput[]
  lastExecuted?: string
  executionCount: number
  // user_id, created_at, updated_at kommen aus BaseEntity
}

// WorkflowTemplate: extends BaseEntity
export interface WorkflowTemplate extends BaseEntity {
  // id: string          ← ENTFERNEN
  name: string
  description: string
  category: string
  icon: string
  nodeCount: number
  nodes: SystemNode[]
  connections: NodeConnection[]
  groups?: CanvasGroup[]
  tags: string[]
}

// SystemResource: extends BaseEntity
export interface SystemResource extends BaseEntity {
  // id: string          ← ENTFERNEN
  // createdAt: string   ← ENTFERNEN (ersetzt durch created_at aus BaseEntity)
  systemId: string
  title: string
  type: ResourceType
  content: string
  fileReference?: string
  source?: string
}

// SystemOutput: extends BaseEntity
export interface SystemOutput extends BaseEntity {
  // id: string          ← ENTFERNEN
  // createdAt: string   ← ENTFERNEN
  name: string
  type: OutputType
  link: string
  contentPreview?: string
  artifactType?: ArtifactType
}
```

**NICHT ändern:** `SystemNode`, `NodeConnection`, `CanvasGroup`, `StickyNote` — diese sind eingebettete Sub-Dokumente innerhalb von `AutomationSystem`, keine eigenständigen Entities. Sie brauchen kein `user_id` weil sie über ihr Parent-System zugeordnet sind.

### Schritt 1.3: Content-Domain-Types anpassen

**Datei:** `src/modules/content/domain/types.ts`

```typescript
import type { BaseEntity } from '@/core/persistence/types'

// ContentItem: extends BaseEntity
export interface ContentItem extends BaseEntity {
  // id: string          ← ENTFERNEN
  // createdAt: string   ← ENTFERNEN (→ created_at)
  // updatedAt: string   ← ENTFERNEN (→ updated_at)
  platform: ContentPlatform
  title: string
  concept: string
  angle: string
  status: ContentStatus
  priority: ContentPriority
  quality: ContentQuality
  tags: string[]
  notes: string
  // ... restliche Felder bleiben
}

// ContentFile: extends BaseEntity
export interface ContentFile extends BaseEntity {
  // id: string          ← ENTFERNEN
  // createdAt: string   ← ENTFERNEN
  name: string
  description: string
  url: string
  category: FileCategory
  labels: string[]
}

// ContentPlan: extends BaseEntity
export interface ContentPlan extends BaseEntity {
  // id: string          ← ENTFERNEN
  // createdAt: string   ← ENTFERNEN
  // updatedAt: string   ← ENTFERNEN
  name: string
  description: string
  strategy: string
  deadline: string
  notes: string
  goal: string
  targetAudience: string
  channels: string[]
  tasks: PlanTask[]
}

// ResearchNote: extends BaseEntity
export interface ResearchNote extends BaseEntity {
  // id: string          ← ENTFERNEN
  // createdAt: string   ← ENTFERNEN
  // updatedAt: string   ← ENTFERNEN
  title: string
  content: string
  links: string[]
  tags: string[]
  platform: string
}
```

**NICHT ändern:** `ChecklistItem`, `ContentVersion`, `PlanTask` — eingebettete Sub-Dokumente.

### Schritt 1.4: Demo-Daten anpassen

**Dateien:**
- `src/modules/automation/domain/demo-data.ts`
- `src/modules/content/domain/demo-data.ts`

Alle Demo-Objekte brauchen die neuen Felder:

```typescript
const DEFAULT_USER_ID = 'local-user'  // Platzhalter bis Auth existiert

// Bei jedem Demo-Objekt ergänzen:
{
  user_id: DEFAULT_USER_ID,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  // ... rest
}
```

### Schritt 1.5: Stores anpassen (Feld-Renames)

**Dateien:**
- `src/modules/automation/application/automation-store.ts`
- `src/modules/content/application/content-store.ts`

Suche-und-ersetze in allen Store-Methoden:
- `createdAt: now` → `created_at: now`
- `updatedAt: now` → `updated_at: now`
- `updatedAt: new Date().toISOString()` → `updated_at: new Date().toISOString()`
- `user_id: DEFAULT_USER_ID` bei jedem `create()`-Aufruf ergänzen

```typescript
const DEFAULT_USER_ID = 'local-user'  // oben im File definieren
```

### Prüfung nach Phase 1

```bash
npx tsc --noEmit          # Null Fehler
npm run dev               # App startet
```

Manueller Test:
- [ ] Dashboard öffnet sich
- [ ] Content-Tab: Items werden angezeigt
- [ ] Content erstellen funktioniert
- [ ] Automation-Tab: Systeme werden angezeigt
- [ ] Canvas öffnet sich und Nodes sind sichtbar
- [ ] Browser DevTools → Application → localStorage: Einträge haben `user_id`, `created_at`, `updated_at`

---

## Phase 2: Repository-Interface v2

**Ziel:** Das Repository-Interface bekommt Query-Methoden die 1:1 auf Supabase `.select().eq().order().range()` gemappt werden können. Der localStorage-Adapter implementiert sie client-seitig.

**Betroffene Layer:** `infrastructure` (core/persistence)

**Aufwand:** ~5-6 Stunden

**Risiko:** MITTEL — Alle Stores nutzen das Repository. Aber: das alte Interface bleibt kompatibel, wir erweitern nur.

### Schritt 2.1: Neues Repository-Interface

**Datei:** `src/core/persistence/types.ts` (ersetzen)

```typescript
export interface BaseEntity {
  id: string
  user_id: string
  created_at: string
  updated_at: string
}

// ── Query Types ─────────────────────────────────────────────────────────

export interface QueryOptions<T> {
  where?: Partial<T>
  orderBy?: { field: keyof T; direction: 'asc' | 'desc' }
  limit?: number
  offset?: number
}

export interface QueryResult<T> {
  data: T[]
  total: number                // Gesamtanzahl (für Pagination)
}

// ── Repository Interface ────────────────────────────────────────────────

export interface Repository<T extends BaseEntity> {
  // Basis-CRUD (bestehend, Signatur leicht angepasst)
  getAll(): Promise<T[]>
  getById(id: string): Promise<T | null>
  create(item: Omit<T, 'id' | 'created_at' | 'updated_at'> & {
    id?: string
    created_at?: string
    updated_at?: string
  }): Promise<T>
  update(id: string, data: Partial<Omit<T, 'id' | 'user_id' | 'created_at'>>): Promise<T>
  delete(id: string): Promise<void>

  // Neu: Query mit Filter, Sort, Pagination
  query(options: QueryOptions<T>): Promise<QueryResult<T>>

  // Neu: Batch-Operationen
  createMany(items: Array<Omit<T, 'id' | 'created_at' | 'updated_at'>>): Promise<T[]>
  updateMany(updates: Array<{ id: string; data: Partial<T> }>): Promise<T[]>
  deleteMany(ids: string[]): Promise<void>

  // Neu: Scoped query (für Supabase RLS)
  getByUserId(userId: string): Promise<T[]>
}

// ── Storage Adapter (unverändert) ───────────────────────────────────────

export interface StorageAdapter {
  get<T>(key: string): Promise<T | null>
  set<T>(key: string, value: T): Promise<void>
  remove(key: string): Promise<void>
  keys(): Promise<string[]>
}
```

### Schritt 2.2: localStorage-Repository-Implementierung aktualisieren

**Datei:** `src/core/persistence/create-repository.ts` (ersetzen)

```typescript
import type { BaseEntity, Repository, StorageAdapter, QueryOptions, QueryResult } from './types'

const DEFAULT_USER_ID = 'local-user'

export function createLocalRepository<T extends BaseEntity>(
  adapter: StorageAdapter,
  collectionKey: string,
): Repository<T> {

  async function readAll(): Promise<T[]> {
    return (await adapter.get<T[]>(collectionKey)) ?? []
  }

  async function writeAll(items: T[]): Promise<void> {
    await adapter.set(collectionKey, items)
  }

  function applySort(items: T[], orderBy?: QueryOptions<T>['orderBy']): T[] {
    if (!orderBy) return items
    const { field, direction } = orderBy
    return [...items].sort((a, b) => {
      const aVal = a[field]
      const bVal = b[field]
      if (aVal < bVal) return direction === 'asc' ? -1 : 1
      if (aVal > bVal) return direction === 'asc' ? 1 : -1
      return 0
    })
  }

  return {
    async getAll(): Promise<T[]> {
      return readAll()
    },

    async getById(id: string): Promise<T | null> {
      const items = await readAll()
      return items.find((item) => item.id === id) ?? null
    },

    async create(item): Promise<T> {
      const items = await readAll()
      const now = new Date().toISOString()
      const newItem = {
        ...item,
        id: item.id ?? crypto.randomUUID(),
        user_id: (item as Record<string, unknown>).user_id ?? DEFAULT_USER_ID,
        created_at: item.created_at ?? now,
        updated_at: item.updated_at ?? now,
      } as T
      items.push(newItem)
      await writeAll(items)
      return newItem
    },

    async update(id, data): Promise<T> {
      const items = await readAll()
      const index = items.findIndex((item) => item.id === id)
      if (index === -1) throw new Error(`Item not found: ${id}`)
      items[index] = {
        ...items[index],
        ...data,
        updated_at: new Date().toISOString(),
      }
      await writeAll(items)
      return items[index]
    },

    async delete(id: string): Promise<void> {
      const items = await readAll()
      const filtered = items.filter((item) => item.id !== id)
      if (filtered.length === items.length) {
        throw new Error(`Item not found: ${id}`)
      }
      await writeAll(filtered)
    },

    async query(options: QueryOptions<T>): Promise<QueryResult<T>> {
      let items = await readAll()

      // Filter
      if (options.where) {
        items = items.filter((item) =>
          Object.entries(options.where!).every(
            ([key, value]) => item[key as keyof T] === value,
          ),
        )
      }

      const total = items.length

      // Sort
      items = applySort(items, options.orderBy)

      // Pagination
      if (options.offset !== undefined) {
        items = items.slice(options.offset)
      }
      if (options.limit !== undefined) {
        items = items.slice(0, options.limit)
      }

      return { data: items, total }
    },

    async createMany(newItems): Promise<T[]> {
      const items = await readAll()
      const now = new Date().toISOString()
      const created = newItems.map((item) => ({
        ...item,
        id: crypto.randomUUID(),
        user_id: DEFAULT_USER_ID,
        created_at: now,
        updated_at: now,
      })) as T[]
      items.push(...created)
      await writeAll(items)
      return created
    },

    async updateMany(updates): Promise<T[]> {
      const items = await readAll()
      const results: T[] = []
      const now = new Date().toISOString()
      for (const { id, data } of updates) {
        const index = items.findIndex((item) => item.id === id)
        if (index === -1) throw new Error(`Item not found: ${id}`)
        items[index] = { ...items[index], ...data, updated_at: now }
        results.push(items[index])
      }
      await writeAll(items)
      return results
    },

    async deleteMany(ids: string[]): Promise<void> {
      const items = await readAll()
      const idSet = new Set(ids)
      const filtered = items.filter((item) => !idSet.has(item.id))
      await writeAll(filtered)
    },

    async getByUserId(userId: string): Promise<T[]> {
      const items = await readAll()
      return items.filter((item) => item.user_id === userId)
    },
  }
}
```

### Schritt 2.3: Store-Anpassungen für neuen create()-Signature

In allen Stores die `as Omit<T, 'id'>` Type-Assertions durch korrekte Objekte ersetzen. `id`, `created_at`, `updated_at` werden jetzt automatisch vom Repository gesetzt, also müssen sie nicht mehr manuell übergeben werden.

**Automation-Store — Beispiel `createSystem`:**

```typescript
// VORHER:
const newSystem = await systemRepo.create({
  name: data.name ?? 'New System',
  // ...
  ...data,
} as Omit<AutomationSystem, 'id'>)

// NACHHER:
const newSystem = await systemRepo.create({
  user_id: DEFAULT_USER_ID,
  name: data.name ?? 'New System',
  // ...
})
// Keine Type-Assertion mehr nötig
```

Analog für alle `create()`-Aufrufe in `content-store.ts`.

### Prüfung nach Phase 2

```bash
npx tsc --noEmit
npm run dev
```

Manueller Test:
- [ ] Content erstellen, bearbeiten, löschen
- [ ] System erstellen, duplizieren, löschen
- [ ] Template erstellen
- [ ] DevTools → localStorage: Einträge haben korrekte Timestamps
- [ ] `updated_at` ändert sich bei Updates

---

## Phase 3: Validation-Layer

**Ziel:** Zod-Schemas validieren alle Daten bevor sie in den Repository geschrieben werden. Invalide Daten werden abgefangen und mit klarer Fehlermeldung zurückgewiesen.

**Betroffene Layer:** `domain` (Schemas) + `infrastructure` (Repository-Wrapper)

**Aufwand:** ~4-5 Stunden

**Risiko:** NIEDRIG — Additive Änderung. Wenn Validation fehlschlägt, Error-Toast statt stiller Korruption.

### Schritt 3.1: Zod installieren

```bash
npm install zod
```

### Schritt 3.2: Base-Schema erstellen

**Neue Datei:** `src/core/persistence/schemas.ts`

```typescript
import { z } from 'zod'

export const baseEntitySchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().min(1),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
})
```

### Schritt 3.3: Domain-Schemas erstellen

**Neue Datei:** `src/modules/automation/domain/schemas.ts`

```typescript
import { z } from 'zod'
import { baseEntitySchema } from '@/core/persistence/schemas'

export const systemNodeSchema = z.object({
  id: z.string(),
  label: z.string().min(1),
  description: z.string(),
  icon: z.string(),
  type: z.enum(['trigger', 'process', 'ai', 'output']),
  x: z.number(),
  y: z.number(),
  logoUrl: z.string().optional(),
  linkedResourceType: z.string().optional(),
  linkedResourceId: z.string().optional(),
  linkedPage: z.string().optional(),
})

export const nodeConnectionSchema = z.object({
  from: z.string(),
  to: z.string(),
  fromPort: z.enum(['top', 'right', 'bottom', 'left']).optional(),
  toPort: z.enum(['top', 'right', 'bottom', 'left']).optional(),
})

export const automationSystemSchema = baseEntitySchema.extend({
  name: z.string().min(1).max(200),
  description: z.string(),
  category: z.string(),
  icon: z.string(),
  status: z.enum(['active', 'draft']),
  webhookUrl: z.string(),
  nodes: z.array(systemNodeSchema),
  connections: z.array(nodeConnectionSchema),
  groups: z.array(z.object({
    id: z.string(),
    label: z.string(),
    x: z.number(),
    y: z.number(),
    width: z.number().positive(),
    height: z.number().positive(),
    color: z.string(),
  })).optional(),
  stickyNotes: z.array(z.any()).optional(),
  outputs: z.array(z.any()),
  lastExecuted: z.string().optional(),
  executionCount: z.number().int().min(0),
})

// Für create(): ohne id, created_at, updated_at (werden auto-generiert)
export const createAutomationSystemSchema = automationSystemSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
}).partial()
```

**Neue Datei:** `src/modules/content/domain/schemas.ts`

```typescript
import { z } from 'zod'
import { baseEntitySchema } from '@/core/persistence/schemas'

export const contentItemSchema = baseEntitySchema.extend({
  platform: z.enum(['youtube', 'instagram', 'facebook-linkedin']),
  title: z.string().min(1).max(500),
  concept: z.string(),
  angle: z.string(),
  status: z.enum(['idea', 'draft', 'ready', 'scheduled', 'live', 'archived']),
  priority: z.enum(['high', 'medium', 'low']),
  quality: z.enum(['good', 'neutral', 'bad']),
  tags: z.array(z.string()),
  notes: z.string(),
  checklist: z.array(z.object({
    id: z.string(),
    text: z.string(),
    completed: z.boolean(),
  })),
  media: z.array(z.string()),
  versions: z.array(z.any()),
}).passthrough()  // Erlaubt Platform-spezifische Felder

export const contentFileSchema = baseEntitySchema.extend({
  name: z.string().min(1),
  description: z.string(),
  url: z.string(),
  category: z.enum(['marketing', 'dev', 'sales', 'content', 'operations', 'other']),
  labels: z.array(z.string()),
})

export const contentPlanSchema = baseEntitySchema.extend({
  name: z.string().min(1),
  description: z.string(),
  strategy: z.string(),
  deadline: z.string(),
  notes: z.string(),
  goal: z.string(),
  targetAudience: z.string(),
  channels: z.array(z.string()),
  tasks: z.array(z.object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
    status: z.enum(['todo', 'in-progress', 'done']),
    priority: z.enum(['high', 'medium', 'low']),
    dependsOn: z.array(z.string()).optional(),
    assignee: z.string().optional(),
    dueDate: z.string().optional(),
  })),
})
```

### Schritt 3.4: Validated Repository-Wrapper

**Neue Datei:** `src/core/persistence/create-validated-repository.ts`

```typescript
import type { BaseEntity, Repository, StorageAdapter } from './types'
import { createLocalRepository } from './create-repository'
import type { ZodType } from 'zod'

export function createValidatedRepository<T extends BaseEntity>(
  adapter: StorageAdapter,
  collectionKey: string,
  schema: ZodType<T>,
): Repository<T> {
  const repo = createLocalRepository<T>(adapter, collectionKey)

  return {
    ...repo,

    async create(item) {
      const created = await repo.create(item)
      // Validiere das Ergebnis (inklusive auto-generierter Felder)
      const result = schema.safeParse(created)
      if (!result.success) {
        // Rollback: Lösche das gerade erstellte Item
        await repo.delete(created.id).catch(() => {})
        throw new Error(
          `Validation failed on create: ${result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ')}`,
        )
      }
      return created
    },

    async update(id, data) {
      const updated = await repo.update(id, data)
      const result = schema.safeParse(updated)
      if (!result.success) {
        console.warn(`Validation warning on update ${id}:`, result.error.issues)
        // Bei Update: nicht rollbacken, aber warnen. Bestehende Daten könnten
        // vor dem Schema-Update erstellt worden sein.
      }
      return updated
    },
  }
}
```

### Schritt 3.5: Stores auf Validated Repositories umstellen

**In `automation-store.ts`:**

```typescript
// VORHER:
import { createLocalRepository } from '@/core/persistence/create-repository'

const systemRepo = createLocalRepository<AutomationSystem>(storage, 'automation-systems')

// NACHHER:
import { createValidatedRepository } from '@/core/persistence/create-validated-repository'
import { automationSystemSchema } from '../domain/schemas'

const systemRepo = createValidatedRepository<AutomationSystem>(
  storage,
  'automation-systems',
  automationSystemSchema,
)
```

Analog für `content-store.ts` mit `contentItemSchema`, `contentFileSchema`, `contentPlanSchema`.

### Prüfung nach Phase 3

```bash
npx tsc --noEmit
npm run dev
```

Manueller Test:
- [ ] Neuen Content erstellen → funktioniert, kein Validation-Error
- [ ] Neues System erstellen → funktioniert
- [ ] Browser Console: Keine Validation-Warnings
- [ ] Test: DevTools → localStorage → manuell ein Feld löschen → beim nächsten Load kommt eine Warnung

---

## Phase 4: Event-Bus Fix

**Ziel:** `off()` entfernt einen spezifischen Handler statt alle. Events sind typisiert. Async Handler werden unterstützt.

**Betroffene Layer:** `infrastructure` (core/events)

**Aufwand:** ~2 Stunden

**Risiko:** NIEDRIG — Event-Bus wird aktuell nur für `automation:systemCreated` und `automation:executed` verwendet. Wenige Subscriber.

### Schritt 4.1: Event-Bus ersetzen

**Datei:** `src/core/events/event-bus.ts` (ersetzen)

```typescript
/**
 * Typed Event Bus für Cross-Module Kommunikation.
 *
 * Module dürfen NICHT direkt voneinander importieren.
 * Stattdessen: Events emittieren und subscriben.
 */

// ── Event Registry ─────────────────────────────────────────────────────────
// Hier werden alle bekannten Events mit ihren Payloads definiert.
// Unbekannte Events werden als `unknown` behandelt.

export interface EventMap {
  'automation:systemCreated': { id: string; fromTemplate?: string }
  'automation:systemDeleted': { id: string }
  'automation:executed': { id: string }
  'content:itemCreated': { id: string }
  'content:itemDeleted': { id: string }
}

type EventCallback<T = unknown> = (data: T) => void | Promise<void>

class EventBus {
  private listeners = new Map<string, Set<EventCallback>>()

  /**
   * Subscribe to an event. Returns an unsubscribe function.
   */
  on<K extends keyof EventMap>(event: K, callback: EventCallback<EventMap[K]>): () => void
  on(event: string, callback: EventCallback): () => void
  on(event: string, callback: EventCallback): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(callback)

    // Return unsubscribe function (entfernt NUR diesen Handler)
    return () => {
      this.listeners.get(event)?.delete(callback)
      // Cleanup leerer Sets
      if (this.listeners.get(event)?.size === 0) {
        this.listeners.delete(event)
      }
    }
  }

  /**
   * Emit an event to all subscribers.
   */
  emit<K extends keyof EventMap>(event: K, data: EventMap[K]): void
  emit(event: string, data?: unknown): void
  emit(event: string, data?: unknown): void {
    this.listeners.get(event)?.forEach((cb) => {
      try {
        const result = cb(data)
        // Handle async handlers — fire and forget, but catch errors
        if (result instanceof Promise) {
          result.catch((e) => {
            console.error(`[EventBus] Async error in handler for "${event}":`, e)
          })
        }
      } catch (e) {
        console.error(`[EventBus] Error in handler for "${event}":`, e)
      }
    })
  }

  /**
   * Remove a specific handler for an event.
   */
  off(event: string, callback: EventCallback): void {
    this.listeners.get(event)?.delete(callback)
    if (this.listeners.get(event)?.size === 0) {
      this.listeners.delete(event)
    }
  }

  /**
   * Remove all handlers for all events. Only for testing/cleanup.
   */
  clear(): void {
    this.listeners.clear()
  }
}

export const eventBus = new EventBus()
```

### Schritt 4.2: Bestehende `emit()`-Aufrufe prüfen

In `automation-store.ts` gibt es:
- `eventBus.emit('automation:systemCreated', { id: newSystem.id })` → stimmt mit EventMap überein ✓
- `eventBus.emit('automation:executed', { id })` → stimmt überein ✓

Keine Änderungen nötig in den Stores.

### Prüfung nach Phase 4

```bash
npx tsc --noEmit
npm run dev
```

- [ ] System erstellen → kein Fehler in Console
- [ ] System aktivieren/deaktivieren → kein Fehler

---

## Phase 5: Store-Konsolidierung

**Ziel:** Stores bekommen sauberes Error-Handling, granulare Loading-States und korrekte Race-Condition-Prävention. Keine Silent-Swallows mehr.

**Betroffene Layer:** `application` (alle Stores)

**Aufwand:** ~6-8 Stunden

**Risiko:** MITTEL — Jede Store-Methode wird angepasst. Aber: die API bleibt gleich, nur die Interna ändern sich.

### Schritt 5.1: Store-Error-Pattern definieren

**Neue Datei:** `src/core/persistence/store-helpers.ts`

```typescript
import { toastError } from '@/shared/hooks/useToast'

/**
 * Wrapper für async Store-Operationen.
 * Garantiert:
 * - Fehler werden IMMER als Toast angezeigt
 * - Loading-State wird IMMER zurückgesetzt
 * - Fehler werden nach oben propagiert (throw)
 */
export async function storeAction<T>(
  setLoading: (key: string, loading: boolean) => void,
  key: string,
  action: () => Promise<T>,
  errorMessage: string,
): Promise<T> {
  setLoading(key, true)
  try {
    const result = await action()
    return result
  } catch (e) {
    const message = e instanceof Error ? e.message : errorMessage
    toastError(message)
    throw e
  } finally {
    setLoading(key, false)
  }
}
```

### Schritt 5.2: Granulare Loading-States

**Pattern für jeden Store:**

```typescript
// VORHER:
loading: boolean

// NACHHER:
loadingStates: Record<string, boolean>

// Helper im Store:
_setLoading: (key: string, loading: boolean) => void

// Usage:
get().loadingStates['fetchItems']  // → true/false
```

**Konkretes Beispiel in `content-store.ts`:**

```typescript
interface ContentStore {
  // ...
  loadingStates: Record<string, boolean>
  isLoading: (key: string) => boolean
  // Convenience: mindestens ein Loading-State aktiv
  loading: boolean
}

// Im create:
export const useContentStore = create<ContentStore>((set, get) => ({
  // ...
  loadingStates: {},

  isLoading: (key) => get().loadingStates[key] ?? false,

  get loading() {
    return Object.values(get().loadingStates).some(Boolean)
  },

  // Helper (intern)
  _setLoading: (key: string, loading: boolean) => {
    set((s) => ({
      loadingStates: { ...s.loadingStates, [key]: loading },
    }))
  },

  fetchItems: async () => {
    const { _setLoading } = get()
    _setLoading('fetchItems', true)
    try {
      let items = await contentRepo.getAll()
      if (items.length === 0) {
        // Seed demo data
        for (const demo of DEMO_CONTENT) {
          await contentRepo.create(demo)
        }
        items = await contentRepo.getAll()
      }
      set({ items })
    } catch (e) {
      toastError('Content konnte nicht geladen werden')
      throw e  // ← NICHT schlucken
    } finally {
      _setLoading('fetchItems', false)  // ← IMMER zurücksetzen
    }
  },

  // ...
}))
```

### Schritt 5.3: Race-Condition-Schutz

Für Operationen die State lesen und dann schreiben (z.B. `toggleSystemStatus`):

```typescript
// VORHER (Race Condition):
toggleSystemStatus: async (id) => {
  const system = get().systems.find((s) => s.id === id)  // ← liest State
  // ... async operations ...
  // ← State könnte sich zwischenzeitlich geändert haben
}

// NACHHER:
toggleSystemStatus: async (id) => {
  // Lies den aktuellen Status direkt aus dem Repository, nicht aus dem Store-Cache
  const system = await systemRepo.getById(id)
  if (!system) throw new Error(`System not found: ${id}`)
  const newStatus = system.status === 'active' ? 'draft' : 'active'
  const updated = await systemRepo.update(id, { status: newStatus })
  // Store-State aktualisieren
  set((state) => ({
    systems: state.systems.map((s) => (s.id === id ? updated : s)),
  }))
}
```

### Schritt 5.4: Alle Store-Methoden durchgehen

Für **jeden** Store (`automation-store.ts`, `content-store.ts`):

1. `loading: boolean` → `loadingStates: Record<string, boolean>` + `isLoading()` + computed `loading`
2. Jeder `catch`-Block: Fehler propagieren (`throw e`) statt schlucken
3. `finally`-Block statt manuelles `set({ loading: false })`
4. Methoden die State lesen + dann async schreiben: aus Repository lesen statt aus Cache

### Prüfung nach Phase 5

```bash
npx tsc --noEmit
npm run dev
```

Manueller Test:
- [ ] Content erstellen → Toast "Content erstellt", Item erscheint
- [ ] Content löschen → Toast "Content gelöscht", Item verschwindet
- [ ] Schnell 5x hintereinander auf "Erstellen" klicken → keine doppelten Items, kein Crash
- [ ] Browser Console: Keine unbehandelten Fehler

---

## Phase 6: Canvas State-Konsolidierung

**Ziel:** `useCanvasState` Hook wird zu einem Zustand-Slice im `automation-store`. UI-State (Selection, Viewport) bleibt lokal. Domain-State (Nodes, Connections) geht in den Store. Dadurch: Single Source of Truth, persistierbar, sync-fähig.

**Betroffene Layer:** `application` (automation-store) + `canvas` (Hook + WorkflowCanvas)

**Aufwand:** ~8-10 Stunden

**Risiko:** HOCH — WorkflowCanvas ist die komplexeste Komponente. Sehr sorgfältig arbeiten.

### Schritt 6.1: Canvas-Domain-State in automation-store integrieren

**In `automation-store.ts` ergänzen:**

```typescript
interface AutomationStore {
  // ... bestehende Felder ...

  // Canvas Domain State (für das aktuell geöffnete System)
  canvasNodes: SystemNode[]
  canvasConnections: NodeConnection[]
  canvasGroups: CanvasGroup[]
  canvasStickyNotes: StickyNote[]

  // Canvas Domain Operations
  loadCanvas: (systemId: string) => void
  saveCanvas: (systemId: string) => Promise<void>
  canvasAddNode: (node: SystemNode) => void
  canvasUpdateNode: (id: string, data: Partial<SystemNode>) => void
  canvasDeleteNode: (id: string) => void
  canvasAddConnection: (conn: NodeConnection) => boolean
  canvasDeleteConnection: (idx: number) => void
  canvasAddGroup: (group: CanvasGroup) => void
  canvasUpdateGroup: (id: string, data: Partial<CanvasGroup>) => void
  canvasDeleteGroup: (id: string) => void
  canvasAddStickyNote: (sticky: StickyNote) => void
  canvasUpdateStickyNote: (id: string, data: Partial<StickyNote>) => void
  canvasDeleteStickyNote: (id: string) => void
}
```

### Schritt 6.2: useCanvasState wird zum UI-only Hook

**Datei:** `src/modules/automation/canvas/useCanvasState.ts`

Der Hook behält NUR:
- Selection-State (selectedNodeId, selectedConnIdx, etc.)
- Viewport-State (zoom, pan)
- Canvas-Settings (line style, arrow head, etc.)
- Undo/Redo History (Snapshots der Domain-Daten)

Er **liest** die Domain-Daten aus dem Store, **schreibt** über Store-Actions.

```typescript
export function useCanvasState(systemId: string | null) {
  const {
    canvasNodes, canvasConnections, canvasGroups, canvasStickyNotes,
    canvasAddNode, canvasUpdateNode, canvasDeleteNode,
    // ... alle canvas-Actions
  } = useAutomationStore()

  // Selection (bleibt lokal — nicht persistierbar, nicht sync-relevant)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  // ... andere UI-States ...

  // Undo/Redo History (lokal, arbeitet mit Store-Daten)
  const historyRef = useRef<CanvasSnapshot[]>([])
  // ...

  return {
    // Domain-Daten direkt aus Store
    nodes: canvasNodes,
    connections: canvasConnections,
    // ...

    // Domain-Mutations via Store
    addNode: canvasAddNode,
    updateNode: canvasUpdateNode,
    // ...

    // UI-State lokal
    selectedNodeId, setSelectedNodeId,
    zoom, setZoom,
    // ...
  }
}
```

### Schritt 6.3: WorkflowCanvas anpassen

Minimale Änderungen — der Hook gibt dieselbe API zurück, nur die Quelle ist anders.

**Einzige Änderung:** `systemId` wird an `useCanvasState` übergeben.

```typescript
// VORHER:
const canvas = useCanvasState({
  nodes: initialSystem?.nodes,
  connections: initialSystem?.connections,
})

// NACHHER:
const canvas = useCanvasState(initialSystem?.id ?? null)
```

### Prüfung nach Phase 6

```bash
npx tsc --noEmit
npm run dev
```

Manueller Test (AUSFÜHRLICH — höchstes Risiko):
- [ ] Canvas öffnen → Nodes sind sichtbar
- [ ] Node verschieben → Position wird gespeichert
- [ ] Verbindung ziehen → Verbindung wird angezeigt
- [ ] Speichern → Zurück zur Übersicht → Erneut öffnen → Änderungen sind da
- [ ] Undo/Redo → funktioniert
- [ ] Node löschen → Verbindungen werden mit gelöscht
- [ ] Sticky Note hinzufügen, verschieben, löschen
- [ ] Gruppe hinzufügen, verschieben, resizen, löschen
- [ ] Settings-Panel → Einstellungen ändern → werden angewendet
- [ ] Context-Menu → alle Optionen funktionieren

---

## Phase 7: Error-Handling + localStorage-Fix

**Ziel:** Fehler werden dem User angezeigt statt stillschweigend geschluckt. localStorage-Adapter warnt bei Speicher-Problemen und unterstützt Multi-Tab-Konsistenz.

**Betroffene Layer:** `infrastructure` (localStorage-Adapter)

**Aufwand:** ~3-4 Stunden

**Risiko:** NIEDRIG — Additive Änderungen am Adapter.

### Schritt 7.1: localStorage-Adapter verbessern

**Datei:** `src/core/persistence/local-storage-adapter.ts`

```typescript
import type { StorageAdapter } from './types'
import { toastWarning } from '@/shared/hooks/useToast'

const STORAGE_LIMIT_WARNING = 4 * 1024 * 1024  // 4MB Warnung (Limit ist 5-10MB)

export class LocalStorageAdapter implements StorageAdapter {
  private prefix: string

  constructor(prefix = 'flowstack') {
    this.prefix = prefix
    this.initMultiTabSync()
  }

  private key(k: string): string {
    return `${this.prefix}-${k}`
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const raw = localStorage.getItem(this.key(key))
      if (!raw) return null
      return JSON.parse(raw) as T
    } catch (e) {
      console.error(`[Storage] Failed to parse key: ${key}`, e)
      // Korrupte Daten — lieber null als Crash
      return null
    }
  }

  async set<T>(key: string, value: T): Promise<void> {
    const serialized = JSON.stringify(value)

    // Size-Check vor dem Schreiben
    this.checkStorageUsage()

    try {
      localStorage.setItem(this.key(key), serialized)
    } catch (e) {
      // QuotaExceededError — Storage voll
      if (e instanceof DOMException && e.name === 'QuotaExceededError') {
        toastWarning('Lokaler Speicher fast voll. Bitte lösche nicht benötigte Daten.')
      }
      // Fehler wird nach oben propagiert
      throw new Error(`Storage write failed for "${key}": ${e instanceof Error ? e.message : 'Unknown error'}`)
    }
  }

  async remove(key: string): Promise<void> {
    localStorage.removeItem(this.key(key))
  }

  async keys(): Promise<string[]> {
    const result: string[] = []
    const prefixWithDash = `${this.prefix}-`
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k?.startsWith(prefixWithDash)) {
        result.push(k.slice(prefixWithDash.length))
      }
    }
    return result
  }

  // ── Storage-Nutzung prüfen ──────────────────────────────────────────────

  private checkStorageUsage(): void {
    try {
      let totalSize = 0
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key) {
          totalSize += (localStorage.getItem(key) ?? '').length * 2  // UTF-16 = 2 bytes per char
        }
      }
      if (totalSize > STORAGE_LIMIT_WARNING) {
        console.warn(`[Storage] Usage: ${(totalSize / 1024 / 1024).toFixed(1)}MB — nähert sich dem Limit`)
      }
    } catch {
      // Ignorieren — nicht kritisch
    }
  }

  // ── Multi-Tab-Sync ──────────────────────────────────────────────────────

  private initMultiTabSync(): void {
    if (typeof window === 'undefined') return
    window.addEventListener('storage', (e) => {
      // Nur eigene Keys
      if (!e.key?.startsWith(`${this.prefix}-`)) return
      // Dispatch custom event für interessierte Stores
      window.dispatchEvent(
        new CustomEvent('flowstack:storage-sync', {
          detail: {
            key: e.key.slice(`${this.prefix}-`.length),
            newValue: e.newValue,
          },
        }),
      )
    })
  }
}

export const storage = new LocalStorageAdapter()
```

### Prüfung nach Phase 7

```bash
npx tsc --noEmit
npm run dev
```

- [ ] App in 2 Tabs öffnen → in Tab 1 Content erstellen → Tab 2: Console zeigt `flowstack:storage-sync` Event
- [ ] DevTools → Application → localStorage → Größe beobachten

---

## Phase 8: Undo/Redo Fix + Graph-Modell Sicherheit

**Ziel:** Undo/Redo verwendet `structuredClone()` statt Spread-Operator. Keine Shared-Reference-Bugs mehr. Graph-Lookup wird auf sichere Art optimiert.

**Betroffene Layer:** `canvas` (useCanvasState)

**Aufwand:** ~3-4 Stunden

**Risiko:** NIEDRIG — Interne Änderung, API bleibt gleich.

### Schritt 8.1: structuredClone für Snapshots

**In `useCanvasState.ts`:**

```typescript
// VORHER:
const pushHistory = useCallback(() => {
  historyRef.current.push({
    nodes: nodes.map((n) => ({ ...n })),          // ← Shallow Copy!
    connections: connections.map((c) => ({ ...c })),
    // ...
  })
}, [nodes, connections, groups, stickyNotes])

// NACHHER:
const pushHistory = useCallback(() => {
  historyRef.current.push(
    structuredClone({
      nodes: canvasNodes,        // ← jetzt aus Store
      connections: canvasConnections,
      groups: canvasGroups,
      stickyNotes: canvasStickyNotes,
    })
  )
  futureRef.current = []
  if (historyRef.current.length > 50) {
    historyRef.current = historyRef.current.slice(-50)
  }
}, [canvasNodes, canvasConnections, canvasGroups, canvasStickyNotes])
```

Gleiche Änderung für `undo()` und `redo()` — alle Snapshot-Operationen nutzen `structuredClone()`.

### Schritt 8.2: Connection-Lookup Safeguard

Im `WorkflowCanvas.tsx` gibt es O(n²) bei Connection-Rendering:

```typescript
// VORHER:
canvas.connections.map((conn, i) => {
  const fromNode = canvas.nodes.find((n) => n.id === conn.from)  // O(n) pro Connection
  const toNode = canvas.nodes.find((n) => n.id === conn.to)      // O(n) pro Connection
})
```

**Fix — Node-Lookup-Map im WorkflowCanvas erstellen:**

```typescript
// NACHHER: Am Anfang des Render-Blocks
const nodeMap = useMemo(
  () => new Map(canvas.nodes.map((n) => [n.id, n])),
  [canvas.nodes],
)

// Bei Connection-Rendering:
canvas.connections.map((conn, i) => {
  const fromNode = nodeMap.get(conn.from)   // O(1)
  const toNode = nodeMap.get(conn.to)       // O(1)
  if (!fromNode || !toNode) return null
  // ...
})
```

**WICHTIG:** Wir ändern NICHT das grundlegende Datenmodell (Arrays bleiben). Wir erstellen nur einen abgeleiteten Index für das Rendering. Das ist proportional zum Problem und kein Overengineering.

### Prüfung nach Phase 8

```bash
npx tsc --noEmit
npm run dev
```

Manueller Test:
- [ ] Canvas öffnen → 3-4 Nodes hinzufügen → verschieben → Undo → Undo → Redo → Positionen stimmen
- [ ] Node bearbeiten (Label ändern) → Undo → altes Label ist zurück
- [ ] Verbindung löschen → Undo → Verbindung ist zurück
- [ ] Console: Keine Errors

---

## Phase 9: Minimal-Tests

**Ziel:** Sicherheitsnetz für die kritischsten Pfade. Kein 100% Coverage. Nur die Dinge testen die bei Regression die App zerstören würden.

**Betroffene Layer:** Test-Infrastruktur (neu)

**Aufwand:** ~4-5 Stunden

**Risiko:** NULL — Additive Dateien, keine Code-Änderungen.

### Schritt 9.1: Test-Setup

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

**Neue Datei:** `vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
})
```

**Neue Datei:** `src/test/setup.ts`

```typescript
import '@testing-library/jest-dom'

// Mock localStorage
const store: Record<string, string> = {}
const localStorageMock = {
  getItem: (key: string) => store[key] ?? null,
  setItem: (key: string, value: string) => { store[key] = value },
  removeItem: (key: string) => { delete store[key] },
  clear: () => { Object.keys(store).forEach((k) => delete store[k]) },
  get length() { return Object.keys(store).length },
  key: (i: number) => Object.keys(store)[i] ?? null,
}
Object.defineProperty(window, 'localStorage', { value: localStorageMock })
```

### Schritt 9.2: Was getestet wird (und was NICHT)

**TESTEN:**

| Test | Warum |
|------|-------|
| Repository CRUD (create, read, update, delete) | Kern-Datenzugriff |
| Repository query() mit Filtern | Supabase-Kompatibilität |
| Repository create() generiert id, timestamps | Auto-Felder korrekt |
| Repository update() setzt updated_at | Timestamp-Integrität |
| Event-Bus on/off/emit | Cross-Module-Kommunikation |
| Event-Bus: off entfernt NUR den spezifischen Handler | Bugfix-Regression |
| Validation: gültige Daten → kein Error | Happy Path |
| Validation: fehlende Pflichtfelder → Error | Safety Net |

**NICHT TESTEN:**
- UI-Rendering (zu fragil, ändert sich ständig)
- Canvas-Interaktionen (Mouse-Events, Drag & Drop)
- Store-Methoden im Detail (werden indirekt über Repository getestet)
- Styling, Layout, Design
- i18n, Theme-Switching

### Schritt 9.3: Test-Dateien

**Datei:** `src/core/persistence/__tests__/repository.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { createLocalRepository } from '../create-repository'
import { LocalStorageAdapter } from '../local-storage-adapter'
import type { BaseEntity } from '../types'

interface TestItem extends BaseEntity {
  name: string
  status: 'active' | 'archived'
}

describe('Repository', () => {
  let repo: ReturnType<typeof createLocalRepository<TestItem>>

  beforeEach(() => {
    localStorage.clear()
    const adapter = new LocalStorageAdapter('test')
    repo = createLocalRepository<TestItem>(adapter, 'test-items')
  })

  it('create() generiert id und timestamps', async () => {
    const item = await repo.create({ user_id: 'u1', name: 'Test', status: 'active' })
    expect(item.id).toBeDefined()
    expect(item.id.length).toBe(36) // UUID
    expect(item.created_at).toBeDefined()
    expect(item.updated_at).toBeDefined()
    expect(item.user_id).toBe('u1')
  })

  it('getById() findet erstelltes Item', async () => {
    const created = await repo.create({ user_id: 'u1', name: 'Test', status: 'active' })
    const found = await repo.getById(created.id)
    expect(found).toEqual(created)
  })

  it('update() aktualisiert updated_at', async () => {
    const created = await repo.create({ user_id: 'u1', name: 'Test', status: 'active' })
    // Kurz warten damit Timestamp sich unterscheidet
    await new Promise((r) => setTimeout(r, 10))
    const updated = await repo.update(created.id, { name: 'Updated' })
    expect(updated.name).toBe('Updated')
    expect(updated.updated_at).not.toBe(created.updated_at)
  })

  it('delete() entfernt Item', async () => {
    const created = await repo.create({ user_id: 'u1', name: 'Test', status: 'active' })
    await repo.delete(created.id)
    const found = await repo.getById(created.id)
    expect(found).toBeNull()
  })

  it('delete() wirft bei nicht-existierendem Item', async () => {
    await expect(repo.delete('non-existent')).rejects.toThrow()
  })

  it('query() filtert korrekt', async () => {
    await repo.create({ user_id: 'u1', name: 'A', status: 'active' })
    await repo.create({ user_id: 'u1', name: 'B', status: 'archived' })
    await repo.create({ user_id: 'u1', name: 'C', status: 'active' })

    const result = await repo.query({ where: { status: 'active' } })
    expect(result.data).toHaveLength(2)
    expect(result.total).toBe(2)
  })

  it('query() paginiert korrekt', async () => {
    for (let i = 0; i < 10; i++) {
      await repo.create({ user_id: 'u1', name: `Item ${i}`, status: 'active' })
    }
    const result = await repo.query({ limit: 3, offset: 2 })
    expect(result.data).toHaveLength(3)
    expect(result.total).toBe(10)
  })

  it('getByUserId() filtert nach User', async () => {
    await repo.create({ user_id: 'u1', name: 'A', status: 'active' })
    await repo.create({ user_id: 'u2', name: 'B', status: 'active' })

    const items = await repo.getByUserId('u1')
    expect(items).toHaveLength(1)
    expect(items[0].user_id).toBe('u1')
  })

  it('createMany() erstellt mehrere Items', async () => {
    const created = await repo.createMany([
      { user_id: 'u1', name: 'A', status: 'active' },
      { user_id: 'u1', name: 'B', status: 'archived' },
    ])
    expect(created).toHaveLength(2)
    const all = await repo.getAll()
    expect(all).toHaveLength(2)
  })

  it('deleteMany() löscht mehrere Items', async () => {
    const a = await repo.create({ user_id: 'u1', name: 'A', status: 'active' })
    const b = await repo.create({ user_id: 'u1', name: 'B', status: 'active' })
    await repo.create({ user_id: 'u1', name: 'C', status: 'active' })

    await repo.deleteMany([a.id, b.id])
    const all = await repo.getAll()
    expect(all).toHaveLength(1)
    expect(all[0].name).toBe('C')
  })
})
```

**Datei:** `src/core/events/__tests__/event-bus.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { eventBus } from '../event-bus'

describe('EventBus', () => {
  beforeEach(() => {
    eventBus.clear()
  })

  it('on + emit ruft Handler auf', () => {
    const handler = vi.fn()
    eventBus.on('automation:systemCreated', handler)
    eventBus.emit('automation:systemCreated', { id: '123' })
    expect(handler).toHaveBeenCalledWith({ id: '123' })
  })

  it('unsubscribe-Funktion entfernt NUR diesen Handler', () => {
    const handler1 = vi.fn()
    const handler2 = vi.fn()
    const unsub1 = eventBus.on('automation:executed', handler1)
    eventBus.on('automation:executed', handler2)

    unsub1()  // Nur handler1 entfernen

    eventBus.emit('automation:executed', { id: '123' })
    expect(handler1).not.toHaveBeenCalled()
    expect(handler2).toHaveBeenCalledWith({ id: '123' })
  })

  it('off(event, handler) entfernt spezifischen Handler', () => {
    const handler1 = vi.fn()
    const handler2 = vi.fn()
    eventBus.on('automation:executed', handler1)
    eventBus.on('automation:executed', handler2)

    eventBus.off('automation:executed', handler1)

    eventBus.emit('automation:executed', { id: '123' })
    expect(handler1).not.toHaveBeenCalled()
    expect(handler2).toHaveBeenCalledWith({ id: '123' })
  })

  it('Handler-Fehler crashen nicht den Bus', () => {
    const badHandler = vi.fn(() => { throw new Error('oops') })
    const goodHandler = vi.fn()
    eventBus.on('automation:executed', badHandler)
    eventBus.on('automation:executed', goodHandler)

    eventBus.emit('automation:executed', { id: '123' })
    expect(goodHandler).toHaveBeenCalled()
  })
})
```

### Schritt 9.4: package.json Script

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

### Prüfung nach Phase 9

```bash
npm test
# Alle Tests grün
npx tsc --noEmit
# Null Fehler
npm run dev
# App funktioniert
```

---

## Zusammenfassung: Aufwand-Übersicht

| Phase | Beschreibung | Stunden | Risiko | Abhängig von |
|-------|-------------|---------|--------|--------------|
| 1 | BaseEntity + Domain-Types | 4-5h | Niedrig | — |
| 2 | Repository-Interface v2 | 5-6h | Mittel | Phase 1 |
| 3 | Validation-Layer (Zod) | 4-5h | Niedrig | Phase 2 |
| 4 | Event-Bus Fix | 2h | Niedrig | — |
| 5 | Store-Konsolidierung | 6-8h | Mittel | Phase 2, 3 |
| 6 | Canvas State-Konsolidierung | 8-10h | Hoch | Phase 5 |
| 7 | Error-Handling + localStorage | 3-4h | Niedrig | Phase 5 |
| 8 | Undo/Redo + Graph Fix | 3-4h | Niedrig | Phase 6 |
| 9 | Minimal-Tests | 4-5h | Null | Alle |
| **Gesamt** | | **39-49h** | | |

Bei 6-8 produktiven Stunden pro Tag: **~6-8 Arbeitstage** für einen einzelnen Entwickler.

---

## Nach Abschluss aller Phasen: Was der Coder hat

- **Supabase-ready Types** mit `user_id`, Timestamps
- **Repository-Interface** das 1:1 auf `.from('table').select().eq().order().range()` gemappt werden kann
- **Validierte Daten** — kein `undefined` oder kaputtes JSON im Storage
- **Sauberer Event-Bus** — Unsubscribe funktioniert korrekt
- **Race-Condition-freie Stores** — kein State-Drift bei schnellem Klicken
- **Single Source of Truth** für Canvas-Daten im Zustand-Store
- **Fehler die sichtbar sind** — kein Silent Fail
- **localStorage mit Limits** — warnt bevor Daten verloren gehen
- **Korrekte Undo/Redo** — keine Shared-Reference-Bugs
- **Tests** für die kritischen Infrastruktur-Pfade

Der nächste Schritt nach diesem Masterplan: **Supabase-Adapter** implementieren, der das neue Repository-Interface nutzt. Der Adapter wird eine neue Datei (`create-supabase-repository.ts`), keine bestehende Datei wird geändert. Die Stores merken davon nichts.
