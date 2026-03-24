import { useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useLanguage } from '../i18n/LanguageContext';
import type { PhaseGroup } from '../data/types';
import { PHASE_CONFIG } from '../data/constants';
import { useFulfillmentStore } from '../store/fulfillment-store';
import Button from '../ui/components/button/Button';
import { Modal } from '../ui/components/modal/index';

interface BatchActionsProps {
  clientId: string;
}

const BatchActions: React.FC<BatchActionsProps> = ({ clientId }) => {
  const { t } = useLanguage();
  const deliverables = useFulfillmentStore(useShallow((s) => s.deliverables.filter((d) => d.clientId === clientId)));
  const approveAllDrafts = useFulfillmentStore((s) => s.approveAllDrafts);
  const resetPhase = useFulfillmentStore((s) => s.resetPhase);
  const [showResetDropdown, setShowResetDropdown] = useState(false);
  const [confirmApproveAll, setConfirmApproveAll] = useState(false);
  const [confirmResetPhase, setConfirmResetPhase] = useState<PhaseGroup | null>(null);

  const openCount = deliverables.filter((d) => d.status === 'draft' || d.status === 'in_review').length;
  const readyCount = deliverables.filter((d) => d.status === 'approved').length;
  const blockedCount = deliverables.filter((d) => d.status === 'blocked').length;

  const handleApproveAll = () => {
    if (openCount === 0) return;
    setConfirmApproveAll(true);
  };

  const executeApproveAll = () => {
    const phases: PhaseGroup[] = ['strategy', 'copy', 'funnel', 'campaigns'];
    phases.forEach((phase) => approveAllDrafts(clientId, phase));
    setConfirmApproveAll(false);
  };

  const handleResetPhase = (phase: PhaseGroup) => {
    setShowResetDropdown(false);
    setConfirmResetPhase(phase);
  };

  const executeResetPhase = () => {
    if (confirmResetPhase) {
      resetPhase(clientId, confirmResetPhase);
    }
    setConfirmResetPhase(null);
  };

  return (
    <>
      <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-4 text-sm">
            <span className="text-warning-500 font-medium">{openCount} {t('misc.open')}</span>
            <span className="text-success-500 font-medium">{readyCount} {t('misc.ready')}</span>
            <span className="text-gray-500 font-medium">{blockedCount} {t('misc.blocked')}</span>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <Button size="sm" variant="primary" onClick={handleApproveAll} disabled={openCount === 0}>
              {t('action.approveAllDrafts')}
            </Button>

            <div className="relative">
              <Button size="sm" variant="outline" onClick={() => setShowResetDropdown(!showResetDropdown)}>
                {t('action.resetPhase')}
                <svg className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </Button>
              {showResetDropdown && (
                <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
                  {(['strategy', 'copy', 'funnel', 'campaigns'] as PhaseGroup[]).map((phase) => (
                    <button
                      key={phase}
                      onClick={() => handleResetPhase(phase)}
                      className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700 first:rounded-t-lg last:rounded-b-lg"
                    >
                      {PHASE_CONFIG[phase].label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Confirm approve all */}
      <Modal isOpen={confirmApproveAll} onClose={() => setConfirmApproveAll(false)} className="max-w-md p-6 sm:p-8">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-2">
          {t('dialog.confirmApprove')}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          {t('dialog.confirmApproveAll', { count: openCount })}
        </p>
        <div className="flex justify-end gap-3">
          <Button size="sm" variant="outline" onClick={() => setConfirmApproveAll(false)}>
            {t('action.cancel')}
          </Button>
          <Button
            size="sm"
            variant="primary"
            className="!bg-success-500 hover:!bg-success-600 text-white"
            onClick={executeApproveAll}
          >
            {t('dialog.yesApprove')}
          </Button>
        </div>
      </Modal>

      {/* Confirm reset phase */}
      <Modal isOpen={!!confirmResetPhase} onClose={() => setConfirmResetPhase(null)} className="max-w-md p-6 sm:p-8">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-2">
          {t('dialog.confirmTitle')}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          {confirmResetPhase && t('misc.confirmResetPhase', { phase: t(`phase.${confirmResetPhase}`) })}
        </p>
        <div className="flex justify-end gap-3">
          <Button size="sm" variant="outline" onClick={() => setConfirmResetPhase(null)}>
            {t('action.cancel')}
          </Button>
          <Button
            size="sm"
            variant="primary"
            className="!bg-error-500 hover:!bg-error-600 text-white"
            onClick={executeResetPhase}
          >
            {t('action.resetPhase')}
          </Button>
        </div>
      </Modal>
    </>
  );
};

export default BatchActions;
