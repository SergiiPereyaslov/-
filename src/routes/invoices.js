'use strict';

const express = require('express');
const { db, transaction } = require('../db');
const { requireAuth } = require('../auth');
const fmt = require('../format');
const {
  round2, nextSeqForYear, formatInvoiceNumber, parseItems, itemsTotal,
} = require('../invoiceHelpers');

const router = express.Router();
router.use(requireAuth);

function getCompany() {
  return db.prepare('SELECT * FROM company WHERE id = 1').get();
}

function todayIso() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

// Список рахунків (історія) з фільтрами.
router.get('/', (req, res) => {
  const q = (req.query.q || '').trim();
  const status = (req.query.status || '').trim();
  const conditions = [];
  const params = {};
  if (q) {
    conditions.push('(i.number LIKE @q OR i.client_name LIKE @q)');
    params.q = `%${q}%`;
  }
  if (status === 'paid' || status === 'issued') {
    conditions.push('i.status = @status');
    params.status = status;
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const invoices = db.prepare(
    `SELECT i.*, u.full_name AS author
       FROM invoices i
       LEFT JOIN users u ON u.id = i.created_by
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

  res.render('invoices/list', {
    title: 'Рахунки', invoices, totals, q, status, fmt,
  });
});

// Форма нового рахунку.
router.get('/new', (req, res) => {
  const company = getCompany();
  if (!company.name) {
    return res.render('error', {
      title: 'Спочатку заповніть реквізити',
      message: 'Щоб виставляти рахунки, спершу заповніть реквізити вашого ТОВ у розділі «Реквізити».',
      linkHref: '/settings', linkText: 'Перейти до реквізитів',
    });
  }
  const clients = db.prepare('SELECT * FROM clients WHERE archived = 0 ORDER BY name COLLATE NOCASE').all();
  const services = db.prepare('SELECT id, name, unit, price FROM services WHERE archived = 0 ORDER BY name COLLATE NOCASE').all();
  const seq = nextSeqForYear(new Date().getFullYear());
  res.render('invoices/form', {
    title: 'Новий рахунок',
    invoice: {
      number: formatInvoiceNumber(company.invoice_prefix, seq),
      invoice_date: todayIso(),
      client_id: '',
      notes: '',
      items: [],
    },
    clients, services, company, fmt,
    action: '/invoices/new',
  });
});

// Створення рахунку.
router.post('/new', (req, res) => {
  const company = getCompany();
  const clients = db.prepare('SELECT * FROM clients WHERE archived = 0 ORDER BY name COLLATE NOCASE').all();
  const services = db.prepare('SELECT id, name, unit, price FROM services WHERE archived = 0 ORDER BY name COLLATE NOCASE').all();

  const items = parseItems(req.body);
  const clientId = req.body.client_id ? Number(req.body.client_id) : null;
  const client = clientId ? db.prepare('SELECT * FROM clients WHERE id = ?').get(clientId) : null;
  const invoiceDate = (req.body.invoice_date || todayIso()).trim();

  const rerender = (error) => res.render('invoices/form', {
    title: 'Новий рахунок',
    invoice: {
      number: (req.body.number || '').trim(),
      invoice_date: invoiceDate,
      client_id: req.body.client_id || '',
      notes: (req.body.notes || '').trim(),
      items,
    },
    clients, services, company, fmt, action: '/invoices/new', error,
  });

  if (!client) return rerender('Оберіть покупця зі списку.');
  if (items.length === 0) return rerender('Додайте хоча б одну позицію до рахунку.');

  const year = Number(invoiceDate.slice(0, 4)) || new Date().getFullYear();
  const total = itemsTotal(items);

  const invoiceId = transaction(() => {
    const seq = nextSeqForYear(year);
    const number = (req.body.number || '').trim() || formatInvoiceNumber(company.invoice_prefix, seq);
    const info = db.prepare(
      `INSERT INTO invoices
         (number, seq, year, invoice_date, client_id,
          client_name, client_edrpou, client_address, client_iban, client_bank,
          total, status, notes, created_by)
       VALUES
         (@number, @seq, @year, @invoice_date, @client_id,
          @client_name, @client_edrpou, @client_address, @client_iban, @client_bank,
          @total, 'issued', @notes, @created_by)`
    ).run({
      number, seq, year, invoice_date: invoiceDate, client_id: client.id,
      client_name: client.name, client_edrpou: client.edrpou, client_address: client.address,
      client_iban: client.iban, client_bank: client.bank_name,
      total, notes: (req.body.notes || '').trim(), created_by: req.user.id,
    });
    const newId = info.lastInsertRowid;
    const insItem = db.prepare(
      `INSERT INTO invoice_items (invoice_id, position, name, unit, quantity, price, amount)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    );
    for (const it of items) {
      insItem.run(newId, it.position, it.name, it.unit, it.quantity, it.price, it.amount);
    }
    return newId;
  });

  res.redirect(`/invoices/${invoiceId}`);
});

