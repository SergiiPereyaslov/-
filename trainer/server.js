'use strict';

const path = require('node:path');
const express = require('express');
const cookieParser = require('cookie-parser');

const { init } = require('./src/db');
const auth = require('./src/auth');
const tenancy = require('./src/tenancy');

init();

const app = express();
const PORT = process.env.PORT || 3100;
const HOST = process.env.HOST || '0.0.0.0';

if (process.env.TRUST_PROXY === '1') app.set('trust proxy', 1);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.locals.f = require('./src/format');
app.use('/static', express.static(path.join(__dirname, 'public')));
app.use(tenancy.loadContext(auth));

// ── Вхід ────────────────────────────────────────────────────────────────────
app.get('/login', (req, res) => {
  if (req.user) return res.redirect('/');
  res.render('login', { title: 'Вхід', error: null });
});

app.post('/login', (req, res) => {
  const user = auth.verifyCredentials(req.body.username, req.body.password);
  if (!user) {
    return res.status(401).render('login', { title: 'Вхід', error: 'Невірний логін або пароль.' });
  }
  res.cookie(auth.COOKIE_NAME, auth.createSession(user.id), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.COOKIE_SECURE === '1',
    maxAge: auth.COOKIE_MAX_AGE,
  });
  res.redirect('/');
});

app.post('/logout', (req, res) => {
  auth.destroySession(req.cookies[auth.COOKIE_NAME]);
  res.clearCookie(auth.COOKIE_NAME);
  res.redirect('/login');
});

// Перемикання компанії — лише для власника продукту.
app.post('/switch-tenant', tenancy.requireAuth, tenancy.requireRole('owner'), (req, res) => {
  const id = Number(req.body.tenant_id);
  if (tenancy.getTenant(id)) {
    res.cookie(auth.TENANT_COOKIE, String(id), { httpOnly: true, sameSite: 'lax' });
  }
  res.redirect(req.get('referer') || '/');
});

// ── Розділи ─────────────────────────────────────────────────────────────────
app.use('/', require('./src/routes/dashboard'));
app.use('/profile', require('./src/routes/profile'));
app.use('/course', require('./src/routes/course'));
app.use('/admin', require('./src/routes/admin'));

app.use((req, res) => {
  res.status(404).render('error', { title: 'Не знайдено', message: 'Такої сторінки немає.' });
});

app.use((err, req, res, _next) => {
  const status = err.status || 500;
  if (status === 500) console.error(err);
  res.status(status).render('error', {
    title: status === 404 ? 'Не знайдено' : 'Помилка',
    message: status === 404 ? err.message : 'Щось пішло не так. Спробуйте ще раз.',
  });
});

if (require.main === module) {
  app.listen(PORT, HOST, () => {
    console.log(`Тренажер: http://localhost:${PORT}`);
  });
}

module.exports = app;
