import { expect, test } from '@playwright/test';

test('наскрізне оформлення заявки', async ({ page }) => {
  await page.goto('/catalog/stakany-paperovi/');
  await page.getByRole('button', { name: 'У кошик' }).first().click();

  await page.goto('/koshyk/');
  await expect(page.locator('main ul > li')).toHaveCount(1);

  await page.getByRole('link', { name: 'Оформити заявку' }).click();
  await expect(page).toHaveURL(/\/oformlennya\/$/);

  // Некоректний телефон не пропускається
  await page.locator('#co-name').fill('Тест Тестович');
  await page.locator('#co-phone').fill('123');
  await page.getByRole('button', { name: 'Надіслати заявку' }).click();
  await expect(page.getByText(/Вкажіть телефон/)).toBeVisible();

  await page.locator('#co-phone').fill('+380501112233');
  await page.getByRole('button', { name: 'Надіслати заявку' }).click();

  await expect(page).toHaveURL(/\/dyakuyemo\//);
  await expect(page.getByText(/SEP-/)).toBeVisible();

  // Кошик очищається після успішної заявки
  await page.goto('/koshyk/');
  await expect(page.getByText('Кошик порожній')).toBeVisible();
});

test('кошик переживає перезавантаження сторінки', async ({ page }) => {
  await page.goto('/catalog/lanch-boksy/');
  await page.getByRole('button', { name: 'У кошик' }).first().click();
  await page.goto('/koshyk/');
  const before = await page.locator('main ul > li').count();
  await page.reload();
  await expect(page.locator('main ul > li')).toHaveCount(before);
});

test('калькулятор брендування реагує на тираж і кольори', async ({ page }) => {
  await page.goto('/brenduvannya/');
  const perUnit = page.locator('dl dd').first();
  const small = Number((await perUnit.textContent())!.replace(/[^\d.]/g, ''));

  await page.locator('#branding-run').fill('5');
  const large = Number((await perUnit.textContent())!.replace(/[^\d.]/g, ''));
  expect(large).toBeLessThan(small);

  await page.getByRole('button', { name: 'Повнокольоровий' }).click();
  const color = Number((await perUnit.textContent())!.replace(/[^\d.]/g, ''));
  expect(color).toBeGreaterThan(large);
});
