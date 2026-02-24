import { useState } from 'react'
import { cn } from '@/shared/lib/utils'
import { X, Variable, Plus, Trash2, Check } from 'lucide-react'

interface VariablesPanelProps {
  open: boolean
  onClose: () => void
}

type VarType = 'string' | 'number' | 'boolean'

interface WorkflowVariable {
  id: string
  name: string
  value: string
  type: VarType
}

const INITIAL_VARIABLES: WorkflowVariable[] = [
  { id: 'var-1', name: 'apiKey', value: 'sk-xxxx...xxxx', type: 'string' },
  { id: 'var-2', name: 'retryCount', value: '3', type: 'number' },
  { id: 'var-3', name: 'outputFormat', value: 'json', type: 'string' },
  { id: 'var-4', name: 'debug', value: 'false', type: 'boolean' },
]

const TYPE_BADGE: Record<VarType, { label: string; color: string }> = {
  string: { label: 'Str', color: 'bg-blue-100 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400' },
  number: { label: 'Num', color: 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' },
  boolean: { label: 'Bool', color: 'bg-pink-100 dark:bg-pink-500/15 text-pink-600 dark:text-pink-400' },
}

export function VariablesPanel({ open, onClose }: VariablesPanelProps) {
  const [variables, setVariables] = useState<WorkflowVariable[]>(INITIAL_VARIABLES)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editValue, setEditValue] = useState('')
  const [editType, setEditType] = useState<VarType>('string')

  if (!open) return null

  function startEdit(v: WorkflowVariable) {
    setEditingId(v.id)
    setEditName(v.name)
    setEditValue(v.value)
    setEditType(v.type)
  }

  function saveEdit() {
    if (!editingId) return
    setVariables((prev) =>
      prev.map((v) =>
        v.id === editingId
          ? { ...v, name: editName, value: editValue, type: editType }
          : v,
      ),
    )
    setEditingId(null)
  }

  function handleDelete(id: string) {
    setVariables((prev) => prev.filter((v) => v.id !== id))
    if (editingId === id) setEditingId(null)
  }

  function handleAdd() {
    const newVar: WorkflowVariable = {
      id: `var-${Date.now()}`,
      name: 'newVariable',
      value: '',
      type: 'string',
    }
    setVariables((prev) => [...prev, newVar])
    startEdit(newVar)
  }

  return (
    <div className="absolute right-0 top-0 z-40 w-72 h-full bg-card border-l border-border shadow-2xl flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3 shrink-0">
        <span className="flex items-center gap-2 text-xs font-bold text-foreground">
          <Variable className="h-3.5 w-3.5" />
          Globale Variablen
        </span>
        <button
          onClick={onClose}
          className="rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Add button */}
      <div className="px-4 py-2 border-b border-border shrink-0">
        <button
          onClick={handleAdd}
          className={cn(
            'w-full flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-[10px] font-medium transition-colors',
            'bg-purple-100 dark:bg-purple-500/15 text-purple-600 dark:text-purple-400',
            'hover:bg-purple-200 dark:hover:bg-purple-500/25',
          )}
        >
          <Plus className="h-3 w-3" />
          Variable hinzufügen
        </button>
      </div>

      {/* Table header */}
      <div className="grid grid-cols-[1fr_1fr_40px_28px] gap-1 px-4 py-1.5 border-b border-border text-[9px] font-semibold text-muted-foreground uppercase tracking-wider shrink-0">
        <span>Name</span>
        <span>Wert</span>
        <span>Typ</span>
        <span />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {variables.map((v) => {
          const isEditing = editingId === v.id
          const badge = TYPE_BADGE[v.type]

          return (
            <div
              key={v.id}
              className={cn(
                'grid grid-cols-[1fr_1fr_40px_28px] gap-1 items-center px-4 py-2 border-b border-border',
                'hover:bg-muted/30 transition-colors',
              )}
            >
              {isEditing ? (
                <>
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="text-[11px] bg-muted rounded px-1.5 py-1 text-foreground outline-none border border-border focus:border-purple-400 font-mono"
                    autoFocus
                  />
                  <input
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="text-[11px] bg-muted rounded px-1.5 py-1 text-foreground outline-none border border-border focus:border-purple-400 font-mono"
                  />
                  <select
                    value={editType}
                    onChange={(e) => setEditType(e.target.value as VarType)}
                    className="text-[9px] bg-muted rounded px-0.5 py-1 text-foreground outline-none border border-border"
                  >
                    <option value="string">Str</option>
                    <option value="number">Num</option>
                    <option value="boolean">Bool</option>
                  </select>
                  <button
                    onClick={saveEdit}
                    className="rounded p-1 text-emerald-500 hover:bg-emerald-100 dark:hover:bg-emerald-500/15 transition-colors"
                    title="Speichern"
                  >
                    <Check className="h-3 w-3" />
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => startEdit(v)}
                    className="text-[11px] font-mono text-foreground text-left truncate hover:text-purple-500 transition-colors"
                  >
                    {v.name}
                  </button>
                  <button
                    onClick={() => startEdit(v)}
                    className="text-[11px] font-mono text-muted-foreground text-left truncate hover:text-foreground transition-colors"
                  >
                    {v.value}
                  </button>
                  <span className={cn('text-[9px] font-medium rounded px-1 py-0.5 text-center', badge.color)}>
                    {badge.label}
                  </span>
                  <button
                    onClick={() => handleDelete(v.id)}
                    className="rounded p-1 text-muted-foreground hover:text-red-500 hover:bg-red-100 dark:hover:bg-red-500/15 transition-colors"
                    title="Löschen"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
