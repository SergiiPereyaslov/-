/**
 * Розбір і перевірка вивантаження товарів із CSV.
 *
 * Модуль спільний для CLI (`npm run catalog:import`) і для завантаження
 * файлу в адмінці — щоб правила валідації не розходились між ними.
 * Тут немає доступу до БД: на вхід CSV, на вихід готові записи або помилки.
 */

import { buildSearchText } from './search-text.ts';

export interface ImportedProduct {
  slug: string;
  sku: string;
  categorySlug: string;
  nameUk: string;
  nameRu: string;
  specUk: string;
  specRu: string;
  descriptionUk: string;
  descriptionRu: string;
  attributes: { label: { uk: string; ru: string }; value: { uk: string; ru: string } }[];
  facets: Record<string, string>;
  unitsPerPack: number;
  priceRetail: number;
  tiers: { minPacks: number; perUnit: number }[];
  inStock: boolean;
  brandable: boolean;
  shape: string;
  lidDiameter: number | null;
  image: string | null;
  searchText: string;
}

export interface ImportResult {
  products: ImportedProduct[];
  errors: string[];
  /**
   * Некритичні зауваження: імпорт пройде, але щось варто перевірити.
   * Головне з них — товар без слага в файлі: для нього доведеться
   * згенерувати новий, і старе посилання на товар перестане працювати.
   */
  warnings: string[];
  /** Категорії з taxonomy, для яких у файлі немає жодного товару. */
  emptyCategories: string[];
}

/** Оптові щаблі, якщо в CSV немає готової оптової ціни. */
const TIERS = [
  { minPacks: 10, discount: 0.08 },
  { minPacks: 30, discount: 0.14 },
  { minPacks: 100, discount: 0.2 },
];

const TRANSLIT: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'h', ґ: 'g', д: 'd', е: 'e', є: 'ie', ж: 'zh',
  з: 'z', и: 'y', і: 'i', ї: 'i', й: 'i', к: 'k', л: 'l', м: 'm', н: 'n',
  о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'kh', ц: 'ts',
  ч: 'ch', ш: 'sh', щ: 'shch', ь: '', ю: 'iu', я: 'ia', "'": '', '’': '',
};

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .split('')
    .map((c) => (c in TRANSLIT ? TRANSLIT[c] : c))
    .join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

