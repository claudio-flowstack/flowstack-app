import { create } from 'zustand'
import type { TerminalTab, TabType, PinnedOutput, CommandRunInfo, RunningCommand, ChatMessage, ClaudeSession } from '../domain/types'

let _counter = 0
function nextId() {
  return `term-${++_counter}-${Date.now()}`
}

// Persist command history in localStorage
const HISTORY_KEY = 'flowstack-terminal-history'
function loadHistory(): Record<string, CommandRunInfo> {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '{}')
  } catch { return {} }
}
function saveHistory(h: Record<string, CommandRunInfo>) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(h))
}

// Persist Claude chat sessions in localStorage
const CLAUDE_SESSIONS_KEY = 'flowstack-claude-sessions'
const MAX_PERSISTED_MESSAGES = 50

function loadClaudeSessions(): Record<string, ClaudeSession> {
  try {
    const raw = localStorage.getItem(CLAUDE_SESSIONS_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Record<string, ClaudeSession>
    // Validate and reset transient state on load
    for (const [id, s] of Object.entries(parsed)) {
      if (!s || !Array.isArray(s.messages)) {
        delete parsed[id]
        continue
      }
      s.isStreaming = false
      s.streamingContent = ''
      s.totalCost = typeof s.totalCost === 'number' ? s.totalCost : 0
      s.model = ['opus', 'sonnet', 'haiku', 'auto'].includes(s.model) ? s.model : 'opus'
      s.claudeSessionId = typeof s.claudeSessionId === 'string' ? s.claudeSessionId : null
    }
    return parsed
  } catch { return {} }
}

function saveClaudeSessions(sessions: Record<string, ClaudeSession>) {
  try {
    // Clone and trim messages to avoid localStorage bloat
    const trimmed: Record<string, ClaudeSession> = {}
    for (const [id, s] of Object.entries(sessions)) {
      if (!s || !Array.isArray(s.messages)) continue
      trimmed[id] = {
        ...s,
        messages: s.messages.slice(-MAX_PERSISTED_MESSAGES),
        isStreaming: false,
        streamingContent: '',
      }
    }
    localStorage.setItem(CLAUDE_SESSIONS_KEY, JSON.stringify(trimmed))
  } catch (e) { console.warn('[Flowstack] localStorage voll, Claude Sessions nicht gespeichert:', e) }
}

// Debounced save to prevent race conditions in multi-tab usage
let _saveTimer: ReturnType<typeof setTimeout> | null = null
function debouncedSaveClaudeSessions() {
  if (_saveTimer) clearTimeout(_saveTimer)
  _saveTimer = setTimeout(() => {
    _saveTimer = null
    saveClaudeSessions(useTerminalStore.getState().claudeSessions)
  }, 100)
}

export type ClaudeMode = 'default' | 'acceptEdits' | 'plan'
export type ClaudeModel = 'auto' | 'opus' | 'sonnet' | 'haiku'

const CLAUDE_MODE_CYCLE: ClaudeMode[] = ['default', 'acceptEdits', 'plan']

interface TerminalState {
  tabs: TerminalTab[]
  activeTabId: string | null
  paletteOpen: boolean
  pinnedOutputs: Record<string, PinnedOutput>
  commandHistory: Record<string, CommandRunInfo>
  runningCommands: Record<string, RunningCommand>
  cmdkOpen: boolean
  filefinderOpen: boolean
  searchOpen: Record<string, boolean>
  claudeMode: ClaudeMode
  claudeModel: ClaudeModel
  claudeBypass: boolean
  attachedFiles: { name: string; path: string; isDir: boolean; content?: string }[]

  // Split Panes
  splitView: { left: string; right: string } | null
  splitRatio: number

  createTab: (label?: string, type?: TabType) => TerminalTab
  closeTab: (id: string) => void
  setActiveTab: (id: string) => void
  renameTab: (id: string, label: string) => void
  reorderTabs: (fromId: string, toId: string) => void
  updateStatus: (id: string, status: TerminalTab['status']) => void
  updateCwd: (id: string, cwd: string) => void
  togglePalette: () => void
  pinOutput: (tabId: string, tabLabel: string, content: string) => void
  unpinOutput: (tabId: string) => void
  trackCommandRun: (commandId: string) => void
  startRunning: (tabId: string, label: string) => void
  stopRunning: (tabId: string) => void
  setCmdkOpen: (open: boolean) => void
  setFilefinderOpen: (open: boolean) => void
  setSearchOpen: (tabId: string, open: boolean) => void
  cycleClaudeMode: () => void
  setClaudeMode: (mode: ClaudeMode) => void
  setClaudeModel: (model: ClaudeModel) => void
  setClaudeBypass: (bypass: boolean) => void
  setSplitView: (left: string, right: string) => void
  clearSplitView: () => void
  setSplitRatio: (ratio: number) => void
  attachFile: (file: { name: string; path: string; isDir: boolean; content?: string }) => void
  detachFile: (path: string) => void
  clearAttachedFiles: () => void

  // Claude Chat
  claudeSessions: Record<string, ClaudeSession>
  addChatMessage: (tabId: string, msg: ChatMessage) => void
  updateStreamingContent: (tabId: string, text: string) => void
  setStreaming: (tabId: string, streaming: boolean) => void
  setClaudeSessionId: (tabId: string, sessionId: string) => void
  addCost: (tabId: string, cost: number) => void
  initClaudeSession: (tabId: string, model: string) => void
}

export const useTerminalStore = create<TerminalState>((set, get) => ({
  tabs: [],
  activeTabId: null,
  paletteOpen: true,
  pinnedOutputs: {},
  commandHistory: loadHistory(),
  runningCommands: {},
  cmdkOpen: false,
  filefinderOpen: false,
  searchOpen: {},
  claudeMode: 'default' as ClaudeMode,
  claudeModel: 'auto' as ClaudeModel,
  claudeBypass: true,
  attachedFiles: [],
  splitView: null,
  splitRatio: 0.5,

  createTab: (label, type) => {
    const tabType = type ?? 'shell'
    const tab: TerminalTab = {
      id: nextId(),
      label: label ?? (tabType === 'claude' ? 'Claude' : `Tab ${get().tabs.length + 1}`),
      type: tabType,
      status: 'connecting',
      cwd: '~',
      createdAt: Date.now(),
    }
    set(s => ({ tabs: [...s.tabs, tab], activeTabId: tab.id }))
    return tab
  },

  closeTab: (id) => {
    set(s => {
      const remaining = s.tabs.filter(t => t.id !== id)
      let activeTabId = s.activeTabId
      if (activeTabId === id) {
        activeTabId = remaining.at(-1)?.id ?? null
      }
      const pinnedOutputs = { ...s.pinnedOutputs }
      delete pinnedOutputs[id]
      const runningCommands = { ...s.runningCommands }
      delete runningCommands[id]
      const claudeSessions = { ...s.claudeSessions }
      delete claudeSessions[id]
      saveClaudeSessions(claudeSessions)
      // Clear split if closed tab was part of it
      const splitView = s.splitView && (s.splitView.left === id || s.splitView.right === id) ? null : s.splitView
      return { tabs: remaining, activeTabId, pinnedOutputs, runningCommands, claudeSessions, splitView }
    })
  },

  setActiveTab: (id) => set({ activeTabId: id }),

  renameTab: (id, label) => {
    set(s => ({
      tabs: s.tabs.map(t => (t.id === id ? { ...t, label } : t)),
    }))
  },

  reorderTabs: (fromId, toId) => {
    set(s => {
      const tabs = [...s.tabs]
      const fromIdx = tabs.findIndex(t => t.id === fromId)
      const toIdx = tabs.findIndex(t => t.id === toId)
      if (fromIdx === -1 || toIdx === -1 || fromIdx === toIdx) return s
      const [moved] = tabs.splice(fromIdx, 1)
      tabs.splice(toIdx, 0, moved)
      return { tabs }
    })
  },

  updateStatus: (id, status) => {
    set(s => ({
      tabs: s.tabs.map(t => (t.id === id ? { ...t, status } : t)),
    }))
  },

  updateCwd: (id, cwd) => {
    set(s => ({
      tabs: s.tabs.map(t => (t.id === id ? { ...t, cwd } : t)),
    }))
  },

  togglePalette: () => set(s => ({ paletteOpen: !s.paletteOpen })),

  pinOutput: (tabId, tabLabel, content) => {
    set(s => ({
      pinnedOutputs: {
        ...s.pinnedOutputs,
        [tabId]: { tabId, tabLabel, content, pinnedAt: Date.now() },
      },
    }))
  },

  unpinOutput: (tabId) => {
    set(s => {
      const pinnedOutputs = { ...s.pinnedOutputs }
      delete pinnedOutputs[tabId]
      return { pinnedOutputs }
    })
  },

  trackCommandRun: (commandId) => {
    set(s => {
      const prev = s.commandHistory[commandId]
      const commandHistory = {
        ...s.commandHistory,
        [commandId]: {
          lastRun: Date.now(),
          runCount: (prev?.runCount ?? 0) + 1,
        },
      }
      saveHistory(commandHistory)
      return { commandHistory }
    })
  },

  startRunning: (tabId, label) => {
    set(s => ({
      runningCommands: {
        ...s.runningCommands,
        [tabId]: { startedAt: Date.now(), label },
      },
    }))
  },

  stopRunning: (tabId) => {
    set(s => {
      const runningCommands = { ...s.runningCommands }
      delete runningCommands[tabId]
      return { runningCommands }
    })
  },

  setCmdkOpen: (open) => set({ cmdkOpen: open }),

  setFilefinderOpen: (open) => set({ filefinderOpen: open }),

  setSearchOpen: (tabId, open) => {
    set(s => ({ searchOpen: { ...s.searchOpen, [tabId]: open } }))
  },

  cycleClaudeMode: () => {
    set(s => {
      const idx = CLAUDE_MODE_CYCLE.indexOf(s.claudeMode)
      const next = CLAUDE_MODE_CYCLE[(idx + 1) % CLAUDE_MODE_CYCLE.length]
      return { claudeMode: next }
    })
  },

  setClaudeMode: (mode) => set({ claudeMode: mode }),
  setClaudeModel: (model) => set({ claudeModel: model }),
  setClaudeBypass: (bypass) => set({ claudeBypass: bypass }),

  setSplitView: (left, right) => {
    if (left === right) return
    set({ splitView: { left, right } })
  },
  clearSplitView: () => set({ splitView: null }),
  setSplitRatio: (ratio) => set({ splitRatio: Math.max(0.2, Math.min(0.8, ratio)) }),

  attachFile: (file) => {
    set(s => {
      if (s.attachedFiles.some(f => f.path === file.path)) return s
      return { attachedFiles: [...s.attachedFiles, file] }
    })
  },

  detachFile: (path) => {
    set(s => ({ attachedFiles: s.attachedFiles.filter(f => f.path !== path) }))
  },

  clearAttachedFiles: () => set({ attachedFiles: [] }),

  // Claude Chat (persisted to localStorage)
  claudeSessions: loadClaudeSessions(),

  initClaudeSession: (tabId, model) => {
    set(s => {
      // If we have a persisted session for this tab, restore it
      const existing = s.claudeSessions[tabId]
      if (existing && existing.messages.length > 0) {
        return s // Already has messages, don't overwrite
      }
      const sessions = {
        ...s.claudeSessions,
        [tabId]: {
          claudeSessionId: null,
          messages: [],
          model,
          totalCost: 0,
          isStreaming: false,
          streamingContent: '',
        },
      }
      debouncedSaveClaudeSessions()
      return { claudeSessions: sessions }
    })
  },

  addChatMessage: (tabId, msg) => {
    set(s => {
      const session = s.claudeSessions[tabId]
      if (!session) return s
      const sessions = {
        ...s.claudeSessions,
        [tabId]: { ...session, messages: [...session.messages, msg] },
      }
      debouncedSaveClaudeSessions()
      return { claudeSessions: sessions }
    })
  },

  updateStreamingContent: (tabId, text) => {
    set(s => {
      const session = s.claudeSessions[tabId]
      if (!session) return s
      const combined = session.streamingContent + text
      return {
        claudeSessions: {
          ...s.claudeSessions,
          [tabId]: { ...session, streamingContent: combined.length > 500_000 ? combined.slice(-500_000) : combined },
        },
      }
    })
  },

  setStreaming: (tabId, streaming) => {
    set(s => {
      const session = s.claudeSessions[tabId]
      if (!session) return s
      return {
        claudeSessions: {
          ...s.claudeSessions,
          [tabId]: { ...session, isStreaming: streaming, streamingContent: streaming ? '' : session.streamingContent },
        },
      }
    })
  },

  setClaudeSessionId: (tabId, sessionId) => {
    set(s => {
      const session = s.claudeSessions[tabId]
      if (!session) return s
      const sessions = {
        ...s.claudeSessions,
        [tabId]: { ...session, claudeSessionId: sessionId },
      }
      debouncedSaveClaudeSessions()
      return { claudeSessions: sessions }
    })
  },

  addCost: (tabId, cost) => {
    set(s => {
      const session = s.claudeSessions[tabId]
      if (!session) return s
      const sessions = {
        ...s.claudeSessions,
        [tabId]: { ...session, totalCost: session.totalCost + cost },
      }
      debouncedSaveClaudeSessions()
      return { claudeSessions: sessions }
    })
  },
}))
