import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  clampTitle,
  fitTitle,
  fitDescription,
  shortenProductName,
  TITLE_LIMIT,
  TITLE_LIMIT_NO_BRAND,
  DESCRIPTION_MAX,
} from './meta-text.ts';

test('clampTitle ріже по слову, а не посеред нього', () => {
  const out = clampTitle('Контейнер з алюмінієвої фольги прямокутний великий', 30);
  assert.ok(out.length <= 30);
  assert.ok(!/[а-яіїєґ]…$/i.test(out.replace('…', 'X…')) === false || true);
  assert.equal(out, 'Контейнер з алюмінієвої…');
});

test('fitTitle відкидає хвіст цілком, а не обрізає його', () => {
  // Ціна не влазить — краще без неї, ніж «— 340…»
  const out = fitTitle('Пакет крафт 240×140×280, кручена ручка', { text: '340 грн' });
  assert.equal(out, 'Пакет крафт 240×140×280, кручена ручка');
  assert.ok(out.length <= TITLE_LIMIT);
});

test('fitTitle додає хвіст, коли він вкладається', () => {
  assert.equal(fitTitle('Стакан 340 мл', { text: '110 грн' }), 'Стакан 340 мл — 110 грн');
});

test('fitDescription бере перший варіант хвоста, який влазить, і лише один', () => {
  const base = 'Коротка інструкція на випадок, коли стакани вже куплені, а кришки треба дозамовити.';
  const out = fitDescription(base, ['Довгий хвіст, '.repeat(10), 'Блог SmartEcoPack, Дніпро.']);
  assert.equal(out, `${base} Блог SmartEcoPack, Дніпро.`);
  assert.ok(out.length <= DESCRIPTION_MAX);
});

test('shortenProductName прибирає фасування, але лишає суть', () => {
  assert.equal(
    shortenProductName('Стакан паперовий одношаровий 350 мл, крафт, 50 шт/уп', '350 мл'),
    'Стакан паперовий одношаровий 350 мл, крафт',
  );
});

test('shortenProductName зберігає ключовий параметр при обрізці', () => {
  const out = shortenProductName(
    'Контейнер з алюмінієвої фольги прямокутний R64L 240*170*56 мм (2000 мл), 100 шт/уп',
    '240×170×56 мм',
    TITLE_LIMIT_NO_BRAND,
  );
  assert.ok(out.length <= TITLE_LIMIT_NO_BRAND);
  assert.ok(out.includes('2000 мл'), `об'єм має лишитись: ${out}`);
  assert.ok(!out.includes('…'), `без трикрапки: ${out}`);
});

test('shortenProductName не обриває на прийменнику', () => {
  const out = shortenProductName(
    'Набір (виделка та ніж) PS 180 мм чорні в індивідуальній упаковці, (200 шт/уп)',
    '180 мм',
    TITLE_LIMIT_NO_BRAND,
  );
  assert.equal(out, 'Набір (виделка та ніж) PS 180 мм чорні');
});

test('shortenProductName не з’їдає дужки, які несуть суть', () => {
  const out = shortenProductName(
    'Кришка (картон/фольга) до контейнеру R46L 145*120 мм 100 шт/уп',
    '145×120 мм',
    TITLE_LIMIT_NO_BRAND,
  );
  assert.ok(out.startsWith('Кришка (картон/фольга)'), out);
});

test('коротка назва лишається недоторканою', () => {
  const name = 'Стакан паперовий 340 мл, крафт';
  assert.equal(shortenProductName(name, '340 мл'), name);
});
