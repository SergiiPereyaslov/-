import { NextResponse, type NextRequest } from 'next/server';

/**
 * Українська версія живе в корені (/catalog/…), російська — під /ru.
 * Внутрішньо обидві обслуговує сегмент [locale], тому кореневі шляхи
 * переписуються на /uk/…, а прямі звернення до /uk/… редиректяться
 * у корінь, щоб не плодити дублі.
 */
const HAS_EXTENSION = /\.[a-z0-9]+$/i;

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    HAS_EXTENSION.test(pathname)
  ) {
    return NextResponse.next();
  }

  if (pathname === '/uk' || pathname.startsWith('/uk/')) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.replace(/^\/uk/, '') || '/';
    return NextResponse.redirect(url, 301);
  }

  if (pathname === '/ru' || pathname.startsWith('/ru/')) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = `/uk${pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)'],
};
