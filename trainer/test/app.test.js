'use strict';

// Наскрізний прохід: вхід → лекція → тест → наступна лекція. Заразом перевіряє,
// що всі шаблони рендеряться, і що менеджер не бачить чужої компанії.

const test = require('node:test');
const assert = require('node:assert');
const { useTempDb } = require('./helpers');
useTempDb('app');

const { createTenant, createUser, db } = require('../src/db');
const app = require('../server');
const content = require('../content');
const quiz = require('../src/quiz');
const profile = require('../src/profile');

const dniprograf = createTenant('Дніпрограф', 'dniprograf');
const smartecopack = createTenant('Смартекопак', 'smartecopack');

profile.save(dniprograf, {
  company_name: 'Дніпрограф',
  products: ['візиток і каталогів'],
  portraits: ['Маркетолог виробника — керівник відділу', 'Рекламна агенція — акаунт'],
  decider: 'Керівник відділу маркетингу',
  gatekeeper: 'Секретар',
  advantages: ['Друк за два дні', 'Свій пре-прес'],
  objections: ['Дорого', 'Є своя друкарня', 'Надішліть прайс'],
  success: 'домовилися про зустріч',
});
profile.save(smartecopack, { company_name: 'Смартекопак', products: ['крафт-пакетів'] });

createUser({ tenantId: dniprograf, username: 'kovalenko', password: 'test1234',
  fullName: 'Олександр Коваленко', role: 'manager' });

let base;
let server;

test.before(async () => {
  server = app.listen(0);
  await new Promise((r) => server.once('listening', r));
  base = `http://127.0.0.1:${server.address().port}`;
});

test.after(() => server && server.close());

let cookie = '';

async function req(pathname, options = {}) {
  const res = await fetch(base + pathname, {
    redirect: 'manual',
    ...options,
    headers: { ...(options.headers || {}), cookie },
  });
  const set = res.headers.getSetCookie ? res.headers.getSetCookie() : [];
  for (const c of set) {
    const pair = c.split(';')[0];
    const name = pair.split('=')[0];
    const rest = cookie.split('; ').filter(Boolean).filter((x) => !x.startsWith(name + '='));
    cookie = [...rest, pair].join('; ');
  }
  return res;
}

test('без входу редіректить на сторінку логіна', async () => {
  const res = await req('/');
  assert.equal(res.status, 302);
  assert.equal(res.headers.get('location'), '/login');
});

test('невірний пароль не пускає', async () => {
  const res = await req('/login', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: 'username=kovalenko&password=wrong',
  });
  assert.equal(res.status, 401);
});

test('менеджер входить і бачить свою компанію', async () => {
  const res = await req('/login', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: 'username=kovalenko&password=test1234',
  });
  assert.equal(res.status, 302);

  const home = await req('/');
  const html = await home.text();
  assert.equal(home.status, 200);
  assert.ok(html.includes('Дніпрограф'), 'на головній має бути назва своєї компанії');
  assert.ok(!html.includes('Смартекопак'), 'чужої компанії бути не має');
});

test('підміна cookie компанії не дає доступу до чужих даних', async () => {
  const saved = cookie;
  cookie = `${cookie}; tid=${smartecopack}`;
  const res = await req('/profile');
  const html = await res.text();
  assert.ok(html.includes('Дніпрограф'), 'менеджер має лишитися у своїй компанії');
  assert.ok(!html.includes('крафт-пакет'), 'дані чужої анкети не мають протікати');
  cookie = saved;
});

test('менеджер не може відкрити розділ керівника', async () => {
  const res = await req('/admin/users');
  assert.equal(res.status, 403);
});

test('друга лекція закрита, поки не складено першу', async () => {
  const second = content.all()[1].id;
  const res = await req(`/course/${second}`);
  assert.equal(res.status, 403);
});

test('лекція відкривається з підставленими даними компанії', async () => {
  const first = content.all()[0].id;
  const res = await req(`/course/${first}`);
  const html = await res.text();
  assert.equal(res.status, 200);
  assert.ok(html.includes('Мета холодного дзвінка'));
  assert.ok(html.includes('домовилися про зустріч'), 'мета дзвінка береться з анкети');
  assert.ok(!html.includes('{{'), 'у сторінці не має лишитися жодного токена');
});

test('складений тест відкриває наступну лекцію', async () => {
  const lecture = content.all()[0];
  const page = await req(`/course/${lecture.id}/quiz`);
  const html = await page.text();
  assert.equal(page.status, 200);

  const seed = /name="seed" value="([^"]+)"/.exec(html)[1];
  const questions = quiz.build(lecture, seed);

  const body = new URLSearchParams({ seed });
  for (const q of questions) {
    if (q.type === 'single') body.set(q.id, String(q.options.findIndex((o) => o.ok)));
    else body.set(q.id, 'Давайте я наберу вас у вівторок об 11 із розрахунком?');
  }

  const res = await req(`/course/${lecture.id}/quiz`, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
  const result = await res.text();
  assert.equal(res.status, 200);
  assert.ok(result.includes('100%'), 'усі відповіді правильні — має бути 100%');
  assert.ok(result.includes('Складено'));

  const second = await req(`/course/${content.all()[1].id}`);
  assert.equal(second.status, 200, 'наступна лекція має відкритися');
});

test('відповідь на вправу збережено для розбору керівником', () => {
  const rows = db.prepare('SELECT * FROM open_answers WHERE tenant_id = ?').all(dniprograf);
  assert.equal(rows.length, 1);
  assert.match(rows[0].answer, /вівторок/);
  assert.equal(rows[0].status, 'pending', 'без ключа AI відповідь чекає на керівника');
});
