import { expect, test } from '@playwright/test';

const PAGES = [
  '/',
  '/upakovka/dnipro/',
  '/upakovka/kyiv/',
  '/catalog/',
  '/catalog/stakany/',
  '/dlya/kavyarni/',
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

test('картинка для соцмереж віддається обома мовами', async ({ page, request }) => {
  for (const [path, expected] of [
    ['/', '/og'],
    ['/ru/', '/og?l=ru'],
    ['/catalog/stakany-paperovi/', '/og'],
    ['/product/stakan-paperovyi-340-ml-kraft/', '/og'],
  ] as const) {
    await page.goto(path);
    const url = await page.locator('meta[property="og:image"]').getAttribute('content');
    expect(url, `немає og:image на ${path}`).toContain(expected);
  }

  for (const url of ['/og', '/og?l=ru', '/icon']) {
    const res = await request.get(url);
    expect(res.status(), `${url} має віддавати картинку`).toBe(200);
    expect(res.headers()['content-type']).toContain('image/png');
  }
});

test('заголовок не дублює назву компанії', async ({ page }) => {
  // Кореневий layout додає шаблон « | SmartEcoPack»; якщо назву вписати
  // ще й у сам заголовок, бренд у видачі задвоюється
  for (const path of PAGES) {
    await page.goto(path);
    const title = await page.title();
    const count = title.split('SmartEcoPack').length - 1;
    expect(count, `бренд повторюється в title на ${path}: ${title}`).toBeLessThanOrEqual(1);
  }
});

test('гео-сторінки віддають різні умови доставки', async ({ page }) => {
  await page.goto('/upakovka/dnipro/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Упаковка для їжі у Дніпрі');
  await expect(page.getByText('Безкоштовно, власним транспортом')).toBeVisible();

  await page.goto('/upakovka/kyiv/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Упаковка для їжі у Києві');
  await expect(page.getByText(/Нова пошта/).first()).toBeVisible();

  await page.goto('/ru/upakovka/dnipro/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Упаковка для еды в Днепре');
});

test('RSS блогу віддається обома мовами', async ({ request }) => {
  for (const [url, lang] of [
    ['/blog/rss.xml', 'uk-UA'],
    ['/ru/blog/rss.xml', 'ru-UA'],
  ] as const) {
    const res = await request.get(url);
    expect(res.status()).toBe(200);
    expect(res.headers()['content-type']).toContain('application/rss+xml');

    const xml = await res.text();
    expect(xml).toContain(`<language>${lang}</language>`);
    expect(xml.split('<item>').length - 1, 'у стрічці мають бути статті').toBeGreaterThan(0);
  }
});

test('SEO-текст категорії має підзаголовки, а не літерали «##»', async ({ page }) => {
  await page.goto('/catalog/stakany-paperovi/');
  const prose = page.locator('.prose-uk').first();
  await expect(prose.locator('h2')).not.toHaveCount(0);
  await expect(prose).not.toContainText('## ');
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
