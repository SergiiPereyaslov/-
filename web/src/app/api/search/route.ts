import { NextResponse } from 'next/server';
import { searchProducts } from '@/lib/catalog';
import { LOCALES, type Locale } from '@/data/types';

export const dynamic = 'force-static';

export function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') ?? '';
  const raw = searchParams.get('locale') ?? 'uk';
  const locale: Locale = (LOCALES as readonly string[]).includes(raw) ? (raw as Locale) : 'uk';

  const hits = searchProducts(q, locale).map((p) => ({
    slug: p.slug,
    name: p.name[locale],
    spec: p.spec[locale],
    sku: p.sku,
    price: p.priceRetail,
    shape: p.shape ?? 'box',
  }));

  return NextResponse.json(hits);
}
