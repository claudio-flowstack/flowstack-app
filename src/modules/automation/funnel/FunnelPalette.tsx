import { useState, useMemo } from 'react'
import { cn } from '@/shared/lib/utils'
import type { FunnelElement, FunnelPhase, MockupKind } from '../domain/types'
import { PLATFORM_REGISTRY, MOCKUP_SIZES, DEFAULT_PHASES, FUNNEL_TEMPLATES } from './constants'
import { renderFunnelIcon } from './FunnelLogos'
import {
  X, Search, Smartphone, Monitor, Tablet,
  Image as ImageIcon, Target, Video,
  Type, Heading1, Heading2, AlignLeft, StickyNote,
  LayoutTemplate,
} from 'lucide-react'

// ── Types & Constants ───────────────────────────────────────────────────────

type PaletteTab = 'platforms' | 'mockups' | 'text' | 'media' | 'phases' | 'templates'

const TAB_CONFIG: { key: PaletteTab; label: string }[] = [
  { key: 'platforms', label: 'Platforms' },
  { key: 'mockups', label: 'Mockups' },
  { key: 'text', label: 'Text' },
  { key: 'media', label: 'Media' },
  { key: 'phases', label: 'Phasen' },
  { key: 'templates', label: 'Vorlagen' },
]

const CATEGORY_LABELS: Record<string, string> = {
  advertising: 'Werbung',
  touchpoint: 'Touchpoints',
  backend: 'Backend',
}

const MOCKUP_ITEMS: { kind: MockupKind; label: string; icon: typeof Smartphone }[] = [
  { kind: 'mobile', label: 'Smartphone', icon: Smartphone },
  { kind: 'desktop', label: 'Desktop', icon: Monitor },
  { kind: 'tablet', label: 'Tablet', icon: Tablet },
  { kind: 'social-post', label: 'Social Post', icon: ImageIcon },
  { kind: 'ad-mockup', label: 'Ad Preview', icon: Target },
  { kind: 'facebook-ad', label: 'Facebook Ad', icon: Target },
  { kind: 'instagram-ad', label: 'Instagram Ad', icon: Target },
  { kind: 'google-ad', label: 'Google Ad', icon: Target },
  { kind: 'linkedin-ad', label: 'LinkedIn Ad', icon: Target },
  { kind: 'linkedin-post', label: 'LinkedIn Post', icon: ImageIcon },
  { kind: 'tiktok-ad', label: 'TikTok Ad', icon: Target },
]

const TEXT_ITEMS: { kind: 'headline' | 'subheadline' | 'body' | 'note'; label: string; icon: typeof Type; fontSize: number; fontWeight: 'normal' | 'bold' }[] = [
  { kind: 'headline', label: 'Überschrift', icon: Heading1, fontSize: 28, fontWeight: 'bold' },
  { kind: 'subheadline', label: 'Unterüberschrift', icon: Heading2, fontSize: 20, fontWeight: 'bold' },
  { kind: 'body', label: 'Fließtext', icon: AlignLeft, fontSize: 14, fontWeight: 'normal' },
  { kind: 'note', label: 'Notiz', icon: StickyNote, fontSize: 12, fontWeight: 'normal' },
]

// ── Props ───────────────────────────────────────────────────────────────────

export interface FunnelPaletteProps {
  open: boolean
  onClose: () => void
  onAddElement: (element: Omit<FunnelElement, 'id'>) => void
  onAddPhase: (phase: Omit<FunnelPhase, 'id'>) => void
  onApplyTemplate: (templateId: string) => void
}

// ── Component ───────────────────────────────────────────────────────────────

