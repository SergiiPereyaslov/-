/**
 * Мапа 301 зі старих URL. Джерело — docs/smartecopack/redirects-301.csv.
 *
 * Правила застосовуються в middleware, а не в next.config, свідомо:
 * при trailingSlash: true вбудована нормалізація слеша спрацьовує раніше
 * за redirects() і дає ланцюжок 308 → 301. Middleware виконується першим,
 * тому старий URL веде на новий за один хоп.
 */
const EXACT: Record<string, string> = {
  /* ── Категорії ─────────────────────────────────────────────────────── */
  // Джерело — краул старого сайту від 02.04.2025 (982 URL), не здогадки.
  '/catalog/stakani-paperovi': '/catalog/stakany-paperovi/',
  // Окрема категорія старого сайту; у нас одношарові живуть у «Стакани паперові»
  '/catalog/stakani-odnosharovi': '/catalog/stakany-paperovi/',
  '/catalog/stakani-dvosharovi': '/catalog/stakany-dvosharovi/',
  '/catalog/stakani-gofrovani': '/catalog/stakany-gofrovani/',
  '/catalog/krishki-dlya-stakaniv': '/catalog/kryshky-dlya-stakaniv/',
  '/catalog/termochohli': '/catalog/termochokhly/',
  '/catalog/trimachi': '/catalog/trymachi-dlya-stakaniv/',

  // «Паперові контейнери для їжі» — насправді група, а не категорія
  '/catalog/stolovij-posud': '/catalog/konteynery/',
  '/catalog/Lanch-box': '/catalog/lanch-boksy/',
  '/catalog/salatnik-z-plastikovoyu-krishkoyu': '/catalog/salatnyky/',
  '/catalog/supnik': '/catalog/supnyky/',
  '/catalog/alyuminievi-kontejneri': '/catalog/konteynery-alyuminiyevi/',
  '/catalog/tarilka-pryamokutna': '/catalog/tarilky-ta-sousnyky/',
  '/catalog/morozivnitsi': '/catalog/morozyvnytsi/',

  '/catalog/upakovka-dlya-fast-fudu': '/catalog/fastfud/',
  '/catalog/korobka-dlya-pitsi': '/catalog/korobky-dlya-pitsy/',
  '/catalog/upakovka-dlya-gamburgeru': '/catalog/burger-boksy/',
  '/catalog/korobka-dlya-sushi-shidnoi-kuhni': '/catalog/upakovka-dlya-sushi-ta-vok/',
  // upakovka-dlya-kartopli-fri збігається зі старим слагом — правило не потрібне

  // «Крафт пакети оптом» — теж група, а не категорія
  '/catalog/paketi-paperovi': '/catalog/pakety/',
  '/catalog/paket-z-ruchkami': '/catalog/pakety-z-ruchkamy/',
  // Слаг оманливий: сторінка називається «Крафт пакети БЕЗ ручок»
  '/catalog/paket-z-ruchkami2': '/catalog/pakety-bez-ruchok/',
  '/catalog/paket-sashe': '/catalog/pakety-sashe/',

  '/catalog/suputni-tovari': '/catalog/suputni-tovary/',
  '/catalog/trubochki-paperovi': '/catalog/trubochky-paperovi/',
  '/catalog/trubochki-polimerni': '/catalog/trubochky-polimerni/',
  '/catalog/mishalki': '/catalog/mishalky/',
  '/catalog/servetki': '/catalog/servetky/',
  '/catalog/filtr-paket': '/catalog/filtr-pakety/',
  // «Цукор в стіках» під технічним слагом
  '/catalog/portsijni-tovari': '/catalog/stiky-tsukru/',

  // «РЕТ посуд» — група; «Стакани з купольною кришкою» — категорія під нею
  '/catalog/stakani-pet': '/catalog/pet-posud/',
  '/catalog/stakani-ret': '/catalog/stakany-pet/',
  // Друкарська помилка в слагу, на старому сайті вже віддає 404
  '/catalog/stakani-rr': '/catalog/stakany-pet/',
  '/catalog/desertnitsi-pet': '/catalog/desertnytsi-pet/',
  '/catalog/stolovi-pribori-ps': '/catalog/stolovi-prybory/',

  /* ── Службові й статичні ───────────────────────────────────────────── */
  '/all-products': '/catalog/',
  '/branding': '/brenduvannya/',
  '/druk-na-paperovih-stakanchikah': '/brenduvannya/druk-na-stakanakh/',
  '/druk-na-kraft-paketah': '/brenduvannya/druk-na-paketakh/',
  '/dostavka': '/dostavka-i-oplata/',
  '/contact': '/kontakty/',
  '/politika-konfidentsialnosti': '/polityka-konfidentsiynosti/',
  '/obmin-ta-povernennya-tovaru': '/publichna-oferta/',
  // Переваги були окремою сторінкою; той самий зміст тепер на «Про нас»
  '/perevagi': '/pro-nas/',
  // Порівняння й вибране — функції старого рушія, яких у нас немає
  '/comparison': '/catalog/',
  '/wishlist': '/catalog/',

  /* ── Блог ──────────────────────────────────────────────────────────── */
  '/news': '/blog/',
  '/all-posts': '/blog/',
  '/authors': '/blog/',
  // Чотири статті, під які в нас є свій матеріал
  '/news/paperovi-stakani-na-scho-varto-zvernuti-uvagu': '/blog/yak-vybraty-paperovi-stakany/',
  '/news/perevagi-paperovoi-upakovki-dlya-biznesu':
    '/blog/perevahy-paperovoyi-upakovky-dlya-biznesu/',
  '/news/bumazhnaya-upakovka-na-chto-obrait-vnimanie-pri-vybore':
    '/blog/paperova-upakovka-dlya-yizhi-navynos/',
  '/news/druk-na-paperovih-upakovkah': '/blog/druk-na-paperovykh-stakanchykakh/',
};

