import React, { useState, useEffect, useMemo, useCallback, useSyncExternalStore } from 'react'
import { cn } from '@/shared/lib/utils'
import { useLanguage } from '@/core/i18n/context'
import { getDriveCache, subscribeDriveCache, refreshDrive, refreshGmail, removeDriveFile } from '@/core/drive-cache'
import {
  Search,
  FileText,
  Table2,
  Presentation,
  Mail,
  Star,
  ExternalLink,
  Eye,
  RefreshCw,
  FolderOpen,
  Loader2,
  Inbox,
  Send,
  Paperclip,
  LayoutGrid,
  List,
  ChevronDown,
  RotateCcw,
  SlidersHorizontal,
  PanelLeftClose,
  PanelLeft,
  ChevronRight,
  ArrowLeft,
  X,
  Trash2,
  Tag,
  Check,
} from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────

interface DriveFile {
  id: string
  name: string
  type: 'docs' | 'sheets' | 'slides' | 'other'
  mimeType: string
  category: string
  subcategory: string
  documentType: string
  project: string
  tags: string[]
  url: string
  folder: string
  folderId: string
  modifiedTime: string
  createdTime: string
  owner: string
  starred: boolean
  thumbnailUrl: string
  account: string
}

interface GmailMessage {
  id: string
  subject: string
  from: string
  to: string
  date: string
  snippet: string
  category: string
  tags: string[]
  url: string
  starred: boolean
}

type VaultTab = 'drive' | 'gmail'
type ViewMode = 'grid' | 'list'

// ── Config ────────────────────────────────────────────────────────────────

const DRIVE_CATEGORY_COLORS: Record<string, string> = {
  'client-output': '#6366f1',
  sales: '#ef4444',
  leads: '#f97316',
  strategie: '#8b5cf6',
  copywriting: '#f59e0b',
  tracking: '#3b82f6',
  finanzen: '#10b981',
  templates: '#d946ef',
  training: '#f472b6',
  content: '#fb923c',
  ads: '#e11d48',
  prozesse: '#14b8a6',
  flowstack: '#06b6d4',
  demo: '#14b8a6',
  umfragen: '#ec4899',
  onboarding: '#0ea5e9',
  angebote: '#a3e635',
  notizen: '#94a3b8',
  'baulig-roh': '#a855f7',
  sonstiges: '#6b7280',
}

const GMAIL_CATEGORY_COLORS: Record<string, string> = {
  clients: '#8b5cf6',
  invoices: '#10b981',
  automation: '#3b82f6',
  meetings: '#06b6d4',
  recruiting: '#f59e0b',
  sonstiges: '#6b7280',
}

// Sub-Kategorien für Sales (hierarchisch)
const SALES_SUBCATEGORIES: Record<string, { label: string; color: string }> = {
  'cold-call': { label: 'Cold Call', color: '#dc2626' },
  gatekeeper: { label: 'Gatekeeper', color: '#b91c1c' },
  pvc: { label: 'PVC', color: '#ef4444' },
  dmc: { label: 'DMC', color: '#f87171' },
  testkunden: { label: 'Testkunden', color: '#f59e0b' },
  setting: { label: 'Setting', color: '#ea580c' },
  closing: { label: 'Closing', color: '#c2410c' },
  'cold-email': { label: 'Cold Email', color: '#fb923c' },
  linkedin: { label: 'LinkedIn', color: '#0077b5' },
  einwand: { label: 'Einwandbehandlung', color: '#991b1b' },
  allgemein: { label: 'Allgemein', color: '#fca5a5' },
}

const DRIVE_CATEGORIES: Record<string, { label: string; color: string }> = {
  'client-output': { label: 'Client-Deliverables', color: '#6366f1' },
  sales: { label: 'Sales & Akquise', color: '#ef4444' },
  leads: { label: 'Leads', color: '#f97316' },
  strategie: { label: 'Strategie & Analyse', color: '#8b5cf6' },
  copywriting: { label: 'Copywriting', color: '#f59e0b' },
  tracking: { label: 'Tracking & Analytics', color: '#3b82f6' },
  finanzen: { label: 'Finanzen & Buchhaltung', color: '#10b981' },
  templates: { label: 'Vorlagen', color: '#d946ef' },
  training: { label: 'Training & Schulung', color: '#f472b6' },
  content: { label: 'Content & Social Media', color: '#fb923c' },
  ads: { label: 'Werbeanzeigen & Ads', color: '#e11d48' },
  prozesse: { label: 'Prozesse & SOPs', color: '#14b8a6' },
  flowstack: { label: 'Flowstack', color: '#06b6d4' },
  demo: { label: 'Demo', color: '#14b8a6' },
  umfragen: { label: 'Umfragen', color: '#ec4899' },
  onboarding: { label: 'Onboarding', color: '#0ea5e9' },
  bewerbungen: { label: 'Bewerbungen & Karriere', color: '#7c3aed' },
  angebote: { label: 'Angebote & Pitches', color: '#a3e635' },
  notizen: { label: 'Notizen & Ideen', color: '#94a3b8' },
  'baulig-roh': { label: 'Baulig Roh', color: '#a855f7' },
  sonstiges: { label: 'Sonstiges', color: '#6b7280' },
}

// Dokument-Art Config (für Facetten-Filter)
const DOCUMENT_TYPES: Record<string, { label: string; color: string }> = {
  skript: { label: 'Skript', color: '#dc2626' },
  template: { label: 'Template', color: '#d946ef' },
  leadliste: { label: 'Leadliste', color: '#f97316' },
  training: { label: 'Training', color: '#f472b6' },
  tracker: { label: 'Tracker', color: '#3b82f6' },
  analyse: { label: 'Analyse', color: '#8b5cf6' },
  notizen: { label: 'Notizen', color: '#94a3b8' },
  angebot: { label: 'Angebot', color: '#a3e635' },
  checkliste: { label: 'Checkliste', color: '#14b8a6' },
  tabelle: { label: 'Tabelle', color: '#0f9d58' },
}

// Quell-Filter Config
const SOURCE_FILTERS: Record<string, { label: string; color: string }> = {
  eigen: { label: 'Eigen', color: '#10b981' },
  'baulig-roh': { label: 'Baulig Roh', color: '#a855f7' },
}

// Projekt/Zielgruppen Config
const PROJECT_CONFIG: Record<string, { label: string; color: string; group: 'zg' | 'client' | 'intern' }> = {
  // Zielgruppen
  sma: { label: 'SMA', color: '#f97316', group: 'zg' },
  shk: { label: 'SHK / Handwerk', color: '#84cc16', group: 'zg' },
  immobilien: { label: 'Immobilien', color: '#a855f7', group: 'zg' },
  recruiting: { label: 'Recruiting', color: '#ec4899', group: 'zg' },
  ecommerce: { label: 'E-Commerce', color: '#06b6d4', group: 'zg' },
  beauty: { label: 'Beauty', color: '#f472b6', group: 'zg' },
  b2b: { label: 'B2B', color: '#3b82f6', group: 'zg' },
  b2c: { label: 'B2C', color: '#8b5cf6', group: 'zg' },
  // Kunden
  novacode: { label: 'Novacode', color: '#6366f1', group: 'client' },
  hussein: { label: 'Hussein', color: '#ef4444', group: 'client' },
  sarullo: { label: 'Sarullo', color: '#f59e0b', group: 'client' },
  petri: { label: 'Petri', color: '#10b981', group: 'client' },
  benjamin: { label: 'Benjamin', color: '#14b8a6', group: 'client' },
  maurice: { label: 'Maurice/MWS', color: '#d946ef', group: 'client' },
  maryelle: { label: 'Maryelle', color: '#f472b6', group: 'client' },
  martin: { label: 'Martin', color: '#0ea5e9', group: 'client' },
  lukas: { label: 'Lukas', color: '#84cc16', group: 'client' },
  kck: { label: 'KCK', color: '#a855f7', group: 'client' },
  alentis: { label: 'Alentis', color: '#06b6d4', group: 'client' },
  kamo: { label: 'Kamo', color: '#f97316', group: 'client' },
  levi: { label: 'Levi', color: '#22c55e', group: 'client' },
  // Intern
  flowstack: { label: 'Flowstack', color: '#06b6d4', group: 'intern' },
  leadflow: { label: 'Leadflow', color: '#8b5cf6', group: 'intern' },
}

