import Link from 'next/link';
import type { Metadata } from 'next';
import type { Locale } from '@/data/types';
import { GROUPS, CATEGORY_BY_SLUG } from '@/data/taxonomy';
import { featuredProducts, productsOfGroup, priceFrom } from '@/lib/catalog';
import { getDict } from '@/i18n/dictionaries';
import { SITE, formatPhone } from '@/lib/site';
import { pageMeta } from '@/lib/meta';
import { ProductCard } from '@/components/ProductCard';
import { Placeholder, type Shape } from '@/components/Placeholder';
import { Faq } from '@/components/Faq';
import { JsonLd } from '@/components/JsonLd';
import { QuoteForm } from '@/components/QuoteForm';

const GROUP_SHAPE: Record<string, Shape> = {
  'dlya-napoyiv': 'cup',
  'yizha-navynos': 'round',
  fastfud: 'box',
  pakety: 'bag',
  'suputni-tovary': 'flat',
};

const COPY = {
  uk: {
    h1: 'Паперова упаковка для їжі навинос у Дніпрі',
    lead: 'Власний склад і власна логістика: замовлення по Дніпру доїжджає за 24 години і безкоштовно. По Україні — Новою поштою.',
    toCatalog: 'Перейти в каталог',
    getPrice: 'Отримати прайс',
    advantages: [
      ['24 год', 'доставка по Дніпру з власного складу'],
      ['0 грн', 'доставка по місту, без порога замовлення'],
      ['від 1 пачки', 'працюємо і з великим, і з малим замовленням'],
      ['від 100 шт', 'друк вашого логотипу на упаковці'],
    ],
    groupsTitle: 'Каталог',
    groupsLead: 'П’ять груп замість довгого списку — обирайте напрямок, а не гортайте категорії.',
    hitsTitle: 'Хіти продажів',
    brandTitle: 'Упаковка з вашим логотипом',
    brandLead:
      'Стакан і пакет виходять із закладу на вулицю — це найдешевша зовнішня реклама, яка у вас є. Друк від 100 штук, макет розробимо самі.',
    brandCta: 'Порахувати вартість',
    stepsTitle: 'Як ми працюємо',
    steps: [
      ['Заявка', 'Оформіть кошик або зателефонуйте — реєстрація не потрібна.'],
      ['Прорахунок', 'Менеджер підтверджує наявність і надсилає рахунок.'],
      ['Узгодження', 'Погоджуємо макет, якщо потрібне брендування.'],
      ['Доставка', 'Дніпро — за 24 години. Україна — Нова пошта.'],
    ],
    audienceTitle: 'Для кого',
    audience: [
      ['Кав’ярні', 'Стакани, кришки, термочохли, тримачі', 'dlya-napoyiv'],
      ['Доставка їжі', 'Ланч-бокси, салатники, супниці', 'yizha-navynos'],
      ['Фастфуд', 'Бургер-бокси, упаковка для фрі та снеків', 'fastfud'],
      ['Пекарні та кондитерські', 'Пакети, саше, серветки', 'pakety'],
    ],
    faqTitle: 'Часті питання',
    priceFrom: 'від',
    contactTitle: 'Потрібен прайс або консультація?',
    contactLead: 'Зателефонуйте або залиште номер — передзвонимо в робочий час.',
  },
  ru: {
    h1: 'Бумажная упаковка для еды навынос в Днепре',
    lead: 'Собственный склад и собственная логистика: заказ по Днепру доезжает за 24 часа и бесплатно. По Украине — Новой почтой.',
    toCatalog: 'Перейти в каталог',
    getPrice: 'Получить прайс',
    advantages: [
      ['24 ч', 'доставка по Днепру с собственного склада'],
      ['0 грн', 'доставка по городу, без порога заказа'],
      ['от 1 пачки', 'работаем и с большим, и с малым заказом'],
      ['от 100 шт', 'печать вашего логотипа на упаковке'],
    ],
    groupsTitle: 'Каталог',
    groupsLead: 'Пять групп вместо длинного списка — выбирайте направление, а не листайте категории.',
    hitsTitle: 'Хиты продаж',
    brandTitle: 'Упаковка с вашим логотипом',
    brandLead:
      'Стакан и пакет выходят из заведения на улицу — это самая дешёвая наружная реклама, которая у вас есть. Печать от 100 штук, макет разработаем сами.',
    brandCta: 'Рассчитать стоимость',
    stepsTitle: 'Как мы работаем',
    steps: [
      ['Заявка', 'Оформите корзину или позвоните — регистрация не нужна.'],
      ['Просчёт', 'Менеджер подтверждает наличие и присылает счёт.'],
      ['Согласование', 'Согласуем макет, если нужно брендирование.'],
      ['Доставка', 'Днепр — за 24 часа. Украина — Новая почта.'],
    ],
    audienceTitle: 'Для кого',
    audience: [
      ['Кофейни', 'Стаканы, крышки, термочехлы, холдеры', 'dlya-napoyiv'],
      ['Доставка еды', 'Ланч-боксы, салатники, супницы', 'yizha-navynos'],
      ['Фастфуд', 'Бургер-боксы, упаковка для фри и снеков', 'fastfud'],
      ['Пекарни и кондитерские', 'Пакеты, саше, салфетки', 'pakety'],
    ],
    faqTitle: 'Частые вопросы',
    priceFrom: 'от',
    contactTitle: 'Нужен прайс или консультация?',
    contactLead: 'Позвоните или оставьте номер — перезвоним в рабочее время.',
  },
} as const;

