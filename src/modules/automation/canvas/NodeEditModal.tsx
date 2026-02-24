import { useState, useRef, useEffect } from 'react'
import { Zap, X, Link2, Plus, Trash2, ChevronDown, ChevronRight } from 'lucide-react'
import type { SystemNode, NodeType, SubNode, SubNodeType, ResourceType, DemoArtifact, ArtifactType } from '../domain/types'
import { cn } from '@/shared/lib/utils'
import { getNodeIcon, getAllIconEntries } from './icons'
import { renderNodeIcon, TOOL_LOGOS } from './ToolLogos'

// ── Constants ────────────────────────────────────────────────────────────────

const RESOURCE_TYPES: { value: ResourceType | ''; label: string }[] = [
  { value: '', label: 'Keine' },
  { value: 'form', label: 'Formular' },
  { value: 'page', label: 'Seite' },
  { value: 'transcript', label: 'Transkript' },
  { value: 'document', label: 'Dokument' },
  { value: 'note', label: 'Notiz' },
  { value: 'dataset', label: 'Datensatz' },
]

const LINKABLE_PAGES: { value: string; label: string }[] = [
  { value: '', label: 'Keine' },
  { value: '/onboarding', label: 'Onboarding-Formular' },
  { value: '/kostenlose-beratung', label: 'Erstgespräch-Formular' },
  { value: '/dashboard', label: 'Marketing-Dashboard' },
  { value: '/systems', label: 'System-Übersicht' },
]

const TYPE_COLORS: Record<NodeType, { accent: string; label: string }> = {
  trigger:          { accent: '#3b82f6', label: 'Trigger' },
  process:          { accent: '#8b5cf6', label: 'Prozess' },
  ai:               { accent: '#d946ef', label: 'KI' },
  output:           { accent: '#10b981', label: 'Output' },
  subsystem:        { accent: '#6366f1', label: 'Sub-System' },
  ifelse:           { accent: '#f59e0b', label: 'Wenn/Dann' },
  merge:            { accent: '#14b8a6', label: 'Merge' },
  wait:             { accent: '#6b7280', label: 'Warten' },
  iterator:         { accent: '#a855f7', label: 'Iterator' },
  router:           { accent: '#ec4899', label: 'Router' },
  'error-handler':  { accent: '#ef4444', label: 'Error Handler' },
  approval:         { accent: '#f59e0b', label: 'Freigabe' },
  agent:            { accent: '#7c3aed', label: 'KI-Agent' },
  fork:             { accent: '#0ea5e9', label: 'Fork' },
  join:             { accent: '#0ea5e9', label: 'Join' },
  'condition-agent':{ accent: '#a855f7', label: 'KI-Bedingung' },
}

const NODE_TYPES: NodeType[] = ['trigger', 'process', 'ai', 'output', 'subsystem', 'ifelse', 'merge', 'wait', 'iterator', 'router', 'error-handler', 'approval', 'agent', 'fork', 'join', 'condition-agent']

const SUB_NODE_TYPES: { type: SubNodeType; label: string; icon: string }[] = [
  { type: 'tool', label: 'Werkzeug', icon: 'wrench' },
  { type: 'memory', label: 'Speicher', icon: 'database' },
  { type: 'knowledge', label: 'Wissen', icon: 'book-open' },
  { type: 'outputFormat', label: 'Ausgabeformat', icon: 'file-text' },
]

const ARTIFACT_TYPES: { value: ArtifactType; label: string }[] = [
  { value: 'url', label: 'Link / URL' },
  { value: 'file', label: 'Datei' },
  { value: 'text', label: 'Text' },
  { value: 'website', label: 'Webseite' },
  { value: 'image', label: 'Bild' },
]

const ALL_ICONS = getAllIconEntries()
const TOOL_LOGO_KEYS = Object.keys(TOOL_LOGOS)

// ── Props ────────────────────────────────────────────────────────────────────