// Quick Views — voreingestellte Filter-Kombinationen
const QUICK_VIEWS = [
  { id: 'all-scripts', label: 'Alle Skripte', icon: '📝', filters: { documentType: ['skript'] } },
  { id: 'cold-call', label: 'Cold Call', icon: '📞', filters: { category: ['sales'], subcategory: ['cold-call'] } },
  { id: 'gatekeeper', label: 'Gatekeeper', icon: '🚪', filters: { category: ['sales'], subcategory: ['gatekeeper'] } },
  { id: 'pvc', label: 'PVC', icon: '🎯', filters: { category: ['sales'], subcategory: ['pvc'] } },
  { id: 'dmc', label: 'DMC', icon: '📋', filters: { category: ['sales'], subcategory: ['dmc'] } },
  { id: 'testkunden', label: 'Testkunden', icon: '🧪', filters: { category: ['sales'], subcategory: ['testkunden'] } },
  { id: 'templates', label: 'Alle Templates', icon: '📄', filters: { documentType: ['template'] } },
  { id: 'leads', label: 'Leadlisten', icon: '📊', filters: { documentType: ['leadliste'] } },
  { id: 'baulig', label: 'Baulig Roh', icon: '🎓', filters: { source: ['baulig-roh'] } },
  { id: 'bewerbungen', label: 'Bewerbungen', icon: '💼', filters: { category: ['bewerbungen'] } },
] as const

const GMAIL_CATEGORIES: Record<string, { label: string; color: string }> = {
  clients: { label: 'Clients', color: '#8b5cf6' },
  invoices: { label: 'Rechnungen', color: '#10b981' },
  automation: { label: 'Automation', color: '#3b82f6' },
  meetings: { label: 'Meetings', color: '#06b6d4' },
  recruiting: { label: 'Recruiting', color: '#f59e0b' },
  sonstiges: { label: 'Sonstiges', color: '#6b7280' },
}

const DOC_TYPE_CONFIG: Record<string, { icon: typeof FileText; label: string; color: string }> = {
  docs: { icon: FileText, label: 'Dokument', color: '#4285f4' },
  sheets: { icon: Table2, label: 'Spreadsheet', color: '#0f9d58' },
  slides: { icon: Presentation, label: 'Präsentation', color: '#f4b400' },
  other: { icon: FileText, label: 'Datei', color: '#71717a' },
}

const BACKEND_URL = 'http://localhost:3002'

// ── Helpers ───────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 60) return `vor ${diffMin}m`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `vor ${diffH}h`
  const diffD = Math.floor(diffH / 24)
  if (diffD < 30) return `vor ${diffD}d`
  return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '--'
  return new Date(dateStr).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function extractName(fromStr: string): string {
  const match = fromStr.match(/^"?([^"<]+)"?\s*</)
  return match ? match[1].trim() : fromStr.replace(/<.*>/, '').trim()
}

// ── CollapsibleSection ────────────────────────────────────────────────────