const HOME_FAQ = {
  uk: [
    ['Яка мінімальна партія?', 'Мінімуму немає — можна замовити одну пачку. Оптова ціна вмикається від 10 пачок однієї позиції.'],
    ['Скільки коштує доставка по Дніпру?', 'Безкоштовно, без порога суми замовлення. Доставляємо власним транспортом протягом 24 годин.'],
    ['Ви возите по всій Україні?', 'Так, Новою поштою. Відправляємо в день замовлення, якщо воно оформлене до 15:00.'],
    ['Від якого тиражу друкуєте логотип?', 'Від 100 штук. Термін виготовлення — від 5 робочих днів залежно від тиражу й кількості кольорів.'],
    ['Як оплатити?', 'Готівкою при отриманні, на картку або за рахунком для ФОП і ТОВ. Онлайн-оплата на сайті не потрібна.'],
    ['Чи є сертифікати на продукцію?', 'Так, уся упаковка сертифікована для контакту з харчовими продуктами. Копії надаємо на запит.'],
  ],
  ru: [
    ['Какая минимальная партия?', 'Минимума нет — можно заказать одну пачку. Оптовая цена включается от 10 пачек одной позиции.'],
    ['Сколько стоит доставка по Днепру?', 'Бесплатно, без порога суммы заказа. Доставляем собственным транспортом в течение 24 часов.'],
    ['Вы возите по всей Украине?', 'Да, Новой почтой. Отправляем в день заказа, если он оформлен до 15:00.'],
    ['От какого тиража печатаете логотип?', 'От 100 штук. Срок изготовления — от 5 рабочих дней в зависимости от тиража и количества цветов.'],
    ['Как оплатить?', 'Наличными при получении, на карту или по счёту для ФЛП и ООО. Онлайн-оплата на сайте не нужна.'],
    ['Есть ли сертификаты на продукцию?', 'Да, вся упаковка сертифицирована для контакта с пищевыми продуктами. Копии предоставляем по запросу.'],
  ],
} as const;

export async function meta(l: Locale): Promise<Metadata> {
  return pageMeta({
    locale: l,
    path: '/',
    title:
      l === 'uk'
        ? 'Паперова упаковка для їжі оптом — SmartEcoPack Дніпро'
        : 'Бумажная упаковка для еды оптом — SmartEcoPack Днепр',
    description:
      l === 'uk'
        ? 'Паперова та крафтова упаковка для кав’ярень, фастфуду й доставки. Власний склад у Дніпрі, доставка за 24 години безкоштовно, друк логотипу від 100 шт.'
        : 'Бумажная и крафтовая упаковка для кофеен, фастфуда и доставки. Собственный склад в Днепре, доставка за 24 часа бесплатно, печать логотипа от 100 шт.',
  });
}

