import type { Metadata } from 'next';
import { headers } from 'next/headers';
import type { Locale } from '@/data/types';
import { SiteLayout } from '@/views/site-layout';
import NotFoundView from '@/views/not-found';
import { LOCALE_HEADER } from '@/proxy';

/**
 * 404 для адрес, які не належать жодному мовному дереву.
 *
 * Звичайний not-found.tsx тут не спрацює: коренів layout два — (uk) і (ru) —
 * і для невідомого шляху Next не може обрати, чий саме показати. Тому
 * сторінка сама рендерить оболонку, а мову бере із заголовка, який
 * проставляє proxy: інакше відвідувач /ru/… бачив би українську сторінку.
 */
export const metadata: Metadata = {
  title: 'Сторінку не знайдено | SmartEcoPack',
  robots: { index: false, follow: true },
};

export default async function GlobalNotFound() {
  const locale: Locale = (await headers()).get(LOCALE_HEADER) === 'ru' ? 'ru' : 'uk';

  return (
    <SiteLayout locale={locale}>
      <NotFoundView locale={locale} />
    </SiteLayout>
  );
}
