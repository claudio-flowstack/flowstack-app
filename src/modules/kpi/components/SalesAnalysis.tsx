import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts'
import { cn } from '@/shared/lib/utils'
import type { SalesOverview } from '../application/sales-store'

interface Props {
  overview: SalesOverview
}

const TOOLTIP_STYLE = {
  background: 'var(--card)',
  border: '1px solid var(--border)',
  borderRadius: '0.5rem',
  color: 'var(--foreground)',
  fontSize: '12px',
}

export function SalesAnalysis({ overview }: Props) {
  const { lead_statuses, strategie, anruf_ergebnis, entscheider, data_quality } = overview

  // Quality data
  const completeness = [
    { name: 'Kontaktperson', value: data_quality.kontakt_rate, count: data_quality.mit_kontakt, color: '#6366f1' },
    { name: 'Email-Adresse', value: data_quality.email_rate, count: data_quality.mit_email, color: '#3b82f6' },
    { name: 'Telefonnummer', value: data_quality.telefon_rate, count: data_quality.mit_telefon, color: '#22c55e' },
  ]

  const avgRate = completeness.length > 0
    ? Math.round(completeness.reduce((s, c) => s + c.value, 0) / completeness.length)
    : 0

  const donutData = [
    { name: 'Vollständig', value: avgRate, fill: avgRate >= 70 ? '#22c55e' : avgRate >= 40 ? '#f59e0b' : '#ef4444' },
    { name: 'Fehlend', value: 100 - avgRate, fill: 'var(--muted)' },
  ]

  // Entscheider
  const entscheiderData = Object.entries(entscheider)
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value }))

  return (
    <div className="space-y-6">
      {/* ── Lead-Status + Strategie ────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Lead-Status Verteilung</h3>
          <DistributionList data={lead_statuses} colors={{
            'Neu': '#3b82f6', 'In Bearbeitung': '#6366f1', 'Qualifiziert': '#22c55e',
            'Kunde': '#22c55e', 'Kein Interesse': '#f59e0b', 'Nicht passend': '#ef4444',
          }} />
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Strategie</h3>
          <DistributionList data={strategie} colors={{
            'Cold Call': '#3b82f6', 'Video Outreach': '#6366f1',
            'Testkunde': '#f59e0b', 'Kooperation': '#22c55e',
          }} />
        </div>
      </div>

      {/* ── Anruf-Ergebnis + Entscheider ───────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Anruf-Ergebnis</h3>
          <DistributionList data={anruf_ergebnis} colors={{
            'Termin vereinbart': '#22c55e', 'Interesse': '#6366f1',
            'Kein Interesse': '#f59e0b', 'Nicht erreicht': '#64748b',
            'Falsche Nummer': '#ef4444', 'Mailbox': '#3b82f6',
          }} />
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Entscheider-Kontakt</h3>
          {entscheiderData.length > 0 ? (
            <div className="space-y-3">
              {entscheiderData.map(entry => {
                const total = entscheiderData.reduce((s, e) => s + e.value, 0)
                const pct = total > 0 ? (entry.value / total) * 100 : 0
                const maxVal = Math.max(...entscheiderData.map(e => e.value), 1)
                const barPct = Math.max((entry.value / maxVal) * 100, 4)
                return (
                  <div key={entry.name}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-muted-foreground">{entry.name}</span>
                      <span className="text-xs text-muted-foreground font-mono">
                        {entry.value.toLocaleString('de-DE')} ({pct.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="h-4 rounded bg-muted/30 overflow-hidden">
                      <div
                        className="h-full rounded transition-all duration-500"
                        style={{
                          width: `${barPct}%`,
                          backgroundColor: entry.name === 'Ja' || entry.name === 'ja' ? '#22c55e'
                            : entry.name === 'Nein' || entry.name === 'nein' ? '#ef4444'
                            : '#6366f1',
                          opacity: 0.7,
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">Keine Entscheider-Daten</p>
          )}
        </div>
      </div>

      {/* ── Datenqualität Detail ────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Donut Score */}
        <div className="rounded-xl border border-border bg-card p-5 flex flex-col items-center justify-center">
          <h3 className="text-sm font-semibold text-foreground mb-2">Datenqualität</h3>
          <div className="relative">
            <ResponsiveContainer width={180} height={180}>
              <PieChart>
                <Pie
                  data={donutData}
                  cx="50%" cy="50%"
                  innerRadius={60} outerRadius={80}
                  startAngle={90} endAngle={-270}
                  paddingAngle={2} dataKey="value"
                >
                  {donutData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={cn(
                'text-3xl font-bold',
                avgRate >= 70 ? 'text-emerald-500' : avgRate >= 40 ? 'text-amber-500' : 'text-red-500',
              )}>
                {avgRate}%
              </span>
              <span className="text-[11px] text-muted-foreground">Ø Vollständigkeit</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {data_quality.total.toLocaleString('de-DE')} Leads analysiert
          </p>
        </div>

        {/* Completeness Bars */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-5">Kontaktdaten-Vollständigkeit</h3>
          <div className="space-y-6">
            {completeness.map(metric => (
              <div key={metric.name}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-foreground font-medium">{metric.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {metric.count.toLocaleString('de-DE')} / {data_quality.total.toLocaleString('de-DE')}
                    </span>
                    <span className={cn(
                      'text-sm font-bold',
                      metric.value >= 70 ? 'text-emerald-500' : metric.value >= 40 ? 'text-amber-500' : 'text-red-500',
                    )}>
                      {metric.value.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="h-3 rounded-full bg-muted/50 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${metric.value}%`, backgroundColor: metric.color }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Missing data */}
          <div className="mt-6 pt-4 border-t border-border">
            <div className="grid grid-cols-3 gap-3">
              {completeness.map(metric => {
                const missing = data_quality.total - metric.count
                return (
                  <div key={metric.name} className="rounded-lg bg-muted/30 p-3 text-center">
                    <p className="text-lg font-bold text-red-500">{missing.toLocaleString('de-DE')}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">ohne {metric.name}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Distribution List ────────────────────────────────────────────────────────

function DistributionList({ data, colors }: { data: Record<string, number>; colors: Record<string, string> }) {
  const entries = Object.entries(data).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1])
  const max = Math.max(...entries.map(([, v]) => v), 1)
  const defaultPalette = ['#6366f1', '#3b82f6', '#f59e0b', '#22c55e', '#ef4444', '#8b5cf6']

  if (entries.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-4">Keine Daten</p>
  }

  return (
    <div className="space-y-2">
      {entries.map(([label, count], i) => {
        const pct = Math.max((count / max) * 100, 4)
        const color = colors[label] ?? defaultPalette[i % defaultPalette.length] ?? '#6366f1'
        return (
          <div key={label} className="flex items-center gap-2">
            <span className="text-[11px] text-muted-foreground w-28 text-right truncate shrink-0">{label}</span>
            <div className="flex-1 h-5 rounded bg-muted/30 overflow-hidden">
              <div
                className="h-full rounded transition-all duration-500"
                style={{ width: `${pct}%`, backgroundColor: color, opacity: 0.65 }}
              />
            </div>
            <span className="text-[11px] text-muted-foreground w-8 text-right font-mono shrink-0">{count}</span>
          </div>
        )
      })}
    </div>
  )
}
