# Chat-Prompts für parallele Arbeit

Kopiere den jeweiligen Prompt in einen neuen Claude Code Chat.
Jeder Chat arbeitet an einer Phase unabhängig.

**WICHTIG:** Phase A und B können parallel laufen. Phase C nach A. Phase E nach B. Phase D unabhängig.

```
A ──→ C
B ──→ E
D (unabhängig)
```

---

## Chat 1: Phase A (UI-Vereinfachung)

```
Lies die Datei plans/PHASE-A-ui-vereinfachung.md im Flowstack Platform Projekt (~/Desktop/Flowstack /04_Marketing/Webseite/Seiten code/Flowstack-Platform/).

Führe ALLE Aufgaben (A1-A5) aus dieser Datei aus. Arbeite sequenziell — eine Aufgabe nach der anderen. Nach JEDER Änderung: npx vite build. Wenn der Build fehlschlägt, fixe es bevor du weitermachst.

Wichtige Regeln:
- Antworte auf Deutsch, Code-Kommentare auf Englisch
- Echte Umlaute (ä, ö, ü, ß), niemals ae/oe/ue
- Named Exports, @/ Alias, cn() für classNames
- Keine neuen Dependencies ohne Rückfrage
- Maximal 3 Dateien gleichzeitig ändern
```

---

## Chat 2: Phase B (State Hardening)

```
Lies die Datei plans/PHASE-B-state-hardening.md im Flowstack Platform Projekt (~/Desktop/Flowstack /04_Marketing/Webseite/Seiten code/Flowstack-Platform/).

Führe ALLE Aufgaben (B1-B6) aus dieser Datei aus. Die Haupt-Datei ist store/fulfillment-store.ts im kunden-hub Modul. Lies den Store KOMPLETT bevor du anfängst.

WICHTIG: Sprint 1+2 haben bereits viel am Store geändert. Lies die "Bereits erledigt" Section in der Plan-Datei um zu wissen was NICHT nochmal gemacht werden soll.

Regeln:
- Antworte auf Deutsch, Code-Kommentare auf Englisch
- npx vite build nach JEDER Änderung
- import type { X } für Type-only Imports
- Echte Umlaute in Toast-Messages
```

---

## Chat 3: Phase C (Ad Workflow) — NACH Phase A

```
Lies die Datei plans/PHASE-C-ad-workflow.md im Flowstack Platform Projekt (~/Desktop/Flowstack /04_Marketing/Webseite/Seiten code/Flowstack-Platform/).

Führe ALLE Aufgaben (C1-C3) aus. Fokus ist auf Meta Ads: Preview-Felder korrigieren, Placement speichern, partielle Freigabe sauber modellieren.

Regeln:
- Antworte auf Deutsch, Code-Kommentare auf Englisch
- npx vite build nach JEDER Änderung
- Nur Meta Ads (Facebook + Instagram)
```

---

## Chat 4: Phase D (Performance Dashboard)

```
Lies die Datei plans/PHASE-D-performance-dashboard.md im Flowstack Platform Projekt (~/Desktop/Flowstack /04_Marketing/Webseite/Seiten code/Flowstack-Platform/).

Führe ALLE Aufgaben (D1-D3) aus. Kern: Fake-Charts entfernen, KPI-Cards behalten und 5. Card hinzufügen.

Regeln:
- Antworte auf Deutsch, Code-Kommentare auf Englisch
- npx vite build nach JEDER Änderung
- Prüfe ob react-apexcharts Import nach Chart-Entfernung noch nötig ist
```

---

## Chat 5: Phase E (System-Konzepte) — NACH Phase B

```
Lies die Datei plans/PHASE-E-system-konzepte.md im Flowstack Platform Projekt (~/Desktop/Flowstack /04_Marketing/Webseite/Seiten code/Flowstack-Platform/).

Führe ALLE Aufgaben (E1-E2) aus. Dirty State Tracking im Store + Client Reset Button in der UI.

Regeln:
- Antworte auf Deutsch, Code-Kommentare auf Englisch
- npx vite build nach JEDER Änderung
- resetClient() existiert bereits im Store, nur UI fehlt
```
