import { useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { Modal } from '../ui/components/modal/index';
import TextArea from '../ui/form/input/TextArea';
import Button from '../ui/components/button/Button';
import { useFulfillmentStore } from '../store/fulfillment-store';
import { useNotification } from '../contexts/NotificationContext';

interface ApprovalDialogProps {
  open: boolean;
  onClose: () => void;
  deliverableId: string;
  deliverableTitle: string;
}

const ApprovalDialog: React.FC<ApprovalDialogProps> = ({
  open,
  onClose,
  deliverableId,
  deliverableTitle,
}) => {
  const { t } = useLanguage();
  const { notify } = useNotification();
  const [comment, setComment] = useState('');
  const [confirmingReject, setConfirmingReject] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const rejectDeliverable = useFulfillmentStore((s) => s.rejectDeliverable);
  const requestChanges = useFulfillmentStore((s) => s.requestChanges);

  const isValid = comment.length >= 10;

  const handleReject = async () => {
    if (!isValid) return;
    if (!confirmingReject) {
      setConfirmingReject(true);
      return;
    }
    setIsSubmitting(true);
    try {
      await rejectDeliverable(deliverableId, comment);
      notify({
        id: `reject-${Date.now()}`,
        type: 'info',
        title: t('toast.rejected'),
        message: deliverableTitle,
      });
      setComment('');
      setConfirmingReject(false);
      onClose();
    } catch (err) {
      console.error('[ApprovalDialog] Reject fehlgeschlagen:', err);
      notify({
        id: `reject-err-${Date.now()}`,
        type: 'error',
        title: t('toast.actionFailed'),
        message: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestChanges = async () => {
    if (!isValid) return;
    setIsSubmitting(true);
    try {
      requestChanges(deliverableId, comment);
      notify({
        id: `changes-${Date.now()}`,
        type: 'info',
        title: t('toast.changesRequested'),
        message: deliverableTitle,
      });
      setComment('');
      setConfirmingReject(false);
      onClose();
    } catch (err) {
      console.error('[ApprovalDialog] RequestChanges fehlgeschlagen:', err);
      notify({
        id: `changes-err-${Date.now()}`,
        type: 'error',
        title: t('toast.actionFailed'),
        message: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setConfirmingReject(false);
    onClose();
  };

  return (
    <Modal isOpen={open} onClose={handleClose} className="max-w-lg p-6 sm:p-8">
      <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-1">
        {t('dialog.rejectTitle')}
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        {deliverableTitle}
      </p>

      <div className="mb-4">
        <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
          {t('dialog.commentRequired')}
        </label>
        <TextArea
          value={comment}
          onChange={(val) => { setComment(val); setConfirmingReject(false); }}
          placeholder={t('dialog.commentRequired')}
          rows={4}
          error={comment.length > 0 && comment.length < 10}
          hint={comment.length > 0 && comment.length < 10 ? `${comment.length}/10` : ''}
        />
      </div>

      {confirmingReject && (
        <div className="mb-4 rounded-lg border border-error-200 bg-error-50 p-3 dark:border-error-800 dark:bg-error-900/20">
          <p className="text-sm font-medium text-error-600 dark:text-error-400">
            {t('dialog.confirmReject')}
          </p>
        </div>
      )}

      <div className="flex justify-end gap-3">
        <Button size="sm" variant="outline" onClick={handleClose}>
          {t('action.cancel')}
        </Button>
        <Button
          size="sm"
          variant={confirmingReject ? 'primary' : 'outline'}
          onClick={handleReject}
          disabled={!isValid || isSubmitting}
          className={confirmingReject ? '!bg-error-500 hover:!bg-error-600 text-white' : '!text-error-500 !ring-error-300 hover:!bg-error-50 dark:hover:!bg-error-500/10'}
        >
          {isSubmitting && confirmingReject ? (
            <span className="flex items-center gap-1.5">
              <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              {t('dialog.yesReject')}
            </span>
          ) : (
            confirmingReject ? t('dialog.yesReject') : t('action.reject')
          )}
        </Button>
        <Button
          size="sm"
          variant="primary"
          onClick={handleRequestChanges}
          disabled={!isValid || isSubmitting}
        >
          {t('action.requestChanges')}
        </Button>
      </div>
    </Modal>
  );
};

export default ApprovalDialog;
