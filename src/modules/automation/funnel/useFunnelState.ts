import { useState, useCallback, useRef } from 'react'
import type {
  FunnelElement,
  FunnelConnection,
  FunnelPhase,
  FunnelBoard,
  FunnelSnapshot,
  PortDirection,
} from '../domain/types'
import { SNAP_THRESHOLD } from './constants'
import { computeSnapGuides, computeFitToScreen } from './helpers'

// ── Snapshot for Undo/Redo ──────────────────────────────────────────────────

interface ClipboardData {
  elements: FunnelElement[]
  connections: FunnelConnection[]
}

// ── Global Style Defaults ───────────────────────────────────────────────────

export interface FunnelGlobalStyles {
  connLineStyle: 'solid' | 'dashed' | 'dotted'
  connThickness: 'thin' | 'normal' | 'thick'
  connCurve: 'bezier' | 'straight' | 'step'
  connColor: string
  connAnimation: 'dot' | 'none' | 'pulse'
  connArrowhead: 'filled' | 'open' | 'none'
  nodeStyle: 'default' | 'rounded' | 'sharp' | 'pill' | 'card'
  nodeShadow: 'none' | 'sm' | 'md' | 'lg'
}

const DEFAULT_GLOBAL_STYLES: FunnelGlobalStyles = {
  connLineStyle: 'solid',
  connThickness: 'normal',
  connCurve: 'bezier',
  connColor: '#a855f7',
  connAnimation: 'none',
  connArrowhead: 'filled',
  nodeStyle: 'default',
  nodeShadow: 'md',
}

// ── Drag / Resize / Connect State ───────────────────────────────────────────

interface DragState {
  id: string
  offsetX: number
  offsetY: number
}

interface ResizeState {
  id: string
  startX: number
  startY: number
  startW: number
  startH: number
}

interface ConnectState {
  fromId: string
  fromPort: PortDirection
  canvasX: number
  canvasY: number
}

// ── History Stack Size ──────────────────────────────────────────────────────

const MAX_HISTORY = 40

// ── Main Hook ───────────────────────────────────────────────────────────────

