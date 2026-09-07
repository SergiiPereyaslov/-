/**
 * Імпорт реального каталогу з CSV у src/data/products.json.
 *
 * Запуск:
 *   npm run catalog:import -- ../docs/smartecopack/legacy/products.csv
 *
 * CSV має містити заголовок. Роздільник визначається автоматично (`,` або `;`),
 * підтримуються лапки й переноси рядків усередині полів. Кодування — UTF-8;
 * якщо Excel зберіг у Windows-1251, перезбережіть як «CSV UTF-8».
 *
 * Очікувані колонки (регістр і пробіли неважливі, працюють і укр., і англ. назви):
 *
 *   артикул / sku            обов'язково, унікальний
 *   назва_uk / name_uk       обов'язково
 *   назва_ru / name_ru       якщо порожньо — дублюється з uk
 *   категорія / category     обов'язково, слаг із taxonomy.ts
 *   розмір_uk / spec_uk      «340 мл», «320×200×370 мм»
 *   розмір_ru / spec_ru
 *   опис_uk / description_uk
 *   опис_ru / description_ru
 *   в_пачці / units_per_pack обов'язково, ціле число
 *   ціна / price             обов'язково, роздрібна за штуку, грн
 *   ціна_опт / price_opt     опційно; якщо порожньо — щаблі рахуються від знижок
 *   наявність / in_stock     «так»/«ні», 1/0, true/false; порожньо = так
 *   логотип / brandable      те саме; порожньо = ні
 *   форма / shape            cup|lid|sleeve|holder|straw|box|round|bag|flat
 *   діаметр / lid_diameter   для стаканів і кришок — основа сумісності
 *   фасети / facets          «volume=340;color=kraft»
 *   фото / image             URL або шлях у public/
 *
 * Скрипт перевіряє обов'язкові поля, унікальність артикулів і слагів,
 * існування категорії — і зупиняється зі списком помилок, не записавши файл.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = resolve(ROOT, 'src/data/products.json');

/** Оптові щаблі, якщо в CSV немає готової оптової ціни. */
const TIERS = [
  { minPacks: 10, discount: 0.08 },
  { minPacks: 30, discount: 0.14 },
  { minPacks: 100, discount: 0.2 },
];

const TRANSLIT = {
  а: 'a', б: 'b', в: 'v', г: 'h', ґ: 'g', д: 'd', е: 'e', є: 'ie', ж: 'zh',
  з: 'z', и: 'y', і: 'i', ї: 'i', й: 'i', к: 'k', л: 'l', м: 'm', н: 'n',
  о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'kh', ц: 'ts',
  ч: 'ch', ш: 'sh', щ: 'shch', ь: '', ю: 'iu', я: 'ia', "'": '', '’': '',
};

const slugify = (s) =>
  s.toLowerCase().split('').map((c) => (c in TRANSLIT ? TRANSLIT[c] : c)).join('')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

