'use strict';

// Демо-дані для першого запуску: дві компанії, керівник і менеджер у кожній.
// Анкети лишаються порожніми — їх заповнює керівник, це і є онбординг.
// Запуск: node scripts/seed-demo.js

const { init, db, createTenant, createUser } = require('../src/db');

init();

const COMPANIES = [
  { name: 'Дніпрограф', slug: 'dniprograf', admin: 'rop.dniprograf', manager: 'manager.dniprograf' },
  { name: 'Смартекопак', slug: 'smartecopack', admin: 'rop.smartecopack', manager: 'manager.smartecopack' },
];

for (const c of COMPANIES) {
  if (db.prepare('SELECT 1 FROM tenants WHERE slug = ?').get(c.slug)) {
    console.log(`— ${c.name}: уже є, пропускаю`);
    continue;
  }
  const tenantId = createTenant(c.name, c.slug);
  createUser({ tenantId, username: c.admin, password: 'test1234',
    fullName: `Керівник — ${c.name}`, role: 'admin' });
  createUser({ tenantId, username: c.manager, password: 'test1234',
    fullName: `Менеджер — ${c.name}`, role: 'manager' });
  console.log(`+ ${c.name}: керівник ${c.admin}, менеджер ${c.manager} (пароль test1234)`);
}

console.log('\nВласник продукту: owner / owner');
