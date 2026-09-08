/**
 * Ворота запуску: мета-теги всіх сторінок сайту.
 *
 * Навіщо окремий скрипт, коли є e2e: e2e перевіряє вибірку зі списку, а тут
 * потрібна суцільна перевірка. Заголовок ламається не там, де ти дивишся, —
 * на старому сайті 324 з 445 title були довші за 60 символів, і жоден із них
 * ніхто не перевіряв поштучно.
 *
 * Головне: після імпорту реальних 299 товарів із довгими назвами цей скрипт
 * покаже, чи витримали формули заголовка, — до перемикання домену, а не після.
 *
 * Запуск (потрібен зібраний і запущений сайт):
 *   npm run build && npx next start -p 3400 &
 *   npm run check:meta
 */
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  TITLE_LIMIT,
  TITLE_LIMIT_NO_BRAND,
  BRAND_SUFFIX_LENGTH,
  DESCRIPTION_MIN,
  DESCRIPTION_MAX,
  fitTitle,
  shortenProductName,
} from '../src/lib/meta-text.ts';
import { parseCsv } from '../src/lib/product-import.ts';

const BASE = process.env.CHECK_BASE ?? 'http://127.0.0.1:3400';
/** Повний ліміт видачі: власна частина плюс « | SmartEcoPack». */
const TITLE_MAX = TITLE_LIMIT + BRAND_SUFFIX_LENGTH;
const CONCURRENCY = 25;

const decode = (s: string) =>
  s
    .replace(/&amp;/g, '&')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');

interface Page {
  url: string;
  title: string;
  description: string;
}

let failed = false;

/* ── Етап 0. Формула заголовка на реальних назвах старого сайту ──────── */

/*
 * Найважливіша перевірка й водночас єдина, яка працює до імпорту.
 * Каталог у базі поки демонстраційний, а бити формулу будуть саме реальні
 * назви — до 82 символів. Проганяємо їх окремо, щоб не дізнатися про
 * проблему після перемикання домену.
 */
const CORPUS = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../../docs/smartecopack/legacy/products-import-template.csv',
);

try {
  const corpus = parseCsv(readFileSync(CORPUS, 'utf8'));
  const broken: string[] = [];

  for (const row of corpus) {
    const name = row['назваuk'];
    if (!name) continue;
    const short = shortenProductName(name, row['розмірuk'] ?? '', TITLE_LIMIT_NO_BRAND);
    const title = fitTitle(short, { text: '250 грн' }, TITLE_LIMIT_NO_BRAND);

    if (title.length > TITLE_LIMIT_NO_BRAND) broken.push(`задовгий: ${title}`);
    else if (title.includes('…')) broken.push(`обрізаний: ${name} → ${title}`);
    // Занадто коротка «голова» означає, що правило з'їло сенс назви
    else if (short.length < 12) broken.push(`втрачено сенс: ${name} → ${short}`);
  }

  console.log(`Реальних назв старого сайту: ${corpus.length}`);
  if (broken.length) {
    failed = true;
    console.error(`\n✗ Формула заголовка не витримує (${broken.length}):`);
    console.error(broken.slice(0, 15).map((x) => `    ${x}`).join('\n'));
  } else {
    console.log('  ✓ усі вкладаються в ліміт без обрізки');
  }
} catch {
  console.warn(`Корпус назв не знайдено (${CORPUS}) — етап пропущено.`);
}

/* ── Етап 1. Живі сторінки ──────────────────────────────────────────── */

const sitemap = await (await fetch(`${BASE}/sitemap.xml`)).text();
const urls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) =>
  m[1].replace(/^https?:\/\/[^/]+/, ''),
);

if (!urls.length) {
  console.error(`Не вдалося прочитати ${BASE}/sitemap.xml — чи запущений сайт?`);
  process.exit(1);
}

const pages: Page[] = [];
for (let i = 0; i < urls.length; i += CONCURRENCY) {
  await Promise.all(
    urls.slice(i, i + CONCURRENCY).map(async (url) => {
      const html = await (await fetch(BASE + url)).text();
      pages.push({
        url,
        title: decode(/<title>([\s\S]*?)<\/title>/.exec(html)?.[1] ?? ''),
        description: decode(/<meta name="description" content="([\s\S]*?)"/.exec(html)?.[1] ?? ''),
      });
    }),
  );
}

/* ── Перевірки ──────────────────────────────────────────────────────── */

const problems: Record<string, string[]> = {
  'title довший за ліміт видачі': [],
  'title обрізаний трикрапкою': [],
  'title порожній': [],
  'title дублюється': [],
  'description довший за ліміт': [],
  'description коротший за корисний мінімум': [],
  'description порожній': [],
  'description дублюється': [],
};

const byTitle = new Map<string, string[]>();
const byDescription = new Map<string, string[]>();

for (const p of pages) {
  if (!p.title) problems['title порожній'].push(p.url);
  else {
    if (p.title.length > TITLE_MAX)
      problems['title довший за ліміт видачі'].push(`${p.url} — ${p.title.length}: ${p.title}`);
    // Трикрапка означає, що формула не вклалася й сенс утрачено
    if (p.title.includes('…'))
      problems['title обрізаний трикрапкою'].push(`${p.url} — ${p.title}`);
    byTitle.set(p.title, [...(byTitle.get(p.title) ?? []), p.url]);
  }

  if (!p.description) problems['description порожній'].push(p.url);
  else {
    if (p.description.length > DESCRIPTION_MAX)
      problems['description довший за ліміт'].push(`${p.url} — ${p.description.length}`);
    if (p.description.length < DESCRIPTION_MIN)
      problems['description коротший за корисний мінімум'].push(
        `${p.url} — ${p.description.length}: ${p.description}`,
      );
    byDescription.set(p.description, [...(byDescription.get(p.description) ?? []), p.url]);
  }
}

// Дублі — окрема біда: дві сторінки з однаковим title конкурують між собою
for (const [title, list] of byTitle) {
  if (list.length > 1) problems['title дублюється'].push(`«${title}» → ${list.join(', ')}`);
}
for (const [, list] of byDescription) {
  if (list.length > 1) problems['description дублюється'].push(list.join(', '));
}

/* ── Звіт ───────────────────────────────────────────────────────────── */

const lengths = pages.map((p) => p.title.length).sort((a, b) => a - b);
const dLengths = pages.map((p) => p.description.length).sort((a, b) => a - b);
const median = (a: number[]) => a[Math.floor(a.length / 2)] ?? 0;

console.log(`\nПеревірено сторінок: ${pages.length}`);
console.log(
  `  title:       медіана ${median(lengths)}, максимум ${lengths.at(-1)}, ліміт ${TITLE_MAX}`,
);
console.log(
  `  description: медіана ${median(dLengths)}, максимум ${dLengths.at(-1)}, ` +
    `норма ${DESCRIPTION_MIN}–${DESCRIPTION_MAX}`,
);

for (const [name, list] of Object.entries(problems)) {
  if (!list.length) continue;
  failed = true;
  console.error(`\n✗ ${name} (${list.length}):`);
  console.error(list.slice(0, 15).map((x) => `    ${x}`).join('\n'));
  if (list.length > 15) console.error(`    …і ще ${list.length - 15}`);
}

if (failed) {
  console.error('\nМета-теги не готові до запуску.');
  process.exit(1);
}
console.log('\n✓ Усі мета-теги в межах.');
