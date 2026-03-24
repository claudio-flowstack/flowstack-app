import { useMemo } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { useFulfillmentStore } from '../store/fulfillment-store';

interface RevenueEntry {
  clientId: string;
  company: string;
  mrr: number;
  status: string;
}

const MOCK_RETAINERS: Record<string, number> = {
  'client-001': 3500,
  'client-002': 3000,
  'client-003': 2000,
};

export default function RevenueTracker() {
  const { t } = useLanguage();
  const clients = useFulfillmentStore((s) => s.clients);

  const { entries, totalMrr, yearTotal, openInvoices } = useMemo(() => {
    const entries: RevenueEntry[] = clients.map((c) => ({
      clientId: c.id,
      company: c.company,
      mrr: MOCK_RETAINERS[c.id] || 1500,
      status: c.status,
    }));

    const activeMrr = entries
      .filter((e) => e.status !== 'churned')
      .reduce((sum, e) => sum + e.mrr, 0);

    const monthsRemaining = 12 - new Date().getMonth();
    const yearTotal = activeMrr * monthsRemaining;

    const openInvoices = entries
      .filter((e) => e.status !== 'live' && e.status !== 'churned')
      .reduce((sum, e) => sum + e.mrr, 0);

    return { entries, totalMrr: activeMrr, yearTotal, openInvoices };
  }, [clients]);

  const statusLabel = (status: string) => {
    if (status === 'live') return t('status.live');
    if (status === 'paused') return t('status.paused');
    if (status === 'churned') return t('status.churned');
    return 'Setup';
  };

  const statusColor = (status: string) => {
    if (status === 'live') return 'text-success-500';
    if (status === 'paused') return 'text-gray-400';
    if (status === 'churned') return 'text-gray-400 line-through';
    return 'text-brand-500';
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
      <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
        {t('revenue.title')}
      </h3>

      {/* MRR Highlight */}
      <div className="mb-4 rounded-xl bg-brand-50 px-4 py-3 dark:bg-brand-500/10">
        <p className="text-xs font-medium text-brand-600 dark:text-brand-400 uppercase tracking-wide">
          MRR
        </p>
        <p className="text-2xl font-bold text-brand-600 dark:text-brand-400">
          {'\u20AC'}{totalMrr.toLocaleString('de-DE')}
        </p>
      </div>

      {/* Client revenue rows */}
      <div className="space-y-2 mb-4">
        {entries.map((entry) => (
          <div
            key={entry.clientId}
            className="flex items-center justify-between text-sm"
          >
            <span className="text-gray-700 dark:text-gray-300 truncate flex-1">
              {entry.company}
            </span>
            <span className="text-gray-700 dark:text-gray-300 font-medium mx-3">
              {'\u20AC'}{entry.mrr.toLocaleString('de-DE')}/{t('revenue.month')}
            </span>
            <span className={`text-xs font-medium ${statusColor(entry.status)}`}>
              {statusLabel(entry.status)}
            </span>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="border-t border-gray-100 pt-3 dark:border-gray-800 space-y-1.5">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500 dark:text-gray-400">{t('revenue.yearTotal')}</span>
          <span className="font-semibold text-gray-800 dark:text-white/90">
            {'\u20AC'}{yearTotal.toLocaleString('de-DE')}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500 dark:text-gray-400">{t('revenue.openInvoices')}</span>
          <span className="font-semibold text-warning-500">
            {'\u20AC'}{openInvoices.toLocaleString('de-DE')}
          </span>
        </div>
      </div>
    </div>
  );
}
