import { NextResponse, type NextRequest } from 'next/server';
import { legacyTarget } from '@/lib/legacy-redirects';

/**
 * Middleware робить лише перенаправлення — жодних rewrite.
 *
 * Переписування шляху ламає клієнтську навігацію App Router: RSC-запити
 * до переписаної адреси повертають 404, і переходи по сайту перестають
 * працювати. Тому обидві мовні версії — реальні дерева маршрутів
 * (src/app/(uk) і src/app/(ru)/ru), а тут лишаються тільки 301.
 */
const HAS_EXTENSION = /\.[a-z0-9]+$/i;

const redirect301 = (request: NextRequest, pathname: string) => {
  // Звичайний URL, а не nextUrl.clone(): NextURL підганяє завершальний слеш
  // цілі під слеш вхідного запиту й ламає редирект.
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

  // 301 зі старих URL — до нормалізації слеша, щоб перехід був за один хоп
  const legacy = legacyTarget(bare);
  if (legacy) return redirect301(request, `${prefix}${legacy}`);

  // /uk/… — технічний шлях: канонічна українська версія живе в корені
  if (isUk) return redirect301(request, bare.endsWith('/') ? bare : `${bare}/`);

  // Нормалізація слеша (вбудована вимкнена в next.config, див. коментар там)
  if (!pathname.endsWith('/')) return redirect301(request, `${pathname}/`);

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)'],
};
