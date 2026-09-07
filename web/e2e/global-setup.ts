import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '../src/generated/prisma/client.js';

export const E2E_ADMIN = {
  email: process.env.E2E_ADMIN_EMAIL ?? 'e2e@smartecopack.test',
  password: process.env.E2E_ADMIN_PASSWORD ?? 'e2e-parol-12345',
};

/**
 * Готує окремого користувача для тестів адмінки, щоб вони не залежали від
 * того, кого створили руками при розгортанні.
 */
export default async function globalSetup() {
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL ?? '' }),
  });

  const passwordHash = await bcrypt.hash(E2E_ADMIN.password, 10);
  await prisma.adminUser.upsert({
    where: { email: E2E_ADMIN.email },
    create: { email: E2E_ADMIN.email, passwordHash, name: 'E2E' },
    update: { passwordHash },
  });

  await prisma.$disconnect();
}
