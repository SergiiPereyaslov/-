import { expect, test } from '@playwright/test';
import { E2E_ADMIN } from './global-setup';

/**
 * Адмінка перевіряється тільки на десктопі: вона не розрахована на телефон,
 * і дублювати сценарій на мобільному проєкті сенсу немає.
 */
test.describe('адмінка', () => {
  test.skip(({ isMobile }) => Boolean(isMobile), 'адмінка — десктопний інструмент');

  const login = async (page: import('@playwright/test').Page) => {
    await page.goto('/admin/');
    await page.locator('#email').fill(E2E_ADMIN.email);
    await page.locator('#password').fill(E2E_ADMIN.password);
    await page.getByRole('button', { name: 'Увійти' }).click();
    await page.waitForURL('**/admin/dashboard/');
  };

  test('закрита від сторонніх і не індексується', async ({ page, request }) => {
    for (const path of ['/admin/dashboard/', '/admin/leads/', '/admin/products/']) {
      const res = await request.get(path, { maxRedirects: 0 });
      expect(res.status(), `${path} має вести на форму входу`).toBe(307);
      expect(res.headers().location).toContain('/admin/');
    }

    await page.goto('/admin/');
    await expect(page.locator('meta[name=robots]')).toHaveAttribute('content', /noindex/);

    const robots = await (await request.get('/robots.txt')).text();
    expect(robots).toContain('Disallow: /admin/');
  });

  test('невірний пароль відхиляється, e-mail зберігається', async ({ page }) => {
    await page.goto('/admin/');
    await page.locator('#email').fill(E2E_ADMIN.email);
    await page.locator('#password').fill('невірний-пароль');
    await page.getByRole('button', { name: 'Увійти' }).click();

    await expect(page.getByText('Невірний e-mail або пароль')).toBeVisible();
    await expect(page.locator('#email')).toHaveValue(E2E_ADMIN.email);
  });

  test('зміна ціни в адмінці одразу видно на сайті', async ({ page }) => {
    const url = '/product/stakan-paperovyi-340-ml-kraft/';
    await page.goto(url);
    const panel = page.locator('div.card', { hasText: 'Кількість, пачок' }).first();
    const before = (await panel.getByText('Роздріб').locator('..').innerText()).match(/[\d.]+/)?.[0];
    expect(before).toBeTruthy();

    await login(page);
    await page.goto('/admin/products/?q=340');
    const row = page.locator('tr', { hasText: 'Стакан паперовий 340 мл, крафт' }).first();
    const input = row.locator('input[name=priceRetail]');
    const original = await input.inputValue();
    const changed = (Number(original) + 0.41).toFixed(2);

    await input.fill(changed);
    await row.getByRole('button', { name: 'Зберегти' }).click();
    await page.waitForTimeout(1500);

    // Статична сторінка має перебудуватись через revalidatePath
    await page.goto(url);
    await expect(panel.getByText('Роздріб').locator('..')).toContainText(changed);

    // Повертаємо як було, щоб тест не залишав слідів
    await page.goto('/admin/products/?q=340');
    const row2 = page.locator('tr', { hasText: 'Стакан паперовий 340 мл, крафт' }).first();
    await row2.locator('input[name=priceRetail]').fill(original);
    await row2.getByRole('button', { name: 'Зберегти' }).click();
    await page.waitForTimeout(1500);
  });

  test('розділи адмінки відкриваються, вихід закриває доступ', async ({ page }) => {
    await login(page);

    for (const [path, heading] of [
      ['/admin/leads/', 'Заявки'],
      ['/admin/products/', 'Товари'],
      ['/admin/categories/', 'Категорії'],
      ['/admin/posts/', 'Блог'],
      ['/admin/import/', 'Імпорт каталогу'],
    ] as const) {
      await page.goto(path);
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(heading);
    }

    await page.locator('header').getByRole('button', { name: 'Вийти' }).click();
    await page.waitForURL('**/admin/');

    await page.goto('/admin/dashboard/');
    expect(new URL(page.url()).pathname).toBe('/admin/');
  });
});
