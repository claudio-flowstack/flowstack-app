import { useState } from 'react'
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { Phone, Mail, CalendarCheck, PhoneOutgoing, Filter, Users2 } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import type {
  SalesActivity,
  ActivitySummary,
  ActivityTargets,
  UserActivityStats,
  DailyActivity,
} from '../application/sales-store'

interface Props {
  activities: SalesActivity[]
  summary: ActivitySummary | null
  targets: ActivityTargets
  userStats: UserActivityStats[]
  dailyTrend: DailyActivity[]
}

const TOOLTIP_STYLE = {
  background: 'var(--card)',
  border: '1px solid var(--border)',
  borderRadius: '0.5rem',
  color: 'var(--foreground)',
  fontSize: '12px',
}

const DISP_COLORS: Record<string, string> = {
  'Termin vereinbart': '#22c55e',
  'Interesse': '#6366f1',
  'Kein Interesse': '#f59e0b',
  'Nicht erreicht': '#64748b',
  'Falsche Nummer': '#ef4444',
  'Mailbox': '#3b82f6',
}

const FALLBACK_PALETTE = ['#6366f1', '#3b82f6', '#f59e0b', '#22c55e', '#ef4444', '#8b5cf6']

type FilterType = 'all' | 'call' | 'email'

export function SalesActivityHub({ activities, summary, targets, userStats, dailyTrend }: Props) {
  const [feedFilter, setFeedFilter] = useState<FilterType>('all')

  const s = summary ?? {
    total: 0, calls: 0, emails: 0, outbound_calls: 0, inbound_calls: 0,
    avg_call_duration: 0, calls_with_contact: 0, contact_rate: 0,
    appointments_set: 0, call_to_appointment_rate: 0,
  }

  // Disposition breakdown
  const dispositions: Record<string, number> = {}
  for (const a of activities) {
    if (a.type === 'call' && a.disposition) {
      dispositions[a.disposition] = (dispositions[a.disposition] ?? 0) + 1
    }
  }
  const dispData = Object.entries(dispositions)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value }))

  // Filtered feed
  const feedActivities = feedFilter === 'all'
    ? activities
    : activities.filter(a => a.type === feedFilter)

  return (
    <div className="space-y-6">
      {/* ── Hero KPI Cards with Target Progress ────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <TargetCard
          label="Anrufe heute"
          value={s.calls}
          target={targets.daily_calls}
          icon={Phone}
          color="#8b5cf6"
          sub={`${s.outbound_calls} ausgehend · ${s.inbound_calls} eingehend`}
        />
        <TargetCard
          label="Emails heute"
          value={s.emails}
          target={targets.daily_emails}
          icon={Mail}
          color="#3b82f6"
        />
        <TargetCard
          label="Termine gesetzt"
          value={s.appointments_set}
          target={Math.round(targets.weekly_meetings / 5)}
          icon={CalendarCheck}
          color="#22c55e"
          sub={`${s.call_to_appointment_rate.toFixed(1)}% der Anrufe`}
        />
        <TargetCard
          label="Kontaktrate"
          value={Math.round(s.contact_rate)}
          target={40}
          icon={Users2}
          color="#f59e0b"
          isPercent
          sub={`${s.calls_with_contact} von ${s.calls} erreicht`}
        />
      </div>

      {/* ── Trend Chart + Leaderboard ──────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Activity Trend (7 days) */}
        <div className="rounded-xl border border-border bg-card p-4 lg:p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Aktivitäten-Trend</h3>
          {dailyTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={dailyTrend} margin={{ left: 0, right: 8, top: 4, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradCalls" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradEmails" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
                  tickFormatter={(d: string) => d.slice(5)}
                />
                <YAxis tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Area type="monotone" dataKey="calls" stroke="#8b5cf6" fill="url(#gradCalls)" strokeWidth={2} name="Anrufe" />
                <Area type="monotone" dataKey="emails" stroke="#3b82f6" fill="url(#gradEmails)" strokeWidth={2} name="Emails" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">
              Noch keine Trend-Daten
            </div>
          )}
          <div className="flex items-center gap-4 pt-3 border-t border-border mt-2">
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-violet-500" /> Anrufe
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-blue-500" /> Emails
            </div>
          </div>
        </div>

        {/* Leaderboard */}
        <div className="rounded-xl border border-border bg-card p-4 lg:p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Team-Leaderboard</h3>
          {userStats.length > 0 ? (
            <div className="space-y-3">
              {userStats.slice(0, 8).map((user, idx) => {
                const maxTotal = Math.max(...userStats.map(u => u.total), 1)
                const pct = Math.max((user.total / maxTotal) * 100, 4)
                return (
                  <div key={user.name} className="flex items-center gap-3">
                    <span className={cn(
                      'text-[11px] font-bold w-5 text-center shrink-0',
                      idx === 0 ? 'text-amber-500' : idx === 1 ? 'text-muted-foreground/70' : idx === 2 ? 'text-orange-400' : 'text-muted-foreground/40',
                    )}>
                      {idx + 1}
                    </span>
                    <span className="text-xs text-muted-foreground w-24 text-right truncate shrink-0">{user.name}</span>
                    <div className="flex-1 h-6 rounded bg-muted/30 overflow-hidden flex">
                      <div
                        className="h-full transition-all duration-500"
                        style={{ width: `${(user.calls / user.total) * pct}%`, backgroundColor: '#8b5cf6', opacity: 0.7 }}
                      />
                      <div
                        className="h-full transition-all duration-500"
                        style={{ width: `${(user.emails / user.total) * pct}%`, backgroundColor: '#3b82f6', opacity: 0.7 }}
                      />
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {user.appointments > 0 && (
                        <span className="text-[10px] font-medium text-emerald-500 bg-emerald-500/10 rounded-full px-1.5 py-0.5">
                          {user.appointments} Termine
                        </span>
                      )}
                      <span className="text-[11px] text-muted-foreground w-8 text-right font-mono">{user.total}</span>
                    </div>
                  </div>
                )
              })}
              <div className="flex items-center gap-4 pt-2 border-t border-border">
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <span className="h-2 w-2 rounded-full bg-violet-500" /> Anrufe
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <span className="h-2 w-2 rounded-full bg-blue-500" /> Emails
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">Keine Aktivitäten</p>
          )}
        </div>
      </div>

      {/* ── Disposition Chart + Activity Feed ──────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Call Dispositions */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Anruf-Ergebnisse</h3>
          {dispData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={dispData} layout="vertical" margin={{ left: 0, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                <XAxis type="number" tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} />
                <YAxis dataKey="name" type="category" width={120} tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={18} name="Anzahl">
                  {dispData.map((entry, i) => (
                    <rect key={entry.name} fill={DISP_COLORS[entry.name] ?? FALLBACK_PALETTE[i % FALLBACK_PALETTE.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">Keine Anruf-Daten</p>
          )}
        </div>

        {/* Activity Feed */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="px-5 py-3 border-b border-border flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Aktivitäts-Feed</h3>
            <div className="flex items-center gap-1">
              <Filter className="h-3.5 w-3.5 text-muted-foreground mr-1" />
              {(['all', 'call', 'email'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFeedFilter(f)}
                  className={cn(
                    'px-2.5 py-1 text-[11px] rounded-md font-medium transition-colors',
                    feedFilter === f
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
                  )}
                >
                  {f === 'all' ? 'Alle' : f === 'call' ? 'Anrufe' : 'Emails'}
                </button>
              ))}
            </div>
          </div>
          <div className="divide-y divide-border max-h-[300px] overflow-y-auto">
            {feedActivities.length === 0 ? (
              <p className="p-6 text-center text-sm text-muted-foreground">Keine Aktivitäten</p>
            ) : (
              feedActivities.slice(0, 10).map((a, i) => <ActivityItem key={i} activity={a} />)
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Target KPI Card ──────────────────────────────────────────────────────────

function TargetCard({ label, value, target, icon: Icon, color, sub, isPercent }: {
  label: string
  value: number
  target: number
  icon: typeof Phone
  color: string
  sub?: string
  isPercent?: boolean
}) {
  const pct = target > 0 ? Math.min((value / target) * 100, 100) : 0
  const barColor = pct >= 80 ? '#22c55e' : pct >= 50 ? '#f59e0b' : '#ef4444'

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
        <div className="rounded-lg p-1.5" style={{ background: `${color}18`, color }}>
          <Icon className="h-3.5 w-3.5" />
        </div>
      </div>
      <div className="flex items-baseline gap-2">
        <p className="text-2xl font-bold text-foreground">
          {value.toLocaleString('de-DE')}{isPercent ? '%' : ''}
        </p>
        <span className="text-[11px] text-muted-foreground">
          / {target}{isPercent ? '%' : ''}
        </span>
      </div>
      {/* Progress bar */}
      <div className="mt-2 h-1.5 rounded-full bg-muted/50 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${pct}%`, backgroundColor: barColor }}
        />
      </div>
      {sub && <p className="text-[11px] text-muted-foreground mt-2">{sub}</p>}
    </div>
  )
}

// ── Activity Item ────────────────────────────────────────────────────────────

function ActivityItem({ activity }: { activity: SalesActivity }) {
  const isCall = activity.type === 'call'
  const Icon = isCall ? PhoneOutgoing : Mail

  const label = isCall
    ? `${activity.direction === 'outbound' ? 'Ausgehender' : 'Eingehender'} Anruf${activity.disposition ? ` — ${activity.disposition}` : ''}`
    : `Email${activity.subject ? `: ${activity.subject}` : ''}`

  const time = activity.created ? relativeTime(activity.created) : ''

  return (
    <div className="flex items-start gap-3 px-5 py-3 hover:bg-muted/30 transition-colors">
      <div className={cn(
        'mt-0.5 rounded-lg p-1.5',
        isCall ? 'bg-violet-500/10 text-violet-500' : 'bg-blue-500/10 text-blue-500',
      )}>
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground truncate">{label}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          {activity.user_name}
          {isCall && activity.duration ? ` — ${Math.floor(activity.duration / 60)}:${String(activity.duration % 60).padStart(2, '0')}` : ''}
        </p>
      </div>
      <span className="text-[11px] text-muted-foreground whitespace-nowrap shrink-0">{time}</span>
    </div>
  )
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'jetzt'
  if (mins < 60) return `${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  return `${days}d`
}
