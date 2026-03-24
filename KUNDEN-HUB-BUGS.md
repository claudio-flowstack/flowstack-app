# Kunden-Hub: Bekannte Bugs, Fallen & Architektur-Eigenheiten

> Stand: 2026-03-19 - Dokumentation aller gefundenen Probleme beim Portieren der Fixes vom Standalone-Projekt in die Flowstack Platform.

---

## 1. Zwei ThemeProvider die sich gegenseitig bekämpfen

**Dateien:**
- `src/core/theme/context.tsx` (Platform-global)
- `src/modules/kunden-hub/contexts/ThemeContext.tsx` (Modul-lokal)

**Problem:** Beide Provider manipulieren `document.documentElement.classList` (dark/light). Sie nutzen unterschiedliche localStorage-Keys (`flowstack-theme` vs `theme`). Die React-Effect-Reihenfolge bestimmt wer "gewinnt":
- Child-Effects feuern VOR Parent-Effects
- Der Core-Provider (Parent) überschreibt im selben Render-Zyklus
- Der Kunden-Hub-Provider gewinnt erst im ZWEITEN Render-Zyklus (weil `isInitialized` delayed ist)

**Regel:** Den Kunden-Hub ThemeContext NIEMALS auf synchrone Initialisierung umbauen (kein module-level Code). Der verzögerte Zwei-Zyklen-Ansatz ist Absicht - sonst überschreibt der Core-Provider sofort.

**Langfristiger Fix:** Kunden-Hub sollte den Core-ThemeProvider nutzen statt einen eigenen zu haben.

---

## 2. index.html startet mit `class="dark"`

**Datei:** `index.html`

**Problem:** `<html lang="de" class="dark">` sorgt dafür, dass ALLES initial dunkel ist. Der Core-Provider (`getInitialTheme()`) defaulted ebenfalls zu `'dark'`.

**Fix angewendet:** `class="dark"` entfernt, Core-Default auf `'light'` geändert.

**Achtung:** Wenn `flowstack-theme: dark` im Browser-localStorage gespeichert ist, bleibt Dark Mode aktiv trotz Fix. User muss localStorage leeren.

---

## 3. `import { Type }` vs `import type { Type }` - Runtime Crash

**Datei:** `pages-dashboard/Home.tsx`

**Problem:** `import { ApexOptions } from "apexcharts"` importiert `ApexOptions` als Wert. Aber `ApexOptions` ist NUR ein TypeScript-Interface - es existiert nicht im kompilierten JavaScript. Vite/esbuild behält den Import (anders als `tsc`), und der Browser crasht beim ESM-Linking weil der Export nicht existiert.

**Regel:** Type-only Imports IMMER mit `import type { X }` kennzeichnen. Besonders bei:
- `ApexOptions` aus `apexcharts`
- Alle Interfaces/Types aus `../data/types`
- Jeder Import der nur als Typ-Annotation genutzt wird

---

## 4. Import-Pfad Mapping: Standalone → Platform

Beim Kopieren von Dateien aus `Kunden-Hub-V2-tailadmin` nach `Flowstack-Platform/src/modules/kunden-hub/`:

| Standalone-Pfad | Platform-Pfad |
|---|---|
| `../../components/fulfillment/X` | `../components/X` |
| `../../components/ui/X` | `../ui/components/X` |
| `../../components/common/X` | `../ui/common/X` |
| `../../components/form/X` | `../ui/form/X` |
| `../../context/i18n/LanguageContext` | `../i18n/LanguageContext` |
| `../../context/SidebarContext` | `../contexts/SidebarContext` |
| `../../context/ThemeContext` | `../contexts/ThemeContext` |
| `../../context/NotificationContext` | `../contexts/NotificationContext` |
| `../../store/fulfillment-store` | `../store/fulfillment-store` |
| `../../data/*` | `../data/*` |
| `../../icons` | `../icons` |
| `react-router` | `react-router-dom` |

---

## 5. Routen-Pfade sind unterschiedlich

- **Standalone:** `/clients/...`, `/settings`, etc.
- **Platform:** `/kunden-hub/clients/...`, `/kunden-hub/settings`, etc.

Beim Kopieren von `navigate()` Aufrufen prüfen ob der Pfad-Prefix stimmt. Die Platform-Routen sind unter `/kunden-hub/` gemountet (siehe `KundenHubPage.tsx`).

---

## 6. CSS Dark Mode Kaskade

**Datei:** `src/styles/globals.css`

