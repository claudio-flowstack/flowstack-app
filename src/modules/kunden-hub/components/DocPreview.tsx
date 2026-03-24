import { useLanguage } from '../i18n/LanguageContext';

interface DocPreviewProps {
  content: string;
  title: string;
}

const DocPreview: React.FC<DocPreviewProps> = ({ content, title }) => {
  const { t } = useLanguage();
  const menuItems = [
    t('gdoc.file'),
    t('gdoc.edit'),
    t('gdoc.view'),
    t('gdoc.insert'),
    t('gdoc.format'),
  ];

  return (
    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] overflow-hidden flex flex-col">
      {/* File tab bar - Google Docs style */}
      <div className="flex items-center gap-2.5 px-4 py-2.5 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
        {/* Doc icon */}
        <svg className="h-6 w-6 flex-shrink-0" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="2" width="18" height="20" rx="2" fill="#4285F4" />
          <path d="M7 8h10M7 12h10M7 16h6" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-800 dark:text-white/90 truncate">
            {(title || '').replace(/\s+/g, '-')}.docx
          </p>
        </div>
      </div>

      {/* Menu bar */}
      <div className="flex items-center gap-0.5 px-3 py-1.5 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
        {menuItems.map((item) => (
          <button
            key={item}
            className="px-2.5 py-1 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition"
          >
            {item}
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div
        className="flex flex-wrap items-center gap-0.5 px-3 py-1.5 border-b border-gray-100 dark:border-gray-800"
        style={{ backgroundColor: '#f9fbfd' }}
      >
        {/* Font selector */}
        <div className="flex items-center gap-1 rounded border border-gray-200 dark:border-gray-700 px-2 py-1 text-xs text-gray-600 dark:text-gray-400 mr-1">
          <span>Arial</span>
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>

        {/* Font size */}
        <div className="flex items-center gap-1 rounded border border-gray-200 dark:border-gray-700 px-2 py-1 text-xs text-gray-600 dark:text-gray-400 mr-2">
          <span>11</span>
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>

        {/* Divider */}
        <div className="mx-0.5 h-5 w-px bg-gray-200 dark:bg-gray-700" />

        {/* B I U S */}
        {[
          { label: 'B', style: 'font-bold' },
          { label: 'I', style: 'italic' },
          { label: 'U', style: 'underline' },
          { label: 'S', style: 'line-through' },
        ].map((btn) => (
          <button
            key={btn.label}
            className="flex h-7 w-7 items-center justify-center rounded text-xs text-[#444] dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <span className={btn.style}>{btn.label}</span>
          </button>
        ))}

        {/* Divider */}
        <div className="mx-0.5 h-5 w-px bg-gray-200 dark:bg-gray-700" />

        {/* Align Left */}
        <button className="flex h-7 w-7 items-center justify-center rounded text-[#444] dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M3 12h12M3 18h18" />
          </svg>
        </button>
        {/* Align Center */}
        <button className="flex h-7 w-7 items-center justify-center rounded text-[#444] dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M6 12h12M3 18h18" />
          </svg>
        </button>
        {/* Align Right */}
        <button className="flex h-7 w-7 items-center justify-center rounded text-[#444] dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M9 12h12M3 18h18" />
          </svg>
        </button>

        {/* Divider */}
        <div className="mx-0.5 h-5 w-px bg-gray-200 dark:bg-gray-700" />

        {/* Bullet list */}
        <button className="flex h-7 w-7 items-center justify-center rounded text-[#444] dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
          </svg>
        </button>
        {/* Numbered list */}
        <button className="flex h-7 w-7 items-center justify-center rounded text-[#444] dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 6h13M8 12h13M8 18h13" />
            <text x="1" y="8" fontSize="7" fill="currentColor" fontFamily="sans-serif">1</text>
            <text x="1" y="14" fontSize="7" fill="currentColor" fontFamily="sans-serif">2</text>
            <text x="1" y="20" fontSize="7" fill="currentColor" fontFamily="sans-serif">3</text>
          </svg>
        </button>
      </div>

      {/* Ruler */}
      <div className="h-5 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 relative overflow-hidden">
        <div className="absolute inset-0 flex items-end px-16">
          {Array.from({ length: 20 }, (_, i) => (
            <div key={i} className="flex-1 flex flex-col items-center">
              <div
                className={`w-px ${i % 5 === 0 ? 'h-2.5 bg-gray-400 dark:bg-gray-500' : 'h-1.5 bg-gray-300 dark:bg-gray-600'}`}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Paper area - gray background with white paper */}
      <div className="bg-[#f8f9fa] dark:bg-gray-900/70 p-6 sm:p-8 flex-1 min-h-[300px]">
        <div
          className="mx-auto max-w-[680px] bg-white dark:bg-gray-800/80 rounded shadow-md min-h-[400px] relative"
          style={{
            padding: '72px 72px 72px 72px',
            boxShadow: '0 1px 3px 0 rgba(60,64,67,0.15), 0 4px 8px 3px rgba(60,64,67,0.08)',
          }}
        >
          {/* Document content */}
          <div
            className="prose prose-sm dark:prose-invert max-w-none text-gray-800 dark:text-gray-200"
            style={{
              fontFamily: 'Arial, sans-serif',
              fontSize: '11pt',
              lineHeight: '1.5',
            }}
            dangerouslySetInnerHTML={{ __html: content || '' }}
          />
        </div>

        {/* Page footer */}
        <div className="mt-3 text-center">
          <span className="text-xs text-gray-400 dark:text-gray-500">
            1 {t('gdoc.pageOf')} 1
          </span>
        </div>
      </div>
    </div>
  );
};

export default DocPreview;
