import { useEffect, useState, useCallback } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import { Header } from '@/shell/Header'
import { useLanguage } from '@/core/i18n/context'
import { useAutomationStore } from '../application/automation-store'
import type { AutomationSystem, WorkflowTemplate } from '../domain/types'
import { NODE_TYPE_CONFIG } from '../domain/constants'
import { renderNodeIcon } from '../canvas/ToolLogos'
import { getNodeIcon } from '../canvas/icons'
import { SystemCard } from '../components/SystemCard'
import { TemplatePicker } from '../components/TemplatePicker'
import { WizardTemplateBuilder } from '../components/WizardTemplateBuilder'
import { FunnelBoardGrid } from '../funnel/FunnelBoardGrid'
import { NodeLabPage } from './NodeLabPage'
import { AutomationSettingsPage } from './AutomationSettingsPage'
import { ErrorBoundary } from '@/shared/components/ErrorBoundary'
import { ConfirmDialog } from '@/shared/components/ConfirmDialog'
import { SearchInput } from '@/shared/components/SearchInput'
import { EmptyState } from '@/shared/components/EmptyState'
import { useUIStore } from '@/shared/stores/ui-store'
import { cn } from '@/shared/lib/utils'
import {
  Plus,
  Workflow,
  LayoutGrid,
  List,
  FileBox,
  GitFork,
  FlaskConical,
  Wand2,
  ArrowUpDown,
  Eye,
  EyeOff,
  X,
  Copy,
} from 'lucide-react'

// ── Tab Types ────────────────────────────────────────────────────────────────

type OverviewTab = 'systems' | 'templates' | 'funnels' | 'nodelab'

const OVERVIEW_TABS: { key: OverviewTab; label: string; icon: typeof Workflow }[] = [
  { key: 'systems', label: 'Systeme', icon: Workflow },
  { key: 'templates', label: 'Vorlagen', icon: FileBox },
  { key: 'funnels', label: 'Funnels', icon: GitFork },
  { key: 'nodelab', label: 'Node Lab', icon: FlaskConical },
]

// ── System Overview (list page) ─────────────────────────────────────────────

