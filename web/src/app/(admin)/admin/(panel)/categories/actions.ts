'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { revalidateCategory } from '@/lib/revalidate';

const requireSession = async () => {
  if (!(await getSession())) throw new Error('Немає доступу');
};

/** Абзаци SEO-тексту редагуються як звичайний текст, порожній рядок — розділювач. */
const paragraphs = (uk: string, ru: string) => {
  const a = uk.split(/\n{2,}/).map((s) => s.trim()).filter(Boolean);
  const b = ru.split(/\n{2,}/).map((s) => s.trim()).filter(Boolean);
  return a.map((text, i) => ({ uk: text, ru: b[i] ?? text }));
};

export async function saveCategory(formData: FormData) {
  await requireSession();

  const slug = String(formData.get('slug') ?? '');
  if (!slug) throw new Error('Немає слага');

  let faq: unknown;
  try {
    faq = JSON.parse(String(formData.get('faq') ?? '[]'));
  } catch {
    throw new Error('Поле «Часті питання» містить некоректний JSON');
  }

  const category = await prisma.category.update({
    where: { slug },
    data: {
      nameUk: String(formData.get('nameUk') ?? '').trim(),
      nameRu: String(formData.get('nameRu') ?? '').trim(),
      h1Uk: String(formData.get('h1Uk') ?? '').trim(),
      h1Ru: String(formData.get('h1Ru') ?? '').trim(),
      introUk: String(formData.get('introUk') ?? '').trim(),
      introRu: String(formData.get('introRu') ?? '').trim(),
      seo: paragraphs(
        String(formData.get('seoUk') ?? ''),
        String(formData.get('seoRu') ?? ''),
      ) as never,
      faq: faq as never,
    },
  });

  revalidateCategory(slug, category.groupSlug);
  revalidatePath('/admin/categories/');
  redirect('/admin/categories/?saved=1');
}
