'use strict';

const express = require('express');
const { db } = require('../db');
const { requireAuth } = require('../auth');

const router = express.Router();
router.use(requireAuth);

// Список клієнтів.
router.get('/', (req, res) => {
  const showArchived = req.query.archived === '1';
  const clients = db.prepare(
    `SELECT * FROM clients
      WHERE archived = ?
      ORDER BY name COLLATE NOCASE`
  ).all(showArchived ? 1 : 0);
  res.render('clients/list', { title: 'Покупці', clients, showArchived });
});

// Форма нового клієнта.
router.get('/new', (req, res) => {
  res.render('clients/form', { title: 'Новий покупець', client: {}, action: '/clients/new' });
});

// Форма редагування.
router.get('/:id/edit', (req, res) => {
  const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(req.params.id);
  if (!client) return res.status(404).render('error', { title: 'Не знайдено', message: 'Покупця не знайдено.' });
  res.render('clients/form', { title: 'Редагувати покупця', client, action: `/clients/${client.id}/edit` });
});

function readClient(body) {
  return {
    name: (body.name || '').trim(),
    edrpou: (body.edrpou || '').trim(),
    address: (body.address || '').trim(),
    iban: (body.iban || '').trim(),
    bank_name: (body.bank_name || '').trim(),
    contact_person: (body.contact_person || '').trim(),
    phone: (body.phone || '').trim(),
    email: (body.email || '').trim(),
  };
}

// Створення.
router.post('/new', (req, res) => {
  const c = readClient(req.body);
  if (!c.name) {
    return res.render('clients/form', {
      title: 'Новий покупець', client: req.body, action: '/clients/new',
      error: 'Вкажіть назву покупця.',
    });
  }
  db.prepare(
    `INSERT INTO clients (name, edrpou, address, iban, bank_name, contact_person, phone, email)
     VALUES (@name, @edrpou, @address, @iban, @bank_name, @contact_person, @phone, @email)`
  ).run(c);
  res.redirect('/clients');
});

// Оновлення.
router.post('/:id/edit', (req, res) => {
  const c = readClient(req.body);
  if (!c.name) {
    return res.render('clients/form', {
      title: 'Редагувати покупця', client: { ...req.body, id: req.params.id },
      action: `/clients/${req.params.id}/edit`, error: 'Вкажіть назву покупця.',
    });
  }
  db.prepare(
    `UPDATE clients SET name=@name, edrpou=@edrpou, address=@address, iban=@iban,
       bank_name=@bank_name, contact_person=@contact_person, phone=@phone, email=@email
     WHERE id=@id`
  ).run({ ...c, id: req.params.id });
  res.redirect('/clients');
});

// Архівувати / відновити.
router.post('/:id/archive', (req, res) => {
  const to = req.body.restore === '1' ? 0 : 1;
  db.prepare('UPDATE clients SET archived = ? WHERE id = ?').run(to, req.params.id);
  res.redirect(to === 1 ? '/clients' : '/clients?archived=1');
});

module.exports = router;
