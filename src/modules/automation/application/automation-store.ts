import { create } from 'zustand'

import type {
  AutomationSystem,
  WorkflowTemplate,
  SystemResource,
  FunnelBoard,
} from '../domain/types'
import { storage } from '@/core/persistence/local-storage-adapter'
import { createLocalRepository } from '@/core/persistence/create-repository'
import { eventBus } from '@/core/events/event-bus'
import { toastSuccess, toastError } from '@/shared/hooks/useToast'
import { DEMO_SYSTEMS, DEMO_TEMPLATES } from '../domain/demo-data'
import { DEMO_FUNNEL_BOARDS } from '../domain/demo-funnel-data'

// ── Repositories ───────────────────────────────────────────────────────────

const systemRepo = createLocalRepository<AutomationSystem>(
  storage,
  'automation-systems',
)

const templateRepo = createLocalRepository<WorkflowTemplate>(
  storage,
  'automation-templates',
)

const resourceRepo = createLocalRepository<SystemResource>(
  storage,
  'automation-resources',
)

const funnelRepo = createLocalRepository<FunnelBoard>(
  storage,
  'funnel-boards',
)

// ── Store Interface ────────────────────────────────────────────────────────

interface AutomationStore {
  // State
  systems: AutomationSystem[]
  templates: WorkflowTemplate[]
  selectedSystemId: string | null
  loading: boolean
  error: string | null

  // System CRUD
  fetchSystems: () => Promise<void>
  createSystem: (
    data: Partial<AutomationSystem>,
  ) => Promise<AutomationSystem>
  createSystemFromTemplate: (
    templateId: string,
  ) => Promise<AutomationSystem>
  updateSystem: (
    id: string,
    data: Partial<AutomationSystem>,
  ) => Promise<void>
  deleteSystem: (id: string) => Promise<void>
  duplicateSystem: (id: string) => Promise<AutomationSystem>
  toggleSystemStatus: (id: string) => Promise<void>
  incrementExecutionCount: (id: string) => Promise<void>

  // Selection
  selectSystem: (id: string | null) => void

  // Templates
  fetchTemplates: () => Promise<void>
  createTemplate: (data: Partial<WorkflowTemplate>) => Promise<void>
  deleteTemplate: (id: string) => Promise<void>

  // Resources (scoped to selected system)
  resources: SystemResource[]
  fetchResources: (systemId: string) => Promise<void>
  createResource: (
    data: Omit<SystemResource, 'id' | 'createdAt'>,
  ) => Promise<void>
  updateResource: (
    id: string,
    data: Partial<SystemResource>,
  ) => Promise<void>
  deleteResource: (id: string) => Promise<void>

  // Funnel Boards
  funnelBoards: FunnelBoard[]
  fetchFunnelBoards: () => Promise<void>
  createFunnelBoard: (data: Partial<FunnelBoard>) => Promise<FunnelBoard>
  updateFunnelBoard: (id: string, data: Partial<FunnelBoard>) => Promise<void>
  deleteFunnelBoard: (id: string) => Promise<void>
  duplicateFunnelBoard: (id: string) => Promise<FunnelBoard>
  getFunnelBoard: (id: string) => FunnelBoard | null

  // Computed
  activeSystemCount: () => number
  totalExecutionCount: () => number
  selectedSystem: () => AutomationSystem | null
}

// ── Store Implementation ───────────────────────────────────────────────────

