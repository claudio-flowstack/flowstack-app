import { useState, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/shared/lib/utils'
import { Header } from '@/shell/Header'
import {
  FlaskConical,
  ChevronDown,
  ChevronUp,
  Boxes,
  ToggleLeft,
  Sparkles,
  PenTool,
  LayoutGrid as LayoutGridIcon,
} from 'lucide-react'
import { LAB_NODE_TYPE_CONFIG, NODELAB_FEATURES } from '../domain/constants'
import { getNodeIcon } from '../canvas/icons'
import { WorkflowCanvas } from '../canvas/WorkflowCanvas'
import { useAutomationStore } from '../application/automation-store'
import type { LabNodeType, FeatureInfo } from '../domain/types'

// ── Node Descriptions (German) ──────────────────────────────────────────────

const NODE_DESCRIPTIONS: Record<LabNodeType, string> = {
  trigger: 'Startet den Workflow bei einem Event',
  process: 'Verarbeitet und transformiert Daten',
  ai: 'KI-gest\u00FCtzte Verarbeitung mit LLMs',
  output: 'Gibt Ergebnisse aus oder sendet Daten',
  subsystem: 'Eingebettetes Sub-Workflow-System',
  ifelse: 'Bedingte Verzweigung (Wenn/Dann)',
  merge: 'F\u00FChrt mehrere Pfade zusammen',
  wait: 'Pausiert den Workflow f\u00FCr eine Dauer',
  iterator: 'Iteriert \u00FCber eine Liste von Elementen',
  router: 'Verteilt Daten an verschiedene Pfade',
  'error-handler': 'F\u00E4ngt Fehler ab und behandelt sie',
  approval: 'Wartet auf manuelle Freigabe',
  agent: 'Autonomer KI-Agent mit Tools',
  fork: 'Teilt in parallele Ausf\u00FChrungspfade',
  join: 'Wartet auf alle parallelen Pfade',
  'condition-agent': 'KI-basierte Entscheidungslogik',
}

// ── Node Icon Keys ──────────────────────────────────────────────────────────

const NODE_ICON_KEYS: Record<LabNodeType, string> = {
  trigger: 'zap',
  process: 'workflow',
  ai: 'sparkles',
  output: 'send',
  subsystem: 'layers',
  ifelse: 'git-branch',
  merge: 'git-merge',
  wait: 'clock',
  iterator: 'repeat',
  router: 'shuffle',
  'error-handler': 'shield-alert',
  approval: 'shield-check',
  agent: 'brain-circuit',
  fork: 'git-fork',
  join: 'git-merge',
  'condition-agent': 'brain',
}

// ── Tab Definitions ─────────────────────────────────────────────────────────

interface TabDef {
  key: string
  label: string
  types: LabNodeType[] | null
}

const TABS: TabDef[] = [
  { key: 'alle', label: 'Alle', types: null },
  { key: 'trigger', label: 'Trigger', types: ['trigger'] },
  { key: 'prozess', label: 'Prozess', types: ['process', 'subsystem'] },
  { key: 'ki', label: 'KI', types: ['ai', 'agent', 'condition-agent'] },
  { key: 'output', label: 'Output', types: ['output'] },
  { key: 'logik', label: 'Logik', types: ['ifelse', 'merge', 'router', 'fork', 'join'] },
  { key: 'erweitert', label: 'Erweitert', types: ['wait', 'iterator', 'error-handler', 'approval'] },
]

// ── Category Badge Map ──────────────────────────────────────────────────────

const NODE_CATEGORY: Record<LabNodeType, string> = {
  trigger: 'Trigger',
  process: 'Prozess',
  ai: 'KI',
  output: 'Output',
  subsystem: 'Prozess',
  ifelse: 'Logik',
  merge: 'Logik',
  wait: 'Erweitert',
  iterator: 'Erweitert',
  router: 'Logik',
  'error-handler': 'Erweitert',
  approval: 'Erweitert',
  agent: 'KI',
  fork: 'Logik',
  join: 'Logik',
  'condition-agent': 'KI',
}

// ── All 16 Node Types ───────────────────────────────────────────────────────

const ALL_NODE_TYPES: LabNodeType[] = [
  'trigger',
  'process',
  'ai',
  'output',
  'subsystem',
  'ifelse',
  'merge',
  'wait',
  'iterator',
  'router',
  'error-handler',
  'approval',
  'agent',
  'fork',
  'join',
  'condition-agent',
]

// ── Feature Tier Config ─────────────────────────────────────────────────────

const TIER_STYLES: Record<string, { label: string; color: string; dot: string }> = {
  v2: {
    label: 'V2',
    color: 'bg-blue-100 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400',
    dot: 'bg-blue-500',
  },
  v3: {
    label: 'V3',
    color: 'bg-amber-100 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400',
    dot: 'bg-amber-500',
  },
  v4: {
    label: 'V4',
    color: 'bg-purple-100 dark:bg-purple-500/15 text-purple-600 dark:text-purple-400',
    dot: 'bg-purple-500',
  },
}

// ── Node Card Component ─────────────────────────────────────────────────────

function NodeCard({ type }: { type: LabNodeType }) {
  const config = LAB_NODE_TYPE_CONFIG[type]
  const iconKey = NODE_ICON_KEYS[type]
  const Icon = getNodeIcon(iconKey)
  const description = NODE_DESCRIPTIONS[type]
  const category = NODE_CATEGORY[type]

  return (
    <div
      className={cn(
        'group relative rounded-xl border bg-card overflow-hidden',
        'hover:scale-[1.02] hover:shadow-lg transition-all duration-200',
        'cursor-default',
      )}
      style={{ borderColor: config.border }}
    >
      {/* Accent bar — left side */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl"
        style={{ background: config.accent }}
      />

      <div className="p-4 pl-5">
        {/* Top row: icon + category badge */}
        <div className="flex items-start justify-between mb-3">
          {/* Icon with colored background */}
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: config.bg, border: `1px solid ${config.border}` }}
          >
            {Icon ? (
              <Icon
                className="w-5 h-5"
                style={{ color: config.accent }}
              />
            ) : (
              <div
                className="w-5 h-5 rounded-full"
                style={{ background: config.accent }}
              />
            )}
          </div>

          {/* Category badge */}
          <span
            className="text-[10px] font-semibold uppercase tracking-wider rounded-md px-2 py-0.5"
            style={{
              background: config.bg,
              color: config.accent,
              border: `1px solid ${config.border}`,
            }}
          >
            {category}
          </span>
        </div>

        {/* Node type name */}
        <h3 className="text-sm font-semibold text-foreground mb-1">
          {config.label}
        </h3>

        {/* Description */}
        <p className="text-xs text-muted-foreground leading-relaxed">
          {description}
        </p>

        {/* Type key (subtle) */}
        <div className="mt-3 flex items-center gap-2">
          <span
            className="text-[9px] font-mono rounded px-1.5 py-0.5 bg-muted text-muted-foreground"
          >
            {type}
          </span>
        </div>
      </div>
    </div>
  )
}

