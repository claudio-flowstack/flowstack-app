import { memo, useMemo } from 'react'
import type { FunnelConnection as FunnelConnectionType, FunnelElement } from '../domain/types'
import { cn } from '@/shared/lib/utils'
import {
  getFunnelConnectionPath,
  getStraightPath,
  getStepPath,
  getFunnelPathMidpoint,
} from './helpers'

// ── Props ────────────────────────────────────────────────────────────────────

interface FunnelConnectionProps {
  connection: FunnelConnectionType
  fromElement: FunnelElement
  toElement: FunnelElement
  isSelected: boolean
  curveStyle?: 'bezier' | 'straight' | 'step'
  color?: string
  thickness?: 'thin' | 'normal' | 'thick'
  animation?: 'dot' | 'none' | 'pulse'
  arrowhead?: 'filled' | 'open' | 'none'
  onClick: (e: React.MouseEvent) => void
  onContextMenu: (e: React.MouseEvent) => void
}

// ── Strichstärke-Map ────────────────────────────────────────────────────────

const THICKNESS_MAP: Record<string, number> = {
  thin:   1.5,
  normal: 2,
  thick:  3,
}

// ── Linienstil (dasharray) ───────────────────────────────────────────────────

const LINE_DASH: Record<string, string | undefined> = {
  solid:  undefined,
  dashed: '8,4',
  dotted: '2,4',
}

// ── Pfad anhand des curveStyle berechnen ─────────────────────────────────────

function computePath(
  from: FunnelElement,
  to: FunnelElement,
  fromPort: FunnelConnectionType['fromPort'],
  toPort: FunnelConnectionType['toPort'],
  style: 'bezier' | 'straight' | 'step',
): string {
  switch (style) {
    case 'straight':
      return getStraightPath(from, fromPort, to, toPort)
    case 'step':
      return getStepPath(from, fromPort, to, toPort)
    default:
      return getFunnelConnectionPath(from, fromPort, to, toPort)
  }
}

// ── Komponente ───────────────────────────────────────────────────────────────

function FunnelConnectionInner({
  connection,
  fromElement,
  toElement,
  isSelected,
  curveStyle = 'bezier',
  color,
  thickness = 'normal',
  animation = 'dot',
  arrowhead = 'filled',
  onClick,
  onContextMenu,
}: FunnelConnectionProps) {
  // Farbe: Prop > Connection > Fallback
  const strokeColor = color ?? connection.color ?? '#a855f7'
  const strokeWidth = THICKNESS_MAP[thickness] ?? 2
  const dashArray = LINE_DASH[connection.lineStyle ?? 'solid']
  const markerId = `funnel-arrow-${connection.id}`

  // SVG-Pfad berechnen
  const pathD = useMemo(
    () => computePath(fromElement, toElement, connection.fromPort, connection.toPort, curveStyle),
    [fromElement, toElement, connection.fromPort, connection.toPort, curveStyle],
  )

  // Mittelpunkt fuer Label berechnen
  const midpoint = useMemo(
    () => getFunnelPathMidpoint(fromElement, connection.fromPort, toElement, connection.toPort, curveStyle),
    [fromElement, toElement, connection.fromPort, connection.toPort, curveStyle],
  )

  // Selektierter Zustand: breiterer Strich + Glow
  const activeWidth = isSelected ? strokeWidth + 1.5 : strokeWidth

  return (
    <g
      style={{ pointerEvents: 'stroke' }}
      onClick={(e) => {
        e.stopPropagation()
        onClick(e)
      }}
      onContextMenu={(e) => {
        e.preventDefault()
        e.stopPropagation()
        onContextMenu(e)
      }}
    >
      {/* Pfeilspitzen-Marker */}
      <defs>
        {arrowhead !== 'none' && (
          <marker
            id={markerId}
            markerWidth="8"
            markerHeight="6"
            refX="7"
            refY="3"
            orient="auto"
            markerUnits="strokeWidth"
          >
            {arrowhead === 'filled' ? (
              <path d="M 0 0 L 8 3 L 0 6 Z" fill={strokeColor} />
            ) : (
              <path d="M 0 0 L 8 3 L 0 6" fill="none" stroke={strokeColor} strokeWidth="1" />
            )}
          </marker>
        )}
      </defs>

      {/* Unsichtbarer breiter Klickbereich */}
      <path
        d={pathD}
        stroke="transparent"
        strokeWidth={12}
        fill="none"
        style={{ cursor: 'pointer', pointerEvents: 'stroke' }}
      />

      {/* Glow-Effekt bei Selektion */}
      {isSelected && (
        <path
          d={pathD}
          stroke={strokeColor}
          strokeWidth={activeWidth * 3}
          fill="none"
          opacity={0.15}
          strokeLinecap="round"
        />
      )}

      {/* Hauptpfad */}
      <path
        d={pathD}
        stroke={strokeColor}
        strokeWidth={activeWidth}
        strokeDasharray={dashArray}
        fill="none"
        strokeLinecap="round"
        markerEnd={arrowhead !== 'none' ? `url(#${markerId})` : undefined}
        className={cn(
          'transition-[stroke-width,opacity] duration-200',
          animation === 'pulse' && 'animate-pulse',
        )}
      />

      {/* Animierter Punkt entlang des Pfads */}
      {animation === 'dot' && (
        <circle r={3} fill={strokeColor} opacity={0.7}>
          <animateMotion
            dur="2.5s"
            repeatCount="indefinite"
            path={pathD}
          />
        </circle>
      )}

      {/* Label am Mittelpunkt */}
      {connection.label && (
        <foreignObject
          x={midpoint.x - 40}
          y={midpoint.y - 12}
          width={80}
          height={24}
          style={{ pointerEvents: 'none', overflow: 'visible' }}
        >
          <div className="flex items-center justify-center h-full">
            <span
              className={cn(
                'px-2 py-0.5 rounded-full text-[10px] font-medium leading-none',
                'bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700',
                'text-gray-600 dark:text-zinc-400 shadow-sm',
                'whitespace-nowrap',
              )}
            >
              {connection.label}
            </span>
          </div>
        </foreignObject>
      )}
    </g>
  )
}

export const FunnelConnection = memo(FunnelConnectionInner)
