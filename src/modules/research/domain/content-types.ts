// ── Content Research Types ──

export interface YouTubeVideo {
  id: string
  title: string
  url: string
  channel: string
  channel_url: string
  views: number
  views_formatted: string
  likes: number
  likes_formatted: string
  comments: number
  duration: number
  duration_string: string
  upload_date: string
  description: string
  tags: string[]
  thumbnail: string
  engagement_rate: number
}

export interface NewsArticle {
  title: string
  url: string
  body: string
  source: string
  date: string
  image: string
}

export interface AIAnalysis {
  task: string
  analysis: string
  model: string
  input_items: number
}

export interface AIContent {
  topic: string
  platform: string
  framework: string
  content: string
  model: string
}

export interface ContentFramework {
  name: string
  description?: string
  structure: string[]
}

export interface PlatformSpec {
  name: string
  max_length: string
  format: string
  style: string
}

export type AITask = 'analyze' | 'topics' | 'frameworks' | 'script'
export type ContentPlatform = 'instagram' | 'youtube' | 'youtube_short' | 'linkedin' | 'tiktok'
export type ContentTone = 'professional' | 'casual' | 'bold' | 'educational'
