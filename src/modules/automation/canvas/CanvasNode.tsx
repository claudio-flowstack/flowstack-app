import { memo } from 'react'
import type { SystemNode, PortDirection, NodeExecutionStatus } from '../domain/types'
import { NODE_STYLES, NODE_TYPE_DIMENSIONS } from './constants'
import { cn } from '@/shared/lib/utils'
import { getNodeIcon } from './icons'
import { renderNodeIcon } from './ToolLogos'
import { Plus, Loader2, Check, X, Pin, Paperclip, Globe, CheckCircle2, XCircle, Hand } from 'lucide-react'

// ── Props ────────────────────────────────────────────────────────────────────

interface CanvasNodeProps {
  node: SystemNode
  selected: boolean
  multiSelected: boolean
  hovered: boolean
  connecting: boolean
  readOnly: boolean
  executionStatus: NodeExecutionStatus
  designTheme: string
  nodeLayout: string
  isDark: boolean
  showTypeBadges: boolean
  showDescriptions: boolean
  customColor?: string | null
  isPinned?: boolean
  executionItems?: number
  onMouseDown: (e: React.MouseEvent, nodeId: string) => void
  onDoubleClick: (nodeId: string) => void
  onPortMouseDown: (e: React.MouseEvent, nodeId: string, port: PortDirection) => void
  onPortMouseUp: (e: React.MouseEvent, nodeId: string, port: PortDirection) => void
  onMouseEnter: (nodeId: string) => void
  onMouseLeave: () => void
  onContextMenu: (e: React.MouseEvent, nodeId: string) => void
  onLinkedPageClick?: (page: string) => void
  onDrillDown?: (systemId: string) => void
}

// ── Constants ────────────────────────────────────────────────────────────────

const PORTS: PortDirection[] = ['top', 'right', 'bottom', 'left']

const PORT_POSITIONS: Record<PortDirection, { style: React.CSSProperties }> = {
  top: { style: { top: 0, left: '50%', transform: 'translate(-50%, -50%)' } },
  right: { style: { top: '50%', right: 0, transform: 'translate(50%, -50%)' } },
  bottom: { style: { bottom: 0, left: '50%', transform: 'translate(-50%, 50%)' } },
  left: { style: { top: '50%', left: 0, transform: 'translate(-50%, -50%)' } },
}

const STATUS_RINGS: Record<NodeExecutionStatus, string> = {
  idle: '',
  pending: 'ring-1 ring-purple-400/40',
  running: 'ring-2 ring-purple-500/70 shadow-md shadow-purple-500/10',
  completed: 'ring-2 ring-emerald-500 shadow-md shadow-emerald-500/15',
  failed: 'ring-2 ring-red-500/70',
}

// Small pill nodes (vertically centered icon + label)
const SMALL_PILL_TYPES = new Set(['ifelse', 'merge', 'router'])

// Large node types (ai, subsystem, agent)
const LARGE_TYPES = new Set(['ai', 'subsystem', 'agent'])

// ── Icon Renderer ────────────────────────────────────────────────────────────

function NodeIcon({ node, size = 18, accent }: { node: SystemNode; size?: number; accent: string }) {
  const LucideIcon = getNodeIcon(node.icon)
  const fallback = LucideIcon
    ? <LucideIcon style={{ color: accent, width: size, height: size }} />
    : <div className="rounded-full" style={{ background: accent, width: size, height: size }} />

  return <>{renderNodeIcon(node.icon, node.logoUrl, fallback, size)}</>
}

// ── Component ────────────────────────────────────────────────────────────────

