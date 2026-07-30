'use strict';

const { test } = require('node:test');
const assert = require('node:assert');
const { tokenize, diceCoefficient, bestMatch } = require('../src/fuzzyMatch');

test('tokenize відкидає короткі та службові слова', () => {
  const t = tokenize('ДНЗ Вище професійне училище №7 м. Вінниця');
  assert.ok(t.has('вище'));
  assert.ok(t.has('професійне'));
  assert.ok(t.has('училище'));
  assert.ok(t.has('вінниця'));
  assert.ok(!t.has('м')); // коротше за 2 символи
});

test('diceCoefficient — 1.0 для однакових наборів, 0 для непересічних', () => {
  const a = tokenize('Вінницький професійний ліцей');
  assert.equal(diceCoefficient(a, a), 1);
  const b = tokenize('зовсім інша фраза без спільних слів тут');
  assert.equal(diceCoefficient(a, b), 0);
});

test('diceCoefficient толерантний до часткових скорочень і зайвих пробілів', () => {
  const full = tokenize('Державний навчальний заклад  Електрорадіотехнічний ліцей м. Полтави');
  const partial = tokenize('ДНЗ Електрорадіотехнічний ліцей м. Полтави');
  // «Державний навчальний заклад» дає інші токени, ніж «ДНЗ», але решта слів
  // («електрорадіотехнічний», «ліцей», «полтави») спільна — і цього досить
  // для впевненого зіставлення.
  assert.ok(diceCoefficient(full, partial) >= 0.6, `очікувалась висока схожість, отримано ${diceCoefficient(full, partial)}`);
});

test('bestMatch обирає кандидата з найвищим коефіцієнтом', () => {
  const query = tokenize('Криворізький професійний гірничо-металургійний ліцей');
  const candidates = [
    { name: 'Криворізький національний університет', tokens: tokenize('Криворізький національний університет') },
    { name: 'Криворізький професійний гірничо-металургійний ліцей', tokens: tokenize('Криворізький професійний гірничо-металургійний ліцей') },
    { name: 'Полтавський професійний ліцей сфери послуг', tokens: tokenize('Полтавський професійний ліцей сфери послуг') },
  ];
  const { candidate, score } = bestMatch(query, candidates);
  assert.equal(candidate.name, 'Криворізький професійний гірничо-металургійний ліцей');
  assert.equal(score, 1);
});

test('bestMatch повертає null для порожнього списку кандидатів', () => {
  assert.equal(bestMatch(tokenize('щось'), []), null);
});
