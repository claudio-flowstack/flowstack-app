import { useState } from 'react'
import { cn } from '@/shared/lib/utils'
import { X, Clock, CheckCircle2, XCircle, Inbox, Check } from 'lucide-react'

interface HistoryPanelProps {
  open: boolean
  onClose: () => void
}

interface ExecutionRun {
  id: string
  timestamp: string
  duration: number
  status: 'success' | 'failed'
  nodeCount: number
}

const MOCK_RUNS: ExecutionRun[] = [
  { id: 'run-1', timestamp: '2026-02-19T14:32:00Z', duration: 2.4, status: 'success', nodeCount: 8 },
  { id: 'run-2', timestamp: '2026-02-19T13:15:00Z', duration: 1.8, status: 'success', nodeCount: 8 },
  { id: 'run-3', timestamp: '2026-02-19T11:45:00Z', duration: 5.1, status: 'failed', nodeCount: 6 },
  { id: 'run-4', timestamp: '2026-02-18T22:10:00Z', duration: 3.2, status: 'success', nodeCount: 8 },
  { id: 'run-5', timestamp: '2026-02-18T18:05:00Z', duration: 1.1, status: 'success', nodeCount: 7 },
  { id: 'run-6', timestamp: '2026-02-18T14:30:00Z', duration: 4.7, status: 'failed', nodeCount: 5 },
  { id: 'run-7', timestamp: '2026-02-17T09:20:00Z', duration: 2.0, status: 'success', nodeCount: 8 },
]

function formatTimestamp(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function HistoryPanel({ open, onClose }: HistoryPanelProps) {
  const [runs] = useState<ExecutionRun[]>(MOCK_RUNS)
  const [feedback, setFeedback] = useState<string | null>(null)

  if (!open) return null

  function handleClick(runId: string) {
    setFeedback(runId)
    setTimeout(() => setFeedback(null), 1500)
  }

  return (
    <div className="absolute right-0 top-0 z-40 w-72 h-full bg-card border-l border-border shadow-2xl flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3 shrink-0">
        <span className="flex items-center gap-2 text-xs font-bold text-foreground">
          <Clock className="h-3.5 w-3.5" />
          Ausführungsverlauf
        </span>
        <button
          onClick={onClose}
          className="rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {runs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Inbox className="h-8 w-8 mb-2 opacity-40" />
            <p className="text-xs">Keine Ausführungen vorhanden</p>
          </div>
        ) : (
          runs.map((run) => (
            <button
              key={run.id}
              onClick={() => handleClick(run.id)}
              className={cn(
                'w-full text-left rounded-lg border p-3 space-y-1.5 transition-colors cursor-pointer',
                feedback === run.id
                  ? 'border-emerald-300 dark:border-emerald-500/40 bg-emerald-50/50 dark:bg-emerald-500/5'
                  : 'border-border hover:bg-muted/50',
              )}
            >
              {feedback === run.id ? (
                <div className="flex items-center justify-center gap-1.5 py-1.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                  <Check className="h-3.5 w-3.5" />
                  Geladen
                </div>
              ) : (
                <>
                  {/* Top row: timestamp + status */}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground">
                      {formatTimestamp(run.timestamp)}
                    </span>
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium',
                        run.status === 'success'
                          ? 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                          : 'bg-red-100 dark:bg-red-500/15 text-red-600 dark:text-red-400',
                      )}
                    >
                      {run.status === 'success' ? (
                        <CheckCircle2 className="h-2.5 w-2.5" />
                      ) : (
                        <XCircle className="h-2.5 w-2.5" />
                      )}
                      {run.status === 'success' ? 'Erfolg' : 'Fehler'}
                    </span>
                  </div>

                  {/* Bottom row: duration + node count */}
                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                    <span>{run.duration.toFixed(1)}s</span>
                    <span>{run.nodeCount} Nodes</span>
                  </div>
                </>
              )}
            </button>
          ))
        )}
      </div>
    </div>
  )
}
