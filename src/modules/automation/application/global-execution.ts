/**
 * Global Execution State — persists across navigation/component unmounts.
 *
 * When a workflow executes in the master, this module stores a time-based
 * schedule for ALL systems (master + sub-systems).  Any SystemEditorPage
 * can poll `getNodeStates(systemId)` to derive the current animation frame.
 */
import type { NodeExecutionStatus } from '../domain/types'

// ── Types ──────────────────────────────────────────────────────────────────

export interface ScheduledNode {
  nodeId: string
  systemId: string
  pendingAt: number   // absolute ms timestamp
  runningAt: number   // absolute ms timestamp
  completedAt: number // absolute ms timestamp
}

// ── Module-level singleton ─────────────────────────────────────────────────

let schedule: ScheduledNode[] = []
let active = false
let cleanupTimer: ReturnType<typeof setTimeout> | null = null
const listeners = new Set<() => void>()
let tickInterval: ReturnType<typeof setInterval> | null = null

// ── Public API ─────────────────────────────────────────────────────────────

/** Start a new global execution with the given schedule. */
export function startGlobalExecution(entries: ScheduledNode[]) {
  // Clean up previous
  if (cleanupTimer) { clearTimeout(cleanupTimer); cleanupTimer = null }
  if (tickInterval) { clearInterval(tickInterval); tickInterval = null }

  schedule = entries
  active = true

  // Tick every 150ms to notify subscribers (drives React state updates)
  tickInterval = setInterval(() => {
    notify()
    // Auto-stop when all nodes completed
    const now = Date.now()
    if (schedule.length > 0 && schedule.every(e => now >= e.completedAt)) {
      if (tickInterval) { clearInterval(tickInterval); tickInterval = null }
      // Keep "completed" state visible for 3s, then clear
      cleanupTimer = setTimeout(() => {
        schedule = []
        active = false
        cleanupTimer = null
        notify()
      }, 3000)
    }
  }, 150)

  notify()
}

/** Compute current node states for a given system. */
export function getNodeStates(systemId: string): Map<string, NodeExecutionStatus> {
  const now = Date.now()
  const map = new Map<string, NodeExecutionStatus>()

  for (const e of schedule) {
    if (e.systemId !== systemId) continue
    if (now >= e.completedAt) {
      map.set(e.nodeId, 'completed')
    } else if (now >= e.runningAt) {
      map.set(e.nodeId, 'running')
    } else if (now >= e.pendingAt) {
      map.set(e.nodeId, 'pending')
    }
  }

  return map
}

/** Whether any execution is currently active (running or showing completion). */
export function isExecutionActive(): boolean {
  return active
}

/** Subscribe to execution state changes. Returns unsubscribe function. */
export function subscribeExecution(cb: () => void): () => void {
  listeners.add(cb)
  // Immediately notify new subscriber of current state
  try { cb() } catch { /* ignore */ }
  return () => { listeners.delete(cb) }
}

/** Stop the current execution immediately. */
export function stopGlobalExecution() {
  if (cleanupTimer) { clearTimeout(cleanupTimer); cleanupTimer = null }
  if (tickInterval) { clearInterval(tickInterval); tickInterval = null }
  schedule = []
  active = false
  notify()
}

// ── Internal ───────────────────────────────────────────────────────────────

function notify() {
  for (const cb of listeners) {
    try { cb() } catch { /* ignore */ }
  }
}
