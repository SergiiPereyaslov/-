'use strict';

const { db } = require('./db');

function round2(n) {
  return Math.round((Number(n) || 0) * 100) / 100;
}

function toNumber(v) {
  // Прибираємо пробіли (в т.ч. нерозривні — роздільники тисяч) і приймаємо кому.
  return Number(String(v == null ? '' : v).replace(/\s/g, '').replace(',', '.')) || 0;
}

// Наступний порядковий номер для року в межах компанії (кожна компанія має свою нумерацію).
function nextSeqForYear(companyId, year) {
  const row = db.prepare('SELECT MAX(seq) AS m FROM invoices WHERE company_id = ? AND year = ?').get(companyId, year);
  return (row && row.m ? row.m : 0) + 1;
}

// Формує відображуваний номер рахунку.
function formatInvoiceNumber(prefix, seq) {
  return `${prefix || ''}${seq}`;
}

// Розбирає позиції рахунку з тіла форми у масив рядків.
function parseItems(body) {
  const names = [].concat(body.item_name || []);
  const units = [].concat(body.item_unit || []);
  const qtys = [].concat(body.item_qty || []);
  const prices = [].concat(body.item_price || []);
  const items = [];
  for (let i = 0; i < names.length; i++) {
    const name = String(names[i] || '').trim();
    if (!name) continue;
    const quantity = toNumber(qtys[i]);
    const price = round2(toNumber(prices[i]));
    items.push({
      position: items.length + 1,
      name,
      unit: String(units[i] || 'шт').trim() || 'шт',
      quantity,
      price,
      amount: round2(quantity * price),
    });
  }
  return items;
}

function itemsTotal(items) {
  return round2(items.reduce((sum, it) => sum + it.amount, 0));
}

module.exports = {
  round2,
  toNumber,
  nextSeqForYear,
  formatInvoiceNumber,
  parseItems,
  itemsTotal,
};
