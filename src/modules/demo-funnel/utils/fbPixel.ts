/**
 * Facebook Pixel Utility
 * DSGVO-konform: Lädt nur nach Cookie-Consent
 */

const FB_PIXEL_ID = '1496553014661154';

// Declare fbq for TypeScript
declare global {
  interface Window {
    fbq: ((...args: unknown[]) => void) | undefined;
    _fbq: ((...args: unknown[]) => void) | undefined;
  }
}

// Check if marketing consent is given
export const hasMarketingConsent = (): boolean => {
  try {
    const consent = localStorage.getItem('cookieConsent');
    if (!consent) return false;
    const parsed = JSON.parse(consent);
    return parsed.marketing === true;
  } catch {
    return false;
  }
};

// Initialize FB Pixel (only call after consent!)
export const initFBPixel = (): void => {
  if (!hasMarketingConsent()) {
    console.log('[FB Pixel] No marketing consent - not loading');
    return;
  }

  // Check if already initialized
  if (typeof window.fbq === 'function') {
    console.log('[FB Pixel] Already initialized');
    return;
  }

  // FB Pixel base code
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const n: any = function (...args: unknown[]) {
    if (n.callMethod) {
      n.callMethod.apply(n, args);
    } else {
      n.queue.push(args);
    }
  };

  n.push = n;
  n.loaded = true;
  n.version = '2.0';
  n.queue = [] as unknown[];

  window._fbq = n;
  window.fbq = n;

  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://connect.facebook.net/en_US/fbevents.js';

  const firstScript = document.getElementsByTagName('script')[0];
  firstScript?.parentNode?.insertBefore(script, firstScript);

  // Initialize with Pixel ID
  if (window.fbq) {
    window.fbq('init', FB_PIXEL_ID);
    window.fbq('track', 'PageView');
  }

  console.log('[FB Pixel] Initialized with ID:', FB_PIXEL_ID);
};

// Track PageView (call on route change)
export const trackPageView = (): void => {
  if (!hasMarketingConsent() || typeof window.fbq !== 'function') return;
  window.fbq('track', 'PageView');
  console.log('[FB Pixel] PageView tracked');
};

// Track AddToCart (call on FormularPage)
export const trackAddToCart = (): void => {
  if (!hasMarketingConsent() || typeof window.fbq !== 'function') return;
  window.fbq('track', 'AddToCart', {
    content_name: 'Prozess-Analyse Anfrage',
    content_category: 'Lead Form',
    currency: 'EUR',
    value: 0
  });
  console.log('[FB Pixel] AddToCart tracked');
};

// Track Lead (call on DankePage)
export const trackLead = (): void => {
  if (!hasMarketingConsent() || typeof window.fbq !== 'function') return;
  window.fbq('track', 'Lead', {
    content_name: 'Prozess-Analyse Anfrage',
    content_category: 'Form Submission',
    currency: 'EUR',
    value: 0
  });
  console.log('[FB Pixel] Lead tracked');
};

// Track custom event
export const trackCustomEvent = (eventName: string, params?: Record<string, unknown>): void => {
  if (!hasMarketingConsent() || typeof window.fbq !== 'function') return;
  window.fbq('track', eventName, params);
  console.log('[FB Pixel] Custom event tracked:', eventName);
};
