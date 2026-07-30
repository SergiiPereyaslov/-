'use strict';

const express = require('express');
const fs = require('node:fs');
const { db } = require('../db');
const { requireAuth } = require('../auth');
const fmt = require('../format');
const { PLACEHOLDERS } = require('../contract');
const uploads = require('../uploads');

const router = express.Router();
router.use(requireAuth);

const PAGE_SIZE = 50;

const SORTS = {
  name: 'name COLLATE NOCASE ASC',
  name_desc: 'name COLLATE NOCASE DESC',
  code: 'CAST(code AS INTEGER) ASC, code ASC',
  category: 'category COLLATE NOCASE ASC, name COLLATE NOCASE ASC',
};

// JSON-пошук замовників для автодоповнення (у формі рахунку).
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

// Список замовників із пошуком, сортуванням і пагінацією.
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
    title: 'Замовники',
    clients, showArchived, q, category, sort, categories,
    total, pages, currentPage,
    saved: req.query.saved || '',
  });
});

router.get('/new', (req, res) => {
  res.render('clients/form', { title: 'Новий замовник', inst: {}, action: '/clients/new' });
});

// Картка замовника: реквізити, договір та вся історія документів за датою.
router.get('/:id', (req, res) => {
  const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(req.params.id);
  if (!client) return res.status(404).render('error', { title: 'Не знайдено', message: 'Замовника не знайдено.' });

  // Сортування історії документів: спочатку нові (типово) або спочатку старі.
  const oldestFirst = req.query.sort === 'old';
  const direction = oldestFirst ? 'ASC' : 'DESC';
  const invoices = db.prepare(
    `SELECT i.*, u.full_name AS author, c.short_name AS company_short
       FROM invoices i
       LEFT JOIN users u ON u.id = i.created_by
       LEFT JOIN companies c ON c.id = i.company_id
      WHERE i.client_id = ?
      ORDER BY COALESCE(NULLIF(i.invoice_date, ''), i.created_at) ${direction}, i.id ${direction}`
  ).all(client.id);

  const files = db.prepare(
    `SELECT f.*, u.full_name AS uploader
       FROM client_files f
       LEFT JOIN users u ON u.id = f.uploaded_by
      WHERE f.client_id = ?
      ORDER BY f.created_at DESC, f.id DESC`
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
    files, oldestFirst, humanSize: uploads.humanSize, allowedHint: uploads.ALLOWED_HINT,
    saved: req.query.saved || '',
    error: req.query.err ? decodeURIComponent(req.query.err) : '',
  });
});

// ── Файли замовника (договори у Word/PDF, скани) ──────────────────────────────
const cardUrl = (id, extra = '') => `/clients/${id}${extra}`;

router.post('/:id/files', (req, res) => {
  const client = db.prepare('SELECT id FROM clients WHERE id = ?').get(req.params.id);
  if (!client) return res.status(404).render('error', { title: 'Не знайдено', message: 'Замовника не знайдено.' });

  uploads.upload.array('files', 10)(req, res, (err) => {
    if (err) {
      const msg = err.code === 'LIMIT_FILE_SIZE'
        ? 'Файл завеликий. Максимальний розмір — 25 МБ.'
        : err.message;
      return res.redirect(cardUrl(client.id, `?err=${encodeURIComponent(msg)}`));
    }
    const list = req.files || [];
    if (list.length === 0) {
      return res.redirect(cardUrl(client.id, `?err=${encodeURIComponent('Оберіть файл для завантаження.')}`));
    }
    const title = (req.body.title || '').trim();
    const ins = db.prepare(
      `INSERT INTO client_files (client_id, original_name, stored_name, size, title, uploaded_by)
       VALUES (?, ?, ?, ?, ?, ?)`
    );
    for (const f of list) {
      ins.run(client.id, uploads.decodeName(f.originalname), f.filename, f.size, title, req.user.id);
    }
    res.redirect(cardUrl(client.id, '?saved=file'));
  });
});

router.get('/:id/files/:fileId', (req, res) => {
  const row = db.prepare('SELECT * FROM client_files WHERE id = ? AND client_id = ?')
    .get(req.params.fileId, req.params.id);
  if (!row) return res.status(404).render('error', { title: 'Не знайдено', message: 'Файл не знайдено.' });

  const full = uploads.filePath(row.stored_name);
  if (!full || !fs.existsSync(full)) {
    return res.status(404).render('error', {
      title: 'Файл відсутній',
      message: 'Запис про файл є, але сам файл не знайдено на диску.',
    });
  }
  // Завжди віддаємо як вкладення — файл ніколи не виконується у браузері.
  res.download(full, row.original_name);
});

router.post('/:id/files/:fileId/delete', (req, res) => {
  const row = db.prepare('SELECT * FROM client_files WHERE id = ? AND client_id = ?')
    .get(req.params.fileId, req.params.id);
  if (row) {
    db.prepare('DELETE FROM client_files WHERE id = ?').run(row.id);
    uploads.removeFile(row.stored_name);
  }
  res.redirect(cardUrl(req.params.id, '?saved=file-deleted'));
});

router.get('/:id/edit', (req, res) => {
  const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(req.params.id);
  if (!client) return res.status(404).render('error', { title: 'Не знайдено', message: 'Замовника не знайдено.' });
  res.render('clients/form', { title: 'Редагувати замовника', inst: client, action: `/clients/${client.id}/edit` });
});

// Договір замовника: шаблон, номер і дата (номер/дату менеджер вводить вручну).
router.get('/:id/contract', (req, res) => {
  const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(req.params.id);
  if (!client) return res.status(404).render('error', { title: 'Не знайдено', message: 'Замовника не знайдено.' });
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
      title: 'Новий замовник', inst: req.body, action: '/clients/new', error: 'Вкажіть назву замовника.',
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
      title: 'Редагувати замовника', inst: { ...req.body, id: req.params.id },
      action: `/clients/${req.params.id}/edit`, error: 'Вкажіть назву замовника.',
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

// Видалення замовника. Якщо по ньому вже є документи — не видаляємо,
// щоб не втратити історію; пропонуємо архів.
router.post('/:id/delete', (req, res) => {
  const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(req.params.id);
  if (!client) return res.status(404).render('error', { title: 'Не знайдено', message: 'Замовника не знайдено.' });

  const docs = db.prepare('SELECT COUNT(*) AS n FROM invoices WHERE client_id = ?').get(client.id).n;
  if (docs > 0) {
    const msg = `Замовника «${client.short_name || client.name}» видалити не можна: по ньому вже є документів — ${docs}. `
      + 'Щоб прибрати його зі списку без втрати історії, скористайтеся кнопкою «В архів».';
    return res.redirect(`/clients/${client.id}?err=${encodeURIComponent(msg)}`);
  }

  // Прибираємо і прикріплені файли з диска, щоб не лишалося «сиріт».
  const files = db.prepare('SELECT stored_name FROM client_files WHERE client_id = ?').all(client.id);
  db.prepare('DELETE FROM clients WHERE id = ?').run(client.id);
  for (const f of files) uploads.removeFile(f.stored_name);
  res.redirect('/clients?saved=deleted');
});

module.exports = router;
