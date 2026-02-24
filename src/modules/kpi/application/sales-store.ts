import { create } from 'zustand'

const API = '/api/sales'

// ── Existing Types ───────────────────────────────────────────────────────────

export interface PipelineStat {
  id: string
  name: string
  total: number
  active: number
  won: number
  lost: number
  win_rate: number
  total_value: number
  won_value: number
  stages: Record<string, number>
  stage_values: Record<string, number>
  stage_order: string[]
}

export interface SalesOverview {
  total_leads: number
  pipelines: PipelineStat[]
  lead_statuses: Record<string, number>
  funnel: {
    total_leads: number
    mit_kontakt: number
    mit_email: number
    mit_telefon: number
    setting_calls: number
    sales_calls: number
    follow_ups: number
    kunden: number
  }
  conversions: {
    lead_to_setting: number
    setting_to_sales: number
    sales_to_followup: number
    sales_to_kunde: number
    overall: number
  }
  strategie: Record<string, number>
  anruf_ergebnis: Record<string, number>
  entscheider: Record<string, number>
  data_quality: {
    total: number
    mit_kontakt: number
    mit_email: number
    mit_telefon: number
    kontakt_rate: number
    email_rate: number
    telefon_rate: number
  }
}

export interface SalesActivity {
  type: 'call' | 'email'
  direction: string
  duration?: number
  disposition?: string
  subject?: string
  note?: string
  lead_id: string
  user_name: string
  created: string
}

// ── New Activity Types ───────────────────────────────────────────────────────

export interface ActivityTargets {
  daily_calls: number
  daily_emails: number
  weekly_meetings: number
  weekly_follow_ups: number
}

export interface ActivitySummary {
  total: number
  calls: number
  emails: number
  outbound_calls: number
  inbound_calls: number
  avg_call_duration: number
  calls_with_contact: number
  contact_rate: number
  appointments_set: number
  call_to_appointment_rate: number
}

export interface UserActivityStats {
  name: string
  calls: number
  emails: number
  total: number
  appointments: number
}

export interface DailyActivity {
  date: string
  calls: number
  emails: number
}

// ── Computation Helpers ──────────────────────────────────────────────────────

const NO_CONTACT_DISPOSITIONS = new Set([
  'Nicht erreicht',
  'Falsche Nummer',
  'Mailbox',
])

function computeActivityStats(activities: SalesActivity[]) {
  const calls = activities.filter((a) => a.type === 'call')
  const emails = activities.filter((a) => a.type === 'email')

  const outbound = calls.filter((a) => a.direction === 'outbound').length
  const inbound = calls.length - outbound

  const totalDuration = calls.reduce((sum, a) => sum + (a.duration ?? 0), 0)
  const avgDuration = calls.length > 0 ? totalDuration / calls.length : 0

  const withContact = calls.filter(
    (a) => a.disposition && !NO_CONTACT_DISPOSITIONS.has(a.disposition),
  ).length
  const contactRate = calls.length > 0 ? (withContact / calls.length) * 100 : 0

  const appointments = calls.filter(
    (a) => a.disposition === 'Termin vereinbart',
  ).length
  const appointmentRate =
    calls.length > 0 ? (appointments / calls.length) * 100 : 0

  const summary: ActivitySummary = {
    total: activities.length,
    calls: calls.length,
    emails: emails.length,
    outbound_calls: outbound,
    inbound_calls: inbound,
    avg_call_duration: avgDuration,
    calls_with_contact: withContact,
    contact_rate: contactRate,
    appointments_set: appointments,
    call_to_appointment_rate: appointmentRate,
  }

  // User stats
  const userMap = new Map<
    string,
    { calls: number; emails: number; appointments: number }
  >()
  for (const a of activities) {
    const name = a.user_name || 'Unbekannt'
    const entry = userMap.get(name) ?? { calls: 0, emails: 0, appointments: 0 }
    if (a.type === 'call') {
      entry.calls++
      if (a.disposition === 'Termin vereinbart') entry.appointments++
    } else {
      entry.emails++
    }
    userMap.set(name, entry)
  }
  const userStats: UserActivityStats[] = Array.from(userMap.entries())
    .map(([name, stats]) => ({
      name,
      calls: stats.calls,
      emails: stats.emails,
      total: stats.calls + stats.emails,
      appointments: stats.appointments,
    }))
    .sort((a, b) => b.total - a.total)

  // Daily trend
  const dayMap = new Map<string, { calls: number; emails: number }>()
  for (const a of activities) {
    const date = a.created.slice(0, 10)
    const entry = dayMap.get(date) ?? { calls: 0, emails: 0 }
    if (a.type === 'call') entry.calls++
    else entry.emails++
    dayMap.set(date, entry)
  }
  const dailyTrend: DailyActivity[] = Array.from(dayMap.entries())
    .map(([date, stats]) => ({ date, ...stats }))
    .sort((a, b) => a.date.localeCompare(b.date))

  return { summary, userStats, dailyTrend }
}

// ── Store ────────────────────────────────────────────────────────────────────

interface SalesStore {
  overview: SalesOverview | null
  activities: SalesActivity[]
  loading: boolean
  error: string | null
  lastRefresh: number | null

  targets: ActivityTargets
  activitySummary: ActivitySummary | null
  userStats: UserActivityStats[]
  dailyTrend: DailyActivity[]

  fetchOverview: () => Promise<void>
  fetchActivities: () => Promise<void>
  refresh: () => Promise<void>
}

export const useSalesStore = create<SalesStore>((set, get) => ({
  overview: null,
  activities: [],
  loading: false,
  error: null,
  lastRefresh: null,

  targets: {
    daily_calls: 80,
    daily_emails: 30,
    weekly_meetings: 15,
    weekly_follow_ups: 20,
  },
  activitySummary: null,
  userStats: [],
  dailyTrend: [],

  fetchOverview: async () => {
    set({ loading: true, error: null })
    try {
      const resp = await fetch(`${API}/overview`)
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
      const data: SalesOverview = await resp.json()
      set({ overview: data, loading: false, lastRefresh: Date.now() })
    } catch (e) {
      set({ error: (e as Error).message, loading: false })
    }
  },

  fetchActivities: async () => {
    try {
      const resp = await fetch(`${API}/activities?limit=50`)
      if (!resp.ok) return
      const data = await resp.json()
      const activities: SalesActivity[] = data.activities ?? []
      const { summary, userStats, dailyTrend } =
        computeActivityStats(activities)
      set({
        activities,
        activitySummary: summary,
        userStats,
        dailyTrend,
      })
    } catch {
      // silent
    }
  },

  refresh: async () => {
    await fetch(`${API}/refresh`, { method: 'POST' }).catch(() => {})
    const { fetchOverview, fetchActivities } = get()
    await Promise.all([fetchOverview(), fetchActivities()])
  },
}))
