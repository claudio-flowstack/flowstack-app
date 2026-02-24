import { create } from 'zustand'
import type {
  ContentItem,
  ContentFile,
  ContentPlan,
  ResearchNote,
  ContentPlatform,
  ContentStatus,
} from '../domain/types'
import { createLocalRepository } from '@/core/persistence/create-repository'
import { storage } from '@/core/persistence/local-storage-adapter'
import { toastSuccess, toastError } from '@/shared/hooks/useToast'
import { DEMO_CONTENT, DEMO_FILES, DEMO_PLANS } from '../domain/demo-data'

// ── Repositories ────────────────────────────────────────────────────────────

const contentRepo = createLocalRepository<ContentItem>(storage, 'content-items')
const fileRepo = createLocalRepository<ContentFile>(storage, 'content-files')
const planRepo = createLocalRepository<ContentPlan>(storage, 'content-plans')
const noteRepo = createLocalRepository<ResearchNote>(storage, 'content-notes')

// ── Store Interface ─────────────────────────────────────────────────────────

interface ContentStore {
  // State
  items: ContentItem[]
  files: ContentFile[]
  plans: ContentPlan[]
  notes: ResearchNote[]
  loading: boolean

  // Content CRUD
  fetchItems: () => Promise<void>
  createItem: (data: Partial<ContentItem>) => Promise<ContentItem>
  updateItem: (id: string, data: Partial<ContentItem>) => Promise<void>
  deleteItem: (id: string) => Promise<void>
  duplicateItem: (id: string) => Promise<ContentItem>
  moveItemStatus: (id: string, status: ContentStatus) => Promise<void>

  // File CRUD
  fetchFiles: () => Promise<void>
  createFile: (data: Partial<ContentFile>) => Promise<void>
  deleteFile: (id: string) => Promise<void>

  // Plan CRUD
  fetchPlans: () => Promise<void>
  createPlan: (data: Partial<ContentPlan>) => Promise<ContentPlan>
  updatePlan: (id: string, data: Partial<ContentPlan>) => Promise<void>
  deletePlan: (id: string) => Promise<void>

  // Note CRUD
  fetchNotes: () => Promise<void>
  createNote: (data: Partial<ResearchNote>) => Promise<void>
  updateNote: (id: string, data: Partial<ResearchNote>) => Promise<void>
  deleteNote: (id: string) => Promise<void>

  // Computed
  getByPlatform: (platform: ContentPlatform) => ContentItem[]
  getIdeas: () => ContentItem[]
  getByStatus: (status: ContentStatus) => ContentItem[]
  getScheduled: () => ContentItem[]
}

// ── Store Implementation ────────────────────────────────────────────────────

