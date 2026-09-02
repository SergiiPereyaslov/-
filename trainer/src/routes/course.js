'use strict';

const express = require('express');
const { db } = require('../db');
const tenancy = require('../tenancy');
const content = require('../../content');
const course = require('../course');
const quiz = require('../quiz');
const profile = require('../profile');
const ai = require('../ai');

const router = express.Router();

router.use(tenancy.requireAuth, tenancy.requireTenant);

function ctxFor(req) {
  return profile.buildContext(profile.load(req.tenantId), req.tenant);
}

// Скільки спроб уже було — з цього числа складається зерно набору питань,
// тому кожна нова спроба дає інші питання, а перезавантаження — ті самі.
function attemptSeed(tenantId, userId, lectureId) {
  const row = db.prepare(
    `SELECT COUNT(*) AS n FROM quiz_attempts
      WHERE tenant_id = ? AND user_id = ? AND lecture_id = ?`
  ).get(tenantId, userId, lectureId);
  return `${userId}:${row.n}`;
}

router.get('/', (req, res) => {
  res.render('course/list', {
    title: 'Курс',
    lectures: course.progressFor(req.tenantId, req.user.id),
    done: course.summary(req.tenantId, req.user.id),
  });
});

router.get('/:id', (req, res, next) => {
  const lecture = content.get(req.params.id);
  if (!lecture) return next();

  const state = course.stateOf(req.tenantId, req.user.id, lecture.id);
  if (!state.unlocked) {
    return res.status(403).render('error', {
      title: 'Лекція закрита',
      message: 'Спочатку складіть тест попередньої лекції.',
    });
  }

  course.markRead(req.tenantId, req.user.id, lecture.id);
  const data = profile.load(req.tenantId);

  res.render('course/lecture', {
    title: lecture.title,
    lecture: course.render(lecture, profile.buildContext(data, req.tenant)),
    state,
    profileComplete: profile.completeness(data).percent === 100,
    next: content.next(lecture.id),
  });
});

router.get('/:id/quiz', (req, res, next) => {
  const lecture = content.get(req.params.id);
  if (!lecture) return next();

  const state = course.stateOf(req.tenantId, req.user.id, lecture.id);
  if (!state.unlocked) {
    return res.status(403).render('error', {
      title: 'Тест закритий', message: 'Спочатку складіть тест попередньої лекції.',
    });
  }

  const seed = attemptSeed(req.tenantId, req.user.id, lecture.id);
  const questions = course.renderQuestions(quiz.build(lecture, seed), ctxFor(req));

  res.render('course/quiz', {
    title: `Тест: ${lecture.title}`,
    lecture, questions, seed, passPercent: quiz.PASS_PERCENT,
  });
});

router.post('/:id/quiz', async (req, res, next) => {
  const lecture = content.get(req.params.id);
  if (!lecture) return next();

  const state = course.stateOf(req.tenantId, req.user.id, lecture.id);
  if (!state.unlocked) {
    return res.status(403).render('error', {
      title: 'Тест закритий', message: 'Спочатку складіть тест попередньої лекції.',
    });
  }

  const seed = String(req.body.seed || '');
  const ctx = ctxFor(req);
  const questions = course.renderQuestions(quiz.build(lecture, seed), ctx);
  const result = quiz.grade(questions, req.body);

  course.recordAttempt(req.tenantId, req.user.id, lecture.id, result, result.details);

  // Відкриті відповіді зберігаємо завжди; оцінка від AI — якщо вона доступна.
  // Помилка перевірки не має ламати показ результату.
  for (const d of result.details) {
    if (d.type !== 'rewrite' || !d.answer) continue;
    const id = course.saveOpenAnswer(req.tenantId, req.user.id, lecture.id, d.id, d.answer);
    d.ai = await ai.gradeStored(id);
  }

  res.render('course/result', {
    title: `Результат: ${lecture.title}`,
    lecture, result,
    passPercent: quiz.PASS_PERCENT,
    aiConfigured: ai.isConfigured(),
    next: result.passed ? content.next(lecture.id) : null,
  });
});

module.exports = router;
