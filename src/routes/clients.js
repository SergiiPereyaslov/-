'use strict';

const express = require('express');
const { db } = require('../db');
const { requireAuth } = require('../auth');

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
  });
});

router.get('/new', (req, res) => {
  res.render('clients/form', { title: 'Новий заклад', client: {}, action: '/clients/new' });
});

router.get('/:id/edit', (req, res) => {
  const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(req.params.id);
  if (!client) return res.status(404).render('error', { title: 'Не знайдено', message: 'Заклад не знайдено.' });
  res.render('clients/form', { title: 'Редагувати заклад', client, action: `/clients/${client.id}/edit` });
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
      title: 'Новий заклад', client: req.body, action: '/clients/new', error: 'Вкажіть назву закладу.',
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
      title: 'Редагувати заклад', client: { ...req.body, id: req.params.id },
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

module.exports = router;