export default function HomePage({ locale: l }: { locale: Locale }) {
  const dict = getDict(l);
  const t = COPY[l];
  const p = l === 'uk' ? '' : '/ru';
  const hits = featuredProducts(8);

  const localBusiness = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `${SITE.url}/#localbusiness`,
    name: SITE.name,
    image: `${SITE.url}/og.png`,
    url: SITE.url,
    telephone: SITE.phones[0],
    email: SITE.email,
    priceRange: '₴₴',
    address: {
      '@type': 'PostalAddress',
      streetAddress: l === 'uk' ? SITE.address.street : SITE.address.streetRu,
      addressLocality: l === 'uk' ? SITE.address.city : SITE.address.cityRu,
      postalCode: SITE.address.postalCode,
      addressCountry: 'UA',
    },
    geo: { '@type': 'GeoCoordinates', latitude: SITE.address.lat, longitude: SITE.address.lng },
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      opens: '09:00',
      closes: '18:00',
    },
  };

  return (
    <>
      {/* Hero: головна перевага — швидкість, а не «еко» */}
      <section className="border-b border-border bg-kraft">
        <div className="container-page grid gap-8 py-12 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:py-20">
          <div>
            <h1 className="text-[clamp(1.9rem,4.5vw,2.9rem)] leading-[1.12]">{t.h1}</h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-muted">{t.lead}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href={`${p}/catalog/`} className="btn btn-primary">
                {t.toCatalog}
              </Link>
              <a href={`tel:${SITE.phones[0]}`} className="btn btn-secondary tnum">
                {formatPhone(SITE.phones[0])}
              </a>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {t.advantages.map(([big, small]) => (
              <div key={small} className="card p-4">
                <div className="font-display text-2xl font-bold text-primary tnum">{big}</div>
                <div className="mt-1 text-[13px] leading-snug text-muted">{small}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Групи каталогу — головний навігаційний вузол */}
      <section className="container-page py-12 lg:py-16">
        <h2 className="text-2xl">{t.groupsTitle}</h2>
        <p className="mt-2 max-w-2xl text-muted">{t.groupsLead}</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {GROUPS.map((g) => {
            const products = productsOfGroup(g.slug);
            const min = priceFrom(products);
            return (
              <Link
                key={g.slug}
                href={`${p}/catalog/${g.slug}/`}
                className="card group flex gap-4 p-4 transition hover:border-primary/50"
              >
                <Placeholder shape={GROUP_SHAPE[g.slug]} className="h-20 w-20 shrink-0 rounded-md" />
                <div className="min-w-0">
                  <h3 className="font-display text-lg group-hover:text-primary">{g.name[l]}</h3>
                  <p className="mt-1 line-clamp-2 text-[13px] leading-snug text-muted">
                    {g.categories
                      .map((c) => CATEGORY_BY_SLUG.get(c)?.name[l])
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-primary tnum">
                    {t.priceFrom} {min.toFixed(2)} {dict.common.uah}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Хіти */}
      <section className="border-y border-border bg-surface py-12 lg:py-16">
        <div className="container-page">
          <h2 className="text-2xl">{t.hitsTitle}</h2>
          <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 xl:grid-cols-4">
            {hits.map((prod) => (
              <ProductCard key={prod.slug} product={prod} locale={l} dict={dict} />
            ))}
          </div>
        </div>
      </section>

      {/* Брендування */}
      <section className="container-page py-12 lg:py-16">
        <div className="grid items-center gap-8 rounded-lg border border-border bg-kraft p-6 lg:grid-cols-[1.2fr_1fr] lg:p-10">
          <div>
            <h2 className="text-2xl">{t.brandTitle}</h2>
            <p className="mt-3 max-w-xl leading-relaxed text-muted">{t.brandLead}</p>
            <Link href={`${p}/brenduvannya/`} className="btn btn-primary mt-6">
              {t.brandCta}
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {(['cup', 'bag', 'sleeve'] as Shape[]).map((s) => (
              <Placeholder key={s} shape={s} className="aspect-square rounded-md border border-border" />
            ))}
          </div>
        </div>
      </section>

      {/* Як працюємо */}
      <section className="container-page pb-12 lg:pb-16">
        <h2 className="text-2xl">{t.stepsTitle}</h2>
        <ol className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {t.steps.map(([title, body], i) => (
            <li key={title} className="card p-5">
              <span className="font-display text-3xl font-bold text-border tnum">{i + 1}</span>
              <h3 className="mt-2 text-base font-bold">{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Сегменти */}
      <section className="border-t border-border bg-surface py-12 lg:py-16">
        <div className="container-page">
          <h2 className="text-2xl">{t.audienceTitle}</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {t.audience.map(([title, body, group]) => (
              <Link
                key={title}
                href={`${p}/catalog/${group}/`}
                className="card p-5 transition hover:border-primary/50"
              >
                <h3 className="text-base font-bold">{title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">{body}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ + форма */}
      <section className="container-page py-12 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-[1.3fr_1fr]">
          <div>
            <Faq
              items={HOME_FAQ[l].map(([q, a]) => ({
                q: { uk: q, ru: q },
                a: { uk: a, ru: a },
              }))}
              locale={l}
              title={t.faqTitle}
            />
          </div>
          <div className="card h-fit p-6">
            <h2 className="text-xl">{t.contactTitle}</h2>
            <p className="mt-2 text-sm text-muted">{t.contactLead}</p>
            <div className="mt-4">
              <QuoteForm locale={l} dict={dict} source="home" />
            </div>
          </div>
        </div>
      </section>

      <JsonLd data={localBusiness} />
    </>
  );
}
