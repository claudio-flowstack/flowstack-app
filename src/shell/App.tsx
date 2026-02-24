import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { ThemeProvider } from '@/core/theme/context'
import { LanguageProvider } from '@/core/i18n/context'
import { DashboardLayout } from './DashboardLayout'

// Lazy-loaded modules — only loaded when user navigates to them
const DashboardPage = lazy(() =>
  import('@/modules/dashboard/pages/DashboardPage').then((m) => ({ default: m.DashboardPage })),
)
const AutomationPage = lazy(() =>
  import('@/modules/automation/pages/AutomationPage').then((m) => ({ default: m.AutomationPage })),
)
const SystemDetailPage = lazy(() =>
  import('@/modules/automation/pages/SystemDetailPage').then((m) => ({ default: m.SystemDetailPage })),
)
const SystemEditorPage = lazy(() =>
  import('@/modules/automation/pages/SystemEditorPage').then((m) => ({ default: m.SystemEditorPage })),
)
const FunnelEditorPage = lazy(() =>
  import('@/modules/automation/pages/FunnelEditorPage').then((m) => ({ default: m.FunnelEditorPage })),
)
const ContentPage = lazy(() =>
  import('@/modules/content/pages/ContentPage').then((m) => ({ default: m.ContentPage })),
)
const ResearchPage = lazy(() =>
  import('@/modules/research/pages/ResearchPage').then((m) => ({ default: m.ResearchPage })),
)
const KpiPage = lazy(() =>
  import('@/modules/kpi/pages/KpiPage').then((m) => ({ default: m.KpiPage })),
)
const SettingsPage = lazy(() =>
  import('@/modules/settings/pages/SettingsPage').then((m) => ({ default: m.SettingsPage })),
)

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-full min-h-[60vh]">
      <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin-slow" />
    </div>
  )
}

export function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Full-screen editors — no sidebar */}
              <Route path="/automation/system/:systemId/editor" element={<SystemEditorPage />} />
              <Route path="/automation/funnel/:funnelId" element={<FunnelEditorPage />} />

              {/* Dashboard routes — with sidebar */}
              <Route element={<DashboardLayout />}>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/automation/system/:systemId" element={<SystemDetailPage />} />
                <Route path="/automation/*" element={<AutomationPage />} />
                <Route path="/content/*" element={<ContentPage />} />
                <Route path="/research/*" element={<ResearchPage />} />
                <Route path="/kpi/*" element={<KpiPage />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Route>
            </Routes>
          </Suspense>
        </BrowserRouter>
      </LanguageProvider>
    </ThemeProvider>
  )
}
