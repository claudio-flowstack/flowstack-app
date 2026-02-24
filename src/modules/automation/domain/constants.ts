import type {
  NodeType,
  LabNodeType,
  ResourceType,
  StickyNoteColor,
  FeatureInfo,
} from './types'

// ── Node Type Configuration (5 base types) ────────────────────────────────

export const NODE_TYPE_CONFIG: Record<
  NodeType,
  { color: string; label: string; icon: string }
> = {
  trigger:            { color: '#3b82f6', label: 'Trigger',       icon: 'zap' },
  process:            { color: '#8b5cf6', label: 'Process',       icon: 'workflow' },
  ai:                 { color: '#d946ef', label: 'AI',            icon: 'sparkles' },
  output:             { color: '#10b981', label: 'Output',        icon: 'send' },
  subsystem:          { color: '#6366f1', label: 'Sub-System',    icon: 'layers' },
  ifelse:             { color: '#f59e0b', label: 'If/Else',       icon: 'git-branch' },
  merge:              { color: '#14b8a6', label: 'Merge',         icon: 'git-merge' },
  wait:               { color: '#6b7280', label: 'Wait',          icon: 'clock' },
  iterator:           { color: '#a855f7', label: 'Iterator',      icon: 'repeat' },
  router:             { color: '#ec4899', label: 'Router',        icon: 'shuffle' },
  'error-handler':    { color: '#ef4444', label: 'Error Handler', icon: 'shield-alert' },
  approval:           { color: '#f59e0b', label: 'Approval',      icon: 'shield-check' },
  agent:              { color: '#7c3aed', label: 'AI Agent',      icon: 'brain' },
  fork:               { color: '#0ea5e9', label: 'Fork',          icon: 'git-fork' },
  join:               { color: '#0ea5e9', label: 'Join',          icon: 'git-merge' },
  'condition-agent':  { color: '#a855f7', label: 'AI Condition',  icon: 'brain' },
}

// ── Lab Node Type Configuration (16 types) ────────────────────────────────

export const LAB_NODE_TYPE_CONFIG: Record<
  LabNodeType,
  { bg: string; border: string; accent: string; label: string; labelEn: string }
> = {
  trigger:          { bg: 'rgba(59,130,246,0.07)',  border: 'rgba(59,130,246,0.18)',  accent: '#3b82f6', label: 'Trigger',        labelEn: 'Trigger' },
  process:          { bg: 'rgba(139,92,246,0.07)',  border: 'rgba(139,92,246,0.18)',  accent: '#8b5cf6', label: 'Prozess',        labelEn: 'Process' },
  ai:               { bg: 'rgba(217,70,239,0.07)',  border: 'rgba(217,70,239,0.18)',  accent: '#d946ef', label: 'KI',             labelEn: 'AI' },
  output:           { bg: 'rgba(16,185,129,0.07)',  border: 'rgba(16,185,129,0.18)',  accent: '#10b981', label: 'Output',         labelEn: 'Output' },
  subsystem:        { bg: 'rgba(99,102,241,0.07)',  border: 'rgba(99,102,241,0.22)',  accent: '#6366f1', label: 'Sub-System',     labelEn: 'Sub-System' },
  ifelse:           { bg: 'rgba(245,158,11,0.07)',  border: 'rgba(245,158,11,0.18)',  accent: '#f59e0b', label: 'Wenn/Dann',      labelEn: 'If/Else' },
  merge:            { bg: 'rgba(20,184,166,0.07)',  border: 'rgba(20,184,166,0.18)',  accent: '#14b8a6', label: 'Zusammenf.',     labelEn: 'Merge' },
  wait:             { bg: 'rgba(107,114,128,0.07)', border: 'rgba(107,114,128,0.18)', accent: '#6b7280', label: 'Warten',         labelEn: 'Wait' },
  iterator:         { bg: 'rgba(168,85,247,0.07)',  border: 'rgba(168,85,247,0.18)',  accent: '#a855f7', label: 'Iterator',       labelEn: 'Iterator' },
  router:           { bg: 'rgba(236,72,153,0.07)',  border: 'rgba(236,72,153,0.18)',  accent: '#ec4899', label: 'Router',         labelEn: 'Router' },
  'error-handler':  { bg: 'rgba(239,68,68,0.07)',   border: 'rgba(239,68,68,0.22)',   accent: '#ef4444', label: 'Error Handler',  labelEn: 'Error Handler' },
  approval:         { bg: 'rgba(245,158,11,0.07)',  border: 'rgba(245,158,11,0.22)',  accent: '#f59e0b', label: 'Freigabe',       labelEn: 'Approval' },
  agent:            { bg: 'rgba(124,58,237,0.07)',  border: 'rgba(124,58,237,0.22)',  accent: '#7c3aed', label: 'KI-Agent',       labelEn: 'AI Agent' },
  fork:             { bg: 'rgba(14,165,233,0.07)',  border: 'rgba(14,165,233,0.18)',  accent: '#0ea5e9', label: 'Aufteilen',      labelEn: 'Fork' },
  join:             { bg: 'rgba(14,165,233,0.07)',  border: 'rgba(14,165,233,0.18)',  accent: '#0ea5e9', label: 'Zusammenf.',     labelEn: 'Join' },
  'condition-agent': { bg: 'rgba(168,85,247,0.07)', border: 'rgba(168,85,247,0.22)',  accent: '#a855f7', label: 'KI-Bedingung',   labelEn: 'AI Condition' },
}

