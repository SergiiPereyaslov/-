import { expect, test } from '@playwright/test';

const SECTORS = ['kavyarni', 'dostavky', 'pekarni', 'fastfudu'];

test('секторні посадкові ведуть у каталог, а не дублюють його', async ({ page }) => {
  for (const slug of SECTORS) {
    const res = await page.goto(`/dlya/${slug}/`);
    expect(res?.status(), `/dlya/${slug}/`).toBe(200);

    // Рівно один h1 і написаний текст, а не заглушка
    await expect(page.locator('h1')).toHaveCount(1);
    const text = await page.locator('main').innerText();
    expect(text.length, `текст /dlya/${slug}/`).toBeGreaterThan(1500);

    // Стартовий комплект веде в категорії каталогу — товар живе там
    const kit = page.locator('ol li a[href*="/catalog/"]');
    expect(await kit.count()).toBeGreaterThanOrEqual(5);

    // canonical на саму секторну, а не на каталог
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      new RegExp(`/dlya/${slug}/$`),
    );
  }
});

test('блок «Для кого» на головній веде на всі чотири сектори', async ({ page }) => {
  await page.goto('/');
  for (const slug of SECTORS) {
    await expect(page.locator(`a[href="/dlya/${slug}/"]`).first()).toBeVisible();
  }
});

test('шапка лишається на одному пункті «Каталог» із шістьма групами', async ({ page }) => {
  await page.goto('/');
  // Секторні сторінки свідомо не в меню: інакше шапка перевантажується
  const headerSectorLinks = page.locator('header a[href*="/dlya/"]');
  expect(await headerSectorLinks.count()).toBe(0);

  const groups = ['stakany', 'konteynery', 'fastfud', 'pakety', 'suputni-tovary', 'pet-posud'];
  for (const g of groups) {
    expect(await page.locator(`a[href="/catalog/${g}/"]`).count()).toBeGreaterThan(0);
  }
});

test('варіант A ховає секторний блок, варіант B показує', async ({ page }) => {
  await page.goto('/');
  const block = page.locator('section.ab-b').first();

  // Тест вимкнений або варіант B — блок видно
  await expect(block).toBeVisible();

  await page.evaluate(() => document.documentElement.setAttribute('data-nav', 'a'));
  await expect(block).toBeHidden();

  await page.evaluate(() => document.documentElement.setAttribute('data-nav', 'b'));
  await expect(block).toBeVisible();
});
