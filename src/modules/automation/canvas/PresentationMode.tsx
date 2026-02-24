import { useState, useEffect, useRef, useCallback } from 'react'
import { cn } from '@/shared/lib/utils'
import {
  Loader2, CheckCircle2, Grid3X3, Layers,
  Crosshair, Play, Square, X as XIcon,
  ChevronLeft, ChevronRight, FileText, Image as ImageIcon,
  Table2, Mail, Globe, FolderOpen,
} from 'lucide-react'

// ── Types ────────────────────────────────────────────────────────────────────

interface SystemOutput {
  id: string
  title: string
  type: string
}

interface CanvasGroup {
  id: string
  label: string
}

// ── Props ────────────────────────────────────────────────────────────────────

interface PresentationModeProps {
  active: boolean
  isExecuting: boolean
  executionDone: boolean
  execDuration: number
  showGrid: boolean
  showGroupBackgrounds: boolean
  onToggleGrid: () => void
  onToggleGroups: () => void
  onFitToContent: () => void
  onExecute: () => void
  onStop: () => void
  onExit: () => void
  onEditEnabledChange?: (enabled: boolean) => void
  onRestoreView?: (grid: boolean, groups: boolean) => void
  containerRef?: React.RefObject<HTMLElement | null>
  outputs?: SystemOutput[]
  groups?: CanvasGroup[]
  currentPhaseIndex?: number
  onNavigatePhase?: (index: number) => void
  // System navigation pills
  navigationSystems?: { id: string; name: string }[]
  currentSystemId?: string
  onNavigateSystem?: (systemId: string) => void
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function getOutputIcon(type: string) {
  switch (type) {
    case 'document': return FileText
    case 'image': return ImageIcon
    case 'spreadsheet': case 'table': case 'csv': return Table2
    case 'email': return Mail
    case 'website': return Globe
    case 'folder': return FolderOpen
    default: return FileText
  }
}

// ── Component ────────────────────────────────────────────────────────────────

export function PresentationMode({
  active,
  isExecuting,
  executionDone,
  execDuration,
  showGrid,
  showGroupBackgrounds,
  onToggleGrid,
  onToggleGroups,
  onFitToContent,
  onExecute,
  onStop,
  onExit,
  onEditEnabledChange,
  onRestoreView,
  containerRef,
  outputs,
  groups,
  currentPhaseIndex,
  onNavigatePhase,
  navigationSystems,
  currentSystemId,
  onNavigateSystem,
}: PresentationModeProps) {
  const [barVisible, setBarVisible] = useState(true)
  const [editEnabled, setEditEnabled] = useState(false)
  const [showDocs, setShowDocs] = useState(false)

  // Escape key exits fullscreen, which triggers fullscreenchange → exits presentation
  const [liveMs, setLiveMs] = useState(0)
  const barTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const execStartRef = useRef(0)
  const prevGridRef = useRef(showGrid)
  const prevGroupsRef = useRef(showGroupBackgrounds)

  // ── Fullscreen on enter, exit on leave ─────────────────────────────────
  useEffect(() => {
    if (active) {
      document.documentElement.requestFullscreen().catch(() => {})
    } else if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {})
    }
  }, [active])

  // Exit presentation when user leaves fullscreen via browser (e.g. Escape in Chrome)
  useEffect(() => {
    if (!active) return
    const handler = () => {
      if (!document.fullscreenElement) {
        onRestoreView?.(prevGridRef.current, prevGroupsRef.current)
        onExit()
      }
    }
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [active, onExit, onRestoreView])

  // ── Auto-hide grid & groups on enter, restore on exit ─────────────────
  useEffect(() => {
    if (active) {
      prevGridRef.current = showGrid
      prevGroupsRef.current = showGroupBackgrounds
      if (showGrid) onToggleGrid()
      if (showGroupBackgrounds) onToggleGroups()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active])

  // ── Auto-hide bar after 3s on enter ────────────────────────────────────

  useEffect(() => {
    if (active) {
      setBarVisible(true)
      const timer = setTimeout(() => setBarVisible(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [active])

  // ── Live timer ─────────────────────────────────────────────────────────

  useEffect(() => {
    if (isExecuting && !executionDone) {
      execStartRef.current = Date.now()
      const iv = setInterval(() => {
        setLiveMs(Date.now() - execStartRef.current)
      }, 100)
      return () => clearInterval(iv)
    }
    if (!isExecuting) {
      setLiveMs(0)
    }
  }, [isExecuting, executionDone])

  // ── Bar hover handlers ─────────────────────────────────────────────────

  const handleBarEnter = useCallback(() => {
    if (barTimerRef.current) {
      clearTimeout(barTimerRef.current)
      barTimerRef.current = null
    }
    setBarVisible(true)
  }, [])

  const handleBarLeave = useCallback(() => {
    barTimerRef.current = setTimeout(() => setBarVisible(false), 1500)
  }, [])

  // Cleanup barTimerRef on unmount
  useEffect(() => {
    return () => {
      if (barTimerRef.current) {
        clearTimeout(barTimerRef.current)
        barTimerRef.current = null
      }
    }
  }, [])

  if (!active) return null

  // ── Format timer ───────────────────────────────────────────────────────

  const mins = Math.floor(liveMs / 60000).toString().padStart(2, '0')
  const secs = Math.floor((liveMs % 60000) / 1000).toString().padStart(2, '0')
  const tenths = Math.floor((liveMs % 1000) / 100)

  // ── Shared button style ────────────────────────────────────────────────

  const barBtn = (isActive: boolean) =>
    cn(
      'p-2 rounded-full transition-colors',
      isActive
        ? 'bg-white/20 text-white'
        : 'text-white/60 hover:text-white hover:bg-white/10',
    )

  return (
    <>
      {/* System Navigation Pills — top-right */}
      {navigationSystems && navigationSystems.length > 1 && onNavigateSystem && (
        <div className="absolute top-3 right-3 z-50 flex gap-1.5">
          {navigationSystems.map((sys) => (
            <button
              key={sys.id}
              onClick={() => onNavigateSystem(sys.id)}
              className={cn(
                'px-3 py-1.5 rounded-full text-[11px] font-medium transition-all border backdrop-blur-xl',
                sys.id === currentSystemId
                  ? 'bg-purple-500/30 border-purple-400/40 text-white'
                  : 'bg-black/50 border-white/10 text-white/60 hover:text-white hover:bg-black/70',
              )}
            >
              {sys.name}
            </button>
          ))}
        </div>
      )}

      {/* Edit Toggle — top-left */}
      <div className="absolute top-3 left-3 z-50">
        <button
          onClick={() => {
            const next = !editEnabled
            setEditEnabled(next)
            onEditEnabledChange?.(next)
          }}
          className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-black/60 backdrop-blur-xl border border-white/10 cursor-pointer select-none hover:bg-black/70 transition-colors"
        >
          <span className="text-[11px] text-white/70 font-medium">Bearbeiten</span>
          <div
            className={cn(
              'relative w-10 h-[22px] rounded-full transition-colors duration-200',
              editEnabled ? 'bg-purple-500' : 'bg-white/20',
            )}
          >
            <span
              className={cn(
                'absolute top-[3px] left-[3px] w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200',
                editEnabled ? 'translate-x-[18px]' : 'translate-x-0',
              )}
            />
          </div>
        </button>
      </div>

      {/* Runtime Badge — top-left below edit toggle */}
      {(isExecuting || (executionDone && execDuration > 0)) && (
        <div className="absolute top-14 left-3 z-50">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-black/60 backdrop-blur-xl border border-white/10">
            {isExecuting && !executionDone ? (
              <>
                <Loader2 size={13} className="text-purple-400 animate-spin" />
                <span className="text-[12px] text-white/90 font-mono tabular-nums">
                  {mins}:{secs}.{tenths}
                </span>
                <span className="text-[10px] text-white/50">läuft</span>
              </>
            ) : (
              <>
                <CheckCircle2 size={13} className="text-emerald-400" />
                <span className="text-[12px] text-white/90 font-mono tabular-nums">
                  {execDuration.toFixed(1)}s
                </span>
                <span className="text-[10px] text-white/50">abgeschlossen</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Documents Panel — left side, toggleable */}
      {outputs && outputs.length > 0 && (
        <div className="absolute left-3 z-50" style={{ top: (isExecuting || (executionDone && execDuration > 0)) ? 112 : 56 }}>
          <button
            onClick={() => setShowDocs((s) => !s)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-black/60 backdrop-blur-xl border border-white/10 hover:bg-black/70 transition-colors mb-1.5"
          >
            <FileText size={13} className="text-white/60" />
            <span className="text-[11px] text-white/70 font-medium">Dokumente</span>
            <span className="text-[10px] text-white/40 ml-1">{outputs.length}</span>
          </button>
          {showDocs && (
            <div className="w-56 bg-black/70 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
              <div className="max-h-60 overflow-y-auto p-2 space-y-0.5">
                {outputs.map((out) => {
                  const TypeIcon = getOutputIcon(out.type)
                  return (
                    <div key={out.id} className="flex items-center gap-2 px-2.5 py-2 rounded-xl hover:bg-white/10 transition-colors cursor-pointer">
                      <TypeIcon size={13} className="text-white/50 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] text-white/90 font-medium truncate">{out.title}</p>
                        <p className="text-[9px] text-white/40 capitalize">{out.type}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Bottom Floating Bar — auto-hide */}
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 z-50 px-2 pt-6 pb-4"
        onMouseEnter={handleBarEnter}
        onMouseLeave={handleBarLeave}
      >
        <div
          className="flex items-center gap-3 px-5 py-2.5 bg-black/70 backdrop-blur-xl rounded-full shadow-2xl border border-white/10"
          style={{ opacity: barVisible ? 1 : 0, transition: 'opacity 0.6s ease' }}
        >
          {/* Label */}
          <span className="text-[11px] text-white/50 font-medium whitespace-nowrap">
            Präsentationsmodus
          </span>

          <div className="w-px h-4 bg-white/10" />

          {/* Grid toggle */}
          <button
            onClick={onToggleGrid}
            className={barBtn(showGrid)}
            title="Raster"
          >
            <Grid3X3 size={14} />
          </button>

          {/* Groups toggle */}
          <button
            onClick={onToggleGroups}
            className={barBtn(showGroupBackgrounds)}
            title="Gruppen"
          >
            <Layers size={14} />
          </button>

          {/* Fit to screen */}
          <button
            onClick={onFitToContent}
            className={barBtn(false)}
            title="Ansicht zentrieren"
          >
            <Crosshair size={14} />
          </button>

          <div className="w-px h-4 bg-white/10" />

          {/* Execute / Stop */}
          {isExecuting ? (
            <button
              onClick={onStop}
              className="p-2 rounded-full bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
              title="Stoppen"
            >
              <Square size={14} />
            </button>
          ) : (
            <button
              onClick={onExecute}
              className="p-2 rounded-full bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors"
              title="Ausführen"
            >
              <Play size={14} />
            </button>
          )}

          {/* Phase Navigation */}
          {groups && groups.length > 1 && onNavigatePhase && currentPhaseIndex !== undefined && (
            <>
              <div className="w-px h-4 bg-white/10" />
              <button
                onClick={() => onNavigatePhase(Math.max(0, currentPhaseIndex - 1))}
                className={barBtn(false)}
                title="Vorherige Phase"
                disabled={currentPhaseIndex <= 0}
                style={{ opacity: currentPhaseIndex <= 0 ? 0.3 : 1 }}
              >
                <ChevronLeft size={14} />
              </button>
              <span className="text-[11px] text-white/70 font-medium min-w-[80px] text-center truncate">
                {groups[currentPhaseIndex]?.label ?? `Phase ${currentPhaseIndex + 1}`}
              </span>
              <button
                onClick={() => onNavigatePhase(Math.min(groups.length - 1, currentPhaseIndex + 1))}
                className={barBtn(false)}
                title="Nächste Phase"
                disabled={currentPhaseIndex >= groups.length - 1}
                style={{ opacity: currentPhaseIndex >= groups.length - 1 ? 0.3 : 1 }}
              >
                <ChevronRight size={14} />
              </button>
            </>
          )}

          <div className="w-px h-4 bg-white/10" />

          {/* Exit */}
          <button
            onClick={() => {
              onRestoreView?.(prevGridRef.current, prevGroupsRef.current)
              // Exit fullscreen which triggers fullscreenchange → onExit
              if (document.fullscreenElement) {
                document.exitFullscreen().catch(() => onExit())
              } else {
                onExit()
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-colors"
          >
            <XIcon size={12} />
            Beenden
          </button>
        </div>
      </div>
    </>
  )
}