function CollapsibleSection({ title, count, defaultOpen = true, children }: {
  title: string; count?: number; defaultOpen?: boolean; children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="group/section">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full px-5 py-3 text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-[0.08em] hover:text-foreground/90 transition-colors duration-200"
      >
        <div className="flex items-center gap-2">
          {title}
          {count != null && count > 0 && (
            <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-md bg-primary/10 px-1 text-[9px] font-bold text-primary tabular-nums">
              {count}
            </span>
          )}
        </div>
        <ChevronDown className={cn('h-3 w-3 opacity-40 transition-all duration-300', open ? 'rotate-180 opacity-60' : '')} />
      </button>
      <div className={cn('grid transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]', open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0')}>
        <div className="overflow-hidden">
          <div className="px-5 pb-4">{children}</div>
        </div>
      </div>
      <div className="mx-5 h-px bg-border/40" />
    </div>
  )
}

// ── Component ─────────────────────────────────────────────────────────────

export function DriveVault() {
  const { t } = useLanguage()
  const [activeTab, setActiveTab] = useState<VaultTab>('drive')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string[]>([])
  const [subcategoryFilter, setSubcategoryFilter] = useState<string[]>([])
  const [docTypeFilter, setDocTypeFilter] = useState<string[]>([])
  const [documentTypeFilter, setDocumentTypeFilter] = useState<string[]>([])
  const [accountFilter, setAccountFilter] = useState<string[]>([])
  const [sourceFilter, setSourceFilter] = useState<string[]>([])
  const [projectFilter, setProjectFilter] = useState<string[]>([])
  const [tagFilter, setTagFilter] = useState<string[]>([])
  const [folderFilter, setFolderFilter] = useState<string | null>(null)
  const [filterPanelOpen, setFilterPanelOpen] = useState(true)
  const [previewFile, setPreviewFile] = useState<DriveFile | null>(null)
  const [activeQuickView, setActiveQuickView] = useState<string | null>(null)

  // Drive & Gmail aus globalem Cache (prefetched beim App-Start)
  const cache = useSyncExternalStore(subscribeDriveCache, getDriveCache)
  const driveFiles = cache.driveFiles as DriveFile[]
  const emails = cache.emails as GmailMessage[]
  const driveLoading = cache.driveLoading
  const gmailLoading = cache.gmailLoading

  const retagFile = useCallback(async (fileId: string, category: string) => {
    try {
      const resp = await fetch(`${BACKEND_URL}/api/drive-vault/retag`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file_id: fileId, category }),
      })
      if (resp.ok) {
        // Refresh to pick up the new category
        refreshDrive()
      }
    } catch (err) {
      console.warn('Retag failed:', err)
    }
  }, [])

  const deleteFile = useCallback(async (fileId: string) => {
    try {
      const resp = await fetch(`${BACKEND_URL}/api/drive-vault/${fileId}`, { method: 'DELETE' })
      if (resp.ok) {
        removeDriveFile(fileId)
        if (previewFile?.id === fileId) setPreviewFile(null)
      }
    } catch (err) {
      console.warn('Delete failed:', err)
    }
  }, [previewFile])

  // ── Derived data ──────────────────────────────────────────────────

  const categories = activeTab === 'drive' ? DRIVE_CATEGORIES : GMAIL_CATEGORIES
  const isLoading = activeTab === 'drive' ? driveLoading : gmailLoading

  const allTags = useMemo(() => {
    const set = new Set<string>()
    const items = activeTab === 'drive' ? driveFiles : emails
    for (const item of items) {
      for (const t of item.tags) set.add(t)
    }
    return Array.from(set).sort()
  }, [activeTab, driveFiles, emails])

  const allFolders = useMemo(() => {
    const map = new Map<string, { name: string; id: string; count: number }>()
    for (const f of driveFiles) {
      if (f.folder && f.folderId) {
        const existing = map.get(f.folderId)
        if (existing) existing.count++
        else map.set(f.folderId, { name: f.folder, id: f.folderId, count: 1 })
      }
    }
    return Array.from(map.values()).sort((a, b) => b.count - a.count)
  }, [driveFiles])

  // ── Filtered results ──────────────────────────────────────────────

  // Sub-Kategorien die in den aktuellen Dateien vorkommen (immer berechnen, nicht nur bei Sales-Filter)
  const activeSubcategories = useMemo(() => {
    const subs: Record<string, number> = {}
    for (const f of driveFiles) {
      if (f.subcategory) {
        subs[f.subcategory] = (subs[f.subcategory] || 0) + 1
      }
    }
    return subs
  }, [driveFiles])

  // Dokument-Typen die vorkommen
  const activeDocumentTypes = useMemo(() => {
    const types: Record<string, number> = {}
    for (const f of driveFiles) {
      if (f.documentType) {
        types[f.documentType] = (types[f.documentType] || 0) + 1
      }
    }
    return types
  }, [driveFiles])

  // Account-Counts
  const accountCounts = useMemo(() => {
    const counts: Record<string, number> = { flowstack: 0, leadflow: 0 }
    for (const f of driveFiles) {
      counts[f.account] = (counts[f.account] || 0) + 1
    }
    return counts
  }, [driveFiles])

  // Source-Counts
  const sourceCounts = useMemo(() => {
    const counts: Record<string, number> = { eigen: 0, 'baulig-roh': 0 }
    for (const f of driveFiles) {
      if (f.tags.includes('Baulig Roh')) counts['baulig-roh']++
      if (f.tags.includes('Eigen')) counts['eigen']++
    }
    return counts
  }, [driveFiles])

  // Projekt-Counts
  const projectCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const f of driveFiles) {
      if (f.project) {
        counts[f.project] = (counts[f.project] || 0) + 1
      }
    }
    return counts
  }, [driveFiles])

  // Category-Counts (dynamisch)
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const f of driveFiles) {
      counts[f.category] = (counts[f.category] || 0) + 1
    }
    return counts
  }, [driveFiles])

  const filteredDrive = useMemo(() => {
    let result = driveFiles
    if (accountFilter.length > 0) result = result.filter((f) => accountFilter.includes(f.account))
    if (categoryFilter.length > 0) result = result.filter((f) => categoryFilter.includes(f.category))
    if (subcategoryFilter.length > 0) result = result.filter((f) => subcategoryFilter.includes(f.subcategory))
    if (docTypeFilter.length > 0) result = result.filter((f) => docTypeFilter.includes(f.type))
    if (documentTypeFilter.length > 0) result = result.filter((f) => documentTypeFilter.includes(f.documentType))
    if (projectFilter.length > 0) result = result.filter((f) => projectFilter.includes(f.project))
    if (sourceFilter.length > 0) {
      result = result.filter((f) => {
        if (sourceFilter.includes('baulig-roh') && f.tags.includes('Baulig Roh')) return true
        if (sourceFilter.includes('eigen') && f.tags.includes('Eigen')) return true
        return false
      })
    }
    if (tagFilter.length > 0) result = result.filter((f) => tagFilter.some((t) => f.tags.includes(t)))
    if (folderFilter) result = result.filter((f) => f.folderId === folderFilter)
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (f) => f.name.toLowerCase().includes(q) || f.folder.toLowerCase().includes(q) || f.tags.some((t) => t.toLowerCase().includes(q)),
      )
    }
    return result
  }, [driveFiles, accountFilter, categoryFilter, subcategoryFilter, docTypeFilter, documentTypeFilter, projectFilter, sourceFilter, tagFilter, folderFilter, search])

  const filteredEmails = useMemo(() => {
    let result = emails
    if (categoryFilter.length > 0) result = result.filter((e) => categoryFilter.includes(e.category))
    if (tagFilter.length > 0) result = result.filter((e) => tagFilter.some((t) => e.tags.includes(t)))
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (e) => e.subject.toLowerCase().includes(q) || e.from.toLowerCase().includes(q) || e.snippet.toLowerCase().includes(q),
      )
    }
    return result
  }, [emails, categoryFilter, tagFilter, search])

  // ── Handlers ──────────────────────────────────────────────────────

  const handleSearch = () => {
    if (activeTab === 'drive') refreshDrive(search)
    else refreshGmail(search)
  }

  const handleTabChange = (tab: VaultTab) => {
    setActiveTab(tab)
    resetFilters()
  }

  const toggleCategory = (cat: string) => {
    setActiveQuickView(null)
    setCategoryFilter((prev) => {
      const next = prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
      if (cat === 'sales' && prev.includes('sales')) setSubcategoryFilter([])
      return next
    })
  }

  const toggleSubcategory = (sub: string) => {
    setActiveQuickView(null)
    setSubcategoryFilter((prev) => prev.includes(sub) ? prev.filter((s) => s !== sub) : [...prev, sub])
  }

  const toggleDocType = (dt: string) => {
    setActiveQuickView(null)
    setDocTypeFilter((prev) => prev.includes(dt) ? prev.filter((d) => d !== dt) : [...prev, dt])
  }

  const toggleDocumentType = (dt: string) => {
    setActiveQuickView(null)
    setDocumentTypeFilter((prev) => prev.includes(dt) ? prev.filter((d) => d !== dt) : [...prev, dt])
  }

  const toggleAccount = (acc: string) => {
    setActiveQuickView(null)
    setAccountFilter((prev) => prev.includes(acc) ? prev.filter((a) => a !== acc) : [...prev, acc])
  }

  const toggleSource = (src: string) => {
    setActiveQuickView(null)
    setSourceFilter((prev) => prev.includes(src) ? prev.filter((s) => s !== src) : [...prev, src])
  }

  const toggleProject = (proj: string) => {
    setActiveQuickView(null)
    setProjectFilter((prev) => prev.includes(proj) ? prev.filter((p) => p !== proj) : [...prev, proj])
  }

  const toggleTag = (tag: string) => {
    setActiveQuickView(null)
    setTagFilter((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag])
  }

  const applyQuickView = (viewId: string) => {
    if (activeQuickView === viewId) {
      resetFilters()
      return
    }
    const view = QUICK_VIEWS.find((v) => v.id === viewId)
    if (!view) return
    resetFilters()
    setActiveQuickView(viewId)
    if ('category' in view.filters) setCategoryFilter(view.filters.category as string[])
    if ('subcategory' in view.filters) setSubcategoryFilter(view.filters.subcategory as string[])
    if ('documentType' in view.filters) setDocumentTypeFilter(view.filters.documentType as string[])
    if ('source' in view.filters) setSourceFilter(view.filters.source as string[])
  }

  const activeFilterCount =
    accountFilter.length + categoryFilter.length + subcategoryFilter.length + docTypeFilter.length
    + documentTypeFilter.length + sourceFilter.length + projectFilter.length + tagFilter.length + (folderFilter ? 1 : 0) + (search ? 1 : 0)

  const resetFilters = () => {
    setCategoryFilter([])
    setSubcategoryFilter([])
    setDocTypeFilter([])
    setDocumentTypeFilter([])
    setAccountFilter([])
    setSourceFilter([])
    setProjectFilter([])
    setTagFilter([])
    setFolderFilter(null)
    setSearch('')
    setActiveQuickView(null)
  }

  const currentFolderName = folderFilter ? allFolders.find((f) => f.id === folderFilter)?.name : null

  // ── Render ────────────────────────────────────────────────────────

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* ── Filter Panel (Desktop) ──────────────────────────────── */}
      <aside
        className={cn(
          'shrink-0 border-r border-border/60 bg-card/80 backdrop-blur-xl overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
          filterPanelOpen ? 'w-[272px]' : 'w-0',
          'hidden lg:block',
        )}
      >
        <div className="w-[272px] h-full overflow-y-auto flex flex-col [&::-webkit-scrollbar]:w-[3px] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border/50">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border/40 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center h-7 w-7 rounded-lg bg-muted/60">
                <SlidersHorizontal className="h-3.5 w-3.5 text-foreground/70" />
              </div>
              <span className="text-[13px] font-semibold text-foreground tracking-tight">Filter</span>
              {activeFilterCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-md bg-primary px-1.5 text-[10px] font-bold text-primary-foreground tabular-nums">
                  {activeFilterCount}
                </span>
              )}
            </div>
            {activeFilterCount > 0 && (
              <button onClick={resetFilters} className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200">
                <RotateCcw className="h-3 w-3" />
                Reset
              </button>
            )}
          </div>

          {/* Search */}
          <div className="px-5 py-3 border-b border-border/40 shrink-0">
            <div className="relative group/search">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50 group-focus-within/search:text-primary/70 transition-colors duration-200" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder={activeTab === 'drive' ? t('drive.search.drive') : t('drive.search.gmail')}
                className={cn(
                  'w-full rounded-xl border border-border/40 bg-muted/20 pl-9 pr-3 py-2 text-[13px]',
                  'text-foreground placeholder:text-muted-foreground/40',
                  'focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary/30 focus:bg-background',
                  'transition-all duration-200',
                )}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {/* Tab Switcher */}
            <div className="px-5 py-3">
              <div className="flex gap-1 rounded-xl bg-muted/40 p-1">
                <button
                  onClick={() => handleTabChange('drive')}
                  className={cn(
                    'flex-1 rounded-lg px-3 py-1.5 text-[11px] font-medium transition-all duration-200',
                    activeTab === 'drive'
                      ? 'bg-background text-foreground shadow-[0_1px_3px_rgba(0,0,0,0.08)] ring-1 ring-border/30'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  <FileText className="mr-1.5 inline h-3 w-3" />
                  Drive ({driveFiles.length})
                </button>
                <button
                  onClick={() => handleTabChange('gmail')}
                  className={cn(
                    'flex-1 rounded-lg px-3 py-1.5 text-[11px] font-medium transition-all duration-200',
                    activeTab === 'gmail'
                      ? 'bg-background text-foreground shadow-[0_1px_3px_rgba(0,0,0,0.08)] ring-1 ring-border/30'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  <Mail className="mr-1.5 inline h-3 w-3" />
                  Gmail ({emails.length})
                </button>
              </div>
            </div>
            <div className="mx-5 h-px bg-border/40" />

            {activeTab === 'drive' && (
              <>
                {/* Quick Views */}
                <CollapsibleSection title="Quick Views" count={activeQuickView ? 1 : 0}>
                  <div className="grid grid-cols-2 gap-1.5">
                    {QUICK_VIEWS.map((view) => {
                      const isActive = activeQuickView === view.id
                      return (
                        <button
                          key={view.id}
                          onClick={() => applyQuickView(view.id)}
                          className={cn(
                            'group/qv flex items-center gap-2 rounded-xl px-2.5 py-2 text-[11px] font-medium',
                            'border transition-all duration-200',
                            isActive
                              ? 'border-primary/30 bg-primary/8 text-primary shadow-[0_0_0_1px_rgba(var(--primary-rgb),0.1),0_2px_8px_rgba(var(--primary-rgb),0.08)]'
                              : 'border-border/30 text-muted-foreground hover:border-border/60 hover:text-foreground hover:bg-muted/40 hover:shadow-[0_1px_3px_rgba(0,0,0,0.04)]',
                          )}
                        >
                          <span className={cn('text-xs transition-transform duration-200', isActive ? 'scale-110' : 'group-hover/qv:scale-105')}>{view.icon}</span>
                          {view.label}
                        </button>
                      )
                    })}
                  </div>
                </CollapsibleSection>

                {/* Account Filter */}
                <CollapsibleSection title="Account" count={accountFilter.length}>
                  <div className="flex gap-2">
                    {[
                      { key: 'flowstack', label: 'Flowstack', color: '#06b6d4' },
                      { key: 'leadflow', label: 'Leadflow', color: '#8b5cf6' },
                    ].map(({ key, label, color }) => {
                      const isActive = accountFilter.includes(key)
                      const count = accountCounts[key] || 0
                      return (
                        <button
                          key={key}
                          onClick={() => toggleAccount(key)}
                          className={cn(
                            'flex-1 flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-[11px] font-semibold',
                            'transition-all duration-200',
                            isActive
                              ? 'text-white shadow-[0_2px_8px_rgba(0,0,0,0.15)]'
                              : 'bg-muted/30 text-muted-foreground hover:text-foreground hover:bg-muted/50 ring-1 ring-border/30',
                          )}
                          style={isActive ? { background: `linear-gradient(135deg, ${color}, ${color}dd)` } : undefined}
                        >
                          <span className={cn('h-2 w-2 rounded-full shrink-0 transition-all duration-200', isActive ? 'bg-white/90 scale-75' : '')} style={!isActive ? { backgroundColor: color } : undefined} />
                          {label}
                          <span className={cn('text-[10px] font-medium tabular-nums', isActive ? 'text-white/70' : 'opacity-40')}>{count}</span>
                        </button>
                      )
                    })}
                  </div>
                </CollapsibleSection>

                {/* Bereich (Kategorie) */}
                <CollapsibleSection title="Bereich" count={categoryFilter.length}>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(DRIVE_CATEGORIES)
                      .filter(([key]) => (categoryCounts[key] || 0) > 0)
                      .sort((a, b) => (categoryCounts[b[0]] || 0) - (categoryCounts[a[0]] || 0))
                      .map(([key, cfg]) => {
                        const isActive = categoryFilter.includes(key)
                        const count = categoryCounts[key] || 0
                        return (
                          <button
                            key={key}
                            onClick={() => toggleCategory(key)}
                            className={cn(
                              'group/tag inline-flex items-center gap-1.5 rounded-lg px-2.5 py-[5px] text-[11px] font-medium',
                              'transition-all duration-200',
                              isActive
                                ? 'text-white shadow-[0_1px_4px_rgba(0,0,0,0.12)]'
                                : 'bg-muted/25 text-muted-foreground ring-1 ring-border/25 hover:ring-border/50 hover:text-foreground hover:bg-muted/40',
                            )}
                            style={isActive ? { background: `linear-gradient(135deg, ${cfg.color}, ${cfg.color}cc)` } : undefined}
                          >
                            {!isActive && <span className="h-1.5 w-1.5 rounded-full shrink-0 transition-transform duration-200 group-hover/tag:scale-125" style={{ backgroundColor: cfg.color }} />}
                            {cfg.label}
                            <span className={cn('text-[10px] tabular-nums', isActive ? 'text-white/60' : 'opacity-35')}>
                              {count}
                            </span>
                          </button>
                        )
                      })}
                  </div>
                </CollapsibleSection>

                {/* Sales-Typ (immer sichtbar wenn Subcategories vorhanden) */}
                {Object.keys(activeSubcategories).length > 0 && (
                  <CollapsibleSection title="Sales-Typ" count={subcategoryFilter.length} defaultOpen={categoryFilter.includes('sales')}>
                    <div className="flex flex-wrap gap-1.5">
                      {Object.entries(SALES_SUBCATEGORIES)
                        .filter(([key]) => key in activeSubcategories)
                        .map(([key, cfg]) => {
                          const isActive = subcategoryFilter.includes(key)
                          const count = activeSubcategories[key] || 0
                          return (
                            <button
                              key={key}
                              onClick={() => toggleSubcategory(key)}
                              className={cn(
                                'group/tag inline-flex items-center gap-1.5 rounded-lg px-2.5 py-[5px] text-[11px] font-medium',
                                'transition-all duration-200',
                                isActive
                                  ? 'text-white shadow-[0_1px_4px_rgba(0,0,0,0.12)]'
                                  : 'bg-muted/25 text-muted-foreground ring-1 ring-border/25 hover:ring-border/50 hover:text-foreground hover:bg-muted/40',
                              )}
                              style={isActive ? { background: `linear-gradient(135deg, ${cfg.color}, ${cfg.color}cc)` } : undefined}
                            >
                              {!isActive && <span className="h-1.5 w-1.5 rounded-full shrink-0 transition-transform duration-200 group-hover/tag:scale-125" style={{ backgroundColor: cfg.color }} />}
                              {cfg.label}
                              <span className={cn('text-[10px] tabular-nums', isActive ? 'text-white/60' : 'opacity-35')}>{count}</span>
                            </button>
                          )
                        })}
                    </div>
                  </CollapsibleSection>
                )}

                {/* Dokument-Art */}
                {Object.keys(activeDocumentTypes).length > 0 && (
                  <CollapsibleSection title="Dokument-Art" count={documentTypeFilter.length}>
                    <div className="flex flex-wrap gap-1.5">
                      {Object.entries(DOCUMENT_TYPES)
                        .filter(([key]) => key in activeDocumentTypes)
                        .sort((a, b) => (activeDocumentTypes[b[0]] || 0) - (activeDocumentTypes[a[0]] || 0))
                        .map(([key, cfg]) => {
                          const isActive = documentTypeFilter.includes(key)
                          const count = activeDocumentTypes[key] || 0
                          return (
                            <button
                              key={key}
                              onClick={() => toggleDocumentType(key)}
                              className={cn(
                                'group/tag inline-flex items-center gap-1.5 rounded-lg px-2.5 py-[5px] text-[11px] font-medium',
                                'transition-all duration-200',
                                isActive
                                  ? 'text-white shadow-[0_1px_4px_rgba(0,0,0,0.12)]'
                                  : 'bg-muted/25 text-muted-foreground ring-1 ring-border/25 hover:ring-border/50 hover:text-foreground hover:bg-muted/40',
                              )}
                              style={isActive ? { background: `linear-gradient(135deg, ${cfg.color}, ${cfg.color}cc)` } : undefined}
                            >
                              {!isActive && <span className="h-1.5 w-1.5 rounded-full shrink-0 transition-transform duration-200 group-hover/tag:scale-125" style={{ backgroundColor: cfg.color }} />}
                              {cfg.label}
                              <span className={cn('text-[10px] tabular-nums', isActive ? 'text-white/60' : 'opacity-35')}>{count}</span>
                            </button>
                          )
                        })}
                    </div>
                  </CollapsibleSection>
                )}

                {/* Projekt / Zielgruppe */}
                {Object.keys(projectCounts).length > 0 && (
                  <CollapsibleSection title="Projekt / ZG" count={projectFilter.length} defaultOpen={false}>
                    <div className="space-y-3">
                      {/* Zielgruppen */}
                      {Object.entries(PROJECT_CONFIG)
                        .filter(([key, cfg]) => cfg.group === 'zg' && key in projectCounts)
                        .sort((a, b) => (projectCounts[b[0]] || 0) - (projectCounts[a[0]] || 0))
                        .length > 0 && (
                        <div>
                          <p className="text-[9px] font-semibold text-muted-foreground/50 uppercase tracking-[0.1em] px-0.5 pb-2">Zielgruppe</p>
                          <div className="flex flex-wrap gap-1.5">
                            {Object.entries(PROJECT_CONFIG)
                              .filter(([key, cfg]) => cfg.group === 'zg' && key in projectCounts)
                              .sort((a, b) => (projectCounts[b[0]] || 0) - (projectCounts[a[0]] || 0))
                              .map(([key, cfg]) => {
                                const isActive = projectFilter.includes(key)
                                const count = projectCounts[key] || 0
                                return (
                                  <button
                                    key={key}
                                    onClick={() => toggleProject(key)}
                                    className={cn(
                                      'group/tag inline-flex items-center gap-1.5 rounded-lg px-2.5 py-[5px] text-[11px] font-medium',
                                      'transition-all duration-200',
                                      isActive
                                        ? 'text-white shadow-[0_1px_4px_rgba(0,0,0,0.12)]'
                                        : 'bg-muted/25 text-muted-foreground ring-1 ring-border/25 hover:ring-border/50 hover:text-foreground hover:bg-muted/40',
                                    )}
                                    style={isActive ? { background: `linear-gradient(135deg, ${cfg.color}, ${cfg.color}cc)` } : undefined}
                                  >
                                    {!isActive && <span className="h-1.5 w-1.5 rounded-full shrink-0 transition-transform duration-200 group-hover/tag:scale-125" style={{ backgroundColor: cfg.color }} />}
                                    {cfg.label}
                                    <span className={cn('text-[10px] tabular-nums', isActive ? 'text-white/60' : 'opacity-35')}>{count}</span>
                                  </button>
                                )
                              })}
                          </div>
                        </div>
                      )}
                      {/* Kunden */}
                      {Object.entries(PROJECT_CONFIG)
                        .filter(([key, cfg]) => cfg.group === 'client' && key in projectCounts)
                        .length > 0 && (
                        <div>
                          <p className="text-[9px] font-semibold text-muted-foreground/50 uppercase tracking-[0.1em] px-0.5 pb-2">Kunden</p>
                          <div className="flex flex-wrap gap-1.5">
                            {Object.entries(PROJECT_CONFIG)
                              .filter(([key, cfg]) => cfg.group === 'client' && key in projectCounts)
                              .sort((a, b) => (projectCounts[b[0]] || 0) - (projectCounts[a[0]] || 0))
                              .map(([key, cfg]) => {
                                const isActive = projectFilter.includes(key)
                                const count = projectCounts[key] || 0
                                return (
                                  <button
                                    key={key}
                                    onClick={() => toggleProject(key)}
                                    className={cn(
                                      'group/tag inline-flex items-center gap-1.5 rounded-lg px-2.5 py-[5px] text-[11px] font-medium',
                                      'transition-all duration-200',
                                      isActive
                                        ? 'text-white shadow-[0_1px_4px_rgba(0,0,0,0.12)]'
                                        : 'bg-muted/25 text-muted-foreground ring-1 ring-border/25 hover:ring-border/50 hover:text-foreground hover:bg-muted/40',
                                    )}
                                    style={isActive ? { background: `linear-gradient(135deg, ${cfg.color}, ${cfg.color}cc)` } : undefined}
                                  >
                                    {!isActive && <span className="h-1.5 w-1.5 rounded-full shrink-0 transition-transform duration-200 group-hover/tag:scale-125" style={{ backgroundColor: cfg.color }} />}
                                    {cfg.label}
                                    <span className={cn('text-[10px] tabular-nums', isActive ? 'text-white/60' : 'opacity-35')}>{count}</span>
                                  </button>
                                )
                              })}
                          </div>
                        </div>
                      )}
                    </div>
                  </CollapsibleSection>
                )}

                {/* Quelle (Eigen vs Baulig Roh) */}
                <CollapsibleSection title="Quelle" count={sourceFilter.length}>
                  <div className="flex gap-2">
                    {Object.entries(SOURCE_FILTERS).map(([key, cfg]) => {
                      const isActive = sourceFilter.includes(key)
                      const count = sourceCounts[key] || 0
                      return (
                        <button
                          key={key}
                          onClick={() => toggleSource(key)}
                          className={cn(
                            'flex-1 flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-[11px] font-semibold',
                            'transition-all duration-200',
                            isActive
                              ? 'text-white shadow-[0_2px_8px_rgba(0,0,0,0.15)]'
                              : 'bg-muted/30 text-muted-foreground hover:text-foreground hover:bg-muted/50 ring-1 ring-border/30',
                          )}
                          style={isActive ? { background: `linear-gradient(135deg, ${cfg.color}, ${cfg.color}dd)` } : undefined}
                        >
                          <span className={cn('h-2 w-2 rounded-full shrink-0 transition-all duration-200', isActive ? 'bg-white/90 scale-75' : '')} style={!isActive ? { backgroundColor: cfg.color } : undefined} />
                          {cfg.label}
                          <span className={cn('text-[10px] font-medium tabular-nums', isActive ? 'text-white/70' : 'opacity-40')}>{count}</span>
                        </button>
                      )
                    })}
                  </div>
                </CollapsibleSection>

                {/* Format (Docs/Sheets/Slides) */}
                <CollapsibleSection title="Format" count={docTypeFilter.length} defaultOpen={false}>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(DOC_TYPE_CONFIG).filter(([k]) => k !== 'other').map(([key, cfg]) => {
                      const isActive = docTypeFilter.includes(key)
                      return (
                        <button
                          key={key}
                          onClick={() => toggleDocType(key)}
                          className={cn(
                            'group/tag inline-flex items-center gap-1.5 rounded-lg px-2.5 py-[5px] text-[11px] font-medium',
                            'transition-all duration-200',
                            isActive
                              ? 'text-white shadow-[0_1px_4px_rgba(0,0,0,0.12)]'
                              : 'bg-muted/25 text-muted-foreground ring-1 ring-border/25 hover:ring-border/50 hover:text-foreground hover:bg-muted/40',
                          )}
                          style={isActive ? { background: `linear-gradient(135deg, ${cfg.color}, ${cfg.color}cc)` } : undefined}
                        >
                          {!isActive && <span className="h-1.5 w-1.5 rounded-full shrink-0 transition-transform duration-200 group-hover/tag:scale-125" style={{ backgroundColor: cfg.color }} />}
                          {cfg.label}
                        </button>
                      )
                    })}
                  </div>
                </CollapsibleSection>

                {/* Ordner */}
                {allFolders.length > 0 && (
                  <CollapsibleSection title="Ordner" count={folderFilter ? 1 : 0} defaultOpen={false}>
                    <div className="space-y-0.5 max-h-52 overflow-y-auto [&::-webkit-scrollbar]:w-[3px] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border/40">
                      {allFolders.slice(0, 15).map((folder) => (
                        <button
                          key={folder.id}
                          onClick={() => setFolderFilter(folderFilter === folder.id ? null : folder.id)}
                          className={cn(
                            'flex items-center justify-between w-full rounded-lg px-2.5 py-2 text-[11px] transition-all duration-200',
                            folderFilter === folder.id
                              ? 'bg-primary/8 text-primary font-medium ring-1 ring-primary/20'
                              : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground',
                          )}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <FolderOpen className="h-3.5 w-3.5 shrink-0 opacity-60" />
                            <span className="truncate">{folder.name}</span>
                          </div>
                          <span className="text-[10px] opacity-40 shrink-0 ml-2 tabular-nums">{folder.count}</span>
                        </button>
                      ))}
                    </div>
                  </CollapsibleSection>
                )}
              </>
            )}

            {/* Gmail Categories */}
            {activeTab === 'gmail' && (
              <CollapsibleSection title={t('drive.section.category')} count={categoryFilter.length}>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(GMAIL_CATEGORIES).map(([key, cfg]) => {
                    const isActive = categoryFilter.includes(key)
                    return (
                      <button
                        key={key}
                        onClick={() => toggleCategory(key)}
                        className={cn(
                          'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium',
                          'border transition-all duration-150',
                          isActive
                            ? 'border-transparent text-white shadow-sm'
                            : 'border-border/60 text-muted-foreground hover:border-border hover:text-foreground hover:bg-muted/50',
                        )}
                        style={isActive ? { backgroundColor: cfg.color } : undefined}
                      >
                        {!isActive && <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: cfg.color }} />}
                        {cfg.label}
                      </button>
                    )
                  })}
                </div>
              </CollapsibleSection>
            )}
          </div>

          {/* Bottom reset */}
          {activeFilterCount > 0 && (
            <div className="border-t border-border px-4 py-3 shrink-0">
              <button
                onClick={resetFilters}
                className="flex items-center justify-center gap-2 w-full rounded-lg px-3 py-2 text-xs font-medium bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
              >
                <RotateCcw className="h-3 w-3" />
                {t('drive.resetAll')}
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* ── Mobile Filter Toggle ──────────────────────────────── */}
      <button
        onClick={() => setFilterPanelOpen(!filterPanelOpen)}
        className="lg:hidden fixed bottom-16 right-4 z-30 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg"
      >
        {filterPanelOpen ? <PanelLeftClose className="h-[18px] w-[18px]" /> : <PanelLeft className="h-[18px] w-[18px]" />}
      </button>

      {/* Mobile filter overlay */}
      {filterPanelOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setFilterPanelOpen(false)} />
          <aside className="relative z-10 w-[280px] h-full bg-card shadow-2xl">
            {/* Same filter content would go here for mobile */}
          </aside>
        </div>
      )}

      {/* ── Main Content ──────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        {/* Toolbar */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border px-4 lg:px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Folder breadcrumb */}
              {currentFolderName ? (
                <div className="flex items-center gap-2 text-sm">
                  <button onClick={() => setFolderFilter(null)} className="text-muted-foreground hover:text-foreground transition-colors">
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  <FolderOpen className="h-4 w-4 text-primary" />
                  <span className="font-medium text-foreground">{currentFolderName}</span>
                  <span className="text-xs text-muted-foreground">
                    ({activeTab === 'drive' ? filteredDrive.length : filteredEmails.length})
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">
                    {activeTab === 'drive' ? `${filteredDrive.length} Dateien` : `${filteredEmails.length} E-Mails`}
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => { refreshDrive(); refreshGmail() }}
                disabled={isLoading}
                className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-40"
              >
                <RefreshCw className={cn('h-3.5 w-3.5', isLoading && 'animate-spin')} />
                <span className="hidden sm:inline">{t('drive.refresh')}</span>
              </button>

              {activeTab === 'drive' && (
                <div className="flex items-center rounded-lg border border-border p-0.5">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={cn(
                      'rounded-md p-1.5 transition-colors',
                      viewMode === 'grid' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    <LayoutGrid className="h-[18px] w-[18px]" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={cn(
                      'rounded-md p-1.5 transition-colors',
                      viewMode === 'list' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    <List className="h-[18px] w-[18px]" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-4 lg:p-6">
          {/* ── Skeleton Loading ──────────────────────────────────── */}
          {isLoading && activeTab === 'drive' && viewMode === 'grid' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-pulse">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="rounded-xl border border-border bg-card overflow-hidden">
                  <div className="h-1 bg-muted-foreground/10" />
                  <div className="aspect-[4/3] bg-muted/60" />
                  <div className="p-3 space-y-2">
                    <div className="h-3.5 bg-muted-foreground/10 rounded w-3/4" />
                    <div className="flex items-center gap-2">
                      <div className="h-3 bg-muted-foreground/10 rounded w-16" />
                      <div className="h-3 bg-muted-foreground/10 rounded w-12" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {isLoading && activeTab === 'drive' && viewMode === 'list' && (
            <div className="space-y-1 animate-pulse">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3">
                  <div className="h-8 w-8 rounded bg-muted-foreground/10" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 bg-muted-foreground/10 rounded w-1/3" />
                    <div className="h-3 bg-muted-foreground/10 rounded w-1/5" />
                  </div>
                  <div className="h-3 bg-muted-foreground/10 rounded w-20" />
                </div>
              ))}
            </div>
          )}

          {isLoading && activeTab === 'gmail' && (
            <div className="space-y-1.5 animate-pulse">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3">
                  <div className="h-8 w-8 rounded-full bg-muted-foreground/10" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 bg-muted-foreground/10 rounded w-2/5" />
                    <div className="h-3 bg-muted-foreground/10 rounded w-3/5" />
                  </div>
                  <div className="h-3 bg-muted-foreground/10 rounded w-16" />
                </div>
              ))}
            </div>
          )}

          {/* ── Drive Grid ──────────────────────────────────────── */}
          {activeTab === 'drive' && !driveLoading && (
            <>
              {/* Folder cards (when no folder selected) */}
              {!folderFilter && allFolders.length > 0 && viewMode === 'grid' && (
                <div className="mb-6">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Ordner</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
                    {allFolders.slice(0, 10).map((folder) => (
                      <button
                        key={folder.id}
                        onClick={() => setFolderFilter(folder.id)}
                        className="flex items-center gap-2.5 rounded-xl border border-border bg-card px-3 py-2.5 text-left hover:border-primary/30 hover:shadow-md transition-all duration-200"
                      >
                        <FolderOpen className="h-5 w-5 text-primary/70 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-foreground truncate">{folder.name}</p>
                          <p className="text-[10px] text-muted-foreground">{folder.count} Dateien</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {filteredDrive.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground/20" />
                  <p className="mt-3 text-sm font-medium text-muted-foreground">{t('drive.noFiles')}</p>
                  <p className="mt-1 text-xs text-muted-foreground/60">{t('drive.noFilesHint')}</p>
                </div>
              ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-fade-in">
                  {filteredDrive.map((file) => (
                    <DriveCard key={file.id} file={file} onPreview={setPreviewFile} onDelete={deleteFile} onRetag={retagFile} />
                  ))}
                </div>
              ) : (
                <DriveListView files={filteredDrive} onPreview={setPreviewFile} onDelete={deleteFile} onRetag={retagFile} />
              )}
            </>
          )}

          {/* ── Gmail List ──────────────────────────────────────── */}
          {activeTab === 'gmail' && !gmailLoading && (
            <>
              {filteredEmails.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <Mail className="h-12 w-12 text-muted-foreground/20" />
                  <p className="mt-3 text-sm font-medium text-muted-foreground">{t('drive.noEmails')}</p>
                </div>
              ) : (
                <div className="space-y-1.5 animate-fade-in">
                  {filteredEmails.map((email) => (
                    <EmailRow key={email.id} email={email} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Preview Overlay ──────────────────────────────────── */}
      {previewFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setPreviewFile(null)}>
          <div className="relative w-[90vw] max-w-5xl h-[85vh] bg-card rounded-2xl shadow-2xl overflow-hidden flex" onClick={(e) => e.stopPropagation()}>
            {/* Preview iframe */}
            <div className="flex-1 bg-muted">
              <iframe
                src={`https://drive.google.com/file/d/${previewFile.id}/preview`}
                className="w-full h-full border-0"
                title={previewFile.name}
              />
            </div>

            {/* Detail sidebar */}
            <div className="w-[300px] shrink-0 border-l border-border p-5 overflow-y-auto">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2 min-w-0">
                  {(() => { const cfg = DOC_TYPE_CONFIG[previewFile.type] || DOC_TYPE_CONFIG.other; const Icon = cfg.icon; return <Icon className="h-5 w-5 shrink-0" style={{ color: cfg.color }} /> })()}
                  <h3 className="text-sm font-bold text-foreground line-clamp-2">{previewFile.name}</h3>
                </div>
                <button onClick={() => setPreviewFile(null)} className="p-1 rounded-lg hover:bg-muted transition-colors shrink-0 ml-2">
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Category */}
                <div>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Kategorie</p>
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium text-white"
                    style={{ backgroundColor: (DRIVE_CATEGORIES[previewFile.category] || DRIVE_CATEGORIES.sonstiges).color }}
                  >
                    {(DRIVE_CATEGORIES[previewFile.category] || DRIVE_CATEGORIES.sonstiges).label}
                  </span>
                </div>

                {/* Type */}
                <div>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Typ</p>
                  <p className="text-xs text-foreground">{(DOC_TYPE_CONFIG[previewFile.type] || DOC_TYPE_CONFIG.other).label}</p>
                </div>

                {/* Folder */}
                {previewFile.folder && (
                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Ordner</p>
                    <p className="text-xs text-foreground flex items-center gap-1.5">
                      <FolderOpen className="h-3 w-3 text-muted-foreground" />
                      {previewFile.folder}
                    </p>
                  </div>
                )}

                {/* Dates */}
                <div>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Bearbeitet</p>
                  <p className="text-xs text-foreground">{formatDate(previewFile.modifiedTime)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Erstellt</p>
                  <p className="text-xs text-foreground">{formatDate(previewFile.createdTime)}</p>
                </div>

                {/* Owner */}
                {previewFile.owner && (
                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Eigentümer</p>
                    <p className="text-xs text-foreground">{previewFile.owner}</p>
                  </div>
                )}

                {/* Tags */}
                {previewFile.tags.length > 0 && (
                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Tags</p>
                    <div className="flex flex-wrap gap-1">
                      {previewFile.tags.map((tag) => (
                        <span key={tag} className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">{tag}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="pt-3 border-t border-border space-y-2">
                  <a
                    href={previewFile.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    {t('drive.openInDrive')}
                  </a>
                  <button
                    onClick={() => { if (confirm('Datei wirklich löschen?')) deleteFile(previewFile.id) }}
                    className="flex items-center justify-center gap-2 w-full rounded-lg border border-red-500/20 px-3 py-2 text-xs font-medium text-red-500 hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Löschen
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── DriveCard ──────────────────────────────────────────────────────────────

// ── RetagDropdown ──────────────────────────────────────────────────────────

function RetagDropdown({ file, onRetag }: { file: DriveFile; onRetag: (id: string, category: string) => void }) {
  const [open, setOpen] = useState(false)
  const ref = React.useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const currentCat = DRIVE_CATEGORIES[file.category] || DRIVE_CATEGORIES.sonstiges

  return (
    <div ref={ref} className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(!open) }}
        className={cn(
          'inline-flex items-center gap-1 rounded-full px-1.5 py-px text-[10px] font-medium',
          'hover:ring-1 hover:ring-primary/30 transition-all cursor-pointer',
        )}
        style={{ color: currentCat.color, backgroundColor: currentCat.color + '15' }}
        title="Kategorie ändern"
      >
        <span className="h-1 w-1 rounded-full" style={{ backgroundColor: currentCat.color }} />
        {currentCat.label}
        <ChevronDown className="h-2.5 w-2.5 ml-0.5 opacity-60" />
      </button>
      {open && (
        <div className="absolute bottom-full left-0 mb-1 z-50 w-48 max-h-64 overflow-y-auto rounded-lg border border-border bg-card shadow-xl py-1">
          {Object.entries(DRIVE_CATEGORIES).map(([key, cfg]) => {
            const isActive = file.category === key
            return (
              <button
                key={key}
                onClick={(e) => {
                  e.stopPropagation()
                  onRetag(file.id, key)
                  setOpen(false)
                }}
                className={cn(
                  'flex items-center gap-2 w-full px-3 py-1.5 text-xs text-left transition-colors',
                  isActive ? 'bg-primary/10 text-primary font-medium' : 'text-foreground hover:bg-muted/60',
                )}
              >
                <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: cfg.color }} />
                <span className="flex-1 truncate">{cfg.label}</span>
                {isActive && <Check className="h-3 w-3 text-primary shrink-0" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function DriveCard({ file, onPreview, onDelete, onRetag }: { file: DriveFile; onPreview: (f: DriveFile) => void; onDelete: (id: string) => void; onRetag: (id: string, category: string) => void }) {
  const [thumbLoaded, setThumbLoaded] = useState(false)
  const [thumbError, setThumbError] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const catConfig = DRIVE_CATEGORIES[file.category] || DRIVE_CATEGORIES.sonstiges
  const typeConfig = DOC_TYPE_CONFIG[file.type] || DOC_TYPE_CONFIG.other
  const TypeIcon = typeConfig.icon

  return (
    <div
      className={cn(
        'group relative flex flex-col rounded-xl border border-border bg-card overflow-hidden cursor-pointer',
        'transition-all duration-200',
        'hover:translate-y-[-2px] hover:shadow-xl hover:shadow-black/8 dark:hover:shadow-black/30',
        'hover:border-primary/30',
      )}
      onClick={() => onPreview(file)}
    >
      {/* Thumbnail area */}
      <div className="relative w-full aspect-[4/3] bg-muted/50 overflow-hidden">
        {file.thumbnailUrl && !thumbError ? (
          <>
            {!thumbLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-5 w-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              </div>
            )}
            <img
              src={file.thumbnailUrl}
              alt={file.name}
              className={cn(
                'w-full h-full object-cover object-top transition-opacity duration-300',
                thumbLoaded ? 'opacity-100' : 'opacity-0',
              )}
              onLoad={() => setThumbLoaded(true)}
              onError={() => setThumbError(true)}
              loading="lazy"
              referrerPolicy="no-referrer"
            />
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground/40">
            <TypeIcon className="h-10 w-10" />
            <span className="text-[10px] uppercase tracking-wider font-medium">{typeConfig.label}</span>
          </div>
        )}

        {/* Hover overlay */}
        <div className={cn(
          'absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center gap-3',
          'opacity-0 group-hover:opacity-100 transition-opacity duration-200',
        )}>
          {confirmDelete ? (
            <div className="flex flex-col items-center gap-2">
              <p className="text-xs text-white font-medium">Wirklich löschen?</p>
              <div className="flex gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(file.id) }}
                  className="flex items-center gap-1.5 rounded-lg bg-red-500/80 px-3 py-2 text-xs font-medium text-white hover:bg-red-500 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Löschen
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setConfirmDelete(false) }}
                  className="flex items-center gap-1.5 rounded-lg bg-white/20 px-3 py-2 text-xs font-medium text-white hover:bg-white/30 transition-colors"
                >
                  Abbrechen
                </button>
              </div>
            </div>
          ) : (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); onPreview(file) }}
                className="flex items-center gap-1.5 rounded-lg bg-white/20 px-3 py-2 text-xs font-medium text-white hover:bg-white/30 transition-colors"
              >
                <Eye className="h-3.5 w-3.5" />
                Vorschau
              </button>
              <a
                href={file.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1.5 rounded-lg bg-white/20 px-3 py-2 text-xs font-medium text-white hover:bg-white/30 transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Öffnen
              </a>
              <button
                onClick={(e) => { e.stopPropagation(); setConfirmDelete(true) }}
                className="flex items-center gap-1.5 rounded-lg bg-white/10 px-2.5 py-2 text-xs font-medium text-white/70 hover:bg-red-500/60 hover:text-white transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </>
          )}
        </div>

        {/* Category color strip */}
        <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ backgroundColor: catConfig.color }} />

        {/* Type badge */}
        <div className="absolute top-2.5 right-2.5">
          <span className="inline-flex items-center rounded-md bg-black/50 backdrop-blur-sm px-2 py-0.5 text-[10px] font-medium text-white">
            {typeConfig.label}
          </span>
        </div>

        {/* Star */}
        {file.starred && (
          <div className="absolute top-2.5 left-2.5">
            <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col px-3.5 py-3 gap-1.5">
        <h3 className="text-sm font-semibold text-foreground truncate leading-tight">{file.name}</h3>

        {file.folder && (
          <p className="text-[11px] text-muted-foreground flex items-center gap-1 truncate">
            <FolderOpen className="h-3 w-3 shrink-0" />
            {file.folder}
          </p>
        )}

        <div className="flex items-center justify-between gap-2 mt-1 pt-2 border-t border-border/50">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[11px] text-muted-foreground tabular-nums shrink-0">{timeAgo(file.modifiedTime)}</span>
            <RetagDropdown file={file} onRetag={onRetag} />
          </div>
        </div>
      </div>
    </div>
  )
}

// ── DriveListView ─────────────────────────────────────────────────────────

function DriveListView({ files, onPreview, onDelete, onRetag }: { files: DriveFile[]; onPreview: (f: DriveFile) => void; onDelete: (id: string) => void; onRetag: (id: string, category: string) => void }) {
  return (
    <div className="rounded-xl border border-border overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-[1fr_120px_100px_100px_80px_32px] gap-3 px-4 py-2.5 bg-muted/50 border-b border-border text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
        <span>Name</span>
        <span>Ordner</span>
        <span>Kategorie</span>
        <span>Typ</span>
        <span className="text-right">Geändert</span>
        <span />
      </div>
      {files.map((file) => {
        const catConfig = DRIVE_CATEGORIES[file.category] || DRIVE_CATEGORIES.sonstiges
        const typeConfig = DOC_TYPE_CONFIG[file.type] || DOC_TYPE_CONFIG.other
        const TypeIcon = typeConfig.icon
        return (
          <div
            key={file.id}
            onClick={() => onPreview(file)}
            className="group grid grid-cols-[1fr_120px_100px_100px_80px_32px] gap-3 px-4 py-2.5 border-b border-border/50 last:border-b-0 hover:bg-muted/30 cursor-pointer transition-colors items-center"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <TypeIcon className="h-4 w-4 shrink-0" style={{ color: typeConfig.color }} />
              <span className="text-sm text-foreground truncate font-medium">{file.name}</span>
              {file.starred && <Star className="h-3 w-3 shrink-0 fill-yellow-400 text-yellow-400" />}
            </div>
            <span className="text-xs text-muted-foreground truncate">{file.folder || '--'}</span>
            <RetagDropdown file={file} onRetag={onRetag} />
            <span className="text-xs text-muted-foreground">{typeConfig.label}</span>
            <span className="text-[11px] text-muted-foreground text-right tabular-nums">{timeAgo(file.modifiedTime)}</span>
            <button
              onClick={(e) => { e.stopPropagation(); if (confirm('Datei löschen?')) onDelete(file.id) }}
              className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground/30 hover:text-red-500 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        )
      })}
    </div>
  )
}

// ── EmailRow ──────────────────────────────────────────────────────────────

function EmailRow({ email }: { email: GmailMessage }) {
  const catConfig = GMAIL_CATEGORIES[email.category] || GMAIL_CATEGORIES.sonstiges
  const isSent = email.tags.includes('Gesendet')
  const initials = extractName(email.from).split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)

  return (
    <a
      href={email.url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'group relative flex items-center gap-4 rounded-xl bg-card px-4 py-3.5',
        'border border-border/60 transition-all duration-200',
        'hover:bg-muted/30 hover:border-primary/25 hover:shadow-lg hover:shadow-primary/5',
      )}
    >
      {/* Avatar */}
      <div
        className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
        style={{ backgroundColor: catConfig.color }}
      >
        {isSent ? <Send className="h-4 w-4" /> : initials || <Mail className="h-4 w-4" />}
        {email.starred && (
          <div className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-card flex items-center justify-center">
            <Star className="h-2.5 w-2.5 fill-yellow-400 text-yellow-400" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[13px] font-semibold text-foreground truncate">{extractName(email.from)}</span>
            {isSent && <span className="text-[10px] text-muted-foreground/60 shrink-0">an {extractName(email.to)}</span>}
          </div>
          <span className="text-[11px] text-muted-foreground/60 tabular-nums shrink-0">{timeAgo(email.date)}</span>
        </div>
        <h4 className="mt-0.5 text-sm text-foreground/90 line-clamp-1">{email.subject}</h4>
        <p className="mt-0.5 text-[12px] text-muted-foreground/50 line-clamp-1">{email.snippet}</p>
      </div>

      {/* Right side: category + tags */}
      <div className="flex items-center gap-1.5 shrink-0">
        {email.tags.includes('Anhang') && (
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-muted/60">
            <Paperclip className="h-3 w-3 text-muted-foreground" />
          </span>
        )}
        <span
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-semibold"
          style={{ color: catConfig.color, backgroundColor: catConfig.color + '12' }}
        >
          {catConfig.label}
        </span>
        <ExternalLink className="h-3.5 w-3.5 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors" />
      </div>
    </a>
  )
}
