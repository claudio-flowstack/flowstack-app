import { useState } from 'react'
import type { StickyNote, StickyNoteColor } from '../domain/types'
import { STICKY_COLORS } from './constants'
import { cn } from '@/shared/lib/utils'
import { X, Bold, Italic } from 'lucide-react'

interface StickyEditModalProps {
  sticky: StickyNote
  onSave: (updates: Partial<StickyNote>) => void
  onClose: () => void
}

const COLOR_OPTIONS: StickyNoteColor[] = [
  'yellow', 'blue', 'green', 'pink', 'orange', 'purple', 'red', 'gray',
]

const FONT_SIZES = [10, 11, 12, 14, 16, 18, 20] as const

const TEXT_COLORS = [
  { label: 'Default', value: '' },
  { label: 'Dark', value: '#18181b' },
  { label: 'White', value: '#ffffff' },
  { label: 'Blue', value: '#3b82f6' },
  { label: 'Purple', value: '#8b5cf6' },
  { label: 'Red', value: '#ef4444' },
  { label: 'Green', value: '#10b981' },
  { label: 'Orange', value: '#f59e0b' },
] as const

export function StickyEditModal({ sticky, onSave, onClose }: StickyEditModalProps) {
  const [text, setText] = useState(sticky.text)
  const [color, setColor] = useState<StickyNoteColor>(sticky.color)
  const [fontSize, setFontSize] = useState(sticky.fontSize ?? 12)
  const [fontWeight, setFontWeight] = useState<'normal' | 'bold'>(sticky.fontWeight ?? 'normal')
  const [fontStyle, setFontStyle] = useState<'normal' | 'italic'>(sticky.fontStyle ?? 'normal')
  const [customTextColor, setCustomTextColor] = useState(sticky.customTextColor ?? '')

  const handleSave = () => {
    onSave({
      text,
      color,
      fontSize,
      fontWeight,
      fontStyle,
      customTextColor: customTextColor || undefined,
    })
  }

  const previewColors = STICKY_COLORS[color]

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div
        className="w-96 rounded-2xl border border-border bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <h3 className="text-sm font-semibold text-foreground">Notiz bearbeiten</h3>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-4">
          {/* Text area with preview styling */}
          <div>
            <label className="text-[11px] font-medium text-muted-foreground mb-1.5 block">Text</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={4}
              className="w-full rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:ring-2 focus:ring-purple-500/30 resize-none"
              style={{
                fontSize,
                fontWeight: fontWeight === 'bold' ? 700 : 400,
                fontStyle: fontStyle === 'italic' ? 'italic' : 'normal',
                color: customTextColor || undefined,
                background: previewColors.bg,
              }}
            />
          </div>

          {/* Color picker */}
          <div>
            <label className="text-[11px] font-medium text-muted-foreground mb-1.5 block">Hintergrundfarbe</label>
            <div className="flex items-center gap-1.5">
              {COLOR_OPTIONS.map((c) => {
                const colors = STICKY_COLORS[c]
                return (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={cn(
                      'w-6 h-6 rounded-full transition-transform hover:scale-110',
                      color === c && 'ring-2 ring-purple-500 ring-offset-2 ring-offset-card scale-110',
                    )}
                    style={{ background: colors.bg, border: `2px solid ${colors.border}` }}
                    title={c}
                  />
                )
              })}
            </div>
          </div>

          {/* Font formatting row */}
          <div className="flex items-center gap-4">
            {/* Font size */}
            <div>
              <label className="text-[11px] font-medium text-muted-foreground mb-1.5 block">Schriftgröße</label>
              <select
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                className="rounded-md border border-border bg-muted/30 px-2 py-1.5 text-xs text-foreground outline-none"
              >
                {FONT_SIZES.map((s) => (
                  <option key={s} value={s}>{s}px</option>
                ))}
              </select>
            </div>

            {/* Bold / Italic toggles */}
            <div>
              <label className="text-[11px] font-medium text-muted-foreground mb-1.5 block">Format</label>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setFontWeight(fontWeight === 'bold' ? 'normal' : 'bold')}
                  className={cn(
                    'w-8 h-8 rounded-md flex items-center justify-center transition-colors',
                    fontWeight === 'bold'
                      ? 'bg-purple-500/15 text-purple-500 border border-purple-500/30'
                      : 'bg-muted/50 text-muted-foreground hover:text-foreground border border-border',
                  )}
                  title="Fett"
                >
                  <Bold className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setFontStyle(fontStyle === 'italic' ? 'normal' : 'italic')}
                  className={cn(
                    'w-8 h-8 rounded-md flex items-center justify-center transition-colors',
                    fontStyle === 'italic'
                      ? 'bg-purple-500/15 text-purple-500 border border-purple-500/30'
                      : 'bg-muted/50 text-muted-foreground hover:text-foreground border border-border',
                  )}
                  title="Kursiv"
                >
                  <Italic className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Text color */}
            <div>
              <label className="text-[11px] font-medium text-muted-foreground mb-1.5 block">Textfarbe</label>
              <div className="flex items-center gap-1">
                {TEXT_COLORS.map((tc) => (
                  <button
                    key={tc.label}
                    onClick={() => setCustomTextColor(tc.value)}
                    className={cn(
                      'w-5 h-5 rounded-full transition-transform hover:scale-110 border',
                      customTextColor === tc.value && 'ring-2 ring-purple-500 ring-offset-1 ring-offset-card',
                    )}
                    style={{
                      background: tc.value || 'linear-gradient(135deg, #ccc 50%, #333 50%)',
                      borderColor: tc.value ? tc.value + '60' : '#999',
                    }}
                    title={tc.label}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-3">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            Abbrechen
          </button>
          <button
            onClick={handleSave}
            className="rounded-lg px-4 py-2 text-xs font-medium text-white bg-purple-500 hover:bg-purple-600 transition-colors"
          >
            Speichern
          </button>
        </div>
      </div>
    </div>
  )
}
