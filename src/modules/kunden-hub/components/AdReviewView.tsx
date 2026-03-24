import { useState, useCallback, useEffect } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { useNotification } from '../contexts/NotificationContext';
import { api } from '../services/api';
import type { AdFromAPI } from '../services/api';
import type { Deliverable } from '../data/types';
import PlatformSwitcher from './PlatformSwitcher';
import PlacementSwitcher from './PlacementSwitcher';
import AdPreview from './AdPreview';
import InputField from '../ui/form/input/InputField';
import TextArea from '../ui/form/input/TextArea';
import Label from '../ui/form/Label';
import Button from '../ui/components/button/Button';

interface AdReviewViewProps {
  deliverable: Deliverable;
  editableContent: string;
  onChange: (content: string) => void;
  onApprove?: () => void;
  onRequestChanges?: (comment: string) => void;
  adCategory?: string;
  clientId?: string;
}

// ---- Ad Fields ----
interface AdFields {
  primaryText: string;
  headline: string;
  description: string;
  ctaType: string;
  linkUrl: string;
  imageUrl: string;
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
    imageUrl: '',
  };
}

function mapApiAdToFields(ad: AdFromAPI): AdFields {
  return {
    primaryText: ad.body || '',
    headline: ad.headline || '',
    description: ad.name || '',
    ctaType: ad.cta || 'Jetzt bewerben',
    linkUrl: '',
    imageUrl: ad.image_url || '',
  };
}

function serializeAdFields(fields: AdFields): string {
  return `<p>${fields.primaryText}</p>\n<h3>${fields.headline}</h3>\n<p>${fields.description}</p>`;
}

const CTA_OPTIONS = [
  'Jetzt bewerben',
  'Mehr erfahren',
  'Registrieren',
  'Herunterladen',
  'Kontakt aufnehmen',
];

const PLACEMENT_PLATFORMS = ['facebook', 'instagram', 'tiktok'];

// Map ad category to allowed platforms + default
const CATEGORY_PLATFORMS: Record<string, { platforms: string[]; default: string }> = {
  meta_ads: { platforms: ['facebook', 'instagram'], default: 'facebook' },
  google_ads: { platforms: ['google'], default: 'google' },
  linkedin_ads: { platforms: ['linkedin'], default: 'linkedin' },
  tiktok_ads: { platforms: ['tiktok'], default: 'tiktok' },
};

