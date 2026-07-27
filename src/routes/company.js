'use strict';

const express = require('express');
const { db } = require('../db');
const { requireAuth, COOKIE_NAME } = require('../auth');
const { listCompanies } = require('../company');

const router = express.Router();
router.use(requireAuth);

router.post('/switch/:id', (req, res) => {
  const company = listCompanies().find((c) => String(c.id) === String(req.params.id));
  const token = req.cookies[COOKIE_NAME];
  if (company && token) {
    db.prepare('UPDATE sessions SET current_company_id = ? WHERE token = ?').run(company.id, token);
  }
  res.redirect(req.get('referer') || '/');
});

module.exports = router;
