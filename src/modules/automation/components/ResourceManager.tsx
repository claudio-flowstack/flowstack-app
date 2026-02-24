import { useState, useMemo, useCallback } from 'react'
import type { SystemResource, ResourceType, ResourceFolder } from '../domain/types'
import { cn } from '@/shared/lib/utils'
import { formatDate } from '@/shared/lib/utils'
import {
  Mic,
  FileText,
  StickyNote,
  Database,
  ClipboardList,
  Globe,
  Search,
  Plus,
  X,
  LayoutGrid,
  List,
  Trash2,
  Link,
  FolderOpen,
  ChevronRight,
  ArrowUpDown,
  Copy,
  Check,
  Pencil,
  Upload,
  Eye,
} from 'lucide-react'
import {
  loadFolders,
  saveFolders,
  addFolder as addFolderStorage,
  updateFolder as updateFolderStorage,
  deleteFolder as deleteFolderStorage,
  getFoldersForSystem,
} from '../data/resourceStorage'
import { ConfirmDialog } from '@/shared/components/ConfirmDialog'

// ── Props ──────────────────────────────────────────────────────────────────

interface ResourceManagerProps {
  resources: SystemResource[]
  systemId?: string
  onUpdate?: (resources: SystemResource[]) => void
  className?: string
  compact?: boolean
}

// ── Constants ──────────────────────────────────────────────────────────────

const RESOURCE_TYPE_META: Record<
  ResourceType,
  { label: string; icon: typeof Mic; color: string }
> = {
  transcript: {
    label: 'Transkript',
    icon: Mic,
    color: 'bg-violet-100 dark:bg-violet-500/15 text-violet-600 dark:text-violet-400',
  },
  document: {
    label: 'Dokument',
    icon: FileText,
    color: 'bg-blue-100 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400',
  },
  note: {
    label: 'Notiz',
    icon: StickyNote,
    color: 'bg-amber-100 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400',
  },
  dataset: {
    label: 'Datensatz',
    icon: Database,
    color: 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  },
  form: {
    label: 'Formular',
    icon: ClipboardList,
    color: 'bg-pink-100 dark:bg-pink-500/15 text-pink-600 dark:text-pink-400',
  },
  page: {
    label: 'Seite',
    icon: Globe,
    color: 'bg-cyan-100 dark:bg-cyan-500/15 text-cyan-600 dark:text-cyan-400',
  },
}

const FILTER_OPTIONS: Array<{ value: ResourceType | 'all'; label: string }> = [
  { value: 'all', label: 'Alle' },
  { value: 'transcript', label: 'Transkript' },
  { value: 'document', label: 'Dokument' },
  { value: 'note', label: 'Notiz' },
  { value: 'dataset', label: 'Datensatz' },
  { value: 'form', label: 'Formular' },
  { value: 'page', label: 'Seite' },
]

const FOLDER_COLORS = [
  { key: 'purple', hex: '#9333ea' },
  { key: 'blue', hex: '#3b82f6' },
  { key: 'emerald', hex: '#10b981' },
  { key: 'amber', hex: '#f59e0b' },
  { key: 'pink', hex: '#ec4899' },
  { key: 'cyan', hex: '#06b6d4' },
  { key: 'red', hex: '#ef4444' },
]

