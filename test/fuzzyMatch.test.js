'use strict';

const { test } = require('node:test');
const assert = require('node:assert');
const { tokenize, diceCoefficient, bestMatch, findUniquePrefixMatch } = require('../src/fuzzyMatch');

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

test('findUniquePrefixMatch знаходить установу за обрізаною назвою', () => {
  const candidates = [
    { name: 'ВСП Політехнічний фаховий коледж Кременчуцького національного університету імені Михайла Остроградського', normName: 'всп політехнічний фаховий коледж кременчуцького національного університету імені михайла остроградського' },
    { name: 'ВСП Політехнічний фаховий коледж Криворізького національного університету', normName: 'всп політехнічний фаховий коледж криворізького національного університету' },
  ];
  // Обрізано на «Остро» — саме так macOS обрізає найдовші назви папок.
  const truncated = 'всп політехнічний фаховий коледж кременчуцького національного університету імені михайла остро';
  const match = findUniquePrefixMatch(truncated, candidates, 30);
  assert.equal(match.name, 'ВСП Політехнічний фаховий коледж Кременчуцького національного університету імені Михайла Остроградського');
});

test('findUniquePrefixMatch не обирає нічого, якщо префікс спільний для кількох', () => {
  const candidates = [
    { name: 'А', normName: 'криворізький фаховий коледж торгівлі' },
    { name: 'Б', normName: 'криворізький фаховий коледж будівництва' },
  ];
  assert.equal(findUniquePrefixMatch('криворізький фаховий коледж', candidates, 10), null);
});

test('findUniquePrefixMatch ігнорує закороткі запити — ризик випадкового збігу', () => {
  const candidates = [{ name: 'А', normName: 'криворізький національний університет' }];
  // Запит коротший за поріг — навіть якщо збіг єдиний, це занадто ризиковано.
  assert.equal(findUniquePrefixMatch('криворізький', candidates, 30), null);
});
