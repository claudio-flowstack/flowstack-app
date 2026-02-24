import { useEffect, useMemo, useState, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Header } from '@/shell/Header'
import { useAutomationStore } from '../application/automation-store'
import type { AutomationSystem, SystemNode, WorkflowVersion } from '../domain/types'
import { OutputViewer } from '../components/OutputViewer'
import { ResourceManager } from '../components/ResourceManager'
import { PipelineView } from '../components/PipelineView'
import { NodeEditModal } from '../canvas/NodeEditModal'
import { EmptyState } from '@/shared/components/EmptyState'
import { ConfirmDialog } from '@/shared/components/ConfirmDialog'
import { cn } from '@/shared/lib/utils'
import { formatDateTime } from '@/shared/lib/utils'
import {
  Workflow,
  Pencil,
  Zap,
  Activity,
  Layers,
  FolderOpen,
  Clock,
  ChevronRight,
  GitBranch,
  RotateCcw,
  FileBox,
  Settings,
  Trash2,
  Power,
  PowerOff,
  Plus,
} from 'lucide-react'

// ── Tab config ───────────────────────────────────────────────────────────────

type DetailTab = 'documents' | 'resources' | 'versions' | 'settings'

const DETAIL_TABS: { key: DetailTab; label: string; icon: typeof FolderOpen }[] = [
  { key: 'documents', label: 'Dokumente', icon: FolderOpen },
  { key: 'resources', label: 'Ressourcen', icon: FileBox },
  { key: 'versions', label: 'Versionen', icon: GitBranch },
  { key: 'settings', label: 'Einstellungen', icon: Settings },
]

// ── System Detail Page (Level 2) ─────────────────────────────────────────────

