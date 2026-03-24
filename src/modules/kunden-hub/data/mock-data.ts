import type { Client, Deliverable, Approval, Alert, TimelineEvent } from './types';

// ─── Client 1: Müller Pflege GmbH — Live, alle Deliverables live, KPIs ───

const muellerConnections = [
  { service: 'meta', label: 'Meta Business Manager', icon: 'logo-meta', status: 'connected' as const, accountId: 'act_123456789', accountName: 'Müller Pflege - Ad Account', externalUrl: 'https://business.facebook.com/adsmanager', connectedAt: '2026-01-15' },
  { service: 'google_drive', label: 'Google Drive', icon: 'FolderOpen', status: 'connected' as const, accountName: 'Müller Pflege GmbH', externalUrl: 'https://drive.google.com/drive/folders/abc123', connectedAt: '2026-01-15' },
  { service: 'slack', label: 'Slack', icon: 'MessageSquare', status: 'connected' as const, accountName: '#client-mueller-pflege', externalUrl: 'https://flowstack.slack.com/channels/client-mueller-pflege', connectedAt: '2026-01-15' },
  { service: 'close', label: 'Close CRM', icon: 'Database', status: 'connected' as const, accountName: 'Müller Pflege GmbH', externalUrl: 'https://app.close.com/lead/lead_abc123', connectedAt: '2026-01-15' },
  { service: 'notion', label: 'Notion', icon: 'BookOpen', status: 'connected' as const, accountName: 'Müller Pflege - Client Wiki', externalUrl: 'https://notion.so/mueller-pflege', connectedAt: '2026-01-15' },
];

const weberConnections = [
  { service: 'meta', label: 'Meta Business Manager', icon: 'logo-meta', status: 'disconnected' as const },
  { service: 'google_drive', label: 'Google Drive', icon: 'FolderOpen', status: 'connected' as const, accountName: 'Weber IT Solutions', externalUrl: 'https://drive.google.com/drive/folders/def456', connectedAt: '2026-02-20' },
  { service: 'slack', label: 'Slack', icon: 'MessageSquare', status: 'connected' as const, accountName: '#client-weber-it', externalUrl: 'https://flowstack.slack.com/channels/client-weber-it', connectedAt: '2026-02-20' },
  { service: 'close', label: 'Close CRM', icon: 'Database', status: 'connected' as const, accountName: 'Weber IT Solutions', externalUrl: 'https://app.close.com/lead/lead_def456', connectedAt: '2026-02-20' },
];

const schmidtConnections = [
  { service: 'meta', label: 'Meta Business Manager', icon: 'logo-meta', status: 'error' as const, accountId: 'act_987654321', error: 'Token abgelaufen - Re-Autorisierung nötig' },
  { service: 'google_drive', label: 'Google Drive', icon: 'FolderOpen', status: 'connected' as const, accountName: 'Schmidt Handwerk', externalUrl: 'https://drive.google.com/drive/folders/ghi789', connectedAt: '2026-01-10' },
  { service: 'slack', label: 'Slack', icon: 'MessageSquare', status: 'connected' as const, accountName: '#client-schmidt-handwerk', externalUrl: 'https://flowstack.slack.com/channels/client-schmidt-handwerk', connectedAt: '2026-01-10' },
];

