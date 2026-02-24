import { useState, useRef } from 'react'
import { aiChat, AI_MODELS, isPuterAvailable } from '@/core/ai/puter-ai'
import type { AIModel } from '@/core/ai/puter-ai'
import { Sparkles, Loader2, Download, RefreshCw, Eye, Code, Copy, Check, Cpu } from 'lucide-react'

const PAGE_TYPES = [
  { value: 'landing', label: 'Landing Page', desc: 'Conversion-optimierte Seite mit CTA' },
  { value: 'lead-magnet', label: 'Lead-Magnet', desc: 'Freebie-Download mit Email-Formular' },
  { value: 'webinar', label: 'Webinar-Seite', desc: 'Webinar-Anmeldung mit Countdown' },
  { value: 'portfolio', label: 'Portfolio', desc: 'Showcase mit Projekten/Cases' },
  { value: 'saas', label: 'SaaS-Produkt', desc: 'Feature-Highlights + Pricing' },
  { value: 'event', label: 'Event/Konferenz', desc: 'Event-Info mit Anmeldung' },
]

const STYLES = [
  { value: 'modern-dark', label: 'Modern Dark', desc: 'Dunkles Theme, clean, minimalistisch' },
  { value: 'modern-light', label: 'Modern Light', desc: 'Helles Theme, professionell' },
  { value: 'gradient', label: 'Gradient', desc: 'Farbverlauefe, dynamisch, modern' },
  { value: 'brutalist', label: 'Brutalist', desc: 'Bold, grosse Typografie, kantig' },
  { value: 'corporate', label: 'Corporate', desc: 'Business-Look, vertrauenswuerdig' },
]

