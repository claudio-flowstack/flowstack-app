import { useState, useEffect, useRef, useCallback } from 'react'
import { cn } from '@/shared/lib/utils'
import type { CanvasSettings } from './useCanvasState'
import {
  Undo2, Redo2, Play, Square,
  Plus, HelpCircle, Settings,
  Search, Presentation, Layers,
  Download, Check, Loader2, RotateCcw,
  ZoomIn, ZoomOut, Crosshair,
  Magnet, Grid3X3, Maximize, Minimize,
} from 'lucide-react'

// ── Panel identifiers ──────────────────────────────────────────────────────

type PanelId = 'history' | 'insights' | 'variables' | 'exprEditor' | 'versioning' | 'featureLog'

const PANEL_ITEMS: { id: PanelId; label: string }[] = [
  { id: 'history', label: 'Verlauf' },
  { id: 'insights', label: 'Einblicke' },
  { id: 'variables', label: 'Variablen' },
  { id: 'exprEditor', label: 'Ausdrucks-Editor' },
  { id: 'versioning', label: 'Versionsverlauf' },
  { id: 'featureLog', label: 'Feature-Protokoll' },
]

// ── Props ──────────────────────────────────────────────────────────────────

interface CanvasToolbarProps {
  readOnly: boolean
  // Existing
  canUndo: boolean
  canRedo: boolean
  zoom: number
  snapEnabled: boolean
  settings: CanvasSettings
  onUndo: () => void
  onRedo: () => void
  onZoomIn: () => void
  onZoomOut: () => void
  onResetView: () => void
  onFitToContent: () => void
  onAutoLayout: () => void
  onToggleSnap: () => void
  onTogglePalette: () => void
  onOpenSearch: () => void
  onToggleShortcuts: () => void
  onToggleSettings: () => void
  onUpdateSettings: (updates: Partial<CanvasSettings>) => void
  // New – execution
  isExecuting: boolean
  executionDone: boolean
  execDuration: number
  onExecute: () => void
  onStop: () => void
  // New – panels & features
  onTogglePresentationMode: () => void
  onExportPng: () => void
  onTogglePanel: (panel: PanelId) => void
  showPanelsMenu: boolean
  onTogglePanelsMenu: () => void
  // Save state
  saveState?: 'idle' | 'saving' | 'saved'
  hasUnsavedChanges?: boolean
  onDiscard?: () => void
}

// ── Component ──────────────────────────────────────────────────────────────

