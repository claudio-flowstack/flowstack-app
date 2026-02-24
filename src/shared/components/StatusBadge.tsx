import { cn } from '@/shared/lib/utils'

type BadgeVariant =
  | 'default'
  | 'active'
  | 'draft'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'muted'

interface StatusBadgeProps {
  variant?: BadgeVariant
  children: React.ReactNode
  dot?: boolean
  className?: string
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-secondary text-secondary-foreground',
  active: 'bg-emerald-500/15 text-emerald-500 dark:text-emerald-400',
  draft: 'bg-zinc-500/15 text-zinc-500 dark:text-zinc-400',
  success: 'bg-emerald-500/15 text-emerald-500 dark:text-emerald-400',
  warning: 'bg-amber-500/15 text-amber-500 dark:text-amber-400',
  danger: 'bg-red-500/15 text-red-500 dark:text-red-400',
  info: 'bg-blue-500/15 text-blue-500 dark:text-blue-400',
  muted: 'bg-muted text-muted-foreground',
}

const dotStyles: Record<BadgeVariant, string> = {
  default: 'bg-secondary-foreground',
  active: 'bg-emerald-500',
  draft: 'bg-zinc-500',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger: 'bg-red-500',
  info: 'bg-blue-500',
  muted: 'bg-muted-foreground',
}

export function StatusBadge({
  variant = 'default',
  children,
  dot = false,
  className,
}: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
        variantStyles[variant],
        className,
      )}
    >
      {dot && (
        <span className={cn('h-1.5 w-1.5 rounded-full', dotStyles[variant])} />
      )}
      {children}
    </span>
  )
}
