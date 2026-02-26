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
  'is03', // Slack: Neuer Client
  'is04', // Welcome Email
  'is05', // Kickoff-Termin
  'is06', // Drive: Ordnerstruktur
  'is08', // ClickUp: Projekt
  'is09', // ClickUp: Tasks
  'is10', // Close: Kickoff Scheduled
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
])

/** Kontext der waehrend der Execution aufgebaut wird (Lead ID, Opp ID, etc.) */
interface ExecutionContext {
  company: string
  email: string
  lead_id?: string
  opportunity_id?: string
  list_id?: string
  folder_root_id?: string
  event_id?: string
  channel_id?: string
  task_ids?: Record<string, string>
  meta_campaigns?: Record<string, string>
  image_hashes?: string[]
}

let _context: ExecutionContext = {
  company: 'Novacode GmbH',
  email: 'clazahlungskonto@gmail.com',
}

/** Per-Node Ergebnisse der Side-Effects */
interface NodeResult {
  result: Record<string, unknown> | null
  error?: string
  timestamp: string
  durationMs: number
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
  try {
    const resp = await fetch(`${BACKEND_URL}/api/execute-node`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nodeId,
        context: { ..._context },
      }),
      signal: AbortSignal.timeout(30000),
    })

    if (!resp.ok) {
      const errText = await resp.text().catch(() => resp.statusText)
      _nodeResults.set(nodeId, {
        result: null,
        error: `HTTP ${resp.status}: ${errText}`,
        timestamp: new Date().toISOString(),
        durationMs: Date.now() - startTime,
      })
      return null
    }

    const data = await resp.json()

    // Per-Node Result speichern
    _nodeResults.set(nodeId, {
      result: data.result ?? data,
      timestamp: new Date().toISOString(),
      durationMs: Date.now() - startTime,
    })

    // Kontext mit Ergebnissen anreichern
    if (data.result) {
      if (data.result.lead_id) _context.lead_id = data.result.lead_id
      if (data.result.opportunity_id) _context.opportunity_id = data.result.opportunity_id
      if (data.result.list_id) _context.list_id = data.result.list_id
      if (data.result.root_id) _context.folder_root_id = data.result.root_id
      if (data.result.event_id) _context.event_id = data.result.event_id
      if (data.result.channel_id) _context.channel_id = data.result.channel_id
      if (data.result.task_ids) _context.task_ids = { ..._context.task_ids, ...data.result.task_ids }
      if (data.result.meta_campaigns) _context.meta_campaigns = { ..._context.meta_campaigns, ...data.result.meta_campaigns }
      if (data.result.image_hashes) _context.image_hashes = data.result.image_hashes
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
