'use strict';

// Зіставлення «на слух» — коли точний збіг назв не спрацював через
// неоднорідність джерела (лапки, подвійні пробіли, часткові скорочення,
// перепутаний регістр абревіатур, інший порядок слів). Порівнює набори
// слів, а не рядки побуквено.

const STOP = new Set(['та', 'і', 'й', 'з', 'у', 'в', 'на', 'до', 'імені', 'ім']);

// Слова довші за 2 символи, без службових — саме вони несуть зміст назви.
function tokenize(text) {
  return new Set(
    String(text || '')
      .normalize('NFC')
      .toLowerCase()
      .replace(/[«»"“”„'’ʼ`´]/g, ' ')
      .replace(/[–—−-]/g, ' ')
      .replace(/[.,;:()]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2 && !STOP.has(w))
  );
}

// Коефіцієнт Дайса: частка спільних слів відносно розміру обох наборів.
// 1.0 — однакові набори слів, 0 — нічого спільного.
function diceCoefficient(a, b) {
  if (!a.size || !b.size) return 0;
  let inter = 0;
  for (const t of a) if (b.has(t)) inter++;
  return (2 * inter) / (a.size + b.size);
}

// Найкращий кандидат із candidates (масив { ...., tokens }) для набору
// слів query. Повертає { candidate, score } або null, якщо candidates порожній.
function bestMatch(queryTokens, candidates) {
  let best = null;
  for (const c of candidates) {
    const score = diceCoefficient(queryTokens, c.tokens);
    if (!best || score > best.score) best = { candidate: c, score };
  }
  return best;
}

// Обрізана назва (найдовші назви установ macOS іноді обрізає при
// розпакуванні) — точний префікс РІВНО ОДНОГО кандидата? candidates —
// масив об'єктів із полем normName (нормалізована повна назва).
// Довжина запиту має бути не меншою за minLen: короткий префікс
// («Криворізький») міг би випадково збігтися з кількома установами.
function findUniquePrefixMatch(normQuery, candidates, minLen) {
  if (normQuery.length < minLen) return null;
  const matches = candidates.filter((c) => c.normName.startsWith(normQuery));
  return matches.length === 1 ? matches[0] : null;
}

module.exports = { tokenize, diceCoefficient, bestMatch, findUniquePrefixMatch };
