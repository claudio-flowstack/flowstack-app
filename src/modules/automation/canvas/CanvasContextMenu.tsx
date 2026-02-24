import { useEffect, useRef, useState } from 'react'
import { cn } from '@/shared/lib/utils'
import {
  Pencil,
  Copy,
  Trash2,
  Plus,
  LayoutDashboard,
  StickyNote,
  Play,
  Pin,
  Search,
  Palette,
  Type,
  Link2,
  X,
  Clipboard,
  LayoutGrid,
  Settings,
  Command,
} from 'lucide-react'

interface CanvasContextMenuProps {
  x: number
  y: number
  nodeId?: string
  groupId?: string
  connIdx?: number
  stickyId?: string
  canvasPos?: { x: number; y: number }
  hasClipboard: boolean
  readOnly: boolean
  onClose: () => void
  // Node actions
  onEditNode: (id: string) => void
  onDuplicateNode: (id: string) => void
  onDeleteNode: (id: string) => void
  onExecuteNode?: (id: string) => void
  onPinNode?: (id: string) => void
  onInspectNode?: (id: string) => void
  onColorNode?: (id: string, color: string | null) => void
  onCopyNode?: (id: string) => void
  // Group actions
  onEditGroup: (id: string) => void
  onDeleteGroup: (id: string) => void
  // Connection actions
  onInsertNode: (idx: number) => void
  onDeleteConnection: (idx: number) => void
  onEditConnLabel?: (idx: number) => void
  // Sticky actions
  onEditSticky: (id: string) => void
  onDeleteSticky: (id: string) => void
  onConnectSticky?: (id: string) => void
  onRemoveStickyConns?: (id: string) => void
  // Canvas actions
  onAddNode: (type: string, pos: { x: number; y: number }) => void
  onAddGroup: (pos: { x: number; y: number }) => void
  onAddSticky: (pos: { x: number; y: number }) => void
  onPaste?: () => void
  onAutoLayout?: () => void
  onOpenSettings?: () => void
  onOpenPalette?: () => void
}

const NODE_COLORS = [
  { name: 'Blau', value: '#3b82f6' },
  { name: 'Lila', value: '#8b5cf6' },
  { name: 'Magenta', value: '#d946ef' },
  { name: 'Grün', value: '#10b981' },
  { name: 'Bernstein', value: '#f59e0b' },
  { name: 'Rot', value: '#ef4444' },
  { name: 'Rosa', value: '#ec4899' },
  { name: 'Indigo', value: '#6366f1' },
] as const

interface MenuItem {
  label: string
  icon: React.ComponentType<{ className?: string }>
  onClick?: () => void
  variant?: 'default' | 'danger' | 'green' | 'blue' | 'purple' | 'orange'
  disabled?: boolean
}

interface SeparatorItem {
  separator: true
}

interface ColorPickerItem {
  colorPicker: true
  nodeId: string
}

type MenuEntry = MenuItem | SeparatorItem | ColorPickerItem

function isSeparator(entry: MenuEntry): entry is SeparatorItem {
  return 'separator' in entry
}

function isColorPicker(entry: MenuEntry): entry is ColorPickerItem {
  return 'colorPicker' in entry
}

function getMenuType(props: CanvasContextMenuProps): 'node' | 'group' | 'connection' | 'sticky' | 'canvas' {
  if (props.nodeId) return 'node'
  if (props.groupId) return 'group'
  if (props.connIdx !== undefined) return 'connection'
  if (props.stickyId) return 'sticky'
  return 'canvas'
}

