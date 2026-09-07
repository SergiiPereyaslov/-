import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@/generated/prisma/client';

/**
 * Єдиний екземпляр Prisma на процес.
 *
 * У dev Next перезавантажує модулі на кожну зміну, тому клієнт кешується
 * в globalThis — інакше кожен hot-reload відкривав би новий пул з'єднань
 * і Postgres швидко впирався б у ліміт.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const createClient = () => {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      'Не задано DATABASE_URL. Скопіюйте .env.example у .env і вкажіть рядок підключення.',
    );
  }
  return new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });
};

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
