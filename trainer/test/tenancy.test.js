'use strict';

// Найважливіший тест продукту: дані однієї компанії не мають бути доступні
// іншій. Помилка тут коштує дорожче за будь-яку іншу — і ламається тихо.

const test = require('node:test');
const assert = require('node:assert');
const { useTempDb } = require('./helpers');
useTempDb('tenancy');

const { init, createTenant, createUser } = require('../src/db');
const tenancy = require('../src/tenancy');

init();
const dniprograf = createTenant('Дніпрограф', 'dniprograf');
const smartecopack = createTenant('Смартекопак', 'smartecopack');

const manager = { id: 10, role: 'manager', tenant_id: dniprograf };
const admin = { id: 11, role: 'admin', tenant_id: dniprograf };
const owner = { id: 1, role: 'owner', tenant_id: null };

test('менеджер лишається у своїй компанії, навіть якщо підмінити cookie', () => {
  assert.equal(tenancy.resolveTenantId(manager, String(smartecopack)), dniprograf);
  assert.equal(tenancy.resolveTenantId(manager, 'зовсім не число'), dniprograf);
  assert.equal(tenancy.resolveTenantId(manager, '999999'), dniprograf);
});

test('адміністратор компанії теж не може перемкнутися на чужу', () => {
  assert.equal(tenancy.resolveTenantId(admin, String(smartecopack)), dniprograf);
});

test('власник продукту перемикається між компаніями', () => {
  assert.equal(tenancy.resolveTenantId(owner, String(smartecopack)), smartecopack);
  assert.equal(tenancy.resolveTenantId(owner, String(dniprograf)), dniprograf);
});

test('власник із неіснуючою компанією в cookie отримує першу наявну, а не помилку', () => {
  const resolved = tenancy.resolveTenantId(owner, '999999');
  assert.ok([dniprograf, smartecopack].includes(resolved));
});

test('без користувача компанії немає', () => {
  assert.equal(tenancy.resolveTenantId(null, String(dniprograf)), null);
});

test('запис чужої компанії не проходить перевірку', () => {
  const row = { id: 5, tenant_id: smartecopack };
  assert.throws(() => tenancy.assertSameTenant(row, dniprograf), /іншій компанії/);
  assert.throws(() => tenancy.assertSameTenant(null, dniprograf), /іншій компанії/);
  assert.doesNotThrow(() => tenancy.assertSameTenant(row, smartecopack));
});

test('кожна компанія має власну анкету', () => {
  const profile = require('../src/profile');
  profile.save(dniprograf, { company_name: 'Дніпрограф', products: ['візитки'] });
  profile.save(smartecopack, { company_name: 'Смартекопак', products: ['крафт-пакети'] });

  assert.equal(profile.load(dniprograf).company_name, 'Дніпрограф');
  assert.equal(profile.load(smartecopack).company_name, 'Смартекопак');
});

test('менеджери різних компаній не бачать одне одного', () => {
  const { db } = require('../src/db');
  createUser({ tenantId: dniprograf, username: 'd1', password: 'x1234', fullName: 'Д', role: 'manager' });
  createUser({ tenantId: smartecopack, username: 's1', password: 'x1234', fullName: 'С', role: 'manager' });

  const rows = db.prepare('SELECT username FROM users WHERE tenant_id = ?').all(dniprograf);
  assert.deepEqual(rows.map((r) => r.username), ['d1']);
});
