import { useState, useRef, useEffect } from 'react'
import type { AutomationSystem } from '../domain/types'
import { cn } from '@/shared/lib/utils'
import { formatDate } from '@/shared/lib/utils'
import {
  MoreHorizontal,
  Copy,
  Trash2,
  Pencil,
  Play,
  Pause,
  ExternalLink,
  Workflow,
  Layers,
} from 'lucide-react'

interface SystemCardProps {
  system: AutomationSystem
  subSystemCount?: number
  onOpen: (id: string) => void
  onDelete: (id: string) => void
  onDuplicate: (id: string) => void
  onToggleStatus: (id: string) => void
}

export function SystemCard({
  system,
  subSystemCount = 0,
  onOpen,
  onDelete,
  onDuplicate,
  onToggleStatus,
}: SystemCardProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen])

  return (
    <div
      className={cn(
        'group relative rounded-xl border bg-card p-4 cursor-pointer',
        'hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5',
        'transition-all duration-200',
        system.status === 'active'
          ? 'border-border'
          : 'border-dashed border-border/60',
      )}
      onClick={() => onOpen(system.id)}
    >
      {/* Header row */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-lg',
              system.status === 'active'
                ? 'bg-primary/10 text-primary'
                : 'bg-muted text-muted-foreground',
            )}
          >
            <Workflow className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground line-clamp-1">
              {system.name}
            </h3>
            <span
              className={cn(
                'inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider mt-0.5',
                system.status === 'active'
                  ? 'text-emerald-500'
                  : 'text-muted-foreground',
              )}
            >
              <span
                className={cn(
                  'h-1.5 w-1.5 rounded-full',
                  system.status === 'active'
                    ? 'bg-emerald-500'
                    : 'bg-muted-foreground/50',
                )}
              />
              {system.status === 'active' ? 'Aktiv' : 'Entwurf'}
            </span>
          </div>
        </div>

        {/* Context menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={(e) => {
              e.stopPropagation()
              setMenuOpen(!menuOpen)
            }}
            className="rounded-lg p-1.5 text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-muted transition-all"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 w-44 rounded-lg border border-border bg-popover p-1 shadow-lg z-50 animate-fade-in">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onOpen(system.id)
                  setMenuOpen(false)
                }}
                className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-sm text-foreground hover:bg-muted transition-colors"
              >
                <Pencil className="h-3.5 w-3.5" />
                Öffnen
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onToggleStatus(system.id)
                  setMenuOpen(false)
                }}
                className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-sm text-foreground hover:bg-muted transition-colors"
              >
                {system.status === 'active' ? (
                  <Pause className="h-3.5 w-3.5" />
                ) : (
                  <Play className="h-3.5 w-3.5" />
                )}
                {system.status === 'active' ? 'Deaktivieren' : 'Aktivieren'}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onDuplicate(system.id)
                  setMenuOpen(false)
                }}
                className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-sm text-foreground hover:bg-muted transition-colors"
              >
                <Copy className="h-3.5 w-3.5" />
                Duplizieren
              </button>
              {system.webhookUrl && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    navigator.clipboard.writeText(system.webhookUrl)
                    setMenuOpen(false)
                  }}
                  className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-sm text-foreground hover:bg-muted transition-colors"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Webhook kopieren
                </button>
              )}
              <div className="my-1 h-px bg-border" />
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(system.id)
                  setMenuOpen(false)
                }}
                className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-sm text-red-500 hover:bg-red-500/10 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Löschen
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      <p className="mt-3 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
        {system.description}
      </p>

      {/* Footer stats */}
      <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-3">
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
          <span>{system.nodes.length} Nodes</span>
          <span className="h-3 w-px bg-border" />
          <span>{system.executionCount} Ausführungen</span>
          {subSystemCount > 0 && (
            <>
              <span className="h-3 w-px bg-border" />
              <span className="flex items-center gap-1 text-indigo-500">
                <Layers className="h-3 w-3" />
                {subSystemCount} Sub
              </span>
            </>
          )}
        </div>
        {system.lastExecuted && (
          <span className="text-[11px] text-muted-foreground/70">
            {formatDate(system.lastExecuted)}
          </span>
        )}
      </div>
    </div>
  )
}