function SystemOverview() {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const {
    systems,
    templates,
    loading,
    fetchSystems,
    fetchTemplates,
    createSystem,
    createSystemFromTemplate,
    deleteSystem,
    duplicateSystem,
    toggleSystemStatus,
    activeSystemCount,
    totalExecutionCount,
  } = useAutomationStore()

  const [activeTab, setActiveTab] = useState<OverviewTab>('systems')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'draft'>(
    'all',
  )
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'status' | 'executions'>('date')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [showTemplatePicker, setShowTemplatePicker] = useState(false)
  const [showWizard, setShowWizard] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [duplicateTarget, setDuplicateTarget] = useState<string | null>(null)
  const [previewTemplate, setPreviewTemplate] = useState<WorkflowTemplate | null>(null)
  const [templateDuplicateTarget, setTemplateDuplicateTarget] = useState<string | null>(null)
  const { demoMode, toggleDemoMode } = useUIStore()

  useEffect(() => {
    fetchSystems()
    fetchTemplates()
  }, [fetchSystems, fetchTemplates])

  const filtered = systems
    .filter((s) => {
      // Hide sub-systems from overview (they appear inside their master)
      if (s.parentId) return false
      // Hide demo systems when demo mode is off
      if (!demoMode && s.isDemo) return false
      const matchesSearch =
        !search ||
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.description.toLowerCase().includes(search.toLowerCase())
      const matchesStatus = statusFilter === 'all' || s.status === statusFilter
      return matchesSearch && matchesStatus
    })
    .sort((a, b) => {
      let cmp = 0
      switch (sortBy) {
        case 'name':
          cmp = a.name.localeCompare(b.name)
          break
        case 'date':
          cmp = (a.lastExecuted ?? '').localeCompare(b.lastExecuted ?? '')
          break
        case 'status':
          cmp = a.status.localeCompare(b.status)
          break
        case 'executions':
          cmp = a.executionCount - b.executionCount
          break
      }
      return sortDir === 'asc' ? cmp : -cmp
    })

  const handleOpen = useCallback(
    (id: string) => navigate(`/automation/system/${id}`),
    [navigate],
  )

  const handleDelete = useCallback(async () => {
    if (deleteTarget) {
      await deleteSystem(deleteTarget)
      setDeleteTarget(null)
    }
  }, [deleteTarget, deleteSystem])

  const handleDuplicate = useCallback(async () => {
    if (duplicateTarget) {
      await duplicateSystem(duplicateTarget)
      setDuplicateTarget(null)
    }
  }, [duplicateTarget, duplicateSystem])

  const handleCreateBlank = useCallback(async () => {
    const system = await createSystem({
      name: 'Neues System',
      description: '',
    })
    setShowTemplatePicker(false)
    navigate(`/automation/system/${system.id}`)
  }, [createSystem, navigate])

  const handleCreateFromTemplate = useCallback(
    async (templateId: string) => {
      const system = await createSystemFromTemplate(templateId)
      setShowTemplatePicker(false)
      navigate(`/automation/system/${system.id}`)
    },
    [createSystemFromTemplate, navigate],
  )

  const handleWizardComplete = useCallback(
    async (data: { name: string; description: string; nodes: AutomationSystem['nodes']; connections: AutomationSystem['connections'] }) => {
      const system = await createSystem({
        name: data.name,
        description: data.description,
        nodes: data.nodes,
        connections: data.connections,
      })
      setShowWizard(false)
      navigate(`/automation/system/${system.id}`)
    },
    [createSystem, navigate],
  )

  return (
    <>
      <Header
        title={t('automation.title')}
        subtitle={t('automation.subtitle')}
        actions={
          <button
            onClick={() => setShowTemplatePicker(true)}
            className="flex items-center gap-2 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">
              {t('automation.createSystem')}
            </span>
          </button>
        }
      />

      {/* Tab Navigation */}
      <div className="border-b border-border px-4 lg:px-6">
        <nav className="flex gap-1 -mb-px">
          {OVERVIEW_TABS.map(({ key, label, icon: TabIcon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors',
                activeTab === key
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border',
              )}
            >
              <TabIcon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'systems' && (
      <div className="p-4 lg:p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {t('automation.totalSystems')}
            </p>
            <p className="mt-1 text-2xl font-bold text-foreground">
              {systems.length}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {t('automation.activeSystems')}
            </p>
            <p className="mt-1 text-2xl font-bold text-emerald-500">
              {activeSystemCount()}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {t('automation.totalRuns')}
            </p>
            <p className="mt-1 text-2xl font-bold text-foreground">
              {totalExecutionCount()}
            </p>
          </div>
        </div>

        {/* Toolbar: Search + Filter + View Mode */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Systeme durchsuchen..."
            className="w-full sm:w-64"
          />

          <div className="flex items-center gap-2">
            {(['all', 'active', 'draft'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={cn(
                  'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                  statusFilter === status
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:text-foreground',
                )}
              >
                {status === 'all'
                  ? 'Alle'
                  : status === 'active'
                    ? 'Aktiv'
                    : 'Entwurf'}
              </button>
            ))}
          </div>

          <div className="ml-auto flex items-center gap-2">
            {/* Sort */}
            <div className="flex items-center gap-1">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="rounded-lg border border-border bg-card px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
              >
                <option value="date">Datum</option>
                <option value="name">Name</option>
                <option value="status">Status</option>
                <option value="executions">Ausführungen</option>
              </select>
              <button
                onClick={() => setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))}
                className="rounded-lg border border-border p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                title={sortDir === 'asc' ? 'Aufsteigend' : 'Absteigend'}
              >
                <ArrowUpDown className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Demo Mode Toggle */}
            <button
              onClick={toggleDemoMode}
              title={demoMode ? 'Demo-Daten ausblenden' : 'Demo-Daten einblenden'}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors',
                demoMode
                  ? 'bg-purple-100 dark:bg-purple-500/15 text-purple-600 dark:text-purple-400'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted',
              )}
            >
              {demoMode ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
              Demo
            </button>

            <div className="flex items-center gap-1 rounded-lg border border-border p-0.5">
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  'rounded-md p-1.5 transition-colors',
                  viewMode === 'grid'
                    ? 'bg-muted text-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  'rounded-md p-1.5 transition-colors',
                  viewMode === 'list'
                    ? 'bg-muted text-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* System Grid / List */}
        {loading && systems.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        ) : filtered.length > 0 ? (
          <div
            className={cn(
              viewMode === 'grid'
                ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'
                : 'flex flex-col gap-3',
            )}
          >
            {filtered.map((sys) => (
              <SystemCard
                key={sys.id}
                system={sys}
                subSystemCount={systems.filter((s) => s.parentId === sys.id).length}
                onOpen={handleOpen}
                onDelete={setDeleteTarget}
                onDuplicate={setDuplicateTarget}
                onToggleStatus={toggleSystemStatus}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Workflow}
            title="Keine Systeme gefunden"
            description={
              search
                ? 'Versuche einen anderen Suchbegriff'
                : 'Erstelle dein erstes Automation System oder wähle ein Template.'
            }
            action={
              !search
                ? {
                    label: t('automation.createSystem'),
                    onClick: () => setShowTemplatePicker(true),
                  }
                : undefined
            }
          />
        )}
      </div>
      )}

      {/* Templates Tab */}
      {activeTab === 'templates' && (
        <div className="p-4 lg:p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Vorlagen</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowWizard(true)}
                className="flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
              >
                <Wand2 className="h-4 w-4" />
                Wizard Builder
              </button>
              <button
                onClick={() => setShowTemplatePicker(true)}
                className="flex items-center gap-2 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <Plus className="h-4 w-4" />
                System aus Vorlage
              </button>
            </div>
          </div>

          {templates.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map((tmpl) => (
                <button
                  key={tmpl.id}
                  onClick={() => setPreviewTemplate(tmpl)}
                  className={cn(
                    'text-left rounded-xl border bg-card p-4 space-y-2 transition-all',
                    previewTemplate?.id === tmpl.id
                      ? 'border-primary shadow-md'
                      : 'border-border hover:border-primary/40 hover:shadow-md',
                  )}
                >
                  <h3 className="text-sm font-semibold text-foreground">{tmpl.name}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-2">{tmpl.description}</p>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    <span>{tmpl.nodes.length} Nodes</span>
                    <span>{tmpl.connections.length} Verbindungen</span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={FileBox}
              title="Keine Vorlagen"
              description="Es sind noch keine Vorlagen verfügbar."
            />
          )}

          {/* Template Preview Panel */}
          {previewTemplate && (
            <div className="rounded-xl border border-border bg-card p-6 space-y-4 animate-fade-in">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-bold text-foreground">{previewTemplate.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{previewTemplate.description}</p>
                </div>
                <button
                  onClick={() => setPreviewTemplate(null)}
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

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
              {previewTemplate.nodes.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
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
              )}

              {/* Actions */}
              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setTemplateDuplicateTarget(previewTemplate.id)}
                  className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  <Copy className="h-4 w-4" />
                  Duplizieren
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Funnels Tab — Board Grid */}
      {activeTab === 'funnels' && (
        <div className="flex-1 min-h-0 overflow-auto p-6">
          <ErrorBoundary>
            <FunnelBoardGrid />
          </ErrorBoundary>
        </div>
      )}

      {/* Node Lab Tab */}
      {activeTab === 'nodelab' && (
        <NodeLabPage />
      )}

      {/* Template Picker Modal */}
      {showTemplatePicker && (
        <TemplatePicker
          templates={templates}
          onSelect={handleCreateFromTemplate}
          onCreateBlank={handleCreateBlank}
          onClose={() => setShowTemplatePicker(false)}
        />
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteTarget !== null}
        title="System löschen"
        description="Möchtest du dieses System wirklich löschen? Dieser Vorgang kann nicht rückgängig gemacht werden."
        confirmLabel="Löschen"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Duplicate Confirmation */}
      <ConfirmDialog
        open={duplicateTarget !== null}
        title="System duplizieren"
        description="Eine Kopie dieses Systems wird als Entwurf erstellt."
        confirmLabel="Duplizieren"
        variant="info"
        onConfirm={handleDuplicate}
        onCancel={() => setDuplicateTarget(null)}
      />

      {/* Template Duplicate Confirmation */}
      <ConfirmDialog
        open={templateDuplicateTarget !== null}
        title="Vorlage duplizieren"
        description="Ein neues System wird aus dieser Vorlage erstellt. Du kannst es anschließend im Editor anpassen."
        confirmLabel="Duplizieren"
        variant="info"
        onConfirm={async () => {
          if (templateDuplicateTarget) {
            await handleCreateFromTemplate(templateDuplicateTarget)
            setTemplateDuplicateTarget(null)
            setPreviewTemplate(null)
          }
        }}
        onCancel={() => setTemplateDuplicateTarget(null)}
      />

      {/* Wizard Template Builder */}
      <WizardTemplateBuilder
        open={showWizard}
        onClose={() => setShowWizard(false)}
        onComplete={handleWizardComplete}
      />
    </>
  )
}

// ── Page Router (Dashboard — with sidebar) ──────────────────────────────────

export function AutomationPage() {
  return (
    <Routes>
      <Route index element={<SystemOverview />} />
      <Route path="node-lab" element={<NodeLabPage />} />
      <Route path="settings" element={<AutomationSettingsPage />} />
    </Routes>
  )
}
