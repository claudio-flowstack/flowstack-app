import type {
  NodeStatusEvent,
  Artifact,
  WorkflowExecutionResult,
  WorkflowEventSource,
  NodeExecutionStatus,
  DemoNodeConfig,
} from '../domain/types'

// ── BFS Schedule ────────────────────────────────────────────────────────────

interface ScheduleItem {
  nodeId: string
  depth: number
  nodeType?: string
  demoConfig?: DemoNodeConfig
}

function computeBFSSchedule(
  nodeIds: string[],
  connections: { from: string; to: string }[],
  nodeTypes?: Record<string, string>,
  demoConfigs?: Record<string, DemoNodeConfig>,
): ScheduleItem[] {
  const incoming = new Set(connections.map((c) => c.to))
  const startIds = nodeIds.filter((id) => !incoming.has(id))
  if (startIds.length === 0 && nodeIds[0]) startIds.push(nodeIds[0])

  const adj = new Map<string, string[]>()
  for (const c of connections) {
    const list = adj.get(c.from) ?? []
    list.push(c.to)
    adj.set(c.from, list)
  }

  const depthMap = new Map<string, number>()
  const queue: { id: string; depth: number }[] = startIds.map((id) => ({
    id,
    depth: 0,
  }))
  const visited = new Set<string>()

  while (queue.length > 0) {
    const item = queue.shift()
    if (!item) break
    const { id, depth } = item

    if (visited.has(id)) {
      if ((depthMap.get(id) ?? 0) < depth) depthMap.set(id, depth)
      continue
    }
    visited.add(id)
    depthMap.set(id, depth)

    for (const next of adj.get(id) ?? []) {
      queue.push({ id: next, depth: depth + 1 })
    }
  }

  // Append unvisited nodes
  let maxDepth = Math.max(0, ...depthMap.values())
  for (const id of nodeIds) {
    if (!depthMap.has(id)) {
      depthMap.set(id, ++maxDepth)
    }
  }

  return Array.from(depthMap.entries())
    .sort((a, b) => a[1] - b[1])
    .map(([nodeId, depth]) => ({
      nodeId,
      depth,
      nodeType: nodeTypes?.[nodeId],
      demoConfig: demoConfigs?.[nodeId],
    }))
}

// ── Mock Artifact Templates ─────────────────────────────────────────────────

const MOCK_ARTIFACTS: Record<
  string,
  { type: Artifact['type']; label: string; url: string; contentPreview?: string }[]
> = {
  trigger: [],
  process: [
    {
      type: 'text',
      label: 'Verarbeitungsergebnis',
      url: '#',
      contentPreview: 'Daten erfolgreich verarbeitet und weitergeleitet.',
    },
  ],
  ai: [
    {
      type: 'text',
      label: 'KI-generierte E-Mail',
      url: '#',
      contentPreview:
        'Sehr geehrte(r) Kunde, vielen Dank für Ihre Anfrage. Wir haben Ihre Daten analysiert...',
    },
    {
      type: 'text',
      label: 'Content-Analyse',
      url: '#',
      contentPreview:
        'Analyse-Ergebnis: 87% positive Tonalität, empfohlene Anpassungen...',
    },
  ],
  output: [
    {
      type: 'file',
      label: 'Generierter Report',
      url: '#',
      contentPreview: 'Report mit 12 Seiten erstellt.',
    },
    {
      type: 'url',
      label: 'Erstellte Landing Page',
      url: 'https://example.com/lp',
    },
    {
      type: 'image',
      label: 'Social-Media-Grafik',
      url: '#',
      contentPreview: '1080×1080 PNG erstellt.',
    },
  ],
  subsystem: [
    {
      type: 'text',
      label: 'Sub-System Output',
      url: '#',
      contentPreview: 'Sub-System erfolgreich durchgelaufen.',
    },
  ],
}

// ── Callback Registry Helper ────────────────────────────────────────────────

type Callback<T> = (data: T) => void

function createCallbackRegistry<T>() {
  const callbacks: Callback<T>[] = []

  function subscribe(cb: Callback<T>): () => void {
    callbacks.push(cb)
    return () => {
      const idx = callbacks.indexOf(cb)
      if (idx !== -1) callbacks.splice(idx, 1)
    }
  }

  function emit(data: T) {
    for (const cb of [...callbacks]) cb(data)
  }

  function clear() {
    callbacks.length = 0
  }

  return { subscribe, emit, clear }
}

// ── Mock Event Source Factory ────────────────────────────────────────────────

