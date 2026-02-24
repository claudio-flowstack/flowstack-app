import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import type { AutomationSystem, SystemNode } from '../domain/types'
import { NODE_TYPE_CONFIG } from '../domain/constants'
import { renderNodeIcon } from '../canvas/ToolLogos'
import { getNodeIcon } from '../canvas/icons'
import { cn } from '@/shared/lib/utils'
import { ArrowRight, Workflow, Layers, Plus, Pencil, Trash2, X } from 'lucide-react'

// ── Icon resolver ───────────────────────────────────────────────────────────

function resolveNodeIcon(
  node: Pick<SystemNode, 'icon' | 'logoUrl' | 'type'>,
  size = 16,
): { icon: React.ReactNode; bgColor: string } {
  const config = NODE_TYPE_CONFIG[node.type] ?? { color: '#8b5cf6', icon: 'workflow' }
  const LucideIcon = getNodeIcon(node.icon)
  const fallback = LucideIcon ? (
    <LucideIcon className="h-4 w-4" style={{ color: config.color }} />
  ) : (
    <Workflow className="h-4 w-4" style={{ color: config.color }} />
  )

  return {
    icon: renderNodeIcon(node.icon, node.logoUrl, fallback, size) ?? fallback,
    bgColor: `${config.color}18`,
  }
}

// ── Pipeline View ────────────────────────────────────────────────────────────

interface PipelineViewProps {
  system: AutomationSystem
  subSystems: AutomationSystem[]
  editMode?: boolean
  onToggleEditMode?: () => void
  onEditNode?: (node: SystemNode) => void
  onRemoveNode?: (nodeId: string) => void
  onAddNode?: () => void
}

export function PipelineView({
  system,
  subSystems,
  editMode,
  onToggleEditMode,
  onEditNode,
  onRemoveNode,
  onAddNode,
}: PipelineViewProps) {
  if (subSystems.length > 0) {
    return <MasterPipeline system={system} subSystems={subSystems} />
  }
  return (
    <NodePipeline
      system={system}
      editMode={editMode}
      onToggleEditMode={onToggleEditMode}
      onEditNode={onEditNode}
      onRemoveNode={onRemoveNode}
      onAddNode={onAddNode}
    />
  )
}

// ── Master Pipeline ──────────────────────────────────────────────────────────

function MasterPipeline({
  system,
  subSystems,
}: {
  system: AutomationSystem
  subSystems: AutomationSystem[]
}) {
  const navigate = useNavigate()
  const preNodes = system.nodes.filter((n) => n.type !== 'subsystem')

  const preIcon = preNodes.length > 0
    ? resolveNodeIcon(preNodes[0])
    : { icon: <Workflow className="h-4 w-4 text-primary" />, bgColor: '#3b82f618' }

  return (
    <div className="py-5">
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          System-Pipeline
        </h3>
        <span className="text-[10px] text-muted-foreground bg-muted rounded-full px-2 py-0.5">
          {subSystems.length + (preNodes.length > 0 ? 1 : 0)} Schritte
        </span>
      </div>

      <div className="flex items-center overflow-x-auto pb-2 gap-2">
        {preNodes.length > 0 && (
          <>
            <StepCard
              index={1}
              label="Eingang"
              description={`${preNodes.length} Nodes`}
              icon={preIcon.icon}
              iconBg={preIcon.bgColor}
              status="active"
            />
            <Connector />
          </>
        )}

        {subSystems.map((sub, idx) => {
          const firstNode = sub.nodes[0]
          const subResolved = firstNode
            ? resolveNodeIcon(firstNode)
            : { icon: <Layers className="h-4 w-4 text-indigo-500" />, bgColor: '#6366f118' }

          return (
            <React.Fragment key={sub.id}>
              <StepCard
                index={(preNodes.length > 0 ? 2 : 1) + idx}
                label={sub.name}
                description={sub.description}
                icon={subResolved.icon}
                iconBg={subResolved.bgColor}
                status={sub.status}
                nodeCount={sub.nodes.length}
                onClick={() => navigate(`/automation/system/${sub.id}`)}
              />
              {idx < subSystems.length - 1 && <Connector />}
            </React.Fragment>
          )
        })}
      </div>
    </div>
  )
}

// ── Node Pipeline ────────────────────────────────────────────────────────────

const PHASE_CATEGORY: Record<string, string> = {
  trigger: 'Eingang',
  process: 'Verarbeitung',
  ai: 'KI-Analyse',
  agent: 'KI-Analyse',
  'condition-agent': 'KI-Analyse',
  output: 'Ausgabe',
  subsystem: 'Sub-System',
  ifelse: 'Logik',
  merge: 'Logik',
  router: 'Logik',
  fork: 'Logik',
  join: 'Logik',
  iterator: 'Logik',
  wait: 'Kontrolle',
  approval: 'Kontrolle',
  'error-handler': 'Fehlerbehandlung',
}

