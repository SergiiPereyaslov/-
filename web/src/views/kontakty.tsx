import type { Metadata } from 'next';
import type { Locale } from '@/data/types';
import { getDict } from '@/i18n/dictionaries';
import { pageMeta } from '@/lib/meta';
import { SITE, formatPhone } from '@/lib/site';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { QuoteForm } from '@/components/QuoteForm';

export async function meta(l: Locale): Promise<Metadata> {
  return pageMeta({
    locale: l,
    path: '/kontakty/',
    title: l === 'uk' ? 'Контакти, склад і шоурум у Дніпрі' : 'Контакты, склад и шоурум в Днепре',
    description:
      l === 'uk'
        ? 'Дніпро, пр. О. Поля, 82 г — склад і шоурум. Пн–Пт 09:00–18:00. Телефони, Telegram, Viber, e-mail для замовлень і прайсу.'
        : 'Днепр, пр. А. Поля, 82 г — склад и шоурум. Пн–Пт 09:00–18:00. Телефоны, Telegram, Viber, e-mail для заказов и прайса.',
  });
}

export default function ContactsPage({ locale: l }: { locale: Locale }) {
  const dict = getDict(l);
  const address = l === 'uk' ? SITE.address.street : SITE.address.streetRu;
  const city = l === 'uk' ? SITE.address.city : SITE.address.cityRu;
  const mapQuery = encodeURIComponent(`${city}, ${address}`);

  return (
    <div className="container-page pb-12">
      <Breadcrumbs
        locale={l}
        label={dict.a11y.breadcrumb}
        items={[{ label: dict.nav.home, href: '/' }, { label: dict.nav.contacts }]}
      />

      <h1 className="text-3xl">{dict.nav.contacts}</h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px] lg:items-start">
        <div className="space-y-6">
          <div className="card p-5">
            <h2 className="text-lg">{l === 'uk' ? 'Зв’язатися з нами' : 'Связаться с нами'}</h2>
            <ul className="mt-4 space-y-3">
              {SITE.phones.map((p) => (
                <li key={p}>
                  <a href={`tel:${p}`} className="font-display text-xl font-bold text-primary tnum">
                    {formatPhone(p)}
                  </a>
                </li>
              ))}
              <li>
                <a href={`mailto:${SITE.email}`} className="text-primary hover:underline">
                  {SITE.email}
                </a>
              </li>
            </ul>
            <div className="mt-4 flex flex-wrap gap-2">
              <a href={SITE.telegram} className="btn btn-secondary !min-h-9" target="_blank" rel="noopener">
                Telegram
              </a>
              <a href={SITE.viber} className="btn btn-secondary !min-h-9">
                Viber
              </a>
            </div>
          </div>

          <div className="card p-5">
            <h2 className="text-lg">{l === 'uk' ? 'Склад і шоурум' : 'Склад и шоурум'}</h2>
            <address className="mt-3 not-italic leading-relaxed text-muted">
              {city}, {address}
              <br />
              {SITE.hours[l]}
            </address>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              {l === 'uk'
                ? 'У шоурумі можна подивитися й помацати зразки перед замовленням, а також забрати замовлення самовивозом — це безкоштовно.'
                : 'В шоуруме можно посмотреть и потрогать образцы перед заказом, а также забрать заказ самовывозом — это бесплатно.'}
            </p>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`}
              target="_blank"
              rel="noopener"
              className="btn btn-secondary mt-4 !min-h-9"
            >
              {l === 'uk' ? 'Відкрити на карті' : 'Открыть на карте'}
            </a>
          </div>

          <div className="card p-5">
            <h2 className="text-lg">{l === 'uk' ? 'Реквізити' : 'Реквизиты'}</h2>
            <dl className="mt-3 space-y-1.5 text-sm">
              <div className="flex gap-2">
                <dt className="text-muted">{l === 'uk' ? 'Назва' : 'Название'}:</dt>
                <dd>{SITE.legalName}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="text-muted">ЄДРПОУ:</dt>
                <dd className="tnum">{SITE.edrpou}</dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="card p-5 lg:sticky lg:top-32">
          <h2 className="text-lg">{dict.forms.quoteTitle}</h2>
          <p className="mt-2 text-sm text-muted">{dict.forms.quoteBody}</p>
          <div className="mt-4">
            <QuoteForm locale={l} dict={dict} source="contacts" />
          </div>
        </div>
      </div>
    </div>
  );
}
