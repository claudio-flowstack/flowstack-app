import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Header } from '@/shell/Header'
import { useLanguage } from '@/core/i18n/context'
import { RefreshCw, Loader2, ArrowLeft } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { useSalesStore } from '../application/sales-store'
import { SalesActivityHub } from '../components/SalesActivityHub'
import { SalesPipelineHub } from '../components/SalesPipelineHub'
import { SalesAnalysis } from '../components/SalesAnalysis'

const TABS = [
  { key: 'activities', label: 'kpi.tab.activities' },
  { key: 'pipeline', label: 'kpi.tab.pipeline' },
  { key: 'analysis', label: 'kpi.tab.analysis' },
] as const

type TabKey = (typeof TABS)[number]['key']

export function SalesDashboardPage() {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<TabKey>('activities')
  const {
    overview, activities, loading, error, lastRefresh,
    activitySummary, userStats, dailyTrend, targets,
    fetchOverview, fetchActivities, refresh,
  } = useSalesStore()

  // Initial fetch
  useEffect(() => {
    fetchOverview()
    fetchActivities()
  }, [fetchOverview, fetchActivities])

  // Auto-refresh every 2 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      fetchOverview()
      fetchActivities()
    }, 120_000)
    return () => clearInterval(interval)
  }, [fetchOverview, fetchActivities])

  const lastRefreshLabel = lastRefresh
    ? new Date(lastRefresh).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
    : null

  return (
    <>
      <Header
        title={t('kpi.sales.title')}
        subtitle={t('kpi.sales.subtitle')}
        actions={
          <div className="flex items-center gap-3">
            {lastRefreshLabel && (
              <span className="text-[11px] text-muted-foreground">
                Zuletzt: {lastRefreshLabel}
              </span>
            )}
            <button
              onClick={refresh}
              disabled={loading}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                'border border-border bg-card text-foreground hover:bg-muted/50',
                loading && 'opacity-50 cursor-not-allowed',
              )}
            >
              {loading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
              {t('kpi.refresh')}
            </button>
          </div>
        }
      />
      <div className="p-4 lg:p-6">
        {/* ── Back + Tabs ──────────────────────────── */}
        <div className="flex items-center gap-1 border-b border-border mb-6">
          <button
            onClick={() => navigate('/kpi')}
            className="shrink-0 px-2 py-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors mr-1"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'shrink-0 px-3 py-2.5 text-sm font-medium border-b-2 transition-colors',
                activeTab === tab.key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border',
              )}
            >
              {t(tab.label)}
            </button>
          ))}
        </div>

        {/* ── Error State ──────────────────────────── */}
        {error && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 mb-6">
            <p className="text-sm text-red-500">
              Fehler beim Laden: {error}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Stelle sicher, dass der API-Server auf Port 8000 läuft.
            </p>
          </div>
        )}

        {/* ── Loading State ────────────────────────── */}
        {loading && !overview && (
          <div className="flex flex-col items-center justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-sm text-muted-foreground">Lade Daten von Close CRM...</p>
          </div>
        )}

        {/* ── Tab Content ──────────────────────────── */}
        {activeTab === 'activities' && (
          <SalesActivityHub
            activities={activities}
            summary={activitySummary}
            targets={targets}
            userStats={userStats}
            dailyTrend={dailyTrend}
          />
        )}
        {activeTab === 'pipeline' && overview && (
          <SalesPipelineHub overview={overview} />
        )}
        {activeTab === 'analysis' && overview && (
          <SalesAnalysis overview={overview} />
        )}
      </div>
    </>
  )
}
