import type { ContentItem, ContentStatus } from '../domain/types'
import { STATUS_CONFIG, STATUS_ORDER } from '../domain/constants'
import { cn } from '@/shared/lib/utils'

interface ContentPipelineProps {
  items: ContentItem[]
  onOpen: (id: string) => void
  onMoveStatus: (id: string, status: ContentStatus) => void
}

export function ContentPipeline({
  items,
  onOpen,
  onMoveStatus,
}: ContentPipelineProps) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {STATUS_ORDER.map((status) => {
        const config = STATUS_CONFIG[status]
        const columnItems = items.filter((i) => i.status === status)

        return (
          <div
            key={status}
            className="flex-shrink-0 w-64"
            onDragOver={(e) => {
              e.preventDefault()
              e.currentTarget.classList.add('bg-primary/5')
            }}
            onDragLeave={(e) => {
              e.currentTarget.classList.remove('bg-primary/5')
            }}
            onDrop={(e) => {
              e.preventDefault()
              e.currentTarget.classList.remove('bg-primary/5')
              const itemId = e.dataTransfer.getData('text/plain')
              if (itemId) onMoveStatus(itemId, status)
            }}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-2">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: config.color }}
                />
                <span className="text-xs font-semibold text-foreground">
                  {config.label}
                </span>
              </div>
              <span className="text-[10px] font-medium text-muted-foreground rounded-full bg-muted px-1.5 py-0.5">
                {columnItems.length}
              </span>
            </div>

            {/* Column Cards */}
            <div className="space-y-2 min-h-[100px] rounded-xl border border-dashed border-border/50 p-2 transition-colors">
              {columnItems.map((item) => (
                <div
                  key={item.id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', item.id)
                  }}
                  onClick={() => onOpen(item.id)}
                  className={cn(
                    'rounded-lg border border-border bg-card p-3 cursor-pointer',
                    'hover:border-primary/30 hover:shadow-sm',
                    'transition-all duration-150',
                  )}
                >
                  <p className="text-xs font-semibold text-foreground line-clamp-2">
                    {item.title}
                  </p>
                  {item.angle && (
                    <p className="mt-1 text-[11px] text-muted-foreground line-clamp-1">
                      {item.angle}
                    </p>
                  )}
                  <div className="mt-2 flex items-center gap-2">
                    <span
                      className="text-[9px] font-semibold rounded-full px-1.5 py-0.5"
                      style={{
                        background: `${config.color}15`,
                        color: config.color,
                      }}
                    >
                      {item.platform === 'youtube'
                        ? 'YT'
                        : item.platform === 'instagram'
                          ? 'IG'
                          : 'FB/LI'}
                    </span>
                    {item.checklist.length > 0 && (
                      <span className="text-[10px] text-muted-foreground">
                        {item.checklist.filter((c) => c.completed).length}/
                        {item.checklist.length}
                      </span>
                    )}
                  </div>
                </div>
              ))}

              {columnItems.length === 0 && (
                <div className="py-4 text-center text-[11px] text-muted-foreground/50">
                  Leer
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
