import Link from 'next/link';
import type { Metadata } from 'next';
import type { Locale } from '@/data/types';
import { SECTORS, SECTOR_BY_SLUG } from '@/data/sectors';
import { getCategory, priceFrom, productsOfCategory } from '@/lib/catalog';
import { getDict } from '@/i18n/dictionaries';
import { pageMeta, clampTitle, clampDescription } from '@/lib/meta';
import { SITE, formatPhone } from '@/lib/site';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Prose } from '@/components/Prose';
import { Faq } from '@/components/Faq';
import { JsonLd } from '@/components/JsonLd';
import { QuoteForm } from '@/components/QuoteForm';
import { ProductCard } from '@/components/ProductCard';

export function staticParams() {
  return SECTORS.map((s) => ({ sector: s.slug }));
}

export async function meta(l: Locale, params: Promise<{ sector: string }>): Promise<Metadata> {
  const { sector: slug } = await params;
  const sector = SECTOR_BY_SLUG.get(slug);
  if (!sector) return {};

  return pageMeta({
    locale: l,
    path: `/dlya/${slug}/`,
    title: clampTitle(sector.h1[l]),
    description: clampDescription(sector.intro[l]),
  });
}

export default async function SectorPage({
  locale: l,
  params,
}: {
  locale: Locale;
  params: Promise<{ sector: string }>;
}) {
  const { sector: slug } = await params;
  const sector = SECTOR_BY_SLUG.get(slug)!;
  const dict = getDict(l);
  const p = l === 'uk' ? '' : '/ru';

  // Комплект збирається з реальних категорій каталогу: сторінка не дублює
  // товари, а веде в єдине місце, де вони живуть.
  const kit = await Promise.all(
    sector.kit.map(async (item) => {
      const category = await getCategory(item.category);
      const products = await productsOfCategory(item.category);
      return { ...item, category, min: priceFrom(products), count: products.length };
    }),
  );

  // Кілька конкретних товарів — щоб сторінка показувала асортимент, а не
  // тільки список посилань. Беремо перший товар кожної категорії комплекту.
  const picks = (
    await Promise.all(sector.kit.slice(0, 4).map((i) => productsOfCategory(i.category)))
  )
    .map((list) => list[0])
    .filter(Boolean);

  return (
    <div className="container-page pb-12">
      <Breadcrumbs
        locale={l}
        label={dict.a11y.breadcrumb}
        items={[{ label: dict.nav.home, href: '/' }, { label: sector.forWhom[l] }]}
      />

      <h1 className="text-3xl">{sector.h1[l]}</h1>
      <p className="mt-3 max-w-3xl text-lg leading-relaxed text-muted">{sector.intro[l]}</p>

      <section className="mt-8">
        <h2 className="text-xl">{l === 'uk' ? 'Стартовий комплект' : 'Стартовый комплект'}</h2>
        <p className="mt-1 max-w-3xl text-sm text-muted">
          {l === 'uk'
            ? 'Позиції в порядку, у якому їх зазвичай замовляють. Кожна веде в категорію каталогу — товар живе там, а не тут.'
            : 'Позиции в порядке, в котором их обычно заказывают. Каждая ведёт в категорию каталога — товар живёт там, а не здесь.'}
        </p>

        <ol className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {kit.map(
            ({ category, why, min, count }, i) =>
              category && (
                <li key={category.slug}>
                  <Link
                    href={`${p}/catalog/${category.slug}/`}
                    className="card flex h-full flex-col p-4 transition hover:border-primary/50"
                  >
                    <div className="flex items-baseline gap-2">
                      <span className="text-[13px] font-bold text-primary tnum">{i + 1}</span>
                      <h3 className="font-display text-lg">{category.name[l]}</h3>
                    </div>
                    <p className="mt-1 grow text-[13px] leading-snug text-muted">{why[l]}</p>
                    <p className="mt-3 text-sm font-semibold text-primary tnum">
                      {dict.common.from} {min.toFixed(2)} {dict.common.uah}
                      <span className="ml-2 font-normal text-muted">
                        {count} {dict.common.products}
                      </span>
                    </p>
                  </Link>
                </li>
              ),
          )}
        </ol>
      </section>

      {picks.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl">{l === 'uk' ? 'З чого почати' : 'С чего начать'}</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {picks.map((product) => (
              <ProductCard key={product.slug} product={product} locale={l} dict={dict} />
            ))}
          </div>
        </section>
      )}

      <Prose blocks={sector.body} locale={l} className="mt-10 max-w-3xl" />

      <div className="mt-10 grid gap-8 lg:grid-cols-[1.3fr_1fr]">
        <Faq items={sector.faq} locale={l} title={dict.catalog.faq} />
        <div className="card h-fit p-6 lg:mt-10">
          <h2 className="text-xl">
            {l === 'uk' ? 'Зібрати комплект під вас' : 'Собрать комплект под вас'}
          </h2>
          <p className="mt-2 text-sm text-muted">
            {l === 'uk'
              ? 'Скажіть, скільки чашок або замовлень на день — менеджер порахує обсяг і назве ціну з доставкою.'
              : 'Скажите, сколько чашек или заказов в день — менеджер посчитает объём и назовёт цену с доставкой.'}
          </p>
          <div className="mt-4">
            <QuoteForm locale={l} dict={dict} source={`sector-${sector.slug}`} />
          </div>
          <p className="mt-4 text-sm">
            <a href={`tel:${SITE.phones[0]}`} className="font-semibold text-primary tnum">
              {formatPhone(SITE.phones[0])}
            </a>
          </p>
        </div>
      </div>

      <nav className="mt-10 border-t border-border pt-5">
        <h2 className="mb-2 text-sm font-bold">
          {l === 'uk' ? 'Інші типи закладів' : 'Другие типы заведений'}
        </h2>
        <div className="flex flex-wrap gap-2">
          {SECTORS.filter((s) => s.slug !== sector.slug).map((s) => (
            <Link
              key={s.slug}
              href={`${p}/dlya/${s.slug}/`}
              className="chip hover:border-primary hover:text-primary"
            >
              {s.forWhom[l]}
            </Link>
          ))}
          <Link href={`${p}/catalog/`} className="chip hover:border-primary hover:text-primary">
            {dict.catalog.allProducts}
          </Link>
        </div>
      </nav>

      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'Service',
          serviceType: sector.h1[l],
          provider: { '@id': `${SITE.url}/#organization` },
          audience: { '@type': 'BusinessAudience', name: sector.name[l] },
          availableChannel: {
            '@type': 'ServiceChannel',
            serviceUrl: `${SITE.url}${p}/dlya/${sector.slug}/`,
            servicePhone: SITE.phones[0],
          },
        }}
      />
    </div>
  );
}
