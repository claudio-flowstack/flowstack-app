/**
 * Kunden-Hub API Service — typed wrapper around V3 backend (localhost:3002).
 *
 * All response types live here as "FromAPI" interfaces so they stay
 * decoupled from the UI-facing domain types in data/types.ts.
 * The store maps between the two layers.
 */

// ── API response types ──────────────────────────────────────

export interface ClientFromAPI {
  id: string;
  'Client Name': string;
  Ansprechpartner: string;
  Email: string;
  Branche: string;
  'Account Manager': string;
  Status: string;
}

export interface CreateClientInput {
  company: string;
  contact: string;
  email: string;
  branche?: string;
  account_manager?: string;
}

export interface StartExecutionInput {
  company: string;
  email: string;
  contact: string;
  phone?: string;
  branche?: string;
  website?: string;
  stellen?: string;
  budget?: string;
  account_manager?: string;
}

export interface UpdateAdInput {
  headline?: string;
  body?: string;
  cta?: string;
  image_url?: string;
  link_url?: string;
  placement?: string;
  platform?: string;
  status?: string;
}

export interface NodeStatus {
  status: 'running' | 'completed' | 'failed' | 'waiting_approval' | 'blocked';
  result?: Record<string, unknown>;
  error?: string;
  duration_ms?: number;
  updated_at?: string;
}

export interface ExecutionStatus {
  execution_id: string;
  client_name: string;
  context: Record<string, unknown>;
  nodes: Record<string, NodeStatus>;
  paused_at?: string | null;
}

export interface ExecutionSummary {
  execution_id: string;
  client_name: string;
  started_at: string;
  node_count: number;
  completed: number;
  failed: number;
}

export interface DeliverableFromAPI {
  id: string;
  title: string;
  content: string;
  url: string;
  status: string;
  phase: string;
  version: number;
}

export interface PipelinePhase {
  name: string;
  label: string;
  status: 'pending' | 'running' | 'completed' | 'waiting_approval';
  completed_nodes: number;
  total_nodes: number;
  is_current: boolean;
}

export interface PipelineStatus {
  phases: PipelinePhase[];
}

export interface TimelineEventFromAPI {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: string;
  actor: string;
}

export interface DailyPerformanceEntry {
  date: string;
  campaign_id?: string;
  impressions: number;
  clicks: number;
  spend: number;
  leads: number;
}

export interface CampaignBreakdownEntry {
  impressions: number;
  clicks: number;
  spend: number;
  leads: number;
  ctr?: number;
  cpl?: number;
}

export interface PerformanceData {
  summary: {
    impressions: number;
    clicks: number;
    spend: number;
    leads: number;
    ctr: number;
    cpl: number;
  };
  daily?: DailyPerformanceEntry[];
  campaigns_breakdown?: Record<string, CampaignBreakdownEntry>;
  campaigns?: Record<string, unknown>;
}

export interface AdFromAPI {
  id: string;
  name: string;
  campaign_type: string;
  headline: string;
  body: string;
  cta: string;
  image_url: string;
  status: string;
}

export interface ServiceHealth {
  status: string;
  message?: string;
}

export interface HealthStatus {
  healthy: boolean;
  services: Record<string, ServiceHealth>;
}

export interface DocumentFromAPI {
  id: string;
  [key: string]: unknown;
}

export interface BausteinFromAPI {
  id: string;
  [key: string]: unknown;
}

// ── Generic request helper ──────────────────────────────────

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:3002') + '/api/v3';
const API_ROOT = import.meta.env.VITE_API_URL || 'http://localhost:3002';

// API key from env only — no hardcoded fallback in production bundles
const API_KEY = import.meta.env.VITE_API_KEY || '';
if (!API_KEY && import.meta.env.PROD) {
  console.error('[API] VITE_API_KEY not set — API calls will fail');
}

