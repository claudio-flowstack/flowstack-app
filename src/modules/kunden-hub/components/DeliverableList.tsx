import { useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useLanguage } from '../i18n/LanguageContext';
import type { PhaseGroup } from '../data/types';
import { PHASE_CONFIG } from '../data/constants';
import { useFulfillmentStore } from '../store/fulfillment-store';
import DeliverableRow from './DeliverableRow';
import Button from '../ui/components/button/Button';
import { Modal } from '../ui/components/modal/index';

interface DeliverableListProps {
  clientId: string;
  onSelectDeliverable: (id: string) => void;
}

const PhaseIcon: React.FC<{ name: string }> = ({ name }) => {
  const icons: Record<string, React.ReactNode> = {
    Brain: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    FileText: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    Globe: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <circle cx="12" cy="12" r="10" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
      </svg>
    ),
    Megaphone: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
      </svg>
    ),
  };
  return <>{icons[name] || null}</>;
};

const DeliverableList: React.FC<DeliverableListProps> = ({ clientId, onSelectDeliverable }) => {
  const { t } = useLanguage();
  const deliverables = useFulfillmentStore(useShallow((s) => s.deliverables.filter((d) => d.clientId === clientId)));
  const approveAllDrafts = useFulfillmentStore((s) => s.approveAllDrafts);
  const [confirmPhase, setConfirmPhase] = useState<{ phase: PhaseGroup; count: number } | null>(null);

  const phases: PhaseGroup[] = ['strategy', 'copy', 'funnel', 'campaigns'];

  const handleApprovePhase = (phase: PhaseGroup) => {
    const phaseDeliverables = deliverables.filter(
      (d) => d.phase === phase && (d.status === 'draft' || d.status === 'in_review')
    );
    if (phaseDeliverables.length === 0) return;
    setConfirmPhase({ phase, count: phaseDeliverables.length });
  };

  const executeApprovePhase = () => {
    if (confirmPhase) {
      approveAllDrafts(clientId, confirmPhase.phase);
    }
    setConfirmPhase(null);
  };

  return (
    <>
    <div className="space-y-6">
      {phases.map((phase) => {
        const cfg = PHASE_CONFIG[phase];
        const phaseDeliverables = deliverables.filter((d) => d.phase === phase);
        const hasApprovable = phaseDeliverables.some(
          (d) => d.status === 'draft' || d.status === 'in_review'
        );

        if (phaseDeliverables.length === 0) return null;

        return (
          <div key={phase}>
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-gray-500 dark:text-gray-400">
                  <PhaseIcon name={cfg.icon} />
                </span>
                <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">
                  {t(`phase.${phase}`)}
                </h3>
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  ({phaseDeliverables.length})
                </span>
              </div>
              {hasApprovable && (
                <Button size="sm" variant="outline" onClick={() => handleApprovePhase(phase)}>
                  {t('action.approveAll')} {t(`phase.${phase}`)}
                </Button>
              )}
            </div>
            <div className="space-y-2">
              {phaseDeliverables.map((d) => (
                <DeliverableRow
                  key={d.id}
                  deliverable={d}
                  onSelect={onSelectDeliverable}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>

    {/* Confirm approve phase */}
    <Modal isOpen={!!confirmPhase} onClose={() => setConfirmPhase(null)} className="max-w-md p-6 sm:p-8">
      <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-2">
        {t('dialog.confirmApprove')}
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        {confirmPhase && t('dialog.confirmApproveAll', { count: confirmPhase.count })}
      </p>
      <div className="flex justify-end gap-3">
        <Button size="sm" variant="outline" onClick={() => setConfirmPhase(null)}>
          {t('action.cancel')}
        </Button>
        <Button
          size="sm"
          variant="primary"
          className="!bg-success-500 hover:!bg-success-600 text-white"
          onClick={executeApprovePhase}
        >
          {t('dialog.yesApprove')}
        </Button>
      </div>
    </Modal>
    </>
  );
};

export default DeliverableList;
