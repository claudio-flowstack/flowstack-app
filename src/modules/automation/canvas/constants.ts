import type { NodeType, PortDirection, StickyNoteColor } from '../domain/types'

// ── Node Dimensions ─────────────────────────────────────────────────────────

export const NODE_W = 230
export const NODE_H = 92

// ── Per-Type Node Dimensions (V1 / NodeLab exact values) ────────────────────

export const NODE_TYPE_DIMENSIONS: Record<NodeType, {
  w: number; h: number; radius: string
  iconSize: number; fontSize: number; descSize: number; iconBoxSize: number
}> = {
  trigger:          { w: 250, h: 72,  radius: '20px 12px 12px 20px', iconSize: 16, fontSize: 12, descSize: 10, iconBoxSize: 32 },
  process:          { w: 320, h: 82,  radius: '12px',                iconSize: 18, fontSize: 13, descSize: 10, iconBoxSize: 36 },
  ai:               { w: 300, h: 120, radius: '18px',                iconSize: 28, fontSize: 15, descSize: 11, iconBoxSize: 56 },
  output:           { w: 250, h: 72,  radius: '12px 20px 20px 12px', iconSize: 16, fontSize: 12, descSize: 10, iconBoxSize: 32 },
  subsystem:        { w: 320, h: 130, radius: '18px',                iconSize: 24, fontSize: 15, descSize: 10, iconBoxSize: 48 },
  ifelse:           { w: 180, h: 80,  radius: '40px',                iconSize: 20, fontSize: 12, descSize: 10, iconBoxSize: 28 },
  merge:            { w: 140, h: 60,  radius: '30px',                iconSize: 16, fontSize: 11, descSize: 9,  iconBoxSize: 28 },
  wait:             { w: 180, h: 72,  radius: '12px',                iconSize: 16, fontSize: 12, descSize: 10, iconBoxSize: 32 },
  iterator:         { w: 220, h: 82,  radius: '14px',                iconSize: 18, fontSize: 12, descSize: 10, iconBoxSize: 36 },
  router:           { w: 160, h: 80,  radius: '40px',                iconSize: 18, fontSize: 12, descSize: 10, iconBoxSize: 28 },
  'error-handler':  { w: 200, h: 80,  radius: '12px',                iconSize: 18, fontSize: 12, descSize: 10, iconBoxSize: 36 },
  approval:         { w: 300, h: 100, radius: '16px',                iconSize: 22, fontSize: 13, descSize: 10, iconBoxSize: 42 },
  agent:            { w: 320, h: 130, radius: '18px',                iconSize: 28, fontSize: 15, descSize: 11, iconBoxSize: 56 },
  fork:             { w: 120, h: 80,  radius: '40px',                iconSize: 22, fontSize: 11, descSize: 9,  iconBoxSize: 32 },
  join:             { w: 120, h: 80,  radius: '40px',                iconSize: 22, fontSize: 11, descSize: 9,  iconBoxSize: 32 },
  'condition-agent':{ w: 240, h: 100, radius: '40px',                iconSize: 22, fontSize: 13, descSize: 10, iconBoxSize: 40 },
}

export function nodeW(type: NodeType): number { return NODE_TYPE_DIMENSIONS[type].w }
export function nodeH(type: NodeType): number { return NODE_TYPE_DIMENSIONS[type].h }

export const SNAP_THRESHOLD = 8
export const PAN_DRAG_THRESHOLD = 4
export const MAX_LABEL_LENGTH = 40
export const MAX_DESC_LENGTH = 120
export const MAX_GROUP_W = 3000
export const MAX_GROUP_H = 2000

// ── Port Direction Vectors ──────────────────────────────────────────────────

export const PORT_DIR: Record<PortDirection, [number, number]> = {
  top: [0, -1],
  right: [1, 0],
  bottom: [0, 1],
  left: [-1, 0],
}

// ── Node Visual Styles ──────────────────────────────────────────────────────

export const NODE_STYLES: Record<
  NodeType,
  { bg: string; border: string; accent: string; label: string }
> = {
  trigger:          { bg: 'rgba(59,130,246,0.07)',  border: 'rgba(59,130,246,0.18)',  accent: '#3b82f6', label: 'Trigger' },
  process:          { bg: 'rgba(139,92,246,0.07)',  border: 'rgba(139,92,246,0.18)',  accent: '#8b5cf6', label: 'Prozess' },
  ai:               { bg: 'rgba(217,70,239,0.07)',  border: 'rgba(217,70,239,0.18)',  accent: '#d946ef', label: 'KI' },
  output:           { bg: 'rgba(16,185,129,0.07)',  border: 'rgba(16,185,129,0.18)',  accent: '#10b981', label: 'Output' },
  subsystem:        { bg: 'rgba(99,102,241,0.07)',  border: 'rgba(99,102,241,0.22)',  accent: '#6366f1', label: 'Sub-System' },
  ifelse:           { bg: 'rgba(245,158,11,0.07)',  border: 'rgba(245,158,11,0.18)',  accent: '#f59e0b', label: 'Wenn/Dann' },
  merge:            { bg: 'rgba(20,184,166,0.07)',  border: 'rgba(20,184,166,0.18)',  accent: '#14b8a6', label: 'Merge' },
  wait:             { bg: 'rgba(107,114,128,0.07)', border: 'rgba(107,114,128,0.18)', accent: '#6b7280', label: 'Warten' },
  iterator:         { bg: 'rgba(168,85,247,0.07)',  border: 'rgba(168,85,247,0.18)',  accent: '#a855f7', label: 'Iterator' },
  router:           { bg: 'rgba(236,72,153,0.07)',  border: 'rgba(236,72,153,0.18)',  accent: '#ec4899', label: 'Router' },
  'error-handler':  { bg: 'rgba(239,68,68,0.07)',   border: 'rgba(239,68,68,0.22)',   accent: '#ef4444', label: 'Error Handler' },
  approval:         { bg: 'rgba(245,158,11,0.07)',  border: 'rgba(245,158,11,0.22)',  accent: '#f59e0b', label: 'Freigabe' },
  agent:            { bg: 'rgba(124,58,237,0.07)',  border: 'rgba(124,58,237,0.22)',  accent: '#7c3aed', label: 'KI-Agent' },
  fork:             { bg: 'rgba(14,165,233,0.07)',  border: 'rgba(14,165,233,0.18)',  accent: '#0ea5e9', label: 'Fork' },
  join:             { bg: 'rgba(14,165,233,0.07)',  border: 'rgba(14,165,233,0.18)',  accent: '#0ea5e9', label: 'Join' },
  'condition-agent':{ bg: 'rgba(168,85,247,0.07)',  border: 'rgba(168,85,247,0.22)',  accent: '#a855f7', label: 'KI-Bedingung' },
}

