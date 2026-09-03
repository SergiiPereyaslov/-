'use strict';

// Тести анонімізатора. Він працює з персональними даними реальних клієнтів,
// тому кожне правило перевіряється окремо: пропущений телефон — це витік.

const test = require('node:test');
const assert = require('node:assert');
const { processFile, normalizeSpeakers, stripSubtitles } = require('../anonymize');

const NAMES = [
  { from: 'Ірина Коваленко', to: '[Клієнт А]' },
  { from: 'Ірина', to: '[Клієнт А]' },
  { from: 'Поліграф-Сервіс', to: '[постачальник]' },
];

function clean(text, names = NAMES) {
  return processFile(text, names).text;
}

test('телефони прибираються в усіх поширених записах', () => {
  const cases = [
    'Мій номер 067 555 44 33, дзвоніть',
    'Телефон +380671234567 робочий',
    'Набирайте 0675554433 будь-коли',
    'Мій 067-555-44-33 завжди на зв\'язку',
    'Це (067) 555 44 33, записуйте',
  ];
  for (const c of cases) {
    const out = clean(c);
    assert.ok(out.includes('[телефон]'), `не спрацювало: ${c}`);
    assert.ok(!/\d{3}\s?\d{3}\s?\d{2}\s?\d{2}/.test(out), `лишився номер: ${out}`);
  }
});

test('пробіл перед номером не зникає — слова не злипаються', () => {
  const out = clean('Мій номер 067 555 44 33, записуйте');
  assert.ok(out.includes('номер [телефон]'), out);
  assert.ok(!out.includes('номер[телефон]'), 'пробіл з\'їдено');
});

test('суми в гривнях прибираються, попри кириличний «грн»', () => {
  // \b у JavaScript не знає кириличних літер — саме на цьому був баг.
  for (const c of ['Вийшло 12500 грн за партію', 'По 2,20 грн за стакан',
                   'Це 1 500 гривень усього', 'Десь 800₴ за тираж']) {
    const out = clean(c);
    assert.ok(out.includes('[сума]'), `не спрацювало: ${c}`);
  }
});

test('суми в валюті прибираються', () => {
  assert.ok(clean('Приблизно $100 зверху').includes('[сума]'));
  assert.ok(clean('Близько 250 USD').includes('[сума]'));
});

test('e-mail прибирається', () => {
  const out = clean('Пишіть на olexandr@dniprograf.ua будь-коли');
  assert.ok(out.includes('[email]'));
  assert.ok(!out.includes('@dniprograf'));
});

test('довгі числа — картки, ЄДРПОУ, рахунки — прибираються', () => {
  const out = clean('ЄДРПОУ 44664514, перевірте');
  assert.ok(out.includes('[номер]'), out);
});

test('імена замінюються, довші варіанти мають пріоритет', () => {
  const out = clean('Це Ірина Коваленко, керуюча. Ірина слухає.');
  assert.equal(out, 'Це [Клієнт А], керуюча. [Клієнт А] слухає.');
});

test('заміна імен не залежить від регістру', () => {
  assert.ok(clean('поліграф-сервіс нас підвів').includes('[постачальник]'));
});

test('позначки дійових осіб зводяться до М: і К:', () => {
  const out = normalizeSpeakers(
    'Speaker 1: Доброго дня\nSpeaker 2: Слухаю\nОператор: Ще раз\nАбонент: Так'
  );
  assert.ok(out.includes('М: Доброго дня'));
  assert.ok(out.includes('К: Слухаю'));
  assert.ok(out.includes('М: Ще раз'));
  assert.ok(out.includes('К: Так'));
});

test('розмітка субтитрів прибирається', () => {
  const srt = '1\n00:00:01,000 --> 00:00:04,000\nДоброго дня\n\n2\n00:00:04,000 --> 00:00:06,000\nСлухаю\n';
  const out = stripSubtitles(srt);
  assert.ok(out.includes('Доброго дня'));
  assert.ok(!out.includes('-->'));
  assert.ok(!/^\d+$/m.test(out.trim()));
});

test('звіт показує, що саме прибрано', () => {
  const r = processFile('Ірина, мій 067 555 44 33, ціна 500 грн, пошта a@b.ua', NAMES);
  assert.equal(r.counts['імена'], 1);
  assert.equal(r.counts['телефон'], 1);
  assert.equal(r.counts['сума'], 1);
  assert.equal(r.counts['e-mail'], 1);
});

test('незамінене ім\'я потрапляє в перелік на перевірку', () => {
  const r = processFile('К: Це Оксана Мельник, я керуюча', NAMES);
  assert.ok(r.suspicious.includes('Оксана'), r.suspicious.join(', '));
  assert.ok(r.suspicious.includes('Мельник'), r.suspicious.join(', '));
});

test('службові слова не потрапляють у перелік на перевірку', () => {
  const r = processFile('М: Доброго дня! Дякую. Зрозуміло. Домовились у Четвер', NAMES);
  for (const w of ['Доброго', 'Дякую', 'Зрозуміло', 'Домовились', 'Четвер']) {
    assert.ok(!r.suspicious.includes(w), `${w} не має бути в переліку`);
  }
});

test('порожній файл не ламає обробку', () => {
  const r = processFile('', NAMES);
  assert.equal(r.text, '');
  assert.deepEqual(r.counts, {});
});

test('текст без персональних даних лишається незмінним', () => {
  const src = 'М: Телефоную у справі: етикетка. Ви це де замовляєте?\nК: А ви хто?';
  assert.equal(clean(src), src);
});
