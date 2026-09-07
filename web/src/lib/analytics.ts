/**
 * Тонка обгортка над gtag.
 *
 * Скрипт GA завантажується лише після згоди користувача (див.
 * CookieConsent), тому будь-який виклик має бути безпечним, коли gtag
 * ще або взагалі не існує.
 */
type GtagParams = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export const CONSENT_KEY = 'sep-analytics-consent';

export type Consent = 'unknown' | 'granted' | 'denied';

/**
 * Рішення про згоду живе в localStorage, тобто поза React. Читаємо його як
 * зовнішнє сховище (useSyncExternalStore), а не ефектом: інакше перший
 * рендер завжди показував би банер, навіть тим, хто вже відповів.
 */
const listeners = new Set<() => void>();
let consent: Consent = 'unknown';
let hydrated = false;

const emit = () => listeners.forEach((l) => l());

export const subscribeConsent = (cb: () => void) => {
  listeners.add(cb);
  if (!hydrated) {
    hydrated = true;
    try {
      const stored = localStorage.getItem(CONSENT_KEY);
      if (stored === 'granted' || stored === 'denied') {
        consent = stored;
        emit();
      }
    } catch {
      consent = 'denied';
      emit();
    }
  }
  return () => {
    listeners.delete(cb);
  };
};

export const getConsent = () => consent;
export const getServerConsent = (): Consent => 'unknown';

export const setConsent = (value: 'granted' | 'denied') => {
  consent = value;
  try {
    localStorage.setItem(CONSENT_KEY, value);
  } catch {
    /* сховище недоступне — рішення діє до перезавантаження */
  }
  emit();
};

export const hasConsent = () => consent === 'granted';

export const track = (event: string, params: GtagParams = {}) => {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;
  window.gtag('event', event, params);
};

/** Події, які реально аналізують: заявки, дзвінки, кроки до замовлення. */
export const events = {
  addToCart: (sku: string, name: string, packs: number, value: number) =>
    track('add_to_cart', { currency: 'UAH', value, items_sku: sku, item_name: name, quantity: packs }),

  beginCheckout: (value: number, items: number) =>
    track('begin_checkout', { currency: 'UAH', value, items }),

  lead: (kind: string, source: string, value?: number) =>
    track('generate_lead', { currency: 'UAH', lead_kind: kind, lead_source: source, value }),

  phoneClick: (place: string) => track('phone_click', { place }),

  messengerClick: (channel: string, place: string) => track('messenger_click', { channel, place }),

  search: (query: string, results: number) => track('search', { search_term: query, results }),
};
