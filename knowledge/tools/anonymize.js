#!/usr/bin/env node
'use strict';

// Анонімізатор розшифровок дзвінків.
//
// Читає текстові розшифровки, вичищає персональні дані й складає готові .md
// у форматі, з яким далі працює тренажер.
//
// Запуск:
//   node anonymize.js --in ./сирі --out ../компанії/дніпрограф --names ./імена.txt
//
// Файл імен — по одній заміні в рядок:
//   Ірина Коваленко = [Клієнт А]
//   Кав'ярня «Зерно» = [кав'ярня в центрі]
//
// Заміни беріть у квадратні дужки. Українська відмінює, а підстановка ні:
// «працюємо з поточний постачальник» читається як помилка, а
// «працюємо з [постачальник]» — як закреслене місце, і це правильно.
//
// Що прибирається автоматично: номери телефонів, e-mail, конкретні суми,
// довгі послідовності цифр (картки, ЄДРПОУ, рахунки).
//
// Чого скрипт НЕ вміє: вгадувати імена, яких немає у файлі замін. Тому в кінці
// він показує підозрілі слова з великої літери — перегляньте їх очима.

const fs = require('node:fs');
const path = require('node:path');

// ── Аргументи ───────────────────────────────────────────────────────────────
function parseArgs(argv) {
  const args = { in: null, out: null, names: null, dry: false };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--in') args.in = argv[++i];
    else if (a === '--out') args.out = argv[++i];
    else if (a === '--names') args.names = argv[++i];
    else if (a === '--dry') args.dry = true;
  }
  return args;
}

