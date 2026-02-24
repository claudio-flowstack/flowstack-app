import { Menu, Bell } from 'lucide-react'
import { useUIStore } from '@/shared/stores/ui-store'
import { cn } from '@/shared/lib/utils'

interface HeaderProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
}

export function Header({ title, subtitle, actions }: HeaderProps) {
  const setMobileOpen = useUIStore((s) => s.setSidebarMobileOpen)

  return (
    <header
      className={cn(
        'sticky top-0 z-30 flex items-center gap-4 border-b border-border bg-background/80 backdrop-blur-md',
        'h-14 px-4 lg:px-6 shrink-0',
      )}
    >
      {/* Mobile menu */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Title */}
      <div className="flex-1 min-w-0">
        <h1 className="text-lg font-semibold text-foreground truncate">{title}</h1>
        {subtitle && (
          <p className="text-xs text-muted-foreground truncate -mt-0.5">{subtitle}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {actions}

        {/* Notifications (prepared) */}
        <button className="relative rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
          <Bell className="h-[18px] w-[18px]" />
        </button>

        {/* User avatar */}
        <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-semibold text-primary">
          FS
        </div>
      </div>
    </header>
  )
}
