'use strict';

const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const seedDir = path.join(__dirname, '..', 'seed');

test('seed/institutions.json — коректна структура замовників', () => {
  const list = JSON.parse(fs.readFileSync(path.join(seedDir, 'institutions.json'), 'utf8'));
  assert.ok(Array.isArray(list), 'має бути масив');
  assert.ok(list.length > 100, `очікується понад 100 замовників, отримано ${list.length}`);
  for (const c of list) {
    assert.ok(typeof c.name === 'string' && c.name.length > 0, 'кожен замовник має назву');
    assert.ok('code' in c && 'short_name' in c && 'category' in c, 'є поля code/short_name/category');
  }
  const codes = list.map((c) => c.code).filter(Boolean);
  assert.equal(new Set(codes).size, codes.length, 'коди замовників унікальні');
});

// Та сама нормалізація, що і в scripts/import-institutions.js: назви
// порівнюються без лапок, апострофів, дефісів і регістру, інакше
// «КЗ "Ліцей"» і «КЗ Ліцей» вважалися б різними закладами.
function normName(s) {
  return String(s || '').toLowerCase()
    .replace(/[«»"“”„]/g, ' ').replace(/['’ʼ`´]/g, '')
    .replace(/[–—−-]/g, ' ').replace(/[.,;:()]/g, ' ')
    .replace(/\s+/g, ' ').trim();
}

test('seed/institutions.json — назви закладів не дублюються', () => {
  const list = JSON.parse(fs.readFileSync(path.join(seedDir, 'institutions.json'), 'utf8'));
  const seen = new Set();
  const dups = [];
  for (const c of list) {
    const key = normName(c.name);
    if (seen.has(key)) dups.push(c.name);
    else seen.add(key);
  }
  assert.deepEqual(dups, [], `дублі назв: ${dups.slice(0, 3).join(' | ')}`);
});

test('seed/institutions.json — у назвах застосовані скорочення', () => {
  const list = JSON.parse(fs.readFileSync(path.join(seedDir, 'institutions.json'), 'utf8'));
  const { abbreviate } = require('../src/abbreviate');
  // Жодна назва не має містити довгої форми, яку слід було скоротити:
  // повторне скорочення не повинно нічого змінювати.
  const notAbbreviated = list.filter((c) => abbreviate(c.name) !== c.name);
  assert.deepEqual(
    notAbbreviated.map((c) => c.name).slice(0, 3), [],
    `назви без застосованих скорочень: ${notAbbreviated.length}`
  );
});

test('seed/products.json — коректна структура товарів', () => {
  const list = JSON.parse(fs.readFileSync(path.join(seedDir, 'products.json'), 'utf8'));
  assert.ok(Array.isArray(list) && list.length > 0);
  for (const p of list) {
    assert.ok(typeof p.name === 'string' && p.name.length > 0);
    assert.ok(typeof p.unit === 'string');
    assert.equal(p.price, 0, 'товари завантажуються з ціною 0');
  }
});