/** Розбір CSV із підтримкою лапок і переносів рядків усередині полів. */
function parseCsv(text) {
  const clean = text.replace(/^﻿/, '');
  const head = clean.slice(0, clean.indexOf('\n'));
  const delimiter = (head.match(/;/g)?.length ?? 0) > (head.match(/,/g)?.length ?? 0) ? ';' : ',';

  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;

  for (let i = 0; i < clean.length; i += 1) {
    const c = clean[i];
    if (quoted) {
      if (c === '"') {
        if (clean[i + 1] === '"') { field += '"'; i += 1; }
        else quoted = false;
      } else field += c;
    } else if (c === '"') quoted = true;
    else if (c === delimiter) { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else if (c !== '\r') field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }

  const header = rows.shift().map((h) => h.trim().toLowerCase().replace(/[\s_-]+/g, ''));
  return rows
    .filter((r) => r.some((v) => v.trim()))
    .map((r) => Object.fromEntries(header.map((h, i) => [h, (r[i] ?? '').trim()])));
}

/** Значення за будь-яким із синонімів назви колонки. */
const pick = (row, ...names) => {
  for (const n of names) {
    const key = n.toLowerCase().replace(/[\s_-]+/g, '');
    if (row[key]) return row[key];
  }
  return '';
};

const bool = (v, fallback) => {
  if (!v) return fallback;
  return /^(так|да|yes|true|1|\+|є)$/i.test(v.trim());
};

const num = (v) => Number(String(v).replace(',', '.').replace(/[^\d.]/g, ''));

const main = () => {
  const file = process.argv[2];
  if (!file) {
    console.error('Вкажіть шлях до CSV:\n  npm run catalog:import -- шлях/до/products.csv');
    process.exit(1);
  }

  const rows = parseCsv(readFileSync(resolve(process.cwd(), file), 'utf8'));
  if (!rows.length) {
    console.error('У файлі немає рядків з даними.');
    process.exit(1);
  }

  // Категорія в taxonomy.ts — це запис, у якого одразу за slug іде group.
  // Так ми не сплутаємо її зі слагом групи або значення фасета.
  const taxonomy = readFileSync(resolve(ROOT, 'src/data/taxonomy.ts'), 'utf8');
  const categories = new Set(
    [...taxonomy.matchAll(/slug: '([^']+)',\s*\n\s*group: '[^']+'/g)].map((m) => m[1]),
  );

  const errors = [];
  const seenSku = new Set();
  const seenSlug = new Set();
  const products = [];

  rows.forEach((row, i) => {
    const line = i + 2; // +1 заголовок, +1 нумерація з одиниці
    const sku = pick(row, 'артикул', 'sku');
    const nameUk = pick(row, 'назваuk', 'назва', 'nameuk', 'name');
    const category = pick(row, 'категорія', 'category');
    const pack = num(pick(row, 'впачці', 'unitsperpack', 'pack'));
    const price = num(pick(row, 'ціна', 'price'));

    if (!sku) errors.push(`рядок ${line}: немає артикула`);
    if (!nameUk) errors.push(`рядок ${line}: немає назви`);
    if (!category) errors.push(`рядок ${line}: немає категорії`);
    else if (!categories.has(category)) errors.push(`рядок ${line}: невідома категорія «${category}»`);
    if (!pack || pack < 1) errors.push(`рядок ${line}: некоректна кількість у пачці`);
    if (!price || price <= 0) errors.push(`рядок ${line}: некоректна ціна`);
    if (sku && seenSku.has(sku)) errors.push(`рядок ${line}: дубль артикула «${sku}»`);
    seenSku.add(sku);

    if (errors.length > 200) return;

    const nameRu = pick(row, 'назваru', 'nameru') || nameUk;
    const specUk = pick(row, 'розмірuk', 'розмір', 'specuk', 'spec');
    const specRu = pick(row, 'розмірru', 'specru') || specUk;
    const descUk = pick(row, 'описuk', 'опис', 'descriptionuk', 'description');
    const descRu = pick(row, 'описru', 'descriptionru') || descUk;

    let slug = slugify(nameUk);
    if (seenSlug.has(slug)) slug = `${slug}-${slugify(sku)}`;
    seenSlug.add(slug);

    const facets = {};
    for (const pair of pick(row, 'фасети', 'facets').split(';')) {
      const [k, v] = pair.split('=').map((x) => x?.trim());
      if (k && v) facets[k] = v;
    }

    const optRaw = num(pick(row, 'цінаопт', 'priceopt'));
    const tiers = optRaw
      ? [
          { minPacks: 10, perUnit: Math.round(optRaw * 100) / 100 },
          { minPacks: 30, perUnit: Math.round(optRaw * 0.94 * 100) / 100 },
          { minPacks: 100, perUnit: Math.round(optRaw * 0.88 * 100) / 100 },
        ]
      : TIERS.map((t) => ({
          minPacks: t.minPacks,
          perUnit: Math.round(price * (1 - t.discount) * 100) / 100,
        }));

    const lidDiameter = num(pick(row, 'діаметр', 'liddiameter')) || undefined;
    const shape = pick(row, 'форма', 'shape') || 'box';

    products.push({
      slug,
      sku,
      category,
      name: { uk: nameUk, ru: nameRu },
      spec: { uk: specUk, ru: specRu },
      description: { uk: descUk, ru: descRu },
      attributes: [
        ...(specUk ? [{ label: { uk: 'Розмір', ru: 'Размер' }, value: { uk: specUk, ru: specRu } }] : []),
        { label: { uk: 'У пачці', ru: 'В пачке' }, value: { uk: `${pack} шт`, ru: `${pack} шт` } },
        ...(lidDiameter
          ? [{ label: { uk: 'Діаметр', ru: 'Диаметр' }, value: { uk: `${lidDiameter} мм`, ru: `${lidDiameter} мм` } }]
          : []),
      ],
      facets,
      unitsPerPack: pack,
      priceRetail: Math.round(price * 100) / 100,
      tiers,
      inStock: bool(pick(row, 'наявність', 'instock'), true),
      brandable: bool(pick(row, 'логотип', 'brandable'), false),
      shape,
      ...(lidDiameter ? { lidDiameter } : {}),
      ...(pick(row, 'фото', 'image') ? { image: pick(row, 'фото', 'image') } : {}),
    });
  });

  if (errors.length) {
    console.error(`Імпорт зупинено, знайдено ${errors.length} помилок:\n`);
    console.error(errors.slice(0, 50).join('\n'));
    if (errors.length > 50) console.error(`\n…і ще ${errors.length - 50}`);
    process.exit(1);
  }

  // Сумісність стакан ↔ кришка за діаметром вінця
  for (const p of products) {
    if (!p.lidDiameter) continue;
    const opposite = p.shape === 'lid' ? 'cup' : p.shape === 'cup' ? 'lid' : null;
    if (!opposite) continue;
    p.compatibleWith = products
      .filter((o) => o.shape === opposite && o.lidDiameter === p.lidDiameter)
      .map((o) => o.slug);
  }

  writeFileSync(OUT, JSON.stringify(products, null, 2) + '\n', 'utf8');

  const byCat = {};
  for (const p of products) byCat[p.category] = (byCat[p.category] ?? 0) + 1;
  const missing = [...categories].filter((c) => !byCat[c]);

  console.log(`Імпортовано ${products.length} товарів у ${Object.keys(byCat).length} категоріях.`);
  if (missing.length) {
    console.warn(`\nУвага: категорії без жодного товару (${missing.length}):`);
    console.warn('  ' + missing.join(', '));
    console.warn('Такі категорії віддаватимуть порожню сторінку — приберіть їх із taxonomy.ts або додайте товари.');
  }
};

main();
