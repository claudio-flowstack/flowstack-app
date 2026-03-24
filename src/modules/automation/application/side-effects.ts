/**
 * Side-Effect Registry — Maps node IDs to real API calls via demo-backend.
 *
 * Wenn ein Node in den "running" Status wechselt und hier registriert ist,
 * wird der echte API-Call an das Python Backend gefeuert.
 *
 * Das Backend laeuft auf http://localhost:3002 (gestartet via doppler run).
 */

const BACKEND_URL = 'http://localhost:3002'

/** Node IDs die echte Side-Effects haben */
const SIDE_EFFECT_NODES = new Set([
  // Infrastructure Setup
  'is02', // Close: Lead erstellen
  'is03', // Setup: Client-Start (Projekt-Übersicht + Slack Channel)
  'is04', // Welcome Email
  'is05', // Kickoff-Termin
  'is06', // Drive: Ordnerstruktur
  'is07', // Drive: Templates dupliziert
  'is08', // ClickUp: Projekt
  'is09', // ClickUp: Tasks
  'is10', // Close: Kickoff Scheduled
  'is11', // Miro: Kampagnen-Board
  // Kickoff
  'kc05', // Close: Kickoff Completed
  'kc06', // Slack: Call fertig
  // Strategy
  'st10', // Close: Strategy Generated
  // Copy
  'cc05', // Close: Assets Generated
  // Meta Kampagnen
  'ca01', // Meta: Custom Audience AllVisitors
  'ca02', // Meta: Custom Audience LP_NoApplication
  'ca03', // Meta: Custom Audience Application_NoLead
  'ca04', // Meta: Initial-Kampagne
  'ca05', // Meta: Initial Ad Sets
  'ca06', // Meta: Retargeting-Kampagne
  'ca07', // Meta: Retargeting Ad Sets
  'ca08', // Meta: Warmup-Kampagne
  'ca09', // Meta: Warmup Ad Sets
  // Review & Launch
  'rl06', // Slack: Assets ready
  'rl07', // Close: Waiting for Approval
  'rl09', // Close: Ready for Launch
  'rl11', // Close: Live
  'rl12', // Slack: Wir sind live
  'rl13', // Airtable: Performance-Sync (Meta → Airtable)
  // V2 Close + Airtable + Extraktion
  'v2-create-lead',      // Close V2: Lead + Opportunity erstellen
  'v2-airtable-client', // Airtable: Client-Record erstellen
  'v2-extract',          // AI: Transkript → 88 Bausteine → Airtable
  // V2 AI-Generierung
  'v2-st01', // AI: Zielgruppen-Avatar
  'v2-st02', // AI: Arbeitgeber-Avatar
  'v2-st03', // AI: Messaging-Matrix
  'v2-st04', // AI: Creative Briefing
  'v2-st05', // AI: Marken-Richtlinien
  'v2-cc01', // AI: Landingpage-Texte
  'v2-cc02', // AI: Formularseite-Texte
  'v2-cc03', // AI: Dankeseite-Texte
  'v2-cc04', // AI: Anzeigentexte Hauptkampagne
  'v2-cc05', // AI: Anzeigentexte Retargeting
  'v2-cc06', // AI: Anzeigentexte Warmup
  'v2-cc07', // AI: Videoskript
  'v2-close-strategy', // Close: V2 Strategy fertig
  'v2-close-copy', // Close: V2 Copy fertig
  // V3 Infra
  'v3-is02a', 'v3-is02', 'v3-is02-reuse', 'v3-is03', 'v3-is04', 'v3-is05',
  'v3-is06a', 'v3-is06', 'v3-is07', 'v3-is08', 'v3-is09', 'v3-is10', 'v3-is11',
  'v3-notion', 'v3-is-sheet',
  // V3 Kickoff
  'v3-kc00', 'v3-kc02a', 'v3-kc02b', 'v3-kc03', 'v3-kc03a', 'v3-kc03b',
  'v3-kc05', 'v3-kc06',
  // V3 Strategy
  'v3-st-extract', 'v3-st00', 'v3-st01', 'v3-st02', 'v3-st03', 'v3-st04', 'v3-st05',
  'v3-st02a', 'v3-st-sync', 'v3-st-close', 'v3-st-approval',
  // V3 Copy
  'v3-cc01', 'v3-cc02', 'v3-cc03', 'v3-cc04', 'v3-cc05', 'v3-cc06', 'v3-cc07',
  'v3-cc01a', 'v3-cc01b', 'v3-cc02a', 'v3-cc02b',
  'v3-cc-sync', 'v3-cc-close', 'v3-cc-approval',
  // V3 Funnel
  'v3-fn01', 'v3-fn05a', 'v3-fn10a', 'v3-fn10b', 'v3-fn-pixel', 'v3-fn-approval',
  // V3 Campaigns
  'v3-ca00', 'v3-ca01', 'v3-ca02', 'v3-ca03', 'v3-ca04', 'v3-ca05',
  'v3-ca06', 'v3-ca07', 'v3-ca08', 'v3-ca09', 'v3-ca-approval',
  // V3 Launch
  'v3-rl-e2e', 'v3-rl-url', 'v3-rl-pixel', 'v3-rl-policy', 'v3-rl-golive',
  'v3-rl-activate', 'v3-rl-close', 'v3-rl-slack', 'v3-rl-clickup', 'v3-rl-sheet',
  // V3 Monitoring
  'v3-pl01', 'v3-pl02', 'v3-pl03', 'v3-pl05', 'v3-pl06', 'v3-pl07',
  'v3-pl08', 'v3-pl09', 'v3-pl12', 'v3-cm08',
])

