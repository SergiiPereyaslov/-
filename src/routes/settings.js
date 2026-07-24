'use strict';

const express = require('express');
const bcrypt = require('bcryptjs');
const { db } = require('../db');
const { requireAuth, requireAdmin } = require('../auth');

const router = express.Router();
router.use(requireAuth);

// ── Реквізити компанії ─────────────────────────────────────────────────────
router.get('/', (req, res) => {
  const company = db.prepare('SELECT * FROM company WHERE id = 1').get();
  res.render('settings', { title: 'Реквізити', company, saved: req.query.saved === '1' });
});

router.post('/', (req, res) => {
  const b = req.body;
  db.prepare(
    `UPDATE company SET
       name=@name, edrpou=@edrpou, address=@address, iban=@iban, bank_name=@bank_name,
       phone=@phone, email=@email, director_name=@director_name, accountant_name=@accountant_name,
       invoice_prefix=@invoice_prefix, tax_note=@tax_note, updated_at=datetime('now')
     WHERE id = 1`
  ).run({
    name: (b.name || '').trim(),
    edrpou: (b.edrpou || '').trim(),
    address: (b.address || '').trim(),
    iban: (b.iban || '').trim(),
    bank_name: (b.bank_name || '').trim(),
    phone: (b.phone || '').trim(),
    email: (b.email || '').trim(),
    director_name: (b.director_name || '').trim(),
    accountant_name: (b.accountant_name || '').trim(),
    invoice_prefix: (b.invoice_prefix || '').trim(),
    tax_note: (b.tax_note || 'Без ПДВ').trim(),
  });
  res.redirect('/settings?saved=1');
});

// ── Керування користувачами (лише адмін) ───────────────────────────────────
router.get('/users', requireAdmin, (req, res) => {
  const users = db.prepare('SELECT id, username, full_name, role, active, created_at FROM users ORDER BY created_at').all();
  res.render('users', { title: 'Користувачі', users, saved: req.query.saved || '' });
});

router.post('/users/new', requireAdmin, (req, res) => {
  const username = (req.body.username || '').trim().toLowerCase();
  const fullName = (req.body.full_name || '').trim();
  const password = String(req.body.password || '');
  const role = req.body.role === 'admin' ? 'admin' : 'manager';

  const users = db.prepare('SELECT id, username, full_name, role, active, created_at FROM users ORDER BY created_at').all();
  if (!username || !fullName || password.length < 4) {
    return res.render('users', {
      title: 'Користувачі', users,
      error: 'Заповніть логін, ім’я та пароль (мінімум 4 символи).',
    });
  }
  const exists = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (exists) {
    return res.render('users', { title: 'Користувачі', users, error: 'Такий логін вже існує.' });
  }
  db.prepare(
    'INSERT INTO users (username, password_hash, full_name, role) VALUES (?, ?, ?, ?)'
  ).run(username, bcrypt.hashSync(password, 10), fullName, role);
  res.redirect('/settings/users?saved=created');
});

router.post('/users/:id/password', requireAdmin, (req, res) => {
  const password = String(req.body.password || '');
  if (password.length < 4) {
    const users = db.prepare('SELECT id, username, full_name, role, active, created_at FROM users ORDER BY created_at').all();
    return res.render('users', { title: 'Користувачі', users, error: 'Пароль має містити мінімум 4 символи.' });
  }
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(bcrypt.hashSync(password, 10), req.params.id);
  res.redirect('/settings/users?saved=password');
});

router.post('/users/:id/toggle', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  if (id === req.user.id) {
    const users = db.prepare('SELECT id, username, full_name, role, active, created_at FROM users ORDER BY created_at').all();
    return res.render('users', { title: 'Користувачі', users, error: 'Не можна деактивувати власний обліковий запис.' });
  }
  const u = db.prepare('SELECT active FROM users WHERE id = ?').get(id);
  if (u) db.prepare('UPDATE users SET active = ? WHERE id = ?').run(u.active ? 0 : 1, id);
  res.redirect('/settings/users?saved=toggled');
});

// ── Зміна власного пароля ───────────────────────────────────────────────────
router.get('/password', (req, res) => {
  res.render('password', { title: 'Зміна пароля', saved: req.query.saved === '1' });
});

router.post('/password', (req, res) => {
  const current = String(req.body.current || '');
  const next = String(req.body.next || '');
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (!bcrypt.compareSync(current, user.password_hash)) {
    return res.render('password', { title: 'Зміна пароля', error: 'Поточний пароль невірний.' });
  }
  if (next.length < 4) {
    return res.render('password', { title: 'Зміна пароля', error: 'Новий пароль має містити мінімум 4 символи.' });
  }
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(bcrypt.hashSync(next, 10), req.user.id);
  res.redirect('/settings/password?saved=1');
});

module.exports = router;