// ── Feature Toggle Row ──────────────────────────────────────────────────────

function FeatureRow({
  feature,
  isEnabled,
  onToggle,
}: {
  feature: FeatureInfo
  isEnabled: boolean
  onToggle: () => void
}) {
  const tierStyle = TIER_STYLES[feature.introducedIn]

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors',
        'hover:bg-muted/50',
      )}
    >
      {/* Toggle switch */}
      <button
        onClick={onToggle}
        className={cn(
          'relative h-5 w-9 rounded-full transition-colors shrink-0',
          isEnabled
            ? 'bg-purple-500'
            : 'bg-gray-300 dark:bg-zinc-600',
        )}
        title={isEnabled ? 'Deaktivieren' : 'Aktivieren'}
      >
        <span
          className={cn(
            'absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform',
            isEnabled ? 'left-[18px]' : 'left-0.5',
          )}
        />
      </button>

      {/* Feature name */}
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-medium text-foreground truncate">
          {feature.name}
        </p>
        <p className="text-[10px] text-muted-foreground truncate mt-0.5">
          {feature.description}
        </p>
      </div>

      {/* Tier badge */}
      {tierStyle && (
        <span
          className={cn(
            'text-[9px] font-bold rounded px-1.5 py-0.5 shrink-0',
            tierStyle.color,
          )}
        >
          {tierStyle.label}
        </span>
      )}
    </div>
  )
}

// ── Feature Section (grouped by version) ────────────────────────────────────

