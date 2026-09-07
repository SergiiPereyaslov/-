import raw from '@/data/products.json';
import { CATEGORIES, CATEGORY_BY_SLUG, GROUPS, GROUP_BY_SLUG } from '@/data/taxonomy';
import type { Category, Group, Locale, Product } from '@/data/types';

export const PRODUCTS = raw as unknown as Product[];

const BY_SLUG = new Map(PRODUCTS.map((p) => [p.slug, p]));
const BY_CATEGORY = new Map<string, Product[]>();
for (const p of PRODUCTS) {
  const list = BY_CATEGORY.get(p.category);
  if (list) list.push(p);
  else BY_CATEGORY.set(p.category, [p]);
}

export const getProduct = (slug: string) => BY_SLUG.get(slug);
export const getCategory = (slug: string) => CATEGORY_BY_SLUG.get(slug);
export const getGroup = (slug: string) => GROUP_BY_SLUG.get(slug);
export const productsOfCategory = (slug: string) => BY_CATEGORY.get(slug) ?? [];

export const productsOfGroup = (groupSlug: string) => {
  const group = GROUP_BY_SLUG.get(groupSlug);
  if (!group) return [];
  return group.categories.flatMap((c) => productsOfCategory(c));
};

export const groupOfCategory = (categorySlug: string): Group | undefined => {
  const category = CATEGORY_BY_SLUG.get(categorySlug);
  return category ? GROUP_BY_SLUG.get(category.group) : undefined;
};

/**
 * Слаг під /catalog/ може бути групою або категорією — простір імен спільний.
 * Ця функція вирішує, що саме запитали.
 */
export type CatalogNode =
  | { kind: 'group'; group: Group }
  | { kind: 'category'; category: Category }
  | { kind: 'none' };

export const resolveCatalogSlug = (slug: string): CatalogNode => {
  const group = GROUP_BY_SLUG.get(slug);
  if (group) return { kind: 'group', group };
  const category = CATEGORY_BY_SLUG.get(slug);
  if (category) return { kind: 'category', category };
  return { kind: 'none' };
};

/** Найнижча ціна категорії — для мета-описів «від N грн». */
export const priceFrom = (products: Product[]) =>
  products.length ? Math.min(...products.map((p) => p.priceRetail)) : 0;

/** Оптова ціна за штуку для заданої кількості пачок. */
export const unitPriceFor = (product: Product, packs: number) => {
  let price = product.priceRetail;
  for (const tier of product.tiers) if (packs >= tier.minPacks) price = tier.perUnit;
  return price;
};

/** Наступний оптовий поріг — для підказки «додайте ще N пачок». */
export const nextTier = (product: Product, packs: number) =>
  product.tiers.find((t) => packs < t.minPacks);

export const packPrice = (product: Product, packs: number) =>
  unitPriceFor(product, packs) * product.unitsPerPack;

/** Фільтрація за обраними фасетами: { volume: ['340','400'] }. */
export const filterProducts = (products: Product[], selected: Record<string, string[]>) => {
  const active = Object.entries(selected).filter(([, v]) => v.length > 0);
  if (!active.length) return products;
  return products.filter((p) => active.every(([key, values]) => values.includes(p.facets[key])));
};

/** Скільки товарів дасть кожне значення фасета — для лічильників у фільтрі. */
export const facetCounts = (products: Product[], key: string) => {
  const counts: Record<string, number> = {};
  for (const p of products) {
    const v = p.facets[key];
    if (v) counts[v] = (counts[v] ?? 0) + 1;
  }
  return counts;
};

export type SortKey = 'popular' | 'price-asc' | 'price-desc' | 'name';

export const sortProducts = (products: Product[], key: SortKey) => {
  const out = [...products];
  switch (key) {
    case 'price-asc':
      return out.sort((a, b) => a.priceRetail - b.priceRetail);
    case 'price-desc':
      return out.sort((a, b) => b.priceRetail - a.priceRetail);
    case 'name':
      return out.sort((a, b) => a.name.uk.localeCompare(b.name.uk, 'uk'));
    default:
      return out.sort((a, b) => Number(b.featured ?? false) - Number(a.featured ?? false));
  }
};

/**
 * Пошук по назві, артикулу й числовому розміру.
 * Запит «340» має знаходити всі стакани 340 мл — це основний сценарій
 * аудиторії, яка шукає конкретний розмір.
 */
export const searchProducts = (query: string, locale: Locale, limit = 8) => {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  return PRODUCTS.filter((p) => {
    const haystack = [
      p.name[locale],
      p.sku,
      p.spec[locale],
      ...Object.values(p.facets),
    ]
      .join(' ')
      .toLowerCase();
    return haystack.includes(q);
  }).slice(0, limit);
};

export const featuredProducts = (limit = 8) =>
  PRODUCTS.filter((p) => p.featured).slice(0, limit);

export { CATEGORIES, GROUPS };
