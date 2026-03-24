import { useEffect, useRef, useCallback, useState, memo, useMemo } from 'react'
import { ArrowUp, Loader2, DollarSign, Mic, Square, WandSparkles, Paperclip, X, Folder, FileText, Terminal, FileCode, Search, GitBranch, PenLine } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { useTerminalStore } from '../application/terminal-store'
import { ChatMessage } from './ChatMessage'
import type { ChatMessage as ChatMessageType } from '../domain/types'

// Web Speech API types (not in default TS lib)
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition
    webkitSpeechRecognition: typeof SpeechRecognition
  }
}

/** Claude sunburst logo as inline SVG */
function ClaudeLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M12 2C12 2 12 8.5 12 12M12 12C12 12 12 15.5 12 22M12 12C8.5 12 2 12 2 12M12 12C15.5 12 22 12 22 12M12 12C12 12 5.17 5.17 5.17 5.17M12 12C12 12 18.83 18.83 18.83 18.83M12 12C12 12 18.83 5.17 18.83 5.17M12 12C12 12 5.17 18.83 5.17 18.83"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

/** Memoized message list — only re-renders when messages array ref changes */
const MessageList = memo(function MessageList({ messages }: { messages: ChatMessageType[] }) {
  return (
    <>
      {messages.map(msg => (
        <ChatMessage key={msg.id} message={msg} />
      ))}
    </>
  )
})

/** Empty array singleton to avoid new ref on every render */
const EMPTY_MESSAGES: ChatMessageType[] = []

interface ClaudeChatProps {
  tabId: string
  isActive: boolean
}

