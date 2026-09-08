import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { GROUPS, CATEGORIES } from '../src/data/taxonomy.ts';
import { POSTS } from '../src/data/posts.ts';
import type { Product } from '../src/data/types.ts';
import { buildSearchText } from '../src/lib/search-text.ts';

/**
 * Початкове наповнення БД із файлів-джерел.
 *
 * taxonomy.ts, posts.ts і products.json лишаються сідом, а не runtime-джерелом:
 * після сідування правки робляться в адмінці. Скрипт ідемпотентний —
 * повторний запуск оновлює наявні записи, не створюючи дублів.
 */
const ROOT = dirname(fileURLToPath(import.meta.url));
const products = JSON.parse(
  readFileSync(resolve(ROOT, '../src/data/products.json'), 'utf8'),
) as Product[];

/** Prisma не приймає доменні типи в Json-поля — потрібне явне приведення. */
const json = (v: unknown) => v as never;

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL ?? '' }),
});

const main = async () => {
  for (const [i, g] of GROUPS.entries()) {
    const data = {
      nameUk: g.name.uk,
      nameRu: g.name.ru,
      h1Uk: g.h1.uk,
      h1Ru: g.h1.ru,
      introUk: g.intro.uk,
      introRu: g.intro.ru,
      seo: json(g.seo),
      sortOrder: i,
    };
    await prisma.group.upsert({ where: { slug: g.slug }, create: { slug: g.slug, ...data }, update: data });
  }
  console.log(`групи: ${GROUPS.length}`);

  for (const [i, c] of CATEGORIES.entries()) {
    const data = {
      groupSlug: c.group,
      nameUk: c.name.uk,
      nameRu: c.name.ru,
      h1Uk: c.h1.uk,
      h1Ru: c.h1.ru,
      introUk: c.intro.uk,
      introRu: c.intro.ru,
      seo: json(c.seo),
      faq: json(c.faq),
      facets: json(c.facets),
      sortOrder: i,
    };
    await prisma.category.upsert({ where: { slug: c.slug }, create: { slug: c.slug, ...data }, update: data });
  }
  console.log(`категорії: ${CATEGORIES.length}`);

  for (const [i, p] of products.entries()) {
    const data = {
      sku: p.sku,
      categorySlug: p.category,
      nameUk: p.name.uk,
      nameRu: p.name.ru,
      specUk: p.spec.uk,
      specRu: p.spec.ru,
      descriptionUk: p.description.uk,
      descriptionRu: p.description.ru,
      attributes: json(p.attributes),
      facets: json(p.facets),
      unitsPerPack: p.unitsPerPack,
      priceRetail: p.priceRetail,
      tiers: json(p.tiers),
      inStock: p.inStock,
      brandable: p.brandable,
      featured: p.featured ?? false,
      shape: p.shape ?? 'box',
      lidDiameter: p.lidDiameter ?? null,
      image: p.image ?? null,
      searchText: buildSearchText({
        nameUk: p.name.uk,
        nameRu: p.name.ru,
        sku: p.sku,
        specUk: p.spec.uk,
        specRu: p.spec.ru,
        facets: p.facets,
      }),
      sortOrder: i,
    };
    await prisma.product.upsert({ where: { slug: p.slug }, create: { slug: p.slug, ...data }, update: data });
  }
  console.log(`товари: ${products.length}`);

  for (const p of POSTS) {
    const data = {
      publishedAt: new Date(p.date),
      titleUk: p.title.uk,
      titleRu: p.title.ru,
      excerptUk: p.excerpt.uk,
      excerptRu: p.excerpt.ru,
      body: json(p.body),
      related: p.related,
      published: true,
    };
    await prisma.post.upsert({ where: { slug: p.slug }, create: { slug: p.slug, ...data }, update: data });
  }
  console.log(`статті: ${POSTS.length}`);

  /*
   * Прибирання осиротілих записів.
   *
   * Upsert сам по собі не видаляє нічого, тому перейменування слага групи
   * лишало в базі стару групу — вона потрапляла в generateStaticParams
   * і в sitemap як порожня сторінка. Порядок видалення знизу вгору:
   * товари → категорії → групи, інакше зовнішні ключі не дадуть видалити.
   */
  const removedProducts = await prisma.product.deleteMany({
    where: { slug: { notIn: products.map((p) => p.slug) } },
  });
  const removedCategories = await prisma.category.deleteMany({
    where: { slug: { notIn: CATEGORIES.map((c) => c.slug) } },
  });
  const removedGroups = await prisma.group.deleteMany({
    where: { slug: { notIn: GROUPS.map((g) => g.slug) } },
  });

  const removed =
    removedProducts.count + removedCategories.count + removedGroups.count;
  if (removed > 0) {
    console.log(
      `прибрано застарілих: груп ${removedGroups.count}, ` +
        `категорій ${removedCategories.count}, товарів ${removedProducts.count}`,
    );
  }
};

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
