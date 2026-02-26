/**
 * Global Execution State — persists across navigation/component unmounts.
 *
 * Two execution modes:
 * 1. Legacy timestamp-based: Pre-computed schedule with fixed timing (non-novacode)
 * 2. DAG-based: Event-driven, dependency-tracked execution with true sync (novacode)
 */
import type { NodeExecutionStatus } from '../domain/types'

// ── Types ──────────────────────────────────────────────────────────────────

/** Legacy timestamp-based entry (non-novacode workflows) */
export interface ScheduledNode {
  nodeId: string
  systemId: string
  pendingAt: number
  runningAt: number
  completedAt: number
}

/** DAG node definition */
export interface DagNode {
  nodeId: string
  systemId: string
  /** Duration in ms for staged (non-dynamic) nodes */
  duration: number
  /** If true, node waits for completeNode() instead of auto-completing after duration */
  dynamic?: boolean
}

/** DAG edge (dependency) */
export interface DagEdge {
  from: string
  to: string
}

/** Subsystem placeholder mapping */
export interface SubSystemPlaceholder {
  placeholderId: string
  masterSystemId: string
  subSystemId: string
}

export interface DagExecutionOptions {
  onNodeRunning?: (nodeId: string, systemId: string) => void
  onNodeCompleted?: (nodeId: string, systemId: string, durationMs: number) => void
  onComplete?: () => void
  /** Delay between pending→running in ms. Default 400 */
  pendingDelay?: number
  /** Subsystem placeholder mappings for derived state */
  subSystemPlaceholders?: SubSystemPlaceholder[]
}

export interface GlobalExecutionOptions {
  onNodeRunning?: (nodeId: string, systemId: string) => void
  onComplete?: () => void
}

// ── Internal node state ─────────────────────────────────────────────────

interface InternalNodeState {
  systemId: string
  status: NodeExecutionStatus
  startedAt?: number
  completedAt?: number
}

// ── Module-level singleton ─────────────────────────────────────────────────

const _nodeStates = new Map<string, InternalNodeState>()
let _active = false
let _cleanupTimer: ReturnType<typeof setTimeout> | null = null
const _listeners = new Set<() => void>()
let _tickInterval: ReturnType<typeof setInterval> | null = null

// DAG state
let _dagNodes = new Map<string, DagNode>()
let _successors = new Map<string, string[]>()
let _predecessors = new Map<string, string[]>()
let _dagOptions: DagExecutionOptions = {}
const _pendingTimers = new Map<string, ReturnType<typeof setTimeout>>()
const _runningTimers = new Map<string, ReturnType<typeof setTimeout>>()
let _completeFired = false
let _subSystemPlaceholders: SubSystemPlaceholder[] = []

// Legacy state
let _legacySchedule: ScheduledNode[] = []
let _legacyOptions: GlobalExecutionOptions = {}
let _legacyNotifiedRunning = new Set<string>()

// ── Cleanup ───────────────────────────────────────────────────────────────

function fullCleanup() {
  if (_cleanupTimer) { clearTimeout(_cleanupTimer); _cleanupTimer = null }
  if (_tickInterval) { clearInterval(_tickInterval); _tickInterval = null }
  for (const t of _pendingTimers.values()) clearTimeout(t)
  for (const t of _runningTimers.values()) clearTimeout(t)
  _pendingTimers.clear()
  _runningTimers.clear()
}

// ── DAG Execution ─────────────────────────────────────────────────────────

