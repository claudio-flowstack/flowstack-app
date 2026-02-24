import { useEffect, useState, useCallback, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAutomationStore } from '../application/automation-store'
import type { AutomationSystem, ExecutionLogEntry, NodeExecutionStatus, WorkflowVersion } from '../domain/types'
import {
  startGlobalExecution,
  getNodeStates,
  isExecutionActive,
  subscribeExecution,
  stopGlobalExecution,
  type ScheduledNode,
} from '../application/global-execution'
import { WorkflowCanvas } from '../canvas/WorkflowCanvas'
import { OutputViewer } from '../components/OutputViewer'
import { ResourceManager } from '../components/ResourceManager'
import { ErrorBoundary } from '@/shared/components/ErrorBoundary'
import { EmptyState } from '@/shared/components/EmptyState'
import { cn } from '@/shared/lib/utils'
import { formatDateTime } from '@/shared/lib/utils'
import {
  ArrowLeft,
  Workflow,
  FolderOpen,
  Layers,
  ChevronDown,
  Clock,
  FileBox,
  Play,
  Trash2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  PanelRightOpen,
  PanelRightClose,
  Plus,
  X,
} from 'lucide-react'

// ── Panel tab config ─────────────────────────────────────────────────────────

type PanelTab = 'documents' | 'log' | 'resources'

const PANEL_TABS: { key: PanelTab; label: string; icon: typeof FolderOpen }[] = [
  { key: 'documents', label: 'Dokumente', icon: FolderOpen },
  { key: 'log', label: 'Log', icon: Clock },
  { key: 'resources', label: 'Ressourcen', icon: FileBox },
]

// ── Log helpers ──────────────────────────────────────────────────────────────

function LogStatusIcon({ status }: { status: ExecutionLogEntry['status'] }) {
  switch (status) {
    case 'success':
      return <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
    case 'error':
      return <XCircle className="h-4 w-4 text-red-500 shrink-0" />
    case 'warning':
      return <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
    case 'running':
      return <Play className="h-4 w-4 text-blue-500 shrink-0" />
  }
}

const LOG_DOT_COLORS: Record<ExecutionLogEntry['status'], string> = {
  success: 'bg-emerald-500',
  error: 'bg-red-500',
  warning: 'bg-amber-500',
  running: 'bg-blue-500',
}

const LOG_TEXT_COLORS: Record<ExecutionLogEntry['status'], string> = {
  success: 'text-foreground',
  error: 'text-red-600 dark:text-red-400',
  warning: 'text-amber-600 dark:text-amber-400',
  running: 'text-blue-600 dark:text-blue-400',
}

// ── Full-Screen Editor Page (Level 3) ──────────────────────────────────────

