'use strict';

const express = require('express');
const { db } = require('../db');
const { requireAuth } = require('../auth');

const router = express.Router();
router.use(requireAuth);

// Список товарів/послуг.
router.get('/', (req, res) => {
  const showArchived = req.query.archived === '1';
  const services = db.prepare(
    `SELECT * FROM services
      WHERE archived = ?
      ORDER BY name COLLATE NOCASE`
  ).all(showArchived ? 1 : 0);
  res.render('services/list', { title: 'Товари та послуги', services, showArchived });
});

router.get('/new', (req, res) => {
  res.render('services/form', { title: 'Нова позиція', service: { unit: 'шт' }, action: '/services/new' });
});

router.get('/:id/edit', (req, res) => {
  const service = db.prepare('SELECT * FROM services WHERE id = ?').get(req.params.id);
  if (!service) return res.status(404).render('error', { title: 'Не знайдено', message: 'Позицію не знайдено.' });
  res.render('services/form', { title: 'Редагувати позицію', service, action: `/services/${service.id}/edit` });
});

function readService(body) {
  return {
    name: (body.name || '').trim(),
    unit: (body.unit || 'шт').trim() || 'шт',
    price: Math.max(0, Number(String(body.price || '0').replace(',', '.')) || 0),
  };
}

router.post('/new', (req, res) => {
  const s = readService(req.body);
  if (!s.name) {
    return res.render('services/form', {
      title: 'Нова позиція', service: req.body, action: '/services/new',
      error: 'Вкажіть назву товару або послуги.',
    });
  }
  db.prepare('INSERT INTO services (name, unit, price) VALUES (@name, @unit, @price)').run(s);
  res.redirect('/services');
});

router.post('/:id/edit', (req, res) => {
  const s = readService(req.body);
  if (!s.name) {
    return res.render('services/form', {
      title: 'Редагувати позицію', service: { ...req.body, id: req.params.id },
      action: `/services/${req.params.id}/edit`, error: 'Вкажіть назву товару або послуги.',
    });
  }
  db.prepare('UPDATE services SET name=@name, unit=@unit, price=@price WHERE id=@id')
    .run({ ...s, id: req.params.id });
  res.redirect('/services');
});

router.post('/:id/archive', (req, res) => {
  const to = req.body.restore === '1' ? 0 : 1;
  db.prepare('UPDATE services SET archived = ? WHERE id = ?').run(to, req.params.id);
  res.redirect(to === 1 ? '/services' : '/services?archived=1');
});

module.exports = router;