class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(`API ${status}: ${message}`);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function request<T>(path: string, options?: RequestInit, retries = 3): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string> || {}),
  };
  if (API_KEY) headers['X-API-Key'] = API_KEY;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const resp = await fetch(`${API_BASE}${path}`, { ...options, headers });
      if (!resp.ok) {
        const text = await resp.text().catch(() => 'Unknown error');
        const safeMessage = resp.status >= 500 ? 'Server-Fehler' : text;
        // Retry on 5xx, not on 4xx (client errors)
        if (resp.status >= 500 && attempt < retries) {
          await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt))); // 1s, 2s, 4s
          continue;
        }
        throw new ApiError(resp.status, safeMessage);
      }
      return resp.json() as Promise<T>;
    } catch (err) {
      // Network errors (backend offline) — fail immediately, don't retry
      // This allows mock-data fallback to kick in fast
      throw err;
    }
  }
  // Should never reach here, but TypeScript needs it
  throw new ApiError(0, 'Max retries exceeded');
}

// ── Public API object ───────────────────────────────────────

export const api = {
  // ── Clients ────────────────────────────────────────────
  clients: {
    list: () => request<ClientFromAPI[]>('/clients'),

    get: (id: string) => request<ClientFromAPI>(`/clients/${id}`),

    create: (data: CreateClientInput) =>
      request<{ id: string; company: string }>('/clients', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    update: (id: string, data: Partial<ClientFromAPI>) =>
      request<{ updated: boolean; id: string }>(`/clients/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),

    delete: (id: string) =>
      request<{ deleted: boolean; client_name: string; cleanup: Record<string, string> }>(`/clients/${id}`, {
        method: 'DELETE',
      }),
  },

  // ── Execution ──────────────────────────────────────────
  execution: {
    start: (data: StartExecutionInput) =>
      request<{ execution_id: string; client_name: string }>('/execute', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    getStatus: (executionId: string) =>
      request<ExecutionStatus>(`/execute/${executionId}`),

    list: () => request<ExecutionSummary[]>('/executions'),

    executeNode: (executionId: string, nodeId: string, context?: Record<string, unknown>) =>
      request<Record<string, unknown>>('/execute-node', {
        method: 'POST',
        body: JSON.stringify({ executionId, nodeId, context }),
      }),

    pause: (executionId: string) =>
      request<{ status: string; paused_at?: string }>(`/executions/${executionId}/pause`, {
        method: 'POST',
      }),

    resume: (executionId: string) =>
      request<{ status: string }>(`/executions/${executionId}/resume`, {
        method: 'POST',
      }),
  },

  // ── Documents / Deliverables ───────────────────────────
  documents: {
    list: () => request<DocumentFromAPI[]>('/documents'),
  },

  deliverables: {
    approve: (recordId: string, reviewer?: string) =>
      request<{ approved: boolean; id: string }>(`/deliverables/${recordId}/approve`, {
        method: 'POST',
        body: JSON.stringify({ reviewer }),
      }),

    reject: (recordId: string, feedback?: string) =>
      request<{ rejected: boolean; id: string }>(`/deliverables/${recordId}/reject`, {
        method: 'POST',
        body: JSON.stringify({ feedback }),
      }),
  },

  // ── Bausteine ──────────────────────────────────────────
  bausteine: {
    list: () => request<BausteinFromAPI[]>('/bausteine'),
  },

  // ── Approval gates ────────────────────────────────────
  approval: {
    approve: (nodeId: string, reviewer?: string) =>
      request<{ approved: boolean; error?: string }>(
        // Note: approval endpoint is at /api/approval, not /api/v3/approval
        `/../approval/${nodeId}`,
        {
          method: 'POST',
          body: JSON.stringify({ reviewer }),
        },
      ).catch(() => {
        // Fallback: call the non-prefixed path directly
        return fetch(`${API_ROOT}/api/approval/${nodeId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-API-Key': API_KEY },
          body: JSON.stringify({ reviewer }),
        }).then((r) => r.json() as Promise<{ approved: boolean; error?: string }>);
      }),
  },

  // ── Kunden-Hub: Client-Execution ──────────────────────
  clientExecution: {
    get: (clientId: string) =>
      request<ExecutionStatus>(`/clients/${clientId}/execution`),

    start: (clientId: string) =>
      request<{ execution_id: string }>(`/clients/${clientId}/start`, { method: 'POST' }),
  },

  // ── Kunden-Hub: Deliverables (mit Content) ──────────
  clientDeliverables: {
    list: async (clientId: string): Promise<DeliverableFromAPI[]> => {
      const resp = await request<{ deliverables: DeliverableFromAPI[] } | DeliverableFromAPI[]>(`/clients/${clientId}/deliverables`);
      return Array.isArray(resp) ? resp : (resp as { deliverables: DeliverableFromAPI[] }).deliverables || [];
    },

    updateContent: (executionId: string, docKey: string, content: string) =>
      request<{ updated: boolean }>(`/deliverables/${executionId}/${docKey}/content`, {
        method: 'PUT',
        body: JSON.stringify({ content }),
      }),

    approve: (executionId: string, docKey: string, reviewer?: string) =>
      request<{ approved: boolean }>(`/deliverables/${executionId}/${docKey}/approve`, {
        method: 'POST',
        body: JSON.stringify({ reviewer }),
      }),

    reject: (executionId: string, docKey: string, comment?: string) =>
      request<{ rejected: boolean }>(`/deliverables/${executionId}/${docKey}/reject`, {
        method: 'POST',
        body: JSON.stringify({ comment }),
      }),

    regenerate: (executionId: string, docKey: string, feedback?: string) =>
      request<{ status: string }>(`/deliverables/${executionId}/${docKey}/regenerate`, {
        method: 'POST',
        body: JSON.stringify({ feedback }),
      }),
  },

  // ── Kunden-Hub: Pipeline ────────────────────────────
  pipeline: {
    get: async (clientId: string): Promise<PipelineStatus> => {
      const resp = await request<{ phases: PipelineStatus['phases'] } | PipelineStatus>(`/clients/${clientId}/pipeline`);
      return { phases: (resp as { phases: PipelineStatus['phases'] }).phases || [] };
    },
  },

  // ── Kunden-Hub: Timeline ────────────────────────────
  timeline: {
    get: async (clientId: string): Promise<TimelineEventFromAPI[]> => {
      const resp = await request<{ events: TimelineEventFromAPI[] } | TimelineEventFromAPI[]>(`/clients/${clientId}/timeline`);
      return Array.isArray(resp) ? resp : (resp as { events: TimelineEventFromAPI[] }).events || [];
    },
  },

  // ── Kunden-Hub: Performance ─────────────────────────
  performance: {
    get: async (clientId: string): Promise<PerformanceData> => {
      const resp = await request<Record<string, unknown>>(`/clients/${clientId}/performance`);
      const totals = (resp as { totals?: Record<string, unknown> }).totals || {};
      const summary = (resp as { summary?: Record<string, unknown> }).summary || {};
      const src = Object.keys(totals).length > 0 ? totals : summary;
      const impressions = Number(src.impressions ?? 0);
      const clicks = Number(src.clicks ?? 0);
      const spend = Number(src.spend ?? 0);
      const leads = Number(src.leads ?? 0);
      return {
        summary: {
          impressions,
          clicks,
          spend,
          leads,
          ctr: Number(src.ctr ?? 0) || (impressions > 0 ? (clicks / impressions) * 100 : 0),
          cpl: Number(src.cpl ?? 0) || (leads > 0 ? spend / leads : 0),
        },
        daily: (resp as { daily?: PerformanceData['daily'] }).daily,
        campaigns_breakdown: (resp as { campaigns_breakdown?: PerformanceData['campaigns_breakdown'] }).campaigns_breakdown,
        campaigns: (resp as { campaigns?: Record<string, unknown> }).campaigns,
      };
    },
  },

  // ── Kunden-Hub: Ads ─────────────────────────────────
  ads: {
    list: async (clientId: string): Promise<AdFromAPI[]> => {
      const resp = await request<{ ads: AdFromAPI[] } | AdFromAPI[]>(`/clients/${clientId}/ads`);
      return Array.isArray(resp) ? resp : (resp as { ads: AdFromAPI[] }).ads || [];
    },

    update: (adId: string, data: UpdateAdInput) =>
      request<{ updated: boolean }>(`/ads/${adId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
  },

  // ── Health ─────────────────────────────────────────────
  health: {
    full: () => request<HealthStatus>('/health/full'),

    simple: () =>
      fetch(`${API_ROOT}/api/health`)
        .then((r) => r.json() as Promise<{ status: string; handlers: number; version: string }>),
  },
} as const;

export { ApiError };
