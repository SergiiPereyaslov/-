'use strict';

const { test } = require('node:test');
const assert = require('node:assert');
const path = require('node:path');
const ejs = require('ejs');
const fmt = require('../src/format');

// EJS трактує деякі імена як власні опції, а не як дані. Якщо передати
// локальну змінну з такою назвою (напр. `client`), шаблон компілюється
// в «клієнтському режимі» і падає з «include is not a function».
// Ці тести стережуть від повторення такої помилки.
const RESERVED_EJS_LOCALS = [
  'delimiter', 'scope', 'context', 'debug', 'compileDebug',
  'client', '_with', 'rmWhitespace', 'strict', 'filename', 'async', 'cache',
];

const viewsDir = path.join(__dirname, '..', 'views');

const layoutLocals = {
  user: { full_name: 'Тест', role: 'admin' },
  currentPath: '/clients',
  company: { id: 1, short_name: 'ОДЦПІТ', name: 'ТОВ «ОДЦПІТ»' },
  companies: [{ id: 1, short_name: 'ОДЦПІТ' }],
};

const inst = {
  id: 1, name: 'Тестовий коледж', short_name: 'ТК', code: '100', category: 'Заклад вищої освіти',
  edrpou: '', address: '', contact_person: '', phone: '', email: '',
  contract_template: 'Договір {{ЗАМОВНИК}}', contract_number: '', contract_date: '',
};

function render(view, locals) {
  return new Promise((resolve, reject) => {
    ejs.renderFile(path.join(viewsDir, view), { ...layoutLocals, ...locals },
      (err, out) => (err ? reject(err) : resolve(out)));
  });
}

test('жодна локальна змінна шаблону не має зарезервованої назви EJS', async () => {
  const cases = [
    ['clients/card.ejs', { title: 'T', inst, invoices: [], totals: { cnt: 0, sum_all: 0, sum_paid: 0, sum_unpaid: 0 }, fmt, saved: '', error: '' }],
    ['clients/form.ejs', { title: 'T', inst, action: '/clients/1/edit' }],
    ['clients/contract.ejs', { title: 'T', inst, placeholders: [['ЗАМОВНИК', 'опис']] }],
  ];
  for (const [, locals] of cases) {
    for (const key of Object.keys(locals)) {
      assert.ok(!RESERVED_EJS_LOCALS.includes(key), `локальна змінна «${key}» конфліктує з опцією EJS`);
    }
  }
});

test('картка закладу рендериться без помилок', async () => {
  const out = await render('clients/card.ejs', {
    title: 'T', inst, invoices: [],
    totals: { cnt: 0, sum_all: 0, sum_paid: 0, sum_unpaid: 0 }, fmt, saved: '', error: '',
  });
  assert.match(out, /Тестовий коледж/);
  assert.match(out, /Історія документів/);
});

test('форма закладу рендериться і для нового, і для наявного запису', async () => {
  const existing = await render('clients/form.ejs', { title: 'T', inst, action: '/clients/1/edit' });
  assert.match(existing, /Тестовий коледж/);

  const fresh = await render('clients/form.ejs', { title: 'T', inst: {}, action: '/clients/new' });
  assert.match(fresh, /Назва закладу/);
});

test('сторінка договору рендериться', async () => {
  const out = await render('clients/contract.ejs', {
    title: 'T', inst, placeholders: [['ЗАМОВНИК', 'Назва закладу']],
  });
  assert.match(out, /Текст договору/);
  assert.match(out, /ЗАМОВНИК/);
});
