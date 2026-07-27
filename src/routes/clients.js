'use strict';

const express = require('express');
const { db } = require('../db');
const { requireAuth } = require('../auth');
const fmt = require('../format');
const { PLACEHOLDERS } = require('../contract');

const router = express.Router();
router.use(requireAuth);

const PAGE_SIZE = 50;

const SORTS = {
  name: 'name COLLATE NOCASE ASC',
  name_desc: 'name COLLATE NOCASE DESC',
  code: 'CAST(code AS INTEGER) ASC, code ASC',
  category: 'category COLLATE NOCASE ASC, name COLLATE NOCASE ASC',
};

// JSON-пошук закладів для автодоповнення (у формі рахунку).
router.get('/search', (req, res) => {
  const q = (req.query.q || '').trim();
  if (!q) return res.json([]);
  const like = `%${q}%`;
  const rows = db.prepare(
    `SELECT id, name, short_name, code, category
       FROM clients
      WHERE archived = 0
        AND (name LIKE ? OR short_name LIKE ? OR code LIKE ?)
      ORDER BY name COLLATE NOCASE
      LIMIT 25`
  ).all(like, like, like);
  res.json(rows);
});

// Список закладів із пошуком, сортуванням і пагінацією.
router.get('/', (req, res) => {
  const showArchived = req.query.archived === '1';
  const q = (req.query.q || '').trim();
  const category = (req.query.category || '').trim();
  const sort = SORTS[req.query.sort] ? req.query.sort : 'name';
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);

  const conditions = ['archived = @archived'];
  const params = { archived: showArchived ? 1 : 0 };
  if (q) {
    conditions.push('(name LIKE @like OR short_name LIKE @like OR code LIKE @like)');
    params.like = `%${q}%`;
  }
  if (category) {
    conditions.push('category = @category');
    params.category = category;
  }
  const where = `WHERE ${conditions.join(' AND ')}`;

  const total = db.prepare(`SELECT COUNT(*) AS n FROM clients ${where}`).get(params).n;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.min(page, pages);
  const offset = (currentPage - 1) * PAGE_SIZE;

  const clients = db.prepare(
    `SELECT * FROM clients ${where} ORDER BY ${SORTS[sort]} LIMIT ${PAGE_SIZE} OFFSET ${offset}`
  ).all(params);

  const categories = db.prepare(
    "SELECT DISTINCT category FROM clients WHERE category <> '' ORDER BY category"
  ).all().map((r) => r.category);

  res.render('clients/list', {
    title: 'Заклади освіти',
    clients, showArchived, q, category, sort, categories,
    total, pages, currentPage,
    saved: req.query.saved || '',
  });
});

router.get('/new', (req, res) => {
  res.render('clients/form', { title: 'Новий заклад', inst: {}, action: '/clients/new' });
});

// Картка закладу: реквізити, договір та вся історія документів за датою.
router.get('/:id', (req, res) => {
  const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(req.params.id);
  if (!client) return res.status(404).render('error', { title: 'Не знайдено', message: 'Заклад не знайдено.' });

  const invoices = db.prepare(
    `SELECT i.*, u.full_name AS author, c.short_name AS company_short
       FROM invoices i
       LEFT JOIN users u ON u.id = i.created_by
       LEFT JOIN companies c ON c.id = i.company_id
      WHERE i.client_id = ?
      ORDER BY COALESCE(NULLIF(i.invoice_date, ''), i.created_at) DESC, i.id DESC`
  ).all(client.id);

  const totals = db.prepare(
    `SELECT
        COUNT(*) AS cnt,
        COALESCE(SUM(total), 0) AS sum_all,
        COALESCE(SUM(CASE WHEN status='paid' THEN total ELSE 0 END), 0) AS sum_paid,
        COALESCE(SUM(CASE WHEN status='issued' THEN total ELSE 0 END), 0) AS sum_unpaid
       FROM invoices WHERE client_id = ?`
  ).get(client.id);

  res.render('clients/card', {
    title: client.short_name || client.name,
    inst: client, invoices, totals, fmt,
    saved: req.query.saved || '',
    error: req.query.err ? decodeURIComponent(req.query.err) : '',
  });
});

