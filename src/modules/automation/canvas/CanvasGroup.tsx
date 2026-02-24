import { memo } from 'react'
import type { CanvasGroup as CanvasGroupType } from '../domain/types'
import { GROUP_COLORS } from '../domain/constants'

interface CanvasGroupProps {
  group: CanvasGroupType
  selected: boolean
  readOnly: boolean
  onMouseDown: (e: React.MouseEvent, groupId: string) => void
  onDoubleClick: (groupId: string) => void
  onResizeStart: (e: React.MouseEvent, groupId: string) => void
  onContextMenu: (e: React.MouseEvent, groupId: string) => void
}

function CanvasGroupInner({
  group,
  selected,
  readOnly,
  onMouseDown,
  onDoubleClick,
  onResizeStart,
  onContextMenu,
}: CanvasGroupProps) {
  const colors = GROUP_COLORS[group.color] ?? GROUP_COLORS['gray']
  if (!colors) return null

  return (
    <div
      className={`absolute rounded-2xl border-2 border-dashed transition-shadow ${
        selected && !readOnly ? 'ring-2 ring-purple-500/50 shadow-lg' : ''
      }`}
      style={{
        left: group.x,
        top: group.y,
        width: group.width,
        height: group.height,
        background: colors.bg,
        borderColor: colors.border,
        zIndex: 1,
        pointerEvents: 'none', // Let clicks pass through to nodes inside
      }}
    >
      {/* Header — interactive drag area */}
      <div
        className="px-4 py-3"
        style={{
          pointerEvents: 'auto',
          cursor: readOnly ? 'default' : 'grab',
        }}
        onMouseDown={(e) => {
          e.stopPropagation()
          onMouseDown(e, group.id)
        }}
        onDoubleClick={() => onDoubleClick(group.id)}
        onContextMenu={(e) => {
          e.preventDefault()
          e.stopPropagation()
          onContextMenu(e, group.id)
        }}
      >
        <span
          className="text-xs font-bold uppercase tracking-widest"
          style={{ color: colors.text }}
        >
          {group.label}
        </span>
        {group.description && (
          <p
            className="mt-0.5 text-[10px] leading-tight opacity-70"
            style={{ color: colors.text }}
          >
            {group.description}
          </p>
        )}
      </div>

      {/* Resize handle */}
      {selected && !readOnly && (
        <div
          className="absolute right-0 bottom-0 w-5 h-5 cursor-se-resize z-20"
          style={{ pointerEvents: 'auto' }}
          onMouseDown={(e) => {
            e.stopPropagation()
            onResizeStart(e, group.id)
          }}
        >
          <svg
            className="absolute right-1 bottom-1"
            width="8"
            height="8"
            viewBox="0 0 8 8"
          >
            <path
              d="M7 1L1 7M7 4L4 7M7 7L7 7"
              stroke={colors.text}
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </div>
      )}
    </div>
  )
}

export const CanvasGroupComponent = memo(CanvasGroupInner)
