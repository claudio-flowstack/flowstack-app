# Erkenntnisse - Fulfillment Automation Backend

Gesammelte Learnings aus der Entwicklung, fuer schnelleres Bauen zukuenftiger Automations.

---

## 1. Meta Ads API

### Rate Limiting
- **Problem:** 3+ Ad-Set-Nodes parallel = ~24 API-Calls gleichzeitig -> Meta rate-limitiert, Timeouts
- **Loesung:** Ad-Set-Erstellung sequentiell via DAG-Edges (`ca05 -> ca07 -> ca09`)
- **Backend-Lock funktioniert NICHT** mit Python 3.9 + uvicorn (Event-Loop-Inkompatibilitaet: `asyncio.Lock()` und `asyncio.sleep()` erzeugen Futures auf dem falschen Loop)
- **Merke:** Immer DAG-Edges fuer Serialisierung nutzen, nie Backend-Locks

### Placements & Optimization
- `"reel"` ist KEIN gueltiger facebook_positions-Wert (auch nicht `"reels"`)
- Gueltige facebook_positions: `["feed"]`, `["feed", "story"]`
- THRUPLAY Optimization erfordert Video — bei Image-Ads `REACH` verwenden
- Employment-Targeting: Nur Country-Level erlaubt (DE), keine detaillierten Interessen

### Custom Audiences
- `subtype` Parameter wird in aktueller API-Version nicht unterstuetzt
- Audiences werden trotzdem erstellt, Response kommt als "skipped" zurueck
- Fuer die Demo irrelevant da Audiences bereits existieren

### Image Upload
- `upload_meta_images()` laedt 3 Stock-Bilder hoch und gibt `image_hashes` zurueck
- Hashes werden im Context gespeichert und von allen Ad-Set-Nodes wiederverwendet
- Nur 1x hochladen (in ca04), nie in ca05/ca07/ca09 nochmal

### Naming Convention (DACH)
- Kampagnen: `Funnel | Datum | Ziel | Land | Name`
- Ad Sets: `Targeting | Gender | Alter | Land | Platzierung | Event | Datum`
- Ads: `Format | Konzept | Angle | Creator | Variante | Datum`
- Pipe `|` als Separator auf allen 3 Ebenen

---

## 2. Google APIs

### Drive
- Ordnerstruktur dauert ~26s (8 Hauptordner + 5 Strategy-Unterordner + 3 Creative-Unterordner + Sharing)
- DELETE auf leere Responses: `resp.status_code == 204 or not resp.text.strip()` -> return `{}`
  (Ohne diesen Check crasht `resp.json()` bei DELETE/204)
- Ordner-Namen auf Deutsch (01_Verwaltung, 02_Strategie, etc.)

### Calendar
- Google Meet Link wird automatisch generiert via `conferenceData` + `conferenceDataVersion=1`

### OAuth Token Refresh
- `_refresh_google_token()` wird automatisch bei 401 aufgerufen
- Token-JSON liegt als einzelner String in Doppler (`GOOGLE_CLAUDIO_OAUTH_TOKEN`)
- Enthaelt: `token`, `refresh_token`, `client_id`, `client_secret`

### Gmail
- Email wird als raw RFC 2822 Message gesendet
- **KEIN em-dash** (—) in Subject-Zeilen! Email-Header sind nicht MIME-encoded
- UTF-8 Zeichen im Subject werden als Latin-1 interpretiert -> `Ã¢Â€Â"` statt `—`
- Fix: Nur ASCII + einfache Bindestriche im Subject verwenden

---

## 3. Slack API

### Channel Management
- `conversations.create` -> `conversations.invite` (Team) -> `conversations.setTopic` -> Welcome-Message
- Bei `name_taken`: Channel suchen via `conversations.list`, wiederverwenden, ggf. `conversations.unarchive`
- Team-Member IDs muessen hardcoded sein (kein `users:read` Scope)
  - Claudio: `U0AA1KHD0G2`, Anak: `U0A9L6KUT5M`

### Block Kit
- `_slack_blocks_message()` Helper fuer strukturierte Nachrichten mit Header, Divider, Sections
- `_slack_link(url, label)` -> `<url|label>` fuer Link-Aliases (statt rohe URLs)
- Kategorisierte Sections (Strategie, Copy, Funnel, Tracking) fuer Uebersichtlichkeit

