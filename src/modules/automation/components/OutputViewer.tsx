import { useState, useMemo, useCallback } from 'react'
import type { AdvancedSystemOutput, AdvancedOutputType } from '../domain/types'
import { cn } from '@/shared/lib/utils'
import { formatDate } from '@/shared/lib/utils'
import {
  FileText,
  Table2,
  Mail,
  Image,
  Code,
  Grid3X3,
  Search,
  LayoutGrid,
  List,
  Eye,
  ExternalLink,
  X,
  Copy,
  Check,
  FolderOpen,
  Globe,
  FileQuestion,
  Timer,
} from 'lucide-react'

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  const s = ms / 1000
  if (s < 60) return `${s.toFixed(1)}s`
  const m = Math.floor(s / 60)
  const rem = Math.round(s % 60)
  return `${m}m ${rem}s`
}

// ── Filter tab definition ─────────────────────────────────────────────────

type FilterTab = 'all' | AdvancedOutputType

interface TabDef {
  key: FilterTab
  label: string
}

const FILTER_TABS: TabDef[] = [
  { key: 'all', label: 'Alle' },
  { key: 'document', label: 'Dokument' },
  { key: 'website', label: 'Webseite' },
  { key: 'spreadsheet', label: 'Tabelle' },
  { key: 'email', label: 'E-Mail' },
  { key: 'image', label: 'Bild' },
  { key: 'json', label: 'JSON' },
  { key: 'table', label: 'Tabelle (Daten)' },
]

// ── Icon mapping ──────────────────────────────────────────────────────────

function outputIcon(type: AdvancedOutputType | string) {
  switch (type) {
    case 'document':
      return FileText
    case 'spreadsheet':
      return Table2
    case 'email':
      return Mail
    case 'image':
      return Image
    case 'json':
      return Code
    case 'table':
    case 'csv':
      return Grid3X3
    case 'folder':
      return FolderOpen
    case 'website':
      return Globe
    default:
      return FileQuestion
  }
}

// ── Mock data ─────────────────────────────────────────────────────────────

const MOCK_OUTPUTS: AdvancedSystemOutput[] = [
  {
    id: 'mock-1',
    name: 'Quartalsbericht Q4',
    type: 'document',
    advancedType: 'document',
    link: '#',
    createdAt: '2026-01-15T10:30:00Z',
    contentPreview: 'Zusammenfassung der Quartalsergebnisse...',
  },
  {
    id: 'mock-2',
    name: 'Umsatzdaten 2025',
    type: 'spreadsheet',
    advancedType: 'spreadsheet',
    link: '#',
    createdAt: '2026-01-12T14:00:00Z',
    contentPreview: 'Umsatz, Kosten, Gewinn nach Monat',
  },
  {
    id: 'mock-3',
    name: 'Willkommens-E-Mail',
    type: 'email',
    advancedType: 'email',
    link: '#',
    createdAt: '2026-01-10T09:15:00Z',
    contentPreview: 'Betreff: Willkommen bei Flowstack!',
  },
  {
    id: 'mock-4',
    name: 'Hero Banner',
    type: 'image',
    advancedType: 'image',
    link: 'https://placehold.co/800x400/1a1a2e/e0e0e0?text=Hero+Banner',
    createdAt: '2026-01-08T16:45:00Z',
    advancedData: {
      imageUrl: 'https://placehold.co/800x400/1a1a2e/e0e0e0?text=Hero+Banner',
    },
  },
  {
    id: 'mock-5',
    name: 'API-Antwort Kundendaten',
    type: 'other',
    advancedType: 'json',
    link: '#',
    createdAt: '2026-01-06T11:20:00Z',
    advancedData: {
      jsonData: {
        status: 'success',
        kunden: [
          { id: 1, name: 'Müller GmbH', umsatz: 125000 },
          { id: 2, name: 'Schmidt AG', umsatz: 89000 },
        ],
        meta: { seite: 1, gesamt: 42 },
      },
    },
  },
  {
    id: 'mock-6',
    name: 'Kontaktliste Export',
    type: 'other',
    advancedType: 'table',
    link: '#',
    createdAt: '2026-01-04T08:00:00Z',
    advancedData: {
      tableHeaders: ['Name', 'E-Mail', 'Status'],
      tableRows: [
        ['Anna Meier', 'anna@example.de', 'Aktiv'],
        ['Ben Schulz', 'ben@example.de', 'Inaktiv'],
        ['Clara Wolf', 'clara@example.de', 'Aktiv'],
      ],
    },
  },
]

