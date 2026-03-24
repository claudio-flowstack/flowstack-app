import { useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { useNotification } from '../contexts/NotificationContext';

interface Suggestion {
  id: string;
  clientKey: string;
  titleKey: string;
  actionKey: string;
  primaryButtonKey: string;
  secondaryButtonKey: string;
}

const MOCK_SUGGESTIONS: Suggestion[] = [
  {
    id: 'sug-1',
    clientKey: 'ai.sug1Client',
    titleKey: 'ai.sug1Title',
    actionKey: 'ai.sug1Action',
    primaryButtonKey: 'ai.sug1Primary',
    secondaryButtonKey: 'ai.sugIgnore',
  },
  {
    id: 'sug-2',
    clientKey: 'ai.sug2Client',
    titleKey: 'ai.sug2Title',
    actionKey: 'ai.sug2Action',
    primaryButtonKey: 'ai.sug2Primary',
    secondaryButtonKey: 'ai.sugLater',
  },
  {
    id: 'sug-3',
    clientKey: 'ai.sug3Client',
    titleKey: 'ai.sug3Title',
    actionKey: 'ai.sug3Action',
    primaryButtonKey: 'ai.sug3Primary',
    secondaryButtonKey: 'ai.sugIgnore',
  },
];

export default function AiSuggestions() {
  const { t } = useLanguage();
  const { notify } = useNotification();
  const [suggestions, setSuggestions] = useState(MOCK_SUGGESTIONS);

  const handlePrimary = (sug: Suggestion) => {
    notify({
      id: `sug-done-${sug.id}`,
      type: 'success',
      title: t('ai.sugDone'),
      message: t(sug.actionKey),
      duration: 3000,
    });
    setSuggestions((prev) => prev.filter((s) => s.id !== sug.id));
  };

  const handleSecondary = (sug: Suggestion) => {
    setSuggestions((prev) => prev.filter((s) => s.id !== sug.id));
  };

  if (suggestions.length === 0) return null;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
      <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90 flex items-center gap-2">
        <span>{t('ai.sugTitle')}</span>
      </h3>
      <div className="space-y-3">
        {suggestions.map((sug) => (
          <div
            key={sug.id}
            className="rounded-xl border border-gray-100 bg-gray-50/50 p-4 dark:border-gray-800 dark:bg-white/[0.02]"
          >
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">
              <span className="font-medium">{t(sug.clientKey)}:</span>{' '}
              {t(sug.titleKey)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
              {'\u2192'} {t(sug.actionKey)}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePrimary(sug)}
                className="rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-600 transition"
              >
                {t(sug.primaryButtonKey)}
              </button>
              <button
                onClick={() => handleSecondary(sug)}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-100 transition dark:border-gray-700 dark:text-gray-400 dark:hover:bg-white/5"
              >
                {t(sug.secondaryButtonKey)}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
