import Link from 'next/link';
import type { Metadata } from 'next';
import type { Locale } from '@/data/types';
import { CITIES, CITY_BY_SLUG } from '@/data/cities';
import { getGroups, priceFrom, productsOfGroup } from '@/lib/catalog';
import { getDict } from '@/i18n/dictionaries';
import { pageMeta, clampTitle, clampDescription } from '@/lib/meta';
import { SITE, formatPhone } from '@/lib/site';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Prose } from '@/components/Prose';
import { Faq } from '@/components/Faq';
import { JsonLd } from '@/components/JsonLd';
import { QuoteForm } from '@/components/QuoteForm';

export function staticParams() {
  return CITIES.map((c) => ({ city: c.slug }));
}

const cityFaq = (city: (typeof CITIES)[number], l: Locale) => {
  const uk = [
    [
      `Скільки коштує доставка ${city.dative.uk}?`,
      city.home
        ? 'Безкоштовно, без мінімальної суми замовлення. Веземо власним транспортом.'
        : `Доставка Новою поштою за тарифами перевізника. Відправляємо в день замовлення, якщо воно оформлене до 15:00, і посилка приходить ${city.leadTime.uk}.`,
    ],
    [
      'Яка мінімальна партія?',
      'Мінімуму немає — можна замовити одну пачку. Оптова ціна вмикається від 10 пачок однієї позиції й видна прямо в каталозі.',
    ],
    [
      'Чи можна замовити упаковку з логотипом?',
      'Так, друк доступний від 100 штук. Термін виготовлення — від 5 робочих днів, орієнтовну вартість можна порахувати в калькуляторі на сторінці «Брендування».',
    ],
    [
      'Як оплатити?',
      city.home
        ? 'Готівкою при отриманні, на картку або за рахунком для ФОП і ТОВ.'
        : 'На картку, за рахунком для ФОП і ТОВ або накладеним платежем за домовленістю з менеджером.',
    ],
  ] as const;

  const ru = [
    [
      `Сколько стоит доставка в ${city.name.ru}?`,
      city.home
        ? 'Бесплатно, без минимальной суммы заказа. Везём собственным транспортом.'
        : `Доставка Новой почтой по тарифам перевозчика. Отправляем в день заказа, если он оформлен до 15:00, и посылка приходит ${city.leadTime.ru}.`,
    ],
    [
      'Какая минимальная партия?',
      'Минимума нет — можно заказать одну пачку. Оптовая цена включается от 10 пачек одной позиции и видна прямо в каталоге.',
    ],
    [
      'Можно ли заказать упаковку с логотипом?',
      'Да, печать доступна от 100 штук. Срок изготовления — от 5 рабочих дней, ориентировочную стоимость можно рассчитать в калькуляторе на странице «Брендирование».',
    ],
    [
      'Как оплатить?',
      city.home
        ? 'Наличными при получении, на карту или по счёту для ФЛП и ООО.'
        : 'На карту, по счёту для ФЛП и ООО или наложенным платежом по договорённости с менеджером.',
    ],
  ] as const;

  const rows = l === 'uk' ? uk : ru;
  return rows.map(([q, a]) => ({ q: { uk: q, ru: q }, a: { uk: a, ru: a } }));
};

export async function meta(l: Locale, params: Promise<{ city: string }>): Promise<Metadata> {
  const { city: slug } = await params;
  const city = CITY_BY_SLUG.get(slug);
  if (!city) return {};

  return pageMeta({
    locale: l,
    path: `/upakovka/${slug}/`,
    title: clampTitle(
      l === 'uk'
        ? `Упаковка для їжі ${city.locative.uk}`
        : `Упаковка для еды ${city.locative.ru}`,
    ),
    description: clampDescription(
      l === 'uk'
        ? `Паперова упаковка для кав’ярень і доставки ${city.locative.uk}. ${city.delivery.uk}, ${city.leadTime.uk}. Опт від 10 пачок, друк логотипу від 100 шт.`
        : `Бумажная упаковка для кофеен и доставки ${city.locative.ru}. ${city.delivery.ru}, ${city.leadTime.ru}. Опт от 10 пачек, печать логотипа от 100 шт.`,
    ),
  });
}

