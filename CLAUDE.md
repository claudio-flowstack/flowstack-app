# Flowstack Platform

> KI-Automatisierungs-Plattform für Agenturen (Recruiting, Marketing, Webdesign).
> Solo-Founder Projekt — Claudio baut alles selbst. Claude ist der Co-Pilot.

## Tech Stack
- React 19.2, TypeScript 5.9 (strict), Vite 7.3, Tailwind CSS 4.1
- Zustand 5.0 (State) + LocalStorage Repository-Pattern (Persistence)
- Radix UI (Primitives), Lucide React (Icons), Framer Motion (Animationen)
- ApexCharts + Recharts (Charts), TipTap (Rich-Text Editor), xterm (Terminal)
- Three.js (@react-three/fiber) für 3D auf Homepage
- Path-Alias: `@/` → `./src/`
- `@babel/core` auf 7.28.0 gepinnt (7.29+ bricht @vitejs/plugin-react) — siehe `overrides` in package.json

## Architektur

```
src/
├── core/              # Infrastruktur: Theme, i18n, Persistence, Events, AI, Drive-Cache
├── shell/             # App.tsx, DashboardLayout, Sidebar, Header, MobileBottomNav
├── modules/           # Feature-Module (alle lazy-loaded)
├── shared/            # Gemeinsame Components, Hooks, Stores, Utils
├── components/ui/     # Basis-UI (Button, Dialog, Tabs — CVA Pattern)
├── components/blocks/ # Zusammengesetzte Blöcke (AnimatedGroup, etc.)
└── styles/            # globals.css (CSS Variablen + Tailwind @theme)
```

### Modul-Aufbau (Convention für jedes Modul)
```
modules/<name>/
├── application/    # Zustand Store
├── domain/         # Types, Constants
├── pages/          # Page-Components
├── components/     # Modul-spezifische UI
├── canvas/         # Canvas-spezifisch (nur automation)
├── data/           # Mock-Daten, Storage
└── services/       # API-Calls (falls vorhanden)
```

## Module & Routing

### Standalone (eigenes Layout, OHNE Dashboard-Sidebar)
| Route | Modul | Beschreibung |
|---|---|---|
| `/kunden-hub/*` | kunden-hub | Fulfillment-Portal mit eigener Sidebar, Contexts, i18n |
| `/hp` | homepage | Marketing-Homepage mit 3D/Shader Animationen |
| `/demo/*` | demo-funnel | Sales-Funnel: Landing, Formular, Danke, Datenschutz, Impressum |

### Full-Screen Editoren (OHNE Sidebar)
| Route | Modul |
|---|---|
| `/automation/system/:systemId/editor` | SystemEditorPage |
| `/automation/funnel/:funnelId` | FunnelEditorPage |

### Dashboard (MIT Sidebar via DashboardLayout)
| Route | Modul |
|---|---|
| `/` | DashboardPage |
| `/automation/*` | AutomationPage (Grid → SystemDetail → Editor) |
| `/content/*` | ContentPage (Kalender, Planung, Dateien) |
| `/research/*` | ResearchPage (Lead-Research, AI-Analyse) |
| `/kpi/*` | KpiPage (Metriken, Analytics) |
| `/drive/*` | DrivePage (Google Drive Vault) |
| `/terminal/*` | TerminalPage (xterm Emulation) |
| `/settings` | SettingsPage |

**Wichtig:** Full-Screen-Editoren werden in App.tsx VOR dem DashboardLayout definiert.

## State Management

### Pattern: Zustand + Repository
```tsx
// 1. Repository erstellen
const repo = createLocalRepository<MyType>(storage, 'collection-key')

// 2. Store mit set/get
export const useMyStore = create<MyStore>((set, get) => ({
  items: [],
  loading: false,
  fetchItems: async () => {
    set({ loading: true })
    const items = await repo.getAll()
    set({ items, loading: false })
  },
  createItem: async (data) => {
    const item = await repo.create(data)
    set((s) => ({ items: [...s.items, item] }))
    eventBus.emit('item:created', { id: item.id })
    toastSuccess('Erstellt')
  },
}))
```

### 5 Stores
| Store | Key | Zweck |
|---|---|---|
| `useUIStore` | shared/stores | Sidebar, Demo-Mode |
| `useAutomationStore` | automation/application | Systeme, Templates, Resources (CRUD) |
| `useContentStore` | content/application | Content-Items, Files, Plans |
| `useResearchStore` | research/application | Lead-Research, Batch-Jobs |
| `useContentResearchStore` | research/application | YouTube/News-Suche, AI-Analyse |

### Cross-Modul Kommunikation
- `eventBus.emit('domain:event', payload)` aus `core/events/`
- NICHT direkt zwischen Stores importieren

## Design System

### CSS Variablen (globals.css)
```
Light:  --background: #fafafa  --primary: #6366f1 (Indigo)  --card: #ffffff
Dark:   --background: #09090b  --primary: #818cf8            --card: #111113
```
- Schriften: Inter (Body), Outfit (Headings)
- Alle Farben über CSS Variablen, NIE hardcoded hex in Komponenten
- Animations: `animate-slide-in`, `animate-fade-in`, `animate-fade-in-up` (Tailwind @theme)

### Component Patterns
```tsx
// CVA für Varianten (Button, Badge, etc.)
const variants = cva("base-classes", {
  variants: { variant: { default: "...", ghost: "..." }, size: { sm: "...", md: "..." } },
  defaultVariants: { variant: "default", size: "md" },
})

// cn() für bedingtes Mergen
<div className={cn("base", isActive && "bg-primary", className)} />

// Framer Motion für Animationen
<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} />
```

