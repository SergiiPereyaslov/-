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

const cardLocals = (extra = {}) => ({
  title: 'T', inst, invoices: [],
  totals: { cnt: 0, sum_all: 0, sum_paid: 0, sum_unpaid: 0 }, fmt, saved: '', error: '',
  files: [], oldestFirst: false,
  humanSize: (n) => `${n} Б`, allowedHint: 'Word, PDF',
  ...extra,
});

test('картка закладу рендериться без помилок', async () => {
  const out = await render('clients/card.ejs', cardLocals());
  assert.match(out, /Тестовий коледж/);
  assert.match(out, /Історія документів/);
  assert.match(out, /Файли договорів/);
});

test('картка закладу показує прикріплені файли договорів', async () => {
  const out = await render('clients/card.ejs', cardLocals({
    files: [{
      id: 7, original_name: 'Договір 12-25.docx', title: 'Основний договір',
      size: 2048, uploader: 'Петренко П.', created_at: '2026-07-28 10:00:00',
    }],
  }));
  assert.match(out, /Договір 12-25\.docx/);
  assert.match(out, /Основний договір/);
  assert.match(out, /\/clients\/1\/files\/7/);
});

test('картка закладу дає перемикач сортування, коли документів більше одного', async () => {
  const invoices = [1, 2].map((n) => ({
    id: n, number: String(n), invoice_date: `2026-0${n}-01`, total: 100,
    status: 'issued', company_short: 'ТОВ', print_with_contract: 0,
  }));
  const out = await render('clients/card.ejs', cardLocals({ invoices }));
  assert.match(out, /Спочатку нові/);
  assert.match(out, /Спочатку старі/);
  assert.match(out, /\/invoices\/1\/duplicate/); // кнопка «Копія» в папці
});

test('форма замовника рендериться і для нового, і для наявного запису', async () => {
  const existing = await render('clients/form.ejs', { title: 'T', inst, action: '/clients/1/edit' });
  assert.match(existing, /Тестовий коледж/);

  const fresh = await render('clients/form.ejs', { title: 'T', inst: {}, action: '/clients/new' });
  assert.match(fresh, /Назва замовника/);
});

test('сторінка договору рендериться', async () => {
  const out = await render('clients/contract.ejs', {
    title: 'T', inst, placeholders: [['ЗАМОВНИК', 'Назва закладу']],
  });
  assert.match(out, /Текст договору/);
  assert.match(out, /ЗАМОВНИК/);
});