export const useContentStore = create<ContentStore>((set, get) => ({
  items: [],
  files: [],
  plans: [],
  notes: [],
  loading: false,

  // ── Fetch Items ───────────────────────────────────────────────────────────

  fetchItems: async () => {
    set({ loading: true })
    try {
      let items = await contentRepo.getAll()
      if (items.length === 0) {
        for (const demo of DEMO_CONTENT) {
          await contentRepo.create(demo)
        }
        items = await contentRepo.getAll()
      }
      set({ items, loading: false })
    } catch {
      toastError('Content konnte nicht geladen werden')
      set({ loading: false })
    }
  },

  createItem: async (data) => {
    try {
      const now = new Date().toISOString()
      const item = await contentRepo.create({
        platform: data.platform ?? 'youtube',
        title: data.title ?? 'Neuer Content',
        concept: data.concept ?? '',
        angle: data.angle ?? '',
        status: data.status ?? 'idea',
        priority: data.priority ?? 'medium',
        quality: data.quality ?? 'neutral',
        tags: data.tags ?? [],
        notes: data.notes ?? '',
        checklist: data.checklist ?? [],
        media: data.media ?? [],
        versions: data.versions ?? [],
        createdAt: now,
        updatedAt: now,
        ...data,
      } as Omit<ContentItem, 'id'>)
      set((s) => ({ items: [...s.items, item] }))
      toastSuccess('Content erstellt')
      return item
    } catch {
      toastError('Content konnte nicht erstellt werden')
      throw new Error('Create failed')
    }
  },

  updateItem: async (id, data) => {
    try {
      const updated = await contentRepo.update(id, {
        ...data,
        updatedAt: new Date().toISOString(),
      })
      set((s) => ({
        items: s.items.map((i) => (i.id === id ? updated : i)),
      }))
    } catch {
      toastError('Content konnte nicht aktualisiert werden')
    }
  },

  deleteItem: async (id) => {
    try {
      await contentRepo.delete(id)
      set((s) => ({ items: s.items.filter((i) => i.id !== id) }))
      toastSuccess('Content gelöscht')
    } catch {
      toastError('Content konnte nicht gelöscht werden')
    }
  },

  duplicateItem: async (id) => {
    const original = get().items.find((i) => i.id === id)
    if (!original) throw new Error('Item not found')
    const now = new Date().toISOString()
    const { id: _, ...rest } = original
    const item = await contentRepo.create({
      ...rest,
      title: `${original.title} (Kopie)`,
      status: 'idea',
      createdAt: now,
      updatedAt: now,
    } as Omit<ContentItem, 'id'>)
    set((s) => ({ items: [...s.items, item] }))
    toastSuccess('Content dupliziert')
    return item
  },

  moveItemStatus: async (id, status) => {
    try {
      const updated = await contentRepo.update(id, {
        status,
        updatedAt: new Date().toISOString(),
      })
      set((s) => ({
        items: s.items.map((i) => (i.id === id ? updated : i)),
      }))
    } catch {
      toastError('Status konnte nicht geändert werden')
    }
  },

  // ── Files ─────────────────────────────────────────────────────────────────

  fetchFiles: async () => {
    try {
      let files = await fileRepo.getAll()
      if (files.length === 0) {
        for (const demo of DEMO_FILES) {
          await fileRepo.create(demo)
        }
        files = await fileRepo.getAll()
      }
      set({ files })
    } catch {
      toastError('Dateien konnten nicht geladen werden')
    }
  },

  createFile: async (data) => {
    try {
      const file = await fileRepo.create({
        name: data.name ?? 'Neue Datei',
        description: data.description ?? '',
        url: data.url ?? '',
        category: data.category ?? 'other',
        labels: data.labels ?? [],
        createdAt: new Date().toISOString(),
        ...data,
      } as Omit<ContentFile, 'id'>)
      set((s) => ({ files: [...s.files, file] }))
      toastSuccess('Datei erstellt')
    } catch {
      toastError('Datei konnte nicht erstellt werden')
    }
  },

  deleteFile: async (id) => {
    try {
      await fileRepo.delete(id)
      set((s) => ({ files: s.files.filter((f) => f.id !== id) }))
      toastSuccess('Datei gelöscht')
    } catch {
      toastError('Datei konnte nicht gelöscht werden')
    }
  },

  // ── Plans ─────────────────────────────────────────────────────────────────

  fetchPlans: async () => {
    try {
      let plans = await planRepo.getAll()
      if (plans.length === 0) {
        for (const demo of DEMO_PLANS) {
          await planRepo.create(demo)
        }
        plans = await planRepo.getAll()
      }
      set({ plans })
    } catch {
      toastError('Pläne konnten nicht geladen werden')
    }
  },

  createPlan: async (data) => {
    try {
      const now = new Date().toISOString()
      const plan = await planRepo.create({
        name: data.name ?? 'Neuer Plan',
        description: data.description ?? '',
        strategy: data.strategy ?? '',
        deadline: data.deadline ?? '',
        notes: data.notes ?? '',
        goal: data.goal ?? '',
        targetAudience: data.targetAudience ?? '',
        channels: data.channels ?? [],
        tasks: data.tasks ?? [],
        createdAt: now,
        updatedAt: now,
        ...data,
      } as Omit<ContentPlan, 'id'>)
      set((s) => ({ plans: [...s.plans, plan] }))
      toastSuccess('Plan erstellt')
      return plan
    } catch {
      toastError('Plan konnte nicht erstellt werden')
      throw new Error('Create failed')
    }
  },

  updatePlan: async (id, data) => {
    try {
      const updated = await planRepo.update(id, {
        ...data,
        updatedAt: new Date().toISOString(),
      })
      set((s) => ({
        plans: s.plans.map((p) => (p.id === id ? updated : p)),
      }))
    } catch {
      toastError('Plan konnte nicht aktualisiert werden')
    }
  },

  deletePlan: async (id) => {
    try {
      await planRepo.delete(id)
      set((s) => ({ plans: s.plans.filter((p) => p.id !== id) }))
      toastSuccess('Plan gelöscht')
    } catch {
      toastError('Plan konnte nicht gelöscht werden')
    }
  },

  // ── Notes ─────────────────────────────────────────────────────────────────

  fetchNotes: async () => {
    try {
      const notes = await noteRepo.getAll()
      set({ notes })
    } catch {
      toastError('Notizen konnten nicht geladen werden')
    }
  },

  createNote: async (data) => {
    try {
      const now = new Date().toISOString()
      const note = await noteRepo.create({
        title: data.title ?? 'Neue Notiz',
        content: data.content ?? '',
        links: data.links ?? [],
        tags: data.tags ?? [],
        platform: data.platform ?? 'general',
        createdAt: now,
        updatedAt: now,
        ...data,
      } as Omit<ResearchNote, 'id'>)
      set((s) => ({ notes: [...s.notes, note] }))
      toastSuccess('Notiz erstellt')
    } catch {
      toastError('Notiz konnte nicht erstellt werden')
    }
  },

  updateNote: async (id, data) => {
    try {
      const updated = await noteRepo.update(id, {
        ...data,
        updatedAt: new Date().toISOString(),
      })
      set((s) => ({
        notes: s.notes.map((n) => (n.id === id ? updated : n)),
      }))
    } catch {
      toastError('Notiz konnte nicht aktualisiert werden')
    }
  },

  deleteNote: async (id) => {
    try {
      await noteRepo.delete(id)
      set((s) => ({ notes: s.notes.filter((n) => n.id !== id) }))
      toastSuccess('Notiz gelöscht')
    } catch {
      toastError('Notiz konnte nicht gelöscht werden')
    }
  },

  // ── Computed ──────────────────────────────────────────────────────────────

  getByPlatform: (platform) =>
    get().items.filter((i) => i.platform === platform),

  getIdeas: () =>
    get().items.filter((i) => i.status === 'idea'),

  getByStatus: (status) =>
    get().items.filter((i) => i.status === status),

  getScheduled: () =>
    get().items.filter((i) => i.scheduledDate),
}))
