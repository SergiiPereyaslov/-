import { NextResponse } from 'next/server';

/**
 * Приймання заявок.
 *
 * Зараз лід логується на сервері — це навмисна заглушка до підключення
 * бойового каналу. Перед запуском сюди додається одна з інтеграцій:
 * Telegram Bot API (найшвидше для менеджера), SMTP або CRM.
 * Формат тіла запиту фіксований, тож інтеграція не зачіпає клієнтський код.
 */
export const dynamic = 'force-dynamic';

interface Lead {
  kind: 'quote' | 'order' | 'branding';
  name?: string;
  phone: string;
  email?: string;
  company?: string;
  comment?: string;
  source?: string;
  locale?: string;
  items?: { sku: string; name: string; packs: number; sum: number }[];
  total?: number;
}

const PHONE_RE = /^\+?380\d{9}$/;

export async function POST(request: Request) {
  let body: Lead;
  try {
    body = (await request.json()) as Lead;
  } catch {
    return NextResponse.json({ ok: false, error: 'bad_json' }, { status: 400 });
  }

  const phone = String(body.phone ?? '').replace(/[\s()-]/g, '');
  if (!PHONE_RE.test(phone)) {
    return NextResponse.json({ ok: false, error: 'bad_phone' }, { status: 422 });
  }

  const orderNumber = `SEP-${Date.now().toString(36).toUpperCase().slice(-6)}`;

  console.info('[lead]', JSON.stringify({ ...body, phone, orderNumber }));

  return NextResponse.json({ ok: true, orderNumber });
}
