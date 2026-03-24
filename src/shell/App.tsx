import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { ThemeProvider } from '@/core/theme/context'
import { LanguageProvider } from '@/core/i18n/context'
// Prefetch Drive & Gmail data on app start (runs on import)
import '@/core/drive-cache'
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
// Prefetch editor chunk so transition from detail→editor is instant
import('@/modules/automation/pages/SystemEditorPage').catch(() => {})
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
const DrivePage = lazy(() =>
  import('@/modules/drive/pages/DrivePage').then((m) => ({ default: m.DrivePage })),
)
const SettingsPage = lazy(() =>
  import('@/modules/settings/pages/SettingsPage').then((m) => ({ default: m.SettingsPage })),
)
const TerminalPage = lazy(() =>
  import('@/modules/terminal/pages/TerminalPage').then((m) => ({ default: m.TerminalPage })),
)
const KundenHubPage = lazy(() =>
  import('@/modules/kunden-hub/pages/KundenHubPage').then((m) => ({ default: m.KundenHubPage })),
)
// Direct import — no lazy loading for debugging
import { HomePage } from '@/modules/homepage/HomePage'

// Demo Funnel pages (lazy)
const DemoLanding = lazy(() =>
  import('@/modules/demo-funnel/pages/LandingPage').then((m) => ({ default: m.default })),
)
const DemoFormular = lazy(() =>
  import('@/modules/demo-funnel/pages/FormularPage').then((m) => ({ default: m.default })),
)
const DemoDanke = lazy(() =>
  import('@/modules/demo-funnel/pages/DankePage').then((m) => ({ default: m.default })),
)
const DemoDatenschutz = lazy(() =>
  import('@/modules/demo-funnel/pages/DatenschutzPage').then((m) => ({ default: m.default })),
)
const DemoImpressum = lazy(() =>
  import('@/modules/demo-funnel/pages/ImpressumPage').then((m) => ({ default: m.default })),
)
// DashboardPage + RecruitingDashboardPage haben tiefe Daten-Abhängigkeiten
// und bleiben vorerst nicht geroutet (komplexe Integration nötig)

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-full min-h-screen">
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
              {/* Kunden-Hub — own layout, contexts, sidebar */}
              <Route path="/kunden-hub/*" element={<KundenHubPage />} />

              {/* Homepage — full-screen, no sidebar */}
              <Route path="/hp" element={<HomePage />} />

              {/* Demo Funnel — standalone recruiting demo pages */}
              <Route path="/demo" element={<DemoLanding />} />
              <Route path="/demo/kostenlose-beratung" element={<DemoFormular />} />
              <Route path="/demo/danke" element={<DemoDanke />} />
              <Route path="/demo/datenschutz" element={<DemoDatenschutz />} />
              <Route path="/demo/impressum" element={<DemoImpressum />} />
              {/* Dashboard + Recruiting Demo: komplexe Daten-Deps, separates Projekt */}

              {/* Full-screen editors — no sidebar */}
              <Route path="/automation/system/:systemId/editor" element={<SystemEditorPage />} />
              <Route path="/automation/funnel/:funnelId" element={<FunnelEditorPage />} />

              {/* Dashboard routes — with sidebar */}
              <Route element={<DashboardLayout />}>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/automation/system/:systemId" element={<SystemDetailPage />} />
                <Route path="/automation/*" element={<AutomationPage />} />
                <Route path="/content/*" element={<ContentPage />} />
                <Route path="/drive/*" element={<DrivePage />} />
                <Route path="/research/*" element={<ResearchPage />} />
                <Route path="/kpi/*" element={<KpiPage />} />
                <Route path="/terminal/*" element={<TerminalPage />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Route>
            </Routes>
          </Suspense>
        </BrowserRouter>
      </LanguageProvider>
    </ThemeProvider>
  )
}
