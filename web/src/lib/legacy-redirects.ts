/**
 * Мапа 301 зі старих URL. Джерело — docs/smartecopack/redirects-301.csv.
 *
 * Правила застосовуються в middleware, а не в next.config, свідомо:
 * при trailingSlash: true вбудована нормалізація слеша спрацьовує раніше
 * за redirects() і дає ланцюжок 308 → 301. Middleware виконується першим,
 * тому старий URL веде на новий за один хоп.
 */
const EXACT: Record<string, string> = {
  '/catalog/stakani-paperovi': '/catalog/stakany-paperovi/',
  '/catalog/stakani-dvosharovi': '/catalog/stakany-dvosharovi/',
  '/catalog/stakani-gofrovani': '/catalog/stakany-gofrovani/',
  '/catalog/krishki-dlya-stakaniv': '/catalog/kryshky-dlya-stakaniv/',
  '/catalog/termochohli': '/catalog/termochokhly/',
  '/catalog/trimachi': '/catalog/trymachi-dlya-stakaniv/',
  '/catalog/trubochki-paperovi': '/catalog/trubochky-paperovi/',
  '/catalog/trubochki-polimerni': '/catalog/trubochky-polimerni/',
  '/catalog/lanch-box': '/catalog/lanch-boksy/',
  '/catalog/salatnitsa': '/catalog/salatnyky/',
  '/catalog/supnik': '/catalog/supnyky/',
  '/catalog/alyuminievi-kontejneri': '/catalog/konteynery-alyuminiyevi/',
  '/catalog/tarilka-pryamokutna': '/catalog/tarilky-ta-sousnyky/',
  '/catalog/upakovka-dlya-fast-fudu': '/catalog/fastfud/',
  '/catalog/paketi-paperovi': '/catalog/pakety-z-ruchkamy/',
  '/catalog/paket-sashe': '/catalog/pakety-sashe/',
  '/catalog/suputni-tovari': '/catalog/suputni-tovary/',
  // Категорії, додані разом із переходом на шестигрупову структуру
  '/catalog/korobki-dlya-pitsi': '/catalog/korobky-dlya-pitsy/',
  '/catalog/korobka-dlya-pitsi': '/catalog/korobky-dlya-pitsy/',
  '/catalog/upakovka-dlya-sushi': '/catalog/upakovka-dlya-sushi-ta-vok/',
  '/catalog/upakovka-dlya-vok': '/catalog/upakovka-dlya-sushi-ta-vok/',
  '/catalog/morozivnitsi': '/catalog/morozyvnytsi/',
  '/catalog/filtr-paket': '/catalog/filtr-pakety/',
  '/catalog/stakani-pet': '/catalog/stakany-pet/',
  '/catalog/desertnitsi-pet': '/catalog/desertnytsi-pet/',
  '/catalog/stolovi-pribori': '/catalog/stolovi-prybory/',
  // Групи, що змінили слаг при переході від угруповання «за сценарієм»
  // до угруповання «за типом товару» — структури діючого сайту клієнта
  '/catalog/dlya-napoyiv': '/catalog/stakany/',
  '/catalog/yizha-navynos': '/catalog/konteynery/',
  '/all-products': '/catalog/',
  '/branding': '/brenduvannya/',
  '/druk-na-paperovih-stakanchikah': '/brenduvannya/druk-na-stakanakh/',
  '/news': '/blog/',
  '/contact': '/kontakty/',
  // Відомі статті старого блогу: російські slug під українським контентом
  '/news/bumazhnaya-upakovka-dlya-edy-navynos-ot-smartekopak':
    '/blog/paperova-upakovka-dlya-yizhi-navynos/',
  '/news/paperovi-stakani-na-scho-varto-zvernuti-uvagu': '/blog/yak-vybraty-paperovi-stakany/',
  '/news/druk-na-paperovih-stakanchikah-vid-smartekopak':
    '/blog/druk-na-paperovykh-stakanchykakh/',
  '/news/perevagi-paperovoi-upakovki-dlya-biznesu':
    '/blog/perevahy-paperovoyi-upakovky-dlya-biznesu/',
};

const PATTERNS: [RegExp, (m: RegExpMatchArray) => string][] = [
  // Стара пагінація й «показати все» — прибираємо дублі
  [/^\/catalog\/([^/]+)\/page-all$/, (m) => `/catalog/${m[1]}/`],
  [/^\/catalog\/([^/]+)\/page-\d+$/, (m) => `/catalog/${m[1]}/`],
  // Товар переїхав з /products/ на /product/
  [/^\/products\/([^/]+)$/, (m) => `/product/${m[1]}/`],
  // Решта блогу — за загальним правилом
  [/^\/news\/([^/]+)$/, (m) => `/blog/${m[1]}/`],
];

const applyOnce = (pathname: string): string | null => {
  const clean = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;

  // Старий сайт віддавав /catalog/Lanch-box з великої літери
  const lower = clean.toLowerCase();

  const exact = EXACT[clean] ?? EXACT[lower];
  if (exact) return exact;

  for (const [re, build] of PATTERNS) {
    const m = clean.match(re) ?? lower.match(re);
    if (m) return build(m);
  }

  // Будь-який інший URL із великими літерами — на нижній регістр
  if (clean !== lower) return `${lower}/`;

  return null;
};

/**
 * Повертає новий шлях для старого або null, якщо правила немає.
 * `pathname` — без мовного префікса.
 *
 * Правила застосовуються транзитивно: /catalog/upakovka-dlya-fast-fudu/page-all
 * спершу втрачає page-all, а потім перетворюється на /catalog/fastfud/.
 * Інакше вийшов би ланцюжок із двох 301.
 */
export function legacyTarget(pathname: string): string | null {
  let current = pathname;
  let result: string | null = null;

  for (let i = 0; i < 3; i += 1) {
    const next = applyOnce(current);
    if (next === null || next === current) break;
    result = next;
    current = next;
  }

  return result;
}
