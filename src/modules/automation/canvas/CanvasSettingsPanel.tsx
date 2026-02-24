import { cn } from '@/shared/lib/utils'
import { Settings, Sparkles, Activity, X, Grid3X3, Eye, EyeOff, Tag } from 'lucide-react'
import type { CanvasSettings } from './useCanvasState'

interface CanvasSettingsPanelProps {
  settings: CanvasSettings
  onUpdateSettings: (updates: Partial<CanvasSettings>) => void
  onClose: () => void
  variant?: 'floating' | 'embedded'
}

const COLOR_THEMES: { id: string; color: string; label: string }[] = [
  { id: 'purple', color: '#a855f7', label: 'Lila' },
  { id: 'blue', color: '#3b82f6', label: 'Blau' },
  { id: 'mono', color: '#6b7280', label: 'Mono' },
  { id: 'neon', color: '#22d3ee', label: 'Neon' },
  { id: 'pastel', color: '#c4b5fd', label: 'Pastell' },
  { id: 'emerald', color: '#10b981', label: 'Smaragd' },
  { id: 'sunset', color: '#f97316', label: 'Sonnenuntergang' },
  { id: 'rose', color: '#f43f5e', label: 'Rosa' },
]

const NODE_DESIGN_THEMES = [
  'nodelab', 'default', 'glass', 'minimal', 'outlined',
  'neon', 'gradient', 'solid', 'wire',
] as const

const NODE_LAYOUTS = [
  'standard', 'centered', 'compact', 'icon-focus',
] as const

const LAYOUT_ICONS: Record<string, string> = {
  standard: '☰',
  centered: '◎',
  compact: '▬',
  'icon-focus': '◉',
}

interface ConnectionPreset {
  label: string
  connCurveStyle: 'bezier' | 'straight' | 'elbow'
  connLineStyle: 'solid' | 'dashed' | 'dotted'
  connStrokeWidth: 1 | 2 | 3
  connArrowHead: 'none' | 'arrow' | 'diamond' | 'circle'
  connColorTheme: string
  connGlow: boolean
}

const CONNECTION_PRESETS: ConnectionPreset[] = [
  { label: 'Klassisch', connCurveStyle: 'bezier', connLineStyle: 'solid', connStrokeWidth: 2, connArrowHead: 'arrow', connColorTheme: 'purple', connGlow: false },
  { label: 'Neon-Leuchten', connCurveStyle: 'bezier', connLineStyle: 'solid', connStrokeWidth: 2, connArrowHead: 'arrow', connColorTheme: 'neon', connGlow: true },
  { label: 'Bauplan', connCurveStyle: 'straight', connLineStyle: 'dashed', connStrokeWidth: 1, connArrowHead: 'circle', connColorTheme: 'blue', connGlow: false },
  { label: 'Fett', connCurveStyle: 'elbow', connLineStyle: 'solid', connStrokeWidth: 3, connArrowHead: 'diamond', connColorTheme: 'mono', connGlow: false },
  { label: 'Elegant', connCurveStyle: 'bezier', connLineStyle: 'dotted', connStrokeWidth: 1, connArrowHead: 'none', connColorTheme: 'pastel', connGlow: false },
  { label: 'Cyber', connCurveStyle: 'straight', connLineStyle: 'solid', connStrokeWidth: 3, connArrowHead: 'arrow', connColorTheme: 'neon', connGlow: true },
]

