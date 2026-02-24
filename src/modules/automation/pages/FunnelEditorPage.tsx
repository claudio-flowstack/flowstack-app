import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { FunnelCanvas } from '../funnel/FunnelCanvas'
import { ErrorBoundary } from '@/shared/components/ErrorBoundary'
import { useAutomationStore } from '../application/automation-store'
import { ArrowLeft } from 'lucide-react'
import type { FunnelElement, FunnelConnection, FunnelPhase } from '../domain/types'

export function FunnelEditorPage() {
  const navigate = useNavigate()
  const { funnelId } = useParams<{ funnelId: string }>()

  const {
    funnelBoards,
    fetchFunnelBoards,
    updateFunnelBoard,
    createFunnelBoard,
  } = useAutomationStore()

  // Load boards on mount
  useEffect(() => {
    if (funnelBoards.length === 0) {
      fetchFunnelBoards()
    }
  }, [funnelBoards.length, fetchFunnelBoards])

  // Find the current board
  const board = useMemo(
    () => funnelBoards.find((b) => b.id === funnelId) ?? null,
    [funnelBoards, funnelId],
  )

  // If funnelId is "new", create a new board and redirect
  const creatingRef = useRef(false)
  useEffect(() => {
    if (funnelId === 'new' && funnelBoards.length > 0 && !creatingRef.current) {
      creatingRef.current = true
      createFunnelBoard({ name: 'Neuer Funnel' }).then((newBoard) => {
        navigate(`/automation/funnel/${newBoard.id}`, { replace: true })
      })
    }
  }, [funnelId, funnelBoards.length, createFunnelBoard, navigate])

  // Save handler
  const handleSave = useCallback(
    (data: { elements: FunnelElement[]; connections: FunnelConnection[]; phases: FunnelPhase[] }) => {
      if (!board) return
      updateFunnelBoard(board.id, {
        elements: data.elements,
        connections: data.connections,
        phases: data.phases,
      })
    },
    [board, updateFunnelBoard],
  )

  const boardName = board?.name ?? 'Funnel Visualizer'

  return (
    <div className="flex flex-col h-screen bg-background" style={{ overflow: 'hidden', overscrollBehavior: 'none' }}>
      {/* Slim header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-2 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/automation')}
            className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Zurück
          </button>
          <div className="w-px h-5 bg-border" />
          <div>
            <h1 className="text-sm font-semibold text-foreground leading-tight">{boardName}</h1>
            <p className="text-[10px] text-muted-foreground">Funnel-Editor</p>
          </div>
        </div>
      </div>
      <div className="flex-1 min-h-0">
        <ErrorBoundary>
          <FunnelCanvas
            initialBoard={board ?? undefined}
            onSave={handleSave}
          />
        </ErrorBoundary>
      </div>
    </div>
  )
}
