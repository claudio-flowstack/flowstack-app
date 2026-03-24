import { useState, useCallback, useMemo } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import type { Deliverable } from '../data/types';
import InputField from '../ui/form/input/InputField';
import TextArea from '../ui/form/input/TextArea';

interface WebsiteTextReviewViewProps {
  deliverable: Deliverable;
  editableContent: string;
  onChange: (content: string) => void;
}

interface SectionField {
  label: string;
  value: string;
}

interface Section {
  heading: string;
  fields: SectionField[];
}

function parseSectionsFromHtml(
  html: string,
  t: (key: string, params?: Record<string, string | number>) => string
): Section[] | null {
  if (!html || !html.trim()) return null;

  const parser = typeof DOMParser !== 'undefined' ? new DOMParser() : null;
  if (!parser) return null;

  try {
    const doc = parser.parseFromString(html, 'text/html');
    const headings = doc.querySelectorAll('h1, h2, h3');

    if (headings.length === 0) return null;

    const sections: Section[] = [];

    headings.forEach((heading) => {
      const headingText = (heading.textContent || '').trim();
      const fields: SectionField[] = [];

      let sibling = heading.nextElementSibling;
      let fieldIndex = 1;

      while (sibling && !['H1', 'H2', 'H3'].includes(sibling.tagName)) {
        const text = (sibling.textContent || '').trim();
        if (text) {
          // Try to detect label:value pattern
          const colonIdx = text.indexOf(':');
          if (colonIdx > 0 && colonIdx < 30) {
            fields.push({
              label: text.slice(0, colonIdx).trim(),
              value: text.slice(colonIdx + 1).trim(),
            });
          } else {
            fields.push({
              label: `${t('websiteText.field')} ${fieldIndex}`,
              value: text,
            });
          }
          fieldIndex++;
        }
        sibling = sibling.nextElementSibling;
      }

      if (fields.length > 0) {
        sections.push({ heading: headingText, fields });
      }
    });

    return sections.length > 0 ? sections : null;
  } catch {
    return null;
  }
}

function getDefaultSections(
  t: (key: string, params?: Record<string, string | number>) => string
): Section[] {
  return [
    {
      heading: t('websiteText.heroSection'),
      fields: [
        { label: t('websiteText.headline'), value: '' },
        { label: t('websiteText.subheadline'), value: '' },
        { label: t('websiteText.ctaText'), value: '' },
      ],
    },
    {
      heading: t('websiteText.benefits'),
      fields: [
        { label: `${t('websiteText.benefit')} 1`, value: '' },
        { label: `${t('websiteText.benefit')} 2`, value: '' },
        { label: `${t('websiteText.benefit')} 3`, value: '' },
        { label: `${t('websiteText.benefit')} 4`, value: '' },
      ],
    },
    {
      heading: t('websiteText.teamSection'),
      fields: [
        { label: t('websiteText.headline'), value: '' },
        { label: t('websiteText.description'), value: '' },
      ],
    },
    {
      heading: t('websiteText.testimonials'),
      fields: [
        { label: `${t('websiteText.quote')} 1`, value: '' },
        { label: `${t('websiteText.quote')} 2`, value: '' },
      ],
    },
    {
      heading: t('websiteText.ctaSection'),
      fields: [
        { label: t('websiteText.headline'), value: '' },
        { label: t('websiteText.ctaText'), value: '' },
      ],
    },
  ];
}

function serializeSections(sections: Section[]): string {
  return sections
    .map((section) => {
      const heading = `<h2>${section.heading}</h2>`;
      const fields = section.fields
        .map((f) => `<p>${f.label}: ${f.value}</p>`)
        .join('\n');
      return `${heading}\n${fields}`;
    })
    .join('\n');
}

const WebsiteTextReviewView: React.FC<WebsiteTextReviewViewProps> = ({
  deliverable,
  editableContent,
  onChange,
}) => {
  const { t } = useLanguage();

  const initialSections = useMemo(() => {
    const parsed = parseSectionsFromHtml(editableContent, t);
    return parsed || getDefaultSections(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [sections, setSections] = useState<Section[]>(initialSections);
  const [openIndices, setOpenIndices] = useState<Set<number>>(() => new Set([0]));
  const [fallbackMode, setFallbackMode] = useState(false);

  // Check if content could not be parsed and has actual content
  const cannotParse = useMemo(() => {
    if (!editableContent || !editableContent.trim()) return false;
    const parsed = parseSectionsFromHtml(editableContent, t);
    return parsed === null && editableContent.replace(/<[^>]*>/g, '').trim().length > 0;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleSection = useCallback((index: number) => {
    setOpenIndices((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }, []);

  const updateField = useCallback(
    (sectionIndex: number, fieldIndex: number, value: string) => {
      setSections((prev) => {
        const next = prev.map((section, si) => {
          if (si !== sectionIndex) return section;
          const fields = section.fields.map((f, fi) => {
            if (fi !== fieldIndex) return f;
            return { ...f, value };
          });
          return { ...section, fields };
        });
        onChange(serializeSections(next));
        return next;
      });
    },
    [onChange]
  );

  const handleFallbackChange = useCallback(
    (value: string) => {
      onChange(value);
    },
    [onChange]
  );

  // Fallback: single textarea for unparseable content
  if (cannotParse && fallbackMode) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {deliverable.title}
          </h3>
          <button
            onClick={() => setFallbackMode(false)}
            className="text-xs text-brand-500 hover:text-brand-600 dark:text-brand-400"
          >
            {t('websiteText.structuredView')}
          </button>
        </div>
        <TextArea
          value={editableContent}
          onChange={handleFallbackChange}
          rows={16}
          placeholder={t('editor.sectionContentPlaceholder')}
        />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {sections.map((section, sectionIndex) => {
        const isOpen = openIndices.has(sectionIndex);
        return (
          <div
            key={sectionIndex}
            className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] overflow-hidden"
          >
            {/* Accordion header */}
            <button
              onClick={() => toggleSection(sectionIndex)}
              className="flex w-full items-center justify-between p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 rounded-lg transition"
            >
              <div className="flex items-center gap-3">
                <svg
                  className={`h-4 w-4 text-gray-400 dark:text-gray-500 transition-transform duration-200 ${
                    isOpen ? 'rotate-90' : ''
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
                <span className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {section.heading}
                </span>
              </div>
              {!isOpen && (
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  {section.fields.length} {t('websiteText.entries')}
                </span>
              )}
            </button>

            {/* Accordion body */}
            {isOpen && (
              <div className="px-4 pb-4 space-y-3">
                {section.fields.map((field, fieldIndex) => {
                  const isLongText = field.value.length > 80;
                  return (
                    <div key={fieldIndex}>
                      <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        {field.label}
                      </label>
                      {isLongText ? (
                        <TextArea
                          value={field.value}
                          onChange={(val) => updateField(sectionIndex, fieldIndex, val)}
                          rows={3}
                          placeholder={field.label}
                        />
                      ) : (
                        <InputField
                          type="text"
                          value={field.value}
                          onChange={(e) => updateField(sectionIndex, fieldIndex, e.target.value)}
                          placeholder={field.label}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {/* Switch to raw mode if content could not be parsed */}
      {cannotParse && (
        <button
          onClick={() => setFallbackMode(true)}
          className="mt-2 text-xs text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition"
        >
          {t('docReview.editMode')}
        </button>
      )}
    </div>
  );
};

export default WebsiteTextReviewView;
