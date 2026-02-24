import { Header } from '@/shell/Header'
import { useLanguage } from '@/core/i18n/context'
import { EmptyState } from '@/shared/components/EmptyState'
import { Linkedin, Plus } from 'lucide-react'

export function LinkedInPage() {
  const { t } = useLanguage()

  return (
    <>
      <Header
        title={t('linkedin.title')}
        subtitle={t('linkedin.subtitle')}
        actions={
          <button className="flex items-center gap-2 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">{t('common.create')}</span>
          </button>
        }
      />
      <div className="p-4 lg:p-6">
        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Requests', value: '0', sub: '' },
            { label: 'Connected', value: '0', sub: '0% Rate' },
            { label: 'Replies', value: '0', sub: '0% Rate' },
            { label: 'Leads', value: '0', sub: '' },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {stat.label}
              </p>
              <p className="mt-1 text-2xl font-bold text-foreground">{stat.value}</p>
              {stat.sub && (
                <p className="text-xs text-muted-foreground mt-0.5">{stat.sub}</p>
              )}
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 border-b border-border mb-6 overflow-x-auto">
          {[
            t('linkedin.dashboard'),
            t('linkedin.outreach'),
            t('linkedin.messages'),
            t('linkedin.posts'),
            t('linkedin.leads'),
            t('linkedin.analytics'),
            t('linkedin.sequences'),
          ].map((tab, i) => (
            <button
              key={tab}
              className={`shrink-0 px-3 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                i === 0
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <EmptyState
          icon={Linkedin}
          title={t('empty.title')}
          description="Starte deine erste LinkedIn Kampagne."
          action={{
            label: t('common.create'),
            onClick: () => {},
          }}
        />
      </div>
    </>
  )
}
