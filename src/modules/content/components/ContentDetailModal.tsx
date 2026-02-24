import { useState, useCallback, useRef, useEffect } from 'react'
import type {
  ContentItem,
  ContentStatus,
  ContentPriority,
  ContentQuality,
  ChecklistItem,
  ContentVersion,
} from '../domain/types'
import {
  PLATFORM_CONFIG,
  STATUS_CONFIG,
  PRIORITY_CONFIG,
  QUALITY_CONFIG,
} from '../domain/constants'
import { cn, formatDateTime } from '@/shared/lib/utils'
import {
  X,
  Plus,
  Trash2,
  Check,
  Eye,
  FileText,
  ListChecks,
  Clock,
  Tag,
  History,
  RotateCcw,
  Save,
} from 'lucide-react'

// ── Types ───────────────────────────────────────────────────────────────────

interface ContentDetailModalProps {
  item: ContentItem
  onSave: (id: string, updates: Partial<ContentItem>) => void
  onClose: () => void
}

type TabId = 'details' | 'preview' | 'versions' | 'checklist'

const TABS: { id: TabId; label: string; icon: typeof FileText }[] = [
  { id: 'details', label: 'Details', icon: FileText },
  { id: 'preview', label: 'Vorschau', icon: Eye },
  { id: 'versions', label: 'Versionen', icon: History },
  { id: 'checklist', label: 'Checkliste', icon: ListChecks },
]

const STATUSES: ContentStatus[] = ['idea', 'draft', 'ready', 'scheduled', 'live', 'archived']
const PRIORITIES: ContentPriority[] = ['high', 'medium', 'low']
const QUALITIES: ContentQuality[] = ['good', 'neutral', 'bad']

const INPUT_CLASS =
  'w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary/30 outline-none transition-colors'

const SECTION_LABEL = 'text-xs font-medium text-muted-foreground uppercase tracking-wider'

// ── Helpers ─────────────────────────────────────────────────────────────────

function generateId(): string {
  return crypto.randomUUID()
}

