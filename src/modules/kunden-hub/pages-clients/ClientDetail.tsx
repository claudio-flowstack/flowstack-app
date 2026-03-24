import { useState, useEffect, useMemo, useRef, useCallback, lazy, Suspense } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageMeta from '../ui/common/PageMeta';
import PageBreadcrumb from '../ui/common/PageBreadCrumb';
import { useLanguage } from '../i18n/LanguageContext';
import { useFulfillmentStore } from '../store/fulfillment-store';
import { api } from '../services/api';
import type { ExecutionStatus, PerformanceData } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import PipelineDetail from '../components/PipelineDetail';
import ContentReviewPanel from '../components/ContentReviewPanel';
import ConnectionsGrid from '../components/ConnectionsGrid';
import TimelineView from '../components/TimelineView';
import NotesTab from '../components/NotesTab';
import ReportButton from '../components/ReportButton';
import Button from '../ui/components/button/Button';
import { Modal } from '../ui/components/modal/index';
import { useNotification } from '../contexts/NotificationContext';
import type { ClientConnection, ClientKpis } from '../data/types';
import type { ApexOptions } from 'apexcharts';

// Lazy-load react-apexcharts to avoid runtime crash if window/document not ready
const Chart = lazy(() => import('react-apexcharts'));

type Tab = 'pipeline' | 'deliverables' | 'performance' | 'connections' | 'links' | 'timeline' | 'notes' | 'errors';

function TabErrorCard({ tab, onRetry }: { tab: string; onRetry: (tab: string) => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-red-200 bg-red-50 p-8 dark:border-red-900/30 dark:bg-red-950/10">
      <svg className="mb-3 h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
      </svg>
      <p className="mb-1 text-sm font-medium text-red-600 dark:text-red-400">Laden fehlgeschlagen</p>
      <p className="mb-4 text-xs text-red-400 dark:text-red-500">Backend nicht erreichbar oder Daten nicht verfuegbar.</p>
      <button
        onClick={() => onRetry(tab)}
        className="rounded-lg bg-red-100 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30"
      >
        Erneut versuchen
      </button>
    </div>
  );
}

