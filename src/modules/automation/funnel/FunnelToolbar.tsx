import { useState, useRef, useEffect } from 'react'
import { cn } from '@/shared/lib/utils'
import {
  Undo2, Redo2, ZoomIn, ZoomOut, Crosshair,
  Magnet, Grid3X3, Map, Plus, Palette, History,
  Download, Save, Check, Loader2, Maximize,
  Presentation, HelpCircle, ChevronDown,
  Image as ImageIcon, FileJson,
} from 'lucide-react'

// ── Props ──────────────────────────────────────────────────────────────────

export interface FunnelToolbarProps {
  boardName: string
  canUndo: boolean
  canRedo: boolean
  zoom: number
  snapEnabled: boolean
  showGrid: boolean
  showMinimap: boolean
  isFullscreen: boolean
  isPresentationMode: boolean
  onUndo: () => void
  onRedo: () => void
  onZoomIn: () => void
  onZoomOut: () => void
  onFitToScreen: () => void
  onToggleSnap: () => void
  onToggleGrid: () => void
  onToggleMinimap: () => void
  onTogglePalette: () => void
  onToggleFullscreen: () => void
  onTogglePresentationMode: () => void
  onToggleShortcuts: () => void
  onToggleGlobalStyles: () => void
  onToggleHistory: () => void
  onExportPng: () => void
  onExportJson: () => void
  onSave: () => void
  saveState: 'idle' | 'saving' | 'saved'
}

// ── Component ──────────────────────────────────────────────────────────────

