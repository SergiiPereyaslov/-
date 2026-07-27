'use strict';

const express = require('express');
const { db, transaction } = require('../db');
const { requireAuth } = require('../auth');
const { requireCompany, bankAccountsForCompany, defaultAccountForCompany, getCompanyById } = require('../company');
const fmt = require('../format');
const { renderContract } = require('../contract');
const {
  nextSeqForYear, formatInvoiceNumber, parseItems, itemsTotal,
} = require('../invoiceHelpers');

const router = express.Router();
router.use(requireAuth);

// Реквізити компанії, знятi з рахунку на момент виставлення (не залежать від подальших змін).
function companySnapshotFromInvoice(invoice) {
  return {
    name: invoice.company_name,
    edrpou: invoice.company_edrpou,
    address: invoice.company_address,
    phone: invoice.company_phone,
    email: invoice.company_email,
    director_name: invoice.company_director_name,
    accountant_name: invoice.company_accountant_name,
    tax_note: invoice.company_tax_note,
    place_of_compilation: invoice.company_place,
  };
}

// Рахунок для оплати у друкованому документі: знімок з рахунку, або типовий рахунок компанії.
function resolvePayAccount(invoice) {
  if (invoice.pay_iban || invoice.pay_bank) {
    return { iban: invoice.pay_iban, bank_name: invoice.pay_bank };
  }
  const def = invoice.company_id ? defaultAccountForCompany(invoice.company_id) : null;
  if (def) return { iban: def.iban, bank_name: def.bank_name };
  return { iban: '', bank_name: '' };
}

function todayIso() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function servicesList() {
  return db.prepare('SELECT id, name, unit, price FROM services WHERE archived = 0 ORDER BY name COLLATE NOCASE').all();
}

function accountIdForBank(bankAccounts, iban, bankName) {
  const match = bankAccounts.find((a) => a.iban === iban && a.bank_name === bankName);
  return match ? match.id : '';
}

// Готує договір для друку разом із рахунком. Шаблон, номер і дата беруться
// з картки закладу; порожні номер/дата лишають місце для запису від руки.
function buildContractFor(invoice, company, pay, items) {
  if (!invoice.client_id) return null;
  const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(invoice.client_id);
  if (!client || !client.contract_template) return null;
  return {
    number: client.contract_number || '',
    date: client.contract_date || '',
    place: invoice.company_place || company.place_of_compilation || '',
    body: renderContract({
      template: client.contract_template,
      company: { ...company, place_of_compilation: invoice.company_place || '' },
      client, pay, invoice, items,
    }),
  };
}

// Список рахунків (історія) — лише активної компанії.
router.get('/', requireCompany, (req, res) => {
  const q = (req.query.q || '').trim();
  const status = (req.query.status || '').trim();
  const conditions = ['i.company_id = @companyId'];
  const params = { companyId: req.company.id };
  if (q) {
    conditions.push('(i.number LIKE @q OR i.client_name LIKE @q)');
    params.q = `%${q}%`;
  }
  if (status === 'paid' || status === 'issued') {
    conditions.push('i.status = @status');
    params.status = status;
  }
  const where = `WHERE ${conditions.join(' AND ')}`;
  const invoices = db.prepare(
    `SELECT i.*, u.full_name AS author
       FROM invoices i LEFT JOIN users u ON u.id = i.created_by
       ${where}
      ORDER BY i.year DESC, i.seq DESC
      LIMIT 500`
  ).all(params);

  const totals = db.prepare(
    `SELECT
        COALESCE(SUM(total), 0) AS sum_all,
        COALESCE(SUM(CASE WHEN status='paid' THEN total ELSE 0 END), 0) AS sum_paid,
        COALESCE(SUM(CASE WHEN status='issued' THEN total ELSE 0 END), 0) AS sum_unpaid
       FROM invoices i ${where}`
  ).get(params);

  res.render('invoices/list', { title: 'Рахунки', invoices, totals, q, status, fmt });
});

// Форма нового рахунку (у межах активної компанії).
router.get('/new', requireCompany, (req, res) => {
  const company = req.company;
  const bankAccounts = bankAccountsForCompany(company.id);
  const seq = nextSeqForYear(company.id, new Date().getFullYear());
  res.render('invoices/form', {
    title: 'Новий рахунок',
    invoice: {
      number: formatInvoiceNumber(company.invoice_prefix, seq),
      invoice_date: todayIso(),
      client_id: '', client_name: '', notes: '', items: [],
    },
    services: servicesList(), bankAccounts,
    selectedAccountId: (defaultAccountForCompany(company.id) || {}).id || '',
    company, fmt, action: '/invoices/new',
  });
});

