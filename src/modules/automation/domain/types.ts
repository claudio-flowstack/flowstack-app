// ── Enums & Unions ─────────────────────────────────────────────────────────

export type NodeType =
  | 'trigger'
  | 'process'
  | 'ai'
  | 'output'
  | 'subsystem'
  | 'ifelse'
  | 'merge'
  | 'wait'
  | 'iterator'
  | 'router'
  | 'error-handler'
  | 'approval'
  | 'agent'
  | 'fork'
  | 'join'
  | 'condition-agent'

/** Alias kept for NodeLab compatibility */
export type LabNodeType = NodeType

export type OutputType =
  | 'document'
  | 'folder'
  | 'website'
  | 'spreadsheet'
  | 'email'
  | 'image'
  | 'other'

export type PortDirection = 'top' | 'right' | 'bottom' | 'left'

export type ResourceType =
  | 'transcript'
  | 'document'
  | 'note'
  | 'dataset'
  | 'form'
  | 'page'

export type StickyNoteColor =
  | 'yellow'
  | 'blue'
  | 'green'
  | 'pink'
  | 'orange'
  | 'purple'
  | 'red'
  | 'gray'

export type NodeExecutionStatus =
  | 'idle'
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'retrying'            // Node wird gerade wiederholt (nach Fehler)
  | 'blocked'             // Node wartet auf fehlende Dependency
  | 'waiting_approval'    // Node fertig, wartet auf menschliche Freigabe

export type SystemStatus = 'active' | 'draft'

export type ArtifactType = 'file' | 'text' | 'url' | 'website' | 'image'
export type ArtifactSourceType = ArtifactType

export type SubNodeType =
  | 'tool'
  | 'memory'
  | 'knowledge'
  | 'outputFormat'
  | 'resourceFile'
  | 'resourceFolder'
  | 'aiGenerated'

// ── Sub-Nodes ─────────────────────────────────────────────────────────────

export interface SubNode {
  id: string
  type: SubNodeType
  label: string
  icon: string
  x: number
  y: number
  linkedResourceIds?: string[]
  linkedFolderId?: string
}

// ── Demo Config (per-node fake execution output) ──────────────────────────

export interface DemoArtifact {
  type: ArtifactType
  label: string
  url: string
  contentPreview?: string
}

export interface DemoNodeConfig {
  /** How long (ms) this node "works" before completing */
  delay?: number
  /** Artifacts to show when this node finishes */
  artifacts?: DemoArtifact[]
}

// ── Node & Connection ──────────────────────────────────────────────────────

export interface SystemNode {
  id: string
  label: string
  description: string
  icon: string
  logoUrl?: string
  type: NodeType
  x: number
  y: number
  linkedResourceType?: ResourceType
  linkedResourceId?: string
  linkedPage?: string
  subNodes?: SubNode[]
  linkedSubSystemId?: string
  /** Per-node demo execution config (links, delay) */
  demoConfig?: DemoNodeConfig
}

export interface NodeConnection {
  from: string
  to: string
  fromPort?: PortDirection
  toPort?: PortDirection
  label?: string
}

// ── Canvas Elements ────────────────────────────────────────────────────────

export interface CanvasGroup {
  id: string
  label: string
  description?: string
  x: number
  y: number
  width: number
  height: number
  color: string
}

export interface StickyNote {
  id: string
  text: string
  x: number
  y: number
  width: number
  height: number
  color: StickyNoteColor
  fontWeight?: 'normal' | 'bold'
  fontStyle?: 'normal' | 'italic'
  customTextColor?: string
  fontSize?: number
}

// ── Outputs & Resources ────────────────────────────────────────────────────

export interface SystemOutput {
  id: string
  name: string
  type: OutputType
  link: string
  createdAt: string
  contentPreview?: string
  artifactType?: ArtifactSourceType
  /** Generation duration in ms (from DAG execution) */
  durationMs?: number
  /** Group/Phase ID this output belongs to (for phase-based filtering) */
  groupId?: string
}

export type AdvancedOutputType = OutputType | 'json' | 'table' | 'csv'

export interface AdvancedOutputData {
  jsonData?: unknown
  tableHeaders?: string[]
  tableRows?: string[][]
  imageUrl?: string
}

export interface AdvancedSystemOutput extends SystemOutput {
  advancedType?: AdvancedOutputType
  advancedData?: AdvancedOutputData
}

export interface SystemResource {
  id: string
  user_id: string
  systemId: string
  title: string
  type: ResourceType
  content: string
  fileReference?: string
  createdAt: string
  source?: string
  folderId?: string
  linkedNodeId?: string
}

export interface ResourceFolder {
  id: string
  systemId: string
  name: string
  createdAt: string
  color?: string
}

// ── Execution Log & Versioning ──────────────────────────────────────────────

export interface ExecutionLogEntry {
  id: string
  timestamp: string
  status: 'success' | 'error' | 'warning' | 'running'
  message: string
  nodeId?: string
  duration?: number
}

export interface WorkflowVersion {
  id: string
  timestamp: string
  label?: string
  nodeCount: number
  connectionCount: number
  snapshot: string
}