export default async function CityPage({
  locale: l,
  params,
}: {
  locale: Locale;
  params: Promise<{ city: string }>;
}) {
  const { city: slug } = await params;
  const city = CITY_BY_SLUG.get(slug)!;
  const dict = getDict(l);
  const p = l === 'uk' ? '' : '/ru';

  const groups = await getGroups();
  const cards = await Promise.all(
    groups.map(async (g) => ({ group: g, min: priceFrom(await productsOfGroup(g.slug)) })),
  );

  const h1 =
    l === 'uk'
      ? `Упаковка для їжі ${city.locative.uk}`
      : `Упаковка для еды ${city.locative.ru}`;

  return (
    <div className="container-page pb-12">
      <Breadcrumbs
        locale={l}
        label={dict.a11y.breadcrumb}
        items={[{ label: dict.nav.home, href: '/' }, { label: city.name[l] }]}
      />

      <h1 className="text-3xl">{h1}</h1>
      <p className="mt-3 max-w-3xl text-lg leading-relaxed text-muted">{city.intro[l]}</p>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="card p-4">
          <div className="text-[13px] text-muted">{l === 'uk' ? 'Доставка' : 'Доставка'}</div>
          <div className="mt-1 font-semibold">{city.delivery[l]}</div>
        </div>
        <div className="card p-4">
          <div className="text-[13px] text-muted">{l === 'uk' ? 'Термін' : 'Срок'}</div>
          <div className="mt-1 font-semibold">{city.leadTime[l]}</div>
        </div>
        <div className="card p-4">
          <div className="text-[13px] text-muted">
            {l === 'uk' ? 'Мінімальна партія' : 'Минимальная партия'}
          </div>
          <div className="mt-1 font-semibold">{l === 'uk' ? 'Одна пачка' : 'Одна пачка'}</div>
        </div>
      </div>

      <Prose blocks={city.body} locale={l} className="mt-8 max-w-3xl" />

      <section className="mt-10">
        <h2 className="text-xl">{l === 'uk' ? 'Що можна замовити' : 'Что можно заказать'}</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map(({ group: g, min }) => (
            <Link
              key={g.slug}
              href={`${p}/catalog/${g.slug}/`}
              className="card p-4 transition hover:border-primary/50"
            >
              <h3 className="font-display text-lg">{g.name[l]}</h3>
              <p className="mt-1 line-clamp-2 text-[13px] leading-snug text-muted">{g.intro[l]}</p>
              <p className="mt-2 text-sm font-semibold text-primary tnum">
                {dict.common.from} {min.toFixed(2)} {dict.common.uah}
              </p>
            </Link>
          ))}
        </div>
      </section>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1.3fr_1fr]">
        <Faq items={cityFaq(city, l)} locale={l} title={dict.catalog.faq} />
        <div className="card h-fit p-6 lg:mt-10">
          <h2 className="text-xl">
            {l === 'uk' ? 'Прорахувати замовлення' : 'Рассчитать заказ'}
          </h2>
          <p className="mt-2 text-sm text-muted">
            {l === 'uk'
              ? 'Залиште номер — менеджер передзвонить і порахує вартість із доставкою.'
              : 'Оставьте номер — менеджер перезвонит и рассчитает стоимость с доставкой.'}
          </p>
          <div className="mt-4">
            <QuoteForm locale={l} dict={dict} source={`city-${city.slug}`} />
          </div>
          <p className="mt-4 text-sm">
            <a href={`tel:${SITE.phones[0]}`} className="font-semibold text-primary tnum">
              {formatPhone(SITE.phones[0])}
            </a>
          </p>
        </div>
      </div>

      <nav className="mt-10 border-t border-border pt-5">
        <h2 className="mb-2 text-sm font-bold">{l === 'uk' ? 'Інші міста' : 'Другие города'}</h2>
        <div className="flex flex-wrap gap-2">
          {CITIES.filter((c) => c.slug !== city.slug).map((c) => (
            <Link
              key={c.slug}
              href={`${p}/upakovka/${c.slug}/`}
              className="chip hover:border-primary hover:text-primary"
            >
              {c.name[l]}
            </Link>
          ))}
        </div>
      </nav>

      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'Service',
          serviceType: l === 'uk' ? 'Постачання пакувальних матеріалів' : 'Поставка упаковочных материалов',
          provider: { '@id': `${SITE.url}/#organization` },
          areaServed: { '@type': 'City', name: city.name[l] },
          availableChannel: {
            '@type': 'ServiceChannel',
            serviceUrl: `${SITE.url}${p}/upakovka/${city.slug}/`,
            servicePhone: SITE.phones[0],
          },
        }}
      />
    </div>
  );
}
