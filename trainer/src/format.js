'use strict';

function escapeHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Мінімальне форматування всередині рядка: **жирний**. Спочатку екранування,
// потім розмітка — тому текст лекції не може принести в сторінку HTML.
function inline(s) {
  return escapeHtml(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
}

// Рекурсивно проганяє всі рядки структури через підстановку {{token}}.
function deepFill(value, ctx, fill) {
  if (typeof value === 'string') return fill(value, ctx);
  if (Array.isArray(value)) return value.map((v) => deepFill(v, ctx, fill));
  if (value && typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) out[k] = deepFill(v, ctx, fill);
    return out;
  }
  return value;
}

// Детермінований генератор: та сама спроба дає той самий набір питань,
// нова спроба — інший. Перезавантаження сторінки не перемішує тест.
function rng(seed) {
  let a = 0;
  const s = String(seed);
  for (let i = 0; i < s.length; i++) a = (a * 31 + s.charCodeAt(i)) >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle(arr, rand) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

module.exports = { escapeHtml, inline, deepFill, rng, shuffle };
