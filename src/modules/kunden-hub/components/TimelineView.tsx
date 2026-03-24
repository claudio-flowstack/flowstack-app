import { useState, useMemo } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { useFulfillmentStore } from '../store/fulfillment-store';
import type { TimelineEvent } from '../data/types';
import { Settings, Sparkles, User } from 'lucide-react';

interface TimelineViewProps {
  clientId: string;
}

type FilterType = 'all' | 'approvals' | 'alerts' | 'system';

function getActorColor(actor: string): { dot: string; line: string; icon: string; badge: string } {
  if (actor === 'system') {
    return {
      dot: 'bg-brand-500',
      line: 'bg-brand-200 dark:bg-brand-800',
      icon: 'text-brand-500',
      badge: 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400',
    };
  }
  if (actor === 'ai') {
    return {
      dot: 'bg-purple-500',
      line: 'bg-purple-200 dark:bg-purple-800',
      icon: 'text-purple-500',
      badge: 'bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400',
    };
  }
  // Human user
  return {
    dot: 'bg-success-500',
    line: 'bg-success-200 dark:bg-success-800',
    icon: 'text-success-500',
    badge: 'bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-400',
  };
}

function ActorIcon({ actor }: { actor: string }) {
  if (actor === 'system') {
    return <Settings className="h-3.5 w-3.5" />;
  }
  if (actor === 'ai') {
    return <Sparkles className="h-3.5 w-3.5" />;
  }
  return <User className="h-3.5 w-3.5" />;
}

function matchesFilter(event: TimelineEvent, filter: FilterType): boolean {
  if (filter === 'all') return true;
  if (filter === 'approvals') return event.type === 'approval_requested' || event.type === 'approval_resolved';
  if (filter === 'alerts') return event.type === 'alert';
  if (filter === 'system') return event.type === 'status_change' || event.type === 'node_completed' || event.type === 'manual_edit';
  return true;
}

const TimelineView: React.FC<TimelineViewProps> = ({ clientId }) => {
  const { t } = useLanguage();
  const allTimeline = useFulfillmentStore((s) => s.timeline);
  const timeline = useMemo(
    () => allTimeline
      .filter((ev) => ev.clientId === clientId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
    [allTimeline, clientId]
  );
  const [filter, setFilter] = useState<FilterType>('all');

  const filters: { key: FilterType; labelKey: string }[] = [
    { key: 'all', labelKey: 'timeline.all' },
    { key: 'approvals', labelKey: 'timeline.approvals' },
    { key: 'alerts', labelKey: 'timeline.alerts' },
    { key: 'system', labelKey: 'timeline.system' },
  ];

  const filtered = timeline.filter((e) => matchesFilter(e, filter));

  return (
    <div>
      {/* Filter buttons */}
      <div className="mb-4 flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              filter === f.key
                ? 'bg-brand-500 text-white'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 bg-gray-100 dark:bg-gray-800'
            }`}
          >
            {t(f.labelKey)}
          </button>
        ))}
      </div>

      {/* Timeline list */}
      <div className="relative">
        {filtered.length === 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400 py-8 text-center">
            {t('timeline.all')} - 0
          </p>
        )}
        {filtered.map((event, idx) => {
          const actorColors = getActorColor(event.actor);
          return (
            <div key={event.id} className="flex gap-4 pb-6 last:pb-0">
              {/* Dot + Line */}
              <div className="flex flex-col items-center">
                <div className={`flex h-7 w-7 items-center justify-center rounded-full shrink-0 mt-0.5 ${actorColors.dot}`}>
                  <span className="text-white">
                    <ActorIcon actor={event.actor} />
                  </span>
                </div>
                {idx < filtered.length - 1 && (
                  <div className={`w-px flex-1 mt-1 ${actorColors.line}`} />
                )}
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                    {event.title}
                  </p>
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${actorColors.badge}`}>
                    {event.actor === 'system' ? 'System' : event.actor === 'ai' ? 'AI' : event.actor}
                  </span>
                </div>
                {event.description && (
                  <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                    {event.description}
                  </p>
                )}
                <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                  {new Date(event.timestamp).toLocaleDateString('de-DE', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TimelineView;
