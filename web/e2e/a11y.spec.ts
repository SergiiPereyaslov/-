import { expect, test } from '@playwright/test';

test('усі поля форм мають підпис', async ({ page }) => {
  for (const path of ['/kontakty/', '/oformlennya/', '/brenduvannya/']) {
    await page.goto(path);
    const unlabeled = await page.evaluate(() => {
      const fields = [
        ...document.querySelectorAll<HTMLInputElement>(
          'input:not([type=hidden]):not([type=radio]):not([type=checkbox]), select, textarea',
        ),
      ];
      return fields.filter((f) => !f.labels?.length && !f.getAttribute('aria-label')).map((f) => f.id || f.name);
    });
    expect(unlabeled, `поля без підпису на ${path}`).toEqual([]);
  }
});

test('мобільна шторка фільтрів доступна з клавіатури', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'шторка існує тільки на мобільній ширині');

  await page.goto('/catalog/stakany-paperovi/');
  const openButton = page.getByRole('button', { name: /Фільтри/ });
  await openButton.click();

  const sheet = page.getByRole('dialog');
  await expect(sheet).toBeVisible();
  expect(await page.evaluate(() => document.body.style.overflow)).toBe('hidden');

  // Фокус не виходить за межі шторки
  for (let i = 0; i < 30; i += 1) {
    await page.keyboard.press('Tab');
    const inside = await page.evaluate(() => !!document.activeElement?.closest('[role=dialog]'));
    expect(inside, 'фокус вийшов за межі шторки').toBe(true);
  }

  await page.keyboard.press('Escape');
  await expect(sheet).toBeHidden();
  expect(await page.evaluate(() => document.body.style.overflow)).not.toBe('hidden');
});

test('skip-link іде першим і мега-меню закривається по Esc', async ({ page, isMobile }) => {
  test.skip(isMobile, 'мега-меню лише на десктопі');

  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.locator(':focus')).toHaveText('Перейти до вмісту');

  const catalogButton = page.locator('header button', { hasText: 'Каталог' }).first();
  await catalogButton.focus();
  await page.keyboard.press('Enter');
  await expect(catalogButton).toHaveAttribute('aria-expanded', 'true');

  await page.keyboard.press('Escape');
  await expect(catalogButton).toHaveAttribute('aria-expanded', 'false');
});