### Gemeinsame Imports
```tsx
import { cn } from '@/shared/lib/utils'
import { useUIStore } from '@/shared/stores/ui-store'
import { toastSuccess, toastError } from '@/shared/hooks/useToast'
import { useTheme } from '@/core/theme/context'
import { useLanguage } from '@/core/i18n/context'
import { ErrorBoundary } from '@/shared/components/ErrorBoundary'
import { Button } from '@/components/ui/button'
```

## i18n
- Deutsch-first: `createT(lang)` aus `core/i18n/translations.ts`
- Fallback: DE → Key-Name
- Alle neuen UI-Texte als Translation-Keys
- Kunden-Hub hat EIGENES i18n System (komplett isoliert von Core)

## Kunden-Hub (`src/modules/kunden-hub/`)

### Das ist eine eigenständige Sub-App mit:
- Eigenem Layout (AppLayout + AppSidebar + AppHeader)
- Eigenen Contexts (Theme, Language, Notification, Sidebar)
- Eigenem Store (fulfillment-store.ts mit Zustand)
- Eigener API (services/api.ts → localhost:3002/api/v3)
- Eigenen UI Components (KEIN shadcn, custom Tailwind)
- Eigenen Icons (SVG imports via ?react, 50+ Icons)

### Kritische Regeln (IMMER beachten)
1. **`import type { X }`** für Type-only Imports — sonst Runtime-Crash (ESM linking error). Besonders: `ApexOptions` aus `apexcharts`, alle Interfaces aus `data/types.ts`
2. **ThemeContext NICHT ändern** — Verzögerter Zwei-Zyklen-Ansatz ist Absicht (Konflikt mit Core-ThemeProvider)
3. **`react-router-dom`** verwenden, NICHT `react-router`
4. **Navigate-Pfade mit `/kunden-hub/` Prefix** — `navigate('/clients')` geht ins Leere → `navigate('/kunden-hub/clients')`
5. **Charts lazy laden** — `const Chart = lazy(() => import('react-apexcharts'))` + `<Suspense>`. Optionen IMMER in `useMemo()`
6. **React Hooks VOR early return** — Alle Hooks VOR `if (!data) return null`

### Domain-Modell
- **4 Phasen:** Strategie → Texte → Funnel → Kampagnen (18 Deliverable-Subtypes)
- **10 Client-Status:** qualifying → onboarding → strategy → copy → funnel → campaigns → review → live → paused → churned
- **API-First mit Mock-Fallback:** Wenn Backend nicht läuft, fallen Stores auf Mock-Daten zurück
- **Optimistic Updates:** Approve/Reject sofort lokal, dann API-Sync, Rollback bei Fehler

### Bekannte Workarounds
- Approval-Endpoint hat falschen Pfad in api.ts, Fallback auf direkten Fetch
- Connections nur lokaler State, keine API-Persistierung
- Keine Pagination — alles im Memory
- Keine echte Auth — API läuft auf localhost ohne Tokens

## Automation Canvas

### Kernkomponente: WorkflowCanvas.tsx (~5600 Zeilen, @ts-nocheck)
- 16 Node-Typen, 9 Design-Themes, 4 Layouts
- Standard-Theme: `nodelab` (1:1 NodeLab V3 Styling)
- CanvasNode.tsx — Node-Rendering
- CanvasConnection.tsx — Verbindungen mit Farbanimationen
- constants.ts — NODE_STYLES, NODE_TYPE_DIMENSIONS

### Wichtige Dateien
| Datei | Zweck |
|---|---|
| `canvas/WorkflowCanvas.tsx` | Canvas-Engine (Legacy, @ts-nocheck) |
| `canvas/CanvasNode.tsx` | Node-Rendering |
| `canvas/constants.ts` | Styles, Dimensionen, Farben |
| `domain/types.ts` | AutomationSystem, SystemNode, etc. |
| `pages/SystemEditorPage.tsx` | Full-Screen Editor |
| `pages/AutomationPage.tsx` | System-Grid |

## Backend & Secrets (Doppler)
- Demo-Backend: Python auf localhost:3002, Secrets via Doppler
- Vite Proxy: `/api` → `http://127.0.0.1:3002`, `/ws` → WebSocket
- Drive/Gmail Cache: `core/drive-cache.ts` prefetched beim App-Start (fails silently)

### Doppler Setup
- **NIEMALS API-Keys hardcoden oder in .env Dateien** — alles läuft über Doppler
- Projekt: `fulfillment-automation`, Config: **`dev_claudio`** (NUR diesen Branch verwenden!)
- Backend starten: `doppler run --project fulfillment-automation --config dev_claudio -- python3 demo-backend/server.py`
- Einzelnen Key lesen: `doppler secrets get KEY_NAME --project fulfillment-automation --config dev_claudio`
- Alle Keys auflisten: `doppler secrets --project fulfillment-automation --config dev_claudio`
- Das `npm run dev` Script nutzt bereits Doppler mit der richtigen Config

## Workflow-Regeln
- **Plan-Mode zuerst** bei Features mit >3 Dateien
- **1 Feature pro Durchgang**, dann verifizieren
- **Build-Check nach jedem Edit:** `npx vite build`
- **Maximal 3 Dateien gleichzeitig** ändern
- **Existierende Dateien editieren** statt neue erstellen

## Coding-Conventions
- `cn()` für classNames (clsx + tailwind-merge)
- Named Exports, kein default export
- `@/` Alias für alle Imports
- Zustand mit Repository-Pattern
- Neue Dateien: kein `@ts-nocheck`
- UI-Texte: Deutsche Umlaute (ä, ö, ü, ß), NIEMALS ae/oe/ue
- Keine Gedankenstriche (–)
- Error Handling: `toastError()` + `set({ error })`, nie stumm schlucken
- Loading States: `set({ loading: true })` am Anfang, `set({ loading: false })` im finally
