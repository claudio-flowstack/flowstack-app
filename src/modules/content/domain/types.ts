// ── Content Platform ─────────────────────────────────────────────────────────

export type ContentPlatform = 'youtube' | 'instagram' | 'facebook-linkedin'

export type ContentStatus =
  | 'idea'
  | 'draft'
  | 'ready'
  | 'scheduled'
  | 'live'
  | 'archived'

export type ContentPriority = 'high' | 'medium' | 'low'

export type ContentQuality = 'good' | 'neutral' | 'bad'

// ── Checklist ────────────────────────────────────────────────────────────────

export interface ChecklistItem {
  id: string
  text: string
  completed: boolean
}

// ── Content Version ──────────────────────────────────────────────────────────

export interface ContentVersion {
  id: string
  name: string
  data: Partial<ContentItem>
  createdAt: string
}

// ── Content Item ─────────────────────────────────────────────────────────────

export interface ContentItem {
  id: string
  user_id: string
  platform: ContentPlatform
  title: string
  concept: string
  angle: string
  status: ContentStatus
  priority: ContentPriority
  quality: ContentQuality
  tags: string[]
  notes: string
  seriesId?: string
  seriesColor?: string
  assignee?: string
  scheduledDate?: string
  checklist: ChecklistItem[]
  media: string[]
  versions: ContentVersion[]
  // YouTube-specific
  videoTitle?: string
  videoDescription?: string
  keywords?: string[]
  youtubeCategory?: string
  targetAudience?: string
  thumbnails?: string[]
  // Instagram-specific
  postType?: string
  caption?: string
  hashtags?: string[]
  audioReference?: string
  coverImage?: string
  // Facebook/LinkedIn-specific
  fbPostType?: string
  fbCaption?: string
  fbHashtags?: string[]
  linkUrl?: string
  fbCoverImage?: string
  createdAt: string
  updatedAt: string
}

// ── Content File ─────────────────────────────────────────────────────────────

export type FileCategory =
  | 'marketing'
  | 'dev'
  | 'sales'
  | 'content'
  | 'operations'
  | 'other'

export interface ContentFile {
  id: string
  user_id: string
  name: string
  description: string
  url: string
  category: FileCategory
  labels: string[]
  createdAt: string
}

// ── Research Note ────────────────────────────────────────────────────────────

export interface ResearchNote {
  id: string
  user_id: string
  title: string
  content: string
  links: string[]
  tags: string[]
  platform: string
  createdAt: string
  updatedAt: string
}

// ── Content Plan ─────────────────────────────────────────────────────────────

export interface PlanTask {
  id: string
  title: string
  description: string
  status: 'todo' | 'in-progress' | 'done'
  priority: ContentPriority
  dependsOn?: string[]
  assignee?: string
  dueDate?: string
}

export interface ContentPlan {
  id: string
  user_id: string
  name: string
  description: string
  strategy: string
  deadline: string
  notes: string
  goal: string
  targetAudience: string
  channels: string[]
  tasks: PlanTask[]
  createdAt: string
  updatedAt: string
}
