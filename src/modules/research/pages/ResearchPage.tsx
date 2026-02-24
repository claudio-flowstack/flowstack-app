import { useState } from 'react'
import { Header } from '@/shell/Header'
import { useLanguage } from '@/core/i18n/context'
import type { Language } from '@/core/i18n/translations'
import { useResearchStore } from '../application/research-store'
import { SingleResearch } from '../components/SingleResearch'
import { BatchUpload } from '../components/BatchUpload'
import { ResultsTable } from '../components/ResultsTable'
import { ContentResearch } from '../components/ContentResearch'
import { LandingPageGenerator } from '../components/LandingPageGenerator'
import { AdsGenerator } from '../components/AdsGenerator'
import { AIChat } from '../components/AIChat'
import { StatusBadge } from '@/shared/components/StatusBadge'
import { Search, Upload, Database, History, Sparkles, Globe, MessageCircle, Megaphone } from 'lucide-react'

const TABS = [
  { key: 'recherche', icon: Search },
  { key: 'content', icon: Sparkles },
  { key: 'ads', icon: Megaphone },
  { key: 'website', icon: Globe },
  { key: 'chat', icon: MessageCircle },
  { key: 'batch', icon: Upload },
  { key: 'ergebnisse', icon: Database },
  { key: 'runs', icon: History },
] as const

type TabKey = (typeof TABS)[number]['key']

const TAB_LABELS: Record<Language, Record<TabKey, string>> = {
  de: { recherche: 'Recherche', content: 'Content', ads: 'Ads', website: 'Website', chat: 'AI Chat', batch: 'Batch', ergebnisse: 'Ergebnisse', runs: 'Runs' },
  en: { recherche: 'Research', content: 'Content', ads: 'Ads', website: 'Website', chat: 'AI Chat', batch: 'Batch', ergebnisse: 'Results', runs: 'Runs' },
}

export function ResearchPage() {
  const { t, lang } = useLanguage()
  const [activeTab, setActiveTab] = useState<TabKey>('recherche')
  const { results, batchJobs, batchProgress } = useResearchStore()

  const labels = TAB_LABELS[lang] || TAB_LABELS.de
  const stats = useResearchStore.getState().stats()

  return (
    <>
      <Header
        title={t('research.title')}
        subtitle={t('research.subtitle')}
      />
      <div className="p-4 lg:p-6">
        {/* Stats cards */}
        {results.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <StatCard label="Recherchiert" value={stats.total} />
            <StatCard label="GF gefunden" value={stats.withGF} sub={stats.total > 0 ? `${Math.round(stats.withGF / stats.total * 100)}%` : ''} />
            <StatCard label="Emails" value={stats.withEmail} sub={stats.total > 0 ? `${Math.round(stats.withEmail / stats.total * 100)}%` : ''} />
            <StatCard label="Avg. Score" value={stats.avgScore} sub="/100" />
          </div>
        )}

        {/* Tab bar */}
        <div className="flex items-center gap-1 border-b border-border mb-6 overflow-x-auto">
          {TABS.map(({ key, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
              }`}
            >
              <Icon className="h-4 w-4" />
              {labels[key]}
              {key === 'ergebnisse' && results.length > 0 && (
                <StatusBadge variant="muted" className="ml-1">{results.length}</StatusBadge>
              )}
              {key === 'batch' && batchProgress && (
                <span className="ml-1 h-2 w-2 rounded-full bg-primary animate-pulse" />
              )}
              {(key === 'content' || key === 'ads' || key === 'website' || key === 'chat') && (
                <span className="ml-1 h-1.5 w-1.5 rounded-full bg-emerald-500" title="Kostenlos via Puter.js" />
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === 'recherche' && <SingleResearch />}
        {activeTab === 'content' && <ContentResearch />}
        {activeTab === 'ads' && <AdsGenerator />}
        {activeTab === 'website' && <LandingPageGenerator />}
        {activeTab === 'chat' && <AIChat />}
        {activeTab === 'batch' && <BatchUpload />}
        {activeTab === 'ergebnisse' && <ResultsTable />}
        {activeTab === 'runs' && <RunsTab jobs={batchJobs} />}
      </div>
    </>
  )
}

function StatCard({ label, value, sub }: { label: string; value: number; sub?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="text-2xl font-bold text-foreground">
        {value}{sub && <span className="text-sm font-normal text-muted-foreground">{sub}</span>}
      </div>
      <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
    </div>
  )
}

function RunsTab({ jobs }: { jobs: Array<{ job_id: string; status: string; total: number; gf_found: number; emails_found: number; duration_seconds?: number; started_at: string }> }) {
  if (jobs.length === 0) {
    return (
      <div className="flex flex-col items-center py-16">
        <History className="h-8 w-8 text-muted-foreground mb-3" />
        <h3 className="text-base font-semibold text-foreground">Keine Runs</h3>
        <p className="text-sm text-muted-foreground mt-1">Starte einen Batch im Batch-Tab.</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-muted/50 border-b border-border">
            <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Job ID</th>
            <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Status</th>
            <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Leads</th>
            <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">GF</th>
            <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Emails</th>
            <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Dauer</th>
            <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Download</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((job) => (
            <tr key={job.job_id || job.started_at} className="border-b border-border last:border-0">
              <td className="px-3 py-2.5 font-mono text-xs text-muted-foreground">{job.job_id || '-'}</td>
              <td className="px-3 py-2.5">
                <StatusBadge variant={job.status === 'complete' ? 'success' : job.status === 'running' ? 'active' : 'danger'} dot>
                  {job.status === 'complete' ? 'Fertig' : job.status === 'running' ? 'Laeuft' : 'Fehler'}
                </StatusBadge>
              </td>
              <td className="px-3 py-2.5">{job.total}</td>
              <td className="px-3 py-2.5">{job.gf_found}</td>
              <td className="px-3 py-2.5">{job.emails_found}</td>
              <td className="px-3 py-2.5 text-muted-foreground">
                {job.duration_seconds ? `${Math.round(job.duration_seconds / 60)} Min` : '-'}
              </td>
              <td className="px-3 py-2.5">
                {job.status === 'complete' && job.job_id && (
                  <a href={`/api/research/results/${job.job_id}/download`}
                    className="text-primary hover:underline text-xs">CSV</a>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
