'use strict';

// Перевірка відкритих питань («перепиши фразу») через Claude.
//
// Модуль навмисне не обов'язковий: якщо ANTHROPIC_API_KEY не заданий або пакет
// не встановлений, тренажер працює далі — відповідь просто лишається в статусі
// pending, і її бачить керівник. Бал за тест від цього не залежить: закриті
// питання рахує код.

const { db } = require('./db');

const MODEL = 'claude-opus-5';

function isConfigured() {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

let client = null;
function getClient() {
  if (client) return client;
  try {
    const Anthropic = require('@anthropic-ai/sdk');
    client = new Anthropic();
    return client;
  } catch {
    return null;
  }
}

const SYSTEM = `Ти — досвідчений керівник відділу продажів. Перевіряєш вправу менеджера-новачка з курсу холодних дзвінків.

Оцінюй СТРОГО за наданими критеріями і ні за чим іншим. Не вигадуй фактів про компанію, продукт, ціни чи умови — їх у тебе немає.

Відповідай ЛИШЕ валідним JSON без markdown-огорожі, у форматі:
{"score": <0-100>, "met": ["критерій, який виконано"], "missed": ["критерій, який не виконано"], "feedback": "2-3 речення українською: що конкретно доброго, що виправити", "better": "покращений варіант фрази менеджера"}

Правила оцінювання:
- 100 — виконано всі критерії;
- мінус приблизно рівна частка за кожен невиконаний критерій;
- нижче 50 — якщо відповідь не по суті, порожня або суперечить сенсу вправи.
Тон — доброзичливий і конкретний, без похвали заради похвали.`;

function extractJson(text) {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end <= start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
}

// Оцінює одну відповідь. Повертає результат або null, якщо перевірка недоступна.
async function gradeOpenAnswer({ question, criteria, reference, answer }) {
  if (!isConfigured()) return null;
  const c = getClient();
  if (!c) return null;

  const prompt = [
    `ЗАВДАННЯ ВПРАВИ:\n${question}`,
    `КРИТЕРІЇ ОЦІНЮВАННЯ:\n${(criteria || []).map((x, i) => `${i + 1}. ${x}`).join('\n')}`,
    reference ? `ЕТАЛОННИЙ ВАРІАНТ (орієнтир, не єдина правильна відповідь):\n${reference}` : '',
    `ВІДПОВІДЬ МЕНЕДЖЕРА:\n${answer}`,
  ].filter(Boolean).join('\n\n');

  const res = await c.messages.create({
    model: MODEL,
    max_tokens: 2000, // відповідь навмисне коротка: один JSON-об'єкт
    system: SYSTEM,
    thinking: { type: 'adaptive' },
    output_config: { effort: 'low' },
    messages: [{ role: 'user', content: prompt }],
  });

  const text = res.content
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('\n');

  const parsed = extractJson(text);
  if (!parsed || typeof parsed.score !== 'number') return null;

  return {
    score: Math.max(0, Math.min(100, Math.round(parsed.score))),
    met: Array.isArray(parsed.met) ? parsed.met : [],
    missed: Array.isArray(parsed.missed) ? parsed.missed : [],
    feedback: String(parsed.feedback || ''),
    better: String(parsed.better || ''),
  };
}

// Перевіряє збережену відповідь і оновлює рядок. Помилка мережі не має ламати
// проходження тесту, тому все загорнуто: відповідь просто лишиться pending.
async function gradeStored(answerId) {
  const row = db.prepare('SELECT * FROM open_answers WHERE id = ?').get(answerId);
  if (!row || row.status === 'graded') return null;

  const content = require('../content');
  const lecture = content.get(row.lecture_id);
  const question = lecture && lecture.bank.find((q) => q.id === row.question_id);
  if (!question) return null;

  try {
    const result = await gradeOpenAnswer({
      question: question.q,
      criteria: question.criteria,
      reference: question.reference,
      answer: row.answer,
    });
    if (!result) return null;

    db.prepare(
      `UPDATE open_answers SET status = 'graded', ai_score = ?, ai_feedback = ? WHERE id = ?`
    ).run(result.score, JSON.stringify(result), answerId);
    return result;
  } catch (err) {
    console.error('[ai] не вдалося оцінити відповідь', answerId, err.message);
    return null;
  }
}

module.exports = { isConfigured, gradeOpenAnswer, gradeStored, MODEL };
