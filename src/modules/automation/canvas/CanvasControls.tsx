import { useState, useCallback, useEffect } from 'react'
import { cn } from '@/shared/lib/utils'
import type { CanvasSettings } from './useCanvasState'
import {
  ZoomIn,
  ZoomOut,
  Crosshair,
  MousePointer,
  LayoutGrid,
  Magnet,
  Grid3X3,
  Activity,
  Maximize,
  Minimize,
} from 'lucide-react'

// ── Props ──────────────────────────────────────────────────────────────────

interface CanvasControlsProps {
  zoom: number
  snapEnabled: boolean
  settings: CanvasSettings
  /** When true, shift controls left to avoid palette overlap */
  paletteOpen?: boolean
  onZoomIn: () => void
  onZoomOut: () => void
  onResetView: () => void
  onFitToContent: () => void
  onAutoLayout: () => void
  onToggleSnap: () => void
  onUpdateSettings: (updates: Partial<CanvasSettings>) => void
}

// ── Tooltip wrapper ────────────────────────────────────────────────────────

function Tip({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  const [visible, setVisible] = useState(false)

  return (
    <div
      className="relative flex items-center justify-center"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && (
        <div
          className={cn(
            'absolute right-full mr-2 top-1/2 -translate-y-1/2',
            'whitespace-nowrap rounded-md px-2 py-1',
            'bg-popover text-popover-foreground text-[11px] font-medium',
            'shadow-md border border-border',
            'pointer-events-none z-50',
          )}
        >
          {label}
        </div>
      )}
    </div>
  )
}

// ── Icon button ────────────────────────────────────────────────────────────

function ControlButton({
  tooltip,
  active,
  onClick,
  children,
}: {
  tooltip: string
  active?: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <Tip label={tooltip}>
      <button
        type="button"
        onClick={onClick}
        className={cn(
          'flex items-center justify-center',
          'w-7 h-7 rounded-md transition-colors',
          'text-muted-foreground hover:text-foreground hover:bg-muted/80',
          active && 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 hover:text-purple-300',
        )}
      >
        {children}
      </button>
    </Tip>
  )
}

// ── Component ──────────────────────────────────────────────────────────────

export function CanvasControls({
  zoom,
  snapEnabled,
  settings,
  paletteOpen = false,
  onZoomIn,
  onZoomOut,
  onResetView,
  onFitToContent,
  onAutoLayout,
  onToggleSnap,
  onUpdateSettings,
}: CanvasControlsProps) {
  const [isFullscreen, setIsFullscreen] = useState(!!document.fullscreenElement)

  // Sync fullscreen state with browser (user can exit via Escape)
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {})
    } else {
      document.exitFullscreen().catch(() => {})
    }
  }, [])

  const zoomPercent = `${Math.round(zoom * 100)}%`

  return (
    <div
      className={cn(
        'absolute bottom-4 z-20 transition-all duration-200',
        paletteOpen ? 'right-[19.5rem]' : 'right-4',
        'flex flex-col items-center gap-1 p-1.5',
        'bg-card/95 backdrop-blur-md',
        'border border-border rounded-xl shadow-lg',
        'w-10',
      )}
    >
      {/* ── Zoom section ──────────────────────────────────────────────── */}

      <ControlButton tooltip="Alles anzeigen" onClick={onFitToContent}>
        <Crosshair className="w-3.5 h-3.5" />
      </ControlButton>

      <ControlButton tooltip="Hineinzoomen" onClick={onZoomIn}>
        <ZoomIn className="w-3.5 h-3.5" />
      </ControlButton>

      <Tip label="Zoom-Stufe">
        <button
          type="button"
          onClick={onResetView}
          className={cn(
            'flex items-center justify-center',
            'w-7 h-7 rounded-md transition-colors',
            'text-[10px] font-semibold tabular-nums',
            'text-muted-foreground hover:text-foreground hover:bg-muted/80',
          )}
        >
          {zoomPercent}
        </button>
      </Tip>

      <ControlButton tooltip="Herauszoomen" onClick={onZoomOut}>
        <ZoomOut className="w-3.5 h-3.5" />
      </ControlButton>

      <ControlButton tooltip="Ansicht zurücksetzen" onClick={onResetView}>
        <MousePointer className="w-3.5 h-3.5" />
      </ControlButton>

      {/* ── Divider ───────────────────────────────────────────────────── */}

      <div className="w-5 h-px bg-border my-0.5" />

      {/* ── Toggle section ────────────────────────────────────────────── */}

      <ControlButton tooltip="Auto-Layout" onClick={onAutoLayout}>
        <LayoutGrid className="w-3.5 h-3.5" />
      </ControlButton>

      <ControlButton
        tooltip="Snapping"
        active={snapEnabled}
        onClick={onToggleSnap}
      >
        <Magnet className="w-3.5 h-3.5" />
      </ControlButton>

      <ControlButton
        tooltip="Raster"
        active={settings.showGrid}
        onClick={() => onUpdateSettings({ showGrid: !settings.showGrid })}
      >
        <Grid3X3 className="w-3.5 h-3.5" />
      </ControlButton>

      <ControlButton
        tooltip="Flow-Dots"
        active={settings.showFlowDots}
        onClick={() => onUpdateSettings({ showFlowDots: !settings.showFlowDots })}
      >
        <Activity className="w-3.5 h-3.5" />
      </ControlButton>

      <ControlButton
        tooltip="Vollbild"
        active={isFullscreen}
        onClick={toggleFullscreen}
      >
        {isFullscreen ? (
          <Minimize className="w-3.5 h-3.5" />
        ) : (
          <Maximize className="w-3.5 h-3.5" />
        )}
      </ControlButton>
    </div>
  )
}