export const useAutomationStore = create<AutomationStore>((set, get) => ({
  // ── Initial State ──────────────────────────────────────────────────────

  systems: [],
  templates: [],
  selectedSystemId: null,
  loading: false,
  error: null,
  resources: [],
  funnelBoards: [],

  // ── Fetch Systems ──────────────────────────────────────────────────────

  fetchSystems: async () => {
    set({ loading: true, error: null })
    try {
      let systems = await systemRepo.getAll()

      // Always sync demo systems with latest code:
      // Remove old demo versions, keep user-created systems, re-add fresh demos
      const demoIds = new Set(DEMO_SYSTEMS.map((d) => d.id))
      const userSystems = systems.filter((s) => !demoIds.has(s.id))
      for (const demo of DEMO_SYSTEMS) {
        await systemRepo.delete(demo.id).catch(() => {})
        await systemRepo.create(demo)
      }
      systems = [...userSystems, ...DEMO_SYSTEMS]

      set({ systems, loading: false })
    } catch (e) {
      const message =
        e instanceof Error ? e.message : 'Failed to load systems'
      set({ error: message, loading: false })
      toastError(message)
    }
  },

  // ── Create System ──────────────────────────────────────────────────────

  createSystem: async (data) => {
    set({ loading: true, error: null })
    try {
      const now = new Date().toISOString()
      const newSystem = await systemRepo.create({
        name: data.name ?? 'New System',
        description: data.description ?? '',
        category: data.category ?? 'General',
        icon: data.icon ?? 'zap',
        status: data.status ?? 'draft',
        webhookUrl: data.webhookUrl ?? '',
        nodes: data.nodes ?? [],
        connections: data.connections ?? [],
        groups: data.groups ?? [],
        stickyNotes: data.stickyNotes ?? [],
        outputs: data.outputs ?? [],
        executionCount: data.executionCount ?? 0,
        lastExecuted: data.lastExecuted ?? now,
        ...data,
      } as Omit<AutomationSystem, 'id'>)

      set((state) => ({
        systems: [...state.systems, newSystem],
        loading: false,
      }))

      eventBus.emit('automation:systemCreated', { id: newSystem.id })
      toastSuccess('System created')
      return newSystem
    } catch (e) {
      const message =
        e instanceof Error ? e.message : 'Failed to create system'
      set({ error: message, loading: false })
      toastError(message)
      throw e
    }
  },

  // ── Create System From Template ────────────────────────────────────────

  createSystemFromTemplate: async (templateId) => {
    set({ loading: true, error: null })
    try {
      const template = get().templates.find((t) => t.id === templateId)
      if (!template) throw new Error(`Template not found: ${templateId}`)

      const now = new Date().toISOString()
      const newSystem = await systemRepo.create({
        user_id: 'local-user',
        name: template.name,
        description: template.description,
        category: template.category,
        icon: template.icon,
        status: 'draft',
        webhookUrl: '',
        nodes: template.nodes.map((n) => ({ ...n })),
        connections: template.connections.map((c) => ({ ...c })),
        groups: template.groups?.map((g) => ({ ...g })),
        stickyNotes: [],
        outputs: [],
        executionCount: 0,
        lastExecuted: now,
      } as Omit<AutomationSystem, 'id'>)

      set((state) => ({
        systems: [...state.systems, newSystem],
        loading: false,
      }))

      eventBus.emit('automation:systemCreated', {
        id: newSystem.id,
        fromTemplate: templateId,
      })
      toastSuccess(`System created from "${template.name}"`)
      return newSystem
    } catch (e) {
      const message =
        e instanceof Error ? e.message : 'Failed to create from template'
      set({ error: message, loading: false })
      toastError(message)
      throw e
    }
  },

  // ── Update System ──────────────────────────────────────────────────────

  updateSystem: async (id, data) => {
    set({ loading: true, error: null })
    try {
      const updated = await systemRepo.update(id, data)
      set((state) => ({
        systems: state.systems.map((s) => (s.id === id ? updated : s)),
        loading: false,
      }))
    } catch (e) {
      const message =
        e instanceof Error ? e.message : 'Failed to update system'
      set({ error: message, loading: false })
      toastError(message)
    }
  },

  // ── Delete System ──────────────────────────────────────────────────────

  deleteSystem: async (id) => {
    set({ loading: true, error: null })
    try {
      await systemRepo.delete(id)
      set((state) => ({
        systems: state.systems.filter((s) => s.id !== id),
        selectedSystemId:
          state.selectedSystemId === id ? null : state.selectedSystemId,
        loading: false,
      }))
      toastSuccess('System deleted')
    } catch (e) {
      const message =
        e instanceof Error ? e.message : 'Failed to delete system'
      set({ error: message, loading: false })
      toastError(message)
    }
  },

  // ── Duplicate System ───────────────────────────────────────────────────

  duplicateSystem: async (id) => {
    set({ loading: true, error: null })
    try {
      const source = get().systems.find((s) => s.id === id)
      if (!source) throw new Error(`System not found: ${id}`)

      const duplicate = await systemRepo.create({
        user_id: 'local-user',
        name: `${source.name} (Copy)`,
        description: source.description,
        category: source.category,
        icon: source.icon,
        status: 'draft',
        webhookUrl: '',
        nodes: source.nodes.map((n) => ({ ...n })),
        connections: source.connections.map((c) => ({ ...c })),
        groups: source.groups?.map((g) => ({ ...g })),
        stickyNotes: source.stickyNotes?.map((s) => ({ ...s })),
        outputs: [],
        executionCount: 0,
        lastExecuted: new Date().toISOString(),
      } as Omit<AutomationSystem, 'id'>)

      set((state) => ({
        systems: [...state.systems, duplicate],
        loading: false,
      }))

      toastSuccess('System duplicated')
      return duplicate
    } catch (e) {
      const message =
        e instanceof Error ? e.message : 'Failed to duplicate system'
      set({ error: message, loading: false })
      toastError(message)
      throw e
    }
  },

  // ── Toggle System Status ───────────────────────────────────────────────

  toggleSystemStatus: async (id) => {
    set({ loading: true, error: null })
    try {
      const system = get().systems.find((s) => s.id === id)
      if (!system) throw new Error(`System not found: ${id}`)

      const newStatus = system.status === 'active' ? 'draft' : 'active'
      const updated = await systemRepo.update(id, { status: newStatus })

      set((state) => ({
        systems: state.systems.map((s) => (s.id === id ? updated : s)),
        loading: false,
      }))

      toastSuccess(
        newStatus === 'active' ? 'System activated' : 'System set to draft',
      )
    } catch (e) {
      const message =
        e instanceof Error ? e.message : 'Failed to toggle status'
      set({ error: message, loading: false })
      toastError(message)
    }
  },

  // ── Increment Execution Count ──────────────────────────────────────────

  incrementExecutionCount: async (id) => {
    set({ loading: true, error: null })
    try {
      const system = get().systems.find((s) => s.id === id)
      if (!system) throw new Error(`System not found: ${id}`)

      const updated = await systemRepo.update(id, {
        executionCount: system.executionCount + 1,
        lastExecuted: new Date().toISOString(),
      })

      set((state) => ({
        systems: state.systems.map((s) => (s.id === id ? updated : s)),
        loading: false,
      }))

      eventBus.emit('automation:executed', { id })
    } catch (e) {
      const message =
        e instanceof Error ? e.message : 'Failed to increment count'
      set({ error: message, loading: false })
      toastError(message)
    }
  },

  // ── Selection ──────────────────────────────────────────────────────────

  selectSystem: (id) => {
    set({ selectedSystemId: id })
  },

  // ── Fetch Templates ────────────────────────────────────────────────────

  fetchTemplates: async () => {
    set({ loading: true, error: null })
    try {
      let templates = await templateRepo.getAll()

      // Seed demo templates on first load
      if (templates.length === 0) {
        for (const tpl of DEMO_TEMPLATES) {
          await templateRepo.create(tpl)
        }
        templates = await templateRepo.getAll()
      }

      set({ templates, loading: false })
    } catch (e) {
      const message =
        e instanceof Error ? e.message : 'Failed to load templates'
      set({ error: message, loading: false })
      toastError(message)
    }
  },

  // ── Create Template ────────────────────────────────────────────────────

  createTemplate: async (data) => {
    set({ loading: true, error: null })
    try {
      const newTemplate = await templateRepo.create({
        name: data.name ?? 'New Template',
        description: data.description ?? '',
        category: data.category ?? 'General',
        icon: data.icon ?? 'workflow',
        nodeCount: data.nodeCount ?? 0,
        nodes: data.nodes ?? [],
        connections: data.connections ?? [],
        groups: data.groups ?? [],
        tags: data.tags ?? [],
        ...data,
      } as Omit<WorkflowTemplate, 'id'>)

      set((state) => ({
        templates: [...state.templates, newTemplate],
        loading: false,
      }))

      toastSuccess('Template created')
    } catch (e) {
      const message =
        e instanceof Error ? e.message : 'Failed to create template'
      set({ error: message, loading: false })
      toastError(message)
    }
  },

  // ── Delete Template ────────────────────────────────────────────────────

  deleteTemplate: async (id) => {
    set({ loading: true, error: null })
    try {
      await templateRepo.delete(id)
      set((state) => ({
        templates: state.templates.filter((t) => t.id !== id),
        loading: false,
      }))
      toastSuccess('Template deleted')
    } catch (e) {
      const message =
        e instanceof Error ? e.message : 'Failed to delete template'
      set({ error: message, loading: false })
      toastError(message)
    }
  },

  // ── Fetch Resources ────────────────────────────────────────────────────

  fetchResources: async (systemId) => {
    set({ loading: true, error: null })
    try {
      const all = await resourceRepo.getAll()
      const resources = all.filter((r) => r.systemId === systemId)
      set({ resources, loading: false })
    } catch (e) {
      const message =
        e instanceof Error ? e.message : 'Failed to load resources'
      set({ error: message, loading: false })
      toastError(message)
    }
  },

  // ── Create Resource ────────────────────────────────────────────────────

  createResource: async (data) => {
    set({ loading: true, error: null })
    try {
      const newResource = await resourceRepo.create({
        ...data,
        createdAt: new Date().toISOString(),
      } as Omit<SystemResource, 'id'>)

      set((state) => ({
        resources: [...state.resources, newResource],
        loading: false,
      }))

      toastSuccess('Resource created')
    } catch (e) {
      const message =
        e instanceof Error ? e.message : 'Failed to create resource'
      set({ error: message, loading: false })
      toastError(message)
    }
  },

  // ── Update Resource ────────────────────────────────────────────────────

  updateResource: async (id, data) => {
    set({ loading: true, error: null })
    try {
      const updated = await resourceRepo.update(id, data)
      set((state) => ({
        resources: state.resources.map((r) =>
          r.id === id ? updated : r,
        ),
        loading: false,
      }))
    } catch (e) {
      const message =
        e instanceof Error ? e.message : 'Failed to update resource'
      set({ error: message, loading: false })
      toastError(message)
    }
  },

  // ── Delete Resource ────────────────────────────────────────────────────

  deleteResource: async (id) => {
    set({ loading: true, error: null })
    try {
      await resourceRepo.delete(id)
      set((state) => ({
        resources: state.resources.filter((r) => r.id !== id),
        loading: false,
      }))
      toastSuccess('Resource deleted')
    } catch (e) {
      const message =
        e instanceof Error ? e.message : 'Failed to delete resource'
      set({ error: message, loading: false })
      toastError(message)
    }
  },

  // ── Fetch Funnel Boards ───────────────────────────────────────────

  fetchFunnelBoards: async () => {
    try {
      let boards = await funnelRepo.getAll()

      // Seed demo boards on first load
      const demoIds = new Set(DEMO_FUNNEL_BOARDS.map((d) => d.id))
      const userBoards = boards.filter((b) => !demoIds.has(b.id))
      for (const demo of DEMO_FUNNEL_BOARDS) {
        await funnelRepo.delete(demo.id).catch(() => {})
        await funnelRepo.create(demo)
      }
      boards = [...userBoards, ...DEMO_FUNNEL_BOARDS]

      set({ funnelBoards: boards })
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to load funnel boards'
      toastError(message)
    }
  },

  // ── Create Funnel Board ─────────────────────────────────────────

  createFunnelBoard: async (data) => {
    try {
      const now = new Date().toISOString()
      const newBoard = await funnelRepo.create({
        name: data.name ?? 'Neuer Funnel',
        description: data.description ?? '',
        elements: data.elements ?? [],
        connections: data.connections ?? [],
        phases: data.phases ?? [],
        createdAt: now,
        updatedAt: now,
        ...data,
      } as Omit<FunnelBoard, 'id'>)

      set((state) => ({
        funnelBoards: [...state.funnelBoards, newBoard],
      }))

      eventBus.emit('automation:funnelCreated', { id: newBoard.id })
      toastSuccess('Funnel erstellt')
      return newBoard
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to create funnel'
      toastError(message)
      throw e
    }
  },

  // ── Update Funnel Board ─────────────────────────────────────────

  updateFunnelBoard: async (id, data) => {
    try {
      const updated = await funnelRepo.update(id, {
        ...data,
        updatedAt: new Date().toISOString(),
      })
      set((state) => ({
        funnelBoards: state.funnelBoards.map((b) => (b.id === id ? updated : b)),
      }))
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to update funnel'
      toastError(message)
    }
  },

  // ── Delete Funnel Board ─────────────────────────────────────────

  deleteFunnelBoard: async (id) => {
    try {
      await funnelRepo.delete(id)
      set((state) => ({
        funnelBoards: state.funnelBoards.filter((b) => b.id !== id),
      }))
      toastSuccess('Funnel gelöscht')
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to delete funnel'
      toastError(message)
    }
  },

  // ── Duplicate Funnel Board ──────────────────────────────────────

  duplicateFunnelBoard: async (id) => {
    try {
      const source = get().funnelBoards.find((b) => b.id === id)
      if (!source) throw new Error(`Funnel not found: ${id}`)

      const now = new Date().toISOString()
      const duplicate = await funnelRepo.create({
        name: `${source.name} (Kopie)`,
        description: source.description,
        elements: source.elements.map((e) => ({ ...e, id: crypto.randomUUID() })),
        connections: source.connections.map((c) => ({ ...c, id: crypto.randomUUID() })),
        phases: source.phases.map((p) => ({ ...p, id: crypto.randomUUID() })),
        createdAt: now,
        updatedAt: now,
      } as Omit<FunnelBoard, 'id'>)

      set((state) => ({
        funnelBoards: [...state.funnelBoards, duplicate],
      }))

      toastSuccess('Funnel dupliziert')
      return duplicate
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to duplicate funnel'
      toastError(message)
      throw e
    }
  },

  // ── Get Funnel Board ────────────────────────────────────────────

  getFunnelBoard: (id) => {
    return get().funnelBoards.find((b) => b.id === id) ?? null
  },

  // ── Computed ───────────────────────────────────────────────────────────

  activeSystemCount: () =>
    get().systems.filter((s) => s.status === 'active').length,

  totalExecutionCount: () =>
    get().systems.reduce((sum, s) => sum + s.executionCount, 0),

  selectedSystem: () => {
    const { systems, selectedSystemId } = get()
    return systems.find((s) => s.id === selectedSystemId) ?? null
  },
}))
