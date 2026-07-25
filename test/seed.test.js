'use strict';

const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const seedDir = path.join(__dirname, '..', 'seed');

test('seed/institutions.json — коректна структура закладів', () => {
  const list = JSON.parse(fs.readFileSync(path.join(seedDir, 'institutions.json'), 'utf8'));
  assert.ok(Array.isArray(list), 'має бути масив');
  assert.ok(list.length > 1000, `очікується понад 1000 закладів, отримано ${list.length}`);
  for (const c of list) {
    assert.ok(typeof c.name === 'string' && c.name.length > 0, 'кожен заклад має назву');
    assert.ok('code' in c && 'short_name' in c && 'category' in c, 'є поля code/short_name/category');
  }
  const codes = list.map((c) => c.code).filter(Boolean);
  assert.equal(new Set(codes).size, codes.length, 'коди закладів унікальні');
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
