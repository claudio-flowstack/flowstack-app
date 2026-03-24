export type TabType = 'shell' | 'claude'

export interface TerminalTab {
  id: string
  label: string
  type: TabType
  status: 'connecting' | 'connected' | 'disconnected'
  cwd: string
  createdAt: number
}

export interface TerminalCommand {
  id: string
  label: string
  script: string
  group: 'high' | 'medium' | 'claude'
  description: string
  dangerous?: boolean
}

export interface PinnedOutput {
  tabId: string
  tabLabel: string
  content: string
  pinnedAt: number
}

export interface TerminalChain {
  id: string
  label: string
  steps: string[]
  description: string
  dangerous?: boolean
}

export interface CommandRunInfo {
  lastRun: number
  runCount: number
}

export interface RunningCommand {
  startedAt: number
  label: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  cost?: number
  model?: string
}

export interface ClaudeSession {
  claudeSessionId: string | null
  messages: ChatMessage[]
  model: string
  totalCost: number
  isStreaming: boolean
  streamingContent: string
}
