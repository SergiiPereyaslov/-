import 'server-only';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { prisma } from './db';

/**
 * Сесії адмінки.
 *
 * Токен зберігається в БД, а не підписується в cookie: так вихід із системи
 * і видалення користувача діють миттєво, а не чекають закінчення строку.
 * Cookie — httpOnly + sameSite=lax, тому недоступна зі скриптів сторінки.
 */
const COOKIE = 'sep_admin';
const TTL_DAYS = 14;

export const hashPassword = (plain: string) => bcrypt.hash(plain, 12);

export const verifyPassword = (plain: string, hash: string) => bcrypt.compare(plain, hash);

/** Порівняння токенів у сталий час — щоб не текла інформація через таймінг. */
const safeEqual = (a: string, b: string) => {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
};

export const createSession = async (userId: string) => {
  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + TTL_DAYS * 24 * 60 * 60 * 1000);

  await prisma.session.create({ data: { token, userId, expiresAt } });

  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires: expiresAt,
  });
};

export interface AdminSession {
  userId: string;
  email: string;
  name: string;
}

export const getSession = async (): Promise<AdminSession | null> => {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({ where: { token }, include: { user: true } });
  if (!session || !safeEqual(session.token, token)) return null;

  if (session.expiresAt < new Date()) {
    await prisma.session.delete({ where: { token } }).catch(() => undefined);
    return null;
  }

  return { userId: session.user.id, email: session.user.email, name: session.user.name };
};

export const destroySession = async () => {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) await prisma.session.delete({ where: { token } }).catch(() => undefined);
  jar.delete(COOKIE);
};

/** Прибирання протермінованих сесій — викликається при вході. */
export const purgeExpiredSessions = () =>
  prisma.session.deleteMany({ where: { expiresAt: { lt: new Date() } } });
