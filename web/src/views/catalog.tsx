import Link from 'next/link';
import type { Metadata } from 'next';
import type { Locale } from '@/data/types';
import { GROUPS, CATEGORY_BY_SLUG } from '@/data/taxonomy';
import { productsOfCategory, priceFrom, PRODUCTS } from '@/lib/catalog';
import { getDict } from '@/i18n/dictionaries';
import { pageMeta } from '@/lib/meta';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Placeholder, type Shape } from '@/components/Placeholder';

const SHAPE: Record<string, Shape> = {
  'dlya-napoyiv': 'cup',
  'yizha-navynos': 'round',
  fastfud: 'box',
  pakety: 'bag',
  'suputni-tovary': 'flat',
};

export async function meta(l: Locale): Promise<Metadata> {
  return pageMeta({
    locale: l,
    path: '/catalog/',
    title:
      l === 'uk'
        ? 'Каталог упаковки для їжі — SmartEcoPack'
        : 'Каталог упаковки для еды — SmartEcoPack',
    description:
      l === 'uk'
        ? `Повний каталог паперової упаковки: ${PRODUCTS.length} позицій у 25 категоріях. Стакани, контейнери, пакети, фастфуд-упаковка. Доставка по Дніпру за 24 години.`
        : `Полный каталог бумажной упаковки: ${PRODUCTS.length} позиций в 25 категориях. Стаканы, контейнеры, пакеты, фастфуд-упаковка. Доставка по Днепру за 24 часа.`,
  });
}

export default function CatalogPage({ locale: l }: { locale: Locale }) {
  const dict = getDict(l);
  const p = l === 'uk' ? '' : '/ru';

  return (
    <div className="container-page pb-12">
      <Breadcrumbs
        locale={l}
        label={dict.a11y.breadcrumb}
        items={[{ label: dict.nav.home, href: '/' }, { label: dict.catalog.title }]}
      />

      <h1 className="text-3xl">{dict.catalog.title}</h1>
      <p className="mt-2 max-w-2xl text-muted">
        {l === 'uk'
          ? 'П’ять груп, 25 категорій. Оберіть напрямок — усередині фільтри за об’ємом, розміром і кольором.'
          : 'Пять групп, 25 категорий. Выберите направление — внутри фильтры по объёму, размеру и цвету.'}
      </p>

      <div className="mt-8 space-y-10">
        {GROUPS.map((g) => (
          <section key={g.slug}>
            <div className="mb-4 flex items-baseline justify-between gap-4 border-b border-border pb-2">
              <h2 className="text-xl">
                <Link href={`${p}/catalog/${g.slug}/`} className="hover:text-primary">
                  {g.name[l]}
                </Link>
              </h2>
              <Link href={`${p}/catalog/${g.slug}/`} className="shrink-0 text-sm text-primary">
                {dict.common.all} →
              </Link>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {g.categories.map((slug) => {
                const cat = CATEGORY_BY_SLUG.get(slug);
                if (!cat) return null;
                const items = productsOfCategory(slug);
                return (
                  <Link
                    key={slug}
                    href={`${p}/catalog/${slug}/`}
                    className="card group flex items-center gap-3 p-3 transition hover:border-primary/50"
                  >
                    <Placeholder shape={SHAPE[g.slug]} className="h-14 w-14 shrink-0 rounded" />
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold leading-snug group-hover:text-primary">
                        {cat.name[l]}
                      </h3>
                      <p className="mt-0.5 text-xs text-muted tnum">
                        {items.length} {dict.common.products} · {dict.common.from}{' '}
                        {priceFrom(items).toFixed(2)} {dict.common.uah}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
