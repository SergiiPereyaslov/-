'use strict';

// Анкета компанії — джерело всієї персоналізації. Сім екранів; з відповідей
// збирається контекст, який підставляється в лекції, тести й (з другого етапу)
// у AI-персонажів. Ядро курсу від компанії не залежить — залежать лише приклади.

const { db } = require('./db');

const SCREENS = [
  {
    id: 'product',
    title: 'Що продаємо',
    intro: 'Людською мовою, як пояснили б знайомому. Без маркетингових формулювань.',
    fields: [
      { key: 'company_name', label: 'Назва компанії', type: 'text', required: true,
        placeholder: 'Смартекопак' },
      { key: 'products', label: 'Що продаємо — по одній позиції в рядок', type: 'lines',
        required: true, min: 1, rows: 6,
        hint: 'Три-сім позицій. Те, що реально пропонують у холодному дзвінку.',
        placeholder: 'Крафтові пакети з ручками\nСтакани для кави з кришками\nБокси для бургерів і суші' },
      { key: 'tenure', label: 'Скільки років на ринку', type: 'text', placeholder: '4 роки' },
      { key: 'geo', label: 'Географія роботи', type: 'text', placeholder: 'Дніпро та область, доставка по Україні' },
    ],
  },
  {
    id: 'audience',
    title: 'Кому продаємо',
    intro: 'Два-чотири портрети клієнта. Саме з них будуються персонажі для рольових дзвінків.',
    fields: [
      { key: 'portraits', label: 'Портрети клієнта — по одному в рядок', type: 'lines',
        required: true, min: 2, rows: 6,
        hint: 'Формат: хто це — хто там ухвалює рішення.',
        placeholder: 'Кав’ярня на 40–80 місць — власник або керуючий\nПіцерія з доставкою — власник\nСуші-бар — керуючий або закупівельник\nДарк-кітчен — операційний директор' },
    ],
  },
  {
    id: 'decision',
    title: 'Хто вирішує і хто бере трубку',
    intro: 'Найчастіша причина провалу холодного дзвінка — розмова не з тією людиною.',
    fields: [
      { key: 'decider', label: 'Хто ухвалює рішення про закупівлю', type: 'text',
        required: true, placeholder: 'Власник; у мережі — керуючий або закупівельник' },
      { key: 'gatekeeper', label: 'Хто найчастіше бере трубку', type: 'text',
        placeholder: 'Бариста або адміністратор залу' },
      { key: 'gatekeeper_phrase', label: 'Як вона зазвичай відшиває', type: 'text',
        placeholder: 'Надішліть на пошту, керівник подивиться' },
    ],
  },
  {
    id: 'advantages',
    title: 'Наші переваги',
    intro: 'Конкретно й перевірювано. «Якість і сервіс» — це не перевага, це те, що каже кожен.',
    fields: [
      { key: 'advantages', label: 'Три переваги проти конкурента — по одній у рядок',
        type: 'lines', required: true, min: 2, rows: 5,
        placeholder: 'Доставка по Дніпру за 24 години безкоштовно\nПерсональний менеджер, а не загальна пошта\nТримаємо складський запас — не буває «немає в наявності»' },
      { key: 'competitor', label: 'З ким нас найчастіше порівнюють', type: 'text',
        placeholder: 'Оптові бази й прямі закупівлі з Китаю' },
    ],
  },
  {
    id: 'price',
    title: 'Ціна',
    intro: 'Менеджер має знати, що можна казати по телефону, а що — тільки після розрахунку.',
    fields: [
      { key: 'price_anchor', label: 'Ціновий орієнтир', type: 'text',
        placeholder: 'Від 2,20 грн за стакан на об’ємі від 1000 шт' },
      { key: 'price_policy', label: 'Що можна казати про ціну по телефону', type: 'textarea',
        rows: 4,
        placeholder: 'Називати вилку «від» і одразу переходити до об’єму. Точну ціну — лише після розрахунку під тираж.' },
    ],
  },
  {
    id: 'objections',
    title: 'Ваші заперечення',
    intro: 'Найцінніші рядки в усій анкеті. Пишіть дослівно, як їх кажуть у трубку — з інтонацією й скороченнями.',
    fields: [
      { key: 'objections', label: 'Топ-5 заперечень — по одному в рядок', type: 'lines',
        required: true, min: 3, rows: 7,
        placeholder: 'У нас уже є постачальник, все влаштовує\nДорого, ми беремо дешевше\nНадішліть прайс на пошту\nЗараз не сезон, передзвоніть восени\nМені ніколи, я в залі' },
    ],
  },
  {
    id: 'success',
    title: 'Що вважається успіхом дзвінка',
    intro: 'Мета одного холодного дзвінка. Від неї залежить, за що менеджер отримує бали.',
    fields: [
      { key: 'success', label: 'Успішний холодний дзвінок закінчується тим, що…',
        type: 'text', required: true,
        placeholder: 'домовилися про зустріч або надсилаємо індивідуальну пропозицію з розрахунком' },
      { key: 'next_step_phrase', label: 'Якою фразою ваш найкращий менеджер це закриває',
        type: 'textarea', rows: 3,
        placeholder: 'Давайте я підготую розрахунок під ваш обсяг. Вам зручніше, щоб я передзвонив у вівторок об 11 чи в четвер о 15?' },
    ],
  },
];