/**
 * Слаги товарів переносяться зі старого сайту без змін — це рішення клієнта
 * і воно економить цілу мапу 301: правило `/products/:slug → /product/:slug/`
 * покриває всі 299 позицій один в один. Тому тут слаг не генерується з назви,
 * а нормалізується з того, що дали: приймаємо і чистий слаг, і повний URL.
 */
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const normalizeSlug = (raw: string): string => {
  let v = raw.trim().toLowerCase();
  // Повний URL або шлях: /products/stakan-kraft-350-ml → stakan-kraft-350-ml
  v = v.replace(/^https?:\/\/[^/]+/, '');
  v = v.replace(/^\/?(?:ru\/)?products?\//, '');
  v = v.replace(/\/+$/, '');
  // Хвости старого рушія на кшталт ?variant=… ніколи не частина слага
  v = v.split(/[?#]/)[0];
  return v;
};

/** Розбір CSV із підтримкою лапок і переносів рядків усередині полів. */
export const parseCsv = (text: string): Record<string, string>[] => {
  const clean = text.replace(/^﻿/, '');
  const firstBreak = clean.indexOf('\n');
  const head = firstBreak === -1 ? clean : clean.slice(0, firstBreak);
  const delimiter = (head.match(/;/g)?.length ?? 0) > (head.match(/,/g)?.length ?? 0) ? ';' : ',';

  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;

  for (let i = 0; i < clean.length; i += 1) {
    const c = clean[i];
    if (quoted) {
      if (c === '"') {
        if (clean[i + 1] === '"') {
          field += '"';
          i += 1;
        } else quoted = false;
      } else field += c;
    } else if (c === '"') quoted = true;
    else if (c === delimiter) {
      row.push(field);
      field = '';
    } else if (c === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else if (c !== '\r') field += c;
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }

  const header = (rows.shift() ?? []).map((h) => h.trim().toLowerCase().replace(/[\s_-]+/g, ''));
  return rows
    .filter((r) => r.some((v) => v.trim()))
    .map((r) => Object.fromEntries(header.map((h, i) => [h, (r[i] ?? '').trim()])));
};

const pick = (row: Record<string, string>, ...names: string[]) => {
  for (const n of names) {
    const key = n.toLowerCase().replace(/[\s_-]+/g, '');
    if (row[key]) return row[key];
  }
  return '';
};

const bool = (v: string, fallback: boolean) =>
  v ? /^(так|да|yes|true|1|\+|є)$/i.test(v.trim()) : fallback;

const num = (v: string) => Number(String(v).replace(',', '.').replace(/[^\d.]/g, ''));

const round = (n: number) => Math.round(n * 100) / 100;

/**
 * @param csv     вміст файлу
 * @param categorySlugs слаги наявних категорій — для перевірки посилань
 */
export const importProducts = (csv: string, categorySlugs: Set<string>): ImportResult => {
  const rows = parseCsv(csv);
  const errors: string[] = [];
  const warnings: string[] = [];
  const products: ImportedProduct[] = [];
  const seenSku = new Set<string>();
  const seenSlug = new Set<string>();

  if (!rows.length) {
    return {
      products: [],
      errors: ['У файлі немає рядків з даними.'],
      warnings: [],
      emptyCategories: [],
    };
  }

  rows.forEach((row, i) => {
    const line = i + 2; // +1 заголовок, +1 нумерація з одиниці
    const sku = pick(row, 'артикул', 'sku');
    const nameUk = pick(row, 'назваuk', 'назва', 'nameuk', 'name');
    const categorySlug = pick(row, 'категорія', 'category');
    const unitsPerPack = Math.trunc(num(pick(row, 'впачці', 'unitsperpack', 'pack')));
    const priceRetail = num(pick(row, 'ціна', 'price'));

    if (!sku) errors.push(`рядок ${line}: немає артикула`);
    if (!nameUk) errors.push(`рядок ${line}: немає назви`);
    if (!categorySlug) errors.push(`рядок ${line}: немає категорії`);
    else if (!categorySlugs.has(categorySlug))
      errors.push(`рядок ${line}: невідома категорія «${categorySlug}»`);
    if (!unitsPerPack || unitsPerPack < 1) errors.push(`рядок ${line}: некоректна кількість у пачці`);
    if (!priceRetail || priceRetail <= 0) errors.push(`рядок ${line}: некоректна ціна`);
    if (sku && seenSku.has(sku)) errors.push(`рядок ${line}: дубль артикула «${sku}»`);
    if (sku) seenSku.add(sku);

    if (errors.length > 200 || !sku || !nameUk || !categorySlug) return;

    const nameRu = pick(row, 'назваru', 'nameru') || nameUk;
    const specUk = pick(row, 'розмірuk', 'розмір', 'specuk', 'spec');
    const specRu = pick(row, 'розмірru', 'specru') || specUk;
    const descUk = pick(row, 'описuk', 'опис', 'descriptionuk', 'description');
    const descRu = pick(row, 'описru', 'descriptionru') || descUk;

    // Слаг зі старого сайту має пріоритет над будь-якою генерацією:
    // саме він зберігає позиції товару в пошуку.
    const rawSlug = pick(row, 'слаг', 'слагтовару', 'url', 'посилання', 'slug', 'link');
    let slug = normalizeSlug(rawSlug);

    if (!slug) {
      slug = slugify(nameUk);
      warnings.push(
        `рядок ${line}: немає слага — згенеровано «${slug}». ` +
          'Старе посилання на цей товар після запуску віддасть 404.',
      );
    } else if (!SLUG_RE.test(slug)) {
      errors.push(
        `рядок ${line}: слаг «${rawSlug}» містить неприпустимі символи. ` +
          'Дозволені лише латиниця, цифри й дефіс.',
      );
      return;
    }

    if (seenSlug.has(slug)) {
      errors.push(`рядок ${line}: дубль слага «${slug}» — два товари не можуть жити за одним URL`);
      return;
    }
    seenSlug.add(slug);

    const facets: Record<string, string> = {};
    for (const pairStr of pick(row, 'фасети', 'facets').split(';')) {
      const [k, v] = pairStr.split('=').map((x) => x?.trim());
      if (k && v) facets[k] = v;
    }

    const optRaw = num(pick(row, 'цінаопт', 'priceopt'));
    const tiers = optRaw
      ? [
          { minPacks: 10, perUnit: round(optRaw) },
          { minPacks: 30, perUnit: round(optRaw * 0.94) },
          { minPacks: 100, perUnit: round(optRaw * 0.88) },
        ]
      : TIERS.map((t) => ({ minPacks: t.minPacks, perUnit: round(priceRetail * (1 - t.discount)) }));

    const lidDiameter = Math.trunc(num(pick(row, 'діаметр', 'liddiameter')));
    const image = pick(row, 'фото', 'image');

    products.push({
      slug,
      sku,
      categorySlug,
      nameUk,
      nameRu,
      specUk,
      specRu,
      descriptionUk: descUk,
      descriptionRu: descRu,
      attributes: [
        ...(specUk
          ? [{ label: { uk: 'Розмір', ru: 'Размер' }, value: { uk: specUk, ru: specRu } }]
          : []),
        {
          label: { uk: 'У пачці', ru: 'В пачке' },
          value: { uk: `${unitsPerPack} шт`, ru: `${unitsPerPack} шт` },
        },
        ...(lidDiameter
          ? [
              {
                label: { uk: 'Діаметр', ru: 'Диаметр' },
                value: { uk: `${lidDiameter} мм`, ru: `${lidDiameter} мм` },
              },
            ]
          : []),
      ],
      facets,
      unitsPerPack,
      priceRetail: round(priceRetail),
      tiers,
      inStock: bool(pick(row, 'наявність', 'instock'), true),
      brandable: bool(pick(row, 'логотип', 'brandable'), false),
      shape: pick(row, 'форма', 'shape') || 'box',
      lidDiameter: Number.isFinite(lidDiameter) && lidDiameter > 0 ? lidDiameter : null,
      image: image || null,
      searchText: buildSearchText({ nameUk, nameRu, sku, specUk, specRu, facets }),
    });
  });

  const used = new Set(products.map((p) => p.categorySlug));
  const emptyCategories = [...categorySlugs].filter((c) => !used.has(c));

  return { products, errors, warnings, emptyCategories };
};
