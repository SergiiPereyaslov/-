'use strict';

// Курс: підстановка даних компанії в лекції, прогрес і послідовність.
// Наступна лекція відкривається лише після складеного тесту попередньої.

const { db } = require('./db');
const content = require('../content');
const profile = require('./profile');
const { deepFill } = require('./format');

function progressFor(tenantId, userId) {
  const rows = db.prepare(
    `SELECT lecture_id, read_at, passed_at, best_percent
       FROM lecture_progress WHERE tenant_id = ? AND user_id = ?`
  ).all(tenantId, userId);
  const map = new Map(rows.map((r) => [r.lecture_id, r]));

  return content.all().map((l, i, arr) => {
    const p = map.get(l.id);
    const prev = i === 0 ? null : map.get(arr[i - 1].id);
    return {
      id: l.id,
      n: l.n,
      block: l.block,
      title: l.title,
      minutes: l.minutes,
      goal: l.goal,
      read: Boolean(p && p.read_at),
      passed: Boolean(p && p.passed_at),
      bestPercent: p ? p.best_percent : 0,
      unlocked: i === 0 || Boolean(prev && prev.passed_at),
    };
  });
}

function stateOf(tenantId, userId, lectureId) {
  return progressFor(tenantId, userId).find((l) => l.id === lectureId) || null;
}

function markRead(tenantId, userId, lectureId) {
  db.prepare(
    `INSERT INTO lecture_progress (tenant_id, user_id, lecture_id, read_at)
     VALUES (?, ?, ?, datetime('now'))
     ON CONFLICT (user_id, lecture_id)
       DO UPDATE SET read_at = COALESCE(lecture_progress.read_at, datetime('now'))`
  ).run(tenantId, userId, lectureId);
}

function recordAttempt(tenantId, userId, lectureId, result, details) {
  db.prepare(
    `INSERT INTO quiz_attempts (tenant_id, user_id, lecture_id, correct, total, percent, passed, answers)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(tenantId, userId, lectureId, result.correct, result.total, result.percent,
    result.passed ? 1 : 0, JSON.stringify(details));

  db.prepare(
    `INSERT INTO lecture_progress (tenant_id, user_id, lecture_id, read_at, passed_at, best_percent)
     VALUES (?, ?, ?, datetime('now'), ?, ?)
     ON CONFLICT (user_id, lecture_id) DO UPDATE SET
       passed_at    = COALESCE(lecture_progress.passed_at, excluded.passed_at),
       best_percent = MAX(lecture_progress.best_percent, excluded.best_percent)`
  ).run(tenantId, userId, lectureId, result.passed ? new Date().toISOString() : null, result.percent);
}

function saveOpenAnswer(tenantId, userId, lectureId, questionId, answer) {
  const info = db.prepare(
    `INSERT INTO open_answers (tenant_id, user_id, lecture_id, question_id, answer)
     VALUES (?, ?, ?, ?, ?)`
  ).run(tenantId, userId, lectureId, questionId, answer);
  return Number(info.lastInsertRowid);
}

// Готує лекцію до показу: підставляє дані компанії в усі тексти.
function render(lecture, ctx) {
  return {
    ...lecture,
    sections: deepFill(lecture.sections, ctx, profile.fill),
  };
}

function renderQuestions(questions, ctx) {
  return deepFill(questions, ctx, profile.fill);
}

function summary(tenantId, userId) {
  const list = progressFor(tenantId, userId);
  const passed = list.filter((l) => l.passed).length;
  return { passed, total: list.length, percent: Math.round((passed / list.length) * 100) };
}

module.exports = {
  progressFor, stateOf, markRead, recordAttempt, saveOpenAnswer,
  render, renderQuestions, summary,
};
