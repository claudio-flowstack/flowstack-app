import { useState } from 'react'
import { useResearchStore } from '../application/research-store'
import { LeadResultCard } from './LeadResultCard'
import { Search, Globe, Loader2 } from 'lucide-react'

export function SingleResearch() {
  const [firma, setFirma] = useState('')
  const [website, setWebsite] = useState('')
  const [stadt, setStadt] = useState('')

  const { researchSingle, findWebsite, currentResult, loading, error, clearCurrentResult } =
    useResearchStore()

  const handleResearch = async () => {
    if (!firma.trim()) return
    await researchSingle(firma.trim(), website.trim() || undefined, stadt.trim() || undefined)
  }

  const handleFindWebsite = async () => {
    if (!firma.trim()) return
    const result = await findWebsite(firma.trim(), stadt.trim() || undefined)
    if (result?.website) {
      setWebsite(result.website)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && firma.trim()) {
      handleResearch()
    }
  }

  return (
    <div className="space-y-6">
      {/* Input form */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Firma <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={firma}
              onChange={(e) => setFirma(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="z.B. Baulig Consulting GmbH"
              className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Website <span className="text-muted-foreground text-xs">(optional)</span>
            </label>
            <div className="flex gap-1.5">
              <input
                type="text"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="https://example.de"
                className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring transition-colors"
              />
              <button
                onClick={handleFindWebsite}
                disabled={loading || !firma.trim()}
                title="Website automatisch finden"
                className="h-9 w-9 shrink-0 rounded-lg border border-input bg-background flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50"
              >
                <Globe className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Stadt <span className="text-muted-foreground text-xs">(optional)</span>
            </label>
            <input
              type="text"
              value={stadt}
              onChange={(e) => setStadt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="z.B. Berlin"
              className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring transition-colors"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 mt-4">
          <button
            onClick={handleResearch}
            disabled={loading || !firma.trim()}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            Recherche starten
          </button>
          {error && (
            <span className="text-sm text-red-500">{error}</span>
          )}
        </div>
      </div>

      {/* Loading state */}
      {loading && !currentResult && (
        <div className="flex flex-col items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
          <p className="text-sm text-muted-foreground">Recherchiere {firma}...</p>
          <p className="text-xs text-muted-foreground mt-1">Impressum, Social Media, Technologie, Score</p>
        </div>
      )}

      {/* Result */}
      {currentResult && (
        <LeadResultCard lead={currentResult} onClose={clearCurrentResult} />
      )}
    </div>
  )
}
