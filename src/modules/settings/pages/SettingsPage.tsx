import { Header } from '@/shell/Header'
import { useLanguage } from '@/core/i18n/context'
import { useTheme } from '@/core/theme/context'
import { Sun, Moon, Monitor } from 'lucide-react'
import { cn } from '@/shared/lib/utils'

type Theme = 'light' | 'dark' | 'system'

export function SettingsPage() {
  const { t, lang, setLang } = useLanguage()
  const { theme, setTheme } = useTheme()

  const themeOptions: { value: Theme; label: string; icon: typeof Sun }[] = [
    { value: 'light', label: t('theme.light'), icon: Sun },
    { value: 'dark', label: t('theme.dark'), icon: Moon },
    { value: 'system', label: t('theme.system'), icon: Monitor },
  ]

  return (
    <>
      <Header title={t('sidebar.settings')} />
      <div className="p-4 lg:p-6 max-w-2xl">
        {/* Appearance */}
        <section className="mb-8">
          <h2 className="text-base font-semibold text-foreground mb-4">Appearance</h2>
          <div className="rounded-xl border border-border bg-card">
            <div className="p-4 border-b border-border">
              <label className="text-sm font-medium text-foreground">Theme</label>
              <div className="mt-2 flex gap-2">
                {themeOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setTheme(opt.value)}
                    className={cn(
                      'flex items-center gap-2 rounded-lg border px-4 py-2 text-sm transition-colors',
                      theme === opt.value
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border text-muted-foreground hover:bg-muted',
                    )}
                  >
                    <opt.icon className="h-4 w-4" />
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="p-4">
              <label className="text-sm font-medium text-foreground">Language</label>
              <div className="mt-2 flex gap-2">
                {(['de', 'en'] as const).map((l) => (
                  <button
                    key={l}
                    onClick={() => setLang(l)}
                    className={cn(
                      'rounded-lg border px-4 py-2 text-sm transition-colors',
                      lang === l
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border text-muted-foreground hover:bg-muted',
                    )}
                  >
                    {l === 'de' ? 'Deutsch' : 'English'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Integrations (prepared) */}
        <section>
          <h2 className="text-base font-semibold text-foreground mb-4">Integrations</h2>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground">
              API-Integrationen werden hier konfiguriert sobald das Backend angebunden ist.
            </p>
          </div>
        </section>
      </div>
    </>
  )
}