/** Start an event-driven DAG execution. */
export function startDagExecution(
  nodes: DagNode[],
  edges: DagEdge[],
  options?: DagExecutionOptions,
) {
  fullCleanup()
  _nodeStates.clear()
  _dagNodes.clear()
  _successors.clear()
  _predecessors.clear()
  _legacySchedule = []
  _dagOptions = options ?? {}
  _subSystemPlaceholders = options?.subSystemPlaceholders ?? []
  _completeFired = false
  _active = true

  // Build adjacency maps
  for (const n of nodes) {
    _dagNodes.set(n.nodeId, n)
    _nodeStates.set(n.nodeId, { systemId: n.systemId, status: 'idle' })
    if (!_successors.has(n.nodeId)) _successors.set(n.nodeId, [])
    if (!_predecessors.has(n.nodeId)) _predecessors.set(n.nodeId, [])
  }

  for (const e of edges) {
    _successors.get(e.from)?.push(e.to)
    _predecessors.get(e.to)?.push(e.from)
  }

  // Find roots (no predecessors) and schedule them
  for (const [nodeId, preds] of _predecessors) {
    if (preds.length === 0) {
      scheduleNode(nodeId)
    }
  }

  notify()
}

function scheduleNode(nodeId: string) {
  const state = _nodeStates.get(nodeId)
  if (!state || state.status !== 'idle') return

  state.status = 'pending'
  notify()

  const delay = _dagOptions.pendingDelay ?? 400
  const timer = setTimeout(() => {
    _pendingTimers.delete(nodeId)
    startNodeRunning(nodeId)
  }, delay)
  _pendingTimers.set(nodeId, timer)
}

function startNodeRunning(nodeId: string) {
  const state = _nodeStates.get(nodeId)
  const dagNode = _dagNodes.get(nodeId)
  if (!state || !dagNode) return

  state.status = 'running'
  state.startedAt = Date.now()
  notify()

  // Fire callback
  if (_dagOptions.onNodeRunning) {
    try { _dagOptions.onNodeRunning(nodeId, state.systemId) } catch { /* ignore */ }
  }

  if (!dagNode.dynamic) {
    // Auto-complete after duration
    const timer = setTimeout(() => {
      _runningTimers.delete(nodeId)
      completeNode(nodeId)
    }, dagNode.duration)
    _runningTimers.set(nodeId, timer)
  } else {
    // Dynamic: safety timeout 30s — completes even if API hangs
    const timer = setTimeout(() => {
      _runningTimers.delete(nodeId)
      if (_nodeStates.get(nodeId)?.status === 'running') {
        completeNode(nodeId)
      }
    }, 30_000)
    _runningTimers.set(nodeId, timer)
  }
}

/** Complete a running node. Called internally for staged nodes, externally for dynamic/side-effect nodes. */
export function completeNode(nodeId: string) {
  const state = _nodeStates.get(nodeId)
  if (!state || state.status !== 'running') return

  // Clear any pending timer
  const timer = _runningTimers.get(nodeId)
  if (timer) { clearTimeout(timer); _runningTimers.delete(nodeId) }

  state.status = 'completed'
  state.completedAt = Date.now()

  // Fire completed callback
  if (_dagOptions.onNodeCompleted && state.startedAt) {
    const duration = state.completedAt - state.startedAt
    try { _dagOptions.onNodeCompleted(nodeId, state.systemId, duration) } catch { /* ignore */ }
  }

  notify()

  // Advance successors whose predecessors are all completed
  const succs = _successors.get(nodeId) ?? []
  for (const succId of succs) {
    const preds = _predecessors.get(succId) ?? []
    const allDone = preds.every(p => _nodeStates.get(p)?.status === 'completed')
    if (allDone) {
      scheduleNode(succId)
    }
  }

  checkAllComplete()
}

function checkAllComplete() {
  if (_completeFired) return

  for (const state of _nodeStates.values()) {
    if (state.status !== 'completed') return
  }

  if (_nodeStates.size === 0) return

  _completeFired = true
  if (_dagOptions.onComplete) {
    try { _dagOptions.onComplete() } catch { /* ignore */ }
  }

  // Keep completed state visible for 3 s, then clear
  _cleanupTimer = setTimeout(() => {
    _nodeStates.clear()
    _dagNodes.clear()
    _subSystemPlaceholders = []
    _active = false
    _cleanupTimer = null
    notify()
  }, 3000)
}

/** Get how long a node was (or has been) running. */
export function getNodeDuration(nodeId: string): number | undefined {
  const s = _nodeStates.get(nodeId)
  if (!s) return undefined
  if (s.startedAt && s.completedAt) return s.completedAt - s.startedAt
  if (s.startedAt && s.status === 'running') return Date.now() - s.startedAt
  return undefined
}