function parseTags(input: string): string[] {
  return input
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

// ── Component ───────────────────────────────────────────────────────────────

export function ContentDetailModal({ item, onSave, onClose }: ContentDetailModalProps) {
  const [draft, setDraft] = useState<ContentItem>(() => structuredClone(item))
  const [activeTab, setActiveTab] = useState<TabId>('details')
  const [tagInput, setTagInput] = useState('')
  const [keywordInput, setKeywordInput] = useState('')
  const [hashtagInput, setHashtagInput] = useState('')
  const [fbHashtagInput, setFbHashtagInput] = useState('')
  const [newChecklistText, setNewChecklistText] = useState('')
  const [newVersionName, setNewVersionName] = useState('')
  const [showVersionInput, setShowVersionInput] = useState(false)
  const overlayRef = useRef<HTMLDivElement>(null)

  const platformConfig = PLATFORM_CONFIG[draft.platform]

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft])

  // ── Field updaters ──────────────────────────────────────────────────────

  const updateField = useCallback(<K extends keyof ContentItem>(key: K, value: ContentItem[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value, updatedAt: new Date().toISOString() }))
  }, [])

  const handleSave = useCallback(() => {
    const { id, ...updates } = draft
    onSave(id, updates)
    onClose()
  }, [draft, onSave, onClose])

  const handleClose = useCallback(() => {
    // Auto-save on close
    const { id, ...updates } = draft
    onSave(id, updates)
    onClose()
  }, [draft, onSave, onClose])

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === overlayRef.current) handleClose()
    },
    [handleClose],
  )

  // ── Tag management ────────────────────────────────────────────────────

  const addTags = useCallback(
    (field: 'tags' | 'keywords' | 'hashtags' | 'fbHashtags', raw: string) => {
      const newTags = parseTags(raw)
      if (newTags.length === 0) return
      const current = (draft[field] as string[] | undefined) ?? []
      const merged = [...new Set([...current, ...newTags])]
      updateField(field, merged)
    },
    [draft, updateField],
  )

  const removeTag = useCallback(
    (field: 'tags' | 'keywords' | 'hashtags' | 'fbHashtags', tag: string) => {
      const current = (draft[field] as string[] | undefined) ?? []
      updateField(
        field,
        current.filter((t) => t !== tag),
      )
    },
    [draft, updateField],
  )

  // ── Checklist management ──────────────────────────────────────────────

  const addChecklistItem = useCallback(() => {
    const text = newChecklistText.trim()
    if (!text) return
    const newItem: ChecklistItem = { id: generateId(), text, completed: false }
    updateField('checklist', [...draft.checklist, newItem])
    setNewChecklistText('')
  }, [newChecklistText, draft.checklist, updateField])

  const toggleChecklistItem = useCallback(
    (itemId: string) => {
      updateField(
        'checklist',
        draft.checklist.map((ci) => (ci.id === itemId ? { ...ci, completed: !ci.completed } : ci)),
      )
    },
    [draft.checklist, updateField],
  )

  const removeChecklistItem = useCallback(
    (itemId: string) => {
      updateField(
        'checklist',
        draft.checklist.filter((ci) => ci.id !== itemId),
      )
    },
    [draft.checklist, updateField],
  )

  // ── Version management ────────────────────────────────────────────────

  const saveVersion = useCallback(() => {
    const name = newVersionName.trim()
    if (!name) return
    const version: ContentVersion = {
      id: generateId(),
      name,
      data: structuredClone(draft),
      createdAt: new Date().toISOString(),
    }
    updateField('versions', [...draft.versions, version])
    setNewVersionName('')
    setShowVersionInput(false)
  }, [newVersionName, draft, updateField])

  const restoreVersion = useCallback(
    (version: ContentVersion) => {
      setDraft((prev) => ({
        ...prev,
        ...version.data,
        id: prev.id,
        versions: prev.versions,
        updatedAt: new Date().toISOString(),
      }))
    },
    [],
  )

  // ── Checklist stats ───────────────────────────────────────────────────

  const completedCount = draft.checklist.filter((ci) => ci.completed).length
  const totalCount = draft.checklist.length
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  // ── Render helpers ────────────────────────────────────────────────────

  const renderTagPills = (
    tags: string[],
    field: 'tags' | 'keywords' | 'hashtags' | 'fbHashtags',
    prefix = '',
  ) => (
    <div className="flex flex-wrap gap-1.5 mt-1.5">
      {tags.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs text-foreground"
        >
          {prefix}{tag}
          <button
            type="button"
            onClick={() => removeTag(field, tag)}
            className="ml-0.5 rounded-full p-0.5 hover:bg-background/50 transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
    </div>
  )

  // ── Tab: Details ──────────────────────────────────────────────────────

  const renderDetails = () => (
    <div className="space-y-6">
      {/* General Section */}
      <div className="space-y-3">
        <h4 className={SECTION_LABEL}>Allgemein</h4>

        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Titel</label>
          <input
            type="text"
            value={draft.title}
            onChange={(e) => updateField('title', e.target.value)}
            placeholder="Titel eingeben..."
            className={cn(INPUT_CLASS, 'text-base font-semibold')}
          />
        </div>

        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Konzept</label>
          <textarea
            rows={2}
            value={draft.concept}
            onChange={(e) => updateField('concept', e.target.value)}
            placeholder="Konzept beschreiben..."
            className={cn(INPUT_CLASS, 'resize-none')}
          />
        </div>

        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Angle / Hook</label>
          <input
            type="text"
            value={draft.angle}
            onChange={(e) => updateField('angle', e.target.value)}
            placeholder="Angle oder Hook..."
            className={INPUT_CLASS}
          />
        </div>

        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Notizen</label>
          <textarea
            rows={2}
            value={draft.notes}
            onChange={(e) => updateField('notes', e.target.value)}
            placeholder="Notizen..."
            className={cn(INPUT_CLASS, 'resize-none')}
          />
        </div>

        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Tags</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addTags('tags', tagInput)
                  setTagInput('')
                }
              }}
              placeholder="Tags kommagetrennt eingeben..."
              className={INPUT_CLASS}
            />
            <button
              type="button"
              onClick={() => {
                addTags('tags', tagInput)
                setTagInput('')
              }}
              className="shrink-0 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          {draft.tags.length > 0 && renderTagPills(draft.tags, 'tags')}
        </div>
      </div>

      {/* Status & Meta Section */}
      <div className="space-y-3">
        <h4 className={SECTION_LABEL}>Status & Meta</h4>

        <div>
          <label className="mb-1.5 block text-xs text-muted-foreground">Status</label>
          <div className="flex flex-wrap gap-1.5">
            {STATUSES.map((s) => {
              const cfg = STATUS_CONFIG[s]
              const isActive = draft.status === s
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => updateField('status', s)}
                  className={cn(
                    'rounded-full px-3 py-1 text-xs font-medium transition-all',
                    isActive ? 'ring-2 ring-offset-1 ring-offset-card' : 'opacity-60 hover:opacity-100',
                  )}
                  style={{
                    background: cfg.bgColor,
                    color: cfg.color,
                    ...(isActive ? { ringColor: cfg.color } : {}),
                  }}
                >
                  {cfg.label}
                </button>
              )
            })}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs text-muted-foreground">Priorität</label>
          <div className="flex flex-wrap gap-1.5">
            {PRIORITIES.map((p) => {
              const cfg = PRIORITY_CONFIG[p]
              const isActive = draft.priority === p
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => updateField('priority', p)}
                  className={cn(
                    'rounded-full px-3 py-1 text-xs font-medium transition-all',
                    isActive ? 'ring-2 ring-offset-1 ring-offset-card' : 'opacity-60 hover:opacity-100',
                  )}
                  style={{
                    background: cfg.bgColor,
                    color: cfg.color,
                  }}
                >
                  {cfg.dot} {cfg.label}
                </button>
              )
            })}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs text-muted-foreground">Qualität</label>
          <div className="flex flex-wrap gap-1.5">
            {QUALITIES.map((q) => {
              const cfg = QUALITY_CONFIG[q]
              const isActive = draft.quality === q
              return (
                <button
                  key={q}
                  type="button"
                  onClick={() => updateField('quality', q)}
                  className={cn(
                    'rounded-full px-3 py-1 text-xs font-medium border transition-all',
                    isActive
                      ? 'border-primary bg-primary/10 text-foreground'
                      : 'border-border bg-card text-muted-foreground hover:border-primary/30',
                  )}
                >
                  {cfg.emoji} {cfg.label}
                </button>
              )
            })}
          </div>
        </div>

        {draft.status === 'scheduled' && (
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Geplantes Datum</label>
            <input
              type="date"
              value={draft.scheduledDate ?? ''}
              onChange={(e) => updateField('scheduledDate', e.target.value || undefined)}
              className={INPUT_CLASS}
            />
          </div>
        )}

        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Zuständig</label>
          <input
            type="text"
            value={draft.assignee ?? ''}
            onChange={(e) => updateField('assignee', e.target.value || undefined)}
            placeholder="Person zuweisen..."
            className={INPUT_CLASS}
          />
        </div>
      </div>

      {/* Platform-Specific Section */}
      {draft.platform === 'youtube' && renderYouTubeFields()}
      {draft.platform === 'instagram' && renderInstagramFields()}
      {draft.platform === 'facebook-linkedin' && renderFacebookLinkedInFields()}
    </div>
  )

  // ── Platform-specific fields ──────────────────────────────────────────

  const renderYouTubeFields = () => (
    <div className="space-y-3">
      <h4 className={SECTION_LABEL}>YouTube</h4>
      <div>
        <label className="mb-1 block text-xs text-muted-foreground">Video-Titel</label>
        <input
          type="text"
          value={draft.videoTitle ?? ''}
          onChange={(e) => updateField('videoTitle', e.target.value || undefined)}
          placeholder="Video-Titel..."
          className={INPUT_CLASS}
        />
      </div>
      <div>
        <label className="mb-1 block text-xs text-muted-foreground">Beschreibung</label>
        <textarea
          rows={3}
          value={draft.videoDescription ?? ''}
          onChange={(e) => updateField('videoDescription', e.target.value || undefined)}
          placeholder="Video-Beschreibung..."
          className={cn(INPUT_CLASS, 'resize-none')}
        />
      </div>
      <div>
        <label className="mb-1 block text-xs text-muted-foreground">Keywords</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={keywordInput}
            onChange={(e) => setKeywordInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addTags('keywords', keywordInput)
                setKeywordInput('')
              }
            }}
            placeholder="Keywords kommagetrennt..."
            className={INPUT_CLASS}
          />
          <button
            type="button"
            onClick={() => {
              addTags('keywords', keywordInput)
              setKeywordInput('')
            }}
            className="shrink-0 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        {(draft.keywords ?? []).length > 0 && renderTagPills(draft.keywords!, 'keywords')}
      </div>
      <div>
        <label className="mb-1 block text-xs text-muted-foreground">Kategorie</label>
        <input
          type="text"
          value={draft.youtubeCategory ?? ''}
          onChange={(e) => updateField('youtubeCategory', e.target.value || undefined)}
          placeholder="z.B. Education, Entertainment..."
          className={INPUT_CLASS}
        />
      </div>
      <div>
        <label className="mb-1 block text-xs text-muted-foreground">Zielgruppe</label>
        <input
          type="text"
          value={draft.targetAudience ?? ''}
          onChange={(e) => updateField('targetAudience', e.target.value || undefined)}
          placeholder="Zielgruppe beschreiben..."
          className={INPUT_CLASS}
        />
      </div>
    </div>
  )

  const renderInstagramFields = () => (
    <div className="space-y-3">
      <h4 className={SECTION_LABEL}>Instagram</h4>
      <div>
        <label className="mb-1 block text-xs text-muted-foreground">Post-Typ</label>
        <select
          value={draft.postType ?? 'reel'}
          onChange={(e) => updateField('postType', e.target.value)}
          className={INPUT_CLASS}
        >
          <option value="reel">Reel</option>
          <option value="carousel">Carousel</option>
          <option value="single">Single Post</option>
          <option value="story">Story</option>
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs text-muted-foreground">Caption</label>
        <textarea
          rows={3}
          value={draft.caption ?? ''}
          onChange={(e) => updateField('caption', e.target.value || undefined)}
          placeholder="Caption schreiben..."
          className={cn(INPUT_CLASS, 'resize-none')}
        />
      </div>
      <div>
        <label className="mb-1 block text-xs text-muted-foreground">Hashtags</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={hashtagInput}
            onChange={(e) => setHashtagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addTags('hashtags', hashtagInput)
                setHashtagInput('')
              }
            }}
            placeholder="Hashtags kommagetrennt..."
            className={INPUT_CLASS}
          />
          <button
            type="button"
            onClick={() => {
              addTags('hashtags', hashtagInput)
              setHashtagInput('')
            }}
            className="shrink-0 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        {(draft.hashtags ?? []).length > 0 && renderTagPills(draft.hashtags!, 'hashtags', '#')}
      </div>
      <div>
        <label className="mb-1 block text-xs text-muted-foreground">Audio-Referenz</label>
        <input
          type="text"
          value={draft.audioReference ?? ''}
          onChange={(e) => updateField('audioReference', e.target.value || undefined)}
          placeholder="Song oder Audio..."
          className={INPUT_CLASS}
        />
      </div>
      <div>
        <label className="mb-1 block text-xs text-muted-foreground">Cover-Bild URL</label>
        <input
          type="text"
          value={draft.coverImage ?? ''}
          onChange={(e) => updateField('coverImage', e.target.value || undefined)}
          placeholder="https://..."
          className={INPUT_CLASS}
        />
      </div>
    </div>
  )

  const renderFacebookLinkedInFields = () => (
    <div className="space-y-3">
      <h4 className={SECTION_LABEL}>Facebook & LinkedIn</h4>
      <div>
        <label className="mb-1 block text-xs text-muted-foreground">Post-Typ</label>
        <select
          value={draft.fbPostType ?? 'text'}
          onChange={(e) => updateField('fbPostType', e.target.value)}
          className={INPUT_CLASS}
        >
          <option value="text">Text</option>
          <option value="text-image">Text + Bild</option>
          <option value="video">Video</option>
          <option value="link">Link</option>
          <option value="carousel">Carousel</option>
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs text-muted-foreground">Caption</label>
        <textarea
          rows={3}
          value={draft.fbCaption ?? ''}
          onChange={(e) => updateField('fbCaption', e.target.value || undefined)}
          placeholder="Caption schreiben..."
          className={cn(INPUT_CLASS, 'resize-none')}
        />
      </div>
      <div>
        <label className="mb-1 block text-xs text-muted-foreground">Hashtags</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={fbHashtagInput}
            onChange={(e) => setFbHashtagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addTags('fbHashtags', fbHashtagInput)
                setFbHashtagInput('')
              }
            }}
            placeholder="Hashtags kommagetrennt..."
            className={INPUT_CLASS}
          />
          <button
            type="button"
            onClick={() => {
              addTags('fbHashtags', fbHashtagInput)
              setFbHashtagInput('')
            }}
            className="shrink-0 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        {(draft.fbHashtags ?? []).length > 0 && renderTagPills(draft.fbHashtags!, 'fbHashtags', '#')}
      </div>
      <div>
        <label className="mb-1 block text-xs text-muted-foreground">Link URL</label>
        <input
          type="url"
          value={draft.linkUrl ?? ''}
          onChange={(e) => updateField('linkUrl', e.target.value || undefined)}
          placeholder="https://..."
          className={INPUT_CLASS}
        />
      </div>
      <div>
        <label className="mb-1 block text-xs text-muted-foreground">Cover-Bild URL</label>
        <input
          type="text"
          value={draft.fbCoverImage ?? ''}
          onChange={(e) => updateField('fbCoverImage', e.target.value || undefined)}
          placeholder="https://..."
          className={INPUT_CLASS}
        />
      </div>
    </div>
  )

  // ── Tab: Preview ──────────────────────────────────────────────────────

  const renderPreview = () => {
    const statusCfg = STATUS_CONFIG[draft.status]
    const priorityCfg = PRIORITY_CONFIG[draft.priority]
    const qualityCfg = QUALITY_CONFIG[draft.quality]

    return (
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
            style={{ background: platformConfig.bgColor, color: platformConfig.color }}
          >
            {platformConfig.label}
          </span>
          <span
            className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
            style={{ background: statusCfg.bgColor, color: statusCfg.color }}
          >
            {statusCfg.label}
          </span>
          <span
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium"
            style={{ background: priorityCfg.bgColor, color: priorityCfg.color }}
          >
            {priorityCfg.dot} {priorityCfg.label}
          </span>
          <span className="text-sm">{qualityCfg.emoji} {qualityCfg.label}</span>
        </div>

        {/* Title */}
        <h2 className="text-xl font-bold text-foreground">{draft.title || 'Kein Titel'}</h2>

        {/* Concept */}
        {draft.concept && (
          <p className="text-sm text-muted-foreground">{draft.concept}</p>
        )}

        {/* Angle/Hook */}
        {draft.angle && (
          <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
            <p className="text-xs font-medium text-primary mb-1">Angle / Hook</p>
            <p className="text-sm text-foreground">{draft.angle}</p>
          </div>
        )}

        {/* Scheduled date */}
        {draft.scheduledDate && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            Geplant: {new Date(draft.scheduledDate).toLocaleDateString('de-DE', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
            })}
          </div>
        )}

        {/* Platform-specific preview */}
        {draft.platform === 'youtube' && (
          <div className="space-y-2 rounded-lg border border-border bg-muted/30 p-4">
            <h4 className={SECTION_LABEL}>YouTube Details</h4>
            {draft.videoTitle && (
              <p className="text-sm"><span className="text-muted-foreground">Video-Titel:</span> {draft.videoTitle}</p>
            )}
            {draft.videoDescription && (
              <p className="text-sm whitespace-pre-wrap"><span className="text-muted-foreground">Beschreibung:</span> {draft.videoDescription}</p>
            )}
            {draft.youtubeCategory && (
              <p className="text-sm"><span className="text-muted-foreground">Kategorie:</span> {draft.youtubeCategory}</p>
            )}
            {draft.targetAudience && (
              <p className="text-sm"><span className="text-muted-foreground">Zielgruppe:</span> {draft.targetAudience}</p>
            )}
            {(draft.keywords ?? []).length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {draft.keywords!.map((kw) => (
                  <span key={kw} className="rounded-full bg-muted px-2 py-0.5 text-xs text-foreground">{kw}</span>
                ))}
              </div>
            )}
          </div>
        )}

        {draft.platform === 'instagram' && (
          <div className="space-y-2 rounded-lg border border-border bg-muted/30 p-4">
            <h4 className={SECTION_LABEL}>Instagram Details</h4>
            {draft.postType && (
              <p className="text-sm"><span className="text-muted-foreground">Post-Typ:</span> {draft.postType}</p>
            )}
            {draft.caption && (
              <p className="text-sm whitespace-pre-wrap"><span className="text-muted-foreground">Caption:</span> {draft.caption}</p>
            )}
            {draft.audioReference && (
              <p className="text-sm"><span className="text-muted-foreground">Audio:</span> {draft.audioReference}</p>
            )}
            {(draft.hashtags ?? []).length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {draft.hashtags!.map((ht) => (
                  <span key={ht} className="rounded-full bg-muted px-2 py-0.5 text-xs text-foreground">#{ht}</span>
                ))}
              </div>
            )}
          </div>
        )}

        {draft.platform === 'facebook-linkedin' && (
          <div className="space-y-2 rounded-lg border border-border bg-muted/30 p-4">
            <h4 className={SECTION_LABEL}>Facebook & LinkedIn Details</h4>
            {draft.fbPostType && (
              <p className="text-sm"><span className="text-muted-foreground">Post-Typ:</span> {draft.fbPostType}</p>
            )}
            {draft.fbCaption && (
              <p className="text-sm whitespace-pre-wrap"><span className="text-muted-foreground">Caption:</span> {draft.fbCaption}</p>
            )}
            {draft.linkUrl && (
              <p className="text-sm"><span className="text-muted-foreground">Link:</span>{' '}
                <a href={draft.linkUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{draft.linkUrl}</a>
              </p>
            )}
            {(draft.fbHashtags ?? []).length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {draft.fbHashtags!.map((ht) => (
                  <span key={ht} className="rounded-full bg-muted px-2 py-0.5 text-xs text-foreground">#{ht}</span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tags */}
        {draft.tags.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Tag className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground font-medium">Tags</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {draft.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        {draft.notes && (
          <div>
            <p className="text-xs text-muted-foreground font-medium mb-1">Notizen</p>
            <p className="text-sm text-foreground whitespace-pre-wrap">{draft.notes}</p>
          </div>
        )}

        {/* Assignee */}
        {draft.assignee && (
          <p className="text-sm text-muted-foreground">
            Zuständig: <span className="text-foreground font-medium">{draft.assignee}</span>
          </p>
        )}
      </div>
    )
  }

  // ── Tab: Versions ─────────────────────────────────────────────────────

  const renderVersions = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className={SECTION_LABEL}>Gespeicherte Versionen</h4>
        {!showVersionInput ? (
          <button
            type="button"
            onClick={() => setShowVersionInput(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Save className="h-3.5 w-3.5" />
            Version speichern
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newVersionName}
              onChange={(e) => setNewVersionName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  saveVersion()
                }
                if (e.key === 'Escape') setShowVersionInput(false)
              }}
              placeholder="Versionsname..."
              className={cn(INPUT_CLASS, 'w-48')}
              autoFocus
            />
            <button
              type="button"
              onClick={saveVersion}
              disabled={!newVersionName.trim()}
              className="rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              <Check className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => {
                setShowVersionInput(false)
                setNewVersionName('')
              }}
              className="rounded-lg border border-border px-3 py-2 text-xs text-muted-foreground hover:bg-muted transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      {draft.versions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <History className="h-10 w-10 text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">Noch keine Versionen gespeichert</p>
          <p className="text-xs text-muted-foreground/70 mt-1">
            Speichere den aktuellen Stand als Version, um ihn später wiederherzustellen.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {[...draft.versions].reverse().map((version) => (
            <div
              key={version.id}
              className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium text-foreground">{version.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatDateTime(version.createdAt)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => restoreVersion(version)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Wiederherstellen
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  // ── Tab: Checklist ────────────────────────────────────────────────────

  const renderChecklist = () => (
    <div className="space-y-4">
      {/* Progress */}
      {totalCount > 0 && (
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-muted-foreground">
              {completedCount} / {totalCount} erledigt
            </span>
            <span className="text-xs font-medium text-muted-foreground">{progressPercent}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Items */}
      {draft.checklist.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <ListChecks className="h-10 w-10 text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">Keine Einträge vorhanden</p>
        </div>
      ) : (
        <div className="space-y-1">
          {draft.checklist.map((ci) => (
            <div
              key={ci.id}
              className="group/item flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-muted/50 transition-colors"
            >
              <button
                type="button"
                onClick={() => toggleChecklistItem(ci.id)}
                className={cn(
                  'flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors',
                  ci.completed
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border hover:border-primary/50',
                )}
              >
                {ci.completed && <Check className="h-3 w-3" />}
              </button>
              <span
                className={cn(
                  'flex-1 text-sm transition-colors',
                  ci.completed ? 'text-muted-foreground line-through' : 'text-foreground',
                )}
              >
                {ci.text}
              </span>
              <button
                type="button"
                onClick={() => removeChecklistItem(ci.id)}
                className="shrink-0 rounded-md p-1 text-muted-foreground opacity-0 group-hover/item:opacity-100 hover:text-red-500 hover:bg-red-500/10 transition-all"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add new item */}
      <div className="flex gap-2 pt-2 border-t border-border">
        <input
          type="text"
          value={newChecklistText}
          onChange={(e) => setNewChecklistText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              addChecklistItem()
            }
          }}
          placeholder="Neuen Eintrag hinzufügen..."
          className={INPUT_CLASS}
        />
        <button
          type="button"
          onClick={addChecklistItem}
          disabled={!newChecklistText.trim()}
          className="shrink-0 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  )

  // ── Main render ───────────────────────────────────────────────────────

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
    >
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-border px-5 py-4">
          <div
            className="w-1 self-stretch rounded-full"
            style={{ backgroundColor: platformConfig.color }}
          />
          <div className="flex-1 min-w-0">
            <input
              type="text"
              value={draft.title}
              onChange={(e) => updateField('title', e.target.value)}
              className="w-full bg-transparent text-lg font-semibold text-foreground outline-none placeholder:text-muted-foreground"
              placeholder="Titel eingeben..."
            />
          </div>
          <span
            className="shrink-0 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold"
            style={{ background: platformConfig.bgColor, color: platformConfig.color }}
          >
            {platformConfig.label}
          </span>
          <button
            type="button"
            onClick={handleClose}
            className="shrink-0 rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border px-5">
          {TABS.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground',
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {activeTab === 'details' && renderDetails()}
          {activeTab === 'preview' && renderPreview()}
          {activeTab === 'versions' && renderVersions()}
          {activeTab === 'checklist' && renderChecklist()}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border px-5 py-3">
          <span className="text-xs text-muted-foreground">
            Zuletzt aktualisiert: {formatDateTime(draft.updatedAt)}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              Abbrechen
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Speichern
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