// ── Automation System ──────────────────────────────────────────────────────

export interface AutomationSystem {
  id: string
  user_id: string
  name: string
  description: string
  category: string
  icon: string
  status: SystemStatus
  webhookUrl: string
  nodes: SystemNode[]
  connections: NodeConnection[]
  groups?: CanvasGroup[]
  stickyNotes?: StickyNote[]
  outputs: SystemOutput[]
  lastExecuted?: string
  executionCount: number
  canvasZoom?: number
  canvasPan?: { x: number; y: number }
  executionLog?: ExecutionLogEntry[]
  versions?: WorkflowVersion[]
  parentId?: string
  subSystemOrder?: number
  /** Pre-seeded demo system — hidden when demo mode is off */
  isDemo?: boolean
}

// ── Workflow Templates ─────────────────────────────────────────────────────

export interface WorkflowTemplate {
  id: string
  user_id: string
  name: string
  description: string
  category: string
  icon: string
  nodeCount: number
  nodes: SystemNode[]
  connections: NodeConnection[]
  groups?: CanvasGroup[]
  tags: string[]
}

// ── Workflow Execution ─────────────────────────────────────────────────────

export interface Artifact {
  id: string
  nodeId: string
  type: ArtifactType
  label: string
  url?: string
  contentPreview?: string
  createdAt: string
}

export interface NodeStatusEvent {
  nodeId: string
  status: NodeExecutionStatus
  timestamp: number
  message?: string
  progress?: number
}

export interface WorkflowExecutionResult {
  executionId: string
  systemId: string
  startedAt: string
  completedAt?: string
  status: 'running' | 'completed' | 'failed'
  nodeStates: Record<string, NodeExecutionStatus>
  artifacts: Artifact[]
}

export interface WorkflowEventSource {
  execute(
    systemId: string,
    nodeIds: string[],
    connections: { from: string; to: string }[],
    nodeTypes?: Record<string, string>,
    demoConfigs?: Record<string, DemoNodeConfig>,
  ): void
  onNodeStatus(callback: (event: NodeStatusEvent) => void): () => void
  onArtifact(callback: (artifact: Artifact) => void): () => void
  onComplete(callback: (result: WorkflowExecutionResult) => void): () => void
  abort(): void
  dispose(): void
}

// ── Funnel Types ───────────────────────────────────────────────────────────

export type FunnelElementType = 'platform' | 'mockup' | 'text' | 'media'

export type PlatformKind =
  | 'facebook-ads' | 'instagram-ads' | 'google-ads' | 'linkedin-ads'
  | 'tiktok-ads' | 'landingpage' | 'website' | 'formular'
  | 'kalender' | 'crm' | 'email' | 'whatsapp-sms'
  | 'webinar' | 'checkout' | 'youtube' | 'seo'

export type MockupKind =
  | 'mobile' | 'desktop' | 'tablet' | 'social-post' | 'ad-mockup'
  | 'facebook-ad' | 'instagram-ad' | 'google-ad' | 'linkedin-ad'
  | 'linkedin-post' | 'tiktok-ad'

export type TextKind = 'headline' | 'subheadline' | 'body' | 'note'

export type FunnelLineStyle = 'solid' | 'dashed' | 'dotted'

export interface FunnelElement {
  id: string
  type: FunnelElementType
  x: number
  y: number
  width: number
  height: number
  platformKind?: PlatformKind
  icon?: string
  label?: string
  description?: string
  mockupKind?: MockupKind
  mockupImageUrl?: string
  mockupText?: string
  mockupProfileImage?: string
  mockupProfileName?: string
  mockupBodyText?: string
  mockupHeadline?: string
  mockupDescription?: string
  mockupCtaText?: string
  mockupBrowserUrl?: string
  textKind?: TextKind
  textContent?: string
  fontSize?: number
  fontWeight?: 'normal' | 'bold'
  textColor?: string
  textAlign?: 'left' | 'center' | 'right'
  mediaUrl?: string
  mediaAlt?: string
  backgroundColor?: string
  borderColor?: string
  metricLabel?: string
  metricValue?: number
  metricTarget?: number
  notes?: string
}

export interface FunnelConnection {
  id: string
  from: string
  to: string
  fromPort: PortDirection
  toPort: PortDirection
  label?: string
  lineStyle?: FunnelLineStyle
  color?: string
}

export interface FunnelPhase {
  id: string
  label: string
  x: number
  y: number
  width: number
  height: number
  color: string
}

export interface FunnelBoard {
  id: string
  name: string
  description: string
  linkedSystemId?: string
  elements: FunnelElement[]
  connections: FunnelConnection[]
  phases: FunnelPhase[]
  createdAt: string
  updatedAt: string
}

export interface FunnelSnapshot {
  elements: FunnelElement[]
  connections: FunnelConnection[]
  phases: FunnelPhase[]
}

export interface PlatformInfo {
  kind: PlatformKind
  label: string
  icon: string
  color: string
  category: string
}

// ── Wizard Types ───────────────────────────────────────────────────────────

export interface WizardNode {
  id: string
  icon: string
  tKey: string
  nodeType: NodeType
  label: string
  description: string
  phaseId: string | null
}

