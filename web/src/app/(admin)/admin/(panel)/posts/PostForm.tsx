import Link from 'next/link';
import { deletePost, savePost } from './actions';

interface Para {
  uk: string;
  ru: string;
}

export interface PostFormData {
  slug: string;
  publishedAt: Date;
  titleUk: string;
  titleRu: string;
  excerptUk: string;
  excerptRu: string;
  body: Para[];
  related: string[];
  published: boolean;
}

/** Спільна форма для створення й редагування статті. */
export function PostForm({ post, isNew }: { post: PostFormData; isNew: boolean }) {
  const joined = (lang: 'uk' | 'ru') => post.body.map((p) => p[lang]).join('\n\n');

  return (
    <>
      <form action={savePost} className="mt-6 space-y-6">
        <input type="hidden" name="isNew" value={isNew ? '1' : '0'} />

        <section className="card space-y-4 p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm font-medium">Заголовок (укр)</span>
              <input name="titleUk" defaultValue={post.titleUk} className="field" required />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">Заголовок (рос)</span>
              <input name="titleRu" defaultValue={post.titleRu} className="field" />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">Адреса (slug)</span>
              <input
                name="slug"
                defaultValue={post.slug}
                className="field"
                readOnly={!isNew}
                placeholder="лишіть порожнім — згенеруємо із заголовка"
              />
              {!isNew && (
                <span className="mt-1 block text-xs text-muted">
                  Слаг не змінюється: інакше стара адреса почне віддавати 404.
                </span>
              )}
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">Дата публікації</span>
              <input
                type="date"
                name="publishedAt"
                defaultValue={post.publishedAt.toISOString().slice(0, 10)}
                className="field tnum"
              />
            </label>
          </div>

          <label className="block">
            <span className="mb-1 block text-sm font-medium">Анонс (укр)</span>
            <textarea name="excerptUk" rows={2} defaultValue={post.excerptUk} className="field" />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">Анонс (рос)</span>
            <textarea name="excerptRu" rows={2} defaultValue={post.excerptRu} className="field" />
          </label>
        </section>

        <section className="card space-y-4 p-5">
          <h2 className="text-lg">Текст статті</h2>
          <p className="text-xs text-muted">
            Абзаци розділяються порожнім рядком. Рядок, що починається з «## », стає підзаголовком.
          </p>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">Текст (укр)</span>
            <textarea name="bodyUk" rows={16} defaultValue={joined('uk')} className="field" />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">Текст (рос)</span>
            <textarea name="bodyRu" rows={16} defaultValue={joined('ru')} className="field" />
          </label>
        </section>

        <section className="card space-y-4 p-5">
          <label className="block">
            <span className="mb-1 block text-sm font-medium">Пов’язані категорії</span>
            <input
              name="related"
              defaultValue={post.related.join(', ')}
              className="field"
              placeholder="stakany-paperovi, kryshky-dlya-stakaniv"
            />
            <span className="mt-1 block text-xs text-muted">
              Слаги через кому — стають посиланнями під статтею.
            </span>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="published"
              defaultChecked={post.published}
              className="h-4 w-4 accent-[var(--primary)]"
            />
            Опубліковано
          </label>
        </section>

        <div className="flex gap-3">
          <button type="submit" className="btn btn-primary">
            Зберегти й оновити сайт
          </button>
          <Link href="/admin/posts/" className="btn btn-secondary">
            Скасувати
          </Link>
        </div>
      </form>

      {!isNew && (
        <form action={deletePost} className="mt-8 border-t border-border pt-5">
          <input type="hidden" name="slug" value={post.slug} />
          <button type="submit" className="text-sm text-danger hover:underline">
            Видалити статтю
          </button>
        </form>
      )}
    </>
  );
}
