'use strict';

(function () {
  const services = window.__SERVICES__ || [];
  const servicesByName = new Map(services.map((s) => [s.name.toLowerCase(), s]));

  const body = document.getElementById('itemsBody');
  const template = document.getElementById('rowTemplate');
  const addRowBtn = document.getElementById('addRow');
  const catalogSelect = document.getElementById('catalogSelect');
  const grandTotalEl = document.getElementById('grandTotal');
  const form = document.getElementById('invoiceForm');

  // Число з рядка: "1 234,56" -> 1234.56
  function parseNum(str) {
    if (str == null) return 0;
    const cleaned = String(str).replace(/\s/g, '').replace(',', '.').replace(/[^\d.\-]/g, '');
    const n = parseFloat(cleaned);
    return Number.isFinite(n) ? n : 0;
  }

  // 1234.5 -> "1 234,50"
  function formatMoney(n) {
    const v = Math.round((Number(n) || 0) * 100) / 100;
    const parts = v.toFixed(2).split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return parts[0] + ',' + parts[1];
  }

  function recalcRow(row) {
    const qty = parseNum(row.querySelector('[name="item_qty[]"]').value);
    const price = parseNum(row.querySelector('[name="item_price[]"]').value);
    const sum = Math.round(qty * price * 100) / 100;
    row.querySelector('.row-sum').textContent = formatMoney(sum);
    return sum;
  }

  function recalcAll() {
    let total = 0;
    body.querySelectorAll('.item-row').forEach((row, i) => {
      row.querySelector('.row-num').textContent = i + 1;
      total += recalcRow(row);
    });
    grandTotalEl.textContent = formatMoney(total) + ' ₴';
  }

  function wireRow(row) {
    row.querySelector('.row-del').addEventListener('click', () => {
      row.remove();
      if (body.querySelectorAll('.item-row').length === 0) addRow();
      recalcAll();
    });
    const nameInput = row.querySelector('[name="item_name[]"]');
    nameInput.addEventListener('change', () => {
      const match = servicesByName.get(nameInput.value.trim().toLowerCase());
      if (match) {
        const unit = row.querySelector('[name="item_unit[]"]');
        const price = row.querySelector('[name="item_price[]"]');
        if (unit) unit.value = match.unit;
        // Заповнюємо ціну лише якщо вона ще не змінена вручну (0 або порожньо).
        if (price && parseNum(price.value) === 0) price.value = formatMoney(match.price);
        recalcAll();
      }
    });
    row.querySelectorAll('.num').forEach((inp) => {
      inp.addEventListener('input', recalcAll);
      inp.addEventListener('blur', () => {
        if (inp.name === 'item_price[]') inp.value = formatMoney(parseNum(inp.value));
        recalcAll();
      });
    });
  }

  function addRow(prefill) {
    const frag = template.content.cloneNode(true);
    const row = frag.querySelector('.item-row');
    if (prefill) {
      row.querySelector('[name="item_name[]"]').value = prefill.name || '';
      row.querySelector('[name="item_unit[]"]').value = prefill.unit || 'шт';
      row.querySelector('[name="item_price[]"]').value = formatMoney(prefill.price || 0);
    }
    body.appendChild(row);
    const appended = body.lastElementChild;
    wireRow(appended);
    recalcAll();
    return appended;
  }

  // Підключаємо наявні рядки (з сервера).
  body.querySelectorAll('.item-row').forEach(wireRow);

  // Якщо рядків немає — додаємо один порожній.
  if (body.querySelectorAll('.item-row').length === 0) addRow();
  recalcAll();

  addRowBtn.addEventListener('click', () => {
    const row = addRow();
    row.querySelector('[name="item_name[]"]').focus();
  });

  catalogSelect.addEventListener('change', () => {
    const id = catalogSelect.value;
    if (!id) return;
    const svc = services.find((s) => String(s.id) === String(id));
    if (svc) {
      const row = addRow({ name: svc.name, unit: svc.unit, price: svc.price });
      row.querySelector('[name="item_qty[]"]').focus();
      row.querySelector('[name="item_qty[]"]').select();
    }
    catalogSelect.value = '';
  });

  // Нормалізуємо числа перед відправкою (кома -> крапка приймається сервером).
  form.addEventListener('submit', () => {
    body.querySelectorAll('.num').forEach((inp) => {
      inp.value = String(inp.value).replace(/\s/g, '');
    });
  });
})();
