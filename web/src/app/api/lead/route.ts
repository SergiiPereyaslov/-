import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { notifyLead, type LeadNotification } from '@/lib/notify';
import type { LeadKind } from '@/generated/prisma/client';
import { isVariant } from '@/lib/ab';
import { bumpAb } from '@/app/api/ab/route';

/**
 * Приймання заявок.
 *
 * Порядок дій навмисний: спершу запис у БД, і лише потім спроба сповістити
 * менеджера. Якщо Telegram недоступний або SMTP відмовив, заявка все одно
 * збережена — її видно в адмінці з поміткою про невдалу доставку.
 */
export const dynamic = 'force-dynamic';

interface Body {
  kind?: string;
  name?: string;
  phone?: string;
  email?: string;
  company?: string;
  comment?: string;
  delivery?: string;
  customer?: string;
  city?: string;
  requisites?: string;
  source?: string;
  locale?: string;
  items?: { sku: string; name: string; packs: number; sum: number }[];
  total?: number;
  /** Варіант навігації, у якому відвідувач дійшов до заявки. */
  abVariant?: string;
}

const PHONE_RE = /^\+?380\d{9}$/;
const KINDS = new Set(['quote', 'order', 'branding']);

/** Короткий читабельний номер: менеджер називає його клієнту в розмові. */
const makeNumber = () =>
  `SEP-${Date.now().toString(36).toUpperCase().slice(-6)}${Math.floor(Math.random() * 10)}`;

const clamp = (v: unknown, max: number) =>
  typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null;

/** Верхня межа суми: більше за це — не замовлення, а сміття або помилка. */
const MAX_TOTAL = 100_000_000;

const money = (v: unknown) =>
  typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= MAX_TOTAL ? v : null;

/**
 * Позиції кошика приходять з клієнта й лягають у БД як JSON. Тому кожне поле
 * обрізається окремо: без цього в заявку можна було б покласти мегабайт тексту
 * в `name` — ліміт на 200 позицій від цього не рятує.
 *
 * Суми тут — заявлені клієнтом, а не перераховані сервером: менеджер усе одно
 * підтверджує рахунок вручну. В адмінці вони підписані саме так.
 */
const cleanItems = (raw: unknown) => {
  if (!Array.isArray(raw)) return [];
  return raw.slice(0, 200).flatMap((item) => {
    if (!item || typeof item !== 'object') return [];
    const i = item as Record<string, unknown>;
    const sku = clamp(i.sku, 64);
    const name = clamp(i.name, 200);
    if (!sku && !name) return [];
    const packs = typeof i.packs === 'number' && Number.isFinite(i.packs) ? Math.trunc(i.packs) : 0;
    return [
      {
        sku: sku ?? '',
        name: name ?? '',
        packs: Math.min(Math.max(packs, 0), 1_000_000),
        sum: money(i.sum) ?? 0,
      },
    ];
  });
};

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, error: 'bad_json' }, { status: 400 });
  }

  const phone = String(body.phone ?? '').replace(/[\s()-]/g, '');
  if (!PHONE_RE.test(phone)) {
    return NextResponse.json({ ok: false, error: 'bad_phone' }, { status: 422 });
  }

  const kind = (KINDS.has(String(body.kind)) ? body.kind : 'quote') as LeadKind;
  const items = cleanItems(body.items);
  const number = makeNumber();

  let lead;
  try {
    lead = await prisma.lead.create({
      data: {
        number,
        kind,
        phone,
        name: clamp(body.name, 120),
        email: clamp(body.email, 160),
        company: clamp(body.company, 160),
        comment: clamp(body.comment, 4000),
        delivery: clamp(body.delivery, 32),
        customerType: clamp(body.customer, 32),
        city: clamp(body.city, 160),
        requisites: clamp(body.requisites, 4000),
        source: clamp(body.source, 64),
        locale: body.locale === 'ru' ? 'ru' : 'uk',
        items,
        total: money(body.total),
        abVariant: isVariant(body.abVariant) ? body.abVariant : null,
      },
    });
  } catch (e) {
    console.error('[lead] не вдалося зберегти заявку', e);
    return NextResponse.json({ ok: false, error: 'storage_failed' }, { status: 500 });
  }

  // Сповіщення — після збереження й поза критичним шляхом відповіді клієнту
  const payload: LeadNotification = {
    number: lead.number,
    kind: lead.kind,
    name: lead.name,
    phone: lead.phone,
    email: lead.email,
    company: lead.company,
    comment: lead.comment,
    delivery: lead.delivery,
    customerType: lead.customerType,
    city: lead.city,
    source: lead.source,
    locale: lead.locale,
    items,
    total: lead.total ? Number(lead.total.toString()) : null,
  };

  try {
    const result = await notifyLead(payload);
    await prisma.lead.update({
      where: { id: lead.id },
      data: { notified: result.delivered.length > 0, notifyError: result.error },
    });
  } catch (e) {
    await prisma.lead.update({
      where: { id: lead.id },
      data: { notified: false, notifyError: String(e).slice(0, 2000) },
    });
  }

  // Заявка — ключова метрика тесту. Рахуємо тут, а не на клієнті: сторінка
  // «дякуємо» може не відкритися, а заявка вже є.
  if (lead.abVariant) {
    try {
      await bumpAb(lead.abVariant, 'leads');
    } catch {
      /* лічильник тесту ніколи не блокує відповідь клієнту */
    }
  }

  return NextResponse.json({ ok: true, orderNumber: lead.number });
}
