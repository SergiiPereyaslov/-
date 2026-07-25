'use strict';

const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');
const fs = require('node:fs');
const bcrypt = require('bcryptjs');

const DATA_DIR = path.join(__dirname, '..', 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'invoices.db');
const db = new DatabaseSync(DB_PATH);

// WAL-режим — краще для одночасної роботи кількох менеджерів.
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

function init() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      username      TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      full_name     TEXT NOT NULL,
      role          TEXT NOT NULL DEFAULT 'manager',
      active        INTEGER NOT NULL DEFAULT 1,
      created_at    TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token      TEXT PRIMARY KEY,
      user_id    INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Дані нашого ТОВ (постачальник). Один запис.
    CREATE TABLE IF NOT EXISTS company (
      id             INTEGER PRIMARY KEY CHECK (id = 1),
      name           TEXT NOT NULL DEFAULT '',
      edrpou         TEXT NOT NULL DEFAULT '',
      address        TEXT NOT NULL DEFAULT '',
      iban           TEXT NOT NULL DEFAULT '',
      bank_name      TEXT NOT NULL DEFAULT '',
      phone          TEXT NOT NULL DEFAULT '',
      email          TEXT NOT NULL DEFAULT '',
      director_name  TEXT NOT NULL DEFAULT '',
      accountant_name TEXT NOT NULL DEFAULT '',
      invoice_prefix TEXT NOT NULL DEFAULT '',
      tax_note       TEXT NOT NULL DEFAULT 'Без ПДВ',
      updated_at     TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Банківські рахунки постачальника (для вибору «куди платити»).
    CREATE TABLE IF NOT EXISTS bank_accounts (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      label      TEXT NOT NULL DEFAULT '',
      iban       TEXT NOT NULL DEFAULT '',
      bank_name  TEXT NOT NULL DEFAULT '',
      is_default INTEGER NOT NULL DEFAULT 0,
      archived   INTEGER NOT NULL DEFAULT 0,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Покупці (навчальні заклади).
    CREATE TABLE IF NOT EXISTS clients (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      name           TEXT NOT NULL,
      code           TEXT NOT NULL DEFAULT '',
      short_name     TEXT NOT NULL DEFAULT '',
      category       TEXT NOT NULL DEFAULT '',
      edrpou         TEXT NOT NULL DEFAULT '',
      address        TEXT NOT NULL DEFAULT '',
      iban           TEXT NOT NULL DEFAULT '',
      bank_name      TEXT NOT NULL DEFAULT '',
      contact_person TEXT NOT NULL DEFAULT '',
      phone          TEXT NOT NULL DEFAULT '',
      email          TEXT NOT NULL DEFAULT '',
      archived       INTEGER NOT NULL DEFAULT 0,
      created_at     TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Каталог товарів/послуг.
    CREATE TABLE IF NOT EXISTS services (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name       TEXT NOT NULL,
      unit       TEXT NOT NULL DEFAULT 'шт',
      price      REAL NOT NULL DEFAULT 0,
      archived   INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Рахунки.
    CREATE TABLE IF NOT EXISTS invoices (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      number         TEXT NOT NULL,
      seq            INTEGER NOT NULL,
      year           INTEGER NOT NULL,
      invoice_date   TEXT NOT NULL,
      client_id      INTEGER,
      -- знімок реквізитів покупця на момент виставлення
      client_name    TEXT NOT NULL DEFAULT '',
      client_edrpou  TEXT NOT NULL DEFAULT '',
      client_address TEXT NOT NULL DEFAULT '',
      client_iban    TEXT NOT NULL DEFAULT '',
      client_bank    TEXT NOT NULL DEFAULT '',
      -- знімок рахунку для оплати
      pay_iban       TEXT NOT NULL DEFAULT '',
      pay_bank       TEXT NOT NULL DEFAULT '',
      total          REAL NOT NULL DEFAULT 0,
      status         TEXT NOT NULL DEFAULT 'issued',
      notes          TEXT NOT NULL DEFAULT '',
      created_by     INTEGER,
      created_at     TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (client_id)  REFERENCES clients(id) ON DELETE SET NULL,
      FOREIGN KEY (created_by) REFERENCES users(id)   ON DELETE SET NULL
    );

    -- Позиції рахунку.
    CREATE TABLE IF NOT EXISTS invoice_items (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_id INTEGER NOT NULL,
      position   INTEGER NOT NULL DEFAULT 0,
      name       TEXT NOT NULL,
      unit       TEXT NOT NULL DEFAULT 'шт',
      quantity   REAL NOT NULL DEFAULT 1,
      price      REAL NOT NULL DEFAULT 0,
      amount     REAL NOT NULL DEFAULT 0,
      FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_invoices_year_seq ON invoices(year, seq);
    CREATE INDEX IF NOT EXISTS idx_items_invoice ON invoice_items(invoice_id);
    CREATE INDEX IF NOT EXISTS idx_clients_code ON clients(code);
    CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(name COLLATE NOCASE);
  `);

  // Міграції: додаємо нові колонки, якщо база створена раніше.
  addColumns('clients', [
    ['code', "code TEXT NOT NULL DEFAULT ''"],
    ['short_name', "short_name TEXT NOT NULL DEFAULT ''"],
    ['category', "category TEXT NOT NULL DEFAULT ''"],
  ]);
  addColumns('invoices', [
    ['pay_iban', "pay_iban TEXT NOT NULL DEFAULT ''"],
    ['pay_bank', "pay_bank TEXT NOT NULL DEFAULT ''"],
  ]);

  // Гарантуємо наявність єдиного запису компанії.
  const companyExists = db.prepare('SELECT id FROM company WHERE id = 1').get();
  if (!companyExists) {
    db.prepare('INSERT INTO company (id) VALUES (1)').run();
  }

  // Міграція банківського рахунку зі старого поля company.iban.
  const acctCount = db.prepare('SELECT COUNT(*) AS n FROM bank_accounts').get().n;
  if (acctCount === 0) {
    const comp = db.prepare('SELECT iban, bank_name FROM company WHERE id = 1').get();
    if (comp && (comp.iban || comp.bank_name)) {
      db.prepare(
        'INSERT INTO bank_accounts (label, iban, bank_name, is_default, sort_order) VALUES (?, ?, ?, 1, 0)'
      ).run(comp.bank_name || 'Основний рахунок', comp.iban, comp.bank_name);
    }
  }

  // Створюємо адміністратора за замовчуванням, якщо користувачів ще немає.
  const anyUser = db.prepare('SELECT COUNT(*) AS n FROM users').get();
  if (anyUser.n === 0) {
    const hash = bcrypt.hashSync('admin', 10);
    db.prepare(
      `INSERT INTO users (username, password_hash, full_name, role)
       VALUES (?, ?, ?, 'admin')`
    ).run('admin', hash, 'Адміністратор');
    console.log('▶ Створено користувача за замовчуванням: логін "admin", пароль "admin".');
    console.log('  Обов’язково змініть пароль у розділі «Користувачі» після входу.');
  }

  seedInitialData();
}

// Додає колонки до таблиці, якщо їх ще немає (проста міграція).
function addColumns(table, cols) {
  const existing = db.prepare(`PRAGMA table_info(${table})`).all().map((c) => c.name);
  for (const [name, ddl] of cols) {
    if (!existing.includes(name)) db.exec(`ALTER TABLE ${table} ADD COLUMN ${ddl};`);
  }
}

// Одноразове завантаження закладів і товарів із seed-файлів (лише якщо порожньо).
function seedInitialData() {
  const seedDir = path.join(__dirname, '..', 'seed');

  if (db.prepare('SELECT COUNT(*) AS n FROM clients').get().n === 0) {
    const file = path.join(seedDir, 'institutions.json');
    if (fs.existsSync(file)) {
      const list = JSON.parse(fs.readFileSync(file, 'utf8'));
      const ins = db.prepare(
        'INSERT INTO clients (name, code, short_name, category) VALUES (@name, @code, @short_name, @category)'
      );
      transaction(() => {
        for (const c of list) {
          ins.run({ name: c.name || '', code: c.code || '', short_name: c.short_name || '', category: c.category || '' });
        }
      });
      console.log(`▶ Завантажено закладів освіти: ${list.length}.`);
    }
  }

  if (db.prepare('SELECT COUNT(*) AS n FROM services').get().n === 0) {
    const file = path.join(seedDir, 'products.json');
    if (fs.existsSync(file)) {
      const list = JSON.parse(fs.readFileSync(file, 'utf8'));
      const ins = db.prepare('INSERT INTO services (name, unit, price) VALUES (@name, @unit, @price)');
      transaction(() => {
        for (const p of list) ins.run({ name: p.name || '', unit: p.unit || 'шт', price: Number(p.price) || 0 });
      });
      console.log(`▶ Завантажено товарів у каталог: ${list.length}.`);
    }
  }
}

// Обгортка транзакції (node:sqlite не має вбудованого db.transaction()).
function transaction(fn) {
  db.exec('BEGIN');
  try {
    const result = fn();
    db.exec('COMMIT');
    return result;
  } catch (err) {
    try { db.exec('ROLLBACK'); } catch { /* ignore */ }
    throw err;
  }
}

module.exports = { db, init, transaction, DB_PATH };
