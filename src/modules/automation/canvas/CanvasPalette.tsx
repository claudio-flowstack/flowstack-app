import { useState, useMemo } from 'react'
import type { NodeType, StickyNoteColor } from '../domain/types'
import { PALETTE_ITEMS } from '../domain/constants'
import { NODE_STYLES } from './constants'
import { cn } from '@/shared/lib/utils'
import { X, ChevronDown, Search, StickyNote, Group } from 'lucide-react'
import { getNodeIcon } from './icons'
import { renderNodeIcon, getToolLogosByCategory } from './ToolLogos'

// ── Types & Props ───────────────────────────────────────────────────────────

type PaletteTab = 'nodes' | 'tools' | 'groups'

interface CanvasPaletteProps {
  onAddNode: (item: { label: string; icon: string; type: NodeType }) => void
  onAddGroup: (color: string) => void
  onAddSticky: (color: StickyNoteColor) => void
  onClose: () => void
  /** 'sidebar' = persistent left panel (default), 'floating' = absolute overlay */
  variant?: 'sidebar' | 'floating'
}

// ── Section Definitions ─────────────────────────────────────────────────────

interface TypeSection {
  types: NodeType[]
  label: string
}

const TYPE_SECTIONS: TypeSection[] = [
  { types: ['trigger'], label: 'Trigger' },
  { types: ['ai', 'agent', 'condition-agent'], label: 'KI / AI' },
  { types: ['process'], label: 'Prozess' },
  { types: ['ifelse', 'merge', 'router', 'fork', 'join'], label: 'Logik' },
  { types: ['output'], label: 'Output' },
  { types: ['wait', 'iterator', 'error-handler', 'approval'], label: 'Erweitert' },
  { types: ['subsystem'], label: 'Sub-System' },
]

const TAB_CONFIG: { key: PaletteTab; label: string }[] = [
  { key: 'nodes', label: 'Nodes' },
  { key: 'tools', label: 'Tools' },
  { key: 'groups', label: 'Gruppen' },
]

const GROUP_COLOR_ENTRIES: { key: string; label: string; color: string }[] = [
  { key: 'purple', label: 'Lila', color: '#8b5cf6' },
  { key: 'blue', label: 'Blau', color: '#3b82f6' },
  { key: 'green', label: 'Grün', color: '#10b981' },
  { key: 'pink', label: 'Rosa', color: '#ec4899' },
  { key: 'orange', label: 'Orange', color: '#f59e0b' },
  { key: 'yellow', label: 'Gelb', color: '#facc15' },
]

const STICKY_COLOR_ENTRIES: { key: StickyNoteColor; label: string; color: string }[] = [
  { key: 'yellow', label: 'Gelb', color: '#facc15' },
  { key: 'pink', label: 'Rosa', color: '#ec4899' },
  { key: 'blue', label: 'Blau', color: '#3b82f6' },
  { key: 'green', label: 'Grün', color: '#22c55e' },
  { key: 'orange', label: 'Orange', color: '#f97316' },
  { key: 'gray', label: 'Grau', color: '#6b7280' },
]

// ── Component ───────────────────────────────────────────────────────────────

