import 'dotenv/config';
import { defineConfig } from 'prisma/config';

/**
 * Prisma 7 більше не читає URL зі schema.prisma — рядок підключення
 * задається тут і в адаптері клієнта (src/lib/db.ts).
 */
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'node --experimental-strip-types prisma/seed.ts',
  },
  datasource: {
    url: process.env.DATABASE_URL ?? '',
  },
});