function FeatureGroup({
  tier,
  features,
  toggles,
  onToggle,
}: {
  tier: string
  features: FeatureInfo[]
  toggles: Record<string, boolean>
  onToggle: (id: string) => void
}) {
  const tierStyle = TIER_STYLES[tier]
  if (!tierStyle || features.length === 0) return null

  return (
    <div className="space-y-1">
      {/* Group header */}
      <div className="flex items-center gap-2 mb-2 px-1">
        <span className={cn('text-[10px] font-bold rounded px-2 py-0.5', tierStyle.color)}>
          {tierStyle.label}
        </span>
        <span className="text-[10px] text-muted-foreground">
          {features.length} Feature{features.length !== 1 ? 's' : ''}
        </span>
        <div className="flex-1 border-t border-border" />
      </div>

      {/* Feature list */}
      <div className="space-y-0.5">
        {features.map((feature) => (
          <FeatureRow
            key={feature.id}
            feature={feature}
            isEnabled={toggles[feature.id] ?? feature.enabled}
            onToggle={() => onToggle(feature.id)}
          />
        ))}
      </div>
    </div>
  )
}

// ── View Mode Type ─────────────────────────────────────────────────────────

type LabViewMode = 'canvas' | 'catalog'

// ── Main Component: NodeLabPage ─────────────────────────────────────────────