export function CanvasToolbar({
  readOnly,
  canUndo,
  canRedo,
  zoom: _zoom,
  snapEnabled: _snapEnabled,
  settings: _settings,
  onUndo,
  onRedo,
  onZoomIn: _onZoomIn,
  onZoomOut: _onZoomOut,
  onResetView: _onResetView,
  onFitToContent: _onFitToContent,
  onAutoLayout: _onAutoLayout,
  onToggleSnap: _onToggleSnap,
  onTogglePalette,
  onOpenSearch,
  onToggleShortcuts,
  onToggleSettings,
  onUpdateSettings: _onUpdateSettings,
  isExecuting,
  executionDone,
  execDuration,
  onExecute,
  onStop,
  onTogglePresentationMode,
  onExportPng,
  onTogglePanel,
  showPanelsMenu,
  onTogglePanelsMenu,
  saveState = 'idle',
  hasUnsavedChanges = false,
  onDiscard,
}: CanvasToolbarProps) {
  // ── Fullscreen state ──────────────────────────────────────────────────
  const [isFullscreen, setIsFullscreen] = useState(!!document.fullscreenElement)
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

  // ── Close panels menu on outside click ─────────────────────────────────
  const panelsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!showPanelsMenu) return
    function handleClick(e: MouseEvent) {
      if (panelsRef.current && !panelsRef.current.contains(e.target as Node)) {
        onTogglePanelsMenu()
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showPanelsMenu, onTogglePanelsMenu])

  // ── Styles ─────────────────────────────────────────────────────────────

  const btnBase = cn(
    'p-1 rounded-md flex items-center justify-center',
    'text-muted-foreground hover:bg-muted hover:text-foreground',
    'transition-colors',
  )

  const activeBtn = 'bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400'

  const divider = <div className="h-4 w-px bg-border mx-1" />

  // ── Derived values ─────────────────────────────────────────────────────

  const displayDuration = execDuration

  // ── Render ─────────────────────────────────────────────────────────────
  // Layout: [Undo] [Redo] | [Execute/Stop] [Timer] | ... spacer ... | [+ Nodes hinzufügen] | [Search] [Export] [Presentation] [Panels] [Settings] [Help]

  return (
    <div
      className="flex items-center h-10 px-3 border-b border-border bg-card text-foreground z-10 shrink-0"
      role="toolbar"
      aria-label="Canvas-Toolbar"
    >
      {/* ── LEFT: Undo / Redo ──────────────────────────────────────────── */}
      {!readOnly && (
        <>
          <button
            onClick={onUndo}
            className={cn(btnBase, !canUndo && 'opacity-30 pointer-events-none')}
            title="Rückgängig (Ctrl+Z)"
          >
            <Undo2 className="h-4 w-4" />
          </button>
          <button
            onClick={onRedo}
            className={cn(btnBase, !canRedo && 'opacity-30 pointer-events-none')}
            title="Wiederherstellen (Ctrl+Shift+Z)"
          >
            <Redo2 className="h-4 w-4" />
          </button>

          {divider}

          {/* ── Execute / Stop + Timer ───────────────────────────────────── */}
          {isExecuting ? (
            <button
              onClick={onStop}
              className={cn(btnBase, 'text-red-500 hover:text-red-400')}
              title="Ausführung stoppen"
            >
              <Square className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={onExecute}
              className={cn(btnBase, 'text-emerald-500 hover:text-emerald-400')}
              title="Ausführen"
            >
              <Play className="h-4 w-4" />
            </button>
          )}

          {(isExecuting || executionDone) && (
            <span
              className={cn(
                'text-xs tabular-nums px-1.5 py-0.5 rounded-md font-mono',
                isExecuting
                  ? 'text-emerald-500 dark:text-emerald-400 animate-pulse'
                  : 'text-muted-foreground',
              )}
            >
              {displayDuration.toFixed(1)}s
            </span>
          )}
        </>
      )}

      {/* ── Save State + Discard ──────────────────────────────────────── */}
      {!readOnly && saveState === 'saving' && (
        <span className="flex items-center gap-1 text-xs text-muted-foreground ml-2">
          <Loader2 className="h-3 w-3 animate-spin" />
          Speichert...
        </span>
      )}
      {!readOnly && saveState === 'saved' && (
        <span className="flex items-center gap-1 text-xs text-emerald-500 ml-2">
          <Check className="h-3 w-3" />
          Gespeichert
        </span>
      )}
      {!readOnly && hasUnsavedChanges && saveState === 'idle' && onDiscard && (
        <button
          onClick={onDiscard}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground ml-2 transition-colors"
          title="Änderungen verwerfen"
        >
          <RotateCcw className="h-3 w-3" />
          Verwerfen
        </button>
      )}

      {/* ── Snap / Grid ────────────────────────────────────────────────── */}
      {!readOnly && (
        <>
          {divider}
          <button
            onClick={_onToggleSnap}
            className={cn(btnBase, _snapEnabled && activeBtn)}
            title="Snapping"
          >
            <Magnet className="h-4 w-4" />
          </button>
          <button
            onClick={() => _onUpdateSettings({ showGrid: !_settings.showGrid })}
            className={cn(btnBase, _settings.showGrid && activeBtn)}
            title="Raster"
          >
            <Grid3X3 className="h-4 w-4" />
          </button>
        </>
      )}

      {/* ── Zoom ─────────────────────────────────────────────────────────── */}
      {divider}
      <button onClick={_onZoomOut} className={btnBase} title="Herauszoomen">
        <ZoomOut className="h-4 w-4" />
      </button>
      <button
        onClick={_onResetView}
        className={cn(btnBase, 'text-[10px] font-semibold tabular-nums min-w-[42px]')}
        title="Zoom zurücksetzen"
      >
        {Math.round(_zoom * 100)}%
      </button>
      <button onClick={_onZoomIn} className={btnBase} title="Hineinzoomen">
        <ZoomIn className="h-4 w-4" />
      </button>
      <button onClick={_onFitToContent} className={btnBase} title="Ansicht zentrieren">
        <Crosshair className="h-4 w-4" />
      </button>

      {/* ── CENTER: Spacer ─────────────────────────────────────────────── */}
      <div className="flex-1" />

      {/* ── RIGHT: Actions ─────────────────────────────────────────────── */}

      {/* + Nodes hinzufügen */}
      {!readOnly && (
        <>
          <button
            onClick={onTogglePalette}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium',
              'bg-purple-600 text-white hover:bg-purple-700',
              'transition-colors',
            )}
            title="Nodes hinzufügen"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Nodes hinzufügen</span>
          </button>

          {divider}
        </>
      )}

      {/* Search */}
      <button onClick={onOpenSearch} className={btnBase} title="Suchen (Ctrl+F)">
        <Search className="h-4 w-4" />
      </button>

      {/* Export PNG */}
      <button onClick={onExportPng} className={btnBase} title="Als PNG exportieren">
        <Download className="h-4 w-4" />
      </button>

      {/* Fullscreen */}
      <button onClick={toggleFullscreen} className={cn(btnBase, isFullscreen && activeBtn)} title="Vollbild">
        {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
      </button>

      {/* Presentation Mode */}
      <button
        onClick={onTogglePresentationMode}
        className={btnBase}
        title="Präsentationsmodus"
      >
        <Presentation className="h-4 w-4" />
      </button>

      {/* Panels Dropdown */}
      <div className="relative" ref={panelsRef}>
        <button
          onClick={onTogglePanelsMenu}
          className={cn(btnBase, showPanelsMenu ? activeBtn : '')}
          title="Seitenleisten"
        >
          <Layers className="h-4 w-4" />
        </button>

        {showPanelsMenu && (
          <div className="absolute top-full right-0 mt-1 w-48 rounded-lg border border-border bg-popover text-popover-foreground shadow-lg py-1 z-50">
            {PANEL_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  onTogglePanel(item.id)
                  onTogglePanelsMenu()
                }}
                className="w-full text-left px-3 py-1.5 text-sm hover:bg-muted transition-colors"
              >
                {item.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Settings */}
      <button
        onClick={onToggleSettings}
        className={btnBase}
        title="Canvas-Einstellungen"
      >
        <Settings className="h-4 w-4" />
      </button>

      {/* Help / Shortcuts */}
      <button onClick={onToggleShortcuts} className={btnBase} title="Tastenkürzel anzeigen (?)">
        <HelpCircle className="h-4 w-4" />
      </button>
    </div>
  )
}
