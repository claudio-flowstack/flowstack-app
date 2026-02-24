import { useEffect, useState, useCallback } from 'react'
import { Header } from '@/shell/Header'
import { useLanguage } from '@/core/i18n/context'
import { useContentStore } from '../application/content-store'
import type { ContentItem, ContentPlatform, ContentStatus, ContentPriority } from '../domain/types'
import { CONTENT_TABS, STATUS_CONFIG, PRIORITY_CONFIG } from '../domain/constants'
import type { ContentTabId } from '../domain/constants'
import { ContentCard } from '../components/ContentCard'
import { ContentPipeline } from '../components/ContentPipeline'
import { ContentDetailModal } from '../components/ContentDetailModal'
import { ContentCalendar } from '../components/ContentCalendar'
import { ContentFiles } from '../components/ContentFiles'
import { ContentPlanning } from '../components/ContentPlanning'
import { CreateContentModal } from '../components/CreateContentModal'
import { ConfirmDialog } from '@/shared/components/ConfirmDialog'
import { SearchInput } from '@/shared/components/SearchInput'
import { cn } from '@/shared/lib/utils'
import { EmptyState } from '@/shared/components/EmptyState'
import { Plus, FileText } from 'lucide-react'

export function ContentPage() {
  const { t } = useLanguage()
  const {
    items,
    files,
    plans,
    loading,
    fetchItems,
    fetchFiles,
    fetchPlans,
    createItem,
    updateItem,
    deleteItem,
    duplicateItem,
    moveItemStatus,
    createFile,
    deleteFile,
    createPlan,
    updatePlan,
    deletePlan,
  } = useContentStore()

  const [activeTab, setActiveTab] = useState<ContentTabId>('overview')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<ContentStatus | 'all'>('all')
  const [priorityFilter, setPriorityFilter] = useState<ContentPriority | 'all'>('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [duplicateTarget, setDuplicateTarget] = useState<string | null>(null)
  const [detailItem, setDetailItem] = useState<ContentItem | null>(null)

  useEffect(() => {
    fetchItems()
    fetchFiles()
    fetchPlans()
  }, [fetchItems, fetchFiles, fetchPlans])

  // ── Filtered Items ────────────────────────────────────────────────────────

  const getFilteredItems = useCallback(() => {
    let result = items

    // Tab-based filtering
    switch (activeTab) {
      case 'ideas':
        result = result.filter((i) => i.status === 'idea')
        break
      case 'youtube':
        result = result.filter((i) => i.platform === 'youtube')
        break
      case 'instagram':
        result = result.filter((i) => i.platform === 'instagram')
        break
      case 'facebook-linkedin':
        result = result.filter((i) => i.platform === 'facebook-linkedin')
        break
    }

    // Search
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          i.concept.toLowerCase().includes(q) ||
          i.angle.toLowerCase().includes(q) ||
          i.tags.some((tag) => tag.toLowerCase().includes(q)),
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter((i) => i.status === statusFilter)
    }

    // Priority filter
    if (priorityFilter !== 'all') {
      result = result.filter((i) => i.priority === priorityFilter)
    }

    return result
  }, [items, activeTab, search, statusFilter, priorityFilter])

  const filtered = getFilteredItems()

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleCreate = useCallback(
    async (platform: ContentPlatform, title: string) => {
      await createItem({ platform, title })
      setShowCreateModal(false)
    },
    [createItem],
  )

  const handleDelete = useCallback(async () => {
    if (deleteTarget) {
      await deleteItem(deleteTarget)
      setDeleteTarget(null)
    }
  }, [deleteTarget, deleteItem])

  const handleDuplicate = useCallback(async () => {
    if (duplicateTarget) {
      await duplicateItem(duplicateTarget)
      setDuplicateTarget(null)
    }
  }, [duplicateTarget, duplicateItem])

  const handleOpen = useCallback((id: string) => {
    const item = items.find((i) => i.id === id)
    if (item) setDetailItem(item)
  }, [items])

  const handleDetailSave = useCallback(
    (id: string, updates: Partial<ContentItem>) => {
      updateItem(id, updates)
    },
    [updateItem],
  )

  // ── Stats ─────────────────────────────────────────────────────────────────

  const totalItems = items.length
  const liveItems = items.filter((i) => i.status === 'live').length
  const scheduledItems = items.filter((i) => i.status === 'scheduled').length
  const ideaItems = items.filter((i) => i.status === 'idea').length

  // ── Render ────────────────────────────────────────────────────────────────

  const isPipeline = activeTab === 'pipeline'
  const isCalendar = activeTab === 'calendar'
  const isFiles = activeTab === 'files'
  const isPlanning = activeTab === 'planning'
  const isContentTab = !isPipeline && !isCalendar && !isFiles && !isPlanning

  return (
    <>
      <Header
        title={t('content.title')}
        subtitle={t('content.subtitle')}
        actions={
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Content erstellen</span>
          </button>
        }
      />

      <div className="p-4 lg:p-6 space-y-6">
        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Gesamt
            </p>
            <p className="mt-1 text-2xl font-bold text-foreground">
              {totalItems}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Live
            </p>
            <p className="mt-1 text-2xl font-bold text-emerald-500">
              {liveItems}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Geplant
            </p>
            <p className="mt-1 text-2xl font-bold text-cyan-500">
              {scheduledItems}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Ideen
            </p>
            <p className="mt-1 text-2xl font-bold text-violet-500">
              {ideaItems}
            </p>
          </div>
        </div>

        {/* Tab Bar */}
        <div className="flex items-center gap-1 border-b border-border overflow-x-auto">
          {CONTENT_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'shrink-0 px-3 py-2.5 text-sm font-medium border-b-2 transition-colors',
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Pipeline Tab */}
        {isPipeline && (
          <ContentPipeline
            items={items}
            onOpen={handleOpen}
            onMoveStatus={moveItemStatus}
          />
        )}

        {/* Calendar Tab */}
        {isCalendar && (
          <ContentCalendar
            items={items}
            onOpenItem={handleOpen}
          />
        )}

        {/* Files Tab */}
        {isFiles && (
          <ContentFiles
            files={files}
            onCreateFile={createFile}
            onDeleteFile={deleteFile}
          />
        )}

        {/* Planning Tab */}
        {isPlanning && (
          <ContentPlanning
            plans={plans}
            onCreatePlan={createPlan}
            onUpdatePlan={updatePlan}
            onDeletePlan={deletePlan}
          />
        )}

        {/* Content Grid Tabs */}
        {isContentTab && (
          <>
            {/* Filters */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Content durchsuchen..."
                className="w-full sm:w-64"
              />

              <div className="flex items-center gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) =>
                    setStatusFilter(e.target.value as ContentStatus | 'all')
                  }
                  className="rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-foreground outline-none focus:border-primary"
                >
                  <option value="all">Alle Status</option>
                  {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                    <option key={key} value={key}>
                      {config.label}
                    </option>
                  ))}
                </select>

                <select
                  value={priorityFilter}
                  onChange={(e) =>
                    setPriorityFilter(
                      e.target.value as ContentPriority | 'all',
                    )
                  }
                  className="rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-foreground outline-none focus:border-primary"
                >
                  <option value="all">Alle Prioritäten</option>
                  {Object.entries(PRIORITY_CONFIG).map(([key, config]) => (
                    <option key={key} value={key}>
                      {config.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Content Grid */}
            {loading && items.length === 0 ? (
              <div className="flex items-center justify-center py-20">
                <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              </div>
            ) : filtered.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map((item) => (
                  <ContentCard
                    key={item.id}
                    item={item}
                    onOpen={handleOpen}
                    onDelete={setDeleteTarget}
                    onDuplicate={setDuplicateTarget}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={FileText}
                title="Kein Content gefunden"
                description={
                  search
                    ? 'Versuche einen anderen Suchbegriff'
                    : 'Erstelle deinen ersten Content-Beitrag.'
                }
                action={
                  !search
                    ? {
                        label: 'Content erstellen',
                        onClick: () => setShowCreateModal(true),
                      }
                    : undefined
                }
              />
            )}
          </>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <CreateContentModal
          onCreateItem={handleCreate}
          onClose={() => setShowCreateModal(false)}
        />
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteTarget !== null}
        title="Content löschen"
        description="Möchtest du diesen Content wirklich löschen? Dieser Vorgang kann nicht rückgängig gemacht werden."
        confirmLabel="Löschen"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Duplicate Confirmation */}
      <ConfirmDialog
        open={duplicateTarget !== null}
        title="Content duplizieren"
        description="Eine Kopie dieses Contents wird als Idee erstellt."
        confirmLabel="Duplizieren"
        variant="info"
        onConfirm={handleDuplicate}
        onCancel={() => setDuplicateTarget(null)}
      />

      {/* Detail Modal */}
      {detailItem && (
        <ContentDetailModal
          item={detailItem}
          onSave={handleDetailSave}
          onClose={() => setDetailItem(null)}
        />
      )}
    </>
  )
}
