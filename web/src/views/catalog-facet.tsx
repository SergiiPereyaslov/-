import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import type { Locale } from '@/data/types';
import { CATEGORIES, CATEGORY_BY_SLUG, GROUPS } from '@/data/taxonomy';
import { productsOfCategory, priceFrom } from '@/lib/catalog';
import { getDict } from '@/i18n/dictionaries';
import { pageMeta, clampTitle, clampDescription } from '@/lib/meta';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { CategoryView } from '@/components/CategoryView';

/**
 * Індексовані фільтрові посадкові: /catalog/stakany-paperovi/340-ml/.
 * Генеруються лише для фасетів із indexed: true — решта комбінацій
 * лишається всередині категорії й в індекс не потрапляє.
 */
const indexedPairs = () =>
  CATEGORIES.flatMap((c) =>
    c.facets
      .filter((f) => f.indexed)
      .flatMap((f) =>
        f.values
          .filter((v) => productsOfCategory(c.slug).some((p) => p.facets[f.key] === v.value))
          .map((v) => ({ category: c.slug, facetKey: f.key, value: v.value, facet: v.slug })),
      ),
  );

export function staticParams() {
  return indexedPairs().map(({ category, facet }) => ({ slug: category, facet }));
}

const resolve = (slug: string, facetSlug: string) => {
  const category = CATEGORY_BY_SLUG.get(slug);
  if (!category) return null;
  for (const f of category.facets) {
    if (!f.indexed) continue;
    const value = f.values.find((v) => v.slug === facetSlug);
    if (value) return { category, facet: f, value };
  }
  return null;
};

export async function meta(
  l: Locale,
  params: Promise<{ slug: string; facet: string }>,
): Promise<Metadata> {
  const { slug, facet } = await params;
  const found = resolve(slug, facet);
  if (!found) return {};

  const items = productsOfCategory(slug).filter(
    (p) => p.facets[found.facet.key] === found.value.value,
  );

  return pageMeta({
    locale: l,
    path: `/catalog/${slug}/${facet}/`,
    title: clampTitle(
      l === 'uk'
        ? `${found.category.name.uk} ${found.value.label.uk} — купити`
        : `${found.category.name.ru} ${found.value.label.ru} — купить`,
    ),
    description: clampDescription(
      l === 'uk'
        ? `${found.category.name.uk} ${found.value.label.uk}: ${items.length} позицій, ціна від ${priceFrom(items).toFixed(2)} грн. Наявність на складі в Дніпрі, доставка за 24 години.`
        : `${found.category.name.ru} ${found.value.label.ru}: ${items.length} позиций, цена от ${priceFrom(items).toFixed(2)} грн. Наличие на складе в Днепре, доставка за 24 часа.`,
    ),
  });
}

export default async function FacetPage({
  locale: l,
  params,
}: {
  locale: Locale;
  params: Promise<{ slug: string; facet: string }>;
}) {
  const { slug, facet } = await params;
  const dict = getDict(l);
  const found = resolve(slug, facet);
  if (!found) notFound();

  const { category, facet: f, value } = found;
  const items = productsOfCategory(slug).filter((p) => p.facets[f.key] === value.value);
  const group = GROUPS.find((g) => g.slug === category.group);
  const p = l === 'uk' ? '' : '/ru';

  const h1 = `${category.h1[l]} ${value.label[l]}`;

  return (
    <div className="container-page pb-12">
      <Breadcrumbs
        locale={l}
        label={dict.a11y.breadcrumb}
        items={[
          { label: dict.nav.home, href: '/' },
          { label: dict.catalog.title, href: '/catalog/' },
          ...(group ? [{ label: group.name[l], href: `/catalog/${group.slug}/` }] : []),
          { label: category.name[l], href: `/catalog/${category.slug}/` },
          { label: value.label[l] },
        ]}
      />

      <h1 className="text-3xl">{h1}</h1>
      <p className="mt-2 max-w-3xl leading-relaxed text-muted">
        {l === 'uk'
          ? `${items.length} позицій у розмірі ${value.label.uk}. Ціна від ${priceFrom(items).toFixed(2)} грн за штуку, оптова ціна вмикається від 10 пачок.`
          : `${items.length} позиций в размере ${value.label.ru}. Цена от ${priceFrom(items).toFixed(2)} грн за штуку, оптовая цена включается от 10 пачек.`}
      </p>

      <CategoryView
        products={items}
        facets={category.facets}
        locale={l}
        dict={dict}
        categorySlug={category.slug}
        lockedFacet={{ key: f.key, value: value.value }}
      />

      {/* Перелінковка на сусідні розміри тієї ж категорії */}
      <nav className="mt-10 border-t border-border pt-5">
        <h2 className="mb-2 text-sm font-bold">{dict.catalog.popularSizes}</h2>
        <div className="flex flex-wrap gap-2">
          <Link href={`${p}/catalog/${category.slug}/`} className="chip hover:border-primary">
            {dict.common.all}
          </Link>
          {f.values
            .filter((v) => v.slug !== facet)
            .filter((v) => productsOfCategory(slug).some((pr) => pr.facets[f.key] === v.value))
            .map((v) => (
              <Link
                key={v.slug}
                href={`${p}/catalog/${category.slug}/${v.slug}/`}
                className="chip hover:border-primary hover:text-primary"
              >
                {v.label[l]}
              </Link>
            ))}
        </div>
      </nav>

      <section className="prose-uk mt-10 max-w-3xl">
        <p>{category.seo[0][l]}</p>
      </section>
    </div>
  );
}
