import { useState, useMemo, useCallback } from 'react'
import type { SystemNode, NodeConnection, NodeType } from '../domain/types'
import { NODE_TYPE_CONFIG, PALETTE_ITEMS } from '../domain/constants'
import type { PaletteItem } from '../domain/constants'
import { cn } from '@/shared/lib/utils'
import {
  X,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  GripVertical,
  Link2,
  Sparkles,
  Check,
  ArrowRight,
  Boxes,
  FileText,
  Layers,
  Eye,
} from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────

interface WizardTemplateBuilderProps {
  open: boolean
  onClose: () => void
  onComplete: (system: {
    name: string
    description: string
    nodes: SystemNode[]
    connections: NodeConnection[]
  }) => void
}

interface SelectedNode {
  instanceId: string
  paletteItem: PaletteItem
  label: string
}

interface ConnectionDraft {
  fromId: string
  toIds: string[]
}

type WizardStepKey = 'basics' | 'nodes' | 'connections' | 'preview'

const STEPS: { key: WizardStepKey; label: string; icon: typeof Boxes }[] = [
  { key: 'basics', label: 'Grundlagen', icon: FileText },
  { key: 'nodes', label: 'Bausteine', icon: Boxes },
  { key: 'connections', label: 'Verbindungen', icon: Link2 },
  { key: 'preview', label: 'Vorschau', icon: Eye },
]

const CATEGORIES = ['Marketing', 'Vertrieb', 'Support', 'Betrieb', 'Individuell'] as const

const MAX_NODES = 20

// ── Category labels for palette groups ────────────────────────────────────

const PALETTE_CATEGORY_LABELS: Record<string, string> = {
  'palette.cat.trigger': 'Trigger / Auslöser',
  'palette.cat.ai': 'KI / AI',
  'palette.cat.logic': 'Logik & Entscheidungen',
  'palette.cat.data': 'Daten & Verarbeitung',
  'palette.cat.comm': 'Kommunikation',
  'palette.cat.content': 'Inhalte & Dokumente',
  'palette.cat.social': 'Social Media & Ads',
  'palette.cat.analytics': 'Analytics & Zahlungen',
}

// ── Helpers ───────────────────────────────────────────────────────────────