export const mockClients: Client[] = [
  {
    id: 'client-001',
    name: 'Hans Müller',
    company: 'Müller Pflege GmbH',
    email: 'h.mueller@mueller-pflege.de',
    phone: '+49 170 1234567',
    branche: 'Recruiting',
    paket: 'Recruiting Pro',
    monatspreis: 3500,
    status: 'live',
    currentPhase: 'live',
    accountManager: 'Claudio',
    closeLeadUrl: 'https://app.close.com/lead/lead_abc123',
    slackChannel: '#client-mueller-pflege',
    driveFolderUrl: 'https://drive.google.com/drive/folders/abc123',
    notionWikiUrl: 'https://notion.so/mueller-pflege',
    kickoffDate: '2026-01-15',
    launchDate: '2026-02-28',
    createdAt: '2026-01-10',
    kpis: {
      spend: 4250.80,
      leads: 47,
      cpl: 90.44,
      impressions: 125000,
      clicks: 3200,
      ctr: 2.56,
      funnelType: 'recruiting',
      platformData: {
        meta: { spend: 3200, leads: 38, cpl: 84.21, impressions: 98000, clicks: 2500, ctr: 2.55, conversionRate: 1.52 },
        google: { spend: 1050.80, leads: 9, cpl: 116.76, impressions: 27000, clicks: 700, ctr: 2.59, conversionRate: 1.29 },
      },
      qualifiedApplicants: 28,
      interviews: 12,
      hires: 5,
      costPerApplication: 90.44,
      costPerInterview: 354.23,
      costPerHire: 850.16,
      dailyCpl: [105,98,112,95,88,92,78,85,91,97,103,89,82,79,94,88,86,91,95,84,90,87,93,96,88,82,91,89,85,90],
      dailyConversionRate: [1.2,1.3,1.1,1.4,1.5,1.6,1.8,1.7,1.5,1.4,1.3,1.5,1.6,1.7,1.4,1.5,1.6,1.5,1.4,1.7,1.5,1.6,1.5,1.4,1.5,1.6,1.5,1.4,1.6,1.5],
    },
    connections: muellerConnections,
  },
  {
    id: 'client-002',
    name: 'Lisa Weber',
    company: 'Weber IT Solutions',
    email: 'l.weber@weber-it.de',
    phone: '+49 171 9876543',
    branche: 'Marketing',
    paket: 'Marketing Starter',
    monatspreis: 3000,
    status: 'copy',
    currentPhase: 'copy',
    accountManager: 'Claudio',
    closeLeadUrl: 'https://app.close.com/lead/lead_def456',
    slackChannel: '#client-weber-it',
    driveFolderUrl: 'https://drive.google.com/drive/folders/def456',
    kickoffDate: '2026-02-20',
    createdAt: '2026-02-18',
    connections: weberConnections,
  },
  {
    id: 'client-003',
    name: 'Thomas Schmidt',
    company: 'Schmidt Handwerk',
    email: 't.schmidt@schmidt-handwerk.de',
    phone: '+49 172 5554433',
    branche: 'Recruiting',
    paket: 'Recruiting Basis',
    monatspreis: 2000,
    status: 'paused',
    currentPhase: 'copy',
    accountManager: 'Claudio',
    closeLeadUrl: 'https://app.close.com/lead/lead_ghi789',
    slackChannel: '#client-schmidt-handwerk',
    driveFolderUrl: 'https://drive.google.com/drive/folders/ghi789',
    kickoffDate: '2026-01-10',
    createdAt: '2026-01-05',
    connections: schmidtConnections,
  },
];

// ─── Deliverables ────────────────────────────────────────────────────────────

function makeDeliverable(
  id: string, clientId: string, type: Deliverable['type'], subtype: Deliverable['subtype'],
  title: string, status: Deliverable['status'], phase: Deliverable['phase'],
  previewType: Deliverable['previewType'],
  extras?: Partial<Deliverable>,
): Deliverable {
  return {
    id, clientId, type, subtype, title, status, phase, previewType,
    content: '',
    version: 1,
    createdBy: 'ai',
    createdAt: '2026-03-01',
    updatedAt: '2026-03-15',
    ...extras,
  };
}

