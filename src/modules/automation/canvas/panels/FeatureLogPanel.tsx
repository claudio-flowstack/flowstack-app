import { useState, useMemo } from 'react'
import { cn } from '@/shared/lib/utils'
import { X, FlaskConical, Search } from 'lucide-react'
import { NODELAB_FEATURES } from '../../domain/constants'

interface FeatureLogPanelProps {
  open: boolean
  onClose: () => void
}

const TIER_CONFIG: Record<string, { label: string; color: string }> = {
  v2: {
    label: 'V2',
    color: 'bg-blue-100 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400',
  },
  v3: {
    label: 'V3',
    color: 'bg-amber-100 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400',
  },
  v4: {
    label: 'V4',
    color: 'bg-purple-100 dark:bg-purple-500/15 text-purple-600 dark:text-purple-400',
  },
}

export function FeatureLogPanel({ open, onClose }: FeatureLogPanelProps) {
  const [search, setSearch] = useState('')
  const [toggles, setToggles] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {}
    for (const f of NODELAB_FEATURES) {
      initial[f.id] = f.enabled
    }
    return initial
  })

  const handleToggle = (featureId: string) => {
    setToggles((prev) => ({ ...prev, [featureId]: !prev[featureId] }))
  }

  const filtered = useMemo(() => {
    if (!search.trim()) return NODELAB_FEATURES
    const q = search.toLowerCase()
    return NODELAB_FEATURES.filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        f.nameEn.toLowerCase().includes(q) ||
        f.description.toLowerCase().includes(q),
    )
  }, [search])

  const grouped = useMemo(() => {
    const groups: Record<string, typeof filtered> = { v2: [], v3: [], v4: [] }
    for (const f of filtered) {
      const key = f.introducedIn
      if (!groups[key]) groups[key] = []
      groups[key].push(f)
    }
    return groups
  }, [filtered])

  const totalCount = NODELAB_FEATURES.length
  const enabledCount = Object.values(toggles).filter(Boolean).length

  if (!open) return null

  return (
    <div className="absolute right-0 top-0 z-40 w-72 h-full bg-card border-l border-border shadow-2xl flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3 shrink-0">
        <span className="flex items-center gap-2 text-xs font-bold text-foreground">
          <FlaskConical className="h-3.5 w-3.5" />
          Feature-Protokoll
        </span>
        <button
          onClick={onClose}
          className="rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Summary */}
      <div className="px-4 py-2 border-b border-border text-[10px] text-muted-foreground flex items-center justify-between shrink-0">
        <span>{totalCount} Features</span>
        <span>{enabledCount} aktiviert</span>
      </div>

      {/* Search */}
      <div className="px-4 py-2 border-b border-border shrink-0">
        <div className="flex items-center gap-2 rounded-md border border-border bg-muted/50 px-2.5 py-1.5">
          <Search className="h-3 w-3 text-muted-foreground shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Feature suchen..."
            className="flex-1 bg-transparent text-[11px] text-foreground placeholder:text-muted-foreground/50 outline-none"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {(['v2', 'v3', 'v4'] as const).map((tier) => {
          const features = grouped[tier]
          if (!features || features.length === 0) return null
          const tierCfg = TIER_CONFIG[tier]
          if (!tierCfg) return null

          return (
            <div key={tier} className="space-y-2">
              {/* Tier header */}
              <div className="flex items-center gap-2">
                <span className={cn('text-[10px] font-bold rounded px-1.5 py-0.5', tierCfg.color)}>
                  {tierCfg.label}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {features.length} Feature{features.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Feature list */}
              <div className="space-y-1">
                {features.map((feature) => {
                  const isEnabled = toggles[feature.id] ?? feature.enabled

                  return (
                    <div
                      key={feature.id}
                      className={cn(
                        'flex items-center gap-2 rounded-md px-2.5 py-2 transition-colors',
                        'hover:bg-muted/50',
                      )}
                    >
                      {/* Toggle */}
                      <button
                        onClick={() => handleToggle(feature.id)}
                        className={cn(
                          'relative h-4 w-7 rounded-full transition-colors shrink-0',
                          isEnabled
                            ? 'bg-purple-500'
                            : 'bg-gray-300 dark:bg-zinc-600',
                        )}
                        title={isEnabled ? 'Deaktivieren' : 'Aktivieren'}
                      >
                        <span
                          className={cn(
                            'absolute top-0.5 h-3 w-3 rounded-full bg-white transition-transform',
                            isEnabled ? 'left-3.5' : 'left-0.5',
                          )}
                        />
                      </button>

                      {/* Name + tier badge */}
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-medium text-foreground truncate">
                          {feature.name}
                        </p>
                      </div>

                      {/* Tier badge */}
                      <span className={cn('text-[8px] font-bold rounded px-1 py-0.5 shrink-0', tierCfg.color)}>
                        {tierCfg.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}

        {filtered.length === 0 && (
          <div className="py-8 text-center text-[11px] text-muted-foreground">
            Keine Features gefunden
          </div>
        )}
      </div>
    </div>
  )
}
