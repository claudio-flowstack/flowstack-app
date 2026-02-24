import { useState, useRef, useEffect } from 'react'
import { aiChat, AI_MODELS, isPuterAvailable } from '@/core/ai/puter-ai'
import type { AIModel } from '@/core/ai/puter-ai'
import { MessageCircle, Send, Loader2, X, Cpu, Trash2 } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
  model?: string
  timestamp: Date
}

const QUICK_PROMPTS = [
  'Erstelle 5 Hook-Ideen fuer Instagram Reels zum Thema Agentur-Skalierung',
  'Schreibe ein YouTube-Skript (AIDA-Framework) zum Thema Lead-Generierung',
  'Analysiere die Top-Trends im Social Media Marketing 2026',
  'Erstelle einen LinkedIn-Post ueber KI im Marketing',
  'Gib mir 10 Content-Ideen fuer eine Marketing-Agentur',
]

const SYSTEM_CONTEXT = `Du bist ein KI-Marketing-Assistent in der Flowstack Platform. Du hilfst bei:
- Content-Erstellung (Social Media, YouTube, LinkedIn, TikTok)
- Marketing-Strategie und Frameworks (AIDA, PAS, Hook-Story-Offer)
- Lead-Generierung und Vertrieb
- Social Media Marketing und Trends
- Copywriting und Skript-Entwicklung

Antworte immer auf Deutsch, praxisnah und actionable. Nutze Struktur (Aufzaehlungen, Ueberschriften).
Halte Antworten kompakt aber wertvoll.`

export function AIChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [model, setModel] = useState<AIModel>('gpt-4o')
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (text?: string) => {
    const msg = text || input.trim()
    if (!msg || loading) return
    if (!isPuterAvailable()) {
      setError('Puter.js nicht geladen.')
      return
    }

    setInput('')
    setError(null)

    const userMessage: Message = { role: 'user', content: msg, timestamp: new Date() }
    setMessages((prev) => [...prev, userMessage])
    setLoading(true)

    try {
      // Build conversation context
      const conversationHistory = messages.slice(-10).map((m) =>
        `${m.role === 'user' ? 'Benutzer' : 'Assistent'}: ${m.content}`
      ).join('\n\n')

      const prompt = `${SYSTEM_CONTEXT}\n\n${conversationHistory ? `Bisheriger Verlauf:\n${conversationHistory}\n\n` : ''}Benutzer: ${msg}\n\nAssistent:`

      const result = await aiChat(prompt, model)

      const assistantMessage: Message = {
        role: 'assistant',
        content: result,
        model,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, assistantMessage])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'AI-Fehler')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-220px)] min-h-[500px]">
      {/* Model selector */}
      <div className="flex items-center gap-2 p-3 border-b border-border bg-muted/20 rounded-t-xl">
        <Cpu className="h-4 w-4 text-primary shrink-0" />
        <select
          value={model}
          onChange={(e) => setModel(e.target.value as AIModel)}
          className="h-7 rounded border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring/30"
        >
          {AI_MODELS.map((m) => (
            <option key={m.value} value={m.value}>{m.label} ({m.provider})</option>
          ))}
        </select>
        <span className="text-[10px] text-emerald-500 font-medium">Kostenlos</span>
        {messages.length > 0 && (
          <button
            onClick={() => setMessages([])}
            className="ml-auto p-1 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            title="Chat leeren"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center py-8">
            <MessageCircle className="h-10 w-10 text-muted-foreground mb-3" />
            <h3 className="text-base font-semibold text-foreground">AI Marketing-Assistent</h3>
            <p className="text-sm text-muted-foreground mt-1 text-center max-w-md">
              Frag mich alles zu Content, Marketing, Leads, Copywriting oder Social Media.
            </p>

            {/* Quick prompts */}
            <div className="mt-6 space-y-2 w-full max-w-lg">
              <span className="text-xs text-muted-foreground">Schnellstart:</span>
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => sendMessage(prompt)}
                  className="block w-full text-left rounded-lg border border-border bg-card p-2.5 text-xs text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-xl px-4 py-2.5 ${
              msg.role === 'user'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-foreground'
            }`}>
              <div className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</div>
              <div className={`text-[10px] mt-1 ${
                msg.role === 'user' ? 'text-primary-foreground/60' : 'text-muted-foreground'
              }`}>
                {msg.timestamp.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                {msg.model && ` · ${msg.model}`}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-xl px-4 py-2.5">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            </div>
          </div>
        )}

        {error && (
          <div className="flex justify-center">
            <div className="rounded-lg border border-red-500/30 bg-red-500/5 px-3 py-2 text-xs text-red-500 flex items-center gap-2">
              <X className="h-3 w-3" /> {error}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border p-3 bg-muted/20 rounded-b-xl">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Nachricht eingeben... (Enter zum Senden)"
            rows={1}
            className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring transition-colors resize-none"
            style={{ minHeight: '38px', maxHeight: '120px' }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement
              target.style.height = '38px'
              target.style.height = `${Math.min(target.scrollHeight, 120)}px`
            }}
          />
          <button
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
            className="h-[38px] w-[38px] shrink-0 rounded-lg bg-primary flex items-center justify-center text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  )
}
