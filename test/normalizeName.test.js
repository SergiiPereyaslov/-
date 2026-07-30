'use strict';

const { test } = require('node:test');
const assert = require('node:assert');
const { normalizeName } = require('../src/normalizeName');

test('normalizeName зрівнює NFC та NFD форми того самого тексту', () => {
  // Так виглядає реальна поломка: macOS (APFS) при розпакуванні архівів
  // повертає назви папок у розкладеній формі (NFD) — «ї» як «і» плюс
  // окремий діакритичний знак, а не одним символом (NFC), як у базі.
  // Без normalize('NFC') ці рядки не збігаються, хоча виглядають однаково.
  const name = 'Приватний заклад вищої освіти Дніпровський технологічний університет ШАГ';
  const nfc = name.normalize('NFC');
  const nfd = name.normalize('NFD');

  assert.notEqual(nfc, nfd, 'тестові дані мають реально відрізнятися побайтово');
  assert.equal(normalizeName(nfc), normalizeName(nfd));
});

test('normalizeName прибирає лапки, апострофи, дефіси та регістр', () => {
  assert.equal(
    normalizeName('Комунальний заклад "Дніпровський коледж"'),
    normalizeName('комунальний заклад «дніпровський коледж»')
  );
  assert.equal(
    normalizeName("Кам'янський фаховий коледж"),
    normalizeName('Кам’янський фаховий коледж')
  );
  assert.equal(
    normalizeName('Відокремлений структурний підрозділ - Дубенський коледж'),
    normalizeName('Відокремлений структурний підрозділ – Дубенський коледж')
  );
});

test('normalizeName стискає подвійні пробіли', () => {
  assert.equal(
    normalizeName('Державний  навчальний  заклад'),
    normalizeName('Державний навчальний заклад')
  );
});

test('normalizeName не падає на порожніх значеннях', () => {
  assert.equal(normalizeName(''), '');
  assert.equal(normalizeName(null), '');
  assert.equal(normalizeName(undefined), '');
});
