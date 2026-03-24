import { useEffect, useRef, useCallback, useState } from 'react'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { WebLinksAddon } from '@xterm/addon-web-links'
import { SearchAddon } from '@xterm/addon-search'
import { Search, ChevronUp, ChevronDown, X, RefreshCw, Sparkles, AlertTriangle } from 'lucide-react'
import '@xterm/xterm/css/xterm.css'
import { useTerminalStore } from '../application/terminal-store'

const THEME = {
  background: '#0a0a0e',
  foreground: '#e4e4e7',
  cursor: '#6366f1',
  cursorAccent: '#0a0a0e',
  selectionBackground: 'rgba(99,102,241,0.3)',
  selectionForeground: '#ffffff',
  black: '#18181b',
  red: '#ef4444',
  green: '#10b981',
  yellow: '#f59e0b',
  blue: '#6366f1',
  magenta: '#a855f7',
  cyan: '#06b6d4',
  white: '#e4e4e7',
  brightBlack: '#52525b',
  brightRed: '#f87171',
  brightGreen: '#34d399',
  brightYellow: '#fbbf24',
  brightBlue: '#818cf8',
  brightMagenta: '#c084fc',
  brightCyan: '#22d3ee',
  brightWhite: '#fafafa',
}

// Error detection regex (compiled once for performance)
const ERROR_PATTERN = /(^(ERROR|FATAL|panic):|^Traceback \(most recent|^npm ERR!|^(Syntax|Type|Reference|ModuleNotFound)Error:)/m

// Reconnection config
const RECONNECT_BASE_DELAY = 500
const RECONNECT_MAX_DELAY = 8000
const RECONNECT_MAX_ATTEMPTS = 20

interface TerminalViewportProps {
  tabId: string
  isActive: boolean
  wsRef: React.MutableRefObject<Record<string, WebSocket | null>>
  terminalRefs: React.MutableRefObject<Record<string, { selectAll: () => void; getSelection: () => string } | null>>
  reconnectRefs: React.MutableRefObject<Record<string, () => void>>
}

export function TerminalViewport({ tabId, isActive, wsRef, terminalRefs, reconnectRefs }: TerminalViewportProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const termRef = useRef<Terminal | null>(null)
  const fitRef = useRef<FitAddon | null>(null)
  const searchRef = useRef<SearchAddon | null>(null)
  const updateStatus = useTerminalStore(s => s.updateStatus)
  const searchOpen = useTerminalStore(s => s.searchOpen[tabId] ?? false)
  const setSearchOpen = useTerminalStore(s => s.setSearchOpen)

  const [searchQuery, setSearchQuery] = useState('')
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [errorDetected, setErrorDetected] = useState<{ text: string; timestamp: number } | null>(null)
  const errorDismissRef = useRef<ReturnType<typeof setTimeout>>()
  const hasAutoStartedRef = useRef(false)

  // Reconnection state
  const reconnectAttemptRef = useRef(0)
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout>>()
  const intentionalCloseRef = useRef(false)
  const dataListenersRef = useRef<{ dispose: () => void }[]>([])

  // Connect WebSocket to an existing terminal instance
  const connectWs = useCallback((term: Terminal) => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsUrl = `${protocol}//${window.location.host}/ws/terminal/${tabId}`
    const ws = new WebSocket(wsUrl)
    ws.binaryType = 'arraybuffer'
    wsRef.current[tabId] = ws

    ws.onopen = () => {
      // Stale WS — a newer connection replaced this one (React StrictMode)
      if (wsRef.current[tabId] !== ws) return
      updateStatus(tabId, 'connected')
      reconnectAttemptRef.current = 0
      const { cols, rows } = term
      ws.send(JSON.stringify({ type: 'resize', cols, rows }))

      // Auto-start Claude for claude tabs (only on first connect, not reconnects)
      if (!hasAutoStartedRef.current) {
        const tab = useTerminalStore.getState().tabs.find(t => t.id === tabId)
        if (tab?.type === 'claude') {
          hasAutoStartedRef.current = true
          const { claudeModel, claudeBypass } = useTerminalStore.getState()
          const parts = ['claude']
          if (claudeModel !== 'auto') parts.push('--model', claudeModel)
          if (claudeBypass) parts.push('--dangerously-skip-permissions')
          setTimeout(() => {
            if (ws.readyState === WebSocket.OPEN) ws.send(parts.join(' ') + '\n')
          }, 300)
        }
      }
    }

    ws.onmessage = (e) => {
      if (wsRef.current[tabId] !== ws) return
      if (e.data instanceof ArrayBuffer) {
        term.write(new Uint8Array(e.data))
        // Error detection on binary data
        const text = new TextDecoder().decode(e.data)
        if (ERROR_PATTERN.test(text)) {
          setErrorDetected({ text: text.slice(-2000), timestamp: Date.now() })
          if (errorDismissRef.current) clearTimeout(errorDismissRef.current)
          errorDismissRef.current = setTimeout(() => setErrorDetected(null), 30000)
        }
      } else {
        term.write(e.data)
        // Error detection on text data
        if (ERROR_PATTERN.test(e.data)) {
          setErrorDetected({ text: (e.data as string).slice(-2000), timestamp: Date.now() })
          if (errorDismissRef.current) clearTimeout(errorDismissRef.current)
          errorDismissRef.current = setTimeout(() => setErrorDetected(null), 30000)
        }
      }
    }

    ws.onclose = (event) => {
      console.warn(`[Terminal] WS closed: code=${event.code}, reason=${event.reason || '(none)'}, tab=${tabId}`)
      // Stale WS — a newer connection replaced this one (React StrictMode)
      if (wsRef.current[tabId] !== ws) return
      wsRef.current[tabId] = null
      if (intentionalCloseRef.current) {
        updateStatus(tabId, 'disconnected')
        return
      }
      // Auto-reconnect with exponential backoff
      const attempt = reconnectAttemptRef.current++
      if (attempt < RECONNECT_MAX_ATTEMPTS) {
        updateStatus(tabId, 'connecting')
        const delay = Math.min(RECONNECT_BASE_DELAY * Math.pow(2, attempt), RECONNECT_MAX_DELAY)
        reconnectTimerRef.current = setTimeout(() => connectWs(term), delay)
      } else {
        updateStatus(tabId, 'disconnected')
        term.write('\r\n\x1b[31m[Verbindung verloren — klicke Reconnect]\x1b[0m\r\n')
      }
    }

    ws.onerror = () => {
      // onclose will fire after this, let it handle reconnection
    }

    // Clean up old data listeners before adding new ones
    dataListenersRef.current.forEach(d => d.dispose())
    dataListenersRef.current = []

    const dataDisposable = term.onData((data) => {
      if (ws.readyState === WebSocket.OPEN) ws.send(data)
    })
    const binaryDisposable = term.onBinary((data) => {
      if (ws.readyState === WebSocket.OPEN) {
        const bytes = new Uint8Array(data.length)
        for (let i = 0; i < data.length; i++) bytes[i] = data.charCodeAt(i)
        ws.send(bytes.buffer)
      }
    })
    dataListenersRef.current = [dataDisposable, binaryDisposable]

    return ws
  }, [tabId, updateStatus, wsRef])

  // Manual reconnect (reset attempts and try again)
  const manualReconnect = useCallback(() => {
    if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current)
    reconnectAttemptRef.current = 0
    intentionalCloseRef.current = false
    const term = termRef.current
    if (!term) return
    // Close existing ws if any
    const existing = wsRef.current[tabId]
    if (existing) {
      try { existing.close() } catch {}
    }
    updateStatus(tabId, 'connecting')
    connectWs(term)
  }, [tabId, connectWs, updateStatus, wsRef])

  // Expose reconnect function to parent (via effect, not render)
  useEffect(() => {
    reconnectRefs.current[tabId] = manualReconnect
    return () => { delete reconnectRefs.current[tabId] }
  }, [tabId, manualReconnect, reconnectRefs])

  // Initialize terminal + first WebSocket connection
  useEffect(() => {
    if (!containerRef.current) return

    const term = new Terminal({
      theme: THEME,
      fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
      fontSize: 13,
      lineHeight: 1.3,
      cursorBlink: true,
      cursorStyle: 'bar',
      scrollback: 5000,
      allowProposedApi: true,
      rightClickSelectsWord: true,
      macOptionIsMeta: true,
      macOptionClickForcesSelection: true,
    })
    termRef.current = term

    const fitAddon = new FitAddon()
    fitRef.current = fitAddon
    term.loadAddon(fitAddon)

    const searchAddon = new SearchAddon()
    searchRef.current = searchAddon
    term.loadAddon(searchAddon)

    term.loadAddon(new WebLinksAddon((_event, uri) => {
      window.open(uri, '_blank', 'noopener')
    }))

    term.open(containerRef.current)

    terminalRefs.current[tabId] = {
      selectAll: () => term.selectAll(),
      getSelection: () => term.getSelection(),
    }

    requestAnimationFrame(() => {
      fitAddon.fit()
    })

    // Right-click paste — uses wsRef to always get current ws
    const container = containerRef.current
    const contextHandler = (e: Event) => {
      e.preventDefault()
      navigator.clipboard.readText().then(text => {
        const ws = wsRef.current[tabId]
        if (text && ws && ws.readyState === WebSocket.OPEN) ws.send(text)
      }).catch(() => {})
    }
    container.addEventListener('contextmenu', contextHandler)

    // Resize observer with throttle — uses wsRef to always get current ws
    let resizeTimer: ReturnType<typeof setTimeout> | null = null
    const resizeObserver = new ResizeObserver(() => {
      if (resizeTimer) return
      resizeTimer = setTimeout(() => {
        resizeTimer = null
        if (fitRef.current && termRef.current) {
          fitRef.current.fit()
          const { cols, rows } = termRef.current
          const ws = wsRef.current[tabId]
          if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'resize', cols, rows }))
          }
        }
      }, 50)
    })
    resizeObserver.observe(container)

    // Initial WebSocket connection
    intentionalCloseRef.current = false
    connectWs(term)

    return () => {
      intentionalCloseRef.current = true
      hasAutoStartedRef.current = false
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current)
      if (errorDismissRef.current) clearTimeout(errorDismissRef.current)
      if (resizeTimer) clearTimeout(resizeTimer)
      resizeObserver.disconnect()
      container.removeEventListener('contextmenu', contextHandler)
      dataListenersRef.current.forEach(d => d.dispose())
      const ws = wsRef.current[tabId]
      if (ws) { try { ws.close() } catch {} }
      wsRef.current[tabId] = null
      terminalRefs.current[tabId] = null
      term.dispose()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabId])

  // Cmd+F listener
  useEffect(() => {
    if (!isActive) return
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault()
        setSearchOpen(tabId, true)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isActive, tabId, setSearchOpen])

  // Focus search input when opened
  useEffect(() => {
    if (searchOpen) {
      requestAnimationFrame(() => searchInputRef.current?.focus())
    } else {
      searchRef.current?.clearDecorations()
      setSearchQuery('')
    }
  }, [searchOpen])

  // Listen for profile commands (e.g. Node REPL, Python, Doppler Shell)
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail
      if (detail?.tabId === tabId && detail?.command) {
        const ws = wsRef.current[tabId]
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(detail.command)
        }
      }
    }
    window.addEventListener('terminal-send-command', handler)
    return () => window.removeEventListener('terminal-send-command', handler)
  }, [tabId, wsRef])

  // Re-fit when tab becomes active
  useEffect(() => {
    if (isActive && fitRef.current) {
      requestAnimationFrame(() => fitRef.current?.fit())
    }
  }, [isActive])

  const doSearch = (query: string, direction: 'next' | 'prev' = 'next') => {
    if (!searchRef.current || !query) return
    if (direction === 'next') {
      searchRef.current.findNext(query, { regex: false, caseSensitive: false })
    } else {
      searchRef.current.findPrevious(query, { regex: false, caseSensitive: false })
    }
  }

  const tabStatus = useTerminalStore(s => s.tabs.find(t => t.id === tabId)?.status)

  return (
    <div
      className="absolute inset-0"
      style={{
        display: isActive ? 'block' : 'none',
        backgroundColor: '#0a0a0e',
      }}
    >
      {/* Reconnect overlay when disconnected */}
      {tabStatus === 'disconnected' && isActive && (
        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
          <button
            className="pointer-events-auto flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-800/90 border border-zinc-700/60 text-sm text-zinc-300 hover:text-white hover:bg-zinc-700/90 transition-colors shadow-lg"
            onClick={manualReconnect}
          >
            <RefreshCw className="w-4 h-4" />
            Neu verbinden
          </button>
        </div>
      )}

      {/* Search Bar */}
      {searchOpen && (
        <div className="absolute top-1 right-2 z-20 flex items-center gap-1 bg-[#1a1a1f] border border-zinc-700/60 rounded-lg px-2 py-1 shadow-lg">
          <Search className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
          <input
            ref={searchInputRef}
            className="bg-transparent text-xs text-zinc-200 outline-none w-40 placeholder:text-zinc-600"
            placeholder="Suchen..."
            value={searchQuery}
            onChange={e => {
              setSearchQuery(e.target.value)
              doSearch(e.target.value)
            }}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                doSearch(searchQuery, e.shiftKey ? 'prev' : 'next')
              }
              if (e.key === 'Escape') {
                setSearchOpen(tabId, false)
              }
            }}
          />
          <button className="p-0.5 text-zinc-500 hover:text-zinc-300" onClick={() => doSearch(searchQuery, 'prev')}>
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
          <button className="p-0.5 text-zinc-500 hover:text-zinc-300" onClick={() => doSearch(searchQuery, 'next')}>
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
          <button className="p-0.5 text-zinc-500 hover:text-zinc-300" onClick={() => setSearchOpen(tabId, false)}>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Error Detection Banner */}
      {errorDetected && isActive && (
        <div className="absolute bottom-2 left-2 right-2 z-20 flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 shadow-lg backdrop-blur-sm animate-in fade-in slide-in-from-bottom-2">
          <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
          <span className="text-[11px] text-red-300 truncate flex-1">Error erkannt im Output</span>
          <button
            className="flex items-center gap-1 px-2 py-1 rounded-md bg-indigo-500/15 text-indigo-300 text-[10px] font-medium hover:bg-indigo-500/25 transition-colors shrink-0"
            onClick={() => {
              // Find or create Claude tab and send error
              const state = useTerminalStore.getState()
              let claudeTab = state.tabs.find(t => t.type === 'claude')
              if (!claudeTab) {
                claudeTab = state.createTab('Claude', 'claude')
              }
              state.setActiveTab(claudeTab.id)
              // Dispatch event with error context for Claude Chat
              const errorText = errorDetected.text.replace(/\x1b\[[0-9;]*m/g, '').trim()
              window.dispatchEvent(new CustomEvent('claude-send-error', {
                detail: { tabId: claudeTab.id, error: `Fix diesen Error:\n\`\`\`\n${errorText.slice(0, 1500)}\n\`\`\`` }
              }))
              setErrorDetected(null)
            }}
          >
            <Sparkles className="w-3 h-3" />
            An Claude senden
          </button>
          <button
            className="p-0.5 text-zinc-500 hover:text-zinc-300 shrink-0"
            onClick={() => setErrorDetected(null)}
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Terminal container */}
      <div
        ref={containerRef}
        className="h-full w-full"
        style={{ padding: '4px 0 0 8px' }}
      />
    </div>
  )
}
