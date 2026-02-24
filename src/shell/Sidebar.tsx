import { useLocation, useNavigate } from 'react-router-dom'
import { cn } from '@/shared/lib/utils'
import { useUIStore } from '@/shared/stores/ui-store'
import { useTheme } from '@/core/theme/context'
import { useLanguage } from '@/core/i18n/context'
import {
  Workflow,
  FileText,
  Search,
  BarChart3,
  Settings,
  ChevronsLeft,
  ChevronsRight,
  Sun,
  Moon,
  Languages,
  X,
  LayoutDashboard,
} from 'lucide-react'

interface NavItem {
  id: string
  labelKey: string
  icon: typeof Workflow
  path: string
}

const navItems: NavItem[] = [
  { id: 'dashboard', labelKey: 'sidebar.dashboard', icon: LayoutDashboard, path: '/' },
  { id: 'automation', labelKey: 'sidebar.automation', icon: Workflow, path: '/automation' },
  { id: 'content', labelKey: 'sidebar.content', icon: FileText, path: '/content' },
  { id: 'research', labelKey: 'sidebar.research', icon: Search, path: '/research' },
  { id: 'kpi', labelKey: 'sidebar.kpi', icon: BarChart3, path: '/kpi' },
]

const bottomItems: NavItem[] = [
  { id: 'settings', labelKey: 'sidebar.settings', icon: Settings, path: '/settings' },
]

// ── Sidebar ─────────────────────────────────────────────────────────────────

export function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const collapsed = useUIStore((s) => s.sidebarCollapsed)
  const mobileOpen = useUIStore((s) => s.sidebarMobileOpen)
  const toggleSidebar = useUIStore((s) => s.toggleSidebar)
  const setMobileOpen = useUIStore((s) => s.setSidebarMobileOpen)
  const { resolvedTheme, toggleTheme } = useTheme()
  const { lang, setLang, t } = useLanguage()

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  const handleNav = (path: string) => {
    navigate(path)
    setMobileOpen(false)
  }

  const renderNavItem = (item: NavItem) => {
    const active = isActive(item.path)
    return (
      <button
        key={item.id}
        onClick={() => handleNav(item.path)}
        className={cn(
          'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
          'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
          active
            ? 'bg-sidebar-accent text-sidebar-accent-foreground'
            : 'text-sidebar-foreground',
          collapsed && 'justify-center px-2.5',
        )}
        title={collapsed ? t(item.labelKey) : undefined}
      >
        <item.icon
          className={cn(
            'h-[18px] w-[18px] shrink-0 transition-colors',
            active ? 'text-primary' : 'text-muted-foreground group-hover:text-sidebar-accent-foreground',
          )}
        />
        {!collapsed && <span>{t(item.labelKey)}</span>}
      </button>
    )
  }

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className={cn(
        'flex items-center border-b border-sidebar-border px-4 h-14 shrink-0',
        collapsed ? 'justify-center' : 'gap-3',
      )}>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Workflow className="h-4 w-4" />
        </div>
        {!collapsed && (
          <span className="text-base font-bold text-foreground tracking-tight">
            Flowstack
          </span>
        )}
      </div>

      {/* Main nav */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navItems.map(renderNavItem)}
      </nav>

      {/* Bottom section */}
      <div className="border-t border-sidebar-border px-3 py-3 space-y-1">
        {bottomItems.map(renderNavItem)}

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground w-full',
            'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors',
            collapsed && 'justify-center px-2.5',
          )}
          title={t('theme.toggle')}
        >
          {resolvedTheme === 'dark' ? (
            <Sun className="h-[18px] w-[18px] text-muted-foreground" />
          ) : (
            <Moon className="h-[18px] w-[18px] text-muted-foreground" />
          )}
          {!collapsed && <span>{resolvedTheme === 'dark' ? t('theme.light') : t('theme.dark')}</span>}
        </button>

        {/* Language toggle */}
        <button
          onClick={() => setLang(lang === 'de' ? 'en' : 'de')}
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground w-full',
            'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors',
            collapsed && 'justify-center px-2.5',
          )}
        >
          <Languages className="h-[18px] w-[18px] text-muted-foreground" />
          {!collapsed && <span>{lang === 'de' ? 'English' : 'Deutsch'}</span>}
        </button>

        {/* Collapse toggle */}
        <button
          onClick={toggleSidebar}
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground w-full',
            'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors',
            collapsed && 'justify-center px-2.5',
          )}
        >
          {collapsed ? (
            <ChevronsRight className="h-[18px] w-[18px] text-muted-foreground" />
          ) : (
            <ChevronsLeft className="h-[18px] w-[18px] text-muted-foreground" />
          )}
          {!collapsed && <span>{t('sidebar.collapse')}</span>}
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          'hidden lg:flex flex-col border-r border-sidebar-border bg-sidebar shrink-0 h-screen sticky top-0',
          'transition-[width] duration-200 ease-in-out',
          collapsed ? 'w-[68px]' : 'w-[240px]',
        )}
      >
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative z-10 flex h-full w-[280px] flex-col bg-sidebar shadow-2xl animate-slide-in">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-3 rounded-lg p-1.5 text-muted-foreground hover:bg-muted z-20"
            >
              <X className="h-5 w-5" />
            </button>
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  )
}
