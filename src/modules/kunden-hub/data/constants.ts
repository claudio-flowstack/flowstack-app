import type { ClientStatus, DeliverableStatus, DeliverableSubtype, PhaseGroup } from './types';

export const CLIENT_STATUS_CONFIG: Record<ClientStatus, { label: string; color: string; bgColor: string }> = {
  qualifying:  { label: 'Qualifizierung', color: 'text-gray-400',    bgColor: 'bg-gray-100 dark:bg-gray-400/10' },
  onboarding:  { label: 'Onboarding',    color: 'text-brand-500',    bgColor: 'bg-brand-50 dark:bg-brand-500/10' },
  strategy:    { label: 'Strategie',      color: 'text-brand-600',    bgColor: 'bg-brand-50 dark:bg-brand-600/10' },
  copy:        { label: 'Texte',          color: 'text-warning-500',  bgColor: 'bg-warning-50 dark:bg-warning-500/10' },
  funnel:      { label: 'Funnel',         color: 'text-success-500',  bgColor: 'bg-success-50 dark:bg-success-500/10' },
  campaigns:   { label: 'Kampagnen',      color: 'text-error-500',    bgColor: 'bg-error-50 dark:bg-error-500/10' },
  review:      { label: 'Review',         color: 'text-warning-500',  bgColor: 'bg-warning-50 dark:bg-warning-500/10' },
  live:        { label: 'Live',           color: 'text-success-500',  bgColor: 'bg-success-50 dark:bg-success-500/10' },
  paused:      { label: 'Pausiert',       color: 'text-gray-500',     bgColor: 'bg-gray-100 dark:bg-gray-500/10' },
  churned:     { label: 'Beendet',        color: 'text-gray-600',     bgColor: 'bg-gray-100 dark:bg-gray-600/10' },
};

export const DELIVERABLE_STATUS_CONFIG: Record<DeliverableStatus, { label: string; color: string; bgColor: string; icon: string }> = {
  generating:      { label: 'Wird generiert...',   color: 'text-gray-400',    bgColor: 'bg-gray-100 dark:bg-gray-400/10',    icon: 'Loader2' },
  draft:           { label: 'Entwurf',             color: 'text-warning-500', bgColor: 'bg-warning-50 dark:bg-warning-500/10', icon: 'FileEdit' },
  in_review:       { label: 'In Prüfung',          color: 'text-warning-500', bgColor: 'bg-warning-50 dark:bg-warning-500/10', icon: 'Eye' },
  approved:        { label: 'Freigegeben',          color: 'text-success-500', bgColor: 'bg-success-50 dark:bg-success-500/10', icon: 'CheckCircle' },
  live:            { label: 'Live',                 color: 'text-success-500', bgColor: 'bg-success-50 dark:bg-success-500/10', icon: 'Globe' },
  rejected:        { label: 'Abgelehnt',            color: 'text-error-500',   bgColor: 'bg-error-50 dark:bg-error-500/10',     icon: 'XCircle' },
  manually_edited: { label: 'Manuell bearbeitet',   color: 'text-brand-500',   bgColor: 'bg-brand-50 dark:bg-brand-500/10',     icon: 'Pencil' },
  outdated:        { label: 'Veraltet',             color: 'text-warning-500', bgColor: 'bg-warning-50 dark:bg-warning-500/10', icon: 'AlertTriangle' },
  blocked:         { label: 'Blockiert',            color: 'text-gray-500',    bgColor: 'bg-gray-100 dark:bg-gray-500/10',     icon: 'Lock' },
};

export const PHASE_CONFIG: Record<PhaseGroup, { label: string; icon: string; deliverables: DeliverableSubtype[] }> = {
  strategy: {
    label: 'Strategie',
    icon: 'Brain',
    deliverables: ['zielgruppen_avatar', 'arbeitgeber_avatar', 'messaging_matrix', 'creative_briefing', 'marken_richtlinien'],
  },
  copy: {
    label: 'Texte',
    icon: 'FileText',
    deliverables: ['lp_text', 'form_text', 'danke_text', 'anzeigen_haupt', 'anzeigen_retargeting', 'anzeigen_warmup', 'videoskript'],
  },
  funnel: {
    label: 'Funnel',
    icon: 'Globe',
    deliverables: ['landing_page', 'formular_page', 'danke_page'],
  },
  campaigns: {
    label: 'Kampagnen',
    icon: 'Megaphone',
    deliverables: ['initial_campaign', 'retargeting_campaign', 'warmup_campaign'],
  },
};

export const PIPELINE_STEPS: { key: string; label: string }[] = [
  { key: 'onboarding', label: 'Onboarding' },
  { key: 'strategy',   label: 'Strategie' },
  { key: 'copy',       label: 'Texte' },
  { key: 'funnel',     label: 'Funnel' },
  { key: 'campaigns',  label: 'Kampagnen' },
  { key: 'review',     label: 'Review' },
  { key: 'live',       label: 'Live' },
];

export const DELIVERABLE_TITLE_MAP: Record<DeliverableSubtype, string> = {
  zielgruppen_avatar:    'Zielgruppen-Avatar',
  arbeitgeber_avatar:    'Arbeitgeber-Avatar',
  messaging_matrix:      'Messaging-Matrix',
  creative_briefing:     'Creative Briefing',
  marken_richtlinien:    'Marken-Richtlinien',
  lp_text:               'Landingpage-Texte',
  form_text:             'Formularseite-Texte',
  danke_text:            'Dankeseite-Texte',
  anzeigen_haupt:        'Anzeigentexte Haupt',
  anzeigen_retargeting:  'Anzeigentexte Retargeting',
  anzeigen_warmup:       'Anzeigentexte Warmup',
  videoskript:           'Videoskript',
  landing_page:          'Landingpage',
  formular_page:         'Formularseite',
  danke_page:            'Dankeseite',
  initial_campaign:      'Initial-Kampagne',
  retargeting_campaign:  'Retargeting-Kampagne',
  warmup_campaign:       'Warmup-Kampagne',
};
