import { useLocation, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Cpu, FileBox, Settings } from 'lucide-react'
import { cn } from '@/shared/lib/utils'

const tabs = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { label: 'Systeme', icon: Cpu, path: '/automation' },
  { label: 'Vorlagen', icon: FileBox, path: '/automation?tab=templates' },
  { label: 'Einstellungen', icon: Settings, path: '/settings' },
]

export function MobileBottomNav() {
  const location = useLocation()
  const navigate = useNavigate()

  function isActive(tab: (typeof tabs)[number]) {
    if (tab.path === '/') {
      return location.pathname === '/'
    }
    if (tab.path.includes('?')) {
      const [basePath, query] = tab.path.split('?')
      return (
        location.pathname.startsWith(basePath) &&
        location.search.includes(query)
      )
    }
    return location.pathname.startsWith(tab.path)
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden border-t border-border bg-card/95 backdrop-blur-sm">
      <div className="flex items-center justify-around h-14">
        {tabs.map((tab) => (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path)}
            className={cn(
              'flex flex-col items-center gap-0.5 px-3 py-1.5 text-[10px] font-medium transition-colors',
              isActive(tab) ? 'text-primary' : 'text-muted-foreground',
            )}
          >
            <tab.icon className="h-5 w-5" />
            {tab.label}
          </button>
        ))}
      </div>
    </nav>
  )
}
