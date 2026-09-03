'use strict';

// Ядро курсу. Порядок у масиві = порядок проходження: наступна лекція
// відкривається лише після складеного тесту попередньої.
const LECTURES = [
  require('./lectures/01-meta'),
  require('./lectures/02-first15'),
  require('./lectures/03-benefit'),
  require('./lectures/04-questions'),
  require('./lectures/05-spin'),
  require('./lectures/06-objection-anatomy'),
  require('./lectures/07-five-objections'),
  require('./lectures/08-closing'),
  require('./lectures/09-after-call'),
];

// Чотири навички — наскрізна структура курсу, чеклиста й вправ.
const SKILLS = {
  presentation: 'Презентація компанії',
  discovery: 'Виявлення потреб',
  objections: 'Робота із запереченнями',
  closing: 'Переведення в теплий',
};

const byId = new Map(LECTURES.map((l) => [l.id, l]));

function all() {
  return LECTURES;
}

function get(id) {
  return byId.get(id) || null;
}

function indexOf(id) {
  return LECTURES.findIndex((l) => l.id === id);
}

function next(id) {
  const i = indexOf(id);
  return i >= 0 && i + 1 < LECTURES.length ? LECTURES[i + 1] : null;
}

module.exports = { all, get, indexOf, next, SKILLS, LECTURES };
