import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { logout } from '../actions';

export const dynamic = 'force-dynamic';

const NAV = [
  ['/admin/dashboard/', 'Огляд'],
  ['/admin/leads/', 'Заявки'],
  ['/admin/products/', 'Товари'],
  ['/admin/categories/', 'Категорії'],
  ['/admin/posts/', 'Блог'],
  ['/admin/import/', 'Імпорт'],
  ['/admin/ab/', 'A/B-тест'],
] as const;

/**
 * Захист усього розділу: сесія перевіряється один раз тут, тому окремим
 * сторінкам не треба про неї пам'ятати. Перевірка в layout, а не в proxy,
 * бо proxy не має доступу до бази.
 */
export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect('/admin/');

  const newLeads = await prisma.lead.count({ where: { status: 'new' } });

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4">
          <Link href="/admin/dashboard/" className="font-display font-bold">
            Smart<span className="text-primary">Eco</span>Pack
          </Link>
          <nav className="flex flex-1 flex-wrap gap-1">
            {NAV.map(([href, label]) => (
              <Link key={href} href={href} className="btn btn-ghost !min-h-8 !px-2.5 !text-[13px]">
                {label}
                {href === '/admin/leads/' && newLeads > 0 && (
                  <span className="ml-1 rounded-full bg-accent px-1.5 text-[11px] font-bold text-white tnum">
                    {newLeads}
                  </span>
                )}
              </Link>
            ))}
          </nav>
          <span className="hidden text-xs text-muted sm:block">{session.name}</span>
          <form action={logout}>
            <button type="submit" className="btn btn-secondary !min-h-8 !px-3 !text-[13px]">
              Вийти
            </button>
          </form>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6">{children}</main>
      <footer className="border-t border-border px-4 py-3 text-center text-xs text-muted">
        <Link href="/" target="_blank" className="hover:text-primary">
          Відкрити сайт ↗
        </Link>
      </footer>
    </div>
  );
}