function generateId() {
  return `node-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function readableTKey(tKey: string): string {
  const last = tKey.split('.').pop() ?? tKey
  return last
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (c) => c.toUpperCase())
    .trim()
}

function nodeTypeColor(type: NodeType): string {
  return NODE_TYPE_CONFIG[type]?.color ?? '#6b7280'
}

// ── Component ─────────────────────────────────────────────────────────────

export function WizardTemplateBuilder({
  open,
  onClose,
  onComplete,
}: WizardTemplateBuilderProps) {
  // ── Step state ────────────────────────────────────────────────────────
  const [currentStep, setCurrentStep] = useState(0)

  // ── Step 1: Basics ────────────────────────────────────────────────────
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<string>('Marketing')

  // ── Step 2: Nodes ─────────────────────────────────────────────────────
  const [selectedNodes, setSelectedNodes] = useState<SelectedNode[]>([])

  // ── Step 3: Connections ───────────────────────────────────────────────
  const [connectionDrafts, setConnectionDrafts] = useState<ConnectionDraft[]>([])

  // ── Grouped palette items ─────────────────────────────────────────────

  const groupedPalette = useMemo(() => {
    const groups: Record<string, PaletteItem[]> = {}
    for (const item of PALETTE_ITEMS) {
      const cat = item.category
      if (!groups[cat]) groups[cat] = []
      groups[cat].push(item)
    }
    return groups
  }, [])

  // ── Validation ────────────────────────────────────────────────────────

  const canProceed = useMemo(() => {
    switch (currentStep) {
      case 0:
        return name.trim().length > 0
      case 1:
        return selectedNodes.length > 0
      case 2:
        return true
      case 3:
        return true
      default:
        return false
    }
  }, [currentStep, name, selectedNodes])

  // ── Node actions ──────────────────────────────────────────────────────

  const addNode = useCallback(
    (item: PaletteItem) => {
      if (selectedNodes.length >= MAX_NODES) return
      const node: SelectedNode = {
        instanceId: generateId(),
        paletteItem: item,
        label: item.label ?? readableTKey(item.tKey),
      }
      setSelectedNodes((prev) => [...prev, node])
    },
    [selectedNodes.length],
  )

  const removeNode = useCallback((instanceId: string) => {
    setSelectedNodes((prev) => prev.filter((n) => n.instanceId !== instanceId))
    setConnectionDrafts((prev) =>
      prev
        .filter((c) => c.fromId !== instanceId)
        .map((c) => ({
          ...c,
          toIds: c.toIds.filter((id) => id !== instanceId),
        })),
    )
  }, [])

  const moveNode = useCallback((fromIndex: number, direction: 'up' | 'down') => {
    setSelectedNodes((prev) => {
      const next = [...prev]
      const targetIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1
      if (targetIndex < 0 || targetIndex >= next.length) return prev
      ;[next[fromIndex], next[targetIndex]] = [next[targetIndex], next[fromIndex]]
      return next
    })
  }, [])

  // ── Connection actions ────────────────────────────────────────────────

  const toggleConnection = useCallback(
    (fromId: string, toId: string) => {
      setConnectionDrafts((prev) => {
        const existing = prev.find((c) => c.fromId === fromId)
        if (!existing) {
          return [...prev, { fromId, toIds: [toId] }]
        }
        const hasTarget = existing.toIds.includes(toId)
        return prev.map((c) =>
          c.fromId === fromId
            ? {
                ...c,
                toIds: hasTarget
                  ? c.toIds.filter((id) => id !== toId)
                  : [...c.toIds, toId],
              }
            : c,
        )
      })
    },
    [],
  )

  const autoConnect = useCallback(() => {
    const drafts: ConnectionDraft[] = selectedNodes.slice(0, -1).map((node, i) => ({
      fromId: node.instanceId,
      toIds: [selectedNodes[i + 1].instanceId],
    }))
    setConnectionDrafts(drafts)
  }, [selectedNodes])

  // ── Build final system ────────────────────────────────────────────────

  const buildSystem = useCallback(() => {
    const SPACING_X = 300
    const START_X = 100
    const START_Y = 200

    const nodes: SystemNode[] = selectedNodes.map((sn, i) => ({
      id: sn.instanceId,
      label: sn.label,
      description: '',
      icon: sn.paletteItem.icon,
      type: sn.paletteItem.type,
      x: START_X + i * SPACING_X,
      y: START_Y,
    }))

    const connections: NodeConnection[] = connectionDrafts.flatMap((draft) =>
      draft.toIds.map((toId) => ({
        from: draft.fromId,
        to: toId,
      })),
    )

    onComplete({ name: name.trim(), description, nodes, connections })
  }, [selectedNodes, connectionDrafts, name, description, onComplete])

  // ── Connection count helper ───────────────────────────────────────────

  const totalConnections = useMemo(
    () => connectionDrafts.reduce((sum, c) => sum + c.toIds.length, 0),
    [connectionDrafts],
  )

  const getConnectionTargets = useCallback(
    (fromId: string) => {
      return connectionDrafts.find((c) => c.fromId === fromId)?.toIds ?? []
    },
    [connectionDrafts],
  )

  // ── Navigation ────────────────────────────────────────────────────────

  function goNext() {
    if (currentStep < STEPS.length - 1 && canProceed) {
      setCurrentStep((s) => s + 1)
    }
  }

  function goBack() {
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1)
    }
  }

  // ── Early return if not open ──────────────────────────────────────────

  if (!open) return null

  // ── Step Indicator ────────────────────────────────────────────────────

  function renderStepIndicator() {
    return (
      <div className="flex items-center justify-center gap-1 px-6 py-4">
        {STEPS.map((step, i) => {
          const isActive = i === currentStep
          const isCompleted = i < currentStep
          const StepIcon = step.icon

          return (
            <div key={step.key} className="flex items-center">
              {/* Step circle */}
              <button
                onClick={() => {
                  if (i < currentStep) setCurrentStep(i)
                }}
                disabled={i > currentStep}
                className={cn(
                  'flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition-all',
                  isActive && 'bg-primary text-primary-foreground shadow-md shadow-primary/20',
                  isCompleted && 'bg-primary/15 text-primary cursor-pointer hover:bg-primary/25',
                  !isActive && !isCompleted && 'bg-muted text-muted-foreground',
                )}
              >
                {isCompleted ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <StepIcon className="h-3.5 w-3.5" />
                )}
                <span className="hidden sm:inline">{step.label}</span>
                <span className="sm:hidden">{i + 1}</span>
              </button>

              {/* Connecting line */}
              {i < STEPS.length - 1 && (
                <div
                  className={cn(
                    'mx-1 h-px w-6 sm:w-10 transition-colors',
                    i < currentStep ? 'bg-primary/40' : 'bg-border',
                  )}
                />
              )}
            </div>
          )
        })}
      </div>
    )
  }

  // ── Step 1: Basics ────────────────────────────────────────────────────

  function renderBasics() {
    return (
      <div className="flex flex-col gap-6 px-6 py-4 max-w-xl mx-auto w-full">
        <div>
          <h3 className="text-lg font-bold text-foreground">Grundlagen</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Gib deinem System einen Namen und eine Beschreibung.
          </p>
        </div>

        {/* Name */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">
            Systemname <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="z.B. Lead-Qualifizierung Pipeline"
            className="w-full rounded-lg border border-border bg-background py-2.5 px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary/30 outline-none transition-all"
          />
        </div>

        {/* Description */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">Beschreibung</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Was macht dieses System?"
            className="w-full rounded-lg border border-border bg-background py-2.5 px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary/30 outline-none transition-all resize-none"
          />
        </div>

        {/* Category */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-foreground">Kategorie</label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={cn(
                  'rounded-full px-4 py-1.5 text-xs font-medium transition-colors',
                  category === cat
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80',
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ── Step 2: Nodes ─────────────────────────────────────────────────────

  function renderNodes() {
    return (
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left: Available nodes */}
        <div className="w-1/2 border-r border-border overflow-y-auto px-4 py-4">
          <div className="mb-3">
            <h4 className="text-sm font-bold text-foreground">Verfügbare Bausteine</h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              Klicke um einen Baustein hinzuzufügen
            </p>
          </div>

          {Object.entries(groupedPalette).map(([catKey, items]) => (
            <div key={catKey} className="mb-4">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                {PALETTE_CATEGORY_LABELS[catKey] ?? catKey}
              </p>
              <div className="grid grid-cols-1 gap-1.5">
                {items.map((item) => {
                  const typeConf = NODE_TYPE_CONFIG[item.type]
                  return (
                    <button
                      key={item.tKey}
                      onClick={() => addNode(item)}
                      disabled={selectedNodes.length >= MAX_NODES}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2 text-left transition-all',
                        'border border-transparent hover:border-border hover:bg-muted/50',
                        selectedNodes.length >= MAX_NODES && 'opacity-50 cursor-not-allowed',
                      )}
                    >
                      <div
                        className="flex h-7 w-7 items-center justify-center rounded-md text-white text-xs shrink-0"
                        style={{ backgroundColor: typeConf?.color ?? '#6b7280' }}
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-foreground truncate">
                          {item.label ?? readableTKey(item.tKey)}
                        </p>
                        <p className="text-[10px] text-muted-foreground">{typeConf?.label}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Right: Selected nodes */}
        <div className="w-1/2 overflow-y-auto px-4 py-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-foreground">Ausgewählte Bausteine</h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                {selectedNodes.length}/{MAX_NODES} Bausteine
              </p>
            </div>
          </div>

          {selectedNodes.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-12 text-center">
              <Layers className="h-8 w-8 text-muted-foreground/40" />
              <p className="mt-2 text-sm text-muted-foreground">
                Noch keine Bausteine ausgewählt
              </p>
              <p className="mt-1 text-xs text-muted-foreground/70">
                Wähle links Bausteine aus
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {selectedNodes.map((node, index) => {
                const typeConf = NODE_TYPE_CONFIG[node.paletteItem.type]
                return (
                  <div
                    key={node.instanceId}
                    className="group flex items-center gap-2 rounded-xl border border-border bg-card p-3 transition-all hover:border-primary/20"
                  >
                    {/* Reorder */}
                    <div className="flex flex-col gap-0.5 shrink-0">
                      <button
                        onClick={() => moveNode(index, 'up')}
                        disabled={index === 0}
                        className="rounded p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
                      >
                        <GripVertical className="h-3 w-3 rotate-180" />
                      </button>
                      <button
                        onClick={() => moveNode(index, 'down')}
                        disabled={index === selectedNodes.length - 1}
                        className="rounded p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
                      >
                        <GripVertical className="h-3 w-3" />
                      </button>
                    </div>

                    {/* Icon */}
                    <div
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-white text-xs shrink-0"
                      style={{ backgroundColor: typeConf?.color ?? '#6b7280' }}
                    >
                      <span className="text-[10px] font-bold">{index + 1}</span>
                    </div>

                    {/* Label + type badge */}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-foreground truncate">
                        {node.label}
                      </p>
                      <span
                        className="inline-block mt-0.5 rounded-full px-2 py-0.5 text-[10px] font-medium text-white"
                        style={{ backgroundColor: nodeTypeColor(node.paletteItem.type) }}
                      >
                        {typeConf?.label}
                      </span>
                    </div>

                    {/* Remove */}
                    <button
                      onClick={() => removeNode(node.instanceId)}
                      className="shrink-0 rounded-lg p-1.5 text-muted-foreground hover:bg-red-500/10 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── Step 3: Connections ───────────────────────────────────────────────

  function renderConnections() {
    return (
      <div className="flex flex-col gap-4 px-6 py-4 overflow-y-auto flex-1 min-h-0">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-foreground">Verbindungen</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Definiere wie die Bausteine miteinander verbunden sind.
            </p>
          </div>
          {selectedNodes.length > 1 && (
            <button
              onClick={autoConnect}
              className={cn(
                'flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-all',
                'bg-primary/10 text-primary hover:bg-primary/20',
              )}
            >
              <Sparkles className="h-3.5 w-3.5" />
              Auto verbinden
            </button>
          )}
        </div>

        {selectedNodes.length < 2 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-12 text-center">
            <Link2 className="h-8 w-8 text-muted-foreground/40" />
            <p className="mt-2 text-sm text-muted-foreground">
              Mindestens 2 Bausteine nötig
            </p>
            <p className="mt-1 text-xs text-muted-foreground/70">
              Gehe zurück und füge weitere Bausteine hinzu
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3 max-w-2xl mx-auto w-full">
            {selectedNodes.map((node) => {
              const typeConf = NODE_TYPE_CONFIG[node.paletteItem.type]
              const targets = getConnectionTargets(node.instanceId)
              const otherNodes = selectedNodes.filter(
                (n) => n.instanceId !== node.instanceId,
              )

              return (
                <div
                  key={node.instanceId}
                  className="rounded-xl border border-border bg-card p-4"
                >
                  {/* Source node */}
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="flex h-7 w-7 items-center justify-center rounded-md text-white text-xs shrink-0"
                      style={{ backgroundColor: typeConf?.color ?? '#6b7280' }}
                    >
                      <Boxes className="h-3.5 w-3.5" />
                    </div>
                    <p className="text-sm font-semibold text-foreground truncate">
                      {node.label}
                    </p>
                    {targets.length > 0 && (
                      <span className="ml-auto text-[10px] text-muted-foreground">
                        {targets.length} Verbindung{targets.length !== 1 ? 'en' : ''}
                      </span>
                    )}
                  </div>

                  {/* Target selection */}
                  <div className="flex flex-wrap gap-2 pl-10">
                    {otherNodes.map((target) => {
                      const isConnected = targets.includes(target.instanceId)
                      const targetConf = NODE_TYPE_CONFIG[target.paletteItem.type]
                      return (
                        <button
                          key={target.instanceId}
                          onClick={() =>
                            toggleConnection(node.instanceId, target.instanceId)
                          }
                          className={cn(
                            'flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all border',
                            isConnected
                              ? 'border-primary/30 bg-primary/10 text-primary'
                              : 'border-border bg-background text-muted-foreground hover:border-primary/20 hover:text-foreground',
                          )}
                        >
                          {isConnected && <Check className="h-3 w-3" />}
                          <ArrowRight className="h-3 w-3" />
                          <span
                            className="inline-block h-2 w-2 rounded-full shrink-0"
                            style={{ backgroundColor: targetConf?.color ?? '#6b7280' }}
                          />
                          {target.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  // ── Step 4: Preview ───────────────────────────────────────────────────

  function renderPreview() {
    return (
      <div className="flex flex-col gap-6 px-6 py-4 max-w-2xl mx-auto w-full overflow-y-auto flex-1 min-h-0">
        <div>
          <h3 className="text-lg font-bold text-foreground">Vorschau</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Prüfe dein System bevor du es erstellst.
          </p>
        </div>

        {/* Summary card */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h4 className="text-base font-bold text-foreground">{name}</h4>
          {description && (
            <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
              {description}
            </p>
          )}
          <div className="mt-4 flex flex-wrap gap-4">
            <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-1.5">
              <Boxes className="h-4 w-4 text-primary" />
              <span className="text-xs font-medium text-foreground">
                {selectedNodes.length} Baustein{selectedNodes.length !== 1 ? 'e' : ''}
              </span>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-1.5">
              <Link2 className="h-4 w-4 text-primary" />
              <span className="text-xs font-medium text-foreground">
                {totalConnections} Verbindung{totalConnections !== 1 ? 'en' : ''}
              </span>
            </div>
            <div className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              {category}
            </div>
          </div>
        </div>

        {/* Node list with connections */}
        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold text-foreground">Workflow-Ablauf</p>
          {selectedNodes.map((node, index) => {
            const typeConf = NODE_TYPE_CONFIG[node.paletteItem.type]
            const targets = getConnectionTargets(node.instanceId)
            const targetLabels = targets
              .map((tId) => selectedNodes.find((n) => n.instanceId === tId)?.label)
              .filter(Boolean)

            return (
              <div key={node.instanceId} className="flex flex-col">
                <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3">
                  <div
                    className="flex h-7 w-7 items-center justify-center rounded-md text-white text-xs shrink-0"
                    style={{ backgroundColor: typeConf?.color ?? '#6b7280' }}
                  >
                    <span className="text-[10px] font-bold">{index + 1}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">
                      {node.label}
                    </p>
                    <span
                      className="inline-block mt-0.5 rounded-full px-2 py-0.5 text-[10px] font-medium text-white"
                      style={{ backgroundColor: nodeTypeColor(node.paletteItem.type) }}
                    >
                      {typeConf?.label}
                    </span>
                  </div>
                  {targetLabels.length > 0 && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                      <ArrowRight className="h-3 w-3" />
                      <span className="truncate max-w-[140px]">
                        {targetLabels.join(', ')}
                      </span>
                    </div>
                  )}
                </div>

                {/* Arrow between nodes */}
                {index < selectedNodes.length - 1 && targets.length > 0 && (
                  <div className="flex justify-center py-1">
                    <div className="h-4 w-px bg-border" />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // ── Step content dispatcher ───────────────────────────────────────────

  function renderStepContent() {
    switch (currentStep) {
      case 0:
        return renderBasics()
      case 1:
        return renderNodes()
      case 2:
        return renderConnections()
      case 3:
        return renderPreview()
      default:
        return null
    }
  }

  // ── Main render ─────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal container */}
      <div className="relative flex h-[90vh] w-full max-w-4xl flex-col rounded-2xl border border-border bg-card shadow-2xl animate-scale-in mx-4">
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between border-b border-border px-6 py-3 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-foreground">
              Neues System erstellen
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Schritt {currentStep + 1} von {STEPS.length}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* ── Step indicator ──────────────────────────────────────────────── */}
        <div className="border-b border-border shrink-0">
          {renderStepIndicator()}
        </div>

        {/* ── Step content ────────────────────────────────────────────────── */}
        <div className="flex-1 min-h-0 flex flex-col overflow-y-auto">
          {renderStepContent()}
        </div>

        {/* ── Footer navigation ──────────────────────────────────────────── */}
        <div className="flex items-center justify-between border-t border-border px-6 py-4 shrink-0">
          <button
            onClick={onClose}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Abbrechen
          </button>

          <div className="flex items-center gap-3">
            {currentStep > 0 && (
              <button
                onClick={goBack}
                className={cn(
                  'flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-all',
                  'border border-border bg-background text-foreground hover:bg-muted',
                )}
              >
                <ChevronLeft className="h-4 w-4" />
                Zurück
              </button>
            )}

            {currentStep < STEPS.length - 1 ? (
              <button
                onClick={goNext}
                disabled={!canProceed}
                className={cn(
                  'flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-all',
                  canProceed
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20'
                    : 'bg-muted text-muted-foreground cursor-not-allowed',
                )}
              >
                Weiter
                <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={buildSystem}
                className="flex items-center gap-1.5 rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20 transition-all"
              >
                <Sparkles className="h-4 w-4" />
                System erstellen
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
