import { useState, useRef, useEffect } from 'react'
import { Plus, X, Pin, Copy, Terminal, Sparkles, Columns2, Braces, Code2, Lock } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { useTerminalStore } from '../application/terminal-store'

const TERMINAL_PROFILES = [
  { id: 'shell', label: 'Shell', description: 'Normales Terminal', icon: Terminal, type: 'shell' as const },
  { id: 'claude', label: 'Claude', description: 'Startet Claude automatisch', icon: Sparkles, type: 'claude' as const, accent: true },
  { id: 'node', label: 'Node.js', description: 'Node REPL', icon: Braces, type: 'shell' as const, command: 'node' },
  { id: 'python', label: 'Python', description: 'Python REPL', icon: Code2, type: 'shell' as const, command: 'python3' },
  { id: 'doppler', label: 'Doppler Shell', description: 'Mit Credentials', icon: Lock, type: 'shell' as const, command: 'doppler run -p fulfillment-automation -c dev_claudio -- bash' },
] as const

interface TerminalTabBarProps {
  onPin: (tabId: string) => void
  onCopy: (tabId: string) => void
}

export function TerminalTabBar({ onPin, onCopy }: TerminalTabBarProps) {
  const tabs = useTerminalStore(s => s.tabs)
  const activeTabId = useTerminalStore(s => s.activeTabId)
  const setActiveTab = useTerminalStore(s => s.setActiveTab)
  const createTab = useTerminalStore(s => s.createTab)
  const closeTab = useTerminalStore(s => s.closeTab)
  const renameTab = useTerminalStore(s => s.renameTab)
  const reorderTabs = useTerminalStore(s => s.reorderTabs)
  const pinnedOutputs = useTerminalStore(s => s.pinnedOutputs)
  const splitView = useTerminalStore(s => s.splitView)
  const setSplitView = useTerminalStore(s => s.setSplitView)
  const clearSplitView = useTerminalStore(s => s.clearSplitView)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [splitMenuOpen, setSplitMenuOpen] = useState(false)
  const [dragOverId, setDragOverId] = useState<string | null>(null)
  const dragTabId = useRef<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const splitMenuRef = useRef<HTMLDivElement>(null)

  // Close menus on outside click
  useEffect(() => {
    if (!menuOpen && !splitMenuOpen) return
    const handler = (e: MouseEvent) => {
      if (menuOpen && menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
      if (splitMenuOpen && splitMenuRef.current && !splitMenuRef.current.contains(e.target as Node)) {
        setSplitMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen, splitMenuOpen])

  const statusColor = (status: string) => {
    if (status === 'connected') return 'bg-emerald-400'
    if (status === 'connecting') return 'bg-yellow-400 animate-pulse'
    return 'bg-zinc-500'
  }

  const tabIcon = (type: string) => {
    if (type === 'claude') return <Sparkles className="w-3 h-3 text-indigo-400/70" />
    return <Terminal className="w-3 h-3 text-zinc-600" />
  }

  return (
    <div className="flex items-center gap-0.5 bg-[#111114] px-2 h-9 border-b border-zinc-800/60 shrink-0">
      {tabs.map(tab => (
        <div
          key={tab.id}
          draggable
          onDragStart={() => { dragTabId.current = tab.id }}
          onDragOver={(e) => { e.preventDefault(); setDragOverId(tab.id) }}
          onDragLeave={() => setDragOverId(null)}
          onDrop={() => {
            if (dragTabId.current && dragTabId.current !== tab.id) {
              reorderTabs(dragTabId.current, tab.id)
            }
            dragTabId.current = null
            setDragOverId(null)
          }}
          onDragEnd={() => { dragTabId.current = null; setDragOverId(null) }}
          className={cn(
            'group flex items-center gap-1.5 px-3 h-7 rounded-md text-xs cursor-pointer transition-colors',
            tab.id === activeTabId
              ? 'bg-[#1a1a1f] text-zinc-200'
              : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/40',
            dragOverId === tab.id && 'ring-1 ring-indigo-500/50',
            splitView && (tab.id === splitView.left || tab.id === splitView.right) && 'border-b-2 border-indigo-500/40'
          )}
          onClick={() => setActiveTab(tab.id)}
          onDoubleClick={() => {
            setEditingId(tab.id)
            setEditValue(tab.label)
          }}
        >
          {tabIcon(tab.type)}
          <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', statusColor(tab.status))} />

          {editingId === tab.id ? (
            <input
              className="bg-transparent text-xs text-zinc-200 outline-none w-20"
              value={editValue}
              onChange={e => setEditValue(e.target.value)}
              onBlur={() => {
                if (editValue.trim()) renameTab(tab.id, editValue.trim())
                setEditingId(null)
              }}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  if (editValue.trim()) renameTab(tab.id, editValue.trim())
                  setEditingId(null)
                }
                if (e.key === 'Escape') setEditingId(null)
              }}
              autoFocus
              onClick={e => e.stopPropagation()}
            />
          ) : (
            <span className="truncate max-w-[100px]">{tab.label}</span>
          )}

          <button
            className="p-0.5 rounded opacity-0 group-hover:opacity-60 hover:!opacity-100 hover:bg-zinc-700/60 transition-opacity"
            onClick={e => { e.stopPropagation(); onCopy(tab.id) }}
            title="Output kopieren"
          >
            <Copy className="w-3 h-3" />
          </button>

          <button
            className={cn(
              'p-0.5 rounded hover:bg-zinc-700/60 transition-opacity',
              pinnedOutputs[tab.id] ? 'text-indigo-400 opacity-100' : 'opacity-0 group-hover:opacity-60'
            )}
            onClick={e => { e.stopPropagation(); onPin(tab.id) }}
            title="Output anheften"
          >
            <Pin className="w-3 h-3" />
          </button>

          {tabs.length > 1 && (
            <button
              className="p-0.5 rounded opacity-0 group-hover:opacity-60 hover:!opacity-100 hover:bg-zinc-700/60 transition-opacity"
              onClick={e => { e.stopPropagation(); closeTab(tab.id) }}
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      ))}

      {/* New Tab Button with Profiles Dropdown */}
      <div className="relative" ref={menuRef}>
        <button
          className="flex items-center justify-center w-7 h-7 rounded-md text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/40 transition-colors"
          onClick={() => setMenuOpen(!menuOpen)}
          title="Neuer Tab"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>

        {menuOpen && (
          <div className="absolute top-full left-0 mt-1 z-30 w-48 bg-[#16161a] border border-zinc-700/60 rounded-lg shadow-xl overflow-hidden">
            {TERMINAL_PROFILES.map(profile => {
              const Icon = profile.icon
              return (
                <button
                  key={profile.id}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-3 py-2 text-left text-xs text-zinc-300 transition-colors',
                    profile.accent ? 'hover:bg-indigo-500/10' : 'hover:bg-zinc-800/60'
                  )}
                  onClick={() => {
                    const tab = createTab(profile.label, profile.type)
                    // For profiles with commands, wait for WS-connected status then send
                    if ('command' in profile && profile.command) {
                      const cmd = profile.command
                      let attempts = 0
                      const trySend = () => {
                        attempts++
                        const tabState = useTerminalStore.getState().tabs.find(t => t.id === tab.id)
                        if (tabState?.status === 'connected') {
                          window.dispatchEvent(new CustomEvent('terminal-send-command', {
                            detail: { tabId: tab.id, command: cmd + '\n' }
                          }))
                          return
                        }
                        if (attempts < 20) setTimeout(trySend, 300)
                      }
                      setTimeout(trySend, 300)
                    }
                    setMenuOpen(false)
                  }}
                >
                  <Icon className={cn('w-3.5 h-3.5', profile.accent ? 'text-indigo-400' : 'text-zinc-500')} />
                  <div>
                    <div className={cn('font-medium', profile.accent && 'text-indigo-300')}>{profile.label}</div>
                    <div className="text-[10px] text-zinc-600">{profile.description}</div>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Split View Button */}
      {tabs.length >= 2 && (
        <div className="relative" ref={splitMenuRef}>
          <button
            className={cn(
              'flex items-center justify-center w-7 h-7 rounded-md transition-colors',
              splitView
                ? 'text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20'
                : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/40'
            )}
            onClick={() => {
              if (splitView) {
                clearSplitView()
              } else {
                setSplitMenuOpen(!splitMenuOpen)
              }
            }}
            title={splitView ? 'Split schliessen (⌘\\)' : 'Split View (⌘\\)'}
          >
            <Columns2 className="w-3.5 h-3.5" />
          </button>

          {splitMenuOpen && !splitView && (
            <div className="absolute top-full right-0 mt-1 z-30 w-44 bg-[#16161a] border border-zinc-700/60 rounded-lg shadow-xl overflow-hidden">
              <div className="px-3 py-1.5 text-[10px] font-semibold text-zinc-600 uppercase tracking-wider">Split mit...</div>
              {tabs.filter(t => t.id !== activeTabId).map(tab => (
                <button
                  key={tab.id}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left text-xs text-zinc-300 hover:bg-zinc-800/60 transition-colors"
                  onClick={() => {
                    if (activeTabId) setSplitView(activeTabId, tab.id)
                    setSplitMenuOpen(false)
                  }}
                >
                  {tabIcon(tab.type)}
                  <span className="truncate">{tab.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
