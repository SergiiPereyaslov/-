import Link from 'next/link';
import type { Metadata } from 'next';
import type { Locale } from '@/data/types';
import {
  getAllProducts,
  getCategories,
  getCategory,
  getGroups,
  priceFrom,
  productsOfCategory,
} from '@/lib/catalog';
import { getDict } from '@/i18n/dictionaries';
import { pageMeta } from '@/lib/meta';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Placeholder, type Shape } from '@/components/Placeholder';

const SHAPE: Record<string, Shape> = {
  stakany: 'cup',
  konteynery: 'round',
  fastfud: 'box',
  pakety: 'bag',
  'suputni-tovary': 'flat',
  'pet-posud': 'cup',
};

export async function meta(l: Locale): Promise<Metadata> {
  const [total, categories] = await Promise.all([
    getAllProducts().then((p) => p.length),
    getCategories().then((c) => c.length),
  ]);

  return pageMeta({
    locale: l,
    path: '/catalog/',
    title:
      l === 'uk'
        ? 'Каталог паперової упаковки для їжі'
        : 'Каталог бумажной упаковки для еды',
    description:
      l === 'uk'
        ? `Повний каталог паперової упаковки: ${total} позицій у ${categories} категоріях. Стакани, контейнери, пакети, фастфуд-упаковка. Доставка по Дніпру за 24 години.`
        : `Полный каталог бумажной упаковки: ${total} позиций в ${categories} категориях. Стаканы, контейнеры, пакеты, фастфуд-упаковка. Доставка по Днепру за 24 часа.`,
  });
}

export default async function CatalogPage({ locale: l }: { locale: Locale }) {
  const dict = getDict(l);
  const p = l === 'uk' ? '' : '/ru';
  const groups = await getGroups();
  // Кількість беремо з даних, а не з тексту: інакше при кожній зміні
  // структури каталогу число в лідері мовчки застаріває.
  const categoryCount = groups.reduce((n, g) => n + g.categories.length, 0);

  // Картки категорій з лічильником і мінімальною ціною — готуємо на сервері
  const sections = await Promise.all(
    groups.map(async (g) => ({
      group: g,
      cards: await Promise.all(
        g.categories.map(async (slug) => ({
          slug,
          category: await getCategory(slug),
          items: await productsOfCategory(slug),
        })),
      ),
    })),
  );

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
          ? `Каталог поділено на ${groups.length} груп і ${categoryCount} категорій. Оберіть напрямок — усередині фільтри за об’ємом, розміром і кольором.`
          : `Каталог разделён на ${groups.length} групп и ${categoryCount} категорий. Выберите направление — внутри фильтры по объёму, размеру и цвету.`}
      </p>

      <div className="mt-8 space-y-10">
        {sections.map(({ group: g, cards }) => (
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
              {cards.map(({ slug, category: cat, items }) => {
                if (!cat) return null;
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
