import { useState, useEffect } from 'react'
import { useContentResearchStore } from '../application/content-research-store'
import { AI_MODELS } from '@/core/ai/puter-ai'
import type { AIModel } from '@/core/ai/puter-ai'
import type { AITask, ContentPlatform, ContentTone } from '../domain/content-types'
import { Sparkles, Loader2, Copy, Check, Cpu } from 'lucide-react'

const AI_TASKS: { value: AITask; label: string; desc: string }[] = [
  { value: 'analyze', label: 'Analyse', desc: 'Analysiere Trends & Performance' },
  { value: 'topics', label: 'Themen', desc: 'Themenvorschlaege generieren' },
  { value: 'frameworks', label: 'Frameworks', desc: 'Content-Frameworks vorschlagen' },
  { value: 'script', label: 'Skript', desc: 'Video-/Reel-Skript schreiben' },
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
  { value: 'bold', label: 'Mutig/Provokant' },
  { value: 'educational', label: 'Lehrreich' },
]

export function AIPanel() {
  const {
    videos, articles, aiAnalysis, aiContent, frameworks, platforms, aiModel,
    loadingAI, error, selectedModel,
    analyzeContent, createContent, setModel,
    clearAnalysis, clearContent,
  } = useContentResearchStore()

  const [task, setTask] = useState<AITask>('analyze')
  const [context, setContext] = useState('')
  const [topic, setTopic] = useState('')
  const [framework, setFramework] = useState('')
  const [platform, setPlatform] = useState<ContentPlatform>('instagram')
  const [tone, setTone] = useState<ContentTone>('professional')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const keys = Object.keys(frameworks)
    if (keys.length > 0 && !framework) setFramework(keys[0])
  }, [frameworks, framework])

  const hasResearchData = videos.length > 0 || articles.length > 0

  const handleAnalyze = () => {
    const content = [
      ...videos.map((v) => ({ type: 'youtube', title: v.title, views: v.views, engagement: v.engagement_rate, tags: v.tags })),
      ...articles.map((a) => ({ type: 'news', title: a.title, source: a.source, body: a.body?.slice(0, 200) })),
    ]
    analyzeContent(content, task, context || undefined)
  }

  const handleCreate = () => {
    if (!topic.trim()) return
    const research = hasResearchData ? {
      videos: videos.slice(0, 5).map((v) => ({ title: v.title, views: v.views, tags: v.tags })),
      articles: articles.slice(0, 5).map((a) => ({ title: a.title, source: a.source })),
    } : undefined
    createContent(topic.trim(), framework, platform, tone, research)
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-5">
      {/* Model selector */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 flex items-center gap-3">
        <Cpu className="h-4 w-4 text-primary shrink-0" />
        <span className="text-xs text-muted-foreground shrink-0">AI-Modell:</span>
        <select
          value={selectedModel}
          onChange={(e) => setModel(e.target.value as AIModel)}
          className="h-7 rounded border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring/30"
        >
          {AI_MODELS.map((m) => (
            <option key={m.value} value={m.value}>{m.label} ({m.provider})</option>
          ))}
        </select>
        <span className="text-[10px] text-emerald-500 font-medium ml-auto">Kostenlos via Puter.js</span>
      </div>

      {/* AI Analyze */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">AI-Analyse</h3>
          {!hasResearchData && (
            <span className="text-xs text-muted-foreground">(Suche zuerst nach Videos oder News)</span>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {AI_TASKS.map((t) => (
            <button
              key={t.value}
              onClick={() => setTask(t.value)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                task === t.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div>
          <label className="block text-xs text-muted-foreground mb-1">Zusaetzlicher Kontext (optional)</label>
          <input
            type="text"
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="z.B. Zielgruppe: Agenturinhaber 25-45"
            className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring transition-colors"
          />
        </div>

        <button
          onClick={handleAnalyze}
          disabled={loadingAI || !hasResearchData}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {loadingAI && !aiContent ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          Analysieren
        </button>

        {aiAnalysis && (
          <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{AI_TASKS.find((t) => t.value === task)?.label} · {aiModel}</span>
              <div className="flex gap-1">
                <button onClick={() => handleCopy(aiAnalysis)} className="p-1 rounded hover:bg-muted transition-colors">
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
                </button>
                <button onClick={clearAnalysis} className="text-xs text-muted-foreground hover:text-foreground px-1">X</button>
              </div>
            </div>
            <div className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{aiAnalysis}</div>
          </div>
        )}
      </div>

      {/* AI Content Creator */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Content erstellen</h3>
        </div>

        <div>
          <label className="block text-xs text-muted-foreground mb-1">Thema</label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="z.B. Warum 90% der Agenturen unter 50k Umsatz bleiben"
            className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring transition-colors"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Framework</label>
            <select value={framework} onChange={(e) => setFramework(e.target.value)}
              className="h-9 w-full rounded-lg border border-input bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring transition-colors">
              {Object.entries(frameworks).map(([key, fw]) => (
                <option key={key} value={key}>{fw.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Plattform</label>
            <select value={platform} onChange={(e) => setPlatform(e.target.value as ContentPlatform)}
              className="h-9 w-full rounded-lg border border-input bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring transition-colors">
              {PLATFORM_OPTIONS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Ton</label>
            <select value={tone} onChange={(e) => setTone(e.target.value as ContentTone)}
              className="h-9 w-full rounded-lg border border-input bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring transition-colors">
              {TONES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
        </div>

        {platforms[platform] && (
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span>Max: {platforms[platform].max_length}</span><span>·</span>
            <span>Format: {platforms[platform].format}</span><span>·</span>
            <span>Stil: {platforms[platform].style}</span>
          </div>
        )}

        {frameworks[framework] && (
          <div className="text-xs text-muted-foreground">
            <span className="font-medium">Struktur: </span>
            {frameworks[framework].structure.join(' → ')}
          </div>
        )}

        <button
          onClick={handleCreate}
          disabled={loadingAI || !topic.trim()}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {loadingAI && !aiAnalysis ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          Content generieren
        </button>

        {aiContent && (
          <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {PLATFORM_OPTIONS.find((p) => p.value === platform)?.label} · {frameworks[framework]?.name} · {aiModel}
              </span>
              <div className="flex gap-1">
                <button onClick={() => handleCopy(aiContent)} className="p-1 rounded hover:bg-muted transition-colors">
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
                </button>
                <button onClick={clearContent} className="text-xs text-muted-foreground hover:text-foreground px-1">X</button>
              </div>
            </div>
            <div className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{aiContent}</div>
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-3 text-sm text-red-500">{error}</div>
      )}
    </div>
  )
}
