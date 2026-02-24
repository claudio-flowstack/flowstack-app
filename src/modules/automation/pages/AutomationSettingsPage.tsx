import { useState, useEffect } from 'react'
import { Header } from '@/shell/Header'
import { useAutomationStore } from '../application/automation-store'
import { cn } from '@/shared/lib/utils'
import {
  Settings,
  Play,
  Bell,
  Activity,
  Layers,
  BarChart3,
  Shield,
  RefreshCw,
} from 'lucide-react'

// ── Settings Shape ────────────────────────────────────────────────────────────

interface AutomationSettings {
  autoExecute: boolean
  notifications: boolean
  webhookLogs: boolean
  compactView: boolean
}

const STORAGE_KEY = 'fs_automation_settings'

const DEFAULT_SETTINGS: AutomationSettings = {
  autoExecute: true,
  notifications: true,
  webhookLogs: false,
  compactView: false,
}

// ── Toggle Row Config ─────────────────────────────────────────────────────────

const TOGGLE_ROWS: {
  key: keyof AutomationSettings
  icon: typeof Play
  label: string
  desc: string
}[] = [
  {
    key: 'autoExecute',
    icon: Play,
    label: 'Auto-Ausführung',
    desc: 'Systeme automatisch ausführen bei Trigger-Events',
  },
  {
    key: 'notifications',
    icon: Bell,
    label: 'Benachrichtigungen',
    desc: 'Push-Benachrichtigungen für Systemereignisse',
  },
  {
    key: 'webhookLogs',
    icon: Activity,
    label: 'Webhook-Logs',
    desc: 'Webhook-Aufrufe protokollieren und speichern',
  },
  {
    key: 'compactView',
    icon: Layers,
    label: 'Kompakte Ansicht',
    desc: 'Systeme in kompakterer Darstellung anzeigen',
  },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function loadSettings(): AutomationSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) }
  } catch {
    // corrupted – fall back to defaults
  }
  return { ...DEFAULT_SETTINGS }
}

function saveSettings(settings: AutomationSettings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
}

// ── Page Component ────────────────────────────────────────────────────────────

export function AutomationSettingsPage() {
  const { systems, activeSystemCount, totalExecutionCount } =
    useAutomationStore()

  const [settings, setSettings] = useState<AutomationSettings>(loadSettings)

  // Persist on every change
  useEffect(() => {
    saveSettings(settings)
  }, [settings])

  const toggle = (key: keyof AutomationSettings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const resetSettings = () => {
    setSettings({ ...DEFAULT_SETTINGS })
  }

  // Derived counts
  const totalSystems = systems.length
  const activeSystems = activeSystemCount()
  const draftSystems = systems.filter((s) => s.status === 'draft').length
  const totalExecutions = totalExecutionCount()

  const STAT_BOXES: { label: string; value: number; color: string }[] = [
    { label: 'Gesamt-Systeme', value: totalSystems, color: '#8b5cf6' },
    { label: 'Aktive Systeme', value: activeSystems, color: '#10b981' },
    { label: 'Entwurf-Systeme', value: draftSystems, color: '#f59e0b' },
    { label: 'Gesamte Ausführungen', value: totalExecutions, color: '#3b82f6' },
  ]

  return (
    <>
      <Header
        title="Einstellungen"
        subtitle="Automation-Einstellungen verwalten"
      />

      <div className="p-4 lg:p-6 space-y-5">
        {/* ── Block 1: Automation Settings ──────────────────────────────── */}
        <section className="bg-card rounded-2xl p-6 mb-5 border border-border">
          <div className="flex items-center gap-3 mb-6">
            <Settings className="h-5 w-5 text-purple-500" />
            <h2 className="text-base font-semibold text-foreground">
              Automation-Einstellungen
            </h2>
          </div>

          <div className="space-y-4">
            {TOGGLE_ROWS.map(({ key, icon: Icon, label, desc }) => (
              <div
                key={key}
                className="flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted shrink-0">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {label}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {desc}
                    </p>
                  </div>
                </div>

                {/* Toggle switch */}
                <button
                  type="button"
                  role="switch"
                  aria-checked={settings[key]}
                  onClick={() => toggle(key)}
                  className={cn(
                    'relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    settings[key] ? 'bg-purple-500' : 'bg-gray-300 dark:bg-gray-600',
                  )}
                >
                  <span
                    className={cn(
                      'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm transform transition-transform duration-200 mt-1',
                      settings[key] ? 'translate-x-6' : 'translate-x-1',
                    )}
                  />
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* ── Block 2: System Stats ─────────────────────────────────────── */}
        <section className="bg-card rounded-2xl p-6 mb-5 border border-border">
          <div className="flex items-center gap-3 mb-6">
            <BarChart3 className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-base font-semibold text-foreground">
              System-Statistiken
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {STAT_BOXES.map(({ label, value, color }) => (
              <div
                key={label}
                className="text-center p-4 rounded-xl bg-muted"
              >
                <p
                  className="text-2xl font-bold"
                  style={{ color }}
                >
                  {value}
                </p>
                <p className="mt-1 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                  {label}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Block 3: Danger Zone ──────────────────────────────────────── */}
        <section className="bg-card rounded-2xl p-6 border border-red-200 dark:border-red-500/20">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="h-5 w-5 text-red-500" />
            <h2 className="text-base font-semibold text-foreground">
              Gefahrenzone
            </h2>
          </div>

          <button
            onClick={resetSettings}
            className="flex items-center gap-2 rounded-lg border border-red-300 dark:border-red-500/30 px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Alle Einstellungen zurücksetzen
          </button>
        </section>
      </div>
    </>
  )
}