export function createMockEventSource(): WorkflowEventSource {
  const timeouts: ReturnType<typeof setTimeout>[] = []
  const nodeStatusRegistry = createCallbackRegistry<NodeStatusEvent>()
  const artifactRegistry = createCallbackRegistry<Artifact>()
  const completeRegistry = createCallbackRegistry<WorkflowExecutionResult>()

  function clearAllTimeouts() {
    for (const t of timeouts) clearTimeout(t)
    timeouts.length = 0
  }

  return {
    execute(
      systemId: string,
      nodeIds: string[],
      connections: { from: string; to: string }[],
      nodeTypes?: Record<string, string>,
      demoConfigs?: Record<string, DemoNodeConfig>,
    ) {
      clearAllTimeouts()

      const executionId = `exec-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      const startedAt = new Date().toISOString()
      const schedule = computeBFSSchedule(nodeIds, connections, nodeTypes, demoConfigs)
      const finalStates: Record<string, NodeExecutionStatus> = {}

      // Track cumulative offset for variable delays
      const depthOffsets = new Map<number, number>()
      let cumulativeOffset = 0
      let lastDepth = -1

      for (const item of schedule) {
        if (item.depth !== lastDepth) {
          cumulativeOffset = depthOffsets.get(item.depth) ?? cumulativeOffset
          lastDepth = item.depth
        }

        const nodeDelay = item.demoConfig?.delay ?? 2000
        const baseDelay = cumulativeOffset

        // Pending
        timeouts.push(
          setTimeout(() => {
            nodeStatusRegistry.emit({
              nodeId: item.nodeId,
              status: 'pending',
              timestamp: Date.now(),
              message: 'Warte auf Vorgänger…',
            })
          }, baseDelay),
        )

        // Running
        timeouts.push(
          setTimeout(() => {
            nodeStatusRegistry.emit({
              nodeId: item.nodeId,
              status: 'running',
              timestamp: Date.now(),
              message: 'Wird ausgeführt…',
            })
          }, baseDelay + 400),
        )

        // Completed + Artifact
        timeouts.push(
          setTimeout(() => {
            nodeStatusRegistry.emit({
              nodeId: item.nodeId,
              status: 'completed',
              timestamp: Date.now(),
              message: 'Abgeschlossen',
            })
            finalStates[item.nodeId] = 'completed'

            // Use demoConfig artifacts if available, otherwise fall back to mock
            const demoArtifacts = item.demoConfig?.artifacts
            if (demoArtifacts && demoArtifacts.length > 0) {
              for (const da of demoArtifacts) {
                artifactRegistry.emit({
                  id: `artifact-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                  nodeId: item.nodeId,
                  type: da.type,
                  label: da.label,
                  url: da.url,
                  contentPreview: da.contentPreview,
                  createdAt: new Date().toISOString(),
                })
              }
            } else {
              // Fallback: generic mock artifacts
              const nodeType = item.nodeType ?? 'process'
              const templates =
                MOCK_ARTIFACTS[nodeType] ?? MOCK_ARTIFACTS['process'] ?? []
              if (templates.length > 0) {
                const tpl = templates[Math.floor(Math.random() * templates.length)]
                if (tpl) {
                  artifactRegistry.emit({
                    id: `artifact-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                    nodeId: item.nodeId,
                    type: tpl.type,
                    label: tpl.label,
                    url: tpl.url,
                    contentPreview: tpl.contentPreview,
                    createdAt: new Date().toISOString(),
                  })
                }
              }
            }
          }, baseDelay + nodeDelay),
        )

        // Update depth offset for next nodes at same or higher depth
        const nextOffset = baseDelay + nodeDelay + 300
        for (let d = item.depth + 1; d <= item.depth + 20; d++) {
          const existing = depthOffsets.get(d) ?? 0
          if (nextOffset > existing) depthOffsets.set(d, nextOffset)
        }
      }

      // Final completion
      const allDelays = schedule.map((item) => {
        const dc = item.demoConfig?.delay ?? 2000
        return (depthOffsets.get(item.depth) ?? item.depth * 2000) + dc
      })
      const totalDuration = Math.max(0, ...allDelays) + 500

      timeouts.push(
        setTimeout(() => {
          completeRegistry.emit({
            executionId,
            systemId,
            startedAt,
            completedAt: new Date().toISOString(),
            status: 'completed',
            nodeStates: finalStates,
            artifacts: [],
          })
        }, totalDuration),
      )
    },

    onNodeStatus(callback) {
      return nodeStatusRegistry.subscribe(callback)
    },

    onArtifact(callback) {
      return artifactRegistry.subscribe(callback)
    },

    onComplete(callback) {
      return completeRegistry.subscribe(callback)
    },

    abort() {
      clearAllTimeouts()
    },

    dispose() {
      clearAllTimeouts()
      nodeStatusRegistry.clear()
      artifactRegistry.clear()
      completeRegistry.clear()
    },
  }
}
