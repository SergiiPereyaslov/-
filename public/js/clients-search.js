'use strict';

// Пошук замовників «наживо»: список фільтрується одразу під час набору,
// без потреби тиснути «Показати». Форма лишається серверною (перезавантажує
// сторінку), просто робить це сама через невелику паузу після останньої
// натиснутої клавіші.
(function () {
  const input = document.getElementById('clientsSearch');
  const sortSelect = document.getElementById('clientsSort');
  const form = input ? input.closest('form') : null;
  if (!input || !form) return;

  let timer = null;
  input.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(() => form.submit(), 350);
  });

  // Зміна сортування застосовується одразу, без очікування.
  if (sortSelect) {
    sortSelect.addEventListener('change', () => form.submit());
  }

  // Курсор — у кінець уже введеного тексту, щоб після перезавантаження
  // сторінки (через живий пошук) можна було одразу продовжити набирати.
  if (input.value) {
    input.focus();
    const end = input.value.length;
    input.setSelectionRange(end, end);
  }
})();
