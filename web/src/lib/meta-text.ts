/**
 * Межі мета-тегів і правила складання заголовків та описів.
 *
 * Окремий модуль без серверних залежностей — навмисно. Ці правила потрібні
 * у трьох місцях одразу: на сервері (генерація метаданих), у клієнтському
 * лічильнику адмінки і в скрипті перевірки перед запуском. meta.ts тягне за
 * собою маршрут og-зображення й у клієнт не імпортується.
 */

/**
 * Ліміт заголовка.
 *
 * Ліміт видачі — 60 символів, але кореневий layout додає шаблон
 * « | SmartEcoPack» (15 символів), тому власна частина title має
 * вкладатися в 45. Не додавайте назву компанії в сам заголовок:
 * вона припасується автоматично, інакше бренд задвоюється.
 */
export const BRAND_SUFFIX_LENGTH = ' | SmartEcoPack'.length;
export const TITLE_LIMIT = 60 - BRAND_SUFFIX_LENGTH;

/**
 * Ліміт для сторінок, які відмовляються від назви компанії в заголовку.
 *
 * Це сторінки товарів і фільтрові посадкові. Рішення свідоме: на 299 реальних
 * назвах зі старого сайту (до 82 символів) бренд у заголовку з'їдав рівно ті
 * 15 символів, через які губився ключовий параметр товару — об'єм або розмір.
 * Людина шукає «контейнер алюмінієвий 2000 мл», а не «SmartEcoPack», тож у
 * заголовку картки виграє повнота назви, а не повторення бренду, який усе
 * одно видно в домені й у хлібних крихтах видачі.
 */
export const TITLE_LIMIT_NO_BRAND = 60;

/**
 * Ліміт назви категорії.
 *
 * З назви збирається title за шаблоном «{Назва} оптом — ціна», тому власне
 * назві лишається менше, ніж повний ліміт заголовка. Найдовший хвіст —
 * ` оптом — ціна` (13 символів).
 */
export const CATEGORY_NAME_LIMIT = TITLE_LIMIT - ' оптом — ціна'.length;

/**
 * Межі опису.
 *
 * Google показує близько 155–160 символів. Коротший опис не помилка, але
 * це віддане задарма місце: 100-символьний опис лишає половину сніпета
 * порожньою замість аргументу на користь переходу.
 */
export const DESCRIPTION_MIN = 120;
export const DESCRIPTION_MAX = 160;

/**
 * Обрізання по межі слова.
 *
 * Обрізка посеред слова («Контейнер з алюмінієвої фольги прямокутни…»)
 * виглядає як помилка сайту, а не як скорочення. Тому відкидаємо останнє
 * неповне слово цілком — і разом із ним висячу кому чи тире.
 */
const cutAtWord = (s: string, max: number): string => {
  if (s.length <= max) return s;
  const head = s.slice(0, max - 1);
  const space = head.lastIndexOf(' ');
  // Якщо слово одне й довше за ліміт — різати нема де, лишаємо як є
  const body = space > max * 0.5 ? head.slice(0, space) : head;
  return `${body.replace(/[\s,;:–—-]+$/, '')}…`;
};

export const clampTitle = (s: string, max = TITLE_LIMIT) => cutAtWord(s, max);

export const clampDescription = (s: string, max = DESCRIPTION_MAX) => cutAtWord(s, max);

/**
 * Заголовок зі складників за спаданням важливості.
 *
 * `base` лишається завжди; кожен наступний хвіст додається лише якщо
 * вкладається в ліміт цілком. Так замість «Пакет крафт 240×140×280 — 340…»
 * виходить «Пакет крафт 240×140×280» — без обрізаної ціни, яка все одно
 * нічого не повідомляє.
 *
 * @example fitTitle('Стакан 340 мл', { text: '110 грн', sep: ' — ' })
 */
export function fitTitle(
  base: string,
  tailsOrLimit: { text: string; sep?: string } | number = TITLE_LIMIT,
  ...rest: ({ text: string; sep?: string } | number)[]
): string {
  // Останній числовий аргумент — ліміт; решта — хвости за спаданням важливості
  const args = [tailsOrLimit, ...rest];
  const limit = (args.filter((a) => typeof a === 'number').at(-1) as number) ?? TITLE_LIMIT;
  const tails = args.filter((a) => typeof a === 'object') as { text: string; sep?: string }[];

  let out = clampTitle(base, limit);
  // Base уже міг бути обрізаний — тоді хвости не має сенсу чіпляти
  if (out.endsWith('…')) return out;

  for (const { text, sep = ' — ' } of tails) {
    if (!text) continue;
    const next = `${out}${sep}${text}`;
    if (next.length <= limit) out = next;
  }
  return out;
}

/**
 * Опис, зібраний так само: обов'язкова частина плюс хвости, поки вкладаються.
 *
 * Хвости впорядковані від найціннішого аргументу до найзагальнішого, тому
 * короткий опис завжди можна доповнити, не переписуючи виклик.
 */
export function fitDescription(base: string, ...tails: (string | string[])[]): string {
  let out = clampDescription(base);
  if (out.endsWith('…')) return out;

  for (const tail of tails) {
    // Масив — це градації одного й того самого хвоста від найповнішого до
    // найкоротшого. Беремо перший, який влазить, і на цьому зупиняємось:
    // інакше в опис потрапили б два варіанти підряд.
    for (const text of Array.isArray(tail) ? tail : [tail]) {
      if (!text) continue;
      const next = `${out} ${text}`;
      if (next.length <= DESCRIPTION_MAX) {
        out = next;
        break;
      }
    }
  }
  return out;
}

