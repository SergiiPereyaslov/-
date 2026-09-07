import nodemailer from 'nodemailer';
import { SITE, formatPhone } from './site';

/**
 * Сповіщення менеджера про нову заявку.
 *
 * Обидва канали необов'язкові й вмикаються наявністю змінних оточення.
 * Помилка каналу ніколи не валить запит: заявка вже збережена в БД,
 * а причина невдачі пишеться в поле notifyError, щоб її було видно
 * в адмінці й не довелось шукати в логах.
 */
export interface LeadNotification {
  number: string;
  kind: string;
  name?: string | null;
  phone: string;
  email?: string | null;
  company?: string | null;
  comment?: string | null;
  delivery?: string | null;
  customerType?: string | null;
  city?: string | null;
  source?: string | null;
  locale: string;
  items: { sku: string; name: string; packs: number; sum: number }[];
  total?: number | null;
}

const KIND_LABEL: Record<string, string> = {
  quote: 'Запит прайсу',
  order: 'Замовлення',
  branding: 'Брендування',
};

const DELIVERY_LABEL: Record<string, string> = {
  pickup: 'Самовивіз',
  city: 'Доставка по Дніпру',
  np: 'Нова пошта',
};

const line = (label: string, value?: string | null) => (value ? `${label}: ${value}` : null);

/** Один текст для Telegram і для листа — щоб не розходились. */
export const formatLead = (lead: LeadNotification) => {
  const rows = [
    `${KIND_LABEL[lead.kind] ?? lead.kind} ${lead.number}`,
    '',
    line('Імʼя', lead.name),
    `Телефон: ${formatPhone(lead.phone)}`,
    line('E-mail', lead.email),
    line('Заклад', lead.company),
    line('Отримання', lead.delivery ? (DELIVERY_LABEL[lead.delivery] ?? lead.delivery) : null),
    line('Місто/відділення', lead.city),
    line('Тип клієнта', lead.customerType === 'company' ? 'ФОП / ТОВ' : lead.customerType ? 'Фізична особа' : null),
    line('Джерело', lead.source),
    line('Мова', lead.locale),
    line('Коментар', lead.comment),
  ].filter(Boolean);

  if (lead.items.length) {
    rows.push('', 'Замовлення:');
    for (const i of lead.items) {
      rows.push(`  • ${i.name} — ${i.packs} пач. = ${i.sum.toFixed(2)} грн (${i.sku})`);
    }
    if (lead.total != null) rows.push(`Разом: ${lead.total.toFixed(2)} грн`);
  }

  return rows.join('\n');
};

const sendTelegram = async (text: string) => {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return null;

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true }),
    signal: AbortSignal.timeout(8000),
  });

  if (!res.ok) throw new Error(`Telegram ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return 'telegram';
};

const sendEmail = async (subject: string, text: string) => {
  const host = process.env.SMTP_HOST;
  const to = process.env.LEAD_EMAIL_TO || SITE.email;
  if (!host || !to) return null;

  const transport = nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: Number(process.env.SMTP_PORT ?? 587) === 465,
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD ?? '' }
      : undefined,
  });

  await transport.sendMail({
    from: process.env.SMTP_USER || to,
    to,
    subject,
    text,
  });
  return 'email';
};

export interface NotifyResult {
  delivered: string[];
  error: string | null;
}

/** Надсилає в усі налаштовані канали; повертає, що вдалось і що ні. */
export const notifyLead = async (lead: LeadNotification): Promise<NotifyResult> => {
  const text = formatLead(lead);
  const subject = `${KIND_LABEL[lead.kind] ?? 'Заявка'} ${lead.number} — ${formatPhone(lead.phone)}`;

  const results = await Promise.allSettled([sendTelegram(text), sendEmail(subject, text)]);

  const delivered = results
    .filter((r) => r.status === 'fulfilled' && r.value)
    .map((r) => (r as PromiseFulfilledResult<string>).value);

  const errors = results
    .filter((r) => r.status === 'rejected')
    .map((r) => String((r as PromiseRejectedResult).reason));

  if (!delivered.length && !errors.length) {
    return { delivered: [], error: 'Канали сповіщень не налаштовані (TELEGRAM_BOT_TOKEN / SMTP_HOST)' };
  }

  return { delivered, error: errors.length ? errors.join(' | ') : null };
};
