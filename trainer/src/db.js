'use strict';

const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');
const fs = require('node:fs');
const bcrypt = require('bcryptjs');

// Шлях до бази можна перевизначити для тестів: кожен тест бере свій файл.
const DB_PATH = process.env.TRAINER_DB || path.join(__dirname, '..', 'data', 'trainer.db');

const dir = path.dirname(DB_PATH);
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const db = new DatabaseSync(DB_PATH);
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

function init() {
  db.exec(`
    -- Компанія-клієнт тренажера. Усі дані нижче прив'язані до неї.
    CREATE TABLE IF NOT EXISTS tenants (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name       TEXT NOT NULL,
      slug       TEXT NOT NULL UNIQUE,
      active     INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Ролі:
    --   owner   — власник продукту, бачить усі компанії, tenant_id = NULL;
    --   admin   — адміністратор компанії: анкета, менеджери, звіти;
    --   manager — менеджер: вчиться й тренується.
    CREATE TABLE IF NOT EXISTS users (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id     INTEGER,
      username      TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      full_name     TEXT NOT NULL,
      role          TEXT NOT NULL DEFAULT 'manager',
      active        INTEGER NOT NULL DEFAULT 1,
      created_at    TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token      TEXT PRIMARY KEY,
      user_id    INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Анкета компанії: сім екранів, з яких збирається персоналізований курс.
    CREATE TABLE IF NOT EXISTS company_profile (
      tenant_id  INTEGER PRIMARY KEY,
      data       TEXT NOT NULL DEFAULT '{}',
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
    );

    -- Проходження лекцій.
    CREATE TABLE IF NOT EXISTS lecture_progress (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id    INTEGER NOT NULL,
      user_id      INTEGER NOT NULL,
      lecture_id   TEXT NOT NULL,
      read_at      TEXT,
      passed_at    TEXT,
      best_percent INTEGER NOT NULL DEFAULT 0,
      UNIQUE (user_id, lecture_id),
      FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id)   REFERENCES users(id)   ON DELETE CASCADE
    );

    -- Спроби тестів. Зберігаємо відповіді, щоб РОП міг подивитися, де плутається.
    CREATE TABLE IF NOT EXISTS quiz_attempts (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id  INTEGER NOT NULL,
      user_id    INTEGER NOT NULL,
      lecture_id TEXT NOT NULL,
      correct    INTEGER NOT NULL,
      total      INTEGER NOT NULL,
      percent    INTEGER NOT NULL,
      passed     INTEGER NOT NULL,
      answers    TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id)   REFERENCES users(id)   ON DELETE CASCADE
    );

    -- Відкриті питання «перепиши фразу». Оцінює AI; без ключа лишаються в статусі
    -- pending і їх бачить керівник — тест від цього не блокується.
    CREATE TABLE IF NOT EXISTS open_answers (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id   INTEGER NOT NULL,
      user_id     INTEGER NOT NULL,
      lecture_id  TEXT NOT NULL,
      question_id TEXT NOT NULL,
      answer      TEXT NOT NULL,
      status      TEXT NOT NULL DEFAULT 'pending',
      ai_score    INTEGER,
      ai_feedback TEXT,
      created_at  TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id)   REFERENCES users(id)   ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_progress_tenant ON lecture_progress(tenant_id, user_id);
    CREATE INDEX IF NOT EXISTS idx_attempts_tenant ON quiz_attempts(tenant_id, user_id);
    CREATE INDEX IF NOT EXISTS idx_open_tenant     ON open_answers(tenant_id, status);
  `);

  seedOwner();
}

// Перший запуск: власник продукту, який далі заводить компанії з інтерфейсу.
function seedOwner() {
  const has = db.prepare('SELECT COUNT(*) AS n FROM users').get();
  if (has.n > 0) return;
  db.prepare(
    `INSERT INTO users (tenant_id, username, password_hash, full_name, role)
     VALUES (NULL, 'owner', ?, 'Власник продукту', 'owner')`
  ).run(bcrypt.hashSync('owner', 10));
}

function createTenant(name, slug) {
  const info = db.prepare('INSERT INTO tenants (name, slug) VALUES (?, ?)').run(name, slug);
  const id = Number(info.lastInsertRowid);
  db.prepare('INSERT INTO company_profile (tenant_id, data) VALUES (?, ?)').run(id, '{}');
  return id;
}

function createUser({ tenantId, username, password, fullName, role }) {
  const info = db.prepare(
    `INSERT INTO users (tenant_id, username, password_hash, full_name, role)
     VALUES (?, ?, ?, ?, ?)`
  ).run(
    tenantId ?? null,
    String(username).trim().toLowerCase(),
    bcrypt.hashSync(String(password), 10),
    fullName,
    role
  );
  return Number(info.lastInsertRowid);
}

module.exports = { db, init, createTenant, createUser, DB_PATH };
