import { useMemo, useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { useFulfillmentStore } from '../store/fulfillment-store';
import { PIPELINE_STEPS, PHASE_CONFIG, DELIVERABLE_STATUS_CONFIG } from '../data/constants';
import PipelineProgress from './PipelineProgress';
import { api } from '../services/api';
import { useNotification } from '../contexts/NotificationContext';
import type { PipelinePhase, NodeStatus } from '../services/api';
import type { PhaseGroup, Deliverable } from '../data/types';
import { CheckCircle, Loader2, XCircle, Lock, Clock, ChevronDown, RotateCcw, Pause, Play } from 'lucide-react';

interface PipelineDetailProps {
  clientId: string;
}

const PHASE_KEYS: { key: string; phaseGroup?: PhaseGroup }[] = [
  { key: 'onboarding' },
  { key: 'strategy', phaseGroup: 'strategy' },
  { key: 'copy', phaseGroup: 'copy' },
  { key: 'funnel', phaseGroup: 'funnel' },
  { key: 'campaigns', phaseGroup: 'campaigns' },
  { key: 'review' },
  { key: 'live' },
];

// Estimated days per phase for timeline
const PHASE_DURATION_DAYS: Record<string, number> = {
  onboarding: 2,
  strategy: 2,
  copy: 1,
  funnel: 3,
  campaigns: 2,
  review: 1,
  live: 0,
};

// Node-ID to human-readable label mapping
const NODE_LABELS: Record<string, string> = {
  'v3-is02a': 'Close Lead pruefen',
  'v3-is02': 'Close Lead erstellen',
  'v3-is02-reuse': 'Close Lead wiederverwenden',
  'v3-is03': 'Slack Channel',
  'v3-is04': 'ClickUp Liste',
  'v3-is05': 'Google Meet Link',
  'v3-is06a': 'Drive Ordner pruefen',
  'v3-is06': 'Drive Ordner erstellen',
  'v3-is07': 'E-Mail Signatur',
  'v3-is08': 'Willkommens-E-Mail',
  'v3-is09': 'Kickoff-Einladung',
  'v3-is10': 'Slack Willkommen',
  'v3-is11': 'ClickUp Tasks',
  'v3-is-sheet': 'Tracking Sheet',
  'v3-st-extract': 'Bausteine extrahieren',
  'v3-st00': 'Strategie-Vorbereitung',
  'v3-st01': 'Zielgruppen-Avatar',
  'v3-st02': 'Arbeitgeber-Avatar',
  'v3-st02a': 'Avatar Upload',
  'v3-st03': 'Messaging-Matrix',
  'v3-st04': 'Creative Briefing',
  'v3-st05': 'Marken-Richtlinien',
  'v3-st-sync': 'Strategie Sync',
  'v3-st-close': 'Close Status Update',
  'v3-st-approval': 'Strategie Freigabe',
  'v3-cc01': 'Landingpage-Texte',
  'v3-cc01a': 'LP Texte Upload',
  'v3-cc01b': 'LP Texte Review',
  'v3-cc02': 'Formularseite-Texte',
  'v3-cc02a': 'Formular Upload',
  'v3-cc02b': 'Formular Review',
  'v3-cc03': 'Dankeseite-Texte',
  'v3-cc04': 'Anzeigentexte Haupt',
  'v3-cc05': 'Anzeigentexte Retargeting',
  'v3-cc06': 'Anzeigentexte Warmup',
  'v3-cc07': 'Videoskript',
  'v3-cc-brand': 'Brand Guidelines',
  'v3-cc-sync': 'Texte Sync',
  'v3-cc-close': 'Close Update Texte',
  'v3-cc-approval': 'Texte Freigabe',
  'v3-fn01': 'Landingpage erstellen',
  'v3-fn05a': 'Formularseite erstellen',
  'v3-fn10a': 'Dankeseite erstellen',
  'v3-fn10b': 'Dankeseite veroeffentlichen',
  'v3-fn-pixel': 'Pixel Integration',
  'v3-fn-screenshots': 'Funnel Screenshots',
  'v3-fn-approval': 'Funnel Freigabe',
  'v3-ca00': 'Kampagnen-Vorbereitung',
  'v3-ca01': 'Hauptkampagne erstellen',
  'v3-ca02': 'Retargeting erstellen',
  'v3-ca03': 'Warmup erstellen',
  'v3-ca04': 'Creatives hochladen',
  'v3-ca05': 'Audiences konfigurieren',
  'v3-ca06': 'Budgets setzen',
  'v3-ca07': 'Tracking pruefen',
  'v3-ca08': 'Kampagnen Review',
  'v3-ca09': 'Kampagnen aktivieren',
  'v3-ca-approval': 'Kampagnen Freigabe',
  'v3-rl-e2e': 'End-to-End Test',
  'v3-rl-url': 'URL Check',
  'v3-rl-pixel': 'Pixel Check',
  'v3-rl-policy': 'Policy Check',
  'v3-rl-activate': 'Aktivierung',
  'v3-rl-close': 'Close Go-Live',
  'v3-rl-slack': 'Slack Go-Live',
  'v3-rl-clickup': 'ClickUp Go-Live',
  'v3-rl-sheet': 'Sheet Update',
  'v3-rl-golive': 'Go-Live abschliessen',
  'v3-pl01': 'Performance Check',
  'v3-pl02': 'Lead-Qualitaet',
  'v3-pl03': 'Budget-Optimierung',
  'v3-pl05': 'Wochenbericht',
  'v3-pl06': 'KPI Dashboard',
  'v3-pl09': 'Kampagnen-Scaling',
  'v3-pl10': 'A/B Test Analyse',
  'v3-pl11': 'Creative Refresh',
  'v3-pl12': 'Monatsbericht',
  'v3-pl-winners': 'Winner Ads',
  'v3-cm08': 'Client Meeting',
};

// Phase-to-NodeIDs mapping (mirrors backend PHASE_NODES)
const PHASE_NODES: Record<string, string[]> = {
  onboarding: [
    'v3-is02a', 'v3-is02', 'v3-is02-reuse', 'v3-is03', 'v3-is04',
    'v3-is05', 'v3-is06a', 'v3-is06', 'v3-is07', 'v3-is08',
    'v3-is09', 'v3-is10', 'v3-is11', 'v3-is-sheet',
  ],
  strategy: [
    'v3-st-extract', 'v3-st00',
    'v3-st01', 'v3-st02', 'v3-st03', 'v3-st04', 'v3-st05',
    'v3-st02a', 'v3-st-sync', 'v3-st-close', 'v3-st-approval',
  ],
  copy: [
    'v3-cc01', 'v3-cc02', 'v3-cc03', 'v3-cc04', 'v3-cc05',
    'v3-cc06', 'v3-cc07', 'v3-cc01a', 'v3-cc01b', 'v3-cc02a',
    'v3-cc02b', 'v3-cc-brand', 'v3-cc-sync', 'v3-cc-close',
    'v3-cc-approval',
  ],
  funnel: [
    'v3-fn01', 'v3-fn05a', 'v3-fn10a', 'v3-fn10b',
    'v3-fn-pixel', 'v3-fn-screenshots', 'v3-fn-approval',
  ],
  campaigns: [
    'v3-ca00', 'v3-ca01', 'v3-ca02', 'v3-ca03', 'v3-ca04',
    'v3-ca05', 'v3-ca06', 'v3-ca07', 'v3-ca08', 'v3-ca09',
    'v3-ca-approval',
  ],
  review: [
    'v3-rl-e2e', 'v3-rl-url', 'v3-rl-pixel', 'v3-rl-policy',
    'v3-rl-activate', 'v3-rl-close', 'v3-rl-slack', 'v3-rl-clickup',
    'v3-rl-sheet', 'v3-rl-golive',
  ],
  live: [
    'v3-pl01', 'v3-pl02', 'v3-pl03', 'v3-pl05', 'v3-pl06',
    'v3-pl09', 'v3-pl10', 'v3-pl11', 'v3-pl12', 'v3-pl-winners',
    'v3-cm08',
  ],
};

interface PhaseInfo {
  key: string;
  phaseGroup?: PhaseGroup;
  total: number;
  completed: number;
  completionDate: string | null;
  startDate: string | null;
  durationDays: number;
  status: 'done' | 'in_progress' | 'pending';
  deliverables: Deliverable[];
}

function isDeliverableCompleted(d: Deliverable): boolean {
  return d.status === 'approved' || d.status === 'live';
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0]!;
}