// Перегляд рахунку.
router.get('/:id', (req, res) => {
  const invoice = db.prepare(
    `SELECT i.*, u.full_name AS author
       FROM invoices i LEFT JOIN users u ON u.id = i.created_by
      WHERE i.id = ?`
  ).get(req.params.id);
  if (!invoice) return res.status(404).render('error', { title: 'Не знайдено', message: 'Рахунок не знайдено.' });
  const items = db.prepare('SELECT * FROM invoice_items WHERE invoice_id = ? ORDER BY position').all(invoice.id);
  const company = getCompany();
  res.render('invoices/view', { title: `Рахунок ${invoice.number}`, invoice, items, company, fmt });
});

// Друкована версія (окрема сторінка без навігації).
router.get('/:id/print', (req, res) => {
  const invoice = db.prepare('SELECT * FROM invoices WHERE id = ?').get(req.params.id);
  if (!invoice) return res.status(404).render('error', { title: 'Не знайдено', message: 'Рахунок не знайдено.' });
  const items = db.prepare('SELECT * FROM invoice_items WHERE invoice_id = ? ORDER BY position').all(invoice.id);
  const company = getCompany();
  res.render('invoices/print', { invoice, items, company, fmt, layout: false });
});

// Форма редагування.
router.get('/:id/edit', (req, res) => {
  const invoice = db.prepare('SELECT * FROM invoices WHERE id = ?').get(req.params.id);
  if (!invoice) return res.status(404).render('error', { title: 'Не знайдено', message: 'Рахунок не знайдено.' });
  const items = db.prepare('SELECT * FROM invoice_items WHERE invoice_id = ? ORDER BY position').all(invoice.id);
  const company = getCompany();
  const clients = db.prepare('SELECT * FROM clients WHERE archived = 0 OR id = ? ORDER BY name COLLATE NOCASE').all(invoice.client_id || 0);
  const services = db.prepare('SELECT id, name, unit, price FROM services WHERE archived = 0 ORDER BY name COLLATE NOCASE').all();
  res.render('invoices/form', {
    title: `Редагувати рахунок ${invoice.number}`,
    invoice: { ...invoice, items },
    clients, services, company, fmt,
    action: `/invoices/${invoice.id}/edit`,
  });
});