// ── Legacy Timestamp Execution ─────────────────────────────────────────────

/** Start a legacy timestamp-based execution (non-novacode workflows). */
export function startGlobalExecution(
  entries: ScheduledNode[],
  options?: GlobalExecutionOptions,
) {
  fullCleanup()
  _nodeStates.clear()
  _dagNodes.clear()
  _subSystemPlaceholders = []
  _legacySchedule = entries
  _legacyOptions = options ?? {}
  _legacyNotifiedRunning = new Set()
  _completeFired = false
  _active = true

  _tickInterval = setInterval(() => {
    const now = Date.now()

    for (const e of _legacySchedule) {
      let status: NodeExecutionStatus = 'idle'
      if (now >= e.completedAt) status = 'completed'
      else if (now >= e.runningAt) status = 'running'
      else if (now >= e.pendingAt) status = 'pending'
      _nodeStates.set(e.nodeId, { systemId: e.systemId, status })
    }

    if (_legacyOptions.onNodeRunning) {
      for (const e of _legacySchedule) {
        if (now >= e.runningAt && !_legacyNotifiedRunning.has(e.nodeId)) {
          _legacyNotifiedRunning.add(e.nodeId)
          try { _legacyOptions.onNodeRunning!(e.nodeId, e.systemId) } catch { /* ignore */ }
        }
      }
    }

    notify()

    if (_legacySchedule.length > 0 && _legacySchedule.every(e => now >= e.completedAt)) {
      if (_tickInterval) { clearInterval(_tickInterval); _tickInterval = null }
      if (!_completeFired && _legacyOptions.onComplete) {
        _completeFired = true
        try { _legacyOptions.onComplete() } catch { /* ignore */ }
      }
      _cleanupTimer = setTimeout(() => {
        _legacySchedule = []
        _nodeStates.clear()
        _active = false
        _cleanupTimer = null
        notify()
      }, 3000)
    }
  }, 150)

  notify()
}

// ── Shared Public API ─────────────────────────────────────────────────────

/** Compute current node states for a given system. */
export function getNodeStates(systemId: string): Map<string, NodeExecutionStatus> {
  const map = new Map<string, NodeExecutionStatus>()

  for (const [nodeId, state] of _nodeStates) {
    if (state.systemId === systemId && state.status !== 'idle') {
      map.set(nodeId, state.status)
    }
  }

  // Derive subsystem placeholder states from internal nodes
  for (const ph of _subSystemPlaceholders) {
    if (ph.masterSystemId !== systemId) continue

    const subStates: NodeExecutionStatus[] = []
    for (const [, state] of _nodeStates) {
      if (state.systemId === ph.subSystemId && state.status !== 'idle') {
        subStates.push(state.status)
      }
    }
    if (subStates.length === 0) continue

    if (subStates.every(s => s === 'completed')) {
      map.set(ph.placeholderId, 'completed')
    } else if (subStates.some(s => s === 'running' || s === 'completed')) {
      map.set(ph.placeholderId, 'running')
    } else if (subStates.some(s => s === 'pending')) {
      map.set(ph.placeholderId, 'pending')
    }
  }

  return map
}

/** Whether any execution is currently active. */
export function isExecutionActive(): boolean {
  return _active
}

/** Subscribe to execution state changes. Returns unsubscribe function. */
export function subscribeExecution(cb: () => void): () => void {
  _listeners.add(cb)
  try { cb() } catch { /* ignore */ }
  return () => { _listeners.delete(cb) }
}

/** Stop the current execution immediately. */
export function stopGlobalExecution() {
  fullCleanup()
  _legacySchedule = []
  _nodeStates.clear()
  _dagNodes.clear()
  _subSystemPlaceholders = []
  _active = false
  _completeFired = false
  notify()
}

// ── Internal ───────────────────────────────────────────────────────────────

function notify() {
  for (const cb of _listeners) {
    try { cb() } catch { /* ignore */ }
  }
}
