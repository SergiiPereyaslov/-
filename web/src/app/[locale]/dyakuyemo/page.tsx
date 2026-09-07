import Link from 'next/link';
import type { Metadata } from 'next';
import type { Locale } from '@/data/types';
import { getDict } from '@/i18n/dictionaries';
import { pageMeta } from '@/lib/meta';
import { SITE, formatPhone } from '@/lib/site';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const l = (locale === 'ru' ? 'ru' : 'uk') as Locale;
  return pageMeta({
    locale: l,
    path: '/dyakuyemo/',
    title: l === 'uk' ? 'Заявку прийнято' : 'Заявка принята',
    description: l === 'uk' ? 'Дякуємо за заявку' : 'Спасибо за заявку',
    noindex: true,
  });
}

export default async function ThanksPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ n?: string }>;
}) {
  const { locale } = await params;
  const { n } = await searchParams;
  const l = (locale === 'ru' ? 'ru' : 'uk') as Locale;
  const dict = getDict(l);
  const p = l === 'uk' ? '' : '/ru';

  return (
    <div className="container-page py-16">
      <div className="card mx-auto max-w-lg p-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
            <path d="M4 12.5l5 5L20 6.5" />
          </svg>
        </div>
        <h1 className="mt-4 text-2xl">{dict.thanks.title}</h1>
        {n && (
          <p className="mt-2 text-sm text-muted">
            {dict.thanks.orderNumber}: <b className="text-ink tnum">{n}</b>
          </p>
        )}
        <p className="mt-3 leading-relaxed text-muted">{dict.thanks.body}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href={`${p}/catalog/`} className="btn btn-primary">
            {dict.cart.goToCatalog}
          </Link>
          <a href={`tel:${SITE.phones[0]}`} className="btn btn-secondary tnum">
            {formatPhone(SITE.phones[0])}
          </a>
        </div>
      </div>
    </div>
  );
}
