/**
 * Імпорт каталогу з CSV у базу.
 *
 *   npm run catalog:import -- ../docs/smartecopack/legacy/products.csv
 *
 * Формат колонок описано в src/lib/product-import.ts — той самий модуль
 * використовує завантаження файлу в адмінці, тому правила однакові.
 * Скрипт нічого не пише, якщо знайдено хоча б одну помилку.
 */
import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { importProducts } from '../src/lib/product-import.ts';

const file = process.argv[2];
if (!file) {
  console.error('Вкажіть шлях до CSV:\n  npm run catalog:import -- шлях/до/products.csv');
  process.exit(1);
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL ?? '' }),
});

const categories = await prisma.category.findMany({ select: { slug: true } });
const csv = readFileSync(resolve(process.cwd(), file), 'utf8');
const { products, errors, emptyCategories } = importProducts(
  csv,
  new Set(categories.map((c) => c.slug)),
);

if (errors.length) {
  console.error(`Імпорт зупинено, знайдено ${errors.length} помилок:\n`);
  console.error(errors.slice(0, 50).join('\n'));
  if (errors.length > 50) console.error(`\n…і ще ${errors.length - 50}`);
  await prisma.$disconnect();
  process.exit(1);
}

for (const [i, p] of products.entries()) {
  const { slug, ...rest } = p;
  const data = { ...rest, sortOrder: i };
  await prisma.product.upsert({
    where: { slug },
    create: { slug, ...data },
    update: data,
  });
}

console.log(`Імпортовано ${products.length} товарів.`);
if (emptyCategories.length) {
  console.warn(`\nКатегорії без жодного товару (${emptyCategories.length}):`);
  console.warn('  ' + emptyCategories.join(', '));
  console.warn('Такі категорії віддаватимуть порожню сторінку.');
}

await prisma.$disconnect();
