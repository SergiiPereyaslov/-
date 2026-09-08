/**
 * Тонка обгортка над gtag.
 *
 * Скрипт GA завантажується лише після згоди користувача (див.
 * CookieConsent), тому будь-який виклик має бути безпечним, коли gtag
 * ще або взагалі не існує.
 */
import { AB_ENABLED, currentVariant, type AbMetric } from './ab';

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
  // Кожна подія несе мітку варіанта: без неї в GA4 неможливо розділити
  // конверсію двох навігацій, і тест стає марним.
  window.gtag('event', event, AB_ENABLED ? { ...params, nav_variant: currentVariant() } : params);
};

/**
 * Власний лічильник тесту. GA4 тут недостатньо: він вантажиться лише після
 * згоди на cookie, тобто рахував би не всіх, а самих лише згодних — і
 * вибірка перекосилася б. Цей лічильник агрегує тільки суми по варіанту
 * й дню, без жодного ідентифікатора відвідувача.
 */
const SESSION_KEY = 'sep-ab-hit';

const beacon = (metric: AbMetric) => {
  if (!AB_ENABLED || typeof window === 'undefined') return;
  const body = JSON.stringify({ variant: currentVariant(), metric });
  try {
    // sendBeacon не скасовується при переході на іншу сторінку — саме те,
    // що потрібно для події «пішов у каталог».
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/ab/', new Blob([body], { type: 'application/json' }));
      return;
    }
  } catch {
    /* падаємо у fetch нижче */
  }
  void fetch('/api/ab/', { method: 'POST', body, keepalive: true }).catch(() => {});
};

/** Рахує метрику не більше одного разу за сесію браузера. */
export const abOnce = (metric: AbMetric) => {
  if (!AB_ENABLED) return;
  try {
    const seen = sessionStorage.getItem(SESSION_KEY);
    const set = new Set(seen ? (JSON.parse(seen) as string[]) : []);
    if (set.has(metric)) return;
    set.add(metric);
    sessionStorage.setItem(SESSION_KEY, JSON.stringify([...set]));
  } catch {
    /* сховище недоступне — рахуємо без дедуплікації, це чесніше за пропуск */
  }
  beacon(metric);
};

/** Події, які реально аналізують: заявки, дзвінки, кроки до замовлення. */
export const events = {
  addToCart: (sku: string, name: string, packs: number, value: number) => {
    abOnce('cart');
    track('add_to_cart', { currency: 'UAH', value, items_sku: sku, item_name: name, quantity: packs });
  },

  beginCheckout: (value: number, items: number) =>
    track('begin_checkout', { currency: 'UAH', value, items }),

  lead: (kind: string, source: string, value?: number) =>
    track('generate_lead', { currency: 'UAH', lead_kind: kind, lead_source: source, value }),

  phoneClick: (place: string) => track('phone_click', { place }),

  messengerClick: (channel: string, place: string) => track('messenger_click', { channel, place }),

  search: (query: string, results: number) => {
    abOnce('search');
    track('search', { search_term: query, results });
  },
};
