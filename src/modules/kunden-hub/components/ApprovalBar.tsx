import { useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import type { DeliverableStatus } from '../data/types';
import StatusBadge from './StatusBadge';
import TextArea from '../ui/form/input/TextArea';
import Button from '../ui/components/button/Button';

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
  const [confirmApprove, setConfirmApprove] = useState(false);
  const [confirmChanges, setConfirmChanges] = useState(false);

  if (!status) return null;

  const handleApproveClick = () => {
    if (!confirmApprove) {
      setConfirmApprove(true);
      setConfirmChanges(false);
      return;
    }
    onApprove();
    setConfirmApprove(false);
  };

  const handleRequestChangesClick = () => {
    if (!showComment) {
      setShowComment(true);
      setConfirmApprove(false);
      setConfirmChanges(false);
      return;
    }
    if (comment.length < 10) return;
    if (!confirmChanges) {
      setConfirmChanges(true);
      setConfirmApprove(false);
      return;
    }
    onRequestChanges(comment);
    setComment('');
    setShowComment(false);
    setConfirmChanges(false);
  };

  const handleBulkApprove = () => {
    if (onBulkApprove) {
      onBulkApprove();
    }
  };

  return (
    <div className="sticky bottom-0 z-30 rounded-2xl border-t border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900 shadow-theme-lg">
      {/* Comment area (expandable) */}
      {showComment && (
        <div className="mb-3">
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('approval.comment')}
          </label>
          <TextArea
            value={comment}
            onChange={(val) => { setComment(val); setConfirmChanges(false); }}
            placeholder={t('approval.commentPlaceholder')}
            rows={3}
            error={comment.length > 0 && comment.length < 10}
            hint={comment.length > 0 && comment.length < 10 ? `${comment.length}/10` : ''}
          />
        </div>
      )}

      {/* Confirm banners */}
      {confirmApprove && (
        <div className="mb-3 rounded-lg border border-success-200 bg-success-50 p-3 dark:border-success-800 dark:bg-success-900/20">
          <p className="text-sm font-medium text-success-600 dark:text-success-400">
            {t('approval.confirmApprove')}
          </p>
        </div>
      )}
      {confirmChanges && (
        <div className="mb-3 rounded-lg border border-error-200 bg-error-50 p-3 dark:border-error-800 dark:bg-error-900/20">
          <p className="text-sm font-medium text-error-600 dark:text-error-400">
            {t('approval.confirmChanges')}
          </p>
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
            {confirmChanges ? t('approval.confirmChanges') : t('approval.requestChanges')}
          </Button>

          {/* Approve */}
          <Button
            size="sm"
            variant="primary"
            onClick={handleApproveClick}
            className="!bg-success-500 hover:!bg-success-600 text-white"
          >
            {confirmApprove ? t('approval.confirmApprove') : t('approval.approve')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ApprovalBar;