function condenseLayers(layers: SystemNode[][]) {
  const tagged = layers.map((layer) => {
    const counts = new Map<string, number>()
    for (const n of layer) {
      const cat = PHASE_CATEGORY[n.type] ?? 'Verarbeitung'
      counts.set(cat, (counts.get(cat) ?? 0) + 1)
    }
    let maxCat = 'Verarbeitung'
    let maxCount = 0
    for (const [cat, count] of counts) {
      if (count > maxCount) { maxCat = cat; maxCount = count }
    }
    return { nodes: layer, phase: maxCat }
  })

  const phases: { label: string; nodes: SystemNode[] }[] = []
  for (const item of tagged) {
    const last = phases[phases.length - 1]
    if (last && last.label === item.phase) {
      last.nodes.push(...item.nodes)
    } else {
      phases.push({ label: item.phase, nodes: [...item.nodes] })
    }
  }
  return phases
}

function NodePipeline({
  system,
  editMode,
  onToggleEditMode,
  onEditNode,
  onRemoveNode,
  onAddNode,
}: {
  system: AutomationSystem
  editMode?: boolean
  onToggleEditMode?: () => void
  onEditNode?: (node: SystemNode) => void
  onRemoveNode?: (nodeId: string) => void
  onAddNode?: () => void
}) {
  const [expandedPhase, setExpandedPhase] = useState<number | null>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  // Close popover on outside click
  useEffect(() => {
    if (expandedPhase === null) return
    const handler = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setExpandedPhase(null)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [expandedPhase])

  if (system.nodes.length === 0) {
    return (
      <div className="py-10 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted mx-auto mb-3">
          <Workflow className="h-5 w-5 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium text-foreground">Noch keine Schritte</p>
        <p className="text-xs text-muted-foreground mt-1">
          Öffne den Editor oder füge hier Schritte hinzu.
        </p>
        {onAddNode && (
          <button
            onClick={onAddNode}
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Node hinzufügen
          </button>
        )}
      </div>
    )
  }

  const layers = computeLayers(system.nodes, system.connections)
  const phases = condenseLayers(layers)

  function handlePhaseClick(phaseIdx: number) {
    const phase = phases[phaseIdx]
    if (!onEditNode) return
    if (phase.nodes.length === 1) {
      onEditNode(phase.nodes[0])
    } else {
      setExpandedPhase(expandedPhase === phaseIdx ? null : phaseIdx)
    }
  }

  return (
    <div className="py-5">
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Workflow-Übersicht
        </h3>
        <span className="text-[10px] text-muted-foreground bg-muted rounded-full px-2 py-0.5">
          {phases.length} Phasen · {system.nodes.length} Nodes
        </span>
        {onToggleEditMode && (
          <button
            onClick={onToggleEditMode}
            className={cn(
              'ml-auto flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors',
              editMode
                ? 'bg-primary/10 text-primary hover:bg-primary/20'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted',
            )}
          >
            <Pencil className="h-3 w-3" />
            {editMode ? 'Fertig' : 'Bearbeiten'}
          </button>
        )}
      </div>

      <div className="flex items-center overflow-x-auto pb-2 gap-2">
        {phases.map((phase, idx) => {
          const representative = phase.nodes[0]
          const { icon, bgColor } = resolveNodeIcon(representative)
          return (
            <React.Fragment key={idx}>
              <div className="relative">
                <StepCard
                  index={idx + 1}
                  label={phase.label}
                  description={phase.nodes.length === 1 ? phase.nodes[0].label : `${phase.nodes.length} Schritte`}
                  icon={icon}
                  iconBg={bgColor}
                  status="active"
                  nodeCount={phase.nodes.length > 1 ? phase.nodes.length : undefined}
                  onClick={onEditNode ? () => handlePhaseClick(idx) : undefined}
                  onRemove={
                    onRemoveNode && phase.nodes.length === 1
                      ? () => onRemoveNode(phase.nodes[0].id)
                      : undefined
                  }
                />

                {/* Popover: Node-Liste bei Multi-Node-Phasen */}
                {expandedPhase === idx && phase.nodes.length > 1 && (
                  <div
                    ref={popoverRef}
                    className="absolute top-full left-0 mt-2 z-40 w-64 rounded-xl border border-border bg-card shadow-xl animate-fade-in"
                  >
                    <div className="flex items-center justify-between px-3 py-2 border-b border-border">
                      <p className="text-xs font-semibold text-foreground">{phase.label}</p>
                      <button
                        onClick={() => setExpandedPhase(null)}
                        className="rounded p-0.5 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="p-2 max-h-60 overflow-y-auto space-y-1">
                      {phase.nodes.map((node) => {
                        const nodeResolved = resolveNodeIcon(node)
                        const config = NODE_TYPE_CONFIG[node.type]
                        return (
                          <div
                            key={node.id}
                            className="group flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-muted/50 transition-colors"
                          >
                            <div
                              className="flex h-6 w-6 items-center justify-center rounded-md shrink-0"
                              style={{ background: nodeResolved.bgColor }}
                            >
                              {nodeResolved.icon}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-[11px] font-medium text-foreground truncate">
                                {node.label}
                              </p>
                              <p className="text-[9px] text-muted-foreground">{config?.label}</p>
                            </div>
                            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              {onEditNode && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setExpandedPhase(null)
                                    onEditNode(node)
                                  }}
                                  className="rounded p-1 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                                >
                                  <Pencil className="h-3 w-3" />
                                </button>
                              )}
                              {onRemoveNode && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    onRemoveNode(node.id)
                                  }}
                                  className="rounded p-1 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
              {idx < phases.length - 1 && <Connector />}
            </React.Fragment>
          )
        })}

        {/* Add Node button */}
        {onAddNode && (
          <>
            <Connector />
            <button
              onClick={onAddNode}
              className={cn(
                'flex items-center justify-center w-[80px] h-[76px] shrink-0 rounded-xl',
                'border-2 border-dashed border-border/60 text-muted-foreground',
                'hover:border-primary/40 hover:text-primary hover:bg-primary/5',
                'transition-all duration-150',
              )}
            >
              <Plus className="h-5 w-5" />
            </button>
          </>
        )}
      </div>
    </div>
  )
}

// ── Step Card ────────────────────────────────────────────────────────────────

function StepCard({
  index,
  label,
  description,
  icon,
  iconBg,
  status,
  nodeCount,
  onClick,
  onRemove,
}: {
  index: number
  label: string
  description?: string
  icon: React.ReactNode
  iconBg: string
  status: string
  nodeCount?: number
  onClick?: () => void
  onRemove?: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'group flex items-start gap-3 w-[200px] shrink-0 rounded-xl border p-3 relative',
        'transition-all duration-150',
        onClick && 'cursor-pointer hover:border-primary/30 hover:shadow-md hover:-translate-y-0.5',
        !onClick && 'cursor-default',
        status === 'active' ? 'bg-card border-border' : 'bg-card/50 border-dashed border-border/50',
      )}
    >
      {/* Remove button */}
      {onRemove && (
        <div
          className="absolute -top-1.5 -right-1.5 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
        >
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white shadow-sm hover:bg-red-600 transition-colors">
            <Trash2 className="h-2.5 w-2.5" />
          </div>
        </div>
      )}

      {/* Icon */}
      <div className="flex flex-col items-center gap-1 shrink-0">
        <div
          className="flex h-8 w-8 items-center justify-center rounded-lg"
          style={{ background: iconBg }}
        >
          {icon}
        </div>
        <span className="text-[9px] font-bold text-muted-foreground/50">{index}</span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 text-left">
        <p className="text-xs font-semibold text-foreground line-clamp-1 leading-snug">
          {label}
        </p>
        {description && (
          <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5 leading-snug">
            {description}
          </p>
        )}
        <div className="flex items-center gap-1.5 mt-1.5">
          <span
            className={cn(
              'w-1.5 h-1.5 rounded-full',
              status === 'active' ? 'bg-emerald-500' : 'bg-muted-foreground/30',
            )}
          />
          <span className="text-[10px] text-muted-foreground">
            {status === 'active' ? 'Aktiv' : 'Entwurf'}
          </span>
          {nodeCount != null && (
            <span className="text-[10px] text-muted-foreground">
              · {nodeCount} Nodes
            </span>
          )}
        </div>
      </div>
    </button>
  )
}

// ── Connector ────────────────────────────────────────────────────────────────

function Connector() {
  return (
    <div className="flex items-center shrink-0 self-center">
      <ArrowRight className="h-4 w-4 text-muted-foreground/40" />
    </div>
  )
}

// ── BFS Layer Computation ────────────────────────────────────────────────────

function computeLayers(
  nodes: AutomationSystem['nodes'],
  connections: AutomationSystem['connections'],
) {
  const incoming = new Set(connections.map((c) => c.to))
  const startNodes = nodes.filter((n) => n.type === 'trigger' || !incoming.has(n.id))
  if (startNodes.length === 0 && nodes.length > 0) startNodes.push(nodes[0])

  const adj = new Map<string, string[]>()
  for (const c of connections) {
    const list = adj.get(c.from) ?? []
    list.push(c.to)
    adj.set(c.from, list)
  }

  const depthMap = new Map<string, number>()
  const queue: { id: string; depth: number }[] = startNodes.map((n) => ({ id: n.id, depth: 0 }))
  const visited = new Set<string>()

  while (queue.length > 0) {
    const item = queue.shift()!
    if (visited.has(item.id)) continue
    visited.add(item.id)
    depthMap.set(item.id, item.depth)

    for (const next of adj.get(item.id) ?? []) {
      if (!visited.has(next)) queue.push({ id: next, depth: item.depth + 1 })
    }
  }

  let maxDepth = Math.max(0, ...depthMap.values())
  for (const n of nodes) {
    if (!depthMap.has(n.id)) depthMap.set(n.id, ++maxDepth)
  }

  const layerMap = new Map<number, typeof nodes>()
  for (const n of nodes) {
    const d = depthMap.get(n.id) ?? 0
    const list = layerMap.get(d) ?? []
    list.push(n)
    layerMap.set(d, list)
  }

  return Array.from(layerMap.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([, layerNodes]) => layerNodes)
}
