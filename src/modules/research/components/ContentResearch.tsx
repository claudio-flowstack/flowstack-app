import { useState, useEffect } from 'react'
import { useContentResearchStore } from '../application/content-research-store'
import { AI_MODELS, isPuterAvailable } from '@/core/ai/puter-ai'
import type { AIModel } from '@/core/ai/puter-ai'
import type { AITask, ContentPlatform, ContentTone } from '../domain/content-types'
import { YouTubeResults } from './YouTubeResults'
import { NewsResults } from './NewsResults'
import {
  Search, Loader2, Youtube, Newspaper, Sparkles, Copy, Check, Cpu,
  ChevronRight, ArrowRight,
} from 'lucide-react'

type Step = 'recherche' | 'analyse' | 'erstellen'

const STEPS: { key: Step; label: string; icon: typeof Search }[] = [
  { key: 'recherche', label: '1. Recherche', icon: Search },
  { key: 'analyse', label: '2. AI-Analyse', icon: Sparkles },
  { key: 'erstellen', label: '3. Content', icon: ArrowRight },
]

const SORT_OPTIONS = [
  { value: 'relevance', label: 'Relevanz' },
  { value: 'view_count', label: 'Aufrufe' },
  { value: 'date', label: 'Datum' },
]

const AI_TASKS: { value: AITask; label: string }[] = [
  { value: 'analyze', label: 'Trends analysieren' },
  { value: 'topics', label: 'Themen vorschlagen' },
  { value: 'frameworks', label: 'Frameworks empfehlen' },
  { value: 'script', label: 'Skript schreiben' },
]

const PLATFORM_OPTIONS: { value: ContentPlatform; label: string }[] = [
  { value: 'instagram', label: 'Instagram Reel' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'youtube_short', label: 'YouTube Short' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'tiktok', label: 'TikTok' },
]

const TONES: { value: ContentTone; label: string }[] = [
  { value: 'professional', label: 'Professionell' },
  { value: 'casual', label: 'Locker' },
  { value: 'bold', label: 'Provokant' },
  { value: 'educational', label: 'Lehrreich' },
]

