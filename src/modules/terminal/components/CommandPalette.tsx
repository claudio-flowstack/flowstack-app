import { useState } from 'react'
import { AlertTriangle, Play, Sparkles, ChevronRight, ChevronDown, X, Layers, Shield, ShieldOff, RotateCcw } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { TERMINAL_COMMANDS, TERMINAL_CHAINS } from '../domain/commands'
import { useTerminalStore } from '../application/terminal-store'
import type { TerminalCommand } from '../domain/types'

function timeAgo(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000)
  if (diff < 60) return 'gerade eben'
  if (diff < 3600) return `vor ${Math.floor(diff / 60)}m`
  if (diff < 86400) return `vor ${Math.floor(diff / 3600)}h`
  return `vor ${Math.floor(diff / 86400)}d`
}

interface CommandPaletteProps {
  onRunCommand: (script: string, commandId?: string, label?: string) => void
  onRunChain: (steps: string[], chainId: string, label: string) => void
}

export function CommandPalette({ onRunCommand, onRunChain }: CommandPaletteProps) {
  const paletteOpen = useTerminalStore(s => s.paletteOpen)
  const pinnedOutputs = useTerminalStore(s => s.pinnedOutputs)
  const unpinOutput = useTerminalStore(s => s.unpinOutput)
  const commandHistory = useTerminalStore(s => s.commandHistory)
  const claudeMode = useTerminalStore(s => s.claudeMode)
  const claudeModel = useTerminalStore(s => s.claudeModel)
  const claudeBypass = useTerminalStore(s => s.claudeBypass)
  const setClaudeMode = useTerminalStore(s => s.setClaudeMode)
  const setClaudeModel = useTerminalStore(s => s.setClaudeModel)
  const setClaudeBypass = useTerminalStore(s => s.setClaudeBypass)
  const attachedFiles = useTerminalStore(s => s.attachedFiles)

  // All sections start expanded
  const [open, setOpen] = useState<Record<string, boolean>>({
    workflows: false,
    high: false,
    medium: false,
    claude: true,
  })

  const [claudeResume, setClaudeResume] = useState(false)

  const toggle = (key: string) => setOpen(s => ({ ...s, [key]: !s[key] }))

  if (!paletteOpen) return null

  const highCmds = TERMINAL_COMMANDS.filter(c => c.group === 'high')
  const mediumCmds = TERMINAL_COMMANDS.filter(c => c.group === 'medium')
  const pinned = Object.values(pinnedOutputs)

  // Build Claude command from store state
  const buildClaudeCmd = () => {
    const parts = ['claude']
    if (claudeResume) parts.push('-c')
    if (claudeModel !== 'auto') parts.push('--model', claudeModel)
    if (claudeBypass) parts.push('--dangerously-skip-permissions')
    return parts.join(' ')
  }

  return (
    <div className="w-[240px] shrink-0 bg-[#0e0e12] border-r border-zinc-800/60 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-3 py-2.5 border-b border-zinc-800/40">
        <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Befehle</span>
      </div>

      {/* Scrollable — everything scrolls now */}
      <div className="flex-1 overflow-y-auto">
        {/* Workflows */}
        {TERMINAL_CHAINS.length > 0 && (
          <Section
            label="Workflows"
            color="text-emerald-400/60"
            count={TERMINAL_CHAINS.length}
            open={open.workflows}
            onToggle={() => toggle('workflows')}
          >
            {TERMINAL_CHAINS.map(chain => {
              const info = commandHistory[chain.id]
              return (
                <button
                  key={chain.id}
                  className={cn(
                    'w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left transition-colors group',
                    chain.dangerous
                      ? 'hover:bg-red-500/10 text-zinc-400 hover:text-red-300'
                      : 'hover:bg-emerald-500/8 text-zinc-400 hover:text-emerald-300'
                  )}
                  onClick={() => onRunChain(chain.steps, chain.id, chain.label)}
                >
                  <Layers className="w-3.5 h-3.5 shrink-0 text-emerald-500/50 group-hover:text-emerald-400" />
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] font-medium truncate">{chain.label}</div>
                    <div className="text-[9px] text-zinc-600 truncate">
                      {chain.description}
                      {info && <span className="text-zinc-700"> · {timeAgo(info.lastRun)}</span>}
                    </div>
                  </div>
                  <span className="text-[9px] text-zinc-700 shrink-0">{chain.steps.length}x</span>
                </button>
              )
            })}
          </Section>
        )}

        {/* Wichtig */}
        <Section
          label="Wichtig"
          color="text-amber-400/60"
          count={highCmds.length}
          open={open.high}
          onToggle={() => toggle('high')}
        >
          {highCmds.map(cmd => (
            <CmdButton key={cmd.id} cmd={cmd} info={commandHistory[cmd.id]} onRun={onRunCommand} />
          ))}
        </Section>

        {/* Standard */}
        <Section
          label="Standard"
          color="text-zinc-500"
          count={mediumCmds.length}
          open={open.medium}
          onToggle={() => toggle('medium')}
        >
          {mediumCmds.map(cmd => (
            <CmdButton key={cmd.id} cmd={cmd} info={commandHistory[cmd.id]} onRun={onRunCommand} />
          ))}
        </Section>

        {/* Claude Launcher */}
        <Section
          label="Claude Launcher"
          color="text-indigo-400/60"
          count={0}
          open={open.claude}
          onToggle={() => toggle('claude')}
        >
          <div className="space-y-2">
            {/* Mode Switcher — like Shift+Tab in Claude Code */}
            <div>
              <div className="text-[9px] text-zinc-600 uppercase tracking-wider mb-1 px-0.5 flex items-center justify-between">
                <span>Modus</span>
                <span className="normal-case tracking-normal text-zinc-700">Shift+Tab</span>
              </div>
              <div className="grid grid-cols-3 gap-0.5 bg-zinc-900/60 rounded-md p-0.5">
                <button
                  className={cn(
                    'text-[10px] py-1.5 rounded-sm font-medium transition-colors',
                    claudeMode === 'default' ? 'bg-zinc-700/50 text-zinc-200' : 'text-zinc-500 hover:text-zinc-300'
                  )}
                  onClick={() => setClaudeMode('default')}
                >
                  Default
                </button>
                <button
                  className={cn(
                    'text-[10px] py-1.5 rounded-sm font-medium transition-colors',
                    claudeMode === 'acceptEdits' ? 'bg-amber-500/20 text-amber-300' : 'text-zinc-500 hover:text-zinc-300'
                  )}
                  onClick={() => setClaudeMode('acceptEdits')}
                >
                  {'\u23F5\u23F5'} Edits
                </button>
                <button
                  className={cn(
                    'text-[10px] py-1.5 rounded-sm font-medium transition-colors',
                    claudeMode === 'plan' ? 'bg-indigo-500/20 text-indigo-300' : 'text-zinc-500 hover:text-zinc-300'
                  )}
                  onClick={() => setClaudeMode('plan')}
                >
                  {'\u23F8'} Plan
                </button>
              </div>
            </div>

            {/* Model Selector */}
            <div>
              <div className="text-[9px] text-zinc-600 uppercase tracking-wider mb-1 px-0.5">Modell</div>
              <div className="grid grid-cols-4 gap-0.5 bg-zinc-900/60 rounded-md p-0.5">
                {(['auto', 'opus', 'sonnet', 'haiku'] as const).map(m => (
                  <button
                    key={m}
                    className={cn(
                      'text-[10px] py-1 rounded-sm font-medium transition-colors',
                      claudeModel === m
                        ? 'bg-indigo-500/20 text-indigo-300'
                        : 'text-zinc-500 hover:text-zinc-300'
                    )}
                    onClick={() => setClaudeModel(m)}
                  >
                    {m === 'auto' ? 'Auto' : m.charAt(0).toUpperCase() + m.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Toggle Switches */}
            <div className="space-y-1">
              <ToggleRow
                icon={<ShieldOff className="w-3 h-3" />}
                label="Bypass Permissions"
                sublabel="--dangerously-skip-permissions"
                active={claudeBypass}
                onToggle={() => setClaudeBypass(!claudeBypass)}
                color="amber"
              />
              <ToggleRow
                icon={<RotateCcw className="w-3 h-3" />}
                label="Resume Session"
                sublabel="-c (letzte Session)"
                active={claudeResume}
                onToggle={() => setClaudeResume(!claudeResume)}
                color="indigo"
              />
            </div>

            {/* Attached files hint */}
            {attachedFiles.length > 0 && (
              <div className="rounded-md bg-indigo-500/5 border border-indigo-500/10 px-2 py-1.5">
                <div className="text-[9px] text-indigo-400/60 mb-1">{attachedFiles.length} Datei{attachedFiles.length !== 1 && 'en'} als Kontext:</div>
                {attachedFiles.map(f => (
                  <div key={f.path} className="text-[8px] text-indigo-300/50 font-mono truncate">@{f.name}</div>
                ))}
              </div>
            )}

            {/* Preview + Start */}
            <div className="rounded-lg bg-zinc-900/60 border border-zinc-800/40 p-2">
              <code className="text-[9px] text-zinc-500 font-mono break-all leading-relaxed">
                {buildClaudeCmd()}{claudeMode === 'plan' ? ' \u2192 /plan' : ''}
              </code>
            </div>

            <button
              className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-indigo-500/15 border border-indigo-500/20 text-indigo-300 hover:bg-indigo-500/25 transition-colors font-medium text-xs"
              onClick={() => {
                const cmd = buildClaudeCmd()
                onRunCommand(cmd, 'claude', 'Claude Code')
                // After Claude starts, send attached files as @mentions
                if (attachedFiles.length > 0) {
                  const fileMentions = attachedFiles.map(f => `@${f.path}`).join(' ')
                  setTimeout(() => {
                    onRunCommand(`Schau dir diese Dateien an: ${fileMentions}`, undefined, undefined)
                  }, 2000)
                }
                if (claudeMode === 'plan') {
                  setTimeout(() => onRunCommand('/plan', undefined, undefined), attachedFiles.length > 0 ? 3500 : 1500)
                }
              }}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Claude starten{attachedFiles.length > 0 ? ` (${attachedFiles.length} Dateien)` : ''}
            </button>

            {/* Doppler Shell shortcut */}
            <button
              className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg bg-zinc-800/40 border border-zinc-800/40 text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200 transition-colors text-left group"
              onClick={() => onRunCommand('doppler run --project fulfillment-automation --config dev_claudio -- bash', 'doppler', 'Doppler Shell')}
            >
              <Shield className="w-3.5 h-3.5 shrink-0 text-emerald-500/50 group-hover:text-emerald-400" />
              <div className="min-w-0">
                <div className="text-[11px] font-medium truncate">Doppler Shell</div>
                <div className="text-[9px] text-zinc-600 truncate">Env-Secrets geladen</div>
              </div>
            </button>
          </div>
        </Section>

        {/* Pinned */}
        {pinned.length > 0 && (
          <div className="px-2 pt-3 pb-2">
            <span className="px-1 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Pinned</span>
            {pinned.map(p => (
              <div key={p.tabId} className="mt-1.5 rounded-md bg-zinc-900/60 border border-zinc-800/40 p-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-medium text-zinc-400">{p.tabLabel}</span>
                  <button className="text-zinc-600 hover:text-zinc-400 transition-colors" onClick={() => unpinOutput(p.tabId)}>
                    <X className="w-3 h-3" />
                  </button>
                </div>
                <pre className="text-[9px] leading-tight text-zinc-500 font-mono whitespace-pre-wrap max-h-24 overflow-y-auto">
                  {p.content}
                </pre>
              </div>
            ))}
          </div>
        )}

        {/* Bottom padding so last items are reachable */}
        <div className="h-4" />
      </div>
    </div>
  )
}

// ── Collapsible Section ─────────────────────────────────────────────────────

function Section({
  label,
  color,
  count,
  open,
  onToggle,
  children,
}: {
  label: string
  color: string
  count: number
  open: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <div className="border-b border-zinc-800/30">
      <button
        className="w-full flex items-center gap-1.5 px-3 py-2 hover:bg-zinc-800/30 transition-colors"
        onClick={onToggle}
      >
        {open ? (
          <ChevronDown className="w-3 h-3 text-zinc-600" />
        ) : (
          <ChevronRight className="w-3 h-3 text-zinc-600" />
        )}
        <span className={cn('text-[10px] font-semibold uppercase tracking-wider flex-1 text-left', color)}>
          {label}
        </span>
        <span className="text-[9px] text-zinc-700">{count}</span>
      </button>
      {open && (
        <div className="px-2 pb-2 space-y-0.5">
          {children}
        </div>
      )}
    </div>
  )
}

// ── Toggle Row ──────────────────────────────────────────────────────────────

function ToggleRow({
  icon,
  label,
  sublabel,
  active,
  onToggle,
  color,
}: {
  icon: React.ReactNode
  label: string
  sublabel: string
  active: boolean
  onToggle: () => void
  color: 'amber' | 'indigo' | 'emerald'
}) {
  const colors = {
    amber: { bg: 'bg-amber-500/20', dot: 'bg-amber-400', text: 'text-amber-300', icon: 'text-amber-400/60' },
    indigo: { bg: 'bg-indigo-500/20', dot: 'bg-indigo-400', text: 'text-indigo-300', icon: 'text-indigo-400/60' },
    emerald: { bg: 'bg-emerald-500/20', dot: 'bg-emerald-400', text: 'text-emerald-300', icon: 'text-emerald-400/60' },
  }
  const c = colors[color]

  return (
    <button
      className={cn(
        'w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left transition-colors',
        active ? `${c.bg} ${c.text}` : 'text-zinc-500 hover:bg-zinc-800/40'
      )}
      onClick={onToggle}
    >
      <span className={cn('shrink-0', active ? c.icon : 'text-zinc-600')}>{icon}</span>
      <div className="min-w-0 flex-1">
        <div className="text-[10px] font-medium">{label}</div>
        <div className="text-[8px] opacity-50">{sublabel}</div>
      </div>
      <div className={cn(
        'w-6 h-3.5 rounded-full transition-colors flex items-center px-0.5',
        active ? c.bg : 'bg-zinc-800'
      )}>
        <div className={cn(
          'w-2.5 h-2.5 rounded-full transition-all',
          active ? `${c.dot} translate-x-2` : 'bg-zinc-600 translate-x-0'
        )} />
      </div>
    </button>
  )
}

// ── Command Button ──────────────────────────────────────────────────────────

function CmdButton({
  cmd,
  info,
  onRun,
}: {
  cmd: TerminalCommand
  info?: { lastRun: number; runCount: number }
  onRun: (script: string, commandId?: string, label?: string) => void
}) {
  return (
    <button
      className={cn(
        'w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left transition-colors group',
        cmd.dangerous
          ? 'hover:bg-red-500/10 text-zinc-400 hover:text-red-300'
          : 'hover:bg-zinc-800/50 text-zinc-400 hover:text-zinc-200'
      )}
      onClick={() => onRun(cmd.script, cmd.id, cmd.label)}
    >
      {cmd.dangerous ? (
        <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-red-400/60" />
      ) : (
        <ChevronRight className="w-3.5 h-3.5 shrink-0 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
      )}
      <div className="min-w-0">
        <div className="text-[11px] font-medium truncate">{cmd.label}</div>
        <div className="text-[9px] text-zinc-600 truncate">
          {cmd.description}
          {info && <span className="text-zinc-700"> · {timeAgo(info.lastRun)} · {info.runCount}x</span>}
        </div>
      </div>
      <Play className="w-3 h-3 shrink-0 ml-auto opacity-0 group-hover:opacity-50 transition-opacity" />
    </button>
  )
}
