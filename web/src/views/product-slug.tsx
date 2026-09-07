import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import type { Locale } from '@/data/types';
import {
  compatibleProducts,
  getAllProducts,
  getCategory,
  getGroups,
  getProduct,
  productsOfCategory,
} from '@/lib/catalog';
import { getDict } from '@/i18n/dictionaries';
import { pageMeta, clampTitle, clampDescription } from '@/lib/meta';
import { SITE, canonical } from '@/lib/site';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Placeholder } from '@/components/Placeholder';
import { ProductPanel } from '@/components/ProductPanel';
import { ProductCard } from '@/components/ProductCard';
import { JsonLd } from '@/components/JsonLd';

export async function staticParams() {
  return (await getAllProducts()).map((p) => ({ slug: p.slug }));
}

export async function meta(
  l: Locale,
  params: Promise<{ slug: string }>,
): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return {};

  const packPrice = (product.priceRetail * product.unitsPerPack).toFixed(0);

  return pageMeta({
    locale: l,
    path: `/product/${slug}/`,
    // Технічні параметри свідомо не йдуть у title — він тримається в 60 символах
    title: clampTitle(`${product.name[l]} — ${packPrice} грн`),
    description: clampDescription(
      l === 'uk'
        ? `${product.name.uk}, ${product.unitsPerPack} шт в упаковці. Опт від ${product.tiers[0].perUnit.toFixed(2)} грн/шт. Доставка з власного складу в Дніпрі за 24 години.`
        : `${product.name.ru}, ${product.unitsPerPack} шт в упаковке. Опт от ${product.tiers[0].perUnit.toFixed(2)} грн/шт. Доставка с собственного склада в Днепре за 24 часа.`,
    ),
  });
}

export default async function ProductPage({
  locale: l,
  params,
}: {
  locale: Locale;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const dict = getDict(l);
  const product = await getProduct(slug);
  if (!product) notFound();

  const [category, groups, compatible, sameCategory] = await Promise.all([
    getCategory(product.category),
    getGroups(),
    compatibleProducts(product),
    productsOfCategory(product.category),
  ]);
  const group = category ? groups.find((g) => g.slug === category.group) : undefined;
  const shape = product.shape ?? 'box';
  const related = sameCategory.filter((p) => p.slug !== product.slug).slice(0, 4);

  const compatibleTitle = shape === 'lid' ? dict.product.compatibleCups : dict.product.compatibleLids;

  const productLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name[l],
    sku: product.sku,
    description: product.description[l],
    brand: { '@type': 'Brand', name: SITE.name },
    offers: {
      '@type': 'Offer',
      url: canonical(l, `/product/${product.slug}/`),
      priceCurrency: 'UAH',
      price: product.priceRetail.toFixed(2),
      availability: product.inStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/PreOrder',
      seller: { '@id': `${SITE.url}/#organization` },
    },
  };

  return (
    <div className="container-page pb-12">
      <Breadcrumbs
        locale={l}
        label={dict.a11y.breadcrumb}
        items={[
          { label: dict.nav.home, href: '/' },
          { label: dict.catalog.title, href: '/catalog/' },
          ...(group ? [{ label: group.name[l], href: `/catalog/${group.slug}/` }] : []),
          ...(category ? [{ label: category.name[l], href: `/catalog/${category.slug}/` }] : []),
          { label: product.name[l] },
        ]}
      />

      <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
        <div>
          <Placeholder shape={shape} className="aspect-square w-full rounded-lg border border-border" />
          <div className="mt-3 grid grid-cols-4 gap-2">
            {[0, 1, 2, 3].map((i) => (
              <Placeholder key={i} shape={shape} className="aspect-square rounded border border-border" />
            ))}
          </div>
        </div>

        <div>
          <h1 className="text-2xl leading-tight lg:text-[1.75rem]">{product.name[l]}</h1>
          <p className="mt-1.5 text-sm text-muted">{product.spec[l]}</p>
          <div className="mt-5">
            <ProductPanel
              product={product}
              dict={dict}
              brandingMin={SITE.brandingMinUnits}
              telegram={SITE.telegram}
            />
          </div>
        </div>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_400px]">
        <div className="space-y-8">
          <section>
            <h2 className="mb-3 text-xl">{dict.product.specs}</h2>
            <dl className="divide-y divide-border overflow-hidden rounded-md border border-border">
              {product.attributes.map((a, i) => (
                <div key={i} className="flex justify-between gap-4 bg-surface px-4 py-2.5 text-sm">
                  <dt className="text-muted">{a.label[l]}</dt>
                  <dd className="text-right font-medium tnum">{a.value[l]}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section>
            <h2 className="mb-3 text-xl">{dict.product.description}</h2>
            <p className="leading-relaxed text-muted">{product.description[l]}</p>
          </section>
        </div>
      </div>

      {/* Крос-продаж за таблицею сумісності стакан ↔ кришка */}
      {compatible.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-4 text-xl">{compatibleTitle}</h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 xl:grid-cols-4">
            {compatible.map((p) => (
              <ProductCard key={p.slug} product={p} locale={l} dict={dict} />
            ))}
          </div>
        </section>
      )}

      {related.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-4 text-xl">{dict.product.related}</h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 xl:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.slug} product={p} locale={l} dict={dict} />
            ))}
          </div>
        </section>
      )}

      {category && (
        <p className="mt-10">
          <Link
            href={`${l === 'uk' ? '' : '/ru'}/catalog/${category.slug}/`}
            className="text-sm text-primary"
          >
            ← {category.name[l]}
          </Link>
        </p>
      )}

      <JsonLd data={productLd} />
    </div>
  );
}
