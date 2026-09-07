import { expect, test } from '@playwright/test';

const PAGES = [
  '/',
  '/catalog/',
  '/catalog/dlya-napoyiv/',
  '/catalog/stakany-paperovi/',
  '/catalog/stakany-paperovi/340-ml/',
  '/product/stakan-paperovyi-340-ml-kraft/',
  '/brenduvannya/',
  '/blog/yak-vybraty-paperovi-stakany/',
];

test('title вкладається в 60 символів, є description, canonical і hreflang', async ({ page }) => {
  for (const path of PAGES) {
    await page.goto(path);

    const title = await page.title();
    expect(title.length, `задовгий title на ${path}: ${title}`).toBeLessThanOrEqual(60);

    const description = await page.locator('meta[name=description]').getAttribute('content');
    expect(description, `немає description на ${path}`).toBeTruthy();
    expect(description!.length).toBeLessThanOrEqual(170);

    await expect(page.locator('link[rel=canonical]'), `немає canonical на ${path}`).toHaveCount(1);
    await expect(page.locator('link[rel=alternate][hreflang]')).toHaveCount(3);
  }
});

test('службові сторінки закриті від індексації', async ({ page }) => {
  for (const path of ['/koshyk/', '/oformlennya/', '/polityka-konfidentsiynosti/']) {
    await page.goto(path);
    const robots = await page.locator('meta[name=robots]').getAttribute('content');
    expect(robots, `сторінка ${path} відкрита для індексації`).toContain('noindex');
  }
});

test('301 зі старих URL ведуть на нові за один хоп', async ({ request }) => {
  const map: [string, string][] = [
    ['/catalog/Lanch-box', '/catalog/lanch-boksy/'],
    ['/catalog/stakani-paperovi', '/catalog/stakany-paperovi/'],
    ['/catalog/tarilka-pryamokutna', '/catalog/tarilky-ta-sousnyky/'],
    ['/all-products', '/catalog/'],
    ['/branding', '/brenduvannya/'],
    ['/news', '/blog/'],
    ['/contact', '/kontakty/'],
    ['/catalog/upakovka-dlya-fast-fudu/page-all', '/catalog/fastfud/'],
    ['/products/stakan-paperovyi-340-ml-kraft', '/product/stakan-paperovyi-340-ml-kraft/'],
    ['/uk/catalog/', '/catalog/'],
    ['/ru/branding', '/ru/brenduvannya/'],
  ];

  for (const [from, to] of map) {
    const res = await request.get(from, { maxRedirects: 0 });
    expect(res.status(), `${from} має віддавати 301`).toBe(301);
    expect(new URL(res.headers().location, 'http://x').pathname, `${from} → ?`).toBe(to);
  }
});

test('sitemap містить лише індексовані сторінки', async ({ request }) => {
  const xml = await (await request.get('/sitemap.xml')).text();
  const urls = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]);
  expect(urls.length).toBeGreaterThan(150);
  for (const service of ['/koshyk', '/oformlennya', '/dyakuyemo', 'oferta', 'polityka']) {
    expect(urls.some((u) => u.includes(service)), `${service} потрапив у sitemap`).toBe(false);
  }
});

test('неіснуюча сторінка віддає 404 з виходом у каталог', async ({ page }) => {
  const res = await page.goto('/neisnuyucha-storinka/');
  expect(res!.status()).toBe(404);
  await expect(page.locator('html')).toHaveAttribute('lang', 'uk');
  await expect(page.getByRole('link', { name: 'Перейти в каталог' })).toBeVisible();
});

test('404 під /ru показується російською', async ({ page }) => {
  const res = await page.goto('/ru/neisnuyucha-storinka/');
  expect(res!.status()).toBe(404);
  await expect(page.locator('html')).toHaveAttribute('lang', 'ru');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Страница не найдена');
  // Посилання ведуть у російське дерево, а не в українське
  await expect(page.getByRole('link', { name: 'Перейти в каталог' })).toHaveAttribute(
    'href',
    '/ru/catalog/',
  );
});
