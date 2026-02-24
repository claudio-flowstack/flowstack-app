import type {
  FunnelElementType,
  FunnelElement,
  FunnelConnection,
  FunnelPhase,
  MockupKind,
  PlatformKind,
  PortDirection,
} from '../domain/types'

// ── Element-Standardgrößen ──────────────────────────────────────────────────

export const ELEMENT_DEFAULTS: Record<FunnelElementType, { width: number; height: number }> = {
  platform: { width: 200, height: 80 },
  mockup:   { width: 220, height: 420 },
  text:     { width: 260, height: 48 },
  media:    { width: 300, height: 200 },
}

// ── Mockup-Größen je nach Typ ───────────────────────────────────────────────

export const MOCKUP_SIZES: Record<MockupKind, { width: number; height: number }> = {
  'mobile':        { width: 220, height: 420 },
  'desktop':       { width: 480, height: 320 },
  'tablet':        { width: 360, height: 280 },
  'social-post':   { width: 280, height: 320 },
  'ad-mockup':     { width: 280, height: 360 },
  'facebook-ad':   { width: 280, height: 380 },
  'instagram-ad':  { width: 260, height: 400 },
  'google-ad':     { width: 340, height: 160 },
  'linkedin-ad':   { width: 300, height: 360 },
  'linkedin-post': { width: 300, height: 340 },
  'tiktok-ad':     { width: 220, height: 400 },
}

// ── Plattform-Registry (alle Kanäle mit Icon, Farbe, Kategorie) ─────────────

export const PLATFORM_REGISTRY: {
  kind: PlatformKind
  label: string
  icon: string
  color: string
  category: 'advertising' | 'touchpoint' | 'backend'
}[] = [
  { kind: 'facebook-ads',  label: 'Facebook Ads',       icon: 'logo-meta',       color: '#0081FB', category: 'advertising' },
  { kind: 'instagram-ads', label: 'Instagram Ads',      icon: 'logo-instagram',  color: '#E4405F', category: 'advertising' },
  { kind: 'google-ads',    label: 'Google Ads',         icon: 'logo-google-ads', color: '#4285F4', category: 'advertising' },
  { kind: 'linkedin-ads',  label: 'LinkedIn Ads',       icon: 'logo-linkedin',   color: '#0A66C2', category: 'advertising' },
  { kind: 'tiktok-ads',    label: 'TikTok Ads',         icon: 'logo-tiktok',     color: '#000000', category: 'advertising' },
  { kind: 'youtube',       label: 'YouTube',            icon: 'logo-youtube',    color: '#FF0000', category: 'advertising' },
  { kind: 'landingpage',   label: 'Landing Page',       icon: 'globe',           color: '#8b5cf6', category: 'touchpoint' },
  { kind: 'website',       label: 'Website',            icon: 'globe',           color: '#6366f1', category: 'touchpoint' },
  { kind: 'formular',      label: 'Formular',           icon: 'file-text',       color: '#f59e0b', category: 'touchpoint' },
  { kind: 'kalender',      label: 'Kalender',           icon: 'logo-calendly',   color: '#006BFF', category: 'touchpoint' },
  { kind: 'webinar',       label: 'Webinar',            icon: 'video',           color: '#7c3aed', category: 'touchpoint' },
  { kind: 'crm',           label: 'CRM',                icon: 'logo-hubspot',    color: '#FF7A59', category: 'backend' },
  { kind: 'email',         label: 'E-Mail',             icon: 'mail',            color: '#ef4444', category: 'backend' },
  { kind: 'whatsapp-sms',  label: 'WhatsApp/SMS',       icon: 'logo-whatsapp',   color: '#25D366', category: 'backend' },
  { kind: 'checkout',      label: 'Checkout',           icon: 'logo-stripe',     color: '#635BFF', category: 'backend' },
  { kind: 'seo',           label: 'SEO',                icon: 'search',          color: '#10b981', category: 'touchpoint' },
]

// ── Verbindungsfarben ───────────────────────────────────────────────────────

export const FUNNEL_CONN_COLORS: Record<string, string> = {
  purple:  '#a855f7',
  gray:    '#6b7280',
  blue:    '#3b82f6',
  emerald: '#10b981',
  pink:    '#ec4899',
  orange:  '#f97316',
}

// ── Node-Stil-Klassen ───────────────────────────────────────────────────────

export const NODE_STYLE_CLASSES: Record<string, string> = {
  default: 'rounded-xl border',
  rounded: 'rounded-[20px] border-2',
  sharp:   'rounded-none border',
  pill:    'rounded-full border-2',
  card:    'rounded-xl border-2 border-b-4',
}

// ── Schatten-Klassen ────────────────────────────────────────────────────────

export const NODE_SHADOW_CLASSES: Record<string, string> = {
  none: '',
  sm:   'shadow-sm',
  md:   'shadow-md',
  lg:   'shadow-lg shadow-black/10',
}

