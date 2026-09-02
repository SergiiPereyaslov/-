'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { useTempDb } = require('./helpers');
useTempDb('quiz');

const quiz = require('../src/quiz');
const content = require('../content');

const lecture = content.get('01-meta');

test('той самий сід дає той самий тест, інший — інший', () => {
  const a = quiz.build(lecture, 'user1:0');
  const b = quiz.build(lecture, 'user1:0');
  const c = quiz.build(lecture, 'user1:1');

  assert.deepEqual(a.map((q) => q.id), b.map((q) => q.id),
    'перезавантаження сторінки не має перемішувати тест');
  assert.notDeepEqual(a.map((q) => q.id), c.map((q) => q.id),
    'нова спроба має давати інші питання');
});

test('у тесті рівно шість питань і не більше однієї вправи', () => {
  for (const l of content.all()) {
    for (let i = 0; i < 15; i++) {
      const qs = quiz.build(l, `seed${i}`);
      assert.equal(qs.length, quiz.QUESTIONS_PER_QUIZ, l.id);
      assert.ok(qs.filter((q) => q.type === 'rewrite').length <= 1, l.id);
    }
  }
});

test('усі закриті питання в банку мають рівно одну правильну відповідь', () => {
  for (const l of content.all()) {
    for (const q of l.bank.filter((x) => x.type === 'single')) {
      const right = q.options.filter((o) => o.ok);
      assert.equal(right.length, 1, `${l.id}/${q.id}: правильних варіантів має бути один`);
      for (const o of q.options) {
        assert.ok(o.why && o.why.length > 10, `${l.id}/${q.id}: у кожного варіанта має бути пояснення`);
      }
    }
  }
});

test('бал рахується лише за закритими питаннями', () => {
  const questions = quiz.build(lecture, 'x');
  const answers = {};
  for (const q of questions) {
    if (q.type === 'single') answers[q.id] = String(q.options.findIndex((o) => o.ok));
    else answers[q.id] = 'моя відповідь';
  }
  const res = quiz.grade(questions, answers);
  assert.equal(res.percent, 100);
  assert.equal(res.total, questions.filter((q) => q.type === 'single').length,
    'вправа не входить у знаменник');
  assert.ok(res.passed);
});

test('менше 80% — не складено', () => {
  const questions = quiz.build(lecture, 'y').filter((q) => q.type === 'single');
  const answers = {};
  questions.forEach((q, i) => {
    const right = q.options.findIndex((o) => o.ok);
    const wrong = q.options.findIndex((o) => !o.ok);
    answers[q.id] = String(i < 3 ? right : wrong);
  });
  const res = quiz.grade(questions, answers);
  assert.ok(res.percent < quiz.PASS_PERCENT);
  assert.equal(res.passed, false);
});

test('відповідь не обрано — питання не зараховується, розбір не падає', () => {
  const questions = quiz.build(lecture, 'z');
  const res = quiz.grade(questions, {});
  assert.equal(res.correct, 0);
  assert.ok(res.details.every((d) => d.type !== 'single' || d.why));
});
