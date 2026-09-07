import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import type { Locale } from '@/data/types';
import {
  getCategories,
  getCategory,
  getGroups,
  priceFrom,
  productsOfCategory,
  productsOfGroup,
  resolveCatalogSlug,
} from '@/lib/catalog';
import { getDict } from '@/i18n/dictionaries';
import { pageMeta, clampTitle, clampDescription } from '@/lib/meta';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Prose } from '@/components/Prose';
import { CategoryView } from '@/components/CategoryView';
import { ProductCard } from '@/components/ProductCard';
import { Faq } from '@/components/Faq';
import { Placeholder, type Shape } from '@/components/Placeholder';

const SHAPE: Record<string, Shape> = {
  'dlya-napoyiv': 'cup',
  'yizha-navynos': 'round',
  fastfud: 'box',
  pakety: 'bag',
  'suputni-tovary': 'flat',
};

export async function staticParams() {
  const [groups, categories] = await Promise.all([getGroups(), getCategories()]);
  return [...groups.map((g) => g.slug), ...categories.map((c) => c.slug)].map((slug) => ({ slug }));
}

export async function meta(
  l: Locale,
  params: Promise<{ slug: string }>,
): Promise<Metadata> {
  const { slug } = await params;
  const node = await resolveCatalogSlug(slug);
  if (node.kind === 'none') return {};

  const path = `/catalog/${slug}/`;

  if (node.kind === 'group') {
    const items = await productsOfGroup(slug);
    return pageMeta({
      locale: l,
      path,
      title: clampTitle(
        l === 'uk' ? `${node.group.name.uk} — оптом` : `${node.group.name.ru} — оптом`,
      ),
      description: clampDescription(
        `${node.group.intro[l]} ${items.length} ${l === 'uk' ? 'позицій, ціна від' : 'позиций, цена от'} ${priceFrom(items).toFixed(2)} грн.`,
      ),
    });
  }

  const items = await productsOfCategory(slug);
  return pageMeta({
    locale: l,
    path,
    title: clampTitle(
      l === 'uk'
        ? `${node.category.name.uk} оптом — ціна`
        : `${node.category.name.ru} оптом — цена`,
    ),
    description: clampDescription(
      l === 'uk'
        ? `${node.category.name.uk} від ${priceFrom(items).toFixed(2)} грн. ${items.length} позицій у наявності. Безкоштовна доставка по Дніпру за 24 години, друк логотипу.`
        : `${node.category.name.ru} от ${priceFrom(items).toFixed(2)} грн. ${items.length} позиций в наличии. Бесплатная доставка по Днепру за 24 часа, печать логотипа.`,
    ),
  });
}

export default async function CatalogSlugPage({
  locale: l,
  params,
}: {
  locale: Locale;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const dict = getDict(l);
  const node = await resolveCatalogSlug(slug);
  if (node.kind === 'none') notFound();
  const p = l === 'uk' ? '' : '/ru';

  /* ── Сторінка групи ── */
  if (node.kind === 'group') {
    const g = node.group;
    const top = (await productsOfGroup(slug)).slice(0, 8);
    // Категорії групи з кількістю позицій і мінімальною ціною — одним проходом
    const groupCards = await Promise.all(
      g.categories.map(async (cs) => ({
        slug: cs,
        category: await getCategory(cs),
        items: await productsOfCategory(cs),
      })),
    );

    return (
      <div className="container-page pb-12">
        <Breadcrumbs
          locale={l}
          label={dict.a11y.breadcrumb}
          items={[
            { label: dict.nav.home, href: '/' },
            { label: dict.catalog.title, href: '/catalog/' },
            { label: g.name[l] },
          ]}
        />

        <h1 className="text-3xl">{g.h1[l]}</h1>
        <p className="mt-2 max-w-3xl leading-relaxed text-muted">{g.intro[l]}</p>

        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {groupCards.map(({ slug: cs, category: cat, items }) => {
            if (!cat) return null;
            return (
              <Link
                key={cs}
                href={`${p}/catalog/${cs}/`}
                className="card group flex items-center gap-3 p-4 transition hover:border-primary/50"
              >
                <Placeholder shape={SHAPE[g.slug]} className="h-16 w-16 shrink-0 rounded" />
                <div className="min-w-0">
                  <h2 className="font-semibold leading-snug group-hover:text-primary">{cat.name[l]}</h2>
                  <p className="mt-0.5 text-xs text-muted tnum">
                    {items.length} {dict.common.products} · {dict.common.from}{' '}
                    {priceFrom(items).toFixed(2)} {dict.common.uah}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>

        <section className="mt-12">
          <h2 className="text-xl">{dict.catalog.title}</h2>
          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 xl:grid-cols-4">
            {top.map((prod) => (
              <ProductCard key={prod.slug} product={prod} locale={l} dict={dict} />
            ))}
          </div>
        </section>

        <Prose blocks={g.seo} locale={l} className="mt-12 max-w-3xl" />
      </div>
    );
  }

  /* ── Сторінка категорії ── */
  const c = node.category;
  const [items, groups] = await Promise.all([productsOfCategory(slug), getGroups()]);
  const group = groups.find((g) => g.slug === c.group);

  return (
    <div className="container-page pb-12">
      <Breadcrumbs
        locale={l}
        label={dict.a11y.breadcrumb}
        items={[
          { label: dict.nav.home, href: '/' },
          { label: dict.catalog.title, href: '/catalog/' },
          ...(group ? [{ label: group.name[l], href: `/catalog/${group.slug}/` }] : []),
          { label: c.name[l] },
        ]}
      />

      <h1 className="text-3xl">{c.h1[l]}</h1>
      <p className="mt-2 max-w-3xl leading-relaxed text-muted">{c.intro[l]}</p>

      <CategoryView
        products={items}
        facets={c.facets}
        locale={l}
        dict={dict}
        categorySlug={c.slug}
      />

      <Prose blocks={c.seo} locale={l} className="mt-12 max-w-3xl" />

      <div className="max-w-3xl">
        <Faq items={c.faq} locale={l} title={dict.catalog.faq} />
      </div>
    </div>
  );
}
