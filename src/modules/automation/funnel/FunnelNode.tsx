import { memo } from 'react'
import type { FunnelElement, PortDirection } from '../domain/types'
import { PLATFORM_REGISTRY, NODE_STYLE_CLASSES, NODE_SHADOW_CLASSES } from './constants'
import { cn } from '@/shared/lib/utils'
import { getNodeIcon } from '../canvas/icons'
import { renderNodeIcon } from '../canvas/ToolLogos'

// ── Props ────────────────────────────────────────────────────────────────────

interface FunnelNodeProps {
  element: FunnelElement
  isSelected: boolean
  isMultiSelected: boolean
  nodeStyle?: 'default' | 'rounded' | 'sharp' | 'pill' | 'card'
  nodeShadow?: 'none' | 'sm' | 'md' | 'lg'
  onMouseDown: (e: React.MouseEvent) => void
  onContextMenu: (e: React.MouseEvent) => void
  onPortMouseDown: (port: PortDirection, e: React.MouseEvent) => void
}

// ── Konstanten ───────────────────────────────────────────────────────────────

const PORTS: PortDirection[] = ['top', 'right', 'bottom', 'left']

const PORT_POSITIONS: Record<PortDirection, React.CSSProperties> = {
  top:    { top: 0, left: '50%', transform: 'translate(-50%, -50%)' },
  right:  { top: '50%', right: 0, transform: 'translate(50%, -50%)' },
  bottom: { bottom: 0, left: '50%', transform: 'translate(-50%, 50%)' },
  left:   { top: '50%', left: 0, transform: 'translate(-50%, -50%)' },
}

// ── Plattform-Farbe aus der Registry ermitteln ──────────────────────────────

function getPlatformInfo(element: FunnelElement) {
  if (!element.platformKind) return null
  return PLATFORM_REGISTRY.find((p) => p.kind === element.platformKind) ?? null
}

// ── Icon Renderer (logo-* oder Lucide) ──────────────────────────────────────

function FunnelNodeIcon({ icon, size = 18, color }: { icon: string; size?: number; color: string }) {
  const LucideIcon = getNodeIcon(icon)
  const fallback = LucideIcon
    ? <LucideIcon style={{ color, width: size, height: size }} />
    : <div className="rounded-full" style={{ background: color, width: size, height: size }} />

  return <>{renderNodeIcon(icon, undefined, fallback, size)}</>
}

// ── Komponente ───────────────────────────────────────────────────────────────

function FunnelNodeInner({
  element,
  isSelected,
  isMultiSelected,
  nodeStyle = 'default',
  nodeShadow = 'sm',
  onMouseDown,
  onContextMenu,
  onPortMouseDown,
}: FunnelNodeProps) {
  const platform = getPlatformInfo(element)
  const accentColor = platform?.color ?? '#8b5cf6'
  const iconKey = element.icon ?? platform?.icon ?? 'globe'

  // Stilklassen aus den Registries holen
  const shapeClass = NODE_STYLE_CLASSES[nodeStyle] ?? NODE_STYLE_CLASSES['default']
  const shadowClass = NODE_SHADOW_CLASSES[nodeShadow] ?? ''

  return (
    <div
      className={cn(
        'group absolute select-none bg-white dark:bg-zinc-900 transition-all duration-200',
        shapeClass,
        shadowClass,
        // Selektierungszustand
        isSelected && 'ring-2 ring-primary',
        isMultiSelected && !isSelected && 'ring-2 ring-blue-400',
        // Hover-Effekt
        !isSelected && !isMultiSelected && 'hover:shadow-md',
      )}
      style={{
        left: element.x,
        top: element.y,
        width: element.width,
        height: element.height,
        borderColor: isSelected || isMultiSelected
          ? undefined
          : accentColor + '30',
      }}
      onMouseDown={(e) => {
        e.stopPropagation()
        onMouseDown(e)
      }}
      onContextMenu={(e) => {
        e.preventDefault()
        e.stopPropagation()
        onContextMenu(e)
      }}
    >
      {/* Farbbalken links */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-[inherit]"
        style={{ background: accentColor }}
      />

      {/* Inhalt */}
      <div className="flex items-center gap-3 h-full pl-4 pr-3">
        {/* Icon */}
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
          style={{ background: accentColor + '15' }}
        >
          <FunnelNodeIcon icon={iconKey} size={18} color={accentColor} />
        </div>

        {/* Texte + optionaler Metrik-Badge */}
        <div className="min-w-0 flex-1">
          {/* Label */}
          <p className="text-[13px] font-medium truncate text-gray-900 dark:text-white">
            {element.label || platform?.label || 'Element'}
          </p>

          {/* Beschreibung */}
          {element.description && (
            <p className="text-[10px] mt-0.5 truncate text-gray-500 dark:text-zinc-500">
              {element.description}
            </p>
          )}

          {/* Metrik-Badge */}
          {element.metricLabel && (
            <span
              className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded-full text-[9px] font-semibold"
              style={{
                background: accentColor + '18',
                color: accentColor,
              }}
            >
              {element.metricLabel}
              {element.metricValue != null && (
                <span className="font-bold">{element.metricValue}</span>
              )}
            </span>
          )}
        </div>
      </div>

      {/* Verbindungs-Ports (sichtbar bei Hover) */}
      {PORTS.map((port) => (
        <div
          key={port}
          className="absolute z-30 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
          style={PORT_POSITIONS[port]}
        >
          <div
            className={cn(
              'w-2 h-2 rounded-full cursor-crosshair transition-colors duration-150',
              'bg-border hover:bg-primary',
            )}
            onMouseDown={(e) => {
              e.stopPropagation()
              onPortMouseDown(port, e)
            }}
          />
        </div>
      ))}
    </div>
  )
}

export const FunnelNode = memo(FunnelNodeInner)
