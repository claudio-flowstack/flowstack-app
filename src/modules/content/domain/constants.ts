import type {
  ContentPlatform,
  ContentStatus,
  ContentPriority,
  ContentQuality,
  FileCategory,
} from './types'

// ── Platform Config ─────────────────────────────────────────────────────────

export const PLATFORM_CONFIG: Record<
  ContentPlatform,
  { label: string; icon: string; color: string; bgColor: string }
> = {
  youtube: {
    label: 'YouTube',
    icon: 'youtube',
    color: '#ef4444',
    bgColor: 'rgba(239,68,68,0.1)',
  },
  instagram: {
    label: 'Instagram',
    icon: 'instagram',
    color: '#d946ef',
    bgColor: 'rgba(217,70,239,0.1)',
  },
  'facebook-linkedin': {
    label: 'Facebook & LinkedIn',
    icon: 'linkedin',
    color: '#3b82f6',
    bgColor: 'rgba(59,130,246,0.1)',
  },
}

// ── Status Config ───────────────────────────────────────────────────────────

export const STATUS_CONFIG: Record<
  ContentStatus,
  { label: string; color: string; bgColor: string; order: number }
> = {
  idea: { label: 'Idee', color: '#8b5cf6', bgColor: 'rgba(139,92,246,0.1)', order: 0 },
  draft: { label: 'Entwurf', color: '#f59e0b', bgColor: 'rgba(245,158,11,0.1)', order: 1 },
  ready: { label: 'Bereit', color: '#3b82f6', bgColor: 'rgba(59,130,246,0.1)', order: 2 },
  scheduled: { label: 'Geplant', color: '#06b6d4', bgColor: 'rgba(6,182,212,0.1)', order: 3 },
  live: { label: 'Live', color: '#10b981', bgColor: 'rgba(16,185,129,0.1)', order: 4 },
  archived: { label: 'Archiviert', color: '#6b7280', bgColor: 'rgba(107,114,128,0.1)', order: 5 },
}

export const STATUS_ORDER: ContentStatus[] = [
  'idea', 'draft', 'ready', 'scheduled', 'live', 'archived',
]

// ── Priority Config ─────────────────────────────────────────────────────────

export const PRIORITY_CONFIG: Record<
  ContentPriority,
  { label: string; color: string; bgColor: string; dot: string }
> = {
  high: { label: 'Hoch', color: '#ef4444', bgColor: 'rgba(239,68,68,0.1)', dot: '🔴' },
  medium: { label: 'Mittel', color: '#f59e0b', bgColor: 'rgba(245,158,11,0.1)', dot: '🟡' },
  low: { label: 'Niedrig', color: '#10b981', bgColor: 'rgba(16,185,129,0.1)', dot: '🟢' },
}

// ── Quality Config ──────────────────────────────────────────────────────────

export const QUALITY_CONFIG: Record<
  ContentQuality,
  { label: string; emoji: string }
> = {
  good: { label: 'Gut', emoji: '👍' },
  neutral: { label: 'Neutral', emoji: '🤔' },
  bad: { label: 'Schlecht', emoji: '👎' },
}

// ── File Category Config ────────────────────────────────────────────────────

export const FILE_CATEGORY_CONFIG: Record<
  FileCategory,
  { label: string; color: string }
> = {
  marketing: { label: 'Marketing', color: '#8b5cf6' },
  dev: { label: 'Development', color: '#3b82f6' },
  sales: { label: 'Sales', color: '#10b981' },
  content: { label: 'Content', color: '#f59e0b' },
  operations: { label: 'Operations', color: '#06b6d4' },
  other: { label: 'Sonstiges', color: '#6b7280' },
}

// ── Content Tabs ────────────────────────────────────────────────────────────

export const CONTENT_TABS = [
  { id: 'overview', label: 'Übersicht' },
  { id: 'ideas', label: 'Ideen' },
  { id: 'youtube', label: 'YouTube' },
  { id: 'instagram', label: 'Instagram' },
  { id: 'facebook-linkedin', label: 'FB & LinkedIn' },
  { id: 'pipeline', label: 'Pipeline' },
  { id: 'calendar', label: 'Kalender' },
  { id: 'files', label: 'Dateien' },
  { id: 'planning', label: 'Planung' },
] as const

export type ContentTabId = (typeof CONTENT_TABS)[number]['id']
