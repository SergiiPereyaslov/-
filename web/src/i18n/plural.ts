import type { Locale } from '@/data/types';

/**
 * Слов'янські числівники: «1 позиція», «2 позиції», «5 позицій».
 *
 * Це не косметика. Рядок «1 позицій» потрапляє в сніпет пошуку й читається
 * як недбалість — саме там, де сторінка вперше зустрічається з клієнтом.
 *
 * Правило однакове для української та російської, тому форма одна на дві мови.
 */
export const plural = (n: number, forms: [string, string, string]): string => {
  const abs = Math.abs(n) % 100;
  const last = abs % 10;
  if (abs > 10 && abs < 20) return forms[2];
  if (last > 1 && last < 5) return forms[1];
  if (last === 1) return forms[0];
  return forms[2];
};

/** Готові набори, які використовуються в мета-описах каталогу. */
const FORMS = {
  position: {
    uk: ['позиція', 'позиції', 'позицій'],
    ru: ['позиция', 'позиции', 'позиций'],
  },
  product: {
    uk: ['товар', 'товари', 'товарів'],
    ru: ['товар', 'товара', 'товаров'],
  },
  piece: {
    uk: ['штука', 'штуки', 'штук'],
    ru: ['штука', 'штуки', 'штук'],
  },
} as const;

type FormKey = keyof typeof FORMS;

/** «12 позицій» — число разом із правильною формою слова. */
export const count = (n: number, key: FormKey, l: Locale): string =>
  `${n} ${plural(n, FORMS[key][l] as [string, string, string])}`;