/**
 * Скорочення назви товару для заголовка.
 *
 * Реальні назви зі старого сайту доходять до 82 символів:
 * «Контейнер з алюмінієвої фольги прямокутний R64L 240*170*56 мм (2000 мл),
 * 100 шт/уп». Тупа обрізка ріже посеред слова й губить саме те, за чим товар
 * шукають, — об'єм.
 *
 * Порядок такий: спершу прибираємо те, що на сторінці вже є окремим полем
 * (фасування, габарити, код виробника, тип ламінування), і лише якщо назва
 * досі не влазить — лишаємо змістову «голову» й дописуємо ключовий параметр.
 */

/** Кількість у пачці: «100 шт/уп», «(100/1000)», «50 шт». У картці є окремо. */
const PACK_TAILS = [
  /[,\s]*\(\s*\d+\s*\/\s*\d+\s*\)\s*$/,
  /[,\s]*\d+\s*\/\s*\d+\s*$/,
  /[,\s]*\(?\s*\d+\s*шт\.?\s*[/\\]?\s*уп\.?\s*\)?\s*$/i,
  /[,\s]*\d+\s*шт\.?\s*$/i,
];

/**
 * Код виробника (`R64L`, `SP88L`) і тип ламінування (`1РЕ`, `2PE`).
 * І те, і те є в артикулі та характеристиках — у заголовку це шум.
 */
const CODE_TOKENS = /\s(?:[A-ZА-Я]{1,3}\d{1,3}[A-ZА-Я]\b|\d\s?[РP][ЕE]\b)/g;

/** Група габаритів: «240*170*56 мм», «145×120». */
const DIMENSIONS = /\d+\s*[*x×]\s*\d+(?:\s*[*x×]\s*\d+)?(?:\s*мм)?/i;

/** Об'єм або діаметр — саме за ними товар шукають, тому зберігаємо окремо. */
const KEY_PARAM = /(\d+\s*(?:мл|л|г)\b|[ØøΦ]\s*\d+\s*мм)/i;

/**
 * Службові слова, на яких не можна обривати заголовок: «…в ПАПЕРОВІЙ» читається
 * як недописаний рядок, а не як скорочення.
 */
const STOPWORDS = new Set(
  'в у з із зі та і й для на до по при під над без від о об про с со и к от из'.split(' '),
);

/**
 * Прибирає «висячий хвіст» після обрізки: службове слово в кінці або пару
 * «прийменник + слово», від якої лишилась половина думки.
 * «…чорні в індивідуальній» → «…чорні».
 */
const dropDanglingTail = (s: string): string => {
  let words = s.split(' ');
  for (let i = 0; i < 3 && words.length > 1; i += 1) {
    const last = words[words.length - 1].toLowerCase().replace(/[^\p{L}]/gu, '');
    const prev = words[words.length - 2]?.toLowerCase().replace(/[^\p{L}]/gu, '') ?? '';
    if (STOPWORDS.has(last) || STOPWORDS.has(prev)) words = words.slice(0, -1);
    else break;
  }
  return words.join(' ');
};

const tidy = (s: string) =>
  s
    .replace(/\s{2,}/g, ' ')
    .replace(/\s*([(),/])\s*\1/g, '$1')
    .replace(/\(\s*\)/g, '')
    .replace(/[\s,/]+$/, '')
    .replace(/^[\s,/]+/, '')
    .trim();

export function shortenProductName(name: string, spec = '', limit = TITLE_LIMIT): string {
  let s = name.trim();

  for (const re of PACK_TAILS) s = s.replace(re, '');
  s = tidy(s);
  if (s.length <= limit) return s;

  // Ключовий параметр запам'ятовуємо до того, як почнемо різати
  const key = KEY_PARAM.exec(s)?.[1]?.replace(/\s+/g, ' ').trim() ?? '';

  s = tidy(s.replace(CODE_TOKENS, ' '));
  if (s.length <= limit) return s;

  // Габарити — лише якщо ті самі числа вже стоять у полі «Розмір»
  const dims = DIMENSIONS.exec(s);
  if (dims && spec) {
    const digits = (v: string) => v.replace(/\D+/g, '');
    if (digits(spec).includes(digits(dims[0]))) s = tidy(s.replace(dims[0], ' '));
  }
  if (s.length <= limit) return s;

  // Уточнення після скісної риски — деталі картки, а не назва.
  // Дужки навмисно не чіпаємо: у «Набір (виделка та ніж)» вони несуть суть.
  const beforeSlash = tidy(s.replace(/\s*\/.*$/, ''));
  if (beforeSlash.length >= limit * 0.4) s = beforeSlash;
  if (s.length <= limit) return s;

  // Лишилась змістова «голова». Ріжемо по слову й повертаємо ключовий
  // параметр: «Контейнер з алюмінієвої фольги» + «2000 мл» читається,
  // «Контейнер з алюмінієвої фольги прямокутни…» — ні.
  // Ключовий параметр приводимо до «2000 мл», а не «(2000 мл)»
  const cleanKey = key.replace(/[()]/g, '').replace(/\s+/g, ' ').trim();
  const room = cleanKey ? limit - cleanKey.length - 1 : limit;
  const words = s.split(' ');
  let head = '';
  for (const w of words) {
    const next = head ? `${head} ${w}` : w;
    if (next.length > room) break;
    head = next;
  }
  if (!head) head = s.slice(0, room);
  head = tidy(dropDanglingTail(tidy(head)));

  return tidy(cleanKey && !head.includes(cleanKey) ? `${head} ${cleanKey}` : head);
}
