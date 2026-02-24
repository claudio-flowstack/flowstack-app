import { useState } from 'react'
import { cn } from '@/shared/lib/utils'
import {
  X, Sparkles, AlertTriangle, Info, Zap, ShieldAlert, TrendingUp, Check,
} from 'lucide-react'

interface InsightsPanelProps {
  open: boolean
  onClose: () => void
}

type Severity = 'info' | 'warning' | 'improvement'

interface InsightCard {
  id: string
  title: string
  description: string
  severity: Severity
  category: string
}

const SEVERITY_CONFIG: Record<Severity, { icon: typeof Info; color: string; bg: string }> = {
  info: {
    icon: Info,
    color: 'text-blue-500 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-500/10',
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-amber-500 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-500/10',
  },
  improvement: {
    icon: TrendingUp,
    color: 'text-emerald-500 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-500/10',
  },
}

const MOCK_INSIGHTS: InsightCard[] = [
  {
    id: 'ins-1',
    title: 'Unnötige Schleife erkannt',
    description: 'Der Iterator-Node "Daten verarbeiten" iteriert über ein Array mit nur einem Element. Entfernen Sie den Iterator für bessere Performance.',
    severity: 'improvement',
    category: 'Performance',
  },
  {
    id: 'ins-2',
    title: 'Fehlender Error Handler',
    description: 'Der API-Aufruf "CRM Update" hat keinen Error Handler. Bei einem Fehler bricht der gesamte Workflow ab.',
    severity: 'warning',
    category: 'Fehlerbehandlung',
  },
  {
    id: 'ins-3',
    title: 'Retry-Strategie empfohlen',
    description: 'Der Node "E-Mail senden" hat keine Retry-Konfiguration. Netzwerkfehler könnten den Workflow stoppen.',
    severity: 'warning',
    category: 'Fehlerbehandlung',
  },
  {
    id: 'ins-4',
    title: 'Parallelisierung möglich',
    description: 'Die Nodes "PDF generieren" und "Daten exportieren" sind unabhängig voneinander und können parallel ausgeführt werden.',
    severity: 'improvement',
    category: 'Performance',
  },
  {
    id: 'ins-5',
    title: 'Variable nicht genutzt',
    description: 'Die globale Variable "debugMode" wird in keinem Node referenziert. Entfernen Sie sie oder nutzen Sie sie in einem Condition-Node.',
    severity: 'info',
    category: 'Optimierung',
  },
]

export function InsightsPanel({ open, onClose }: InsightsPanelProps) {
  const [feedback, setFeedback] = useState<string | null>(null)

  if (!open) return null

  function handleApply(insightId: string) {
    setFeedback(insightId)
    setTimeout(() => setFeedback(null), 1500)
  }

  return (
    <div className="absolute right-0 top-0 z-40 w-72 h-full bg-card border-l border-border shadow-2xl flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3 shrink-0">
        <span className="flex items-center gap-2 text-xs font-bold text-foreground">
          <Sparkles className="h-3.5 w-3.5" />
          KI-Insights
        </span>
        <button
          onClick={onClose}
          className="rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Summary */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border text-[10px] text-muted-foreground shrink-0">
        <span className="flex items-center gap-1">
          <ShieldAlert className="h-3 w-3 text-amber-500" />
          {MOCK_INSIGHTS.filter((i) => i.severity === 'warning').length} Warnungen
        </span>
        <span className="flex items-center gap-1">
          <Zap className="h-3 w-3 text-emerald-500" />
          {MOCK_INSIGHTS.filter((i) => i.severity === 'improvement').length} Verbesserungen
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {MOCK_INSIGHTS.map((insight) => {
          const config = SEVERITY_CONFIG[insight.severity]
          const Icon = config.icon

          return (
            <div
              key={insight.id}
              className="rounded-lg border border-border p-3 space-y-2"
            >
              {/* Icon + Title */}
              <div className="flex items-start gap-2">
                <div className={cn('rounded-md p-1 shrink-0', config.bg)}>
                  <Icon className={cn('h-3.5 w-3.5', config.color)} />
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs font-semibold text-foreground leading-tight">
                    {insight.title}
                  </p>
                  <p className="text-[10px] text-muted-foreground">{insight.category}</p>
                </div>
              </div>

              {/* Description */}
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                {insight.description}
              </p>

              {/* Apply button / feedback */}
              {feedback === insight.id ? (
                <div className="w-full flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-[10px] font-medium bg-emerald-100 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                  <Check className="h-3 w-3" />
                  Angewendet
                </div>
              ) : (
                <button
                  onClick={() => handleApply(insight.id)}
                  className={cn(
                    'w-full rounded-md px-2 py-1.5 text-[10px] font-medium transition-colors',
                    'bg-purple-100 dark:bg-purple-500/15 text-purple-600 dark:text-purple-400',
                    'hover:bg-purple-200 dark:hover:bg-purple-500/25',
                  )}
                >
                  Anwenden
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
