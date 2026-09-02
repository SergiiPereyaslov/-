'use strict';

// Тест після лекції. Питання беруться з банку випадково, тому двічі поспіль
// однаковий тест не випаде. Бал рахується лише за закритими питаннями;
// відкриті («перепиши фразу») зберігаються окремо й оцінюються AI.

const { rng, shuffle } = require('./format');

const QUESTIONS_PER_QUIZ = 6;
const PASS_PERCENT = 80;

// Складає тест: до одного відкритого питання плюс закриті до потрібної кількості.
function build(lecture, seed) {
  const rand = rng(`${lecture.id}:${seed}`);
  const closed = lecture.bank.filter((q) => q.type === 'single');
  const open = lecture.bank.filter((q) => q.type === 'rewrite');

  const picked = [];
  if (open.length) picked.push(shuffle(open, rand)[0]);
  picked.push(...shuffle(closed, rand).slice(0, QUESTIONS_PER_QUIZ - picked.length));

  // Порядок питань і варіантів перемішується, щоб не запам'ятовували «третій зверху».
  return shuffle(picked, rand).map((q) => {
    if (q.type !== 'single') return { ...q };
    return { ...q, options: shuffle(q.options, rand) };
  });
}

// Перевіряє відповіді. answers — { [questionId]: значення }.
// Для закритих питань значення — індекс варіанта в тому вигляді, як його бачив
// користувач, тому перевіряємо по вже перемішаному списку.
function grade(questions, answers) {
  const details = [];
  let correct = 0;
  let total = 0;

  for (const q of questions) {
    if (q.type === 'single') {
      total += 1;
      const idx = Number(answers[q.id]);
      const chosen = Number.isInteger(idx) ? q.options[idx] : null;
      const ok = Boolean(chosen && chosen.ok);
      if (ok) correct += 1;
      details.push({
        id: q.id, type: 'single', q: q.q, ok,
        chosen: chosen ? chosen.text : null,
        why: chosen ? chosen.why : 'Ви не обрали варіант.',
        rightText: (q.options.find((o) => o.ok) || {}).text || '',
      });
    } else {
      details.push({
        id: q.id, type: 'rewrite', q: q.q,
        answer: String(answers[q.id] || '').trim(),
        criteria: q.criteria || [],
        reference: q.reference || '',
      });
    }
  }

  const percent = total ? Math.round((correct / total) * 100) : 0;
  return { correct, total, percent, passed: percent >= PASS_PERCENT, details };
}

module.exports = { build, grade, QUESTIONS_PER_QUIZ, PASS_PERCENT };
