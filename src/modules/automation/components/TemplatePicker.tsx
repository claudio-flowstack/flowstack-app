import { useState } from 'react'
import type { WorkflowTemplate } from '../domain/types'
import { NODE_TYPE_CONFIG } from '../domain/constants'
import { renderNodeIcon } from '../canvas/ToolLogos'
import { getNodeIcon } from '../canvas/icons'
import { ConfirmDialog } from '@/shared/components/ConfirmDialog'
import { cn } from '@/shared/lib/utils'
import { X, Workflow, Search, Sparkles, ArrowLeft, Copy } from 'lucide-react'

interface TemplatePickerProps {
  templates: WorkflowTemplate[]
  onSelect: (templateId: string) => void
  onCreateBlank: () => void
  onClose: () => void
}

export function TemplatePicker({
  templates,
  onSelect,
  onCreateBlank,
  onClose,
}: TemplatePickerProps) {
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [previewTemplate, setPreviewTemplate] = useState<WorkflowTemplate | null>(null)
  const [confirmDuplicate, setConfirmDuplicate] = useState(false)

  const categories = [...new Set(templates.map((t) => t.category))]

  const filtered = templates.filter((t) => {
    const matchesSearch =
      !search ||
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase()) ||
      t.tags.some((tag) => tag.toLowerCase().includes(search.toLowerCase()))
    const matchesCategory = !selectedCategory || t.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl rounded-2xl border border-border bg-card shadow-2xl animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-3">
            {previewTemplate && (
              <button
                onClick={() => setPreviewTemplate(null)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}
            <div>
              <h2 className="text-lg font-bold text-foreground">
                {previewTemplate ? previewTemplate.name : 'Neues System erstellen'}
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                {previewTemplate
                  ? 'Vorlage ansehen und duplizieren'
                  : 'Starte von einer Vorlage oder erstelle ein leeres System'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* ── List View ───────────────────────────────────────────────────── */}
        {!previewTemplate && (
          <>
            {/* Blank system option */}
            <div className="px-6 pt-4">
              <button
                onClick={onCreateBlank}
                className={cn(
                  'flex w-full items-center gap-4 rounded-xl border-2 border-dashed border-border p-4',
                  'hover:border-primary/40 hover:bg-primary/5 transition-all',
                )}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-foreground">
                    Leeres System
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Starte mit einem leeren Workflow Canvas
                  </p>
                </div>
              </button>
            </div>

            {/* Search + Categories */}
            <div className="px-6 pt-4 pb-2 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Vorlagen durchsuchen..."
                  className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary/30 outline-none transition-all"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={cn(
                    'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                    !selectedCategory
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:text-foreground',
                  )}
                >
                  Alle
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={cn(
                      'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                      selectedCategory === cat
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Template grid */}
            <div className="px-6 pb-6 pt-2 max-h-[40vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filtered.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => setPreviewTemplate(template)}
                    className={cn(
                      'group rounded-xl border border-border bg-background p-4 text-left',
                      'hover:border-primary/30 hover:shadow-md transition-all',
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/10 text-violet-500">
                        <Workflow className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">
                          {template.name}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {template.nodeCount} Nodes
                        </p>
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {template.description}
                    </p>
                    {template.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {template.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </button>
                ))}
              </div>

              {filtered.length === 0 && (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  Keine Templates gefunden
                </div>
              )}
            </div>
          </>
        )}

        {/* ── Preview / Detail View ───────────────────────────────────────── */}
        {previewTemplate && (
          <div className="px-6 pb-6 pt-4 space-y-4 max-h-[60vh] overflow-y-auto">
            {/* Description */}
            <p className="text-sm text-muted-foreground leading-relaxed">
              {previewTemplate.description}
            </p>

            {/* Meta: Category, Tags, Counts */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-primary/10 text-primary px-2.5 py-0.5 text-xs font-medium">
                {previewTemplate.category}
              </span>
              {previewTemplate.tags.map((tag) => (
                <span key={tag} className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                  {tag}
                </span>
              ))}
              <span className="text-xs text-muted-foreground ml-auto">
                {previewTemplate.nodes.length} Nodes · {previewTemplate.connections.length} Verbindungen
              </span>
            </div>

            {/* Node list with actual icons */}
            {previewTemplate.nodes.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {previewTemplate.nodes.map((node) => {
                  const config = NODE_TYPE_CONFIG[node.type] ?? { color: '#8b5cf6', label: 'Process', icon: 'workflow' }
                  const LucideIcon = getNodeIcon(node.icon)
                  const fallback = LucideIcon
                    ? <LucideIcon className="h-4 w-4" style={{ color: config.color }} />
                    : <Workflow className="h-4 w-4" style={{ color: config.color }} />
                  return (
                    <div key={node.id} className="flex items-center gap-2.5 rounded-lg border border-border/50 bg-background px-3 py-2">
                      <div
                        className="flex h-7 w-7 items-center justify-center rounded-md shrink-0"
                        style={{ background: `${config.color}18` }}
                      >
                        {renderNodeIcon(node.icon, node.logoUrl, fallback, 16)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-foreground truncate">{node.label}</p>
                        <p className="text-[10px] text-muted-foreground">{config.label}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="py-4 text-center text-sm text-muted-foreground">
                Keine Nodes in dieser Vorlage
              </div>
            )}

            {/* Duplicate button */}
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setConfirmDuplicate(true)}
                className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <Copy className="h-4 w-4" />
                Duplizieren
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Confirm Duplicate Dialog */}
      <ConfirmDialog
        open={confirmDuplicate}
        title="Vorlage duplizieren"
        description="Ein neues System wird aus dieser Vorlage erstellt. Du kannst es anschließend im Editor anpassen."
        confirmLabel="Duplizieren"
        variant="info"
        onConfirm={() => {
          if (previewTemplate) {
            onSelect(previewTemplate.id)
          }
          setConfirmDuplicate(false)
        }}
        onCancel={() => setConfirmDuplicate(false)}
      />
    </div>
  )
}
