'use strict';

// Кабінет керівника: компанії (лише власник продукту), менеджери, відкриті
// відповіді. Усе, що читається з бази, обмежене компанією поточного запиту.

const express = require('express');
const { db, createTenant, createUser } = require('../db');
const tenancy = require('../tenancy');
const auth = require('../auth');
const content = require('../../content');
const course = require('../course');

const router = express.Router();
router.use(tenancy.requireAuth, tenancy.requireRole('owner', 'admin'));

function slugify(name) {
  const base = String(name).toLowerCase().trim()
    .replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '') || 'company';
  let slug = base;
  let i = 2;
  while (db.prepare('SELECT 1 FROM tenants WHERE slug = ?').get(slug)) slug = `${base}-${i++}`;
  return slug;
}

// ── Компанії ────────────────────────────────────────────────────────────────
router.get('/tenants', tenancy.requireRole('owner'), (req, res) => {
  const rows = db.prepare(
    `SELECT t.*,
            (SELECT COUNT(*) FROM users u WHERE u.tenant_id = t.id) AS users_count
       FROM tenants t ORDER BY t.name`
  ).all();
  res.render('admin/tenants', { title: 'Компанії', tenants: rows, error: null });
});

router.post('/tenants', tenancy.requireRole('owner'), (req, res) => {
  const name = String(req.body.name || '').trim();
  if (!name) {
    const rows = db.prepare('SELECT * FROM tenants ORDER BY name').all();
    return res.status(400).render('admin/tenants', {
      title: 'Компанії', tenants: rows, error: 'Вкажіть назву компанії.',
    });
  }
  const id = createTenant(name, slugify(name));
  res.cookie(auth.TENANT_COOKIE, String(id), { httpOnly: true, sameSite: 'lax' });
  res.redirect('/profile');
});

// ── Менеджери ───────────────────────────────────────────────────────────────
router.get('/users', tenancy.requireTenant, (req, res) => {
  const users = db.prepare(
    'SELECT * FROM users WHERE tenant_id = ? ORDER BY role, full_name'
  ).all(req.tenantId);

  const progress = users.map((u) => ({
    user: u,
    ...course.summary(req.tenantId, u.id),
  }));

  res.render('admin/users', { title: 'Люди', people: progress, error: null, created: null });
});

router.post('/users', tenancy.requireTenant, (req, res) => {
  const fullName = String(req.body.full_name || '').trim();
  const username = String(req.body.username || '').trim().toLowerCase();
  const role = req.body.role === 'admin' ? 'admin' : 'manager';
  const password = String(req.body.password || '').trim();

  const users = db.prepare('SELECT * FROM users WHERE tenant_id = ? ORDER BY role, full_name').all(req.tenantId);
  const people = users.map((u) => ({ user: u, ...course.summary(req.tenantId, u.id) }));

  if (!fullName || !username || password.length < 4) {
    return res.status(400).render('admin/users', {
      title: 'Люди', people, created: null,
      error: 'Заповніть ім’я, логін і пароль (щонайменше 4 символи).',
    });
  }
  if (db.prepare('SELECT 1 FROM users WHERE username = ?').get(username)) {
    return res.status(400).render('admin/users', {
      title: 'Люди', people, created: null, error: `Логін «${username}» уже зайнятий.`,
    });
  }

  createUser({ tenantId: req.tenantId, username, password, fullName, role });
  res.redirect('/admin/users');
});

// ── Відкриті відповіді ──────────────────────────────────────────────────────
router.get('/answers', tenancy.requireTenant, (req, res) => {
  const rows = db.prepare(
    `SELECT a.*, u.full_name
       FROM open_answers a JOIN users u ON u.id = a.user_id
      WHERE a.tenant_id = ?
      ORDER BY a.created_at DESC LIMIT 100`
  ).all(req.tenantId);

  const items = rows.map((r) => {
    const lecture = content.get(r.lecture_id);
    const question = lecture && lecture.bank.find((q) => q.id === r.question_id);
    let ai = null;
    try { ai = r.ai_feedback ? JSON.parse(r.ai_feedback) : null; } catch { ai = null; }
    return { ...r, lectureTitle: lecture ? lecture.title : r.lecture_id, question, ai };
  });

  res.render('admin/answers', { title: 'Відповіді на вправи', items });
});

module.exports = router;
