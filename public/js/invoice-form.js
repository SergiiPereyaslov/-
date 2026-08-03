'use strict';

// ── Позиції рахунку ─────────────────────────────────────────────────────────
(function () {
  const body = document.getElementById('itemsBody');
  const template = document.getElementById('rowTemplate');
  const addRowBtn = document.getElementById('addRow');
  const catalogSelect = document.getElementById('catalogSelect');
  const grandTotalEl = document.getElementById('grandTotal');
  const form = document.getElementById('invoiceForm');

  function parseNum(str) {
    if (str == null) return 0;
    const cleaned = String(str).replace(/\s/g, '').replace(',', '.').replace(/[^\d.\-]/g, '');
    const n = parseFloat(cleaned);
    return Number.isFinite(n) ? n : 0;
  }
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
    row.querySelectorAll('.num').forEach((inp) => {
      inp.addEventListener('input', recalcAll);
      inp.addEventListener('blur', () => {
        // Порожнє поле лишаємо порожнім — форматуємо лише те, що менеджер
        // справді ввів, щоб «0,00» не з'являлося саме собою.
        if (inp.name === 'item_price[]' && inp.value.trim() !== '') {
          inp.value = formatMoney(parseNum(inp.value));
        }
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
      // Ціну з каталогу навмисно не підставляємо: вона орієнтовна і
      // відрізняється за регіонами, менеджер щоразу вводить свою.
    }
    body.appendChild(row);
    const appended = body.lastElementChild;
    wireRow(appended);
    recalcAll();
    return appended;
  }

  body.querySelectorAll('.item-row').forEach(wireRow);
  if (body.querySelectorAll('.item-row').length === 0) addRow();
  recalcAll();

  addRowBtn.addEventListener('click', () => {
    const row = addRow();
    row.querySelector('[name="item_name[]"]').focus();
  });

  // Каталог: значення option — id, текст містить назву та (за наявності) ціну «— 45,50 ₴/шт».
  catalogSelect.addEventListener('change', () => {
    const opt = catalogSelect.selectedOptions[0];
    if (!catalogSelect.value || !opt) return;
    let text = opt.textContent.trim();
    let name = text, unit = 'шт';
    const m = text.match(/^(.*?)\s+—\s+([\d\s]+,[\d]+)\s*₴\/(.+)$/);
    if (m) { name = m[1].trim(); unit = m[3].trim(); }
    const row = addRow({ name, unit });
    row.querySelector('[name="item_qty[]"]').focus();
    row.querySelector('[name="item_qty[]"]').select();
    catalogSelect.value = '';
  });

  form.addEventListener('submit', () => {
    body.querySelectorAll('.num').forEach((inp) => {
      inp.value = String(inp.value).replace(/\s/g, '');
    });
  });
})();

// ── Перемикач «Без дати» ────────────────────────────────────────────────────
(function () {
  const dateInput = document.getElementById('invoiceDate');
  const noDate = document.getElementById('noDate');
  if (!dateInput || !noDate) return;
  function sync() {
    if (noDate.checked) { dateInput.value = ''; dateInput.disabled = true; }
    else { dateInput.disabled = false; }
  }
  noDate.addEventListener('change', sync);
  sync();
})();

// ── Автодоповнення замовника ────────────────────────────────────────
(function () {
  const search = document.getElementById('clientSearch');
  const hidden = document.getElementById('clientId');
  const results = document.getElementById('clientResults');
  const form = document.getElementById('invoiceForm');
  if (!search || !hidden || !results) return;

  let timer = null;
  let items = [];
  let active = -1;

  function esc(s) {
    return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  }
  function hide() { results.hidden = true; results.innerHTML = ''; active = -1; }
  function pick(it) { hidden.value = it.id; search.value = it.name; search.classList.remove('invalid'); hide(); }
  function render() {
    if (items.length === 0) {
      results.innerHTML = '<div class="cr-empty">Нічого не знайдено</div>';
      results.hidden = false; return;
    }
    results.innerHTML = items.map((it, i) => {
      const meta = [];
      if (it.short_name) meta.push(esc(it.short_name));
      if (it.code) meta.push('код ' + esc(it.code));
      return `<div class="cr-item${i === active ? ' active' : ''}" data-i="${i}">`
        + `<div class="cr-name">${esc(it.name)}</div>`
        + (meta.length ? `<div class="cr-meta">${meta.join(' · ')}</div>` : '')
        + `</div>`;
    }).join('');
    results.hidden = false;
  }
  async function query(q) {
    try {
      const resp = await fetch('/clients/search?q=' + encodeURIComponent(q), { headers: { Accept: 'application/json' } });
      items = resp.ok ? await resp.json() : [];
      active = -1; render();
    } catch { items = []; hide(); }
  }
  search.addEventListener('input', () => {
    hidden.value = '';
    const q = search.value.trim();
    clearTimeout(timer);
    if (q.length < 1) { hide(); return; }
    timer = setTimeout(() => query(q), 200);
  });
  search.addEventListener('keydown', (e) => {
    if (results.hidden) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); active = Math.min(active + 1, items.length - 1); render(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); active = Math.max(active - 1, 0); render(); }
    else if (e.key === 'Enter') { if (active >= 0 && items[active]) { e.preventDefault(); pick(items[active]); } }
    else if (e.key === 'Escape') { hide(); }
  });
  results.addEventListener('mousedown', (e) => {
    const el = e.target.closest('.cr-item');
    if (el) { e.preventDefault(); pick(items[Number(el.dataset.i)]); }
  });
  document.addEventListener('click', (e) => {
    if (!results.contains(e.target) && e.target !== search) hide();
  });
  if (form) {
    form.addEventListener('submit', (e) => {
      if (!hidden.value) {
        e.preventDefault();
        search.classList.add('invalid');
        search.focus();
        alert('Оберіть замовника зі списку пошуку.');
      }
    });
  }
})();
