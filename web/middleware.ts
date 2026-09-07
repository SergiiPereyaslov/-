import { NextResponse, type NextRequest } from 'next/server';
import { legacyTarget } from '@/lib/legacy-redirects';

/**
 * Маршрутизація на межі застосунку.
 *
 * 1. 301 зі старих URL — першими, щоб перехід був за один хоп.
 * 2. /uk/… → корінь: українська версія канонічна без префікса.
 * 3. Нормалізація завершального слеша (вбудована вимкнена в next.config).
 * 4. Кореневі шляхи переписуються на /uk/…, які обслуговує сегмент [locale].
 */
const HAS_EXTENSION = /\.[a-z0-9]+$/i;

/**
 * Будуємо ціль через звичайний URL, а не nextUrl.clone(): NextURL
 * підганяє завершальний слеш нового шляху під слеш вхідного запиту,
 * через що /branding вело на /brenduvannya без слеша — і далі в цикл.
 */
const redirect301 = (request: NextRequest, pathname: string) => {
  const url = new URL(request.url);
  url.pathname = pathname;
  return NextResponse.redirect(url.toString(), 301);
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    HAS_EXTENSION.test(pathname)
  ) {
    return NextResponse.next();
  }

  const isRu = pathname === '/ru' || pathname.startsWith('/ru/');
  const isUk = pathname === '/uk' || pathname.startsWith('/uk/');
  const prefix = isRu ? '/ru' : '';
  const bare = (isRu || isUk ? pathname.slice(3) : pathname) || '/';

  const legacy = legacyTarget(bare);
  if (legacy) return redirect301(request, `${prefix}${legacy}`);

  if (isUk) return redirect301(request, bare.endsWith('/') ? bare : `${bare}/`);

  if (!pathname.endsWith('/')) return redirect301(request, `${pathname}/`);

  if (isRu) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = `/uk${pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)'],
};