function buildMenuEntries(props: CanvasContextMenuProps): MenuEntry[] {
  const type = getMenuType(props)

  switch (type) {
    case 'node': {
      const id = props.nodeId!
      const entries: MenuEntry[] = []

      if (props.onExecuteNode) {
        entries.push({
          label: 'Diesen Node ausführen',
          icon: Play,
          onClick: () => props.onExecuteNode!(id),
          variant: 'green',
        })
      }

      if (props.onPinNode) {
        entries.push({
          label: 'Daten anheften/lösen',
          icon: Pin,
          onClick: () => props.onPinNode!(id),
          variant: 'blue',
        })
      }

      if (props.onInspectNode) {
        entries.push({
          label: 'Daten untersuchen',
          icon: Search,
          onClick: () => props.onInspectNode!(id),
          variant: 'purple',
        })
      }

      if (entries.length > 0) {
        entries.push({ separator: true })
      }

      entries.push(
        { label: 'Bearbeiten', icon: Pencil, onClick: () => props.onEditNode(id) },
        { label: 'Duplizieren', icon: Copy, onClick: () => props.onDuplicateNode(id) },
      )

      if (props.onCopyNode) {
        entries.push({
          label: 'Kopieren',
          icon: Copy,
          onClick: () => props.onCopyNode!(id),
        })
      }

      if (props.onColorNode) {
        entries.push(
          { separator: true },
          { colorPicker: true, nodeId: id },
        )
      }

      entries.push(
        { separator: true },
        { label: 'Löschen', icon: Trash2, onClick: () => props.onDeleteNode(id), variant: 'danger' },
      )

      return entries
    }

    case 'connection': {
      const idx = props.connIdx!
      const entries: MenuEntry[] = [
        { label: 'Node einfügen', icon: Plus, onClick: () => props.onInsertNode(idx) },
      ]

      if (props.onEditConnLabel) {
        entries.push({
          label: 'Label bearbeiten',
          icon: Type,
          onClick: () => props.onEditConnLabel!(idx),
        })
      }

      entries.push(
        { separator: true },
        { label: 'Verbindung löschen', icon: Trash2, onClick: () => props.onDeleteConnection(idx), variant: 'danger' },
      )

      return entries
    }

    case 'group': {
      const id = props.groupId!
      return [
        { label: 'Gruppe bearbeiten', icon: Pencil, onClick: () => props.onEditGroup(id) },
        { separator: true },
        { label: 'Gruppe löschen', icon: Trash2, onClick: () => props.onDeleteGroup(id), variant: 'danger' },
      ]
    }

    case 'sticky': {
      const id = props.stickyId!
      const entries: MenuEntry[] = [
        { label: 'Bearbeiten', icon: Pencil, onClick: () => props.onEditSticky(id) },
      ]

      if (props.onConnectSticky) {
        entries.push({
          label: 'Mit Node verbinden',
          icon: Link2,
          onClick: () => props.onConnectSticky!(id),
        })
      }

      if (props.onRemoveStickyConns) {
        entries.push({
          label: 'Alle Verbindungen entfernen',
          icon: X,
          onClick: () => props.onRemoveStickyConns!(id),
          variant: 'orange',
        })
      }

      entries.push(
        { separator: true },
        { label: 'Löschen', icon: Trash2, onClick: () => props.onDeleteSticky(id), variant: 'danger' },
      )

      return entries
    }

    case 'canvas': {
      const pos = props.canvasPos ?? { x: props.x, y: props.y }
      const entries: MenuEntry[] = []

      if (props.hasClipboard && props.onPaste) {
        entries.push({
          label: 'Einfügen',
          icon: Clipboard,
          onClick: () => props.onPaste!(),
        })
        entries.push({ separator: true })
      }

      entries.push(
        { label: 'Node hinzufügen', icon: Plus, onClick: () => props.onAddNode('default', pos) },
        { label: 'Gruppe hinzufügen', icon: LayoutDashboard, onClick: () => props.onAddGroup(pos) },
        { label: 'Notiz hinzufügen', icon: StickyNote, onClick: () => props.onAddSticky(pos) },
      )

      if (props.onOpenPalette) {
        entries.push({
          label: 'Palette öffnen',
          icon: Command,
          onClick: () => props.onOpenPalette!(),
        })
      }

      if (props.onAutoLayout || props.onOpenSettings) {
        entries.push({ separator: true })
      }

      if (props.onAutoLayout) {
        entries.push({
          label: 'Auto-Layout',
          icon: LayoutGrid,
          onClick: () => props.onAutoLayout!(),
        })
      }

      if (props.onOpenSettings) {
        entries.push({
          label: 'Canvas-Einstellungen',
          icon: Settings,
          onClick: () => props.onOpenSettings!(),
        })
      }

      return entries
    }
  }
}

