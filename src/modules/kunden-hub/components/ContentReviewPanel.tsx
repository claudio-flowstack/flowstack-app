import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { useFulfillmentStore } from '../store/fulfillment-store';
import { useNotification } from '../contexts/NotificationContext';
import type { DeliverableSubtype, DeliverableStatus, PhaseGroup } from '../data/types';
import { DELIVERABLE_STATUS_CONFIG, PHASE_CONFIG } from '../data/constants';
import CategoryDropdown from './CategoryDropdown';
import ItemTabs from './ItemTabs';
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
    subtypes: ['zielgruppen_avatar', 'arbeitgeber_avatar', 'messaging_matrix', 'creative_briefing', 'marken_richtlinien'] as DeliverableSubtype[],
  },
  {
    key: 'meta_ads',
    labelKey: 'category.metaAds',
    subtypes: ['anzeigen_haupt', 'anzeigen_retargeting', 'anzeigen_warmup'] as DeliverableSubtype[],
  },
  {
    key: 'google_ads',
    labelKey: 'category.googleAds',
    subtypes: [] as DeliverableSubtype[],
  },
  {
    key: 'linkedin_ads',
    labelKey: 'category.linkedinAds',
    subtypes: [] as DeliverableSubtype[],
  },
  {
    key: 'tiktok_ads',
    labelKey: 'category.tiktokAds',
    subtypes: [] as DeliverableSubtype[],
  },
  {
    key: 'website_texts',
    labelKey: 'category.websiteTexts',
    subtypes: ['lp_text', 'form_text', 'danke_text', 'videoskript'] as DeliverableSubtype[],
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
  if (categoryKey === 'google_ads') {
    return (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
      </svg>
    );
  }
  if (categoryKey === 'linkedin_ads') {
    return (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    );
  }
  if (categoryKey === 'tiktok_ads') {
    return (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 0010.86 4.46V13a8.28 8.28 0 005.58 2.16v-3.45a4.84 4.84 0 01-3.77-1.64z" />
      </svg>
    );
  }
  // website_texts
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="10" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
    </svg>
  );
}

// Map categories to PhaseGroup for batch approve
const CATEGORY_PHASE_MAP: Record<string, PhaseGroup | null> = {
  documents: 'strategy',
  meta_ads: 'copy',
  google_ads: null,
  linkedin_ads: null,
  tiktok_ads: null,
  website_texts: 'copy',
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
  const [tabsPanelOpen, setTabsPanelOpen] = useState(true);
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

  // Items for the tab bar
  const tabItems = useMemo(() => {
    return filteredItems.map((d) => ({
      id: d.id,
      title: d.title,
      status: d.status,
    }));
  }, [filteredItems]);

  // Determine which view to render
  const isAdCategory = activeCategory === 'meta_ads' || activeCategory === 'google_ads' || activeCategory === 'linkedin_ads' || activeCategory === 'tiktok_ads';
  const isDocCategory = activeCategory === 'documents' || activeCategory === 'website_texts';

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
                  Alle Entwuerfe und in Pruefung befindliche {phaseLabel}-Dokumente werden freigegeben.
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

      {/* Content Area with Sidebar Tabs */}
      {currentDeliverable ? (
        <>
          <div className={isDocCategory && filteredItems.length > 1 ? 'flex' : ''}>
            {/* Left: Google Docs Style Tab Panel */}
            {isDocCategory && filteredItems.length > 1 && (
              <div
                className="shrink-0 bg-white dark:bg-gray-900 transition-all duration-200 ease-out overflow-hidden rounded-l-xl"
                style={{ width: tabsPanelOpen ? 220 : 40, borderRight: '1px solid #e0e0e0' }}
              >
                <div className="flex items-center h-10 px-2 cursor-pointer select-none" onClick={() => setTabsPanelOpen(!tabsPanelOpen)} style={{ borderBottom: '1px solid #e8eaed' }}>
                  <button className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#5f6368" strokeWidth="2" style={{ transform: tabsPanelOpen ? 'rotate(0)' : 'rotate(-90deg)', transition: 'transform 0.2s' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {tabsPanelOpen && <span style={{ fontSize: 13, fontWeight: 500, color: '#202124', marginLeft: 4 }}>Tabs</span>}
                </div>
                {tabsPanelOpen ? (
                  <div className="py-1">
                    {filteredItems.map((item, idx) => {
                      const isActive = idx === Math.min(activeItemIndex, filteredItems.length - 1);
                      const sc = item.status === 'approved' || item.status === 'live' ? '#188038' : item.status === 'in_review' ? '#e37400' : item.status === 'rejected' ? '#d93025' : '#5f6368';
                      return (
                        <button key={item.id} onClick={() => handleItemChange(idx)} className="flex w-full items-center gap-2.5 text-left transition-colors"
                          style={{ padding: '9px 12px 9px 8px', borderLeft: isActive ? '3px solid #0b57d0' : '3px solid transparent', background: isActive ? '#e8f0fe' : 'transparent' }}
                          onMouseEnter={(e) => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = '#f2f2f2'; }}
                          onMouseLeave={(e) => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = isActive ? '#e8f0fe' : 'transparent'; }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0">
                            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" fill={isActive ? '#4285f4' : '#dadce0'} />
                            <path d="M14 2v6h6" fill={isActive ? '#a1c2fa' : '#f1f3f4'} />
                          </svg>
                          <div className="flex-1 min-w-0">
                            <span className="block truncate" style={{ fontSize: 12, fontWeight: isActive ? 500 : 400, color: isActive ? '#0b57d0' : '#444746', lineHeight: '16px' }}>{item.title}</span>
                            <span style={{ fontSize: 10, color: sc }}>{DELIVERABLE_STATUS_CONFIG[item.status as DeliverableStatus]?.label ?? ''}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-1 flex flex-col items-center gap-1">
                    {filteredItems.map((item, idx) => {
                      const isActive = idx === Math.min(activeItemIndex, filteredItems.length - 1);
                      return (
                        <button key={item.id} onClick={() => handleItemChange(idx)} title={item.title}
                          className="flex h-7 w-7 items-center justify-center rounded transition-colors"
                          style={{ background: isActive ? '#e8f0fe' : 'transparent' }}
                          onMouseEnter={(e) => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = '#f2f2f2'; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = isActive ? '#e8f0fe' : 'transparent'; }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" fill={isActive ? '#4285f4' : '#dadce0'} /></svg>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Right: Main Content */}
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
                />
              )}
            </>
          )}

            {/* For ads: ItemTabs still shown as horizontal selector */}
            {isAdCategory && filteredItems.length > 1 && (
              <div className="mt-4">
                <ItemTabs
                  items={tabItems}
                  activeIndex={Math.min(activeItemIndex, filteredItems.length - 1)}
                  onChange={handleItemChange}
                />
              </div>
            )}
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
            {t(`empty.${activeCategory === 'meta_ads' ? 'metaAds' : activeCategory === 'google_ads' ? 'googleAds' : activeCategory === 'linkedin_ads' ? 'linkedinAds' : activeCategory === 'tiktok_ads' ? 'tiktokAds' : activeCategory === 'website_texts' ? 'websiteTexts' : 'documents'}`)}
          </p>
        </div>
      )}
    </div>
  );
};

export default ContentReviewPanel;
