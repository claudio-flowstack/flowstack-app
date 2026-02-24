// ── Research Constants ──

export const API_BASE = '/api/research'

export const SCORE_CATEGORIES = [
  { key: 'firmenform', label: 'Firmenform', max: 20 },
  { key: 'kontaktdaten', label: 'Kontaktdaten', max: 20 },
  { key: 'mitarbeiter', label: 'Mitarbeiter', max: 15 },
  { key: 'bewertung', label: 'Bewertung', max: 15 },
  { key: 'anzahl_bewertungen', label: 'Anz. Bewertungen', max: 10 },
  { key: 'impressum', label: 'Impressum', max: 10 },
  { key: 'online_praesenz', label: 'Online-Praesenz', max: 10 },
  { key: 'personal_contact', label: 'Persoenl. Kontakt', max: 8 },
  { key: 'external_reviews', label: 'Externe Reviews', max: 8 },
  { key: 'content_signals', label: 'Content-Signale', max: 6 },
] as const

export const PRIORITY_COLORS = {
  Hoch: 'success',
  Mittel: 'warning',
  Niedrig: 'danger',
} as const

export const SOCIAL_LABELS: Record<string, string> = {
  linkedin: 'LinkedIn',
  instagram: 'Instagram',
  facebook: 'Facebook',
  youtube: 'YouTube',
  xing: 'XING',
  twitter: 'X/Twitter',
  tiktok: 'TikTok',
}
