import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { useFulfillmentStore } from '../store/fulfillment-store';
import { PIPELINE_STEPS } from '../data/constants';
import type { Client } from '../data/types';

export default function PipelineKanban() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const clients = useFulfillmentStore((s) => s.clients);

  const columns = useMemo(() => {
    return PIPELINE_STEPS.map((step) => {
      const clientsInPhase = clients.filter((c) => c.status === step.key);
      return {
        key: step.key,
        clients: clientsInPhase,
      };
    });
  }, [clients]);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
      <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
        {t('kanban.title')}
      </h3>
      <div className="flex gap-2 overflow-x-auto pb-2">
        {columns.map((col) => (
          <div
            key={col.key}
            className="flex-1 min-w-[110px]"
          >
            <div className="text-center mb-2">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 truncate">
                {t(`status.${col.key}`)}
              </p>
              <span className={`inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-xs font-semibold ${
                col.clients.length > 0
                  ? 'bg-brand-100 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400'
                  : 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500'
              }`}>
                {col.clients.length}
              </span>
            </div>
            <div className="space-y-1.5 min-h-[60px] rounded-lg bg-gray-50 p-1.5 dark:bg-white/[0.02]">
              {col.clients.map((client: Client) => (
                <button
                  key={client.id}
                  onClick={() => navigate(`/kunden-hub/clients/${client.id}`)}
                  className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-left text-xs font-medium text-gray-700 hover:border-brand-300 hover:shadow-sm transition dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:border-brand-500"
                >
                  {client.company.length > 18 ? client.company.slice(0, 16) + '...' : client.company}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