// ── Connection Color Themes ────────────────────────────────────────────────

export const CONNECTION_THEMES = [
  {
    key: 'purple',
    label: 'Purple',
    stroke: 'rgba(139,92,246,0.5)',
    fill: '#a855f7',
  },
  {
    key: 'blue',
    label: 'Blue',
    stroke: 'rgba(59,130,246,0.5)',
    fill: '#3b82f6',
  },
  {
    key: 'mono',
    label: 'Mono',
    stroke: 'rgba(156,163,175,0.5)',
    fill: '#9ca3af',
  },
  {
    key: 'neon',
    label: 'Neon',
    stroke: 'rgba(34,211,238,0.5)',
    fill: '#22d3ee',
  },
  {
    key: 'pastel',
    label: 'Pastel',
    stroke: 'rgba(196,181,253,0.5)',
    fill: '#c4b5fd',
  },
  {
    key: 'emerald',
    label: 'Emerald',
    stroke: 'rgba(16,185,129,0.5)',
    fill: '#34d399',
  },
  {
    key: 'sunset',
    label: 'Sunset',
    stroke: 'rgba(249,115,22,0.5)',
    fill: '#fb923c',
  },
  {
    key: 'rose',
    label: 'Rose',
    stroke: 'rgba(244,63,94,0.5)',
    fill: '#fb7185',
  },
] as const

// ── Node Design Themes ─────────────────────────────────────────────────────

export const NODE_DESIGN_THEMES = [
  'nodelab',
  'default',
  'glass',
  'minimal',
  'outlined',
  'neon',
  'gradient',
  'solid',
  'wire',
] as const

export type NodeDesignTheme = (typeof NODE_DESIGN_THEMES)[number]

// ── Node Layouts ───────────────────────────────────────────────────────────

export const NODE_LAYOUTS = [
  'standard',
  'centered',
  'compact',
  'icon-focus',
] as const

export type NodeLayout = (typeof NODE_LAYOUTS)[number]

// ── Sticky Note Colors ─────────────────────────────────────────────────────

export const STICKY_NOTE_COLORS: Record<StickyNoteColor, string> = {
  yellow: '#facc15',
  blue: '#3b82f6',
  green: '#22c55e',
  pink: '#ec4899',
  orange: '#f97316',
  purple: '#8b5cf6',
  red: '#ef4444',
  gray: '#6b7280',
}

// ── Group Colors ───────────────────────────────────────────────────────────

export const GROUP_COLORS: Record<
  string,
  { bg: string; border: string; text: string; name: string }
> = {
  blue: {
    bg: 'rgba(59,130,246,0.05)',
    border: 'rgba(59,130,246,0.18)',
    text: 'rgba(59,130,246,0.55)',
    name: 'Blue',
  },
  green: {
    bg: 'rgba(16,185,129,0.05)',
    border: 'rgba(16,185,129,0.18)',
    text: 'rgba(16,185,129,0.55)',
    name: 'Green',
  },
  purple: {
    bg: 'rgba(139,92,246,0.05)',
    border: 'rgba(139,92,246,0.18)',
    text: 'rgba(139,92,246,0.55)',
    name: 'Purple',
  },
  orange: {
    bg: 'rgba(245,158,11,0.05)',
    border: 'rgba(245,158,11,0.18)',
    text: 'rgba(245,158,11,0.55)',
    name: 'Orange',
  },
  red: {
    bg: 'rgba(239,68,68,0.05)',
    border: 'rgba(239,68,68,0.18)',
    text: 'rgba(239,68,68,0.55)',
    name: 'Red',
  },
  gray: {
    bg: 'rgba(107,114,128,0.04)',
    border: 'rgba(107,114,128,0.15)',
    text: 'rgba(107,114,128,0.45)',
    name: 'Gray',
  },
  pink: {
    bg: 'rgba(236,72,153,0.05)',
    border: 'rgba(236,72,153,0.18)',
    text: 'rgba(236,72,153,0.55)',
    name: 'Pink',
  },
  yellow: {
    bg: 'rgba(250,204,21,0.05)',
    border: 'rgba(250,204,21,0.18)',
    text: 'rgba(250,204,21,0.55)',
    name: 'Yellow',
  },
}

// ── Resource Types ─────────────────────────────────────────────────────────

export const RESOURCE_TYPES: {
  value: ResourceType
  label: string
  icon: string
}[] = [
  { value: 'transcript', label: 'Transcript', icon: 'mic' },
  { value: 'document', label: 'Document', icon: 'file-text' },
  { value: 'note', label: 'Note', icon: 'clipboard' },
  { value: 'dataset', label: 'Dataset', icon: 'database' },
  { value: 'form', label: 'Form', icon: 'layout-dashboard' },
  { value: 'page', label: 'Page', icon: 'globe' },
]

// ── Automation Tabs ────────────────────────────────────────────────────────