function CanvasNodeInner({
  node,
  selected,
  multiSelected,
  hovered,
  connecting,
  readOnly,
  executionStatus,
  designTheme,
  nodeLayout,
  isDark,
  showTypeBadges,
  showDescriptions,
  customColor,
  isPinned,
  executionItems,
  onMouseDown,
  onDoubleClick,
  onPortMouseDown,
  onPortMouseUp,
  onMouseEnter,
  onMouseLeave,
  onContextMenu,
  onLinkedPageClick,
  onDrillDown,
}: CanvasNodeProps) {
  const style = NODE_STYLES[node.type]
  const dims = NODE_TYPE_DIMENSIONS[node.type]
  const isActive = executionStatus !== 'idle'
  const showPorts = (hovered || connecting) && !readOnly
  const isLightText = designTheme === 'neon' || designTheme === 'gradient' || designTheme === 'solid'
  const hasExecData = (executionItems ?? 0) > 0
  const isLarge = LARGE_TYPES.has(node.type)

  // ── Theme styling ──────────────────────────────────────────────────────

  let themeClass = 'absolute border backdrop-blur-sm select-none'
  const themeStyle: React.CSSProperties = {
    left: node.x,
    top: node.y,
    width: dims.w,
    height: dims.h,
    borderRadius: dims.radius,
    zIndex: 5,
  }

  // Status-based defaults (used by classic + nodelab themes)
  const statusBg = isActive && executionStatus === 'running'
    ? (isDark ? 'rgba(168,85,247,0.06)' : 'rgba(168,85,247,0.04)')
    : isActive && executionStatus === 'completed'
      ? 'rgba(16,185,129,0.08)'
      : style.bg
  const statusBorder = isActive
    ? executionStatus === 'completed' ? '#10b981'
      : executionStatus === 'failed' ? '#ef4444' : '#a855f7'
    : (selected || multiSelected) && !readOnly ? style.accent : style.border

  switch (designTheme) {
    case 'glass':
      themeClass = 'absolute border-2 backdrop-blur-2xl select-none'
      themeStyle.background = `linear-gradient(145deg, ${style.accent}20, ${style.accent}08, transparent)`
      themeStyle.borderColor = style.accent + '50'
      themeStyle.boxShadow = `0 0 40px ${style.accent}20, 0 12px 40px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.25), inset 0 -1px 0 rgba(0,0,0,0.08)`
      break

    case 'minimal':
      themeClass = 'absolute border select-none'
      themeStyle.background = 'transparent'
      themeStyle.borderColor = statusBorder
      break

    case 'outlined':
      themeClass = 'absolute border-l-4 border select-none'
      themeStyle.background = isDark ? 'rgba(24,24,27,0.95)' : 'rgba(255,255,255,0.97)'
      themeStyle.borderColor = isDark ? 'rgba(63,63,70,0.4)' : 'rgba(229,231,235,0.6)'
      themeStyle.borderLeft = `4px solid ${style.accent}`
      themeStyle.borderRadius = 4
      break

    case 'neon':
      themeClass = 'absolute border-2 select-none'
      themeStyle.background = 'rgba(5,5,15,0.98)'
      themeStyle.borderColor = style.accent
      themeStyle.boxShadow = `0 0 20px ${style.accent}70, 0 0 60px ${style.accent}35, 0 0 100px ${style.accent}15, inset 0 0 30px ${style.accent}10`
      break

    case 'gradient':
      themeClass = 'absolute select-none'
      themeStyle.background = `linear-gradient(135deg, ${style.accent}, ${style.accent}90)`
      themeStyle.border = 'none'
      themeStyle.boxShadow = `0 12px 40px ${style.accent}40, 0 4px 16px rgba(0,0,0,0.15)`
      break

    case 'solid':
      themeClass = 'absolute select-none'
      themeStyle.background = `linear-gradient(180deg, ${style.accent}, ${style.accent}cc)`
      themeStyle.border = 'none'
      themeStyle.boxShadow = `0 8px 24px ${style.accent}50, 0 2px 8px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.3)`
      break

    case 'wire':
      themeClass = 'absolute select-none'
      themeStyle.background = 'transparent'
      themeStyle.border = `2px dashed ${style.accent}60`
      break

    case 'nodelab': {
      // 1:1 NodeLab V3 styling — accent-based backgrounds, strong borders, per-type glow
      themeClass = 'absolute border backdrop-blur-sm select-none'
      const isLargeNl = node.type === 'ai' || node.type === 'subsystem' || node.type === 'agent'

      if (isActive) {
        // During execution: status-driven styling for visual feedback
        themeStyle.background = statusBg
        themeStyle.borderColor = statusBorder
      } else {
        // Idle: Original V3 accent-based backgrounds + stronger borders
        themeStyle.background = isLargeNl
          ? (isDark ? style.accent + '0c' : style.accent + '0a')
          : (isDark ? style.accent + '09' : style.accent + '07')
        themeStyle.borderColor = style.accent + (isDark ? '40' : '35')
        if ((selected || multiSelected) && !readOnly) {
          themeStyle.borderColor = style.accent
        }
      }

      // V3 type-specific glow — ALL types get glow, stronger for AI/large nodes
      const nlGlow = node.type === 'ai'
        ? `0 0 30px ${style.accent}25, 0 0 60px ${style.accent}0c`
        : isLargeNl
          ? `0 0 24px ${style.accent}20, 0 0 48px ${style.accent}0a`
          : `0 0 18px ${style.accent}18`
      themeStyle.boxShadow = nlGlow

      if (executionStatus === 'running') {
        themeStyle.zIndex = 20
      }
      break
    }

    default: // 'classic' / 'default'
      themeStyle.background = statusBg
      themeStyle.borderColor = statusBorder
  }

  // Custom color override
  if (customColor && !isActive) {
    themeStyle.borderColor = customColor
    themeStyle.background = customColor + '12'
  }

  // Pinned node glow
  if (isPinned) {
    themeStyle.boxShadow = '0 0 0 2px #3b82f6, 0 0 16px rgba(59,130,246,0.25)'
  }

  // Icon background — matches NodeLab V3 per-type values
  const iconBg = isLightText ? 'rgba(255,255,255,0.18)' : style.accent + '18'
  const iconBgSubtle = isLightText ? 'rgba(255,255,255,0.18)' : style.accent + '15'
  const labelColor: React.CSSProperties | undefined = isLightText ? { color: 'rgba(255,255,255,0.95)' } : undefined
  const descColor: React.CSSProperties | undefined = isLightText ? { color: 'rgba(255,255,255,0.65)' } : undefined

  // ── Layout Variants ────────────────────────────────────────────────────

  const renderContent = () => {
    if (nodeLayout === 'centered') {
      return (
        <div className="h-full flex flex-col items-center justify-center px-3 text-center">
          <div className="rounded-lg flex items-center justify-center mb-1" style={{ background: iconBg, width: dims.iconBoxSize, height: dims.iconBoxSize }}>
            <NodeIcon node={node} size={dims.iconSize} accent={style.accent} />
          </div>
          <div className="font-medium truncate w-full" style={{ fontSize: dims.fontSize, ...labelColor }}>
            <span className={isDark ? 'text-white' : 'text-gray-900'}>{node.label}</span>
          </div>
          {node.description && showDescriptions && (
            <div className="mt-0.5 truncate w-full" style={{ fontSize: dims.descSize, ...descColor }}>
              <span className={isDark ? 'text-zinc-500' : 'text-gray-500'}>{node.description}</span>
            </div>
          )}
        </div>
      )
    }

    if (nodeLayout === 'compact') {
      return (
        <div className="h-full flex items-center px-4 gap-2.5 min-w-0">
          <div className="rounded-md flex items-center justify-center shrink-0" style={{ background: iconBg, width: dims.iconBoxSize * 0.8, height: dims.iconBoxSize * 0.8 }}>
            <NodeIcon node={node} size={dims.iconSize * 0.8} accent={style.accent} />
          </div>
          <div className="font-medium truncate min-w-0 flex-1" style={{ fontSize: dims.fontSize, ...labelColor }}>
            <span className={isDark ? 'text-white' : 'text-gray-900'}>{node.label}</span>
          </div>
        </div>
      )
    }

    if (nodeLayout === 'icon-focus') {
      return (
        <div className="h-full flex flex-col items-center justify-center px-3">
          <div className="rounded-xl flex items-center justify-center mb-1.5" style={{ background: iconBg, width: dims.iconBoxSize * 1.2, height: dims.iconBoxSize * 1.2 }}>
            <NodeIcon node={node} size={dims.iconSize * 1.3} accent={style.accent} />
          </div>
          <div className="font-semibold truncate w-full text-center" style={{ fontSize: Math.max(dims.fontSize - 2, 10), ...labelColor }}>
            <span className={isDark ? 'text-white' : 'text-gray-900'}>{node.label}</span>
          </div>
        </div>
      )
    }

    // ── Standard layout — 1:1 NodeLab V3 type-specific rendering ────────

    // AI node: large with bigger icon + subtle glow
    if (node.type === 'ai') {
      return (
        <div className="h-full flex items-center px-5 gap-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0" style={{ background: iconBg }}>
            <NodeIcon node={node} size={dims.iconSize} accent={style.accent} />
          </div>
          <div className="min-w-0 flex-1">
            <div className={cn('font-bold truncate', isDark ? 'text-white' : 'text-gray-900')} style={{ fontSize: dims.fontSize, ...labelColor }}>
              {node.label}
            </div>
            <div className={cn('mt-1 line-clamp-2 leading-tight', isDark ? 'text-zinc-500' : 'text-gray-500')} style={{ fontSize: dims.descSize, ...descColor }}>
              {node.description}
            </div>
          </div>
        </div>
      )
    }

    // Subsystem: dashed inner border + icon
    if (node.type === 'subsystem') {
      return (
        <div className="h-full flex items-center px-5 gap-4 relative z-10">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: iconBgSubtle }}>
            <NodeIcon node={node} size={dims.iconSize} accent={style.accent} />
          </div>
          <div className="min-w-0 flex-1">
            <div className={cn('font-bold truncate', isDark ? 'text-white' : 'text-gray-900')} style={{ fontSize: dims.fontSize, ...labelColor }}>
              {node.label}
            </div>
            <div className={cn('mt-1 line-clamp-2 leading-tight', isDark ? 'text-zinc-500' : 'text-gray-500')} style={{ fontSize: dims.descSize, ...descColor }}>
              {node.description}
            </div>
          </div>
        </div>
      )
    }

    // Agent: radial gradient overlay + large icon
    if (node.type === 'agent') {
      return (
        <div className="h-full flex items-center px-5 gap-4 relative">
          <div className="absolute inset-0 pointer-events-none" style={{ borderRadius: dims.radius, background: `radial-gradient(ellipse at 30% 50%, ${style.accent}10, transparent 70%)` }} />
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 relative z-10" style={{ background: iconBg }}>
            <NodeIcon node={node} size={dims.iconSize} accent={style.accent} />
          </div>
          <div className="min-w-0 flex-1 relative z-10">
            <div className={cn('font-bold truncate', isDark ? 'text-white' : 'text-gray-900')} style={{ fontSize: dims.fontSize, ...labelColor }}>
              {node.label}
            </div>
            <div className={cn('mt-1 line-clamp-2 leading-tight', isDark ? 'text-zinc-500' : 'text-gray-500')} style={{ fontSize: dims.descSize, ...descColor }}>
              {node.description}
            </div>
          </div>
        </div>
      )
    }

    // Error-handler: dashed red inner border
    if (node.type === 'error-handler') {
      return (
        <div className="h-full flex items-center px-3.5 gap-3 relative">
          <div className="absolute inset-1.5 rounded-lg border-2 border-dashed pointer-events-none" style={{ borderColor: '#ef444440' }} />
          <div className="rounded-lg flex items-center justify-center shrink-0 relative z-10" style={{ width: dims.iconBoxSize, height: dims.iconBoxSize, background: '#ef444418' }}>
            <NodeIcon node={node} size={dims.iconSize} accent={style.accent} />
          </div>
          <div className="min-w-0 flex-1 relative z-10">
            <div className={cn('font-medium truncate', isDark ? 'text-white' : 'text-gray-900')} style={{ fontSize: dims.fontSize, ...labelColor }}>
              {node.label}
            </div>
            <div className={cn('mt-0.5 line-clamp-2 leading-tight', isDark ? 'text-zinc-500' : 'text-gray-500')} style={{ fontSize: dims.descSize, ...descColor }}>
              {node.description}
            </div>
          </div>
        </div>
      )
    }

    // Approval: icon + label + bold title + approval state indicator
    if (node.type === 'approval') {
      return (
        <div className="h-full flex items-center px-4 gap-3">
          <div className="rounded-xl flex items-center justify-center shrink-0" style={{ width: dims.iconBoxSize, height: dims.iconBoxSize, background: '#f59e0b18' }}>
            <NodeIcon node={node} size={dims.iconSize} accent={style.accent} />
          </div>
          <div className="min-w-0 flex-1">
            <div className={cn('font-bold truncate', isDark ? 'text-white' : 'text-gray-900')} style={{ fontSize: dims.fontSize, ...labelColor }}>
              {node.label}
            </div>
            <div className={cn('mt-0.5 line-clamp-2 leading-tight', isDark ? 'text-zinc-500' : 'text-gray-500')} style={{ fontSize: dims.descSize, ...descColor }}>
              {node.description}
            </div>
          </div>
          {node.approvalState === 'approved' && <CheckCircle2 size={18} className="text-green-500 shrink-0" />}
          {node.approvalState === 'rejected' && <XCircle size={18} className="text-red-500 shrink-0" />}
          {node.approvalState === 'waiting' && executionStatus !== 'completed' && <Hand size={18} className="text-amber-500 shrink-0 animate-pulse" />}
        </div>
      )
    }

    // Fork / Join: centered vertical with round icon
    if (node.type === 'fork' || node.type === 'join') {
      return (
        <div className="h-full flex flex-col items-center justify-center text-center px-2">
          <div className="rounded-full flex items-center justify-center mb-1" style={{ width: dims.iconBoxSize, height: dims.iconBoxSize, background: iconBg }}>
            <NodeIcon node={node} size={dims.iconSize} accent={style.accent} />
          </div>
          <div className={cn('font-medium truncate w-full', isDark ? 'text-white' : 'text-gray-900')} style={{ fontSize: dims.fontSize, ...labelColor }}>
            {node.label}
          </div>
        </div>
      )
    }

    // Condition-Agent: horizontal with sparkle badge + bold + description
    if (node.type === 'condition-agent') {
      return (
        <div className="h-full flex items-center px-4 gap-3 relative">
          <div className="rounded-xl flex items-center justify-center shrink-0 relative" style={{ width: dims.iconBoxSize, height: dims.iconBoxSize, background: iconBg }}>
            <NodeIcon node={node} size={dims.iconSize} accent={style.accent} />
          </div>
          <div className="min-w-0 flex-1">
            <div className={cn('font-bold truncate', isDark ? 'text-white' : 'text-gray-900')} style={{ fontSize: dims.fontSize, ...labelColor }}>
              {node.label}
            </div>
            <div className={cn('mt-0.5 line-clamp-2 leading-tight', isDark ? 'text-zinc-500' : 'text-gray-500')} style={{ fontSize: dims.descSize, ...descColor }}>
              {node.description}
            </div>
          </div>
        </div>
      )
    }

    // ifelse / router / merge: small pills — centered vertical
    if (SMALL_PILL_TYPES.has(node.type)) {
      return (
        <div className="h-full flex flex-col items-center justify-center text-center px-3">
          <div className="rounded-full flex items-center justify-center mb-1" style={{ width: dims.iconBoxSize, height: dims.iconBoxSize, background: iconBg }}>
            <NodeIcon node={node} size={dims.iconSize} accent={style.accent} />
          </div>
          <div className={cn('font-medium truncate w-full', isDark ? 'text-white' : 'text-gray-900')} style={{ fontSize: dims.fontSize, ...labelColor }}>
            {node.label}
          </div>
        </div>
      )
    }

    // Default: trigger, process, wait, iterator, output
    return (
      <div className="h-full flex items-center px-3.5 gap-3">
        <div className="rounded-lg flex items-center justify-center shrink-0" style={{
          width: dims.iconBoxSize, height: dims.iconBoxSize, background: iconBgSubtle,
        }}>
          <NodeIcon node={node} size={dims.iconSize} accent={style.accent} />
        </div>
        <div className="min-w-0 flex-1">
          <div className={cn('font-medium line-clamp-2 leading-tight', isLightText ? 'text-white' : isDark ? 'text-white' : 'text-gray-900')} style={{ fontSize: dims.fontSize }}>
            {node.label}
          </div>
          <div className={cn('mt-0.5 line-clamp-2 leading-tight', isLightText ? 'text-white/70' : isDark ? 'text-zinc-500' : 'text-gray-500')} style={{ fontSize: dims.descSize }}>
            {node.description}
          </div>
        </div>
      </div>
    )
  }

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div
      className={cn(
        themeClass,
        'transition-[box-shadow,border-color,background-color] duration-300',
        (selected || multiSelected) && !readOnly && !isActive && 'ring-2 ring-purple-500 shadow-lg shadow-purple-500/10',
        connecting && 'ring-2 ring-purple-400 ring-dashed',
        isActive && STATUS_RINGS[executionStatus],
        // NodeLab V3 animations
        node.type === 'agent' && executionStatus === 'running' && 'lab-node-agent-thinking',
        node.type === 'approval' && node.approvalState === 'waiting' && executionStatus !== 'completed' && 'lab-node-approval-waiting',
      )}
      style={themeStyle}
      title={node.description ? `${node.label}\n${node.description}` : node.label}
      onMouseDown={(e) => {
        e.stopPropagation()
        onMouseDown(e, node.id)
      }}
      onDoubleClick={() => onDoubleClick(node.id)}
      onMouseEnter={() => onMouseEnter(node.id)}
      onMouseLeave={onMouseLeave}
      onContextMenu={(e) => {
        e.preventDefault()
        e.stopPropagation()
        onContextMenu(e, node.id)
      }}
    >
      {/* Subsystem inner dashed frame — 1:1 NodeLab V3 */}
      {node.type === 'subsystem' && (
        <div className="absolute inset-2.5 rounded-xl border border-dashed pointer-events-none" style={{ borderColor: style.accent + '30' }} />
      )}

      {/* Type badge — top-right */}
      {showTypeBadges && (
        <span
          className={cn(
            'absolute -top-2 -right-2 z-10 border px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-wider rounded-md',
          )}
          style={{
            background: style.bg, borderColor: style.border, color: style.accent,
          }}
        >
          {style.label}
        </span>
      )}

      {/* Content */}
      {renderContent()}

      {/* Resource badge (top-left) — purple paperclip */}
      {node.linkedResourceType && (
        <div
          className="absolute -top-2 -left-2 w-5 h-5 rounded-full bg-purple-100 dark:bg-purple-500/20 border border-purple-300 dark:border-purple-500/30 flex items-center justify-center z-20"
          title={`Ressource: ${node.linkedResourceType}`}
        >
          <Paperclip size={10} className="text-purple-600 dark:text-purple-400" />
        </div>
      )}

      {/* Linked page badge (bottom-left) — blue pill, clickable */}
      {node.linkedPage && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onLinkedPageClick?.(node.linkedPage!)
          }}
          className="absolute -bottom-1.5 -left-1.5 h-5 px-1.5 rounded-full bg-blue-100 dark:bg-blue-500/20 border border-blue-300 dark:border-blue-500/30 flex items-center gap-0.5 z-20 hover:bg-blue-200 dark:hover:bg-blue-500/30 transition-colors cursor-pointer"
          title={`Seite: ${node.linkedPage}`}
        >
          <Globe size={9} className="text-blue-600 dark:text-blue-400" />
          <span className="text-[8px] font-semibold text-blue-600 dark:text-blue-400 max-w-[60px] truncate">
            {node.linkedPage}
          </span>
        </button>
      )}

      {/* Subsystem drill-down button */}
      {node.type === 'subsystem' && node.linkedSubSystemId && onDrillDown && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDrillDown(node.linkedSubSystemId!)
          }}
          className="absolute -bottom-1.5 -right-1.5 h-5 px-2 rounded-full bg-indigo-100 dark:bg-indigo-500/20 border border-indigo-300 dark:border-indigo-500/30 flex items-center gap-0.5 z-20 hover:bg-indigo-200 dark:hover:bg-indigo-500/30 transition-colors cursor-pointer text-[8px] font-semibold text-indigo-600 dark:text-indigo-400"
        >
          Öffnen
        </button>
      )}

      {/* Pinned indicator */}
      {isPinned && (
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-30">
          <Pin size={12} className="text-blue-500" fill="currentColor" />
        </div>
      )}

      {/* Execution data bubble (item count) */}
      {hasExecData && (
        <div
          className="absolute -top-3 -left-2 w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white z-30"
          style={{ background: '#10b981', animation: 'v2-bubble-in 0.3s ease-out forwards' }}
        >
          {executionItems}
        </div>
      )}

      {/* Status overlay icon — bottom-right (1:1 NodeLab V3) */}
      {(isActive && executionStatus !== 'pending') || (executionStatus === 'idle' && hasExecData) ? (
        <div
          className="absolute -bottom-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center z-20 border border-white dark:border-zinc-900 transition-colors duration-300"
          style={{
            background:
              executionStatus === 'completed' ? '#10b981'
              : executionStatus === 'failed' ? '#ef4444'
              : executionStatus === 'running' ? '#a855f7'
              : hasExecData ? '#10b981' : '#a855f7',
            opacity: executionStatus === 'idle' && hasExecData ? 0.7 : 1,
          }}
        >
          {executionStatus === 'running' && <Loader2 size={10} className="text-white animate-spin" />}
          {(executionStatus === 'completed' || (executionStatus === 'idle' && hasExecData)) && <Check size={10} className="text-white" />}
          {executionStatus === 'failed' && <X size={10} className="text-white" />}
        </div>
      ) : null}

      {/* Connection Ports */}
      {showPorts &&
        PORTS.map((port) => (
          <div
            key={port}
            className="absolute z-30"
            style={PORT_POSITIONS[port].style}
          >
            <div
              className={cn(
                'w-5 h-5 rounded-full border flex items-center justify-center cursor-crosshair',
                'bg-white dark:bg-zinc-800 border-gray-300 dark:border-zinc-600',
                'hover:bg-purple-50 dark:hover:bg-purple-500/20 hover:border-purple-400',
                'hover:scale-110 transition-all',
                'text-gray-400 hover:text-purple-500',
                'animate-in fade-in duration-150',
              )}
              onMouseDown={(e) => {
                e.stopPropagation()
                onPortMouseDown(e, node.id, port)
              }}
              onMouseUp={(e) => {
                e.stopPropagation()
                onPortMouseUp(e, node.id, port)
              }}
            >
              <Plus size={10} strokeWidth={2.5} />
            </div>
          </div>
        ))}
    </div>
  )
}

export const CanvasNode = memo(CanvasNodeInner)
