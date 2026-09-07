import type { Metadata } from 'next';
import type { Locale } from '@/data/types';
import { SITE } from './site';
import { OG_ALT, OG_SIZE } from '@/views/og-image';

/** Спільний опис картинки для соцмереж — маршрут /og, див. views/og-image.tsx. */
const ogImage = (locale: Locale) => ({
  url: `${SITE.url}/og${locale === 'ru' ? '?l=ru' : ''}`,
  width: OG_SIZE.width,
  height: OG_SIZE.height,
  alt: OG_ALT[locale],
});

/**
 * Метадані сторінки з коректними canonical і hreflang.
 * `path` — шлях без мовного префікса, зі слешем на початку й у кінці.
 */
export function pageMeta({
  locale,
  path,
  title,
  description,
  noindex = false,
}: {
  locale: Locale;
  path: string;
  title: string;
  description: string;
  noindex?: boolean;
}): Metadata {
  const uk = `${SITE.url}${path}`;
  const ru = `${SITE.url}/ru${path}`;

  return {
    title,
    description,
    alternates: {
      canonical: locale === 'uk' ? uk : ru,
      languages: { uk, ru, 'x-default': uk },
    },
    openGraph: {
      title,
      description,
      url: locale === 'uk' ? uk : ru,
      siteName: SITE.name,
      locale: locale === 'uk' ? 'uk_UA' : 'ru_UA',
      type: 'website',
      images: [ogImage(locale)],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage(locale).url],
    },
    robots: noindex ? { index: false, follow: true } : { index: true, follow: true },
  };
}

/** Жорсткий ліміт title — виправляє проблему старого сайту з 110-символьними заголовками. */
export const clampTitle = (s: string, max = 60) =>
  s.length <= max ? s : `${s.slice(0, max - 1).trimEnd()}…`;

export const clampDescription = (s: string, max = 160) =>
  s.length <= max ? s : `${s.slice(0, max - 1).trimEnd()}…`;
