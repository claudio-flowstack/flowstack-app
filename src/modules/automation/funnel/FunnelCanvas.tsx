import {
  useRef,
  useEffect,
  useCallback,
  useMemo,
  useState,
} from 'react'
import type {
  FunnelBoard,
  FunnelElement,
  FunnelConnection as FunnelConnectionType,
  FunnelPhase,
  PortDirection,
  MockupKind,
} from '../domain/types'
import { cn } from '@/shared/lib/utils'
import { useFunnelState } from './useFunnelState'
import { FunnelNode } from './FunnelNode'
import { FunnelConnection } from './FunnelConnection'
import MockupFrame from './MockupFrame'
import { FunnelToolbar } from './FunnelToolbar'
import { FunnelPalette } from './FunnelPalette'
import {
  getTempConnectionPath,
  screenToCanvas,
  computeSnapGuides,
} from './helpers'
import {
  SNAP_THRESHOLD,
  FUNNEL_TEMPLATES,
  ELEMENT_DEFAULTS,
} from './constants'
import {
  Image as ImageIcon, Play, Trash2, Copy, Pencil, X,
} from 'lucide-react'

// ── Constants ────────────────────────────────────────────────────────────────

const GRID_DOT_SPACING = 24
const GRID_DOT_RADIUS = 0.8
const AUTO_SAVE_DEBOUNCE_MS = 2000
const MIN_ZOOM = 0.2
const MAX_ZOOM = 3
const ZOOM_SENSITIVITY = 0.001
const LASSO_MIN_SIZE = 5

// ── Inline sub-components ────────────────────────────────────────────────────

interface TextBlockProps {
  element: FunnelElement
  isSelected: boolean
  isMultiSelected: boolean
  onMouseDown: (e: React.MouseEvent) => void
  onDoubleClick: (e: React.MouseEvent) => void
}

function TextBlock({
  element,
  isSelected,
  isMultiSelected,
  onMouseDown,
  onDoubleClick,
}: TextBlockProps) {
  return (
    <div
      className={cn(
        'absolute select-none cursor-move transition-shadow duration-200',
        isSelected && 'ring-2 ring-primary ring-offset-1 ring-offset-transparent rounded-md',
        isMultiSelected && !isSelected && 'ring-2 ring-blue-400 ring-offset-1 ring-offset-transparent rounded-md',
      )}
      style={{
        left: element.x,
        top: element.y,
        width: element.width,
        height: element.height,
        fontSize: element.fontSize ?? 14,
        fontWeight: element.fontWeight === 'bold' ? 700 : 400,
        color: element.textColor ?? 'inherit',
        textAlign: element.textAlign ?? 'left',
        lineHeight: 1.4,
        backgroundColor: element.backgroundColor ?? 'transparent',
      }}
      onMouseDown={(e) => {
        e.stopPropagation()
        onMouseDown(e)
      }}
      onDoubleClick={(e) => {
        e.stopPropagation()
        onDoubleClick(e)
      }}
    >
      <div className="w-full h-full overflow-hidden px-1 flex items-center">
        <span className="w-full whitespace-pre-wrap break-words text-foreground">
          {element.textContent || element.label || 'Text'}
        </span>
      </div>
    </div>
  )
}

interface MediaBlockProps {
  element: FunnelElement
  isSelected: boolean
  isMultiSelected: boolean
  onMouseDown: (e: React.MouseEvent) => void
  onDoubleClick: (e: React.MouseEvent) => void
}

function MediaBlock({
  element,
  isSelected,
  isMultiSelected,
  onMouseDown,
  onDoubleClick,
}: MediaBlockProps) {
  const isVideo = element.label?.toLowerCase().includes('video')

  return (
    <div
      className={cn(
        'absolute select-none cursor-move rounded-xl overflow-hidden border-2 border-dashed transition-shadow duration-200',
        'border-zinc-300 dark:border-zinc-600 bg-zinc-100 dark:bg-zinc-800/60',
        isSelected && 'ring-2 ring-primary ring-offset-1 ring-offset-transparent',
        isMultiSelected && !isSelected && 'ring-2 ring-blue-400 ring-offset-1 ring-offset-transparent',
      )}
      style={{
        left: element.x,
        top: element.y,
        width: element.width,
        height: element.height,
      }}
      onMouseDown={(e) => {
        e.stopPropagation()
        onMouseDown(e)
      }}
      onDoubleClick={(e) => {
        e.stopPropagation()
        onDoubleClick(e)
      }}
    >
      {element.mediaUrl ? (
        <img
          src={element.mediaUrl}
          alt={element.mediaAlt ?? ''}
          className="w-full h-full object-cover"
          draggable={false}
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-muted-foreground">
          {isVideo ? (
            <Play className="h-8 w-8" />
          ) : (
            <ImageIcon className="h-8 w-8" />
          )}
          <span className="text-xs font-medium">
            {element.label || (isVideo ? 'Video' : 'Bild')}
          </span>
        </div>
      )}
    </div>
  )
}

// ── Props ────────────────────────────────────────────────────────────────────

interface FunnelCanvasProps {
  initialBoard?: FunnelBoard
  onSave?: (data: { elements: FunnelElement[]; connections: FunnelConnectionType[]; phases: FunnelPhase[] }) => void
  className?: string
}

// ── Component ────────────────────────────────────────────────────────────────

