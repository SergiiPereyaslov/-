'use strict';

const crypto = require('node:crypto');
const bcrypt = require('bcryptjs');
const { db } = require('./db');

const COOKIE_NAME = 'tsid';
const COOKIE_MAX_AGE = 1000 * 60 * 60 * 24 * 30; // 30 днів
const TENANT_COOKIE = 'tid';

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
    `SELECT u.id, u.tenant_id, u.username, u.full_name, u.role, u.active
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

function setPassword(userId, password) {
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?')
    .run(bcrypt.hashSync(String(password), 10), userId);
}

module.exports = {
  COOKIE_NAME, COOKIE_MAX_AGE, TENANT_COOKIE,
  createSession, destroySession, getUserByToken, verifyCredentials, setPassword,
};