// Client 1: Müller — alles live
const muellerDeliverables: Deliverable[] = [
  makeDeliverable('d-m-01', 'client-001', 'strategy_doc', 'zielgruppen_avatar', 'Zielgruppen-Avatar', 'live', 'strategy', 'doc'),
  makeDeliverable('d-m-02', 'client-001', 'strategy_doc', 'arbeitgeber_avatar', 'Arbeitgeber-Avatar', 'live', 'strategy', 'doc'),
  makeDeliverable('d-m-03', 'client-001', 'strategy_doc', 'messaging_matrix', 'Messaging-Matrix', 'live', 'strategy', 'doc'),
  makeDeliverable('d-m-04', 'client-001', 'strategy_doc', 'creative_briefing', 'Creative Briefing', 'live', 'strategy', 'doc'),
  makeDeliverable('d-m-05', 'client-001', 'strategy_doc', 'marken_richtlinien', 'Marken-Richtlinien', 'live', 'strategy', 'doc'),
  makeDeliverable('d-m-06', 'client-001', 'copy_text', 'lp_text', 'Landingpage-Texte', 'live', 'copy', 'doc'),
  makeDeliverable('d-m-07', 'client-001', 'copy_text', 'form_text', 'Formularseite-Texte', 'live', 'copy', 'doc'),
  makeDeliverable('d-m-08', 'client-001', 'copy_text', 'danke_text', 'Dankeseite-Texte', 'live', 'copy', 'doc'),
  makeDeliverable('d-m-09', 'client-001', 'ad_creative', 'anzeigen_haupt', 'Anzeigentexte Haupt', 'live', 'copy', 'ad_feed'),
  makeDeliverable('d-m-10', 'client-001', 'ad_creative', 'anzeigen_retargeting', 'Anzeigentexte Retargeting', 'live', 'copy', 'ad_feed'),
  makeDeliverable('d-m-11', 'client-001', 'ad_creative', 'anzeigen_warmup', 'Anzeigentexte Warmup', 'live', 'copy', 'ad_feed'),
  makeDeliverable('d-m-12', 'client-001', 'video', 'videoskript', 'Videoskript', 'live', 'copy', 'doc'),
  makeDeliverable('d-m-13', 'client-001', 'funnel_page', 'landing_page', 'Landingpage', 'live', 'funnel', 'landing_page'),
  makeDeliverable('d-m-14', 'client-001', 'funnel_page', 'formular_page', 'Formularseite', 'live', 'funnel', 'landing_page'),
  makeDeliverable('d-m-15', 'client-001', 'funnel_page', 'danke_page', 'Dankeseite', 'live', 'funnel', 'landing_page'),
  makeDeliverable('d-m-16', 'client-001', 'campaign', 'initial_campaign', 'Initial-Kampagne', 'live', 'campaigns', 'campaign_table'),
  makeDeliverable('d-m-17', 'client-001', 'campaign', 'retargeting_campaign', 'Retargeting-Kampagne', 'live', 'campaigns', 'campaign_table'),
  makeDeliverable('d-m-18', 'client-001', 'campaign', 'warmup_campaign', 'Warmup-Kampagne', 'live', 'campaigns', 'campaign_table'),
];

// Client 2: Weber — strategy approved, copy draft/generating, rest blocked
const weberDeliverables: Deliverable[] = [
  makeDeliverable('d-w-01', 'client-002', 'strategy_doc', 'zielgruppen_avatar', 'Zielgruppen-Avatar', 'approved', 'strategy', 'doc', { approvedBy: 'Claudio', approvedAt: '2026-03-10' }),
  makeDeliverable('d-w-02', 'client-002', 'strategy_doc', 'arbeitgeber_avatar', 'Arbeitgeber-Avatar', 'approved', 'strategy', 'doc', { approvedBy: 'Claudio', approvedAt: '2026-03-10' }),
  makeDeliverable('d-w-03', 'client-002', 'strategy_doc', 'messaging_matrix', 'Messaging-Matrix', 'approved', 'strategy', 'doc', { approvedBy: 'Claudio', approvedAt: '2026-03-11' }),
  makeDeliverable('d-w-04', 'client-002', 'strategy_doc', 'creative_briefing', 'Creative Briefing', 'approved', 'strategy', 'doc', { approvedBy: 'Claudio', approvedAt: '2026-03-12' }),
  makeDeliverable('d-w-05', 'client-002', 'strategy_doc', 'marken_richtlinien', 'Marken-Richtlinien', 'approved', 'strategy', 'doc', { approvedBy: 'Claudio', approvedAt: '2026-03-12' }),
  makeDeliverable('d-w-06', 'client-002', 'copy_text', 'lp_text', 'Landingpage-Texte', 'draft', 'copy', 'doc'),
  makeDeliverable('d-w-07', 'client-002', 'copy_text', 'form_text', 'Formularseite-Texte', 'draft', 'copy', 'doc'),
  makeDeliverable('d-w-08', 'client-002', 'copy_text', 'danke_text', 'Dankeseite-Texte', 'draft', 'copy', 'doc'),
  makeDeliverable('d-w-09', 'client-002', 'ad_creative', 'anzeigen_haupt', 'Anzeigentexte Haupt', 'draft', 'copy', 'ad_feed'),
  makeDeliverable('d-w-10', 'client-002', 'ad_creative', 'anzeigen_retargeting', 'Anzeigentexte Retargeting', 'generating', 'copy', 'ad_feed'),
  makeDeliverable('d-w-11', 'client-002', 'ad_creative', 'anzeigen_warmup', 'Anzeigentexte Warmup', 'generating', 'copy', 'ad_feed'),
  makeDeliverable('d-w-12', 'client-002', 'video', 'videoskript', 'Videoskript', 'draft', 'copy', 'doc'),
  makeDeliverable('d-w-13', 'client-002', 'funnel_page', 'landing_page', 'Landingpage', 'blocked', 'funnel', 'landing_page', { blockedBy: 'd-w-06', blockedReason: 'Wartet auf: Landingpage-Texte' }),
  makeDeliverable('d-w-14', 'client-002', 'funnel_page', 'formular_page', 'Formularseite', 'blocked', 'funnel', 'landing_page', { blockedBy: 'd-w-07', blockedReason: 'Wartet auf: Formularseite-Texte' }),
  makeDeliverable('d-w-15', 'client-002', 'funnel_page', 'danke_page', 'Dankeseite', 'blocked', 'funnel', 'landing_page', { blockedBy: 'd-w-08', blockedReason: 'Wartet auf: Dankeseite-Texte' }),
  makeDeliverable('d-w-16', 'client-002', 'campaign', 'initial_campaign', 'Initial-Kampagne', 'blocked', 'campaigns', 'campaign_table', { blockedBy: 'd-w-13', blockedReason: 'Wartet auf: Funnel' }),
  makeDeliverable('d-w-17', 'client-002', 'campaign', 'retargeting_campaign', 'Retargeting-Kampagne', 'blocked', 'campaigns', 'campaign_table', { blockedBy: 'd-w-13', blockedReason: 'Wartet auf: Funnel' }),
  makeDeliverable('d-w-18', 'client-002', 'campaign', 'warmup_campaign', 'Warmup-Kampagne', 'blocked', 'campaigns', 'campaign_table', { blockedBy: 'd-w-13', blockedReason: 'Wartet auf: Funnel' }),
];

