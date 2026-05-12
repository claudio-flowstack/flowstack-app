import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import { ThemeProvider } from '../contexts/ThemeContext'
import { LanguageProvider } from '../i18n/LanguageContext'
import { NotificationProvider } from '../contexts/NotificationContext'
import { ErrorBoundary } from '@/shared/components/ErrorBoundary'
import AppLayout from '../layout/AppLayout'
import '../kunden-hub.css'

// Route-based code splitting: each page loads only when navigated to
const Home = lazy(() => import('../pages-dashboard/Home'))
const ClientList = lazy(() => import('../pages-clients/ClientList'))
const ClientDetail = lazy(() => import('../pages-clients/ClientDetail'))
const NewClient = lazy(() => import('../pages-clients/NewClient'))
const Editor = lazy(() => import('../pages-deliverables/Editor'))
const ClientSettings = lazy(() => import('../pages-clients/ClientSettings'))
const Settings = lazy(() => import('../pages-settings/Settings'))
const AiAssistant = lazy(() => import('../components/AiAssistant'))

export function KundenHubPage() {
  return (
    <div style={{ backgroundColor: '#fff', minHeight: '100vh' }}>
    <ErrorBoundary>
    <ThemeProvider>
      <LanguageProvider>
        <NotificationProvider>
          <Suspense fallback={<div className="flex items-center justify-center min-h-[50vh]"><div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-brand-500" /></div>}>
            <Routes>
              <Route element={<AppLayout />}>
                <Route index element={<Home />} />
                <Route path="clients" element={<ClientList />} />
                <Route path="clients/new" element={<NewClient />} />
                <Route path="clients/:clientId" element={<ClientDetail />} />
                <Route path="clients/:clientId/edit/:delivId" element={<Editor />} />
                <Route path="clients/:clientId/settings" element={<ClientSettings />} />
                <Route path="onboarding" element={<NewClient />} />
                <Route path="ai-assistant" element={<AiAssistant />} />
                <Route path="settings" element={<Settings />} />
              </Route>
            </Routes>
          </Suspense>
        </NotificationProvider>
      </LanguageProvider>
    </ThemeProvider>
    </ErrorBoundary>
    </div>
  )
}
