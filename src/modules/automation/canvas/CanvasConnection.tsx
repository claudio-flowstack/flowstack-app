import { memo } from 'react'
import type { SystemNode, NodeConnection, NodeExecutionStatus } from '../domain/types'
import { CONN_COLORS, STROKE_DASH } from './constants'
import { getPathByStyle, getPathMidpoint } from './helpers'
import type { CurveStyle } from './helpers'

interface CanvasConnectionProps {
  connection: NodeConnection
  index: number
  fromNode: SystemNode
  toNode: SystemNode
  selected: boolean
  hovered: boolean
  readOnly: boolean
  colorTheme: string
  curveStyle: CurveStyle
  lineStyle: 'solid' | 'dashed' | 'dotted'
  arrowHead: 'none' | 'arrow' | 'diamond' | 'circle'
  glow: boolean
  strokeWidth: number
  zoom: number
  fromStatus?: NodeExecutionStatus
  toStatus?: NodeExecutionStatus
  onClick: (idx: number) => void
  onMouseEnter: (idx: number) => void
  onMouseLeave: () => void
  onContextMenu: (e: React.MouseEvent, idx: number) => void
  onInsertClick?: (idx: number) => void
  // Label editing
  onEditLabel?: (idx: number) => void
  isEditingLabel?: boolean
  editLabelValue?: string
  onEditLabelChange?: (value: string) => void
  onEditLabelSave?: () => void
  onEditLabelCancel?: () => void
  showFlowDots?: boolean
  connStyleMode?: 'v3' | 'classic'
  sourceAccentColor?: string
  isDark?: boolean
}