export function ClaudeChat({ tabId, isActive }: ClaudeChatProps) {
  // Granular selectors — prevent unnecessary re-renders
  const messages = useTerminalStore(s => s.claudeSessions[tabId]?.messages ?? EMPTY_MESSAGES)
  const isStreaming = useTerminalStore(s => s.claudeSessions[tabId]?.isStreaming ?? false)
  const streamingContent = useTerminalStore(s => s.claudeSessions[tabId]?.streamingContent ?? '')
  const totalCost = useTerminalStore(s => s.claudeSessions[tabId]?.totalCost ?? 0)
  const sessionModel = useTerminalStore(s => s.claudeSessions[tabId]?.model ?? 'opus')
  const sessionExists = useTerminalStore(s => !!s.claudeSessions[tabId])
  const claudeModel = useTerminalStore(s => s.claudeModel)
  const initClaudeSession = useTerminalStore(s => s.initClaudeSession)
  const addChatMessage = useTerminalStore(s => s.addChatMessage)
  const updateStreamingContentFn = useTerminalStore(s => s.updateStreamingContent)
  const setStreaming = useTerminalStore(s => s.setStreaming)
  const setClaudeSessionId = useTerminalStore(s => s.setClaudeSessionId)
  const addCost = useTerminalStore(s => s.addCost)
  const updateStatus = useTerminalStore(s => s.updateStatus)
  const attachedFiles = useTerminalStore(s => s.attachedFiles)
  const attachFile = useTerminalStore(s => s.attachFile)
  const detachFile = useTerminalStore(s => s.detachFile)

  const [input, setInput] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [recordingSeconds, setRecordingSeconds] = useState(0)
  const [audioLevels, setAudioLevels] = useState<number[]>(new Array(24).fill(0))
  const [recordingError, setRecordingError] = useState<string | null>(null)
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const [wsConnected, setWsConnected] = useState(false)
  const [toolActivities, setToolActivities] = useState<{ id: string; tool: string; label: string; timestamp: number }[]>([])

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animFrameRef = useRef<number | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const scrollThrottleRef = useRef(0)
  const reconnectAttemptRef = useRef(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Init session on mount if missing
  useEffect(() => {
    if (!sessionExists) {
      const model = claudeModel === 'auto' ? 'opus' : claudeModel
      initClaudeSession(tabId, model)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabId])

  // Map tool names to readable labels
  const describeToolUse = useCallback((toolName: string, input: Record<string, unknown>): string => {
    const name = toolName.toLowerCase()
    if (name === 'read' || name === 'readfile') {
      const fp = (input.file_path as string) || ''
      const short = fp.split('/').slice(-2).join('/')
      return `Liest ${short || 'Datei'}...`
    }
    if (name === 'edit' || name === 'editfile') {
      const fp = (input.file_path as string) || ''
      const short = fp.split('/').slice(-2).join('/')
      return `Bearbeitet ${short || 'Datei'}...`
    }
    if (name === 'write' || name === 'writefile') {
      const fp = (input.file_path as string) || ''
      const short = fp.split('/').slice(-2).join('/')
      return `Schreibt ${short || 'Datei'}...`
    }
    if (name === 'bash' || name === 'execute' || name === 'terminal') {
      const cmd = (input.command as string) || ''
      const short = cmd.length > 60 ? cmd.slice(0, 60) + '...' : cmd
      return `$ ${short || 'Befehl'}`
    }
    if (name === 'grep' || name === 'search') {
      const pat = (input.pattern as string) || ''
      return `Sucht "${pat.slice(0, 40)}"...`
    }
    if (name === 'glob') {
      const pat = (input.pattern as string) || ''
      return `Sucht Dateien: ${pat.slice(0, 40)}...`
    }
    if (name === 'agent') {
      const desc = (input.description as string) || ''
      return `Agent: ${desc.slice(0, 50) || 'Unteraufgabe'}...`
    }
    return `${toolName}...`
  }, [])

  // Handle Claude events from WebSocket
  const handleClaudeEvent = useCallback((event: Record<string, unknown>) => {
    const type = event.type as string

    if (type === 'system' && event.session_id) {
      setClaudeSessionId(tabId, event.session_id as string)
    }

    // Error from backend
    if (type === 'error') {
      setSendError(event.message as string ?? 'Unbekannter Fehler')
      setStreaming(tabId, false)
      setToolActivities([])
      return
    }

    if (type === 'stream_event') {
      const inner = event.event as Record<string, unknown> | undefined

      // Tool use detection — content_block_start with tool_use type
      if (inner?.type === 'content_block_start') {
        const block = inner.content_block as Record<string, unknown> | undefined
        if (block?.type === 'tool_use') {
          const toolName = (block.name as string) || 'Tool'
          const toolInput = (block.input as Record<string, unknown>) || {}
          const label = describeToolUse(toolName, toolInput)
          setToolActivities(prev => [
            ...prev.slice(-4), // Keep max 5
            { id: `tool-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, tool: toolName, label, timestamp: Date.now() },
          ])
        }
      }

      // Tool input accumulation — some CLIs send input via deltas
      if (inner?.type === 'content_block_delta') {
        const delta = inner.delta as Record<string, unknown> | undefined
        if (delta?.type === 'text_delta' && typeof delta.text === 'string') {
          updateStreamingContentFn(tabId, delta.text)
        }
        if (delta?.type === 'input_json_delta' && typeof delta.partial_json === 'string') {
          // Tool input streaming — update last activity label if we get more info
          // (optional enhancement, skip for now)
        }
      }

      // Tool result
      if (inner?.type === 'content_block_stop') {
        // Remove oldest activity when block completes
        setToolActivities(prev => prev.length > 0 ? prev.slice(1) : prev)
      }

      if (inner?.type === 'message_stop') {
        const store = useTerminalStore.getState()
        const sess = store.claudeSessions[tabId]
        if (sess && sess.streamingContent) {
          addChatMessage(tabId, {
            id: `msg-${Date.now()}`,
            role: 'assistant',
            content: sess.streamingContent,
            timestamp: Date.now(),
          })
        }
        setStreaming(tabId, false)
        setToolActivities([])
      }
    }

    if (type === 'result') {
      const cost = event.total_cost_usd as number | undefined
      if (cost) addCost(tabId, cost)
      if (event.session_id) setClaudeSessionId(tabId, event.session_id as string)

      const store = useTerminalStore.getState()
      const sess = store.claudeSessions[tabId]
      if (sess?.isStreaming) {
        const resultText = (event.result as string) || sess.streamingContent
        if (resultText) {
          addChatMessage(tabId, {
            id: `msg-${Date.now()}`,
            role: 'assistant',
            content: resultText,
            timestamp: Date.now(),
            cost,
          })
        }
        setStreaming(tabId, false)
      }
      setToolActivities([])
    }
  }, [tabId, addChatMessage, updateStreamingContentFn, setStreaming, setClaudeSessionId, addCost, describeToolUse])

  // Connect WebSocket with auto-reconnect + StrictMode guard
  useEffect(() => {
    let cancelled = false
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null

    function connect() {
      if (cancelled) return

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const wsToken = import.meta.env.VITE_CLAUDE_WS_TOKEN ?? ''
      const tokenParam = wsToken ? `?token=${encodeURIComponent(wsToken)}` : ''
      const wsUrl = `${protocol}//${window.location.host}/ws/claude/${tabId}${tokenParam}`
      const ws = new WebSocket(wsUrl)

      ws.onopen = () => {
        if (cancelled) { ws.close(); return }
        wsRef.current = ws
        setWsConnected(true)
        setSendError(null)
        reconnectAttemptRef.current = 0
        updateStatus(tabId, 'connected')
      }

      ws.onmessage = (e) => {
        if (cancelled || wsRef.current !== ws) return
        try { handleClaudeEvent(JSON.parse(e.data)) } catch (err) { console.error('[ClaudeChat] Event parse error:', err) }
      }

      ws.onerror = (e) => { console.error('[ClaudeChat] WebSocket error:', e) }

      ws.onclose = (event) => {
        console.warn(`[ClaudeChat] WS closed: code=${event.code}, reason=${event.reason || '(none)'}, tab=${tabId}`)
        if (cancelled) return
        wsRef.current = null
        setWsConnected(false)
        updateStatus(tabId, 'disconnected')

        // Auto-reconnect with exponential backoff (max 20 attempts)
        const attempt = reconnectAttemptRef.current
        if (attempt < 20) {
          const delay = Math.min(500 * Math.pow(1.5, attempt), 8000)
          reconnectAttemptRef.current = attempt + 1
          reconnectTimer = setTimeout(connect, delay)
        }
      }
    }

    connect()

    return () => {
      cancelled = true
      if (reconnectTimer) clearTimeout(reconnectTimer)
      const ws = wsRef.current
      if (ws) {
        ws.close()
        wsRef.current = null
        setWsConnected(false)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabId])

  // Throttled auto-scroll
  useEffect(() => {
    const now = Date.now()
    if (now - scrollThrottleRef.current < 150) return
    scrollThrottleRef.current = now
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, streamingContent])

  // Focus input when tab becomes active
  useEffect(() => {
    if (isActive) setTimeout(() => inputRef.current?.focus(), 50)
  }, [isActive])

  // Re-focus input when streaming ends
  const wasStreamingRef = useRef(false)
  useEffect(() => {
    if (isStreaming) {
      wasStreamingRef.current = true
    } else if (wasStreamingRef.current) {
      wasStreamingRef.current = false
      setTimeout(() => inputRef.current?.focus(), 150)
    }
  }, [isStreaming])

  // Safety: reset isStreaming if stuck for >120s without new content
  const lastStreamUpdateRef = useRef(Date.now())
  useEffect(() => {
    if (isStreaming) {
      lastStreamUpdateRef.current = Date.now()
    }
  }, [streamingContent, isStreaming])

  useEffect(() => {
    if (!isStreaming) return
    const timer = setInterval(() => {
      if (Date.now() - lastStreamUpdateRef.current > 120_000) {
        setStreaming(tabId, false)
        setSendError('Claude hat nicht geantwortet (Timeout). Versuche es erneut.')
      }
    }, 10_000)
    return () => clearInterval(timer)
  }, [isStreaming, tabId, setStreaming])

  // Cleanup recording resources on unmount
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current)
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
      if (audioCtxRef.current) audioCtxRef.current.close().catch(() => {})
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop())
      if (recognitionRef.current) {
        try { recognitionRef.current.stop() } catch {}
      }
    }
  }, [])

  // Listen for error events from TerminalViewport "An Claude senden"
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail
      if (detail?.tabId === tabId && detail?.error) {
        setInput(detail.error)
        // Auto-focus input
        requestAnimationFrame(() => inputRef.current?.focus())
      }
    }
    window.addEventListener('claude-send-error', handler)
    return () => window.removeEventListener('claude-send-error', handler)
  }, [tabId])

  const sendMessage = useCallback(() => {
    const text = input.trim()
    if (!text) return
    const ws = wsRef.current
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      setSendError('Keine Verbindung zum Backend. Warte kurz oder lade die Seite neu.')
      return
    }
    setSendError(null)

    addChatMessage(tabId, {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
    })
    setInput('')
    setStreaming(tabId, true)

    const store = useTerminalStore.getState()
    const sess = store.claudeSessions[tabId]

    // Cross-tab context
    const otherTabsContext: { tabLabel: string; messages: { role: string; content: string }[] }[] = []
    for (const tab of store.tabs) {
      if (tab.id === tabId || tab.type !== 'claude') continue
      const otherSess = store.claudeSessions[tab.id]
      if (!otherSess?.messages.length) continue
      const recent = otherSess.messages.slice(-5).map(m => ({
        role: m.role,
        content: m.content.slice(0, 500),
      }))
      otherTabsContext.push({ tabLabel: tab.label, messages: recent })
    }

    try {
      ws.send(JSON.stringify({
        message: text,
        model: sess?.model ?? 'opus',
        claude_session_id: sess?.claudeSessionId ?? null,
        bypass: store.claudeBypass,
        attached_files: store.attachedFiles.length > 0 ? store.attachedFiles : [],
        other_tabs: otherTabsContext.length > 0 ? otherTabsContext : undefined,
      }))
    } catch {
      setSendError('Verbindung verloren. Bitte Seite neu laden.')
      setStreaming(tabId, false)
      return
    }

    if (inputRef.current) {
      inputRef.current.style.height = 'auto'
      inputRef.current.focus()
    }
  }, [input, tabId, addChatMessage, setStreaming])

  const optimizePrompt = useCallback(async () => {
    const text = input.trim()
    if (!text || isOptimizing) return
    setIsOptimizing(true)
    try {
      const resp = await fetch('/api/optimize-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, model: 'sonnet' }),
      })
      if (!resp.ok) throw new Error(`${resp.status}`)
      const data = await resp.json()
      if (data.optimized) {
        setInput(data.optimized)
        requestAnimationFrame(() => {
          if (inputRef.current) {
            inputRef.current.style.height = 'auto'
            inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 200) + 'px'
            inputRef.current.focus()
          }
        })
      }
    } catch (err) {
      console.error('[ClaudeChat] Prompt optimization failed:', err)
    } finally {
      setIsOptimizing(false)
    }
  }, [input, isOptimizing])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    for (const file of Array.from(files)) {
      const reader = new FileReader()
      const fileName = file.name
      reader.onload = () => {
        const text = reader.result as string
        // Limit to 100KB per file to avoid bloating the WS message
        const content = text.length > 100_000 ? text.slice(0, 100_000) + '\n\n... [abgeschnitten, Datei zu gross]' : text
        attachFile({ name: fileName, path: fileName, isDir: false, content })
      }
      reader.onerror = () => {
        attachFile({ name: fileName, path: fileName, isDir: false, content: '[Datei konnte nicht gelesen werden]' })
      }
      reader.readAsText(file)
    }
    // Reset so same file can be re-selected
    e.target.value = ''
  }, [attachFile])

  const stopRecordingCleanup = useCallback(() => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current)
      recordingTimerRef.current = null
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current)
      animFrameRef.current = null
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {})
      audioCtxRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    analyserRef.current = null
    setRecordingSeconds(0)
    setAudioLevels(new Array(24).fill(0))
  }, [])

  const updateWaveform = useCallback(() => {
    const analyser = analyserRef.current
    if (!analyser) return
    const data = new Uint8Array(analyser.frequencyBinCount)
    analyser.getByteFrequencyData(data)
    const bars = 24
    const step = Math.floor(data.length / bars)
    const levels: number[] = []
    for (let i = 0; i < bars; i++) {
      const val = data[i * step] ?? 0
      levels.push(val / 255)
    }
    setAudioLevels(levels)
    animFrameRef.current = requestAnimationFrame(updateWaveform)
  }, [])

  const toggleRecording = useCallback(async () => {
    if (isRecording) {
      recognitionRef.current?.stop()
      setIsRecording(false)
      stopRecordingCleanup()
      return
    }

    setRecordingError(null)

    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognitionAPI) {
      setRecordingError('Spracheingabe wird in diesem Browser nicht unterstuetzt (Chrome empfohlen)')
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const audioCtx = new AudioContext()
      const source = audioCtx.createMediaStreamSource(stream)
      const analyser = audioCtx.createAnalyser()
      analyser.fftSize = 256
      source.connect(analyser)
      audioCtxRef.current = audioCtx
      analyserRef.current = analyser

      const recognition = new SpeechRecognitionAPI()
      recognition.lang = 'de-DE'
      recognition.continuous = true
      recognition.interimResults = true

      let finalTranscript = ''

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interim = ''
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i]
          if (result?.isFinal) {
            finalTranscript += result[0]?.transcript ?? ''
          } else {
            interim += result?.[0]?.transcript ?? ''
          }
        }
        const liveText = finalTranscript + interim
        if (liveText) setInput(liveText)
      }

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        if (event.error !== 'aborted') {
          setRecordingError(`Spracherkennung: ${event.error}`)
        }
        setIsRecording(false)
        stopRecordingCleanup()
      }

      recognition.onend = () => {
        setIsRecording(false)
        stopRecordingCleanup()
        inputRef.current?.focus()
      }

      recognition.start()
      recognitionRef.current = recognition
      setIsRecording(true)
      setRecordingSeconds(0)
      setInput('')
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds(s => s + 1)
      }, 1000)
      animFrameRef.current = requestAnimationFrame(updateWaveform)
    } catch {
      setRecordingError('Mikrofon-Zugriff verweigert')
    }
  }, [isRecording, stopRecordingCleanup, updateWaveform])

  const modelLabel = sessionModel.charAt(0).toUpperCase() + sessionModel.slice(1)
  const hasMessages = messages.length > 0 || isStreaming
  const assistantCount = useMemo(() => messages.filter(m => m.role === 'assistant').length, [messages])

  return (
    <div
      className="absolute inset-0 flex flex-col"
      style={{ display: isActive ? 'flex' : 'none', backgroundColor: '#1a1a1f' }}
    >
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[720px] mx-auto">
          {/* Empty State */}
          {!hasMessages && (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-5 px-8">
              <div className="w-14 h-14 rounded-full bg-[#da7756]/10 flex items-center justify-center">
                <ClaudeLogo className="w-7 h-7 text-[#da7756]" />
              </div>
              <div className="text-center space-y-1.5">
                <h1 className="text-lg font-medium text-zinc-200">Wie kann ich helfen?</h1>
                <p className="text-[13px] text-zinc-500 max-w-sm leading-relaxed">
                  Claude hat Zugriff auf dein Flowstack-Projekt und kann Code schreiben, analysieren und erklaeren.
                </p>
              </div>
              <div className="flex items-center gap-2.5 text-[11px] text-zinc-500">
                <span className="bg-[#da7756]/10 text-[#da7756] px-2.5 py-1 rounded-full font-medium">{modelLabel}</span>
              </div>
            </div>
          )}

          <MessageList messages={messages} />

          {/* Streaming */}
          {isStreaming && streamingContent && (
            <ChatMessage
              message={{ id: 'streaming', role: 'assistant', content: streamingContent, timestamp: Date.now() }}
              isStreaming
            />
          )}

          {/* Activity indicator — shows what Claude is doing */}
          {isStreaming && (
            <div className="px-4 py-3">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-[#da7756]/10 flex items-center justify-center shrink-0">
                  <Loader2 className="w-3.5 h-3.5 text-[#da7756]/60 animate-spin" />
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  {toolActivities.length === 0 && !streamingContent && (
                    <span className="text-[13px] text-zinc-500">Claude denkt nach...</span>
                  )}
                  {toolActivities.map(activity => {
                    const toolLower = activity.tool.toLowerCase()
                    const Icon = toolLower === 'bash' || toolLower === 'execute' || toolLower === 'terminal'
                      ? Terminal
                      : toolLower === 'edit' || toolLower === 'editfile' || toolLower === 'write' || toolLower === 'writefile'
                        ? PenLine
                        : toolLower === 'grep' || toolLower === 'search' || toolLower === 'glob'
                          ? Search
                          : toolLower === 'agent'
                            ? GitBranch
                            : FileCode
                    return (
                      <div key={activity.id} className="flex items-center gap-2 text-[12px] text-zinc-500 font-mono animate-in fade-in slide-in-from-bottom-1 duration-200">
                        <Icon className="w-3 h-3 text-zinc-600 shrink-0" />
                        <span className="truncate">{activity.label}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} className="h-4" />
        </div>
      </div>

      {/* Input Area */}
      <div className="shrink-0 pb-4 pt-2 px-4">
        <div className="max-w-[720px] mx-auto">
          {totalCost > 0 && (
            <div className="flex items-center justify-center gap-2 pb-2 text-[10px] text-zinc-600">
              <DollarSign className="w-3 h-3" />
              <span className="font-mono">{totalCost.toFixed(4)}</span>
              <span className="text-zinc-700">|</span>
              <span>{assistantCount} Antworten</span>
            </div>
          )}

          {sendError && (
            <div className="flex items-center gap-2 pb-2 px-1">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
              <p className="text-[12px] text-red-400">{sendError}</p>
            </div>
          )}

          {/* Attached files chips */}
          {attachedFiles.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pb-2 px-1">
              {attachedFiles.map(f => (
                <div
                  key={f.path}
                  className="flex items-center gap-1.5 bg-zinc-800/60 border border-zinc-700/40 rounded-lg px-2.5 py-1.5 text-[12px] text-zinc-400 group"
                >
                  {f.isDir ? <Folder className="w-3 h-3 text-amber-500/70" /> : <FileText className="w-3 h-3 text-blue-400/70" />}
                  <span className="max-w-[180px] truncate">{f.name}</span>
                  <button
                    className="text-zinc-600 hover:text-red-400 transition-colors ml-0.5"
                    onClick={() => detachFile(f.path)}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="relative bg-[#25252d] rounded-2xl border border-zinc-700/30 focus-within:border-zinc-600/50 transition-colors shadow-lg shadow-black/20">
            {/* Recording overlay */}
            {isRecording && (
              <div className="absolute inset-0 z-10 flex items-center px-5 rounded-2xl bg-[#25252d] border border-red-500/30">
                <div className="flex items-center gap-3 shrink-0">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-[14px] text-zinc-200 font-mono tabular-nums">
                    {Math.floor(recordingSeconds / 60).toString().padStart(2, '0')}:{(recordingSeconds % 60).toString().padStart(2, '0')}
                  </span>
                </div>
                <div className="flex-1 flex items-center justify-center gap-[2px] h-full px-4">
                  {audioLevels.map((level, i) => (
                    <div
                      key={i}
                      className="w-[3px] rounded-full bg-red-400 transition-all duration-75"
                      style={{ height: `${Math.max(4, level * 32)}px`, opacity: 0.4 + level * 0.6 }}
                    />
                  ))}
                </div>
                <button
                  className="flex items-center justify-center w-10 h-10 rounded-full bg-red-500 text-white hover:bg-red-400 transition-colors shadow-lg shadow-red-500/25 shrink-0"
                  onClick={toggleRecording}
                >
                  <Square className="w-4 h-4" />
                </button>
              </div>
            )}

            {recordingError && !isRecording && (
              <div className="absolute top-0 left-0 right-0 z-10 px-4 py-2 rounded-t-2xl bg-red-500/10 border-b border-red-500/20">
                <p className="text-[12px] text-red-400">{recordingError}</p>
              </div>
            )}

            <textarea
              ref={inputRef}
              className={cn(
                'w-full bg-transparent px-5 pt-4 pb-12 text-[14px] text-zinc-200 leading-relaxed',
                'placeholder:text-zinc-500 outline-none resize-none',
                'min-h-[56px] max-h-[200px]'
              )}
              placeholder="Nachricht an Claude..."
              value={input}
              onChange={e => { setInput(e.target.value); setRecordingError(null); setSendError(null) }}
              onKeyDown={handleKeyDown}
              rows={1}
              disabled={isRecording}
              onInput={e => {
                const el = e.target as HTMLTextAreaElement
                el.style.height = 'auto'
                el.style.height = Math.min(el.scrollHeight, 200) + 'px'
              }}
            />

            <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-4 py-2.5">
              <div className="flex items-center gap-2 text-[11px] text-zinc-600">
                <span className={cn(
                  'w-1.5 h-1.5 rounded-full',
                  wsConnected ? 'bg-emerald-500' : 'bg-red-500 animate-pulse'
                )} />
                <span className="bg-[#da7756]/10 text-[#da7756]/70 px-2 py-0.5 rounded-md font-medium">{modelLabel}</span>
              </div>

              <div className="flex items-center gap-1.5">
                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFileSelect}
                />

                {!isRecording && (
                  <button
                    className="flex items-center justify-center w-8 h-8 rounded-xl bg-zinc-700/40 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-700/60 transition-all"
                    onClick={() => fileInputRef.current?.click()}
                    title="Dateien anhaengen"
                  >
                    <Paperclip className="w-4 h-4" />
                  </button>
                )}

                {!isRecording && (
                  <button
                    className="flex items-center justify-center w-8 h-8 rounded-xl bg-zinc-700/40 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-700/60 transition-all"
                    onClick={toggleRecording}
                    disabled={isStreaming}
                    title="Spracheingabe"
                  >
                    <Mic className="w-4 h-4" />
                  </button>
                )}

                {input.trim().length > 10 && !isRecording && (
                  <button
                    className={cn(
                      'flex items-center justify-center w-8 h-8 rounded-xl transition-all',
                      isOptimizing
                        ? 'bg-[#da7756]/20 text-[#da7756]'
                        : 'bg-zinc-700/40 text-zinc-500 hover:text-[#da7756] hover:bg-[#da7756]/10'
                    )}
                    onClick={optimizePrompt}
                    disabled={isOptimizing || isStreaming}
                    title="Prompt optimieren"
                  >
                    <WandSparkles className={cn('w-4 h-4', isOptimizing && 'animate-spin')} />
                  </button>
                )}

                <button
                  className={cn(
                    'flex items-center justify-center w-8 h-8 rounded-xl transition-all',
                    input.trim() && !isStreaming
                      ? 'bg-[#da7756] text-white hover:bg-[#c56a4c] shadow-md shadow-[#da7756]/20'
                      : 'bg-zinc-700/40 text-zinc-600'
                  )}
                  onClick={sendMessage}
                  disabled={!input.trim() || isStreaming}
                >
                  <ArrowUp className="w-4 h-4" strokeWidth={2.5} />
                </button>
              </div>
            </div>
          </div>

          <p className="text-center text-[10px] text-zinc-700 mt-2">
            Claude kann Fehler machen. Ausgabe bitte pruefen.
          </p>
        </div>
      </div>
    </div>
  )
}
