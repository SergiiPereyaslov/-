import { cache } from 'react';
import { prisma } from './db';
import type { Category, Facet, FaqItem, Group, L, Locale, Product, ProductShape } from '@/data/types';

/**
 * Доступ до каталогу.
 *
 * Джерело даних — PostgreSQL, але назовні віддаються ті самі доменні типи,
 * що й раніше (Product, Category, Group), тому компоненти нічого не знають
 * про Prisma. Гроші з БД приходять як Decimal і тут перетворюються на number:
 * інакше їх не можна передати в клієнтський компонент.
 *
 * Сторінки генеруються статично; після правок в адмінці викликається
 * revalidatePath, тому окремий шар кешування не потрібен — React cache()
 * лише прибирає повторні запити в межах одного рендера.
 */

type Money = { toString(): string };
const money = (v: Money) => Number(v.toString());

const pair = (uk: string, ru: string): L => ({ uk, ru });

/* ── Мапери ──────────────────────────────────────────────────────────── */

type ProductRow = Awaited<ReturnType<typeof prisma.product.findMany>>[number];
type CategoryRow = Awaited<ReturnType<typeof prisma.category.findMany>>[number];
type GroupRow = Awaited<ReturnType<typeof prisma.group.findMany>>[number];

const toProduct = (r: ProductRow): Product => ({
  slug: r.slug,
  sku: r.sku,
  category: r.categorySlug,
  name: pair(r.nameUk, r.nameRu),
  spec: pair(r.specUk, r.specRu),
  description: pair(r.descriptionUk, r.descriptionRu),
  attributes: r.attributes as unknown as Product['attributes'],
  facets: r.facets as unknown as Record<string, string>,
  unitsPerPack: r.unitsPerPack,
  priceRetail: money(r.priceRetail),
  tiers: r.tiers as unknown as Product['tiers'],
  inStock: r.inStock,
  brandable: r.brandable,
  featured: r.featured,
  shape: r.shape as ProductShape,
  ...(r.lidDiameter !== null ? { lidDiameter: r.lidDiameter } : {}),
  ...(r.image ? { image: r.image } : {}),
});

const toCategory = (r: CategoryRow): Category => ({
  slug: r.slug,
  group: r.groupSlug,
  name: pair(r.nameUk, r.nameRu),
  h1: pair(r.h1Uk, r.h1Ru),
  intro: pair(r.introUk, r.introRu),
  seo: r.seo as unknown as L[],
  faq: r.faq as unknown as FaqItem[],
  facets: r.facets as unknown as Facet[],
});

const toGroup = (r: GroupRow & { categories?: { slug: string }[] }): Group => ({
  slug: r.slug,
  name: pair(r.nameUk, r.nameRu),
  h1: pair(r.h1Uk, r.h1Ru),
  intro: pair(r.introUk, r.introRu),
  seo: r.seo as unknown as L[],
  categories: (r.categories ?? []).map((c) => c.slug),
});

/* ── Читання ─────────────────────────────────────────────────────────── */

export const getGroups = cache(async (): Promise<Group[]> => {
  const rows = await prisma.group.findMany({
    orderBy: { sortOrder: 'asc' },
    include: { categories: { orderBy: { sortOrder: 'asc' }, select: { slug: true } } },
  });
  return rows.map(toGroup);
});

export const getCategories = cache(async (): Promise<Category[]> => {
  const rows = await prisma.category.findMany({ orderBy: { sortOrder: 'asc' } });
  return rows.map(toCategory);
});

export const getAllProducts = cache(async (): Promise<Product[]> => {
  const rows = await prisma.product.findMany({ orderBy: { sortOrder: 'asc' } });
  return rows.map(toProduct);
});

export const getGroup = cache(async (slug: string): Promise<Group | undefined> => {
  const row = await prisma.group.findUnique({
    where: { slug },
    include: { categories: { orderBy: { sortOrder: 'asc' }, select: { slug: true } } },
  });
  return row ? toGroup(row) : undefined;
});

export const getCategory = cache(async (slug: string): Promise<Category | undefined> => {
  const row = await prisma.category.findUnique({ where: { slug } });
  return row ? toCategory(row) : undefined;
});

