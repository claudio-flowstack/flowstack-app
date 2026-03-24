import { useLanguage } from '../i18n/LanguageContext';

interface VariantSwitcherProps {
  variants: string[];
  activeIndex: number;
  onChange: (i: number) => void;
}

const VariantSwitcher: React.FC<VariantSwitcherProps> = ({ variants, activeIndex, onChange }) => {
  const { t } = useLanguage();

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1.5">
        {variants.map((_, i) => (
          <button
            key={i}
            onClick={() => onChange(i)}
            className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition ${
              activeIndex === i
                ? 'bg-brand-500 text-white'
                : 'text-gray-500 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:text-gray-400 dark:ring-gray-700 dark:hover:bg-white/[0.03]'
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>
      <span className="text-xs text-gray-500 dark:text-gray-400">
        {t('variant.xOfY', { x: activeIndex + 1, y: variants.length })}
      </span>
    </div>
  );
};

export default VariantSwitcher;
