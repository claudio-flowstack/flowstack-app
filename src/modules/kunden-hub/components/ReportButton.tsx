import { useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { Modal } from '../ui/components/modal/index';
import Button from '../ui/components/button/Button';
import { useFulfillmentStore } from '../store/fulfillment-store';

interface ReportButtonProps {
  clientId: string;
}

const ReportButton: React.FC<ReportButtonProps> = ({ clientId }) => {
  const { t } = useLanguage();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const getClient = useFulfillmentStore((s) => s.getClient);
  const getClientDeliverables = useFulfillmentStore((s) => s.getClientDeliverables);
  const getClientTimeline = useFulfillmentStore((s) => s.getClientTimeline);

  const handleGenerate = () => {
    setIsGenerating(true);
    setIsDone(false);

    setTimeout(() => {
      setIsDone(true);
    }, 2000);
  };

  const handleDownload = () => {
    const client = getClient(clientId);
    const deliverables = getClientDeliverables(clientId);
    const timeline = getClientTimeline(clientId);

    if (!client) return;

    const approved = deliverables.filter((d) => d.status === 'approved' || d.status === 'live').length;
    const inReview = deliverables.filter((d) => d.status === 'in_review').length;
    const blocked = deliverables.filter((d) => d.status === 'blocked').length;
    const lastEvents = timeline.slice(0, 5);

    const now = new Date().toLocaleString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const formatStatus = (status: string): string => {
      const map: Record<string, string> = {
        qualifying: 'Qualifizierung',
        onboarding: 'Onboarding',
        strategy: 'Strategie',
        copy: 'Texte',
        funnel: 'Funnel',
        campaigns: 'Kampagnen',
        review: 'Review',
        live: 'Live',
        paused: 'Pausiert',
        churned: 'Beendet',
      };
      return map[status] || status;
    };

    const html = `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <title>${t('report.title')} - ${client.company}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 800px; margin: 0 auto; padding: 40px 20px; color: #1f2937; }
    h1 { font-size: 24px; margin-bottom: 4px; }
    h2 { font-size: 18px; margin-top: 32px; color: #374151; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px; }
    .meta { color: #6b7280; font-size: 14px; margin-bottom: 24px; }
    .status-badge { display: inline-block; padding: 2px 12px; border-radius: 12px; font-size: 13px; font-weight: 500; background: #eff6ff; color: #2563eb; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; }
    th, td { text-align: left; padding: 8px 12px; border-bottom: 1px solid #e5e7eb; font-size: 14px; }
    th { font-weight: 600; color: #374151; background: #f9fafb; }
    .kpi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-top: 12px; }
    .kpi-card { background: #f9fafb; border-radius: 8px; padding: 16px; }
    .kpi-label { font-size: 12px; color: #6b7280; margin-bottom: 4px; }
    .kpi-value { font-size: 20px; font-weight: 600; color: #111827; }
    .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af; }
    .timeline-item { padding: 8px 0; border-bottom: 1px solid #f3f4f6; font-size: 14px; }
    .timeline-date { color: #6b7280; font-size: 12px; }
  </style>
</head>
<body>
  <h1>${client.company}</h1>
  <p class="meta">
    ${t('report.contact')}: ${client.name} | ${client.email}<br>
    Status: <span class="status-badge">${formatStatus(client.status)}</span>
  </p>

  ${client.kpis ? `
  <h2>${t('report.kpis')}</h2>
  <div class="kpi-grid">
    <div class="kpi-card">
      <div class="kpi-label">Spend</div>
      <div class="kpi-value">${client.kpis.spend.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Leads</div>
      <div class="kpi-value">${client.kpis.leads}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">CPL</div>
      <div class="kpi-value">${client.kpis.cpl.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Impressionen</div>
      <div class="kpi-value">${client.kpis.impressions.toLocaleString('de-DE')}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Klicks</div>
      <div class="kpi-value">${client.kpis.clicks.toLocaleString('de-DE')}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">CTR</div>
      <div class="kpi-value">${client.kpis.ctr.toFixed(2)}%</div>
    </div>
  </div>
  ` : ''}

  <h2>${t('report.deliverables')}</h2>
  <table>
    <tr>
      <th>${t('report.metric')}</th>
      <th>${t('report.count')}</th>
    </tr>
    <tr><td>${t('report.approved')}</td><td>${approved}</td></tr>
    <tr><td>${t('report.inReview')}</td><td>${inReview}</td></tr>
    <tr><td>${t('report.blocked')}</td><td>${blocked}</td></tr>
    <tr><td>${t('report.total')}</td><td>${deliverables.length}</td></tr>
  </table>

  <h2>${t('report.timeline')}</h2>
  ${lastEvents.length > 0 ? lastEvents.map((e) => `
  <div class="timeline-item">
    <span class="timeline-date">${new Date(e.timestamp).toLocaleDateString('de-DE')}</span> -
    ${e.title}
    ${e.description ? `<br><small style="color:#6b7280">${e.description}</small>` : ''}
  </div>
  `).join('') : `<p style="color:#6b7280">${t('report.noEvents')}</p>`}

  <div class="footer">
    ${t('report.generatedAt')} ${now} | Kunden Hub
  </div>
</body>
</html>`;

    const newWindow = window.open('', '_blank');
    if (newWindow) {
      newWindow.document.write(html);
      newWindow.document.close();
    }

    setIsGenerating(false);
    setIsDone(false);
  };

  const handleClose = () => {
    setIsGenerating(false);
    setIsDone(false);
  };

  return (
    <>
      <button
        title={t('report.create')}
        onClick={handleGenerate}
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200 transition"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
      </button>

      <Modal isOpen={isGenerating} onClose={handleClose} className="max-w-sm p-6 sm:p-8">
        {!isDone ? (
          <div className="flex flex-col items-center py-4">
            <div className="mb-4 h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-brand-500" />
            <p className="text-sm font-medium text-gray-800 dark:text-white/90">
              {t('report.generating')}
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center py-4">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-success-50 dark:bg-success-500/15">
              <svg className="h-6 w-6 text-success-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-800 dark:text-white/90 mb-4">
              {t('report.ready')}
            </p>
            <Button size="sm" variant="primary" onClick={handleDownload}>
              {t('report.download')}
            </Button>
          </div>
        )}
      </Modal>
    </>
  );
};

export default ReportButton;
