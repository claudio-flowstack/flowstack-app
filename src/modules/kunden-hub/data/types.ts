export type ClientStatus =
  | 'qualifying' | 'onboarding' | 'strategy' | 'copy'
  | 'funnel' | 'campaigns' | 'review' | 'live' | 'paused' | 'churned';

export type DeliverableStatus =
  | 'generating' | 'draft' | 'in_review' | 'approved' | 'live'
  | 'rejected' | 'manually_edited' | 'outdated' | 'blocked';

export type DeliverableType =
  | 'strategy_doc' | 'copy_text' | 'funnel_page' | 'ad_creative' | 'campaign' | 'email' | 'video';

export type DeliverableSubtype =
  | 'zielgruppen_avatar' | 'arbeitgeber_avatar' | 'messaging_matrix' | 'creative_briefing' | 'marken_richtlinien'
  | 'lp_text' | 'form_text' | 'danke_text' | 'anzeigen_haupt' | 'anzeigen_retargeting' | 'anzeigen_warmup' | 'videoskript'
  | 'landing_page' | 'formular_page' | 'danke_page'
  | 'initial_campaign' | 'retargeting_campaign' | 'warmup_campaign';

export type PreviewType = 'ad_feed' | 'doc' | 'landing_page' | 'email' | 'campaign_table';

export type PhaseGroup = 'strategy' | 'copy' | 'funnel' | 'campaigns';

export type AlertSeverity = 'critical' | 'warning' | 'info';

export type ConnectionStatus = 'connected' | 'disconnected' | 'error' | 'not_required';

export interface ClientConnection {
  service: string;
  label: string;
  icon: string;
  status: ConnectionStatus;
  accountId?: string;
  accountName?: string;
  externalUrl?: string;
  connectedAt?: string;
  error?: string;
}

export interface Client {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  branche: string;
  status: ClientStatus;
  currentPhase: PhaseGroup | 'onboarding' | 'review' | 'live';
  accountManager: string;
  closeLeadUrl?: string;
  slackChannel?: string;
  driveFolderUrl?: string;
  notionWikiUrl?: string;
  paket?: string;
  monatspreis?: number;
  kickoffDate?: string;
  launchDate?: string;
  createdAt: string;
  kpis?: ClientKpis;
  connections: ClientConnection[];
}

export type FunnelType = 'recruiting' | 'kundengewinnung';

export interface PlatformKpis {
  spend: number;
  leads: number;
  cpl: number;
  impressions: number;
  clicks: number;
  ctr: number;
  conversionRate?: number;
}

export interface ClientKpis {
  spend: number;
  leads: number;
  cpl: number;
  impressions: number;
  clicks: number;
  ctr: number;
  platformData?: Record<string, PlatformKpis>;
  funnelType?: FunnelType;
  // Recruiting
  qualifiedApplicants?: number;
  interviews?: number;
  hires?: number;
  costPerApplication?: number;
  costPerInterview?: number;
  costPerHire?: number;
  // Kundengewinnung
  qualifiedLeads?: number;
  bookedAppointments?: number;
  closedDeals?: number;
  costPerQualifiedLead?: number;
  costPerAppointment?: number;
  costPerDeal?: number;
  customerLifetimeValue?: number;
  // Time-series
  dailyCpl?: number[];
  dailyConversionRate?: number[];
}

export interface Deliverable {
  id: string;
  clientId: string;
  type: DeliverableType;
  subtype: DeliverableSubtype;
  title: string;
  content: string;
  status: DeliverableStatus;
  phase: PhaseGroup;
  blockedBy?: string;
  blockedReason?: string;
  version: number;
  createdBy: 'ai' | 'human';
  editedBy?: string;
  approvedBy?: string;
  approvedAt?: string;
  externalUrl?: string;
  previewType: PreviewType;
  complianceStatus?: 'pending' | 'passed' | 'failed';
  complianceIssues?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Approval {
  id: string;
  deliverableId: string;
  clientId: string;
  clientName: string;
  deliverableTitle: string;
  reviewer: string;
  status: 'pending' | 'approved' | 'rejected' | 'changes_requested';
  comment?: string;
  requestedAt: string;
  respondedAt?: string;
  deadline: string;
}

export interface Alert {
  id: string;
  clientId?: string;
  clientName?: string;
  severity: AlertSeverity;
  title: string;
  description: string;
  action?: string;
  actionUrl?: string;
  createdAt: string;
  acknowledged: boolean;
}

export interface TimelineEvent {
  id: string;
  clientId: string;
  type: 'node_completed' | 'approval_requested' | 'approval_resolved' | 'alert' | 'status_change' | 'manual_edit';
  title: string;
  description?: string;
  timestamp: string;
  actor: string;
}
