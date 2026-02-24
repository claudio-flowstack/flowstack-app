# Flowstack Platform

## Tech Stack
- React 19.2 + React Router DOM 7.12 (SPA)
- TypeScript 5.9 (strict mode, `noUnusedLocals`, `noUncheckedIndexedAccess`)
- Vite 7.3 (Build-Tool), Tailwind CSS 4.1, Radix UI
- Zustand 5.0 (State), LocalStorage (Persistence)
- Lucide React (Icons), Recharts (Charts), Zod (Validation)
- Path-Alias: `@/` → `./src/`

## Projektstruktur
```
src/
├── core/           # Infrastruktur (i18n, persistence, events, theme, ai)
├── shell/          # App.tsx, DashboardLayout, Sidebar, Header, MobileBottomNav
├── modules/        # Feature-Module (lazy-loaded)
│   ├── automation/ # Workflow-Builder + Canvas-Editor (Hauptmodul)
│   ├── content/    # Content-Kalender, Planung, Dateien
│   ├── research/   # Lead-Research, AI-Analyse, Batch-Upload
│   ├── dashboard/  # Haupt-Dashboard
│   ├── kpi/        # Metriken & Analytics
│   ├── linkedin/   # LinkedIn-Integration
│   └── settings/   # Einstellungen
├── shared/         # Gemeinsame Components, Hooks, Utils
└── styles/         # globals.css (Tailwind + Animationen)
```

## Modul-Aufbau (jedes Modul)
```
modules/<name>/
├── application/    # Zustand Store
├── domain/         # Types, Constants
├── pages/          # Page-Components (lazy-loaded)
├── components/     # UI-Components
├── canvas/         # Canvas-spezifisch (nur automation)
└── data/           # Storage, Demo-Daten
```

## Routing (3-Level Navigation)
```
Full-Screen (OHNE Sidebar):
  /automation/system/:systemId/editor  → SystemEditorPage
  /automation/funnel/:funnelId         → FunnelEditorPage

Dashboard (MIT Sidebar):
  /                                    → DashboardPage
  /automation/*                        → AutomationPage (Grid)
  /automation/system/:systemId         → SystemDetailPage (Pipeline)
  /content/*                           → ContentPage
  /research/*                          → ResearchPage
  /kpi/*                               → KpiPage
  /settings                            → SettingsPage
  /linkedin/*                          → LinkedInPage
```
Full-Screen-Editoren werden in App.tsx VOR dem DashboardLayout definiert.

## Stores (5 Zustand Stores)
- `useUIStore` — Sidebar, Demo-Mode, Theme
- `useAutomationStore` — Systeme, Templates, Resources (CRUD)
- `useContentStore` — Content-Items, Files, Plans
- `useResearchStore` — Lead-Research, Batch-Jobs
- `useContentResearchStore` — YouTube/News-Suche, AI-Analyse

Alle Stores nutzen `createLocalRepository()` für LocalStorage-Persistence.

## Automation Canvas (Kernkomponente)
- `WorkflowCanvas.tsx` (~5600 Zeilen, `@ts-nocheck` — Legacy-Migration)
- `CanvasNode.tsx` — 16 Node-Typen, 9 Design-Themes, 4 Layouts
- `CanvasConnection.tsx` — V3-Style mit Farbanimationen
- `CanvasToolbar.tsx` — Toolbar-Buttons
- `constants.ts` — NODE_STYLES, NODE_TYPE_DIMENSIONS, Farben
- Standard-Theme: `nodelab` (1:1 NodeLab V3 Styling)

## i18n
- Deutsch-first. `createT(lang)` aus `core/i18n/translations.ts`
- Fallback: DE → Key-Name
- Alle neuen UI-Texte als Translation-Keys anlegen

## Coding-Conventions
- `cn()` für conditional classNames (aus `shared/lib/utils`)
- Neue Dateien: kein `@ts-nocheck`
- Komponenten: Named Exports, kein default export
- Imports: `@/` Alias verwenden
- State: Zustand mit Repository-Pattern
- Events: `eventBus.emit()` für Cross-Modul-Kommunikation

## Workflow-Regeln
- **Plan-Mode zuerst** bei Features mit >3 Dateien
- **1 Feature pro Durchgang**, dann verifizieren
- **Build-Check nach jedem Edit:** `npx vite build`
- **Maximal 3 Dateien gleichzeitig** ändern
- **Existierende Dateien editieren** statt neue erstellen
- **Keine Over-Abstraction** — 3 ähnliche Zeilen > premature Abstraction

## Wichtige Dateien (Automation)
| Datei | Zweck |
|---|---|
| `canvas/WorkflowCanvas.tsx` | Canvas-Engine (~5600 Zeilen) |
| `canvas/CanvasNode.tsx` | Node-Rendering (16 Typen, 9 Themes) |
| `canvas/constants.ts` | NODE_STYLES, Dimensionen, Farben |
| `domain/constants.ts` | Palette-Items, Themes, Features |
| `domain/types.ts` | AutomationSystem, SystemNode, etc. |
| `pages/SystemEditorPage.tsx` | Full-Screen Editor (Level 3) |
| `pages/SystemDetailPage.tsx` | Pipeline-Ansicht (Level 2) |
| `pages/AutomationPage.tsx` | System-Grid (Level 1) |
| `components/PipelineView.tsx` | Horizontale Pipeline-Cards |
| `components/OutputViewer.tsx` | Dokument-Anzeige |
| `components/ResourceManager.tsx` | Ressourcen-Verwaltung |
