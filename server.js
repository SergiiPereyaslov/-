'use strict';

const path = require('node:path');
const express = require('express');
const cookieParser = require('cookie-parser');

const { init, db } = require('./src/db');
const auth = require('./src/auth');

init();

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

// Перегляди (EJS) + автоматичний layout через res.render + partials.
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use('/static', express.static(path.join(__dirname, 'public')));

// Підвантаження користувача у кожен запит.
app.use(auth.loadUser);

// ── Автентифікація ──────────────────────────────────────────────────────────
app.get('/login', (req, res) => {
  if (req.user) return res.redirect('/');
  res.render('login', { title: 'Вхід', error: null, layout: false });
});

app.post('/login', (req, res) => {
  const user = auth.verifyCredentials(req.body.username, req.body.password);
  if (!user) {
    return res.status(401).render('login', {
      title: 'Вхід', error: 'Невірний логін або пароль.', layout: false,
    });
  }
  const token = auth.createSession(user.id);
  res.cookie(auth.COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: auth.COOKIE_MAX_AGE,
  });
  res.redirect('/');
});

app.post('/logout', (req, res) => {
  auth.destroySession(req.cookies[auth.COOKIE_NAME]);
  res.clearCookie(auth.COOKIE_NAME);
  res.redirect('/login');
});

// ── Головна (дашборд) ────────────────────────────────────────────────────────
app.get('/', auth.requireAuth, (req, res) => {
  const fmt = require('./src/format');
  const year = new Date().getFullYear();
  const stats = db.prepare(
    `SELECT
        COUNT(*) AS cnt,
        COALESCE(SUM(total), 0) AS sum_all,
        COALESCE(SUM(CASE WHEN status='paid' THEN total ELSE 0 END), 0) AS sum_paid,
        COALESCE(SUM(CASE WHEN status='issued' THEN total ELSE 0 END), 0) AS sum_unpaid
       FROM invoices WHERE year = ?`
  ).get(year);
  const recent = db.prepare(
    `SELECT i.*, u.full_name AS author
       FROM invoices i LEFT JOIN users u ON u.id = i.created_by
      ORDER BY i.id DESC LIMIT 8`
  ).all();
  const counts = {
    clients: db.prepare('SELECT COUNT(*) AS n FROM clients WHERE archived = 0').get().n,
    services: db.prepare('SELECT COUNT(*) AS n FROM services WHERE archived = 0').get().n,
  };
  const company = db.prepare('SELECT * FROM company WHERE id = 1').get();
  res.render('dashboard', { title: 'Головна', stats, recent, counts, company, year, fmt });
});

// ── Розділи ──────────────────────────────────────────────────────────────────
app.use('/invoices', require('./src/routes/invoices'));
app.use('/clients', require('./src/routes/clients'));
app.use('/services', require('./src/routes/services'));
app.use('/settings', require('./src/routes/settings'));

// 404
app.use((req, res) => {
  res.status(404).render('error', { title: 'Сторінку не знайдено', message: 'Такої сторінки не існує.' });
});

// Обробка помилок.
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).render('error', {
    title: 'Помилка',
    message: 'Сталася непередбачувана помилка. Спробуйте ще раз.',
  });
});

app.listen(PORT, HOST, () => {
  console.log(`✔ Сервіс рахунків запущено: http://localhost:${PORT}`);
});
