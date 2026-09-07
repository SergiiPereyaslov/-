import type { Metadata } from 'next';
import Link from 'next/link';
import type { Locale } from '@/data/types';
import { getDict } from '@/i18n/dictionaries';
import { pageMeta } from '@/lib/meta';
import { SITE } from '@/lib/site';
import { getAllProducts } from '@/lib/catalog';
import { Breadcrumbs } from '@/components/Breadcrumbs';

const COPY = {
  uk: {
    h1: 'Про SmartEcoPack',
    lead: 'Ми постачаємо паперову й крафтову упаковку закладам Дніпра та всієї України. Формуємо репутацію діями, а не словами.',
    body: [
      'SmartEcoPack працює з кав’ярнями, фастфудом, службами доставки, пекарнями та кейтерингом. Ми свідомо не намагаємось бути «ще одним великим каталогом»: наша перевага не в кількості позицій, а в тому, що замовлення по Дніпру доїжджає за добу з нашого власного складу, а не через транспортну компанію з іншого міста.',
      'Ми тримаємо повні розмірні лінійки — щоб стакан і кришка, куплені разом, гарантовано підходили один до одного. Це звучить дрібницею рівно до першої партії кришок, які не сідають на ваші стакани.',
      'Працюємо і з мережами, і з точкою на одну кав’ярню. Мінімальної партії немає: можна взяти одну пачку. Друк логотипу теж доступний від 100 штук — саме тому, щоб брендування не було привілеєм великих гравців.',
    ],
    factsTitle: 'Коротко',
    facts: [
      ['Власний склад', 'у Дніпрі, з власною логістикою'],
      ['24 години', 'доставка по місту, безкоштовно'],
      ['від 1 пачки', 'мінімальної партії немає'],
      ['від 100 шт', 'друк логотипу на упаковці'],
    ],
    valuesTitle: 'Як ми працюємо',
    values: [
      ['Тільки сертифікована продукція', 'Уся упаковка має документи для контакту з харчовими продуктами. Копії надаємо на запит — без «зателефонуйте пізніше».'],
      ['Персональний менеджер', 'За кожним клієнтом закріплений менеджер, який знає вашу історію замовлень і не питає щоразу «а що ви брали минулого разу».'],
      ['Ціни видно всім', 'Роздрібна й оптова ціна вказані в каталозі відкрито. Не треба реєструватися, щоб дізнатися, скільки коштує пачка стаканів.'],
    ],
    reqTitle: 'Реквізити',
    showroom: 'Шоурум і самовивіз',
    catalogCta: 'Перейти в каталог',
  },
  ru: {
    h1: 'О SmartEcoPack',
    lead: 'Мы поставляем бумажную и крафтовую упаковку заведениям Днепра и всей Украины. Формируем репутацию действиями, а не словами.',
    body: [
      'SmartEcoPack работает с кофейнями, фастфудом, службами доставки, пекарнями и кейтерингом. Мы сознательно не пытаемся быть «ещё одним большим каталогом»: наше преимущество не в количестве позиций, а в том, что заказ по Днепру доезжает за сутки с нашего собственного склада, а не через транспортную компанию из другого города.',
      'Мы держим полные размерные линейки — чтобы стакан и крышка, купленные вместе, гарантированно подходили друг к другу. Это звучит мелочью ровно до первой партии крышек, которые не садятся на ваши стаканы.',
      'Работаем и с сетями, и с точкой на одну кофейню. Минимальной партии нет: можно взять одну пачку. Печать логотипа тоже доступна от 100 штук — именно затем, чтобы брендирование не было привилегией крупных игроков.',
    ],
    factsTitle: 'Коротко',
    facts: [
      ['Собственный склад', 'в Днепре, с собственной логистикой'],
      ['24 часа', 'доставка по городу, бесплатно'],
      ['от 1 пачки', 'минимальной партии нет'],
      ['от 100 шт', 'печать логотипа на упаковке'],
    ],
    valuesTitle: 'Как мы работаем',
    values: [
      ['Только сертифицированная продукция', 'Вся упаковка имеет документы для контакта с пищевыми продуктами. Копии предоставляем по запросу — без «позвоните позже».'],
      ['Персональный менеджер', 'За каждым клиентом закреплён менеджер, который знает вашу историю заказов и не спрашивает каждый раз «а что вы брали в прошлый раз».'],
      ['Цены видны всем', 'Розничная и оптовая цена указаны в каталоге открыто. Не надо регистрироваться, чтобы узнать, сколько стоит пачка стаканов.'],
    ],
    reqTitle: 'Реквизиты',
    showroom: 'Шоурум и самовывоз',
    catalogCta: 'Перейти в каталог',
  },
} as const;