### Cleanup
- Bot muss `conversations.join` ausfuehren bevor `conversations.archive` (sonst `not_in_channel`)
- `already_archived` Error ist OK (idempotent)

### App-Name
- Kann NUR in Slack App Settings geaendert werden (api.slack.com/apps), NICHT per API
- Wird im Channel als Bot-Name angezeigt

---

## 4. Close CRM

### Pipeline Stages
- 10 Stages: Onboarding gestartet -> Kickoff geplant -> Kickoff abgeschlossen -> Strategie erstellt -> Assets erstellt -> Warte auf Freigabe -> Bereit fuer Launch -> Live -> Pausiert -> Abgebrochen
- Stage-Update via `PUT /api/v1/opportunity/{id}` mit `status_id`

### API Key
- In Doppler als `CLOSE_API` (Fallback: `CLOSE_API_KEY`)

---

## 5. ClickUp

### Name-Taken Error
- Beim wiederholten Erstellen einer Liste mit gleichem Namen: `name taken`
- Fix: Fallback auf `GET /space/{id}/list` -> existierende Liste wiederverwenden

---

## 6. DAG Engine & Race Conditions

### Grundprinzip
- JavaScript ist single-threaded -> `meta_campaigns` Spread-Merge ist sicher
- `_context` Updates zwischen `await`s sind atomar (kein Lost-Update moeglich)
- ABER: Daten-Dependencies muessen als DAG-Edges modelliert werden!

### Kritische Edges (Novacode Campaigns)
```
ca04 -> ca07   (image_hashes)
ca04 -> ca09   (image_hashes)
ca05 -> ca07   (Meta Rate-Limit)
ca07 -> ca09   (Meta Rate-Limit)
```

### Debugging
- `SystemCodeView.tsx` zeigt Node-Configs, Connections, Side-Effect-Results
- `getNodeResults()` + `getExecutionContext()` fuer Live-Inspektion
- Backend-Logs via `doppler run ... -- python3 server.py` (stdout)

---

## 7. Doppler Config

- **Projekt:** `fulfillment-automation`
- **Branch:** `dev_claudio` (EINZIGER erlaubter Branch)
- **Setup:** `doppler setup --no-interactive -p fulfillment-automation -c dev_claudio`
- **Starten:** `doppler run -- python3 server.py`
- Env-Var Fallbacks in server.py fuer verschiedene Key-Namen

---

## 8. Test-Workflow

### Individueller Test
```bash
doppler run -- python3 test-workflow.py
```
Testet jeden Node einzeln mit frischem Context.

### Chain-Test (Vollstaendiger Workflow)
```bash
doppler run -- python3 test-chain.py
```
Simuliert die UI-Execution mit Context-Propagation. Cleanup am Ende automatisch.

### Drive-Cleanup (Verwaiste Ordner)
```bash
doppler run -- python3 cleanup-drive.py
```
Findet und loescht alle "Novacode GmbH" Test-Ordner. Schuetzt vorgefertigte Dokumente.

---

## 9. Haeufige Fehler & Fixes

| Fehler | Ursache | Fix |
|--------|---------|-----|
| `Ã¢Â€Â"` im Email-Betreff | Em-dash in nicht-MIME-encodiertem Header | Nur ASCII im Subject |
| `name taken` (ClickUp) | Liste existiert bereits | Fallback: existierende Liste suchen |
| `not_in_channel` (Slack) | Bot nicht mehr im Channel | `conversations.join` vor `conversations.archive` |
| `attached to different loop` | `asyncio.Lock()` auf Python 3.9 + uvicorn | Keine asyncio-Primitives nutzen, DAG-Edges statt Backend-Locks |
| `THRUPLAY` Fehler | Image-Ads mit Video-Optimization | `REACH` statt `THRUPLAY` |
| `reel` invalid | Falscher Placement-Wert | Nur `["feed"]` verwenden |
| Drive DELETE crasht | `resp.json()` auf leerer 204-Response | Check `status_code == 204` vor json parse |
| Meta Rate-Limit | Zu viele parallele API-Calls | Ad-Set-Nodes sequentiell via DAG-Edges |
| Google 401 | Token abgelaufen | Automatischer Refresh via `_refresh_google_token()` |
