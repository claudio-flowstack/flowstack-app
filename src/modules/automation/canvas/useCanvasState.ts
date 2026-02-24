import { useState, useCallback, useRef } from 'react'
import type {
  SystemNode,
  NodeConnection,
  CanvasGroup,
  StickyNote,
  SubNode,
  NodeExecutionStatus,
} from '../domain/types'
import type { CurveStyle } from './helpers'
import { nodeW, nodeH } from './constants'

// ── Snapshot for Undo/Redo ──────────────────────────────────────────────────

interface CanvasSnapshot {
  nodes: SystemNode[]
  connections: NodeConnection[]
  groups: CanvasGroup[]
  stickyNotes: StickyNote[]
}

// ── Clipboard ───────────────────────────────────────────────────────────────

interface ClipboardData {
  nodes: SystemNode[]
  connections: NodeConnection[]
}

// ── Execution Data (per-node) ───────────────────────────────────────────────

export interface NodeExecutionData {
  input?: string
  output?: string
  duration?: number
  items?: number
}

// ── Canvas Settings ─────────────────────────────────────────────────────────

export interface CanvasSettings {
  // Connection styling
  connLineStyle: 'solid' | 'dashed' | 'dotted'
  connArrowHead: 'none' | 'arrow' | 'diamond' | 'circle'
  connColorTheme: string
  connCurveStyle: CurveStyle
  connGlow: boolean
  connStrokeWidth: 1 | 2 | 3
  connStyleMode: 'v3' | 'classic'
  showFlowDots: boolean

  // Node styling
  nodeDesignTheme: string
  nodeLayout: string
  showDescriptions: boolean
  showTypeBadges: boolean

  // Canvas
  snapEnabled: boolean
  showGrid: boolean
  showGroupBackgrounds: boolean
  scrollSpeed: number
}

const DEFAULT_SETTINGS: CanvasSettings = {
  connLineStyle: 'solid',
  connArrowHead: 'arrow',
  connColorTheme: 'purple',
  connCurveStyle: 'bezier',
  connGlow: false,
  connStrokeWidth: 2,
  connStyleMode: 'v3',
  showFlowDots: true,

  nodeDesignTheme: 'nodelab',
  nodeLayout: 'standard',
  showDescriptions: true,
  showTypeBadges: true,

  snapEnabled: true,
  showGrid: true,
  showGroupBackgrounds: true,
  scrollSpeed: 3,
}

// ── Sticky-to-Node Connection ───────────────────────────────────────────────

export interface StickyConnection {
  stickyId: string
  nodeId: string
}

// ── Main Canvas State ───────────────────────────────────────────────────────