// Client 3: Schmidt — paused, some rejected, ghost detection
const schmidtDeliverables: Deliverable[] = [
  makeDeliverable('d-s-01', 'client-003', 'strategy_doc', 'zielgruppen_avatar', 'Zielgruppen-Avatar', 'approved', 'strategy', 'doc', { approvedBy: 'Claudio', approvedAt: '2026-02-01' }),
  makeDeliverable('d-s-02', 'client-003', 'strategy_doc', 'arbeitgeber_avatar', 'Arbeitgeber-Avatar', 'approved', 'strategy', 'doc', { approvedBy: 'Claudio', approvedAt: '2026-02-01' }),
  makeDeliverable('d-s-03', 'client-003', 'strategy_doc', 'messaging_matrix', 'Messaging-Matrix', 'rejected', 'strategy', 'doc'),
  makeDeliverable('d-s-04', 'client-003', 'strategy_doc', 'creative_briefing', 'Creative Briefing', 'rejected', 'strategy', 'doc'),
  makeDeliverable('d-s-05', 'client-003', 'strategy_doc', 'marken_richtlinien', 'Marken-Richtlinien', 'draft', 'strategy', 'doc'),
  makeDeliverable('d-s-06', 'client-003', 'copy_text', 'lp_text', 'Landingpage-Texte', 'blocked', 'copy', 'doc', { blockedBy: 'd-s-05', blockedReason: 'Wartet auf: Marken-Richtlinien' }),
  makeDeliverable('d-s-07', 'client-003', 'copy_text', 'form_text', 'Formularseite-Texte', 'blocked', 'copy', 'doc', { blockedBy: 'd-s-05', blockedReason: 'Wartet auf: Marken-Richtlinien' }),
  makeDeliverable('d-s-08', 'client-003', 'copy_text', 'danke_text', 'Dankeseite-Texte', 'blocked', 'copy', 'doc', { blockedBy: 'd-s-05', blockedReason: 'Wartet auf: Marken-Richtlinien' }),
  makeDeliverable('d-s-09', 'client-003', 'ad_creative', 'anzeigen_haupt', 'Anzeigentexte Haupt', 'blocked', 'copy', 'ad_feed', { blockedBy: 'd-s-05', blockedReason: 'Wartet auf: Marken-Richtlinien' }),
  makeDeliverable('d-s-10', 'client-003', 'ad_creative', 'anzeigen_retargeting', 'Anzeigentexte Retargeting', 'blocked', 'copy', 'ad_feed', { blockedBy: 'd-s-05', blockedReason: 'Wartet auf: Marken-Richtlinien' }),
  makeDeliverable('d-s-11', 'client-003', 'ad_creative', 'anzeigen_warmup', 'Anzeigentexte Warmup', 'blocked', 'copy', 'ad_feed', { blockedBy: 'd-s-05', blockedReason: 'Wartet auf: Marken-Richtlinien' }),
  makeDeliverable('d-s-12', 'client-003', 'video', 'videoskript', 'Videoskript', 'blocked', 'copy', 'doc', { blockedBy: 'd-s-05', blockedReason: 'Wartet auf: Marken-Richtlinien' }),
  makeDeliverable('d-s-13', 'client-003', 'funnel_page', 'landing_page', 'Landingpage', 'blocked', 'funnel', 'landing_page', { blockedBy: 'd-s-06', blockedReason: 'Wartet auf: Landingpage-Texte' }),
  makeDeliverable('d-s-14', 'client-003', 'funnel_page', 'formular_page', 'Formularseite', 'blocked', 'funnel', 'landing_page', { blockedBy: 'd-s-07', blockedReason: 'Wartet auf: Formularseite-Texte' }),
  makeDeliverable('d-s-15', 'client-003', 'funnel_page', 'danke_page', 'Dankeseite', 'blocked', 'funnel', 'landing_page', { blockedBy: 'd-s-08', blockedReason: 'Wartet auf: Dankeseite-Texte' }),
  makeDeliverable('d-s-16', 'client-003', 'campaign', 'initial_campaign', 'Initial-Kampagne', 'blocked', 'campaigns', 'campaign_table', { blockedBy: 'd-s-13', blockedReason: 'Wartet auf: Funnel' }),
  makeDeliverable('d-s-17', 'client-003', 'campaign', 'retargeting_campaign', 'Retargeting-Kampagne', 'blocked', 'campaigns', 'campaign_table', { blockedBy: 'd-s-13', blockedReason: 'Wartet auf: Funnel' }),
  makeDeliverable('d-s-18', 'client-003', 'campaign', 'warmup_campaign', 'Warmup-Kampagne', 'blocked', 'campaigns', 'campaign_table', { blockedBy: 'd-s-13', blockedReason: 'Wartet auf: Funnel' }),
];

