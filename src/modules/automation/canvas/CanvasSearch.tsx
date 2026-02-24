import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Search, X } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import type { SystemNode } from '../domain/types'
import { NODE_STYLES } from './constants'
import { getNodeIcon } from './icons'
import { renderNodeIcon } from './ToolLogos'
import React from 'react'

// ── Props ───────────────────────────────────────────────────────────────────

interface CanvasSearchProps {
  nodes: SystemNode[]
  open: boolean
  onClose: () => void
  onSelectNode: (nodeId: string) => void
}

// ── Helpers ─────────────────────────────────────────────────────────────────

const MAX_RESULTS = 8

function matchesQuery(node: SystemNode, query: string): boolean {
  const q = query.toLowerCase()
  return (
    node.label.toLowerCase().includes(q) ||
    node.description.toLowerCase().includes(q) ||
    node.type.toLowerCase().includes(q)
  )
}

// ── Component ───────────────────────────────────────────────────────────────

export function CanvasSearch({ nodes, open, onClose, onSelectNode }: CanvasSearchProps) {
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // Filter nodes based on search query
  const filtered = useMemo(() => {
    if (!query.trim()) return nodes
    return nodes.filter((n) => matchesQuery(n, query))
  }, [nodes, query])

  // Reset state when opening
  useEffect(() => {
    if (open) {
      setQuery('')
      setActiveIndex(0)
      // Auto-focus with a small delay so the DOM is ready
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [open])

  // Clamp active index when results change (respect MAX_RESULTS limit)
  const visibleCount = Math.min(filtered.length, MAX_RESULTS)
  useEffect(() => {
    setActiveIndex((prev) => Math.min(prev, Math.max(visibleCount - 1, 0)))
  }, [visibleCount])

  // Scroll active item into view
  useEffect(() => {
    if (!listRef.current) return
    const active = listRef.current.children[activeIndex] as HTMLElement | undefined
    active?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex])

  // Select the currently highlighted node
  const selectCurrent = useCallback(() => {
    const node = filtered[activeIndex]
    if (node) {
      onSelectNode(node.id)
      onClose()
    }
  }, [filtered, activeIndex, onSelectNode, onClose])

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setActiveIndex((prev) => (prev + 1) % Math.max(visibleCount, 1))
          break
        case 'ArrowUp':
          e.preventDefault()
          setActiveIndex((prev) => (prev - 1 + visibleCount) % Math.max(visibleCount, 1))
          break
        case 'Enter':
          e.preventDefault()
          selectCurrent()
          break
        case 'Escape':
          e.preventDefault()
          onClose()
          break
      }
    },
    [visibleCount, selectCurrent, onClose],
  )

  // Close on backdrop click
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        onClose()
      }
    },
    [onClose],
  )

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[200] flex items-start justify-center pt-[18vh] bg-black/40 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div
        className="w-full max-w-md rounded-xl border border-border bg-card shadow-2xl overflow-hidden animate-fade-in"
        onKeyDown={handleKeyDown}
      >
        {/* ── Search Input ─────────────────────────────────────────────────── */}
        <div className="flex items-center gap-2.5 border-b border-border px-4 py-3">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Nodes suchen..."
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="shrink-0 rounded p-0.5 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* ── Results List ──────────────────────────────────────────────────── */}
        <div
          ref={listRef}
          className="max-h-[min(24rem,50vh)] overflow-y-auto py-1"
        >
          {filtered.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              Keine Nodes gefunden
            </div>
          ) : (
            filtered.slice(0, MAX_RESULTS).map((node, index) => {
              const style = NODE_STYLES[node.type]
              const isActive = index === activeIndex
              const LucideIcon = getNodeIcon(node.icon)

              return (
                <button
                  key={node.id}
                  onClick={() => {
                    onSelectNode(node.id)
                    onClose()
                  }}
                  onMouseEnter={() => setActiveIndex(index)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors',
                    isActive
                      ? 'bg-purple-500/10 dark:bg-purple-500/15'
                      : 'hover:bg-muted/50',
                  )}
                >
                  {/* Node icon */}
                  <span
                    className="flex h-8 w-8 items-center justify-center rounded-lg shrink-0"
                    style={{ backgroundColor: style.bg, border: `1px solid ${style.border}` }}
                  >
                    {LucideIcon
                      ? React.createElement(LucideIcon, {
                          className: 'h-4 w-4',
                          style: { color: style.accent },
                        })
                      : renderNodeIcon(
                          node.icon,
                          node.logoUrl,
                          null,
                          16,
                        )}
                  </span>

                  {/* Label & description */}
                  <div className="flex-1 min-w-0">
                    <span
                      className={cn(
                        'block truncate text-sm font-medium',
                        isActive ? 'text-purple-600 dark:text-purple-400' : 'text-foreground',
                      )}
                    >
                      {node.label}
                    </span>
                    {node.description && (
                      <span className="block truncate text-xs text-muted-foreground mt-0.5">
                        {node.description}
                      </span>
                    )}
                  </div>

                  {/* Type badge */}
                  <span
                    className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                    style={{
                      color: style.accent,
                      backgroundColor: style.bg,
                      border: `1px solid ${style.border}`,
                    }}
                  >
                    {style.label}
                  </span>
                </button>
              )
            })
          )}
        </div>

        {/* ── Footer Hints ──────────────────────────────────────────────────── */}
        {filtered.length > 0 && (
          <div className="flex items-center gap-3 border-t border-border px-4 py-2 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-mono text-[10px]">
                &uarr;&darr;
              </kbd>
              Navigieren
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-mono text-[10px]">
                &crarr;
              </kbd>
              Auswählen
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-mono text-[10px]">
                Esc
              </kbd>
              Schließen
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
