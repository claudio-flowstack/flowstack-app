import { useState, useMemo } from 'react'
import {
  ChevronRight,
  ArrowDownRight,
  ArrowUpRight,
  Zap,
  Server,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Unplug,
  Package,
} from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import type { AutomationSystem } from '../domain/types'
import { getExecutionContext, getNodeResults, isSideEffectNode } from '../application/side-effects'

export function SystemCodeView({
  system,
  compact,
}: {
  system: Pick<AutomationSystem, 'nodes' | 'connections'>
  compact?: boolean
}) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [showContext, setShowContext] = useState(false)

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const expandAll = () => setExpanded(new Set(system.nodes.map((n) => n.id)))
  const collapseAll = () => setExpanded(new Set())

  // Read live execution data
  const context = getExecutionContext()
  const nodeResults = getNodeResults()
  const hasContext = Object.keys(context).some(
    (k) => k !== 'company' && k !== 'email' && context[k as keyof typeof context] != null,
  )

  // Diagnostics
  const diagnostics = useMemo(() => {
    const issues: { type: 'error' | 'warn' | 'info'; msg: string }[] = []

    const nodesWithoutConfig = system.nodes.filter((n) => !n.demoConfig)
    if (nodesWithoutConfig.length > 0)
      issues.push({
        type: 'warn',
        msg: `${nodesWithoutConfig.length} Node${nodesWithoutConfig.length > 1 ? 's' : ''} ohne demoConfig — produzieren keine Outputs`,
      })

    const connectedIds = new Set([
      ...system.connections.map((c) => c.from),
      ...system.connections.map((c) => c.to),
    ])
    const isolated = system.nodes.filter((n) => !connectedIds.has(n.id))
    if (isolated.length > 0)
      issues.push({
        type: 'warn',
        msg: `${isolated.length} isolierte Node${isolated.length > 1 ? 's' : ''}: ${isolated.map((n) => n.label).join(', ')}`,
      })

    const placeholderArts = system.nodes.filter((n) =>
      n.demoConfig?.artifacts?.some((a) => a.url === '#'),
    )
    if (placeholderArts.length > 0)
      issues.push({
        type: 'info',
        msg: `${placeholderArts.length} Node${placeholderArts.length > 1 ? 's' : ''} mit Platzhalter-Links (#)`,
      })

    const sideEffectNodes = system.nodes.filter((n) => isSideEffectNode(n.id))
    if (sideEffectNodes.length > 0)
      issues.push({
        type: 'info',
        msg: `${sideEffectNodes.length} Nodes mit echten API-Calls`,
      })

    const failedNodes = system.nodes.filter((n) => nodeResults.get(n.id)?.error)
    if (failedNodes.length > 0)
      issues.push({
        type: 'error',
        msg: `${failedNodes.length} Side-Effect${failedNodes.length > 1 ? 's' : ''} fehlgeschlagen`,
      })

    return issues
  }, [system.nodes, system.connections, nodeResults])

  const diagColor = {
    error: 'text-red-500 bg-red-500/10',
    warn: 'text-amber-500 bg-amber-500/10',
    info: 'text-blue-500 bg-blue-500/10',
  }
  const diagIcon = {
    error: <XCircle className="h-3 w-3 shrink-0" />,
    warn: <AlertTriangle className="h-3 w-3 shrink-0" />,
    info: <CheckCircle className="h-3 w-3 shrink-0" />,
  }

  return (
    <div className="space-y-3">
      {/* ── Diagnostics ─────────────────────────────────────── */}
      {diagnostics.length > 0 && (
        <div className="space-y-1">
          {diagnostics.map((d, i) => (
            <div
              key={i}
              className={cn('flex items-center gap-2 px-2.5 py-1.5 rounded-lg', diagColor[d.type])}
            >
              {diagIcon[d.type]}
              <span className={cn('font-medium', compact ? 'text-[10px]' : 'text-[11px]')}>{d.msg}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── Execution Context ───────────────────────────────── */}
      {hasContext && (
        <div className="rounded-lg border border-border overflow-hidden">
          <button
            onClick={() => setShowContext((v) => !v)}
            className={cn(
              'w-full flex items-center gap-2 text-left transition-colors',
              compact ? 'px-2 py-1.5' : 'px-3 py-2',
              showContext ? 'bg-muted/50' : 'hover:bg-muted/30',
            )}
          >
            <ChevronRight
              className={cn(
                'h-3 w-3 text-muted-foreground shrink-0 transition-transform duration-150',
                showContext && 'rotate-90',
              )}
            />
            <Server className="h-3 w-3 text-blue-500 shrink-0" />
            <span className={cn('font-medium text-foreground', compact ? 'text-[11px]' : 'text-xs')}>
              Execution Context
            </span>
            <span className={cn('text-muted-foreground', compact ? 'text-[9px]' : 'text-[10px]')}>
              {Object.entries(context).filter(([k, v]) => k !== 'company' && k !== 'email' && v != null).length} Werte
            </span>
          </button>
          {showContext && (
            <pre
              className={cn(
                'border-t border-border bg-zinc-950 font-mono text-emerald-400 whitespace-pre-wrap break-words select-all overflow-auto',
                compact ? 'p-2 text-[9px] leading-relaxed max-h-48' : 'p-3 text-[10px] leading-relaxed max-h-64',
              )}
            >
              {JSON.stringify(context, null, 2)}
            </pre>
          )}
        </div>
      )}

      {/* ── Header ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <span className={cn('font-medium text-muted-foreground', compact ? 'text-[10px]' : 'text-xs')}>
          {system.nodes.length} Nodes · {system.connections.length} Connections
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={expandAll}
            className="text-[10px] text-muted-foreground hover:text-foreground px-1.5 py-0.5 rounded hover:bg-muted transition-colors"
          >
            Alle
          </button>
          <button
            onClick={collapseAll}
            className="text-[10px] text-muted-foreground hover:text-foreground px-1.5 py-0.5 rounded hover:bg-muted transition-colors"
          >
            Keine
          </button>
        </div>
      </div>

      {/* ── Node List ───────────────────────────────────────── */}
      <div className="space-y-1">
        {system.nodes.map((node) => {
          const isOpen = expanded.has(node.id)
          const inConns = system.connections.filter((c) => c.to === node.id)
          const outConns = system.connections.filter((c) => c.from === node.id)
          const isSE = isSideEffectNode(node.id)
          const result = nodeResults.get(node.id)
          const hasConfig = !!node.demoConfig
          const artifactCount = node.demoConfig?.artifacts?.length ?? 0

          return (
            <div
              key={node.id}
              className={cn(
                'rounded-lg border overflow-hidden transition-colors',
                result?.error
                  ? 'border-red-500/30'
                  : isOpen
                    ? 'border-border'
                    : 'border-transparent hover:border-border',
              )}
            >
              {/* Node Header */}
              <button
                onClick={() => toggle(node.id)}
                className={cn(
                  'w-full flex items-center gap-1.5 text-left transition-colors',
                  compact ? 'px-2 py-1.5' : 'px-3 py-2',
                  isOpen ? 'bg-muted/50' : 'hover:bg-muted/30',
                )}
              >
                <ChevronRight
                  className={cn(
                    'h-3 w-3 text-muted-foreground shrink-0 transition-transform duration-150',
                    isOpen && 'rotate-90',
                  )}
                />
                {/* Type Badge */}
                <span
                  className={cn(
                    'font-mono px-1.5 py-0.5 rounded shrink-0',
                    compact ? 'text-[9px]' : 'text-[10px]',
                    hasConfig
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
                  )}
                >
                  {node.type}
                </span>
                {/* Label */}
                <span
                  className={cn('font-medium text-foreground truncate flex-1', compact ? 'text-[11px]' : 'text-xs')}
                >
                  {node.label}
                </span>
                {/* Badges */}
                <div className="flex items-center gap-1 shrink-0">
                  {isSE && (
                    <span
                      className="text-[8px] bg-blue-500/10 text-blue-500 px-1 py-0.5 rounded-full"
                      title="Echter API-Call"
                    >
                      API
                    </span>
                  )}
                  {result?.error && <XCircle className="h-3 w-3 text-red-500" />}
                  {result && !result.error && <CheckCircle className="h-3 w-3 text-emerald-500" />}
                  {artifactCount > 0 && (
                    <span className="text-[9px] text-purple-500 flex items-center gap-0.5">
                      <Package className="h-2.5 w-2.5" />
                      {artifactCount}
                    </span>
                  )}
                  {(inConns.length > 0 || outConns.length > 0) && (
                    <span className="text-[9px] text-muted-foreground tabular-nums">
                      {inConns.length}/{outConns.length}
                    </span>
                  )}
                </div>
              </button>

              {/* Node Details */}
              {isOpen && (
                <div className="border-t border-border">
                  {/* Error Banner */}
                  {result?.error && (
                    <div className="px-3 py-2 bg-red-500/10 text-red-500 text-[10px] font-mono flex items-start gap-2">
                      <XCircle className="h-3 w-3 shrink-0 mt-0.5" />
                      <span className="break-words">{result.error}</span>
                    </div>
                  )}

                  {/* Connections */}
                  {(inConns.length > 0 || outConns.length > 0) && (
                    <div className={cn('border-b border-border', compact ? 'px-2 py-1.5' : 'px-3 py-2')}>
                      <div className="space-y-0.5">
                        {inConns.map((c) => {
                          const fromNode = system.nodes.find((n) => n.id === c.from)
                          return (
                            <div key={`in-${c.from}`} className="flex items-center gap-1.5">
                              <ArrowDownRight className="h-3 w-3 text-blue-400 shrink-0" />
                              <span className="text-[10px] text-muted-foreground">von</span>
                              <span className="text-[10px] font-medium text-foreground truncate">
                                {fromNode?.label ?? c.from}
                              </span>
                              {c.label && (
                                <span className="text-[9px] text-muted-foreground italic truncate">({c.label})</span>
                              )}
                            </div>
                          )
                        })}
                        {outConns.map((c) => {
                          const toNode = system.nodes.find((n) => n.id === c.to)
                          return (
                            <div key={`out-${c.to}`} className="flex items-center gap-1.5">
                              <ArrowUpRight className="h-3 w-3 text-amber-400 shrink-0" />
                              <span className="text-[10px] text-muted-foreground">nach</span>
                              <span className="text-[10px] font-medium text-foreground truncate">
                                {toNode?.label ?? c.to}
                              </span>
                              {c.label && (
                                <span className="text-[9px] text-muted-foreground italic truncate">({c.label})</span>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Side-Effect Result */}
                  {result && !result.error && (
                    <div className={cn('border-b border-border', compact ? 'px-2 py-1.5' : 'px-3 py-2')}>
                      <div className="flex items-center gap-2 mb-1">
                        <Server className="h-3 w-3 text-blue-500 shrink-0" />
                        <span className={cn('font-medium text-blue-500', compact ? 'text-[10px]' : 'text-[11px]')}>
                          API Response
                        </span>
                        <span className="text-[9px] text-muted-foreground">{result.durationMs}ms</span>
                      </div>
                      <pre
                        className={cn(
                          'bg-zinc-950 rounded-md font-mono text-emerald-400 whitespace-pre-wrap break-words select-all overflow-auto',
                          compact ? 'p-2 text-[9px] leading-relaxed max-h-40' : 'p-2 text-[10px] leading-relaxed max-h-52',
                        )}
                      >
                        {JSON.stringify(result.result, null, 2)}
                      </pre>
                    </div>
                  )}

                  {/* Node Config */}
                  <pre
                    className={cn(
                      'bg-zinc-950 font-mono text-zinc-400 whitespace-pre-wrap break-words select-all overflow-auto',
                      compact ? 'p-2 text-[9px] leading-relaxed max-h-40' : 'p-3 text-[10px] leading-relaxed max-h-52',
                    )}
                  >
                    {JSON.stringify(
                      {
                        id: node.id,
                        type: node.type,
                        ...(isSE ? { sideEffect: true } : {}),
                        ...(node.demoConfig ? { demoConfig: node.demoConfig } : { demoConfig: null }),
                        ...(node.linkedResourceId ? { linkedResource: node.linkedResourceId } : {}),
                        ...(node.linkedSubSystemId ? { linkedSubSystem: node.linkedSubSystemId } : {}),
                        ...(node.subNodes && node.subNodes.length > 0 ? { subNodes: node.subNodes } : {}),
                      },
                      null,
                      2,
                    )}
                  </pre>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {system.nodes.length === 0 && (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <Zap className="h-5 w-5 text-muted-foreground mb-2" />
          <p className={cn('font-medium text-muted-foreground', compact ? 'text-[11px]' : 'text-xs')}>
            Keine Nodes konfiguriert
          </p>
        </div>
      )}
    </div>
  )
}
