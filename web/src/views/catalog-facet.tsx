import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import type { Locale } from '@/data/types';
import { getCategories, getCategory, getGroups, priceFrom, productsOfCategory } from '@/lib/catalog';
import { getDict } from '@/i18n/dictionaries';
import { pageMeta, fitTitle, fitDescription } from '@/lib/meta';
import { count } from '@/i18n/plural';
import { facetCopy, FACET_NOUN } from '@/data/facet-copy';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Prose } from '@/components/Prose';
import { CategoryView } from '@/components/CategoryView';
import { ItemListJsonLd } from '@/components/ItemListJsonLd';
import { SITE } from '@/lib/site';

/**
 * Індексовані фільтрові посадкові: /catalog/stakany-paperovi/340-ml/.
 * Генеруються лише для фасетів із indexed: true — решта комбінацій
 * лишається всередині категорії й в індекс не потрапляє.
 */
const indexedPairs = async () => {
  const categories = await getCategories();
  const pairs: { category: string; facet: string }[] = [];

  for (const c of categories) {
    const items = await productsOfCategory(c.slug);
    for (const f of c.facets) {
      if (!f.indexed) continue;
      for (const v of f.values) {
        if (!items.some((p) => p.facets[f.key] === v.value)) continue;
        pairs.push({ category: c.slug, facet: v.slug });
      }
    }
  }
  return pairs;
};

export async function staticParams() {
  return (await indexedPairs()).map(({ category, facet }) => ({ slug: category, facet }));
}

const resolve = async (slug: string, facetSlug: string) => {
  const category = await getCategory(slug);
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
  const found = await resolve(slug, facet);
  if (!found) return {};

  const items = (await productsOfCategory(slug)).filter(
    (p) => p.facets[found.facet.key] === found.value.value,
  );

  // Частина фасетів має підпис-прикметник («Для суші», «Крафт»), і склейка
  // «Категорія Підпис» давала неграматичний заголовок на кшталт
  // «Упаковка для суші та вок Для суші». Такий підпис ставимо в дужки.
  const label = found.value.label[l];
  const isPhrase = /^(Для|Под|З |С )/.test(label);
  const head = isPhrase
    ? `${found.category.name[l]} (${label.toLowerCase()})`
    : `${found.category.name[l]} ${label}`;

  const copy = facetCopy(slug, found.facet.key, facet);

  return pageMeta({
    locale: l,
    path: `/catalog/${slug}/${facet}/`,
    title: fitTitle(head, { text: l === 'uk' ? 'купити' : 'купить' }),
    // Опис теж має бути власним, а не шаблоном із підставленим числом:
    // 59 однакових описів у видачі конкурують між собою так само, як тексти
    description: fitDescription(
      copy
        ? copy.lead[l]
        : l === 'uk'
          ? `${head} — ${count(items.length, 'position', 'uk')} у наявності, ціна від ${priceFrom(items).toFixed(2)} грн.`
          : `${head} — ${count(items.length, 'position', 'ru')} в наличии, цена от ${priceFrom(items).toFixed(2)} грн.`,
      l === 'uk'
        ? `${count(items.length, 'position', 'uk')} у наявності, ціна від ${priceFrom(items).toFixed(2)} грн.`
        : `${count(items.length, 'position', 'ru')} в наличии, цена от ${priceFrom(items).toFixed(2)} грн.`,
      l === 'uk'
        ? 'Доставка по Дніпру за 24 години безкоштовно.'
        : 'Доставка по Днепру за 24 часа бесплатно.',
      l === 'uk' ? 'Опт від 10 пачок.' : 'Опт от 10 пачек.',
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
  const found = await resolve(slug, facet);
  if (!found) notFound();

  const { category, facet: f, value } = found;
  const all = await productsOfCategory(slug);
  const items = all.filter((p) => p.facets[f.key] === value.value);
  const groups = await getGroups();
  const group = groups.find((g) => g.slug === category.group);
  const p = l === 'uk' ? '' : '/ru';

  const h1 = `${category.h1[l]} ${value.label[l]}`;
  const copy = facetCopy(slug, f.key, facet);
  const noun = FACET_NOUN[f.key]?.[l] ?? (l === 'uk' ? 'зі значенням' : 'со значением');

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

      {/*
        Текст під H1 — власний для кожного значення фасета. Шаблонне
        «N позицій у розмірі X» лишилось лише як фолбек: воно давало і
        неграматичне «у розмірі Крафт», і 59 майже однакових сторінок.
      */}
      <p className="mt-2 max-w-3xl leading-relaxed text-muted">
        {copy
          ? copy.lead[l]
          : l === 'uk'
            ? `${count(items.length, 'position', 'uk')} ${noun} ${value.label.uk}.`
            : `${count(items.length, 'position', 'ru')} ${noun} ${value.label.ru}.`}
      </p>
      <p className="mt-2 text-sm text-muted tnum">
        {l === 'uk'
          ? `${count(items.length, 'position', 'uk')} у наявності, ціна від ${priceFrom(items).toFixed(2)} грн за штуку. Оптова ціна вмикається від 10 пачок.`
          : `${count(items.length, 'position', 'ru')} в наличии, цена от ${priceFrom(items).toFixed(2)} грн за штуку. Оптовая цена включается от 10 пачек.`}
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
            .filter((v) => all.some((pr) => pr.facets[f.key] === v.value))
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

      {/*
        Власний текст сторінки. Раніше тут стояв перший абзац категорії —
        тобто всі фільтрові сторінки під однією категорією несли той самий
        текст і конкурували з нею ж у видачі. Фолбек на абзац категорії
        лишився тільки для значень, під які тексту ще не написано.
      */}
      <Prose
        blocks={copy ? copy.body : category.seo.slice(0, 1)}
        locale={l}
        className="mt-10 max-w-3xl"
      />

      <ItemListJsonLd
        urls={items.map((prod) => `${SITE.url}${p}/product/${prod.slug}/`)}
        name={h1}
      />

      {/* Вихід у повний текст категорії — там, де він доречний, а не дублем */}
      <p className="mt-4 max-w-3xl text-sm text-muted">
        <Link href={`${p}/catalog/${category.slug}/`} className="text-primary hover:underline">
          {l === 'uk'
            ? `Як вибрати: ${category.name.uk.toLowerCase()} — повний розбір`
            : `Как выбрать: ${category.name.ru.toLowerCase()} — полный разбор`}
        </Link>
      </p>
    </div>
  );
}
