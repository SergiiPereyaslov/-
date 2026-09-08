/**
 * A/B-тест навігації каталогу.
 *
 * Що порівнюється (див. docs/smartecopack/05-katalog-analiz.md):
 *   A — контроль: вхід у каталог тільки через мега-меню «Каталог».
 *   B — новий: те саме плюс блок «Для кого» на головній і секторні посадкові.
 *
 * Чому не серверний рендер по варіанту: сторінки генеруються статично, і
 * розгалуження на сервері перетворило б їх на динамічні. Замість цього
 * обидва варіанти є в розмітці, а інлайн-скрипт до першого фарбування
 * ставить на <html> атрибут data-nav. CSS ховає зайве — без миготіння.
 *
 * Вимкнений тест = усі бачать варіант B (нову структуру). Це навмисно:
 * рішення вже прийняте, тест лише перевіряє його на реальному трафіку.
 */
export const AB_COOKIE = 'sep_nav';
export const AB_ATTR = 'data-nav';
export const AB_VARIANTS = ['a', 'b'] as const;
export type AbVariant = (typeof AB_VARIANTS)[number];

/** Тест вмикається однією змінною оточення. За замовчуванням вимкнений. */
export const AB_ENABLED = process.env.NEXT_PUBLIC_AB_NAV === '1';

export const isVariant = (value: unknown): value is AbVariant =>
  value === 'a' || value === 'b';

/** 180 днів: щоб відвідувач не змінив варіант посеред тесту. */
const MAX_AGE = 60 * 60 * 24 * 180;

/**
 * Інлайн-скрипт присвоєння варіанта. Виконується до першого фарбування,
 * тому користувач ніколи не бачить спершу один варіант, а потім інший.
 *
 * Розподіл 50/50 через crypto.getRandomValues, а не Math.random: у деяких
 * рушіях Math.random погано розподілений на коротких серіях, і на перших
 * сотнях сесій це дало б перекіс, який виглядав би як результат тесту.
 */
export const abScript = AB_ENABLED
  ? `(function(){try{
var m=document.cookie.match(/(?:^|; )${AB_COOKIE}=([ab])/);
var v=m&&m[1];
if(!v){var a=new Uint8Array(1);crypto.getRandomValues(a);v=a[0]%2?'b':'a';
document.cookie='${AB_COOKIE}='+v+';path=/;max-age=${MAX_AGE};samesite=lax';}
document.documentElement.setAttribute('${AB_ATTR}',v);
}catch(e){document.documentElement.setAttribute('${AB_ATTR}','b');}})();`
  : `document.documentElement.setAttribute('${AB_ATTR}','b');`;

/** Поточний варіант на клієнті. На сервері завжди 'b' — див. коментар вище. */
export const currentVariant = (): AbVariant => {
  if (typeof document === 'undefined') return 'b';
  const attr = document.documentElement.getAttribute(AB_ATTR);
  return isVariant(attr) ? attr : 'b';
};

/** Метрики, які рахує лічильник. Ключі збігаються з полями AbStat. */
export type AbMetric = 'sessions' | 'catalog' | 'cart' | 'search' | 'leads';