export function NodeLabPage() {
  const navigate = useNavigate()
  const { createSystem } = useAutomationStore()
  const [viewMode, setViewMode] = useState<LabViewMode>('canvas')
  const [activeTab, setActiveTab] = useState('alle')
  const [featuresOpen, setFeaturesOpen] = useState(false)
  const [toggles, setToggles] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {}
    for (const f of NODELAB_FEATURES) {
      initial[f.id] = f.enabled
    }
    return initial
  })

  // ── Filtered node types based on active tab ───────────────────────────────

  const filteredNodes = useMemo(() => {
    const tab = TABS.find((t) => t.key === activeTab)
    if (!tab || tab.types === null) return ALL_NODE_TYPES
    return ALL_NODE_TYPES.filter((type) => tab.types!.includes(type))
  }, [activeTab])

  // ── Feature grouping ──────────────────────────────────────────────────────

  const groupedFeatures = useMemo(() => {
    const groups: Record<string, FeatureInfo[]> = { v2: [], v3: [], v4: [] }
    for (const f of NODELAB_FEATURES) {
      const key = f.introducedIn
      if (!groups[key]) groups[key] = []
      groups[key].push(f)
    }
    return groups
  }, [])

  // ── Stats ─────────────────────────────────────────────────────────────────

  const totalFeatures = NODELAB_FEATURES.length
  const enabledCount = Object.values(toggles).filter(Boolean).length

  // ── Toggle handler ────────────────────────────────────────────────────────

  function handleToggle(featureId: string) {
    setToggles((prev) => ({ ...prev, [featureId]: !prev[featureId] }))
  }

  // ── Canvas save handler ───────────────────────────────────────────────────

  const handleCanvasSave = useCallback(
    async (data: {
      nodes: { id: string; label: string; description: string; icon: string; type: string; x: number; y: number }[]
      connections: { from: string; to: string }[]
    }) => {
      const system = await createSystem({
        name: 'Node Lab System',
        description: 'Erstellt im Node Lab',
        nodes: data.nodes as never[],
        connections: data.connections as never[],
      })
      navigate(`/automation/system/${system.id}`)
    },
    [createSystem, navigate],
  )

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col min-h-0 h-full">
      {/* Header */}
      <Header
        title="Node Lab"
        subtitle={viewMode === 'canvas' ? 'Freier Workflow-Builder' : 'Erkunde alle Node-Typen und Features'}
        actions={
          <div className="flex items-center gap-2">
            {/* View mode toggle */}
            <div className="flex items-center rounded-lg border border-border bg-card p-0.5">
              <button
                onClick={() => setViewMode('canvas')}
                className={cn(
                  'flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors',
                  viewMode === 'canvas'
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground',
                )}
                title="Canvas-Modus"
              >
                <PenTool className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Builder</span>
              </button>
              <button
                onClick={() => setViewMode('catalog')}
                className={cn(
                  'flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors',
                  viewMode === 'catalog'
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground',
                )}
                title="Katalog-Modus"
              >
                <LayoutGridIcon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Katalog</span>
              </button>
            </div>

            <FlaskConical className="h-4 w-4 text-purple-500" />
            <span className="text-xs font-medium text-muted-foreground hidden sm:inline">
              Experimentell
            </span>
          </div>
        }
      />

      {/* ── Canvas Mode ─────────────────────────────────────────────── */}
      {viewMode === 'canvas' && (
        <div className="flex-1 min-h-0">
          <WorkflowCanvas
            onSave={handleCanvasSave}
            className="h-full"
          />
        </div>
      )}

      {/* ── Catalog Mode ────────────────────────────────────────────── */}
      {viewMode === 'catalog' && (
        <>
          {/* Tab Navigation */}
          <div className="border-b border-border px-4 lg:px-6">
            <nav className="flex gap-1 -mb-px overflow-x-auto">
              {TABS.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                    activeTab === key
                      ? 'border-primary text-foreground'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border',
                  )}
                >
                  {label}
                  {key === 'alle' && (
                    <span className="text-[10px] bg-muted rounded-full px-1.5 py-0.5 text-muted-foreground">
                      {ALL_NODE_TYPES.length}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          {/* Stats Bar */}
          <div className="border-b border-border px-4 lg:px-6 py-2.5">
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Boxes className="h-3.5 w-3.5" />
                <span className="font-medium">{ALL_NODE_TYPES.length} Node-Typen</span>
              </div>
              <div className="w-px h-3.5 bg-border" />
              <div className="flex items-center gap-1.5">
                <ToggleLeft className="h-3.5 w-3.5" />
                <span className="font-medium">{totalFeatures} Features</span>
              </div>
              <div className="w-px h-3.5 bg-border" />
              <div className="flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" />
                <span className="font-medium">{enabledCount} aktiv</span>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-8">
            {/* Node Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredNodes.map((type) => (
                <NodeCard key={type} type={type} />
              ))}
            </div>

            {/* Empty state for filtered tabs */}
            {filteredNodes.length === 0 && (
              <div className="py-12 text-center">
                <p className="text-sm text-muted-foreground">
                  Keine Node-Typen in dieser Kategorie
                </p>
              </div>
            )}

            {/* ── Feature Log Section (collapsible) ───────────────────────────── */}
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              {/* Collapsible header */}
              <button
                onClick={() => setFeaturesOpen((prev) => !prev)}
                className={cn(
                  'w-full flex items-center justify-between px-5 py-4 transition-colors',
                  'hover:bg-muted/30',
                )}
              >
                <div className="flex items-center gap-3">
                  <FlaskConical className="h-4 w-4 text-purple-500" />
                  <span className="text-sm font-semibold text-foreground">Features</span>
                  <span className="text-[10px] text-muted-foreground bg-muted rounded-full px-2 py-0.5">
                    {totalFeatures} gesamt
                  </span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/15 rounded-full px-2 py-0.5">
                    {enabledCount} aktiv
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {/* Version summary pills */}
                  <div className="hidden sm:flex items-center gap-1.5">
                    {(['v2', 'v3', 'v4'] as const).map((tier) => {
                      const style = TIER_STYLES[tier]
                      const count = groupedFeatures[tier]?.length ?? 0
                      return (
                        <span
                          key={tier}
                          className={cn(
                            'text-[9px] font-bold rounded px-1.5 py-0.5',
                            style?.color,
                          )}
                        >
                          {style?.label}: {count}
                        </span>
                      )
                    })}
                  </div>
                  {featuresOpen ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </button>

              {/* Collapsible content */}
              {featuresOpen && (
                <div className="border-t border-border px-5 py-5 space-y-6">
                  {/* Version tabs row */}
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    <span className="font-medium">Versionen:</span>
                    {(['v2', 'v3', 'v4'] as const).map((tier) => {
                      const style = TIER_STYLES[tier]
                      const count = groupedFeatures[tier]?.length ?? 0
                      return (
                        <div key={tier} className="flex items-center gap-1">
                          <div className={cn('w-2 h-2 rounded-full', style?.dot)} />
                          <span>
                            {style?.label} ({count})
                          </span>
                        </div>
                      )
                    })}
                  </div>

                  {/* Feature groups by version */}
                  {(['v2', 'v3', 'v4'] as const).map((tier) => (
                    <FeatureGroup
                      key={tier}
                      tier={tier}
                      features={groupedFeatures[tier] ?? []}
                      toggles={toggles}
                      onToggle={handleToggle}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