export function FunnelCanvas({
  initialBoard,
  onSave,
  className,
}: FunnelCanvasProps) {
  // ── State hook ───────────────────────────────────────────────────────────

  const state = useFunnelState(
    initialBoard
      ? {
          elements: initialBoard.elements,
          connections: initialBoard.connections,
          phases: initialBoard.phases,
        }
      : undefined,
  )

  const {
    elements,
    connections,
    phases,
    selectedElementId,
    selectedConnId,
    selectedPhaseId,
    multiSelectedIds,
    dragState,
    resizeState,
    connectState,
    zoom,
    pan,
    isPanning,
    paletteOpen,
    showGrid,
    showMinimap,
    showShortcuts,
    snapEnabled,
    editElementId,
    canUndo,
    canRedo,
    globalStyles,
    // Methods
    addElement,
    updateElement,
    deleteElement,
    duplicateElement,
    addConnection,
    updateConnection,
    deleteConnection,
    addPhase,
    updatePhase,
    deletePhase,
    selectElement,
    selectConnection,
    selectPhase,
    toggleMultiSelect,
    selectAll,
    deselectAll,
    deleteSelected,
    startDrag,
    updateDrag,
    endDrag,
    startResize,
    updateResize,
    endResize,
    startConnect,
    updateConnect,
    endConnect,
    cancelConnect,
    zoomIn,
    zoomOut,
    setZoom,
    setPan,
    fitToScreen,
    resetView,
    undo,
    redo,
    copySelected,
    pasteClipboard,
    loadBoard,
    getSnapshot,
    setEditElementId,
    togglePalette,
    setShowGrid,
    setShowMinimap,
    setShowShortcuts,
    setIsPanning,
    setSnapEnabled,
    setShowGlobalStyles,
    setShowHistoryPanel,
    updateGlobalStyles,
  } = state

  // ── Refs ──────────────────────────────────────────────────────────────────

  const canvasRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const panStartRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null)
  const spaceHeldRef = useRef(false)
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Local UI state ────────────────────────────────────────────────────────

  const [lassoRect, setLassoRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null)
  const lassoStartRef = useRef<{ x: number; y: number } | null>(null)
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isPresentationMode, setIsPresentationMode] = useState(false)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; elementId: string } | null>(null)
  const [showPropertyPanel, setShowPropertyPanel] = useState(false)

  // ── Snap guides (computed during drag) ────────────────────────────────────

  const snapGuides = useMemo(() => {
    if (!dragState || !snapEnabled) return []
    const dragging = elements.find((e) => e.id === dragState.id)
    if (!dragging) return []
    return computeSnapGuides(
      dragState.id,
      dragging.x,
      dragging.y,
      elements,
      SNAP_THRESHOLD,
    ).guides
  }, [dragState, snapEnabled, elements])

  // ── Load initial board ────────────────────────────────────────────────────

  useEffect(() => {
    if (initialBoard) {
      loadBoard(initialBoard)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialBoard?.id])

  // ── Auto-save with debounce ───────────────────────────────────────────────

  useEffect(() => {
    if (!onSave) return

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current)
    }

    autoSaveTimerRef.current = setTimeout(() => {
      const snapshot = getSnapshot()
      onSave(snapshot)
    }, AUTO_SAVE_DEBOUNCE_MS)

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elements, connections, phases])

  // ── Save handler (manual) ─────────────────────────────────────────────────

  const handleSave = useCallback(() => {
    if (!onSave) return
    setSaveState('saving')
    const snapshot = getSnapshot()
    onSave(snapshot)
    setTimeout(() => setSaveState('saved'), 300)
    setTimeout(() => setSaveState('idle'), 2000)
  }, [onSave, getSnapshot])

  // ── Screen-to-canvas coordinate helper ────────────────────────────────────

  const toCanvas = useCallback(
    (screenX: number, screenY: number) => {
      const rect = canvasRef.current?.getBoundingClientRect()
      if (!rect) return { x: 0, y: 0 }
      return screenToCanvas(screenX - rect.left, screenY - rect.top, pan, zoom)
    },
    [pan, zoom],
  )

  // ── Keyboard shortcuts ────────────────────────────────────────────────────

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const meta = e.metaKey || e.ctrlKey
      const target = e.target as HTMLElement
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable

      // Space for pan mode
      if (e.code === 'Space' && !isInput) {
        e.preventDefault()
        spaceHeldRef.current = true
        setIsPanning(true)
      }

      if (isInput) return

      // Delete / Backspace
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault()
        deleteSelected()
        return
      }

      // Escape
      if (e.key === 'Escape') {
        e.preventDefault()
        deselectAll()
        cancelConnect()
        setEditElementId(null)
        return
      }

      // Cmd+Z / Cmd+Shift+Z
      if (meta && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        undo()
        return
      }
      if (meta && e.key === 'z' && e.shiftKey) {
        e.preventDefault()
        redo()
        return
      }
      if (meta && e.key === 'y') {
        e.preventDefault()
        redo()
        return
      }

      // Cmd+A
      if (meta && e.key === 'a') {
        e.preventDefault()
        selectAll()
        return
      }

      // Cmd+C
      if (meta && e.key === 'c') {
        e.preventDefault()
        copySelected()
        return
      }

      // Cmd+V
      if (meta && e.key === 'v') {
        e.preventDefault()
        pasteClipboard()
        return
      }

      // Cmd+S
      if (meta && e.key === 's') {
        e.preventDefault()
        handleSave()
        return
      }

      // Plus / Minus for zoom
      if (e.key === '+' || e.key === '=') {
        e.preventDefault()
        zoomIn()
        return
      }
      if (e.key === '-') {
        e.preventDefault()
        zoomOut()
        return
      }

      // 0 to reset view
      if (e.key === '0' && meta) {
        e.preventDefault()
        resetView()
        return
      }

      // G to toggle grid
      if (e.key === 'g' && !meta) {
        setShowGrid((prev: boolean) => !prev)
        return
      }
    }

    function handleKeyUp(e: KeyboardEvent) {
      if (e.code === 'Space') {
        spaceHeldRef.current = false
        setIsPanning(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [
    deleteSelected, deselectAll, cancelConnect, setEditElementId,
    undo, redo, selectAll, copySelected, pasteClipboard, handleSave,
    zoomIn, zoomOut, resetView, setShowGrid, setIsPanning,
  ])

  // ── Mouse down on canvas (pan / lasso / deselect) ─────────────────────────

  const handleCanvasMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // Ignore right clicks
      if (e.button === 2) return

      // Middle mouse or space held -> pan
      if (e.button === 1 || spaceHeldRef.current) {
        e.preventDefault()
        panStartRef.current = {
          x: e.clientX,
          y: e.clientY,
          panX: pan.x,
          panY: pan.y,
        }
        setIsPanning(true)
        return
      }

      // Left click on empty canvas -> start lasso or deselect
      if (e.button === 0) {
        // If no shift, deselect all
        if (!e.shiftKey) {
          deselectAll()
        }

        // Start lasso selection
        const canvasPos = toCanvas(e.clientX, e.clientY)
        lassoStartRef.current = { x: canvasPos.x, y: canvasPos.y }
        setLassoRect(null)
      }
    },
    [pan, setIsPanning, deselectAll, toCanvas],
  )

  // ── Mouse move (drag / pan / lasso / connect / resize) ────────────────────

  const handleCanvasMouseMove = useCallback(
    (e: React.MouseEvent) => {
      // Panning
      if (panStartRef.current) {
        const dx = e.clientX - panStartRef.current.x
        const dy = e.clientY - panStartRef.current.y
        setPan({
          x: panStartRef.current.panX + dx,
          y: panStartRef.current.panY + dy,
        })
        return
      }

      const canvasPos = toCanvas(e.clientX, e.clientY)

      // Dragging an element
      if (dragState) {
        updateDrag(canvasPos.x, canvasPos.y)
        return
      }

      // Resizing an element
      if (resizeState) {
        updateResize(canvasPos.x, canvasPos.y)
        return
      }

      // Drawing a connection
      if (connectState) {
        updateConnect(canvasPos.x, canvasPos.y)
        return
      }

      // Lasso selection
      if (lassoStartRef.current) {
        const sx = lassoStartRef.current.x
        const sy = lassoStartRef.current.y
        const cx = canvasPos.x
        const cy = canvasPos.y
        const lx = Math.min(sx, cx)
        const ly = Math.min(sy, cy)
        const lw = Math.abs(cx - sx)
        const lh = Math.abs(cy - sy)

        if (lw > LASSO_MIN_SIZE || lh > LASSO_MIN_SIZE) {
          setLassoRect({ x: lx, y: ly, w: lw, h: lh })
        }
      }
    },
    [
      toCanvas, dragState, resizeState, connectState,
      updateDrag, updateResize, updateConnect, setPan,
    ],
  )

  // ── Mouse up (end drag / pan / lasso / connect / resize) ──────────────────

  const handleCanvasMouseUp = useCallback(
    (e: React.MouseEvent) => {
      // End panning
      if (panStartRef.current) {
        panStartRef.current = null
        if (!spaceHeldRef.current) {
          setIsPanning(false)
        }
      }

      // End dragging
      if (dragState) {
        endDrag()
      }

      // End resizing
      if (resizeState) {
        endResize()
      }

      // Cancel connection if not ended on a port
      if (connectState) {
        cancelConnect()
      }

      // End lasso selection
      if (lassoStartRef.current && lassoRect) {
        // Select all elements inside the lasso rectangle
        for (const el of elements) {
          const elRight = el.x + el.width
          const elBottom = el.y + el.height
          const lassoRight = lassoRect.x + lassoRect.w
          const lassoBottom = lassoRect.y + lassoRect.h

          const overlaps =
            el.x < lassoRight &&
            elRight > lassoRect.x &&
            el.y < lassoBottom &&
            elBottom > lassoRect.y

          if (overlaps) {
            toggleMultiSelect(el.id)
          }
        }
      }

      lassoStartRef.current = null
      setLassoRect(null)
    },
    [
      dragState, resizeState, connectState, lassoRect, elements,
      endDrag, endResize, cancelConnect, toggleMultiSelect, setIsPanning,
    ],
  )

  // ── Wheel handler (zoom/pan) — refs für aktuelle Werte ──────────────────

  const zoomRef = useRef(zoom)
  const panRef = useRef(pan)
  zoomRef.current = zoom
  panRef.current = pan

  // Native non-passive wheel listener — React's onWheel ist passiv und
  // kann preventDefault() nicht ausführen, was dazu führt dass der Browser
  // gleichzeitig die Seite scrollt/zoomt.
  useEffect(() => {
    const el = canvasRef.current
    if (!el) return

    // Normalisiert deltaY/deltaX je nach deltaMode (Pixel vs Lines vs Pages)
    function normalizeDelta(delta: number, mode: number): number {
      if (mode === 1) return delta * 20    // Lines → ca. 20px pro Zeile
      if (mode === 2) return delta * 400   // Pages → ca. 400px pro Seite
      return delta                          // Pixel (Trackpad)
    }

    function handleWheel(e: WheelEvent) {
      // IMMER preventDefault — die Canvas übernimmt das Scroll-Verhalten komplett
      e.preventDefault()
      e.stopPropagation()

      const currentZoom = zoomRef.current
      const currentPan = panRef.current
      const dy = normalizeDelta(e.deltaY, e.deltaMode)
      const dx = normalizeDelta(e.deltaX, e.deltaMode)

      // Ctrl/Meta + wheel = Zoom (auch Trackpad-Pinch sendet ctrlKey)
      if (e.ctrlKey || e.metaKey) {
        // Trackpad-Pinch sendet kleine deltaY-Werte (~1-10), Mausrad größere (~100)
        // Wir nutzen einen multiplikativen Faktor für smootheres Zooming
        const zoomFactor = Math.pow(0.995, dy)
        const newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, currentZoom * zoomFactor))

        // Zoom Richtung Cursor-Position
        const rect = el.getBoundingClientRect()
        const cursorX = e.clientX - rect.left
        const cursorY = e.clientY - rect.top
        const scale = newZoom / currentZoom
        const newPanX = cursorX - (cursorX - currentPan.x) * scale
        const newPanY = cursorY - (cursorY - currentPan.y) * scale

        setPan({ x: newPanX, y: newPanY })
        setZoom(newZoom)
      } else {
        // Normales Scroll → Pan
        setPan({
          x: currentPan.x - dx,
          y: currentPan.y - dy,
        })
      }
    }

    el.addEventListener('wheel', handleWheel, { passive: false })
    return () => el.removeEventListener('wheel', handleWheel)
  }, [setZoom, setPan])

  // ── Drop handler (from palette drag, if needed) ───────────────────────────

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      const data = e.dataTransfer.getData('application/funnel-element')
      if (!data) return

      try {
        const payload = JSON.parse(data) as Omit<FunnelElement, 'id'>
        const canvasPos = toCanvas(e.clientX, e.clientY)
        addElement({
          ...payload,
          x: canvasPos.x - (payload.width ?? 100) / 2,
          y: canvasPos.y - (payload.height ?? 40) / 2,
        })
      } catch {
        // Invalid data, ignore
      }
    },
    [toCanvas, addElement],
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
  }, [])

  // ── Element interaction handlers ──────────────────────────────────────────

  const handleElementMouseDown = useCallback(
    (el: FunnelElement, e: React.MouseEvent) => {
      if (e.shiftKey) {
        toggleMultiSelect(el.id)
        return
      }

      selectElement(el.id)
      const canvasPos = toCanvas(e.clientX, e.clientY)
      startDrag(el.id, canvasPos.x - el.x, canvasPos.y - el.y)
    },
    [toCanvas, selectElement, toggleMultiSelect, startDrag],
  )

  const handleElementDoubleClick = useCallback(
    (el: FunnelElement) => {
      setEditElementId(el.id)
      setShowPropertyPanel(true)
    },
    [setEditElementId],
  )

  // ── Resize handle mouse down ────────────────────────────────────────
  const handleResizeMouseDown = useCallback(
    (el: FunnelElement, e: React.MouseEvent) => {
      e.stopPropagation()
      e.preventDefault()
      const canvasPos = toCanvas(e.clientX, e.clientY)
      startResize(el.id, canvasPos.x, canvasPos.y)
    },
    [toCanvas, startResize],
  )

  const handleElementContextMenu = useCallback(
    (el: FunnelElement, e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      selectElement(el.id)
      setContextMenu({ x: e.clientX, y: e.clientY, elementId: el.id })
    },
    [selectElement],
  )

  // Close context menu on any click
  useEffect(() => {
    if (!contextMenu) return
    function handleClick() { setContextMenu(null) }
    window.addEventListener('mousedown', handleClick)
    return () => window.removeEventListener('mousedown', handleClick)
  }, [contextMenu])

  const handlePortMouseDown = useCallback(
    (elId: string, port: PortDirection, e: React.MouseEvent) => {
      e.stopPropagation()
      startConnect(elId, port)
    },
    [startConnect],
  )

  const handlePortMouseUp = useCallback(
    (elId: string, port: PortDirection) => {
      if (connectState) {
        endConnect(elId, port)
      }
    },
    [connectState, endConnect],
  )

  // ── Connection click ──────────────────────────────────────────────────────

  const handleConnectionClick = useCallback(
    (connId: string) => {
      selectConnection(connId)
    },
    [selectConnection],
  )

  const handleConnectionContextMenu = useCallback(
    (connId: string, e: React.MouseEvent) => {
      e.preventDefault()
      selectConnection(connId)
    },
    [selectConnection],
  )

  // ── Phase click ───────────────────────────────────────────────────────────

  const handlePhaseMouseDown = useCallback(
    (phaseId: string, e: React.MouseEvent) => {
      e.stopPropagation()
      selectPhase(phaseId)
    },
    [selectPhase],
  )

  // ── Palette handlers ──────────────────────────────────────────────────────

  const handleAddElement = useCallback(
    (element: Omit<FunnelElement, 'id'>) => {
      // Place new elements near the center of the visible canvas
      const rect = canvasRef.current?.getBoundingClientRect()
      if (rect) {
        const center = screenToCanvas(
          rect.width / 2,
          rect.height / 2,
          pan,
          zoom,
        )
        element = {
          ...element,
          x: center.x - (element.width ?? 100) / 2,
          y: center.y - (element.height ?? 40) / 2,
        }
      }
      addElement(element)
    },
    [addElement, pan, zoom],
  )

  const handleAddPhase = useCallback(
    (phase: Omit<FunnelPhase, 'id'>) => {
      const rect = canvasRef.current?.getBoundingClientRect()
      if (rect) {
        const center = screenToCanvas(
          rect.width / 2,
          rect.height / 2,
          pan,
          zoom,
        )
        phase = {
          ...phase,
          x: center.x - (phase.width ?? 260) / 2,
          y: center.y - (phase.height ?? 300) / 2,
        }
      }
      addPhase(phase)
    },
    [addPhase, pan, zoom],
  )

  const handleApplyTemplate = useCallback(
    (templateId: string) => {
      const tpl = FUNNEL_TEMPLATES.find((t) => t.id === templateId)
      if (!tpl) return

      // Add all template elements and collect new IDs
      const idMap = new Map<string, string>()
      for (let i = 0; i < tpl.elements.length; i++) {
        const el = tpl.elements[i]
        const newId = addElement(el)
        idMap.set(String(i), newId)
      }

      // Add connections with remapped IDs
      for (const conn of tpl.connections) {
        const fromId = idMap.get(conn.from)
        const toId = idMap.get(conn.to)
        if (fromId && toId) {
          addConnection({
            from: fromId,
            to: toId,
            fromPort: conn.fromPort,
            toPort: conn.toPort,
            label: conn.label,
          })
        }
      }

      // Add phases
      for (const phase of tpl.phases) {
        addPhase(phase)
      }
    },
    [addElement, addConnection, addPhase],
  )

  // ── Fullscreen toggle ─────────────────────────────────────────────────────

  const handleToggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      canvasRef.current?.parentElement?.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }, [])

  // ── Presentation mode toggle ──────────────────────────────────────────────

  const handleTogglePresentationMode = useCallback(() => {
    setIsPresentationMode((prev) => !prev)
  }, [])

  // ── Fit to screen ─────────────────────────────────────────────────────────

  const handleFitToScreen = useCallback(() => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (rect) {
      fitToScreen(rect.width, rect.height)
    }
  }, [fitToScreen])

  // ── Export PNG ───────────────────────────────────────────────────────────

  const handleExportPng = useCallback(() => {
    const svgEl = svgRef.current
    const container = canvasRef.current
    if (!svgEl || !container) return

    const rect = container.getBoundingClientRect()
    const scale = 2
    const canvas = document.createElement('canvas')
    canvas.width = rect.width * scale
    canvas.height = rect.height * scale
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.fillStyle = getComputedStyle(container).backgroundColor || '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    const svgClone = svgEl.cloneNode(true) as SVGSVGElement
    svgClone.setAttribute('width', String(rect.width))
    svgClone.setAttribute('height', String(rect.height))
    const svgData = new XMLSerializer().serializeToString(svgClone)
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
    const svgUrl = URL.createObjectURL(svgBlob)

    const img = new Image()
    img.onload = () => {
      ctx.scale(scale, scale)
      ctx.drawImage(img, 0, 0)
      URL.revokeObjectURL(svgUrl)
      canvas.toBlob((blob) => {
        if (!blob) return
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `funnel-${initialBoard?.name ?? 'export'}.png`
        a.click()
        URL.revokeObjectURL(url)
      }, 'image/png')
    }
    img.src = svgUrl
  }, [initialBoard?.name])

  // ── Export JSON ────────────────────────────────────────────────────────────

  const handleExportJson = useCallback(() => {
    const snapshot = getSnapshot()
    const json = JSON.stringify(snapshot, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `funnel-${initialBoard?.name ?? 'export'}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [getSnapshot, initialBoard?.name])

  // ── Temporary connection path ─────────────────────────────────────────────

  const tempConnectionPath = useMemo(() => {
    if (!connectState) return null
    const fromEl = elements.find((e) => e.id === connectState.fromId)
    if (!fromEl) return null
    return getTempConnectionPath(
      fromEl,
      connectState.fromPort,
      connectState.canvasX,
      connectState.canvasY,
    )
  }, [connectState, elements])

  // ── Canvas transform ──────────────────────────────────────────────────────

  const canvasTransform = `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`

  // ── Cursor style ──────────────────────────────────────────────────────────

  const cursorStyle = useMemo(() => {
    if (isPanning || spaceHeldRef.current) return 'grab'
    if (panStartRef.current) return 'grabbing'
    if (connectState) return 'crosshair'
    return 'default'
  }, [isPanning, connectState])

  // ── Grid pattern ──────────────────────────────────────────────────────────

  const gridPattern = useMemo(() => {
    if (!showGrid) return null
    const dotColor = 'rgba(128, 128, 128, 0.2)'
    return (
      <pattern
        id="funnel-grid-dots"
        x={0}
        y={0}
        width={GRID_DOT_SPACING}
        height={GRID_DOT_SPACING}
        patternUnits="userSpaceOnUse"
      >
        <circle
          cx={GRID_DOT_SPACING / 2}
          cy={GRID_DOT_SPACING / 2}
          r={GRID_DOT_RADIUS}
          fill={dotColor}
        />
      </pattern>
    )
  }, [showGrid])

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div
      className={cn('relative flex flex-col h-full bg-background overflow-hidden', className)}
    >
      {/* ── Toolbar ──────────────────────────────────────────────────────── */}
      {!isPresentationMode && (
        <FunnelToolbar
          boardName={initialBoard?.name ?? 'Funnel Board'}
          canUndo={canUndo}
          canRedo={canRedo}
          zoom={zoom}
          snapEnabled={snapEnabled}
          showGrid={showGrid}
          showMinimap={showMinimap}
          isFullscreen={isFullscreen}
          isPresentationMode={isPresentationMode}
          onUndo={undo}
          onRedo={redo}
          onZoomIn={zoomIn}
          onZoomOut={zoomOut}
          onFitToScreen={handleFitToScreen}
          onToggleSnap={() => setSnapEnabled((prev: boolean) => !prev)}
          onToggleGrid={() => setShowGrid((prev: boolean) => !prev)}
          onToggleMinimap={() => setShowMinimap((prev: boolean) => !prev)}
          onTogglePalette={togglePalette}
          onToggleFullscreen={handleToggleFullscreen}
          onTogglePresentationMode={handleTogglePresentationMode}
          onToggleShortcuts={() => setShowShortcuts((prev: boolean) => !prev)}
          onToggleGlobalStyles={() => setShowGlobalStyles((prev: boolean) => !prev)}
          onToggleHistory={() => setShowHistoryPanel((prev: boolean) => !prev)}
          onExportPng={handleExportPng}
          onExportJson={handleExportJson}
          onSave={handleSave}
          saveState={saveState}
        />
      )}

      {/* ── Main canvas area ─────────────────────────────────────────────── */}
      <div
        ref={canvasRef}
        className="relative flex-1 overflow-hidden"
        style={{
          cursor: cursorStyle,
          touchAction: 'none',                // Keine Browser-Touch-Gesten (Pinch, Swipe-Back)
          overscrollBehavior: 'contain',       // Kein Scroll-Chaining zum Parent
          WebkitOverflowScrolling: undefined,  // Kein iOS-Momentum-Scroll
        }}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
        onMouseLeave={handleCanvasMouseUp}

        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        {/* ── SVG layer (connections, grid, guides, temp line) ──────────── */}
        <svg
          ref={svgRef}
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ zIndex: 1 }}
        >
          {/* Grid pattern definition + background rect */}
          {showGrid && (
            <g style={{ transform: canvasTransform, transformOrigin: '0 0' }}>
              <defs>
                {gridPattern}
              </defs>
              <rect
                x={-10000}
                y={-10000}
                width={20000}
                height={20000}
                fill="url(#funnel-grid-dots)"
              />
            </g>
          )}

          {/* Connections + temp line + guides */}
          <g
            style={{
              transform: canvasTransform,
              transformOrigin: '0 0',
              pointerEvents: 'auto',
            }}
          >
            {/* Snap guides */}
            {snapGuides.map((guide, i) => (
              <line
                key={`snap-${i}`}
                x1={guide.axis === 'x' ? guide.pos : -10000}
                y1={guide.axis === 'y' ? guide.pos : -10000}
                x2={guide.axis === 'x' ? guide.pos : 10000}
                y2={guide.axis === 'y' ? guide.pos : 10000}
                stroke="#3b82f6"
                strokeWidth={0.5 / zoom}
                strokeDasharray={`${4 / zoom},${4 / zoom}`}
                opacity={0.6}
              />
            ))}

            {/* Rendered connections */}
            {connections.map((conn) => {
              const fromEl = elements.find((e) => e.id === conn.from)
              const toEl = elements.find((e) => e.id === conn.to)
              if (!fromEl || !toEl) return null

              return (
                <FunnelConnection
                  key={conn.id}
                  connection={conn}
                  fromElement={fromEl}
                  toElement={toEl}
                  isSelected={selectedConnId === conn.id}
                  curveStyle={globalStyles.connCurve}
                  color={globalStyles.connColor}
                  thickness={globalStyles.connThickness}
                  animation={globalStyles.connAnimation}
                  arrowhead={globalStyles.connArrowhead}
                  onClick={() => handleConnectionClick(conn.id)}
                  onContextMenu={(e) => handleConnectionContextMenu(conn.id, e)}
                />
              )
            })}

            {/* Temporary connection line (while drawing) */}
            {tempConnectionPath && (
              <path
                d={tempConnectionPath}
                stroke="#a855f7"
                strokeWidth={2}
                strokeDasharray="6,4"
                fill="none"
                opacity={0.7}
                strokeLinecap="round"
                style={{ pointerEvents: 'none' }}
              />
            )}
          </g>
        </svg>

        {/* ── HTML layer (phases, elements) ────────────────────────────── */}
        <div
          className="absolute inset-0"
          style={{
            transform: canvasTransform,
            transformOrigin: '0 0',
            zIndex: 2,
            pointerEvents: 'none',
          }}
        >
          {/* Phase overlays (behind elements) */}
          {phases.map((phase) => (
            <div
              key={phase.id}
              className={cn(
                'absolute rounded-xl border-2 border-dashed transition-shadow duration-200 cursor-pointer',
                selectedPhaseId === phase.id && 'ring-2 ring-primary ring-offset-2 ring-offset-transparent',
              )}
              style={{
                left: phase.x,
                top: phase.y,
                width: phase.width,
                height: phase.height,
                backgroundColor: phase.color + '12',
                borderColor: phase.color + '40',
                zIndex: 0,
                pointerEvents: 'auto',
              }}
              onMouseDown={(e) => handlePhaseMouseDown(phase.id, e)}
            >
              {/* Phase label */}
              <div
                className="absolute -top-3.5 left-3 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider"
                style={{
                  backgroundColor: phase.color + '20',
                  color: phase.color,
                  border: `1px solid ${phase.color}40`,
                }}
              >
                {phase.label}
              </div>
            </div>
          ))}

          {/* Elements */}
          {elements.map((el) => {
            const isSelected = selectedElementId === el.id
            const isMultiSelected = multiSelectedIds.has(el.id)

            // Resize handle (shown for selected elements)
            const resizeHandle = isSelected ? (
              <div
                className="absolute w-3 h-3 bg-white border-2 border-primary rounded-sm cursor-se-resize z-20"
                style={{
                  right: -6,
                  bottom: -6,
                  pointerEvents: 'auto',
                }}
                onMouseDown={(e) => handleResizeMouseDown(el, e)}
              />
            ) : null

            // ── Platform node ─────────────────────────────────────────
            if (el.type === 'platform') {
              return (
                <div
                  key={el.id}
                  style={{ pointerEvents: 'auto' }}
                  onMouseUp={() => {
                    if (connectState) {
                      endConnect(el.id, 'left')
                    }
                  }}
                >
                  <FunnelNode
                    element={el}
                    isSelected={isSelected}
                    isMultiSelected={isMultiSelected}
                    nodeStyle={globalStyles.nodeStyle}
                    nodeShadow={globalStyles.nodeShadow}
                    onMouseDown={(e) => handleElementMouseDown(el, e)}
                    onContextMenu={(e) => handleElementContextMenu(el, e)}
                    onPortMouseDown={(port, e) => handlePortMouseDown(el.id, port, e)}
                  />
                  {resizeHandle && (
                    <div className="absolute" style={{ left: el.x, top: el.y, width: el.width, height: el.height, pointerEvents: 'none' }}>
                      {resizeHandle}
                    </div>
                  )}
                </div>
              )
            }

            // ── Mockup frame ──────────────────────────────────────────
            if (el.type === 'mockup') {
              return (
                <div
                  key={el.id}
                  className={cn(
                    'absolute select-none cursor-move',
                  )}
                  style={{
                    left: el.x,
                    top: el.y,
                    pointerEvents: 'auto',
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation()
                    handleElementMouseDown(el, e)
                  }}
                  onDoubleClick={() => handleElementDoubleClick(el)}
                  onMouseUp={() => {
                    if (connectState) {
                      endConnect(el.id, 'left')
                    }
                  }}
                >
                  <MockupFrame
                    kind={(el.mockupKind ?? 'ad-mockup') as MockupKind}
                    width={el.width}
                    height={el.height}
                    imageUrl={el.mockupImageUrl}
                    text={el.mockupText}
                    profileImage={el.mockupProfileImage}
                    profileName={el.mockupProfileName}
                    bodyText={el.mockupBodyText}
                    headline={el.mockupHeadline}
                    description={el.mockupDescription}
                    ctaText={el.mockupCtaText}
                    browserUrl={el.mockupBrowserUrl}
                    isSelected={isSelected}
                  />
                  {resizeHandle}
                </div>
              )
            }

            // ── Text block ────────────────────────────────────────────
            if (el.type === 'text') {
              return (
                <div
                  key={el.id}
                  style={{ pointerEvents: 'auto' }}
                  className="relative"
                >
                  <TextBlock
                    element={el}
                    isSelected={isSelected}
                    isMultiSelected={isMultiSelected}
                    onMouseDown={(e) => handleElementMouseDown(el, e)}
                    onDoubleClick={() => handleElementDoubleClick(el)}
                  />
                  {resizeHandle && (
                    <div className="absolute" style={{ left: el.x, top: el.y, width: el.width, height: el.height, pointerEvents: 'none' }}>
                      {resizeHandle}
                    </div>
                  )}
                </div>
              )
            }

            // ── Media block ───────────────────────────────────────────
            if (el.type === 'media') {
              return (
                <div
                  key={el.id}
                  style={{ pointerEvents: 'auto' }}
                  className="relative"
                >
                  <MediaBlock
                    element={el}
                    isSelected={isSelected}
                    isMultiSelected={isMultiSelected}
                    onMouseDown={(e) => handleElementMouseDown(el, e)}
                    onDoubleClick={() => handleElementDoubleClick(el)}
                  />
                  {resizeHandle && (
                    <div className="absolute" style={{ left: el.x, top: el.y, width: el.width, height: el.height, pointerEvents: 'none' }}>
                      {resizeHandle}
                    </div>
                  )}
                </div>
              )
            }

            return null
          })}
        </div>

        {/* ── Lasso selection rectangle ─────────────────────────────────── */}
        {lassoRect && (
          <div
            className="absolute border-2 border-blue-500 bg-blue-500/10 rounded-sm"
            style={{
              left: lassoRect.x * zoom + pan.x,
              top: lassoRect.y * zoom + pan.y,
              width: lassoRect.w * zoom,
              height: lassoRect.h * zoom,
              zIndex: 50,
              pointerEvents: 'none',
            }}
          />
        )}
      </div>

      {/* ── Palette (right side, conditional) ─────────────────────────────── */}
      {!isPresentationMode && (
        <FunnelPalette
          open={paletteOpen}
          onClose={togglePalette}
          onAddElement={handleAddElement}
          onAddPhase={handleAddPhase}
          onApplyTemplate={handleApplyTemplate}
        />
      )}

      {/* ── Context menu ─────────────────────────────────────────────────── */}
      {contextMenu && (
        <div
          className="fixed z-[60] rounded-lg border border-border bg-popover text-popover-foreground shadow-xl py-1 min-w-[160px] animate-fade-in"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => {
              setEditElementId(contextMenu.elementId)
              setShowPropertyPanel(true)
              setContextMenu(null)
            }}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-muted transition-colors"
          >
            <Pencil className="h-3.5 w-3.5" />
            Bearbeiten
          </button>
          <button
            onClick={() => {
              duplicateElement(contextMenu.elementId)
              setContextMenu(null)
            }}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-muted transition-colors"
          >
            <Copy className="h-3.5 w-3.5" />
            Duplizieren
          </button>
          <div className="my-1 h-px bg-border" />
          <button
            onClick={() => {
              deleteElement(contextMenu.elementId)
              setContextMenu(null)
            }}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Löschen
          </button>
        </div>
      )}

      {/* ── Property Panel (right side, for selected element) ──────────── */}
      {showPropertyPanel && selectedElementId && !isPresentationMode && (() => {
        const el = elements.find((e) => e.id === selectedElementId)
        if (!el) return null
        return (
          <div className="absolute right-4 top-14 z-40 w-[280px] rounded-xl border border-border bg-card/95 backdrop-blur-md shadow-xl animate-fade-in flex flex-col max-h-[calc(100vh-7rem)]">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-3 py-2.5 shrink-0">
              <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                Eigenschaften
              </span>
              <button
                onClick={() => { setShowPropertyPanel(false); setEditElementId(null) }}
                className="rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            {/* Content */}
            <div className="overflow-y-auto p-3 space-y-3 flex-1">
              {/* Label */}
              <div>
                <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Label
                </label>
                <input
                  type="text"
                  value={el.label ?? ''}
                  onChange={(e) => updateElement(el.id, { label: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-border bg-muted/40 px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
              {/* Description */}
              <div>
                <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Beschreibung
                </label>
                <input
                  type="text"
                  value={el.description ?? ''}
                  onChange={(e) => updateElement(el.id, { description: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-border bg-muted/40 px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
              {/* Metric fields (for platform nodes) */}
              {el.type === 'platform' && (
                <>
                  <div>
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Metrik-Label
                    </label>
                    <input
                      type="text"
                      value={el.metricLabel ?? ''}
                      onChange={(e) => updateElement(el.id, { metricLabel: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-border bg-muted/40 px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                      placeholder="z.B. CTR, Budget"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Metrik-Wert
                    </label>
                    <input
                      type="text"
                      value={el.metricValue ?? ''}
                      onChange={(e) => updateElement(el.id, { metricValue: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-border bg-muted/40 px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                      placeholder="z.B. 3.2%, €500"
                    />
                  </div>
                </>
              )}
              {/* Text fields (for text elements) */}
              {el.type === 'text' && (
                <>
                  <div>
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Text
                    </label>
                    <textarea
                      value={el.textContent ?? ''}
                      onChange={(e) => updateElement(el.id, { textContent: e.target.value })}
                      rows={3}
                      className="mt-1 w-full rounded-lg border border-border bg-muted/40 px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                        Schriftgröße
                      </label>
                      <input
                        type="number"
                        value={el.fontSize ?? 14}
                        onChange={(e) => updateElement(el.id, { fontSize: Number(e.target.value) })}
                        min={8}
                        max={72}
                        className="mt-1 w-full rounded-lg border border-border bg-muted/40 px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                        Gewicht
                      </label>
                      <select
                        value={el.fontWeight ?? 'normal'}
                        onChange={(e) => updateElement(el.id, { fontWeight: e.target.value as 'normal' | 'bold' })}
                        className="mt-1 w-full rounded-lg border border-border bg-muted/40 px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                      >
                        <option value="normal">Normal</option>
                        <option value="bold">Fett</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Textfarbe
                    </label>
                    <input
                      type="color"
                      value={el.textColor ?? '#000000'}
                      onChange={(e) => updateElement(el.id, { textColor: e.target.value })}
                      className="mt-1 h-8 w-full rounded-lg border border-border cursor-pointer"
                    />
                  </div>
                </>
              )}
              {/* Mockup fields */}
              {el.type === 'mockup' && (
                <>
                  <div>
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Überschrift
                    </label>
                    <input
                      type="text"
                      value={el.mockupHeadline ?? ''}
                      onChange={(e) => updateElement(el.id, { mockupHeadline: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-border bg-muted/40 px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Text
                    </label>
                    <textarea
                      value={el.mockupBodyText ?? ''}
                      onChange={(e) => updateElement(el.id, { mockupBodyText: e.target.value })}
                      rows={2}
                      className="mt-1 w-full rounded-lg border border-border bg-muted/40 px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                      CTA-Button
                    </label>
                    <input
                      type="text"
                      value={el.mockupCtaText ?? ''}
                      onChange={(e) => updateElement(el.id, { mockupCtaText: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-border bg-muted/40 px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                      placeholder="z.B. Jetzt buchen"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Bild-URL
                    </label>
                    <input
                      type="text"
                      value={el.mockupImageUrl ?? ''}
                      onChange={(e) => updateElement(el.id, { mockupImageUrl: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-border bg-muted/40 px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                      placeholder="https://..."
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Profil-Name
                    </label>
                    <input
                      type="text"
                      value={el.mockupProfileName ?? ''}
                      onChange={(e) => updateElement(el.id, { mockupProfileName: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-border bg-muted/40 px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                  </div>
                </>
              )}
              {/* Media fields */}
              {el.type === 'media' && (
                <div>
                  <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Medien-URL
                  </label>
                  <input
                    type="text"
                    value={el.mediaUrl ?? ''}
                    onChange={(e) => updateElement(el.id, { mediaUrl: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-border bg-muted/40 px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                    placeholder="https://..."
                  />
                </div>
              )}
              {/* Size */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Breite
                  </label>
                  <input
                    type="number"
                    value={Math.round(el.width)}
                    onChange={(e) => updateElement(el.id, { width: Number(e.target.value) })}
                    min={60}
                    className="mt-1 w-full rounded-lg border border-border bg-muted/40 px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Höhe
                  </label>
                  <input
                    type="number"
                    value={Math.round(el.height)}
                    onChange={(e) => updateElement(el.id, { height: Number(e.target.value) })}
                    min={40}
                    className="mt-1 w-full rounded-lg border border-border bg-muted/40 px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
              </div>
              {/* Delete button */}
              <button
                onClick={() => {
                  deleteElement(el.id)
                  setShowPropertyPanel(false)
                  setEditElementId(null)
                }}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-red-500 border border-red-200 dark:border-red-500/20 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors mt-2"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Element löschen
              </button>
            </div>
          </div>
        )
      })()}

      {/* ── Keyboard shortcuts overlay ─────────────────────────────────── */}
      {showShortcuts && !isPresentationMode && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-card rounded-xl border border-border shadow-2xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-foreground">Tastenkürzel</h3>
              <button
                onClick={() => setShowShortcuts(false)}
                className="text-muted-foreground hover:text-foreground text-xs"
              >
                Schließen (Esc)
              </button>
            </div>
            <div className="space-y-2 text-xs text-muted-foreground">
              {[
                ['Ctrl+Z', 'Rückgängig'],
                ['Ctrl+Shift+Z', 'Wiederherstellen'],
                ['Ctrl+A', 'Alle auswählen'],
                ['Ctrl+C', 'Kopieren'],
                ['Ctrl+V', 'Einfügen'],
                ['Ctrl+S', 'Speichern'],
                ['Delete', 'Ausgewählte löschen'],
                ['Escape', 'Auswahl aufheben'],
                ['Leertaste + Ziehen', 'Canvas verschieben'],
                ['Ctrl + Mausrad', 'Zoomen'],
                ['+/-', 'Rein-/Rauszoomen'],
                ['Ctrl+0', 'Ansicht zurücksetzen'],
                ['G', 'Raster ein/aus'],
              ].map(([key, desc]) => (
                <div key={key} className="flex justify-between">
                  <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono text-foreground">
                    {key}
                  </kbd>
                  <span>{desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Presentation mode exit button ────────────────────────────────── */}
      {isPresentationMode && (
        <button
          onClick={handleTogglePresentationMode}
          className="absolute top-4 right-4 z-50 px-3 py-1.5 text-xs font-medium rounded-lg bg-card/90 border border-border text-foreground hover:bg-muted transition-colors backdrop-blur-sm"
        >
          Präsentationsmodus beenden
        </button>
      )}
    </div>
  )
}