export default function ClientDetail() {
  const { t } = useLanguage();
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const { notify } = useNotification();
  const loadClients = useFulfillmentStore((s) => s.loadClients);
  const getClient = useFulfillmentStore((s) => s.getClient);
  const clients = useFulfillmentStore((s) => s.clients);
  const loadPerformance = useFulfillmentStore((s) => s.loadPerformance);
  const loadTimeline = useFulfillmentStore((s) => s.loadTimeline);
  const loadDeliverables = useFulfillmentStore((s) => s.loadDeliverables);
  const clientPerformance = useFulfillmentStore((s) => s.clientPerformance);
  const deleteClient = useFulfillmentStore((s) => s.deleteClient);

  const [activeTab, setActiveTab] = useState<Tab>('pipeline');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // --- API-backed data for Connections tab ---
  const [connectionsLoading, setConnectionsLoading] = useState(false);
  const [apiConnections, setApiConnections] = useState<ClientConnection[] | null>(null);

  // --- API-backed data for Links tab ---
  const [linksLoading, setLinksLoading] = useState(false);
  const [linksContext, setLinksContext] = useState<Record<string, unknown> | null>(null);

  // --- Performance tab: API-loaded KPIs ---
  const [perfLoading, setPerfLoading] = useState(false);
  const [perfLoaded, setPerfLoaded] = useState<string | null>(null);

  // --- Timeline tab: loading state ---
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [timelineLoaded, setTimelineLoaded] = useState<string | null>(null);

  // --- Deliverables tab: loading state ---
  const [deliverablesLoading, setDeliverablesLoading] = useState(false);
  const [deliverablesLoaded, setDeliverablesLoaded] = useState<string | null>(null);

  // --- Tab error states ---
  const [tabErrors, setTabErrors] = useState<Record<string, boolean>>({});

  // --- Alerts: execution status for failed node detection ---
  const [execution, setExecution] = useState<ExecutionStatus | null>(null);
  // Track which tabs have been loaded to avoid refetching
  const loadedRef = useRef<Record<string, boolean>>({});

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  // Load execution status for alerts (once per clientId)
  useEffect(() => {
    if (!clientId) return;
    if (loadedRef.current[`exec-${clientId}`]) return;
    loadedRef.current[`exec-${clientId}`] = true;
    api.clientExecution.get(clientId)
      .then((execStatus) => {
        setExecution(execStatus);
      })
      .catch(() => {
        // No execution data available, that's fine
      });
  }, [clientId]);

  // Derive failed nodes for alert display
  const failedNodes = useMemo(() => {
    if (!execution?.nodes) return [];
    return Object.entries(execution.nodes)
      .filter(([, n]) => n.status === 'failed')
      .map(([id, n]) => ({ id, error: n.error || 'Unbekannter Fehler' }));
  }, [execution]);

  // Count pending approvals for this client (for tab badge)
  // Use separate selector to avoid re-rendering entire component on every approval change
  const pendingApprovalCount = useFulfillmentStore(
    useCallback((s) => {
      if (!clientId) return 0;
      return s.approvals.filter((a) => a.clientId === clientId && a.status === 'pending').length;
    }, [clientId])
  );

  // --- Load data when tab switches ---

  const retryTab = useCallback((tab: string) => {
    setTabErrors((prev) => ({ ...prev, [tab]: false }));
    // Reset loaded state to trigger re-fetch
    if (tab === 'performance') setPerfLoaded(null);
    if (tab === 'timeline') setTimelineLoaded(null);
    if (tab === 'deliverables') setDeliverablesLoaded(null);
    if (tab === 'connections' && clientId) {
      loadedRef.current[`connections-${clientId}`] = false;
    }
    if (tab === 'links' && clientId) {
      loadedRef.current[`links-${clientId}`] = false;
    }
  }, [clientId]);

  // Performance: load from API, merge with client.kpis as fallback
  useEffect(() => {
    if (activeTab !== 'performance' || !clientId) return;
    if (perfLoaded === clientId) return;
    setPerfLoading(true);
    loadPerformance(clientId)
      .catch(() => setTabErrors((prev) => ({ ...prev, performance: true })))
      .finally(() => {
        setPerfLoading(false);
        setPerfLoaded(clientId);
      });
  }, [activeTab, clientId, loadPerformance, perfLoaded]);

  // Timeline: load from API
  useEffect(() => {
    if (activeTab !== 'timeline' || !clientId) return;
    if (timelineLoaded === clientId) return;
    setTimelineLoading(true);
    loadTimeline(clientId)
      .catch(() => setTabErrors((prev) => ({ ...prev, timeline: true })))
      .finally(() => {
        setTimelineLoading(false);
        setTimelineLoaded(clientId);
      });
  }, [activeTab, clientId, loadTimeline, timelineLoaded]);

  // Deliverables: load from API
  useEffect(() => {
    if (activeTab !== 'deliverables' || !clientId) return;
    if (deliverablesLoaded === clientId) return;
    setDeliverablesLoading(true);
    loadDeliverables(clientId)
      .catch(() => setTabErrors((prev) => ({ ...prev, deliverables: true })))
      .finally(() => {
        setDeliverablesLoading(false);
        setDeliverablesLoaded(clientId);
      });
  }, [activeTab, clientId, loadDeliverables, deliverablesLoaded]);

  // Connections: load execution context from API
  useEffect(() => {
    if (activeTab !== 'connections' || !clientId) return;
    if (loadedRef.current[`connections-${clientId}`]) return;
    setConnectionsLoading(true);
    api.clientExecution.get(clientId)
      .then((execStatus) => {
        loadedRef.current[`connections-${clientId}`] = true;

        // Map execution context to ClientConnection[]
        const ctx = execStatus.context || {};
        const conns: ClientConnection[] = [
          {
            service: 'close',
            label: 'Close CRM',
            icon: 'close',
            status: ctx.close_lead_url ? 'connected' : 'disconnected',
            externalUrl: (ctx.close_lead_url as string) || undefined,
          },
          {
            service: 'google_drive',
            label: 'Google Drive',
            icon: 'google_drive',
            status: ctx.drive_folder_url ? 'connected' : 'disconnected',
            externalUrl: (ctx.drive_folder_url as string) || undefined,
          },
          {
            service: 'slack',
            label: 'Slack',
            icon: 'slack',
            status: ctx.channel_name ? 'connected' : 'disconnected',
            accountName: (ctx.channel_name as string) || undefined,
            externalUrl: ctx.channel_name
              ? `https://flowstack.slack.com/channels/${(ctx.channel_name as string).replace('#', '')}`
              : undefined,
          },
          {
            service: 'clickup',
            label: 'ClickUp',
            icon: 'clickup',
            status: ctx.clickup_list_url ? 'connected' : 'disconnected',
            externalUrl: (ctx.clickup_list_url as string) || undefined,
          },
          {
            service: 'google_meet',
            label: 'Google Meet',
            icon: 'google_meet',
            status: ctx.meet_link ? 'connected' : 'disconnected',
            externalUrl: (ctx.meet_link as string) || undefined,
          },
          {
            service: 'meta',
            label: 'Meta Ads Manager',
            icon: 'meta',
            status: ctx.meta_campaigns && typeof ctx.meta_campaigns === 'object' && Object.keys(ctx.meta_campaigns as object).length > 0
              ? 'connected'
              : ctx.campaign_id ? 'connected' : 'disconnected',
          },
          {
            service: 'google_sheets',
            label: 'Google Sheets',
            icon: 'google_sheets',
            status: ctx.overview_sheet_url ? 'connected' : 'disconnected',
            externalUrl: (ctx.overview_sheet_url as string) || undefined,
          },
        ];
        setApiConnections(conns);
      })
      .catch((err) => {
        console.warn('[ClientDetail] Execution-Context laden fehlgeschlagen:', err);
        // Keep null so we fall back to client.connections
      })
      .finally(() => {
        setConnectionsLoading(false);
      });
  }, [activeTab, clientId]);

  // Links: load execution context from API
  useEffect(() => {
    if (activeTab !== 'links' || !clientId) return;
    if (loadedRef.current[`links-${clientId}`]) return;
    setLinksLoading(true);
    api.clientExecution.get(clientId)
      .then((execStatus) => {
        loadedRef.current[`links-${clientId}`] = true;
        setLinksContext(execStatus.context || {});
      })
      .catch((err) => {
        console.warn('[ClientDetail] Links-Context laden fehlgeschlagen:', err);
        setLinksContext(null);
      })
      .finally(() => {
        setLinksLoading(false);
      });
  }, [activeTab, clientId]);

  // Build merged KPIs: API performance data merged over client.kpis
  const client = clientId ? getClient(clientId) : undefined;

  const mergedKpis = useMemo((): ClientKpis | undefined => {
    // If API data is available, map it into ClientKpis shape
    if (clientPerformance?.summary) {
      const s = clientPerformance.summary;
      const base: ClientKpis = {
        impressions: s.impressions ?? 0,
        clicks: s.clicks ?? 0,
        spend: s.spend ?? 0,
        leads: s.leads ?? 0,
        ctr: s.ctr ?? 0,
        cpl: s.cpl ?? 0,
      };
      // Keep any extra fields from client.kpis (funnel data, daily series, etc.)
      if (client?.kpis) {
        return { ...client.kpis, ...base };
      }
      return base;
    }
    // Fallback to mock/client data
    return client?.kpis;
  }, [clientPerformance, client?.kpis]);

  const handleDeleteClient = useCallback(async () => {
    if (!clientId) return;
    setIsDeleting(true);
    try {
      await deleteClient(clientId);
      setDeleteConfirmOpen(false);
      notify({
        id: `delete-${Date.now()}`,
        type: 'success',
        title: t('toast.clientDeleted'),
        message: client?.company,
      });
      navigate('/kunden-hub/clients');
    } catch (err) {
      console.error('[ClientDetail] Löschen fehlgeschlagen:', err);
      notify({
        id: `delete-err-${Date.now()}`,
        type: 'error',
        title: t('toast.deleteFailed'),
        message: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setIsDeleting(false);
    }
  }, [clientId, client?.company, deleteClient, navigate, notify, t]);

  // Loading state: clients haven't loaded yet
  if (clients.length === 0) {
    return (
      <>
        <PageMeta title={t('loading.title') + ' | Kunden Hub'} description="" />
        <div className="flex flex-col items-center justify-center py-20">
          <svg className="h-10 w-10 animate-spin text-brand-500 mb-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('loading.title')}</p>
        </div>
      </>
    );
  }

  if (!client) {
    return (
      <>
        <PageMeta title={t('client.notFound') + ' | Kunden Hub'} description="" />
        <div className="flex flex-col items-center justify-center py-20">
          <svg className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          <p className="text-lg font-medium text-gray-800 dark:text-white/90">{t('client.notFound')}</p>
          <Button size="sm" variant="outline" onClick={() => navigate('/kunden-hub/clients')} className="mt-4">
            {t('client.back')}
          </Button>
        </div>
      </>
    );
  }

  const tabs: { key: Tab; labelKey: string }[] = [
    { key: 'pipeline', labelKey: 'client.pipeline' },
    { key: 'deliverables', labelKey: 'client.deliverables' },
    { key: 'notes', labelKey: 'client.notes' },
    { key: 'performance', labelKey: 'client.performance' },
    { key: 'connections', labelKey: 'client.connections' },
    { key: 'links', labelKey: 'client.links' },
    { key: 'timeline', labelKey: 'client.timeline' },
    ...(failedNodes.length > 0 ? [{ key: 'errors' as Tab, labelKey: 'client.errors' }] : []),
  ];

  const execCtx = execution?.context || {};

  const quickLinks: { url?: string; label: string; icon: React.ReactNode }[] = [
    {
      url: client.driveFolderUrl || (execCtx.drive_folder_url as string) || undefined,
      label: 'Drive',
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
      ),
    },
    {
      url: client.slackChannel
        ? `https://flowstack.slack.com/channels/${client.slackChannel.replace('#', '')}`
        : (execCtx.channel_name as string)
          ? `https://flowstack.slack.com/channels/${(execCtx.channel_name as string).replace('#', '')}`
          : undefined,
      label: 'Slack',
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
    },
    {
      url: client.closeLeadUrl || (execCtx.close_lead_url as string) || undefined,
      label: 'Close',
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
        </svg>
      ),
    },
    {
      url: (execCtx.clickup_list_url as string) || undefined,
      label: 'ClickUp',
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
    },
    {
      url: (execCtx.meet_link as string) || undefined,
      label: 'Meet',
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      url: (execCtx.miro_board_url as string) || undefined,
      label: 'Miro',
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 3v18M15 3v18" />
        </svg>
      ),
    },
  ];

  return (
    <>
      <PageMeta
        title={`${client.company} | Kunden Hub`}
        description={`${t('client.pipeline')} - ${client.company}`}
      />
      <PageBreadcrumb pageTitle={client.company} />

      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/kunden-hub/clients')}
          className="mb-4 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          {t('client.back')}
        </button>

        <div className="flex flex-wrap items-center gap-4">
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">
            {client.company}
          </h1>
          <StatusBadge status={client.status} />
          <div className="flex items-center gap-2 ml-auto">
            {quickLinks.map((link) => (
              <button
                key={link.label}
                title={link.url ? link.label : `${link.label} — noch nicht erstellt`}
                onClick={() => link.url && window.open(link.url, '_blank')}
                disabled={!link.url}
                className={`flex h-8 w-8 items-center justify-center rounded-lg border transition ${
                  link.url
                    ? 'border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200 cursor-pointer'
                    : 'border-gray-100 text-gray-300 dark:border-gray-800 dark:text-gray-600 cursor-default opacity-40'
                }`}
              >
                {link.icon}
              </button>
            ))}
            {clientId && <ReportButton clientId={clientId} />}
            <button
              title={t('delete.confirmTitle')}
              onClick={() => setDeleteConfirmOpen(true)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 text-red-400 hover:bg-red-50 hover:text-red-600 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/30 dark:hover:text-red-300 transition"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Tab triggers */}
      <div className="mb-6 flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`relative rounded-full px-4 py-2 text-sm font-medium transition ${
              activeTab === tab.key
                ? 'bg-brand-500 text-white'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            {t(tab.labelKey)}
            {tab.key === 'deliverables' && pendingApprovalCount > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-orange-500 px-1 text-[10px] font-bold text-white leading-none">
                {pendingApprovalCount}
              </span>
            )}
            {tab.key === 'errors' && failedNodes.length > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-error-500 px-1 text-[10px] font-bold text-white leading-none">
                {failedNodes.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'pipeline' && clientId && (
        <PipelineDetail clientId={clientId} />
      )}

      {activeTab === 'deliverables' && clientId && (
        <div className="overflow-x-hidden max-w-full">
          {tabErrors.deliverables ? (
            <TabErrorCard tab="deliverables" onRetry={retryTab} />
          ) : (
            <>
              {deliverablesLoading && (
                <div className="flex items-center gap-2 mb-3">
                  <svg className="h-4 w-4 animate-spin text-brand-500" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span className="text-xs text-gray-400">{t('loading.title')}</span>
                </div>
              )}
              <ContentReviewPanel clientId={clientId} />
            </>
          )}
        </div>
      )}

      {activeTab === 'notes' && clientId && (
        <NotesTab clientId={clientId} />
      )}

      {activeTab === 'performance' && (
        <>
          {tabErrors.performance ? (
            <TabErrorCard tab="performance" onRetry={retryTab} />
          ) : perfLoading ? (
            <div className="flex items-center justify-center py-10">
              <svg className="h-8 w-8 animate-spin text-brand-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          ) : (
            <PerformanceTab kpis={mergedKpis} branche={client.branche} t={t} performanceData={clientPerformance} />
          )}
        </>
      )}

      {activeTab === 'connections' && (
        <>
          {tabErrors.connections ? (
            <TabErrorCard tab="connections" onRetry={retryTab} />
          ) : connectionsLoading ? (
            <div className="flex items-center justify-center py-10">
              <svg className="h-8 w-8 animate-spin text-brand-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          ) : (
            <ConnectionsGrid connections={apiConnections ?? client.connections ?? []} />
          )}
        </>
      )}

      {activeTab === 'links' && clientId && (
        <>
          {linksLoading && (
            <div className="flex items-center justify-center py-10">
              <svg className="h-8 w-8 animate-spin text-brand-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          )}
          {!linksLoading && (
            <LinksTab context={linksContext} t={t} />
          )}
        </>
      )}

      {activeTab === 'timeline' && clientId && (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          {timelineLoading && (
            <div className="flex items-center gap-2 mb-3">
              <svg className="h-4 w-4 animate-spin text-brand-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span className="text-xs text-gray-400">{t('loading.title')}</span>
            </div>
          )}
          {!timelineLoading && timelineLoaded === clientId && (
            <div className="flex items-center gap-2 mb-3">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Live</span>
            </div>
          )}
          <TimelineView clientId={clientId} />
        </div>
      )}

      {activeTab === 'errors' && (
        <ErrorsTab alerts={failedNodes} t={t} />
      )}

      {/* Delete Client Confirmation Modal */}
      <Modal isOpen={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)} className="max-w-md p-6 sm:p-8">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-2">
          {t('delete.confirmTitle')}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          {t('delete.confirmText', { company: client?.company ?? '' })}
        </p>
        <div className="flex justify-end gap-3">
          <Button size="sm" variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
            {t('action.cancel')}
          </Button>
          <Button
            size="sm"
            variant="primary"
            className="!bg-error-500 hover:!bg-error-600"
            onClick={handleDeleteClient}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <span className="flex items-center gap-1.5">
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                {t('loading.title')}
              </span>
            ) : (
              t('delete.confirm')
            )}
          </Button>
        </div>
      </Modal>
    </>
  );
}