export const getProduct = cache(async (slug: string): Promise<Product | undefined> => {
  const row = await prisma.product.findUnique({ where: { slug } });
  return row ? toProduct(row) : undefined;
});

export const productsOfCategory = cache(async (slug: string): Promise<Product[]> => {
  const rows = await prisma.product.findMany({
    where: { categorySlug: slug },
    orderBy: [{ featured: 'desc' }, { sortOrder: 'asc' }],
  });
  return rows.map(toProduct);
});

export const productsOfGroup = cache(async (groupSlug: string): Promise<Product[]> => {
  const rows = await prisma.product.findMany({
    where: { category: { groupSlug } },
    orderBy: [{ featured: 'desc' }, { sortOrder: 'asc' }],
  });
  return rows.map(toProduct);
});

export const featuredProducts = cache(async (limit = 8): Promise<Product[]> => {
  const rows = await prisma.product.findMany({
    where: { featured: true, inStock: true },
    orderBy: { sortOrder: 'asc' },
    take: limit,
  });
  return rows.map(toProduct);
});

/** Сумісні позиції за діаметром вінця: стакан ↔ кришка. */
export const compatibleProducts = cache(async (product: Product): Promise<Product[]> => {
  if (!product.lidDiameter) return [];
  const opposite = product.shape === 'lid' ? 'cup' : product.shape === 'cup' ? 'lid' : null;
  if (!opposite) return [];
  const rows = await prisma.product.findMany({
    where: { lidDiameter: product.lidDiameter, shape: opposite },
    orderBy: { sortOrder: 'asc' },
    take: 4,
  });
  return rows.map(toProduct);
});

export const groupOfCategory = cache(async (categorySlug: string): Promise<Group | undefined> => {
  const category = await prisma.category.findUnique({ where: { slug: categorySlug } });
  return category ? getGroup(category.groupSlug) : undefined;
});

/**
 * Слаг під /catalog/ може бути групою або категорією — простір імен спільний.
 */
export type CatalogNode =
  | { kind: 'group'; group: Group }
  | { kind: 'category'; category: Category }
  | { kind: 'none' };

export const resolveCatalogSlug = cache(async (slug: string): Promise<CatalogNode> => {
  const group = await getGroup(slug);
  if (group) return { kind: 'group', group };
  const category = await getCategory(slug);
  if (category) return { kind: 'category', category };
  return { kind: 'none' };
});

/**
 * Пошук по назві, артикулу й числовому розміру.
 * Запит «340» має знаходити всі стакани 340 мл — основний сценарій
 * аудиторії, яка шукає конкретний розмір.
 */
export const searchProducts = async (
  query: string,
  locale: Locale,
  limit = 8,
): Promise<Product[]> => {
  const q = query.trim();
  if (q.length < 2) return [];

  const nameField = locale === 'uk' ? 'nameUk' : 'nameRu';
  const specField = locale === 'uk' ? 'specUk' : 'specRu';

  const rows = await prisma.product.findMany({
    where: {
      OR: [
        { [nameField]: { contains: q, mode: 'insensitive' } },
        { [specField]: { contains: q, mode: 'insensitive' } },
        { sku: { contains: q, mode: 'insensitive' } },
      ],
    },
    orderBy: [{ featured: 'desc' }, { sortOrder: 'asc' }],
    take: limit,
  });
  return rows.map(toProduct);
};

/* ── Обчислення над цінами (чисті функції, без БД) ───────────────────── */

export const priceFrom = (products: Product[]) =>
  products.length ? Math.min(...products.map((p) => p.priceRetail)) : 0;

export const unitPriceFor = (product: Product, packs: number) => {
  let price = product.priceRetail;
  for (const tier of product.tiers) if (packs >= tier.minPacks) price = tier.perUnit;
  return price;
};

export const nextTier = (product: Product, packs: number) =>
  product.tiers.find((t) => packs < t.minPacks);

export const packPrice = (product: Product, packs: number) =>
  unitPriceFor(product, packs) * product.unitsPerPack;

export const filterProducts = (products: Product[], selected: Record<string, string[]>) => {
  const active = Object.entries(selected).filter(([, v]) => v.length > 0);
  if (!active.length) return products;
  return products.filter((p) => active.every(([key, values]) => values.includes(p.facets[key])));
};
