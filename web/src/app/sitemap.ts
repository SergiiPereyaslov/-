import type { MetadataRoute } from 'next';
import { getCategories, getGroups, getAllProducts, productsOfCategory } from '@/lib/catalog';
import { getPosts } from '@/lib/posts';
import { CITIES } from '@/data/cities';
import { SITE } from '@/lib/site';
import type { Facet } from '@/data/types';

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

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [groups, categories, products, posts] = await Promise.all([
    getGroups(),
    getCategories(),
    getAllProducts(),
    getPosts(),
  ]);

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

  // Гео-посадкові: окремий кластер під запити «упаковка + місто»
  const cities = CITIES.map((c) => entry(`/upakovka/${c.slug}/`, 0.7, 'monthly'));

  const facets: MetadataRoute.Sitemap = [];
  for (const c of categories) {
    const items = await productsOfCategory(c.slug);
    for (const f of c.facets as Facet[]) {
      if (!f.indexed) continue;
      for (const v of f.values) {
        if (!items.some((p) => p.facets[f.key] === v.value)) continue;
        facets.push(entry(`/catalog/${c.slug}/${v.slug}/`, 0.7, 'weekly'));
      }
    }
  }

  return [
    ...staticPages.map(([path, priority, freq]) => entry(path, priority, freq)),
    ...cities,
    ...groups.map((g) => entry(`/catalog/${g.slug}/`, 0.85, 'weekly')),
    ...categories.map((c) => entry(`/catalog/${c.slug}/`, 0.8, 'weekly')),
    ...facets,
    ...products.map((p) => entry(`/product/${p.slug}/`, 0.65, 'weekly')),
    ...posts.map((p) => entry(`/blog/${p.slug}/`, 0.5, 'monthly')),
  ];
}