// ── Port-Richtungsvektoren ──────────────────────────────────────────────────

export const PORT_DIR: Record<PortDirection, [number, number]> = {
  top:    [0, -1],
  right:  [1, 0],
  bottom: [0, 1],
  left:   [-1, 0],
}

// ── Snap & Drag Schwellwerte ────────────────────────────────────────────────

export const SNAP_THRESHOLD = 8
export const PAN_DRAG_THRESHOLD = 4
export const MAX_LABEL = 40

// ── Standard-Phasen ─────────────────────────────────────────────────────────

export const DEFAULT_PHASES: { label: string; color: string }[] = [
  { label: 'Awareness',  color: '#3b82f6' },
  { label: 'Interest',   color: '#8b5cf6' },
  { label: 'Conversion', color: '#10b981' },
  { label: 'Nurture',    color: '#f97316' },
]

// ── Vorgefertigte Funnel-Templates ──────────────────────────────────────────

export const FUNNEL_TEMPLATES: {
  id: string
  name: string
  description: string
  elements: Omit<FunnelElement, 'id'>[]
  connections: Omit<FunnelConnection, 'id'>[]
  phases: Omit<FunnelPhase, 'id'>[]
}[] = [
  // 1 – Facebook Ads -> Landing Page -> Formular -> CRM
  {
    id: 'tpl-facebook-lp-form-crm',
    name: 'Facebook Lead-Funnel',
    description: 'Klassischer Lead-Funnel: Facebook Ads bringen Traffic auf eine Landing Page mit Formular und CRM-Anbindung.',
    elements: [
      { type: 'platform', x: 60,  y: 120, width: 200, height: 80, platformKind: 'facebook-ads', label: 'Facebook Ads', icon: 'logo-meta' },
      { type: 'platform', x: 360, y: 120, width: 200, height: 80, platformKind: 'landingpage',  label: 'Landing Page', icon: 'globe' },
      { type: 'platform', x: 660, y: 120, width: 200, height: 80, platformKind: 'formular',     label: 'Formular',     icon: 'file-text' },
      { type: 'platform', x: 960, y: 120, width: 200, height: 80, platformKind: 'crm',          label: 'CRM',          icon: 'logo-hubspot' },
    ],
    connections: [
      { from: '0', to: '1', fromPort: 'right', toPort: 'left', label: 'Klick' },
      { from: '1', to: '2', fromPort: 'right', toPort: 'left', label: 'Ausfüllen' },
      { from: '2', to: '3', fromPort: 'right', toPort: 'left', label: 'Lead' },
    ],
    phases: [
      { label: 'Awareness',  x: 30,  y: 40, width: 260, height: 220, color: '#3b82f6' },
      { label: 'Interest',   x: 330, y: 40, width: 260, height: 220, color: '#8b5cf6' },
      { label: 'Conversion', x: 630, y: 40, width: 260, height: 220, color: '#10b981' },
      { label: 'Nurture',    x: 930, y: 40, width: 260, height: 220, color: '#f97316' },
    ],
  },

  // 2 – Google Ads -> Website -> Checkout
  {
    id: 'tpl-google-website-checkout',
    name: 'Google Ads E-Commerce',
    description: 'E-Commerce-Funnel: Google Ads leiten Nutzer auf die Website, dort wird über den Checkout gekauft.',
    elements: [
      { type: 'platform', x: 60,  y: 120, width: 200, height: 80, platformKind: 'google-ads', label: 'Google Ads', icon: 'logo-google-ads' },
      { type: 'platform', x: 360, y: 120, width: 200, height: 80, platformKind: 'website',    label: 'Website',    icon: 'globe' },
      { type: 'platform', x: 660, y: 120, width: 200, height: 80, platformKind: 'checkout',   label: 'Checkout',   icon: 'logo-stripe' },
    ],
    connections: [
      { from: '0', to: '1', fromPort: 'right', toPort: 'left', label: 'Klick' },
      { from: '1', to: '2', fromPort: 'right', toPort: 'left', label: 'Kauf' },
    ],
    phases: [
      { label: 'Awareness',  x: 30,  y: 40, width: 260, height: 220, color: '#3b82f6' },
      { label: 'Interest',   x: 330, y: 40, width: 260, height: 220, color: '#8b5cf6' },
      { label: 'Conversion', x: 630, y: 40, width: 260, height: 220, color: '#10b981' },
    ],
  },

  // 3 – Multi-Channel -> Kalender -> CRM
  {
    id: 'tpl-multichannel-calendar-crm',
    name: 'Multi-Channel Booking',
    description: 'Mehrere Werbekanäle führen zu einem Kalender-Booking und CRM-Erfassung.',
    elements: [
      { type: 'platform', x: 60,  y: 60,  width: 200, height: 80, platformKind: 'facebook-ads',  label: 'Facebook Ads',  icon: 'logo-meta' },
      { type: 'platform', x: 60,  y: 200, width: 200, height: 80, platformKind: 'instagram-ads', label: 'Instagram Ads', icon: 'logo-instagram' },
      { type: 'platform', x: 60,  y: 340, width: 200, height: 80, platformKind: 'linkedin-ads',  label: 'LinkedIn Ads',  icon: 'logo-linkedin' },
      { type: 'platform', x: 400, y: 200, width: 200, height: 80, platformKind: 'kalender',      label: 'Kalender',      icon: 'logo-calendly' },
      { type: 'platform', x: 720, y: 200, width: 200, height: 80, platformKind: 'crm',           label: 'CRM',           icon: 'logo-hubspot' },
    ],
    connections: [
      { from: '0', to: '3', fromPort: 'right', toPort: 'left', label: 'Klick' },
      { from: '1', to: '3', fromPort: 'right', toPort: 'left', label: 'Klick' },
      { from: '2', to: '3', fromPort: 'right', toPort: 'left', label: 'Klick' },
      { from: '3', to: '4', fromPort: 'right', toPort: 'left', label: 'Buchung' },
    ],
    phases: [
      { label: 'Awareness',  x: 30,  y: 20, width: 260, height: 440, color: '#3b82f6' },
      { label: 'Interest',   x: 370, y: 20, width: 260, height: 440, color: '#8b5cf6' },
      { label: 'Conversion', x: 690, y: 20, width: 260, height: 440, color: '#10b981' },
    ],
  },

  // 4 – SEO -> Website -> Webinar -> CRM
  {
    id: 'tpl-seo-website-webinar-crm',
    name: 'SEO Webinar-Funnel',
    description: 'Organischer Traffic via SEO führt über die Website zu einem Webinar und anschließend ins CRM.',
    elements: [
      { type: 'platform', x: 60,  y: 120, width: 200, height: 80, platformKind: 'seo',     label: 'SEO',     icon: 'search' },
      { type: 'platform', x: 360, y: 120, width: 200, height: 80, platformKind: 'website', label: 'Website', icon: 'globe' },
      { type: 'platform', x: 660, y: 120, width: 200, height: 80, platformKind: 'webinar', label: 'Webinar', icon: 'video' },
      { type: 'platform', x: 960, y: 120, width: 200, height: 80, platformKind: 'crm',     label: 'CRM',     icon: 'logo-hubspot' },
    ],
    connections: [
      { from: '0', to: '1', fromPort: 'right', toPort: 'left', label: 'Organisch' },
      { from: '1', to: '2', fromPort: 'right', toPort: 'left', label: 'Anmeldung' },
      { from: '2', to: '3', fromPort: 'right', toPort: 'left', label: 'Teilnahme' },
    ],
    phases: [
      { label: 'Awareness',  x: 30,  y: 40, width: 260, height: 220, color: '#3b82f6' },
      { label: 'Interest',   x: 330, y: 40, width: 260, height: 220, color: '#8b5cf6' },
      { label: 'Conversion', x: 630, y: 40, width: 260, height: 220, color: '#10b981' },
      { label: 'Nurture',    x: 930, y: 40, width: 260, height: 220, color: '#f97316' },
    ],
  },

  // 5 – LinkedIn -> Formular -> E-Mail -> Kalender
  {
    id: 'tpl-linkedin-form-email-calendar',
    name: 'LinkedIn Nurture-Funnel',
    description: 'LinkedIn Ads generieren Leads über ein Formular, die per E-Mail-Sequenz zum Kalender-Booking geführt werden.',
    elements: [
      { type: 'platform', x: 60,  y: 120, width: 200, height: 80, platformKind: 'linkedin-ads', label: 'LinkedIn Ads', icon: 'logo-linkedin' },
      { type: 'platform', x: 360, y: 120, width: 200, height: 80, platformKind: 'formular',     label: 'Formular',     icon: 'file-text' },
      { type: 'platform', x: 660, y: 120, width: 200, height: 80, platformKind: 'email',        label: 'E-Mail',       icon: 'mail' },
      { type: 'platform', x: 960, y: 120, width: 200, height: 80, platformKind: 'kalender',     label: 'Kalender',     icon: 'logo-calendly' },
    ],
    connections: [
      { from: '0', to: '1', fromPort: 'right', toPort: 'left', label: 'Klick' },
      { from: '1', to: '2', fromPort: 'right', toPort: 'left', label: 'Lead' },
      { from: '2', to: '3', fromPort: 'right', toPort: 'left', label: 'Buchung' },
    ],
    phases: [
      { label: 'Awareness',  x: 30,  y: 40, width: 260, height: 220, color: '#3b82f6' },
      { label: 'Interest',   x: 330, y: 40, width: 260, height: 220, color: '#8b5cf6' },
      { label: 'Nurture',    x: 630, y: 40, width: 260, height: 220, color: '#f97316' },
      { label: 'Conversion', x: 930, y: 40, width: 260, height: 220, color: '#10b981' },
    ],
  },
]
