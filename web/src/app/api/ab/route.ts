import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { AB_ENABLED, isVariant, type AbMetric } from '@/lib/ab';

/**
 * Лічильник A/B-тесту навігації.
 *
 * Приймає тільки пару «варіант + метрика» й інкрементує агрегат за добу.
 * Жодного ідентифікатора відвідувача, IP чи user-agent тут не зберігається:
 * для рішення потрібні суми, а зайві персональні дані — це зобов'язання.
 */
export const dynamic = 'force-dynamic';

const METRICS: AbMetric[] = ['sessions', 'catalog', 'cart', 'search', 'leads'];

/** Дата без часу: агрегат живе по добах, щоб бачити будні й вихідні окремо. */
export const today = () => {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
};

/** Спільна точка інкременту — нею ж користується приймання заявок. */
export async function bumpAb(variant: string, metric: AbMetric) {
  if (!AB_ENABLED || !isVariant(variant) || !METRICS.includes(metric)) return;
  const day = today();
  await prisma.abStat.upsert({
    where: { variant_day: { variant, day } },
    create: { variant, day, [metric]: 1 },
    update: { [metric]: { increment: 1 } },
  });
}

export async function POST(request: Request) {
  if (!AB_ENABLED) return NextResponse.json({ ok: true, disabled: true });

  let body: { variant?: string; metric?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const { variant, metric } = body;
  if (!isVariant(variant) || !METRICS.includes(metric as AbMetric)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  try {
    await bumpAb(variant, metric as AbMetric);
  } catch {
    // Лічильник тесту не має права зламати сторінку відвідувачу.
    return NextResponse.json({ ok: false }, { status: 200 });
  }

  return NextResponse.json({ ok: true });
}
