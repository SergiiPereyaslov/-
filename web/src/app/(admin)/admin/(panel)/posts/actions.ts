'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { revalidatePost } from '@/lib/revalidate';
import { slugify } from '@/lib/product-import';

const requireSession = async () => {
  if (!(await getSession())) throw new Error('Немає доступу');
};

/** Абзаци статті: порожній рядок розділяє, «## » на початку робить підзаголовок. */
const paragraphs = (uk: string, ru: string) => {
  const a = uk.split(/\n{2,}/).map((s) => s.trim()).filter(Boolean);
  const b = ru.split(/\n{2,}/).map((s) => s.trim()).filter(Boolean);
  return a.map((text, i) => ({ uk: text, ru: b[i] ?? text }));
};

export async function savePost(formData: FormData) {
  await requireSession();

  const isNew = String(formData.get('isNew') ?? '') === '1';
  const titleUk = String(formData.get('titleUk') ?? '').trim();
  if (!titleUk) throw new Error('Потрібен заголовок');

  const slug = String(formData.get('slug') ?? '').trim() || slugify(titleUk);
  const dateRaw = String(formData.get('publishedAt') ?? '').trim();
  const publishedAt = dateRaw ? new Date(dateRaw) : new Date();
  if (Number.isNaN(publishedAt.getTime())) throw new Error('Некоректна дата');

  const data = {
    publishedAt,
    titleUk,
    titleRu: String(formData.get('titleRu') ?? '').trim() || titleUk,
    excerptUk: String(formData.get('excerptUk') ?? '').trim(),
    excerptRu: String(formData.get('excerptRu') ?? '').trim(),
    body: paragraphs(
      String(formData.get('bodyUk') ?? ''),
      String(formData.get('bodyRu') ?? ''),
    ) as never,
    related: String(formData.get('related') ?? '')
      .split(/[,\s]+/)
      .map((s) => s.trim())
      .filter(Boolean),
    published: formData.get('published') === 'on',
  };

  if (isNew) {
    const exists = await prisma.post.findUnique({ where: { slug } });
    if (exists) throw new Error(`Стаття зі слагом «${slug}» уже існує`);
    await prisma.post.create({ data: { slug, ...data } });
  } else {
    await prisma.post.update({ where: { slug }, data });
  }

  revalidatePost(slug);
  revalidatePath('/admin/posts/');
  redirect('/admin/posts/?saved=1');
}

export async function deletePost(formData: FormData) {
  await requireSession();
  const slug = String(formData.get('slug') ?? '');
  if (!slug) throw new Error('Немає слага');

  await prisma.post.delete({ where: { slug } });
  revalidatePost(slug);
  revalidatePath('/admin/posts/');
  redirect('/admin/posts/?deleted=1');
}
