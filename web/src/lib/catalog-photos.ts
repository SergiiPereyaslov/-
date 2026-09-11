import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.join(process.cwd(), 'public', 'images', 'catalog');

/**
 * Реальні фото зі старого сайту, розкладені по категоріях під час імпорту.
 * Не прив'язані до конкретних SKU демо-каталогу (products.json), тому не
 * несуть price/spec — лише візуальний доказ, що товар справді є в наявності.
 */
export function getCategoryPhotos(categorySlug: string): string[] {
  const dir = path.join(ROOT, categorySlug);
  let files: string[];
  try {
    files = fs.readdirSync(dir);
  } catch {
    return [];
  }
  return files
    .filter((f) => f.endsWith('.webp'))
    .sort()
    .map((f) => `/images/catalog/${categorySlug}/${f}`);
}
