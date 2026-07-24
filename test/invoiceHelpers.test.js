'use strict';

const { test } = require('node:test');
const assert = require('node:assert');
const { parseItems, itemsTotal, toNumber, round2 } = require('../src/invoiceHelpers');

test('toNumber — приймає кому як десятковий роздільник', () => {
  assert.equal(toNumber('1500,50'), 1500.5);
  assert.equal(toNumber('1 500,50'), 1500.5);
  assert.equal(toNumber('25000'), 25000);
  assert.equal(toNumber(''), 0);
  assert.equal(toNumber(undefined), 0);
});

test('parseItems — коректно рахує суму позиції з ціною через кому', () => {
  const body = {
    item_name: ['Консультаційні послуги', 'Розробка сайту'],
    item_unit: ['послуга', 'шт'],
    item_qty: ['2', '1'],
    item_price: ['1500,50', '25000'],
  };
  const items = parseItems(body);
  assert.equal(items.length, 2);
  assert.equal(items[0].amount, 3001);   // 2 × 1500,50
  assert.equal(items[1].amount, 25000);
  assert.equal(itemsTotal(items), 28001);
});

test('parseItems — пропускає рядки без назви, зберігає нумерацію', () => {
  const body = {
    item_name: ['', 'Послуга Б', ''],
    item_unit: ['шт', 'год', 'шт'],
    item_qty: ['1', '3', '1'],
    item_price: ['100', '200', '50'],
  };
  const items = parseItems(body);
  assert.equal(items.length, 1);
  assert.equal(items[0].name, 'Послуга Б');
  assert.equal(items[0].position, 1);
  assert.equal(items[0].amount, 600);
});

test('parseItems — обробляє один рядок (не масив)', () => {
  const body = {
    item_name: 'Одна послуга',
    item_unit: 'шт',
    item_qty: '2',
    item_price: '10,25',
  };
  const items = parseItems(body);
  assert.equal(items.length, 1);
  assert.equal(items[0].amount, 20.5);
});

test('round2 — банківське округлення до копійок', () => {
  assert.equal(round2(3.005), 3.01);
  assert.equal(round2(2 * 1500.5), 3001);
});