// Створення рахунку.
router.post('/new', requireCompany, (req, res) => {
  const company = req.company;
  const bankAccounts = bankAccountsForCompany(company.id);
  const items = parseItems(req.body);
  const clientId = req.body.client_id ? Number(req.body.client_id) : null;
  const client = clientId ? db.prepare('SELECT * FROM clients WHERE id = ?').get(clientId) : null;
  const invoiceDate = (req.body.invoice_date || '').trim();
  const account = req.body.pay_account_id
    ? bankAccounts.find((a) => String(a.id) === String(req.body.pay_account_id))
    : defaultAccountForCompany(company.id);

  const rerender = (error) => res.render('invoices/form', {
    title: 'Новий рахунок',
    invoice: {
      number: (req.body.number || '').trim(),
      invoice_date: invoiceDate,
      client_id: req.body.client_id || '',
      client_name: client ? client.name : '',
      notes: (req.body.notes || '').trim(), items,
    },
    services: servicesList(), bankAccounts,
    selectedAccountId: account ? account.id : '',
    company, fmt, action: '/invoices/new', error,
  });

  if (!client) return rerender('Оберіть заклад (покупця) зі списку.');
  if (items.length === 0) return rerender('Додайте хоча б одну позицію до рахунку.');

  const year = (invoiceDate ? Number(invoiceDate.slice(0, 4)) : 0) || new Date().getFullYear();
  const total = itemsTotal(items);

  const invoiceId = transaction(() => {
    const seq = nextSeqForYear(company.id, year);
    const number = (req.body.number || '').trim() || formatInvoiceNumber(company.invoice_prefix, seq);
    const info = db.prepare(
      `INSERT INTO invoices
         (number, seq, year, invoice_date, company_id,
          company_name, company_edrpou, company_address, company_phone, company_email,
          company_director_name, company_accountant_name, company_tax_note, company_place,
          client_id, client_name, client_edrpou, client_address, client_iban, client_bank,
          pay_iban, pay_bank, total, status, notes, print_with_contract, created_by)
       VALUES
         (@number, @seq, @year, @invoice_date, @company_id,
          @company_name, @company_edrpou, @company_address, @company_phone, @company_email,
          @company_director_name, @company_accountant_name, @company_tax_note, @company_place,
          @client_id, @client_name, @client_edrpou, @client_address, @client_iban, @client_bank,
          @pay_iban, @pay_bank, @total, 'issued', @notes, @print_with_contract, @created_by)`
    ).run({
      number, seq, year, invoice_date: invoiceDate, company_id: company.id,
      company_name: company.name, company_edrpou: company.edrpou, company_address: company.address,
      company_phone: company.phone, company_email: company.email,
      company_director_name: company.director_name, company_accountant_name: company.accountant_name,
      company_tax_note: company.tax_note, company_place: company.place_of_compilation || '',
      client_id: client.id, client_name: client.name, client_edrpou: client.edrpou, client_address: client.address,
      client_iban: client.iban, client_bank: client.bank_name,
      pay_iban: account ? account.iban : '', pay_bank: account ? account.bank_name : '',
      total, notes: (req.body.notes || '').trim(),
      print_with_contract: req.body.print_with_contract ? 1 : 0,
      created_by: req.user.id,
    });
    const newId = info.lastInsertRowid;
    const insItem = db.prepare(
      `INSERT INTO invoice_items (invoice_id, position, name, unit, quantity, price, amount)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    );
    for (const it of items) insItem.run(newId, it.position, it.name, it.unit, it.quantity, it.price, it.amount);
    return newId;
  });

  res.redirect(`/invoices/${invoiceId}`);
});

// Перегляд рахунку.
router.get('/:id', (req, res) => {
  const invoice = db.prepare(
    `SELECT i.*, u.full_name AS author
       FROM invoices i LEFT JOIN users u ON u.id = i.created_by WHERE i.id = ?`
  ).get(req.params.id);
  if (!invoice) return res.status(404).render('error', { title: 'Не знайдено', message: 'Рахунок не знайдено.' });
  const items = db.prepare('SELECT * FROM invoice_items WHERE invoice_id = ? ORDER BY position').all(invoice.id);
  res.render('invoices/view', {
    title: `Рахунок ${invoice.number}`, invoice, items,
    company: companySnapshotFromInvoice(invoice),
    pay: resolvePayAccount(invoice), fmt,
  });
});

// Друкована версія — один рахунок (А4).
router.get('/:id/print', (req, res) => {
  const invoice = db.prepare('SELECT * FROM invoices WHERE id = ?').get(req.params.id);
  if (!invoice) return res.status(404).render('error', { title: 'Не знайдено', message: 'Рахунок не знайдено.' });
  const items = db.prepare('SELECT * FROM invoice_items WHERE invoice_id = ? ORDER BY position').all(invoice.id);
  res.render('invoices/print', {
    invoice, items, company: companySnapshotFromInvoice(invoice), pay: resolvePayAccount(invoice), fmt,
  });
});

// Друк комплекту: (за потреби договір на А4) + 2 рахунки + 2 видаткові накладні (по два А5 на аркуш).
router.get('/:id/print-set', (req, res) => {
  const invoice = db.prepare('SELECT * FROM invoices WHERE id = ?').get(req.params.id);
  if (!invoice) return res.status(404).render('error', { title: 'Не знайдено', message: 'Рахунок не знайдено.' });
  const items = db.prepare('SELECT * FROM invoice_items WHERE invoice_id = ? ORDER BY position').all(invoice.id);
  const autoprint = req.query.autoprint === '1';
  const company = companySnapshotFromInvoice(invoice);
  const pay = resolvePayAccount(invoice);

  // Договір друкуємо, лише якщо його ввімкнено для цього рахунку і в закладі є шаблон.
  // ?contract=1|0 у посиланні дозволяє перевизначити разово.
  let withContract = invoice.print_with_contract === 1;
  if (req.query.contract === '1') withContract = true;
  if (req.query.contract === '0') withContract = false;

  const contract = withContract ? buildContractFor(invoice, company, pay, items) : null;

  res.render('invoices/print-set', {
    invoice, items, company, pay, fmt, autoprint, contract,
  });
});

// Друк лише договору (повний А4).
router.get('/:id/print-contract', (req, res) => {
  const invoice = db.prepare('SELECT * FROM invoices WHERE id = ?').get(req.params.id);
  if (!invoice) return res.status(404).render('error', { title: 'Не знайдено', message: 'Рахунок не знайдено.' });
  const items = db.prepare('SELECT * FROM invoice_items WHERE invoice_id = ? ORDER BY position').all(invoice.id);
  const company = companySnapshotFromInvoice(invoice);
  const contract = buildContractFor(invoice, company, resolvePayAccount(invoice), items);
  if (!contract) {
    return res.render('error', {
      title: 'Немає договору',
      message: 'Для цього закладу ще не додано шаблон договору.',
      linkHref: invoice.client_id ? `/clients/${invoice.client_id}/contract` : '/clients',
      linkText: 'Додати договір',
    });
  }
  res.render('invoices/print-contract', { invoice, contract, fmt });
});

// Форма редагування. Компанія рахунку — та, під якою його створено (не обов'язково активна зараз).
router.get('/:id/edit', (req, res) => {
  const invoice = db.prepare('SELECT * FROM invoices WHERE id = ?').get(req.params.id);
  if (!invoice) return res.status(404).render('error', { title: 'Не знайдено', message: 'Рахунок не знайдено.' });
  const items = db.prepare('SELECT * FROM invoice_items WHERE invoice_id = ? ORDER BY position').all(invoice.id);
  const bankAccounts = invoice.company_id ? bankAccountsForCompany(invoice.company_id) : [];
  res.render('invoices/form', {
    title: `Редагувати рахунок ${invoice.number}`,
    invoice: { ...invoice, items },
    services: servicesList(), bankAccounts,
    selectedAccountId: accountIdForBank(bankAccounts, invoice.pay_iban, invoice.pay_bank),
    company: companySnapshotFromInvoice(invoice), fmt, action: `/invoices/${invoice.id}/edit`,
  });
});

// Оновлення рахунку.
router.post('/:id/edit', (req, res) => {
  const existing = db.prepare('SELECT * FROM invoices WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).render('error', { title: 'Не знайдено', message: 'Рахунок не знайдено.' });

  const bankAccounts = existing.company_id ? bankAccountsForCompany(existing.company_id) : [];
  const items = parseItems(req.body);
  const clientId = req.body.client_id ? Number(req.body.client_id) : null;
  const client = clientId ? db.prepare('SELECT * FROM clients WHERE id = ?').get(clientId) : null;
  const invoiceDate = (req.body.invoice_date || '').trim();
  const account = req.body.pay_account_id
    ? bankAccounts.find((a) => String(a.id) === String(req.body.pay_account_id))
    : null;

  const rerender = (error) => res.render('invoices/form', {
    title: `Редагувати рахунок ${existing.number}`,
    invoice: {
      ...existing,
      number: (req.body.number || existing.number).trim(),
      invoice_date: invoiceDate,
      client_id: req.body.client_id || '',
      client_name: client ? client.name : existing.client_name,
      notes: (req.body.notes || '').trim(), items,
    },
    services: servicesList(), bankAccounts,
    selectedAccountId: account ? account.id : accountIdForBank(bankAccounts, existing.pay_iban, existing.pay_bank),
    company: companySnapshotFromInvoice(existing), fmt, action: `/invoices/${existing.id}/edit`, error,
  });

  if (!client) return rerender('Оберіть заклад (покупця) зі списку.');
  if (items.length === 0) return rerender('Додайте хоча б одну позицію до рахунку.');

  const total = itemsTotal(items);
  const number = (req.body.number || existing.number).trim();

  transaction(() => {
    db.prepare(
      `UPDATE invoices SET
         number=@number, invoice_date=@invoice_date, client_id=@client_id,
         client_name=@client_name, client_edrpou=@client_edrpou, client_address=@client_address,
         client_iban=@client_iban, client_bank=@client_bank,
         pay_iban=@pay_iban, pay_bank=@pay_bank, total=@total, notes=@notes,
         print_with_contract=@print_with_contract
       WHERE id=@id`
    ).run({
      id: existing.id, number, invoice_date: invoiceDate, client_id: client.id,
      client_name: client.name, client_edrpou: client.edrpou, client_address: client.address,
      client_iban: client.iban, client_bank: client.bank_name,
      pay_iban: account ? account.iban : existing.pay_iban,
      pay_bank: account ? account.bank_name : existing.pay_bank,
      total, notes: (req.body.notes || '').trim(),
      print_with_contract: req.body.print_with_contract ? 1 : 0,
    });
    db.prepare('DELETE FROM invoice_items WHERE invoice_id = ?').run(existing.id);
    const insItem = db.prepare(
      `INSERT INTO invoice_items (invoice_id, position, name, unit, quantity, price, amount)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    );
    for (const it of items) insItem.run(existing.id, it.position, it.name, it.unit, it.quantity, it.price, it.amount);
  });
  res.redirect(`/invoices/${existing.id}`);
});