export function SystemDetailPage() {
  const { systemId } = useParams<{ systemId: string }>()
  const navigate = useNavigate()
  const {
    systems,
    fetchSystems,
    createSystem,
    updateSystem,
    deleteSystem,
    toggleSystemStatus,
    loading,
    resources,
    fetchResources,
    updateResource,
  } = useAutomationStore()
  const system = systems.find((s) => s.id === systemId)

  const [detailTab, setDetailTab] = useState<DetailTab>('documents')
  const [versions, setVersions] = useState<WorkflowVersion[]>([])
  const [editingName, setEditingName] = useState(false)
  const [editName, setEditName] = useState('')
  const [editingDesc, setEditingDesc] = useState(false)
  const [editDesc, setEditDesc] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [editingNode, setEditingNode] = useState<SystemNode | null>(null)
  const [pipelineEditMode, setPipelineEditMode] = useState(false)

  useEffect(() => {
    if (systems.length === 0) fetchSystems()
  }, [systems.length, fetchSystems])

  useEffect(() => {
    if (system) {
      setVersions(system.versions ?? [])
    }
  }, [system])

  useEffect(() => {
    if (systemId) fetchResources(systemId)
  }, [systemId, fetchResources])

  const parentSystem = useMemo(
    () => (system?.parentId ? systems.find((s) => s.id === system.parentId) : undefined),
    [system, systems],
  )

  const subSystems = useMemo(
    () =>
      systems
        .filter((s) => s.parentId === systemId)
        .sort((a, b) => (a.subSystemOrder ?? 0) - (b.subSystemOrder ?? 0)),
    [systems, systemId],
  )

  const siblings = useMemo(() => {
    if (!parentSystem) return []
    return systems
      .filter((s) => s.parentId === parentSystem.id)
      .sort((a, b) => (a.subSystemOrder ?? 0) - (b.subSystemOrder ?? 0))
  }, [parentSystem, systems])

  const totalNodeCount = useMemo(() => {
    if (subSystems.length === 0) return system?.nodes.length ?? 0
    return (
      (system?.nodes.filter((n) => n.type !== 'subsystem').length ?? 0) +
      subSystems.reduce((sum, s) => sum + s.nodes.length, 0)
    )
  }, [system, subSystems])

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleRestoreVersion = useCallback(
    (ver: WorkflowVersion) => {
      if (!systemId) return
      try {
        const snapshot = JSON.parse(ver.snapshot) as {
          nodes: AutomationSystem['nodes']
          connections: AutomationSystem['connections']
        }
        updateSystem(systemId, {
          nodes: snapshot.nodes,
          connections: snapshot.connections,
        })
      } catch {
        // Invalid snapshot
      }
    },
    [systemId, updateSystem],
  )

  const handleSaveName = useCallback(() => {
    if (!systemId || !editName.trim()) return
    updateSystem(systemId, { name: editName.trim() })
    setEditingName(false)
  }, [systemId, editName, updateSystem])

  const handleSaveDesc = useCallback(() => {
    if (!systemId) return
    updateSystem(systemId, { description: editDesc.trim() })
    setEditingDesc(false)
  }, [systemId, editDesc, updateSystem])

  const handleDelete = useCallback(async () => {
    if (!systemId) return
    await deleteSystem(systemId)
    navigate('/automation')
  }, [systemId, deleteSystem, navigate])

  const handleSaveNode = useCallback(
    (updates: Partial<SystemNode>) => {
      if (!editingNode || !systemId || !system) return
      const exists = system.nodes.some((n) => n.id === editingNode.id)
      const updatedNodes = exists
        ? system.nodes.map((n) => (n.id === editingNode.id ? { ...n, ...updates } : n))
        : [...system.nodes, { ...editingNode, ...updates }]
      updateSystem(systemId, { nodes: updatedNodes })
      setEditingNode(null)
    },
    [editingNode, system, systemId, updateSystem],
  )

  const handleRemoveNode = useCallback(
    (nodeId: string) => {
      if (!systemId || !system) return
      updateSystem(systemId, {
        nodes: system.nodes.filter((n) => n.id !== nodeId),
        connections: system.connections.filter((c) => c.from !== nodeId && c.to !== nodeId),
      })
    },
    [system, systemId, updateSystem],
  )

  const handleAddNode = useCallback(() => {
    if (!system) return
    const newNode: SystemNode = {
      id: `node-${Date.now()}`,
      type: 'process',
      label: 'Neuer Schritt',
      description: '',
      icon: 'workflow',
      position: { x: 0, y: 0 },
      subNodes: [],
    }
    setEditingNode(newNode)
  }, [system])

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading && !system) {
    return (
      <>
        <Header title="Laden..." />
        <div className="flex items-center justify-center h-full min-h-[60vh]">
          <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      </>
    )
  }

  if (!system) {
    return (
      <>
        <Header title="System nicht gefunden" />
        <div className="p-6">
          <EmptyState
            icon={Workflow}
            title="System nicht gefunden"
            description="Das angeforderte System existiert nicht."
            action={{ label: 'Zurück', onClick: () => navigate('/automation') }}
          />
        </div>
      </>
    )
  }

  return (
    <div>
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="border-b border-border">
        <div className="px-4 lg:px-6 py-4">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
            <button
              onClick={() => navigate('/automation')}
              className="hover:text-foreground transition-colors"
            >
              Automation
            </button>
            {parentSystem && (
              <>
                <ChevronRight className="h-3 w-3" />
                <button
                  onClick={() => navigate(`/automation/system/${parentSystem.id}`)}
                  className="hover:text-foreground transition-colors"
                >
                  {parentSystem.name}
                </button>
              </>
            )}
            <ChevronRight className="h-3 w-3" />
            <span className="text-foreground font-medium">{system.name}</span>
          </div>

          {/* Title Row */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div
                className={cn(
                  'flex h-12 w-12 items-center justify-center rounded-xl shrink-0',
                  system.status === 'active'
                    ? 'bg-primary/10 text-primary'
                    : 'bg-muted text-muted-foreground',
                )}
              >
                <Workflow className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-bold text-foreground">{system.name}</h1>
                  <span
                    className={cn(
                      'text-[10px] font-medium rounded-full px-2.5 py-0.5',
                      system.status === 'active'
                        ? 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                        : 'bg-muted text-muted-foreground',
                    )}
                  >
                    {system.status === 'active' ? 'Aktiv' : 'Entwurf'}
                  </span>
                  {parentSystem && (
                    <span className="text-[10px] font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-500/15 rounded-full px-2 py-0.5">
                      Sub-System
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {system.description || 'Keine Beschreibung'}
                </p>
              </div>
            </div>

            {/* CTA: Open Editor + Add Sub-System */}
            <div className="flex items-center gap-2 shrink-0">
              {!parentSystem && (
                <button
                  onClick={async () => {
                    try {
                      const existingSubs = systems.filter((s) => s.parentId === systemId)
                      const newSub = await createSystem({
                        name: `Sub-System ${existingSubs.length + 1}`,
                        description: '',
                        parentId: systemId,
                        subSystemOrder: existingSubs.length,
                        status: 'draft',
                        icon: 'workflow',
                        category: system.category,
                        nodes: [],
                        connections: [],
                        groups: [],
                      })
                      navigate(`/automation/system/${newSub.id}/editor`)
                    } catch {
                      // createSystem failed — store already handles error state
                    }
                  }}
                  className="flex items-center gap-2 rounded-lg border border-border px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Sub-System
                </button>
              )}
              <button
                onClick={() => navigate(`/automation/system/${systemId}/editor`)}
                className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <Pencil className="h-4 w-4" />
                Editor öffnen
              </button>
            </div>
          </div>
        </div>

        {/* Sub-System Sibling Tabs */}
        {parentSystem && siblings.length > 1 && (
          <div className="flex items-center gap-1 px-4 lg:px-6 py-1.5 overflow-x-auto bg-muted/30">
            {siblings.map((sib) => (
              <button
                key={sib.id}
                onClick={() => navigate(`/automation/system/${sib.id}`)}
                className={cn(
                  'px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors',
                  sib.id === systemId
                    ? 'bg-indigo-100 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted',
                )}
              >
                {sib.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Pipeline View ───────────────────────────────────────────────── */}
      <div className="px-4 lg:px-6 pt-2 pb-2">
        <PipelineView
          system={system}
          subSystems={subSystems}
          editMode={pipelineEditMode}
          onToggleEditMode={() => setPipelineEditMode((v) => !v)}
          onEditNode={pipelineEditMode ? setEditingNode : undefined}
          onRemoveNode={pipelineEditMode ? handleRemoveNode : undefined}
          onAddNode={pipelineEditMode ? handleAddNode : undefined}
        />
      </div>

      {/* ── Stats ───────────────────────────────────────────────────────── */}
      <div className="px-4 lg:px-6 py-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            icon={<Zap className="h-4 w-4 text-purple-600 dark:text-purple-400" />}
            iconBg="bg-purple-100 dark:bg-purple-500/15"
            value={system.executionCount}
            label="Ausführungen"
          />
          <StatCard
            icon={<Activity className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
            iconBg="bg-blue-100 dark:bg-blue-500/15"
            value={totalNodeCount}
            label="Schritte gesamt"
          />
          {subSystems.length > 0 && (
            <StatCard
              icon={<Layers className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />}
              iconBg="bg-indigo-100 dark:bg-indigo-500/15"
              value={subSystems.length}
              label="Sub-Systeme"
            />
          )}
          <StatCard
            icon={<Clock className="h-4 w-4 text-muted-foreground" />}
            iconBg="bg-muted"
            value={system.lastExecuted ? formatDateTime(system.lastExecuted) : '—'}
            label="Letzte Ausführung"
            isText
          />
        </div>
      </div>

      {/* ── Tab Bar ─────────────────────────────────────────────────────── */}
      <div className="border-t border-border px-4 lg:px-6 pt-2">
        <div className="flex items-center gap-1 bg-muted/50 rounded-xl p-0.5 w-fit">
          {DETAIL_TABS.map(({ key, label, icon: TabIcon }) => (
            <button
              key={key}
              onClick={() => setDetailTab(key)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors',
                detailTab === key
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <TabIcon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab Content ─────────────────────────────────────────────────── */}
      <div className="px-4 lg:px-6 py-4 pb-8">
        {/* ── Documents ─────────────────────────────────────────────── */}
        {detailTab === 'documents' && (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <FolderOpen className="h-5 w-5 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-foreground">Dokumente</h3>
              <span className="text-[10px] text-muted-foreground bg-muted rounded-full px-2 py-0.5">
                {system.outputs.length}
              </span>
            </div>
            {system.outputs.length > 0 ? (
              <div className="rounded-2xl border border-border bg-card p-5">
                <OutputViewer outputs={system.outputs as never[]} />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted mb-4">
                  <FolderOpen className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground">Noch keine Dokumente</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Starte das System, um Dokumente zu generieren.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── Resources ─────────────────────────────────────────────── */}
        {detailTab === 'resources' && (
          <ResourceManager
            resources={resources}
            systemId={systemId}
            onUpdate={(updated) => {
              for (const res of updated) {
                updateResource(res.id, res)
              }
            }}
          />
        )}

        {/* ── Versions ──────────────────────────────────────────────── */}
        {detailTab === 'versions' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <GitBranch className="h-5 w-5 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-foreground">Versionen</h3>
              <span className="text-[10px] text-muted-foreground bg-muted rounded-full px-2 py-0.5">
                {versions.length}
              </span>
            </div>

            {versions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted mb-4">
                  <GitBranch className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground">Noch keine Versionen</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Speichere den Workflow, um eine Version zu erstellen.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {versions.map((ver, idx) => {
                  const versionNum = versions.length - idx
                  const isCurrent = idx === 0
                  return (
                    <div
                      key={ver.id}
                      className={cn(
                        'rounded-2xl border bg-card p-4 flex items-center gap-4',
                        isCurrent ? 'border-purple-300 dark:border-purple-500/40' : 'border-border',
                      )}
                    >
                      <div
                        className={cn(
                          'flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold shrink-0',
                          isCurrent
                            ? 'bg-purple-100 dark:bg-purple-500/15 text-purple-600 dark:text-purple-400'
                            : 'bg-muted text-muted-foreground',
                        )}
                      >
                        V{versionNum}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-foreground">Version {versionNum}</p>
                          {ver.label && (
                            <span className="text-[10px] text-muted-foreground bg-muted rounded-full px-2 py-0.5">
                              {ver.label}
                            </span>
                          )}
                          {isCurrent && (
                            <span className="text-[10px] font-medium text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-500/15 rounded-full px-2 py-0.5">
                              Aktuell
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
                          <span>{formatDateTime(ver.timestamp)}</span>
                          <span>{ver.nodeCount} Nodes</span>
                          <span>{ver.connectionCount} Verbindungen</span>
                        </div>
                      </div>
                      {!isCurrent && (
                        <button
                          onClick={() => handleRestoreVersion(ver)}
                          className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          Wiederherstellen
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Settings ──────────────────────────────────────────────── */}
        {detailTab === 'settings' && (
          <div className="space-y-6 max-w-2xl">
            <div className="flex items-center gap-3 mb-2">
              <Settings className="h-5 w-5 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-foreground">System-Einstellungen</h3>
            </div>

            {/* Name */}
            <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Name
              </label>
              {editingName ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveName()
                      if (e.key === 'Escape') setEditingName(false)
                    }}
                  />
                  <button
                    onClick={handleSaveName}
                    className="rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    Speichern
                  </button>
                  <button
                    onClick={() => setEditingName(false)}
                    className="rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    Abbrechen
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">{system.name}</p>
                  <button
                    onClick={() => {
                      setEditName(system.name)
                      setEditingName(true)
                    }}
                    className="text-xs text-primary hover:text-primary/80 transition-colors"
                  >
                    Bearbeiten
                  </button>
                </div>
              )}
            </div>

            {/* Description */}
            <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Beschreibung
              </label>
              {editingDesc ? (
                <div className="space-y-2">
                  <textarea
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    rows={3}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
                    autoFocus
                  />
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSaveDesc}
                      className="rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                      Speichern
                    </button>
                    <button
                      onClick={() => setEditingDesc(false)}
                      className="rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    >
                      Abbrechen
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    {system.description || 'Keine Beschreibung'}
                  </p>
                  <button
                    onClick={() => {
                      setEditDesc(system.description || '')
                      setEditingDesc(true)
                    }}
                    className="text-xs text-primary hover:text-primary/80 transition-colors shrink-0"
                  >
                    Bearbeiten
                  </button>
                </div>
              )}
            </div>

            {/* Status Toggle */}
            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Status
                  </label>
                  <div className="flex items-center gap-2 mt-2">
                    <span
                      className={cn(
                        'w-2 h-2 rounded-full',
                        system.status === 'active' ? 'bg-emerald-500' : 'bg-muted-foreground/40',
                      )}
                    />
                    <p className="text-sm font-medium text-foreground">
                      {system.status === 'active' ? 'Aktiv' : 'Entwurf'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => toggleSystemStatus(system.id)}
                  className={cn(
                    'flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-medium transition-colors',
                    system.status === 'active'
                      ? 'border border-border text-muted-foreground hover:text-foreground hover:bg-muted'
                      : 'bg-emerald-500 text-white hover:bg-emerald-600',
                  )}
                >
                  {system.status === 'active' ? (
                    <>
                      <PowerOff className="h-3.5 w-3.5" />
                      Deaktivieren
                    </>
                  ) : (
                    <>
                      <Power className="h-3.5 w-3.5" />
                      Aktivieren
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Delete */}
            <div className="rounded-2xl border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/5 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-red-600 dark:text-red-400">
                    System löschen
                  </p>
                  <p className="text-xs text-red-500/70 dark:text-red-400/60 mt-1">
                    Dieser Vorgang kann nicht rückgängig gemacht werden.
                  </p>
                </div>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center gap-2 rounded-lg bg-red-500 hover:bg-red-600 px-4 py-2 text-xs font-medium text-white transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Löschen
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={showDeleteConfirm}
        title="System löschen"
        description={`Möchtest du "${system.name}" wirklich löschen? Dieser Vorgang kann nicht rückgängig gemacht werden.`}
        confirmLabel="Löschen"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />

      {/* Node Edit Modal */}
      {editingNode && (
        <NodeEditModal
          node={editingNode}
          onSave={handleSaveNode}
          onClose={() => setEditingNode(null)}
        />
      )}
    </div>
  )
}

// ── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  icon,
  iconBg,
  value,
  label,
  isText,
}: {
  icon: React.ReactNode
  iconBg: string
  value: number | string
  label: string
  isText?: boolean
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
      <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg shrink-0', iconBg)}>
        {icon}
      </div>
      <div className="min-w-0">
        <p
          className={cn(
            'font-bold text-foreground',
            isText ? 'text-xs' : 'text-lg',
          )}
        >
          {value}
        </p>
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
      </div>
    </div>
  )
}
