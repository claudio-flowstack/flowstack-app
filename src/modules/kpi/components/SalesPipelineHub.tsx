import { useState, useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts'
import { ArrowDownRight } from 'lucide-react'
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

const STAGE_COLORS = [
  '#64748b', '#3b82f6', '#6366f1', '#8b5cf6',
  '#f59e0b', '#22c55e', '#22c55e', '#ef4444',
]

export function SalesPipelineHub({ overview }: Props) {
  const { funnel, conversions, pipelines, data_quality } = overview
  const [selectedPipeId, setSelectedPipeId] = useState<string | null>(null)

  const sorted = useMemo(
    () => [...pipelines].filter(p => p.total > 0).sort((a, b) => b.total - a.total),
    [pipelines],
  )
  const selectedPipe = sorted.find(p => p.id === selectedPipeId)

  // Aggregate KPIs
  const totalValue = pipelines.reduce((s, p) => s + p.total_value, 0)
  const totalDeals = pipelines.reduce((s, p) => s + p.active, 0)
  const avgWinRate = pipelines.length > 0
    ? pipelines.reduce((s, p) => s + p.win_rate, 0) / pipelines.length
    : 0

  // Funnel data
  const funnelData = useMemo(() => [
    { name: 'Leads', value: funnel.total_leads, fill: '#6366f1' },
    { name: 'Setting', value: funnel.setting_calls, fill: '#3b82f6' },
    { name: 'Sales', value: funnel.sales_calls, fill: '#8b5cf6' },
    { name: 'Follow-up', value: funnel.follow_ups, fill: '#f59e0b' },
    { name: 'Kunden', value: funnel.kunden, fill: '#22c55e' },
  ], [funnel])

  // Donut for selected pipeline
  const donutData = selectedPipe ? [
    { name: 'Aktiv', value: selectedPipe.active, fill: '#6366f1' },
    { name: 'Gewonnen', value: selectedPipe.won, fill: '#22c55e' },
    { name: 'Verloren', value: selectedPipe.lost, fill: '#ef4444' },
  ].filter(d => d.value > 0) : []

  return (
    <div className="space-y-6">
      {/* ── Pipeline KPI Cards ─────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Pipeline-Wert</p>
          <p className="text-2xl font-bold text-foreground">
            {totalValue > 0 ? `${(totalValue / 1000).toLocaleString('de-DE', { maximumFractionDigits: 0 })}k €` : '—'}
          </p>
          <p className="text-[11px] text-muted-foreground mt-1">{pipelines.length} Pipelines</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Gesamt-Win-Rate</p>
          <p className={cn(
            'text-2xl font-bold',
            avgWinRate >= 20 ? 'text-emerald-500' : avgWinRate > 5 ? 'text-amber-500' : 'text-muted-foreground',
          )}>
            {avgWinRate.toFixed(1)}%
          </p>
          <p className="text-[11px] text-muted-foreground mt-1">Durchschnitt aller Pipelines</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Aktive Deals</p>
          <p className="text-2xl font-bold text-foreground">{totalDeals.toLocaleString('de-DE')}</p>
          <p className="text-[11px] text-muted-foreground mt-1">In allen Pipelines</p>
        </div>
      </div>

      {/* ── Conversion Funnel ──────────────────────────────── */}
      <div className="rounded-xl border border-border bg-card p-4 lg:p-5">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-semibold text-foreground">Sales Funnel</h3>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live
          </div>
        </div>
        <div className="space-y-3">
          {funnelData.map((step, i) => {
            const maxVal = Math.max(funnel.total_leads, 1)
            const pct = Math.max((step.value / maxVal) * 100, step.value > 0 ? 4 : 1)
            const crLabel = i === 1 ? `${conversions.lead_to_setting}%`
              : i === 2 ? `${conversions.setting_to_sales}%`
              : i === 3 ? `${conversions.sales_to_followup}%`
              : i === 4 ? `${conversions.sales_to_kunde}%`
              : null

            return (
              <div key={step.name}>
                {crLabel && (
                  <div className="flex items-center gap-2 ml-20 mb-1">
                    <ArrowDownRight className="h-3 w-3 text-muted-foreground" />
                    <span className="text-[11px] font-mono text-muted-foreground">{crLabel}</span>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-16 text-right shrink-0">{step.name}</span>
                  <div className="flex-1 h-8 rounded-lg bg-muted/50 overflow-hidden relative">
                    <div
                      className="absolute inset-y-0 left-0 rounded-lg transition-all duration-700 ease-out"
                      style={{ width: `${pct}%`, backgroundColor: step.fill, opacity: 0.75 }}
                    />
                    <span className="absolute left-3 inset-y-0 flex items-center text-xs font-semibold text-foreground z-10">
                      {step.value.toLocaleString('de-DE')}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
          <span className="text-xs text-muted-foreground">Gesamt-Conversion</span>
          <span className="text-sm font-bold text-emerald-500">{conversions.overall}%</span>
        </div>
      </div>

      {/* ── Pipeline Grid + Win-Rate ───────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Pipeline Cards */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Pipelines</h3>
          <div className="space-y-3">
            {sorted.slice(0, 6).map(pipe => (
              <button
                key={pipe.id}
                onClick={() => setSelectedPipeId(selectedPipeId === pipe.id ? null : pipe.id)}
                className={cn(
                  'w-full rounded-lg border p-3 text-left transition-all',
                  selectedPipeId === pipe.id
                    ? 'border-primary/40 bg-primary/5'
                    : 'border-border/50 hover:border-primary/20',
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-foreground truncate pr-2">{pipe.name}</span>
                  <span className={cn(
                    'text-sm font-bold',
                    pipe.win_rate >= 20 ? 'text-emerald-500' : pipe.win_rate > 0 ? 'text-amber-500' : 'text-muted-foreground',
                  )}>{pipe.win_rate}%</span>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                  <span>{pipe.total} Deals</span>
                  <span className="text-emerald-500">{pipe.won} Won</span>
                  <span className="text-red-500">{pipe.lost} Lost</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Win-Rate per Pipeline */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Win-Rate pro Pipeline</h3>
          {sorted.length > 0 ? (
            <div className="space-y-3">
              {sorted.map(pipe => (
                <div key={pipe.id} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-32 text-right truncate shrink-0">{pipe.name}</span>
                  <div className="flex-1 h-6 rounded bg-muted/30 overflow-hidden relative">
                    <div
                      className="absolute inset-y-0 left-0 rounded transition-all duration-500"
                      style={{
                        width: `${Math.max(pipe.win_rate, pipe.win_rate > 0 ? 3 : 0)}%`,
                        backgroundColor: pipe.win_rate >= 20 ? '#22c55e' : pipe.win_rate > 0 ? '#f59e0b' : '#64748b',
                        opacity: 0.7,
                      }}
                    />
                    <span className="absolute left-2 inset-y-0 flex items-center text-[11px] font-semibold text-foreground z-10">
                      {pipe.win_rate}%
                    </span>
                  </div>
                  <span className="text-[11px] text-muted-foreground w-16 text-right shrink-0">
                    {pipe.won}/{pipe.total}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-6">Noch keine Deals</p>
          )}
        </div>
      </div>

      {/* ── Data Quality compact + Pipeline Detail ─────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Data Quality */}
        <div className="rounded-xl border border-border bg-card p-4 lg:p-5">
          <h3 className="text-sm font-semibold text-foreground mb-5">Datenqualität</h3>
          <div className="space-y-5">
            <QualityMetric label="Kontaktperson" value={data_quality.kontakt_rate} count={data_quality.mit_kontakt} total={data_quality.total} color="#6366f1" />
            <QualityMetric label="Email-Adresse" value={data_quality.email_rate} count={data_quality.mit_email} total={data_quality.total} color="#3b82f6" />
            <QualityMetric label="Telefonnummer" value={data_quality.telefon_rate} count={data_quality.mit_telefon} total={data_quality.total} color="#22c55e" />
          </div>
          <div className="mt-5 pt-3 border-t border-border flex justify-between text-xs text-muted-foreground">
            <span>Stichprobe</span>
            <span>{data_quality.total.toLocaleString('de-DE')} Leads</span>
          </div>
        </div>

        {/* Selected Pipeline Detail */}
        {selectedPipe ? (
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">{selectedPipe.name} — Detail</h3>
            <div className="grid grid-cols-1 gap-4">
              {/* Stage bar chart */}
              <ResponsiveContainer width="100%" height={200}>
                <BarChart
                  data={selectedPipe.stage_order.map((stage, i) => ({
                    name: stage.length > 14 ? stage.slice(0, 12) + '..' : stage,
                    count: selectedPipe.stages[stage] ?? 0,
                    fill: STAGE_COLORS[Math.min(i, STAGE_COLORS.length - 1)],
                  }))}
                  margin={{ left: 0, right: 8, bottom: 16 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="name" tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }} angle={-30} textAnchor="end" height={50} />
                  <YAxis tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={20} name="Deals">
                    {selectedPipe.stage_order.map((_, i) => (
                      <Cell key={i} fill={STAGE_COLORS[Math.min(i, STAGE_COLORS.length - 1)]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>

              {/* Donut */}
              {donutData.length > 0 && (
                <div className="flex flex-col items-center">
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie data={donutData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                        {donutData.map((entry, i) => (
                          <Cell key={i} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={TOOLTIP_STYLE} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex items-center gap-4">
                    {donutData.map(d => (
                      <div key={d.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: d.fill }} />
                        {d.name}: {d.value}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border/50 bg-card/50 p-5 flex items-center justify-center">
            <p className="text-sm text-muted-foreground">Pipeline auswählen für Details</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Quality Metric ───────────────────────────────────────────────────────────

function QualityMetric({ label, value, count, total, color }: {
  label: string; value: number; count: number; total: number; color: string
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="text-xs font-semibold" style={{ color }}>{value.toFixed(1)}%</span>
      </div>
      <div className="h-2 rounded-full bg-muted/50 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${value}%`, backgroundColor: color }}
        />
      </div>
      <p className="mt-1 text-[11px] text-muted-foreground">
        {count.toLocaleString('de-DE')} / {total.toLocaleString('de-DE')}
      </p>
    </div>
  )
}