/** Kontext der waehrend der Execution aufgebaut wird (Lead ID, Opp ID, etc.) */
interface ExecutionContext {
  company: string
  contact: string
  email: string
  execution_id?: string
  lead_id?: string
  opportunity_id?: string
  list_id?: string
  folder_root_id?: string
  upload_folder_id?: string
  event_id?: string
  channel_id?: string
  channel_name?: string
  task_ids?: Record<string, string>
  meta_campaigns?: Record<string, string>
  image_hashes?: string[]
  generated_docs?: Record<string, string>
  airtable_client_id?: string
  bausteine?: Record<string, unknown>
  miro_board_id?: string
  overview_sheet_id?: string
  overview_sheet_url?: string
}

let _context: ExecutionContext = {
  company: 'Novacode GmbH',
  contact: 'Max Mustermann',
  email: 'clazahlungskonto@gmail.com',
}

/** Per-Node Ergebnisse der Side-Effects */
interface NodeResult {
  result: Record<string, unknown> | null
  error?: string
  timestamp: string
  durationMs: number
  /** Was an die API geschickt wurde */
  request: { nodeId: string; context: ExecutionContext }
  /** Snapshot des Contexts zum Zeitpunkt des Aufrufs */
  contextAtStart: ExecutionContext
}

const _nodeResults = new Map<string, NodeResult>()

let _enabled = false
let _backendAvailable = false

/** Side-Effects aktivieren/deaktivieren */
export function enableSideEffects(enabled: boolean) {
  _enabled = enabled
}

/** Kontext zuruecksetzen (bei neuem Execution-Run) */
export function resetSideEffectContext() {
  _context = {
    company: 'Novacode GmbH',
    contact: 'Max Mustermann',
    email: 'clazahlungskonto@gmail.com',
  }
  _nodeResults.clear()
}

/** Pruefen ob Backend erreichbar ist */
export async function checkBackendHealth(): Promise<boolean> {
  try {
    const resp = await fetch(`${BACKEND_URL}/health`, { signal: AbortSignal.timeout(3000) })
    _backendAvailable = resp.ok
    return _backendAvailable
  } catch {
    _backendAvailable = false
    return false
  }
}

/** Hat dieser Node einen Side-Effect? */
export function hasSideEffect(nodeId: string): boolean {
  return SIDE_EFFECT_NODES.has(nodeId)
}

/**
 * Side-Effect fuer einen Node ausfuehren.
 * Wird aufgerufen wenn der Node "running" wird.
 * Gibt das Ergebnis zurueck oder null bei Fehler/deaktiviert.
 */
