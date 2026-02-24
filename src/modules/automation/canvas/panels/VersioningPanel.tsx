import { useState } from 'react'
import { cn } from '@/shared/lib/utils'
import { X, GitBranch, RotateCcw, Check } from 'lucide-react'

interface VersioningPanelProps {
  open: boolean
  onClose: () => void
}

interface WorkflowVersionEntry {
  id: string
  version: string
  timestamp: string
  description: string
  diff: string
  isCurrent: boolean
}

const MOCK_VERSIONS: WorkflowVersionEntry[] = [
  {
    id: 'v-5',
    version: 'v1.4',
    timestamp: '2026-02-19T14:00:00Z',
    description: 'Error Handler und Retry-Logik hinzugefügt',
    diff: '+3 Nodes, +2 Connections',
    isCurrent: true,
  },
  {
    id: 'v-4',
    version: 'v1.3',
    timestamp: '2026-02-18T16:30:00Z',
    description: 'KI-Agent Node für Klassifizierung integriert',
    diff: '+2 Nodes, +1 Connection',
    isCurrent: false,
  },
  {
    id: 'v-3',
    version: 'v1.2',
    timestamp: '2026-02-17T11:15:00Z',
    description: 'If-Else Verzweigung für Datenfilterung',
    diff: '+1 Node, +2 Connections, -1 Connection',
    isCurrent: false,
  },
  {
    id: 'v-2',
    version: 'v1.1',
    timestamp: '2026-02-15T09:45:00Z',
    description: 'E-Mail Output und Slack Benachrichtigung',
    diff: '+2 Nodes, +2 Connections',
    isCurrent: false,
  },
  {
    id: 'v-1',
    version: 'v1.0',
    timestamp: '2026-02-14T08:00:00Z',
    description: 'Initialer Workflow mit Trigger und AI Node',
    diff: '+4 Nodes, +3 Connections',
    isCurrent: false,
  },
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

export function VersioningPanel({ open, onClose }: VersioningPanelProps) {
  const [feedback, setFeedback] = useState<string | null>(null)

  if (!open) return null

  function handleRestore(versionId: string) {
    setFeedback(versionId)
    setTimeout(() => setFeedback(null), 1500)
  }

  return (
    <div className="absolute right-0 top-0 z-40 w-72 h-full bg-card border-l border-border shadow-2xl flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3 shrink-0">
        <span className="flex items-center gap-2 text-xs font-bold text-foreground">
          <GitBranch className="h-3.5 w-3.5" />
          Versionsverlauf
        </span>
        <button
          onClick={onClose}
          className="rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Summary */}
      <div className="px-4 py-2.5 border-b border-border text-[10px] text-muted-foreground shrink-0">
        {MOCK_VERSIONS.length} Versionen gespeichert
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Timeline */}
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border" />

          <div className="space-y-4">
            {MOCK_VERSIONS.map((version) => (
              <div key={version.id} className="relative pl-6">
                {/* Timeline dot */}
                <div
                  className={cn(
                    'absolute left-0 top-1 h-3.5 w-3.5 rounded-full border-2 flex items-center justify-center',
                    version.isCurrent
                      ? 'border-purple-500 bg-purple-100 dark:bg-purple-500/20'
                      : 'border-border bg-card',
                  )}
                >
                  {version.isCurrent && (
                    <Check className="h-2 w-2 text-purple-500" />
                  )}
                </div>

                {/* Version card */}
                <div
                  className={cn(
                    'rounded-lg border p-3 space-y-2',
                    version.isCurrent
                      ? 'border-purple-300 dark:border-purple-500/40 bg-purple-50/50 dark:bg-purple-500/5'
                      : 'border-border',
                  )}
                >
                  {/* Version + badge */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground">
                      {version.version}
                    </span>
                    {version.isCurrent && (
                      <span className="text-[9px] font-medium rounded-full px-1.5 py-0.5 bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400">
                        Aktuell
                      </span>
                    )}
                  </div>

                  {/* Timestamp */}
                  <p className="text-[10px] text-muted-foreground">
                    {formatTimestamp(version.timestamp)}
                  </p>

                  {/* Description */}
                  <p className="text-[11px] text-foreground leading-relaxed">
                    {version.description}
                  </p>

                  {/* Diff indicator */}
                  <p className="text-[10px] font-mono text-muted-foreground">
                    {version.diff}
                  </p>

                  {/* Restore button / feedback */}
                  {!version.isCurrent && (
                    feedback === version.id ? (
                      <div className="w-full flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-[10px] font-medium bg-emerald-100 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                        <Check className="h-3 w-3" />
                        Wiederhergestellt
                      </div>
                    ) : (
                      <button
                        onClick={() => handleRestore(version.id)}
                        className={cn(
                          'w-full flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-[10px] font-medium transition-colors',
                          'border border-border text-muted-foreground',
                          'hover:bg-muted hover:text-foreground',
                        )}
                      >
                        <RotateCcw className="h-3 w-3" />
                        Wiederherstellen
                      </button>
                    )
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
