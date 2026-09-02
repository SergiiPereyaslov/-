'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { useTempDb } = require('./helpers');
useTempDb('profile');

const profile = require('../src/profile');

test('порожній рядок у списку не рахується за відповідь', () => {
  const screen = profile.SCREENS.find((s) => s.id === 'product');
  const values = profile.normalizeScreen(screen, {
    company_name: '  Смартекопак ',
    products: 'Крафтові пакети\n\n   \nСтакани для кави\n',
  });
  assert.equal(values.company_name, 'Смартекопак');
  assert.deepEqual(values.products, ['Крафтові пакети', 'Стакани для кави']);
});

test('екран не вважається заповненим без обов’язкових полів', () => {
  const screen = profile.SCREENS.find((s) => s.id === 'objections');
  assert.equal(profile.validateScreen(screen, { objections: ['одне', 'два'] }).length, 1,
    'три заперечення — мінімум, двох замало');
  assert.equal(profile.validateScreen(screen, { objections: ['1', '2', '3'] }).length, 0);
});

test('анкета вважається повною лише коли заповнені всі сім екранів', () => {
  const full = {
    company_name: 'Дніпрограф',
    products: ['Візитки', 'Каталоги'],
    portraits: ['Маркетолог виробника — керівник відділу', 'Рекламна агенція — акаунт-менеджер'],
    decider: 'Керівник відділу маркетингу',
    advantages: ['Друк за 2 дні', 'Свій пре-прес'],
    objections: ['Дорого', 'Є своя друкарня', 'Надішліть прайс'],
    success: 'домовилися про зустріч',
  };
  assert.equal(profile.completeness(full).percent, 100);
  const partial = { ...full, objections: [] };
  assert.ok(profile.completeness(partial).percent < 100);
});

test('порожня анкета дає читабельні заглушки, а не порожні місця', () => {
  const ctx = profile.buildContext({}, { name: 'Тестова' });
  assert.equal(ctx.company, 'Тестова');
  assert.equal(profile.fill('Телефоную щодо {{product1}}', ctx), 'Телефоную щодо ваш продукт');
  assert.equal(ctx.__complete, false);
});

test('підстановка бере дані компанії, а невідомий токен лишає видимим', () => {
  const ctx = profile.buildContext({
    company_name: 'Смартекопак',
    products: ['крафтових пакетів'],
  }, null);
  assert.equal(
    profile.fill('{{company}} — щодо {{product1}}', ctx),
    'Смартекопак — щодо крафтових пакетів'
  );
  assert.equal(profile.fill('{{nonexistent}}', ctx), '{{nonexistent}}',
    'невідомий токен має лишитися видимим, щоб помилку помітили під час рев’ю');
});
