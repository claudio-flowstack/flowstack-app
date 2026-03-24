import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { useFulfillmentStore } from '../store/fulfillment-store';
import { useNotification } from '../contexts/NotificationContext';
import type { DeliverableSubtype, PhaseGroup } from '../data/types';
import { PHASE_CONFIG } from '../data/constants';
import CategoryDropdown from './CategoryDropdown';
import AdReviewView from './AdReviewView';
import DocReviewView from './DocReviewView';
import { CheckCircle } from 'lucide-react';

interface ContentReviewPanelProps {
  clientId: string;
}

const CATEGORIES = [
  {
    key: 'documents',
    labelKey: 'category.documents',
    subtypes: ['zielgruppen_avatar', 'arbeitgeber_avatar', 'messaging_matrix', 'creative_briefing', 'marken_richtlinien', 'lp_text', 'form_text', 'danke_text', 'videoskript'] as DeliverableSubtype[],
  },
  {
    key: 'meta_ads',
    labelKey: 'category.metaAds',
    subtypes: ['anzeigen_haupt', 'anzeigen_retargeting', 'anzeigen_warmup'] as DeliverableSubtype[],
  },
];

// Category icons
function CategoryIcon({ categoryKey }: { categoryKey: string }) {
  if (categoryKey === 'documents') {
    return (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    );
  }
  if (categoryKey === 'meta_ads') {
    return (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    );
  }
  // Fallback
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

// Map categories to PhaseGroup for batch approve
const CATEGORY_PHASE_MAP: Record<string, PhaseGroup | null> = {
  documents: 'strategy',
  meta_ads: 'copy',
};

const ContentReviewPanel: React.FC<ContentReviewPanelProps> = ({ clientId }) => {
  const { t } = useLanguage();
  const { notify } = useNotification();
  const deliverables = useFulfillmentStore((s) => s.deliverables);
  const updateDeliverableContent = useFulfillmentStore((s) => s.updateDeliverableContent);
  const approveDeliverable = useFulfillmentStore((s) => s.approveDeliverable);
  const rejectDeliverable = useFulfillmentStore((s) => s.rejectDeliverable);
  const requestChanges = useFulfillmentStore((s) => s.requestChanges);
  const approveAllDrafts = useFulfillmentStore((s) => s.approveAllDrafts);

  const [activeCategory, setActiveCategory] = useState<string>('documents');
  const [activeItemIndex, setActiveItemIndex] = useState(0);
  const [editableContent, setEditableContent] = useState<string>('');
  const [hasChanges, setHasChanges] = useState(false);
  const [hiddenTabIds] = useState<Set<string>>(new Set());
  const [showBatchConfirm, setShowBatchConfirm] = useState(false);

  // Filter client deliverables via useMemo (no .filter in store selector)
  const clientDeliverables = useMemo(
    () => deliverables.filter((d) => d.clientId === clientId),
    [deliverables, clientId]
  );

  // Get active category config
  const activeCategoryConfig = useMemo(
    () => CATEGORIES.find((c) => c.key === activeCategory),
    [activeCategory]
  );

  // All items in category (for tab manager)
  const allCategoryItems = useMemo(() => {
    if (!activeCategoryConfig) return [];
    if (activeCategoryConfig.subtypes.length === 0) return [];
    return clientDeliverables.filter(
      (d) =>
        activeCategoryConfig.subtypes.includes(d.subtype) &&
        d.status !== 'blocked'
    );
  }, [clientDeliverables, activeCategoryConfig]);

  // Filter items by active category's subtypes, exclude blocked + hidden tabs
  const filteredItems = useMemo(() => {
    return allCategoryItems.filter((d) => !hiddenTabIds.has(d.id));
  }, [allCategoryItems, hiddenTabIds]);

  // Build category dropdown items with counts
  const categoryItems = useMemo(() => {
    return CATEGORIES.map((cat) => {
      const count = cat.subtypes.length === 0
        ? 0
        : clientDeliverables.filter(
            (d) => cat.subtypes.includes(d.subtype) && d.status !== 'blocked'
          ).length;
      return {
        key: cat.key,
        label: t(cat.labelKey),
        icon: <CategoryIcon categoryKey={cat.key} />,
        count,
      };
    });
  }, [clientDeliverables, t]);

  // Current selected deliverable
  const currentDeliverable = useMemo(() => {
    if (filteredItems.length === 0) return null;
    const idx = Math.min(activeItemIndex, filteredItems.length - 1);
    return filteredItems[idx] ?? null;
  }, [filteredItems, activeItemIndex]);

  // Count of approvable items in current category (for bulk approve)
  const approvableCount = useMemo(() => {
    return filteredItems.filter(
      (d) => d.status === 'draft' || d.status === 'in_review' || d.status === 'manually_edited'
    ).length;
  }, [filteredItems]);

  // Reset index when category changes
  const handleCategoryChange = useCallback((category: string) => {
    setActiveCategory(category);
    setActiveItemIndex(0);
    setHasChanges(false);
  }, []);

  // Load content when item changes
  useEffect(() => {
    if (currentDeliverable) {
      setEditableContent(currentDeliverable.content);
      setHasChanges(false);
    }
  }, [currentDeliverable?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleContentChange = useCallback((content: string) => {
    setEditableContent(content);
    setHasChanges(true);
  }, []);

  const handleItemChange = useCallback((index: number) => {
    setActiveItemIndex(index);
    setHasChanges(false);
  }, []);

  const handleApprove = useCallback(async () => {
    if (!currentDeliverable) return;
    try {
      // Save first if there are changes
      if (hasChanges) {
        await updateDeliverableContent(currentDeliverable.id, editableContent);
      }
      await approveDeliverable(currentDeliverable.id);
      setHasChanges(false);
      notify({
        id: `approve-${Date.now()}`,
        type: 'success',
        title: t('toast.approved'),
        message: currentDeliverable.title,
      });

      // Auto-advance to next unapproved item
      const currentIdx = Math.min(activeItemIndex, filteredItems.length - 1);
      const nextIdx = filteredItems.findIndex(
        (d, i) => i > currentIdx && d.status !== 'approved' && d.status !== 'live'
      );
      if (nextIdx !== -1) {
        setActiveItemIndex(nextIdx);
      }
    } catch (err) {
      console.error('[ContentReviewPanel] Approve fehlgeschlagen:', err);
      notify({
        id: `approve-err-${Date.now()}`,
        type: 'error',
        title: t('toast.actionFailed'),
        message: err instanceof Error ? err.message : undefined,
      });
    }
  }, [currentDeliverable, hasChanges, editableContent, updateDeliverableContent, approveDeliverable, notify, t, activeItemIndex, filteredItems]);

  const handleRequestChanges = useCallback(async (comment: string) => {
    if (!currentDeliverable) return;
    try {
      // Save first if there are changes
      if (hasChanges) {
        await updateDeliverableContent(currentDeliverable.id, editableContent);
      }
      // Use rejectDeliverable (API-backed) when there's a comment, otherwise requestChanges (local-only)
      if (comment && comment.length >= 10) {
        await rejectDeliverable(currentDeliverable.id, comment);
      } else {
        requestChanges(currentDeliverable.id, comment);
      }
      setHasChanges(false);
      notify({
        id: `reject-${Date.now()}`,
        type: 'info',
        title: t('toast.rejected'),
        message: currentDeliverable.title,
      });
    } catch (err) {
      console.error('[ContentReviewPanel] RequestChanges fehlgeschlagen:', err);
      notify({
        id: `reject-err-${Date.now()}`,
        type: 'error',
        title: t('toast.actionFailed'),
        message: err instanceof Error ? err.message : undefined,
      });
    }
  }, [currentDeliverable, hasChanges, editableContent, updateDeliverableContent, rejectDeliverable, requestChanges, notify, t]);

  const handleBatchPhaseApprove = useCallback(() => {
    const phase = CATEGORY_PHASE_MAP[activeCategory];
    if (!phase) return;
    approveAllDrafts(clientId, phase);
    setShowBatchConfirm(false);
    notify({
      id: `batch-phase-${Date.now()}`,
      type: 'success',
      title: t('toast.bulkApproved'),
      message: `Alle ${PHASE_CONFIG[phase].label} Dokumente freigegeben`,
    });
  }, [activeCategory, clientId, approveAllDrafts, notify, t]);

  // Cmd+Enter keyboard shortcut for approve (stable ref to avoid re-registering listener)
  const handleApproveRef = useRef(handleApprove);
  useEffect(() => { handleApproveRef.current = handleApprove; });
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleApproveRef.current();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Determine which view to render
  const isAdCategory = activeCategory === 'meta_ads';
  const isDocCategory = activeCategory === 'documents';

  // Phase info for batch approve button
  const activeCategoryPhase = CATEGORY_PHASE_MAP[activeCategory] || null;
  const phaseLabel = activeCategoryPhase ? PHASE_CONFIG[activeCategoryPhase].label : '';

  return (
    <div className="space-y-4">
      {/* Category Dropdown + Batch Approve */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1">
          <CategoryDropdown
            activeCategory={activeCategory}
            onChange={handleCategoryChange}
            categories={categoryItems}
          />
        </div>
        {activeCategoryPhase && approvableCount > 0 && (
          <div className="relative shrink-0">
            <button
              onClick={() => setShowBatchConfirm(!showBatchConfirm)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-success-500 px-3 py-2 text-xs font-medium text-white hover:bg-success-600 transition"
            >
              <CheckCircle className="h-3.5 w-3.5" />
              Alle {phaseLabel} freigeben
            </button>
            {/* Confirmation Dialog */}
            {showBatchConfirm && (
              <div className="absolute right-0 top-full mt-2 z-50 w-72 rounded-xl border border-gray-200 bg-white p-4 shadow-lg dark:border-gray-700 dark:bg-gray-900">
                <p className="text-sm font-medium text-gray-800 dark:text-white/90 mb-2">
                  {approvableCount} Dokumente freigeben?
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                  Alle Entwürfe und in Prüfung befindliche {phaseLabel}-Dokumente werden freigegeben.
                </p>
                <div className="flex items-center gap-2 justify-end">
                  <button
                    onClick={() => setShowBatchConfirm(false)}
                    className="rounded-lg px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition"
                  >
                    Abbrechen
                  </button>
                  <button
                    onClick={handleBatchPhaseApprove}
                    className="rounded-lg bg-success-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-success-600 transition"
                  >
                    Freigeben
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Content Area */}
      {currentDeliverable ? (
        <>
          <div>
            {/* Main Content */}
            <div className="flex-1 min-w-0">
          {/* Generating spinner */}
          {currentDeliverable.status === 'generating' && (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white py-16 dark:border-gray-800 dark:bg-white/[0.03]">
              <svg className="h-10 w-10 animate-spin text-brand-500 mb-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('delStatus.generating')}</p>
            </div>
          )}

          {/* Main content views */}
          {currentDeliverable.status !== 'generating' && (
            <>
              {isAdCategory && (
                <AdReviewView
                  deliverable={currentDeliverable}
                  editableContent={editableContent}
                  onChange={handleContentChange}
                  onApprove={handleApprove}
                  onRequestChanges={handleRequestChanges}
                  adCategory={activeCategory}
                  clientId={clientId}
                  deliverables={filteredItems}
                  onSelectDeliverable={(id) => {
                    const idx = filteredItems.findIndex((d) => d.id === id);
                    if (idx !== -1) handleItemChange(idx);
                  }}
                />
              )}

              {isDocCategory && (
                <DocReviewView
                  deliverable={currentDeliverable}
                  editableContent={editableContent}
                  onChange={handleContentChange}
                  onApprove={handleApprove}
                  onRequestChanges={handleRequestChanges}
                  hasChanges={hasChanges}
                  deliverables={filteredItems}
                  onSelectDeliverable={(id) => {
                    const idx = filteredItems.findIndex((d) => d.id === id);
                    if (idx !== -1) handleItemChange(idx);
                  }}
                />
              )}
            </>
          )}

            {/* Selector moved to top of content area */}
            </div>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50 py-16 dark:border-gray-700 dark:bg-gray-800/30">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-800 mb-4">
            <CategoryIcon categoryKey={activeCategory} />
          </div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {t('review.noItems')}
          </p>
          <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500 text-center max-w-xs">
            {t(`empty.${activeCategory === 'meta_ads' ? 'metaAds' : 'documents'}`)}
          </p>
        </div>
      )}
    </div>
  );
};

export default ContentReviewPanel;