// ── Sticky Note Colors ──────────────────────────────────────────────────────

export const STICKY_COLORS: Record<
  StickyNoteColor,
  { bg: string; border: string; text: string; shadow: string }
> = {
  yellow: { bg: 'rgba(250,204,21,0.35)', border: 'rgba(202,138,4,0.6)', text: '#854d0e', shadow: 'rgba(250,204,21,0.25)' },
  orange: { bg: 'rgba(249,115,22,0.30)', border: 'rgba(234,88,12,0.55)', text: '#9a3412', shadow: 'rgba(249,115,22,0.2)' },
  pink: { bg: 'rgba(236,72,153,0.28)', border: 'rgba(219,39,119,0.55)', text: '#9d174d', shadow: 'rgba(236,72,153,0.2)' },
  red: { bg: 'rgba(239,68,68,0.28)', border: 'rgba(220,38,38,0.55)', text: '#991b1b', shadow: 'rgba(239,68,68,0.2)' },
  purple: { bg: 'rgba(139,92,246,0.28)', border: 'rgba(124,58,237,0.55)', text: '#5b21b6', shadow: 'rgba(139,92,246,0.2)' },
  blue: { bg: 'rgba(59,130,246,0.28)', border: 'rgba(37,99,235,0.55)', text: '#1e40af', shadow: 'rgba(59,130,246,0.2)' },
  green: { bg: 'rgba(34,197,94,0.28)', border: 'rgba(22,163,74,0.55)', text: '#166534', shadow: 'rgba(34,197,94,0.2)' },
  gray: { bg: 'rgba(107,114,128,0.20)', border: 'rgba(75,85,99,0.45)', text: '#374151', shadow: 'rgba(107,114,128,0.15)' },
}

// ── Connection Color Themes ─────────────────────────────────────────────────

export const CONN_COLORS: Record<
  string,
  { default: string; hover: string; selected: string; dot: string }
> = {
  purple: { default: 'rgba(139,92,246,0.5)', hover: 'rgba(168,85,247,0.8)', selected: '#a855f7', dot: '#a855f7' },
  blue: { default: 'rgba(59,130,246,0.5)', hover: 'rgba(96,165,250,0.8)', selected: '#3b82f6', dot: '#3b82f6' },
  mono: { default: 'rgba(156,163,175,0.5)', hover: 'rgba(107,114,128,0.8)', selected: '#6b7280', dot: '#9ca3af' },
  neon: { default: 'rgba(34,211,238,0.5)', hover: 'rgba(6,182,212,0.8)', selected: '#06b6d4', dot: '#22d3ee' },
  pastel: { default: 'rgba(196,181,253,0.5)', hover: 'rgba(167,139,250,0.8)', selected: '#a78bfa', dot: '#c4b5fd' },
  emerald: { default: 'rgba(16,185,129,0.5)', hover: 'rgba(52,211,153,0.8)', selected: '#10b981', dot: '#34d399' },
  sunset: { default: 'rgba(249,115,22,0.5)', hover: 'rgba(251,146,60,0.8)', selected: '#f97316', dot: '#fb923c' },
  rose: { default: 'rgba(244,63,94,0.5)', hover: 'rgba(251,113,133,0.8)', selected: '#f43f5e', dot: '#fb7185' },
}

export const STROKE_DASH: Record<string, string | undefined> = {
  solid: undefined,
  dashed: '8,4',
  dotted: '2,4',
}

// ── Lucide Icon Map ─────────────────────────────────────────────────────────

export const ICON_NAMES = [
  'zap', 'users', 'file-text', 'globe', 'mail', 'target',
  'bar-chart', 'database', 'sparkles', 'search', 'image',
  'folder-open', 'send', 'trending-up', 'eye', 'play',
  'mic', 'type', 'clipboard', 'activity', 'bot', 'brain',
  'workflow', 'filter', 'timer', 'shield-check', 'bell',
  'layout-dashboard', 'webhook', 'split', 'repeat', 'file-search',
  'message-square', 'gauge', 'lock', 'cpu', 'layers', 'settings',
] as const
