import { renderOgImage } from '@/views/og-image';

/** Картинка для соцмереж: /og віддає українську, /og?l=ru — російську. */
export function GET(request: Request) {
  const locale = new URL(request.url).searchParams.get('l') === 'ru' ? 'ru' : 'uk';
  return renderOgImage(locale);
}