router.get('/:id/edit', (req, res) => {
  const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(req.params.id);
  if (!client) return res.status(404).render('error', { title: 'Не знайдено', message: 'Заклад не знайдено.' });
  res.render('clients/form', { title: 'Редагувати заклад', inst: client, action: `/clients/${client.id}/edit` });
});

// Договір закладу: шаблон, номер і дата (номер/дату менеджер вводить вручну).
router.get('/:id/contract', (req, res) => {
  const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(req.params.id);
  if (!client) return res.status(404).render('error', { title: 'Не знайдено', message: 'Заклад не знайдено.' });
  res.render('clients/contract', {
    title: `Договір — ${client.short_name || client.name}`,
    inst: client, placeholders: PLACEHOLDERS,
  });
});

router.post('/:id/contract', (req, res) => {
  db.prepare(
    'UPDATE clients SET contract_template=?, contract_number=?, contract_date=? WHERE id=?'
  ).run(
    String(req.body.contract_template || ''),
    (req.body.contract_number || '').trim(),
    (req.body.contract_date || '').trim(),
    req.params.id
  );
  res.redirect(`/clients/${req.params.id}?saved=contract`);
});

function readClient(body) {
  return {
    name: (body.name || '').trim(),
    code: (body.code || '').trim(),
    short_name: (body.short_name || '').trim(),
    category: (body.category || '').trim(),
    edrpou: (body.edrpou || '').trim(),
    address: (body.address || '').trim(),
    iban: (body.iban || '').trim(),
    bank_name: (body.bank_name || '').trim(),
    contact_person: (body.contact_person || '').trim(),
    phone: (body.phone || '').trim(),
    email: (body.email || '').trim(),
  };
}

router.post('/new', (req, res) => {
  const c = readClient(req.body);
  if (!c.name) {
    return res.render('clients/form', {
      title: 'Новий заклад', inst: req.body, action: '/clients/new', error: 'Вкажіть назву закладу.',
    });
  }
  db.prepare(
    `INSERT INTO clients (name, code, short_name, category, edrpou, address, iban, bank_name, contact_person, phone, email)
     VALUES (@name, @code, @short_name, @category, @edrpou, @address, @iban, @bank_name, @contact_person, @phone, @email)`
  ).run(c);
  res.redirect('/clients');
});

router.post('/:id/edit', (req, res) => {
  const c = readClient(req.body);
  if (!c.name) {
    return res.render('clients/form', {
      title: 'Редагувати заклад', inst: { ...req.body, id: req.params.id },
      action: `/clients/${req.params.id}/edit`, error: 'Вкажіть назву закладу.',
    });
  }
  db.prepare(
    `UPDATE clients SET name=@name, code=@code, short_name=@short_name, category=@category,
       edrpou=@edrpou, address=@address, iban=@iban, bank_name=@bank_name,
       contact_person=@contact_person, phone=@phone, email=@email
     WHERE id=@id`
  ).run({ ...c, id: req.params.id });
  res.redirect('/clients');
});

router.post('/:id/archive', (req, res) => {
  const to = req.body.restore === '1' ? 0 : 1;
  db.prepare('UPDATE clients SET archived = ? WHERE id = ?').run(to, req.params.id);
  res.redirect(to === 1 ? '/clients' : '/clients?archived=1');
});

// Видалення закладу. Якщо по ньому вже є документи — не видаляємо,
// щоб не втратити історію; пропонуємо архів.
router.post('/:id/delete', (req, res) => {
  const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(req.params.id);
  if (!client) return res.status(404).render('error', { title: 'Не знайдено', message: 'Заклад не знайдено.' });

  const docs = db.prepare('SELECT COUNT(*) AS n FROM invoices WHERE client_id = ?').get(client.id).n;
  if (docs > 0) {
    const msg = `Заклад «${client.short_name || client.name}» видалити не можна: по ньому вже є документів — ${docs}. `
      + 'Щоб прибрати його зі списку без втрати історії, скористайтеся кнопкою «В архів».';
    return res.redirect(`/clients/${client.id}?err=${encodeURIComponent(msg)}`);
  }

  db.prepare('DELETE FROM clients WHERE id = ?').run(client.id);
  res.redirect('/clients?saved=deleted');
});

module.exports = router;