export const AUTOMATION_TABS = [
  { key: 'systems',   label: 'Systems',   icon: 'boxes' },
  { key: 'templates', label: 'Templates', icon: 'layout-template' },
  { key: 'funnels',   label: 'Funnels',   icon: 'trending-up' },
  { key: 'nodelab',   label: 'Node Lab',  icon: 'flask-conical' },
] as const

export type AutomationTab = (typeof AUTOMATION_TABS)[number]['key']

// ── Palette Items (full registry from AI Automation) ──────────────────────

export interface PaletteItem {
  icon: string
  tKey: string
  descKey: string
  label?: string
  type: NodeType
  category: string
}

export const PALETTE_ITEMS: PaletteItem[] = [
  // ── TRIGGER ────────────────────────────────────────────────────────────
  { icon: 'logo-typeform',      tKey: 'palette.formTrigger',       descKey: 'palette.formTrigger.desc',       label: 'Typeform',           type: 'trigger', category: 'palette.cat.trigger' },
  { icon: 'logo-calendly',      tKey: 'palette.bookingTrigger',    descKey: 'palette.bookingTrigger.desc',    label: 'Calendly',           type: 'trigger', category: 'palette.cat.trigger' },
  { icon: 'logo-gmail',         tKey: 'palette.emailTrigger',      descKey: 'palette.emailTrigger.desc',      label: 'Gmail Trigger',      type: 'trigger', category: 'palette.cat.trigger' },
  { icon: 'calendar',           tKey: 'palette.schedule',          descKey: 'palette.schedule.desc',          label: 'Zeitplan',           type: 'trigger', category: 'palette.cat.trigger' },
  { icon: 'logo-hubspot',       tKey: 'palette.crmTrigger',        descKey: 'palette.crmTrigger.desc',        label: 'HubSpot Trigger',    type: 'trigger', category: 'palette.cat.trigger' },
  { icon: 'logo-meta',          tKey: 'palette.socialTrigger',     descKey: 'palette.socialTrigger.desc',     label: 'Meta Trigger',       type: 'trigger', category: 'palette.cat.trigger' },
  { icon: 'logo-stripe',        tKey: 'palette.paymentTrigger',    descKey: 'palette.paymentTrigger.desc',    label: 'Stripe Trigger',     type: 'trigger', category: 'palette.cat.trigger' },
  { icon: 'logo-google-sheets', tKey: 'palette.sheetTrigger',      descKey: 'palette.sheetTrigger.desc',      label: 'Google Sheets Trigger', type: 'trigger', category: 'palette.cat.trigger' },
  { icon: 'play',               tKey: 'palette.manualTrigger',     descKey: 'palette.manualTrigger.desc',     label: 'Manueller Trigger',  type: 'trigger', category: 'palette.cat.trigger' },
  { icon: 'webhook',            tKey: 'palette.webhook',           descKey: 'palette.webhook.desc',           label: 'Webhook',            type: 'trigger', category: 'palette.cat.trigger' },
  { icon: 'logo-zapier',        tKey: 'palette.automationTrigger', descKey: 'palette.automationTrigger.desc', label: 'Zapier Trigger',     type: 'trigger', category: 'palette.cat.trigger' },

  // ── KI / AI ─────────────────────────────────────────────────────────────
  { icon: 'logo-openai',    tKey: 'palette.aiGenerate',   descKey: 'palette.aiGenerate.desc',   label: 'OpenAI',           type: 'ai', category: 'palette.cat.ai' },
  { icon: 'logo-claude',    tKey: 'palette.aiAgent',      descKey: 'palette.aiAgent.desc',      label: 'Claude AI Agent',  type: 'ai', category: 'palette.cat.ai' },
  { icon: 'logo-openai',    tKey: 'palette.aiAnalysis',   descKey: 'palette.aiAnalysis.desc',   label: 'KI-Analyse',       type: 'ai', category: 'palette.cat.ai' },
  { icon: 'brain',          tKey: 'palette.aiClassifier', descKey: 'palette.aiClassifier.desc', label: 'KI-Klassifikator', type: 'ai', category: 'palette.cat.ai' },
  { icon: 'message-square', tKey: 'palette.aiChat',       descKey: 'palette.aiChat.desc',       label: 'KI-Chat',          type: 'ai', category: 'palette.cat.ai' },
  { icon: 'file-text',      tKey: 'palette.aiSummarize',  descKey: 'palette.aiSummarize.desc',  label: 'Zusammenfassung',  type: 'ai', category: 'palette.cat.ai' },
  { icon: 'heart',          tKey: 'palette.aiFeedback',   descKey: 'palette.aiFeedback.desc',   label: 'Sentiment',        type: 'ai', category: 'palette.cat.ai' },
  { icon: 'languages',      tKey: 'palette.aiTranslate',  descKey: 'palette.aiTranslate.desc',  label: 'Übersetzer',       type: 'ai', category: 'palette.cat.ai' },
  { icon: 'eye',            tKey: 'palette.aiVision',     descKey: 'palette.aiVision.desc',     label: 'Vision',           type: 'ai', category: 'palette.cat.ai' },
  { icon: 'scan',           tKey: 'palette.aiExtract',    descKey: 'palette.aiExtract.desc',    label: 'Extraktor',        type: 'ai', category: 'palette.cat.ai' },
  { icon: 'brain',          tKey: 'palette.kiAgent',        descKey: 'palette.kiAgent.desc',        label: 'KI-Agent',        type: 'agent',            category: 'palette.cat.ai' },
  { icon: 'brain',          tKey: 'palette.conditionAgent',  descKey: 'palette.conditionAgent.desc',  label: 'KI-Bedingung',    type: 'condition-agent',  category: 'palette.cat.ai' },

  // ── LOGIK & FLOW ───────────────────────────────────────────────────────
  { icon: 'git-branch',   tKey: 'palette.ifElse',       descKey: 'palette.ifElse.desc',       label: 'If/Else',        type: 'ifelse', category: 'palette.cat.logic' },
  { icon: 'filter',       tKey: 'palette.filter',       descKey: 'palette.filter.desc',       label: 'Filter',         type: 'process', category: 'palette.cat.logic' },
  { icon: 'split',        tKey: 'palette.split',        descKey: 'palette.split.desc',        label: 'Split',          type: 'process', category: 'palette.cat.logic' },
  { icon: 'shuffle',      tKey: 'palette.switch',       descKey: 'palette.switch.desc',       label: 'Switch',         type: 'process', category: 'palette.cat.logic' },
  { icon: 'git-merge',    tKey: 'palette.merge',        descKey: 'palette.merge.desc',        label: 'Merge',          type: 'merge', category: 'palette.cat.logic' },
  { icon: 'repeat',       tKey: 'palette.loop',         descKey: 'palette.loop.desc',         label: 'Loop',           type: 'iterator', category: 'palette.cat.logic' },
  { icon: 'clock',        tKey: 'palette.delay',        descKey: 'palette.delay.desc',        label: 'Delay',          type: 'wait', category: 'palette.cat.logic' },
  { icon: 'timer',        tKey: 'palette.timer',        descKey: 'palette.timer.desc',        label: 'Timer',          type: 'process', category: 'palette.cat.logic' },
  { icon: 'scale',        tKey: 'palette.abTest',       descKey: 'palette.abTest.desc',       label: 'A/B Test',       type: 'process', category: 'palette.cat.logic' },
  { icon: 'shield-alert', tKey: 'palette.errorHandler', descKey: 'palette.errorHandler.desc', label: 'Error Handler',  type: 'error-handler', category: 'palette.cat.logic' },
  { icon: 'shuffle',    tKey: 'palette.router',         descKey: 'palette.router.desc',         label: 'Router',          type: 'router',           category: 'palette.cat.logic' },
  { icon: 'git-fork',   tKey: 'palette.fork',           descKey: 'palette.fork.desc',           label: 'Fork',            type: 'fork',             category: 'palette.cat.logic' },
  { icon: 'git-merge',  tKey: 'palette.join',           descKey: 'palette.join.desc',           label: 'Join',            type: 'join',             category: 'palette.cat.logic' },

  // ── DATEN & APPS ───────────────────────────────────────────────────────
  { icon: 'logo-google-sheets', tKey: 'palette.data',        descKey: 'palette.data.desc',        label: 'Google Sheets',  type: 'process', category: 'palette.cat.data' },
  { icon: 'logo-airtable',      tKey: 'palette.database',    descKey: 'palette.database.desc',    label: 'Airtable',       type: 'process', category: 'palette.cat.data' },
  { icon: 'logo-hubspot',       tKey: 'palette.crm',         descKey: 'palette.crm.desc',         label: 'HubSpot',        type: 'process', category: 'palette.cat.data' },
  { icon: 'logo-salesforce',    tKey: 'palette.salesforce',  descKey: 'palette.salesforce.desc',  label: 'Salesforce',     type: 'process', category: 'palette.cat.data' },
  { icon: 'logo-pipedrive',     tKey: 'palette.pipedrive',   descKey: 'palette.pipedrive.desc',   label: 'Pipedrive',      type: 'process', category: 'palette.cat.data' },
  { icon: 'bookmark',           tKey: 'palette.variable',    descKey: 'palette.variable.desc',    label: 'Variable',       type: 'process', category: 'palette.cat.data' },
  { icon: 'copy-check',         tKey: 'palette.dedup',       descKey: 'palette.dedup.desc',       label: 'Deduplizierung', type: 'process', category: 'palette.cat.data' },
  { icon: 'package',            tKey: 'palette.aggregate',   descKey: 'palette.aggregate.desc',   label: 'Aggregator',     type: 'process', category: 'palette.cat.data' },
  { icon: 'type',               tKey: 'palette.template',    descKey: 'palette.template.desc',    label: 'Template',       type: 'process', category: 'palette.cat.data' },
  { icon: 'file-json',          tKey: 'palette.transform',   descKey: 'palette.transform.desc',   label: 'Transform',      type: 'process', category: 'palette.cat.data' },
  { icon: 'file-search',        tKey: 'palette.search',      descKey: 'palette.search.desc',      label: 'Suche',          type: 'process', category: 'palette.cat.data' },
  { icon: 'shield-check',       tKey: 'palette.approval',    descKey: 'palette.approval.desc',    label: 'Freigabe',       type: 'approval', category: 'palette.cat.data' },
  { icon: 'code',               tKey: 'palette.code',        descKey: 'palette.code.desc',        label: 'Code',           type: 'process', category: 'palette.cat.data' },
  { icon: 'globe',              tKey: 'palette.httpRequest',  descKey: 'palette.httpRequest.desc', label: 'HTTP Request',   type: 'process', category: 'palette.cat.data' },

  // ── KOMMUNIKATION ──────────────────────────────────────────────────────
  { icon: 'logo-gmail',     tKey: 'palette.email',        descKey: 'palette.email.desc',        label: 'Gmail',         type: 'output', category: 'palette.cat.comm' },
  { icon: 'logo-slack',     tKey: 'palette.slack',        descKey: 'palette.slack.desc',        label: 'Slack',         type: 'output', category: 'palette.cat.comm' },
  { icon: 'logo-whatsapp',  tKey: 'palette.whatsapp',     descKey: 'palette.whatsapp.desc',     label: 'WhatsApp',      type: 'output', category: 'palette.cat.comm' },
  { icon: 'bell',           tKey: 'palette.notification', descKey: 'palette.notification.desc', label: 'Benachrichtigung', type: 'output', category: 'palette.cat.comm' },
  { icon: 'smartphone',     tKey: 'palette.sms',          descKey: 'palette.sms.desc',          label: 'SMS',           type: 'output', category: 'palette.cat.comm' },
  { icon: 'logo-teams',     tKey: 'palette.teams',        descKey: 'palette.teams.desc',        label: 'Microsoft Teams', type: 'output', category: 'palette.cat.comm' },
  { icon: 'logo-telegram',  tKey: 'palette.telegram',     descKey: 'palette.telegram.desc',     label: 'Telegram',      type: 'output', category: 'palette.cat.comm' },
  { icon: 'logo-mailchimp', tKey: 'palette.newsletter',   descKey: 'palette.newsletter.desc',   label: 'Mailchimp',     type: 'output', category: 'palette.cat.comm' },

  // ── INHALTE & DOKUMENTE ────────────────────────────────────────────────
  { icon: 'logo-google-docs',  tKey: 'palette.document',    descKey: 'palette.document.desc',    label: 'Google Docs',    type: 'output', category: 'palette.cat.content' },
  { icon: 'logo-google-drive', tKey: 'palette.fileStorage', descKey: 'palette.fileStorage.desc', label: 'Google Drive',   type: 'output', category: 'palette.cat.content' },
  { icon: 'logo-notion',       tKey: 'palette.notion',      descKey: 'palette.notion.desc',      label: 'Notion',         type: 'output', category: 'palette.cat.content' },
  { icon: 'logo-wordpress',    tKey: 'palette.website',     descKey: 'palette.website.desc',     label: 'WordPress',      type: 'output', category: 'palette.cat.content' },
  { icon: 'file-type-2',       tKey: 'palette.pdf',         descKey: 'palette.pdf.desc',         label: 'PDF erstellen',  type: 'output', category: 'palette.cat.content' },
  { icon: 'image-plus',        tKey: 'palette.imageCreate', descKey: 'palette.imageCreate.desc', label: 'Bild erstellen', type: 'output', category: 'palette.cat.content' },
  { icon: 'video',             tKey: 'palette.video',       descKey: 'palette.video.desc',       label: 'Video',          type: 'output', category: 'palette.cat.content' },

  // ── SOCIAL MEDIA & ADS ────────────────────────────────────────────────
  { icon: 'logo-meta',        tKey: 'palette.social',    descKey: 'palette.social.desc',    label: 'Meta',             type: 'output', category: 'palette.cat.social' },
  { icon: 'logo-instagram',   tKey: 'palette.instagram', descKey: 'palette.instagram.desc', label: 'Instagram',        type: 'output', category: 'palette.cat.social' },
  { icon: 'logo-linkedin',    tKey: 'palette.linkedin',  descKey: 'palette.linkedin.desc',  label: 'LinkedIn',         type: 'output', category: 'palette.cat.social' },
  { icon: 'logo-tiktok',      tKey: 'palette.tiktok',    descKey: 'palette.tiktok.desc',    label: 'TikTok',           type: 'output', category: 'palette.cat.social' },
  { icon: 'logo-youtube',     tKey: 'palette.youtube',   descKey: 'palette.youtube.desc',   label: 'YouTube',          type: 'output', category: 'palette.cat.social' },
  { icon: 'logo-google-ads',  tKey: 'palette.ads',       descKey: 'palette.ads.desc',       label: 'Google Ads',       type: 'output', category: 'palette.cat.social' },

  // ── ANALYTICS & ZAHLUNGEN ─────────────────────────────────────────────
  { icon: 'logo-google-analytics', tKey: 'palette.dashboard',  descKey: 'palette.dashboard.desc',  label: 'Google Analytics', type: 'output', category: 'palette.cat.analytics' },
  { icon: 'logo-stripe',           tKey: 'palette.payment',    descKey: 'palette.payment.desc',    label: 'Stripe',           type: 'output', category: 'palette.cat.analytics' },
  { icon: 'gauge',                 tKey: 'palette.monitoring', descKey: 'palette.monitoring.desc', label: 'Monitoring',       type: 'output', category: 'palette.cat.analytics' },
]

