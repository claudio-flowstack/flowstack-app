import { useState } from 'react'
import type { ContentPlatform } from '../domain/types'
import { PLATFORM_CONFIG } from '../domain/constants'
import { cn } from '@/shared/lib/utils'
import { X } from 'lucide-react'

interface CreateContentModalProps {
  onCreateItem: (platform: ContentPlatform, title: string) => void
  onClose: () => void
}

const platforms: ContentPlatform[] = ['youtube', 'instagram', 'facebook-linkedin']

export function CreateContentModal({
  onCreateItem,
  onClose,
}: CreateContentModalProps) {
  const [selectedPlatform, setSelectedPlatform] = useState<ContentPlatform>('youtube')
  const [title, setTitle] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    onCreateItem(selectedPlatform, title.trim())
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl animate-scale-in">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-lg font-bold text-foreground">
            Content erstellen
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Platform Selection */}
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Plattform
            </label>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {platforms.map((p) => {
                const config = PLATFORM_CONFIG[p]
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setSelectedPlatform(p)}
                    className={cn(
                      'rounded-xl border-2 p-3 text-center transition-all',
                      selectedPlatform === p
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/30',
                    )}
                  >
                    <span
                      className="text-lg font-bold"
                      style={{ color: config.color }}
                    >
                      {config.label.charAt(0)}
                    </span>
                    <p className="mt-1 text-[11px] font-medium text-foreground">
                      {config.label}
                    </p>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Titel *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="z.B. Wie KI dein Marketing revolutioniert"
              className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary/30 outline-none transition-all"
              autoFocus
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              className={cn(
                'rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                title.trim()
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                  : 'bg-muted text-muted-foreground cursor-not-allowed',
              )}
            >
              Erstellen
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
