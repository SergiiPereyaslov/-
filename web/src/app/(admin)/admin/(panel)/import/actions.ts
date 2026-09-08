'use server';

import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { importProducts } from '@/lib/product-import';
import { revalidateEverything } from '@/lib/revalidate';

export interface ImportState {
  status: 'idle' | 'ok' | 'error';
  message?: string;
  errors?: string[];
  /** Товари без слага: імпортуються, але втрачають старе посилання. */
  warnings?: string[];
  imported?: number;
  emptyCategories?: string[];
}

const MAX_BYTES = 5 * 1024 * 1024;

/**
 * Завантаження каталогу файлом.
 *
 * Правила ті самі, що й у CLI (`npm run catalog:import`) — спільний модуль
 * product-import. Якщо у файлі є хоч одна помилка, не пишеться нічого:
 * половина імпортованого каталогу гірша за жодного.
 */
export async function runImport(_prev: ImportState, formData: FormData): Promise<ImportState> {
  if (!(await getSession())) return { status: 'error', message: 'Немає доступу' };

  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) {
    return { status: 'error', message: 'Оберіть CSV-файл' };
  }
  if (file.size > MAX_BYTES) {
    return { status: 'error', message: 'Файл більший за 5 МБ' };
  }

  const csv = await file.text();
  const categories = await prisma.category.findMany({ select: { slug: true } });
  const { products, errors, warnings, emptyCategories } = importProducts(
    csv,
    new Set(categories.map((c) => c.slug)),
  );

  if (errors.length) {
    return {
      status: 'error',
      message: `Імпорт не виконано: знайдено ${errors.length} помилок. Нічого не змінено.`,
      errors: errors.slice(0, 60),
    };
  }

  await prisma.$transaction(
    products.map((p, i) => {
      const { slug, ...rest } = p;
      const data = { ...rest, sortOrder: i };
      return prisma.product.upsert({
        where: { slug },
        create: { slug, ...data },
        update: data,
      });
    }),
  );

  revalidateEverything();
  revalidatePath('/admin/products/');

  return {
    status: 'ok',
    message: `Імпортовано ${products.length} товарів, сторінки сайту оновлено.`,
    imported: products.length,
    warnings: warnings.slice(0, 60),
    emptyCategories,
  };
}
