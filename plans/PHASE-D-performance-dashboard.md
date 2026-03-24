# Phase D: Performance Dashboard — Echt statt Mock

## Kontext
Das Dashboard zeigt KPI-Cards und Charts. Die Charts sind 100% Fake (Sine-Wave-Generierung, hardcoded Mock-Daten). Die KPI-Cards berechnen Werte aus Client-Daten (teilweise echt). Entscheidung: Fake-Charts entfernen, KPI-Cards behalten und erweitern.

**Projekt:** `~/Desktop/Flowstack /04_Marketing/Webseite/Seiten code/Flowstack-Platform/`
**Modul:** `src/modules/kunden-hub/`
**Build-Check:** `npx vite build` muss nach jeder Änderung grün sein

---

## Aufgabe D1: Fake Charts entfernen

**Datei:** `pages-dashboard/Home.tsx`

**Was entfernen:**
1. `leadsChartData` (Zeilen ~176-186) — Sine-Wave-Generierung, komplett fake
2. `leadsDateLabels` (Zeilen ~188-197) — Labels für Fake-Chart
3. `spendChartData` (Zeilen ~200-208) — Künstliche Spend-Daten
4. Leads Over Time Chart JSX (ApexCharts Line/Area Chart)
5. Spend Per Week Chart JSX (ApexCharts Bar Chart)
6. Alle zugehörigen ApexCharts `options` Objekte und `useMemo` Berechnungen

**Was beibehalten:**
- Die 4 KPI-Cards oben (Aktive Kunden, Leads, CPL, MRR)
- Client-Tabelle
- Pending Approvals Section
- Alerts Section
- Activity Feed
- PipelineKanban + TeamCapacity

**Layout nach Entfernung:**
- Charts-Bereich (2 Spalten) entfällt
- Client-Tabelle kann volle Breite nutzen ODER
- Pending Approvals + Alerts prominenter platzieren (oben, direkt nach KPI-Cards)

**WICHTIG:** ApexCharts Import prüfen — wenn nur noch die KPI-Cards bleiben und keine Charts mehr da sind, kann der lazy `react-apexcharts` Import ggf. entfernt werden (spart Bundle-Size).

---

## Aufgabe D2: 5. KPI-Card hinzufügen

**Datei:** `pages-dashboard/Home.tsx`

**Problem:** `qualifiedApplicants` ist in types.ts definiert (Zeile 83) aber wird nicht angezeigt.

**Aktion:** 5. KPI-Card hinzufügen:
```
| Aktive Kunden | Leads | CPL | Qualified | MRR |
```

Berechnung:
```typescript
const totalQualified = clients.reduce((sum, c) => sum + (c.kpis?.qualifiedApplicants ?? 0), 0);
```

Icon: CheckCircleIcon oder ähnliches aus den Kunden-Hub Icons.

---

## Aufgabe D3: Performance Tab im ClientDetail

**Datei:** `pages-clients/ClientDetail.tsx`

**Problem:** Performance Tab lädt Daten von API (`loadPerformance(clientId)`), aber wenn API nicht verfügbar → zeigt Mock-Daten oder leere Charts.

**Aktion:**
- Wenn `clientPerformance === null` → "Keine Performance-Daten verfügbar" anzeigen statt Fake-Charts
- KPI-Summary behalten (Spend, Leads, CPL) — die kommen aus Client-Daten, nicht aus API
- Charts nur zeigen wenn echte Daten vorhanden sind

---

## Regeln
- `npx vite build` nach JEDER Änderung
- Keine neuen Dependencies
- i18n Keys für alle neuen Texte
- Prüfe ob `react-apexcharts` Import nach Chart-Entfernung noch nötig ist