// Errors tab — groups failed nodes by root cause
function ErrorsTab({ alerts, t }: { alerts: { id: string; error: string }[]; t: (key: string, params?: Record<string, string | number>) => string }) {
  const grouped = useMemo(() => {
    const map = new Map<string, { count: number; nodes: string[] }>();
    for (const a of alerts) {
      let cause = a.error;
      if (cause.includes('Google Token nicht konfiguriert')) cause = 'Google Token nicht konfiguriert';
      else if (cause.includes('Authentication failed')) cause = 'Authentication failed';
      else if (cause.includes('Illegal header value')) cause = 'Ungültiger API-Token';
      else if (cause.includes('Not found: act_')) cause = 'Meta Ad Account nicht konfiguriert';
      else if (cause.includes('Provide valid app ID')) cause = 'Meta App ID ungültig';
      else if (cause.includes('OAUTH_017')) cause = 'ClickUp Autorisierung fehlt';

      const existing = map.get(cause);
      if (existing) { existing.count++; existing.nodes.push(a.id); }
      else map.set(cause, { count: 1, nodes: [a.id] });
    }
    return [...map.entries()].sort((a, b) => b[1].count - a[1].count);
  }, [alerts]);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100 dark:border-gray-800">
        <svg className="h-5 w-5 text-error-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
        <h3 className="text-base font-medium text-gray-800 dark:text-white/90">
          {t('alert.failedNodes', { count: alerts.length })}
        </h3>
      </div>

      {/* Grouped errors */}
      <div className="divide-y divide-gray-100 dark:divide-gray-800">
        {grouped.map(([cause, { count, nodes }]) => (
          <div key={cause} className="px-6 py-4 flex items-start gap-4">
            <span className="inline-flex items-center justify-center min-w-[28px] h-[28px] rounded-lg bg-error-50 dark:bg-error-500/10 px-2 text-xs font-bold text-error-600 dark:text-error-400 shrink-0">
              {count}x
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">{cause}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 break-all">
                {nodes.join(', ')}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Performance tab - complete with funnel visualization, trend charts, insights
function PerformanceTab({ kpis, branche, t, performanceData }: { kpis?: import('../data/types').ClientKpis; branche?: string; t: (key: string, params?: Record<string, string | number>) => string; performanceData?: PerformanceData | null }) {
  const [selectedPlatform, setSelectedPlatform] = useState<string>('gesamt');

  const inferredFunnel = kpis?.funnelType ?? (branche?.toLowerCase().includes('recruit') ? 'recruiting' : 'kundengewinnung');
  const [selectedFunnel, setSelectedFunnel] = useState<string>(inferredFunnel);

  const activeKpis = useMemo(() => {
    if (!kpis) return null;
    if (selectedPlatform === 'gesamt' || !kpis.platformData?.[selectedPlatform]) return kpis;
    return kpis.platformData[selectedPlatform];
  }, [kpis, selectedPlatform]);

  const metrics = useMemo(() => {
    if (!activeKpis) return [];
    const isRecruiting = selectedFunnel === 'recruiting';
    return [
      { label: t('table.spend'), value: `${(activeKpis.spend ?? 0).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}`, color: 'text-brand-500' },
      { label: isRecruiting ? t('perf.stageApplications') : t('perf.stageLeads'), value: (activeKpis.leads ?? 0).toString(), color: 'text-success-500' },
      { label: 'CPL', value: `${(activeKpis.cpl ?? 0).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}`, color: 'text-warning-500' },
      { label: t('table.impressions'), value: (activeKpis.impressions ?? 0).toLocaleString('de-DE'), color: 'text-gray-600' },
      { label: t('table.clicks'), value: (activeKpis.clicks ?? 0).toLocaleString('de-DE'), color: 'text-gray-600' },
      { label: 'CTR', value: `${(activeKpis.ctr ?? 0).toFixed(2)}%`, color: 'text-success-400' },
    ];
  }, [activeKpis, selectedFunnel, t]);

  // Funnel stages
  const funnelStages = useMemo(() => {
    if (!kpis) return [];
    if (selectedFunnel === 'recruiting') {
      return [
        { label: t('perf.stageImpressions'), value: kpis.impressions ?? 0, cost: null },
        { label: t('perf.stageClicks'), value: kpis.clicks ?? 0, cost: null },
        { label: t('perf.stageApplications'), value: kpis.leads ?? 0, cost: kpis.costPerApplication ?? kpis.cpl },
        { label: t('perf.stageQualified'), value: kpis.qualifiedApplicants ?? 0, cost: kpis.spend && kpis.qualifiedApplicants ? kpis.spend / kpis.qualifiedApplicants : null },
        { label: t('perf.stageInterviews'), value: kpis.interviews ?? 0, cost: kpis.costPerInterview ?? null },
        { label: t('perf.stageHires'), value: kpis.hires ?? 0, cost: kpis.costPerHire ?? null },
      ];
    }
    return [
      { label: t('perf.stageImpressions'), value: kpis.impressions ?? 0, cost: null },
      { label: t('perf.stageClicks'), value: kpis.clicks ?? 0, cost: null },
      { label: t('perf.stageLeads'), value: kpis.leads ?? 0, cost: kpis.cpl },
      { label: t('perf.stageQualifiedLeads'), value: kpis.qualifiedLeads ?? 0, cost: kpis.costPerQualifiedLead ?? null },
      { label: t('perf.stageAppointments'), value: kpis.bookedAppointments ?? 0, cost: kpis.costPerAppointment ?? null },
      { label: t('perf.stageDeals'), value: kpis.closedDeals ?? 0, cost: kpis.costPerDeal ?? null },
    ];
  }, [kpis, selectedFunnel, t]);

  // Aggregate daily data by date (from API daily array)
  const aggregatedDaily = useMemo(() => {
    if (!performanceData?.daily || performanceData.daily.length === 0) return null;
    const byDate = new Map<string, { spend: number; leads: number; impressions: number; clicks: number }>();
    for (const entry of performanceData.daily) {
      const existing = byDate.get(entry.date);
      if (existing) {
        existing.spend += entry.spend;
        existing.leads += entry.leads;
        existing.impressions += entry.impressions;
        existing.clicks += entry.clicks;
      } else {
        byDate.set(entry.date, { spend: entry.spend, leads: entry.leads, impressions: entry.impressions, clicks: entry.clicks });
      }
    }
    // Sort by date ascending
    return [...byDate.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [performanceData]);

  // Chart date labels — from real data if available, otherwise generate 30 synthetic labels
  const dateLabels = useMemo(() => {
    if (aggregatedDaily) {
      return aggregatedDaily.map(([date]) => {
        const d = new Date(date);
        return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
      });
    }
    return Array.from({ length: 30 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (29 - i));
      return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
    });
  }, [aggregatedDaily]);

  // CPL chart — use real daily data if available
  const cplData = useMemo(() => {
    if (aggregatedDaily) {
      return aggregatedDaily.map(([, agg]) => {
        if (agg.leads > 0) return parseFloat((agg.spend / agg.leads).toFixed(2));
        return 0;
      });
    }
    if (kpis?.dailyCpl) return kpis.dailyCpl;
    const base = kpis?.cpl ?? 80;
    return Array.from({ length: 30 }, (_, i) => {
      const seed = Math.sin(i * 127.1 + 311.7) * 43758.5453;
      return Math.round(base + ((seed - Math.floor(seed)) - 0.5) * 40);
    });
  }, [aggregatedDaily, kpis]);

  // Leads chart data — use real daily data if available
  const leadsData = useMemo(() => {
    if (aggregatedDaily) {
      return aggregatedDaily.map(([, agg]) => agg.leads);
    }
    return null;
  }, [aggregatedDaily]);

  const crData = useMemo(() => {
    if (aggregatedDaily) {
      return aggregatedDaily.map(([, agg]) => {
        if (agg.clicks > 0) return parseFloat(((agg.leads / agg.clicks) * 100).toFixed(2));
        return 0;
      });
    }
    if (kpis?.dailyConversionRate) return kpis.dailyConversionRate;
    const base = kpis && kpis.clicks > 0 ? (kpis.leads / kpis.clicks) * 100 : 1.5;
    return Array.from({ length: 30 }, (_, i) => {
      const seed = Math.sin(i * 83.3 + 217.1) * 43758.5453;
      return parseFloat((base + ((seed - Math.floor(seed)) - 0.5) * 0.8).toFixed(2));
    });
  }, [aggregatedDaily, kpis]);

  const cplOptions: ApexOptions = useMemo(() => ({
    chart: { type: 'area' as const, toolbar: { show: false }, fontFamily: 'inherit' },
    stroke: { curve: 'smooth' as const, width: 2 },
    fill: { type: 'gradient' as const, gradient: { opacityFrom: 0.35, opacityTo: 0.05 } },
    colors: ['#465fff'],
    xaxis: { categories: dateLabels, labels: { style: { fontSize: '10px' }, rotate: -45, hideOverlappingLabels: true }, tickAmount: 8 },
    yaxis: { min: 0, labels: { formatter: (v: number) => `${v}\u20AC` } },
    grid: { borderColor: '#e5e7eb', strokeDashArray: 4 },
    tooltip: { theme: 'dark' as const, y: { formatter: (v: number) => `${v.toFixed(2)}\u20AC` } },
    dataLabels: { enabled: false },
  }), [dateLabels]);

  const crOptions: ApexOptions = useMemo(() => ({
    chart: { type: 'area' as const, toolbar: { show: false }, fontFamily: 'inherit' },
    stroke: { curve: 'smooth' as const, width: 2 },
    fill: { type: 'gradient' as const, gradient: { opacityFrom: 0.35, opacityTo: 0.05 } },
    colors: ['#22c55e'],
    xaxis: { categories: dateLabels, labels: { style: { fontSize: '10px' }, rotate: -45, hideOverlappingLabels: true }, tickAmount: 8 },
    yaxis: { min: 0, labels: { formatter: (v: number) => `${v.toFixed(1)}%` } },
    grid: { borderColor: '#e5e7eb', strokeDashArray: 4 },
    tooltip: { theme: 'dark' as const, y: { formatter: (v: number) => `${v.toFixed(2)}%` } },
    dataLabels: { enabled: false },
  }), [dateLabels]);

  // Leads chart options (only shown when real daily data is available)
  const leadsOptions: ApexOptions = useMemo(() => ({
    chart: { type: 'bar' as const, toolbar: { show: false }, fontFamily: 'inherit' },
    colors: ['#22c55e'],
    plotOptions: { bar: { borderRadius: 4, columnWidth: '60%' } },
    xaxis: { categories: dateLabels, labels: { style: { fontSize: '10px' }, rotate: -45, hideOverlappingLabels: true }, tickAmount: 8 },
    yaxis: { min: 0, labels: { formatter: (v: number) => `${Math.round(v)}` } },
    grid: { borderColor: '#e5e7eb', strokeDashArray: 4 },
    tooltip: { theme: 'dark' as const, y: { formatter: (v: number) => `${v} Leads` } },
    dataLabels: { enabled: false },
  }), [dateLabels]);

  const cplSeries = useMemo(() => [{ name: t('perf.cplOverTime'), data: cplData }], [cplData, t]);
  const leadsSeries = useMemo(() => leadsData ? [{ name: t('perf.leadsOverTime'), data: leadsData }] : null, [leadsData, t]);
  const crSeries = useMemo(() => [{ name: t('perf.conversionRate'), data: crData }], [crData, t]);

  // Campaign breakdown rows from API data
  const campaignBreakdownRows = useMemo(() => {
    if (!performanceData?.campaigns_breakdown) return [];
    const labels: Record<string, string> = {
      initial: t('perf.campaignInitial'),
      retargeting: t('perf.campaignRetargeting'),
      warmup: t('perf.campaignWarmup'),
    };
    return Object.entries(performanceData.campaigns_breakdown)
      .filter(([, data]) => data && Object.keys(data).length > 0)
      .map(([key, data]) => ({
        label: labels[key] || key,
        impressions: Number(data.impressions ?? 0),
        clicks: Number(data.clicks ?? 0),
        spend: Number(data.spend ?? 0),
        leads: Number(data.leads ?? 0),
        ctr: Number(data.ctr ?? (Number(data.impressions ?? 0) > 0 ? (Number(data.clicks ?? 0) / Number(data.impressions ?? 1)) * 100 : 0)),
        cpl: Number(data.cpl ?? (Number(data.leads ?? 0) > 0 ? Number(data.spend ?? 0) / Number(data.leads ?? 1) : 0)),
      }));
  }, [performanceData, t]);

  // Insights
  const insights = useMemo(() => {
    if (!kpis?.platformData) return [];
    const platforms = Object.entries(kpis.platformData);
    if (platforms.length === 0) return [];
    const best = platforms.reduce((a, b) => (a[1].cpl < b[1].cpl ? a : b));
    const overallCr = kpis.clicks > 0 ? ((kpis.leads / kpis.clicks) * 100).toFixed(1) : '0.0';
    const result: { label: string; value: string; color: string }[] = [
      { label: t('perf.bestPlatform'), value: `${best[0].charAt(0).toUpperCase() + best[0].slice(1)} (CPL ${best[1].cpl.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })})`, color: 'text-success-500' },
      { label: t('perf.conversionRate'), value: `${overallCr}%`, color: 'text-brand-500' },
    ];
    if (selectedFunnel === 'recruiting' && kpis.costPerHire) {
      result.push({ label: t('perf.costPerHire'), value: kpis.costPerHire.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' }), color: 'text-warning-500' });
    }
    if (selectedFunnel === 'kundengewinnung' && kpis.costPerDeal) {
      result.push({ label: t('perf.costPerDeal'), value: kpis.costPerDeal.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' }), color: 'text-warning-500' });
    }
    if (kpis.customerLifetimeValue && kpis.costPerDeal) {
      result.push({ label: t('perf.ltvRatio'), value: `${(kpis.customerLifetimeValue / kpis.costPerDeal).toFixed(1)}x`, color: parseFloat((kpis.customerLifetimeValue / kpis.costPerDeal).toFixed(1)) >= 3 ? 'text-success-500' : 'text-warning-500' });
    }
    return result;
  }, [kpis, selectedFunnel, t]);

  // Early return AFTER all hooks
  if (!kpis) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50 py-16 dark:border-gray-700 dark:bg-gray-800/30">
        <svg className="h-10 w-10 text-gray-300 dark:text-gray-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
        </svg>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('misc.noPerformanceData')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Platform pills + Funnel type */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'gesamt', label: t('perf.total') },
            { key: 'meta', label: 'Meta' },
            { key: 'google', label: 'Google' },
            { key: 'linkedin', label: 'LinkedIn' },
            { key: 'tiktok', label: 'TikTok' },
          ].map((p) => (
            <button key={p.key} onClick={() => setSelectedPlatform(p.key)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${selectedPlatform === p.key ? 'bg-brand-500 text-white' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800'}`}
            >{p.label}</button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">{t('perf.funnelType')}:</span>
          <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            {[
              { key: 'recruiting', label: t('perf.funnelRecruiting') },
              { key: 'kundengewinnung', label: t('perf.funnelKundengewinnung') },
            ].map((f) => (
              <button key={f.key} onClick={() => setSelectedFunnel(f.key)}
                className={`px-3 py-1.5 text-xs font-medium transition ${selectedFunnel === f.key ? 'bg-brand-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'}`}
              >{f.label}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Ad KPI cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        {metrics.map((m) => (
          <div key={m.label} className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">{m.label}</p>
            <p className={`text-lg font-semibold ${m.color}`}>{m.value}</p>
          </div>
        ))}
      </div>

      {/* Conversion Funnel */}
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800">
          <h3 className="text-base font-medium text-gray-800 dark:text-white/90">{t('perf.conversionFunnel')}</h3>
        </div>
        <div className="p-6 space-y-2.5">
          {funnelStages.map((stage, i) => {
            const maxVal = funnelStages[0]?.value || 1;
            const pct = Math.max((stage.value / maxVal) * 100, 6);
            const prev = i > 0 ? funnelStages[i - 1].value : stage.value;
            const stepCr = i > 0 && prev > 0 ? ((stage.value / prev) * 100).toFixed(1) : null;
            const totalCr = i > 0 && maxVal > 0 ? ((stage.value / maxVal) * 100).toFixed(2) : null;
            const barColors = ['from-blue-500 to-blue-400', 'from-blue-500 to-blue-400', 'from-indigo-500 to-indigo-400', 'from-violet-500 to-violet-400', 'from-purple-500 to-purple-400', 'from-emerald-500 to-emerald-400'];
            return (
              <div key={stage.label} className="flex items-center gap-3">
                <div className="w-36 shrink-0 text-right pr-2">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 leading-tight">{stage.label}</p>
                  {stage.cost != null && <p className="text-[10px] text-gray-400">{stage.cost.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</p>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`h-9 rounded-lg bg-gradient-to-r ${barColors[i] ?? barColors[0]} flex items-center justify-end pr-3 transition-all duration-700`} style={{ width: `${pct}%` }}>
                    <span className="text-xs font-bold text-white drop-shadow-sm">{stage.value.toLocaleString('de-DE')}</span>
                  </div>
                </div>
                <div className="w-24 shrink-0 text-left">
                  {stepCr && (
                    <>
                      <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">{stepCr}%</p>
                      <p className="text-[10px] text-gray-400">{totalCr}% gesamt</p>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Key Insights */}
      {insights.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {insights.map((ins) => (
            <div key={ins.label} className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">{ins.label}</p>
              <p className={`text-lg font-semibold ${ins.color}`}>{ins.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Charts side by side */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
            <h3 className="text-sm font-medium text-gray-800 dark:text-white/90">{t('perf.cplOverTime')}</h3>
            <p className="text-[11px] text-gray-400">{aggregatedDaily ? `${aggregatedDaily.length} Tage` : t('perf.last30Days')}</p>
          </div>
          <div className="p-4 sm:p-5">
            <Suspense fallback={<div className="h-[240px]" />}>
              <Chart options={cplOptions} series={cplSeries} type="area" height={240} />
            </Suspense>
          </div>
        </div>
        {leadsSeries ? (
          <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
              <h3 className="text-sm font-medium text-gray-800 dark:text-white/90">{t('perf.leadsOverTime')}</h3>
              <p className="text-[11px] text-gray-400">{aggregatedDaily ? `${aggregatedDaily.length} Tage` : t('perf.last30Days')}</p>
            </div>
            <div className="p-4 sm:p-5">
              <Suspense fallback={<div className="h-[240px]" />}>
                <Chart options={leadsOptions} series={leadsSeries} type="bar" height={240} />
              </Suspense>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
              <h3 className="text-sm font-medium text-gray-800 dark:text-white/90">{t('perf.conversionOverTime')}</h3>
              <p className="text-[11px] text-gray-400">{t('perf.last30Days')}</p>
            </div>
            <div className="p-4 sm:p-5">
              <Suspense fallback={<div className="h-[240px]" />}>
                <Chart options={crOptions} series={crSeries} type="area" height={240} />
              </Suspense>
            </div>
          </div>
        )}
      </div>

      {/* Conversion Rate chart (shown as third chart when leads chart is present) */}
      {leadsSeries && (
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
            <h3 className="text-sm font-medium text-gray-800 dark:text-white/90">{t('perf.conversionOverTime')}</h3>
            <p className="text-[11px] text-gray-400">{aggregatedDaily ? `${aggregatedDaily.length} Tage` : t('perf.last30Days')}</p>
          </div>
          <div className="p-4 sm:p-5">
            <Suspense fallback={<div className="h-[240px]" />}>
              <Chart options={crOptions} series={crSeries} type="area" height={240} />
            </Suspense>
          </div>
        </div>
      )}

      {/* Campaign Breakdown Table */}
      {campaignBreakdownRows.length > 0 && (
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800">
            <h3 className="text-base font-medium text-gray-800 dark:text-white/90">{t('perf.campaignBreakdown')}</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">{t('perf.campaign')}</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">{t('table.impressions')}</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">{t('table.clicks')}</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">{t('table.ctr')}</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">{t('table.spend')}</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">{t('table.leads')}</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">{t('table.cpl')}</th>
                </tr>
              </thead>
              <tbody>
                {campaignBreakdownRows.map((row) => (
                  <tr key={row.label} className="border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition">
                    <td className="px-6 py-3 font-medium text-gray-800 dark:text-white/90">{row.label}</td>
                    <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-300">{row.impressions.toLocaleString('de-DE')}</td>
                    <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-300">{row.clicks.toLocaleString('de-DE')}</td>
                    <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-300">{row.ctr.toFixed(2)}%</td>
                    <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-300">{row.spend.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</td>
                    <td className="px-4 py-3 text-right font-medium text-success-500">{row.leads}</td>
                    <td className="px-6 py-3 text-right font-medium text-warning-500">{row.cpl.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// Links tab - shows all external URLs from execution context
interface LinkItem {
  title: string;
  url: string;
  icon: React.ReactNode;
}

interface LinkGroup {
  category: string;
  links: LinkItem[];
}

function LinksTab({ context, t }: { context: Record<string, unknown> | null; t: (key: string) => string }) {
  if (!context || Object.keys(context).length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50 py-16 dark:border-gray-700 dark:bg-gray-800/30">
        <svg className="h-10 w-10 text-gray-300 dark:text-gray-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-2.06a4.5 4.5 0 00-1.242-7.244l-4.5-4.5a4.5 4.5 0 00-6.364 6.364L4.34 8.832" />
        </svg>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('links.noLinks')}</p>
        <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">{t('links.noLinksDesc')}</p>
      </div>
    );
  }

  // Icon components
  const iconCrm = (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
    </svg>
  );
  const iconFolder = (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
    </svg>
  );
  const iconChat = (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  );
  const iconTask = (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  );
  const iconVideo = (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  );
  const iconSheet = (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  );
  const iconDoc = (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  );
  const iconAd = (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
    </svg>
  );
  const iconGlobe = (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
    </svg>
  );

  // Build link groups
  const groups: LinkGroup[] = [];

  // Infrastructure
  const infraLinks: LinkItem[] = [];
  if (context.close_lead_url) infraLinks.push({ title: t('links.closeLead'), url: context.close_lead_url as string, icon: iconCrm });
  if (context.drive_folder_url) infraLinks.push({ title: t('links.driveFolder'), url: context.drive_folder_url as string, icon: iconFolder });
  if (context.channel_name) {
    const ch = (context.channel_name as string).replace('#', '');
    infraLinks.push({ title: t('links.slackChannel'), url: `https://flowstack.slack.com/channels/${ch}`, icon: iconChat });
  }
  if (context.clickup_list_url) infraLinks.push({ title: t('links.clickupProject'), url: context.clickup_list_url as string, icon: iconTask });
  if (context.meet_link) infraLinks.push({ title: t('links.kickoffMeet'), url: context.meet_link as string, icon: iconVideo });
  if (context.overview_sheet_url) infraLinks.push({ title: t('links.overviewSheet'), url: context.overview_sheet_url as string, icon: iconSheet });
  if (context.miro_board_url) infraLinks.push({ title: 'Miro Board', url: context.miro_board_url as string, icon: iconGlobe });
  if (infraLinks.length > 0) groups.push({ category: t('links.infrastructure'), links: infraLinks });

  // Documents — map keys to proper titles
  const docLinks: LinkItem[] = [];
  const DOC_TITLES: Record<string, string> = {
    zielgruppen_avatar_url: 'Zielgruppen-Avatar',
    arbeitgeber_avatar_url: 'Arbeitgeber-Avatar',
    messaging_matrix_url: 'Messaging Matrix',
    creative_briefing_url: 'Creative Briefing',
    marken_richtlinien_url: 'Marken-Richtlinien',
    landingpage_texte_url: 'Landingpage-Texte',
    formularseite_texte_url: 'Formularseite-Texte',
    dankeseite_texte_url: 'Dankeseite-Texte',
    anzeigentexte_hauptkampagne_url: 'Anzeigentexte Initial',
    anzeigentexte_retargeting_url: 'Anzeigentexte Retargeting',
    anzeigentexte_warmup_url: 'Anzeigentexte Warmup',
    videoskript_url: 'Videoskript',
  };
  if (context.generated_docs && typeof context.generated_docs === 'object') {
    const docs = context.generated_docs as Record<string, unknown>;
    for (const [key, val] of Object.entries(docs)) {
      if (typeof val === 'string' && val.startsWith('http')) {
        docLinks.push({ title: DOC_TITLES[key] || key.replace(/_url$/, '').replace(/_/g, ' '), url: val, icon: iconDoc });
      }
    }
  }
  if (docLinks.length > 0) groups.push({ category: t('links.documents'), links: docLinks });

  // Campaigns — meta_campaigns is a dict {initial: id, retargeting: id, warmup: id}
  const campaignLinks: LinkItem[] = [];
  const adsManagerBase = 'https://adsmanager.facebook.com/adsmanager/manage/campaigns';
  const metaCampaigns = context.meta_campaigns as Record<string, string> | undefined;
  if (metaCampaigns && typeof metaCampaigns === 'object') {
    const labels: Record<string, string> = { initial: 'TOF — Initial', retargeting: 'RT — Retargeting', warmup: 'WU — Warmup' };
    campaignLinks.push({ title: 'Meta Ads Manager', url: adsManagerBase, icon: iconAd });
    for (const [key, cid] of Object.entries(metaCampaigns)) {
      if (cid) {
        campaignLinks.push({ title: labels[key] || key, url: `${adsManagerBase}?act=${(context.meta_ad_account as string || '').replace('act_', '')}&campaign_ids=${cid}`, icon: iconAd });
      }
    }
  } else if (context.campaign_id) {
    campaignLinks.push({ title: 'Meta Ads Manager', url: adsManagerBase, icon: iconAd });
  }
  if (campaignLinks.length > 0) groups.push({ category: t('links.campaigns'), links: campaignLinks });

  // Funnel
  const funnelLinks: LinkItem[] = [];
  if (context.lp_url) funnelLinks.push({ title: t('links.landingPage'), url: context.lp_url as string, icon: iconGlobe });
  if (context.form_url) funnelLinks.push({ title: t('links.formPage'), url: context.form_url as string, icon: iconGlobe });
  if (context.thankyou_url) funnelLinks.push({ title: t('links.thankYouPage'), url: context.thankyou_url as string, icon: iconGlobe });
  if (funnelLinks.length > 0) groups.push({ category: t('links.funnel'), links: funnelLinks });

  if (groups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50 py-16 dark:border-gray-700 dark:bg-gray-800/30">
        <svg className="h-10 w-10 text-gray-300 dark:text-gray-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-2.06a4.5 4.5 0 00-1.242-7.244l-4.5-4.5a4.5 4.5 0 00-6.364 6.364L4.34 8.832" />
        </svg>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('links.noLinks')}</p>
        <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">{t('links.noLinksDesc')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <div key={group.category}>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
            {group.category}
          </h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {group.links.map((link) => (
              <a
                key={link.url}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 transition hover:border-brand-300 hover:shadow-md dark:border-gray-800 dark:bg-white/[0.03] dark:hover:border-brand-700"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-500 dark:bg-brand-500/10 dark:text-brand-400">
                  {link.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-800 dark:text-white/90">{link.title}</p>
                  <p className="truncate text-xs text-gray-400 dark:text-gray-500 group-hover:text-brand-500 dark:group-hover:text-brand-400 transition">
                    {link.url}
                  </p>
                </div>
                <div className="shrink-0">
                  <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500" title="Active" />
                </div>
              </a>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
