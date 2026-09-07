'use server';

import { redirect } from 'next/navigation';
import { createSession, destroySession, purgeExpiredSessions, verifyPassword } from '@/lib/auth';
import { prisma } from '@/lib/db';

export interface LoginState {
  error?: string;
  /** Повертаємо введений e-mail, щоб після помилки його не набирали заново. */
  email?: string;
}

/**
 * Вхід в адмінку.
 *
 * Повідомлення про помилку однакове для неіснуючого e-mail і невірного
 * пароля — щоб не можна було перебором з'ясувати, які адреси зареєстровані.
 */
export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const password = String(formData.get('password') ?? '');

  if (!email || !password) return { error: 'Заповніть обидва поля', email };

  const user = await prisma.adminUser.findUnique({ where: { email } });
  const ok = user ? await verifyPassword(password, user.passwordHash) : false;

  if (!user || !ok) return { error: 'Невірний e-mail або пароль', email };

  await purgeExpiredSessions();
  await createSession(user.id);
  redirect('/admin/dashboard/');
}

export async function logout() {
  await destroySession();
  redirect('/admin/');
}
