import { useEffect, useCallback } from 'react'
import { cn } from '@/shared/lib/utils'
import { AlertTriangle, Info, AlertCircle, X } from 'lucide-react'

type Variant = 'danger' | 'warning' | 'info'

interface ConfirmDialogProps {
  open: boolean
  title: string
  description?: string
  /** Alias for description (source compat) */
  message?: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: Variant
  onConfirm: () => void
  onCancel: () => void
}

const variantConfig: Record<Variant, {
  icon: typeof AlertTriangle
  iconColor: string
  buttonClass: string
}> = {
  danger: {
    icon: AlertTriangle,
    iconColor: 'text-red-400',
    buttonClass: 'bg-red-600 hover:bg-red-700 text-white',
  },
  warning: {
    icon: AlertCircle,
    iconColor: 'text-amber-400',
    buttonClass: 'bg-amber-600 hover:bg-amber-700 text-white',
  },
  info: {
    icon: Info,
    iconColor: 'text-blue-400',
    buttonClass: 'bg-blue-600 hover:bg-blue-700 text-white',
  },
}

export function ConfirmDialog({
  open,
  title,
  description,
  message,
  confirmLabel = 'Bestätigen',
  cancelLabel = 'Abbrechen',
  variant = 'danger',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const text = description ?? message ?? ''
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    },
    [onCancel],
  )

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, handleKeyDown])

  if (!open) return null

  const config = variantConfig[variant]
  const Icon = config.icon

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Dialog */}
      <div className="relative z-10 w-full max-w-md animate-scale-in rounded-xl border border-border bg-card p-6 shadow-2xl">
        {/* Close button */}
        <button
          onClick={onCancel}
          className="absolute right-4 top-4 rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Icon + Title */}
        <div className="flex items-start gap-4">
          <div className={cn('mt-0.5 rounded-full p-2', `${config.iconColor} bg-muted`)}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-foreground">{title}</h3>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              {text}
            </p>
          </div>
        </div>

        {/* Buttons */}
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={cn(
              'rounded-lg px-4 py-2 text-sm font-medium transition-colors',
              config.buttonClass,
            )}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