const MOCK_RESOURCES: SystemResource[] = [
  {
    id: 'res-1',
    user_id: 'user-1',
    systemId: 'sys-1',
    title: 'Kundeninterview Q1',
    type: 'transcript',
    content: 'Zusammenfassung des Kundeninterviews...',
    createdAt: '2026-02-10T09:00:00Z',
    source: 'Zoom',
    linkedNodeId: 'node-1',
  },
  {
    id: 'res-2',
    user_id: 'user-1',
    systemId: 'sys-1',
    title: 'Produkt-Roadmap 2026',
    type: 'document',
    content: 'Strategische Planung und Meilensteine...',
    createdAt: '2026-02-12T14:30:00Z',
    fileReference: '/docs/roadmap-2026.pdf',
  },
  {
    id: 'res-3',
    user_id: 'user-1',
    systemId: 'sys-1',
    title: 'Brainstorming Notizen',
    type: 'note',
    content: 'Ideen fuer die neue Kampagne...',
    createdAt: '2026-02-14T11:15:00Z',
  },
  {
    id: 'res-4',
    user_id: 'user-1',
    systemId: 'sys-1',
    title: 'CRM Export Februar',
    type: 'dataset',
    content: 'Export der Kundendaten...',
    createdAt: '2026-02-15T08:00:00Z',
    source: 'HubSpot',
  },
  {
    id: 'res-5',
    user_id: 'user-1',
    systemId: 'sys-1',
    title: 'Lead-Formular Website',
    type: 'form',
    content: 'Kontaktformular fuer Landingpage...',
    createdAt: '2026-02-16T16:45:00Z',
    linkedNodeId: 'node-3',
  },
  {
    id: 'res-6',
    user_id: 'user-1',
    systemId: 'sys-1',
    title: 'Kampagnen-Landingpage',
    type: 'page',
    content: 'https://flowstack.app/kampagne',
    createdAt: '2026-02-17T10:00:00Z',
    source: 'flowstack.app',
  },
]

// ── Component ──────────────────────────────────────────────────────────────

