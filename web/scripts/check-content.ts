/**
 * Ворота запуску: обсяг текстів у каталозі.
 *
 * Перевіряється БД, а не файли-джерела: після сідування тексти редагуються
 * в адмінці, і саме там категорія може непомітно «схуднути» до двох речень.
 *
 * Пороги не вигадані — це нижня межа, за якою сторінка перестає бути
 * самостійною для пошуку й починає конкурувати з батьківською категорією.
 *
 * Запуск: npm run check:content
 */
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';

/** Мінімум знаків SEO-тексту української версії. */
const MIN_CATEGORY = 900;
const MIN_GROUP = 900;
/** Категорія без жодного питання лишає найчастіші заперечення без відповіді. */
const MIN_FAQ = 1;
/** Підзаголовки роблять довгий текст читабельним — без них його не читають. */
const MIN_HEADINGS = 2;

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL ?? '' }),
});

interface Para {
  uk: string;
  ru: string;
}

const paras = (v: unknown): Para[] => (Array.isArray(v) ? (v as Para[]) : []);
const chars = (v: unknown) => paras(v).reduce((n, p) => n + (p.uk?.length ?? 0), 0);
const headings = (v: unknown) => paras(v).filter((p) => p.uk?.startsWith('## ')).length;

const [categories, groups] = await Promise.all([
  prisma.category.findMany({ select: { slug: true, seo: true, faq: true } }),
  prisma.group.findMany({ select: { slug: true, seo: true } }),
]);

const problems: string[] = [];

for (const c of categories) {
  const n = chars(c.seo);
  const h = headings(c.seo);
  const f = Array.isArray(c.faq) ? c.faq.length : 0;
  if (n < MIN_CATEGORY) problems.push(`категорія ${c.slug}: ${n} знаків, потрібно ${MIN_CATEGORY}`);
  if (h < MIN_HEADINGS) problems.push(`категорія ${c.slug}: ${h} підзаголовків, потрібно ${MIN_HEADINGS}`);
  if (f < MIN_FAQ) problems.push(`категорія ${c.slug}: немає жодного питання в FAQ`);
}

for (const g of groups) {
  const n = chars(g.seo);
  if (n < MIN_GROUP) problems.push(`група ${g.slug}: ${n} знаків, потрібно ${MIN_GROUP}`);
}

const total =
  categories.reduce((n, c) => n + chars(c.seo), 0) + groups.reduce((n, g) => n + chars(g.seo), 0);
const sorted = categories.map((c) => chars(c.seo)).sort((a, b) => a - b);

console.log(`Категорій: ${categories.length}, груп: ${groups.length}`);
console.log(
  `  SEO-тексту: ${total.toLocaleString('uk')} знаків, ` +
    `медіана по категорії ${sorted[Math.floor(sorted.length / 2)]}, мінімум ${sorted[0]}`,
);

await prisma.$disconnect();

if (problems.length) {
  console.error(`\n✗ Тонкі сторінки (${problems.length}):`);
  console.error(problems.map((p) => `    ${p}`).join('\n'));
  console.error('\nТакі сторінки конкурують із батьківською категорією замість власного запиту.');
  process.exit(1);
}
console.log('\n✓ Усі категорії та групи мають самостійний текст.');