/**
 * Решта 14 статей старого блогу. Свого матеріалу під них немає, тому ведемо
 * на список блогу, а не на випадкову статтю: нерелевантна ціль гірша за
 * загальну сторінку — і для читача, і для пошуку.
 *
 * Коли ці статті буде переписано, кожен рядок замінюється на конкретний URL.
 */
const OLD_POSTS = [
  '10-klyuchevyh-aspektov-dlya-uspeshnogo-otkrytiya-kofejni',
  'brenduvannya---imidzh-abo-vpiznavanist-brendu',
  'bumazhnyj-paket-aktsenty-pri-vybore-optimalnogo-varianta',
  'eko-pakuvannya-j-vazhlivi-dribnichki',
  'etapy-perehoda-na-ekologichnuyu-upakovku-dlya-vashego-biznesa',
  'innovatsii---kak-razvivaetsya-mir-upakovki',
  'neobychnaya-upakovka-dlya-fastfuda-kak-vydelitsya-sredi-konkurentov',
  'osvizhayuchi-litni-tendentsii-u-sviti-pakuvannya-zminyuyuchisya-potrebi-ta-sezonni-prioriteti',
  'rozumna-upakovka---trend-na-efektivnit',
  'smartecopack-na-interpack2023-dyusseldorf',
  'sposoby-brendirovaniya-upakovki-dlya-fastfuda',
  'upakovka-dlya-konditeriv',
  'vidminnosti-plastikovogo-pakuvannya-vid-paperovogo',
];

for (const slug of OLD_POSTS) EXACT[`/news/${slug}`] = '/blog/';

const PATTERNS: [RegExp, (m: RegExpMatchArray) => string][] = [
  // Стара пагінація й «показати все» — прибираємо дублі
  [/^\/catalog\/([^/]+)\/page-all$/, (m) => `/catalog/${m[1]}/`],
  [/^\/catalog\/([^/]+)\/page-\d+$/, (m) => `/catalog/${m[1]}/`],
  // Фільтри старого рушія: «акційні» та «рекомендовані». У краулі їх 26,
  // усі з canonical на категорію — тобто дублі, які нема сенсу зберігати.
  [/^\/catalog\/([^/]+)\/filter-[a-z]+$/, (m) => `/catalog/${m[1]}/`],
  // /all-products із будь-яким хвостом фільтрів і пагінації — на каталог
  [/^\/all-products(?:\/(?:filter-[a-z]+|page-\d+|page-all))+$/, () => '/all-products'],
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