// Оновлення рахунку.
router.post('/:id/edit', (req, res) => {
  const existing = db.prepare('SELECT * FROM invoices WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).render('error', { title: 'Не знайдено', message: 'Рахунок не знайдено.' });

  const company = getCompany();
  const clients = db.prepare('SELECT * FROM clients WHERE archived = 0 OR id = ? ORDER BY name COLLATE NOCASE').all(existing.client_id || 0);
  const services = db.prepare('SELECT id, name, unit, price FROM services WHERE archived = 0 ORDER BY name COLLATE NOCASE').all();

  const items = parseItems(req.body);
  const clientId = req.body.client_id ? Number(req.body.client_id) : null;
  const client = clientId ? db.prepare('SELECT * FROM clients WHERE id = ?').get(clientId) : null;
  const invoiceDate = (req.body.invoice_date || existing.invoice_date).trim();

  const rerender = (error) => res.render('invoices/form', {
    title: `Редагувати рахунок ${existing.number}`,
    invoice: {
      ...existing,
      number: (req.body.number || existing.number).trim(),
      invoice_date: invoiceDate,
      client_id: req.body.client_id || '',
      notes: (req.body.notes || '').trim(),
      items,
    },
    clients, services, company, fmt, action: `/invoices/${existing.id}/edit`, error,
  });

  if (!client) return rerender('Оберіть покупця зі списку.');
  if (items.length === 0) return rerender('Додайте хоча б одну позицію до рахунку.');

  const total = itemsTotal(items);
  const number = (req.body.number || existing.number).trim();

  transaction(() => {
    db.prepare(
      `UPDATE invoices SET
         number=@number, invoice_date=@invoice_date, client_id=@client_id,
         client_name=@client_name, client_edrpou=@client_edrpou, client_address=@client_address,
         client_iban=@client_iban, client_bank=@client_bank,
         total=@total, notes=@notes
       WHERE id=@id`
    ).run({
      id: existing.id, number, invoice_date: invoiceDate, client_id: client.id,
      client_name: client.name, client_edrpou: client.edrpou, client_address: client.address,
      client_iban: client.iban, client_bank: client.bank_name,
      total, notes: (req.body.notes || '').trim(),
    });
    db.prepare('DELETE FROM invoice_items WHERE invoice_id = ?').run(existing.id);
    const insItem = db.prepare(
      `INSERT INTO invoice_items (invoice_id, position, name, unit, quantity, price, amount)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    );
    for (const it of items) {
      insItem.run(existing.id, it.position, it.name, it.unit, it.quantity, it.price, it.amount);
    }
  });
  res.redirect(`/invoices/${existing.id}`);
});

// Зміна статусу оплати.
router.post('/:id/status', (req, res) => {
  const status = req.body.status === 'paid' ? 'paid' : 'issued';
  db.prepare('UPDATE invoices SET status = ? WHERE id = ?').run(status, req.params.id);
  res.redirect(req.get('referer') || `/invoices/${req.params.id}`);
});

// Дублювання рахунку (створити копію як новий).
router.post('/:id/duplicate', (req, res) => {
  const src = db.prepare('SELECT * FROM invoices WHERE id = ?').get(req.params.id);
  if (!src) return res.status(404).render('error', { title: 'Не знайдено', message: 'Рахунок не знайдено.' });
  const items = db.prepare('SELECT * FROM invoice_items WHERE invoice_id = ? ORDER BY position').all(src.id);
  const company = getCompany();
  const year = new Date().getFullYear();

  const newId = transaction(() => {
    const seq = nextSeqForYear(year);
    const number = formatInvoiceNumber(company.invoice_prefix, seq);
    const info = db.prepare(
      `INSERT INTO invoices
         (number, seq, year, invoice_date, client_id,
          client_name, client_edrpou, client_address, client_iban, client_bank,
          total, status, notes, created_by)
       VALUES
         (@number, @seq, @year, @invoice_date, @client_id,
          @client_name, @client_edrpou, @client_address, @client_iban, @client_bank,
          @total, 'issued', @notes, @created_by)`
    ).run({
      number, seq, year, invoice_date: todayIso(), client_id: src.client_id,
      client_name: src.client_name, client_edrpou: src.client_edrpou, client_address: src.client_address,
      client_iban: src.client_iban, client_bank: src.client_bank,
      total: src.total, notes: src.notes, created_by: req.user.id,
    });
    const newId = info.lastInsertRowid;
    const insItem = db.prepare(
      `INSERT INTO invoice_items (invoice_id, position, name, unit, quantity, price, amount)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    );
    for (const it of items) {
      insItem.run(newId, it.position, it.name, it.unit, it.quantity, it.price, it.amount);
    }
    return newId;
  });
  res.redirect(`/invoices/${newId}/edit`);
});

// Видалення рахунку.
router.post('/:id/delete', (req, res) => {
  db.prepare('DELETE FROM invoices WHERE id = ?').run(req.params.id);
  res.redirect('/invoices');
});

module.exports = router;
