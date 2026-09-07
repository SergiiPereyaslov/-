import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { saveCategory } from '../actions';

export const dynamic = 'force-dynamic';

interface Para {
  uk: string;
  ru: string;
}

export default async function CategoryEditPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const category = await prisma.category.findUnique({ where: { slug } });
  if (!category) notFound();

  const seo = (category.seo as unknown as Para[]) ?? [];
  const joined = (lang: 'uk' | 'ru') => seo.map((p) => p[lang]).join('\n\n');

  return (
    <div>
      <Link href="/admin/categories/" className="text-sm text-primary">
        ← Усі категорії
      </Link>
      <div className="mt-2 flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="text-2xl">{category.nameUk}</h1>
        <Link href={`/catalog/${category.slug}/`} target="_blank" className="text-sm text-primary">
          Подивитись на сайті ↗
        </Link>
      </div>

      <form action={saveCategory} className="mt-6 space-y-6">
        <input type="hidden" name="slug" value={category.slug} />

        <section className="card space-y-4 p-5">
          <h2 className="text-lg">Заголовки</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm font-medium">Назва в меню (укр)</span>
              <input name="nameUk" defaultValue={category.nameUk} className="field" required />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">Назва в меню (рос)</span>
              <input name="nameRu" defaultValue={category.nameRu} className="field" required />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">H1 (укр)</span>
              <input name="h1Uk" defaultValue={category.h1Uk} className="field" required />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">H1 (рос)</span>
              <input name="h1Ru" defaultValue={category.h1Ru} className="field" required />
            </label>
          </div>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">Вступ під H1 (укр)</span>
            <textarea name="introUk" rows={2} defaultValue={category.introUk} className="field" />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">Вступ під H1 (рос)</span>
            <textarea name="introRu" rows={2} defaultValue={category.introRu} className="field" />
          </label>
        </section>

        <section className="card space-y-4 p-5">
          <h2 className="text-lg">SEO-текст під сіткою товарів</h2>
          <p className="text-xs text-muted">
            Абзаци розділяються порожнім рядком. Кількість абзаців у двох мовах має збігатись —
            інакше зайві українські підставляться в російську версію як є.
          </p>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">Текст (укр)</span>
            <textarea name="seoUk" rows={10} defaultValue={joined('uk')} className="field" />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">Текст (рос)</span>
            <textarea name="seoRu" rows={10} defaultValue={joined('ru')} className="field" />
          </label>
        </section>

        <section className="card space-y-3 p-5">
          <h2 className="text-lg">Часті питання</h2>
          <p className="text-xs text-muted">
            Формують блок FAQ і розмітку для розширеного сніпета у видачі.
          </p>
          <textarea
            name="faq"
            rows={12}
            defaultValue={JSON.stringify(category.faq, null, 2)}
            className="field font-mono text-[13px]"
          />
        </section>

        <div className="flex gap-3">
          <button type="submit" className="btn btn-primary">
            Зберегти й оновити сайт
          </button>
          <Link href="/admin/categories/" className="btn btn-secondary">
            Скасувати
          </Link>
        </div>
      </form>
    </div>
  );
}