export function useCanvasState(initial?: {
  nodes?: SystemNode[]
  connections?: NodeConnection[]
  groups?: CanvasGroup[]
  stickyNotes?: StickyNote[]
}) {
  // ── Data State ──────────────────────────────────────────────────────────

  const [nodes, setNodes] = useState<SystemNode[]>(initial?.nodes ?? [])
  const [connections, setConnections] = useState<NodeConnection[]>(
    initial?.connections ?? [],
  )
  const [groups, setGroups] = useState<CanvasGroup[]>(initial?.groups ?? [])
  const [stickyNotes, setStickyNotes] = useState<StickyNote[]>(
    initial?.stickyNotes ?? [],
  )

  // ── Selection ───────────────────────────────────────────────────────────

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [selectedConnIdx, setSelectedConnIdx] = useState<number | null>(null)
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)
  const [selectedStickyId, setSelectedStickyId] = useState<string | null>(null)
  const [multiSelectedIds, setMultiSelectedIds] = useState<Set<string>>(
    new Set(),
  )

  // ── Viewport ────────────────────────────────────────────────────────────

  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 40, y: 40 })

  // ── Canvas Settings ─────────────────────────────────────────────────────

  const [settings, setSettings] = useState<CanvasSettings>(DEFAULT_SETTINGS)

  // ── Clipboard (Copy/Paste) ──────────────────────────────────────────────

  const [clipboard, setClipboard] = useState<ClipboardData | null>(null)

  // ── Execution State ─────────────────────────────────────────────────────

  const [isExecuting, setIsExecuting] = useState(false)
  const [executingNodes, setExecutingNodes] = useState<
    Map<string, NodeExecutionStatus>
  >(new Map())
  const [executionDone, setExecutionDone] = useState(false)
  const [executionDataMap, setExecutionDataMap] = useState<
    Map<string, NodeExecutionData>
  >(new Map())

  // ── V2 Panels ──────────────────────────────────────────────────────────

  const [showHistory, setShowHistory] = useState(false)
  const [showInsights, setShowInsights] = useState(false)
  const [showVariables, setShowVariables] = useState(false)
  const [showExprEditor, setShowExprEditor] = useState(false)
  const [showVersioning, setShowVersioning] = useState(false)
  const [showFeatureLog, setShowFeatureLog] = useState(false)
  const [showPanelsMenu, setShowPanelsMenu] = useState(false)

  // ── Presentation Mode ──────────────────────────────────────────────────

  const [isPresentationMode, setIsPresentationMode] = useState(false)
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0)

  // ── Search ─────────────────────────────────────────────────────────────

  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // ── UI Overlays ────────────────────────────────────────────────────────

  const [showShortcuts, setShowShortcuts] = useState(false)
  const [showCanvasSettings, setShowCanvasSettings] = useState(false)

  // ── Sticky-to-Node Connections ─────────────────────────────────────────

  const [stickyConnections, setStickyConnections] = useState<
    StickyConnection[]
  >([])

  // ── Custom Node Colors & Pinned Nodes ─────────────────────────────────

  const [customNodeColors, setCustomNodeColors] = useState<
    Map<string, string>
  >(new Map())
  const [pinnedNodes, setPinnedNodes] = useState<Set<string>>(new Set())

  // ── Node Description Overrides ────────────────────────────────────────

  const [nodeDescOverrides, setNodeDescOverrides] = useState<
    Record<string, boolean>
  >({})

  // ── Selection Box (Rubber Band) ────────────────────────────────────

  const [selectionBox, setSelectionBox] = useState<{
    startX: number
    startY: number
    currentX: number
    currentY: number
  } | null>(null)

  // ── Inspect Panel ──────────────────────────────────────────────────

  const [inspectNodeId, setInspectNodeId] = useState<string | null>(null)

  // ── Toast ─────────────────────────────────────────────────────────

  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // ── Undo/Redo History ─────────────────────────────────────────────────

  const historyRef = useRef<CanvasSnapshot[]>([])
  const futureRef = useRef<CanvasSnapshot[]>([])
  const [historyVersion, setHistoryVersion] = useState(0)

  const pushHistory = useCallback(() => {
    historyRef.current.push({
      nodes: nodes.map((n) => ({ ...n, subNodes: n.subNodes?.map((s) => ({ ...s })) })),
      connections: connections.map((c) => ({ ...c })),
      groups: groups.map((g) => ({ ...g })),
      stickyNotes: stickyNotes.map((s) => ({ ...s })),
    })
    futureRef.current = []
    if (historyRef.current.length > 50) {
      historyRef.current = historyRef.current.slice(-50)
    }
    setHistoryVersion((v) => v + 1)
  }, [nodes, connections, groups, stickyNotes])

  const undo = useCallback(() => {
    const prev = historyRef.current.pop()
    if (!prev) return
    futureRef.current.push({
      nodes: nodes.map((n) => ({ ...n, subNodes: n.subNodes?.map((s) => ({ ...s })) })),
      connections: connections.map((c) => ({ ...c })),
      groups: groups.map((g) => ({ ...g })),
      stickyNotes: stickyNotes.map((s) => ({ ...s })),
    })
    setNodes(prev.nodes)
    setConnections(prev.connections)
    setGroups(prev.groups)
    setStickyNotes(prev.stickyNotes)
    setHistoryVersion((v) => v + 1)
  }, [nodes, connections, groups, stickyNotes])

  const redo = useCallback(() => {
    const next = futureRef.current.pop()
    if (!next) return
    historyRef.current.push({
      nodes: nodes.map((n) => ({ ...n, subNodes: n.subNodes?.map((s) => ({ ...s })) })),
      connections: connections.map((c) => ({ ...c })),
      groups: groups.map((g) => ({ ...g })),
      stickyNotes: stickyNotes.map((s) => ({ ...s })),
    })
    setNodes(next.nodes)
    setConnections(next.connections)
    setGroups(next.groups)
    setStickyNotes(next.stickyNotes)
    setHistoryVersion((v) => v + 1)
  }, [nodes, connections, groups, stickyNotes])

  // ── Node CRUD ─────────────────────────────────────────────────────────

  const addNode = useCallback(
    (node: SystemNode) => {
      pushHistory()
      setNodes((prev) => [...prev, node])
    },
    [pushHistory],
  )

  const updateNode = useCallback(
    (id: string, data: Partial<SystemNode>) => {
      setNodes((prev) =>
        prev.map((n) => (n.id === id ? { ...n, ...data } : n)),
      )
    },
    [],
  )

  const deleteNode = useCallback(
    (id: string) => {
      pushHistory()
      setNodes((prev) => prev.filter((n) => n.id !== id))
      setConnections((prev) =>
        prev.filter((c) => c.from !== id && c.to !== id),
      )
      setSelectedNodeId((prev) => (prev === id ? null : prev))
      setSelectedConnIdx(null) // indices shift after connection removal
    },
    [pushHistory],
  )

  const deleteMultipleNodes = useCallback(
    (ids: Set<string>) => {
      pushHistory()
      setNodes((prev) => prev.filter((n) => !ids.has(n.id)))
      setConnections((prev) =>
        prev.filter((c) => !ids.has(c.from) && !ids.has(c.to)),
      )
      setMultiSelectedIds(new Set())
      setSelectedNodeId(null)
    },
    [pushHistory],
  )

  // ── Sub-Node CRUD ─────────────────────────────────────────────────────

  const addSubNode = useCallback(
    (parentId: string, subNode: SubNode) => {
      pushHistory()
      setNodes((prev) =>
        prev.map((n) =>
          n.id === parentId
            ? { ...n, subNodes: [...(n.subNodes ?? []), subNode] }
            : n,
        ),
      )
    },
    [pushHistory],
  )

  const updateSubNode = useCallback(
    (parentId: string, subId: string, data: Partial<SubNode>) => {
      setNodes((prev) =>
        prev.map((n) =>
          n.id === parentId
            ? {
                ...n,
                subNodes: n.subNodes?.map((s) =>
                  s.id === subId ? { ...s, ...data } : s,
                ),
              }
            : n,
        ),
      )
    },
    [],
  )

  const deleteSubNode = useCallback(
    (parentId: string, subId: string) => {
      pushHistory()
      setNodes((prev) =>
        prev.map((n) =>
          n.id === parentId
            ? { ...n, subNodes: n.subNodes?.filter((s) => s.id !== subId) }
            : n,
        ),
      )
    },
    [pushHistory],
  )

  // ── Connection CRUD ───────────────────────────────────────────────────

  const addConnection = useCallback(
    (conn: NodeConnection) => {
      let added = false
      setConnections((prev) => {
        const exists = prev.some(
          (c) => c.from === conn.from && c.to === conn.to,
        )
        if (exists) return prev
        added = true
        return [...prev, conn]
      })
      if (added) pushHistory()
      return added
    },
    [pushHistory],
  )

  const deleteConnection = useCallback(
    (idx: number) => {
      pushHistory()
      setConnections((prev) => prev.filter((_, i) => i !== idx))
      setSelectedConnIdx((prev) => {
        if (prev === null) return null
        if (prev === idx) return null
        if (prev > idx) return prev - 1
        return prev
      })
    },
    [pushHistory],
  )

  const updateConnectionLabel = useCallback(
    (idx: number, label: string) => {
      setConnections((prev) =>
        prev.map((c, i) => (i === idx ? { ...c, label } : c)),
      )
    },
    [],
  )

  // ── Group CRUD ────────────────────────────────────────────────────────

  const addGroup = useCallback(
    (group: CanvasGroup) => {
      pushHistory()
      setGroups((prev) => [...prev, group])
    },
    [pushHistory],
  )

  const updateGroup = useCallback(
    (id: string, data: Partial<CanvasGroup>) => {
      setGroups((prev) =>
        prev.map((g) => (g.id === id ? { ...g, ...data } : g)),
      )
    },
    [],
  )

  const deleteGroup = useCallback(
    (id: string) => {
      pushHistory()
      setGroups((prev) => {
        const next = prev.filter((g) => g.id !== id)
        setCurrentPhaseIndex((pi) => (pi >= next.length ? Math.max(0, next.length - 1) : pi))
        return next
      })
      setSelectedGroupId((prev) => (prev === id ? null : prev))
    },
    [pushHistory],
  )

  // ── Sticky Note CRUD ──────────────────────────────────────────────────

  const addStickyNote = useCallback(
    (sticky: StickyNote) => {
      pushHistory()
      setStickyNotes((prev) => [...prev, sticky])
    },
    [pushHistory],
  )

  const updateStickyNote = useCallback(
    (id: string, data: Partial<StickyNote>) => {
      setStickyNotes((prev) =>
        prev.map((s) => (s.id === id ? { ...s, ...data } : s)),
      )
    },
    [],
  )

  const deleteStickyNote = useCallback(
    (id: string) => {
      pushHistory()
      setStickyNotes((prev) => prev.filter((s) => s.id !== id))
      if (selectedStickyId === id) setSelectedStickyId(null)
      setStickyConnections((prev) =>
        prev.filter((sc) => sc.stickyId !== id),
      )
    },
    [pushHistory, selectedStickyId],
  )

  // ── Sticky-to-Node Connection CRUD ────────────────────────────────────

  const addStickyConnection = useCallback(
    (stickyId: string, nodeId: string) => {
      setStickyConnections((prev) => {
        const exists = prev.some(
          (sc) => sc.stickyId === stickyId && sc.nodeId === nodeId,
        )
        if (exists) return prev
        return [...prev, { stickyId, nodeId }]
      })
    },
    [],
  )

  const removeStickyConnections = useCallback((stickyId: string) => {
    setStickyConnections((prev) =>
      prev.filter((sc) => sc.stickyId !== stickyId),
    )
  }, [])

  // ── Clear Selection ───────────────────────────────────────────────────

  const clearSelection = useCallback(() => {
    setSelectedNodeId(null)
    setSelectedConnIdx(null)
    setSelectedGroupId(null)
    setSelectedStickyId(null)
    setMultiSelectedIds(new Set())
  }, [])

  // ── Viewport Controls ─────────────────────────────────────────────────

  const zoomIn = useCallback(
    () => setZoom((z) => Math.min(z + 0.1, 3)),
    [],
  )
  const zoomOut = useCallback(
    () => setZoom((z) => Math.max(z - 0.1, 0.2)),
    [],
  )
  const resetView = useCallback(() => {
    setZoom(1)
    setPan({ x: 40, y: 40 })
  }, [])

  const fitToContent = useCallback((viewportW?: number, viewportH?: number) => {
    if (nodes.length === 0) return
    const vw = viewportW ?? window.innerWidth
    const vh = viewportH ?? window.innerHeight
    const minX = Math.min(...nodes.map((n) => n.x))
    const minY = Math.min(...nodes.map((n) => n.y))
    const maxX = Math.max(...nodes.map((n) => n.x + nodeW(n.type)))
    const maxY = Math.max(...nodes.map((n) => n.y + nodeH(n.type)))
    const contentW = maxX - minX + 100
    const contentH = maxY - minY + 100
    const newZoom = Math.min(
      Math.max(
        0.3,
        Math.min(vw / contentW, vh / contentH) * 0.85,
      ),
      1.5,
    )
    setZoom(newZoom)
    setPan({ x: -minX + 50, y: -minY + 50 })
  }, [nodes])

  // ── Copy/Paste ────────────────────────────────────────────────────────

  const copySelection = useCallback(() => {
    const ids =
      multiSelectedIds.size > 0
        ? multiSelectedIds
        : selectedNodeId
          ? new Set([selectedNodeId])
          : new Set<string>()
    if (ids.size === 0) return

    const selectedNodes = nodes.filter((n) => ids.has(n.id))
    const selectedConns = connections.filter(
      (c) => ids.has(c.from) && ids.has(c.to),
    )
    setClipboard({ nodes: selectedNodes, connections: selectedConns })
  }, [multiSelectedIds, selectedNodeId, nodes, connections])

  const pasteClipboard = useCallback(
    (offsetX = 40, offsetY = 40) => {
      if (!clipboard) return

      pushHistory()
      const idMap = new Map<string, string>()
      const newNodes = clipboard.nodes.map((n) => {
        const newId = `${n.id}-copy-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
        idMap.set(n.id, newId)
        return { ...n, id: newId, x: n.x + offsetX, y: n.y + offsetY }
      })
      const newConns = clipboard.connections
        .filter((c) => idMap.has(c.from) && idMap.has(c.to))
        .map((c) => ({
          ...c,
          from: idMap.get(c.from)!,
          to: idMap.get(c.to)!,
        }))

      setNodes((prev) => [...prev, ...newNodes])
      setConnections((prev) => [...prev, ...newConns])
      setMultiSelectedIds(new Set(newNodes.map((n) => n.id)))
    },
    [clipboard, pushHistory],
  )

  const cutSelection = useCallback(() => {
    copySelection()
    if (multiSelectedIds.size > 0) {
      deleteMultipleNodes(multiSelectedIds)
    } else if (selectedNodeId) {
      deleteNode(selectedNodeId)
    }
  }, [
    copySelection,
    multiSelectedIds,
    selectedNodeId,
    deleteMultipleNodes,
    deleteNode,
  ])

  // ── Panel Toggles ─────────────────────────────────────────────────────

  const closeAllPanels = useCallback(() => {
    setShowHistory(false)
    setShowInsights(false)
    setShowVariables(false)
    setShowExprEditor(false)
    setShowVersioning(false)
    setShowFeatureLog(false)
    setShowPanelsMenu(false)
  }, [])

  const togglePanel = useCallback(
    (
      panel:
        | 'history'
        | 'insights'
        | 'variables'
        | 'exprEditor'
        | 'versioning'
        | 'featureLog',
    ) => {
      const getters: Record<string, boolean> = {
        history: showHistory,
        insights: showInsights,
        variables: showVariables,
        exprEditor: showExprEditor,
        versioning: showVersioning,
        featureLog: showFeatureLog,
      }
      const wasOpen = getters[panel]
      closeAllPanels()
      if (!wasOpen) {
        const setters = {
          history: setShowHistory,
          insights: setShowInsights,
          variables: setShowVariables,
          exprEditor: setShowExprEditor,
          versioning: setShowVersioning,
          featureLog: setShowFeatureLog,
        }
        setters[panel](true)
      }
    },
    [closeAllPanels, showHistory, showInsights, showVariables, showExprEditor, showVersioning, showFeatureLog],
  )

  // ── Presentation Mode ─────────────────────────────────────────────────

  const togglePresentationMode = useCallback(() => {
    setIsPresentationMode((prev) => !prev)
  }, [])

  // ── Custom Node Colors ────────────────────────────────────────────────

  const setNodeColor = useCallback((nodeId: string, color: string | null) => {
    setCustomNodeColors((prev) => {
      const next = new Map(prev)
      if (color) {
        next.set(nodeId, color)
      } else {
        next.delete(nodeId)
      }
      return next
    })
  }, [])

  // ── Pin/Unpin Nodes ───────────────────────────────────────────────────

  const togglePinNode = useCallback((nodeId: string) => {
    setPinnedNodes((prev) => {
      const next = new Set(prev)
      if (next.has(nodeId)) next.delete(nodeId)
      else next.add(nodeId)
      return next
    })
  }, [])

  // ── Update Settings ───────────────────────────────────────────────────

  const updateSettings = useCallback(
    (updates: Partial<CanvasSettings>) => {
      setSettings((prev) => ({ ...prev, ...updates }))
    },
    [],
  )

  // ── Execution Controls ────────────────────────────────────────────────

  const startExecution = useCallback(() => {
    setIsExecuting(true)
    setExecutionDone(false)
    setExecutingNodes(new Map())
    setExecutionDataMap(new Map())
  }, [])

  const stopExecution = useCallback(() => {
    setIsExecuting(false)
    setExecutionDone(false)
    setExecutingNodes(new Map())
  }, [])

  const completeExecution = useCallback(() => {
    setIsExecuting(false)
    setExecutionDone(true)
  }, [])

  const updateNodeExecution = useCallback(
    (nodeId: string, status: NodeExecutionStatus) => {
      setExecutingNodes((prev) => {
        const next = new Map(prev)
        next.set(nodeId, status)
        return next
      })
    },
    [],
  )

  // ── Reset for system switch ───────────────────────────────────────────

  const resetForSystem = useCallback(
    (sys?: {
      nodes?: SystemNode[]
      connections?: NodeConnection[]
      groups?: CanvasGroup[]
      stickyNotes?: StickyNote[]
    }) => {
      setNodes(sys?.nodes ?? [])
      setConnections(sys?.connections ?? [])
      setGroups(sys?.groups ?? [])
      setStickyNotes(sys?.stickyNotes ?? [])
      // Clear selections
      setSelectedNodeId(null)
      setSelectedConnIdx(null)
      setSelectedGroupId(null)
      setSelectedStickyId(null)
      setMultiSelectedIds(new Set())
      // Clear execution
      setIsExecuting(false)
      setExecutingNodes(new Map())
      setExecutionDone(false)
      setExecutionDataMap(new Map())
      // Clear panels
      setShowHistory(false)
      setShowInsights(false)
      setShowVariables(false)
      setShowExprEditor(false)
      setShowVersioning(false)
      setShowFeatureLog(false)
      setShowPanelsMenu(false)
      // Clear presentation
      setIsPresentationMode(false)
      setCurrentPhaseIndex(0)
      // Clear search
      setSearchOpen(false)
      setSearchQuery('')
      // Clear overlays
      setShowShortcuts(false)
      setShowCanvasSettings(false)
      // Reset undo/redo
      historyRef.current = []
      futureRef.current = []
      // Reset viewport
      setZoom(1)
      setPan({ x: 40, y: 40 })
      // Clear custom state
      setCustomNodeColors(new Map())
      setPinnedNodes(new Set())
      setNodeDescOverrides(new Map())
      setClipboard(null)
      setStickyConnections([])
      setInspectNodeId(null)
      setSelectionBox(null)
    },
    [],
  )

  // ── Return ────────────────────────────────────────────────────────────

  return {
    // Data
    nodes,
    setNodes,
    connections,
    setConnections,
    groups,
    setGroups,
    stickyNotes,
    setStickyNotes,

    // Selection
    selectedNodeId,
    setSelectedNodeId,
    selectedConnIdx,
    setSelectedConnIdx,
    selectedGroupId,
    setSelectedGroupId,
    selectedStickyId,
    setSelectedStickyId,
    multiSelectedIds,
    setMultiSelectedIds,
    clearSelection,

    // Viewport
    zoom,
    setZoom,
    pan,
    setPan,
    zoomIn,
    zoomOut,
    resetView,
    fitToContent,

    // Settings
    settings,
    updateSettings,

    // Clipboard
    clipboard,
    copySelection,
    pasteClipboard,
    cutSelection,

    // Execution
    isExecuting,
    executingNodes,
    executionDone,
    executionDataMap,
    setExecutionDataMap,
    startExecution,
    stopExecution,
    completeExecution,
    updateNodeExecution,

    // V2 Panels
    showHistory,
    setShowHistory,
    showInsights,
    setShowInsights,
    showVariables,
    setShowVariables,
    showExprEditor,
    setShowExprEditor,
    showVersioning,
    setShowVersioning,
    showFeatureLog,
    setShowFeatureLog,
    showPanelsMenu,
    setShowPanelsMenu,
    closeAllPanels,
    togglePanel,

    // Presentation Mode
    isPresentationMode,
    setIsPresentationMode,
    togglePresentationMode,
    currentPhaseIndex,
    setCurrentPhaseIndex,

    // Search
    searchOpen,
    setSearchOpen,
    searchQuery,
    setSearchQuery,

    // UI Overlays
    showShortcuts,
    setShowShortcuts,
    showCanvasSettings,
    setShowCanvasSettings,

    // Sticky Connections
    stickyConnections,
    addStickyConnection,
    removeStickyConnections,

    // Custom Node Colors & Pins
    customNodeColors,
    setNodeColor,
    pinnedNodes,
    togglePinNode,

    // Node Description Overrides
    nodeDescOverrides,
    setNodeDescOverrides,

    // Selection Box (Rubber Band)
    selectionBox,
    setSelectionBox,

    // Inspect Panel
    inspectNodeId,
    setInspectNodeId,

    // Toast
    toastMessage,
    setToastMessage,

    // CRUD
    addNode,
    updateNode,
    deleteNode,
    deleteMultipleNodes,
    addSubNode,
    updateSubNode,
    deleteSubNode,
    addConnection,
    deleteConnection,
    updateConnectionLabel,
    addGroup,
    updateGroup,
    deleteGroup,
    addStickyNote,
    updateStickyNote,
    deleteStickyNote,

    // History
    undo,
    redo,
    pushHistory,
    canUndo: historyRef.current.length > 0,
    canRedo: futureRef.current.length > 0,

    // System reset
    resetForSystem,
  }
}

export type CanvasState = ReturnType<typeof useCanvasState>
