'use strict';

const crypto = require('node:crypto');
const bcrypt = require('bcryptjs');
const { db } = require('./db');

const COOKIE_NAME = 'sid';
const COOKIE_MAX_AGE = 1000 * 60 * 60 * 24 * 30; // 30 днів

function createSession(userId) {
  const token = crypto.randomBytes(32).toString('hex');
  db.prepare('INSERT INTO sessions (token, user_id) VALUES (?, ?)').run(token, userId);
  return token;
}

function destroySession(token) {
  if (token) db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
}

function getUserByToken(token) {
  if (!token) return null;
  const row = db.prepare(
    `SELECT u.id, u.username, u.full_name, u.role, u.active
       FROM sessions s
       JOIN users u ON u.id = s.user_id
      WHERE s.token = ?`
  ).get(token);
  if (!row || row.active !== 1) return null;
  return row;
}

function verifyCredentials(username, password) {
  const user = db.prepare(
    'SELECT * FROM users WHERE username = ? AND active = 1'
  ).get(String(username || '').trim().toLowerCase());
  if (!user) return null;
  if (!bcrypt.compareSync(String(password || ''), user.password_hash)) return null;
  return user;
}

// Middleware: підвантажує поточного користувача у req.user та res.locals.
function loadUser(req, res, next) {
  const token = req.cookies[COOKIE_NAME];
  req.user = getUserByToken(token);
  res.locals.user = req.user;
  res.locals.currentPath = req.path;
  next();
}

// Middleware: вимагає входу.
function requireAuth(req, res, next) {
  if (!req.user) return res.redirect('/login');
  next();
}

// Middleware: вимагає роль адміністратора.
function requireAdmin(req, res, next) {
  if (!req.user) return res.redirect('/login');
  if (req.user.role !== 'admin') {
    return res.status(403).render('error', {
      title: 'Доступ заборонено',
      message: 'Ця дія доступна лише адміністратору.',
    });
  }
  next();
}

module.exports = {
  COOKIE_NAME,
  COOKIE_MAX_AGE,
  createSession,
  destroySession,
  getUserByToken,
  verifyCredentials,
  loadUser,
  requireAuth,
  requireAdmin,
};
