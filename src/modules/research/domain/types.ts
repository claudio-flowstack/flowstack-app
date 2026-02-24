// ── Research Domain Types ──

export interface EnrichedLead {
  firma: string
  website: string
  website_found: boolean
  website_method: string
  website_erreichbar: boolean
  impressum_url: string
  geschaeftsfuehrer: string
  gf_email: string
  gf_email_status: 'verified' | 'guessed' | 'invalid_name' | ''
  emails: string[]
  alle_emails: string[]
  telefone: string[]
  mobilnummer: string
  adresse: string
  handelsregister: string
  social_media: Record<string, string>
  technologie: string
  hat_blog: boolean
  hat_karriereseite: boolean
  meta_description: string
  mitarbeiter_schaetzung: string
  trustpilot: { score?: string; num_reviews?: string; url?: string } | null
  kununu: { rating?: string; company_size?: string; url?: string } | null
  score: number
  prioritaet: 'Hoch' | 'Mittel' | 'Niedrig'
  score_breakdown: ScoreBreakdown
  // Added by frontend
  id?: string
  researched_at?: string
}

export interface ScoreBreakdown {
  firmenform: number
  bewertung: number
  anzahl_bewertungen: number
  kontaktdaten: number
  impressum: number
  mitarbeiter: number
  online_praesenz: number
  content_signals: number
  personal_contact: number
  external_reviews: number
}

export interface WebsiteResult {
  website: string
  method: string
  verified: boolean
}

export interface EmailResult {
  gf_name: string
  email: string
  status: 'verified' | 'guessed' | 'invalid_name' | 'error'
  candidates_checked: number
}

export interface BatchProgress {
  current: number
  total: number
  firma: string
  gf_found: number
  emails_found: number
  websites_found: number
  rate: number
  eta_seconds: number
  has_gf: boolean
  has_email: boolean
  score: number
}

export interface BatchJob {
  job_id: string
  status: 'running' | 'complete' | 'error'
  total: number
  current: number
  gf_found: number
  emails_found: number
  websites_found: number
  duration_seconds?: number
  started_at: string
}

export interface ColumnMapping {
  firma: string
  website: string
  stadt: string
  name: string
}
