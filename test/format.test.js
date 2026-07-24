'use strict';

const { test } = require('node:test');
const assert = require('node:assert');
const fmt = require('../src/format');

test('amountToWords — цілі гривні з правильними родовими формами', () => {
  assert.equal(fmt.amountToWords(0), 'Нуль гривень 00 копійок');
  assert.equal(fmt.amountToWords(1), 'Одна гривня 00 копійок');
  assert.equal(fmt.amountToWords(2), 'Дві гривні 00 копійок');
  assert.equal(fmt.amountToWords(5), 'П’ять гривень 00 копійок');
  assert.equal(fmt.amountToWords(21), 'Двадцять одна гривня 00 копійок');
  assert.equal(fmt.amountToWords(100), 'Сто гривень 00 копійок');
});

test('amountToWords — тисячі (жіночий рід)', () => {
  assert.equal(fmt.amountToWords(1000), 'Одна тисяча гривень 00 копійок');
  assert.equal(fmt.amountToWords(2000), 'Дві тисячі гривень 00 копійок');
  assert.equal(fmt.amountToWords(5000), 'П’ять тисяч гривень 00 копійок');
  assert.equal(fmt.amountToWords(21000), 'Двадцять одна тисяча гривень 00 копійок');
  assert.equal(fmt.amountToWords(28001), 'Двадцять вісім тисяч одна гривня 00 копійок');
});

test('amountToWords — мільйони (чоловічий рід) та копійки', () => {
  assert.equal(fmt.amountToWords(1000000), 'Один мільйон гривень 00 копійок');
  assert.equal(fmt.amountToWords(234.5), 'Двісті тридцять чотири гривні 50 копійок');
  assert.equal(fmt.amountToWords(1234.56), 'Одна тисяча двісті тридцять чотири гривні 56 копійок');
  assert.equal(fmt.amountToWords(2500300.01), 'Два мільйони п’ятсот тисяч триста гривень 01 копійка');
});

test('amountToWords — коректне округлення копійок', () => {
  assert.equal(fmt.amountToWords(9.999), 'Десять гривень 00 копійок');
  assert.equal(fmt.amountToWords(0.1), 'Нуль гривень 10 копійок');
});

test('formatMoney — розділювач тисяч і кома', () => {
  assert.equal(fmt.formatMoney(0), '0,00');
  assert.equal(fmt.formatMoney(1500.5), '1 500,50');
  assert.equal(fmt.formatMoney(28001), '28 001,00');
  assert.equal(fmt.formatMoney(1234567.5), '1 234 567,50');
});

test('formatQty — без зайвих нулів', () => {
  assert.equal(fmt.formatQty(2), '2');
  assert.equal(fmt.formatQty(1.5), '1,5');
  assert.equal(fmt.formatQty(0.25), '0,25');
});

test('formatDateUk — українська дата в родовому відмінку', () => {
  assert.equal(fmt.formatDateUk('2026-07-24'), '24 липня 2026 р.');
  assert.equal(fmt.formatDateUk('2026-01-01'), '1 січня 2026 р.');
  assert.equal(fmt.formatDateUk('2026-12-31'), '31 грудня 2026 р.');
});

test('plural — українські форми множини', () => {
  const f = ['товар', 'товари', 'товарів'];
  assert.equal(fmt.plural(1, f), 'товар');
  assert.equal(fmt.plural(2, f), 'товари');
  assert.equal(fmt.plural(5, f), 'товарів');
  assert.equal(fmt.plural(11, f), 'товарів');
  assert.equal(fmt.plural(21, f), 'товар');
});
