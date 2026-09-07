import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Inter, Manrope } from 'next/font/google';
import '../globals.css';
import { LOCALES, type Locale } from '@/data/types';
import { GROUPS, CATEGORY_BY_SLUG } from '@/data/taxonomy';
import { getDict } from '@/i18n/dictionaries';
import { SITE, formatPhone, canonical } from '@/lib/site';
import { CartProvider } from '@/components/CartProvider';
import { Header, type NavGroup } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { themeScript } from '@/components/ThemeToggle';
import { JsonLd } from '@/components/JsonLd';
import { FloatingContacts } from '@/components/FloatingContacts';

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-inter',
  display: 'swap',
});

const manrope = Manrope({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-manrope',
  display: 'swap',
});

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const l = (locale === 'ru' ? 'ru' : 'uk') as Locale;

  return {
    metadataBase: new URL(SITE.url),
    title: {
      default:
        l === 'uk'
          ? 'Паперова упаковка для їжі оптом — SmartEcoPack Дніпро'
          : 'Бумажная упаковка для еды оптом — SmartEcoPack Днепр',
      template: '%s | SmartEcoPack',
    },
    description:
      l === 'uk'
        ? 'Паперова та крафтова упаковка для кав’ярень, фастфуду й доставки. Власний склад у Дніпрі, доставка за 24 години, друк логотипу від 100 шт.'
        : 'Бумажная и крафтовая упаковка для кофеен, фастфуда и доставки. Собственный склад в Днепре, доставка за 24 часа, печать логотипа от 100 шт.',
    alternates: {
      canonical: canonical(l, '/'),
      languages: {
        uk: `${SITE.url}/`,
        ru: `${SITE.url}/ru/`,
        'x-default': `${SITE.url}/`,
      },
    },
    openGraph: {
      type: 'website',
      siteName: SITE.name,
      locale: l === 'uk' ? 'uk_UA' : 'ru_UA',
      url: canonical(l, '/'),
    },
    robots: { index: true, follow: true },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!(LOCALES as readonly string[]).includes(locale)) notFound();
  const l = locale as Locale;
  const dict = getDict(l);

  // Слім-дерево навігації: клієнтський Header не має тягнути SEO-тексти таксономії.
  const nav: NavGroup[] = GROUPS.map((g) => ({
    slug: g.slug,
    name: g.name[l],
    categories: g.categories
      .map((slug) => CATEGORY_BY_SLUG.get(slug))
      .filter((c) => c !== undefined)
      .map((c) => ({ slug: c.slug, name: c.name[l] })),
  }));

  const address = l === 'uk' ? SITE.address.street : SITE.address.streetRu;
  const city = l === 'uk' ? SITE.address.city : SITE.address.cityRu;

  const organization = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${SITE.url}/#organization`,
    name: SITE.name,
    legalName: SITE.legalName,
    url: SITE.url,
    email: SITE.email,
    telephone: SITE.phones,
    taxID: SITE.edrpou,
    address: {
      '@type': 'PostalAddress',
      streetAddress: address,
      addressLocality: city,
      addressRegion: SITE.address.region,
      postalCode: SITE.address.postalCode,
      addressCountry: SITE.address.country,
    },
  };

  return (
    <html lang={l} className={`${inter.variable} ${manrope.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="flex min-h-screen flex-col">
        <CartProvider>
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded focus:bg-primary focus:px-4 focus:py-2 focus:text-on-primary"
          >
            {l === 'uk' ? 'Перейти до вмісту' : 'Перейти к содержимому'}
          </a>
          <Header
            locale={l}
            dict={dict}
            nav={nav}
            phone={formatPhone(SITE.phones[0])}
            phoneHref={`tel:${SITE.phones[0]}`}
            addressLine={`${city}, ${address}`}
            hours={SITE.hours[l]}
          />
          <main id="main" className="flex-1">
            {children}
          </main>
          <Footer locale={l} dict={dict} nav={nav} />
          <FloatingContacts phone={SITE.phones[0]} telegram={SITE.telegram} viber={SITE.viber} />
        </CartProvider>
        <JsonLd data={organization} />
      </body>
    </html>
  );
}
