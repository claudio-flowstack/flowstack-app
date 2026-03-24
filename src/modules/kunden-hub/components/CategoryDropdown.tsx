import { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../i18n/LanguageContext';

interface CategoryItem {
  key: string;
  label: string;
  icon: React.ReactNode;
  count: number;
}

interface CategoryDropdownProps {
  activeCategory: string;
  onChange: (category: string) => void;
  categories: CategoryItem[];
}

const CategoryDropdown: React.FC<CategoryDropdownProps> = ({
  activeCategory,
  onChange,
  categories,
}) => {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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

  if (!categories || categories.length === 0) return null;

  const active = categories.find((c) => c.key === activeCategory);

  const handleSelect = (key: string) => {
    onChange(key);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03] cursor-pointer hover:border-brand-200 dark:hover:border-brand-800 transition text-left"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {active && (
              <span className="text-brand-500 flex-shrink-0">
                {active.icon}
              </span>
            )}
            <span className="text-base font-medium text-gray-800 dark:text-white/90 truncate">
              {active ? active.label : t('category.documents')}
            </span>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            {active && (
              <span className="inline-flex items-center justify-center rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
                {active.count}
              </span>
            )}
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

      {/* Dropdown list */}
      {isOpen && (
        <div className="absolute z-50 mt-2 w-full rounded-2xl border border-gray-200 bg-white shadow-theme-lg dark:border-gray-800 dark:bg-gray-900 overflow-hidden">
          {categories.map((cat) => {
            const isActive = cat.key === activeCategory;
            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => handleSelect(cat.key)}
                className={`w-full px-4 py-3 flex items-center justify-between gap-3 transition ${
                  isActive
                    ? 'bg-brand-50 dark:bg-brand-500/10'
                    : 'hover:bg-gray-50 dark:hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className={isActive ? 'text-brand-500' : 'text-gray-400 dark:text-gray-500'}>
                    {cat.icon}
                  </span>
                  <span
                    className={`text-sm font-medium truncate ${
                      isActive
                        ? 'text-brand-600 dark:text-brand-400'
                        : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {cat.label}
                  </span>
                </div>
                <span
                  className={`inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-medium ${
                    isActive
                      ? 'bg-brand-100 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400'
                      : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                  }`}
                >
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CategoryDropdown;
