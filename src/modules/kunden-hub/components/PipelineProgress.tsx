import { useLanguage } from '../i18n/LanguageContext';
import type { ClientStatus } from '../data/types';
import { PIPELINE_STEPS } from '../data/constants';

interface PipelineProgressProps {
  currentStatus: ClientStatus;
}

const PipelineProgress: React.FC<PipelineProgressProps> = ({ currentStatus }) => {
  const { t } = useLanguage();

  const currentIdx = PIPELINE_STEPS.findIndex((s) => s.key === currentStatus);

  return (
    <div>
      {/* Desktop horizontal */}
      <div className="hidden sm:flex items-center">
        {PIPELINE_STEPS.map((step, idx) => {
          const isPast = idx < currentIdx;
          const isCurrent = idx === currentIdx;

          return (
            <div key={step.key} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-all ${
                    isPast
                      ? 'bg-success-500 text-white'
                      : isCurrent
                      ? 'bg-brand-500 text-white animate-pulse'
                      : 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                  }`}
                >
                  {isPast ? (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    idx + 1
                  )}
                </div>
                <span
                  className={`mt-2 text-xs font-medium whitespace-nowrap ${
                    isPast
                      ? 'text-success-500'
                      : isCurrent
                      ? 'text-brand-500'
                      : 'text-gray-400 dark:text-gray-500'
                  }`}
                >
                  {t(`status.${step.key}`)}
                </span>
              </div>
              {idx < PIPELINE_STEPS.length - 1 && (
                <div
                  className={`mx-2 h-0.5 flex-1 ${
                    isPast ? 'bg-success-500' : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile vertical */}
      <div className="flex flex-col sm:hidden space-y-3">
        {PIPELINE_STEPS.map((step, idx) => {
          const isPast = idx < currentIdx;
          const isCurrent = idx === currentIdx;

          return (
            <div key={step.key} className="flex items-center gap-3">
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium ${
                    isPast
                      ? 'bg-success-500 text-white'
                      : isCurrent
                      ? 'bg-brand-500 text-white animate-pulse'
                      : 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                  }`}
                >
                  {isPast ? (
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    idx + 1
                  )}
                </div>
                {idx < PIPELINE_STEPS.length - 1 && (
                  <div
                    className={`w-0.5 h-3 mt-1 ${
                      isPast ? 'bg-success-500' : 'bg-gray-200 dark:bg-gray-700'
                    }`}
                  />
                )}
              </div>
              <span
                className={`text-sm font-medium ${
                  isPast
                    ? 'text-success-500'
                    : isCurrent
                    ? 'text-brand-500'
                    : 'text-gray-400 dark:text-gray-500'
                }`}
              >
                {t(`status.${step.key}`)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PipelineProgress;
