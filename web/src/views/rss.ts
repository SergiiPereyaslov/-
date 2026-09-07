import type { Locale } from '@/data/types';
import { getPosts } from '@/lib/posts';
import { SITE } from '@/lib/site';

const escape = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/**
 * RSS блогу. Потрібен не стільки читачам, скільки агрегаторам і сервісам
 * моніторингу — вони підхоплюють нові матеріали швидше за краулер.
 */
export async function renderRss(locale: Locale) {
  const posts = await getPosts();
  const prefix = locale === 'uk' ? '' : '/ru';
  const base = `${SITE.url}${prefix}`;

  const title =
    locale === 'uk' ? 'Блог SmartEcoPack — про упаковку' : 'Блог SmartEcoPack — об упаковке';
  const description =
    locale === 'uk'
      ? 'Практичні матеріали про вибір паперової упаковки для кав’ярень, фастфуду й доставки.'
      : 'Практические материалы о выборе бумажной упаковки для кофеен, фастфуда и доставки.';

  const items = posts
    .map((p) => {
      const url = `${base}/blog/${p.slug}/`;
      return `    <item>
      <title>${escape(p.title[locale])}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <description>${escape(p.excerpt[locale])}</description>
      <pubDate>${new Date(p.date).toUTCString()}</pubDate>
    </item>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escape(title)}</title>
    <link>${base}/blog/</link>
    <description>${escape(description)}</description>
    <language>${locale === 'uk' ? 'uk-UA' : 'ru-UA'}</language>
    <atom:link href="${base}/blog/rss.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      'content-type': 'application/rss+xml; charset=utf-8',
      'cache-control': 'public, max-age=3600',
    },
  });
}