```css
.dark { --background: #09090b; }  /* Fast schwarz */
body { background-color: var(--background); }
```

Wenn `class="dark"` auf `<html>` ist, wird ALLES schwarz. Der KundenHubPage-Wrapper hat zwar `style={{ backgroundColor: '#fff' }}`, aber Tailwind's `dark:!bg-gray-900` nutzt `!important` und kann inline-styles überschreiben.

---

## 7. ApexCharts Lazy Loading

**Problem:** Direkter `import Chart from "react-apexcharts"` kann crashen wenn `window`/`document` noch nicht ready ist.

**Fix:** Immer lazy laden:
```tsx
const Chart = lazy(() => import("react-apexcharts"));

// Nutzung:
<Suspense fallback={<div className="h-[310px]" />}>
  <Chart options={...} series={...} type="area" height={310} />
</Suspense>
```

Chart-Optionen und Series IMMER in `useMemo()` wrappen - sonst endlose Re-Render-Loops.

---

## 8. React Hooks vor Early Return (PerformanceTab)

**Datei:** `pages-clients/ClientDetail.tsx`

Die `PerformanceTab` Komponente hat einen Early Return für `!kpis`. Alle Hooks (useMemo) MÜSSEN vor dem Early Return stehen:

```tsx
// RICHTIG:
function PerformanceTab({ kpis }) {
  const metrics = useMemo(() => { ... }, [kpis]);  // Hook ZUERST
  const data = useMemo(() => { ... }, []);          // Hook ZUERST

  if (!kpis) return <EmptyState />;  // DANN early return

  return <Charts />;
}
```

Null-Guards in den useMemo-Callbacks verwenden: `(kpis?.spend ?? 0)`.

---

## 9. DocReviewView Scroll-Fix

**Problem:** Der Google-Docs-Style Editor erzeugt horizontalen Scroll weil Toolbar-Elemente `flexShrink: 0` haben und die Paper-Area `overflow: auto` nutzt.

**Fix:**
- Alle Toolbar-Buttons: `flexShrink: 1`, `minWidth` statt fester `width`
- Toolbar Container: `flexWrap: 'wrap'`, `minHeight` statt fester `height`, `overflowX: 'hidden'`
- Paper Area: `overflowX: 'hidden'` statt `'auto'`
- ProseMirror CSS: `overflow-x: hidden`, `max-width: 100%`, `overflow-wrap: break-word`
- Stabiler `onChange` via `useRef` + `useCallback` um TipTap Re-Initialisierung zu vermeiden

---

## 10. AppLayout Overflow Fix (DER Scroll-Bug)

**Datei:** `layout/AppLayout.tsx`

**Problem:** `max-w-(--breakpoint-2xl)` (1536px) begrenzt die Content-Breite. Bei offener Sidebar + breitem Content = horizontaler Scroll.

**Fix:**
```tsx
// Root div:
<div className="min-h-screen xl:flex overflow-x-hidden">

// Content div:
<div className="flex-1 overflow-x-hidden transition-all ...">

// Inner content:
<div className="p-4 md:p-6 w-full max-w-full overflow-x-hidden">
```

---

## 11. Standalone-Features die in der Platform anders funktionieren

| Feature | Standalone | Platform |
|---|---|---|
| `useNotification` Mock | Fake Lead-Notification nach 3s | Nicht kopieren - ist nur Demo |
| MRR Berechnung | `c.monatspreis` aus echten Daten | War vorher `mockMrr = 8500` |
| Chart-Daten | Aus echten Client-KPIs berechnet | War vorher hardcoded |
| `AiAssistant` Komponente | Nicht vorhanden | Platform hat eigene - behalten! |

---

## Checkliste: Code vom Standalone in Platform portieren

- [ ] Alle `import` Pfade gemäß Tabelle (Punkt 4) anpassen
- [ ] `react-router` → `react-router-dom`
- [ ] Alle Type-Imports auf `import type { X }` prüfen
- [ ] Route-Pfade prüfen (mit/ohne `/kunden-hub/` Prefix)
- [ ] `useNotification` Mock-Code NICHT mitkopieren
- [ ] ThemeContext NICHT ändern (Zwei-Zyklen-Ansatz ist Absicht)
- [ ] `AiAssistant` Import in AppLayout behalten
- [ ] `npx vite build` nach jeder Datei
- [ ] Browser-DevTools Console auf Fehler prüfen (Build-Erfolg ≠ Runtime-Erfolg)
