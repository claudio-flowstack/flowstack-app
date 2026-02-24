import { useState, useMemo } from 'react'
import type { ContentFile, FileCategory } from '../domain/types'
import { FILE_CATEGORY_CONFIG } from '../domain/constants'
import { cn } from '@/shared/lib/utils'
import { formatDate } from '@/shared/lib/utils'
import { File, Plus, Trash2, ExternalLink, X, Search } from 'lucide-react'

// ── Helpers ────────────────────────────────────────────────────────────────

const CATEGORY_KEYS = Object.keys(FILE_CATEGORY_CONFIG) as FileCategory[]

function createId(): string {
  return `file-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

// ── Props ──────────────────────────────────────────────────────────────────

interface ContentFilesProps {
  files: ContentFile[]
  onCreateFile: (data: Partial<ContentFile>) => void
  onDeleteFile: (id: string) => void
}

// ── Component ──────────────────────────────────────────────────────────────

export function ContentFiles({
  files,
  onCreateFile,
  onDeleteFile,
}: ContentFilesProps) {
  // Filter & search state
  const [categoryFilter, setCategoryFilter] = useState<FileCategory | 'all'>('all')
  const [labelFilter, setLabelFilter] = useState<string[]>([])
  const [search, setSearch] = useState('')

  // Add-form state
  const [showAddForm, setShowAddForm] = useState(false)
  const [formName, setFormName] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formUrl, setFormUrl] = useState('')
  const [formCategory, setFormCategory] = useState<FileCategory>('other')
  const [formLabels, setFormLabels] = useState('')

  // Derived data
  const allLabels = useMemo(() => {
    const set = new Set<string>()
    for (const f of files) {
      for (const l of f.labels) set.add(l)
    }
    return Array.from(set).sort()
  }, [files])

  const filtered = useMemo(() => {
    let result = files
    if (categoryFilter !== 'all') {
      result = result.filter((f) => f.category === categoryFilter)
    }
    if (labelFilter.length > 0) {
      result = result.filter((f) =>
        labelFilter.some((l) => f.labels.includes(l)),
      )
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (f) =>
          f.name.toLowerCase().includes(q) ||
          f.description.toLowerCase().includes(q),
      )
    }
    return result
  }, [files, categoryFilter, labelFilter, search])

  // Handlers
  const toggleLabel = (label: string) => {
    setLabelFilter((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label],
    )
  }

  const resetForm = () => {
    setFormName('')
    setFormDescription('')
    setFormUrl('')
    setFormCategory('other')
    setFormLabels('')
    setShowAddForm(false)
  }

  const handleSave = () => {
    if (!formName.trim()) return
    const labels = formLabels
      .split(',')
      .map((l) => l.trim())
      .filter(Boolean)
    onCreateFile({
      id: createId(),
      name: formName.trim(),
      description: formDescription.trim(),
      url: formUrl.trim(),
      category: formCategory,
      labels,
      createdAt: new Date().toISOString(),
    })
    resetForm()
  }

  return (
    <div className="space-y-5">
      {/* ── Header ───────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <File className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold text-foreground">
            Dateien & Links
          </h2>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          Datei hinzufügen
        </button>
      </div>

      {/* ── Filters ──────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Category */}
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value as FileCategory | 'all')}
          className="rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="all">Alle Kategorien</option>
          {CATEGORY_KEYS.map((key) => (
            <option key={key} value={key}>
              {FILE_CATEGORY_CONFIG[key].label}
            </option>
          ))}
        </select>

        {/* Search */}
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Suchen..."
            className="w-full rounded-lg border border-border bg-card py-1.5 pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Label pills */}
        {allLabels.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            {allLabels.map((label) => (
              <button
                key={label}
                onClick={() => toggleLabel(label)}
                className={cn(
                  'rounded-full px-2.5 py-0.5 text-[10px] font-medium transition-colors',
                  labelFilter.includes(label)
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80',
                )}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Add File Modal ───────────────────────────────────────── */}
      {showAddForm && (
        <div className="rounded-xl border border-border bg-card p-4 space-y-3 animate-fade-in">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Neue Datei</h3>
            <button
              onClick={resetForm}
              className="rounded-lg p-1 text-muted-foreground hover:bg-muted transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-muted-foreground">Name *</label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Dateiname"
                className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-muted-foreground">URL</label>
              <input
                type="url"
                value={formUrl}
                onChange={(e) => setFormUrl(e.target.value)}
                placeholder="https://..."
                className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-medium text-muted-foreground">Beschreibung</label>
            <textarea
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              placeholder="Beschreibung..."
              rows={2}
              className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-muted-foreground">Kategorie</label>
              <select
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value as FileCategory)}
                className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {CATEGORY_KEYS.map((key) => (
                  <option key={key} value={key}>
                    {FILE_CATEGORY_CONFIG[key].label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-muted-foreground">Labels (kommagetrennt)</label>
              <input
                type="text"
                value={formLabels}
                onChange={(e) => setFormLabels(e.target.value)}
                placeholder="z.B. Design, Vorlage"
                className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              onClick={resetForm}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors"
            >
              Abbrechen
            </button>
            <button
              onClick={handleSave}
              disabled={!formName.trim()}
              className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-40 transition-colors"
            >
              Speichern
            </button>
          </div>
        </div>
      )}

      {/* ── File Grid ────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <File className="h-10 w-10 text-muted-foreground/30" />
          <p className="mt-3 text-sm text-muted-foreground">
            Keine Dateien gefunden
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((file) => {
            const catConfig = FILE_CATEGORY_CONFIG[file.category]
            return (
              <div
                key={file.id}
                className="group rounded-xl border border-border bg-card p-4 transition-all hover:shadow-sm"
                style={{ borderLeftColor: catConfig.color, borderLeftWidth: 3 }}
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-sm font-semibold text-foreground line-clamp-1">
                    {file.name}
                  </h4>
                  <div className="flex shrink-0 items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {file.url && (
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg p-1 text-muted-foreground hover:bg-muted transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                    <button
                      onClick={() => onDeleteFile(file.id)}
                      className="rounded-lg p-1 text-red-500 hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {file.description && (
                  <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                    {file.description}
                  </p>
                )}

                {file.labels.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {file.labels.map((label) => (
                      <span
                        key={label}
                        className="rounded-full bg-muted px-2 py-px text-[10px] font-medium text-muted-foreground"
                      >
                        {label}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-3 flex items-center justify-between">
                  <span
                    className="text-[10px] font-medium"
                    style={{ color: catConfig.color }}
                  >
                    {catConfig.label}
                  </span>
                  <span className="text-[10px] text-muted-foreground/70">
                    {formatDate(file.createdAt)}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