export type WizardStep =
  | { kind: 'node'; node: WizardNode; next: WizardStep | null }
  | { kind: 'parallel'; branches: WizardBranch[]; next: WizardStep | null }

export interface WizardBranch {
  id: string
  label: string
  firstStep: WizardStep | null
}

export interface WizardPhase {
  id: string
  label: string
  color: string
}

export interface WizardState {
  name: string
  description: string
  category: string
  icon: string
  phases: WizardPhase[]
  rootStep: WizardStep | null
}

// ── NodeLab Types ──────────────────────────────────────────────────────────

export interface LabNode {
  id: string
  label: string
  description: string
  type: LabNodeType
  icon: string
  x: number
  y: number
  status: NodeExecutionStatus
  pinned?: boolean
  customColor?: string
  executionData?: {
    input?: string
    output?: string
    duration?: number
    items?: number
  }
  group?: string
  retryConfig?: { maxRetries: number; delay: number; backoff: 'linear' | 'exponential' | 'jitter' }
  circuitBreaker?: { status: 'closed' | 'half-open' | 'open'; failures: number; threshold: number }
  schemaTypes?: { inputs: SchemaPort[]; outputs: SchemaPort[] }
  approvalState?: 'waiting' | 'approved' | 'rejected'
  approvalAssignee?: string
  approvalDeadline?: string
  agentReasoningTrace?: { step: number; thought: string; action: string; result: string }[]
  agentTools?: string[]
  mcpEnabled?: boolean
  mcpProvider?: string
  draftState?: 'draft' | 'published'
  breakpoint?: boolean
  parallelLaneId?: string
  parallelLanes?: string[]
  memoryType?: 'buffer' | 'window' | 'summary' | 'persistent'
  errorDirective?: 'break' | 'continue' | 'rollback' | 'resume'
  conditionPrompt?: string
}

export interface SchemaPort {
  name: string
  type: 'string' | 'number' | 'boolean' | 'object' | 'array'
}

export interface LabConnection {
  from: string
  to: string
  label?: string
  pathType?: 'true' | 'false' | 'default' | 'loop' | 'error' | 'mcp' | 'parallel' | 'tool'
}

export interface FeatureInfo {
  id: string
  name: string
  nameEn: string
  source: string
  description: string
  descriptionEn: string
  tier: 1 | 2 | 3
  enabled: boolean
  introducedIn: 'v2' | 'v3' | 'v4'
}

// ── Funnel Defaults ────────────────────────────────────────────────────────

export const ELEMENT_DEFAULTS: Record<FunnelElementType, { width: number; height: number }> = {
  platform: { width: 200, height: 80 },
  mockup:   { width: 220, height: 420 },
  text:     { width: 260, height: 48 },
  media:    { width: 300, height: 200 },
}

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

export const PLATFORMS: PlatformInfo[] = [
  { kind: 'facebook-ads',   label: 'Facebook Ads',       icon: 'logo-meta',       color: '#0081FB', category: 'Werbung' },
  { kind: 'instagram-ads',  label: 'Instagram Ads',      icon: 'logo-instagram',  color: '#E4405F', category: 'Werbung' },
  { kind: 'google-ads',     label: 'Google Ads',         icon: 'logo-google-ads', color: '#4285F4', category: 'Werbung' },
  { kind: 'linkedin-ads',   label: 'LinkedIn Ads',       icon: 'logo-linkedin',   color: '#0A66C2', category: 'Werbung' },
  { kind: 'tiktok-ads',     label: 'TikTok Ads',         icon: 'logo-tiktok',     color: '#000000', category: 'Werbung' },
  { kind: 'youtube',        label: 'YouTube Ads',        icon: 'logo-youtube',    color: '#FF0000', category: 'Werbung' },
  { kind: 'landingpage',    label: 'Landing Page',       icon: 'globe',           color: '#8b5cf6', category: 'Touchpoints' },
  { kind: 'website',        label: 'Website',            icon: 'globe',           color: '#6366f1', category: 'Touchpoints' },
  { kind: 'formular',       label: 'Formular',           icon: 'file-text',       color: '#f59e0b', category: 'Touchpoints' },
  { kind: 'kalender',       label: 'Kalender / Booking', icon: 'logo-calendly',   color: '#006BFF', category: 'Touchpoints' },
  { kind: 'webinar',        label: 'Webinar',            icon: 'video',           color: '#7c3aed', category: 'Touchpoints' },
  { kind: 'crm',            label: 'CRM',                icon: 'logo-hubspot',    color: '#FF7A59', category: 'Backend' },
  { kind: 'email',          label: 'E-Mail',             icon: 'mail',            color: '#ef4444', category: 'Backend' },
  { kind: 'whatsapp-sms',   label: 'WhatsApp / SMS',     icon: 'logo-whatsapp',   color: '#25D366', category: 'Backend' },
  { kind: 'checkout',       label: 'Checkout / Payment', icon: 'logo-stripe',     color: '#635BFF', category: 'Backend' },
  { kind: 'seo',            label: 'SEO',                icon: 'search',          color: '#10b981', category: 'Backend' },
]
