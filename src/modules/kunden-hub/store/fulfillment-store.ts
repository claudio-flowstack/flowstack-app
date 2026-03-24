import { create } from 'zustand';
import type {
  Client,
  Deliverable,
  Approval,
  Alert,
  TimelineEvent,
  DeliverableStatus,
  DeliverableType,
  DeliverableSubtype,
  ClientStatus,
  PhaseGroup,
} from '../data/types';
import { mockClients, mockDeliverables, mockApprovals, mockAlerts, mockTimeline } from '../data/mock-data';
import { PHASE_CONFIG } from '../data/constants';
import { api } from '../services/api';
import type {
  ClientFromAPI,
  DeliverableFromAPI,
  PipelineStatus,
  TimelineEventFromAPI,
  PerformanceData,
} from '../services/api';
import { toastError, toastWarning, toastSuccess } from '@/shared/hooks/useToast';

// ── localStorage persistence for executionMap ──────────────
const EXEC_MAP_KEY = 'flowstack-execution-map';

function loadExecutionMap(): Record<string, string> {
  try {
    const stored = localStorage.getItem(EXEC_MAP_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch { return {}; }
}

function saveExecutionMap(map: Record<string, string>) {
  try { localStorage.setItem(EXEC_MAP_KEY, JSON.stringify(map)); } catch { /* noop */ }
}

// ── Mapping helpers ─────────────────────────────────────────

function mapApiClient(raw: ClientFromAPI): Client {
  return {
    id: raw.id,
    company: raw['Client Name'] || '',
    name: raw.Ansprechpartner || '',
    email: raw.Email || '',
    phone: '',
    branche: raw.Branche || '',
    status: (raw.Status as ClientStatus) || 'onboarding',
    currentPhase: mapStatusToPhase(raw.Status),
    accountManager: raw['Account Manager'] || 'Claudio',
    createdAt: new Date().toISOString(),
    connections: [],
  };
}

function mapStatusToPhase(status: string | undefined): Client['currentPhase'] {
  switch (status) {
    case 'onboarding': return 'onboarding';
    case 'strategy': return 'strategy';
    case 'copy': return 'copy';
    case 'funnel': return 'funnel';
    case 'campaigns': return 'campaigns';
    case 'review': return 'review';
    case 'live': return 'live';
    default: return 'onboarding';
  }
}

function mapApiDeliverable(raw: DeliverableFromAPI, clientId: string): Deliverable {
  // Determine type from phase
  const typeMap: Record<string, DeliverableType> = {
    strategy: 'strategy_doc',
    copy: 'copy_text',
    funnel: 'funnel_page',
    campaigns: 'ad_creative',
    campaign: 'campaign',
  };

  // Determine subtype from id (doc_key)
  const subtypeMap: Record<string, DeliverableSubtype> = {
    zielgruppen_avatar: 'zielgruppen_avatar',
    arbeitgeber_avatar: 'arbeitgeber_avatar',
    messaging_matrix: 'messaging_matrix',
    creative_briefing: 'creative_briefing',
    marken_richtlinien: 'marken_richtlinien',
    landingpage_texte: 'lp_text',
    formularseite_texte: 'form_text',
    dankeseite_texte: 'danke_text',
    anzeigentexte_hauptkampagne: 'anzeigen_haupt',
    anzeigentexte_retargeting: 'anzeigen_retargeting',
    anzeigentexte_warmup: 'anzeigen_warmup',
    videoskript: 'videoskript',
    campaign_initial: 'initial_campaign',
    campaign_retargeting: 'retargeting_campaign',
    campaign_warmup: 'warmup_campaign',
  };

  return {
    id: raw.id,
    clientId,
    type: typeMap[raw.phase] || 'strategy_doc',
    subtype: (subtypeMap[raw.id] || raw.id) as DeliverableSubtype,
    title: raw.title || '',
    content: raw.content || '',
    status: (raw.status as DeliverableStatus) || 'draft',
    phase: (raw.phase as PhaseGroup) || 'strategy',
    version: raw.version || 1,
    createdBy: 'ai',
    previewType: 'doc',
    externalUrl: raw.url || undefined,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function mapApiTimelineEvent(raw: TimelineEventFromAPI, clientId: string): TimelineEvent {
  return {
    id: raw.id,
    clientId,
    type: (raw.type as TimelineEvent['type']) || 'status_change',
    title: raw.title || '',
    description: raw.description || undefined,
    timestamp: raw.timestamp || new Date().toISOString(),
    actor: raw.actor || 'system',
  };
}

// ── Store interface ─────────────────────────────────────────

interface FulfillmentState {
  // Data
  clients: Client[];
  deliverables: Deliverable[];
  approvals: Approval[];
  alerts: Alert[];
  timeline: TimelineEvent[];

  // API-specific data (per client)
  pipeline: PipelineStatus | null;
  clientDeliverables: DeliverableFromAPI[];
  clientTimeline: TimelineEventFromAPI[];
  clientPerformance: PerformanceData | null;

  // Execution tracking: clientId -> executionId
  executionMap: Record<string, string>;

  // Pending actions (prevents double-clicks on async operations)
  pendingActions: Set<string>;

  // Active regeneration AbortControllers
  activeRegenerations: Set<string>;

  // UI State
  selectedClientId: string | null;
  selectedDeliverableId: string | null;
  isLoading: boolean;
  error: string | null;

  // Helpers
  isPending: (id: string) => boolean;

  // Actions - Clients
  loadClients: () => Promise<void>;
  getClient: (id: string) => Client | undefined;
  getClientDeliverables: (clientId: string) => Deliverable[];
  getClientTimeline: (clientId: string) => TimelineEvent[];
  addClient: (client: Client) => Promise<void>;

  deleteClient: (id: string) => Promise<void>;

  // Actions - Deliverables
  updateDeliverableContent: (id: string, content: string) => Promise<void>;
  updateDeliverableStatus: (id: string, status: DeliverableStatus) => void;
  approveDeliverable: (id: string, comment?: string) => Promise<void>;
  rejectDeliverable: (id: string, comment: string) => Promise<void>;
  requestChanges: (id: string, comment: string) => void;
  submitForReview: (id: string) => void;
  regenerateDeliverable: (id: string, feedback?: string) => Promise<string | null>;
  fetchDeliverableContent: (id: string) => Promise<string | null>;
  getExecutionId: (clientId: string) => Promise<string | null>;

  // Actions - Batch
  approveAllDrafts: (clientId: string, phase: PhaseGroup) => void;
  resetPhase: (clientId: string, phase: PhaseGroup) => void;
  resetClient: (clientId: string) => void;

  // Actions - Alerts
  acknowledgeAlert: (id: string) => void;

  // Actions - UI
  setSelectedClient: (id: string | null) => void;
  setSelectedDeliverable: (id: string | null) => void;

  // Actions - API (Kunden-Hub specific)
  loadPipeline: (clientId: string) => Promise<void>;
  loadDeliverables: (clientId: string) => Promise<void>;
  loadTimeline: (clientId: string) => Promise<void>;
  loadPerformance: (clientId: string) => Promise<void>;
}

export const useFulfillmentStore = create<FulfillmentState>((set, get) => ({
  // Initial state — empty, loaded via API
  clients: [],
  deliverables: [],
  approvals: [],
  alerts: [],
  timeline: [],

  // API-specific state
  pipeline: null,
  clientDeliverables: [],
  clientTimeline: [],
  clientPerformance: null,
  executionMap: loadExecutionMap(),

  // Pending actions
  pendingActions: new Set<string>(),
  activeRegenerations: new Set<string>(),

  // UI state
  selectedClientId: null,
  selectedDeliverableId: null,
  isLoading: false,
  error: null,

  isPending: (id: string) => get().pendingActions.has(id),

  // ── Load clients from API, fallback to mock ───────────────

  loadClients: async () => {
    set({ isLoading: true, error: null });
    try {
      // Load from both sources in parallel
      const [apiClients, executions] = await Promise.allSettled([
        api.clients.list(),
        api.execution.list(),
      ]);

      const clients: Client[] = [];

      // Map Airtable clients
      if (apiClients.status === 'fulfilled') {
        clients.push(...apiClients.value.map(mapApiClient));
      }

      // Map Executions (that aren't already in Airtable clients)
      // Also build executionMap for all executions
      const newExecutionMap: Record<string, string> = {};
      if (executions.status === 'fulfilled') {
        for (const ex of executions.value) {
          const existing = clients.find(c =>
            c.company.toLowerCase() === ex.client_name.toLowerCase() ||
            c.id === ex.execution_id
          );
          if (existing) {
            // Map existing client's id to its executionId
            newExecutionMap[existing.id] = ex.execution_id;
          } else {
            clients.push({
              id: ex.execution_id,
              company: ex.client_name,
              name: '',
              email: '',
              branche: '',
              status: 'onboarding' as ClientStatus,
              currentPhase: 'onboarding',
              accountManager: 'Claudio',
              createdAt: ex.started_at?.split('T')[0] || new Date().toISOString().split('T')[0]!,
              connections: [],
            });
            // For execution-only clients, the id IS the executionId
            newExecutionMap[ex.execution_id] = ex.execution_id;
          }
        }
      }

      if (clients.length > 0) {
        const mergedMap = { ...get().executionMap, ...newExecutionMap };
        saveExecutionMap(mergedMap);
        set({ clients, executionMap: mergedMap, isLoading: false });
      } else {
        // Fallback to mock data
        set({
          clients: mockClients,
          deliverables: mockDeliverables,
          approvals: mockApprovals,
          alerts: mockAlerts,
          timeline: mockTimeline,
          isLoading: false,
        });
      }
    } catch {
      // API nicht erreichbar, Mock-Daten laden
      set({
        clients: mockClients,
        deliverables: mockDeliverables,
        approvals: mockApprovals,
        alerts: mockAlerts,
        timeline: mockTimeline,
        isLoading: false,
      });
    }
  },

  getClient: (id: string) => {
    return get().clients.find((c) => c.id === id);
  },

  getClientDeliverables: (clientId: string) => {
    return get().deliverables.filter((d) => d.clientId === clientId);
  },

  getClientTimeline: (clientId: string) => {
    return get().timeline
      .filter((t) => t.clientId === clientId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  },

  // ── Add client via API, then start execution ─────────────

  addClient: async (client: Client) => {
    // Guard: prevent duplicate clients
    const exists = get().clients.some(
      (c) => c.company.toLowerCase().trim() === client.company.toLowerCase().trim()
    );
    if (exists) {
      toastWarning('Kunde mit diesem Namen existiert bereits');
      return;
    }

    try {
      const result = await api.clients.create({
        company: client.company,
        contact: client.name,
        email: client.email,
        branche: client.branche,
        account_manager: client.accountManager,
      });
      // Use the API-returned id
      const newClient: Client = { ...client, id: result.id };
      set((state) => ({ clients: [...state.clients, newClient] }));

      // Start execution for this client
      try {
        const execResult = await api.clientExecution.start(result.id);
        const updatedMap = { ...get().executionMap, [result.id]: execResult.execution_id };
        saveExecutionMap(updatedMap);
        set((state) => ({ executionMap: updatedMap }));
      } catch {
        toastWarning('Execution konnte nicht gestartet werden');
      }
    } catch {
      // Fallback: add locally
      set((state) => ({ clients: [...state.clients, client] }));
      toastWarning('Client lokal hinzugefügt (API nicht erreichbar)');
    }
  },

  // ── Delete client (soft-delete: set status to churned) ────

  deleteClient: async (id: string) => {
    // Save original state for rollback
    const snapshot = {
      clients: get().clients,
      deliverables: get().deliverables,
      approvals: get().approvals,
      alerts: get().alerts,
      timeline: get().timeline,
    };

    // Optimistic: remove from local state
    set((state) => ({
      clients: state.clients.filter((c) => c.id !== id),
      deliverables: state.deliverables.filter((d) => d.clientId !== id),
      approvals: state.approvals.filter((a) => a.clientId !== id),
      alerts: state.alerts.filter((a) => a.clientId !== id),
      timeline: state.timeline.filter((t) => t.clientId !== id),
    }));

    // Sync via API (soft-delete by setting status to churned)
    try {
      await api.clients.update(id, { Status: 'churned' });
      toastSuccess('Kunde gelöscht');
    } catch {
      // Rollback to original state
      set(snapshot);
      toastError('Kunde konnte nicht gelöscht werden');
    }
  },

  // ── Deliverable actions (API-backed) ──────────────────────

  updateDeliverableContent: async (id: string, content: string) => {
    const original = get().deliverables.find((d) => d.id === id);

    // Optimistic update
    set((state) => ({
      deliverables: state.deliverables.map((d) =>
        d.id === id
          ? { ...d, content, status: 'manually_edited' as DeliverableStatus, version: d.version + 1, editedBy: 'Claudio', updatedAt: new Date().toISOString() }
          : d
      ),
    }));

    // Try to sync via API
    try {
      if (original) {
        const executionId = get().executionMap[original.clientId];
        if (executionId) {
          await api.clientDeliverables.updateContent(executionId, id, content);
        }
      }
    } catch {
      // Rollback to original
      if (original) {
        set((state) => ({
          deliverables: state.deliverables.map((d) => d.id === id ? original : d),
        }));
      }
      toastError('Inhalt konnte nicht gespeichert werden');
    }
  },

  updateDeliverableStatus: (id: string, status: DeliverableStatus) => {
    const deliverable = get().deliverables.find((d) => d.id === id);
    if (!deliverable) return;

    // Guard: blocked deliverables can only be set to blocked/outdated (system-internal)
    if (deliverable.blockedBy && status !== 'blocked' && status !== 'outdated') {
      const blocker = get().deliverables.find((d) => d.id === deliverable.blockedBy);
      if (blocker && blocker.status !== 'approved' && blocker.status !== 'live') {
        toastWarning('Dieses Deliverable ist noch blockiert');
        return;
      }
    }

    set((state) => ({
      deliverables: state.deliverables.map((d) =>
        d.id === id ? { ...d, status, updatedAt: new Date().toISOString() } : d
      ),
    }));
  },

  approveDeliverable: async (id: string, comment?: string) => {
    // Prevent double-clicks
    if (get().pendingActions.has(id)) return;
    set((state) => ({ pendingActions: new Set([...state.pendingActions, id]) }));

    const original = get().deliverables.find((d) => d.id === id);
    const originalApproval = get().approvals.find((a) => a.deliverableId === id);
    const now = new Date().toISOString();

    // Optimistic update
    set((state) => ({
      deliverables: state.deliverables.map((d) =>
        d.id === id
          ? { ...d, status: 'approved' as DeliverableStatus, approvedBy: 'Claudio', approvedAt: now, updatedAt: now }
          : d
      ),
      approvals: state.approvals.map((a) =>
        a.deliverableId === id
          ? { ...a, status: 'approved' as const, comment, respondedAt: now }
          : a
      ),
      timeline: [
        {
          id: `tl-auto-${Date.now()}`,
          clientId: state.deliverables.find((d) => d.id === id)?.clientId ?? '',
          type: 'approval_resolved' as const,
          title: `${state.deliverables.find((d) => d.id === id)?.title ?? 'Deliverable'} freigegeben`,
          timestamp: now,
          actor: 'Claudio',
        },
        ...state.timeline,
      ],
    }));

    // Sync via API
    try {
      const deliverable = get().deliverables.find((d) => d.id === id);
      if (deliverable) {
        const executionId = get().executionMap[deliverable.clientId];
        if (executionId) {
          await api.clientDeliverables.approve(executionId, id, 'Claudio');
        }

        // Auto Phase-Transition: check if all deliverables in this phase are approved/live
        const phaseOrder: PhaseGroup[] = ['strategy', 'copy', 'funnel', 'campaigns'];
        const currentPhase = deliverable.phase;
        const clientDeliverables = get().deliverables.filter((d) => d.clientId === deliverable.clientId);
        const phaseDeliverables = clientDeliverables.filter((d) => d.phase === currentPhase);
        const allPhaseApproved = phaseDeliverables.length > 0 && phaseDeliverables.every(
          (d) => d.status === 'approved' || d.status === 'live'
        );

        if (allPhaseApproved) {
          const currentIndex = phaseOrder.indexOf(currentPhase);
          const nextPhase = currentIndex >= 0 && currentIndex < phaseOrder.length - 1
            ? phaseOrder[currentIndex + 1]
            : null;

          if (nextPhase) {
            // Advance client to next phase
            set((state) => ({
              clients: state.clients.map((c) =>
                c.id === deliverable.clientId
                  ? { ...c, currentPhase: nextPhase, status: nextPhase as ClientStatus }
                  : c
              ),
            }));
          }
        }
      }
    } catch {
      // Rollback to ORIGINAL status (not hardcoded 'draft')
      if (original) {
        set((state) => ({
          deliverables: state.deliverables.map((d) => d.id === id ? original : d),
          approvals: originalApproval
            ? state.approvals.map((a) => a.deliverableId === id ? originalApproval : a)
            : state.approvals,
        }));
      }
      toastError('Freigabe fehlgeschlagen');
    } finally {
      set((state) => {
        const next = new Set(state.pendingActions);
        next.delete(id);
        return { pendingActions: next };
      });
    }
  },

  rejectDeliverable: async (id: string, comment: string) => {
    // Prevent double-clicks
    if (get().pendingActions.has(id)) return;
    set((state) => ({ pendingActions: new Set([...state.pendingActions, id]) }));

    const original = get().deliverables.find((d) => d.id === id);
    const originalApproval = get().approvals.find((a) => a.deliverableId === id);
    const now = new Date().toISOString();

    // Optimistic update
    set((state) => ({
      deliverables: state.deliverables.map((d) =>
        d.id === id
          ? { ...d, status: 'rejected' as DeliverableStatus, updatedAt: now }
          : d
      ),
      approvals: state.approvals.map((a) =>
        a.deliverableId === id
          ? { ...a, status: 'rejected' as const, comment, respondedAt: now }
          : a
      ),
      timeline: [
        {
          id: `tl-auto-${Date.now()}`,
          clientId: state.deliverables.find((d) => d.id === id)?.clientId ?? '',
          type: 'approval_resolved' as const,
          title: `${state.deliverables.find((d) => d.id === id)?.title ?? 'Deliverable'} abgelehnt`,
          description: comment,
          timestamp: now,
          actor: 'Claudio',
        },
        ...state.timeline,
      ],
    }));

    // Cascade: mark downstream deliverables that depend on the rejected one as outdated
    set((state) => ({
      deliverables: state.deliverables.map((d) =>
        d.blockedBy === id && d.status !== 'blocked' && d.status !== 'outdated'
          ? { ...d, status: 'outdated' as DeliverableStatus, updatedAt: now }
          : d
      ),
    }));

    // Sync via API
    try {
      const deliverable = get().deliverables.find((d) => d.id === id);
      if (deliverable) {
        const executionId = get().executionMap[deliverable.clientId];
        if (executionId) {
          await api.clientDeliverables.reject(executionId, id, comment);
        }
      }
    } catch {
      // Rollback to ORIGINAL status
      if (original) {
        set((state) => ({
          deliverables: state.deliverables.map((d) => d.id === id ? original : d),
          approvals: originalApproval
            ? state.approvals.map((a) => a.deliverableId === id ? originalApproval : a)
            : state.approvals,
        }));
      }
      toastError('Ablehnung fehlgeschlagen');
    } finally {
      set((state) => {
        const next = new Set(state.pendingActions);
        next.delete(id);
        return { pendingActions: next };
      });
    }
  },

  requestChanges: (id: string, comment: string) => {
    const now = new Date().toISOString();
    set((state) => ({
      deliverables: state.deliverables.map((d) =>
        d.id === id
          ? { ...d, status: 'rejected' as DeliverableStatus, updatedAt: now }
          : d
      ),
      approvals: state.approvals.map((a) =>
        a.deliverableId === id
          ? { ...a, status: 'changes_requested' as const, comment, respondedAt: now }
          : a
      ),
    }));
  },

  submitForReview: (id: string) => {
    const now = new Date().toISOString();
    set((state) => {
      const deliverable = state.deliverables.find((d) => d.id === id);
      const client = deliverable ? state.clients.find((c) => c.id === deliverable.clientId) : undefined;
      return {
        deliverables: state.deliverables.map((d) =>
          d.id === id
            ? { ...d, status: 'in_review' as DeliverableStatus, updatedAt: now }
            : d
        ),
        approvals: [
          ...state.approvals,
          {
            id: `appr-auto-${Date.now()}`,
            deliverableId: id,
            clientId: deliverable?.clientId ?? '',
            clientName: client?.company ?? '',
            deliverableTitle: deliverable?.title ?? '',
            reviewer: 'Claudio',
            status: 'pending' as const,
            requestedAt: now,
            deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          },
        ],
        timeline: [
          {
            id: `tl-auto-${Date.now()}`,
            clientId: deliverable?.clientId ?? '',
            type: 'approval_requested' as const,
            title: `${deliverable?.title ?? 'Deliverable'} zur Freigabe eingereicht`,
            timestamp: now,
            actor: 'Claudio',
          },
          ...state.timeline,
        ],
      };
    });
  },

  // ── Regenerate via API ─────────────────────────────────────

  getExecutionId: async (clientId: string): Promise<string | null> => {
    // Return cached executionId if available
    const cached = get().executionMap[clientId];
    if (cached) return cached;

    // Try to fetch from API
    try {
      const execData = await api.clientExecution.get(clientId);
      if (execData.execution_id) {
        const updatedMap = { ...get().executionMap, [clientId]: execData.execution_id };
        saveExecutionMap(updatedMap);
        set({ executionMap: updatedMap });
        return execData.execution_id;
      }
    } catch {
      // Silent — caller handles null return
    }
    return null;
  },

  fetchDeliverableContent: async (id: string): Promise<string | null> => {
    const deliverable = get().deliverables.find((d) => d.id === id);
    if (!deliverable) return null;

    try {
      const executionId = await get().getExecutionId(deliverable.clientId);
      if (!executionId) return null;

      const deliverables = await api.clientDeliverables.list(deliverable.clientId);
      const found = deliverables.find((d) => d.id === id);
      if (found) {
        // Update local store with fresh content
        set((state) => ({
          deliverables: state.deliverables.map((d) =>
            d.id === id ? { ...d, content: found.content, status: (found.status as DeliverableStatus) || d.status, version: found.version || d.version } : d
          ),
        }));
        return found.content;
      }
    } catch {
      // Silent — content stays as-is from store
    }
    return null;
  },

  regenerateDeliverable: async (id: string, feedback?: string): Promise<string | null> => {
    const deliverable = get().deliverables.find((d) => d.id === id);
    if (!deliverable) return null;

    // Guard: prevent double-regeneration
    if (deliverable.status === 'generating' || get().activeRegenerations.has(id)) {
      toastWarning('Generierung läuft bereits');
      return null;
    }

    const originalStatus = deliverable.status;
    set((state) => ({
      activeRegenerations: new Set([...state.activeRegenerations, id]),
      deliverables: state.deliverables.map((d) =>
        d.id === id ? { ...d, status: 'generating' as DeliverableStatus, updatedAt: new Date().toISOString() } : d
      ),
    }));

    const resetStatus = (status: DeliverableStatus = originalStatus) => {
      set((state) => {
        const next = new Set(state.activeRegenerations);
        next.delete(id);
        return {
          activeRegenerations: next,
          deliverables: state.deliverables.map((d) =>
            d.id === id ? { ...d, status } : d
          ),
        };
      });
    };

    try {
      const executionId = await get().getExecutionId(deliverable.clientId);
      if (!executionId) {
        resetStatus();
        toastError('Keine Execution-ID gefunden');
        return null;
      }

      await api.clientDeliverables.regenerate(executionId, id, feedback);

      // Poll for completion (max 60 seconds, every 3 seconds)
      for (let i = 0; i < 20; i++) {
        // Check if still active (component might have unmounted)
        if (!get().activeRegenerations.has(id)) return null;

        await new Promise((resolve) => setTimeout(resolve, 3000));

        try {
          const deliverables = await api.clientDeliverables.list(deliverable.clientId);
          const updated = deliverables.find((d) => d.id === id);
          if (updated && updated.status !== 'generating') {
            const next = new Set(get().activeRegenerations);
            next.delete(id);
            set((state) => ({
              activeRegenerations: next,
              deliverables: state.deliverables.map((d) =>
                d.id === id
                  ? {
                      ...d,
                      content: updated.content,
                      status: (updated.status as DeliverableStatus) || 'draft',
                      version: updated.version || d.version + 1,
                      updatedAt: new Date().toISOString(),
                    }
                  : d
              ),
            }));
            toastSuccess('Generierung abgeschlossen');
            return updated.content;
          }
        } catch {
          // Continue polling
        }
      }

      // Timeout
      resetStatus('draft' as DeliverableStatus);
      toastWarning('Generierung dauert länger als erwartet');
      return null;
    } catch {
      resetStatus();
      toastError('Generierung fehlgeschlagen');
      return null;
    }
  },

  // ── Batch actions ─────────────────────────────────────────

  approveAllDrafts: (clientId: string, phase: PhaseGroup) => {
    const now = new Date().toISOString();
    const subtypes = PHASE_CONFIG[phase].deliverables;
    set((state) => ({
      deliverables: state.deliverables.map((d) =>
        d.clientId === clientId && subtypes.includes(d.subtype) && (d.status === 'draft' || d.status === 'in_review')
          ? { ...d, status: 'approved' as DeliverableStatus, approvedBy: 'Claudio', approvedAt: now, updatedAt: now }
          : d
      ),
      approvals: state.approvals.map((a) =>
        a.clientId === clientId && subtypes.some((st) => state.deliverables.find((d) => d.id === a.deliverableId)?.subtype === st)
          ? { ...a, status: 'approved' as const, respondedAt: now }
          : a
      ),
    }));
  },

  resetPhase: (clientId: string, phase: PhaseGroup) => {
    const subtypes = PHASE_CONFIG[phase].deliverables;
    set((state) => ({
      deliverables: state.deliverables.map((d) =>
        d.clientId === clientId && subtypes.includes(d.subtype)
          ? { ...d, status: 'draft' as DeliverableStatus, updatedAt: new Date().toISOString() }
          : d
      ),
    }));
  },

  resetClient: (clientId: string) => {
    const now = new Date().toISOString();
    set((state) => ({
      clients: state.clients.map((c) =>
        c.id === clientId
          ? { ...c, status: 'onboarding' as ClientStatus, currentPhase: 'onboarding' as const }
          : c
      ),
      deliverables: state.deliverables.map((d) => {
        if (d.clientId !== clientId) return d;
        // Strategy deliverables → draft, everything else → blocked (respects pipeline order)
        const newStatus: DeliverableStatus = d.phase === 'strategy' ? 'draft' : 'blocked';
        return { ...d, status: newStatus, approvedBy: undefined, approvedAt: undefined, updatedAt: now };
      }),
      approvals: state.approvals.filter((a) => a.clientId !== clientId),
      alerts: state.alerts.filter((a) => a.clientId !== clientId),
    }));
    toastSuccess('Kunde zurückgesetzt');
  },

  // ── Alerts ────────────────────────────────────────────────

  acknowledgeAlert: (id: string) => {
    set((state) => ({
      alerts: state.alerts.map((a) =>
        a.id === id ? { ...a, acknowledged: true } : a
      ),
    }));
  },

  // ── UI ────────────────────────────────────────────────────

  setSelectedClient: (id: string | null) => {
    set({ selectedClientId: id });
  },

  setSelectedDeliverable: (id: string | null) => {
    set({ selectedDeliverableId: id });
  },

  // ── API: Load pipeline for a client ───────────────────────

  loadPipeline: async (clientId: string) => {
    try {
      const pipeline = await api.pipeline.get(clientId);
      set({ pipeline });
    } catch {
      set({ pipeline: null });
    }
  },

  // ── API: Load deliverables for a client ───────────────────

  loadDeliverables: async (clientId: string) => {
    try {
      const rawDeliverables = await api.clientDeliverables.list(clientId);
      set({ clientDeliverables: rawDeliverables });

      // Also merge into the main deliverables array for UI compatibility
      const mapped = rawDeliverables.map((d) => mapApiDeliverable(d, clientId));
      set((state) => {
        // Remove old deliverables for this client, add fresh ones
        const otherDeliverables = state.deliverables.filter((d) => d.clientId !== clientId);
        return { deliverables: [...otherDeliverables, ...mapped] };
      });

      // Ensure executionMap is populated for approve/reject
      if (!get().executionMap[clientId]) {
        try {
          const exec = await api.clientExecution.get(clientId);
          if (exec.execution_id) {
            const updatedMap = { ...get().executionMap, [clientId]: exec.execution_id };
            saveExecutionMap(updatedMap);
            set({ executionMap: updatedMap });
          }
        } catch {
          // Execution not found, that's ok for mock/local clients
        }
      }
    } catch {
      toastError('Deliverables konnten nicht geladen werden');
    }
  },

  // ── API: Load timeline for a client ───────────────────────

  loadTimeline: async (clientId: string) => {
    try {
      const rawTimeline = await api.timeline.get(clientId);
      set({ clientTimeline: rawTimeline });

      // Also merge into the main timeline array for UI compatibility
      const mapped = rawTimeline.map((t) => mapApiTimelineEvent(t, clientId));
      set((state) => {
        const otherEvents = state.timeline.filter((t) => t.clientId !== clientId);
        return { timeline: [...otherEvents, ...mapped] };
      });
    } catch {
      // Timeline silent fail — not critical for UX
    }
  },

  // ── API: Load performance for a client ────────────────────

  loadPerformance: async (clientId: string) => {
    try {
      const performance = await api.performance.get(clientId);
      set({ clientPerformance: performance });
    } catch {
      set({ clientPerformance: null });
    }
  },
}));
