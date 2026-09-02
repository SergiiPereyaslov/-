'use strict';

// Анкета компанії. Заповнює адміністратор компанії або власник продукту;
// менеджеру вона показується лише для читання — це його джерело правди
// про продукт.

const express = require('express');
const tenancy = require('../tenancy');
const profile = require('../profile');

const router = express.Router();
const canEdit = (user) => user.role === 'owner' || user.role === 'admin';

router.use(tenancy.requireAuth, tenancy.requireTenant);

router.get('/', (req, res) => {
  const data = profile.load(req.tenantId);
  res.render('profile/index', {
    title: 'Анкета компанії',
    screens: profile.SCREENS,
    data,
    completeness: profile.completeness(data),
    canEdit: canEdit(req.user),
  });
});

router.get('/:screenId', (req, res, next) => {
  const screen = profile.SCREENS.find((s) => s.id === req.params.screenId);
  if (!screen) return next();
  if (!canEdit(req.user)) return res.redirect('/profile');

  const data = profile.load(req.tenantId);
  const idx = profile.SCREENS.indexOf(screen);
  res.render('profile/screen', {
    title: screen.title,
    screen,
    data,
    errors: [],
    step: idx + 1,
    total: profile.SCREENS.length,
    prev: idx > 0 ? profile.SCREENS[idx - 1] : null,
    next: idx + 1 < profile.SCREENS.length ? profile.SCREENS[idx + 1] : null,
  });
});

router.post('/:screenId', (req, res, next) => {
  const screen = profile.SCREENS.find((s) => s.id === req.params.screenId);
  if (!screen) return next();
  if (!canEdit(req.user)) return res.status(403).render('error', {
    title: 'Немає доступу', message: 'Анкету заповнює керівник.',
  });

  const data = profile.load(req.tenantId);
  const values = profile.normalizeScreen(screen, req.body);
  const merged = { ...data, ...values };
  const errors = profile.validateScreen(screen, values);

  // Зберігаємо навіть із помилками: анкету заповнюють у кілька заходів,
  // втрачати вже введене через один незаповнений рядок — погана ідея.
  profile.save(req.tenantId, merged);

  if (errors.length) {
    const idx = profile.SCREENS.indexOf(screen);
    return res.status(400).render('profile/screen', {
      title: screen.title,
      screen,
      data: merged,
      errors,
      step: idx + 1,
      total: profile.SCREENS.length,
      prev: idx > 0 ? profile.SCREENS[idx - 1] : null,
      next: idx + 1 < profile.SCREENS.length ? profile.SCREENS[idx + 1] : null,
    });
  }

  const idx = profile.SCREENS.indexOf(screen);
  const nextScreen = profile.SCREENS[idx + 1];
  res.redirect(nextScreen ? `/profile/${nextScreen.id}` : '/profile');
});

module.exports = router;
