import { Header } from '@/shell/Header'
import { useNavigate } from 'react-router-dom'
import {
  Workflow,
  FileText,
  Search,
  BarChart3,
  ArrowRight,
} from 'lucide-react'
import { cn } from '@/shared/lib/utils'

interface HubCard {
  id: string
  title: string
  description: string
  icon: typeof Workflow
  path: string
  color: string
  stats?: string
}

const hubs: HubCard[] = [
  {
    id: 'automation',
    title: 'Automation Hub',
    description: 'Workflows, Systeme und Prozesse verwalten',
    icon: Workflow,
    path: '/automation',
    color: 'text-violet-500 bg-violet-500/10',
    stats: '0 Systeme',
  },
  {
    id: 'content',
    title: 'Content Hub',
    description: 'Content erstellen, planen und veröffentlichen',
    icon: FileText,
    path: '/content',
    color: 'text-blue-500 bg-blue-500/10',
    stats: '0 Beiträge',
  },
  {
    id: 'research',
    title: 'Research Hub',
    description: 'Recherche-Agenten und Wissensmanagement',
    icon: Search,
    path: '/research',
    color: 'text-emerald-500 bg-emerald-500/10',
    stats: '0 Quellen',
  },
  {
    id: 'kpi',
    title: 'KPI Hub',
    description: 'Kennzahlen aller Plattformen aggregiert',
    icon: BarChart3,
    path: '/kpi',
    color: 'text-amber-500 bg-amber-500/10',
    stats: '0 Metriken',
  },
]

export function DashboardPage() {
  const navigate = useNavigate()

  return (
    <>
      <Header title="Dashboard" subtitle="Willkommen zurück" />
      <div className="p-4 lg:p-6">
        {/* Welcome section */}
        <div className="mb-8 rounded-2xl border border-border bg-gradient-to-br from-primary/5 via-card to-card p-6 lg:p-8">
          <h2 className="text-xl font-bold text-foreground">
            Flowstack Platform
          </h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-lg">
            Dein Betriebssystem für Marketing-Automatisierung.
            Wähle einen Hub um loszulegen.
          </p>
        </div>

        {/* Hub Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {hubs.map((hub) => (
            <button
              key={hub.id}
              onClick={() => navigate(hub.path)}
              className={cn(
                'group relative rounded-xl border border-border bg-card p-5 text-left',
                'hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5',
                'transition-all duration-200',
              )}
            >
              <div className="flex items-start justify-between">
                <div className={cn('rounded-xl p-2.5', hub.color)}>
                  <hub.icon className="h-5 w-5" />
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity -translate-x-1 group-hover:translate-x-0 transition-transform" />
              </div>
              <h3 className="mt-4 text-sm font-semibold text-foreground">
                {hub.title}
              </h3>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                {hub.description}
              </p>
              {hub.stats && (
                <p className="mt-3 text-xs font-medium text-muted-foreground/70">
                  {hub.stats}
                </p>
              )}
            </button>
          ))}
        </div>
      </div>
    </>
  )
}