const AdReviewView: React.FC<AdReviewViewProps> = ({
  deliverable,
  editableContent,
  onChange,
  onApprove,
  onRequestChanges,
  adCategory,
  clientId,
}) => {
  const { t } = useLanguage();
  const { notify } = useNotification();
  const catConfig = adCategory ? CATEGORY_PLATFORMS[adCategory] : undefined;
  const [activePlatform, setActivePlatform] = useState<string>(catConfig?.default ?? 'facebook');
  const [activePlacement, setActivePlacement] = useState<string>('feed');

  // API loading state
  const [isLoadingAds, setIsLoadingAds] = useState(false);
  const [apiAds, setApiAds] = useState<AdFromAPI[]>([]);
  const [activeAdId, setActiveAdId] = useState<string | null>(null);
  const [isSavingAd, setIsSavingAd] = useState(false);

  // Reset platform when category changes
  useEffect(() => {
    if (catConfig) {
      setActivePlatform(catConfig.default);
      setActivePlacement('feed');
    }
  }, [adCategory]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load real ad data from Meta API on mount
  useEffect(() => {
    if (!clientId) return;
    let cancelled = false;
    setIsLoadingAds(true);

    api.ads.list(clientId)
      .then((ads) => {
        if (cancelled) return;
        setApiAds(ads);
        if (ads.length > 0 && ads[0]) {
          setActiveAdId(ads[0].id);
          const mapped = mapApiAdToFields(ads[0]);
          setFields(mapped);
          onChange(serializeAdFields(mapped));
        }
      })
      .catch((err) => {
        if (cancelled) return;
        console.warn('[AdReviewView] API-Ads nicht verfuegbar, nutze Store-Daten:', err);
        // Fall back to store data (already initialized below)
      })
      .finally(() => {
        if (!cancelled) setIsLoadingAds(false);
      });

    return () => { cancelled = true; };
  }, [clientId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Initialize fields ONCE from content, then only update via user typing
  const [fields, setFields] = useState<AdFields>(() => parseAdFields(editableContent));
  const [initId, setInitId] = useState(deliverable?.id);

  // Re-initialize when deliverable changes (different item selected)
  useEffect(() => {
    if (deliverable && deliverable.id !== initId) {
      // If we have API ads, use those; otherwise parse from content
      const apiAd = apiAds.find((a) => a.id === deliverable.id);
      if (apiAd) {
        setFields(mapApiAdToFields(apiAd));
        setActiveAdId(apiAd.id);
      } else {
        setFields(parseAdFields(editableContent));
      }
      setInitId(deliverable.id);
    }
  }, [deliverable?.id]); // eslint-disable-line react-hooks/exhaustive-deps

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

  // Save ad changes to API
  const handleSaveAd = useCallback(async () => {
    if (!activeAdId) return;
    setIsSavingAd(true);
    try {
      await api.ads.update(activeAdId, {
        headline: fields.headline,
        body: fields.primaryText,
        cta: fields.ctaType,
        image_url: fields.imageUrl,
      });
      notify({
        id: `ad-save-${Date.now()}`,
        type: 'success',
        title: t('toast.adSaved'),
        message: t('toast.adSavedMeta'),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unbekannter Fehler';
      notify({
        id: `ad-save-error-${Date.now()}`,
        type: 'error',
        title: t('toast.adSaveFailed'),
        message,
      });
    } finally {
      setIsSavingAd(false);
    }
  }, [activeAdId, fields, notify, t]);

  if (!deliverable) return null;

  const showPlacement = PLACEMENT_PLATFORMS.includes(activePlatform);

  // Loading spinner while fetching from API
  if (isLoadingAds) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600 dark:border-gray-600 dark:border-t-gray-300" />
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {t('loading.title')}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pt-2">
      {/* Approval Header */}
      {onApprove && onRequestChanges && (
        <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{deliverable.title}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onApprove}
              className="flex items-center gap-1.5 rounded-full bg-blue-600 px-5 py-1.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              {t('approval.approve')}
            </button>
            <button
              onClick={() => onRequestChanges('')}
              className="rounded-full border border-red-300 bg-white px-4 py-1.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
            >
              {t('action.reject')}
            </button>
          </div>
        </div>
      )}

      {/* Ad selector (if multiple ads from API) */}
      {apiAds.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {apiAds.map((ad) => (
            <button
              key={ad.id}
              onClick={() => {
                setActiveAdId(ad.id);
                setFields(mapApiAdToFields(ad));
                onChange(serializeAdFields(mapApiAdToFields(ad)));
              }}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                activeAdId === ad.id
                  ? 'bg-brand-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              {ad.name || ad.headline || ad.id}
            </button>
          ))}
        </div>
      )}

    <div className="flex flex-col lg:flex-row gap-8">
      {/* Left: Live Preview (50%) */}
      <div className="lg:w-1/2 min-w-0 space-y-5">
        <div className="space-y-3">
          <PlatformSwitcher activePlatform={activePlatform} onChange={setActivePlatform} allowedPlatforms={catConfig?.platforms} />
          {showPlacement && (
            <PlacementSwitcher activePlacement={activePlacement} onChange={setActivePlacement} />
          )}
        </div>

        <div className="flex justify-center py-4">
          <div className="w-[375px]">
            <AdPreview
              content={fields.primaryText}
              title={deliverable.title}
              headline={fields.headline}
              description={fields.description}
              ctaText={fields.ctaType}
              profileName={deliverable.title}
              placement={activePlacement as 'feed' | 'story' | 'reel'}
              platform={activePlatform as 'facebook' | 'instagram' | 'google' | 'linkedin' | 'tiktok'}
            />
          </div>
        </div>
      </div>

      {/* Right: Edit Form (50%) */}
      <div className="lg:w-1/2 min-w-0">
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
            {fields.imageUrl ? (
              <div className="rounded-lg border border-gray-200 overflow-hidden dark:border-gray-700">
                <img src={fields.imageUrl} alt="Ad Creative" className="w-full h-auto object-cover max-h-48" />
              </div>
            ) : (
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
            )}
          </div>

          {/* Save button when editing API ad */}
          {activeAdId && (
            <div className="pt-2">
              <Button size="sm" variant="primary" onClick={handleSaveAd} disabled={isSavingAd} className="w-full">
                {isSavingAd ? (
                  <span className="flex items-center justify-center gap-1.5">
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    {t('action.saving')}
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-1.5">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    {t('action.saveAndPush')}
                  </span>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
    </div>
  );
};

export default AdReviewView;
