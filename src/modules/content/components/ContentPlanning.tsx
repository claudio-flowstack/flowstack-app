import { useState, useMemo } from 'react'
import type { ContentPlan, PlanTask, ContentPriority } from '../domain/types'
import { PRIORITY_CONFIG } from '../domain/constants'
import { cn } from '@/shared/lib/utils'
import {
  Plus, ChevronLeft, Target, Calendar, Users,
  Trash2, Check, Clock, ArrowRight, BarChart3,
} from 'lucide-react'

// ── Helpers ────────────────────────────────────────────────────────────────

function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

const TASK_STATUS_CONFIG = {
  todo: { label: 'Offen', color: '#6b7280', bg: 'rgba(107,114,128,0.1)' },
  'in-progress': { label: 'In Arbeit', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
  done: { label: 'Erledigt', color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
} as const

type TaskStatus = PlanTask['status']

const NEXT_STATUS: Record<TaskStatus, TaskStatus> = {
  todo: 'in-progress',
  'in-progress': 'done',
  done: 'todo',
}

const CHANNEL_OPTIONS = [
  'YouTube', 'Instagram', 'LinkedIn', 'TikTok', 'Podcast',
  'Cold Calls', 'Cold Emails', 'Ads', 'Homepage', 'Funnel',
] as const

function daysUntil(deadline: string): number {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const target = new Date(deadline)
  target.setHours(0, 0, 0, 0)
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

// ── Props ──────────────────────────────────────────────────────────────────

interface ContentPlanningProps {
  plans: ContentPlan[]
  onCreatePlan: (data: Partial<ContentPlan>) => Promise<ContentPlan>
  onUpdatePlan: (id: string, data: Partial<ContentPlan>) => void
  onDeletePlan: (id: string) => void
}

// ── Component ──────────────────────────────────────────────────────────────

export function ContentPlanning({
  plans,
  onCreatePlan,
  onUpdatePlan,
  onDeletePlan,
}: ContentPlanningProps) {
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null)
  const [activeSubTab, setActiveSubTab] = useState<'tasks' | 'strategy' | 'overview'>('tasks')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [taskFilter, setTaskFilter] = useState<'all' | 'open' | 'done'>('all')

  // Create-plan form
  const [formName, setFormName] = useState('')
  const [formDesc, setFormDesc] = useState('')
  const [formStrategy, setFormStrategy] = useState('')
  const [formGoal, setFormGoal] = useState('')
  const [formAudience, setFormAudience] = useState('')
  const [formDeadline, setFormDeadline] = useState('')
  const [formChannels, setFormChannels] = useState<string[]>([])

  // Add-task form
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [taskTitle, setTaskTitle] = useState('')
  const [taskDesc, setTaskDesc] = useState('')
  const [taskPriority, setTaskPriority] = useState<ContentPriority>('medium')

  const selectedPlan = useMemo(
    () => plans.find((p) => p.id === selectedPlanId) ?? null,
    [plans, selectedPlanId],
  )

  // ── Create plan handlers ────────────────────────────────────

  const resetCreateForm = () => {
    setFormName(''); setFormDesc(''); setFormStrategy('')
    setFormGoal(''); setFormAudience(''); setFormDeadline('')
    setFormChannels([]); setShowCreateForm(false)
  }

  const handleCreatePlan = async () => {
    if (!formName.trim()) return
    await onCreatePlan({
      name: formName.trim(),
      description: formDesc.trim(),
      strategy: formStrategy.trim(),
      goal: formGoal.trim(),
      targetAudience: formAudience.trim(),
      deadline: formDeadline,
      channels: formChannels,
      tasks: [],
      notes: '',
    })
    resetCreateForm()
  }

  const toggleChannel = (ch: string) => {
    setFormChannels((prev) =>
      prev.includes(ch) ? prev.filter((c) => c !== ch) : [...prev, ch],
    )
  }

  // ── Task handlers ───────────────────────────────────────────

  const handleAddTask = () => {
    if (!selectedPlan || !taskTitle.trim()) return
    const newTask: PlanTask = {
      id: createId('task'),
      title: taskTitle.trim(),
      description: taskDesc.trim(),
      status: 'todo',
      priority: taskPriority,
    }
    onUpdatePlan(selectedPlan.id, {
      tasks: [...selectedPlan.tasks, newTask],
    })
    setTaskTitle(''); setTaskDesc(''); setTaskPriority('medium'); setShowTaskForm(false)
  }

  const cycleTaskStatus = (taskId: string) => {
    if (!selectedPlan) return
    const updated = selectedPlan.tasks.map((t) =>
      t.id === taskId ? { ...t, status: NEXT_STATUS[t.status] } : t,
    )
    onUpdatePlan(selectedPlan.id, { tasks: updated })
  }

  const filteredTasks = useMemo(() => {
    if (!selectedPlan) return []
    if (taskFilter === 'all') return selectedPlan.tasks
    if (taskFilter === 'open') return selectedPlan.tasks.filter((t) => t.status !== 'done')
    return selectedPlan.tasks.filter((t) => t.status === 'done')
  }, [selectedPlan, taskFilter])

  // ── Stats ───────────────────────────────────────────────────

  const stats = useMemo(() => {
    if (!selectedPlan) return { total: 0, done: 0, inProgress: 0, open: 0, percent: 0 }
    const total = selectedPlan.tasks.length
    const done = selectedPlan.tasks.filter((t) => t.status === 'done').length
    const inProgress = selectedPlan.tasks.filter((t) => t.status === 'in-progress').length
    const open = total - done - inProgress
    return { total, done, inProgress, open, percent: total > 0 ? Math.round((done / total) * 100) : 0 }
  }, [selectedPlan])

  // ════════════════════════════════════════════════════════════
  // RENDER: Create Form
  // ════════════════════════════════════════════════════════════

  if (showCreateForm) {
    return (
      <div className="space-y-4">
        <button
          onClick={resetCreateForm}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Zurück
        </button>
        <h2 className="text-lg font-semibold text-foreground">Neuer Plan</h2>

        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-muted-foreground">Name *</label>
            <input type="text" value={formName} onChange={(e) => setFormName(e.target.value)}
              placeholder="Plan-Name" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-muted-foreground">Beschreibung</label>
            <textarea value={formDesc} onChange={(e) => setFormDesc(e.target.value)}
              placeholder="Beschreibung..." rows={2} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none" />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-muted-foreground">Strategie</label>
            <textarea value={formStrategy} onChange={(e) => setFormStrategy(e.target.value)}
              placeholder="Strategie..." rows={2} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-muted-foreground">Ziel</label>
              <input type="text" value={formGoal} onChange={(e) => setFormGoal(e.target.value)}
                placeholder="Ziel" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-muted-foreground">Zielgruppe</label>
              <input type="text" value={formAudience} onChange={(e) => setFormAudience(e.target.value)}
                placeholder="Zielgruppe" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-muted-foreground">Deadline</label>
            <input type="date" value={formDeadline} onChange={(e) => setFormDeadline(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-muted-foreground">Kanäle</label>
            <div className="flex flex-wrap gap-2">
              {CHANNEL_OPTIONS.map((ch) => (
                <button key={ch} onClick={() => toggleChannel(ch)}
                  className={cn('rounded-full px-3 py-1 text-xs font-medium transition-colors',
                    formChannels.includes(ch) ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80')}>
                  {ch}
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={resetCreateForm}
              className="rounded-lg px-4 py-2 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors">
              Abbrechen
            </button>
            <button onClick={handleCreatePlan} disabled={!formName.trim()}
              className="rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-40 transition-colors">
              Plan erstellen
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ════════════════════════════════════════════════════════════
  // RENDER: Plan Detail
  // ════════════════════════════════════════════════════════════

  if (selectedPlan) {
    return (
      <div className="space-y-5">
        {/* Back + header */}
        <div className="flex items-center justify-between">
          <button onClick={() => setSelectedPlanId(null)}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft className="h-4 w-4" /> Zurück
          </button>
          <button onClick={() => { onDeletePlan(selectedPlan.id); setSelectedPlanId(null) }}
            className="rounded-lg p-1.5 text-red-500 hover:bg-red-500/10 transition-colors">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        <div>
          <h2 className="text-xl font-bold text-foreground">{selectedPlan.name}</h2>
          {selectedPlan.description && (
            <p className="mt-1 text-sm text-muted-foreground">{selectedPlan.description}</p>
          )}
        </div>

        {/* Sub-tabs */}
        <div className="flex gap-1 rounded-lg bg-muted p-1">
          {(['tasks', 'strategy', 'overview'] as const).map((tab) => {
            const labels = { tasks: 'Aufgaben', strategy: 'Strategie', overview: 'Übersicht' }
            return (
              <button key={tab} onClick={() => setActiveSubTab(tab)}
                className={cn('flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                  activeSubTab === tab ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}>
                {labels[tab]}
              </button>
            )
          })}
        </div>

        {/* ── Tasks tab ───────────────────────────────────────── */}
        {activeSubTab === 'tasks' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex gap-1.5">
                {(['all', 'open', 'done'] as const).map((f) => {
                  const labels = { all: 'Alle', open: 'Offen', done: 'Erledigt' }
                  return (
                    <button key={f} onClick={() => setTaskFilter(f)}
                      className={cn('rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors',
                        taskFilter === f ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted')}>
                      {labels[f]}
                    </button>
                  )
                })}
              </div>
              <button onClick={() => setShowTaskForm(true)}
                className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
                <Plus className="h-3.5 w-3.5" /> Aufgabe
              </button>
            </div>

            {showTaskForm && (
              <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                <input type="text" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="Aufgaben-Titel" className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                <textarea value={taskDesc} onChange={(e) => setTaskDesc(e.target.value)}
                  placeholder="Beschreibung..." rows={2} className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none" />
                <div className="flex items-center gap-3">
                  <select value={taskPriority} onChange={(e) => setTaskPriority(e.target.value as ContentPriority)}
                    className="rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
                    {(Object.keys(PRIORITY_CONFIG) as ContentPriority[]).map((key) => (
                      <option key={key} value={key}>{PRIORITY_CONFIG[key].label}</option>
                    ))}
                  </select>
                  <div className="flex-1" />
                  <button onClick={() => setShowTaskForm(false)}
                    className="rounded-lg px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted transition-colors">
                    Abbrechen
                  </button>
                  <button onClick={handleAddTask} disabled={!taskTitle.trim()}
                    className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-40 transition-colors">
                    Speichern
                  </button>
                </div>
              </div>
            )}

            {filteredTasks.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Keine Aufgaben</p>
            ) : (
              <div className="space-y-2">
                {filteredTasks.map((task) => {
                  const statusCfg = TASK_STATUS_CONFIG[task.status]
                  const priCfg = PRIORITY_CONFIG[task.priority]
                  const taskTitleById = (id: string) =>
                    selectedPlan.tasks.find((t) => t.id === id)?.title ?? id
                  return (
                    <div key={task.id}
                      className="flex items-start gap-3 rounded-xl border border-border bg-card p-3 transition-all hover:shadow-sm">
                      <button onClick={() => cycleTaskStatus(task.id)}
                        className={cn('mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                          task.status === 'done' ? 'border-emerald-500 bg-emerald-500 text-white'
                            : task.status === 'in-progress' ? 'border-blue-500 bg-blue-500/10'
                            : 'border-muted-foreground/30')}>
                        {task.status === 'done' && <Check className="h-3 w-3" />}
                        {task.status === 'in-progress' && <Clock className="h-2.5 w-2.5 text-blue-500" />}
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={cn('text-sm font-medium',
                            task.status === 'done' ? 'text-muted-foreground line-through' : 'text-foreground')}>
                            {task.title}
                          </span>
                          <span className="rounded-full px-1.5 py-px text-[9px] font-semibold"
                            style={{ background: priCfg.bgColor, color: priCfg.color }}>
                            {priCfg.label}
                          </span>
                          <span className="rounded-full px-1.5 py-px text-[9px] font-medium"
                            style={{ background: statusCfg.bg, color: statusCfg.color }}>
                            {statusCfg.label}
                          </span>
                        </div>
                        {task.description && (
                          <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">{task.description}</p>
                        )}
                        <div className="mt-1.5 flex flex-wrap items-center gap-2">
                          {task.assignee && (
                            <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                              <Users className="h-3 w-3" /> {task.assignee}
                            </span>
                          )}
                          {task.dueDate && (
                            <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                              <Calendar className="h-3 w-3" /> {task.dueDate}
                            </span>
                          )}
                          {task.dependsOn && task.dependsOn.length > 0 && (
                            <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                              <ArrowRight className="h-3 w-3" />
                              Abhängig von: {task.dependsOn.map(taskTitleById).join(', ')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Strategy tab ────────────────────────────────────── */}
        {activeSubTab === 'strategy' && (
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-muted-foreground">Strategie</label>
              <textarea value={selectedPlan.strategy}
                onChange={(e) => onUpdatePlan(selectedPlan.id, { strategy: e.target.value })}
                rows={4} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-border bg-card p-4 space-y-1">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <Target className="h-3.5 w-3.5" /> Ziel
                </div>
                <p className="text-sm text-foreground">{selectedPlan.goal || '-'}</p>
              </div>
              <div className="rounded-xl border border-border bg-card p-4 space-y-1">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <Users className="h-3.5 w-3.5" /> Zielgruppe
                </div>
                <p className="text-sm text-foreground">{selectedPlan.targetAudience || '-'}</p>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-muted-foreground">Kanäle</label>
              <div className="flex flex-wrap gap-1.5">
                {selectedPlan.channels.length > 0 ? selectedPlan.channels.map((ch) => (
                  <span key={ch} className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-medium text-primary">
                    {ch}
                  </span>
                )) : <span className="text-xs text-muted-foreground">-</span>}
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-muted-foreground">Notizen</label>
              <textarea value={selectedPlan.notes}
                onChange={(e) => onUpdatePlan(selectedPlan.id, { notes: e.target.value })}
                rows={3} placeholder="Notizen..." className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none" />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-muted-foreground">Deadline</label>
              <input type="date" value={selectedPlan.deadline}
                onChange={(e) => onUpdatePlan(selectedPlan.id, { deadline: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
          </div>
        )}

        {/* ── Overview tab ────────────────────────────────────── */}
        {activeSubTab === 'overview' && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: 'Gesamt', value: stats.total, color: 'text-foreground' },
                { label: 'Erledigt', value: stats.done, color: 'text-emerald-500' },
                { label: 'In Arbeit', value: stats.inProgress, color: 'text-blue-500' },
                { label: 'Offen', value: stats.open, color: 'text-muted-foreground' },
              ].map(({ label, value, color }) => (
                <div key={label} className="rounded-xl border border-border bg-card p-4 text-center">
                  <p className={cn('text-2xl font-bold', color)}>{value}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>

            {/* Progress bar */}
            <div className="rounded-xl border border-border bg-card p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">Fortschritt</span>
                <span className="text-sm font-bold text-foreground">{stats.percent}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted">
                <div className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                  style={{ width: `${stats.percent}%` }} />
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.done} von {stats.total} Aufgaben erledigt
              </p>
            </div>

            {/* Deadline countdown */}
            {selectedPlan.deadline && (
              <div className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">Deadline</span>
                </div>
                <p className="mt-1 text-lg font-bold text-foreground">{selectedPlan.deadline}</p>
                {(() => {
                  const days = daysUntil(selectedPlan.deadline)
                  if (days < 0) return <p className="text-xs text-red-500">Überfällig ({Math.abs(days)} Tage)</p>
                  if (days === 0) return <p className="text-xs text-amber-500">Heute fällig</p>
                  return <p className="text-xs text-muted-foreground">Noch {days} Tage</p>
                })()}
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  // ════════════════════════════════════════════════════════════
  // RENDER: Plan Overview (default)
  // ════════════════════════════════════════════════════════════

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold text-foreground">Marketing-Pläne</h2>
        </div>
        <button onClick={() => setShowCreateForm(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
          <Plus className="h-3.5 w-3.5" /> Neuer Plan
        </button>
      </div>

      {plans.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Target className="h-10 w-10 text-muted-foreground/30" />
          <p className="mt-3 text-sm text-muted-foreground">Noch keine Pläne erstellt</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => {
            const total = plan.tasks.length
            const done = plan.tasks.filter((t) => t.status === 'done').length
            const percent = total > 0 ? Math.round((done / total) * 100) : 0
            return (
              <button key={plan.id} onClick={() => setSelectedPlanId(plan.id)}
                className={cn('rounded-xl border border-border bg-card p-4 text-left',
                  'hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all')}>
                <h3 className="text-sm font-semibold text-foreground line-clamp-1">{plan.name}</h3>
                {plan.description && (
                  <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{plan.description}</p>
                )}

                {/* Progress */}
                <div className="mt-3 space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                    <span>{done}/{total} Aufgaben</span>
                    <span>{percent}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary transition-all duration-500"
                      style={{ width: `${percent}%` }} />
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex flex-wrap gap-1">
                    {plan.channels.slice(0, 3).map((ch) => (
                      <span key={ch} className="rounded-full bg-muted px-2 py-px text-[9px] font-medium text-muted-foreground">
                        {ch}
                      </span>
                    ))}
                    {plan.channels.length > 3 && (
                      <span className="text-[9px] text-muted-foreground">+{plan.channels.length - 3}</span>
                    )}
                  </div>
                  {plan.deadline && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Calendar className="h-3 w-3" /> {plan.deadline}
                    </span>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
