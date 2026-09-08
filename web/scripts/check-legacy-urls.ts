/**
 * Ворота запуску: чи не з'явиться після перемикання масових 404.
 *
 * Джерела:
 *   docs/smartecopack/redirects-301.csv        — мапа для сторінок
 *   docs/smartecopack/legacy/products-crawl.csv — 299 товарів старого сайту
 *
 * Товари перевіряються окремо, бо для них мапи немає й не потрібно:
 * за рішенням клієнта слаги переносяться без змін, тож правило
 * `/products/:slug → /product/:slug/` має спрацювати один в один.
 * Цей скрипт і перевіряє, що воно спрацює.
 *
 * Запуск: npm run check:legacy
 */
import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { legacyTarget } from '../src/lib/legacy-redirects.ts';
import { parseCsv } from '../src/lib/product-import.ts';

const DOCS = resolve(dirname(fileURLToPath(import.meta.url)), '../../docs/smartecopack');

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL ?? '' }),
});

const read = (path: string) => parseCsv(readFileSync(resolve(DOCS, path), 'utf8'));

const [products, categories, posts, groups] = await Promise.all([
  prisma.product.findMany({ select: { slug: true } }),
  prisma.category.findMany({ select: { slug: true } }),
  prisma.post.findMany({ where: { published: true }, select: { slug: true } }),
  prisma.group.findMany({ select: { slug: true } }),
]);

/** Усі шляхи, які новий сайт реально віддає. */
const live = new Set<string>([
  '/',
  '/catalog/',
  '/blog/',
  '/brenduvannya/',
  '/brenduvannya/druk-na-stakanakh/',
  '/brenduvannya/druk-na-paketakh/',
  '/dostavka-i-oplata/',
  '/pro-nas/',
  '/kontakty/',
  '/polityka-konfidentsiynosti/',
  '/publichna-oferta/',
  ...groups.map((g) => `/catalog/${g.slug}/`),
  ...categories.map((c) => `/catalog/${c.slug}/`),
  ...posts.map((p) => `/blog/${p.slug}/`),
  ...products.map((p) => `/product/${p.slug}/`),
]);

let failed = false;

/* ── 1. Сторінки з мапи 301 ─────────────────────────────────────────── */

const map = read('redirects-301.csv');
const deadTargets: string[] = [];
const noRule: string[] = [];

for (const row of map) {
  const source = row['source'];
  const target = legacyTarget(source);
  if (!target) {
    noRule.push(source);
    continue;
  }
  if (!live.has(target)) deadTargets.push(`${source} → ${target}`);
}

console.log(`Сторінок у мапі 301: ${map.length}`);
if (noRule.length) {
  failed = true;
  console.error(`\n✗ Без правила (${noRule.length}):\n  ${noRule.join('\n  ')}`);
}
if (deadTargets.length) {
  failed = true;
  console.error(`\n✗ Правило веде на неіснуючу сторінку (${deadTargets.length}):`);
  console.error(`  ${deadTargets.join('\n  ')}`);
}
if (!noRule.length && !deadTargets.length) console.log('  ✓ усі ведуть на сторінку, яка існує');

/* ── 2. Товари старого сайту ────────────────────────────────────────── */

const old = read('legacy/products-crawl.csv').map((r) => r['слаг']).filter(Boolean);
const have = new Set(products.map((p) => p.slug));
const missing = old.filter((slug) => !have.has(slug));

console.log(`\nТоварів на старому сайті: ${old.length}`);
console.log(`Товарів у базі: ${products.length}`);

if (missing.length) {
  failed = true;
  console.error(`\n✗ Старі посилання, які віддадуть 404 (${missing.length} з ${old.length}):`);
  console.error(`  ${missing.slice(0, 20).map((s) => `/products/${s}`).join('\n  ')}`);
  if (missing.length > 20) console.error(`  …і ще ${missing.length - 20}`);
  console.error(
    '\n  Причина — товари ще не імпортовані або імпортовані з новими слагами.\n' +
      '  Слаги переносяться зі старого сайту без змін: колонка «слаг» у CSV.',
  );
} else {
  console.log('  ✓ усі 299 старих посилань на товари ведуть на живу картку');
}

await prisma.$disconnect();

if (failed) {
  console.error('\nЗапускати не можна: частина старих адрес віддасть 404.');
  process.exit(1);
}
console.log('\n✓ Міграція URL готова до запуску.');