// ── Funnel Templates ───────────────────────────────────────────────────────

export const FUNNEL_TEMPLATES = [
  {
    id: 'tpl-leadgen',
    name: 'Lead Generation Funnel',
    description: 'Ads to landing page to CRM with automated follow-up',
    icon: 'trending-up',
    category: 'Marketing',
  },
  {
    id: 'tpl-webinar',
    name: 'Webinar Funnel',
    description: 'Social ads to registration to webinar to checkout',
    icon: 'video',
    category: 'Marketing',
  },
  {
    id: 'tpl-ecommerce',
    name: 'E-Commerce Funnel',
    description: 'Product ads to shop to cart to checkout with retargeting',
    icon: 'shopping-cart',
    category: 'Sales',
  },
  {
    id: 'tpl-saas-trial',
    name: 'SaaS Trial Funnel',
    description: 'Content marketing to free trial to onboarding to conversion',
    icon: 'rocket',
    category: 'Product',
  },
  {
    id: 'tpl-booking',
    name: 'Booking Funnel',
    description: 'Ads to landing page to calendar booking to confirmation',
    icon: 'calendar',
    category: 'Service',
  },
] as const

// ── NodeLab Features (37 features: V2 + V3 + V4) ──────────────────────────

export const NODELAB_FEATURES: FeatureInfo[] = [
  // ── V2 Features (22) ────────────────────────────────────────────────────
  { id: 'execution-bubbles', name: 'Execution Bubbles', nameEn: 'Execution Bubbles', source: 'Make.com', tier: 1, enabled: true, introducedIn: 'v2',
    description: 'Grüne/Rote Blasen auf Nodes nach Ausführung. Zeigen Anzahl verarbeiteter Items.',
    descriptionEn: 'Green/Red bubbles on nodes after execution showing processed item count.' },
  { id: 'click-to-inspect', name: 'Click-to-Inspect', nameEn: 'Click-to-Inspect', source: 'Make.com', tier: 1, enabled: true, introducedIn: 'v2',
    description: 'Klick auf Node öffnet Side-Panel mit Input/Output-Daten der letzten Execution.',
    descriptionEn: 'Click on node opens side panel with input/output data from last execution.' },
  { id: 'roi-dashboard', name: 'ROI Dashboard', nameEn: 'ROI Dashboard', source: 'Zapier', tier: 1, enabled: true, introducedIn: 'v2',
    description: 'KPI-Cards mit berechneter Zeitersparnis, Executions und Erfolgsrate.',
    descriptionEn: 'KPI cards showing calculated time savings, executions and success rate.' },
  { id: 'execution-history', name: 'Execution History', nameEn: 'Execution History', source: 'n8n', tier: 1, enabled: true, introducedIn: 'v2',
    description: 'Timeline vergangener Ausführungen mit Status, Dauer und Item-Count.',
    descriptionEn: 'Timeline of past executions with status, duration and item count.' },
  { id: 'data-pinning', name: 'Data Pinning', nameEn: 'Data Pinning', source: 'n8n', tier: 2, enabled: true, introducedIn: 'v2',
    description: 'Node-Output-Daten "einfrieren" für Tests ohne erneute API-Calls.',
    descriptionEn: 'Pin node output data for testing without repeated API calls.' },
  { id: 'execution-replay', name: 'Execution Replay', nameEn: 'Execution Replay', source: 'n8n / Make', tier: 2, enabled: true, introducedIn: 'v2',
    description: 'Schritt-für-Schritt Replay mit Play/Pause/Step Controls und Timeline.',
    descriptionEn: 'Step-by-step replay with Play/Pause/Step controls and timeline.' },
  { id: 'partial-execution', name: 'Partial Execution', nameEn: 'Partial Execution', source: 'n8n', tier: 2, enabled: true, introducedIn: 'v2',
    description: 'Einzelne Nodes oder Node-Gruppen ausführen ohne ganzen Workflow zu starten.',
    descriptionEn: 'Execute individual nodes without running the entire workflow.' },
  { id: 'ifelse-routing', name: 'If-Else Routing', nameEn: 'If-Else Routing', source: 'Make.com', tier: 2, enabled: true, introducedIn: 'v2',
    description: 'Neue Node-Typen: If-Else, Router, Merge für bedingte Pfade.',
    descriptionEn: 'New node types: If-Else, Router, Merge for conditional paths.' },
  { id: 'path-merging', name: 'Path Merging', nameEn: 'Path Merging', source: 'Relay.app', tier: 2, enabled: true, introducedIn: 'v2',
    description: 'Bedingte Pfade nach Verzweigung wieder zusammenführen.',
    descriptionEn: 'Merge conditional paths back together after branching.' },
  { id: 'grouped-nodes', name: 'Grouped Nodes', nameEn: 'Grouped Nodes', source: 'Zapier', tier: 2, enabled: true, introducedIn: 'v2',
    description: 'Visuelle Container um Node-Gruppen mit Farben und Labels.',
    descriptionEn: 'Visual containers around node groups with colors and labels.' },
  { id: 'custom-colors', name: 'Custom Colors', nameEn: 'Custom Colors', source: 'Zapier', tier: 3, enabled: true, introducedIn: 'v2',
    description: 'Jeder Node kann individuelle Farbe bekommen.',
    descriptionEn: 'Each node can have an individual custom color.' },
  { id: 'annotations', name: 'Sticky Notes', nameEn: 'Sticky Notes', source: 'n8n', tier: 3, enabled: true, introducedIn: 'v2',
    description: 'Farbige Notizen direkt auf dem Canvas platzieren.',
    descriptionEn: 'Place colored notes directly on the canvas.' },
  { id: 'live-data-preview', name: 'Live Data Previews', nameEn: 'Live Data Previews', source: 'Relay.app', tier: 2, enabled: true, introducedIn: 'v2',
    description: 'Echtzeit-Datenvorschau direkt auf den Nodes.',
    descriptionEn: 'Real-time data preview directly on nodes.' },
  { id: 'iterator-vis', name: 'Iterator Visualization', nameEn: 'Iterator Visualization', source: 'Relay.app', tier: 3, enabled: true, introducedIn: 'v2',
    description: 'Klare visuelle Darstellung von Schleifen und Array-Processing.',
    descriptionEn: 'Clear visual representation of loops and array processing.' },
  { id: 'wait-steps', name: 'Wait Steps', nameEn: 'Wait Steps', source: 'Relay.app', tier: 3, enabled: true, introducedIn: 'v2',
    description: 'Visuelle Timer und Bedingungen für Warteschritte.',
    descriptionEn: 'Visual timers and conditions for wait steps.' },
  { id: 'expression-editor', name: 'Expression Editor', nameEn: 'Expression Editor', source: 'n8n', tier: 3, enabled: true, introducedIn: 'v2',
    description: 'Editor mit Variable-Browser und Syntax-Highlighting für Ausdrücke.',
    descriptionEn: 'Editor with variable browser and syntax highlighting for expressions.' },
  { id: 'custom-variables', name: 'Custom Variables', nameEn: 'Custom Variables', source: 'n8n', tier: 3, enabled: true, introducedIn: 'v2',
    description: 'Wiederverwendbare Variablen über mehrere Workflows hinweg.',
    descriptionEn: 'Reusable variables across multiple workflows.' },
  { id: 'insights-dashboard', name: 'Insights Dashboard', nameEn: 'Insights Dashboard', source: 'n8n', tier: 2, enabled: true, introducedIn: 'v2',
    description: 'Analytics mit Execution-Trends, Fehlerrate, Performance-Metriken.',
    descriptionEn: 'Analytics with execution trends, error rate, performance metrics.' },
  { id: 'workflow-versioning', name: 'Workflow Versioning', nameEn: 'Workflow Versioning', source: 'n8n', tier: 3, enabled: true, introducedIn: 'v2',
    description: 'Version History Timeline mit Rollback und Diff-View.',
    descriptionEn: 'Version history timeline with rollback and diff view.' },
  { id: 'node-clustering', name: 'Node Clustering', nameEn: 'Node Clustering', source: 'n8n', tier: 3, enabled: false, introducedIn: 'v2',
    description: 'Mehrere Nodes zu Cluster-Nodes gruppieren mit Collapse/Expand.',
    descriptionEn: 'Group multiple nodes into cluster nodes with collapse/expand.' },
  { id: 'circular-design', name: 'Circular Design', nameEn: 'Circular Design Toggle', source: 'Make.com', tier: 3, enabled: false, introducedIn: 'v2',
    description: 'Umschalten zwischen rechteckigen und runden Node-Formen.',
    descriptionEn: 'Toggle between rectangular and circular node shapes.' },
  { id: 'module-types', name: 'Modul-Typen-System', nameEn: 'Module Type System', source: 'Make.com', tier: 3, enabled: true, introducedIn: 'v2',
    description: 'Klares Typen-System mit 10 Node-Typen und visueller Kennzeichnung.',
    descriptionEn: 'Clear type system with 10 node types and visual indicators.' },

  // ── V3 Features (5) ─────────────────────────────────────────────────────
  { id: 'retry-config', name: 'Retry-Konfiguration', nameEn: 'Retry Configuration', source: 'n8n / Temporal', tier: 1, enabled: true, introducedIn: 'v3',
    description: 'Retry-Count, Delay und Backoff-Strategie (linear, exponential, jitter) pro Node. Visuelles Badge.',
    descriptionEn: 'Retry count, delay and backoff strategy (linear, exponential, jitter) per node with visual badge.' },
  { id: 'error-handlers', name: 'Error Handler Nodes', nameEn: 'Error Handler Nodes', source: 'n8n / Windmill', tier: 1, enabled: true, introducedIn: 'v3',
    description: 'Spezieller Node-Typ mit roter gestrichelter Verbindung. Fängt Fehler automatisch ab.',
    descriptionEn: 'Special node type with red dashed connection. Automatically catches errors from connected nodes.' },
  { id: 'circuit-breaker', name: 'Circuit Breaker', nameEn: 'Circuit Breaker', source: 'Temporal', tier: 1, enabled: true, introducedIn: 'v3',
    description: 'Ampel-Indikator: Grün (geschlossen), Gelb (halb-offen), Rot (offen). Stoppt nach N Fehlern.',
    descriptionEn: 'Traffic light indicator: Green (closed), Yellow (half-open), Red (open). Stops after N failures.' },
  { id: 'schema-types', name: 'Schema/Type-Visualisierung', nameEn: 'Schema/Type Visualization', source: 'Make.com / Windmill', tier: 1, enabled: true, introducedIn: 'v3',
    description: 'Farbcodierte Ports: Blau=String, Grün=Number, Lila=Object, Orange=Array, Pink=Boolean.',
    descriptionEn: 'Color-coded ports: Blue=String, Green=Number, Purple=Object, Orange=Array, Pink=Boolean.' },
  { id: 'approval-nodes', name: 'Approval / Human-in-the-Loop', nameEn: 'Approval / Human-in-the-Loop', source: 'Relay.app / n8n', tier: 1, enabled: true, introducedIn: 'v3',
    description: 'Workflow pausiert für menschliche Freigabe. Accept/Reject mit Assignee und Deadline.',
    descriptionEn: 'Workflow pauses for human approval. Accept/Reject with assignee and deadline.' },

  // ── V4 Features (10) ────────────────────────────────────────────────────
  { id: 'ai-agent-node', name: 'KI-Agent mit Tool-Routing', nameEn: 'AI Agent with Tool-Routing', source: 'LangChain / n8n', tier: 1, enabled: true, introducedIn: 'v4',
    description: 'Neuer Agent-Node mit verbundenen Tool-Nodes. Reasoning-Trace im Inspect-Panel.',
    descriptionEn: 'New agent node with connected tool nodes. Reasoning trace in inspect panel.' },
  { id: 'mcp-badges', name: 'MCP-Integration Badges', nameEn: 'MCP Integration Badges', source: 'Anthropic MCP', tier: 1, enabled: true, introducedIn: 'v4',
    description: 'Lila MCP-Badge auf AI/Agent-Nodes. Gestrichelte lila MCP-Verbindungen.',
    descriptionEn: 'Purple MCP badge on AI/Agent nodes. Dashed purple MCP connections.' },
  { id: 'draft-published', name: 'Draft/Published Status', nameEn: 'Draft/Published States', source: 'n8n 2.0', tier: 1, enabled: true, introducedIn: 'v4',
    description: 'Gelbes "Draft" / Grünes "Published" Badge. Publish-Button mit Bestätigung.',
    descriptionEn: 'Yellow "Draft" / Green "Published" badge. Publish button with confirmation.' },
  { id: 'breakpoints', name: 'Breakpoints & Step-Debugging', nameEn: 'Breakpoints & Step-Through', source: 'VS Code / n8n', tier: 1, enabled: true, introducedIn: 'v4',
    description: 'Rechtsklick Breakpoint (roter Punkt). Simulation pausiert. Step Over/Continue.',
    descriptionEn: 'Right-click breakpoint (red dot). Simulation pauses. Step Over/Continue.' },
  { id: 'parallel-lanes', name: 'Parallele Ausführung (Fork/Join)', nameEn: 'Parallel Execution (Fork/Join)', source: 'Temporal / Airflow', tier: 1, enabled: true, introducedIn: 'v4',
    description: 'Fork/Join Nodes. Mehrere Branches laufen gleichzeitig mit parallelen Execution-Bubbles.',
    descriptionEn: 'Fork/Join nodes. Multiple branches execute simultaneously with parallel bubbles.' },
  { id: 'blueprint-export', name: 'Blueprint Export/Import', nameEn: 'Blueprint Export/Import', source: 'n8n / Make.com', tier: 1, enabled: true, introducedIn: 'v4',
    description: 'Download-Button exportiert Workflow als JSON. Upload importiert mit Vorschau.',
    descriptionEn: 'Download exports workflow as JSON. Upload imports with preview.' },
  { id: 'condition-agent-node', name: 'Condition Agent Node', nameEn: 'Condition Agent Node', source: 'Flowise / Dify', tier: 2, enabled: true, introducedIn: 'v4',
    description: 'LLM-basiertes Routing mit natürlichsprachlichen Bedingungen.',
    descriptionEn: 'LLM-based routing with natural language conditions.' },
  { id: 'ai-memory-types', name: 'KI-Speichertypen', nameEn: 'AI Memory Types', source: 'LangChain', tier: 2, enabled: true, introducedIn: 'v4',
    description: 'Dropdown: Buffer/Window/Summary/Persistent. Badge zeigt Speichertyp.',
    descriptionEn: 'Dropdown: Buffer/Window/Summary/Persistent. Badge shows memory type.' },
  { id: 'error-directives', name: 'Error-Direktiven System', nameEn: 'Error Directives System', source: 'Make.com / Temporal', tier: 2, enabled: true, introducedIn: 'v4',
    description: 'Pro-Node Dropdown: Break/Continue/Rollback/Resume. Badge zeigt Strategie.',
    descriptionEn: 'Per-node dropdown: Break/Continue/Rollback/Resume. Badge shows strategy.' },
  { id: 'multiplayer-cursors', name: 'Multiplayer-Cursor (simuliert)', nameEn: 'Multiplayer Cursors (simulated)', source: 'Figma / Zapier', tier: 2, enabled: true, introducedIn: 'v4',
    description: '2-3 simulierte Cursor bewegen sich über den Canvas mit Namenslabels.',
    descriptionEn: '2-3 simulated cursors moving across the canvas with name labels.' },
]

// ── Default Node Size ──────────────────────────────────────────────────────

export const DEFAULT_NODE_SIZE = { width: 180, height: 80 } as const