export function LandingPageGenerator() {
  const [description, setDescription] = useState('')
  const [pageType, setPageType] = useState('landing')
  const [style, setStyle] = useState('modern-dark')
  const [model, setModel] = useState<AIModel>('gpt-4o')
  const [generatedCode, setGeneratedCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'preview' | 'code'>('preview')
  const [copied, setCopied] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const handleGenerate = async () => {
    if (!description.trim()) return
    if (!isPuterAvailable()) {
      setError('Puter.js nicht geladen. Bitte Seite neu laden.')
      return
    }

    setLoading(true)
    setError(null)
    setGeneratedCode('')

    try {
      const typeInfo = PAGE_TYPES.find((t) => t.value === pageType)
      const styleInfo = STYLES.find((s) => s.value === style)

      const prompt = `Du bist ein erstklassiger Webdesigner und Frontend-Entwickler.

Erstelle eine vollstaendige, einzelne HTML-Datei fuer folgende Webseite:

Beschreibung: ${description}
Seitentyp: ${typeInfo?.label} — ${typeInfo?.desc}
Design-Stil: ${styleInfo?.label} — ${styleInfo?.desc}

WICHTIGE REGELN:
1. Alles in EINER HTML-Datei (inline CSS + JS)
2. Responsives Design (Mobile-first)
3. Moderne CSS-Features nutzen (Grid, Flexbox, CSS Variables, Transitions)
4. Professionelle Typografie (Google Fonts einbinden via CDN)
5. Smooth Scroll, Hover-Effekte, subtile Animationen
6. Sektionen: Hero, Features/Benefits, Social Proof/Testimonials, CTA, Footer
7. Formulare muessen visuell funktionieren (kein Backend noetig)
8. Nur die HTML-Datei ausgeben, KEIN erklaerungstext davor oder danach
9. Der Code muss sofort im Browser lauffaehig sein
10. Deutsche Texte verwenden die zum Thema passen
11. Mindestens 5 Sektionen
12. Icons via Lucide CDN oder Unicode Emojis

Antworte NUR mit dem HTML-Code, kein Markdown, keine Erklaerung.`

      const result = await aiChat(prompt, model)

      // Extract HTML from response (in case AI wraps it in markdown)
      let html = result
      const htmlMatch = html.match(/```html?\s*([\s\S]*?)```/)
      if (htmlMatch) {
        html = htmlMatch[1]
      }
      // Ensure it starts with valid HTML
      if (!html.trim().startsWith('<!') && !html.trim().startsWith('<html')) {
        const docStart = html.indexOf('<!DOCTYPE') !== -1 ? html.indexOf('<!DOCTYPE') : html.indexOf('<html')
        if (docStart > 0) html = html.slice(docStart)
      }

      setGeneratedCode(html.trim())
      setViewMode('preview')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler bei der Generierung')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = () => {
    if (!generatedCode) return
    const blob = new Blob([generatedCode], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${pageType}-${Date.now()}.html`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-5">
      {/* Generator form */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Landing Page Generator</h3>
          <span className="text-[10px] text-emerald-500 font-medium ml-auto">Kostenlos — kein API-Key</span>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Beschreibung der Seite</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="z.B. Landing Page fuer eine Social Media Marketing Agentur die Kunden hilft 10x mehr Leads ueber Instagram zu generieren. Hero mit Video, Trust-Logos, 3 Pakete, FAQ, Kontaktformular."
            rows={3}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring transition-colors resize-none"
          />
        </div>

        {/* Type + Style + Model */}
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Seitentyp</label>
            <select
              value={pageType}
              onChange={(e) => setPageType(e.target.value)}
              className="h-9 w-full rounded-lg border border-input bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring transition-colors"
            >
              {PAGE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Design-Stil</label>
            <select
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              className="h-9 w-full rounded-lg border border-input bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring transition-colors"
            >
              {STYLES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1 flex items-center gap-1">
              <Cpu className="h-3 w-3" /> AI-Modell
            </label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value as AIModel)}
              className="h-9 w-full rounded-lg border border-input bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring transition-colors"
            >
              {AI_MODELS.map((m) => (
                <option key={m.value} value={m.value}>{m.label} ({m.provider})</option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading || !description.trim()}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {loading ? 'Generiere...' : 'Seite generieren'}
        </button>

        {error && (
          <div className="text-sm text-red-500">{error}</div>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center py-16">
          <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
          <p className="text-sm text-muted-foreground">AI generiert deine Webseite...</p>
          <p className="text-xs text-muted-foreground mt-1">Das kann 10-30 Sekunden dauern</p>
        </div>
      )}

      {/* Result */}
      {generatedCode && !loading && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          {/* Toolbar */}
          <div className="flex items-center gap-2 border-b border-border p-3 bg-muted/30">
            <div className="flex gap-1">
              <button
                onClick={() => setViewMode('preview')}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  viewMode === 'preview' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                <Eye className="h-3.5 w-3.5" /> Preview
              </button>
              <button
                onClick={() => setViewMode('code')}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  viewMode === 'code' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                <Code className="h-3.5 w-3.5" /> Code
              </button>
            </div>

            <div className="ml-auto flex gap-1.5">
              <button onClick={handleCopy} className="inline-flex items-center gap-1.5 rounded-lg border border-input px-3 py-1.5 text-xs hover:bg-muted transition-colors">
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? 'Kopiert!' : 'Code kopieren'}
              </button>
              <button onClick={handleDownload} className="inline-flex items-center gap-1.5 rounded-lg border border-input px-3 py-1.5 text-xs hover:bg-muted transition-colors">
                <Download className="h-3.5 w-3.5" /> Download HTML
              </button>
              <button onClick={handleGenerate} className="inline-flex items-center gap-1.5 rounded-lg border border-input px-3 py-1.5 text-xs hover:bg-muted transition-colors">
                <RefreshCw className="h-3.5 w-3.5" /> Neu generieren
              </button>
            </div>
          </div>

          {/* Preview / Code */}
          {viewMode === 'preview' ? (
            <iframe
              ref={iframeRef}
              srcDoc={generatedCode}
              title="Landing Page Preview"
              className="w-full border-0"
              style={{ height: '70vh' }}
              sandbox="allow-scripts allow-same-origin"
            />
          ) : (
            <div className="max-h-[70vh] overflow-auto">
              <pre className="p-4 text-xs text-muted-foreground font-mono whitespace-pre-wrap">
                {generatedCode}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