export function FunnelToolbar({
  boardName,
  canUndo,
  canRedo,
  zoom,
  snapEnabled,
  showGrid,
  showMinimap,
  isFullscreen,
  isPresentationMode,
  onUndo,
  onRedo,
  onZoomIn,
  onZoomOut,
  onFitToScreen,
  onToggleSnap,
  onToggleGrid,
  onToggleMinimap,
  onTogglePalette,
  onToggleFullscreen,
  onTogglePresentationMode,
  onToggleShortcuts,
  onToggleGlobalStyles,
  onToggleHistory,
  onExportPng,
  onExportJson,
  onSave,
  saveState,
}: FunnelToolbarProps) {
  const [exportOpen, setExportOpen] = useState(false)
  const exportRef = useRef<HTMLDivElement>(null)

  // ── Close export dropdown on outside click ─────────────────────────────

  useEffect(() => {
    if (!exportOpen) return
    function handleClick(e: MouseEvent) {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setExportOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [exportOpen])

  // ── Styles ─────────────────────────────────────────────────────────────

  const btnBase = cn(
    'p-1.5 rounded-lg flex items-center justify-center',
    'text-muted-foreground hover:bg-muted',
    'transition-colors',
  )

  const activeBtn = 'bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400'

  const divider = <div className="w-px h-5 bg-border" />

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div
      className="flex items-center gap-1.5 px-3 py-1.5 border-b border-border bg-card text-foreground z-10 shrink-0"
      role="toolbar"
      aria-label="Funnel-Toolbar"
    >
      {/* ── Board name ──────────────────────────────────────────────────── */}
      <span className="text-sm font-bold text-foreground truncate max-w-[160px] mr-1">
        {boardName}
      </span>

      {divider}

      {/* ── Undo / Redo ─────────────────────────────────────────────────── */}
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
        title="Wiederherstellen (Ctrl+Y)"
      >
        <Redo2 className="h-4 w-4" />
      </button>

      {divider}

      {/* ── Zoom controls ───────────────────────────────────────────────── */}
      <button onClick={onZoomOut} className={btnBase} title="Herauszoomen (-)">
        <ZoomOut className="h-4 w-4" />
      </button>
      <span className="min-w-[42px] text-xs text-muted-foreground text-center tabular-nums px-1.5 py-1">
        {Math.round(zoom * 100)}%
      </span>
      <button onClick={onZoomIn} className={btnBase} title="Hineinzoomen (+)">
        <ZoomIn className="h-4 w-4" />
      </button>
      <button onClick={onFitToScreen} className={btnBase} title="Alles anzeigen">
        <Crosshair className="h-4 w-4" />
      </button>

      {divider}

      {/* ── Snap / Grid / Minimap ───────────────────────────────────────── */}
      <button
        onClick={onToggleSnap}
        className={cn(btnBase, snapEnabled ? activeBtn : '')}
        title={snapEnabled ? 'Snapping deaktivieren' : 'Snapping aktivieren'}
      >
        <Magnet className="h-4 w-4" />
      </button>
      <button
        onClick={onToggleGrid}
        className={cn(btnBase, showGrid ? activeBtn : '')}
        title={showGrid ? 'Raster ausblenden' : 'Raster anzeigen'}
      >
        <Grid3X3 className="h-4 w-4" />
      </button>
      <button
        onClick={onToggleMinimap}
        className={cn(btnBase, showMinimap ? activeBtn : '')}
        title={showMinimap ? 'Minimap ausblenden' : 'Minimap anzeigen'}
      >
        <Map className="h-4 w-4" />
      </button>

      {divider}

      {/* ── Palette toggle ──────────────────────────────────────────────── */}
      <button onClick={onTogglePalette} className={btnBase} title="Elemente-Palette öffnen">
        <Plus className="h-4 w-4" />
      </button>

      {divider}

      {/* ── Styles / History ────────────────────────────────────────────── */}
      <button onClick={onToggleGlobalStyles} className={btnBase} title="Globale Stile">
        <Palette className="h-4 w-4" />
      </button>
      <button onClick={onToggleHistory} className={btnBase} title="Verlauf">
        <History className="h-4 w-4" />
      </button>

      {divider}

      {/* ── Export dropdown ──────────────────────────────────────────────── */}
      <div className="relative" ref={exportRef}>
        <button
          onClick={() => setExportOpen((v) => !v)}
          className={cn(btnBase, exportOpen ? activeBtn : '')}
          title="Exportieren"
        >
          <Download className="h-4 w-4" />
          <ChevronDown className="h-3 w-3 ml-0.5" />
        </button>

        {exportOpen && (
          <div className="absolute top-full left-0 mt-1 w-44 rounded-lg border border-border bg-popover text-popover-foreground shadow-lg py-1 z-50">
            <button
              onClick={() => { onExportPng(); setExportOpen(false) }}
              className="w-full flex items-center gap-2 text-left px-3 py-1.5 text-sm hover:bg-muted transition-colors"
            >
              <ImageIcon className="h-3.5 w-3.5" />
              Als PNG exportieren
            </button>
            <button
              onClick={() => { onExportJson(); setExportOpen(false) }}
              className="w-full flex items-center gap-2 text-left px-3 py-1.5 text-sm hover:bg-muted transition-colors"
            >
              <FileJson className="h-3.5 w-3.5" />
              Als JSON exportieren
            </button>
          </div>
        )}
      </div>

      {divider}

      {/* ── Save ────────────────────────────────────────────────────────── */}
      <button
        onClick={onSave}
        className={cn(
          btnBase,
          saveState === 'saved' && 'text-emerald-500',
          saveState === 'saving' && 'pointer-events-none opacity-60',
        )}
        title="Speichern (Ctrl+S)"
      >
        {saveState === 'saving' && <Loader2 className="h-4 w-4 animate-spin" />}
        {saveState === 'saved' && <Check className="h-4 w-4" />}
        {saveState === 'idle' && <Save className="h-4 w-4" />}
      </button>

      {divider}

      {/* ── Fullscreen / Presentation ───────────────────────────────────── */}
      <button
        onClick={onToggleFullscreen}
        className={cn(btnBase, isFullscreen ? activeBtn : '')}
        title={isFullscreen ? 'Vollbild beenden' : 'Vollbild'}
      >
        <Maximize className="h-4 w-4" />
      </button>
      <button
        onClick={onTogglePresentationMode}
        className={cn(btnBase, isPresentationMode ? activeBtn : '')}
        title="Präsentationsmodus"
      >
        <Presentation className="h-4 w-4" />
      </button>

      {/* ── Spacer ──────────────────────────────────────────────────────── */}
      <div className="flex-1" />

      {/* ── Shortcuts help ──────────────────────────────────────────────── */}
      <button onClick={onToggleShortcuts} className={btnBase} title="Tastenkürzel anzeigen (?)">
        <HelpCircle className="h-4 w-4" />
      </button>
    </div>
  )
}
