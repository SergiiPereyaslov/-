'use strict';

// Додає до бази заклади з seed/institutions.json, яких у ній ще немає.
//
// Навіщо: початкове наповнення спрацьовує лише на порожній базі, а перелік
// закладів живий — з часом з'являються нові. Ця команда дозволяє долити
// нові записи в уже наповнену базу, не чіпаючи наявні.
//
// Запуск:  npm run import:institutions
//          npm run import:institutions -- --dry   (лише показати, нічого не змінювати)

const path = require('node:path');
const fs = require('node:fs');
const { db, init, transaction } = require('../src/db');

const dryRun = process.argv.includes('--dry');

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

function main() {
  init();

  const file = path.join(__dirname, '..', 'seed', 'institutions.json');
  if (!fs.existsSync(file)) {
    console.error('Не знайдено seed/institutions.json');
    process.exit(1);
  }
  const list = JSON.parse(fs.readFileSync(file, 'utf8'));

  // Наявні заклади — і за назвою, і за кодом (код надійніший, якщо він є).
  const existing = db.prepare('SELECT name, code FROM clients').all();
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
    console.log(`У базі вже є всі ${list.length} закладів із seed-файлу. Нічого додавати.`);
    return;
  }

  console.log(`Нових закладів: ${toAdd.length} (у базі зараз ${existing.length}).`);
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
  transaction(() => {
    for (const c of toAdd) ins.run(c);
  });
  console.log(`\n✔ Додано ${toAdd.length} закладів. Усього в базі: ${existing.length + toAdd.length}.`);
}

main();