export const mockDeliverables: Deliverable[] = [
  ...muellerDeliverables,
  ...weberDeliverables,
  ...schmidtDeliverables,
];

// ─── Alerts ──────────────────────────────────────────────────────────────────

export const mockAlerts: Alert[] = [
  {
    id: 'alert-001',
    clientId: 'client-003',
    clientName: 'Schmidt Handwerk',
    severity: 'critical',
    title: 'Ghost-Detection: Keine Antwort seit 14 Tagen',
    description: 'Schmidt Handwerk hat seit 14 Tagen nicht auf Nachrichten reagiert. Automatische Pausierung wird in 3 Tagen ausgelöst.',
    action: 'Kunden kontaktieren',
    actionUrl: '/clients/client-003',
    createdAt: '2026-03-17',
    acknowledged: false,
  },
  {
    id: 'alert-002',
    clientId: 'client-003',
    clientName: 'Schmidt Handwerk',
    severity: 'warning',
    title: 'Meta Token abgelaufen',
    description: 'Der Meta Business Manager Token für Schmidt Handwerk ist abgelaufen. Re-Autorisierung nötig.',
    action: 'Neu verbinden',
    actionUrl: '/clients/client-003',
    createdAt: '2026-03-18',
    acknowledged: false,
  },
  {
    id: 'alert-003',
    severity: 'info',
    title: 'System-Update verfügbar',
    description: 'Eine neue Version der Kampagnen-Templates ist verfügbar. Update empfohlen für neue Clients.',
    createdAt: '2026-03-19',
    acknowledged: false,
  },
];

// ─── Approvals ───────────────────────────────────────────────────────────────

