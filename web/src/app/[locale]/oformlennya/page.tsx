import type { Metadata } from 'next';
import type { Locale } from '@/data/types';
import { getDict } from '@/i18n/dictionaries';
import { pageMeta } from '@/lib/meta';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { CheckoutForm } from '@/components/CheckoutForm';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const l = (locale === 'ru' ? 'ru' : 'uk') as Locale;
  return pageMeta({
    locale: l,
    path: '/oformlennya/',
    title: l === 'uk' ? 'Оформлення заявки' : 'Оформление заявки',
    description: l === 'uk' ? 'Оформлення замовлення' : 'Оформление заказа',
    noindex: true,
  });
}

export default async function CheckoutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const l = (locale === 'ru' ? 'ru' : 'uk') as Locale;
  const dict = getDict(l);

  return (
    <div className="container-page pb-12">
      <Breadcrumbs
        locale={l}
        label={dict.a11y.breadcrumb}
        items={[
          { label: dict.nav.home, href: '/' },
          { label: dict.cart.title, href: '/koshyk/' },
          { label: dict.checkout.title },
        ]}
      />
      <h1 className="text-3xl">{dict.checkout.title}</h1>
      <CheckoutForm locale={l} dict={dict} />
    </div>
  );
}