export function ContentResearch() {
  const [step, setStep] = useState<Step>('recherche')

  // Search state
  const [query, setQuery] = useState('')
  const [mode, setMode] = useState<'youtube' | 'news'>('youtube')
  const [sortBy, setSortBy] = useState('relevance')
  const [maxResults, setMaxResults] = useState(10)

  // AI state
  const [task, setTask] = useState<AITask>('analyze')
  const [context, setContext] = useState('')
  const [topic, setTopic] = useState('')
  const [framework, setFramework] = useState('')
  const [platform, setPlatform] = useState<ContentPlatform>('instagram')
  const [tone, setTone] = useState<ContentTone>('professional')
  const [copied, setCopied] = useState(false)

  const store = useContentResearchStore()
  const { videos, articles, loading, error, aiAnalysis, aiContent, aiModel, loadingAI, frameworks, platforms, selectedModel } = store

  const hasResults = videos.length > 0 || articles.length > 0

  // Set default framework
  useEffect(() => {
    if (!framework && Object.keys(frameworks).length > 0) {
      setFramework(Object.keys(frameworks)[0])
    }
  }, [framework, frameworks])

  const handleSearch = async () => {
    if (!query.trim()) return
    if (mode === 'youtube') await store.searchYouTube(query.trim(), maxResults, sortBy)
    else await store.searchNews(query.trim(), maxResults)
  }

  const handleAnalyze = () => {
    const content = [
      ...videos.map((v) => ({ type: 'youtube', title: v.title, views: v.views, engagement: v.engagement_rate, tags: v.tags })),
      ...articles.map((a) => ({ type: 'news', title: a.title, source: a.source, body: a.body?.slice(0, 200) })),
    ]
    store.analyzeContent(content, task, context || undefined)
  }

  const handleCreate = () => {
    if (!topic.trim()) return
    const research = hasResults ? {
      videos: videos.slice(0, 5).map((v) => ({ title: v.title, views: v.views, tags: v.tags })),
      articles: articles.slice(0, 5).map((a) => ({ title: a.title, source: a.source })),
    } : undefined
    store.createContent(topic.trim(), framework, platform, tone, research)
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-4">
      {/* Model + Step nav */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Steps */}
        <div className="flex items-center gap-0.5 flex-1">
          {STEPS.map(({ key, label, icon: Icon }, i) => (
            <div key={key} className="flex items-center">
              <button
                onClick={() => setStep(key)}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                  step === key
                    ? 'bg-primary text-primary-foreground'
                    : key === 'analyse' && !hasResults
                      ? 'bg-muted/50 text-muted-foreground/50 cursor-not-allowed'
                      : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
                disabled={key === 'analyse' && !hasResults}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
              {i < STEPS.length - 1 && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground mx-0.5" />}
            </div>
          ))}
        </div>

        {/* Model selector */}
        <div className="flex items-center gap-1.5 text-xs">
          <Cpu className="h-3.5 w-3.5 text-primary" />
          <select
            value={selectedModel}
            onChange={(e) => store.setModel(e.target.value as AIModel)}
            className="h-7 rounded border border-input bg-background px-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring/30"
          >
            {AI_MODELS.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
          <span className="text-[10px] text-emerald-500 font-medium">Free</span>
        </div>
      </div>

      {/* ─── Step 1: Recherche ─── */}
      {step === 'recherche' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-4 space-y-3">
            {/* Mode + Search */}
            <div className="flex gap-2">
              <button onClick={() => setMode('youtube')}
                className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                  mode === 'youtube' ? 'bg-red-500/10 text-red-500 border border-red-500/30' : 'bg-muted text-muted-foreground'
                }`}>
                <Youtube className="h-3.5 w-3.5" /> YouTube
              </button>
              <button onClick={() => setMode('news')}
                className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                  mode === 'news' ? 'bg-blue-500/10 text-blue-500 border border-blue-500/30' : 'bg-muted text-muted-foreground'
                }`}>
                <Newspaper className="h-3.5 w-3.5" /> News
              </button>

              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder={mode === 'youtube' ? 'z.B. "Agentur skalieren"' : 'z.B. "KI Marketing Trends"'}
                className="h-8 flex-1 rounded-lg border border-input bg-background px-3 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 transition-colors"
              />

              {mode === 'youtube' && (
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
                  className="h-8 rounded-lg border border-input bg-background px-1.5 text-xs">
                  {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              )}
              <select value={maxResults} onChange={(e) => setMaxResults(Number(e.target.value))}
                className="h-8 w-14 rounded-lg border border-input bg-background px-1 text-xs">
                {[5, 10, 15, 20].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>

              <button onClick={handleSearch} disabled={loading || !query.trim()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
                Suchen
              </button>
            </div>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
              <span className="text-sm text-muted-foreground">{mode === 'youtube' ? 'Suche Videos...' : 'Suche News...'}</span>
            </div>
          )}

          {!loading && <YouTubeResults videos={videos} />}
          {!loading && <NewsResults articles={articles} />}

          {hasResults && !loading && (
            <div className="flex justify-end">
              <button onClick={() => setStep('analyse')}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                Weiter zur AI-Analyse <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ─── Step 2: AI-Analyse ─── */}
      {step === 'analyse' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">AI-Analyse</h3>
              <span className="text-xs text-muted-foreground">{videos.length} Videos · {articles.length} Artikel</span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {AI_TASKS.map((t) => (
                <button key={t.value} onClick={() => setTask(t.value)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    task === t.value ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
                  }`}>
                  {t.label}
                </button>
              ))}
            </div>

            <input type="text" value={context} onChange={(e) => setContext(e.target.value)}
              placeholder="Kontext (optional): z.B. Zielgruppe: Agenturinhaber 25-45"
              className="h-8 w-full rounded-lg border border-input bg-background px-3 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 transition-colors" />

            <button onClick={handleAnalyze} disabled={loadingAI || !hasResults}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
              {loadingAI && !aiContent ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              Analysieren
            </button>
          </div>

          {aiAnalysis && (
            <div className="rounded-xl border border-border bg-card p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{AI_TASKS.find((t) => t.value === task)?.label} · {aiModel}</span>
                <div className="flex gap-1">
                  <button onClick={() => handleCopy(aiAnalysis)} className="p-1 rounded hover:bg-muted">
                    {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
                  </button>
                  <button onClick={store.clearAnalysis} className="text-xs text-muted-foreground hover:text-foreground px-1">X</button>
                </div>
              </div>
              <div className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{aiAnalysis}</div>
            </div>
          )}

          <div className="flex justify-between">
            <button onClick={() => setStep('recherche')} className="text-xs text-muted-foreground hover:text-foreground">
              Zurueck zur Recherche
            </button>
            <button onClick={() => setStep('erstellen')}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
              Weiter zu Content <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* ─── Step 3: Content erstellen ─── */}
      {step === 'erstellen' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-4 space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Content erstellen</h3>

            <input type="text" value={topic} onChange={(e) => setTopic(e.target.value)}
              placeholder="Thema: z.B. Warum 90% der Agenturen unter 50k Umsatz bleiben"
              className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 transition-colors" />

            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Framework</label>
                <select value={framework} onChange={(e) => setFramework(e.target.value)}
                  className="h-8 w-full rounded-lg border border-input bg-background px-2 text-xs">
                  {Object.entries(frameworks).map(([key, fw]) => (
                    <option key={key} value={key}>{fw.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Plattform</label>
                <select value={platform} onChange={(e) => setPlatform(e.target.value as ContentPlatform)}
                  className="h-8 w-full rounded-lg border border-input bg-background px-2 text-xs">
                  {PLATFORM_OPTIONS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Ton</label>
                <select value={tone} onChange={(e) => setTone(e.target.value as ContentTone)}
                  className="h-8 w-full rounded-lg border border-input bg-background px-2 text-xs">
                  {TONES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
            </div>

            {frameworks[framework] && (
              <div className="text-[11px] text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
                <span className="font-medium">Struktur: </span>
                {frameworks[framework].structure.join(' → ')}
              </div>
            )}

            {platforms[platform] && (
              <div className="flex gap-3 text-[11px] text-muted-foreground">
                <span>Max: {platforms[platform].max_length}</span>
                <span>Format: {platforms[platform].format}</span>
              </div>
            )}

            <button onClick={handleCreate} disabled={loadingAI || !topic.trim()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
              {loadingAI && !aiAnalysis ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              Content generieren
            </button>
          </div>

          {aiContent && (
            <div className="rounded-xl border border-border bg-card p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {PLATFORM_OPTIONS.find((p) => p.value === platform)?.label} · {frameworks[framework]?.name} · {aiModel}
                </span>
                <div className="flex gap-1">
                  <button onClick={() => handleCopy(aiContent)} className="p-1 rounded hover:bg-muted">
                    {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
                  </button>
                  <button onClick={store.clearContent} className="text-xs text-muted-foreground hover:text-foreground px-1">X</button>
                </div>
              </div>
              <div className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{aiContent}</div>
            </div>
          )}

          <button onClick={() => setStep('analyse')} className="text-xs text-muted-foreground hover:text-foreground">
            Zurueck zur Analyse
          </button>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-3 text-xs text-red-500">{error}</div>
      )}
    </div>
  )
}
