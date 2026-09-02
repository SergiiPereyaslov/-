'use strict';

// Мультикомпанійність. Єдине місце, де вирішується, дані якої компанії бачить
// користувач. Правило одне й без винятків: admin і manager назавжди прив'язані
// до свого tenant_id, і жоден параметр запиту цього не змінює. Перемикатися між
// компаніями може лише owner — власник продукту.

const { db } = require('./db');
const { TENANT_COOKIE } = require('./auth');

function listTenants() {
  return db.prepare('SELECT * FROM tenants WHERE active = 1 ORDER BY name').all();
}

function getTenant(id) {
  if (!id) return null;
  return db.prepare('SELECT * FROM tenants WHERE id = ? AND active = 1').get(id) || null;
}

// Обчислює компанію поточного запиту. Повертає id або null.
function resolveTenantId(user, cookieValue) {
  if (!user) return null;
  if (user.role !== 'owner') return user.tenant_id;

  const wanted = Number(cookieValue);
  if (wanted && getTenant(wanted)) return wanted;
  const first = listTenants()[0];
  return first ? first.id : null;
}

// Middleware: підвантажує користувача, компанію й перелік компаній для owner.
function loadContext(auth) {
  return function (req, res, next) {
    req.user = auth.getUserByToken(req.cookies[auth.COOKIE_NAME]);
    req.tenantId = resolveTenantId(req.user, req.cookies[TENANT_COOKIE]);
    req.tenant = getTenant(req.tenantId);

    res.locals.user = req.user;
    res.locals.tenant = req.tenant;
    res.locals.currentPath = req.path;
    res.locals.allTenants = req.user && req.user.role === 'owner' ? listTenants() : [];
    next();
  };
}

function requireAuth(req, res, next) {
  if (!req.user) return res.redirect('/login');
  next();
}

// Вимагає, щоб у запиту була компанія: без неї немає ані анкети, ані курсу.
function requireTenant(req, res, next) {
  if (!req.user) return res.redirect('/login');
  if (!req.tenantId) {
    return res.status(400).render('error', {
      title: 'Немає компанії',
      message: req.user.role === 'owner'
        ? 'Спочатку створіть компанію в розділі «Компанії».'
        : 'Ваш обліковий запис не прив’язаний до компанії. Зверніться до адміністратора.',
    });
  }
  next();
}

function requireRole(...roles) {
  return function (req, res, next) {
    if (!req.user) return res.redirect('/login');
    if (!roles.includes(req.user.role)) {
      return res.status(403).render('error', {
        title: 'Немає доступу',
        message: 'Цей розділ доступний лише керівнику.',
      });
    }
    next();
  };
}

// Перевірка належності запису компанії. Використовується там, де id приходить
// із URL: без неї менеджер однієї компанії міг би відкрити запис іншої.
function assertSameTenant(row, tenantId) {
  if (!row || row.tenant_id !== tenantId) {
    const err = new Error('Запис належить іншій компанії');
    err.status = 404;
    throw err;
  }
  return row;
}

module.exports = {
  listTenants, getTenant, resolveTenantId, loadContext,
  requireAuth, requireTenant, requireRole, assertSameTenant,
};
