import { useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import type { DeliverableStatus } from '../data/types';
import StatusBadge from './StatusBadge';
import TextArea from '../ui/form/input/TextArea';
import Button from '../ui/components/button/Button';
import { Modal } from '../ui/components/modal/index';

interface ApprovalBarProps {
  status: DeliverableStatus;
  onApprove: () => void;
  onRequestChanges: (comment: string) => void;
  onBulkApprove?: () => void;
  bulkCount?: number;
  version?: number;
}

const ApprovalBar: React.FC<ApprovalBarProps> = ({
  status,
  onApprove,
  onRequestChanges,
  onBulkApprove,
  bulkCount,
  version,
}) => {
  const { t } = useLanguage();
  const [showComment, setShowComment] = useState(false);
  const [comment, setComment] = useState('');
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [changesModalOpen, setChangesModalOpen] = useState(false);

  if (!status) return null;

  const handleApproveClick = () => {
    setApproveModalOpen(true);
  };

  const executeApprove = () => {
    onApprove();
    setApproveModalOpen(false);
  };

  const handleRequestChangesClick = () => {
    if (!showComment) {
      setShowComment(true);
      return;
    }
    if (comment.length < 10) return;
    setChangesModalOpen(true);
  };

  const executeRequestChanges = () => {
    onRequestChanges(comment);
    setComment('');
    setShowComment(false);
    setChangesModalOpen(false);
  };

  const handleBulkApprove = () => {
    if (onBulkApprove) {
      onBulkApprove();
    }
  };

  return (
    <>
    <div className="sticky bottom-0 z-30 rounded-2xl border-t border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900 shadow-theme-lg">
      {/* Comment area (expandable) */}
      {showComment && (
        <div className="mb-3">
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('approval.comment')}
          </label>
          <TextArea
            value={comment}
            onChange={(val) => setComment(val)}
            placeholder={t('approval.commentPlaceholder')}
            rows={3}
            error={comment.length > 0 && comment.length < 10}
            hint={comment.length > 0 && comment.length < 10 ? `${comment.length}/10` : ''}
          />
        </div>
      )}

      {/* Main bar row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left: Status badge + version */}
        <div className="flex items-center gap-3">
          <StatusBadge deliverableStatus={status} />
          {version !== null && version !== undefined && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {t('approval.version', { v: version })}
            </span>
          )}
        </div>

        {/* Right: Action buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Bulk approve */}
          {onBulkApprove && bulkCount !== null && bulkCount !== undefined && bulkCount > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleBulkApprove}
            >
              {t('approval.bulkApprove', { count: bulkCount })}
            </Button>
          )}

          {/* Request changes */}
          <Button
            size="sm"
            variant="primary"
            onClick={handleRequestChangesClick}
            disabled={showComment && comment.length < 10}
            className="!bg-error-500 hover:!bg-error-600 text-white"
          >
            {t('approval.requestChanges')}
          </Button>

          {/* Approve */}
          <Button
            size="sm"
            variant="primary"
            onClick={handleApproveClick}
            className="!bg-success-500 hover:!bg-success-600 text-white"
          >
            {t('approval.approve')}
          </Button>
        </div>
      </div>
    </div>

    {/* Approve confirmation modal */}
    <Modal isOpen={approveModalOpen} onClose={() => setApproveModalOpen(false)} className="max-w-md p-6 sm:p-8">
      <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-2">
        {t('dialog.confirmApprove')}
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        {t('approval.confirmApprove')}
      </p>
      <div className="flex justify-end gap-3">
        <Button size="sm" variant="outline" onClick={() => setApproveModalOpen(false)}>
          {t('action.cancel')}
        </Button>
        <Button
          size="sm"
          variant="primary"
          className="!bg-success-500 hover:!bg-success-600 text-white"
          onClick={executeApprove}
        >
          {t('dialog.yesApprove')}
        </Button>
      </div>
    </Modal>

    {/* Request changes confirmation modal */}
    <Modal isOpen={changesModalOpen} onClose={() => setChangesModalOpen(false)} className="max-w-md p-6 sm:p-8">
      <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-2">
        {t('approval.confirmChanges')}
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        {t('approval.confirmChangesDesc')}
      </p>
      <div className="flex justify-end gap-3">
        <Button size="sm" variant="outline" onClick={() => setChangesModalOpen(false)}>
          {t('action.cancel')}
        </Button>
        <Button
          size="sm"
          variant="primary"
          className="!bg-error-500 hover:!bg-error-600 text-white"
          onClick={executeRequestChanges}
        >
          {t('approval.requestChanges')}
        </Button>
      </div>
    </Modal>
    </>
  );
};

export default ApprovalBar;
