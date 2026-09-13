import { SITE } from '@/lib/site';

/**
 * Канал для дослідників безпеки (RFC 9116).
 *
 * Не статичний файл у public/, а маршрут — саме через поле Expires: стандарт
 * вимагає його, а прострочений файл вважається недійсним. Тут дата завжди
 * рахується на рік уперед від запиту, тож нагадувати про щорічне оновлення
 * нікому не доведеться.
 */
export const dynamic = 'force-dynamic';

export function GET() {
  const expires = new Date();
  expires.setUTCFullYear(expires.getUTCFullYear() + 1);

  const body = [
    `Contact: mailto:${SITE.email}`,
    `Expires: ${expires.toISOString().replace(/\.\d{3}Z$/, 'Z')}`,
    'Preferred-Languages: uk, en, ru',
    `Canonical: ${SITE.url}/.well-known/security.txt`,
    '',
  ].join('\n');

  return new Response(body, {
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'public, max-age=86400',
    },
  });
}
