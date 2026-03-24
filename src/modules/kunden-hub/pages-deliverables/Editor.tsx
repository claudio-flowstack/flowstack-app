import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageMeta from '../ui/common/PageMeta';
import PageBreadcrumb from '../ui/common/PageBreadCrumb';
import { useLanguage } from '../i18n/LanguageContext';
import { useFulfillmentStore } from '../store/fulfillment-store';
import { useNotification } from '../contexts/NotificationContext';
import StatusBadge from '../components/StatusBadge';
import AdPreview from '../components/AdPreview';
import DocPreview from '../components/DocPreview';
import ApprovalDialog from '../components/ApprovalDialog';
import VersionHistory from '../components/VersionHistory';
import CommentThread from '../components/CommentThread';
import TextArea from '../ui/form/input/TextArea';
import Button from '../ui/components/button/Button';
import { Modal } from '../ui/components/modal/index';

type EditorTab = 'edit' | 'preview';

export default function Editor() {
  const { t } = useLanguage();
  const { clientId, delivId } = useParams<{ clientId: string; delivId: string }>();
  const navigate = useNavigate();
  const { notify } = useNotification();

  const loadClients = useFulfillmentStore((s) => s.loadClients);
  const deliverables = useFulfillmentStore((s) => s.deliverables);
  const updateDeliverableContent = useFulfillmentStore((s) => s.updateDeliverableContent);
  const submitForReview = useFulfillmentStore((s) => s.submitForReview);
  const approveDeliverable = useFulfillmentStore((s) => s.approveDeliverable);
  const regenerateDeliverable = useFulfillmentStore((s) => s.regenerateDeliverable);
  const fetchDeliverableContent = useFulfillmentStore((s) => s.fetchDeliverableContent);

  const [activeTab, setActiveTab] = useState<EditorTab>('edit');
  const [editContent, setEditContent] = useState('');
  const [originalContent, setOriginalContent] = useState('');
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [regenerateConfirmOpen, setRegenerateConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ type: 'approve' | 'submit'; id: string; title: string } | null>(null);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [commentsOpen, setCommentsOpen] = useState(true);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  const deliverable = deliverables.find((d) => d.id === delivId);

  // Load content from API when editor opens
  useEffect(() => {
    if (!delivId || !deliverable) return;

    let cancelled = false;
    setIsLoadingContent(true);

    fetchDeliverableContent(delivId).then((apiContent) => {
      if (cancelled) return;
      const content = apiContent ?? deliverable.content;
      setEditContent(content);
      setOriginalContent(content);
      setIsLoadingContent(false);
    }).catch(() => {
      if (cancelled) return;
      // Fallback to store content
      setEditContent(deliverable.content);
      setOriginalContent(deliverable.content);
      setIsLoadingContent(false);
    });

    return () => { cancelled = true; };
  }, [delivId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Warn user about unsaved changes when leaving
  const hasChanged = useMemo(() => editContent !== originalContent, [editContent, originalContent]);

  useEffect(() => {
    if (!hasChanged) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      return '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [hasChanged]);

  const handleRegenerate = useCallback(async () => {
    if (!delivId) return;
    const feedback = feedbackText.trim() || undefined;
    setRegenerateConfirmOpen(false);
    setFeedbackText('');
    setIsRegenerating(true);

    try {
      const newContent = await regenerateDeliverable(delivId, feedback);
      if (newContent) {
        setEditContent(newContent);
        setOriginalContent(newContent);
        notify({
          id: `regen-${Date.now()}`,
          type: 'success',
          title: t('regenerate.toast'),
          message: deliverable?.title,
        });
      } else {
        // API returned no content -- use whatever the store has after regeneration
        const updated = useFulfillmentStore.getState().deliverables.find((d) => d.id === delivId);
        if (updated) {
          setEditContent(updated.content);
          setOriginalContent(updated.content);
        }
        notify({
          id: `regen-warn-${Date.now()}`,
          type: 'warning',
          title: t('regenerate.noContent'),
        });
      }
    } catch (err) {
      console.error('[Editor] Regenerate fehlgeschlagen:', err);
      notify({
        id: `regen-err-${Date.now()}`,
        type: 'error',
        title: t('toast.regenerateFailed'),
        message: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setIsRegenerating(false);
    }
  }, [delivId, deliverable?.title, feedbackText, regenerateDeliverable, notify, t]);

  if (!deliverable) {
    return (
      <>
        <PageMeta title={`${t('editor.title')} | Kunden Hub`} description="" />
        <div className="flex flex-col items-center justify-center py-20">
          <svg className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          <p className="text-lg font-medium text-gray-800 dark:text-white/90">{t('client.notFound')}</p>
          <Button size="sm" variant="outline" onClick={() => navigate(`/kunden-hub/clients/${clientId}?tab=deliverables`)} className="mt-4">
            {t('client.back')}
          </Button>
        </div>
      </>
    );
  }

  const canSubmitForReview = deliverable.status === 'draft' || deliverable.status === 'rejected';
  const canApprove = deliverable.status === 'in_review';
  const canReject = deliverable.status === 'in_review';
  const canRegenerate = deliverable.status === 'draft' || deliverable.status === 'rejected' || deliverable.status === 'manually_edited';

  const handleSave = async () => {
    if (!hasChanged || !delivId) return;
    setIsSaving(true);
    try {
      await updateDeliverableContent(delivId, editContent);
      setOriginalContent(editContent);
      notify({
        id: `save-${Date.now()}`,
        type: 'success',
        title: t('toast.saved'),
        message: deliverable.title,
      });
    } catch (err) {
      console.error('[Editor] Save fehlgeschlagen:', err);
      notify({
        id: `save-err-${Date.now()}`,
        type: 'error',
        title: t('toast.saveFailed'),
        message: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmitForReview = () => {
    if (!delivId || !deliverable) return;
    setConfirmAction({ type: 'submit', id: delivId, title: deliverable.title });
  };

  const handleApprove = () => {
    if (!delivId || !deliverable) return;
    setConfirmAction({ type: 'approve', id: delivId, title: deliverable.title });
  };

  const executeConfirmAction = async () => {
    if (!confirmAction) return;
    try {
      if (confirmAction.type === 'approve') {
        await approveDeliverable(confirmAction.id);
        notify({
          id: `approve-${Date.now()}`,
          type: 'success',
          title: t('toast.approved'),
          message: confirmAction.title,
        });
      } else if (confirmAction.type === 'submit') {
        submitForReview(confirmAction.id);
        notify({
          id: `submit-${Date.now()}`,
          type: 'success',
          title: t('toast.submitted'),
          message: confirmAction.title,
        });
      }
    } catch (err) {
      console.error('[Editor] Action fehlgeschlagen:', err);
      notify({
        id: `action-err-${Date.now()}`,
        type: 'error',
        title: t('toast.actionFailed'),
        message: err instanceof Error ? err.message : undefined,
      });
    }
    setConfirmAction(null);
  };

  const handleReset = () => {
    if (!hasChanged) return;
    if (window.confirm(t('dialog.confirmTitle'))) {
      setEditContent(originalContent);
    }
  };

  const handleVersionRestore = async (content: string, _version: number) => {
    if (!delivId) return;
    setEditContent(content);
    setOriginalContent(content);
    try {
      await updateDeliverableContent(delivId, content);
      notify({
        id: `restore-${Date.now()}`,
        type: 'success',
        title: t('toast.restored'),
      });
    } catch (err) {
      console.error('[Editor] Restore fehlgeschlagen:', err);
      notify({
        id: `restore-err-${Date.now()}`,
        type: 'error',
        title: t('toast.restoreFailed'),
        message: err instanceof Error ? err.message : undefined,
      });
    }
  };

  return (
    <>
      <PageMeta
        title={`${deliverable.title} | Editor | Kunden Hub`}
        description={`${t('editor.title')} - ${deliverable.title}`}
      />
      <PageBreadcrumb pageTitle={deliverable.title} />

      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate(`/kunden-hub/clients/${clientId}?tab=deliverables`)}
          className="mb-4 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          {t('client.back')}
        </button>

        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">
            {deliverable.title}
          </h1>
          <StatusBadge deliverableStatus={deliverable.status} />
          <span className="text-sm text-gray-400 dark:text-gray-500">
            {t('editor.version')} {deliverable.version}
          </span>
        </div>
      </div>

      {/* Tab toggle */}
      <div className="mb-6 flex gap-2">
        <button
          onClick={() => setActiveTab('edit')}
          className={`rounded-full px-4 py-2 text-sm font-medium transition ${
            activeTab === 'edit'
              ? 'bg-brand-500 text-white'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          {t('editor.title')}
        </button>
        <button
          onClick={() => setActiveTab('preview')}
          className={`rounded-full px-4 py-2 text-sm font-medium transition ${
            activeTab === 'preview'
              ? 'bg-brand-500 text-white'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          {t('editor.preview')}
        </button>
      </div>

      {/* Loading content from API */}
      {isLoadingContent && (
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-white/[0.02]">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600 dark:border-gray-600 dark:border-t-gray-300" />
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {t('editor.loading')}
          </span>
        </div>
      )}

      {/* Generating overlay */}
      {isRegenerating && (
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-brand-200 bg-brand-50 p-4 dark:border-brand-800 dark:bg-brand-500/10">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand-200 border-t-brand-500" />
          <span className="text-sm font-medium text-brand-600 dark:text-brand-400">
            {t('delStatus.generating')}
          </span>
        </div>
      )}

      {/* Edit mode */}
      {activeTab === 'edit' && !isRegenerating && !isLoadingContent && (
        <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
          <TextArea
            value={editContent}
            onChange={(val) => setEditContent(val)}
            rows={18}
            placeholder=""
            className="min-h-[400px] font-mono text-sm"
          />
        </div>
      )}

      {/* Preview mode */}
      {activeTab === 'preview' && !isRegenerating && !isLoadingContent && (
        <div>
          {deliverable.previewType === 'ad_feed' ? (
            <AdPreview content={editContent} title={deliverable.title} />
          ) : deliverable.previewType === 'campaign_table' ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
              <p className="text-sm font-medium text-gray-800 dark:text-white/90 mb-2">
                {t('misc.campaignDetails')}
              </p>
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <p><span className="font-medium text-gray-800 dark:text-white/90">{t('misc.campaignType')}:</span> {deliverable.title}</p>
                <p>{t('misc.campaignContent')}</p>
              </div>
              <div className="mt-4 rounded-lg bg-gray-50 p-4 dark:bg-gray-800/50">
                <div dangerouslySetInnerHTML={{ __html: editContent || '' }} className="text-sm text-gray-700 dark:text-gray-300" />
              </div>
            </div>
          ) : (
            <DocPreview content={editContent} title={deliverable.title} />
          )}
        </div>
      )}

      {/* Action buttons */}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        {hasChanged && (
          <Button size="sm" variant="primary" onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <span className="flex items-center gap-1.5">
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                {t('action.saving')}
              </span>
            ) : (
              t('action.save')
            )}
          </Button>
        )}
        {canSubmitForReview && (
          <Button size="sm" variant="primary" onClick={handleSubmitForReview}>
            {t('action.submitReview')}
          </Button>
        )}
        {hasChanged && (
          <Button size="sm" variant="outline" onClick={handleReset}>
            {t('action.reset')}
          </Button>
        )}
        {canApprove && (
          <Button
            size="sm"
            variant="primary"
            onClick={handleApprove}
            className="!bg-success-500 hover:!bg-success-600"
          >
            {t('action.approve')}
          </Button>
        )}
        {canReject && (
          <Button
            size="sm"
            variant="primary"
            onClick={() => setApprovalDialogOpen(true)}
            className="!bg-error-500 hover:!bg-error-600"
          >
            {t('action.reject')}
          </Button>
        )}
        {canRegenerate && !isRegenerating && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setRegenerateConfirmOpen(true)}
          >
            <span className="flex items-center gap-1.5">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
              {t('regenerate.button')}
            </span>
          </Button>
        )}
      </div>

      {/* Comments section (collapsible) */}
      {delivId && (
        <div className="mt-8">
          <button
            onClick={() => setCommentsOpen(!commentsOpen)}
            className="flex items-center gap-2 text-sm font-semibold text-gray-800 dark:text-white/90 mb-3"
          >
            <svg
              className={`h-4 w-4 transition-transform ${commentsOpen ? 'rotate-0' : '-rotate-90'}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
            {t('comment.title')} (3)
          </button>
          {commentsOpen && (
            <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
              <CommentThread deliverableId={delivId} />
            </div>
          )}
        </div>
      )}

      {/* Version history */}
      {delivId && (
        <div className="mt-8">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90 mb-3">
            {t('editor.versionHistory')}
          </h3>
          <VersionHistory
            deliverableId={delivId}
            currentContent={editContent}
            onRestore={handleVersionRestore}
          />
        </div>
      )}

      {/* Regenerate Confirmation Modal */}
      <Modal isOpen={regenerateConfirmOpen} onClose={() => { setRegenerateConfirmOpen(false); setFeedbackText(''); }} className="max-w-md p-6 sm:p-8">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-2">
          {t('regenerate.confirmTitle')}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          {t('regenerate.confirmText')}
        </p>
        <TextArea
          value={feedbackText}
          onChange={(val) => setFeedbackText(val)}
          rows={3}
          placeholder={t('regenerate.feedbackPlaceholder')}
          className="mb-6"
        />
        <div className="flex justify-end gap-3">
          <Button size="sm" variant="outline" onClick={() => { setRegenerateConfirmOpen(false); setFeedbackText(''); }}>
            {t('action.cancel')}
          </Button>
          <Button size="sm" variant="primary" onClick={handleRegenerate}>
            {t('regenerate.confirm')}
          </Button>
        </div>
      </Modal>

      {/* Confirmation Modal for approve / submit */}
      <Modal isOpen={!!confirmAction} onClose={() => setConfirmAction(null)} className="max-w-md p-6 sm:p-8">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-2">
          {confirmAction?.type === 'approve' ? t('dialog.confirmApprove') : t('dialog.confirmSubmit')}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          &quot;{confirmAction?.title}&quot;
        </p>
        <div className="flex justify-end gap-3">
          <Button size="sm" variant="outline" onClick={() => setConfirmAction(null)}>
            {t('action.cancel')}
          </Button>
          <Button
            size="sm"
            variant="primary"
            className={confirmAction?.type === 'approve' ? '!bg-success-500 hover:!bg-success-600 text-white' : ''}
            onClick={executeConfirmAction}
          >
            {confirmAction?.type === 'approve' ? t('dialog.yesApprove') : t('dialog.yesSubmit')}
          </Button>
        </div>
      </Modal>

      {/* Approval Dialog */}
      <ApprovalDialog
        open={approvalDialogOpen}
        onClose={() => setApprovalDialogOpen(false)}
        deliverableId={deliverable.id}
        deliverableTitle={deliverable.title}
      />
    </>
  );
}
