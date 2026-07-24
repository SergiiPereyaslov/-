'use strict';

// ── Українська словоформа для числівників ────────────────────────────────
const ONES = {
  m: ['', 'один', 'два', 'три', 'чотири', 'п’ять', 'шість', 'сім', 'вісім', 'дев’ять'],
  f: ['', 'одна', 'дві', 'три', 'чотири', 'п’ять', 'шість', 'сім', 'вісім', 'дев’ять'],
};
const TEENS = [
  'десять', 'одинадцять', 'дванадцять', 'тринадцять', 'чотирнадцять',
  'п’ятнадцять', 'шістнадцять', 'сімнадцять', 'вісімнадцять', 'дев’ятнадцять',
];
const TENS = [
  '', '', 'двадцять', 'тридцять', 'сорок', 'п’ятдесят',
  'шістдесят', 'сімдесят', 'вісімдесят', 'дев’яносто',
];
const HUNDREDS = [
  '', 'сто', 'двісті', 'триста', 'чотириста', 'п’ятсот',
  'шістсот', 'сімсот', 'вісімсот', 'дев’ятсот',
];

// Правильна форма множини: forms = [1, 2-4, 5-20].
function plural(n, forms) {
  const abs = Math.abs(n);
  const n10 = abs % 10;
  const n100 = abs % 100;
  if (n10 === 1 && n100 !== 11) return forms[0];
  if (n10 >= 2 && n10 <= 4 && !(n100 >= 12 && n100 <= 14)) return forms[1];
  return forms[2];
}

// Число 0..999 у слова із заданим родом одиниць.
function tripletToWords(n, gender) {
  const parts = [];
  const h = Math.floor(n / 100);
  const t = Math.floor((n % 100) / 10);
  const o = n % 10;
  if (h) parts.push(HUNDREDS[h]);
  if (t > 1) {
    parts.push(TENS[t]);
    if (o) parts.push(ONES[gender][o]);
  } else if (t === 1) {
    parts.push(TEENS[o]);
  } else if (o) {
    parts.push(ONES[gender][o]);
  }
  return parts.join(' ');
}

const SCALES = [
  null,
  ['тисяча', 'тисячі', 'тисяч'],
  ['мільйон', 'мільйони', 'мільйонів'],
  ['мільярд', 'мільярди', 'мільярдів'],
  ['трильйон', 'трильйони', 'трильйонів'],
];

// Ціле число у слова. unitGender — рід останньої (одиничної) групи.
function intToWords(n, unitGender) {
  if (n === 0) return 'нуль';
  const groups = [];
  let x = n;
  while (x > 0) {
    groups.push(x % 1000);
    x = Math.floor(x / 1000);
  }
  const parts = [];
  for (let i = groups.length - 1; i >= 0; i--) {
    const g = groups[i];
    if (g === 0) continue;
    const gender = i === 0 ? unitGender : (i === 1 ? 'f' : 'm');
    parts.push(tripletToWords(g, gender));
    if (i > 0) parts.push(plural(g, SCALES[i]));
  }
  return parts.join(' ');
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// Сума у гривнях прописом: "Одна тисяча двісті гривень 50 копійок".
function amountToWords(amount) {
  const value = Math.round(Number(amount) * 100) / 100;
  const hrn = Math.floor(value);
  const kop = Math.round((value - hrn) * 100);
  const words = intToWords(hrn, 'f');
  const hrnWord = plural(hrn, ['гривня', 'гривні', 'гривень']);
  const kopWord = plural(kop, ['копійка', 'копійки', 'копійок']);
  const kopStr = String(kop).padStart(2, '0');
  return capitalize(`${words} ${hrnWord} ${kopStr} ${kopWord}`);
}

// ── Дати ─────────────────────────────────────────────────────────────────
const MONTHS_GENITIVE = [
  'січня', 'лютого', 'березня', 'квітня', 'травня', 'червня',
  'липня', 'серпня', 'вересня', 'жовтня', 'листопада', 'грудня',
];

// "2026-07-24" -> "24 липня 2026 р."
function formatDateUk(isoDate) {
  if (!isoDate) return '';
  const [y, m, d] = String(isoDate).split('-').map(Number);
  if (!y || !m || !d) return isoDate;
  return `${d} ${MONTHS_GENITIVE[m - 1]} ${y} р.`;
}

// ── Гроші / числа ──────────────────────────────────────────────────────────
// 1234.5 -> "1 234,50"
function formatMoney(amount) {
  const value = Math.round(Number(amount || 0) * 100) / 100;
  const [intPart, decPart] = value.toFixed(2).split('.');
  const withSpaces = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${withSpaces},${decPart}`;
}

// Кількість без зайвих нулів: 2 -> "2", 1.5 -> "1,5"
function formatQty(qty) {
  const n = Number(qty || 0);
  const s = Number.isInteger(n) ? String(n) : n.toFixed(3).replace(/0+$/, '').replace(/\.$/, '');
  return s.replace('.', ',');
}

module.exports = {
  plural,
  intToWords,
  amountToWords,
  formatDateUk,
  formatMoney,
  formatQty,
  MONTHS_GENITIVE,
};
