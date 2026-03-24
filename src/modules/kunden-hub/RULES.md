# Kunden-Hub Frontend-Regeln

> Destilliert aus dem Technik Playbook. Wie man Code in diesem Modul schreibt.

## State Management

- **Server-Daten** (Clients, Deliverables, KPIs): Über `fulfillment-store.ts` laden, NIE direkt in Zustand speichern
- **UI-State** (Sidebar, Theme, aktiver Tab): Zustand oder lokaler useState
- Store Actions machen Optimistic Updates mit Rollback bei API-Fehler

## Neuen Tab im ClientDetail bauen

1. Loading State: Spinner oder Skeleton Screen
2. Error State: `<TabErrorCard tab="name" onRetry={retryTab} />` — nie endloser Spinner
3. Empty State: Icon + Erklärung + CTA Button — nie leere Fläche
4. Daten über Store-Action laden (z.B. `loadPipeline(clientId)`), nicht direkt `fetch()`
5. Tab-Error-Tracking: `setTabErrors(prev => ({...prev, [tab]: true}))` im catch-Block

```tsx
useEffect(() => {
  if (activeTab !== 'newtab' || !clientId) return;
  if (loaded === clientId) return;
  setLoading(true);
  loadData(clientId)
    .catch(() => setTabErrors(prev => ({...prev, newtab: true})))
    .finally(() => { setLoading(false); setLoaded(clientId); });
}, [activeTab, clientId]);
```

## Error Boundaries

Schichtung: Root → Route → Tab → Widget. Ein kaputter Chart killt nicht den Tab.

```tsx
<ErrorBoundary fallback={<TabErrorCard />} resetKeys={[clientId, activeTab]}>
  <Suspense fallback={<Skeleton />}>
    <Component />
  </Suspense>
</ErrorBoundary>
```

## API-Calls (services/api.ts)

- Alle Calls gehen über `request<T>(path, options)` — setzt API-Key Header automatisch
- Backend-URL über `VITE_API_URL` env var konfigurierbar (Default: localhost:3002)
- Bei neuen Endpoints: Typ-Interface in api.ts definieren, dann request<MyType> nutzen

## Komponenten bauen

- Named Exports, kein default export
- `import type { X }` für Type-only Imports — NIEMALS `import { X }` wenn X nur als Typ genutzt wird (Runtime Crash bei ESM)
- Charts: Immer lazy laden (`const Chart = lazy(() => import('react-apexcharts'))`) mit `<Suspense>`
- Chart-Optionen und Series IMMER in `useMemo()` — sonst endlose Re-Render-Loops
- React Hooks VOR early return — alle useState, useMemo, useCallback ZUERST, dann if (!data) return

## Übersetzungen

- Alle UI-Texte als i18n Keys in `i18n/translations.ts`
- Keine hardcoded deutschen Texte in JSX
- Zugriff: `const { t } = useLanguage(); t("key")`

## Routen

- Alle Navigate-Pfade mit `/kunden-hub/` Prefix — Modul ist unter /kunden-hub/* gemountet
- `navigate('/clients')` geht ins Leere, korrekt: `navigate('/kunden-hub/clients')`

## Styling

- Tailwind Utility Classes, `cn()` für conditional classNames
- shadcn/ui Komponenten (kopiert, nicht installiert)
- Semantische Farben: success (grün), warning (gelb), error (rot), brand (blau), muted (grau)
- Dark Mode: Kunden-Hub hat eigenen ThemeContext — NICHT ändern (Zwei-Zyklen-Ansatz ist Absicht)

## Polling (useExecutionPolling)

- connectionLost State nach 3 konsekutiven Fehlern
- Exponential Backoff bei Fehlern (Interval verdoppelt, max 30s)
- Bei Reconnect: Interval zurücksetzen, connectionLost false