function load(tenantId) {
  const row = db.prepare('SELECT data FROM company_profile WHERE tenant_id = ?').get(tenantId);
  if (!row) return {};
  try {
    return JSON.parse(row.data) || {};
  } catch {
    return {};
  }
}

function save(tenantId, data) {
  db.prepare(
    `INSERT INTO company_profile (tenant_id, data, updated_at)
     VALUES (?, ?, datetime('now'))
     ON CONFLICT (tenant_id) DO UPDATE SET data = excluded.data, updated_at = datetime('now')`
  ).run(tenantId, JSON.stringify(data));
}

// Нормалізує дані одного екрана: списки перетворює на масив непорожніх рядків.
function normalizeScreen(screen, body) {
  const out = {};
  for (const f of screen.fields) {
    const raw = body[f.key];
    if (f.type === 'lines') {
      out[f.key] = String(raw || '')
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);
    } else {
      out[f.key] = String(raw || '').trim();
    }
  }
  return out;
}

function validateScreen(screen, values) {
  const errors = [];
  for (const f of screen.fields) {
    if (!f.required) continue;
    const v = values[f.key];
    if (f.type === 'lines') {
      const min = f.min || 1;
      if (!Array.isArray(v) || v.length < min) {
        errors.push(`«${f.label}»: потрібно щонайменше ${min} ${min === 1 ? 'рядок' : 'рядки'}.`);
      }
    } else if (!v) {
      errors.push(`«${f.label}»: поле обов’язкове.`);
    }
  }
  return errors;
}

function screenStatus(data) {
  return SCREENS.map((s) => ({
    id: s.id,
    title: s.title,
    done: validateScreen(s, data).length === 0,
  }));
}

function completeness(data) {
  const st = screenStatus(data);
  const done = st.filter((s) => s.done).length;
  return { done, total: st.length, percent: Math.round((done / st.length) * 100), screens: st };
}

const FALLBACK = {
  company: 'ваша компанія',
  product1: 'ваш продукт',
  products: 'ваші позиції',
  portrait1: 'ваш типовий клієнт',
  decider: 'той, хто ухвалює рішення',
  gatekeeper: 'той, хто бере трубку',
  gatekeeperPhrase: 'надішліть на пошту',
  adv1: 'ваша перша перевага',
  adv2: 'ваша друга перевага',
  competitor: 'ваш конкурент',
  priceAnchor: 'ваш ціновий орієнтир',
  obj1: 'у нас уже є постачальник',
  obj2: 'дорого',
  success: 'домовленість про наступний крок',
  nextStepPhrase: 'коли вам зручніше — у вівторок чи в четвер?',
};

// Контекст для підстановки в лекції. Порожні поля замінюються нейтральними
// формулюваннями, тож курс читабельний ще до заповнення анкети.
function buildContext(data, tenant) {
  const products = data.products || [];
  const portraits = data.portraits || [];
  const advantages = data.advantages || [];
  const objections = data.objections || [];

  const ctx = {
    company: data.company_name || (tenant && tenant.name) || FALLBACK.company,
    product1: products[0] || FALLBACK.product1,
    product2: products[1] || products[0] || FALLBACK.product1,
    products: products.length ? products.join(', ') : FALLBACK.products,
    portrait1: portraits[0] || FALLBACK.portrait1,
    portrait2: portraits[1] || portraits[0] || FALLBACK.portrait1,
    decider: data.decider || FALLBACK.decider,
    gatekeeper: data.gatekeeper || FALLBACK.gatekeeper,
    gatekeeperPhrase: data.gatekeeper_phrase || FALLBACK.gatekeeperPhrase,
    adv1: advantages[0] || FALLBACK.adv1,
    adv2: advantages[1] || FALLBACK.adv2,
    competitor: data.competitor || FALLBACK.competitor,
    priceAnchor: data.price_anchor || FALLBACK.priceAnchor,
    obj1: objections[0] || FALLBACK.obj1,
    obj2: objections[1] || FALLBACK.obj2,
    success: data.success || FALLBACK.success,
    nextStepPhrase: data.next_step_phrase || FALLBACK.nextStepPhrase,
  };
  ctx.__complete = completeness(data).percent === 100;
  return ctx;
}

// Підстановка {{token}}. Невідомий токен лишається як є — так помилку видно
// одразу під час рев'ю тексту лекції, а не тихо зникає.
function fill(text, ctx) {
  if (typeof text !== 'string') return text;
  return text.replace(/\{\{(\w+)\}\}/g, (m, key) =>
    Object.prototype.hasOwnProperty.call(ctx, key) ? String(ctx[key]) : m
  );
}

module.exports = {
  SCREENS, load, save, normalizeScreen, validateScreen,
  screenStatus, completeness, buildContext, fill,
};
