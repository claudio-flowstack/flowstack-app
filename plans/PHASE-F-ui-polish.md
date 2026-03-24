# Phase F: UI Polish nach Claudio-Feedback

## Kontext
Live-Testing am 24.03.2026 hat konkrete UX-Probleme aufgedeckt. Die grundlegende Vereinfachung (Phase A) wurde bereits umgesetzt. Jetzt geht es um Feinschliff basierend auf echtem Nutzer-Feedback.

**Projekt:** `~/Desktop/Flowstack /04_Marketing/Webseite/Seiten code/Flowstack-Platform/`
**Modul:** `src/modules/kunden-hub/`
**Build-Check:** `npx vite build` nach jeder Änderung

---

## Aufgabe F1: DeliverableSelector nach oben verschieben

**Datei:** `components/ContentReviewPanel.tsx`

**Problem:** Der Selector zum Wechseln zwischen Dokumenten ist ganz unten im Content-Bereich. Man muss scrollen um ein anderes Dokument auszuwählen.

**Aktion:**
- DeliverableSelector Block (aktuell ca. Zeile 356-368 mit `className="mt-4"`) NACH OBEN verschieben
- Position: Direkt unter dem Kategorie-Dropdown, VOR dem Haupt-Content (DocReviewView/AdReviewView)
- Kompakter gestalten: nicht volle Breite, max-width: 400px oder so
- Soll sich anfühlen wie ein kleines Dropdown zur Dokumentwahl, nicht wie ein riesiger Navigationsblock

**Layout nachher:**
```
┌─────────────────────────────────────┐
│ [Dokumente ▼]  [Alle freigeben]    │  ← Kategorie-Dropdown + Batch
├─────────────────────────────────────┤
│ [◀ Zielgruppen-Avatar (3/8) ▶]    │  ← DeliverableSelector HIER
├─────────────────────────────────────┤
│                                     │
│  ┌─────────────────────────┐       │
│  │    Dokument-Inhalt      │       │
│  │    (DocReviewView)      │       │
│  │                         │       │
│  └─────────────────────────┘       │
│                                     │
├─────────────────────────────────────┤
│ [Ablehnen]           [Freigeben]   │  ← Sticky ApprovalBar
└─────────────────────────────────────┘
```

---

## Aufgabe F2: Dokument-Blatt Google Docs Proportionen

**Datei:** `components/DocReviewView.tsx`

**Problem:** Das Paper-Blatt sieht unproportional aus. Soll aussehen wie bei Google Docs.

**Aktion:**
- `maxWidth: 816px` beibehalten (= 8.5 inches bei 96dpi, Google Docs Standard)
- `minHeight: 1056px` setzen (= 11 inches, A4/Letter Format)
- Padding: `72px 96px` beibehalten (Google Docs Standard Seitenränder)
- Canvas-Background: `#f8f9fa` (Google Docs grauer Hintergrund)
- Paper-Shadow: `0 0 0 1px rgba(0,0,0,0.03), 0 2px 6px rgba(60,64,67,0.15), 0 8px 24px rgba(60,64,67,0.08)`
- Container um das Paper muss genug Platz/Padding haben (min 28px auf allen Seiten) damit das Blatt "schwebt"
- Das Paper soll sich anfühlen wie ein echtes A4-Blatt auf einem grauen Schreibtisch

**WICHTIG:** Die aktuelle Version hat `minHeight: 600` — das muss auf 1056 hoch. Das macht das Blatt proportional richtig.

---

## Aufgabe F3: Tabs neu ordnen + Verbindungen raus

**Datei:** `pages-clients/ClientDetail.tsx`

**Problem:** 8 Tabs, davon Verbindungen/Links gehören nicht in die Fulfillment-Ansicht. Notizen ist zu weit links (zu prominent).

**Aktuelle Tab-Reihenfolge:**
```
Pipeline | Deliverables | Notes | Performance | Connections | Links | Timeline | Errors
```

**Neue Tab-Reihenfolge:**
```
Pipeline | Deliverables | Performance | Notizen | Zeitstrahl | [Errors]
```

**Was sich ändert:**
1. `connections` Tab ENTFERNEN (aus tabs Array und aus JSX)
2. `links` Tab ENTFERNEN
3. `notes` nach `performance` verschieben
4. Tab-Reihenfolge im Code anpassen

**Verbindungen stattdessen:**
- Zahnrad-Icon-Button im Header (neben Reset/Delete Buttons)
- Klick navigiert zu `/kunden-hub/clients/:clientId/settings`
- Dort: Verbindungen, Links, Paket-Info, Account Manager

---

## Aufgabe F4: Client-Settings Page erstellen

**Neue Datei:** `pages-clients/ClientSettings.tsx`
**Route hinzufügen:** `KundenHubPage.tsx` → `<Route path="clients/:clientId/settings" element={<ClientSettings />} />`

**Inhalt der Settings-Page:**
- Header: "Einstellungen — {Company Name}" + Back-Button
- Section 1: Verbindungen (ConnectionsGrid Komponente — bereits vorhanden, nur umziehen)
- Section 2: Externe Links (Links-Daten aus API)
- Section 3: Paket & Konditionen (paket, monatspreis, zahlungsweise)
- Section 4: Account Manager
- Section 5: Danger Zone (Reset + Delete — die Buttons die aktuell im Header sind)

**Existierende Komponenten wiederverwenden:**
- `components/ConnectionsGrid.tsx` — direkt importieren
- `components/ConnectionCard.tsx` — wird von ConnectionsGrid benutzt
- Reset/Delete Modals — aus ClientDetail extrahieren oder duplizieren

---

## Regeln
- `npx vite build` nach JEDER Änderung
- Keine neuen Dependencies
- Echte Umlaute (ä, ö, ü, ß)
- i18n Keys für alle neuen Texte
- ConnectionsGrid und Links-Logik aus ClientDetail entfernen nachdem Settings-Page funktioniert