export async function executeSideEffect(
  nodeId: string,
): Promise<Record<string, unknown> | null> {
  if (!_enabled || !_backendAvailable || !SIDE_EFFECT_NODES.has(nodeId)) {
    return null
  }

  const startTime = Date.now()
  const contextSnapshot: ExecutionContext = { ..._context }
  const requestPayload = { nodeId, context: contextSnapshot }

  try {
    // V3 nodes route to V3 endpoint, V1/V2 to legacy endpoint
    const endpoint = nodeId.startsWith('v3-')
      ? `${BACKEND_URL}/api/v3/execute-node`
      : `${BACKEND_URL}/api/execute-node`

    const resp = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(
        nodeId.startsWith('v3-')
          ? { nodeId, executionId: _context.execution_id ?? '', context: contextSnapshot }
          : requestPayload
      ),
      signal: AbortSignal.timeout(
        nodeId.startsWith('v2-') || nodeId.startsWith('v3-') ? 120000 : 90000
      ),
    })

    if (!resp.ok) {
      const errText = await resp.text().catch(() => resp.statusText)
      _nodeResults.set(nodeId, {
        result: null,
        error: `HTTP ${resp.status}: ${errText}`,
        timestamp: new Date().toISOString(),
        durationMs: Date.now() - startTime,
        request: requestPayload,
        contextAtStart: contextSnapshot,
      })
      return null
    }

    const data = await resp.json()

    // Per-Node Result speichern
    _nodeResults.set(nodeId, {
      result: data.result ?? data,
      timestamp: new Date().toISOString(),
      durationMs: Date.now() - startTime,
      request: requestPayload,
      contextAtStart: contextSnapshot,
    })

    // Kontext mit Ergebnissen anreichern
    if (data.result) {
      if (data.result.lead_id) _context.lead_id = data.result.lead_id
      if (data.result.opportunity_id) _context.opportunity_id = data.result.opportunity_id
      if (data.result.list_id) _context.list_id = data.result.list_id
      if (data.result.root_id) _context.folder_root_id = data.result.root_id
      if (data.result.upload_folder_id) _context.upload_folder_id = data.result.upload_folder_id
      if (data.result.event_id) _context.event_id = data.result.event_id
      if (data.result.channel_id) _context.channel_id = data.result.channel_id
      if (data.result.channel_name) _context.channel_name = data.result.channel_name
      if (data.result.task_ids) _context.task_ids = { ..._context.task_ids, ...data.result.task_ids }
      if (data.result.meta_campaigns) _context.meta_campaigns = { ..._context.meta_campaigns, ...data.result.meta_campaigns }
      if (data.result.image_hashes) _context.image_hashes = data.result.image_hashes
      if (data.result.generated_docs) _context.generated_docs = { ..._context.generated_docs, ...data.result.generated_docs }
      if (data.result.airtable_client_id) _context.airtable_client_id = data.result.airtable_client_id
      if (data.result.bausteine) _context.bausteine = data.result.bausteine as Record<string, unknown>
      if (data.result.miro_board_id) _context.miro_board_id = data.result.miro_board_id
      if (data.result.overview_sheet_id) _context.overview_sheet_id = data.result.overview_sheet_id as string
      if (data.result.overview_sheet_url) _context.overview_sheet_url = data.result.overview_sheet_url as string
    }

    return data.result
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err)
    console.warn(`Side-Effect fuer ${nodeId} fehlgeschlagen:`, err)
    _nodeResults.set(nodeId, {
      result: null,
      error: errMsg,
      timestamp: new Date().toISOString(),
      durationMs: Date.now() - startTime,
      request: requestPayload,
      contextAtStart: contextSnapshot,
    })
    return null
  }
}

/**
 * Cleanup aller Side-Effects — loescht erstellte Ressourcen im Backend.
 */
export async function cleanupSideEffects(): Promise<Record<string, unknown> | null> {
  if (!_backendAvailable) return null

  try {
    const resp = await fetch(`${BACKEND_URL}/api/cleanup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lead_id: _context.lead_id,
        opportunity_id: _context.opportunity_id,
        list_id: _context.list_id,
        folder_root_id: _context.folder_root_id,
        event_id: _context.event_id,
        channel_id: _context.channel_id,
        meta_campaign_ids: _context.meta_campaigns ? Object.values(_context.meta_campaigns) : undefined,
        airtable_client_id: _context.airtable_client_id,
        miro_board_id: _context.miro_board_id,
      }),
      signal: AbortSignal.timeout(30000),
    })

    const data = await resp.json()
    if (resp.ok) resetSideEffectContext()
    return data
  } catch (err) {
    console.warn('Cleanup fehlgeschlagen:', err)
    return null
  }
}

/** Gibt eine Kopie des aktuellen Execution-Kontexts zurueck */
export function getExecutionContext(): ExecutionContext {
  return { ..._context }
}

/** Gibt alle per-Node Side-Effect Ergebnisse zurueck */
export function getNodeResults(): Map<string, NodeResult> {
  return new Map(_nodeResults)
}

/** Ist dieser Node ein Side-Effect Node? */
export function isSideEffectNode(nodeId: string): boolean {
  return SIDE_EFFECT_NODES.has(nodeId)
}
