import { useMemo } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { useFulfillmentStore } from '../store/fulfillment-store';

const MAX_CAPACITY = 5;

export default function TeamCapacity() {
  const { t } = useLanguage();
  const clients = useFulfillmentStore((s) => s.clients);
  const deliverables = useFulfillmentStore((s) => s.deliverables);

  const teamData = useMemo(() => {
    const managers: Record<string, { clients: number; openTasks: number }> = {};

    clients.forEach((c) => {
      if (c.status === 'paused' || c.status === 'churned') return;
      const mgr = c.accountManager || 'Unbekannt';
      if (!managers[mgr]) {
        managers[mgr] = { clients: 0, openTasks: 0 };
      }
      managers[mgr].clients += 1;

      const clientDeliverables = deliverables.filter(
        (d) => d.clientId === c.id && d.status !== 'approved' && d.status !== 'live' && d.status !== 'blocked'
      );
      managers[mgr].openTasks += clientDeliverables.length;
    });

    return Object.entries(managers).map(([name, data]) => ({
      name,
      clients: data.clients,
      openTasks: data.openTasks,
      percentage: Math.min(Math.round((data.clients / MAX_CAPACITY) * 100), 100),
    }));
  }, [clients, deliverables]);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
      <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
        {t('team.title')}
      </h3>
      <div className="space-y-4">
        {teamData.map((member) => (
          <div key={member.name}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm font-medium text-gray-800 dark:text-white/90">
                {member.name}
              </span>
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                {member.percentage}%
              </span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-gray-100 dark:bg-gray-800 mb-1">
              <div
                className={`h-2.5 rounded-full transition-all ${
                  member.percentage >= 80
                    ? 'bg-error-500'
                    : member.percentage >= 50
                    ? 'bg-warning-500'
                    : 'bg-success-500'
                }`}
                style={{ width: `${member.percentage}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {member.clients} {t('team.clients')} · {member.openTasks} {t('team.openTasks')}
            </p>
          </div>
        ))}
        {teamData.length === 0 && (
          <p className="text-sm text-gray-400 dark:text-gray-500">{t('team.noData')}</p>
        )}
      </div>
    </div>
  );
}
