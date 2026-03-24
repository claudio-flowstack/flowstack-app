import { useRef, useCallback, useEffect, useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import type { DeliverableStatus } from '../data/types';
import { DELIVERABLE_STATUS_CONFIG } from '../data/constants';

interface TabItem {
  id: string;
  title: string;
  status: string;
}

interface ItemTabsProps {
  items: TabItem[];
  activeIndex: number;
  onChange: (index: number) => void;
}

function StatusDot({ status }: { status: string }) {
  const cfg = DELIVERABLE_STATUS_CONFIG[status as DeliverableStatus];
  if (!cfg) return null;

  if (status === 'generating') {
    return (
      <svg className="h-2.5 w-2.5 animate-spin text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24">
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

  return <span className={`h-2 w-2 rounded-full ${bgColor} flex-shrink-0`} />;
}

const ItemTabs: React.FC<ItemTabsProps> = ({ items, activeIndex, onChange }) => {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const safeIndex = Math.min(activeIndex, Math.max(0, items.length - 1));
  const currentItem = items.length > 0 ? items[safeIndex] : null;

  const goToPrev = useCallback(() => {
    if (!items || items.length === 0) return;
    const newIndex = safeIndex <= 0 ? items.length - 1 : safeIndex - 1;
    onChange(newIndex);
  }, [items, safeIndex, onChange]);

  const goToNext = useCallback(() => {
    if (!items || items.length === 0) return;
    const newIndex = safeIndex >= items.length - 1 ? 0 : safeIndex + 1;
    onChange(newIndex);
  }, [items, safeIndex, onChange]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goToPrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        goToNext();
      } else if (e.key === 'Escape') {
        setIsOpen(false);
      }
    },
    [goToPrev, goToNext]
  );

  // Click outside to close
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  if (!items || items.length === 0) return null;

  const currentCfg = currentItem
    ? DELIVERABLE_STATUS_CONFIG[currentItem.status as DeliverableStatus]
    : null;
  const statusLabel = currentCfg?.label || '';

  return (
    <div
      className="flex items-center gap-1.5"
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="tablist"
    >
      {/* Left arrow */}
      <button
        type="button"
        onClick={goToPrev}
        className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-700 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-400 dark:hover:bg-white/[0.06] dark:hover:text-gray-200 transition"
        aria-label={t('deliverables.prev')}
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* Center dropdown */}
      <div ref={dropdownRef} className="relative flex-1 min-w-0">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex w-full items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-left transition hover:bg-gray-50 dark:border-gray-800 dark:bg-white/[0.03] dark:hover:bg-white/[0.06]"
        >
          {/* Chevron down */}
          <svg
            className={`h-3 w-3 flex-shrink-0 text-gray-400 dark:text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>

          {/* Title + status dot */}
          {currentItem && (
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              <span className="text-xs font-medium text-gray-800 dark:text-white truncate">
                {currentItem.title}
              </span>
              <StatusDot status={currentItem.status} />
              <span className="text-[10px] text-gray-400 dark:text-gray-500 truncate">
                {statusLabel}
              </span>
            </div>
          )}

          {/* Position counter */}
          <span className="text-[10px] text-gray-400 dark:text-gray-500 flex-shrink-0 tabular-nums">
            {safeIndex + 1}/{items.length}
          </span>
        </button>

        {/* Dropdown list */}
        {isOpen && (
          <div className="absolute left-0 right-0 top-full z-30 mt-1 max-h-60 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900">
            {items.map((item, idx) => {
              const isActive = idx === safeIndex;
              const cfg = DELIVERABLE_STATUS_CONFIG[item.status as DeliverableStatus];
              const label = cfg?.label || '';
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onChange(idx);
                    setIsOpen(false);
                  }}
                  className={`flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition ${
                    isActive
                      ? 'bg-brand-50 dark:bg-brand-500/10'
                      : 'hover:bg-gray-50 dark:hover:bg-white/[0.04]'
                  }`}
                >
                  <StatusDot status={item.status} />
                  <span
                    className={`truncate flex-1 ${
                      isActive
                        ? 'font-medium text-brand-600 dark:text-brand-400'
                        : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {item.title}
                  </span>
                  <span className="text-[10px] text-gray-400 dark:text-gray-500 flex-shrink-0">
                    {label}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Right arrow */}
      <button
        type="button"
        onClick={goToNext}
        className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-700 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-400 dark:hover:bg-white/[0.06] dark:hover:text-gray-200 transition"
        aria-label={t('deliverables.next')}
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
};

export default ItemTabs;
