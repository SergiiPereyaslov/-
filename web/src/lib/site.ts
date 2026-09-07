import type { Locale } from '@/data/types';

/**
 * Єдине джерело контактних даних. Використовується в шапці, підвалі,
 * на сторінці контактів і в JSON-LD — щоб NAP був консистентним скрізь
 * (вимога локального SEO).
 */
export const SITE = {
  name: 'SmartEcoPack',
  legalName: 'ТОВ «СМАРТЕКОПАК»',
  edrpou: '44664514',
  /** Замінити на бойовий домен перед запуском. */
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://smartecopack.com',
  email: 'sales@smartecopack.com',
  phones: ['+380502804050', '+380672806050'],
  telegram: 'https://t.me/smartecopack',
  viber: 'viber://chat?number=%2B380502804050',
  address: {
    street: 'пр. О. Поля, 82 г (літ. С-4), цокольний поверх',
    streetRu: 'пр. А. Поля, 82 г (лит. С-4), цокольный этаж',
    city: 'Дніпро',
    cityRu: 'Днепр',
    region: 'Дніпропетровська область',
    postalCode: '49000',
    country: 'UA',
    lat: 48.4396,
    lng: 35.0176,
  },
  hours: { uk: 'Пн–Пт 09:00–18:00, Сб–Нд — вихідні', ru: 'Пн–Пт 09:00–18:00, Сб–Вс — выходные' },
  /** Порогові значення, які фігурують у текстах і калькуляторі. */
  wholesaleFromPacks: 10,
  brandingMinUnits: 100,
  freeDeliveryCity: 'Дніпро',
  deliveryHours: 24,
} as const;

export const formatPhone = (raw: string) =>
  raw.replace(/^\+380(\d{2})(\d{3})(\d{2})(\d{2})$/, '+38 ($1) $2 $3 $4');

/** Канонічний абсолютний URL для метаданих і JSON-LD. */
export const canonical = (locale: Locale, path: string) => {
  const clean = path.startsWith('/') ? path : `/${path}`;
  return locale === 'uk' ? `${SITE.url}${clean}` : `${SITE.url}/ru${clean}`;
};

/** Внутрішнє посилання з урахуванням локалі. */
export const href = (locale: Locale, path: string) => {
  const clean = path.startsWith('/') ? path : `/${path}`;
  return locale === 'uk' ? clean : `/ru${clean}`;
};
