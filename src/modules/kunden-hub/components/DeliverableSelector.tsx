import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import type { Deliverable, PhaseGroup, DeliverableStatus } from '../data/types';
import { PHASE_CONFIG, DELIVERABLE_STATUS_CONFIG } from '../data/constants';
import StatusBadge from './StatusBadge';

interface DeliverableSelectorProps {
  deliverables: Deliverable[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

const PHASES: PhaseGroup[] = ['strategy', 'copy', 'funnel', 'campaigns'];

function PhaseIcon({ name }: { name: string }) {
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
}

function StatusDot({ status }: { status: DeliverableStatus }) {
  const cfg = DELIVERABLE_STATUS_CONFIG[status];
  if (!cfg) return null;

  if (status === 'generating') {
    return (
      <svg className="h-4 w-4 animate-spin text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    );
  }

  const colorMap: Record<string, string> = {
    'text-success-500': 'bg-success-500',
    'text-warning-500': 'bg-warning-500',
    'text-error-500': 'bg-error-500',
    'text-brand-500': 'bg-brand-500',
    'text-gray-400': 'bg-gray-400',
    'text-gray-500': 'bg-gray-500',
  };

  const bgColor = colorMap[cfg.color] || 'bg-gray-400';

  return <span className={`h-2.5 w-2.5 rounded-full ${bgColor} flex-shrink-0`} />;
}

const DeliverableSelector: React.FC<DeliverableSelectorProps> = ({
  deliverables,
  selectedId,
  onSelect,
}) => {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // TASK 2: Filter out blocked deliverables (show generating with spinner)
  const visibleDeliverables = useMemo(
    () => deliverables.filter((d) => d.status !== 'blocked'),
    [deliverables]
  );

  // Navigable list: deliverables that have content (not blocked, not generating without content)
  const navigableDeliverables = useMemo(
    () => visibleDeliverables.filter((d) => d.status !== 'generating' || (d.content || '').trim().length > 0),
    [visibleDeliverables]
  );

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const selected = useMemo(
    () => deliverables.find((d) => d.id === selectedId),
    [deliverables, selectedId]
  );

  const approvedCount = useMemo(
    () => visibleDeliverables.filter((d) => d.status === 'approved' || d.status === 'live').length,
    [visibleDeliverables]
  );

  // Current index in navigable list
  const currentIndex = useMemo(() => {
    if (!selectedId) return -1;
    return navigableDeliverables.findIndex((d) => d.id === selectedId);
  }, [navigableDeliverables, selectedId]);

  // TASK 1: Arrow navigation with wrap-around
  const goToPrev = useCallback(() => {
    if (navigableDeliverables.length === 0) return;
    const newIndex = currentIndex <= 0 ? navigableDeliverables.length - 1 : currentIndex - 1;
    onSelect(navigableDeliverables[newIndex]!.id);
  }, [navigableDeliverables, currentIndex, onSelect]);

  const goToNext = useCallback(() => {
    if (navigableDeliverables.length === 0) return;
    const newIndex = currentIndex >= navigableDeliverables.length - 1 ? 0 : currentIndex + 1;
    onSelect(navigableDeliverables[newIndex]!.id);
  }, [navigableDeliverables, currentIndex, onSelect]);

  // Keyboard: Left/Right arrows when focused
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goToPrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        goToNext();
      }
    },
    [goToPrev, goToNext]
  );

  const groupedByPhase = useMemo(() => {
    const groups: Record<PhaseGroup, Deliverable[]> = {
      strategy: [],
      copy: [],
      funnel: [],
      campaigns: [],
    };
    for (const d of visibleDeliverables) {
      if (groups[d.phase]) {
        groups[d.phase].push(d);
      }
    }
    return groups;
  }, [visibleDeliverables]);

  const selectedPhaseIcon = selected ? PHASE_CONFIG[selected.phase]?.icon : undefined;

  const handleSelect = (id: string) => {
    onSelect(id);
    setIsOpen(false);
  };

  // Display position: index among navigable
  const displayIndex = currentIndex >= 0 ? currentIndex + 1 : 0;

  return (
    <div ref={containerRef} className="relative" onKeyDown={handleKeyDown} tabIndex={0}>
      {/* Closed state - trigger with arrows */}
      <div className="flex items-center gap-2">
        {/* Left arrow */}
        <button
          type="button"
          onClick={goToPrev}
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-700 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-400 dark:hover:bg-white/[0.06] dark:hover:text-gray-200 transition"
          title={t('deliverables.prev')}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Main selector button */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex-1 rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03] cursor-pointer hover:border-brand-200 dark:hover:border-brand-800 transition text-left"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {selectedPhaseIcon && (
                <span className="text-brand-500 flex-shrink-0">
                  <PhaseIcon name={selectedPhaseIcon} />
                </span>
              )}
              <div className="min-w-0">
                <p className="text-base font-medium text-gray-800 dark:text-white/90 truncate">
                  {selected ? selected.title : t('deliverables.selectLabel')}
                </p>
                {selected && (
                  <div className="mt-1">
                    <StatusBadge deliverableStatus={selected.status} />
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 flex-shrink-0">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {displayIndex}/{visibleDeliverables.length}
              </span>
              <span className="text-xs text-gray-400 dark:text-gray-500">
                {approvedCount} {t('deliverables.approvedShort')}
              </span>
              <svg
                className={`h-5 w-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </button>

        {/* Right arrow */}
        <button
          type="button"
          onClick={goToNext}
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-700 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-400 dark:hover:bg-white/[0.06] dark:hover:text-gray-200 transition"
          title={t('deliverables.next')}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Open state - dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-2 w-full rounded-2xl border border-gray-200 bg-white shadow-theme-lg dark:border-gray-800 dark:bg-gray-900 max-h-[400px] overflow-y-auto">
          {PHASES.map((phase) => {
            const items = groupedByPhase[phase];
            if (!items || items.length === 0) return null;
            const cfg = PHASE_CONFIG[phase];

            return (
              <div key={phase}>
                {/* Phase header */}
                <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-gray-400 font-medium px-4 pt-4 pb-2">
                  <PhaseIcon name={cfg.icon} />
                  <span>{t(`phase.${phase}`)}</span>
                </div>

                {/* Phase items */}
                {items.map((d) => {
                  const isSelected = d.id === selectedId;
                  const isGenerating = d.status === 'generating';
                  const statusCfg = DELIVERABLE_STATUS_CONFIG[d.status];
                  const statusLabel = t(`delStatus.${d.status}`);

                  return (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => !isGenerating ? handleSelect(d.id) : undefined}
                      className={`w-full px-4 py-2.5 flex items-center justify-between transition ${
                        isGenerating ? 'cursor-default opacity-60' : 'cursor-pointer'
                      } ${
                        isSelected
                          ? 'bg-brand-50 dark:bg-brand-500/10'
                          : isGenerating
                          ? ''
                          : 'hover:bg-gray-50 dark:hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <StatusDot status={d.status} />
                        <span
                          className={`text-sm truncate ${
                            isSelected
                              ? 'font-medium text-brand-600 dark:text-brand-400'
                              : 'text-gray-700 dark:text-gray-300'
                          } ${isGenerating ? 'text-gray-400 dark:text-gray-500' : ''}`}
                        >
                          {d.title}
                        </span>
                      </div>
                      <span
                        className={`text-xs flex-shrink-0 ml-3 ${statusCfg?.color || 'text-gray-400'}`}
                      >
                        {statusLabel}
                      </span>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DeliverableSelector;