export const mockApprovals: Approval[] = [
  {
    id: 'appr-001',
    deliverableId: 'd-w-06',
    clientId: 'client-002',
    clientName: 'Weber IT Solutions',
    deliverableTitle: 'Landingpage-Texte',
    reviewer: 'Claudio',
    status: 'pending',
    requestedAt: '2026-03-15',
    deadline: '2026-03-22',
  },
  {
    id: 'appr-002',
    deliverableId: 'd-w-07',
    clientId: 'client-002',
    clientName: 'Weber IT Solutions',
    deliverableTitle: 'Formularseite-Texte',
    reviewer: 'Claudio',
    status: 'pending',
    requestedAt: '2026-03-15',
    deadline: '2026-03-22',
  },
  {
    id: 'appr-003',
    deliverableId: 'd-w-08',
    clientId: 'client-002',
    clientName: 'Weber IT Solutions',
    deliverableTitle: 'Dankeseite-Texte',
    reviewer: 'Claudio',
    status: 'pending',
    requestedAt: '2026-03-15',
    deadline: '2026-03-22',
  },
  {
    id: 'appr-004',
    deliverableId: 'd-s-05',
    clientId: 'client-003',
    clientName: 'Schmidt Handwerk',
    deliverableTitle: 'Marken-Richtlinien',
    reviewer: 'Claudio',
    status: 'pending',
    requestedAt: '2026-03-14',
    deadline: '2026-03-21',
  },
  {
    id: 'appr-005',
    deliverableId: 'd-w-09',
    clientId: 'client-002',
    clientName: 'Weber IT Solutions',
    deliverableTitle: 'Anzeigentexte Haupt',
    reviewer: 'Claudio',
    status: 'pending',
    requestedAt: '2026-03-16',
    deadline: '2026-03-23',
  },
];

// ─── Timeline Events ─────────────────────────────────────────────────────────

export const mockTimeline: TimelineEvent[] = [
  {
    id: 'tl-001',
    clientId: 'client-001',
    type: 'status_change',
    title: 'Status auf Live gesetzt',
    description: 'Alle Kampagnen sind aktiv und performen.',
    timestamp: '2026-02-28T14:30:00Z',
    actor: 'system',
  },
  {
    id: 'tl-002',
    clientId: 'client-002',
    type: 'node_completed',
    title: 'Strategie-Phase abgeschlossen',
    description: 'Alle 5 Strategie-Dokumente wurden freigegeben.',
    timestamp: '2026-03-12T10:15:00Z',
    actor: 'Claudio',
  },
  {
    id: 'tl-003',
    clientId: 'client-002',
    type: 'approval_requested',
    title: 'Texte zur Freigabe eingereicht',
    description: '4 Texte warten auf Prüfung.',
    timestamp: '2026-03-15T09:00:00Z',
    actor: 'ai',
  },
  {
    id: 'tl-004',
    clientId: 'client-003',
    type: 'alert',
    title: 'Ghost-Detection ausgelöst',
    description: 'Keine Reaktion seit 14 Tagen.',
    timestamp: '2026-03-17T08:00:00Z',
    actor: 'system',
  },
  {
    id: 'tl-005',
    clientId: 'client-003',
    type: 'approval_resolved',
    title: 'Messaging-Matrix abgelehnt',
    description: 'Kommentar: Zielgruppe zu breit definiert, bitte spezifischer.',
    timestamp: '2026-03-10T16:45:00Z',
    actor: 'Claudio',
  },
  {
    id: 'tl-006',
    clientId: 'client-001',
    type: 'manual_edit',
    title: 'Anzeigentexte Haupt manuell bearbeitet',
    description: 'CTA wurde angepasst.',
    timestamp: '2026-03-05T11:20:00Z',
    actor: 'Claudio',
  },
  {
    id: 'tl-007',
    clientId: 'client-002',
    type: 'node_completed',
    title: 'Copy-Generierung gestartet',
    description: 'KI generiert Texte basierend auf freigegebener Strategie.',
    timestamp: '2026-03-13T08:30:00Z',
    actor: 'ai',
  },
  {
    id: 'tl-008',
    clientId: 'client-003',
    type: 'status_change',
    title: 'Status auf Pausiert gesetzt',
    description: 'Automatische Pausierung durch Ghost-Detection.',
    timestamp: '2026-03-18T07:00:00Z',
    actor: 'system',
  },
];