interface NodeEditModalProps {
  node: SystemNode
  onSave: (updates: Partial<SystemNode>) => void
  onClose: () => void
  descVisible?: boolean
  onToggleDesc?: (nodeId: string) => void
}

// ── Component ────────────────────────────────────────────────────────────────

export function NodeEditModal({ node, onSave, onClose, descVisible, onToggleDesc }: NodeEditModalProps) {
  const [label, setLabel] = useState(node.label)
  const [description, setDescription] = useState(node.description)
  const [type, setType] = useState<NodeType>(node.type)
  const [icon, setIcon] = useState(node.icon)
  const [subNodes, setSubNodes] = useState<SubNode[]>(node.subNodes ?? [])
  const [iconSearch, setIconSearch] = useState('')
  const [linkedResourceType, setLinkedResourceType] = useState<ResourceType | ''>(node.linkedResourceType ?? '')
  const [linkedResourceId, setLinkedResourceId] = useState(node.linkedResourceId ?? '')
  const [linkedPage, setLinkedPage] = useState(node.linkedPage ?? '')

  // Demo config state
  const [demoExpanded, setDemoExpanded] = useState((node.demoConfig?.artifacts?.length ?? 0) > 0)
  const [demoDelay, setDemoDelay] = useState(node.demoConfig?.delay ?? 2000)
  const [demoArtifacts, setDemoArtifacts] = useState<DemoArtifact[]>(node.demoConfig?.artifacts ?? [])

  const labelRef = useRef<HTMLInputElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    labelRef.current?.focus()
    labelRef.current?.select()
  }, [])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === overlayRef.current) onClose()
  }

  function handleSave() {
    const trimmedLabel = label.trim()
    if (!trimmedLabel) return

    // Build demoConfig — only include if there are artifacts or a custom delay
    const hasArtifacts = demoArtifacts.some((a) => a.url.trim())
    const validArtifacts = demoArtifacts.filter((a) => a.url.trim())
    const demoConfig =
      hasArtifacts || demoDelay !== 2000
        ? { delay: demoDelay, artifacts: validArtifacts.length > 0 ? validArtifacts : undefined }
        : undefined

    onSave({
      label: trimmedLabel,
      description: description.trim(),
      type,
      icon,
      subNodes: type === 'ai' ? subNodes : undefined,
      linkedResourceType: linkedResourceType || undefined,
      linkedResourceId: linkedResourceId.trim() || undefined,
      linkedPage: linkedPage || undefined,
      demoConfig,
    })
  }

  function handleKeyDownSave(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleSave()
    }
  }

  function addSubNode(subType: SubNodeType) {
    const entry = SUB_NODE_TYPES.find((s) => s.type === subType)
    if (!entry) return
    setSubNodes((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        type: subType,
        label: entry.label,
        icon: entry.icon,
        x: 0,
        y: 0,
      },
    ])
  }

  function removeSubNode(id: string) {
    setSubNodes((prev) => prev.filter((s) => s.id !== id))
  }

  const currentTypeColor = TYPE_COLORS[type]
  const isLogoIcon = icon.startsWith('logo-')
  const iq = iconSearch.toLowerCase().trim()

  // Filtered icons
  const filteredIcons = iq
    ? ALL_ICONS.filter(([key]) => key.includes(iq))
    : ALL_ICONS

  const filteredLogos = iq
    ? TOOL_LOGO_KEYS.filter((k) => k.includes(iq))
    : TOOL_LOGO_KEYS

  // Icon preview
  const PreviewIcon = getNodeIcon(icon)
  const iconPreview = isLogoIcon
    ? renderNodeIcon(icon, undefined, <Zap size={18} className="text-foreground" />, 18)
    : PreviewIcon
      ? <PreviewIcon size={18} className="text-foreground" />
      : <Zap size={18} className="text-foreground" />

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={handleOverlayClick}
      onKeyDown={handleKeyDownSave}
    >
      <div className="relative flex w-full max-w-md flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
        {/* Header */}
        <div className="flex items-stretch gap-0">
          <div
            className="w-1.5 shrink-0 rounded-tl-2xl"
            style={{ backgroundColor: currentTypeColor.accent }}
          />
          <div className="flex flex-1 items-center justify-between px-5 py-4">
            <h2 className="text-base font-semibold text-foreground">
              Node bearbeiten
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex max-h-[70vh] flex-col gap-5 overflow-y-auto px-5 pb-2">
          {/* Label */}
          <fieldset className="flex flex-col gap-1.5">
            <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Label
            </label>
            <input
              ref={labelRef}
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value.slice(0, 40))}
              maxLength={40}
              placeholder="Node-Name..."
              className="rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <span className="text-right text-[11px] text-muted-foreground/60">
              {label.length}/40
            </span>
          </fieldset>

          {/* Description */}
          <fieldset className="flex flex-col gap-1.5">
            <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Beschreibung
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 120))}
              maxLength={120}
              rows={2}
              placeholder="Kurze Beschreibung..."
              className="resize-none rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <span className="text-right text-[11px] text-muted-foreground/60">
              {description.length}/120
            </span>
          </fieldset>

          {/* Type */}
          <fieldset className="flex flex-col gap-2">
            <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Typ
            </label>
            <div className="grid grid-cols-5 gap-1.5">
              {NODE_TYPES.map((nt) => {
                const tc = TYPE_COLORS[nt]
                const sel = type === nt
                return (
                  <button
                    key={nt}
                    type="button"
                    onClick={() => setType(nt)}
                    className={cn(
                      'flex flex-col items-center gap-1 rounded-xl border px-1.5 py-2 text-[10px] font-medium transition-all',
                      sel
                        ? 'border-transparent text-white shadow-md'
                        : 'border-border bg-muted/50 text-muted-foreground hover:bg-muted',
                    )}
                    style={sel ? { backgroundColor: tc.accent } : undefined}
                  >
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: sel ? '#fff' : tc.accent }}
                    />
                    {tc.label}
                  </button>
                )
              })}
            </div>
          </fieldset>

          {/* Icon */}
          <fieldset className="flex flex-col gap-2">
            <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Icon
            </label>

            {/* Current preview */}
            <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2">
              {iconPreview}
              <span className="text-xs text-muted-foreground">{icon}</span>
            </div>

            {/* Search */}
            <input
              type="text"
              value={iconSearch}
              onChange={(e) => setIconSearch(e.target.value)}
              placeholder="Icon suchen..."
              className="rounded-lg border border-border bg-muted/50 px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-ring"
            />

            {/* Lucide icons */}
            <div className="max-h-36 overflow-y-auto rounded-lg border border-border bg-muted/20 p-2">
              <div className="grid grid-cols-8 gap-1">
                {filteredIcons.map(([key, IconComp]) => {
                  const sel = icon === key && !isLogoIcon
                  return (
                    <button
                      key={key}
                      type="button"
                      title={key}
                      onClick={() => setIcon(key)}
                      className={cn(
                        'flex items-center justify-center rounded-lg p-1.5 transition-all',
                        sel
                          ? 'bg-foreground text-background shadow-sm'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                      )}
                    >
                      <IconComp size={14} />
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Tool logos */}
            {filteredLogos.length > 0 && (
              <div className="mt-1 flex flex-col gap-1.5">
                <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  Tools
                </span>
                <div className="max-h-28 overflow-y-auto rounded-lg border border-border bg-muted/20 p-2">
                  <div className="flex flex-wrap gap-1.5">
                    {filteredLogos.map((key) => {
                      const sel = icon === key
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setIcon(key)}
                          className={cn(
                            'inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-all',
                            sel
                              ? 'bg-foreground text-background shadow-sm'
                              : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground',
                          )}
                        >
                          <span className="scale-[0.6]">
                            {renderNodeIcon(key, undefined, null, 16)}
                          </span>
                          {key.replace('logo-', '')}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}
          </fieldset>

          {/* Sub-Nodes (only for AI nodes) */}
          {type === 'ai' && (
            <fieldset className="flex flex-col gap-2">
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Sub-Nodes
              </label>

              {subNodes.length > 0 && (
                <div className="space-y-1">
                  {subNodes.map((sub) => {
                    const SubIcon = getNodeIcon(sub.icon)
                    return (
                      <div
                        key={sub.id}
                        className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-1.5"
                      >
                        {SubIcon && <SubIcon size={14} className="text-purple-500 shrink-0" />}
                        <span className="text-xs text-foreground flex-1">{sub.label}</span>
                        <span className="text-[10px] text-muted-foreground">{sub.type}</span>
                        <button
                          type="button"
                          onClick={() => removeSubNode(sub.id)}
                          className="text-muted-foreground hover:text-red-500 transition-colors"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}

              <div className="flex flex-wrap gap-1.5">
                {SUB_NODE_TYPES.map(({ type: st, label: sl }) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => addSubNode(st)}
                    className="inline-flex items-center gap-1 rounded-md border border-dashed border-purple-300 dark:border-purple-600 px-2 py-1 text-[11px] font-medium text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-500/10 transition-colors"
                  >
                    + {sl}
                  </button>
                ))}
              </div>
            </fieldset>
          )}

          {/* Resource Linking */}
          <fieldset className="flex flex-col gap-2">
            <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Verknüpfte Ressource
            </label>
            <div className="flex gap-2">
              <select
                value={linkedResourceType}
                onChange={(e) => setLinkedResourceType(e.target.value as ResourceType | '')}
                className="flex-1 rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {RESOURCE_TYPES.map(({ value, label: lbl }) => (
                  <option key={value} value={value}>{lbl}</option>
                ))}
              </select>
              {linkedResourceType && (
                <input
                  type="text"
                  value={linkedResourceId}
                  onChange={(e) => setLinkedResourceId(e.target.value)}
                  placeholder="Ressource-ID..."
                  className="flex-1 rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring"
                />
              )}
            </div>
          </fieldset>

          {/* Page Linking */}
          <fieldset className="flex flex-col gap-2">
            <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Verknüpfte Seite
            </label>
            <select
              value={linkedPage}
              onChange={(e) => setLinkedPage(e.target.value)}
              className="rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {LINKABLE_PAGES.map(({ value, label: lbl }) => (
                <option key={value} value={value}>{lbl}</option>
              ))}
            </select>
          </fieldset>

          {/* ── Demo Output Config ─────────────────────────────────────── */}
          <fieldset className="flex flex-col gap-2 border-t border-border pt-4">
            <button
              type="button"
              onClick={() => setDemoExpanded(!demoExpanded)}
              className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
            >
              {demoExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              <Link2 size={12} />
              Demo-Ausgabe
              {demoArtifacts.length > 0 && (
                <span className="ml-auto text-[10px] font-normal text-purple-500">
                  {demoArtifacts.length} {demoArtifacts.length !== 1 ? 'Links' : 'Link'}
                </span>
              )}
            </button>

            {demoExpanded && (
              <div className="flex flex-col gap-3 mt-1">
                {/* Delay */}
                <div className="flex items-center gap-3">
                  <label className="text-[11px] text-muted-foreground whitespace-nowrap">Verzögerung (ms)</label>
                  <input
                    type="number"
                    value={demoDelay}
                    onChange={(e) => setDemoDelay(Math.max(500, Math.min(30000, Number(e.target.value) || 2000)))}
                    step={500}
                    min={500}
                    max={30000}
                    className="w-24 rounded-lg border border-border bg-muted/50 px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                  <span className="text-[10px] text-muted-foreground">{(demoDelay / 1000).toFixed(1)}s</span>
                </div>

                {/* Artifacts */}
                {demoArtifacts.map((artifact, idx) => (
                  <div key={idx} className="flex flex-col gap-1.5 rounded-lg border border-border bg-muted/20 p-2.5">
                    <div className="flex items-center gap-2">
                      <select
                        value={artifact.type}
                        onChange={(e) => {
                          const next = [...demoArtifacts]
                          next[idx] = { ...artifact, type: e.target.value as ArtifactType }
                          setDemoArtifacts(next)
                        }}
                        className="rounded-md border border-border bg-muted/50 px-2 py-1 text-[11px] text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                      >
                        {ARTIFACT_TYPES.map(({ value, label: l }) => (
                          <option key={value} value={value}>{l}</option>
                        ))}
                      </select>
                      <input
                        type="text"
                        value={artifact.label}
                        onChange={(e) => {
                          const next = [...demoArtifacts]
                          next[idx] = { ...artifact, label: e.target.value }
                          setDemoArtifacts(next)
                        }}
                        placeholder="Label..."
                        className="flex-1 rounded-md border border-border bg-muted/50 px-2 py-1 text-[11px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-ring"
                      />
                      <button
                        type="button"
                        onClick={() => setDemoArtifacts((prev) => prev.filter((_, i) => i !== idx))}
                        className="text-muted-foreground hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                    <input
                      type="url"
                      value={artifact.url}
                      onChange={(e) => {
                        const next = [...demoArtifacts]
                        next[idx] = { ...artifact, url: e.target.value }
                        setDemoArtifacts(next)
                      }}
                      placeholder="https://docs.google.com/..."
                      className="rounded-md border border-border bg-muted/50 px-2 py-1 text-[11px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                    <input
                      type="text"
                      value={artifact.contentPreview ?? ''}
                      onChange={(e) => {
                        const next = [...demoArtifacts]
                        next[idx] = { ...artifact, contentPreview: e.target.value || undefined }
                        setDemoArtifacts(next)
                      }}
                      placeholder="Vorschau-Text (optional)..."
                      className="rounded-md border border-border bg-muted/50 px-2 py-1 text-[11px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                  </div>
                ))}

                {/* Add artifact button */}
                <button
                  type="button"
                  onClick={() =>
                    setDemoArtifacts((prev) => [
                      ...prev,
                      { type: 'url', label: '', url: '', contentPreview: undefined },
                    ])
                  }
                  className="inline-flex items-center gap-1.5 self-start rounded-md border border-dashed border-purple-300 dark:border-purple-600 px-2.5 py-1.5 text-[11px] font-medium text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-500/10 transition-colors"
                >
                  <Plus size={12} />
                  Link hinzufügen
                </button>
              </div>
            )}
          </fieldset>

          {/* Description Visibility Toggle */}
          {onToggleDesc && (
            <fieldset className="flex items-center gap-3">
              <button
                type="button"
                role="switch"
                aria-checked={descVisible ?? false}
                onClick={() => onToggleDesc(node.id)}
                className={cn(
                  'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-200',
                  descVisible ? 'bg-purple-500' : 'bg-gray-300 dark:bg-gray-600',
                )}
              >
                <span
                  className={cn(
                    'pointer-events-none inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transform transition-transform duration-200 mt-[3px]',
                    descVisible ? 'translate-x-[18px]' : 'translate-x-[3px]',
                  )}
                />
              </button>
              <span className="text-xs text-muted-foreground">
                Beschreibung auf Canvas anzeigen
              </span>
            </fieldset>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            Abbrechen
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!label.trim()}
            className={cn(
              'rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all',
              label.trim()
                ? 'hover:brightness-110'
                : 'cursor-not-allowed opacity-50',
            )}
            style={{ backgroundColor: currentTypeColor.accent }}
          >
            Speichern
          </button>
        </div>
      </div>
    </div>
  )
}
