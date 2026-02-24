import type { BatchProgress } from '../domain/types'
import { Loader2, X } from 'lucide-react'

interface Props {
  progress: BatchProgress
  onCancel: () => void
}

export function EnrichmentProgress({ progress, onCancel }: Props) {
  const pct = progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0
  const etaMin = Math.ceil(progress.eta_seconds / 60)

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <span className="text-sm font-medium text-foreground">Batch Enrichment laeuft...</span>
        </div>
        <button
          onClick={onCancel}
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <X className="h-3.5 w-3.5" /> Abbrechen
        </button>
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex items-center justify-between text-sm mb-1.5">
          <span className="text-muted-foreground truncate max-w-[200px]">{progress.firma}</span>
          <span className="text-foreground font-medium">{progress.current}/{progress.total} ({pct}%)</span>
        </div>
        <div className="h-2.5 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat label="GF gefunden" value={progress.gf_found} />
        <Stat label="Emails" value={progress.emails_found} />
        <Stat label="Websites" value={progress.websites_found} />
        <Stat label="Geschwindigkeit" value={`${progress.rate}/min`} />
      </div>

      {etaMin > 0 && (
        <p className="text-xs text-muted-foreground">
          Geschaetzte Restzeit: ~{etaMin} Min
        </p>
      )}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg bg-muted/50 px-3 py-2">
      <div className="text-lg font-bold text-foreground">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  )
}
