import { cache } from 'react';
import { prisma } from './db';
import type { L, Locale } from '@/data/types';

export interface Post {
  slug: string;
  date: string;
  title: L;
  excerpt: L;
  /** Абзаци; рядок, що починається з '## ', стає підзаголовком. */
  body: L[];
  /** Слаги категорій для перелінковки. */
  related: string[];
}

type Row = Awaited<ReturnType<typeof prisma.post.findMany>>[number];

const toPost = (r: Row): Post => ({
  slug: r.slug,
  date: r.publishedAt.toISOString().slice(0, 10),
  title: { uk: r.titleUk, ru: r.titleRu },
  excerpt: { uk: r.excerptUk, ru: r.excerptRu },
  body: r.body as unknown as L[],
  related: r.related,
});

export const getPosts = cache(async (): Promise<Post[]> => {
  const rows = await prisma.post.findMany({
    where: { published: true },
    orderBy: { publishedAt: 'desc' },
  });
  return rows.map(toPost);
});

export const getPost = cache(async (slug: string): Promise<Post | undefined> => {
  const row = await prisma.post.findFirst({ where: { slug, published: true } });
  return row ? toPost(row) : undefined;
});

export const formatDate = (iso: string, locale: Locale) =>
  new Date(iso).toLocaleDateString(locale === 'uk' ? 'uk-UA' : 'ru-UA', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
