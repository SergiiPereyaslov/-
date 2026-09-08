import { expect, test } from '@playwright/test';

/**
 * Фасетні посадкові раніше показували перший абзац батьківської категорії —
 * тобто дев'ять сторінок під «Стакани паперові» несли той самий текст і
 * конкурували з категорією у видачі. Цей тест не дає дефекту повернутись.
 */

const lead = (html: string) =>
  /leading-relaxed text-muted">([^<]+)/.exec(html)?.[1]?.trim() ?? '';

const description = (html: string) =>
  /<meta name="description" content="([^"]*)"/.exec(html)?.[1]?.trim() ?? '';

test('текст фасетної сторінки не збігається з текстом категорії', async ({ request }) => {
  const category = await (await request.get('/catalog/stakany-paperovi/')).text();
  const catLead = lead(category);

  for (const facet of ['340-ml', 'kraft', 'chorni']) {
    const html = await (await request.get(`/catalog/stakany-paperovi/${facet}/`)).text();
    expect(lead(html), `фасет ${facet} повторює категорію`).not.toBe(catLead);
    expect(lead(html).length, `порожній текст на ${facet}`).toBeGreaterThan(60);
  }
});

test('усі фасетні сторінки мають унікальний текст і опис', async ({ request }) => {
  const xml = await (await request.get('/sitemap.xml')).text();
  const urls = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)]
    .map((m) => m[1].replace(/^https?:\/\/[^/]+/, ''))
    .filter((u) => u.startsWith('/catalog/') && u.split('/').filter(Boolean).length === 3);

  expect(urls.length, 'фасетних сторінок у sitemap').toBeGreaterThan(50);

  const leads = new Map<string, string[]>();
  const descriptions = new Map<string, string[]>();

  for (const u of urls) {
    const html = await (await request.get(u)).text();
    leads.set(lead(html), [...(leads.get(lead(html)) ?? []), u]);
    descriptions.set(description(html), [...(descriptions.get(description(html)) ?? []), u]);
  }

  const dupLead = [...leads.values()].filter((v) => v.length > 1);
  const dupDesc = [...descriptions.values()].filter((v) => v.length > 1);

  expect(dupLead, `дублі тексту: ${dupLead.map((v) => v.join(' = ')).join('; ')}`).toHaveLength(0);
  expect(dupDesc, `дублі опису: ${dupDesc.map((v) => v.join(' = ')).join('; ')}`).toHaveLength(0);
});

test('підпис фасета узгоджений із тим, що фільтрується', async ({ request }) => {
  // Раніше в шаблоні стояло жорстке «у розмірі», і сторінка кольору
  // віддавала «у розмірі Крафт»
  const html = await (await request.get('/catalog/stakany-paperovi/kraft/')).text();
  expect(html).not.toContain('у розмірі Крафт');
  expect(html).not.toMatch(/\b1 позицій\b/);
  expect(html).not.toMatch(/\b[234] позицій\b/);
});

test('фасетна сторінка веде в категорію, а не тримає трафік у себе', async ({ page }) => {
  await page.goto('/catalog/stakany-paperovi/340-ml/');
  await expect(page.locator('a[href="/catalog/stakany-paperovi/"]').first()).toBeVisible();
});
