import { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import type { Deliverable } from '../data/types';
import InputField from '../ui/form/input/InputField';
import TextArea from '../ui/form/input/TextArea';
import Label from '../ui/form/Label';
import Button from '../ui/components/button/Button';

interface DeliverableEditorProps {
  deliverable: Deliverable;
  editableContent: string;
  onChange: (content: string) => void;
}

// ---- Ad Fields ----
interface AdFields {
  primaryText: string;
  headline: string;
  description: string;
  ctaType: string;
  linkUrl: string;
}

function parseAdFields(content: string): AdFields {
  const stripped = (content || '').replace(/<[^>]*>/g, '');
  const lines = stripped.split('\n').filter((l) => l.trim());
  return {
    primaryText: lines[0] || '',
    headline: lines[1] || '',
    description: lines[2] || '',
    ctaType: 'Jetzt bewerben',
    linkUrl: '',
  };
}

function serializeAdFields(fields: AdFields): string {
  return `<p>${fields.primaryText}</p>\n<h3>${fields.headline}</h3>\n<p>${fields.description}</p>`;
}

// ---- Doc Fields ----
interface DocSection {
  heading: string;
  content: string;
}

interface DocFields {
  title: string;
  sections: DocSection[];
}

function parseDocFields(content: string, deliverableTitle: string): DocFields {
  const safeContent = content || '';
  const parts = safeContent.split(/<h[23][^>]*>/);
  const headings = safeContent.match(/<h[23][^>]*>(.*?)<\/h[23]>/g) || [];
  const sections: DocSection[] = [];

  for (let i = 0; i < headings.length; i++) {
    const heading = (headings[i] ?? '').replace(/<[^>]*>/g, '');
    const part = parts[i + 1];
    const sectionContent = part
      ? part.replace(/<\/h[23]>/, '').replace(/<[^>]*>/g, '').trim()
      : '';
    sections.push({ heading, content: sectionContent });
  }

  if (sections.length === 0) {
    const stripped = safeContent.replace(/<[^>]*>/g, '').trim();
    if (stripped) {
      sections.push({ heading: '', content: stripped });
    }
  }

  return {
    title: deliverableTitle,
    sections,
  };
}

function serializeDocFields(fields: DocFields): string {
  return fields.sections
    .map((s) => {
      const heading = s.heading ? `<h2>${s.heading}</h2>` : '';
      const content = s.content ? `<p>${s.content}</p>` : '';
      return heading + content;
    })
    .join('\n');
}

// ---- Campaign Fields ----
interface CampaignFields {
  campaignName: string;
  budgetPerDay: string;
  audience: string;
  placement: string;
}

function parseCampaignFields(content: string, deliverableTitle: string): CampaignFields {
  const stripped = (content || '').replace(/<[^>]*>/g, '');
  return {
    campaignName: deliverableTitle,
    budgetPerDay: '',
    audience: stripped || '',
    placement: 'Automatisch',
  };
}

function serializeCampaignFields(fields: CampaignFields): string {
  return `<h3>${fields.campaignName}</h3>\n<p>Budget/Tag: ${fields.budgetPerDay}\u20AC</p>\n<p>Zielgruppe: ${fields.audience}</p>\n<p>Placement: ${fields.placement}</p>`;
}

// ---- CTA Options ----
const CTA_OPTIONS = [
  'Jetzt bewerben',
  'Mehr erfahren',
  'Registrieren',
  'Herunterladen',
  'Kontakt aufnehmen',
];

const PLACEMENT_OPTIONS = [
  'Feed + Stories',
  'Nur Feed',
  'Automatisch',
];

// ---- Component ----
const DeliverableEditor: React.FC<DeliverableEditorProps> = ({
  deliverable,
  editableContent,
  onChange,
}) => {
  const { t } = useLanguage();

  if (!deliverable) return null;

  const isAd =
    deliverable.subtype?.includes('anzeigen') ||
    deliverable.type === 'ad_creative' ||
    deliverable.previewType === 'ad_feed';

  const isCampaign =
    deliverable.type === 'campaign' ||
    deliverable.previewType === 'campaign_table';

  // ---- AD EDITOR ----
  if (isAd) {
    return (
      <AdEditor
        content={editableContent}
        onChange={onChange}
        t={t}
      />
    );
  }

  // ---- CAMPAIGN EDITOR ----
  if (isCampaign) {
    return (
      <CampaignEditor
        content={editableContent}
        deliverableTitle={deliverable.title}
        onChange={onChange}
        t={t}
      />
    );
  }

  // ---- DOC EDITOR ----
  return (
    <DocEditor
      content={editableContent}
      deliverableTitle={deliverable.title}
      onChange={onChange}
      t={t}
    />
  );
};

export default DeliverableEditor;

// ==========================
// AD EDITOR SUB-COMPONENT
// ==========================
function AdEditor({
  content,
  onChange,
  t,
}: {
  content: string;
  onChange: (content: string) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}) {
  const [fields, setFields] = useState<AdFields>(() => parseAdFields(content));
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!initialized) {
      setFields(parseAdFields(content));
      setInitialized(true);
    }
  }, [content, initialized]);

  const updateField = useCallback(
    (key: keyof AdFields, value: string) => {
      setFields((prev) => {
        const next = { ...prev, [key]: value };
        onChange(serializeAdFields(next));
        return next;
      });
    },
    [onChange]
  );

  return (
    <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
      <div>
        <Label>{t('editor.primaryText')}</Label>
        <TextArea
          value={fields.primaryText}
          onChange={(val) => updateField('primaryText', val)}
          rows={3}
          placeholder={t('editor.primaryTextPlaceholder')}
        />
      </div>

      <div>
        <Label>{t('editor.headline')}</Label>
        <InputField
          type="text"
          value={fields.headline}
          onChange={(e) => updateField('headline', e.target.value)}
          placeholder={t('editor.headlinePlaceholder')}
        />
      </div>

      <div>
        <Label>{t('editor.description')}</Label>
        <InputField
          type="text"
          value={fields.description}
          onChange={(e) => updateField('description', e.target.value)}
          placeholder={t('editor.descriptionPlaceholder')}
        />
      </div>

      <div>
        <Label>{t('editor.ctaButton')}</Label>
        <select
          className="h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 pr-11 text-sm shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
          value={fields.ctaType}
          onChange={(e) => updateField('ctaType', e.target.value)}
        >
          {CTA_OPTIONS.map((opt) => (
            <option key={opt} value={opt} className="dark:bg-gray-900 dark:text-gray-400">
              {opt}
            </option>
          ))}
        </select>
      </div>

      <div>
        <Label>{t('editor.targetUrl')}</Label>
        <InputField
          type="text"
          value={fields.linkUrl}
          onChange={(e) => updateField('linkUrl', e.target.value)}
          placeholder="https://..."
        />
      </div>

      <div>
        <Label>{t('editor.image')}</Label>
        <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 py-8 dark:border-gray-700 dark:bg-gray-800/30">
          <div className="text-center">
            <svg className="mx-auto h-8 w-8 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 15l-5-5L5 21" />
            </svg>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              {t('editor.imageUploadHint')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================
// DOC EDITOR SUB-COMPONENT
// ==========================
function DocEditor({
  content,
  deliverableTitle,
  onChange,
  t,
}: {
  content: string;
  deliverableTitle: string;
  onChange: (content: string) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}) {
  const [fields, setFields] = useState<DocFields>(() =>
    parseDocFields(content, deliverableTitle)
  );
  const [docInitialized, setDocInitialized] = useState(false);

  useEffect(() => {
    if (!docInitialized) {
      setFields(parseDocFields(content, deliverableTitle));
      setDocInitialized(true);
    }
  }, [content, deliverableTitle, docInitialized]);

  const updateTitle = useCallback(
    (value: string) => {
      setFields((prev) => {
        const next = { ...prev, title: value };
        onChange(serializeDocFields(next));
        return next;
      });
    },
    [onChange]
  );

  const updateSection = useCallback(
    (index: number, key: keyof DocSection, value: string) => {
      setFields((prev) => {
        const sections = [...prev.sections];
        const existing = sections[index] ?? { heading: '', content: '' };
        sections[index] = { ...existing, [key]: value };
        const next = { ...prev, sections };
        onChange(serializeDocFields(next));
        return next;
      });
    },
    [onChange]
  );

  const addSection = useCallback(() => {
    setFields((prev) => {
      const next = { ...prev, sections: [...prev.sections, { heading: '', content: '' }] };
      onChange(serializeDocFields(next));
      return next;
    });
  }, [onChange]);

  return (
    <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
      <div>
        <Label>{t('editor.docTitle')}</Label>
        <InputField
          type="text"
          value={fields.title}
          onChange={(e) => updateTitle(e.target.value)}
          placeholder={t('editor.docTitlePlaceholder')}
        />
      </div>

      {fields.sections.map((section, i) => (
        <div key={i} className="space-y-2 rounded-lg border border-gray-100 bg-gray-50/50 p-3 dark:border-gray-800 dark:bg-gray-900/30">
          <div>
            <Label className="!text-xs">{t('editor.sectionHeading')}</Label>
            <InputField
              type="text"
              value={section.heading}
              onChange={(e) => updateSection(i, 'heading', e.target.value)}
              placeholder={t('editor.sectionHeadingPlaceholder')}
            />
          </div>
          <div>
            <Label className="!text-xs">{t('editor.sectionContent')}</Label>
            <TextArea
              value={section.content}
              onChange={(val) => updateSection(i, 'content', val)}
              rows={4}
              placeholder={t('editor.sectionContentPlaceholder')}
            />
          </div>
        </div>
      ))}

      <Button size="sm" variant="outline" onClick={addSection}>
        + {t('editor.addSection')}
      </Button>
    </div>
  );
}

// ==========================
// CAMPAIGN EDITOR SUB-COMPONENT
// ==========================
function CampaignEditor({
  content,
  deliverableTitle,
  onChange,
  t,
}: {
  content: string;
  deliverableTitle: string;
  onChange: (content: string) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}) {
  const [fields, setFields] = useState<CampaignFields>(() =>
    parseCampaignFields(content, deliverableTitle)
  );
  const [campInitialized, setCampInitialized] = useState(false);

  useEffect(() => {
    if (!campInitialized) {
      setFields(parseCampaignFields(content, deliverableTitle));
      setCampInitialized(true);
    }
  }, [content, deliverableTitle, campInitialized]);

  const updateField = useCallback(
    (key: keyof CampaignFields, value: string) => {
      setFields((prev) => {
        const next = { ...prev, [key]: value };
        onChange(serializeCampaignFields(next));
        return next;
      });
    },
    [onChange]
  );

  return (
    <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
      <div>
        <Label>{t('editor.campaignName')}</Label>
        <InputField
          type="text"
          value={fields.campaignName}
          onChange={(e) => updateField('campaignName', e.target.value)}
          placeholder={t('editor.campaignNamePlaceholder')}
        />
      </div>

      <div>
        <Label>{t('editor.budgetPerDay')}</Label>
        <InputField
          type="number"
          value={fields.budgetPerDay}
          onChange={(e) => updateField('budgetPerDay', e.target.value)}
          placeholder="0"
        />
      </div>

      <div>
        <Label>{t('editor.audience')}</Label>
        <TextArea
          value={fields.audience}
          onChange={(val) => updateField('audience', val)}
          rows={3}
          placeholder={t('editor.audiencePlaceholder')}
        />
      </div>

      <div>
        <Label>{t('editor.placement')}</Label>
        <select
          className="h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 pr-11 text-sm shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
          value={fields.placement}
          onChange={(e) => updateField('placement', e.target.value)}
        >
          {PLACEMENT_OPTIONS.map((opt) => (
            <option key={opt} value={opt} className="dark:bg-gray-900 dark:text-gray-400">
              {opt}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