export function SystemEditorPage() {
  const { systemId } = useParams<{ systemId: string }>()
  const navigate = useNavigate()
  const {
    systems,
    loading: storeLoading,
    fetchSystems,
    createSystem,
    updateSystem,
    resources,
    fetchResources,
    updateResource,
  } = useAutomationStore()
  const system = systems.find((s) => s.id === systemId)

  // Track whether initial fetch has completed (always starts false, set by effect)
  const [initialLoaded, setInitialLoaded] = useState(false)

  const [versions, setVersions] = useState<WorkflowVersion[]>([])
  const [executionLog, setExecutionLog] = useState<ExecutionLogEntry[]>([])
  const [showPanel, setShowPanel] = useState(false)
  const [panelTab, setPanelTab] = useState<PanelTab>('documents')
  const [systemNavOpen, setSystemNavOpen] = useState(false)

  // ── Sub-System Navigation ──────────────────────────────────────────────
  const parentSystem = useMemo(
    () => (system?.parentId ? systems.find((s) => s.id === system.parentId) : undefined),
    [system, systems],
  )

  // Sub-system info map for canvas badge rendering
  const subSystemInfoMap = useMemo(() => {
    const m = new Map<string, { nodeCount: number; status: string }>()
    for (const s of systems) {
      if (s.parentId) {
        m.set(s.id, { nodeCount: s.nodes.length, status: s.status })
      }
    }
    return m
  }, [systems])

  // ── effectiveSystem: auto-sync subsystem nodes + trigger nodes ─────────
  const effectiveSystem = useMemo(() => {
    if (!system) return undefined

    // Sub-System: add trigger node at start
    if (system.parentId && parentSystem) {
      const TRIGGER_ID = `__trigger-${system.id}`
      if (system.nodes.some((n) => n.id === TRIGGER_ID)) return system

      // Find which specific master node triggers this sub-system
      const triggeringNode = parentSystem.nodes.find(
        (n) => n.type === 'subsystem' && n.linkedSubSystemId === system.id,
      )
      const triggerLabel = triggeringNode
        ? `Getriggert durch: ${triggeringNode.label}`
        : `Von: ${parentSystem.name}`
      const triggerDesc = triggeringNode
        ? `Wird ausgelöst wenn "${triggeringNode.label}" im Master-System "${parentSystem.name}" aktiviert wird`
        : `Dieses Sub-System wird von "${parentSystem.name}" getriggert`

      const hasIncoming = new Set(system.connections.map((c) => c.to))
      const startNodeIds = system.nodes.filter((n) => !hasIncoming.has(n.id)).map((n) => n.id)
      const minX = system.nodes.length > 0 ? Math.min(...system.nodes.map((n) => n.x)) : 300
      const avgY =
        system.nodes.length > 0
          ? system.nodes.reduce((sum, n) => sum + n.y, 0) / system.nodes.length
          : 120

      return {
        ...system,
        nodes: [
          {
            id: TRIGGER_ID,
            label: triggerLabel,
            description: triggerDesc,
            icon: 'zap',
            type: 'trigger' as const,
            x: minX - 340,
            y: avgY,
          },
          ...system.nodes,
        ],
        connections: [
          ...startNodeIds.map((targetId) => ({ from: TRIGGER_ID, to: targetId })),
          ...system.connections,
        ],
      }
    }

    // Master: sync subsystem nodes
    const subs = systems.filter((s) => s.parentId === system.id)
    if (subs.length === 0) return system

    const existingMap = new Map(
      system.nodes.filter((n) => n.type === 'subsystem').map((n) => [n.linkedSubSystemId, n]),
    )
    const validIds = new Set(subs.map((s) => s.id))

    let nodes = system.nodes.filter(
      (n) => n.type !== 'subsystem' || (n.linkedSubSystemId && validIds.has(n.linkedSubSystemId)),
    )
    let nextX = nodes.length > 0 ? Math.max(...nodes.map((n) => n.x)) + 340 : 40
    for (const sub of subs) {
      if (!existingMap.has(sub.id)) {
        nodes = [
          ...nodes,
          {
            id: `sub-${sub.id}`,
            label: sub.name,
            description: sub.description,
            icon: sub.icon || 'layers',
            type: 'subsystem' as const,
            x: nextX,
            y: 58,
            linkedSubSystemId: sub.id,
          },
        ]
        nextX += 340
      } else {
        nodes = nodes.map((n) =>
          n.linkedSubSystemId === sub.id && n.label !== sub.name
            ? { ...n, label: sub.name, description: sub.description }
            : n,
        )
      }
    }
    const validNodeIds = new Set(nodes.map((n) => n.id))
    const connections = system.connections.filter(
      (c) => validNodeIds.has(c.from) && validNodeIds.has(c.to),
    )
    return { ...system, nodes, connections }
  }, [system, systems, parentSystem])

  // ── Global Execution (synchronized Master + Sub-System animations) ────
  const [globalNodeStates, setGlobalNodeStates] = useState<
    Map<string, NodeExecutionStatus> | undefined
  >(undefined)

  // Subscribe to global execution state changes
  useEffect(() => {
    return subscribeExecution(() => {
      if (isExecutionActive() && systemId) {
        const states = getNodeStates(systemId)
        setGlobalNodeStates(states.size > 0 ? states : undefined)
      } else {
        setGlobalNodeStates(undefined)
      }
    })
  }, [systemId])

  // Build & start global execution schedule when master system runs
  const handleExecuteGlobal = useCallback(() => {
    if (!effectiveSystem) return
    const subs = systems.filter((s) => s.parentId === effectiveSystem.id)
    if (subs.length === 0) return // Not a master → canvas handles internally

    const now = Date.now()
    const entries: ScheduledNode[] = []

    // BFS the master system
    const eNodes = effectiveSystem.nodes
    const eConns = effectiveSystem.connections
    const incoming = new Set(eConns.map((c) => c.to))
    const starts = eNodes.filter(
      (n) => n.type === 'trigger' || !incoming.has(n.id),
    )
    const first = eNodes[0]
    if (starts.length === 0 && first) starts.push(first)

    const visited = new Set<string>()
    const queue: { id: string; depth: number }[] = starts.map((n) => ({
      id: n.id,
      depth: 0,
    }))
    const depthDelay = new Map<number, number>()

    while (queue.length > 0) {
      const item = queue.shift()!
      if (visited.has(item.id)) continue
      visited.add(item.id)

      const baseDelay = depthDelay.get(item.depth) ?? item.depth * 600
      const node = eNodes.find((n) => n.id === item.id)
      const subSys =
        node?.type === 'subsystem' && node.linkedSubSystemId
          ? systems.find((s) => s.id === node.linkedSubSystemId)
          : undefined
      const nodeTime = subSys
        ? Math.max(600, subSys.nodes.length * 400)
        : 600

      // Schedule master node
      entries.push({
        nodeId: item.id,
        systemId: effectiveSystem.id,
        pendingAt: now + baseDelay,
        runningAt: now + baseDelay + 400,
        completedAt: now + baseDelay + nodeTime,
      })

      // Schedule sub-system internal nodes
      if (subSys && subSys.nodes.length > 0) {
        const subStart = now + baseDelay + 400
        // Trigger node
        entries.push({
          nodeId: `__trigger-${subSys.id}`,
          systemId: subSys.id,
          pendingAt: subStart,
          runningAt: subStart + 200,
          completedAt: subStart + 500,
        })
        // BFS sub-system nodes
        const subIncoming = new Set(subSys.connections.map((c) => c.to))
        const subStarts = subSys.nodes.filter(
          (n) => !subIncoming.has(n.id),
        )
        const subFirst = subSys.nodes[0]
        if (subStarts.length === 0 && subFirst) subStarts.push(subFirst)
        const subVisited = new Set<string>()
        const subQueue: { id: string; depth: number }[] = subStarts.map(
          (n) => ({ id: n.id, depth: 0 }),
        )
        const subDD = new Map<number, number>()
        const subOff = subStart + 500

        while (subQueue.length > 0) {
          const si = subQueue.shift()!
          if (subVisited.has(si.id)) continue
          subVisited.add(si.id)
          const sb = subDD.get(si.depth) ?? si.depth * 600
          entries.push({
            nodeId: si.id,
            systemId: subSys.id,
            pendingAt: subOff + sb,
            runningAt: subOff + sb + 400,
            completedAt: subOff + sb + 600,
          })
          for (const c of subSys.connections.filter(
            (c) => c.from === si.id,
          )) {
            if (!subVisited.has(c.to)) {
              const nd = si.depth + 1
              subDD.set(nd, Math.max(subDD.get(nd) ?? 0, sb + 600))
              subQueue.push({ id: c.to, depth: nd })
            }
          }
        }
        // Fallback: schedule any disconnected sub-system nodes
        for (const sn of subSys.nodes) {
          if (!subVisited.has(sn.id)) {
            const fallbackDelay = subVisited.size * 600
            entries.push({
              nodeId: sn.id,
              systemId: subSys.id,
              pendingAt: subOff + fallbackDelay,
              runningAt: subOff + fallbackDelay + 400,
              completedAt: subOff + fallbackDelay + 600,
            })
          }
        }
      }

      // Update depth delays for next master nodes
      const nextDD = baseDelay + nodeTime
      for (const conn of eConns.filter((c) => c.from === item.id)) {
        if (!visited.has(conn.to)) {
          const nd = item.depth + 1
          depthDelay.set(nd, Math.max(depthDelay.get(nd) ?? 0, nextDD))
          queue.push({ id: conn.to, depth: nd })
        }
      }
    }

    startGlobalExecution(entries)
  }, [effectiveSystem, systems])

  // ── Handlers ───────────────────────────────────────────────────────────
  const handleDrillDown = useCallback(
    (subSystemId: string) => navigate(`/automation/system/${subSystemId}/editor`),
    [navigate],
  )

  const handleCreateSubSystem = useCallback(async () => {
    const masterSys = parentSystem ?? system
    if (!masterSys) return
    const existingSubs = systems.filter((s) => s.parentId === masterSys.id)
    const newSub = await createSystem({
      name: `Sub-System ${existingSubs.length + 1}`,
      description: '',
      parentId: masterSys.id,
      subSystemOrder: existingSubs.length,
      status: 'draft',
      icon: 'workflow',
      category: masterSys.category,
      nodes: [],
      connections: [],
      groups: [],
    })
    navigate(`/automation/system/${newSub.id}/editor`)
  }, [parentSystem, system, systems, createSystem, navigate])

  useEffect(() => {
    if (systems.length === 0) {
      fetchSystems().then(() => setInitialLoaded(true))
    } else {
      setInitialLoaded(true)
    }
  }, [systems.length, fetchSystems])

  useEffect(() => {
    if (system) {
      setVersions(system.versions ?? [])
      setExecutionLog(system.executionLog ?? [])
    }
  }, [system])

  useEffect(() => {
    if (systemId) fetchResources(systemId)
  }, [systemId, fetchResources])

  const handleSave = useCallback(
    (savedSystem: AutomationSystem) => {
      if (!systemId || !system) return

      const persistNodes = savedSystem.nodes.filter(
        (n) => n.type !== 'subsystem' && !n.id.startsWith('__trigger-'),
      )
      const persistNodeIds = new Set(persistNodes.map((n) => n.id))
      const persistConnections = savedSystem.connections.filter(
        (c) => persistNodeIds.has(c.from) && persistNodeIds.has(c.to),
      )

      const version: WorkflowVersion = {
        id: `ver-${Date.now()}`,
        timestamp: new Date().toISOString(),
        nodeCount: persistNodes.length,
        connectionCount: persistConnections.length,
        snapshot: JSON.stringify({ nodes: persistNodes, connections: persistConnections }),
      }
      const updatedVersions = [version, ...versions]
      setVersions(updatedVersions)
      updateSystem(systemId, {
        nodes: persistNodes,
        connections: persistConnections,
        groups: savedSystem.groups,
        stickyNotes: savedSystem.stickyNotes,
        canvasZoom: savedSystem.canvasZoom,
        canvasPan: savedSystem.canvasPan,
        versions: updatedVersions,
      })
    },
    [systemId, system, updateSystem, versions],
  )

  const handleClearLog = useCallback(() => {
    setExecutionLog([])
    if (systemId) {
      updateSystem(systemId, { executionLog: [] })
    }
  }, [systemId, updateSystem])

  // ── Top-level systems for navigation ───────────────────────────────────
  const topLevelSystems = useMemo(
    () => systems.filter((s) => !s.parentId && s.status === 'active'),
    [systems],
  )

  // ── Loading / Error ────────────────────────────────────────────────────
  if (!system) {
    // Still loading — show spinner instead of "not found"
    if (!initialLoaded || storeLoading) {
      return (
        <div className="flex flex-col h-screen bg-background">
          <div className="flex items-center border-b border-border px-4 py-2 shrink-0">
            <button
              onClick={() => navigate('/automation')}
              className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Zurück
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <p className="text-sm text-muted-foreground">System wird geladen…</p>
            </div>
          </div>
        </div>
      )
    }
    // Loaded but not found
    return (
      <div className="flex flex-col h-screen bg-background">
        <div className="flex items-center border-b border-border px-4 py-2 shrink-0">
          <button
            onClick={() => navigate('/automation')}
            className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Zurück
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <EmptyState
            icon={Workflow}
            title="System nicht gefunden"
            description="Das angeforderte System existiert nicht."
            action={{ label: 'Zurück', onClick: () => navigate('/automation') }}
          />
        </div>
      </div>
    )
  }

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-screen bg-background">
      {/* ── Editor Header with Tab Navigation ────────────────────────────── */}
      <div className="flex items-center border-b border-border px-3 shrink-0 h-10 gap-2">
        {/* Back button */}
        <button
          onClick={() => navigate(`/automation/system/${(parentSystem ?? system).id}`)}
          className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
        </button>

        <div className="w-px h-5 bg-border shrink-0" />

        {/* Tab Navigation: Master + Sub-Systems */}
        <nav className="flex items-center gap-0.5 flex-1 min-w-0 overflow-x-auto scrollbar-none">
          {(() => {
            const masterSys = parentSystem ?? system
            const masterSubs = systems
              .filter((s) => s.parentId === masterSys.id)
              .sort((a, b) => (a.subSystemOrder ?? 0) - (b.subSystemOrder ?? 0))

            return (
              <>
                {/* Master tab — visually distinct */}
                <button
                  onClick={() => navigate(`/automation/system/${masterSys.id}/editor`)}
                  className={cn(
                    'relative flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold whitespace-nowrap rounded-md transition-colors shrink-0',
                    systemId === masterSys.id
                      ? 'text-foreground bg-muted'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
                  )}
                >
                  <Layers className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate max-w-[160px]">{masterSys.name}</span>
                  {systemId === masterSys.id && (
                    <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-primary rounded-full" />
                  )}
                </button>

                {/* Separator + Sub-system tabs + Add button */}
                <div className="flex items-center shrink-0 mx-1 gap-1">
                  <ChevronDown className="h-3 w-3 text-muted-foreground/40 -rotate-90" />
                  <span className="text-[9px] uppercase tracking-wider text-muted-foreground/50 font-medium">Sub</span>
                </div>
                {masterSubs.map((sub) => {
                  const isActive = sub.id === systemId
                  return (
                    <button
                      key={sub.id}
                      onClick={() => navigate(`/automation/system/${sub.id}/editor`)}
                      className={cn(
                        'relative flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium whitespace-nowrap rounded-md transition-colors shrink-0',
                        isActive
                          ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
                      )}
                    >
                      <Workflow className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate max-w-[140px]">{sub.name}</span>
                      {isActive && (
                        <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-indigo-500 rounded-full" />
                      )}
                    </button>
                  )
                })}
                <button
                  onClick={handleCreateSubSystem}
                  className="flex items-center justify-center h-6 w-6 rounded-md text-muted-foreground/60 hover:text-foreground hover:bg-muted transition-colors shrink-0"
                  title="Sub-System hinzufügen"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </>
            )
          })()}
        </nav>

        <div className="w-px h-5 bg-border shrink-0" />

        {/* Right: Panel toggle */}
        <button
          onClick={() => setShowPanel(!showPanel)}
          className={cn(
            'flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors shrink-0',
            showPanel
              ? 'bg-primary/10 text-primary'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted',
          )}
        >
          {showPanel ? (
            <PanelRightClose className="h-3.5 w-3.5" />
          ) : (
            <PanelRightOpen className="h-3.5 w-3.5" />
          )}
        </button>
      </div>

      {/* ── Main Content: Canvas + Right Panel ────────────────────────────── */}
      <div className="flex flex-1 min-h-0">
        {/* Canvas (always full height, shrinks width when panel open) */}
        <div className="flex-1 min-w-0 min-h-0 flex flex-col">
          <ErrorBoundary>
            <WorkflowCanvas
              initialSystem={effectiveSystem ?? system}
              onSave={handleSave}
              onExecute={handleExecuteGlobal}
              onStop={stopGlobalExecution}
              nodeStates={globalNodeStates}
              className="w-full h-full"
              onDrillDown={handleDrillDown}
              subSystemInfo={subSystemInfoMap}
              presNavigationSystems={(() => {
                const masterSys = parentSystem ?? system
                const subs = systems
                  .filter((s) => s.parentId === masterSys.id)
                  .sort((a, b) => (a.subSystemOrder ?? 0) - (b.subSystemOrder ?? 0))
                return [
                  { id: masterSys.id, name: masterSys.name, isCurrent: masterSys.id === systemId, isMaster: true },
                  ...subs.map((s) => ({ id: s.id, name: s.name, isCurrent: s.id === systemId })),
                ]
              })()}
              onPresNavigate={(id) => navigate(`/automation/system/${id}/editor`)}
            />
          </ErrorBoundary>
        </div>

        {/* ── Right Slide-Over Panel ──────────────────────────────────────── */}
        {showPanel && (
          <div className="w-[min(340px,90vw)] shrink-0 border-l border-border bg-background flex flex-col">
            {/* Panel Header with Tabs */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-border shrink-0">
              <div className="flex items-center gap-0.5">
                {PANEL_TABS.map(({ key, label, icon: TabIcon }) => (
                  <button
                    key={key}
                    onClick={() => setPanelTab(key)}
                    className={cn(
                      'flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded-md transition-colors',
                      panelTab === key
                        ? 'bg-muted text-foreground'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    <TabIcon className="h-3 w-3" />
                    {label}
                    {key === 'log' && executionLog.length > 0 && (
                      <span className="text-[9px] bg-primary/10 text-primary rounded-full px-1 min-w-[16px] text-center">
                        {executionLog.length}
                      </span>
                    )}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowPanel(false)}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Panel Content (scrolls internally, isolated from canvas) */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden overscroll-contain">
              {/* ── Documents ───────────────────────────────────────── */}
              {panelTab === 'documents' && (
                <div className="p-3">
                  {system.outputs.length > 0 ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <FolderOpen className="h-4 w-4 text-muted-foreground" />
                        <span className="text-xs font-medium text-foreground">
                          {system.outputs.length} Dokumente
                        </span>
                      </div>
                      <div className="rounded-xl border border-border bg-card p-3">
                        <OutputViewer outputs={system.outputs as never[]} compact />
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted mb-3">
                        <FolderOpen className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <p className="text-xs font-medium text-foreground">Keine Dokumente</p>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        Starte das System, um Dokumente zu generieren.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* ── Execution Log ────────────────────────────────────── */}
              {panelTab === 'log' && (
                <div className="p-3 space-y-3">
                  {executionLog.length > 0 && (
                    <div className="flex items-center justify-end">
                      <button
                        onClick={handleClearLog}
                        className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 className="h-3 w-3" />
                        Löschen
                      </button>
                    </div>
                  )}

                  {executionLog.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted mb-3">
                        <Play className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <p className="text-xs font-medium text-foreground">Keine Ausführungen</p>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        Starte das System im Canvas.
                      </p>
                    </div>
                  ) : (
                    <div className="relative pl-5">
                      <div className="absolute left-[7px] top-1 bottom-1 w-0.5 bg-border" />
                      <div className="space-y-2">
                        {executionLog.map((entry) => (
                          <div key={entry.id} className="relative flex items-start gap-3">
                            <div
                              className={cn(
                                'absolute -left-5 top-1.5 w-[11px] h-[11px] rounded-full border-2 border-background',
                                LOG_DOT_COLORS[entry.status],
                              )}
                            />
                            <div className="rounded-lg border border-border bg-card p-2.5 flex-1 min-w-0">
                              <div className="flex items-start gap-2">
                                <LogStatusIcon status={entry.status} />
                                <div className="flex-1 min-w-0">
                                  <p className={cn('text-xs font-medium leading-tight', LOG_TEXT_COLORS[entry.status])}>
                                    {entry.message}
                                  </p>
                                  <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                                    {entry.duration != null && (
                                      <span className="font-mono">{entry.duration}ms</span>
                                    )}
                                    <span>{formatDateTime(entry.timestamp)}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── Resources ───────────────────────────────────────── */}
              {panelTab === 'resources' && (
                <div className="p-3">
                  <ResourceManager
                    resources={resources}
                    systemId={systemId}
                    compact
                    onUpdate={(updated) => {
                      for (const res of updated) {
                        updateResource(res.id, res)
                      }
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
