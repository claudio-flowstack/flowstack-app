import { useLanguage } from '../i18n/LanguageContext';

interface PlacementSwitcherProps {
  activePlacement: string;
  onChange: (p: string) => void;
}

const placements = [
  { key: 'feed', labelKey: 'placement.feed' },
  { key: 'story', labelKey: 'placement.story' },
  { key: 'reel', labelKey: 'placement.reel' },
] as const;

// Small device icons per placement type
function PlacementIcon({ type }: { type: string }) {
  if (type === 'feed') {
    // Monitor icon
    return (
      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    );
  }
  if (type === 'story') {
    // Phone vertical icon
    return (
      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    );
  }
  // Reel - clapperboard icon
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  );
}

const PlacementSwitcher: React.FC<PlacementSwitcherProps> = ({ activePlacement, onChange }) => {
  const { t } = useLanguage();

  return (
    <div className="flex items-center gap-2">
      {placements.map((p) => (
        <button
          key={p.key}
          onClick={() => onChange(p.key)}
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition ${
            activePlacement === p.key
              ? 'bg-brand-500 text-white'
              : 'text-gray-500 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:text-gray-400 dark:ring-gray-700 dark:hover:bg-white/[0.03]'
          }`}
        >
          <PlacementIcon type={p.key} />
          {t(p.labelKey)}
        </button>
      ))}
    </div>
  );
};

export default PlacementSwitcher;
