import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import type { Locale } from '@/data/types';
import { CATEGORIES, GROUPS, CATEGORY_BY_SLUG } from '@/data/taxonomy';
import { resolveCatalogSlug, productsOfCategory, productsOfGroup, priceFrom } from '@/lib/catalog';
import { getDict } from '@/i18n/dictionaries';
import { pageMeta, clampTitle, clampDescription } from '@/lib/meta';
import { Breadcrumbs } from '@/components/Breadcrumbs';
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

export function staticParams() {
  return [...GROUPS.map((g) => g.slug), ...CATEGORIES.map((c) => c.slug)].map((slug) => ({ slug }));
}

export async function meta(
  l: Locale,
  params: Promise<{ slug: string }>,
): Promise<Metadata> {
  const { slug } = await params;
  const node = resolveCatalogSlug(slug);
  if (node.kind === 'none') return {};

  const path = `/catalog/${slug}/`;

  if (node.kind === 'group') {
    const items = productsOfGroup(slug);
    return pageMeta({
      locale: l,
      path,
      title: clampTitle(
        l === 'uk' ? `${node.group.name.uk} — купити оптом` : `${node.group.name.ru} — купить оптом`,
      ),
      description: clampDescription(
        `${node.group.intro[l]} ${items.length} ${l === 'uk' ? 'позицій, ціна від' : 'позиций, цена от'} ${priceFrom(items).toFixed(2)} грн.`,
      ),
    });
  }

  const items = productsOfCategory(slug);
  return pageMeta({
    locale: l,
    path,
    title: clampTitle(
      l === 'uk'
        ? `${node.category.name.uk} оптом у Дніпрі — ціна`
        : `${node.category.name.ru} оптом в Днепре — цена`,
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
  const node = resolveCatalogSlug(slug);
  if (node.kind === 'none') notFound();
  const p = l === 'uk' ? '' : '/ru';

  /* ── Сторінка групи ── */
  if (node.kind === 'group') {
    const g = node.group;
    const top = productsOfGroup(slug)
      .sort((a, b) => Number(b.featured ?? false) - Number(a.featured ?? false))
      .slice(0, 8);

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
          {g.categories.map((cs) => {
            const cat = CATEGORY_BY_SLUG.get(cs);
            if (!cat) return null;
            const items = productsOfCategory(cs);
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

        <section className="prose-uk mt-12 max-w-3xl">
          {g.seo.map((para, i) => (
            <p key={i}>{para[l]}</p>
          ))}
        </section>
      </div>
    );
  }

  /* ── Сторінка категорії ── */
  const c = node.category;
  const items = productsOfCategory(slug);
  const group = GROUPS.find((g) => g.slug === c.group);

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

      <section className="prose-uk mt-12 max-w-3xl">
        {c.seo.map((para, i) => (
          <p key={i}>{para[l]}</p>
        ))}
      </section>

      <div className="max-w-3xl">
        <Faq items={c.faq} locale={l} title={dict.catalog.faq} />
      </div>
    </div>
  );
}
