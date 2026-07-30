'use strict';

// Прикріплює договори до замовників, беручи їх із каталогу на вашому диску.
//
// Очікувана структура: у вказаному каталозі — по одній папці на замовника,
// а всередині файли договорів. Назва папки зіставляється з назвою замовника
// (з урахуванням скорочень, лапок і регістру).
//
// Запуск (з каталогу проєкту):
//   npm run import:contracts -- "F:\2026\Автоматизація ОДЦПІТ"
//   npm run import:contracts -- "F:\..." --dry     показати, нічого не змінювати
//
// Повторний запуск не створює дублів: файл із такою самою назвою й розміром
// у того самого замовника пропускається.

const path = require('node:path');
const fs = require('node:fs');
const { db, init, transaction } = require('../src/db');
const uploads = require('../src/uploads');
const { abbreviate } = require('../src/abbreviate');
const { normalizeName: norm } = require('../src/normalizeName');
const { tokenize, diceCoefficient } = require('../src/fuzzyMatch');

const args = process.argv.slice(2);
const dryRun = args.includes('--dry');
const rootDir = args.find((a) => !a.startsWith('--'));

// Нижче цього — підказка вже не інформативна, надто мало спільних слів.
const SUGGEST_MIN_SCORE = 0.45;
// Вище цього — майже напевно той самий замовник, просто інакше набраний
// (лапки, пробіли, часткове скорочення), а не інша схожа установа.
const LIKELY_SAME_SCORE = 0.85;

const ALLOWED = new Set(['.doc', '.docx', '.rtf', '.odt', '.pdf', '.xls', '.xlsx', '.txt', '.jpg', '.jpeg', '.png']);

// Людська назва для символу — щоб показати саме те місце, де розходяться
// нормалізовані рядки, коли схожість висока, але не 100%.
const CHAR_NAMES = {
  0x0020: 'звичайний пробіл', 0x00a0: 'нерозривний пробіл (частий гість у macOS)',
  0xfeff: 'невидимий символ (BOM)', 0x200b: 'невидимий символ нульової ширини',
  0x2019: 'права одинарна лапка', 0x0027: 'апостроф', 0x02bc: 'апостроф-модифікатор',
  0x2116: 'знак «№»',
};
function describeChar(ch) {
  if (ch === undefined) return '(тут рядок закінчується)';
  const code = ch.codePointAt(0);
  const hex = `U+${code.toString(16).toUpperCase().padStart(4, '0')}`;
  const named = CHAR_NAMES[code];
  return `«${ch}» (${hex}${named ? ', ' + named : ''})`;
}

// Перше місце, де нормалізовані назви папки й кандидата розходяться —
// щоб не гадати за скріншотом, а точно показати різницю.
//
// Якщо після точки розходження один рядок просто на символ довший, а
// решта збігається — це не «інша літера», а один зайвий символ (частий
// випадок: невидимий знак, якого немає в списку прибираних). Наївне
// побуквене порівняння в такому місці показало б хибну «заміну літери»
// у кожній наступній позиції — тому спершу перевіряємо саме це.
function firstDifference(a, b) {
  const len = Math.min(a.length, b.length);
  let i = 0;
  while (i < len && a[i] === b[i]) i++;
  if (i === a.length && i === b.length) return null;

  const context = a.slice(Math.max(0, i - 12), i);
  if (a.slice(i + 1) === b.slice(i)) {
    return `  …«${context}» → у папці зайвий невидимий символ ${describeChar(a[i])}, якого немає в базі`;
  }
  if (a.slice(i) === b.slice(i + 1)) {
    return `  …«${context}» → у базі є символ ${describeChar(b[i])}, якого немає в папці`;
  }
  return `  …«${context}» → у папці ${describeChar(a[i])}, у базі ${describeChar(b[i])}`;
}

// Усі файли всередині папки замовника, включно з вкладеними підпапками.
function filesIn(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...filesIn(full));
    else if (ALLOWED.has(path.extname(entry.name).toLowerCase())) out.push(full);
  }
  return out;
}

