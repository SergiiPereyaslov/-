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
  brandInTitle = true,
}: {
  locale: Locale;
  path: string;
  title: string;
  description: string;
  noindex?: boolean;
  /**
   * false — заголовок іде у видачу як є, без « | SmartEcoPack».
   * Використовується на картках товару: там ці 15 символів коштують
   * ключового параметра в назві. Див. TITLE_LIMIT_NO_BRAND.
   */
  brandInTitle?: boolean;
}): Metadata {
  const uk = `${SITE.url}${path}`;
  const ru = `${SITE.url}/ru${path}`;

  return {
    // absolute вимикає шаблон «%s | SmartEcoPack» кореневого layout
    title: brandInTitle ? title : { absolute: title },
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

export {
  TITLE_LIMIT,
  BRAND_SUFFIX_LENGTH,
  TITLE_LIMIT_NO_BRAND,
  CATEGORY_NAME_LIMIT,
  DESCRIPTION_MIN,
  DESCRIPTION_MAX,
  clampTitle,
  clampDescription,
  fitTitle,
  fitDescription,
  shortenProductName,
} from './meta-text';