export function FunnelPalette({
  open,
  onClose,
  onAddElement,
  onAddPhase,
  onApplyTemplate,
}: FunnelPaletteProps) {
  const [activeTab, setActiveTab] = useState<PaletteTab>('platforms')
  const [search, setSearch] = useState('')

  const query = search.toLowerCase().trim()

  // ── Filtered platforms ──────────────────────────────────────────────────

  const filteredPlatforms = useMemo(() => {
    if (!query) return PLATFORM_REGISTRY
    return PLATFORM_REGISTRY.filter(
      (p) => p.label.toLowerCase().includes(query) || p.kind.toLowerCase().includes(query),
    )
  }, [query])

  const groupedPlatforms = useMemo(() => {
    const groups: Record<string, typeof PLATFORM_REGISTRY> = {}
    for (const p of filteredPlatforms) {
      const cat = p.category
      if (!groups[cat]) groups[cat] = []
      groups[cat].push(p)
    }
    return groups
  }, [filteredPlatforms])

  // ── Filtered mockups ───────────────────────────────────────────────────

  const filteredMockups = useMemo(() => {
    if (!query) return MOCKUP_ITEMS
    return MOCKUP_ITEMS.filter((m) => m.label.toLowerCase().includes(query) || m.kind.toLowerCase().includes(query))
  }, [query])

  // ── Filtered text items ────────────────────────────────────────────────

  const filteredText = useMemo(() => {
    if (!query) return TEXT_ITEMS
    return TEXT_ITEMS.filter((t) => t.label.toLowerCase().includes(query) || t.kind.toLowerCase().includes(query))
  }, [query])

  // ── Filtered templates ─────────────────────────────────────────────────

  const filteredTemplates = useMemo(() => {
    if (!query) return FUNNEL_TEMPLATES
    return FUNNEL_TEMPLATES.filter(
      (t) => t.name.toLowerCase().includes(query) || t.description.toLowerCase().includes(query),
    )
  }, [query])

  if (!open) return null

  return (
    <div className="absolute right-4 top-4 z-30 w-[280px] rounded-xl border border-border bg-card/95 backdrop-blur-md shadow-xl animate-fade-in flex flex-col max-h-[calc(100vh-6rem)]">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between border-b border-border px-3 py-2.5 shrink-0">
        <span className="text-xs font-bold text-foreground uppercase tracking-wider">
          Elemente
        </span>
        <button
          onClick={onClose}
          className="rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* ── Tabs ────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap border-b border-border shrink-0">
        {TAB_CONFIG.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => { setActiveTab(key); setSearch('') }}
            className={cn(
              'flex-1 min-w-[80px] px-2 py-1.5 text-[11px] font-semibold transition-colors',
              activeTab === key
                ? 'text-foreground border-b-2 border-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Search ──────────────────────────────────────────────────────── */}
      <div className="px-2 pt-2 shrink-0">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Suchen..."
            className="w-full rounded-lg border border-border bg-muted/40 py-1.5 pl-7 pr-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────────────────────── */}
      <div className="overflow-y-auto p-2 space-y-1 flex-1">

        {/* ── Platforms Tab ─────────────────────────────────────────────── */}
        {activeTab === 'platforms' && (
          <>
            {Object.entries(groupedPlatforms).map(([category, platforms]) => (
              <div key={category}>
                <div className="px-2 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  {CATEGORY_LABELS[category] ?? category}
                </div>
                <div className="space-y-0.5">
                  {platforms.map((p) => (
                    <button
                      key={p.kind}
                      onClick={() => onAddElement({
                        type: 'platform',
                        x: 100,
                        y: 100,
                        width: 200,
                        height: 80,
                        platformKind: p.kind,
                        label: p.label,
                        icon: p.icon,
                      })}
                      className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-xs text-foreground hover:bg-muted/80 transition-colors"
                    >
                      <span
                        className="flex h-6 w-6 items-center justify-center rounded-md shrink-0"
                        style={{ background: p.color + '15' }}
                      >
                        <span className="scale-[0.7]">
                          {renderFunnelIcon(p.icon, p.color)}
                        </span>
                      </span>
                      <span className="truncate">{p.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
            {filteredPlatforms.length === 0 && (
              <p className="px-2 py-4 text-xs text-muted-foreground text-center">Keine Plattformen gefunden</p>
            )}
          </>
        )}

        {/* ── Mockups Tab ──────────────────────────────────────────────── */}
        {activeTab === 'mockups' && (
          <>
            <div className="grid grid-cols-2 gap-1.5">
              {filteredMockups.map((m) => {
                const size = MOCKUP_SIZES[m.kind]
                const Icon = m.icon
                return (
                  <button
                    key={m.kind}
                    onClick={() => onAddElement({
                      type: 'mockup',
                      x: 100,
                      y: 100,
                      width: size.width,
                      height: size.height,
                      mockupKind: m.kind,
                      label: m.label,
                    })}
                    className="flex flex-col items-center gap-1.5 rounded-lg p-2.5 hover:bg-muted/60 transition-colors border border-transparent hover:border-border"
                  >
                    <Icon className="h-6 w-6 text-muted-foreground" />
                    <span className="text-[11px] text-foreground font-medium truncate w-full text-center">
                      {m.label}
                    </span>
                    <span className="text-[9px] text-muted-foreground">
                      {size.width}x{size.height}
                    </span>
                  </button>
                )
              })}
            </div>
            {filteredMockups.length === 0 && (
              <p className="px-2 py-4 text-xs text-muted-foreground text-center">Keine Mockups gefunden</p>
            )}
          </>
        )}

        {/* ── Text Tab ─────────────────────────────────────────────────── */}
        {activeTab === 'text' && (
          <>
            <div className="space-y-1">
              {filteredText.map((t) => {
                const Icon = t.icon
                return (
                  <button
                    key={t.kind}
                    onClick={() => onAddElement({
                      type: 'text',
                      x: 100,
                      y: 100,
                      width: 260,
                      height: 48,
                      textKind: t.kind,
                      textContent: t.label,
                      fontSize: t.fontSize,
                      fontWeight: t.fontWeight,
                    })}
                    className="flex w-full items-center gap-3 rounded-lg px-2 py-2 hover:bg-muted/80 transition-colors"
                  >
                    <Icon className="h-5 w-5 text-muted-foreground shrink-0" />
                    <div className="flex flex-col items-start gap-0.5">
                      <span
                        className="text-foreground truncate"
                        style={{ fontSize: Math.min(t.fontSize, 16), fontWeight: t.fontWeight === 'bold' ? 700 : 400 }}
                      >
                        {t.label}
                      </span>
                      <span className="text-[9px] text-muted-foreground">
                        {t.fontSize}px / {t.fontWeight}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
            {filteredText.length === 0 && (
              <p className="px-2 py-4 text-xs text-muted-foreground text-center">Keine Textelemente gefunden</p>
            )}
          </>
        )}

        {/* ── Media Tab ────────────────────────────────────────────────── */}
        {activeTab === 'media' && (
          <div className="space-y-1">
            <button
              onClick={() => onAddElement({
                type: 'media',
                x: 100,
                y: 100,
                width: 300,
                height: 200,
                label: 'Bild',
              })}
              className="flex w-full items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-muted/80 transition-colors"
            >
              <ImageIcon className="h-5 w-5 text-muted-foreground" />
              <span className="text-xs text-foreground">Bild</span>
            </button>
            <button
              onClick={() => onAddElement({
                type: 'media',
                x: 100,
                y: 100,
                width: 300,
                height: 200,
                label: 'Video',
              })}
              className="flex w-full items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-muted/80 transition-colors"
            >
              <Video className="h-5 w-5 text-muted-foreground" />
              <span className="text-xs text-foreground">Video</span>
            </button>
          </div>
        )}

        {/* ── Phasen Tab ───────────────────────────────────────────────── */}
        {activeTab === 'phases' && (
          <div className="space-y-1">
            {DEFAULT_PHASES.map((phase) => (
              <button
                key={phase.label}
                onClick={() => onAddPhase({
                  label: phase.label,
                  x: 50,
                  y: 50,
                  width: 260,
                  height: 300,
                  color: phase.color,
                })}
                className="flex w-full items-center gap-3 rounded-lg px-2 py-2 hover:bg-muted/80 transition-colors"
              >
                <span
                  className="h-5 w-5 rounded-md border shrink-0"
                  style={{ background: phase.color + '20', borderColor: phase.color + '60' }}
                />
                <span className="text-xs text-foreground">{phase.label}</span>
                <span
                  className="ml-auto h-3 w-3 rounded-full"
                  style={{ background: phase.color }}
                />
              </button>
            ))}
          </div>
        )}

        {/* ── Vorlagen Tab ─────────────────────────────────────────────── */}
        {activeTab === 'templates' && (
          <>
            <div className="space-y-1.5">
              {filteredTemplates.map((tpl) => (
                <button
                  key={tpl.id}
                  onClick={() => onApplyTemplate(tpl.id)}
                  className="flex w-full flex-col gap-1 rounded-lg border border-border p-2.5 hover:bg-muted/60 transition-colors text-left"
                >
                  <div className="flex items-center gap-2">
                    <LayoutTemplate className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-xs font-semibold text-foreground truncate">
                      {tpl.name}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-relaxed line-clamp-2">
                    {tpl.description}
                  </p>
                  <span className="text-[9px] text-muted-foreground mt-0.5">
                    {tpl.elements.length} Elemente / {tpl.phases.length} Phasen
                  </span>
                </button>
              ))}
            </div>
            {filteredTemplates.length === 0 && (
              <p className="px-2 py-4 text-xs text-muted-foreground text-center">Keine Vorlagen gefunden</p>
            )}
          </>
        )}
      </div>
    </div>
  )
}
