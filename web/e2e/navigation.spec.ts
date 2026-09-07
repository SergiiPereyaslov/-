import { expect, test } from '@playwright/test';

/**
 * Клієнтська навігація — найдорожчий дефект цього проєкту: rewrite у
 * middleware мовчки ламав переходи, а curl показував 200. Тому вона
 * перевіряється браузером на кожній збірці.
 */
test('перехід головна → каталог → категорія → товар без перезавантаження', async ({ page }) => {
  const reloads: string[] = [];
  page.on('load', () => reloads.push(page.url()));

  await page.goto('/');
  await page.getByRole('link', { name: 'Перейти в каталог' }).click();
  await expect(page).toHaveURL(/\/catalog\/$/);

  await page.locator('a[href="/catalog/stakany-paperovi/"]').first().click();
  await expect(page).toHaveURL(/\/catalog\/stakany-paperovi\/$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Паперові стакани для кави');

  await page.locator('main a[href^="/product/"]').first().click();
  await expect(page).toHaveURL(/\/product\/.+\/$/);

  // Один load — початковий; решта переходів клієнтські
  expect(reloads).toHaveLength(1);
});

test('рівно один h1 і немає горизонтального скролу', async ({ page }) => {
  for (const path of ['/', '/catalog/', '/catalog/stakany-paperovi/', '/brenduvannya/', '/kontakty/']) {
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow, `горизонтальний скрол на ${path}`).toBeLessThanOrEqual(1);
  }
});

test('перемикач мови зберігає поточну сторінку', async ({ page, isMobile }) => {
  await page.goto('/catalog/stakany-paperovi/');
  if (isMobile) await page.getByRole('button', { name: 'Меню' }).click();
  await page.locator('a[hreflang="ru"]:visible').first().click();
  await expect(page).toHaveURL(/\/ru\/catalog\/stakany-paperovi\/$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Бумажные стаканы для кофе');
});
