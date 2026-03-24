import { useMemo } from 'react';
import { useLanguage } from '../i18n/LanguageContext';

interface WebsitePreviewProps {
  content: string;
  title: string;
  url?: string;
}

function extractSections(html: string): { headline: string; subheadline: string; cta: string; sections: string[] } {
  const parser = typeof DOMParser !== 'undefined' ? new DOMParser() : null;
  let headline = '';
  let subheadline = '';
  let cta = '';
  const sections: string[] = [];

  if (parser && (html || '').trim()) {
    try {
      const doc = parser.parseFromString(html, 'text/html');
      const headings = doc.querySelectorAll('h1, h2, h3');
      const paragraphs = doc.querySelectorAll('p');

      if (headings.length > 0) {
        headline = headings[0]!.textContent || '';
      }
      if (paragraphs.length > 0) {
        subheadline = paragraphs[0]!.textContent || '';
      }
      if (headings.length > 1) {
        for (let i = 1; i < headings.length; i++) {
          sections.push(headings[i]!.textContent || '');
        }
      }
    } catch {
      // fallback
    }
  }

  if (!headline) headline = 'Willkommen';
  if (!subheadline) subheadline = 'Entdecken Sie unsere Leistungen';
  if (!cta) cta = 'Jetzt bewerben';

  return { headline, subheadline, cta, sections };
}

const WebsitePreview: React.FC<WebsitePreviewProps> = ({ content, title, url }) => {
  const { t } = useLanguage();
  const displayUrl = url || 'karriere.firma.de';

  const { headline, subheadline, cta, sections } = useMemo(
    () => extractSections(content || ''),
    [content]
  );

  return (
    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] overflow-hidden flex flex-col">
      {/* Browser chrome */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        {/* Traffic lights */}
        <div className="flex items-center gap-1.5 mr-3">
          <span className="h-3 w-3 rounded-full bg-[#FF5F57]" />
          <span className="h-3 w-3 rounded-full bg-[#FFBD2E]" />
          <span className="h-3 w-3 rounded-full bg-[#28C840]" />
        </div>

        {/* Nav buttons */}
        <div className="flex items-center gap-1 mr-2 text-gray-400 dark:text-gray-500">
          <button className="p-0.5 hover:text-gray-600 dark:hover:text-gray-300">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button className="p-0.5 hover:text-gray-600 dark:hover:text-gray-300">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <button className="p-0.5 hover:text-gray-600 dark:hover:text-gray-300">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>

        {/* Address bar */}
        <div className="flex-1 flex items-center gap-2 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-sm">
          {/* Lock icon */}
          <svg className="h-3.5 w-3.5 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <span className="text-gray-600 dark:text-gray-400 truncate text-xs">
            {displayUrl}
          </span>
        </div>
      </div>

      {/* Website content */}
      <div className="bg-white dark:bg-gray-900 min-h-[400px]">
        {/* Navigation bar */}
        <nav className="flex items-center justify-between px-6 py-3 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded bg-brand-500 flex items-center justify-center">
              <span className="text-white text-xs font-bold">F</span>
            </div>
            <span className="text-sm font-semibold text-gray-800 dark:text-white/90">
              {(title || '').split(' ')[0] || 'Firma'}
            </span>
          </div>
          <div className="flex items-center gap-5 text-xs text-gray-500 dark:text-gray-400">
            <span className="hover:text-gray-700 dark:hover:text-gray-200 cursor-default">Home</span>
            <span className="hover:text-gray-700 dark:hover:text-gray-200 cursor-default">Jobs</span>
            <span className="hover:text-gray-700 dark:hover:text-gray-200 cursor-default">{t('web.aboutUs')}</span>
            <span className="hover:text-gray-700 dark:hover:text-gray-200 cursor-default">{t('web.contact')}</span>
          </div>
        </nav>

        {/* Hero section */}
        <div className="relative overflow-hidden">
          <div className="bg-gradient-to-br from-brand-500 to-brand-700 dark:from-brand-600 dark:to-brand-800 px-6 py-12 sm:py-16 text-center">
            <h1 className="text-xl sm:text-2xl font-bold text-white mb-3 max-w-md mx-auto leading-tight">
              {headline}
            </h1>
            <p className="text-sm text-white/80 mb-6 max-w-sm mx-auto">
              {subheadline}
            </p>
            <button className="inline-flex items-center gap-2 rounded-full bg-white text-brand-600 px-6 py-2.5 text-sm font-semibold hover:bg-gray-50 transition shadow-lg">
              {cta}
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          </div>
        </div>

        {/* Benefits section */}
        <div className="px-6 py-8">
          <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto">
            {[
              { icon: 'check', label: t('web.benefit1') },
              { icon: 'team', label: t('web.benefit2') },
              { icon: 'grow', label: t('web.benefit3') },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="mx-auto mb-2 h-10 w-10 rounded-full bg-brand-50 dark:bg-brand-500/10 flex items-center justify-center">
                  {item.icon === 'check' && (
                    <svg className="h-5 w-5 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  {item.icon === 'team' && (
                    <svg className="h-5 w-5 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                  {item.icon === 'grow' && (
                    <svg className="h-5 w-5 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  )}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Content sections */}
        {sections.length > 0 && (
          <div className="px-6 pb-6">
            <div className="border-t border-gray-100 dark:border-gray-800 pt-6">
              <div className="flex flex-wrap gap-3 justify-center">
                {sections.slice(0, 4).map((sec, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-3 text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50"
                  >
                    {sec}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-gray-100 dark:border-gray-800 px-6 py-3 text-center">
          <p className="text-[10px] text-gray-400 dark:text-gray-500">
            &copy; 2026 {(title || '').split(' ')[0] || 'Firma'} &middot; {t('web.privacy')} &middot; {t('web.imprint')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default WebsitePreview;
