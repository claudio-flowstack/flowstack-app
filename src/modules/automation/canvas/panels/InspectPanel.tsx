import { useState } from 'react'
import { cn } from '@/shared/lib/utils'
import { X, Pin, Clock, Package, Search } from 'lucide-react'

interface InspectPanelProps {
  open: boolean
  nodeId: string | null
  nodeLabel: string
  nodeType: string
  data: {
    input?: string
    output?: string
    duration?: number
    items?: number
  } | null
  isPinned: boolean
  onClose: () => void
  onTogglePin: () => void
}

type Tab = 'input' | 'output'

export function InspectPanel({
  open,
  nodeId,
  nodeLabel,
  nodeType,
  data,
  isPinned,
  onClose,
  onTogglePin,
}: InspectPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>('input')

  if (!open || !nodeId) return null

  const content = activeTab === 'input' ? data?.input : data?.output

  return (
    <div className="absolute right-0 top-0 z-40 w-80 h-full bg-card border-l border-border shadow-2xl flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <span className="text-xs font-bold text-foreground truncate">
            {nodeLabel}
          </span>
          <span
            className={cn(
              'shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-medium',
              'bg-purple-100 dark:bg-purple-500/15 text-purple-600 dark:text-purple-400',
            )}
          >
            {nodeType}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onTogglePin}
            className={cn(
              'rounded-md p-1 transition-colors',
              isPinned
                ? 'text-blue-500 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted',
            )}
            title={isPinned ? 'Panel lösen' : 'Panel anheften'}
          >
            <Pin className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border shrink-0">
        {(['input', 'output'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'flex-1 px-3 py-2 text-[11px] font-medium transition-colors',
              activeTab === tab
                ? 'text-foreground border-b-2 border-purple-500 dark:border-purple-400'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {tab === 'input' ? 'Eingabe' : 'Ausgabe'}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {data && content ? (
          <pre className="text-[11px] font-mono text-foreground whitespace-pre-wrap break-words leading-relaxed">
            {content}
          </pre>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <Package className="h-8 w-8 mb-2 opacity-40" />
            <p className="text-xs">Keine Daten</p>
          </div>
        )}
      </div>

      {/* Footer badges */}
      {data && (data.duration !== undefined || data.items !== undefined) && (
        <div className="flex items-center gap-2 border-t border-border px-4 py-2.5 shrink-0">
          {data.duration !== undefined && (
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
              <Clock className="h-2.5 w-2.5" />
              {data.duration}ms
            </span>
          )}
          {data.items !== undefined && (
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
              <Package className="h-2.5 w-2.5" />
              {data.items} Elemente
            </span>
          )}
        </div>
      )}
    </div>
  )
}