export function CanvasSettingsPanel({
  settings,
  onUpdateSettings,
  onClose,
  variant = 'floating',
}: CanvasSettingsPanelProps) {
  const sectionLabel = 'text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider'

  const optionBtn = (active: boolean) =>
    cn(
      'flex items-center justify-center rounded-md text-[10px] font-medium transition-colors',
      active
        ? 'bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 font-semibold'
        : 'text-gray-400 dark:text-zinc-600 hover:text-gray-600 dark:hover:text-zinc-400 bg-gray-50 dark:bg-zinc-800',
    )

  return (
    <div className={cn(
      variant === 'embedded'
        ? 'w-full h-full flex flex-col bg-card/95'
        : 'absolute right-0 top-0 z-40 w-72 min-w-[220px] bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl shadow-2xl',
    )}>
      {/* Kopfzeile */}
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-zinc-700 px-4 py-3">
        <span className="flex items-center gap-2 text-xs font-bold text-gray-900 dark:text-white">
          <Settings className="h-3.5 w-3.5" />
          Canvas-Einstellungen
        </span>
        <button
          onClick={onClose}
          className="rounded-md p-1 text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Scrollbarer Inhalt */}
      <div className={cn('overflow-y-auto p-4 space-y-5', variant === 'embedded' ? 'flex-1 min-h-0' : 'max-h-[70vh]')}>
        {/* ── Canvas-Anzeige ─────────────────────── */}
        <div className="space-y-3">
          <p className={sectionLabel}>Canvas-Anzeige</p>

          {/* Raster-Umschalter */}
          <button
            onClick={() => onUpdateSettings({ showGrid: !settings.showGrid })}
            className={cn(optionBtn(settings.showGrid), 'gap-2 px-3 py-2 w-full')}
          >
            <Grid3X3 className="h-3.5 w-3.5" />
            <span>{settings.showGrid ? 'Raster An' : 'Raster Aus'}</span>
          </button>

          {/* Gruppen-Hintergründe Umschalter */}
          <button
            onClick={() => onUpdateSettings({ showGroupBackgrounds: !settings.showGroupBackgrounds })}
            className={cn(optionBtn(settings.showGroupBackgrounds), 'gap-2 px-3 py-2 w-full')}
          >
            {settings.showGroupBackgrounds
              ? <Eye className="h-3.5 w-3.5" />
              : <EyeOff className="h-3.5 w-3.5" />}
            <span>{settings.showGroupBackgrounds ? 'Phasen sichtbar' : 'Phasen ausgeblendet'}</span>
          </button>

          {/* Typ-Badges Umschalter */}
          <button
            onClick={() => onUpdateSettings({ showTypeBadges: !settings.showTypeBadges })}
            className={cn(optionBtn(settings.showTypeBadges), 'gap-2 px-3 py-2 w-full')}
          >
            <Tag className="h-3.5 w-3.5" />
            <span>{settings.showTypeBadges ? 'Typ-Badges An' : 'Typ-Badges Aus'}</span>
          </button>

          {/* Beschreibungen Umschalter */}
          <button
            onClick={() => onUpdateSettings({ showDescriptions: !settings.showDescriptions })}
            className={cn(optionBtn(settings.showDescriptions), 'gap-2 px-3 py-2 w-full')}
          >
            {settings.showDescriptions
              ? <Eye className="h-3.5 w-3.5" />
              : <EyeOff className="h-3.5 w-3.5" />}
            <span>{settings.showDescriptions ? 'Beschreibungen An' : 'Beschreibungen Aus'}</span>
          </button>

          {/* Scroll-Geschwindigkeit */}
          <div className="space-y-1.5">
            <p className="text-[10px] text-muted-foreground">Scroll-Geschwindigkeit</p>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={1}
                max={5}
                value={settings.scrollSpeed}
                onChange={(e) => onUpdateSettings({ scrollSpeed: Number(e.target.value) })}
                className="flex-1 h-1 accent-purple-500"
              />
              <span className="text-[10px] text-muted-foreground w-4 text-center">{settings.scrollSpeed}</span>
            </div>
          </div>
        </div>

        {/* Phasen-Navigation entfernt — nur PM-Funktion */}

        {/* ── Verbindungs-Modus ─────────────────── */}
        <div className="space-y-3">
          <p className={sectionLabel}>Verbindungsstil</p>

          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => onUpdateSettings({ connStyleMode: 'v3' })}
              className={cn(optionBtn(settings.connStyleMode === 'v3'), 'px-2 py-1.5')}
            >
              V3 Animiert
            </button>
            <button
              onClick={() => onUpdateSettings({ connStyleMode: 'classic' })}
              className={cn(optionBtn(settings.connStyleMode === 'classic'), 'px-2 py-1.5')}
            >
              Klassisch
            </button>
          </div>
        </div>

        {/* ── Verbindungs-Einstellungen ────────── */}
        <div className="space-y-3">
          <p className={sectionLabel}>Verbindungs-Einstellungen</p>

          {/* Kurvenform */}
          <div className="space-y-1.5">
            <p className="text-[10px] text-muted-foreground">Kurvenform</p>
            <div className="grid grid-cols-3 gap-1.5">
              {(['bezier', 'straight', 'elbow'] as const).map((style) => (
                <button
                  key={style}
                  onClick={() => onUpdateSettings({ connCurveStyle: style })}
                  className={cn(optionBtn(settings.connCurveStyle === style), 'px-2 py-1.5')}
                >
                  {{ bezier: 'Bezier', straight: 'Gerade', elbow: 'Winkel' }[style]}
                </button>
              ))}
            </div>
          </div>

          {/* Linienstil */}
          <div className="space-y-1.5">
            <p className="text-[10px] text-muted-foreground">Linienstil</p>
            <div className="grid grid-cols-3 gap-1.5">
              {(['solid', 'dashed', 'dotted'] as const).map((style) => (
                <button
                  key={style}
                  onClick={() => onUpdateSettings({ connLineStyle: style })}
                  className={cn(optionBtn(settings.connLineStyle === style), 'px-2 py-2 flex-col gap-1')}
                >
                  <svg width="32" height="4" viewBox="0 0 32 4" className="shrink-0">
                    <line
                      x1="0" y1="2" x2="32" y2="2"
                      stroke="currentColor" strokeWidth="2"
                      strokeDasharray={
                        style === 'dashed' ? '6 3' : style === 'dotted' ? '2 3' : undefined
                      }
                    />
                  </svg>
                  <span className="text-[10px]">
                    {{ solid: 'Durchgezogen', dashed: 'Gestrichelt', dotted: 'Gepunktet' }[style]}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Pfeilspitze */}
          <div className="space-y-1.5">
            <p className="text-[10px] text-muted-foreground">Pfeilspitze</p>
            <div className="grid grid-cols-4 gap-1.5">
              {([
                { id: 'none' as const, label: 'Ohne', symbol: '—' },
                { id: 'arrow' as const, label: 'Pfeil', symbol: '→' },
                { id: 'diamond' as const, label: 'Raute', symbol: '◇' },
                { id: 'circle' as const, label: 'Kreis', symbol: '●' },
              ]).map(({ id, label, symbol }) => (
                <button
                  key={id}
                  onClick={() => onUpdateSettings({ connArrowHead: id })}
                  className={cn(optionBtn(settings.connArrowHead === id), 'px-1 py-1.5 flex-col gap-0.5')}
                  title={label}
                >
                  <span className="text-sm leading-none">{symbol}</span>
                  <span className="text-[9px]">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Farbschema */}
          <div className="space-y-1.5">
            <p className="text-[10px] text-muted-foreground">Farbschema</p>
            <div className="flex items-center gap-2 flex-wrap">
              {COLOR_THEMES.map(({ id, color, label }) => (
                <button
                  key={id}
                  onClick={() => onUpdateSettings({ connColorTheme: id })}
                  className={cn(
                    'h-6 w-6 rounded-full border-2 transition-all duration-150',
                    settings.connColorTheme === id
                      ? 'border-purple-400 scale-110 ring-2 ring-purple-500/20'
                      : 'border-transparent hover:scale-105',
                  )}
                  style={{ background: color }}
                  title={label}
                />
              ))}
            </div>
          </div>

          {/* Strichbreite */}
          <div className="space-y-1.5">
            <p className="text-[10px] text-muted-foreground">Strichbreite</p>
            <div className="grid grid-cols-3 gap-1.5">
              {([
                { width: 1 as const, label: 'Dünn' },
                { width: 2 as const, label: 'Normal' },
                { width: 3 as const, label: 'Fett' },
              ]).map(({ width, label }) => (
                <button
                  key={width}
                  onClick={() => onUpdateSettings({ connStrokeWidth: width })}
                  className={cn(optionBtn(settings.connStrokeWidth === width), 'px-2 py-2 flex-col gap-1')}
                >
                  <svg width="28" height="6" viewBox="0 0 28 6" className="shrink-0">
                    <line x1="0" y1="3" x2="28" y2="3" stroke="currentColor" strokeWidth={width} />
                  </svg>
                  <span className="text-[10px]">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Leuchten Umschalter */}
          <button
            onClick={() => onUpdateSettings({ connGlow: !settings.connGlow })}
            className={cn(optionBtn(settings.connGlow), 'gap-2 px-3 py-2 w-full')}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>{settings.connGlow ? 'Leuchten An' : 'Leuchten Aus'}</span>
          </button>

          {/* Fluss-Punkte Umschalter */}
          <button
            onClick={() => onUpdateSettings({ showFlowDots: !settings.showFlowDots })}
            className={cn(optionBtn(settings.showFlowDots), 'gap-2 px-3 py-2 w-full')}
          >
            <Activity className="h-3.5 w-3.5" />
            <span>{settings.showFlowDots ? 'Fluss-Punkte An' : 'Fluss-Punkte Aus'}</span>
          </button>
        </div>

        {/* ── Node-Design ─────────────────────── */}
        <div className="space-y-2">
          <p className={sectionLabel}>Node-Design</p>
          <div className="grid grid-cols-2 gap-1.5">
            {NODE_DESIGN_THEMES.map((theme) => {
              const themeLabels: Record<string, string> = {
                nodelab: 'NodeLab V2',
                default: 'Standard',
                glass: 'Glas',
                minimal: 'Minimal',
                outlined: 'Umriss',
                neon: 'Neon',
                gradient: 'Verlauf',
                solid: 'Solide',
                wire: 'Draht',
              }
              return (
              <button
                key={theme}
                onClick={() => onUpdateSettings({ nodeDesignTheme: theme })}
                className={cn(optionBtn(settings.nodeDesignTheme === theme), 'px-2 py-2')}
              >
                {themeLabels[theme] ?? theme}
              </button>
              )
            })}
          </div>
        </div>

        {/* ── Node-Layout ─────────────────────── */}
        <div className="space-y-2">
          <p className={sectionLabel}>Node-Layout</p>
          <div className="grid grid-cols-2 gap-1.5">
            {NODE_LAYOUTS.map((layout) => {
              const layoutLabels: Record<string, string> = {
                standard: 'Standard',
                centered: 'Zentriert',
                compact: 'Kompakt',
                'icon-focus': 'Icon-Fokus',
              }
              return (
              <button
                key={layout}
                onClick={() => onUpdateSettings({ nodeLayout: layout })}
                className={cn(optionBtn(settings.nodeLayout === layout), 'px-2 py-2 gap-1.5')}
              >
                <span className="text-sm">{LAYOUT_ICONS[layout] ?? '☰'}</span>
                <span>
                  {layoutLabels[layout] ?? layout}
                </span>
              </button>
              )
            })}
          </div>
        </div>

        {/* ── Verbindungs-Vorlagen ────────────── */}
        <div className="space-y-2">
          <p className={sectionLabel}>Verbindungs-Vorlagen</p>
          <div className="grid grid-cols-2 gap-1.5">
            {CONNECTION_PRESETS.map((preset) => {
              const presetColor = COLOR_THEMES.find((c) => c.id === preset.connColorTheme)?.color ?? '#a855f7'
              const isActive =
                settings.connCurveStyle === preset.connCurveStyle &&
                settings.connLineStyle === preset.connLineStyle &&
                settings.connStrokeWidth === preset.connStrokeWidth &&
                settings.connArrowHead === preset.connArrowHead &&
                settings.connColorTheme === preset.connColorTheme &&
                settings.connGlow === preset.connGlow

              return (
                <button
                  key={preset.label}
                  onClick={() =>
                    onUpdateSettings({
                      connCurveStyle: preset.connCurveStyle,
                      connLineStyle: preset.connLineStyle,
                      connStrokeWidth: preset.connStrokeWidth,
                      connArrowHead: preset.connArrowHead,
                      connColorTheme: preset.connColorTheme,
                      connGlow: preset.connGlow,
                    })
                  }
                  className={cn(optionBtn(isActive), 'px-2 py-2.5 flex-col gap-1.5')}
                >
                  <svg width="36" height="8" viewBox="0 0 36 8" className="shrink-0">
                    <line
                      x1="0" y1="4" x2="36" y2="4"
                      stroke={presetColor}
                      strokeWidth={preset.connStrokeWidth}
                      strokeDasharray={
                        preset.connLineStyle === 'dashed'
                          ? '6 3'
                          : preset.connLineStyle === 'dotted'
                            ? '2 3'
                            : undefined
                      }
                    />
                  </svg>
                  <span className="text-[10px]">{preset.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
