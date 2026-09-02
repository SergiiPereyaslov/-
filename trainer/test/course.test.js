'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { useTempDb } = require('./helpers');
useTempDb('course');

const { init, createTenant, createUser } = require('../src/db');
const course = require('../src/course');
const profile = require('../src/profile');
const content = require('../content');

init();
const tenantId = createTenant('Смартекопак', 'smartecopack');
const userId = createUser({
  tenantId, username: 'manager1', password: 'secret', fullName: 'Менеджер', role: 'manager',
});

test('відкрита лише перша лекція, доки не складено тест', () => {
  const list = course.progressFor(tenantId, userId);
  assert.equal(list[0].unlocked, true);
  assert.equal(list[1].unlocked, false, 'друга лекція має бути закрита');
});

test('складений тест відкриває наступну лекцію, провалений — ні', () => {
  const first = content.all()[0].id;

  course.recordAttempt(tenantId, userId, first,
    { correct: 2, total: 5, percent: 40, passed: false }, []);
  assert.equal(course.progressFor(tenantId, userId)[1].unlocked, false,
    'провалений тест не має відкривати наступну лекцію');

  course.recordAttempt(tenantId, userId, first,
    { correct: 5, total: 5, percent: 100, passed: true }, []);
  const list = course.progressFor(tenantId, userId);
  assert.equal(list[0].passed, true);
  assert.equal(list[1].unlocked, true);
});

test('найкращий результат не затирається слабшою спробою', () => {
  const first = content.all()[0].id;
  course.recordAttempt(tenantId, userId, first,
    { correct: 4, total: 5, percent: 80, passed: true }, []);
  assert.equal(course.progressFor(tenantId, userId)[0].bestPercent, 100);
});

test('лекція показується з даними компанії', () => {
  profile.save(tenantId, {
    company_name: 'Смартекопак',
    products: ['Крафтові пакети з ручками'],
    success: 'домовилися про зустріч',
  });
  const ctx = profile.buildContext(profile.load(tenantId), { name: 'Смартекопак' });

  const first = course.render(content.get('01-meta'), ctx);
  assert.ok(JSON.stringify(first.sections).includes('домовилися про зустріч'),
    'мета дзвінка з анкети має потрапити в лекцію');

  const second = course.render(content.get('02-first15'), ctx);
  const text = JSON.stringify(second.sections);
  assert.ok(text.includes('Смартекопак'), 'назва компанії має підставитися у приклади');
  assert.ok(text.includes('Крафтові пакети з ручками'), 'позиція з анкети має потрапити у приклад');
});

test('у жодній лекції не лишається неопрацьованих токенів', () => {
  const ctx = profile.buildContext(profile.load(tenantId), { name: 'Смартекопак' });
  for (const lecture of content.all()) {
    const rendered = course.render(lecture, ctx);
    assert.ok(!JSON.stringify(rendered.sections).includes('{{'),
      `${lecture.id}: у тексті лишився токен — перевірте назву в profile.buildContext`);
    const questions = course.renderQuestions(lecture.bank, ctx);
    assert.ok(!JSON.stringify(questions).includes('{{'),
      `${lecture.id}: токен лишився в банку питань`);
  }
});

test('прогрес одного менеджера не залежить від іншого', () => {
  const other = createUser({
    tenantId, username: 'manager2', password: 'secret', fullName: 'Другий', role: 'manager',
  });
  assert.equal(course.summary(tenantId, other).passed, 0);
  assert.ok(course.summary(tenantId, userId).passed > 0);
});
