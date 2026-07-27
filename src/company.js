'use strict';

const { db } = require('./db');
const { COOKIE_NAME } = require('./auth');

function listCompanies() {
  return db.prepare('SELECT * FROM companies WHERE archived = 0 ORDER BY sort_order, id').all();
}

function getCompanyById(id) {
  return db.prepare('SELECT * FROM companies WHERE id = ?').get(id);
}

function bankAccountsForCompany(companyId) {
  return db.prepare(
    'SELECT * FROM bank_accounts WHERE company_id = ? AND archived = 0 ORDER BY is_default DESC, sort_order, id'
  ).all(companyId);
}

function defaultAccountForCompany(companyId) {
  const accounts = bankAccountsForCompany(companyId);
  return accounts.find((a) => a.is_default) || accounts[0] || null;
}

// Middleware: визначає активну компанію поточної сесії (без релогіну можна перемкнути).
function loadCompany(req, res, next) {
  if (!req.user) return next();
  const companies = listCompanies();
  if (companies.length === 0) {
    req.company = null;
    res.locals.company = null;
    res.locals.companies = [];
    return next();
  }

  const token = req.cookies[COOKIE_NAME];
  const row = token ? db.prepare('SELECT current_company_id FROM sessions WHERE token = ?').get(token) : null;
  let company = row && row.current_company_id
    ? companies.find((c) => c.id === row.current_company_id)
    : null;

  if (!company) {
    company = companies[0];
    if (token) db.prepare('UPDATE sessions SET current_company_id = ? WHERE token = ?').run(company.id, token);
  }

  req.company = company;
  res.locals.company = company;
  res.locals.companies = companies;
  next();
}

// Middleware: вимагає, щоб активна компанія була визначена.
function requireCompany(req, res, next) {
  if (!req.company) {
    return res.render('error', {
      title: 'Немає жодної компанії',
      message: 'У системі ще не додано жодної компанії. Зверніться до адміністратора.',
    });
  }
  next();
}

module.exports = {
  listCompanies,
  getCompanyById,
  bankAccountsForCompany,
  defaultAccountForCompany,
  loadCompany,
  requireCompany,
};
