import { useEffect, useCallback } from 'react'
import { cn } from '@/shared/lib/utils'
import { X } from 'lucide-react'

interface CanvasShortcutsOverlayProps {
  open: boolean
  onClose: () => void
}

interface ShortcutEntry {
  keys: string[]
  description: string
}

interface ShortcutSection {
  title: string
  shortcuts: ShortcutEntry[]
}

const SHORTCUT_SECTIONS: ShortcutSection[] = [
  {
    title: 'Navigation',
    shortcuts: [
      { keys: ['Mausrad'], description: 'Zoomen' },
      { keys: ['Klick + Ziehen'], description: 'Canvas bewegen' },
      { keys: ['Doppelklick auf Node'], description: 'Node bearbeiten' },
    ],
  },
  {
    title: 'Bearbeitung',
    shortcuts: [
      { keys: ['Ctrl', 'S'], description: 'Speichern' },
      { keys: ['Ctrl', 'Z'], description: 'Rückgängig' },
      { keys: ['Ctrl', 'Shift', 'Z'], description: 'Wiederherstellen' },
      { keys: ['Ctrl', 'C'], description: 'Kopieren' },
      { keys: ['Ctrl', 'V'], description: 'Einfügen' },
      { keys: ['Ctrl', 'X'], description: 'Ausschneiden' },
      { keys: ['Delete', 'Backspace'], description: 'Element löschen' },
      { keys: ['Escape'], description: 'Auswahl aufheben' },
    ],
  },
  {
    title: 'Canvas',
    shortcuts: [
      { keys: ['Ctrl', 'K'], description: 'Suche öffnen' },
      { keys: ['Ctrl', 'A'], description: 'Alle auswählen' },
      { keys: ['Ctrl', 'Shift', 'L'], description: 'Auto Layout' },
      { keys: ['P'], description: 'Palette öffnen/schließen' },
      { keys: ['G'], description: 'Gruppe hinzufügen' },
      { keys: ['N'], description: 'Sticky Note hinzufügen' },
    ],
  },
  {
    title: 'Ansicht',
    shortcuts: [
      { keys: ['F'], description: 'Präsentationsmodus' },
      { keys: ['?'], description: 'Tastenkürzel anzeigen' },
      { keys: ['Shift + Klick'], description: 'Mehrfachauswahl' },
    ],
  },
]

function KeyBadge({ label }: { label: string }) {
  return (
    <kbd
      className={cn(
        'bg-muted rounded-md px-2 py-0.5 text-xs font-mono',
        'text-foreground border border-border',
      )}
    >
      {label}
    </kbd>
  )
}

function ShortcutRow({ shortcut }: { shortcut: ShortcutEntry }) {
  return (
    <div className="flex items-center justify-between gap-4 py-1.5">
      <span className="text-sm text-muted-foreground">{shortcut.description}</span>
      <div className="flex items-center gap-1 shrink-0">
        {shortcut.keys.map((key, i) => (
          <span key={i} className="flex items-center gap-1">
            {i > 0 && key !== 'Backspace' && shortcut.keys[i - 1] !== 'Delete' && (
              <span className="text-xs text-muted-foreground">+</span>
            )}
            {i > 0 && key === 'Backspace' && (
              <span className="text-xs text-muted-foreground">/</span>
            )}
            <KeyBadge label={key} />
          </span>
        ))}
      </div>
    </div>
  )
}

export function CanvasShortcutsOverlay({ open, onClose }: CanvasShortcutsOverlayProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    },
    [onClose],
  )

  useEffect(() => {
    if (!open) return
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, handleKeyDown])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Tastenkürzel"
    >
      <div
        className={cn(
          'w-full max-w-lg mx-4 rounded-xl border border-border bg-card text-foreground shadow-2xl',
          'animate-fade-in',
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold">Tastenkürzel</h2>
          <button
            onClick={onClose}
            className={cn(
              'p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground',
              'transition-colors',
            )}
            aria-label="Schließen"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4 max-h-[70vh] overflow-y-auto space-y-5">
          {SHORTCUT_SECTIONS.map((section, sectionIndex) => (
            <div key={section.title}>
              {sectionIndex > 0 && <div className="mb-5 h-px bg-border" />}
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                {section.title}
              </h3>
              <div className="space-y-0.5">
                {section.shortcuts.map((shortcut, i) => (
                  <ShortcutRow key={i} shortcut={shortcut} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
