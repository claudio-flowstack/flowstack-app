import { useState, useRef } from 'react'
import { cn } from '@/shared/lib/utils'
import { X, Code2, Play, PlusCircle, ChevronDown, HelpCircle } from 'lucide-react'

interface ExpressionEditorProps {
  open: boolean
  onClose: () => void
}

const AVAILABLE_VARIABLES = [
  { name: 'apiKey', source: 'global', example: 'sk-abc123' },
  { name: 'retryCount', source: 'global', example: '3' },
  { name: 'outputFormat', source: 'global', example: 'json' },
  { name: 'debug', source: 'global', example: 'true' },
  { name: 'trigger.data', source: 'node', example: '{"email":"max@example.com"}' },
  { name: 'trigger.timestamp', source: 'node', example: '2026-02-19T14:00:00Z' },
  { name: 'aiGenerate.output', source: 'node', example: 'Klassifizierung: A' },
  { name: 'filter.result', source: 'node', example: '[1,2,3]' },
]

const SYNTAX_EXAMPLES = [
  { syntax: '{{variable}}', desc: 'Globale Variable' },
  { syntax: '{{node.output}}', desc: 'Node-Output referenzieren' },
  { syntax: '{{node.output.field}}', desc: 'Verschachteltes Feld' },
  { syntax: '{{$json.key}}', desc: 'JSON-Zugriff' },
  { syntax: '{{$item.index}}', desc: 'Aktueller Item-Index' },
]

export function ExpressionEditor({ open, onClose }: ExpressionEditorProps) {
  const [expression, setExpression] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [testResult, setTestResult] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  if (!open) return null

  function handleInsertVariable(varName: string) {
    const insertion = `{{${varName}}}`
    const textarea = textareaRef.current
    if (textarea) {
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const before = expression.slice(0, start)
      const after = expression.slice(end)
      setExpression(before + insertion + after)
    } else {
      setExpression((prev) => prev + insertion)
    }
    setShowDropdown(false)
  }

  function handleTest() {
    let result = expression
    for (const v of AVAILABLE_VARIABLES) {
      result = result.replaceAll(`{{${v.name}}}`, v.example)
    }
    setTestResult(`Ergebnis: ${result}`)
  }

  function handleInsert() {
    onClose()
  }

  return (
    <div className="absolute right-0 top-0 z-40 w-72 h-full bg-card border-l border-border shadow-2xl flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3 shrink-0">
        <span className="flex items-center gap-2 text-xs font-bold text-foreground">
          <Code2 className="h-3.5 w-3.5" />
          Ausdrucks-Editor
        </span>
        <button
          onClick={onClose}
          className="rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Expression textarea */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            Ausdruck
          </label>
          <textarea
            ref={textareaRef}
            value={expression}
            onChange={(e) => {
              setExpression(e.target.value)
              setTestResult(null)
            }}
            placeholder="{{trigger.data.email}}"
            rows={5}
            className={cn(
              'w-full rounded-md border border-border bg-muted/50 p-2.5 text-xs font-mono text-foreground',
              'placeholder:text-muted-foreground/50 outline-none resize-none',
              'focus:border-purple-400 focus:ring-1 focus:ring-purple-400/30',
            )}
          />
        </div>

        {/* Variable autocomplete */}
        <div className="space-y-1.5 relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className={cn(
              'w-full flex items-center justify-between rounded-md border border-border px-2.5 py-1.5 text-[11px]',
              'bg-muted/50 text-muted-foreground hover:text-foreground transition-colors',
            )}
          >
            <span>Variable einfügen</span>
            <ChevronDown className={cn('h-3 w-3 transition-transform', showDropdown && 'rotate-180')} />
          </button>

          {showDropdown && (
            <div className="absolute left-0 right-0 top-full mt-1 rounded-md border border-border bg-popover shadow-lg z-50 max-h-40 overflow-y-auto">
              {AVAILABLE_VARIABLES.map((v) => (
                <button
                  key={v.name}
                  onClick={() => handleInsertVariable(v.name)}
                  className="w-full text-left px-3 py-1.5 text-[11px] font-mono hover:bg-muted transition-colors flex items-center justify-between"
                >
                  <span className="text-foreground">{v.name}</span>
                  <span className={cn(
                    'text-[9px] px-1 py-0.5 rounded',
                    v.source === 'global'
                      ? 'bg-blue-100 dark:bg-blue-500/15 text-blue-500'
                      : 'bg-purple-100 dark:bg-purple-500/15 text-purple-500',
                  )}>
                    {v.source}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Test result */}
        {testResult && (
          <div className="rounded-md border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 p-2.5">
            <p className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400">
              {testResult}
            </p>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleTest}
            disabled={!expression.trim()}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-[10px] font-medium transition-colors',
              expression.trim()
                ? 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-500/25'
                : 'bg-muted text-muted-foreground cursor-not-allowed',
            )}
          >
            <Play className="h-3 w-3" />
            Testen
          </button>
          <button
            onClick={handleInsert}
            disabled={!expression.trim()}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-[10px] font-medium transition-colors',
              expression.trim()
                ? 'bg-purple-100 dark:bg-purple-500/15 text-purple-600 dark:text-purple-400 hover:bg-purple-200 dark:hover:bg-purple-500/25'
                : 'bg-muted text-muted-foreground cursor-not-allowed',
            )}
          >
            <PlusCircle className="h-3 w-3" />
            Einfügen
          </button>
        </div>

        {/* Syntax help */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <HelpCircle className="h-3 w-3 text-muted-foreground" />
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Syntax
            </span>
          </div>
          <div className="space-y-1">
            {SYNTAX_EXAMPLES.map((ex) => (
              <div
                key={ex.syntax}
                className="flex items-center justify-between rounded-md bg-muted/50 px-2.5 py-1.5"
              >
                <code className="text-[10px] font-mono text-purple-600 dark:text-purple-400">
                  {ex.syntax}
                </code>
                <span className="text-[9px] text-muted-foreground">{ex.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
