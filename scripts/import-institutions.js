'use strict';

// Додає до бази замовників із seed/institutions.json, яких у ній ще немає.
//
// Навіщо: початкове наповнення спрацьовує лише на порожній базі, а перелік
// замовників живий — з часом з'являються нові. Ця команда дозволяє долити
// нові записи в уже наповнену базу, не чіпаючи наявні.
//
// Запуск:  npm run import:institutions
//          npm run import:institutions -- --dry       показати, нічого не змінювати
//          npm run import:institutions -- --replace   видалити всіх наявних і залити заново
//
// --replace не торкається замовників, по яких уже є рахунки: інакше
// загубився б зв'язок з історією документів.

const path = require('node:path');
const fs = require('node:fs');
const { db, init, transaction } = require('../src/db');
// Підключаємо одразу: якщо залежності не встановлені, впадемо ДО того,
// як щось видалимо з бази.
const uploads = require('../src/uploads');

const dryRun = process.argv.includes('--dry');
const replace = process.argv.includes('--replace');

// Порівнюємо назви без огляду на лапки, апострофи, дефіси та регістр —
// інакше «КЗ "Ліцей"» і «КЗ Ліцей» вважалися б різними закладами.
function norm(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[«»"“”„]/g, ' ')
    .replace(/['’ʼ`´]/g, '')
    .replace(/[–—−-]/g, ' ')
    .replace(/[.,;:()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Видаляє наявних замовників перед повторним заливанням (--replace).
// Тих, по яких уже є рахунки, лишаємо: інакше історія документів
// втратила б зв'язок із замовником.
//
// Хто залишиться в базі після --replace: замовники, по яких уже є рахунки.
function keptClients() {
  return db.prepare(
    `SELECT name, code FROM clients
      WHERE id IN (SELECT client_id FROM invoices WHERE client_id IS NOT NULL)`
  ).all();
}

// Файли замовників, яких видалимо, — прибираємо з диска вже після коміту.
function filesToRemove() {
  return db.prepare(
    `SELECT stored_name FROM client_files
      WHERE client_id NOT IN (SELECT client_id FROM invoices WHERE client_id IS NOT NULL)`
  ).all();
}

function deleteRemovableClients() {
  db.prepare(
    `DELETE FROM clients
      WHERE id NOT IN (SELECT client_id FROM invoices WHERE client_id IS NOT NULL)`
  ).run();
}

function main() {
  init();

  const file = path.join(__dirname, '..', 'seed', 'institutions.json');
  if (!fs.existsSync(file)) {
    console.error('Не знайдено seed/institutions.json');
    process.exit(1);
  }
  const list = JSON.parse(fs.readFileSync(file, 'utf8'));

  const totalBefore = db.prepare('SELECT COUNT(*) AS n FROM clients').get().n;

  // Наявні замовники — і за назвою, і за кодом (код надійніший, якщо він є).
  // З --replace звіряємося лише з тими, що лишаються після видалення.
  const existing = replace ? keptClients() : db.prepare('SELECT name, code FROM clients').all();
  if (replace) {
    console.log(`--replace: буде видалено ${totalBefore - existing.length} замовників`
      + (existing.length ? `, збережено ${existing.length} (по них є рахунки)` : '') + '.');
  }
  const byName = new Set(existing.map((c) => norm(c.name)));
  const byCode = new Set(existing.map((c) => String(c.code || '').trim()).filter(Boolean));

  const toAdd = [];
  for (const item of list) {
    const name = String(item.name || '').trim();
    if (!name) continue;
    const code = String(item.code || '').trim();
    if (code && byCode.has(code)) continue;
    if (byName.has(norm(name))) continue;
    toAdd.push({ name, code, short_name: String(item.short_name || '').trim(), category: String(item.category || '').trim() });
    byName.add(norm(name));
    if (code) byCode.add(code);
  }

  if (toAdd.length === 0) {
    console.log(`У базі вже є всі ${list.length} замовників із seed-файлу. Нічого додавати.`);
    return;
  }

  console.log(`Нових замовників: ${toAdd.length} (у базі зараз ${existing.length}).`);
  const byCategory = {};
  for (const c of toAdd) byCategory[c.category || '—'] = (byCategory[c.category || '—'] || 0) + 1;
  for (const [cat, n] of Object.entries(byCategory)) console.log(`  ${cat}: ${n}`);

  if (dryRun) {
    console.log('\n--dry: базу не змінено. Перші 10 назв:');
    toAdd.slice(0, 10).forEach((c) => console.log(`  • ${c.name}`));
    return;
  }

  const ins = db.prepare(
    'INSERT INTO clients (name, code, short_name, category) VALUES (@name, @code, @short_name, @category)'
  );

  // Видалення і вставка — в одній транзакції: якщо щось зірветься,
  // база лишиться як була, а не напівпорожньою.
  const orphanFiles = replace ? filesToRemove() : [];
  transaction(() => {
    if (replace) deleteRemovableClients();
    for (const c of toAdd) ins.run(c);
  });

  // Файли з диска прибираємо лише після успішного коміту.
  for (const f of orphanFiles) uploads.removeFile(f.stored_name);

  const totalAfter = db.prepare('SELECT COUNT(*) AS n FROM clients').get().n;
  if (replace) console.log(`Видалено замовників: ${totalBefore - existing.length}.`);
  console.log(`\n✔ Додано ${toAdd.length} замовників. Усього в базі: ${totalAfter}.`);
}

main();