export async function meta(l: Locale): Promise<Metadata> {
  return pageMeta({
    locale: l,
    path: '/pro-nas/',
    title: l === 'uk' ? 'Про компанію' : 'О компании',
    description:
      l === 'uk'
        ? 'Постачальник паперової упаковки для HoReCa у Дніпрі. Власний склад і логістика, доставка за 24 години, сертифікована продукція, друк логотипу від 100 шт.'
        : 'Поставщик бумажной упаковки для HoReCa в Днепре. Собственный склад и логистика, доставка за 24 часа, сертифицированная продукция, печать логотипа от 100 шт.',
  });
}

export default async function AboutPage({ locale: l }: { locale: Locale }) {
  const total = (await getAllProducts()).length;
  const dict = getDict(l);
  const t = COPY[l];
  const p = l === 'uk' ? '' : '/ru';

  return (
    <div className="container-page pb-12">
      <Breadcrumbs
        locale={l}
        label={dict.a11y.breadcrumb}
        items={[{ label: dict.nav.home, href: '/' }, { label: dict.nav.about }]}
      />

      <h1 className="text-3xl">{t.h1}</h1>
      <p className="mt-3 max-w-3xl text-lg leading-relaxed text-muted">{t.lead}</p>

      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {t.facts.map(([big, small]) => (
          <div key={small} className="card p-4">
            <div className="font-display text-xl font-bold text-primary tnum">{big}</div>
            <div className="mt-1 text-[13px] leading-snug text-muted">{small}</div>
          </div>
        ))}
      </div>

      <section className="prose-uk mt-10 max-w-3xl">
        {t.body.map((para) => (
          <p key={para.slice(0, 24)}>{para}</p>
        ))}
      </section>

      <section className="mt-10">
        <h2 className="text-xl">{t.valuesTitle}</h2>
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          {t.values.map(([title, body]) => (
            <div key={title} className="card p-5">
              <h3 className="font-bold leading-snug">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10 grid gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <h2 className="text-lg">{t.reqTitle}</h2>
          <dl className="mt-3 space-y-1.5 text-sm">
            <div className="flex gap-2">
              <dt className="text-muted">{l === 'uk' ? 'Назва' : 'Название'}:</dt>
              <dd>{SITE.legalName}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-muted">ЄДРПОУ:</dt>
              <dd className="tnum">{SITE.edrpou}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-muted">E-mail:</dt>
              <dd>
                <a href={`mailto:${SITE.email}`} className="text-primary">{SITE.email}</a>
              </dd>
            </div>
          </dl>
        </div>

        <div className="card p-5">
          <h2 className="text-lg">{t.showroom}</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            {l === 'uk' ? SITE.address.city : SITE.address.cityRu},{' '}
            {l === 'uk' ? SITE.address.street : SITE.address.streetRu}
            <br />
            {SITE.hours[l]}
          </p>
          <Link href={`${p}/kontakty/`} className="btn btn-secondary mt-4">
            {dict.nav.contacts}
          </Link>
        </div>
      </section>

      <div className="mt-10">
        <Link href={`${p}/catalog/`} className="btn btn-primary">
          {t.catalogCta} — {total} {dict.common.products}
        </Link>
      </div>
    </div>
  );
}
