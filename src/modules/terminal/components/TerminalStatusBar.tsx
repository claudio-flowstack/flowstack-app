import { useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { useTerminalStore } from '../application/terminal-store'
import type { ClaudeMode, ClaudeModel } from '../application/terminal-store'

const MODE_CONFIG: Record<ClaudeMode, { label: string; icon: string; color: string; bg: string }> = {
  default: { label: 'Default', icon: '', color: 'text-zinc-400', bg: 'bg-zinc-700/40' },
  acceptEdits: { label: 'Accept Edits', icon: '\u23F5\u23F5', color: 'text-amber-400', bg: 'bg-amber-500/15' },
  plan: { label: 'Plan Mode', icon: '\u23F8', color: 'text-indigo-400', bg: 'bg-indigo-500/15' },
}

const MODEL_LABELS: Record<ClaudeModel, string> = {
  auto: 'Auto',
  opus: 'Opus',
  sonnet: 'Sonnet',
  haiku: 'Haiku',
}

interface TerminalStatusBarProps {
  onReconnect?: () => void
}

export function TerminalStatusBar({ onReconnect }: TerminalStatusBarProps) {
  const tabs = useTerminalStore(s => s.tabs)
  const activeTabId = useTerminalStore(s => s.activeTabId)
  const runningCommands = useTerminalStore(s => s.runningCommands)
  const claudeMode = useTerminalStore(s => s.claudeMode)
  const claudeModel = useTerminalStore(s => s.claudeModel)
  const claudeBypass = useTerminalStore(s => s.claudeBypass)
  const cycleClaudeMode = useTerminalStore(s => s.cycleClaudeMode)
  const activeTab = tabs.find(t => t.id === activeTabId)
  const running = activeTabId ? runningCommands[activeTabId] : undefined

  const status = activeTab?.status ?? 'disconnected'
  const mode = MODE_CONFIG[claudeMode]

  return (
    <div className="flex items-center justify-between px-3 h-8 bg-[#111114] border-t border-zinc-800/60 text-[10px] shrink-0">
      {/* Left: Connection status */}
      <div className="flex items-center gap-1.5">
        <span
          className={cn(
            'w-1.5 h-1.5 rounded-full',
            status === 'connected' ? 'bg-emerald-400' : status === 'connecting' ? 'bg-yellow-400 animate-pulse' : 'bg-red-400'
          )}
        />
        {status === 'disconnected' && onReconnect ? (
          <button
            className="flex items-center gap-1 text-red-400 hover:text-red-300 font-medium transition-colors"
            onClick={onReconnect}
          >
            <RefreshCw className="w-2.5 h-2.5" />
            Getrennt — klicken zum Verbinden
          </button>
        ) : (
          <span className={cn('font-medium', status === 'connected' ? 'text-emerald-400' : status === 'connecting' ? 'text-yellow-400' : 'text-zinc-500')}>
            {status === 'connected' ? 'Verbunden' : status === 'connecting' ? 'Verbindet...' : 'Getrennt'}
          </span>
        )}
      </div>

      {/* Center: Timer or Mode indicator */}
      {running ? (
        <RunTimer startedAt={running.startedAt} label={running.label} />
      ) : (
        <div className="flex items-center gap-2">
          {/* Claude Mode pill — clickable to cycle */}
          <button
            className={cn(
              'flex items-center gap-1 px-2 py-0.5 rounded-md font-medium transition-all',
              mode.bg, mode.color, 'hover:brightness-125'
            )}
            onClick={cycleClaudeMode}
            title="Shift+Tab zum Wechseln"
          >
            {mode.icon && <span className="text-[9px]">{mode.icon}</span>}
            <span>{mode.label}</span>
          </button>

          {/* Model badge */}
          <span className="text-zinc-600 font-mono">{MODEL_LABELS[claudeModel]}</span>

          {/* Bypass indicator */}
          {claudeBypass && (
            <span className="text-amber-500/60 font-medium">Bypass</span>
          )}
        </div>
      )}

      {/* Right: Shortcuts + tabs */}
      <div className="flex items-center gap-1.5">
        <kbd className="text-zinc-600 bg-zinc-800/40 px-1 py-0.5 rounded text-[9px]">
          Shift+Tab
        </kbd>
        <span className="text-zinc-700 mx-0.5">|</span>
        <kbd className="text-zinc-600 bg-zinc-800/40 px-1 py-0.5 rounded text-[9px]">
          {'\u2318'}K
        </kbd>
        <kbd className="text-zinc-600 bg-zinc-800/40 px-1 py-0.5 rounded text-[9px]">
          {'\u2318'}P
        </kbd>
        <span className="text-zinc-600 ml-1">
          {tabs.length} Tab{tabs.length !== 1 && 's'}
        </span>
      </div>
    </div>
  )
}

function RunTimer({ startedAt, label }: { startedAt: number; label: string }) {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt) / 1000))
    }, 1000)
    return () => clearInterval(interval)
  }, [startedAt])

  const mins = Math.floor(elapsed / 60)
  const secs = elapsed % 60
  const time = mins > 0 ? `${mins}:${String(secs).padStart(2, '0')}` : `${secs}s`

  return (
    <div className="flex items-center gap-1.5">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
      <span className="text-amber-400 font-medium font-mono">{time}</span>
      <span className="text-zinc-500 truncate max-w-[150px]">{label}</span>
    </div>
  )
}