export function CanvasPalette({
  onAddNode,
  onAddGroup,
  onAddSticky,
  onClose,
  variant = 'sidebar',
}: CanvasPaletteProps) {
  const [activeTab, setActiveTab] = useState<PaletteTab>('nodes')
  const [search, setSearch] = useState('')
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())

  const query = search.toLowerCase().trim()

  // ── Filtered palette items (Nodes tab) ──────────────────────────────────

  const filteredPaletteItems = useMemo(() => {
    if (!query) return PALETTE_ITEMS
    return PALETTE_ITEMS.filter(
      (item) =>
        (item.label ?? item.tKey).toLowerCase().includes(query) ||
        item.icon.toLowerCase().includes(query),
    )
  }, [query])

  // ── Filtered tool logos (Tools tab) ─────────────────────────────────────

  const filteredToolCategories = useMemo(() => {
    const allGrouped = getToolLogosByCategory()
    if (!query) return allGrouped

    const result: Record<string, typeof allGrouped[string]> = {}
    for (const [cat, logos] of Object.entries(allGrouped)) {
      const filtered = logos.filter(
        (logo) =>
          logo.name.toLowerCase().includes(query) ||
          logo.id.toLowerCase().includes(query),
      )
      if (filtered.length > 0) result[cat] = filtered
    }
    return result
  }, [query])

  // ── Section toggle ──────────────────────────────────────────────────────

  const toggleSection = (key: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  // ── Drag handlers ─────────────────────────────────────────────────────

  const handleNodeDragStart = (
    e: React.DragEvent,
    item: { label: string; icon: string; type: NodeType },
  ) => {
    e.dataTransfer.setData(
      'application/flowstack-node',
      JSON.stringify(item),
    )
    e.dataTransfer.effectAllowed = 'copy'
  }

  const handleToolDragStart = (
    e: React.DragEvent,
    logo: { id: string; name: string },
  ) => {
    const item = { label: logo.name, icon: logo.id, type: 'process' as NodeType }
    e.dataTransfer.setData(
      'application/flowstack-node',
      JSON.stringify(item),
    )
    e.dataTransfer.effectAllowed = 'copy'
  }

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <div className={cn(
      'bg-card/95 backdrop-blur-md flex flex-col',
      variant === 'floating'
        ? 'absolute left-4 top-4 z-30 w-64 rounded-xl border border-border shadow-xl animate-fade-in max-h-[80vh]'
        : 'w-full h-full',
    )}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
        <span className="text-xs font-bold text-foreground uppercase tracking-wider">
          Elemente
        </span>
        <button
          onClick={onClose}
          className="rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Tab Buttons */}
      <div className="flex border-b border-border">
        {TAB_CONFIG.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={cn(
              'flex-1 px-2 py-1.5 text-[11px] font-semibold transition-colors',
              activeTab === key
                ? 'text-foreground border-b-2 border-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Search Bar */}
      {(activeTab === 'nodes' || activeTab === 'tools') && (
        <div className="px-2 pt-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Suchen..."
              className="w-full rounded-lg border border-border bg-muted/40 py-1.5 pl-7 pr-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
        </div>
      )}

      {/* Content Area */}
      <div className={cn(
        'overflow-y-auto p-2 space-y-1',
        variant === 'floating' ? 'max-h-[60vh]' : 'flex-1 min-h-0',
      )}>
        {/* ── Nodes Tab ──────────────────────────────────────────────────── */}
        {activeTab === 'nodes' && (
          <>
            {TYPE_SECTIONS.map(({ types, label }) => {
              const items = filteredPaletteItems.filter((p) => types.includes(p.type))
              if (items.length === 0) return null
              const isCollapsed = collapsed.has(types[0]!)
              const style = NODE_STYLES[types[0]!]

              return (
                <div key={types[0]}>
                  <button
                    onClick={() => toggleSection(types[0]!)}
                    className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-xs font-semibold hover:bg-muted/60 transition-colors"
                    style={{ color: style.accent }}
                  >
                    <span className="flex items-center gap-2">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ background: style.accent }}
                      />
                      {label}
                      <span className="text-[10px] text-muted-foreground font-normal">
                        ({items.length})
                      </span>
                    </span>
                    <ChevronDown
                      className={cn(
                        'h-3 w-3 transition-transform',
                        isCollapsed && '-rotate-90',
                      )}
                    />
                  </button>

                  {!isCollapsed && (
                    <div className="space-y-0.5 pl-1 mt-0.5">
                      {items.map((item, idx) => {
                        const Icon = getNodeIcon(item.icon)
                        const displayLabel = item.label ?? item.tKey
                        const isLogo = item.icon.startsWith('logo-')

                        return (
                          <button
                            key={item.tKey ?? idx}
                            draggable
                            onDragStart={(e) =>
                              handleNodeDragStart(e, {
                                label: displayLabel,
                                icon: item.icon,
                                type: item.type,
                              })
                            }
                            onClick={() =>
                              onAddNode({
                                label: displayLabel,
                                icon: item.icon,
                                type: item.type,
                              })
                            }
                            className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-xs text-foreground hover:bg-muted/80 transition-colors cursor-grab active:cursor-grabbing"
                          >
                            <span
                              className="flex h-6 w-6 items-center justify-center rounded-md shrink-0"
                              style={{ background: style.accent + '15' }}
                            >
                              {isLogo ? (
                                <span className="scale-[0.7]">
                                  {renderNodeIcon(item.icon)}
                                </span>
                              ) : Icon ? (
                                <Icon
                                  className="h-3.5 w-3.5"
                                  style={{ color: style.accent }}
                                />
                              ) : (
                                <span
                                  className="text-[10px] font-bold"
                                  style={{ color: style.accent }}
                                >
                                  {displayLabel[0]}
                                </span>
                              )}
                            </span>
                            <span className="truncate">{displayLabel}</span>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}

            {filteredPaletteItems.length === 0 && (
              <p className="px-2 py-4 text-xs text-muted-foreground text-center">
                Keine Nodes gefunden
              </p>
            )}
          </>
        )}

        {/* ── Tools Tab ─────────────────────────────────────────────────── */}
        {activeTab === 'tools' && (
          <>
            {Object.entries(filteredToolCategories).map(([category, logos]) => {
              const isCollapsed = collapsed.has(`tool-${category}`)

              return (
                <div key={category}>
                  <button
                    onClick={() => toggleSection(`tool-${category}`)}
                    className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-xs font-semibold text-foreground hover:bg-muted/60 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      {category}
                      <span className="text-[10px] text-muted-foreground font-normal">
                        ({logos.length})
                      </span>
                    </span>
                    <ChevronDown
                      className={cn(
                        'h-3 w-3 transition-transform text-muted-foreground',
                        isCollapsed && '-rotate-90',
                      )}
                    />
                  </button>

                  {!isCollapsed && (
                    <div className="space-y-0.5 pl-1 mt-0.5">
                      {logos.map((logo) => (
                        <button
                          key={logo.id}
                          draggable
                          onDragStart={(e) => handleToolDragStart(e, logo)}
                          onClick={() =>
                            onAddNode({
                              label: logo.name,
                              icon: logo.id,
                              type: 'process',
                            })
                          }
                          className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-xs text-foreground hover:bg-muted/80 transition-colors cursor-grab active:cursor-grabbing"
                        >
                          <span className="flex h-6 w-6 items-center justify-center rounded-md shrink-0 bg-muted/50">
                            <span className="scale-[0.7]">
                              {renderNodeIcon(logo.id)}
                            </span>
                          </span>
                          <span className="truncate">{logo.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}

            {Object.keys(filteredToolCategories).length === 0 && (
              <p className="px-2 py-4 text-xs text-muted-foreground text-center">
                Keine Tools gefunden
              </p>
            )}
          </>
        )}

        {/* ── Groups Tab ────────────────────────────────────────────────── */}
        {activeTab === 'groups' && (
          <>
            {/* Group Colors */}
            <div>
              <div className="flex items-center gap-2 px-2 py-1.5 text-xs font-semibold text-foreground">
                <Group className="h-3.5 w-3.5 text-muted-foreground" />
                Gruppen
              </div>
              <div className="grid grid-cols-3 gap-1.5 px-1 mt-0.5">
                {GROUP_COLOR_ENTRIES.map(({ key, label, color }) => (
                  <button
                    key={key}
                    onClick={() => onAddGroup(key)}
                    className="flex flex-col items-center gap-1 rounded-lg p-2 hover:bg-muted/60 transition-colors"
                  >
                    <span
                      className="h-8 w-full rounded-md border"
                      style={{
                        background: color + '12',
                        borderColor: color + '40',
                      }}
                    />
                    <span className="text-[10px] text-muted-foreground">
                      {label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Sticky Note Colors */}
            <div className="mt-2">
              <div className="flex items-center gap-2 px-2 py-1.5 text-xs font-semibold text-foreground">
                <StickyNote className="h-3.5 w-3.5 text-muted-foreground" />
                Haftnotizen
              </div>
              <div className="grid grid-cols-3 gap-1.5 px-1 mt-0.5">
                {STICKY_COLOR_ENTRIES.map(({ key, label, color }) => (
                  <button
                    key={key}
                    onClick={() => onAddSticky(key)}
                    className="flex flex-col items-center gap-1 rounded-lg p-2 hover:bg-muted/60 transition-colors"
                  >
                    <span
                      className="h-8 w-full rounded-md border"
                      style={{
                        background: color + '35',
                        borderColor: color + '60',
                      }}
                    />
                    <span className="text-[10px] text-muted-foreground">
                      {label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