function main() {
  if (!rootDir) {
    console.error('Вкажіть каталог із папками замовників, напр.:');
    console.error('  npm run import:contracts -- "F:\\2026\\Автоматизація ОДЦПІТ"');
    process.exit(1);
  }
  if (!fs.existsSync(rootDir)) {
    console.error(`Каталог не знайдено: ${rootDir}`);
    process.exit(1);
  }

  init();

  // Замовники з бази: шукаємо і за назвою як є, і за скороченою назвою —
  // папки могли не пройти скорочення.
  const clients = db.prepare('SELECT id, name FROM clients').all();
  const index = new Map();
  for (const c of clients) {
    index.set(norm(c.name), c);
    index.set(norm(abbreviate(c.name)), c);
  }
  // Для підказок за непрямим збігом — набір слів кожного замовника.
  // Лише підказка: два різних замовники в базі можуть мати схожість слів
  // понад 0.9 (наприклад, різні відділення того самого університету),
  // тож автоматично прикріплювати за схожістю небезпечно — можна
  // помилково приписати договір не тому замовнику.
  const withTokens = clients.map((c) => ({ ...c, tokens: tokenize(c.name) }));

  const folders = fs.readdirSync(rootDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  const existingFiles = db.prepare('SELECT client_id, original_name, size FROM client_files').all();
  const seen = new Set(existingFiles.map((f) => `${f.client_id}|${f.original_name}|${f.size}`));

  const ins = db.prepare(
    `INSERT INTO client_files (client_id, original_name, stored_name, size, title, uploaded_by)
     VALUES (@client_id, @original_name, @stored_name, @size, '', NULL)`
  );

  let attached = 0, skipped = 0, empty = 0;
  const unmatched = [];

  for (const folder of folders) {
    const client = index.get(norm(folder)) || index.get(norm(abbreviate(folder)));
    if (!client) {
      // Точного збігу немає — шукаємо до двох найближчих замовників за
      // спільними словами, лише для підказки (не прикріплюємо автоматично).
      const query = new Set([...tokenize(folder), ...tokenize(abbreviate(folder))]);
      const ranked = withTokens
        .map((c) => ({ name: c.name, score: diceCoefficient(query, c.tokens) }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 2)
        .filter((c) => c.score >= SUGGEST_MIN_SCORE);
      unmatched.push({ folder, suggestions: ranked });
      continue;
    }

    const files = filesIn(path.join(rootDir, folder));
    if (files.length === 0) { empty++; continue; }

    for (const src of files) {
      const originalName = path.basename(src);
      const size = fs.statSync(src).size;
      const key = `${client.id}|${originalName}|${size}`;
      if (seen.has(key)) { skipped++; continue; }

      if (!dryRun) {
        const ext = path.extname(originalName).toLowerCase();
        const storedName = `${require('node:crypto').randomBytes(16).toString('hex')}${ext}`;
        fs.copyFileSync(src, path.join(uploads.UPLOAD_DIR, storedName));
        transaction(() => {
          ins.run({ client_id: client.id, original_name: originalName, stored_name: storedName, size });
        });
      }
      seen.add(key);
      attached++;
    }
  }

  console.log('');
  console.log(`Папок у каталозі:        ${folders.length}`);
  console.log(`Зіставлено із замовником: ${folders.length - unmatched.length}`);
  console.log(`Файлів ${dryRun ? 'буде прикріплено' : 'прикріплено'}: ${attached}`);
  if (skipped) console.log(`Пропущено (уже прикріплені): ${skipped}`);
  if (empty) console.log(`Папок без договорів:      ${empty}`);

  if (unmatched.length) {
    console.log('');
    console.log(`Не знайдено замовника для ${unmatched.length} папок:`);
    for (const { folder, suggestions } of unmatched) {
      console.log(`  ✗ ${folder}`);
      for (const s of suggestions) {
        const label = s.score >= LIKELY_SAME_SCORE
          ? 'ймовірно той самий замовник, інакше набраний'
          : 'можливо';
        console.log(`      ${label}: ${s.name}  (схожість ${s.score.toFixed(2)})`);
        // Показуємо різницю для будь-якої підказки, не лише найвпевненіших:
        // якщо після скорочення назви мають бути однаковими, а точний збіг
        // усе одно не спрацював — значить, десь є прихована відмінність,
        // і варто побачити її, а не тільки коли схожість вже й так висока.
        const diff = firstDifference(norm(abbreviate(folder)), norm(s.name));
        if (diff) console.log(diff);
      }
    }
    console.log('');
    console.log('Підказки — лише орієнтир, автоматично нічого не прикріплено: два різних');
    console.log('замовники можуть мати дуже схожі назви (напр. різні відділення того самого');
    console.log('університету), тож переплутати їх легко. Перевірте назву замовника і');
    console.log('прикріпіть файл вручну через його картку, або перейменуйте папку точно');
    console.log('як у базі та запустіть команду ще раз — уже прикріплені файли не дублюються.');
  }
  if (dryRun) console.log('\n--dry: нічого не змінено.');
}

main();
