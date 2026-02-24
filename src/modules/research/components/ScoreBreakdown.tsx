import type { ScoreBreakdown as ScoreBreakdownType } from '../domain/types'
import { SCORE_CATEGORIES } from '../domain/constants'

interface Props {
  breakdown: ScoreBreakdownType
  total: number
}

export function ScoreBreakdown({ breakdown, total }: Props) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-muted-foreground">Score-Aufschluesselung</span>
        <span className="text-lg font-bold text-foreground">{total}/100</span>
      </div>
      {SCORE_CATEGORIES.map(({ key, label, max }) => {
        const value = breakdown[key as keyof ScoreBreakdownType] ?? 0
        const pct = max > 0 ? (value / max) * 100 : 0
        return (
          <div key={key} className="flex items-center gap-3 text-sm">
            <span className="w-36 shrink-0 text-muted-foreground truncate">{label}</span>
            <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  pct >= 80 ? 'bg-emerald-500' : pct >= 40 ? 'bg-amber-500' : 'bg-zinc-400'
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="w-12 text-right text-xs text-muted-foreground">
              {value}/{max}
            </span>
          </div>
        )
      })}
    </div>
  )
}
