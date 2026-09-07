/**
 * Створення або оновлення користувача адмінки.
 *
 *   npm run admin:create -- sales@smartecopack.com "надійний-пароль" "Ім'я"
 *
 * Пароль не приймається з stdin навмисно: скрипт запускають один раз при
 * розгортанні, а далі паролі змінюються в самій адмінці.
 */
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '../src/generated/prisma/client.js';

const [email, password, name] = process.argv.slice(2);

if (!email || !password) {
  console.error('Використання: npm run admin:create -- <email> <пароль> [ім\'я]');
  process.exit(1);
}
if (password.length < 10) {
  console.error('Пароль закороткий: мінімум 10 символів.');
  process.exit(1);
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL ?? '' }),
});

const passwordHash = await bcrypt.hash(password, 12);
const user = await prisma.adminUser.upsert({
  where: { email },
  create: { email, passwordHash, name: name ?? email },
  update: { passwordHash, ...(name ? { name } : {}) },
});

console.log(`Готово: ${user.email} (${user.name})`);
await prisma.$disconnect();
