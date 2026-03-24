# Phase C: Ad Workflow Fix

## Kontext
Das Kunden-Hub generiert Meta Ads durch eine Automation. Die UI zeigt Ad-Previews (Facebook/Instagram Feed, Story, Reel) und ermöglicht Review + Approval. Wenn User approved → Signal an Automation zur Veröffentlichung. Aktuell fehlen Felder im Preview, Placement wird nicht gespeichert, und partielle Freigabe (3 von 5 Ads) ist nicht sauber modelliert.

**Projekt:** `~/Desktop/Flowstack /04_Marketing/Webseite/Seiten code/Flowstack-Platform/`
**Modul:** `src/modules/kunden-hub/`
**Build-Check:** `npx vite build` muss nach jeder Änderung grün sein

---

## Aufgabe C1: Ad Preview korrekte Felder

**Dateien:**
- `components/AdPreview.tsx`
- `components/AdReviewView.tsx`

**Probleme:**
1. `description` Feld fehlt im Facebook Ad Frame (Meta erfordert Headline + Description)
2. `linkUrl` wird geladen (AdReviewView Zeile 344-347) aber NIE im Preview angezeigt
3. `imageUrl` fehlt als Prop in AdPreview (Zeile 287 in AdReviewView)
4. Browser-URL ist hardcoded: `browserUrl: "karriere.firma.de"` (Zeile 596)

**Aktion:**
1. In `AdPreview.tsx` → FacebookAdFrame: Description-Zeile unter Headline hinzufügen (kleinerer Text, grau)
2. In `AdPreview.tsx` → Alle Frames: `linkUrl` Prop hinzufügen, als URL unter dem CTA-Button anzeigen
3. In `AdReviewView.tsx` → `imageUrl={fields.imageUrl}` als Prop an AdPreview durchreichen
4. `browserUrl` dynamisch aus `linkUrl` extrahieren (hostname)

---

## Aufgabe C2: Placement zum API-Save hinzufügen

**Datei:** `components/AdReviewView.tsx` Zeilen 174-179

**Problem:** Nur `headline`, `body`, `cta`, `image_url` werden an `api.ads.update()` gesendet. Placement (Feed/Story/Reel) wird ignoriert.

**Aktion:**
```typescript
// Aktuell:
await api.ads.update(activeAdId, { headline, body, cta, image_url });

// Nachher:
await api.ads.update(activeAdId, {
  headline: fields.headline,
  body: fields.primaryText,
  cta: fields.cta,
  image_url: fields.imageUrl,
  link_url: fields.linkUrl,
  placement: activePlacement,  // NEU
  platform: activePlatform,    // NEU
});
```

Auch in `services/api.ts` → `UpdateAdInput` Interface erweitern:
```typescript
interface UpdateAdInput {
  // ... bestehende Felder
  link_url?: string;
  placement?: string;
  platform?: string;
}
```

---

## Aufgabe C3: Partielle Freigabe sauber modellieren

**Datei:** `store/fulfillment-store.ts`

**Szenario:** 5 Ads generiert, User gibt 3 frei, lehnt 2 ab. Das System muss:
1. Jede Ad einzeln tracken (bereits der Fall — jede Ad ist ein Deliverable)
2. Phase-Completion Regel: Phase ist "done" wenn ALLE Ads entweder `approved` ODER `rejected` sind (kein offener `draft`)
3. Approved Ads → Signal an Automation (publish)
4. Rejected Ads → Signal mit Feedback (regenerate oder skip)

**Aktion:** In `approveDeliverable()` → nach Auto Phase-Transition Check:
```typescript
// Phase completion check: all ads must be approved OR rejected (no drafts left)
const phaseDeliverables = clientDeliverables.filter((d) => d.phase === currentPhase);
const allDecided = phaseDeliverables.every(
  (d) => d.status === 'approved' || d.status === 'live' || d.status === 'rejected'
);
```
Statt `allPhaseApproved` → `allDecided` für Phase-Transition.

**WICHTIG:** Rejected Ads sollen die Phase NICHT blockieren. Nur undecided (draft/in_review/generating) blockieren.

---

## Regeln
- `npx vite build` nach JEDER Änderung
- Keine neuen Dependencies
- Nur Meta Ads relevant (Facebook + Instagram)
- PlacementSwitcher (Feed/Story/Reel) beibehalten