// ── JSON Tree Node (interactive, recursive) ──────────────────────────────

function JsonTreeNode({
  keyName,
  value,
  depth = 0,
}: {
  keyName?: string
  value: unknown
  depth?: number
}) {
  const [expanded, setExpanded] = useState(depth < 2)

  if (value === null) {
    return (
      <div className="flex items-center gap-1" style={{ paddingLeft: depth * 16 }}>
        {keyName != null && <span className="text-purple-400 font-medium">{keyName}:</span>}
        <span className="text-gray-400 italic">null</span>
      </div>
    )
  }

  if (typeof value === 'boolean') {
    return (
      <div className="flex items-center gap-1" style={{ paddingLeft: depth * 16 }}>
        {keyName != null && <span className="text-purple-400 font-medium">{keyName}:</span>}
        <span className="text-amber-400">{value.toString()}</span>
      </div>
    )
  }

  if (typeof value === 'number') {
    return (
      <div className="flex items-center gap-1" style={{ paddingLeft: depth * 16 }}>
        {keyName != null && <span className="text-purple-400 font-medium">{keyName}:</span>}
        <span className="text-blue-400">{value}</span>
      </div>
    )
  }

  if (typeof value === 'string') {
    return (
      <div className="flex items-start gap-1" style={{ paddingLeft: depth * 16 }}>
        {keyName != null && <span className="text-purple-400 font-medium shrink-0">{keyName}:</span>}
        <span className="text-emerald-400 break-all">"{value}"</span>
      </div>
    )
  }

  if (Array.isArray(value)) {
    return (
      <div style={{ paddingLeft: depth * 16 }}>
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 hover:bg-muted/30 rounded px-1 -ml-1 transition-colors"
        >
          <span className="text-muted-foreground text-[10px]">{expanded ? '▼' : '▶'}</span>
          {keyName != null && <span className="text-purple-400 font-medium">{keyName}:</span>}
          <span className="text-muted-foreground">[{value.length}]</span>
        </button>
        {expanded && (
          <div className="border-l border-border/30 ml-2">
            {value.map((item, i) => (
              <JsonTreeNode key={i} keyName={String(i)} value={item} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    )
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
    return (
      <div style={{ paddingLeft: depth * 16 }}>
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 hover:bg-muted/30 rounded px-1 -ml-1 transition-colors"
        >
          <span className="text-muted-foreground text-[10px]">{expanded ? '▼' : '▶'}</span>
          {keyName != null && <span className="text-purple-400 font-medium">{keyName}:</span>}
          <span className="text-muted-foreground">{`{${entries.length}}`}</span>
        </button>
        {expanded && (
          <div className="border-l border-border/30 ml-2">
            {entries.map(([k, v]) => (
              <JsonTreeNode key={k} keyName={k} value={v} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div style={{ paddingLeft: depth * 16 }}>
      {keyName != null && <span className="text-purple-400 font-medium">{keyName}:</span>}
      <span className="text-foreground">{String(value)}</span>
    </div>
  )
}

// ── Table Viewer ─────────────────────────────────────────────────────────

function TableViewer({
  headers,
  rows,
}: {
  headers: string[]
  rows: string[][]
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-muted/50">
            {headers.map((h, i) => (
              <th
                key={i}
                className="px-4 py-2.5 text-left text-xs font-semibold text-foreground border-b border-border"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr
              key={ri}
              className={cn(
                'transition-colors hover:bg-muted/30',
                ri % 2 === 1 && 'bg-muted/10',
              )}
            >
              {row.map((cell, ci) => (
                <td
                  key={ci}
                  className="px-4 py-2 text-xs text-foreground border-b border-border/50"
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── Props ─────────────────────────────────────────────────────────────────

interface OutputViewerProps {
  outputs: AdvancedSystemOutput[]
  className?: string
  compact?: boolean
}

// ── Component ─────────────────────────────────────────────────────────────

export function OutputViewer({ outputs, className, compact }: OutputViewerProps) {
  const items = outputs

  const [activeTab, setActiveTab] = useState<FilterTab>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [search, setSearch] = useState('')
  const [jsonViewerId, setJsonViewerId] = useState<string | null>(null)
  const [lightboxId, setLightboxId] = useState<string | null>(null)
  const [docPreviewId, setDocPreviewId] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  // ── Derived state ─────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    return items.filter((o) => {
      const resolvedType: string = o.advancedType ?? o.type
      const matchesTab = activeTab === 'all' || resolvedType === activeTab
      const matchesSearch =
        !search || o.name.toLowerCase().includes(search.toLowerCase())
      return matchesTab && matchesSearch
    })
  }, [items, activeTab, search])

  const jsonOutput = useMemo(
    () => items.find((o) => o.id === jsonViewerId) ?? null,
    [items, jsonViewerId],
  )

  const lightboxOutput = useMemo(
    () => items.find((o) => o.id === lightboxId) ?? null,
    [items, lightboxId],
  )

  // ── Handlers ──────────────────────────────────────────────────────────

  const [tableViewerId, setTableViewerId] = useState<string | null>(null)

  const tableOutput = useMemo(
    () => items.find((o) => o.id === tableViewerId) ?? null,
    [items, tableViewerId],
  )

  const docPreviewOutput = useMemo(
    () => items.find((o) => o.id === docPreviewId) ?? null,
    [items, docPreviewId],
  )

  function handleCardClick(output: AdvancedSystemOutput) {
    const resolvedType = output.advancedType ?? output.type
    if (resolvedType === 'json' && output.advancedData?.jsonData !== undefined) {
      setJsonViewerId(output.id)
      return
    }
    if ((resolvedType === 'table' || resolvedType === 'csv') && output.advancedData?.tableHeaders) {
      setTableViewerId(output.id)
      return
    }
    if (resolvedType === 'image') {
      setLightboxId(output.id)
      return
    }
    // Real external link → open in new tab
    if (output.link && output.link !== '#') {
      window.open(output.link, '_blank', 'noopener')
      return
    }
    // No real link → show document preview modal
    setDocPreviewId(output.id)
  }

  function handleCopyJson() {
    if (!jsonOutput?.advancedData?.jsonData) return
    navigator.clipboard.writeText(
      JSON.stringify(jsonOutput.advancedData.jsonData, null, 2),
    )
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // ── Render helpers ────────────────────────────────────────────────────

  function renderCard(output: AdvancedSystemOutput) {
    const resolvedType = output.advancedType ?? output.type
    const Icon = outputIcon(resolvedType)
    const isGrid = viewMode === 'grid'
    const hasRealLink = output.link && output.link !== '#'
    const hasInlinePreview =
      (resolvedType === 'json' && output.advancedData?.jsonData !== undefined) ||
      ((resolvedType === 'table' || resolvedType === 'csv') && output.advancedData?.tableHeaders) ||
      resolvedType === 'image'

    // Determine hover action icon
    const ActionIcon = hasRealLink && !hasInlinePreview ? ExternalLink : Eye

    return (
      <button
        key={output.id}
        onClick={() => handleCardClick(output)}
        className={cn(
          'group relative rounded-xl border border-border bg-card text-left',
          'hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5',
          'transition-all duration-200',
          isGrid ? 'p-4' : 'flex items-center gap-4 px-4 py-3',
        )}
      >
        {/* Icon */}
        <div
          className={cn(
            'flex items-center justify-center rounded-lg bg-primary/10 text-primary',
            isGrid ? 'h-10 w-10' : 'h-9 w-9 shrink-0',
          )}
        >
          <Icon className={cn(isGrid ? 'h-5 w-5' : 'h-4 w-4')} />
        </div>

        {/* Content */}
        <div className={cn(isGrid ? 'mt-3' : 'min-w-0 flex-1')}>
          <p
            className={cn(
              'font-semibold text-foreground truncate',
              isGrid ? 'text-sm' : 'text-sm',
            )}
          >
            {output.name}
          </p>
          {output.contentPreview && isGrid && (
            <p className="mt-1 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
              {output.contentPreview}
            </p>
          )}
          <div
            className={cn(
              'flex items-center gap-2 text-[11px] text-muted-foreground/70',
              isGrid ? 'mt-2' : 'mt-0.5',
            )}
          >
            <span>{formatDate(output.createdAt)}</span>
            {output.durationMs != null && output.durationMs > 0 && (
              <span className="inline-flex items-center gap-0.5 rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                <Timer className="h-2.5 w-2.5" />
                {formatDuration(output.durationMs)}
              </span>
            )}
          </div>
        </div>

        {/* Action indicators */}
        <div
          className={cn(
            'flex items-center gap-1',
            'opacity-0 group-hover:opacity-100 transition-opacity',
            isGrid ? 'absolute right-3 top-3' : 'shrink-0',
          )}
        >
          {hasRealLink && (
            <a
              href={output.link!}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
              title="Extern öffnen"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          )}
          {hasInlinePreview && (
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <Eye className="h-4 w-4" />
            </div>
          )}
        </div>
      </button>
    )
  }

  // ── Main render ───────────────────────────────────────────────────────

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {/* Toolbar: search + view toggle */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Ergebnisse durchsuchen..."
            className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary/30 outline-none transition-all"
          />
        </div>

        <div className="flex rounded-lg border border-border bg-background p-0.5">
          <button
            onClick={() => setViewMode('grid')}
            className={cn(
              'rounded-md p-1.5 transition-colors',
              viewMode === 'grid'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
            title="Rasteransicht"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={cn(
              'rounded-md p-1.5 transition-colors',
              viewMode === 'list'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
            title="Listenansicht"
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'rounded-full px-3 py-1 text-xs font-medium transition-colors',
              activeTab === tab.key
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:text-foreground',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Output grid / list */}
      {filtered.length > 0 ? (
        <div
          className={cn(
            viewMode === 'grid'
              ? compact
                ? 'grid grid-cols-1 gap-3'
                : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3'
              : 'flex flex-col gap-2',
          )}
        >
          {filtered.map(renderCard)}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
          <FileQuestion className="h-10 w-10 text-muted-foreground/40" />
          <p className="mt-3 text-sm font-medium text-muted-foreground">
            Keine Ergebnisse vorhanden
          </p>
          <p className="mt-1 text-xs text-muted-foreground/70">
            {search
              ? 'Versuche einen anderen Suchbegriff'
              : 'Sobald ein System ausgeführt wird, erscheinen Ergebnisse hier'}
          </p>
        </div>
      )}

      {/* ── JSON Viewer Overlay ──────────────────────────────────────────── */}
      {jsonOutput && jsonOutput.advancedData?.jsonData !== undefined && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => {
              setJsonViewerId(null)
              setCopied(false)
            }}
          />
          <div className="relative w-full max-w-2xl rounded-2xl border border-border bg-card shadow-2xl animate-scale-in">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Code className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">
                    {jsonOutput.name}
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    JSON-Ausgabe &middot; {formatDate(jsonOutput.createdAt)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={handleCopyJson}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                      <span className="text-emerald-500">Kopiert</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      Kopieren
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setJsonViewerId(null)
                    setCopied(false)
                  }}
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* JSON content — interactive tree */}
            <div className="max-h-[60vh] overflow-auto p-6">
              <div className="rounded-lg bg-background border border-border p-4 text-xs leading-relaxed font-mono">
                <JsonTreeNode value={jsonOutput.advancedData.jsonData} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Table Viewer Overlay ─────────────────────────────────────────── */}
      {tableOutput && tableOutput.advancedData?.tableHeaders && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setTableViewerId(null)}
          />
          <div className="relative w-full max-w-3xl rounded-2xl border border-border bg-card shadow-2xl animate-scale-in">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Grid3X3 className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">
                    {tableOutput.name}
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    Tabelle &middot; {tableOutput.advancedData.tableRows?.length ?? 0} Zeilen
                  </p>
                </div>
              </div>
              <button
                onClick={() => setTableViewerId(null)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Table content */}
            <div className="max-h-[60vh] overflow-auto p-6">
              <TableViewer
                headers={tableOutput.advancedData.tableHeaders}
                rows={tableOutput.advancedData.tableRows ?? []}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Image Lightbox Overlay ───────────────────────────────────────── */}
      {lightboxOutput && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setLightboxId(null)}
          />
          <div className="relative flex max-h-[85vh] max-w-4xl flex-col items-center animate-scale-in">
            {/* Close button */}
            <button
              onClick={() => setLightboxId(null)}
              className="absolute -right-2 -top-2 z-10 rounded-full bg-card border border-border p-1.5 text-muted-foreground hover:bg-muted transition-colors shadow-lg"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Image */}
            <img
              src={
                lightboxOutput.advancedData?.imageUrl ?? lightboxOutput.link
              }
              alt={lightboxOutput.name}
              className="max-h-[75vh] rounded-xl border border-border object-contain shadow-2xl"
            />

            {/* Caption */}
            <div className="mt-3 rounded-lg bg-card/90 border border-border px-4 py-2 backdrop-blur-sm">
              <p className="text-sm font-semibold text-foreground">
                {lightboxOutput.name}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {formatDate(lightboxOutput.createdAt)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Document Preview Overlay ──────────────────────────────────────── */}
      {docPreviewOutput && (() => {
        const resolvedType = docPreviewOutput.advancedType ?? docPreviewOutput.type
        const DocIcon = outputIcon(resolvedType)
        const hasLink = docPreviewOutput.link && docPreviewOutput.link !== '#'
        const TYPE_LABELS: Record<string, string> = {
          document: 'Dokument',
          spreadsheet: 'Tabelle',
          email: 'E-Mail',
          website: 'Webseite',
          folder: 'Ordner',
          other: 'Sonstige',
        }
        return (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setDocPreviewId(null)}
            />
            <div className="relative w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl animate-scale-in">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-border px-6 py-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                    <DocIcon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-foreground truncate">
                      {docPreviewOutput.name}
                    </h3>
                    <p className="text-[11px] text-muted-foreground">
                      {TYPE_LABELS[resolvedType] ?? resolvedType} &middot; {formatDate(docPreviewOutput.createdAt)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setDocPreviewId(null)}
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted transition-colors shrink-0"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Content */}
              <div className="px-6 py-5 space-y-4">
                {docPreviewOutput.contentPreview ? (
                  <div className="rounded-lg bg-muted/50 border border-border p-4">
                    <p className="text-sm text-foreground leading-relaxed">
                      {docPreviewOutput.contentPreview}
                    </p>
                  </div>
                ) : (
                  <div className="rounded-lg bg-muted/30 border border-dashed border-border p-6 text-center">
                    <DocIcon className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">
                      Vorschau wird nach Ausführung verfügbar
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {hasLink && (
                    <button
                      onClick={() => {
                        window.open(docPreviewOutput.link, '_blank', 'noopener')
                        setDocPreviewId(null)
                      }}
                      className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Öffnen
                    </button>
                  )}
                  <button
                    onClick={() => setDocPreviewId(null)}
                    className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  >
                    Schließen
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
