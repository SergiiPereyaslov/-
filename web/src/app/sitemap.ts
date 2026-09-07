import type { MetadataRoute } from 'next';
import { CATEGORIES, GROUPS } from '@/data/taxonomy';
import { PRODUCTS, productsOfCategory } from '@/lib/catalog';
import { POSTS } from '@/data/posts';
import { SITE } from '@/lib/site';

/**
 * Sitemap із hreflang-альтернативами для кожного URL.
 *
 * Індексуються тільки ті фільтрові сторінки, у яких фасет позначений
 * indexed: true й реально має товари. Службові сторінки (кошик,
 * оформлення, юридичні документи) сюди не потрапляють — вони noindex.
 */
const entry = (
  path: string,
  priority: number,
  changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'],
): MetadataRoute.Sitemap[number] => ({
  url: `${SITE.url}${path}`,
  lastModified: new Date(),
  changeFrequency,
  priority,
  alternates: {
    languages: {
      uk: `${SITE.url}${path}`,
      ru: `${SITE.url}/ru${path}`,
    },
  },
});

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages: [string, number, MetadataRoute.Sitemap[number]['changeFrequency']][] = [
    ['/', 1, 'weekly'],
    ['/catalog/', 0.9, 'weekly'],
    ['/brenduvannya/', 0.8, 'monthly'],
    ['/brenduvannya/druk-na-stakanakh/', 0.7, 'monthly'],
    ['/brenduvannya/druk-na-paketakh/', 0.7, 'monthly'],
    ['/dostavka-i-oplata/', 0.6, 'monthly'],
    ['/pro-nas/', 0.5, 'yearly'],
    ['/kontakty/', 0.6, 'yearly'],
    ['/blog/', 0.6, 'weekly'],
  ];

  const groups = GROUPS.map((g) => entry(`/catalog/${g.slug}/`, 0.85, 'weekly'));
  const categories = CATEGORIES.map((c) => entry(`/catalog/${c.slug}/`, 0.8, 'weekly'));

  const facets = CATEGORIES.flatMap((c) =>
    c.facets
      .filter((f) => f.indexed)
      .flatMap((f) =>
        f.values
          .filter((v) => productsOfCategory(c.slug).some((p) => p.facets[f.key] === v.value))
          .map((v) => entry(`/catalog/${c.slug}/${v.slug}/`, 0.7, 'weekly')),
      ),
  );

  const products = PRODUCTS.map((p) => entry(`/product/${p.slug}/`, 0.65, 'weekly'));
  const posts = POSTS.map((p) => entry(`/blog/${p.slug}/`, 0.5, 'monthly'));

  return [
    ...staticPages.map(([path, priority, freq]) => entry(path, priority, freq)),
    ...groups,
    ...categories,
    ...facets,
    ...products,
    ...posts,
  ];
}