// Зміна статусу оплати.
router.post('/:id/status', (req, res) => {
  const status = req.body.status === 'paid' ? 'paid' : 'issued';
  db.prepare('UPDATE invoices SET status = ? WHERE id = ?').run(status, req.params.id);
  res.redirect(req.get('referer') || `/invoices/${req.params.id}`);
});

// Дублювання рахунку — копія лишається в тій самій компанії, з новим номером у її нумерації.
router.post('/:id/duplicate', (req, res) => {
  const src = db.prepare('SELECT * FROM invoices WHERE id = ?').get(req.params.id);
  if (!src) return res.status(404).render('error', { title: 'Не знайдено', message: 'Рахунок не знайдено.' });
  const items = db.prepare('SELECT * FROM invoice_items WHERE invoice_id = ? ORDER BY position').all(src.id);
  const year = new Date().getFullYear();
  const company = src.company_id ? getCompanyById(src.company_id) : null;
  const prefix = company ? company.invoice_prefix : '';

  const newId = transaction(() => {
    const seq = nextSeqForYear(src.company_id, year);
    const number = formatInvoiceNumber(prefix, seq);
    const info = db.prepare(
      `INSERT INTO invoices
         (number, seq, year, invoice_date, company_id,
          company_name, company_edrpou, company_address, company_phone, company_email,
          company_director_name, company_accountant_name, company_tax_note, company_place,
          client_id, client_name, client_edrpou, client_address, client_iban, client_bank,
          pay_iban, pay_bank, total, status, notes, print_with_contract, created_by)
       VALUES
         (@number, @seq, @year, @invoice_date, @company_id,
          @company_name, @company_edrpou, @company_address, @company_phone, @company_email,
          @company_director_name, @company_accountant_name, @company_tax_note, @company_place,
          @client_id, @client_name, @client_edrpou, @client_address, @client_iban, @client_bank,
          @pay_iban, @pay_bank, @total, 'issued', @notes, @print_with_contract, @created_by)`
    ).run({
      number, seq, year, invoice_date: todayIso(), company_id: src.company_id,
      company_name: src.company_name, company_edrpou: src.company_edrpou, company_address: src.company_address,
      company_phone: src.company_phone, company_email: src.company_email,
      company_director_name: src.company_director_name, company_accountant_name: src.company_accountant_name,
      company_tax_note: src.company_tax_note, company_place: src.company_place,
      client_id: src.client_id, client_name: src.client_name, client_edrpou: src.client_edrpou,
      client_address: src.client_address, client_iban: src.client_iban, client_bank: src.client_bank,
      pay_iban: src.pay_iban, pay_bank: src.pay_bank,
      total: src.total, notes: src.notes, print_with_contract: src.print_with_contract,
      created_by: req.user.id,
    });
    const id = info.lastInsertRowid;
    const insItem = db.prepare(
      `INSERT INTO invoice_items (invoice_id, position, name, unit, quantity, price, amount)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    );
    for (const it of items) insItem.run(id, it.position, it.name, it.unit, it.quantity, it.price, it.amount);
    return id;
  });
  res.redirect(`/invoices/${newId}/edit`);
});

// Видалення рахунку.
router.post('/:id/delete', (req, res) => {
  db.prepare('DELETE FROM invoices WHERE id = ?').run(req.params.id);
  res.redirect('/invoices');
});

module.exports = router;