const variantClasses: Record<string, string> = {
  default: 'text-foreground hover:bg-muted',
  danger: 'text-red-500 hover:bg-red-500/10',
  green: 'text-emerald-500 dark:text-emerald-400 hover:bg-emerald-500/10',
  blue: 'text-blue-500 dark:text-blue-400 hover:bg-blue-500/10',
  purple: 'text-purple-500 dark:text-purple-400 hover:bg-purple-500/10',
  orange: 'text-orange-500 dark:text-orange-400 hover:bg-orange-500/10',
}

function ColorPicker({
  nodeId,
  onColorNode,
  onClose,
}: {
  nodeId: string
  onColorNode: (id: string, color: string | null) => void
  onClose: () => void
}) {
  return (
    <div className="px-3 py-2">
      <span className="flex items-center gap-2 text-xs text-muted-foreground mb-1.5">
        <Palette className="h-3.5 w-3.5" />
        Farbe ändern
      </span>
      <div className="flex items-center gap-1.5">
        {NODE_COLORS.map((c) => (
          <button
            key={c.value}
            title={c.name}
            onClick={() => {
              onColorNode(nodeId, c.value)
              onClose()
            }}
            className="h-5 w-5 rounded-full border border-white/20 dark:border-zinc-700 transition-transform hover:scale-125 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-card focus:ring-primary"
            style={{ backgroundColor: c.value }}
          />
        ))}
        <button
          title="Farbe zurücksetzen"
          onClick={() => {
            onColorNode(nodeId, null)
            onClose()
          }}
          className="h-5 w-5 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    </div>
  )
}

export function CanvasContextMenu(props: CanvasContextMenuProps) {
  const { x, y, readOnly, onClose } = props
  const menuRef = useRef<HTMLDivElement>(null)
  const [adjustedPos, setAdjustedPos] = useState({ x, y })

  // Close on click outside
  useEffect(() => {
    function handleMouseDown(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleMouseDown)
    return () => document.removeEventListener('mousedown', handleMouseDown)
  }, [onClose])

  // Close on Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  // Keep menu within viewport bounds (only re-run when x/y props change)
  useEffect(() => {
    if (!menuRef.current) {
      setAdjustedPos({ x, y })
      return
    }
    const rect = menuRef.current.getBoundingClientRect()
    const vw = window.innerWidth
    const vh = window.innerHeight
    let nx = x
    let ny = y

    if (x + rect.width > vw - 8) {
      nx = vw - rect.width - 8
    }
    if (y + rect.height > vh - 8) {
      ny = vh - rect.height - 8
    }
    if (nx < 8) nx = 8
    if (ny < 8) ny = 8

    setAdjustedPos({ x: nx, y: ny })
  }, [x, y])

  const entries = buildMenuEntries(props)
  const menuType = getMenuType(props)

  // In readOnly mode, only allow non-mutating actions on canvas
  const isReadOnlyBlocked = readOnly && menuType !== 'canvas'

  if (isReadOnlyBlocked) {
    return null
  }

  return (
    <div
      ref={menuRef}
      className="fixed z-[100] min-w-[180px] rounded-xl border border-border bg-card shadow-xl py-1 animate-fade-in"
      style={{ left: adjustedPos.x, top: adjustedPos.y }}
      role="menu"
    >
      {entries.map((entry, index) => {
        if (isSeparator(entry)) {
          return <div key={`sep-${index}`} className="my-1 h-px bg-border" />
        }

        if (isColorPicker(entry)) {
          if (!props.onColorNode) return null
          return (
            <ColorPicker
              key="color-picker"
              nodeId={entry.nodeId}
              onColorNode={props.onColorNode}
              onClose={onClose}
            />
          )
        }

        const Icon = entry.icon
        const variant = entry.variant ?? 'default'

        return (
          <button
            key={entry.label}
            role="menuitem"
            disabled={entry.disabled}
            onClick={() => {
              entry.onClick?.()
              onClose()
            }}
            className={cn(
              'w-full flex items-center gap-2 px-3 py-2 text-xs rounded-md transition-colors',
              variantClasses[variant],
              entry.disabled && 'opacity-30 pointer-events-none',
            )}
          >
            <Icon className="h-3.5 w-3.5 shrink-0" />
            {entry.label}
          </button>
        )
      })}
    </div>
  )
}
