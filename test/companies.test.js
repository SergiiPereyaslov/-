'use strict';

const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const file = path.join(__dirname, '..', 'seed', 'companies.json');

test('seed/companies.json — дві компанії з коректними реквізитами', () => {
  const list = JSON.parse(fs.readFileSync(file, 'utf8'));
  assert.equal(list.length, 2, 'очікується рівно дві компанії');
  for (const c of list) {
    assert.ok(c.name && c.name.length > 0, 'назва компанії задана');
    assert.ok(c.edrpou && /^\d{8}$/.test(c.edrpou), `ЄДРПОУ має бути 8 цифр: ${c.edrpou}`);
    assert.ok(Array.isArray(c.bank_accounts) && c.bank_accounts.length >= 1, 'є хоча б один банківський рахунок');
    const defaults = c.bank_accounts.filter((a) => a.is_default);
    assert.equal(defaults.length, 1, 'рівно один рахунок позначено типовим');
    for (const a of c.bank_accounts) {
      assert.ok(/^UA\d{27}$/.test(a.iban), `IBAN має коректний український формат: ${a.iban}`);
    }
  }
});

test('seed/companies.json — перша компанія має два банківські рахунки', () => {
  const list = JSON.parse(fs.readFileSync(file, 'utf8'));
  assert.equal(list[0].bank_accounts.length, 2);
});
