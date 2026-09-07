import { expect, test } from '@playwright/test';

test('фільтр за об’ємом звужує вибірку', async ({ page, isMobile }) => {
  await page.goto('/catalog/stakany-paperovi/');
  const before = await page.locator('article').count();
  expect(before).toBeGreaterThan(0);

  if (isMobile) {
    await page.getByRole('button', { name: /Фільтри/ }).click();
    const sheet = page.getByRole('dialog');
    await sheet.locator('input[type=checkbox]').first().check();
    await sheet.getByRole('button', { name: /Застосувати/ }).click();
  } else {
    await page.locator('aside input[type=checkbox]').first().check();
  }

  await expect.poll(() => page.locator('article').count()).toBeLessThan(before);
  await expect(page.locator('article').first()).toBeVisible();
});

test('пошук знаходить товар за розміром і за артикулом', async ({ page }) => {
  await page.goto('/');
  // Шапка тримає два екземпляри пошуку (десктопний і мобільний); один із них
  // прихований медіазапитом — беремо видимий.
  const search = page.locator('input[type=search]:visible').first();

  await search.fill('340');
  await expect(page.locator('ul li a[href^="/product/"]').first()).toBeVisible();

  await search.fill('SEP-ST-340-KR');
  await expect(page.locator('ul li a[href^="/product/"]').first()).toBeVisible();
});

test('картка товару показує оптові щаблі без реєстрації', async ({ page }) => {
  await page.goto('/product/stakan-paperovyi-340-ml-kraft/');
  // Ті самі рядки є в супутніх картках, тому дивимось саме панель замовлення
  const panel = page.locator('div.card', { hasText: 'Кількість, пачок' }).first();
  await expect(panel.getByText('Роздріб')).toBeVisible();
  await expect(panel.getByText(/Опт від 10 пачок/)).toBeVisible();
  await expect(panel.getByText(/Опт від 100 пачок/)).toBeVisible();
});

test('стакан пропонує сумісні кришки потрібного діаметра', async ({ page }) => {
  await page.goto('/product/stakan-paperovyi-340-ml-kraft/');
  const block = page.locator('section', { has: page.getByRole('heading', { name: 'Пасують кришки' }) });
  await expect(block.locator('article')).not.toHaveCount(0);
  await expect(block.getByText(/80 мм/).first()).toBeVisible();
});
