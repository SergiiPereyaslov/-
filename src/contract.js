'use strict';

const fmt = require('./format');

// Плейсхолдери, які менеджер може вживати у шаблоні договору.
// Ключ — те, що пишеться у шаблоні як {{КЛЮЧ}}; значення — опис для довідки в інтерфейсі.
const PLACEHOLDERS = [
  ['НОМЕР', 'Номер договору (порожньо, якщо не вказано)'],
  ['ДАТА', 'Дата договору (порожньо, якщо не вказано)'],
  ['МІСТО', 'Місце складання компанії (напр. м. Дніпро)'],

  ['ВИКОНАВЕЦЬ', 'Повна назва вашої компанії'],
  ['ВИКОНАВЕЦЬ_ЄДРПОУ', 'ЄДРПОУ вашої компанії'],
  ['ВИКОНАВЕЦЬ_АДРЕСА', 'Адреса вашої компанії'],
  ['ВИКОНАВЕЦЬ_ТЕЛЕФОН', 'Телефон вашої компанії'],
  ['ВИКОНАВЕЦЬ_EMAIL', 'Email вашої компанії'],
  ['ВИКОНАВЕЦЬ_IBAN', 'IBAN рахунку для оплати'],
  ['ВИКОНАВЕЦЬ_БАНК', 'Назва банку'],
  ['ВИКОНАВЕЦЬ_КЕРІВНИК', 'ПІБ керівника вашої компанії'],

  ['ЗАМОВНИК', 'Повна назва навчального закладу'],
  ['ЗАМОВНИК_КОРОТКО', 'Коротка назва закладу'],
  ['ЗАМОВНИК_КОД', 'Код закладу'],
  ['ЗАМОВНИК_ЄДРПОУ', 'ЄДРПОУ закладу (якщо заповнено)'],
  ['ЗАМОВНИК_АДРЕСА', 'Адреса закладу (якщо заповнено)'],

  ['СУМА', 'Сума рахунку цифрами (напр. 9 075,00)'],
  ['СУМА_ПРОПИСОМ', 'Сума прописом українською'],
  ['ПОЗИЦІЇ', 'Перелік позицій рахунку списком'],
];

// Значення для підстановки. Порожні поля дають порожній рядок —
// щоб у надрукованому договорі лишалося місце для заповнення від руки.
function buildValues({ company, client, pay, invoice, items }) {
  const c = company || {};
  const cl = client || {};
  const p = pay || {};
  const inv = invoice || {};
  const list = items || [];

  const positions = list
    .map((it, i) => `${i + 1}. ${it.name} — ${fmt.formatQty(it.quantity)} ${it.unit} × ${fmt.formatMoney(it.price)} грн = ${fmt.formatMoney(it.amount)} грн`)
    .join('\n');

  return {
    'НОМЕР': cl.contract_number || '',
    'ДАТА': cl.contract_date ? fmt.formatDateUk(cl.contract_date) : '',
    'МІСТО': c.place_of_compilation || c.place || '',

    'ВИКОНАВЕЦЬ': c.name || '',
    'ВИКОНАВЕЦЬ_ЄДРПОУ': c.edrpou || '',
    'ВИКОНАВЕЦЬ_АДРЕСА': c.address || '',
    'ВИКОНАВЕЦЬ_ТЕЛЕФОН': c.phone || '',
    'ВИКОНАВЕЦЬ_EMAIL': c.email || '',
    'ВИКОНАВЕЦЬ_IBAN': p.iban || '',
    'ВИКОНАВЕЦЬ_БАНК': p.bank_name || '',
    'ВИКОНАВЕЦЬ_КЕРІВНИК': c.director_name || '',

    'ЗАМОВНИК': cl.name || inv.client_name || '',
    'ЗАМОВНИК_КОРОТКО': cl.short_name || '',
    'ЗАМОВНИК_КОД': cl.code || '',
    'ЗАМОВНИК_ЄДРПОУ': cl.edrpou || '',
    'ЗАМОВНИК_АДРЕСА': cl.address || '',

    'СУМА': inv.total != null ? fmt.formatMoney(inv.total) : '',
    'СУМА_ПРОПИСОМ': inv.total != null ? fmt.amountToWords(inv.total) : '',
    'ПОЗИЦІЇ': positions,
  };
}

// Підставляє значення у шаблон. Невідомі плейсхолдери лишає як є,
// щоб менеджер одразу побачив помилку в написанні.
function renderTemplate(template, values) {
  if (!template) return '';
  return String(template).replace(/\{\{\s*([A-Za-zА-Яа-яІЇЄҐіїєґ_]+)\s*\}\}/g, (whole, key) => {
    const k = key.trim();
    return Object.prototype.hasOwnProperty.call(values, k) ? values[k] : whole;
  });
}

// Готовий текст договору для друку.
function renderContract(ctx) {
  return renderTemplate(ctx.template, buildValues(ctx));
}

module.exports = { PLACEHOLDERS, buildValues, renderTemplate, renderContract };