function CanvasConnectionInner({
  connection,
  index,
  fromNode,
  toNode,
  selected,
  hovered,
  readOnly,
  colorTheme,
  curveStyle,
  lineStyle,
  arrowHead,
  glow,
  strokeWidth,
  zoom,
  fromStatus = 'idle',
  toStatus = 'idle',
  onClick,
  onMouseEnter,
  onMouseLeave,
  onContextMenu,
  onInsertClick,
  onEditLabel,
  isEditingLabel = false,
  editLabelValue = '',
  onEditLabelChange,
  onEditLabelSave,
  onEditLabelCancel,
  showFlowDots = true,
  connStyleMode = 'classic',
  sourceAccentColor,
  isDark = false,
}: CanvasConnectionProps) {
  const fp = connection.fromPort || 'right'
  const tp = connection.toPort || 'left'
  const pathD = getPathByStyle(fromNode, toNode, fp, tp, curveStyle)
  const cc = CONN_COLORS[colorTheme] ?? CONN_COLORS['purple']!
  if (!cc) return null
  const markerEnd = arrowHead !== 'none' ? `url(#conn-${arrowHead})` : undefined
  const dashArr = STROKE_DASH[lineStyle]

  // Animated dot styling based on execution status
  const isV3 = connStyleMode === 'v3' && !!sourceAccentColor
  let dotColor = isV3 ? sourceAccentColor : cc.dot
  let dotSpeed = 2.5 + index * 0.3
  let dotR = 3
  if (fromStatus === 'completed' && toStatus === 'completed') {
    dotColor = isV3 ? sourceAccentColor : '#10b981'
    dotSpeed = 2
    dotR = 3.5
  } else if (fromStatus === 'completed' && (toStatus === 'running' || toStatus === 'pending')) {
    dotColor = isV3 ? sourceAccentColor : '#3b82f6'
    dotSpeed = 1.2
    dotR = 4
  } else if (fromStatus === 'running') {
    dotColor = isV3 ? sourceAccentColor : '#3b82f6'
    dotSpeed = 1.8
    dotR = 3.5
  }

  return (
    <g
      style={{ pointerEvents: 'stroke' }}
      onClick={(e) => {
        if (readOnly) return
        e.stopPropagation()
        onClick(index)
      }}
      onMouseEnter={() => !readOnly && onMouseEnter(index)}
      onMouseLeave={onMouseLeave}
      onContextMenu={(e) => {
        e.preventDefault()
        onContextMenu(e, index)
      }}
    >
      {/* Invisible wider hit area */}
      <path
        d={pathD}
        stroke="transparent"
        strokeWidth={12 / zoom}
        fill="none"
        style={{ cursor: readOnly ? 'default' : 'pointer', pointerEvents: 'stroke' }}
      />

      {/* Main path */}
      {connStyleMode === 'v3' && sourceAccentColor ? (() => {
        const isFromActive = fromStatus === 'completed' || fromStatus === 'running'
        // V3: idle = accent color with opacity, active = full accent
        const v3Color = selected ? sourceAccentColor
          : isFromActive ? sourceAccentColor
          : sourceAccentColor + (isDark ? '70' : '55')
        const v3Width = selected ? 3 : isFromActive ? 2.5 : 1.8
        // Always animated: idle = slow, active = fast
        const v3Class = selected ? undefined
          : isFromActive ? 'v3-connection-active'
          : 'v3-connection-idle'
        return (
          <>
            {isFromActive && (
              <path d={pathD} stroke={sourceAccentColor} strokeWidth={v3Width * 3} fill="none" opacity={0.1} />
            )}
            <path
              d={pathD}
              stroke={v3Color}
              strokeWidth={hovered ? v3Width + 0.5 : v3Width}
              strokeLinecap="round"
              fill="none"
              className={v3Class}
              style={{ transition: 'stroke 0.5s, stroke-width 0.3s' }}
            />
          </>
        )
      })() : (
        <>
          {glow && (
            <path d={pathD} stroke={cc.selected} strokeWidth={strokeWidth * 4} fill="none" opacity={0.1} />
          )}
          <path
            d={pathD}
            stroke={selected ? cc.selected : hovered ? cc.hover : cc.default}
            strokeWidth={selected ? strokeWidth + 1 : hovered ? strokeWidth + 0.5 : strokeWidth}
            strokeDasharray={dashArr}
            markerEnd={markerEnd}
            fill="none"
          />
          {/* Animated dots — classic mode only */}
          {showFlowDots && (
            <circle r={dotR} fill={dotColor} opacity={0.8}>
              <animateMotion
                dur={`${dotSpeed}s`}
                repeatCount="indefinite"
                path={pathD}
              />
            </circle>
          )}
        </>
      )}

      {/* Connection label (pill at midpoint) */}
      {connection.label && !isEditingLabel && (() => {
        const mid = getPathMidpoint(fromNode, toNode, fp, tp, curveStyle)
        return (
          <foreignObject
            x={mid.x - 60}
            y={mid.y - 22}
            width={120}
            height={24}
            style={{ pointerEvents: 'all', overflow: 'visible' }}
          >
            <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
              <div
                onDoubleClick={(e) => {
                  e.stopPropagation()
                  onEditLabel?.(index)
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '1px 8px',
                  fontSize: 10,
                  fontFamily: 'system-ui, sans-serif',
                  lineHeight: '16px',
                  whiteSpace: 'nowrap' as const,
                  borderRadius: 9999,
                  background: isDark ? 'rgba(39,39,42,0.95)' : 'rgba(255,255,255,0.95)',
                  border: `1px solid ${isDark ? 'rgba(63,63,70,0.6)' : 'rgba(209,213,219,0.8)'}`,
                  color: isDark ? '#d4d4d8' : '#374151',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                  cursor: readOnly ? 'default' : 'pointer',
                  maxWidth: 120,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
                title={connection.label}
              >
                {connection.label}
              </div>
            </div>
          </foreignObject>
        )
      })()}

      {/* Inline label editing input */}
      {isEditingLabel && (() => {
        const mid = getPathMidpoint(fromNode, toNode, fp, tp, curveStyle)
        return (
          <foreignObject
            x={mid.x - 70}
            y={mid.y - 16}
            width={140}
            height={32}
            style={{ pointerEvents: 'all', overflow: 'visible' }}
          >
            <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
              <input
                autoFocus
                value={editLabelValue}
                onChange={(e) => onEditLabelChange?.(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onEditLabelSave?.()
                  if (e.key === 'Escape') onEditLabelCancel?.()
                  e.stopPropagation()
                }}
                onBlur={() => onEditLabelSave?.()}
                onClick={(e) => e.stopPropagation()}
                placeholder="Bezeichnung..."
                style={{
                  width: 130,
                  height: 24,
                  padding: '2px 8px',
                  fontSize: 10,
                  fontFamily: 'system-ui, sans-serif',
                  borderRadius: 9999,
                  border: `1.5px solid ${isDark ? 'rgba(139,92,246,0.6)' : 'rgba(139,92,246,0.5)'}`,
                  background: isDark ? 'rgba(39,39,42,0.98)' : 'rgba(255,255,255,0.98)',
                  color: isDark ? '#e4e4e7' : '#1f2937',
                  outline: 'none',
                  textAlign: 'center' as const,
                  boxShadow: '0 0 0 2px rgba(139,92,246,0.15), 0 2px 6px rgba(0,0,0,0.1)',
                }}
              />
            </div>
          </foreignObject>
        )
      })()}

      {/* Insert node on connection (+) */}
      {hovered && !readOnly && !isEditingLabel && onInsertClick && (() => {
        const mid = getPathMidpoint(fromNode, toNode, fp, tp, curveStyle)
        return (
          <foreignObject
            x={mid.x - 12}
            y={connection.label ? mid.y - 38 : mid.y - 12}
            width={24}
            height={24}
            style={{ pointerEvents: 'all', overflow: 'visible' }}
          >
            <div style={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onInsertClick(index)
                }}
                className="w-6 h-6 rounded-full bg-purple-500 hover:bg-purple-400 text-white flex items-center justify-center shadow-lg transition-all hover:scale-110 border-2 border-white dark:border-zinc-900"
                style={{ fontSize: 16, lineHeight: 1, fontWeight: 700, cursor: 'pointer' }}
              >
                +
              </button>
            </div>
          </foreignObject>
        )
      })()}
    </g>
  )
}

export const CanvasConnection = memo(CanvasConnectionInner)
