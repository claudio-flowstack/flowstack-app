import { useState, useMemo } from 'react'
import type { ContentItem } from '../domain/types'
import { PLATFORM_CONFIG, STATUS_CONFIG } from '../domain/constants'
import { cn } from '@/shared/lib/utils'
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'

// ── Helpers ────────────────────────────────────────────────────────────────

const DAY_LABELS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'] as const

function getMonday(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function toDateString(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function formatWeekRange(start: Date): string {
  const end = addDays(start, 6)
  const startDay = start.getDate()
  const endDay = end.getDate()
  const months = [
    'Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun',
    'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez',
  ]
  if (start.getMonth() === end.getMonth()) {
    return `${startDay}. - ${endDay}. ${months[start.getMonth()]} ${start.getFullYear()}`
  }
  return `${startDay}. ${months[start.getMonth()]} - ${endDay}. ${months[end.getMonth()]} ${end.getFullYear()}`
}

function truncateTitle(title: string, max = 28): string {
  return title.length > max ? title.slice(0, max - 1) + '\u2026' : title
}

// ── Props ──────────────────────────────────────────────────────────────────

interface ContentCalendarProps {
  items: ContentItem[]
  onOpenItem: (id: string) => void
  onScheduleItem?: (id: string, date: string) => void
}

// ── Component ──────────────────────────────────────────────────────────────

export function ContentCalendar({
  items,
  onOpenItem,
}: ContentCalendarProps) {
  const [currentWeekStart, setCurrentWeekStart] = useState(() => getMonday(new Date()))

  const today = useMemo(() => new Date(), [])

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i))
  }, [currentWeekStart])

  const itemsByDay = useMemo(() => {
    const map = new Map<string, ContentItem[]>()
    for (const day of weekDays) {
      map.set(toDateString(day), [])
    }
    for (const item of items) {
      if (!item.scheduledDate) continue
      const key = item.scheduledDate.slice(0, 10)
      const bucket = map.get(key)
      if (bucket) bucket.push(item)
    }
    return map
  }, [items, weekDays])

  const scheduledItems = useMemo(() => {
    return items
      .filter((item) => item.scheduledDate)
      .sort((a, b) => (a.scheduledDate! > b.scheduledDate! ? 1 : -1))
  }, [items])

  const goToPrevWeek = () => setCurrentWeekStart((prev) => addDays(prev, -7))
  const goToNextWeek = () => setCurrentWeekStart((prev) => addDays(prev, 7))
  const goToToday = () => setCurrentWeekStart(getMonday(new Date()))

  return (
    <div className="space-y-6">
      {/* ── Week navigation ──────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold text-foreground">
            {formatWeekRange(currentWeekStart)}
          </h2>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={goToPrevWeek}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={goToToday}
            className="rounded-lg px-3 py-1 text-xs font-medium text-foreground hover:bg-muted transition-colors"
          >
            Heute
          </button>
          <button
            onClick={goToNextWeek}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ── 7-Day grid ───────────────────────────────────────────── */}
      <div className="grid grid-cols-7 gap-px bg-border rounded-xl overflow-hidden">
        {/* Day headers */}
        {weekDays.map((day, i) => {
          const isToday = isSameDay(day, today)
          return (
            <div
              key={`header-${i}`}
              className={cn(
                'bg-muted/50 px-2 py-1.5 text-center',
                isToday && 'bg-primary/10',
              )}
            >
              <span className="text-[11px] font-medium text-muted-foreground">
                {DAY_LABELS[i]}
              </span>
              <span
                className={cn(
                  'ml-1 text-xs font-semibold',
                  isToday ? 'text-primary' : 'text-foreground',
                )}
              >
                {day.getDate()}
              </span>
            </div>
          )
        })}

        {/* Day cells */}
        {weekDays.map((day, i) => {
          const isToday = isSameDay(day, today)
          const dayItems = itemsByDay.get(toDateString(day)) ?? []
          return (
            <div
              key={`cell-${i}`}
              className={cn(
                'bg-card p-2 min-h-[120px]',
                isToday && 'ring-1 ring-inset ring-primary/40',
              )}
            >
              {dayItems.length === 0 ? (
                <p className="text-[10px] text-muted-foreground/40 mt-2 text-center">
                  Keine Inhalte
                </p>
              ) : (
                <div className="space-y-1.5">
                  {dayItems.map((item) => {
                    const platform = PLATFORM_CONFIG[item.platform]
                    const status = STATUS_CONFIG[item.status]
                    return (
                      <button
                        key={item.id}
                        onClick={() => onOpenItem(item.id)}
                        className={cn(
                          'w-full rounded-lg border border-border bg-card p-1.5 text-left',
                          'hover:border-primary/30 hover:shadow-sm transition-all',
                        )}
                      >
                        <div className="flex items-center gap-1.5">
                          <span
                            className="h-2 w-2 shrink-0 rounded-full"
                            style={{ backgroundColor: platform.color }}
                          />
                          <span className="text-[11px] font-medium text-foreground truncate">
                            {truncateTitle(item.title, 20)}
                          </span>
                        </div>
                        <span
                          className="mt-1 inline-block rounded-full px-1.5 py-px text-[9px] font-medium"
                          style={{ background: status.bgColor, color: status.color }}
                        >
                          {status.label}
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* ── Scheduled items list ─────────────────────────────────── */}
      {scheduledItems.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-foreground">
            Geplante Inhalte
          </h3>
          <div className="space-y-1">
            {scheduledItems.map((item) => {
              const platform = PLATFORM_CONFIG[item.platform]
              const status = STATUS_CONFIG[item.status]
              return (
                <button
                  key={item.id}
                  onClick={() => onOpenItem(item.id)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-lg border border-border bg-card px-3 py-2',
                    'hover:border-primary/30 hover:shadow-sm transition-all text-left',
                  )}
                >
                  <span
                    className="inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-semibold"
                    style={{ background: platform.bgColor, color: platform.color }}
                  >
                    {platform.label}
                  </span>
                  <span className="flex-1 truncate text-sm font-medium text-foreground">
                    {item.title}
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {item.scheduledDate?.slice(0, 10)}
                  </span>
                  <span
                    className="shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium"
                    style={{ background: status.bgColor, color: status.color }}
                  >
                    {status.label}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