function daysBetween(d1: string, d2: string): number {
  const a = new Date(d1);
  const b = new Date(d2);
  return Math.max(0, Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24)));
}

export default function PipelineDetail({ clientId }: PipelineDetailProps) {
  const { t } = useLanguage();
  const clients = useFulfillmentStore((s) => s.clients);
  const deliverables = useFulfillmentStore((s) => s.deliverables);
  const { notify } = useNotification();

  // ── V3 Live Pipeline Data ──────────────────────────────────
  const [livePhases, setLivePhases] = useState<PipelinePhase[] | null>(null);
  const [liveLoading, setLiveLoading] = useState(true);
  const [liveError, setLiveError] = useState<string | null>(null);
  const [approvingNode, setApprovingNode] = useState<string | null>(null);

  // ── Node-level expansion ──────────────────────────────────
  const [expandedPhase, setExpandedPhase] = useState<string | null>(null);
  const [executionNodes, setExecutionNodes] = useState<Record<string, NodeStatus> | null>(null);
  const [retryingNode, setRetryingNode] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [pauseLoading, setPauseLoading] = useState(false);
  const [executionId, setExecutionId] = useState<string | null>(null);

  const fetchPipeline = useCallback(async () => {
    try {
      setLiveLoading(true);
      setLiveError(null);
      const [pipelineData, execData] = await Promise.allSettled([
        api.pipeline.get(clientId),
        api.clientExecution.get(clientId),
      ]);
      if (pipelineData.status === 'fulfilled') {
        setLivePhases(pipelineData.value.phases);
      }
      if (execData.status === 'fulfilled') {
        setExecutionNodes(execData.value.nodes);
        if (execData.value.execution_id) setExecutionId(execData.value.execution_id);
        setIsPaused(!!execData.value.paused_at);
      }
    } catch {
      // Silently fall back to local data — no crash
      setLivePhases(null);
      setLiveError('V3 nicht erreichbar');
    } finally {
      setLiveLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    void fetchPipeline();
    // Poll every 8 seconds for live updates
    const interval = window.setInterval(() => { void fetchPipeline(); }, 8000);
    return () => window.clearInterval(interval);
  }, [fetchPipeline]);

  // ── Approval Gate Handler ──────────────────────────────────
  const handleApprove = useCallback(async (nodeId: string) => {
    if (approvingNode) return;
    setApprovingNode(nodeId);
    try {
      await api.approval.approve(nodeId, 'Claudio');
      notify({
        id: `approval-ok-${Date.now()}`,
        type: 'success',
        title: 'Freigabe erteilt',
        message: `Node ${nodeId} wurde freigegeben`,
      });
      // Re-fetch pipeline after approval
      void fetchPipeline();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Freigabe fehlgeschlagen';
      notify({
        id: `approval-err-${Date.now()}`,
        type: 'error',
        title: 'Freigabe fehlgeschlagen',
        message: msg,
      });
    } finally {
      setApprovingNode(null);
    }
  }, [approvingNode, fetchPipeline, notify]);

  // ── Node Retry Handler ──────────────────────────────────
  const handleRetry = useCallback(async (nodeId: string) => {
    if (retryingNode) return;
    setRetryingNode(nodeId);
    try {
      // Find execution_id from context
      const execData = await api.clientExecution.get(clientId);
      if (!execData?.execution_id) throw new Error('Keine aktive Execution');
      await api.execution.executeNode(execData.execution_id, nodeId);
      notify({
        id: `retry-ok-${Date.now()}`,
        type: 'success',
        title: 'Node neu gestartet',
        message: `${NODE_LABELS[nodeId] || nodeId} wird wiederholt`,
      });
      void fetchPipeline();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Wiederholen fehlgeschlagen';
      notify({
        id: `retry-err-${Date.now()}`,
        type: 'error',
        title: 'Wiederholen fehlgeschlagen',
        message: msg,
      });
    } finally {
      setRetryingNode(null);
    }
  }, [retryingNode, clientId, fetchPipeline, notify]);

  // ── Pause/Resume Handler ──────────────────────────────────
  const handlePauseResume = useCallback(async () => {
    if (pauseLoading || !executionId) return;
    setPauseLoading(true);
    try {
      if (isPaused) {
        await api.execution.resume(executionId);
        setIsPaused(false);
        notify({ id: `resume-${Date.now()}`, type: 'success', title: 'Execution fortgesetzt', message: '' });
      } else {
        await api.execution.pause(executionId);
        setIsPaused(true);
        notify({ id: `pause-${Date.now()}`, type: 'success', title: 'Execution pausiert', message: '' });
      }
      void fetchPipeline();
    } catch (err) {
      notify({ id: `pause-err-${Date.now()}`, type: 'error', title: 'Fehler', message: err instanceof Error ? err.message : 'Unbekannt' });
    } finally {
      setPauseLoading(false);
    }
  }, [pauseLoading, executionId, isPaused, fetchPipeline, notify]);

  const client = useMemo(() => clients.find((c) => c.id === clientId), [clients, clientId]);
  const clientDeliverables = useMemo(() => deliverables.filter((d) => d.clientId === clientId), [deliverables, clientId]);

  // ── Build phases: prefer V3 live data, fall back to local store ──
  const phases: PhaseInfo[] = useMemo(() => {
    // If V3 data is available, map it to PhaseInfo format
    if (livePhases && livePhases.length > 0) {
      const projectStart = client?.kickoffDate || client?.createdAt || new Date().toISOString().split('T')[0]!;
      let cumulativeOffset = 0;

      return livePhases.map((lp) => {
        const matchingKey = PHASE_KEYS.find((pk) => pk.key === lp.name);
        const phaseGroup = matchingKey?.phaseGroup;
        const estDuration = PHASE_DURATION_DAYS[lp.name] || 2;
        const startDate = addDays(projectStart, cumulativeOffset);

        let status: PhaseInfo['status'] = 'pending';
        if (lp.status === 'completed') status = 'done';
        else if (lp.status === 'running' || lp.is_current) status = 'in_progress';
        // waiting_approval maps to in_progress (shown differently via approval gate UI)
        else if (lp.status === 'waiting_approval') status = 'in_progress';

        // Get deliverables from local store for this phase
        let phaseDeliverables: Deliverable[] = [];
        if (phaseGroup && PHASE_CONFIG[phaseGroup]) {
          const subtypes = PHASE_CONFIG[phaseGroup].deliverables;
          phaseDeliverables = clientDeliverables.filter((d) => subtypes.includes(d.subtype));
        }

        cumulativeOffset += estDuration;

        return {
          key: lp.name,
          phaseGroup,
          total: lp.total_nodes,
          completed: lp.completed_nodes,
          completionDate: lp.status === 'completed' ? addDays(startDate, estDuration) : null,
          startDate,
          durationDays: estDuration,
          status,
          deliverables: phaseDeliverables,
          // Extra V3 info
          _liveStatus: lp.status,
        } as PhaseInfo & { _liveStatus?: string };
      });
    }

    // Fallback: build from local store (original logic)
    if (!client) return [];

    const currentIdx = PIPELINE_STEPS.findIndex((s) => s.key === client.status);
    const projectStart = client.kickoffDate || client.createdAt;

    let cumulativeOffset = 0;

    return PHASE_KEYS.map((pk, idx) => {
      let total = 0;
      let completed = 0;
      let completionDate: string | null = null;
      let deliverables: Deliverable[] = [];
      const startDate = addDays(projectStart, cumulativeOffset);
      const estDuration = PHASE_DURATION_DAYS[pk.key] || 2;

      if (pk.phaseGroup && PHASE_CONFIG[pk.phaseGroup]) {
        const subtypes = PHASE_CONFIG[pk.phaseGroup].deliverables;
        deliverables = clientDeliverables.filter((d) => subtypes.includes(d.subtype));
        total = deliverables.length;
        completed = deliverables.filter(isDeliverableCompleted).length;

        if (total > 0 && completed === total) {
          const dates = deliverables
            .map((d) => d.approvedAt || d.updatedAt)
            .filter(Boolean)
            .sort();
          completionDate = dates[dates.length - 1] || null;
        }
      }

      let status: PhaseInfo['status'] = 'pending';
      if (idx < currentIdx) {
        status = 'done';
      } else if (idx === currentIdx) {
        status = 'in_progress';
      }

      if (pk.phaseGroup && total > 0 && completed === total) {
        status = 'done';
      }

      if (pk.key === 'onboarding' && idx <= currentIdx) {
        status = 'done';
        total = 3;
        completed = 3;
        completionDate = client.kickoffDate || client.createdAt;
      }

      if (pk.key === 'review' && client.status === 'live') {
        status = 'done';
      }

      if (pk.key === 'live' && client.status === 'live') {
        status = 'done';
        completionDate = client.launchDate || null;
      }

      let durationDays = estDuration;
      if (status === 'done' && completionDate) {
        durationDays = Math.max(1, daysBetween(startDate, completionDate));
      }

      cumulativeOffset += estDuration;

      return { ...pk, total, completed, completionDate, startDate, durationDays, status, deliverables };
    });
  }, [client, clientDeliverables, livePhases]);

  const currentPhase = useMemo(() => {
    return phases.find((p) => p.status === 'in_progress') || null;
  }, [phases]);

  // Determine which approval gate phases are waiting (from V3 live data)
  const approvalGatePhases = useMemo(() => {
    if (!livePhases) return [];
    return livePhases.filter((lp) => lp.status === 'waiting_approval');
  }, [livePhases]);

  if (!client) return null;

  // Project duration calculations
  const projectStart = client.kickoffDate || client.createdAt;
  const totalEstDays = Object.values(PHASE_DURATION_DAYS).reduce((a, b) => a + b, 0);
  const currentDay = daysBetween(projectStart, new Date().toISOString().split('T')[0]!);
  const donePhases = phases.filter((p) => p.status === 'done');
  const doneTime = donePhases.reduce((s, p) => s + p.durationDays, 0);
  const estimatedDoneTime = donePhases.reduce((s, p) => s + (PHASE_DURATION_DAYS[p.key] || 2), 0);
  const isOnTrack = doneTime <= estimatedDoneTime + 2; // 2-day buffer

  const formatShortDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return '\u2014';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
    } catch {
      return dateStr;
    }
  };

  const estimatedCompletion = () => {
    if (!currentPhase || currentPhase.total === 0) return '\u2014';
    const remaining = currentPhase.total - currentPhase.completed;
    const future = new Date();
    future.setDate(future.getDate() + remaining * 2);
    return future.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const progressPercent = currentPhase && currentPhase.total > 0
    ? Math.round((currentPhase.completed / currentPhase.total) * 100)
    : 0;

  const deliverableStatusLabel = (d: Deliverable): string => {
    const cfg = DELIVERABLE_STATUS_CONFIG[d.status];
    return cfg?.label || d.status;
  };

  const deliverableStatusColor = (d: Deliverable): string => {
    switch (d.status) {
      case 'approved':
      case 'live':
        return 'text-success-500';
      case 'draft':
      case 'in_review':
        return 'text-warning-500';
      case 'blocked':
        return 'text-error-500';
      case 'generating':
        return 'text-gray-400';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Section 1: Pipeline Steps */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <PipelineProgress currentStatus={client.status} />
        {/* Live connection indicator + Pause/Resume */}
        <div className="mt-3 flex items-center justify-end gap-3">
          {liveLoading && !livePhases && (
            <span className="flex items-center gap-1.5 text-xs text-gray-400">
              <svg className="h-3 w-3 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Verbinde mit Backend...
            </span>
          )}
          {isPaused && (
            <span className="flex items-center gap-1.5 rounded-full bg-warning-50 px-2.5 py-0.5 text-xs font-medium text-warning-600 dark:bg-warning-500/10 dark:text-warning-400">
              <Pause className="h-3 w-3" />
              Pausiert
            </span>
          )}
          {livePhases && !isPaused && (
            <span className="flex items-center gap-1.5 text-xs text-success-500">
              <span className="h-1.5 w-1.5 rounded-full bg-success-500 animate-pulse" />
              Live
            </span>
          )}
          {liveError && !livePhases && (
            <span className="flex items-center gap-1.5 text-xs text-gray-400">
              <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
              Offline (lokale Daten)
            </span>
          )}
          {executionId && livePhases && (
            <button
              onClick={() => void handlePauseResume()}
              disabled={pauseLoading}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition disabled:opacity-50 ${
                isPaused
                  ? 'bg-success-50 text-success-600 hover:bg-success-100 dark:bg-success-500/10 dark:text-success-400 dark:hover:bg-success-500/20'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
              }`}
            >
              {pauseLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : isPaused ? (
                <Play className="h-3.5 w-3.5" />
              ) : (
                <Pause className="h-3.5 w-3.5" />
              )}
              {isPaused ? 'Fortsetzen' : 'Pausieren'}
            </button>
          )}
        </div>
      </div>

      {/* Approval Gates */}
      {approvalGatePhases.length > 0 && (
        <div className="rounded-2xl border-2 border-warning-300 bg-warning-50/50 p-5 dark:border-warning-500/30 dark:bg-warning-500/5">
          <div className="flex items-center gap-2 mb-3">
            <svg className="h-5 w-5 text-warning-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <h3 className="text-sm font-semibold text-warning-700 dark:text-warning-400">
              Freigabe erforderlich
            </h3>
          </div>
          <div className="space-y-2">
            {approvalGatePhases.map((gate) => (
              <div key={gate.name} className="flex items-center justify-between rounded-xl bg-white px-4 py-3 dark:bg-gray-900">
                <div className="flex items-center gap-3">
                  <span className="h-2 w-2 rounded-full bg-warning-500 animate-pulse" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {gate.label || t(`status.${gate.name}`)}
                  </span>
                  <span className="text-xs text-gray-400">
                    {gate.completed_nodes}/{gate.total_nodes} Nodes
                  </span>
                </div>
                <button
                  onClick={() => void handleApprove(gate.name)}
                  disabled={approvingNode === gate.name}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-success-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-success-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {approvingNode === gate.name ? (
                    <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  Freigeben
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section 2: Zeitstrahl (Timeline) */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">
            {t('pipeline.zeitstrahl')}
          </h3>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {t('pipeline.projectDay', { current: Math.max(1, currentDay), total: totalEstDays })}
            </span>
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
              isOnTrack
                ? 'bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-400'
                : 'bg-error-50 text-error-600 dark:bg-error-500/10 dark:text-error-400'
            }`}>
              <span className={`h-2 w-2 rounded-full ${isOnTrack ? 'bg-success-500' : 'bg-error-500'}`} />
              {isOnTrack ? t('pipeline.onTrack') : t('pipeline.delayed')}
            </span>
          </div>
        </div>

        <div className="space-y-0">
          {phases.map((phase, idx) => {
            const isDone = phase.status === 'done';
            const isActive = phase.status === 'in_progress';
            const isPending = phase.status === 'pending';
            const isExpanded = expandedPhase === phase.key;
            const phaseNodeIds = PHASE_NODES[phase.key] || [];
            const hasNodeData = executionNodes !== null && phaseNodeIds.length > 0;

            // Find currently running node for this phase
            const runningNodeId = hasNodeData
              ? phaseNodeIds.find((nid) => executionNodes[nid]?.status === 'running')
              : undefined;
            const runningNodeLabel = runningNodeId ? (NODE_LABELS[runningNodeId] || runningNodeId) : null;
            const failedCount = hasNodeData
              ? phaseNodeIds.filter((nid) => executionNodes[nid]?.status === 'failed').length
              : 0;

            return (
              <div key={phase.key}>
                <div
                  className={`flex items-stretch gap-4 ${hasNodeData ? 'cursor-pointer' : ''}`}
                  onClick={() => {
                    if (hasNodeData) {
                      setExpandedPhase(isExpanded ? null : phase.key);
                    }
                  }}
                >
                  {/* Date column */}
                  <div className="w-12 shrink-0 text-right pt-3">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      {isDone || isActive ? formatShortDate(phase.startDate) : '\u2014'}
                    </span>
                  </div>

                  {/* Dot + connector line */}
                  <div className="flex flex-col items-center">
                    <div className={`mt-3 h-3 w-3 shrink-0 rounded-full border-2 ${
                      isDone
                        ? 'border-success-500 bg-success-500'
                        : isActive
                        ? 'border-brand-500 bg-brand-500 animate-pulse'
                        : 'border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-900'
                    }`} />
                    {(idx < phases.length - 1 || isExpanded) && (
                      <div className={`w-0.5 flex-1 min-h-[24px] ${
                        isDone
                          ? 'bg-success-500'
                          : isActive
                          ? 'bg-brand-200 dark:bg-brand-800'
                          : 'bg-gray-200 dark:bg-gray-700'
                      } ${isPending ? 'border-l border-dashed border-gray-300 dark:border-gray-600 bg-transparent w-0' : ''}`} />
                    )}
                  </div>

                  {/* Phase info */}
                  <div className={`flex-1 pb-4 pt-1.5`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium ${
                          isDone
                            ? 'text-gray-700 dark:text-gray-300'
                            : isActive
                            ? 'text-brand-500 font-semibold'
                            : 'text-gray-400 dark:text-gray-500'
                        }`}>
                          {t(`status.${phase.key}`)}
                        </span>
                        {hasNodeData && (
                          <ChevronDown className={`h-3.5 w-3.5 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        {phase.total > 0 && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {phase.completed}/{phase.total}
                            {isDone && ' \u2713'}
                          </span>
                        )}
                        {(isDone || isActive) && (
                          <span className="text-xs text-gray-400 dark:text-gray-500">
                            ({phase.durationDays === 1
                              ? t('pipeline.dayLabel', { n: phase.durationDays })
                              : t('pipeline.daysLabel', { n: phase.durationDays })})
                          </span>
                        )}
                        {isPending && (
                          <span className="text-xs italic text-gray-400 dark:text-gray-500">
                            ({t('pipeline.geplant')})
                          </span>
                        )}
                        {isActive && !runningNodeLabel && (
                          <span className="text-xs italic text-brand-500">
                            ({t('pipeline.inArbeit')})
                          </span>
                        )}
                        {runningNodeLabel && (
                          <span className="flex items-center gap-1 text-xs text-brand-500">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            {runningNodeLabel}
                          </span>
                        )}
                        {failedCount > 0 && (
                          <span className="text-xs font-medium text-error-500">
                            {failedCount} fehlgeschlagen
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded Node Details */}
                <div
                  className="overflow-hidden transition-all duration-300 ease-in-out"
                  style={{
                    maxHeight: isExpanded ? `${phaseNodeIds.length * 48 + 16}px` : '0px',
                    opacity: isExpanded ? 1 : 0,
                  }}
                >
                  {isExpanded && executionNodes && (
                    <div className="ml-[76px] mb-4 space-y-1">
                      {phaseNodeIds.map((nodeId) => {
                        const nodeData = executionNodes[nodeId];
                        const nodeStatus = nodeData?.status || 'pending';
                        const nodeName = NODE_LABELS[nodeId] || nodeId;
                        const durationMs = nodeData?.duration_ms;
                        const errorMsg = nodeData?.error;

                        return (
                          <div
                            key={nodeId}
                            className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 dark:bg-white/[0.03]"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              {/* Status icon */}
                              {nodeStatus === 'completed' && (
                                <CheckCircle className="h-4 w-4 shrink-0 text-success-500" />
                              )}
                              {nodeStatus === 'running' && (
                                <Loader2 className="h-4 w-4 shrink-0 text-brand-500 animate-spin" />
                              )}
                              {nodeStatus === 'failed' && (
                                <XCircle className="h-4 w-4 shrink-0 text-error-500" />
                              )}
                              {nodeStatus === 'blocked' && (
                                <Lock className="h-4 w-4 shrink-0 text-gray-400" />
                              )}
                              {nodeStatus === 'waiting_approval' && (
                                <Clock className="h-4 w-4 shrink-0 text-warning-500" />
                              )}
                              {!nodeData && (
                                <div className="h-4 w-4 shrink-0 rounded-full border border-gray-300 dark:border-gray-600" />
                              )}

                              {/* Node name */}
                              <span className={`text-xs truncate ${
                                nodeStatus === 'completed'
                                  ? 'text-gray-600 dark:text-gray-400'
                                  : nodeStatus === 'failed'
                                  ? 'text-error-600 dark:text-error-400'
                                  : nodeStatus === 'running'
                                  ? 'text-brand-600 dark:text-brand-400 font-medium'
                                  : 'text-gray-500 dark:text-gray-500'
                              }`}>
                                {nodeName}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 shrink-0 ml-2">
                              {/* Duration */}
                              {nodeStatus === 'completed' && durationMs !== null && durationMs !== undefined && (
                                <span className="text-xs text-gray-400 dark:text-gray-500">
                                  {durationMs < 1000
                                    ? `${durationMs}ms`
                                    : `${(durationMs / 1000).toFixed(1)}s`}
                                </span>
                              )}
                              {/* Error message + Retry */}
                              {nodeStatus === 'failed' && (
                                <>
                                  {errorMsg && (
                                    <span className="text-xs text-error-500 truncate max-w-[140px]" title={errorMsg}>
                                      {errorMsg.length > 30 ? `${errorMsg.slice(0, 30)}...` : errorMsg}
                                    </span>
                                  )}
                                  <button
                                    onClick={(e) => { e.stopPropagation(); void handleRetry(nodeId); }}
                                    disabled={retryingNode === nodeId}
                                    className="inline-flex items-center gap-1 rounded-md bg-error-50 px-2 py-1 text-[11px] font-medium text-error-600 hover:bg-error-100 disabled:opacity-50 dark:bg-error-500/10 dark:text-error-400 dark:hover:bg-error-500/20 transition"
                                  >
                                    {retryingNode === nodeId ? (
                                      <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : (
                                      <RotateCcw className="h-3 w-3" />
                                    )}
                                    Wiederholen
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 3: Checkliste der aktuellen Phase */}
      {currentPhase && currentPhase.deliverables.length > 0 && (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="mb-5 flex items-center justify-between">
            <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">
              {t('pipeline.currentPhaseLabel', { phase: t(`status.${currentPhase.key}`) })}
            </h3>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {t('pipeline.responsiblePerson', { name: client.accountManager })}
            </span>
          </div>

          {/* Deliverable Checklist */}
          <div className="space-y-2.5 mb-5">
            {currentPhase.deliverables.map((d) => {
              const done = isDeliverableCompleted(d);
              return (
                <div key={d.id} className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50/50 px-4 py-3 dark:border-gray-800 dark:bg-white/[0.02]">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-5 w-5 items-center justify-center rounded border ${
                      done
                        ? 'border-success-500 bg-success-500 text-white'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}>
                      {done && (
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <span className={`text-sm ${
                      done
                        ? 'text-gray-400 line-through dark:text-gray-500'
                        : 'text-gray-700 dark:text-gray-300'
                    }`}>
                      {d.title}
                    </span>
                  </div>
                  <span className={`text-xs font-medium ${deliverableStatusColor(d)}`}>
                    {deliverableStatusLabel(d)}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Progress bar */}
          <div className="space-y-2 rounded-xl bg-gray-50 px-4 py-3 dark:bg-white/[0.03]">
            <p className="text-xs font-medium text-gray-600 dark:text-gray-300">
              {t('pipeline.progressPercent', {
                done: currentPhase.completed,
                total: currentPhase.total,
                percent: progressPercent,
              })}
            </p>
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
              <div
                className="h-full rounded-full bg-brand-500 transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>
                {t('pipeline.estDone', { date: estimatedCompletion() })}
              </span>
              <span>
                {t('pipeline.responsiblePerson', { name: client.accountManager })}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Nächste Schritte */}
      {(() => {
        const openDeliverables = deliverables
          .filter((d: Deliverable) => d.status !== 'approved' && d.status !== 'live' && d.status !== 'generating')
          .slice(0, 5);
        if (openDeliverables.length === 0) return null;
        return (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
            <h3 className="text-base font-semibold text-gray-800 dark:text-white/90 mb-4">
              {t('pipeline.openTasks')}
            </h3>
            <div className="space-y-2.5">
              {openDeliverables.map((d: Deliverable) => {
                const statusCfg = DELIVERABLE_STATUS_CONFIG[d.status];
                return (
                  <div
                    key={d.id}
                    className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50/50 px-4 py-3 dark:border-gray-800 dark:bg-white/[0.02]"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`h-2 w-2 rounded-full shrink-0 ${
                        d.status === 'draft' ? 'bg-gray-400' :
                        d.status === 'in_review' ? 'bg-warning-500' :
                        d.status === 'rejected' ? 'bg-error-500' :
                        d.status === 'blocked' ? 'bg-error-400' :
                        'bg-brand-500'
                      }`} />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                        {d.title}
                      </span>
                    </div>
                    <span className={`text-xs font-medium shrink-0 ml-3 ${statusCfg?.color ?? 'text-gray-400'}`}>
                      {statusCfg?.label ?? d.status}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

    </div>
  );
}
