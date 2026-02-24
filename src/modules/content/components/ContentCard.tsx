import { useState, useRef, useEffect } from 'react'
import type { ContentItem } from '../domain/types'
import { PLATFORM_CONFIG, STATUS_CONFIG, PRIORITY_CONFIG } from '../domain/constants'
import { cn } from '@/shared/lib/utils'
import { formatDate } from '@/shared/lib/utils'
import { MoreHorizontal, Copy, Trash2, Pencil } from 'lucide-react'

interface ContentCardProps {
  item: ContentItem
  onOpen: (id: string) => void
  onDelete: (id: string) => void
  onDuplicate: (id: string) => void
}

export function ContentCard({
  item,
  onOpen,
  onDelete,
  onDuplicate,
}: ContentCardProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen])

  const platform = PLATFORM_CONFIG[item.platform]
  const status = STATUS_CONFIG[item.status]
  const priority = PRIORITY_CONFIG[item.priority]

  return (
    <div
      className={cn(
        'group relative rounded-xl border border-border bg-card p-4 cursor-pointer',
        'hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5',
        'transition-all duration-200',
      )}
      onClick={() => onOpen(item.id)}
    >
      {/* Header: Platform + Priority */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold"
            style={{ background: platform.bgColor, color: platform.color }}
          >
            {platform.label}
          </span>
          <span
            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
            style={{ background: priority.bgColor, color: priority.color }}
          >
            {priority.dot} {priority.label}
          </span>
        </div>

        {/* Context menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={(e) => {
              e.stopPropagation()
              setMenuOpen(!menuOpen)
            }}
            className="rounded-lg p-1 text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-muted transition-all"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 w-40 rounded-lg border border-border bg-popover p-1 shadow-lg z-50 animate-fade-in">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onOpen(item.id)
                  setMenuOpen(false)
                }}
                className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-sm text-foreground hover:bg-muted transition-colors"
              >
                <Pencil className="h-3.5 w-3.5" />
                Bearbeiten
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onDuplicate(item.id)
                  setMenuOpen(false)
                }}
                className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-sm text-foreground hover:bg-muted transition-colors"
              >
                <Copy className="h-3.5 w-3.5" />
                Duplizieren
              </button>
              <div className="my-1 h-px bg-border" />
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(item.id)
                  setMenuOpen(false)
                }}
                className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-sm text-red-500 hover:bg-red-500/10 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Löschen
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Title */}
      <h3 className="mt-3 text-sm font-semibold text-foreground line-clamp-2">
        {item.title}
      </h3>

      {/* Angle/Hook */}
      {item.angle && (
        <p className="mt-1.5 text-xs text-muted-foreground line-clamp-1">
          {item.angle}
        </p>
      )}

      {/* Footer: Status + Tags + Date */}
      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium"
            style={{ background: status.bgColor, color: status.color }}
          >
            {status.label}
          </span>
          {item.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="text-[10px] text-muted-foreground"
            >
              #{tag}
            </span>
          ))}
        </div>
        <span className="text-[10px] text-muted-foreground/70">
          {formatDate(item.updatedAt)}
        </span>
      </div>
    </div>
  )
}
