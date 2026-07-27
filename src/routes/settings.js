'use strict';

const express = require('express');
const bcrypt = require('bcryptjs');
const { db } = require('../db');
const { requireAuth, requireAdmin } = require('../auth');
const { requireCompany, bankAccountsForCompany } = require('../company');

const router = express.Router();
router.use(requireAuth);

// ── Реквізити активної компанії ─────────────────────────────────────────────
router.get('/', requireCompany, (req, res) => {
  res.render('settings', {
    title: 'Реквізити', company: req.company, accounts: bankAccountsForCompany(req.company.id),
    saved: req.query.saved || '',
    error: req.query.err ? decodeURIComponent(req.query.err) : '',
  });
});

router.post('/', requireCompany, (req, res) => {
  const b = req.body;
  db.prepare(
    `UPDATE companies SET
       name=@name, short_name=@short_name, edrpou=@edrpou, address=@address,
       phone=@phone, email=@email, director_name=@director_name, accountant_name=@accountant_name,
       invoice_prefix=@invoice_prefix, tax_note=@tax_note, place_of_compilation=@place_of_compilation
     WHERE id = @id`
  ).run({
    id: req.company.id,
    name: (b.name || '').trim(),
    short_name: (b.short_name || '').trim(),
    edrpou: (b.edrpou || '').trim(),
    address: (b.address || '').trim(),
    phone: (b.phone || '').trim(),
    email: (b.email || '').trim(),
    director_name: (b.director_name || '').trim(),
    accountant_name: (b.accountant_name || '').trim(),
    invoice_prefix: (b.invoice_prefix || '').trim(),
    tax_note: (b.tax_note || 'Без ПДВ').trim(),
    place_of_compilation: (b.place_of_compilation || '').trim(),
  });
  res.redirect('/settings?saved=1');
});

// ── Банківські рахунки активної компанії ────────────────────────────────────
function readAccount(b) {
  return {
    label: (b.label || '').trim(),
    iban: (b.iban || '').trim(),
    bank_name: (b.bank_name || '').trim(),
  };
}

router.post('/bank/new', requireCompany, (req, res) => {
  const a = readAccount(req.body);
  if (!a.iban && !a.bank_name) {
    return res.redirect('/settings?err=' + encodeURIComponent('Вкажіть IBAN або назву банку.'));
  }
  const count = db.prepare('SELECT COUNT(*) AS n FROM bank_accounts WHERE company_id = ? AND archived = 0').get(req.company.id).n;
  db.prepare(
    'INSERT INTO bank_accounts (company_id, label, iban, bank_name, is_default, sort_order) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(req.company.id, a.label, a.iban, a.bank_name, count === 0 ? 1 : 0, count);
  res.redirect('/settings?saved=bank');
});

router.post('/bank/:id/edit', requireCompany, (req, res) => {
  const a = readAccount(req.body);
  db.prepare('UPDATE bank_accounts SET label=?, iban=?, bank_name=? WHERE id=? AND company_id=?')
    .run(a.label, a.iban, a.bank_name, req.params.id, req.company.id);
  res.redirect('/settings?saved=bank');
});

router.post('/bank/:id/default', requireCompany, (req, res) => {
  const acc = db.prepare('SELECT id FROM bank_accounts WHERE id = ? AND company_id = ?').get(req.params.id, req.company.id);
  if (acc) {
    db.prepare('UPDATE bank_accounts SET is_default = 0 WHERE company_id = ?').run(req.company.id);
    db.prepare('UPDATE bank_accounts SET is_default = 1 WHERE id = ?').run(acc.id);
  }
  res.redirect('/settings?saved=bank');
});

router.post('/bank/:id/delete', requireCompany, (req, res) => {
  const acc = db.prepare('SELECT id, is_default FROM bank_accounts WHERE id = ? AND company_id = ?').get(req.params.id, req.company.id);
  if (acc) {
    db.prepare('DELETE FROM bank_accounts WHERE id = ?').run(acc.id);
    // Якщо видалили типовий — призначаємо типовим перший з тих, що залишились у цієї компанії.
    if (acc.is_default) {
      const next = db.prepare('SELECT id FROM bank_accounts WHERE company_id = ? AND archived = 0 ORDER BY sort_order, id LIMIT 1').get(req.company.id);
      if (next) db.prepare('UPDATE bank_accounts SET is_default = 1 WHERE id = ?').run(next.id);
    }
  }
  res.redirect('/settings?saved=bank');
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