export function ResourceManager({
  resources: resourcesProp,
  systemId,
  onUpdate,
  className,
  compact,
}: ResourceManagerProps) {
  const isDemo = resourcesProp.length === 0
  const [resources, setResources] = useState<SystemResource[]>(
    isDemo ? MOCK_RESOURCES : resourcesProp,
  )
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<ResourceType | 'all'>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState<'date' | 'name'>('date')
  const [showAddForm, setShowAddForm] = useState(false)
  const [newLabel, setNewLabel] = useState('')
  const [newType, setNewType] = useState<ResourceType>('document')
  const [newContent, setNewContent] = useState('')
  const [newFileRef, setNewFileRef] = useState('')
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  // Preview modal state
  const [previewResource, setPreviewResource] = useState<SystemResource | null>(null)

  // Edit state
  const [editingResource, setEditingResource] = useState<SystemResource | null>(null)

  // Folder state
  const [folders, setFolders] = useState<ResourceFolder[]>(() =>
    systemId ? getFoldersForSystem(systemId) : [],
  )
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null)
  const [showFolderModal, setShowFolderModal] = useState(false)
  const [editingFolder, setEditingFolder] = useState<ResourceFolder | null>(null)
  const [newFolderName, setNewFolderName] = useState('')
  const [newFolderColor, setNewFolderColor] = useState('purple')
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null)
  const [pendingDeleteFolderId, setPendingDeleteFolderId] = useState<string | null>(null)

  // ── Filtered resources ───────────────────────────────────────────────

  const filtered = useMemo(() => {
    let result = resources
    if (typeFilter !== 'all') {
      result = result.filter((r) => r.type === typeFilter)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.content.toLowerCase().includes(q),
      )
    }
    return [...result].sort((a, b) =>
      sortBy === 'name'
        ? a.title.localeCompare(b.title)
        : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
  }, [resources, typeFilter, search, sortBy])

  const currentFolder = currentFolderId
    ? folders.find((f) => f.id === currentFolderId)
    : null

  // Items at current navigation level
  const visibleItems = useMemo(() => {
    if (currentFolderId) {
      return filtered.filter((r) => r.folderId === currentFolderId)
    }
    return filtered.filter(
      (r) => !r.folderId || !folders.some((f) => f.id === r.folderId),
    )
  }, [filtered, currentFolderId, folders])

  // ── Handlers ─────────────────────────────────────────────────────────

  function propagate(next: SystemResource[]) {
    setResources(next)
    onUpdate?.(next)
  }

  function handleAdd() {
    if (!newLabel.trim()) return
    const resource: SystemResource = {
      id: `res-${Date.now()}`,
      user_id: 'user-1',
      systemId: systemId ?? 'sys-1',
      title: newLabel.trim(),
      type: newType,
      content: newContent.trim(),
      createdAt: new Date().toISOString(),
      fileReference: newFileRef.trim() || undefined,
      folderId: currentFolderId ?? undefined,
    }
    propagate([...resources, resource])
    setNewLabel('')
    setNewType('document')
    setNewContent('')
    setNewFileRef('')
    setShowAddForm(false)
    setEditingResource(null)
  }

  function handleSaveEdit() {
    if (!editingResource || !newLabel.trim()) return
    const updated = resources.map((r) =>
      r.id === editingResource.id
        ? {
            ...r,
            title: newLabel.trim(),
            type: newType,
            content: newContent.trim(),
            fileReference: newFileRef.trim() || undefined,
          }
        : r,
    )
    propagate(updated)
    setEditingResource(null)
    setShowAddForm(false)
    setNewLabel('')
    setNewType('document')
    setNewContent('')
    setNewFileRef('')
  }

  function handleDelete(id: string) {
    propagate(resources.filter((r) => r.id !== id))
    setConfirmDeleteId(null)
    if (previewResource?.id === id) setPreviewResource(null)
  }

  function handleCopy(content: string) {
    navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function openEditForm(res: SystemResource) {
    setEditingResource(res)
    setNewLabel(res.title)
    setNewType(res.type)
    setNewContent(res.content)
    setNewFileRef(res.fileReference ?? '')
    setShowAddForm(true)
  }

  function handleFileUpload(file: File) {
    if (!newLabel.trim()) setNewLabel(file.name)
    setNewFileRef(file.name)
    if (
      file.type.startsWith('text/') ||
      file.name.endsWith('.md') ||
      file.name.endsWith('.json') ||
      file.name.endsWith('.csv')
    ) {
      const reader = new FileReader()
      reader.onload = () => {
        if (typeof reader.result === 'string') setNewContent(reader.result)
      }
      reader.readAsText(file)
    } else if (!newContent.trim()) {
      setNewContent(`Datei: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`)
    }
  }

  // ── Folder handlers ────────────────────────────────────────────────

  function openFolderModal(folder?: ResourceFolder) {
    setEditingFolder(folder ?? null)
    setNewFolderName(folder?.name ?? '')
    setNewFolderColor(folder?.color ?? 'purple')
    setShowFolderModal(true)
  }

  function handleSaveFolder() {
    if (!newFolderName.trim() || !systemId) return
    if (editingFolder) {
      updateFolderStorage(editingFolder.id, {
        name: newFolderName.trim(),
        color: newFolderColor,
      })
      setFolders((prev) =>
        prev.map((f) =>
          f.id === editingFolder.id
            ? { ...f, name: newFolderName.trim(), color: newFolderColor }
            : f,
        ),
      )
    } else {
      const folder: ResourceFolder = {
        id: `folder-${Date.now()}`,
        systemId,
        name: newFolderName.trim(),
        createdAt: new Date().toISOString(),
        color: newFolderColor,
      }
      addFolderStorage(folder)
      setFolders((prev) => [...prev, folder])
    }
    setShowFolderModal(false)
  }

  function handleDeleteFolder(folderId: string) {
    deleteFolderStorage(folderId)
    setFolders((prev) => prev.filter((f) => f.id !== folderId))
    setResources((prev) =>
      prev.map((r) =>
        r.folderId === folderId ? { ...r, folderId: undefined } : r,
      ),
    )
    setPendingDeleteFolderId(null)
    if (currentFolderId === folderId) setCurrentFolderId(null)
  }

  const handleDropOnFolder = useCallback(
    (resourceId: string, folderId: string | null) => {
      setResources((prev) =>
        prev.map((r) =>
          r.id === resourceId
            ? { ...r, folderId: folderId ?? undefined }
            : r,
        ),
      )
      setDragOverFolderId(null)
    },
    [],
  )

  // ── Render helpers ───────────────────────────────────────────────────

  function renderTypeBadge(type: ResourceType) {
    const meta = RESOURCE_TYPE_META[type]
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium',
          meta.color,
        )}
      >
        <meta.icon className="h-2.5 w-2.5" />
        {meta.label}
      </span>
    )
  }

  function renderResourceCard(resource: SystemResource) {
    const meta = RESOURCE_TYPE_META[resource.type]
    const Icon = meta.icon

    return (
      <div
        key={resource.id}
        draggable
        onDragStart={(e) => {
          e.dataTransfer.setData('text/resource-id', resource.id)
          e.dataTransfer.effectAllowed = 'move'
        }}
        onClick={() => setPreviewResource(resource)}
        className={cn(
          'group relative rounded-xl border border-border bg-card cursor-pointer',
          'hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5',
          'transition-all duration-200',
          compact ? 'p-3' : 'p-4',
        )}
      >
        {/* Actions */}
        <div
          className="absolute top-2 right-2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => handleCopy(resource.content)}
            className="rounded-md p-1 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
            title="Kopieren"
          >
            <Copy className="h-3 w-3" />
          </button>
          <button
            onClick={() => openEditForm(resource)}
            className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            title="Bearbeiten"
          >
            <Pencil className="h-3 w-3" />
          </button>
          <button
            onClick={() => setConfirmDeleteId(resource.id)}
            className="rounded-md p-1 text-muted-foreground hover:bg-red-500/10 hover:text-red-500 transition-colors"
            title="Löschen"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>

        {/* Header */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={cn(
              'flex shrink-0 items-center justify-center rounded-lg',
              meta.color,
              compact ? 'h-8 w-8' : 'h-9 w-9',
            )}
          >
            <Icon className={compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className={cn('font-semibold text-foreground line-clamp-1', compact ? 'text-xs' : 'text-sm')}>
              {resource.title}
            </h4>
            <div className="mt-0.5">{renderTypeBadge(resource.type)}</div>
          </div>
        </div>

        {/* Content preview */}
        {resource.content && !compact && (
          <p className="mt-3 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {resource.content}
          </p>
        )}

        {/* Footer */}
        <div className={cn('flex items-center justify-between border-t border-border/50', compact ? 'mt-2 pt-2' : 'mt-3 pt-3')}>
          <span className="text-[10px] text-muted-foreground/70">
            {formatDate(resource.createdAt)}
          </span>
          <div className="flex items-center gap-1.5">
            {resource.source && (
              <span className="text-[9px] text-muted-foreground bg-muted rounded-full px-1.5 py-0.5">
                {resource.source}
              </span>
            )}
            {resource.linkedNodeId && (
              <span
                className="flex items-center gap-0.5 text-[9px] text-primary/70"
                title="Verknüpft mit Node"
              >
                <Link className="h-2.5 w-2.5" />
              </span>
            )}
          </div>
        </div>
      </div>
    )
  }

  function renderResourceRow(resource: SystemResource) {
    const meta = RESOURCE_TYPE_META[resource.type]
    const Icon = meta.icon

    return (
      <div
        key={resource.id}
        draggable
        onDragStart={(e) => {
          e.dataTransfer.setData('text/resource-id', resource.id)
          e.dataTransfer.effectAllowed = 'move'
        }}
        onClick={() => setPreviewResource(resource)}
        className={cn(
          'group flex items-center gap-4 rounded-lg border border-border bg-card px-4 py-3 cursor-pointer',
          'hover:border-primary/30 hover:shadow-md hover:shadow-primary/5',
          'transition-all duration-200',
        )}
      >
        <div
          className={cn(
            'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
            meta.color,
          )}
        >
          <Icon className="h-3.5 w-3.5" />
        </div>
        <div className="min-w-0 flex-1">
          <span className="text-sm font-medium text-foreground line-clamp-1">
            {resource.title}
          </span>
        </div>
        <div className="shrink-0">{renderTypeBadge(resource.type)}</div>
        <div className="shrink-0 w-20 text-right">
          {resource.linkedNodeId ? (
            <span className="flex items-center justify-end gap-0.5 text-[10px] text-primary/70">
              <Link className="h-2.5 w-2.5" />
              Verknüpft
            </span>
          ) : resource.source ? (
            <span className="text-[10px] text-muted-foreground">
              {resource.source}
            </span>
          ) : null}
        </div>
        <span className="shrink-0 text-[11px] text-muted-foreground/70 w-20 text-right">
          {formatDate(resource.createdAt)}
        </span>
        <div
          className="shrink-0 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => openEditForm(resource)}
            className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <Pencil className="h-3 w-3" />
          </button>
          <button
            onClick={() => setConfirmDeleteId(resource.id)}
            className="rounded-md p-1 text-muted-foreground hover:bg-red-500/10 hover:text-red-500 transition-colors"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>
    )
  }

  // ── Main render ──────────────────────────────────────────────────────

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {/* Breadcrumb + Toolbar */}
      <div className={cn('flex flex-col gap-2', compact ? '' : 'sm:gap-3')}>
        {/* Row 1: Breadcrumb + Add */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={() => setCurrentFolderId(null)}
              className={cn(
                'text-sm font-medium transition-colors',
                currentFolderId
                  ? 'text-muted-foreground hover:text-primary'
                  : 'text-foreground font-semibold',
              )}
            >
              Ressourcen
            </button>
            {currentFolder && (
              <>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="text-sm font-semibold text-foreground truncate">
                  {currentFolder.name}
                </span>
              </>
            )}
            <span className="text-[10px] text-muted-foreground ml-1">
              {visibleItems.length +
                (!currentFolderId ? folders.length : 0)}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* New Folder */}
            {systemId && (
              <button
                onClick={() => openFolderModal()}
                className="rounded-lg border border-border p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                title="Neuer Ordner"
              >
                <FolderOpen className="h-3.5 w-3.5" />
              </button>
            )}

            {/* Add button */}
            <button
              onClick={() => {
                setEditingResource(null)
                setNewLabel('')
                setNewType('document')
                setNewContent('')
                setNewFileRef('')
                setShowAddForm(!showAddForm)
              }}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors',
                showAddForm
                  ? 'bg-primary/10 text-primary'
                  : 'bg-primary text-primary-foreground hover:bg-primary/90',
              )}
            >
              <Plus className="h-3 w-3" />
              {compact ? '' : 'Ressource'}
            </button>
          </div>
        </div>

        {/* Row 2: Search + Controls */}
        <div className="flex items-center gap-1.5">
          {/* Search */}
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Suchen..."
              className={cn(
                'w-full rounded-lg border border-border bg-card pl-7 pr-2 py-1.5 text-xs text-foreground',
                'placeholder:text-muted-foreground/60',
                'focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/40',
                'transition-colors',
              )}
            />
          </div>

          {/* Sort toggle */}
          <button
            onClick={() => setSortBy((s) => (s === 'date' ? 'name' : 'date'))}
            className="rounded-lg border border-border p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
            title={sortBy === 'date' ? 'A → Z' : 'Neueste zuerst'}
          >
            <ArrowUpDown className="h-3 w-3" />
          </button>

          {/* View toggle */}
          {!compact && (
            <div className="flex items-center rounded-lg border border-border bg-card p-0.5 shrink-0">
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  'rounded-md p-1.5 transition-colors',
                  viewMode === 'grid'
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  'rounded-md p-1.5 transition-colors',
                  viewMode === 'list'
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <List className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit form */}
      {showAddForm && (
        <div className="rounded-xl border border-primary/20 bg-card p-4 space-y-3 animate-fade-in">
          <h4 className="text-xs font-bold text-foreground">
            {editingResource ? 'Ressource bearbeiten' : 'Neue Ressource erstellen'}
          </h4>

          {/* File upload (only for new resources) */}
          {!editingResource && (
            <label className="flex flex-col items-center justify-center w-full h-16 rounded-xl border-2 border-dashed border-border hover:border-primary/40 bg-muted/30 cursor-pointer transition-colors">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Upload className="h-4 w-4" />
                <span className="text-xs font-medium">
                  Datei hochladen oder hierher ziehen
                </span>
              </div>
              <input
                type="file"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleFileUpload(file)
                }}
              />
            </label>
          )}
          {newFileRef && (
            <div className="flex items-center gap-1.5 text-xs text-primary">
              <FileText className="h-3 w-3" /> {newFileRef}
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label className="text-[11px] font-medium text-muted-foreground mb-1 block">
                Bezeichnung
              </label>
              <input
                type="text"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="Bezeichnung eingeben..."
                className={cn(
                  'w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground',
                  'placeholder:text-muted-foreground/60',
                  'focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/40',
                  'transition-colors',
                )}
                onKeyDown={(e) => {
                  if (e.key === 'Enter')
                    editingResource ? handleSaveEdit() : handleAdd()
                }}
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-muted-foreground mb-1 block">
                Typ
              </label>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value as ResourceType)}
                className={cn(
                  'rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground',
                  'focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/40',
                  'transition-colors',
                )}
              >
                {Object.entries(RESOURCE_TYPE_META).map(([key, meta]) => (
                  <option key={key} value={key}>
                    {meta.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Content textarea */}
          <div>
            <label className="text-[11px] font-medium text-muted-foreground mb-1 block">
              Inhalt
            </label>
            <textarea
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              rows={3}
              placeholder="Inhalt eingeben..."
              className={cn(
                'w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground resize-none',
                'placeholder:text-muted-foreground/60',
                'focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/40',
                'transition-colors',
              )}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={editingResource ? handleSaveEdit : handleAdd}
              disabled={!newLabel.trim()}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                'bg-primary text-primary-foreground hover:bg-primary/90',
                'disabled:opacity-50 disabled:cursor-not-allowed',
              )}
            >
              <Plus className="h-3.5 w-3.5" />
              {editingResource ? 'Speichern' : 'Erstellen'}
            </button>
            <button
              onClick={() => {
                setShowAddForm(false)
                setEditingResource(null)
                setNewLabel('')
                setNewType('document')
                setNewContent('')
                setNewFileRef('')
              }}
              className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
            >
              Abbrechen
            </button>
          </div>
        </div>
      )}

      {/* Type filter */}
      <div className={cn('flex items-center gap-1 overflow-x-auto', compact ? 'pb-1 -mx-1 px-1 scrollbar-none' : 'gap-1.5 flex-wrap')}>
        {FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setTypeFilter(opt.value)}
            className={cn(
              'rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-colors whitespace-nowrap shrink-0',
              typeFilter === opt.value
                ? 'bg-primary/10 text-primary border border-primary/30'
                : 'bg-muted text-muted-foreground hover:text-foreground border border-transparent',
            )}
          >
            {opt.label}
          </button>
        ))}
        {!compact && (
          <span className="ml-2 text-[11px] text-muted-foreground whitespace-nowrap">
            {filtered.length} von {resources.length}
          </span>
        )}
      </div>

      {/* Content: Folders + Resources */}
      {resources.length === 0 && folders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
            <FolderOpen className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground">
            Keine Ressourcen vorhanden
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Füge eine neue Ressource hinzu, um loszulegen.
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className={compact ? 'grid grid-cols-1 gap-4' : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'}>
          {/* Back button when inside folder */}
          {currentFolderId && (
            <div
              onClick={() => setCurrentFolderId(null)}
              className="flex flex-col items-center justify-center p-4 rounded-xl border border-border bg-card cursor-pointer hover:border-primary/30 transition-colors"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted mb-2.5">
                <X className="h-4 w-4 text-muted-foreground" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">
                Zurück
              </span>
            </div>
          )}

          {/* Folders (only at root) */}
          {!currentFolderId &&
            folders.map((folder) => {
              const count = resources.filter(
                (r) => r.folderId === folder.id,
              ).length
              const colorHex =
                FOLDER_COLORS.find((c) => c.key === folder.color)?.hex ??
                '#9333ea'

              return (
                <div
                  key={folder.id}
                  className={cn(
                    'group relative flex flex-col items-center p-4 rounded-xl border bg-card cursor-pointer transition-all duration-200',
                    dragOverFolderId === folder.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/30',
                  )}
                  onClick={() => setCurrentFolderId(folder.id)}
                  onDragOver={(e) => {
                    e.preventDefault()
                    setDragOverFolderId(folder.id)
                  }}
                  onDragLeave={() => setDragOverFolderId(null)}
                  onDrop={(e) => {
                    e.preventDefault()
                    const rid = e.dataTransfer.getData('text/resource-id')
                    if (rid) handleDropOnFolder(rid, folder.id)
                  }}
                >
                  {/* Folder actions */}
                  <div
                    className="absolute top-2 right-2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => openFolderModal(folder)}
                      className="rounded p-0.5 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Pencil className="h-2.5 w-2.5" />
                    </button>
                    <button
                      onClick={() => setPendingDeleteFolderId(folder.id)}
                      className="rounded p-0.5 text-muted-foreground hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="h-2.5 w-2.5" />
                    </button>
                  </div>

                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-lg mb-2.5"
                    style={{
                      background: colorHex + '15',
                      color: colorHex,
                    }}
                  >
                    <FolderOpen className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-semibold text-foreground text-center truncate w-full">
                    {folder.name}
                  </span>
                  <span className="text-[10px] text-muted-foreground mt-1">
                    {count} {count === 1 ? 'Datei' : 'Dateien'}
                  </span>
                </div>
              )
            })}

          {/* Resources */}
          {visibleItems.map(renderResourceCard)}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {/* Back button when inside folder */}
          {currentFolderId && (
            <div
              onClick={() => setCurrentFolderId(null)}
              className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 cursor-pointer hover:border-primary/30 transition-colors"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                <X className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">
                Zurück
              </span>
            </div>
          )}

          {/* Folders (list view) */}
          {!currentFolderId &&
            folders.map((folder) => {
              const count = resources.filter(
                (r) => r.folderId === folder.id,
              ).length
              const colorHex =
                FOLDER_COLORS.find((c) => c.key === folder.color)?.hex ??
                '#9333ea'

              return (
                <div
                  key={folder.id}
                  className={cn(
                    'group flex items-center gap-4 rounded-lg border bg-card px-4 py-3 cursor-pointer transition-all',
                    dragOverFolderId === folder.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/30',
                  )}
                  onClick={() => setCurrentFolderId(folder.id)}
                  onDragOver={(e) => {
                    e.preventDefault()
                    setDragOverFolderId(folder.id)
                  }}
                  onDragLeave={() => setDragOverFolderId(null)}
                  onDrop={(e) => {
                    e.preventDefault()
                    const rid = e.dataTransfer.getData('text/resource-id')
                    if (rid) handleDropOnFolder(rid, folder.id)
                  }}
                >
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-lg shrink-0"
                    style={{
                      background: colorHex + '15',
                      color: colorHex,
                    }}
                  >
                    <FolderOpen className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-foreground truncate block">
                      {folder.name}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {count} {count === 1 ? 'Datei' : 'Dateien'}
                    </span>
                  </div>
                  <div
                    className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => openFolderModal(folder)}
                      className="rounded p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    >
                      <Pencil className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => setPendingDeleteFolderId(folder.id)}
                      className="rounded p-1 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                </div>
              )
            })}

          {/* Resources (list view) */}
          {visibleItems.map(renderResourceRow)}
        </div>
      )}

      {/* ── Preview Modal ─────────────────────────────────────────────── */}
      {previewResource && (() => {
        const meta = RESOURCE_TYPE_META[previewResource.type]
        const Icon = meta.icon
        return (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setPreviewResource(null)}
            />
            <div className="relative w-full max-w-2xl max-h-[80vh] flex flex-col rounded-2xl border border-border bg-card shadow-2xl animate-scale-in">
              {/* Header */}
              <div className="flex items-start gap-4 border-b border-border px-6 py-4 shrink-0">
                <div
                  className={cn(
                    'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl',
                    meta.color,
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-foreground truncate">
                    {previewResource.title}
                  </h3>
                  <div className="flex items-center gap-2.5 mt-1.5 flex-wrap">
                    {renderTypeBadge(previewResource.type)}
                    <span className="text-[11px] text-muted-foreground">
                      {formatDate(previewResource.createdAt)}
                    </span>
                    {previewResource.linkedNodeId && (
                      <span className="flex items-center gap-1 text-[11px] text-primary font-medium">
                        <Link className="h-2.5 w-2.5" />
                        Verknüpft
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setPreviewResource(null)}
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted transition-colors shrink-0"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {previewResource.fileReference && (
                  <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-lg bg-muted border border-border">
                    <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="text-xs text-muted-foreground truncate">
                      {previewResource.fileReference}
                    </span>
                  </div>
                )}
                <div className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                  {previewResource.content}
                </div>
              </div>

              {/* Footer actions */}
              <div className="flex items-center justify-between border-t border-border px-4 py-3 shrink-0">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleCopy(previewResource.content)}
                    className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3 w-3 text-emerald-500" />
                        <span className="text-emerald-500">Kopiert</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        Kopieren
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setPreviewResource(null)
                      openEditForm(previewResource)
                    }}
                    className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors"
                  >
                    <Pencil className="h-3 w-3" />
                    Bearbeiten
                  </button>
                </div>
                <button
                  onClick={() => {
                    setPreviewResource(null)
                    setConfirmDeleteId(previewResource.id)
                  }}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 className="h-3 w-3" />
                  Löschen
                </button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* ── Folder Modal ──────────────────────────────────────────────── */}
      {showFolderModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowFolderModal(false)}
          />
          <div className="relative w-full max-w-sm rounded-2xl border border-border bg-card shadow-2xl p-6 animate-scale-in">
            <h3 className="text-lg font-bold text-foreground mb-5">
              {editingFolder ? 'Ordner bearbeiten' : 'Neuer Ordner'}
            </h3>
            <label className="text-[11px] font-medium text-muted-foreground mb-1.5 block">
              Ordnername
            </label>
            <input
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              className={cn(
                'w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground mb-4',
                'placeholder:text-muted-foreground/60',
                'focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/40',
              )}
              placeholder="z.B. Kunden-Creatives"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveFolder()
              }}
            />
            <label className="text-[11px] font-medium text-muted-foreground mb-1.5 block">
              Farbe
            </label>
            <div className="flex items-center gap-2 mb-6">
              {FOLDER_COLORS.map((c) => (
                <button
                  key={c.key}
                  onClick={() => setNewFolderColor(c.key)}
                  className={cn(
                    'w-7 h-7 rounded-full transition-all',
                    newFolderColor === c.key &&
                      'ring-2 ring-offset-2 ring-primary dark:ring-offset-card',
                  )}
                  style={{ background: c.hex }}
                />
              ))}
            </div>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowFolderModal(false)}
                className="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={handleSaveFolder}
                disabled={!newFolderName.trim()}
                className={cn(
                  'rounded-lg px-5 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                )}
              >
                Speichern
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Resource Confirmation ───────────────────────────────── */}
      <ConfirmDialog
        open={confirmDeleteId !== null}
        title="Ressource löschen"
        description="Diese Ressource wird unwiderruflich entfernt."
        confirmLabel="Löschen"
        variant="danger"
        onConfirm={() => {
          if (confirmDeleteId) handleDelete(confirmDeleteId)
        }}
        onCancel={() => setConfirmDeleteId(null)}
      />

      {/* ── Delete Folder Confirmation ─────────────────────────────────── */}
      <ConfirmDialog
        open={pendingDeleteFolderId !== null}
        title="Ordner löschen"
        description="Der Ordner wird gelöscht. Alle enthaltenen Ressourcen werden auf die Hauptebene verschoben."
        confirmLabel="Löschen"
        variant="danger"
        onConfirm={() => {
          if (pendingDeleteFolderId) handleDeleteFolder(pendingDeleteFolderId)
        }}
        onCancel={() => setPendingDeleteFolderId(null)}
      />
    </div>
  )
}
