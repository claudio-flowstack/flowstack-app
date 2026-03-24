import { Routes, Route } from 'react-router-dom'
import { ThemeProvider } from '../contexts/ThemeContext'
import { LanguageProvider } from '../i18n/LanguageContext'
import { NotificationProvider } from '../contexts/NotificationContext'
import { ErrorBoundary } from '@/shared/components/ErrorBoundary'
import AppLayout from '../layout/AppLayout'
import Home from '../pages-dashboard/Home'
import ClientList from '../pages-clients/ClientList'
import ClientDetail from '../pages-clients/ClientDetail'
import NewClient from '../pages-clients/NewClient'
import Editor from '../pages-deliverables/Editor'
import ClientSettings from '../pages-clients/ClientSettings'
import Settings from '../pages-settings/Settings'
import AiAssistant from '../components/AiAssistant'
import '../kunden-hub.css'

export function KundenHubPage() {
  return (
    <div style={{ backgroundColor: '#fff', minHeight: '100vh' }}>
    <ErrorBoundary>
    <ThemeProvider>
      <LanguageProvider>
        <NotificationProvider>
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
        </NotificationProvider>
      </LanguageProvider>
    </ThemeProvider>
    </ErrorBoundary>
    </div>
  )
}
