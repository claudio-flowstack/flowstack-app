import { Routes, Route, useNavigate } from 'react-router-dom'
import { Header } from '@/shell/Header'
import { useLanguage } from '@/core/i18n/context'
import { BarChart3, TrendingUp, Megaphone, Globe } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { SalesDashboardPage } from './SalesDashboardPage'

interface DashboardCard {
  key: string
  path: string
  titleKey: string
  descKey: string
  icon: typeof BarChart3
  color: string
  available: boolean
}

const DASHBOARDS: DashboardCard[] = [
  {
    key: 'sales',
    path: 'sales',
    titleKey: 'kpi.dashboard.sales',
    descKey: 'kpi.dashboard.sales.desc',
    icon: TrendingUp,
    color: 'text-emerald-500 bg-emerald-500/10',
    available: true,
  },
  {
    key: 'marketing',
    path: 'marketing',
    titleKey: 'kpi.dashboard.marketing',
    descKey: 'kpi.dashboard.marketing.desc',
    icon: Megaphone,
    color: 'text-violet-500 bg-violet-500/10',
    available: false,
  },
  {
    key: 'website',
    path: 'website',
    titleKey: 'kpi.dashboard.website',
    descKey: 'kpi.dashboard.website.desc',
    icon: Globe,
    color: 'text-blue-500 bg-blue-500/10',
    available: false,
  },
]

export function KpiPage() {
  return (
    <Routes>
      <Route index element={<KpiHub />} />
      <Route path="sales" element={<SalesDashboardPage />} />
    </Routes>
  )
}

function KpiHub() {
  const { t } = useLanguage()
  const navigate = useNavigate()

  return (
    <>
      <Header
        title={t('kpi.title')}
        subtitle={t('kpi.subtitle')}
      />
      <div className="p-4 lg:p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {DASHBOARDS.map(dash => (
            <button
              key={dash.key}
              onClick={() => dash.available && navigate(`/kpi/${dash.path}`)}
              disabled={!dash.available}
              className={cn(
                'rounded-xl border bg-card p-6 text-left transition-all duration-200 group',
                dash.available
                  ? 'border-border hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 cursor-pointer'
                  : 'border-border/50 opacity-50 cursor-not-allowed',
              )}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={cn('rounded-xl p-2.5', dash.color)}>
                  <dash.icon className="h-5 w-5" />
                </div>
                {!dash.available && (
                  <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground bg-muted/50 rounded-full px-2 py-0.5">
                    {t('kpi.comingSoon')}
                  </span>
                )}
              </div>
              <h3 className={cn(
                'text-base font-semibold text-foreground mb-1',
                dash.available && 'group-hover:text-primary transition-colors',
              )}>
                {t(dash.titleKey)}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t(dash.descKey)}
              </p>
            </button>
          ))}
        </div>
      </div>
    </>
  )
}
