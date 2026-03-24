import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { useFulfillmentStore } from '../store/fulfillment-store';
import type { TimelineEvent } from '../data/types';

function relativeTime(timestamp: string, t: (key: string, params?: Record<string, string | number>) => string): string {
  const now = new Date();
  const then = new Date(timestamp);
  const diffMs = now.getTime() - then.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHrs = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHrs / 24);

  if (diffMin < 1) return t('activity.justNow');
  if (diffMin < 60) return t('activity.minutesAgo', { n: diffMin });
  if (diffHrs < 24) return t('activity.hoursAgo', { n: diffHrs });
  return t('activity.daysAgo', { n: diffDays });
}

function eventDotColor(type: TimelineEvent['type']): string {
  switch (type) {
    case 'approval_resolved':
      return 'bg-success-500';
    case 'node_completed':
      return 'bg-blue-500';
    case 'approval_requested':
      return 'bg-warning-500';
    case 'alert':
      return 'bg-error-500';
    case 'status_change':
      return 'bg-brand-500';
    case 'manual_edit':
      return 'bg-blue-400';
    default:
      return 'bg-gray-400';
  }
}

export default function ActivityFeed() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const timeline = useFulfillmentStore((s) => s.timeline);
  const clients = useFulfillmentStore((s) => s.clients);

  const recentEvents = useMemo(() => {
    return [...timeline]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 8);
  }, [timeline]);

  const getClientName = (clientId: string): string => {
    return clients.find((c) => c.id === clientId)?.company || '';
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
      <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
        {t('activity.title')}
      </h3>
      <div className="space-y-4">
        {recentEvents.map((event) => {
          const clientName = getClientName(event.clientId);
          return (
            <div
              key={event.id}
              className="flex gap-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-white/[0.02] rounded-lg px-2 py-1.5 -mx-2 transition"
              onClick={() => navigate(`/kunden-hub/clients/${event.clientId}`)}
            >
              <div className="flex flex-col items-center pt-1">
                <div className={`h-2.5 w-2.5 rounded-full ${eventDotColor(event.type)}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  {relativeTime(event.timestamp, t)}
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-0.5 truncate">
                  {event.title}
                </p>
                {clientName && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                    {clientName}
                  </p>
                )}
              </div>
            </div>
          );
        })}
        {recentEvents.length === 0 && (
          <p className="text-sm text-gray-400 dark:text-gray-500">{t('activity.noEvents')}</p>
        )}
      </div>
    </div>
  );
}