export function useFunnelState(initial?: {
  elements?: FunnelElement[]
  connections?: FunnelConnection[]
  phases?: FunnelPhase[]
}) {
  // ── Canvas Data ─────────────────────────────────────────────────────────

  const [elements, setElements] = useState<FunnelElement[]>(initial?.elements ?? [])
  const [connections, setConnections] = useState<FunnelConnection[]>(initial?.connections ?? [])
  const [phases, setPhases] = useState<FunnelPhase[]>(initial?.phases ?? [])

  // ── Selection ───────────────────────────────────────────────────────────

  const [selectedElementId, setSelectedElementId] = useState<string | null>(null)
  const [selectedConnId, setSelectedConnId] = useState<string | null>(null)
  const [selectedPhaseId, setSelectedPhaseId] = useState<string | null>(null)
  const [multiSelectedIds, setMultiSelectedIds] = useState<Set<string>>(new Set())

  // ── Drag / Resize ─────────────────────────────────────────────────────

  const [dragState, setDragState] = useState<DragState | null>(null)
  const [resizeState, setResizeState] = useState<ResizeState | null>(null)

  // ── Connection Drawing ────────────────────────────────────────────────

  const [connectState, setConnectState] = useState<ConnectState | null>(null)

  // ── Zoom / Pan ────────────────────────────────────────────────────────

  const [zoom, setZoomRaw] = useState(1)
  const [pan, setPan] = useState({ x: 40, y: 40 })
  const [isPanning, setIsPanning] = useState(false)

  // ── UI Toggles ────────────────────────────────────────────────────────

  const [paletteOpen, setPaletteOpen] = useState(false)
  const [showGrid, setShowGrid] = useState(true)
  const [showMinimap, setShowMinimap] = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [showGlobalStyles, setShowGlobalStyles] = useState(false)
  const [showHistoryPanel, setShowHistoryPanel] = useState(false)
  const [snapEnabled, setSnapEnabled] = useState(true)

  // ── Edit States ───────────────────────────────────────────────────────

  const [editElementId, setEditElementId] = useState<string | null>(null)
  const [editConnId, setEditConnId] = useState<string | null>(null)

  // ── Global Styles ─────────────────────────────────────────────────────

  const [globalStyles, setGlobalStyles] = useState<FunnelGlobalStyles>(DEFAULT_GLOBAL_STYLES)

  // ── Undo / Redo History (refs) ────────────────────────────────────────

  const historyRef = useRef<FunnelSnapshot[]>([])
  const futureRef = useRef<FunnelSnapshot[]>([])

  // ── Clipboard (ref) ───────────────────────────────────────────────────

  const clipboardRef = useRef<ClipboardData | null>(null)

  // ── History helpers ───────────────────────────────────────────────────

  const pushHistory = useCallback(() => {
    historyRef.current.push({
      elements: elements.map((e) => ({ ...e })),
      connections: connections.map((c) => ({ ...c })),
      phases: phases.map((p) => ({ ...p })),
    })
    futureRef.current = []
    if (historyRef.current.length > MAX_HISTORY) {
      historyRef.current = historyRef.current.slice(-MAX_HISTORY)
    }
  }, [elements, connections, phases])

  const undo = useCallback(() => {
    const prev = historyRef.current.pop()
    if (!prev) return
    futureRef.current.push({
      elements: elements.map((e) => ({ ...e })),
      connections: connections.map((c) => ({ ...c })),
      phases: phases.map((p) => ({ ...p })),
    })
    setElements(prev.elements)
    setConnections(prev.connections)
    setPhases(prev.phases)
  }, [elements, connections, phases])

  const redo = useCallback(() => {
    const next = futureRef.current.pop()
    if (!next) return
    historyRef.current.push({
      elements: elements.map((e) => ({ ...e })),
      connections: connections.map((c) => ({ ...c })),
      phases: phases.map((p) => ({ ...p })),
    })
    setElements(next.elements)
    setConnections(next.connections)
    setPhases(next.phases)
  }, [elements, connections, phases])

  // ── Element CRUD ──────────────────────────────────────────────────────

  const addElement = useCallback(
    (element: Omit<FunnelElement, 'id'>): string => {
      const id = crypto.randomUUID()
      pushHistory()
      setElements((prev) => [...prev, { ...element, id } as FunnelElement])
      return id
    },
    [pushHistory],
  )

  const updateElement = useCallback(
    (id: string, updates: Partial<FunnelElement>) => {
      pushHistory()
      setElements((prev) =>
        prev.map((e) => (e.id === id ? { ...e, ...updates } : e)),
      )
    },
    [pushHistory],
  )

  const deleteElement = useCallback(
    (id: string) => {
      pushHistory()
      setElements((prev) => prev.filter((e) => e.id !== id))
      setConnections((prev) =>
        prev.filter((c) => c.from !== id && c.to !== id),
      )
      if (selectedElementId === id) setSelectedElementId(null)
      setMultiSelectedIds((prev) => {
        if (!prev.has(id)) return prev
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    },
    [pushHistory, selectedElementId],
  )

  const duplicateElement = useCallback(
    (id: string) => {
      const original = elements.find((e) => e.id === id)
      if (!original) return
      const newId = crypto.randomUUID()
      pushHistory()
      setElements((prev) => [
        ...prev,
        { ...original, id: newId, x: original.x + 30, y: original.y + 30 },
      ])
    },
    [elements, pushHistory],
  )

  // ── Connection CRUD ───────────────────────────────────────────────────

  const addConnection = useCallback(
    (conn: Omit<FunnelConnection, 'id'>): string => {
      const id = crypto.randomUUID()
      pushHistory()
      setConnections((prev) => [...prev, { ...conn, id } as FunnelConnection])
      return id
    },
    [pushHistory],
  )

  const updateConnection = useCallback(
    (id: string, updates: Partial<FunnelConnection>) => {
      pushHistory()
      setConnections((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...updates } : c)),
      )
    },
    [pushHistory],
  )

  const deleteConnection = useCallback(
    (id: string) => {
      pushHistory()
      setConnections((prev) => prev.filter((c) => c.id !== id))
      if (selectedConnId === id) setSelectedConnId(null)
    },
    [pushHistory, selectedConnId],
  )

  // ── Phase CRUD ────────────────────────────────────────────────────────

  const addPhase = useCallback(
    (phase: Omit<FunnelPhase, 'id'>): string => {
      const id = crypto.randomUUID()
      pushHistory()
      setPhases((prev) => [...prev, { ...phase, id } as FunnelPhase])
      return id
    },
    [pushHistory],
  )

  const updatePhase = useCallback(
    (id: string, updates: Partial<FunnelPhase>) => {
      pushHistory()
      setPhases((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...updates } : p)),
      )
    },
    [pushHistory],
  )

  const deletePhase = useCallback(
    (id: string) => {
      pushHistory()
      setPhases((prev) => prev.filter((p) => p.id !== id))
      if (selectedPhaseId === id) setSelectedPhaseId(null)
    },
    [pushHistory, selectedPhaseId],
  )

  // ── Selection ─────────────────────────────────────────────────────────

  const selectElement = useCallback((id: string | null) => {
    setSelectedElementId(id)
    setSelectedConnId(null)
    setSelectedPhaseId(null)
    if (id) setMultiSelectedIds(new Set())
  }, [])

  const selectConnection = useCallback((id: string | null) => {
    setSelectedConnId(id)
    setSelectedElementId(null)
    setSelectedPhaseId(null)
    setMultiSelectedIds(new Set())
  }, [])

  const selectPhase = useCallback((id: string | null) => {
    setSelectedPhaseId(id)
    setSelectedElementId(null)
    setSelectedConnId(null)
    setMultiSelectedIds(new Set())
  }, [])

  const toggleMultiSelect = useCallback((id: string) => {
    setMultiSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
    setSelectedElementId(null)
    setSelectedConnId(null)
    setSelectedPhaseId(null)
  }, [])

  const selectAll = useCallback(() => {
    setMultiSelectedIds(new Set(elements.map((e) => e.id)))
    setSelectedElementId(null)
    setSelectedConnId(null)
    setSelectedPhaseId(null)
  }, [elements])

  const deselectAll = useCallback(() => {
    setSelectedElementId(null)
    setSelectedConnId(null)
    setSelectedPhaseId(null)
    setMultiSelectedIds(new Set())
  }, [])

  const deleteSelected = useCallback(() => {
    pushHistory()

    if (multiSelectedIds.size > 0) {
      setElements((prev) => prev.filter((e) => !multiSelectedIds.has(e.id)))
      setConnections((prev) =>
        prev.filter((c) => !multiSelectedIds.has(c.from) && !multiSelectedIds.has(c.to)),
      )
      setMultiSelectedIds(new Set())
      setSelectedElementId(null)
      return
    }

    if (selectedElementId) {
      setElements((prev) => prev.filter((e) => e.id !== selectedElementId))
      setConnections((prev) =>
        prev.filter((c) => c.from !== selectedElementId && c.to !== selectedElementId),
      )
      setSelectedElementId(null)
      return
    }

    if (selectedConnId) {
      setConnections((prev) => prev.filter((c) => c.id !== selectedConnId))
      setSelectedConnId(null)
      return
    }

    if (selectedPhaseId) {
      setPhases((prev) => prev.filter((p) => p.id !== selectedPhaseId))
      setSelectedPhaseId(null)
    }
  }, [pushHistory, multiSelectedIds, selectedElementId, selectedConnId, selectedPhaseId])

  // ── Drag ──────────────────────────────────────────────────────────────

  const startDrag = useCallback((id: string, offsetX: number, offsetY: number) => {
    setDragState({ id, offsetX, offsetY })
  }, [])

  const updateDrag = useCallback(
    (canvasX: number, canvasY: number) => {
      if (!dragState) return

      let newX = canvasX - dragState.offsetX
      let newY = canvasY - dragState.offsetY

      if (snapEnabled) {
        const result = computeSnapGuides(dragState.id, newX, newY, elements, SNAP_THRESHOLD)
        newX = result.snappedX
        newY = result.snappedY
      }

      setElements((prev) =>
        prev.map((e) => (e.id === dragState.id ? { ...e, x: newX, y: newY } : e)),
      )
    },
    [dragState, snapEnabled, elements],
  )

  const endDrag = useCallback(() => {
    if (dragState) pushHistory()
    setDragState(null)
  }, [dragState, pushHistory])

  // ── Resize ────────────────────────────────────────────────────────────

  const startResize = useCallback(
    (id: string, startX: number, startY: number) => {
      const el = elements.find((e) => e.id === id)
      if (!el) return
      setResizeState({ id, startX, startY, startW: el.width, startH: el.height })
    },
    [elements],
  )

  const updateResize = useCallback(
    (canvasX: number, canvasY: number) => {
      if (!resizeState) return
      const dx = canvasX - resizeState.startX
      const dy = canvasY - resizeState.startY
      const newW = Math.max(60, resizeState.startW + dx)
      const newH = Math.max(40, resizeState.startH + dy)

      setElements((prev) =>
        prev.map((e) =>
          e.id === resizeState.id ? { ...e, width: newW, height: newH } : e,
        ),
      )
    },
    [resizeState],
  )

  const endResize = useCallback(() => {
    if (resizeState) pushHistory()
    setResizeState(null)
  }, [resizeState, pushHistory])

  // ── Connection Drawing ────────────────────────────────────────────────

  const startConnect = useCallback(
    (fromId: string, fromPort: PortDirection) => {
      const el = elements.find((e) => e.id === fromId)
      if (!el) return
      setConnectState({ fromId, fromPort, canvasX: el.x, canvasY: el.y })
    },
    [elements],
  )

  const updateConnect = useCallback((canvasX: number, canvasY: number) => {
    setConnectState((prev) => (prev ? { ...prev, canvasX, canvasY } : null))
  }, [])

  const endConnect = useCallback(
    (toId: string, toPort: PortDirection) => {
      if (!connectState) return
      if (connectState.fromId === toId) {
        setConnectState(null)
        return
      }

      // Prevent duplicate connections
      const exists = connections.some(
        (c) => c.from === connectState.fromId && c.to === toId,
      )
      if (!exists) {
        pushHistory()
        const id = crypto.randomUUID()
        setConnections((prev) => [
          ...prev,
          { id, from: connectState.fromId, to: toId, fromPort: connectState.fromPort, toPort },
        ])
      }
      setConnectState(null)
    },
    [connectState, connections, pushHistory],
  )

  const cancelConnect = useCallback(() => {
    setConnectState(null)
  }, [])

  // ── Zoom / Pan ────────────────────────────────────────────────────────

  const zoomIn = useCallback(
    () => setZoomRaw((z) => Math.min(z + 0.1, 3)),
    [],
  )

  const zoomOut = useCallback(
    () => setZoomRaw((z) => Math.max(z - 0.1, 0.2)),
    [],
  )

  const setZoom = useCallback((value: number) => {
    setZoomRaw(Math.min(3, Math.max(0.2, value)))
  }, [])

  const fitToScreen = useCallback(
    (containerWidth: number, containerHeight: number) => {
      const result = computeFitToScreen(elements, containerWidth, containerHeight)
      setZoomRaw(result.zoom)
      setPan(result.pan)
    },
    [elements],
  )

  const resetView = useCallback(() => {
    setZoomRaw(1)
    setPan({ x: 40, y: 40 })
  }, [])

  // ── Copy / Paste ──────────────────────────────────────────────────────

  const copySelected = useCallback(() => {
    const ids =
      multiSelectedIds.size > 0
        ? multiSelectedIds
        : selectedElementId
          ? new Set([selectedElementId])
          : new Set<string>()
    if (ids.size === 0) return

    const copiedElements = elements.filter((e) => ids.has(e.id))
    const copiedConns = connections.filter(
      (c) => ids.has(c.from) && ids.has(c.to),
    )
    clipboardRef.current = { elements: copiedElements, connections: copiedConns }
  }, [multiSelectedIds, selectedElementId, elements, connections])

  const pasteClipboard = useCallback(
    (offsetX = 40, offsetY = 40) => {
      if (!clipboardRef.current) return

      pushHistory()
      const idMap = new Map<string, string>()

      const newElements = clipboardRef.current.elements.map((e) => {
        const newId = crypto.randomUUID()
        idMap.set(e.id, newId)
        return { ...e, id: newId, x: e.x + offsetX, y: e.y + offsetY }
      })

      const newConns = clipboardRef.current.connections
        .map((c) => ({
          ...c,
          id: crypto.randomUUID(),
          from: idMap.get(c.from) ?? c.from,
          to: idMap.get(c.to) ?? c.to,
        }))
        .filter((c) => idMap.has(c.from) || idMap.has(c.to))

      setElements((prev) => [...prev, ...newElements])
      setConnections((prev) => [...prev, ...newConns])
      setMultiSelectedIds(new Set(newElements.map((e) => e.id)))
      setSelectedElementId(null)
    },
    [pushHistory],
  )

  // ── Load Board / Get Snapshot ─────────────────────────────────────────

  const loadBoard = useCallback((board: FunnelBoard) => {
    setElements(board.elements)
    setConnections(board.connections)
    setPhases(board.phases)
    historyRef.current = []
    futureRef.current = []
    setSelectedElementId(null)
    setSelectedConnId(null)
    setSelectedPhaseId(null)
    setMultiSelectedIds(new Set())
  }, [])

  const getSnapshot = useCallback(
    (): FunnelSnapshot => ({
      elements: elements.map((e) => ({ ...e })),
      connections: connections.map((c) => ({ ...c })),
      phases: phases.map((p) => ({ ...p })),
    }),
    [elements, connections, phases],
  )

  // ── UI Toggles ────────────────────────────────────────────────────────

  const togglePalette = useCallback(() => {
    setPaletteOpen((prev) => !prev)
  }, [])

  const updateGlobalStyles = useCallback(
    (updates: Partial<FunnelGlobalStyles>) => {
      setGlobalStyles((prev) => ({ ...prev, ...updates }))
    },
    [],
  )

  // ── Return ────────────────────────────────────────────────────────────

  return {
    // Canvas data
    elements,
    connections,
    phases,

    // Selection
    selectedElementId,
    selectedConnId,
    selectedPhaseId,
    multiSelectedIds,

    // Drag / Resize
    dragState,
    resizeState,

    // Connection drawing
    connectState,

    // Zoom / Pan
    zoom,
    pan,
    isPanning,
    setIsPanning,

    // UI toggles
    paletteOpen,
    showGrid,
    setShowGrid,
    showMinimap,
    setShowMinimap,
    showShortcuts,
    setShowShortcuts,
    showGlobalStyles,
    setShowGlobalStyles,
    showHistoryPanel,
    setShowHistoryPanel,
    snapEnabled,
    setSnapEnabled,

    // Edit states
    editElementId,
    editConnId,

    // Undo / Redo
    canUndo: historyRef.current.length > 0,
    canRedo: futureRef.current.length > 0,

    // Global styles
    globalStyles,

    // ── Methods ───────────────────────────────────────────────────────

    // Element CRUD
    addElement,
    updateElement,
    deleteElement,
    duplicateElement,

    // Connection CRUD
    addConnection,
    updateConnection,
    deleteConnection,

    // Phase CRUD
    addPhase,
    updatePhase,
    deletePhase,

    // Selection
    selectElement,
    selectConnection,
    selectPhase,
    toggleMultiSelect,
    selectAll,
    deselectAll,
    deleteSelected,

    // Drag
    startDrag,
    updateDrag,
    endDrag,

    // Resize
    startResize,
    updateResize,
    endResize,

    // Connection drawing
    startConnect,
    updateConnect,
    endConnect,
    cancelConnect,

    // Zoom / Pan
    zoomIn,
    zoomOut,
    setZoom,
    setPan,
    fitToScreen,
    resetView,

    // Undo / Redo
    undo,
    redo,

    // Copy / Paste
    copySelected,
    pasteClipboard,

    // Load / Snapshot
    loadBoard,
    getSnapshot,

    // UI toggles
    setEditElementId,
    setEditConnId,
    togglePalette,
    updateGlobalStyles,
  }
}

export type FunnelState = ReturnType<typeof useFunnelState>
