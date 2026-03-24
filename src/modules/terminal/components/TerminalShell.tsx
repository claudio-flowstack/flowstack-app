import { useEffect, useRef, useCallback, useState } from 'react'
import { PanelLeftClose, PanelLeft, Search, Folder, File, ArrowLeft, Bookmark, HardDrive, X, Paperclip, Terminal, Columns2 } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { useTerminalStore } from '../application/terminal-store'
import { TERMINAL_COMMANDS } from '../domain/commands'
import { TERMINAL_CHAINS } from '../domain/commands'
import { CommandPalette } from './CommandPalette'
import { TerminalTabBar } from './TerminalTabBar'
import { TerminalViewport } from './TerminalViewport'
import { ClaudeChat } from './ClaudeChat'
import { TerminalStatusBar } from './TerminalStatusBar'

export function TerminalShell() {
  const tabs = useTerminalStore(s => s.tabs)
  const activeTabId = useTerminalStore(s => s.activeTabId)
  const createTab = useTerminalStore(s => s.createTab)
  const paletteOpen = useTerminalStore(s => s.paletteOpen)
  const togglePalette = useTerminalStore(s => s.togglePalette)
  const pinOutput = useTerminalStore(s => s.pinOutput)
  const cmdkOpen = useTerminalStore(s => s.cmdkOpen)
  const setCmdkOpen = useTerminalStore(s => s.setCmdkOpen)
  const filefinderOpen = useTerminalStore(s => s.filefinderOpen)
  const setFilefinderOpen = useTerminalStore(s => s.setFilefinderOpen)
  const trackCommandRun = useTerminalStore(s => s.trackCommandRun)
  const startRunning = useTerminalStore(s => s.startRunning)
  const cycleClaudeMode = useTerminalStore(s => s.cycleClaudeMode)
  const attachedFiles = useTerminalStore(s => s.attachedFiles)
  const attachFile = useTerminalStore(s => s.attachFile)
  const detachFile = useTerminalStore(s => s.detachFile)
  const clearAttachedFiles = useTerminalStore(s => s.clearAttachedFiles)
  const splitView = useTerminalStore(s => s.splitView)
  const splitRatio = useTerminalStore(s => s.splitRatio)
  const setSplitView = useTerminalStore(s => s.setSplitView)
  const clearSplitView = useTerminalStore(s => s.clearSplitView)
  const setSplitRatio = useTerminalStore(s => s.setSplitRatio)

  const [cmdkQuery, setCmdkQuery] = useState('')
  const cmdkInputRef = useRef<HTMLInputElement>(null)

  // File finder state
  const [ffQuery, setFfQuery] = useState('')
  const [ffResults, setFfResults] = useState<{ name: string; path: string; isDir: boolean; dir?: string }[]>([])
  const [ffBrowse, setFfBrowse] = useState<{ parent: string; current: string; items: { name: string; path: string; isDir: boolean; size: number | null }[] } | null>(null)
  const [ffBookmarks, setFfBookmarks] = useState<{ label: string; path: string }[]>([])
  const [ffLoading, setFfLoading] = useState(false)
  const [ffMode, setFfMode] = useState<'search' | 'browse'>('search')
  const ffInputRef = useRef<HTMLInputElement>(null)
  const ffDebounceRef = useRef<ReturnType<typeof setTimeout>>()

  // Shared ref for all WebSocket connections + terminal instances
  const wsRef = useRef<Record<string, WebSocket | null>>({})
  const terminalRefs = useRef<Record<string, { selectAll: () => void, getSelection: () => string } | null>>({})
  const reconnectRefs = useRef<Record<string, () => void>>({})
  const splitDividerRef = useRef<HTMLDivElement>(null)

  // Create first tab on mount
  useEffect(() => {
    if (tabs.length === 0) {
      createTab('Shell', 'shell')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Shift+Tab → cycle Claude mode
      if (e.key === 'Tab' && e.shiftKey && !e.metaKey && !e.ctrlKey) {
        e.preventDefault()
        cycleClaudeMode()
        return
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setCmdkOpen(!cmdkOpen)
        setCmdkQuery('')
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'p') {
        e.preventDefault()
        setFilefinderOpen(!filefinderOpen)
        setFfQuery('')
        setFfResults([])
        setFfBrowse(null)
        setFfMode('search')
      }
      // Cmd+\ — Toggle Split View
      if ((e.metaKey || e.ctrlKey) && e.key === '\\') {
        e.preventDefault()
        const state = useTerminalStore.getState()
        if (state.splitView) {
          clearSplitView()
        } else if (state.tabs.length >= 2 && state.activeTabId) {
          const other = state.tabs.find(t => t.id !== state.activeTabId)
          if (other) setSplitView(state.activeTabId, other.id)
        }
      }
      if (e.key === 'Escape' && cmdkOpen) {
        setCmdkOpen(false)
      }
      if (e.key === 'Escape' && filefinderOpen) {
        setFilefinderOpen(false)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [cmdkOpen, setCmdkOpen, filefinderOpen, setFilefinderOpen, cycleClaudeMode, clearSplitView, setSplitView])

  // Focus input when Cmd+K opens
  useEffect(() => {
    if (cmdkOpen) {
      requestAnimationFrame(() => cmdkInputRef.current?.focus())
    }
  }, [cmdkOpen])

  // Load bookmarks + focus input when Cmd+P opens
  useEffect(() => {
    if (filefinderOpen) {
      requestAnimationFrame(() => ffInputRef.current?.focus())
      fetch('/api/files/bookmarks')
        .then(r => r.json())
        .then(setFfBookmarks)
        .catch(err => console.warn('[FileFinder] Bookmarks laden fehlgeschlagen:', err))
    }
  }, [filefinderOpen])

  // Toast message for user feedback
  const [toast, setToast] = useState<string | null>(null)
  const toastTimerRef = useRef<ReturnType<typeof setTimeout>>()
  const showToast = useCallback((msg: string) => {
    setToast(msg)
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    toastTimerRef.current = setTimeout(() => setToast(null), 3000)
  }, [])

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
      if (ffDebounceRef.current) clearTimeout(ffDebounceRef.current)
    }
  }, [])

  // File search with debounce
  const ffSearch = useCallback((q: string) => {
    if (ffDebounceRef.current) clearTimeout(ffDebounceRef.current)
    if (q.length < 2) { setFfResults([]); return }
    setFfLoading(true)
    ffDebounceRef.current = setTimeout(() => {
      fetch(`/api/files/search?q=${encodeURIComponent(q)}`)
        .then(r => r.json())
        .then(data => { setFfResults(data.results ?? []); setFfLoading(false) })
        .catch(err => { console.warn('[FileFinder] Suche fehlgeschlagen:', err); setFfLoading(false) })
    }, 200)
  }, [])

  const ffBrowseDir = useCallback((dir: string) => {
    setFfLoading(true)
    setFfMode('browse')
    fetch(`/api/files/browse?dir=${encodeURIComponent(dir)}`)
      .then(r => r.json())
      .then(data => { setFfBrowse(data); setFfLoading(false) })
      .catch(err => { console.warn('[FileFinder] Browse fehlgeschlagen:', err); setFfLoading(false) })
  }, [])

  // Send text to the active terminal — always reads fresh state
  const sendToTerminal = useCallback((text: string) => {
    const tabId = useTerminalStore.getState().activeTabId
    if (!tabId) return
    const ws = wsRef.current[tabId]
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(text)
    } else {
      showToast('Terminal nicht verbunden — Reconnect noetig')
    }
  }, [showToast])

  // Attach file as chip (default click behavior)
  const ffAttachFile = useCallback((name: string, path: string, isDir: boolean) => {
    attachFile({ name, path, isDir })
    setFilefinderOpen(false)
  }, [attachFile, setFilefinderOpen])

  // Insert path directly into terminal
  const ffInsertPath = useCallback((path: string) => {
    const escaped = path.includes(' ') ? `"${path}" ` : path + ' '
    sendToTerminal(escaped)
    setFilefinderOpen(false)
  }, [sendToTerminal, setFilefinderOpen])

  const handleRunCommand = useCallback((script: string, commandId?: string, label?: string) => {
    const tabId = useTerminalStore.getState().activeTabId
    if (!tabId) {
      showToast('Kein aktiver Tab — bitte Tab erstellen')
      return
    }
    const ws = wsRef.current[tabId]
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      showToast('Terminal nicht verbunden — Reconnect noetig')
      return
    }

    // Claude commands run directly, everything else gets typed without Enter
    const isClaude = commandId ? ['claude', 'doppler'].includes(commandId) : false
    if (isClaude) {
      ws.send(script + '\n')
      if (commandId) trackCommandRun(commandId)
      if (label) startRunning(tabId, label)
    } else {
      ws.send(script)
      if (commandId) trackCommandRun(commandId)
    }
  }, [trackCommandRun, startRunning, showToast])

  // Pending chain waiting for user confirmation
  const [pendingChain, setPendingChain] = useState<{ steps: string[]; chainId: string; label: string } | null>(null)

  const handleRunChain = useCallback((steps: string[], chainId: string, label: string) => {
    // Show confirmation — don't auto-execute
    setPendingChain({ steps, chainId, label })
  }, [])

  const confirmChain = useCallback(async () => {
    if (!pendingChain) return
    const tabId = useTerminalStore.getState().activeTabId
    if (!tabId) return
    const ws = wsRef.current[tabId]
    if (!ws || ws.readyState !== WebSocket.OPEN) return
    const { steps, chainId, label } = pendingChain
    setPendingChain(null)
    trackCommandRun(chainId)
    startRunning(tabId, label)
    for (let i = 0; i < steps.length; i++) {
      ws.send(steps[i] + '\n')
      if (i < steps.length - 1) {
        await new Promise(r => setTimeout(r, 2000))
      }
    }
  }, [pendingChain, trackCommandRun, startRunning])

  const handlePin = useCallback((tabId: string) => {
    const tab = tabs.find(t => t.id === tabId)
    if (!tab) return
    let content = '(Kein Output)'
    const t = terminalRefs.current[tabId]
    if (t) {
      t.selectAll()
      content = t.getSelection() || '(Kein Output)'
    }
    pinOutput(tabId, tab.label, content)
  }, [tabs, pinOutput])

  const handleCopy = useCallback((tabId: string) => {
    const t = terminalRefs.current[tabId]
    if (!t) return
    t.selectAll()
    const text = t.getSelection()
    if (text) {
      navigator.clipboard.writeText(text)
    }
  }, [])

  // Split pane resize handler with cleanup ref for unmount safety
  const dragCleanupRef = useRef<(() => void) | null>(null)
  const handleSplitDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    const container = (e.target as HTMLElement).parentElement
    if (!container) return
    const rect = container.getBoundingClientRect()
    const onMove = (me: MouseEvent) => {
      const ratio = (me.clientX - rect.left) / rect.width
      setSplitRatio(ratio)
    }
    const onUp = () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      dragCleanupRef.current = null
    }
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
    dragCleanupRef.current = onUp
  }, [setSplitRatio])

  // Clean up drag listeners on unmount
  useEffect(() => {
    return () => { dragCleanupRef.current?.() }
  }, [])

  // Cmd+K filtered results
  const q = cmdkQuery.toLowerCase()
  const filteredCmds = q
    ? TERMINAL_COMMANDS.filter(c => c.label.toLowerCase().includes(q) || c.description.toLowerCase().includes(q))
    : TERMINAL_COMMANDS
  const filteredChains = q
    ? TERMINAL_CHAINS.filter(c => c.label.toLowerCase().includes(q) || c.description.toLowerCase().includes(q))
    : TERMINAL_CHAINS

  return (
    <div className="relative flex h-full overflow-hidden rounded-xl border border-zinc-800/60 bg-[#0a0a0e]">
      {/* Command Palette or collapsed strip */}
      {paletteOpen ? (
        <div className="relative shrink-0">
          <CommandPalette onRunCommand={handleRunCommand} onRunChain={handleRunChain} />
          <button
            className="absolute top-2 right-2 z-10 p-1 rounded-md text-zinc-600 hover:text-zinc-400 transition-colors"
            onClick={togglePalette}
            title="Befehle ausblenden"
          >
            <PanelLeftClose className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div className="shrink-0 w-10 bg-[#0e0e12] border-r border-zinc-800/60 flex flex-col items-center pt-2 gap-2">
          <button
            className="p-1.5 rounded-md text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
            onClick={togglePalette}
            title="Befehle anzeigen"
          >
            <PanelLeft className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Terminal Area */}
      <div className="flex flex-col flex-1 min-w-0">
        <TerminalTabBar onPin={handlePin} onCopy={handleCopy} />

        {/* Viewports */}
        <div className="flex-1 min-h-0 relative flex flex-row">
          {splitView ? (
            <>
              {/* Left Split Pane */}
              <div className="min-w-0 min-h-0 relative" style={{ width: `calc(${splitRatio * 100}% - 2px)` }}>
                {tabs.filter(t => t.id === splitView.left).map(tab => (
                  tab.type === 'claude' ? (
                    <ClaudeChat key={tab.id} tabId={tab.id} isActive />
                  ) : (
                    <TerminalViewport key={tab.id} tabId={tab.id} isActive wsRef={wsRef} terminalRefs={terminalRefs} reconnectRefs={reconnectRefs} />
                  )
                ))}
              </div>
              {/* Resize Divider */}
              <div
                ref={splitDividerRef}
                className="w-1 shrink-0 bg-zinc-700/60 cursor-col-resize hover:bg-indigo-500 active:bg-indigo-400 transition-colors"
                onMouseDown={handleSplitDragStart}
              />
              {/* Right Split Pane */}
              <div className="min-w-0 min-h-0 relative" style={{ width: `calc(${(1 - splitRatio) * 100}% - 2px)` }}>
                {tabs.filter(t => t.id === splitView.right).map(tab => (
                  tab.type === 'claude' ? (
                    <ClaudeChat key={tab.id} tabId={tab.id} isActive />
                  ) : (
                    <TerminalViewport key={tab.id} tabId={tab.id} isActive wsRef={wsRef} terminalRefs={terminalRefs} reconnectRefs={reconnectRefs} />
                  )
                ))}
              </div>
              {/* Hidden: keep remaining tabs alive (WS state preserved) */}
              {tabs.filter(t => t.id !== splitView.left && t.id !== splitView.right).map(tab => (
                tab.type === 'claude' ? (
                  <ClaudeChat key={tab.id} tabId={tab.id} isActive={false} />
                ) : (
                  <TerminalViewport key={tab.id} tabId={tab.id} isActive={false} wsRef={wsRef} terminalRefs={terminalRefs} reconnectRefs={reconnectRefs} />
                )
              ))}
            </>
          ) : (
            tabs.map(tab => (
              tab.type === 'claude' ? (
                <ClaudeChat key={tab.id} tabId={tab.id} isActive={tab.id === activeTabId} />
              ) : (
                <TerminalViewport key={tab.id} tabId={tab.id} isActive={tab.id === activeTabId} wsRef={wsRef} terminalRefs={terminalRefs} reconnectRefs={reconnectRefs} />
              )
            ))
          )}
        </div>

        <TerminalStatusBar onReconnect={() => {
          const tabId = useTerminalStore.getState().activeTabId
          if (tabId && reconnectRefs.current[tabId]) {
            reconnectRefs.current[tabId]()
          }
        }} />
      </div>

      {/* Right: Files Panel */}
      <div className="w-[220px] shrink-0 bg-[#0e0e12] border-l border-zinc-800/60 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-3 py-2.5 border-b border-zinc-800/40 flex items-center gap-1.5">
          <Paperclip className="w-3 h-3 text-zinc-500" />
          <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider flex-1">Dateien</span>
          <button
            className="w-5 h-5 flex items-center justify-center rounded-md text-indigo-400/70 hover:text-indigo-300 hover:bg-indigo-500/10 transition-colors"
            onClick={() => setFilefinderOpen(true)}
            title="Datei suchen (⌘P)"
          >
            <span className="text-sm leading-none font-bold">+</span>
          </button>
        </div>

        {/* File list */}
        <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
          {attachedFiles.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-8 px-2">
              <div className="w-10 h-10 rounded-lg bg-zinc-800/40 flex items-center justify-center">
                <Paperclip className="w-5 h-5 text-zinc-700" />
              </div>
              <div className="text-center space-y-1">
                <div className="text-[10px] text-zinc-500">Dateien &amp; Ordner hier ablegen</div>
                <div className="text-[9px] text-zinc-700 leading-relaxed">
                  Beim Claude-Start werden diese als Kontext mitgegeben.
                  Per Klick kannst du Pfade ins Terminal einfuegen.
                </div>
              </div>
              <button
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-indigo-500/10 text-indigo-400 text-[10px] font-medium hover:bg-indigo-500/20 transition-colors"
                onClick={() => setFilefinderOpen(true)}
              >
                Datei suchen
                <kbd className="bg-indigo-500/10 px-1 py-0 rounded text-[8px]">{'\u2318'}P</kbd>
              </button>
            </div>
          ) : (
            attachedFiles.map(f => (
              <div
                key={f.path}
                className={cn(
                  'rounded-md text-[10px] group overflow-hidden',
                  f.isDir ? 'bg-amber-500/8' : 'bg-indigo-500/8'
                )}
              >
                {/* File info row */}
                <div className="flex items-center gap-1.5 px-2 py-1.5">
                  {f.isDir
                    ? <Folder className="w-3.5 h-3.5 shrink-0 text-amber-400/70" />
                    : <File className="w-3.5 h-3.5 shrink-0 text-indigo-400/70" />
                  }
                  <div className="min-w-0 flex-1">
                    <div className={cn('font-medium truncate', f.isDir ? 'text-amber-300/80' : 'text-indigo-300/80')}>
                      {f.name}
                    </div>
                    <div className="text-[8px] text-zinc-600 font-mono truncate">{f.path}</div>
                  </div>
                  <button
                    className="p-0.5 text-zinc-600 hover:text-zinc-300 transition-colors shrink-0"
                    onClick={() => detachFile(f.path)}
                    title="Entfernen"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
                {/* Action buttons — always visible */}
                <div className="flex border-t border-zinc-800/30">
                  <button
                    className="flex-1 flex items-center justify-center gap-1 py-1 text-[9px] text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/40 transition-colors"
                    onClick={() => {
                      const escaped = f.path.includes(' ') ? `"${f.path}" ` : f.path + ' '
                      sendToTerminal(escaped)
                    }}
                  >
                    <Terminal className="w-2.5 h-2.5" />
                    Pfad einfuegen
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {attachedFiles.length > 0 && (
          <div className="px-2 py-2 border-t border-zinc-800/40 space-y-1.5">
            <div className="text-[9px] text-zinc-600 text-center">
              {attachedFiles.length} Datei{attachedFiles.length !== 1 && 'en'} — werden bei Claude-Start als Kontext uebergeben
            </div>
            <div className="flex gap-1">
              <button
                className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md bg-indigo-500/10 text-indigo-400 text-[10px] font-medium hover:bg-indigo-500/20 transition-colors"
                onClick={() => setFilefinderOpen(true)}
              >
                + Weitere
              </button>
              <button
                className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md bg-zinc-800/40 text-zinc-500 text-[10px] hover:text-zinc-300 hover:bg-zinc-800/60 transition-colors"
                onClick={clearAttachedFiles}
              >
                Alle entfernen
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg bg-red-500/20 border border-red-500/30 text-red-300 text-xs font-medium shadow-lg backdrop-blur-sm animate-in fade-in slide-in-from-top-2">
          {toast}
        </div>
      )}

      {/* Chain Confirmation Dialog */}
      {pendingChain && (
        <div
          className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setPendingChain(null)}
        >
          <div
            className="w-[380px] bg-[#16161a] border border-zinc-700/60 rounded-xl shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="px-4 py-3 border-b border-zinc-800/60">
              <div className="text-sm font-medium text-zinc-200">{pendingChain.label}</div>
              <div className="text-[11px] text-zinc-500 mt-0.5">{pendingChain.steps.length} Schritte werden ausgeführt</div>
            </div>
            <div className="px-4 py-3 space-y-1.5">
              {pendingChain.steps.map((step, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-[10px] text-zinc-600 font-mono mt-0.5 shrink-0">{i + 1}.</span>
                  <code className="text-[11px] text-zinc-400 font-mono break-all">{step}</code>
                </div>
              ))}
            </div>
            <div className="px-4 py-3 border-t border-zinc-800/40 flex items-center justify-end gap-2">
              <button
                className="px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 rounded-md hover:bg-zinc-800/60 transition-colors"
                onClick={() => setPendingChain(null)}
              >
                Abbrechen
              </button>
              <button
                className="px-3 py-1.5 text-xs text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-md font-medium transition-colors"
                onClick={confirmChain}
              >
                Ausführen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cmd+K Overlay */}
      {cmdkOpen && (
        <div
          className="absolute inset-0 z-50 flex items-start justify-center pt-16 bg-black/60 backdrop-blur-sm"
          onClick={() => setCmdkOpen(false)}
        >
          <div
            className="w-[420px] bg-[#16161a] border border-zinc-700/60 rounded-xl shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Search Input */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-800/60">
              <Search className="w-4 h-4 text-zinc-500 shrink-0" />
              <input
                ref={cmdkInputRef}
                className="flex-1 bg-transparent text-sm text-zinc-200 outline-none placeholder:text-zinc-600"
                placeholder="Befehl suchen..."
                value={cmdkQuery}
                onChange={e => setCmdkQuery(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Escape') setCmdkOpen(false)
                  if (e.key === 'Enter' && filteredCmds.length > 0) {
                    const cmd = filteredCmds[0]
                    handleRunCommand(cmd.script, cmd.id, cmd.label)
                    setCmdkOpen(false)
                  }
                }}
              />
              <kbd className="text-[10px] text-zinc-600 bg-zinc-800/60 px-1.5 py-0.5 rounded">esc</kbd>
            </div>

            {/* Results */}
            <div className="max-h-[320px] overflow-y-auto py-1">
              {filteredChains.length > 0 && (
                <>
                  <div className="px-4 py-1.5 text-[10px] font-semibold text-zinc-600 uppercase tracking-wider">Workflows</div>
                  {filteredChains.map(chain => (
                    <button
                      key={chain.id}
                      className="w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-zinc-800/50 transition-colors"
                      onClick={() => {
                        handleRunChain(chain.steps, chain.id, chain.label)
                        setCmdkOpen(false)
                      }}
                    >
                      <span className={cn('text-xs', chain.dangerous ? 'text-red-400' : 'text-emerald-400')}>
                        {chain.steps.length} Steps
                      </span>
                      <div className="min-w-0">
                        <div className="text-sm text-zinc-200 truncate">{chain.label}</div>
                        <div className="text-[11px] text-zinc-500 truncate">{chain.description}</div>
                      </div>
                    </button>
                  ))}
                </>
              )}

              {filteredCmds.length > 0 && (
                <>
                  <div className="px-4 py-1.5 text-[10px] font-semibold text-zinc-600 uppercase tracking-wider">Commands</div>
                  {filteredCmds.map(cmd => (
                    <button
                      key={cmd.id}
                      className="w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-zinc-800/50 transition-colors"
                      onClick={() => {
                        handleRunCommand(cmd.script, cmd.id, cmd.label)
                        setCmdkOpen(false)
                      }}
                    >
                      <span className={cn(
                        'text-[10px] font-medium px-1.5 py-0.5 rounded',
                        cmd.group === 'high' ? 'bg-amber-500/15 text-amber-400' :
                        cmd.group === 'claude' ? 'bg-indigo-500/15 text-indigo-400' :
                        'bg-zinc-700/40 text-zinc-400'
                      )}>
                        {cmd.group === 'high' ? 'HI' : cmd.group === 'claude' ? 'CL' : 'STD'}
                      </span>
                      <div className="min-w-0">
                        <div className="text-sm text-zinc-200 truncate">{cmd.label}</div>
                        <div className="text-[11px] text-zinc-500 truncate">{cmd.description}</div>
                      </div>
                    </button>
                  ))}
                </>
              )}

              {filteredCmds.length === 0 && filteredChains.length === 0 && (
                <div className="px-4 py-6 text-center text-sm text-zinc-600">Kein Befehl gefunden</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Cmd+P File Finder Overlay */}
      {filefinderOpen && (
        <div
          className="absolute inset-0 z-50 flex items-start justify-center pt-12 bg-black/60 backdrop-blur-sm"
          onClick={() => setFilefinderOpen(false)}
        >
          <div
            className="w-[480px] bg-[#16161a] border border-zinc-700/60 rounded-xl shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Search Input */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-800/60">
              <HardDrive className="w-4 h-4 text-zinc-500 shrink-0" />
              <input
                ref={ffInputRef}
                className="flex-1 bg-transparent text-sm text-zinc-200 outline-none placeholder:text-zinc-600"
                placeholder="Datei suchen... (Name eingeben)"
                value={ffQuery}
                onChange={e => {
                  setFfQuery(e.target.value)
                  setFfMode('search')
                  ffSearch(e.target.value)
                }}
                onKeyDown={e => {
                  if (e.key === 'Escape') setFilefinderOpen(false)
                  if (e.key === 'Enter' && ffMode === 'search' && ffResults.length > 0) {
                    const r = ffResults[0]
                    if (r.isDir) { ffBrowseDir(r.path) }
                    else { ffAttachFile(r.name, r.path, false) }
                  }
                }}
              />
              {ffLoading && <span className="text-[10px] text-zinc-600 animate-pulse">...</span>}
              <kbd className="text-[10px] text-zinc-600 bg-zinc-800/60 px-1.5 py-0.5 rounded">esc</kbd>
            </div>

            <div className="max-h-[400px] overflow-y-auto">
              {/* Browse mode */}
              {ffMode === 'browse' && ffBrowse && (
                <>
                  {/* Current folder header — with select + back */}
                  <div className="px-4 py-2 border-b border-zinc-800/40 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <button
                        className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-200 transition-colors shrink-0"
                        onClick={() => ffBrowseDir(ffBrowse.parent)}
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-[10px] text-zinc-400 font-mono truncate flex-1">{ffBrowse.current}</span>
                    </div>
                    {/* Big select button for current folder */}
                    <button
                      className="w-full flex items-center justify-center gap-1.5 py-2 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-medium hover:bg-amber-500/20 transition-colors"
                      onClick={() => {
                        const name = ffBrowse.current.split('/').pop() ?? ffBrowse.current
                        ffAttachFile(name, ffBrowse.current, true)
                      }}
                    >
                      <Folder className="w-3.5 h-3.5" />
                      Diesen Ordner auswaehlen
                    </button>
                  </div>
                  <div className="py-1">
                    {ffBrowse.items.length === 0 && (
                      <div className="px-4 py-4 text-center text-xs text-zinc-600">Leerer Ordner</div>
                    )}
                    {ffBrowse.items.map(item => (
                      <div
                        key={item.path}
                        className="flex items-center gap-2 px-4 py-1.5 hover:bg-zinc-800/50 transition-colors group"
                      >
                        {item.isDir ? (
                          <>
                            <Folder className="w-3.5 h-3.5 text-amber-400/70 shrink-0" />
                            <button
                              className="text-xs text-zinc-200 truncate flex-1 text-left hover:underline"
                              onClick={() => ffBrowseDir(item.path)}
                            >
                              {item.name}
                            </button>
                            <button
                              className="text-[9px] text-amber-400/70 hover:text-amber-300 font-medium shrink-0 px-1.5 py-0.5 rounded hover:bg-amber-500/10 transition-colors"
                              onClick={() => ffAttachFile(item.name, item.path, true)}
                            >
                              Auswaehlen
                            </button>
                          </>
                        ) : (
                          <>
                            <File className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                            <button
                              className="text-xs text-zinc-400 truncate flex-1 text-left"
                              onClick={() => ffAttachFile(item.name, item.path, false)}
                            >
                              {item.name}
                            </button>
                            {item.size != null && (
                              <span className="text-[9px] text-zinc-700 shrink-0">
                                {item.size > 1048576 ? `${(item.size / 1048576).toFixed(1)}MB` : item.size > 1024 ? `${(item.size / 1024).toFixed(0)}KB` : `${item.size}B`}
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Search mode — bookmarks + search results */}
              {ffMode === 'search' && (
                <>
                  {/* Bookmarks — click = select folder directly */}
                  {ffQuery.length < 2 && ffBookmarks.length > 0 && (
                    <div className="py-2">
                      <div className="px-4 py-1 text-[10px] font-semibold text-zinc-600 uppercase tracking-wider flex items-center gap-1.5">
                        <Bookmark className="w-3 h-3" /> Schnellzugriff
                      </div>
                      {ffBookmarks.map(bm => (
                        <div
                          key={bm.path}
                          className="flex items-center gap-2.5 px-4 py-2 hover:bg-zinc-800/50 transition-colors group"
                        >
                          <Folder className="w-3.5 h-3.5 text-amber-400/70 shrink-0" />
                          <button
                            className="min-w-0 flex-1 text-left"
                            onClick={() => {
                              ffAttachFile(bm.label, bm.path, true)
                            }}
                          >
                            <div className="text-xs text-zinc-200">{bm.label}</div>
                            <div className="text-[10px] text-zinc-600 font-mono truncate">{bm.path}</div>
                          </button>
                          <button
                            className="text-[9px] text-zinc-600 hover:text-zinc-300 shrink-0 px-1.5 py-0.5 rounded hover:bg-zinc-800/60 transition-colors"
                            onClick={() => ffBrowseDir(bm.path)}
                          >
                            Oeffnen
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Search results */}
                  {ffResults.length > 0 && (
                    <div className="py-1">
                      <div className="px-4 py-1 text-[10px] font-semibold text-zinc-600 uppercase tracking-wider">
                        {ffResults.length} Ergebnis{ffResults.length !== 1 && 'se'}
                      </div>
                      {ffResults.map(r => (
                        <div
                          key={r.path}
                          className="flex items-center gap-2.5 px-4 py-1.5 hover:bg-zinc-800/50 transition-colors group"
                        >
                          <button
                            className="flex items-center gap-2.5 min-w-0 flex-1 text-left"
                            onClick={() => r.isDir ? ffBrowseDir(r.path) : ffAttachFile(r.name, r.path, r.isDir)}
                          >
                            {r.isDir ? (
                              <Folder className="w-3.5 h-3.5 text-amber-400/70 shrink-0" />
                            ) : (
                              <File className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                            )}
                            <div className="min-w-0 flex-1">
                              <div className="text-xs text-zinc-200 truncate">{r.name}</div>
                              <div className="text-[10px] text-zinc-600 font-mono truncate">{r.dir ?? r.path}</div>
                            </div>
                          </button>
                          <button
                            className="text-[9px] text-zinc-700 opacity-0 group-hover:opacity-100 hover:text-zinc-300 transition-all shrink-0"
                            onClick={() => ffInsertPath(r.path)}
                            title="Pfad direkt ins Terminal"
                          >
                            <Terminal className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {ffQuery.length >= 2 && ffResults.length === 0 && !ffLoading && (
                    <div className="px-4 py-6 text-center text-sm text-zinc-600">Keine Dateien gefunden</div>
                  )}
                </>
              )}
            </div>

            {/* Footer hint */}
            <div className="px-4 py-2 border-t border-zinc-800/40 flex items-center justify-between text-[10px] text-zinc-600">
              <span>Klick = Anheften &middot; <Terminal className="w-2.5 h-2.5 inline" /> = Pfad ins Terminal</span>
              <div className="flex items-center gap-2">
                <kbd className="bg-zinc-800/60 px-1.5 py-0.5 rounded">{'\u2318'}P</kbd>
                {attachedFiles.length > 0 && (
                  <span className="text-indigo-400">{attachedFiles.length} angeheftet</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
