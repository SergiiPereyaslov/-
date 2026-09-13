'use server';

import { redirect } from 'next/navigation';
import {
  createSession,
  destroySession,
  purgeExpiredSessions,
  verifyPassword,
  DUMMY_HASH,
} from '@/lib/auth';
import { prisma } from '@/lib/db';

export interface LoginState {
  error?: string;
  /** Повертаємо введений e-mail, щоб після помилки його не набирали заново. */
  email?: string;
}

/**
 * Скільки невдалих спроб поспіль дозволено й на скільки блокується вхід.
 *
 * Поріг свідомо не жорсткіший: блокування за e-mail означає, що сторонній
 * може навмисно замкнути менеджера, якщо знає адресу. 10 спроб зупиняють
 * перебір (із bcrypt cost 12 це вже години на кілька паролів), а 15 хвилин
 * — достатньо мало, щоб таке блокування не зірвало робочий день.
 */
const MAX_ATTEMPTS = 10;
const LOCK_MINUTES = 15;

/**
 * Вхід в адмінку.
 *
 * Повідомлення про помилку однакове для неіснуючого e-mail і невірного
 * пароля — щоб не можна було перебором з'ясувати, які адреси зареєстровані.
 * Із тієї ж причини bcrypt рахується навіть тоді, коли користувача немає:
 * інакше відповідь поверталась би помітно швидше й видавала б адресу.
 */
export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const password = String(formData.get('password') ?? '');

  if (!email || !password) return { error: 'Заповніть обидва поля', email };

  const user = await prisma.adminUser.findUnique({ where: { email } });

  if (user?.lockedUntil && user.lockedUntil > new Date()) {
    const left = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
    return { error: `Забагато спроб. Спробуйте за ${left} хв.`, email };
  }

  // Порівняння виконується завжди — і для неіснуючої адреси теж
  const ok = await verifyPassword(password, user?.passwordHash ?? DUMMY_HASH);

  if (!user || !ok) {
    if (user) {
      const failedAttempts = user.failedAttempts + 1;
      await prisma.adminUser.update({
        where: { id: user.id },
        data: {
          failedAttempts,
          lockedUntil:
            failedAttempts >= MAX_ATTEMPTS
              ? new Date(Date.now() + LOCK_MINUTES * 60 * 1000)
              : null,
        },
      });
    }
    return { error: 'Невірний e-mail або пароль', email };
  }

  if (user.failedAttempts > 0 || user.lockedUntil) {
    await prisma.adminUser.update({
      where: { id: user.id },
      data: { failedAttempts: 0, lockedUntil: null },
    });
  }

  await purgeExpiredSessions();
  await createSession(user.id);
  redirect('/admin/dashboard/');
}

export async function logout() {
  await destroySession();
  redirect('/admin/');
}
