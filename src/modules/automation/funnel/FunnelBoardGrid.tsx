import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAutomationStore } from '../application/automation-store'
import { ConfirmDialog } from '@/shared/components/ConfirmDialog'
import { EmptyState } from '@/shared/components/EmptyState'
import { cn } from '@/shared/lib/utils'
import {
  Plus,
  GitFork,
  ArrowRight,
  Trash2,
  Copy,
  MoreHorizontal,
  Calendar,
} from 'lucide-react'

export function FunnelBoardGrid() {
  const navigate = useNavigate()
  const {
    funnelBoards,
    fetchFunnelBoards,
    createFunnelBoard,
    deleteFunnelBoard,
    duplicateFunnelBoard,
  } = useAutomationStore()

  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null)

  useEffect(() => {
    fetchFunnelBoards()
  }, [fetchFunnelBoards])

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpenId) return
    function handleClick() { setMenuOpenId(null) }
    window.addEventListener('mousedown', handleClick)
    return () => window.removeEventListener('mousedown', handleClick)
  }, [menuOpenId])

  const handleCreate = async () => {
    const board = await createFunnelBoard({ name: 'Neuer Funnel' })
    navigate(`/automation/funnel/${board.id}`)
  }

  if (funnelBoards.length === 0) {
    return (
      <EmptyState
        icon={GitFork}
        title="Keine Funnels"
        description="Erstelle deinen ersten Marketing-Funnel, um Kundenreisen visuell zu planen."
        action={{ label: 'Funnel erstellen', onClick: handleCreate }}
      />
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">Funnel Visualizer</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {funnelBoards.length} Funnel{funnelBoards.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          Neuer Funnel
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {funnelBoards.map((board) => (
          <div
            key={board.id}
            className="group relative flex flex-col rounded-xl border border-border bg-card hover:border-primary/30 hover:shadow-md transition-all cursor-pointer"
            onClick={() => navigate(`/automation/funnel/${board.id}`)}
          >
            {/* Preview area */}
            <div className="h-32 rounded-t-xl bg-muted/30 flex items-center justify-center overflow-hidden">
              <div className="flex items-center gap-2">
                {board.elements.slice(0, 4).map((el, i) => (
                  <div
                    key={el.id}
                    className="h-8 rounded-md border bg-card px-2 flex items-center"
                    style={{ borderLeftColor: el.type === 'platform' ? '#8b5cf6' : '#6b7280', borderLeftWidth: 3 }}
                  >
                    <span className="text-[8px] font-medium text-foreground truncate max-w-[60px]">
                      {el.label ?? el.type}
                    </span>
                    {i < Math.min(board.elements.length, 4) - 1 && (
                      <ArrowRight className="h-2.5 w-2.5 text-muted-foreground ml-1.5 shrink-0" />
                    )}
                  </div>
                ))}
                {board.elements.length > 4 && (
                  <span className="text-[9px] text-muted-foreground">+{board.elements.length - 4}</span>
                )}
                {board.elements.length === 0 && (
                  <span className="text-xs text-muted-foreground">Leerer Funnel</span>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="p-3 flex-1">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-foreground truncate">{board.name}</h3>
                  {board.description && (
                    <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{board.description}</p>
                  )}
                </div>
                {/* Menu */}
                <div className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => setMenuOpenId(menuOpenId === board.id ? null : board.id)}
                    className="rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                  {menuOpenId === board.id && (
                    <div className="absolute right-0 top-full mt-1 w-36 rounded-lg border border-border bg-popover shadow-lg py-1 z-50" onMouseDown={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => { duplicateFunnelBoard(board.id); setMenuOpenId(null) }}
                        className="w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-muted transition-colors"
                      >
                        <Copy className="h-3 w-3" />
                        Duplizieren
                      </button>
                      <button
                        onClick={() => { setDeleteId(board.id); setMenuOpenId(null) }}
                        className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 className="h-3 w-3" />
                        Löschen
                      </button>
                    </div>
                  )}
                </div>
              </div>
              {/* Meta */}
              <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                <span>{board.elements.length} Elemente</span>
                <span>{board.connections.length} Verbindungen</span>
                {board.updatedAt && (
                  <span className="flex items-center gap-0.5">
                    <Calendar className="h-2.5 w-2.5" />
                    {new Date(board.updatedAt).toLocaleDateString('de-DE')}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Delete Confirm */}
      {deleteId && (
        <ConfirmDialog
          title="Funnel löschen?"
          description="Dieser Funnel wird unwiderruflich gelöscht."
          onConfirm={() => { deleteFunnelBoard(deleteId); setDeleteId(null) }}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </div>
  )
}
