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

const args = process.argv.slice(2);
const dryRun = args.includes('--dry');
const rootDir = args.find((a) => !a.startsWith('--'));

const ALLOWED = new Set(['.doc', '.docx', '.rtf', '.odt', '.pdf', '.xls', '.xlsx', '.txt', '.jpg', '.jpeg', '.png']);

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
    if (!client) { unmatched.push(folder); continue; }

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
    unmatched.forEach((f) => console.log(`  ✗ ${f}`));
    console.log('');
    console.log('Створіть цих замовників у розділі «Замовники» або перевірте назву папки,');
    console.log('після чого запустіть команду ще раз — уже прикріплені файли не дублюються.');
  }
  if (dryRun) console.log('\n--dry: нічого не змінено.');
}

main();
