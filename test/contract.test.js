'use strict';

const { test } = require('node:test');
const assert = require('node:assert');
const { renderContract, renderTemplate, buildValues, PLACEHOLDERS } = require('../src/contract');

const ctx = {
  template: '',
  company: {
    name: 'ТОВ «Дніпрограф»', edrpou: '21864213', address: 'м. Дніпро, пр-т Поля, 82-г',
    phone: '(063) 114 24 51', email: 'dneprograf@gmail.com',
    director_name: 'Переяслов С.В.', place_of_compilation: 'м. Дніпро',
  },
  client: {
    name: 'Дніпровський національний університет', short_name: 'ДНУ', code: '111',
    contract_number: '17/2026', contract_date: '2026-07-27',
  },
  pay: { iban: 'UA023003350000000026001596038', bank_name: 'АТ «Райффайзен Банк»' },
  invoice: { total: 9075 },
  items: [
    { name: 'Диплом бакалавра', quantity: 150, unit: 'шт', price: 45.5, amount: 6825 },
    { name: 'Додаток до диплому', quantity: 150, unit: 'шт', price: 15, amount: 2250 },
  ],
};

test('renderContract — підставляє реквізити обох сторін', () => {
  const out = renderContract({ ...ctx, template: '{{ВИКОНАВЕЦЬ}} (ЄДРПОУ {{ВИКОНАВЕЦЬ_ЄДРПОУ}}) — {{ЗАМОВНИК}}' });
  assert.equal(out, 'ТОВ «Дніпрограф» (ЄДРПОУ 21864213) — Дніпровський національний університет');
});

test('renderContract — номер і дата договору з картки закладу', () => {
  const out = renderContract({ ...ctx, template: 'Договір № {{НОМЕР}} від {{ДАТА}}, {{МІСТО}}' });
  assert.equal(out, 'Договір № 17/2026 від 27 липня 2026 р., м. Дніпро');
});

test('renderContract — порожні номер і дата дають порожнє місце', () => {
  const client = { ...ctx.client, contract_number: '', contract_date: '' };
  const out = renderContract({ ...ctx, client, template: 'Договір № {{НОМЕР}} від {{ДАТА}}.' });
  assert.equal(out, 'Договір №  від .', 'номер і дата мають бути порожніми, а не "undefined"');
});

test('renderContract — сума цифрами і прописом', () => {
  const out = renderContract({ ...ctx, template: '{{СУМА}} грн ({{СУМА_ПРОПИСОМ}})' });
  assert.equal(out, '9 075,00 грн (Дев’ять тисяч сімдесят п’ять гривень 00 копійок)');
});

test('renderContract — перелік позицій', () => {
  const out = renderContract({ ...ctx, template: '{{ПОЗИЦІЇ}}' });
  assert.match(out, /1\. Диплом бакалавра — 150 шт × 45,50 грн = 6 825,00 грн/);
  assert.match(out, /2\. Додаток до диплому — 150 шт × 15,00 грн = 2 250,00 грн/);
});

test('renderTemplate — невідома підстановка лишається як є', () => {
  const out = renderTemplate('Текст {{НЕВІДОМО}} далі', buildValues(ctx));
  assert.equal(out, 'Текст {{НЕВІДОМО}} далі');
});

test('renderTemplate — порожній шаблон не ламається', () => {
  assert.equal(renderTemplate('', buildValues(ctx)), '');
  assert.equal(renderTemplate(null, buildValues(ctx)), '');
});

test('buildValues — усі задокументовані підстановки існують', () => {
  const values = buildValues(ctx);
  for (const [key] of PLACEHOLDERS) {
    assert.ok(Object.prototype.hasOwnProperty.call(values, key), `бракує підстановки {{${key}}}`);
  }
});
