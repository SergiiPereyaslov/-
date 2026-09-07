export const LOCALES = ['uk', 'ru'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'uk';

/** Рядок у двох мовах. Усі тексти каталогу зберігаються так. */
export type L = Record<Locale, string>;

export interface FacetValue {
  /** Технічне значення, за яким фільтруються товари. */
  value: string;
  /** Сегмент URL для індексованої посадкової: /catalog/stakany-paperovi/340-ml/ */
  slug: string;
  label: L;
}

export interface Facet {
  key: string;
  label: L;
  values: FacetValue[];
  /**
   * true — значення цього фасета мають власні URL і потрапляють у sitemap.
   * Решта комбінацій лишається noindex з canonical на категорію.
   */
  indexed?: boolean;
}

export interface FaqItem {
  q: L;
  a: L;
}

export interface Category {
  slug: string;
  group: string;
  name: L;
  h1: L;
  /** 1–2 речення під H1. */
  intro: L;
  /** Абзаци SEO-тексту під сіткою товарів. */
  seo: L[];
  faq: FaqItem[];
  facets: Facet[];
}

export interface Group {
  slug: string;
  name: L;
  h1: L;
  intro: L;
  seo: L[];
  /** Слаги категорій у порядку відображення. */
  categories: string[];
}

export interface PriceTier {
  /** Мінімальна кількість пачок для цієї ціни. */
  minPacks: number;
  /** Ціна за штуку, грн. */
  perUnit: number;
}

export interface Product {
  slug: string;
  sku: string;
  category: string;
  name: L;
  /** Ключовий параметр для картки в сітці: «340 мл», «320×200×370 мм». */
  spec: L;
  description: L;
  /** Пари «характеристика — значення». */
  attributes: { label: L; value: L }[];
  /** Значення фасетів: { volume: '340', color: 'kraft' }. */
  facets: Record<string, string>;
  unitsPerPack: number;
  /** Роздрібна ціна за штуку, грн. */
  priceRetail: number;
  /** Оптові щаблі, від дешевшого порогу до більшого. */
  tiers: PriceTier[];
  inStock: boolean;
  brandable: boolean;
  featured?: boolean;
  /** Слаги сумісних товарів (стакан ↔ кришка). */
  compatibleWith?: string[];
  /** Силует для заглушки зображення, поки немає фото. */
  shape?: ProductShape;
  /** Діаметр вінця (стакан) або самої кришки — основа сумісності. */
  lidDiameter?: number;
  image?: string;
}

export type ProductShape =
  | 'cup'
  | 'lid'
  | 'sleeve'
  | 'holder'
  | 'straw'
  | 'box'
  | 'round'
  | 'bag'
  | 'flat';
