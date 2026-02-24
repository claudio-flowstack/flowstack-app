import { memo } from 'react'
import type { StickyNote } from '../domain/types'
import { STICKY_COLORS } from './constants'
import { Trash2 } from 'lucide-react'

interface CanvasStickyNoteProps {
  sticky: StickyNote
  selected: boolean
  readOnly: boolean
  onMouseDown: (e: React.MouseEvent, stickyId: string) => void
  onDoubleClick: (stickyId: string) => void
  onResizeStart: (e: React.MouseEvent, stickyId: string) => void
  onDelete: (stickyId: string) => void
  onContextMenu: (e: React.MouseEvent, stickyId: string) => void
}

function CanvasStickyNoteInner({
  sticky,
  selected,
  readOnly,
  onMouseDown,
  onDoubleClick,
  onResizeStart,
  onDelete,
  onContextMenu,
}: CanvasStickyNoteProps) {
  const colors = STICKY_COLORS[sticky.color]

  return (
    <div
      className={`absolute rounded-xl select-none transition-shadow ${
        selected && !readOnly ? 'ring-2 ring-purple-500/50 shadow-xl' : ''
      }`}
      style={{
        left: sticky.x,
        top: sticky.y,
        width: sticky.width,
        height: sticky.height,
        background: colors.bg,
        border: `2px solid ${colors.border}`,
        boxShadow: selected
          ? undefined
          : `0 2px 8px ${colors.shadow}, 0 1px 3px rgba(0,0,0,0.06)`,
        zIndex: selected ? 8 : 5,
        cursor: readOnly ? 'default' : 'grab',
      }}
      onMouseDown={(e) => {
        e.stopPropagation()
        onMouseDown(e, sticky.id)
      }}
      onDoubleClick={() => onDoubleClick(sticky.id)}
      onContextMenu={(e) => {
        e.preventDefault()
        e.stopPropagation()
        onContextMenu(e, sticky.id)
      }}
    >
      {/* Text content */}
      <div className="p-3.5 h-full overflow-hidden">
        <p
          className="leading-relaxed whitespace-pre-wrap break-words"
          style={{
            color: sticky.customTextColor || colors.text,
            fontSize: sticky.fontSize || 12,
            fontWeight: sticky.fontWeight === 'bold' ? 700 : 500,
            fontStyle: sticky.fontStyle === 'italic' ? 'italic' : 'normal',
          }}
        >
          {sticky.text}
        </p>
      </div>

      {/* Controls when selected */}
      {selected && !readOnly && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete(sticky.id)
            }}
            className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center text-[10px] hover:bg-red-600 z-30"
          >
            <Trash2 size={10} />
          </button>
          <div
            className="absolute right-0 bottom-0 w-5 h-5 cursor-se-resize z-20"
            onMouseDown={(e) => {
              e.stopPropagation()
              onResizeStart(e, sticky.id)
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
                opacity="0.5"
              />
            </svg>
          </div>
        </>
      )}
    </div>
  )
}

export const CanvasStickyNoteComponent = memo(CanvasStickyNoteInner)