// ── Заміни імен ─────────────────────────────────────────────────────────────
function loadNames(file) {
  if (!file || !fs.existsSync(file)) return [];
  return fs.readFileSync(file, 'utf8')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#') && line.includes('='))
    .map((line) => {
      const i = line.indexOf('=');
      return { from: line.slice(0, i).trim(), to: line.slice(i + 1).trim() };
    })
    // Довші спочатку: щоб «Ірина Коваленко» замінилось раніше за «Ірина».
    .sort((a, b) => b.from.length - a.from.length);
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ── Правила очищення ────────────────────────────────────────────────────────
// Порядок має значення: телефони шукаємо раніше за «довгі числа», інакше
// довге число з'їсть номер і в звіті все виглядатиме не тим, чим є.
const RULES = [
  {
    name: 'e-mail',
    re: /\b[\w.+-]+@[\w-]+\.[\w.-]{2,}\b/g,
    to: '[email]',
  },
  {
    name: 'телефон',
    // +380..., 0XX..., з пробілами, дефісами, дужками.
    // Провідний пробіл захоплюємо в групу й повертаємо назад, інакше слова
    // злипаються: «Мій номер[телефон]».
    re: /(^|\s)(?:\+?38)?[-(]?0\d{2}[-\s)]{0,2}\d{3}[-\s]?\d{2}[-\s]?\d{2}(?!\d)/gm,
    to: '$1[телефон]',
  },
  {
    name: 'сума',
    // Увага: \b у JavaScript не знає кириличних літер — межа слова після «грн»
    // не спрацьовує. Тому замість \b тут заперечний перегляд уперед.
    re: /\d[\d\s]{0,9}(?:[.,]\d{1,2})?\s?(?:грн|гривень|гривні|₴|\$|USD|EUR|€)(?![а-яіїєґА-ЯІЇЄҒҐa-zA-Z])/gu,
    to: '[сума]',
  },
  {
    name: 'сума',
    re: /(?:\$|€|₴)\s?\d[\d\s]{0,9}(?:[.,]\d{1,2})?/g,
    to: '[сума]',
  },
  {
    name: 'довге число',
    // Картки, ЄДРПОУ, рахунки — 8 і більше цифр підряд
    re: /\b\d{8,}\b/g,
    to: '[номер]',
  },
];

// Слова з великої літери, які майже завжди не є персональними даними.
const SAFE_WORDS = new Set([
  'Менеджер', 'Клієнт', 'Так', 'Ні', 'Добре', 'Зрозуміло', 'Доброго', 'Дякую',
  'Але', 'Тобто', 'Ага', 'Алло', 'Будь', 'Ви', 'Я', 'Ми', 'Вони', 'Це', 'Той',
  'Питання', 'Домовились', 'Наберу', 'Скажіть', 'Дивіться', 'Слухаю',
  'Січня', 'Лютого', 'Березня', 'Квітня', 'Травня', 'Червня', 'Липня',
  'Серпня', 'Вересня', 'Жовтня', 'Листопада', 'Грудня',
  'Понеділок', 'Вівторок', 'Середа', 'Четвер', 'Пʼятниця', 'П\'ятниця',
  'Субота', 'Неділя', 'Дніпро', 'Київ', 'Львів', 'Україна', 'Україні',
  'Дніпрограф', 'Смартекопак', 'Клієнта', 'Телефон', 'Пошта', 'Вайбер',
  'Viber', 'Telegram', 'WhatsApp',
  // Часті початки речень — щоб у попередженні не було стіни шуму.
  'Дорого', 'Логічно', 'Мій', 'Моя', 'Наш', 'Наша', 'Напишіть', 'Телефоную',
  'Хоча', 'Тоді', 'Зараз', 'Просто', 'Взагалі', 'Звичайно', 'Може', 'Можна',
  'Треба', 'Давайте', 'Добрий', 'Вибачте', 'Розумію', 'Бачите', 'Знаєте',
  'Ось', 'Там', 'Тут', 'Якщо', 'Коли', 'Що', 'Хто', 'Чому', 'Скільки', 'Як',
  'Ага', 'Ой', 'Ну', 'Та', 'Точно', 'Гаразд', 'Домовилися', 'Передзвоню',
  'Надішлю', 'Перепрошую', 'Хвилинку', 'Секунду', 'Звідки', 'Про',
]);

// ── Нормалізація ролей ──────────────────────────────────────────────────────
// Різні сервіси розпізнавання позначають дійових осіб по-різному.
function normalizeSpeakers(text) {
  return text
    .replace(/^\s*(?:Speaker\s*1|SPEAKER_00|Оператор|Менеджер|М)\s*[:\-]\s*/gim, 'М: ')
    .replace(/^\s*(?:Speaker\s*2|SPEAKER_01|Абонент|Клієнт|К)\s*[:\-]\s*/gim, 'К: ');
}

// Прибирає розмітку субтитрів, якщо розшифровка прийшла у .srt або .vtt.
function stripSubtitles(text) {
  return text
    .replace(/^WEBVTT.*$/gim, '')
    .replace(/^\d+\s*$/gm, '')
    .replace(/^\d{2}:\d{2}:\d{2}[.,]\d{3}\s*-->.*$/gm, '')
    .replace(/\n{3,}/g, '\n\n');
}

// ── Обробка одного файлу ────────────────────────────────────────────────────
function processFile(raw, names) {
  let text = stripSubtitles(raw);
  text = normalizeSpeakers(text);

  const counts = {};

  for (const { from, to } of names) {
    const re = new RegExp(escapeRegExp(from), 'gi');
    const found = text.match(re);
    if (found) {
      counts['імена'] = (counts['імена'] || 0) + found.length;
      text = text.replace(re, to);
    }
  }

  for (const rule of RULES) {
    const found = text.match(rule.re);
    if (found) {
      counts[rule.name] = (counts[rule.name] || 0) + found.length;
      text = text.replace(rule.re, rule.to);
    }
  }

  // Підозрілі слова: усі кириличні з великої літери, яких немає у списку
  // безпечних. Навмисно з запасом — краще показати зайве, ніж пропустити ім'я.
  const suspicious = new Set();
  for (const m of text.matchAll(/[А-ЯІЇЄҒҐ][а-яіїєґ'ʼ-]{2,}/gu)) {
    if (!SAFE_WORDS.has(m[0])) suspicious.add(m[0]);
  }

  return { text: text.trim(), counts, suspicious: [...suspicious].sort() };
}

const HEADER = `<!-- Розшифровка холодного дзвінка. Персональні дані вичищено автоматично.
     Перед використанням перегляньте очима: скрипт не вгадує імена,
     яких не було у файлі замін. -->

## Паспорт

- **Дата:**
- **Менеджер:**
- **Кому дзвонили:** тип клієнта, не назва
- **Хто взяв трубку:**
- **Результат:** Так / Ні / Можливо

## Розшифровка

`;

// ── Точка входу ─────────────────────────────────────────────────────────────
function main() {
  const args = parseArgs(process.argv);

  if (!args.in || !args.out) {
    console.log(`Анонімізатор розшифровок дзвінків

  node anonymize.js --in <папка> --out <папка> [--names імена.txt] [--dry]

    --in     папка з сирими розшифровками (.txt, .md, .srt, .vtt)
    --out    куди складати готові .md
    --names  файл замін, по одному рядку: Ірина Коваленко = Клієнт А
    --dry    лише показати звіт, нічого не записувати
`);
    process.exit(1);
  }

  if (!fs.existsSync(args.in)) {
    console.error(`Папки «${args.in}» немає.`);
    process.exit(1);
  }

  const names = loadNames(args.names);
  if (args.names && names.length === 0) {
    console.warn(`⚠ У файлі замін «${args.names}» не знайдено жодного рядка вигляду «Ім'я = Заміна».`);
  }

  const files = fs.readdirSync(args.in)
    .filter((f) => /\.(txt|md|srt|vtt)$/i.test(f))
    .sort();

  if (files.length === 0) {
    console.error(`У «${args.in}» немає файлів .txt, .md, .srt чи .vtt.`);
    process.exit(1);
  }

  if (!args.dry) fs.mkdirSync(args.out, { recursive: true });

  const total = {};
  const allSuspicious = new Set();

  for (const file of files) {
    const raw = fs.readFileSync(path.join(args.in, file), 'utf8');
    const { text, counts, suspicious } = processFile(raw, names);

    const parts = Object.entries(counts).map(([k, v]) => `${k}: ${v}`);
    console.log(`\n${file}`);
    console.log(`  прибрано — ${parts.length ? parts.join(', ') : 'нічого не знайдено'}`);
    if (suspicious.length) {
      console.log(`  ⚠ перевірте очима: ${suspicious.join(', ')}`);
      suspicious.forEach((s) => allSuspicious.add(s));
    }

    for (const [k, v] of Object.entries(counts)) total[k] = (total[k] || 0) + v;

    if (!args.dry) {
      const out = path.join(args.out, file.replace(/\.(txt|srt|vtt)$/i, '.md'));
      fs.writeFileSync(out, HEADER + text + '\n');
    }
  }

  console.log(`\n${'─'.repeat(50)}`);
  console.log(`Файлів опрацьовано: ${files.length}`);
  console.log(`Прибрано разом: ${Object.entries(total).map(([k, v]) => `${k} — ${v}`).join(', ') || 'нічого'}`);
  if (allSuspicious.size) {
    console.log(`\n⚠ Слова, які варто перевірити вручну (${allSuspicious.size}):`);
    console.log(`   ${[...allSuspicious].sort().join(', ')}`);
    console.log(`   Якщо це імена або назви — додайте їх у файл замін і запустіть ще раз.`);
  }
  if (args.dry) console.log('\n(--dry: нічого не записано)');
  else console.log(`\nГотові файли: ${args.out}`);
}

if (require.main === module) main();

module.exports = { processFile, loadNames, normalizeSpeakers, stripSubtitles, RULES };
