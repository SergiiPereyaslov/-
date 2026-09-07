import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { LoginForm } from './LoginForm';

export const dynamic = 'force-dynamic';

export default async function AdminLoginPage() {
  if (await getSession()) redirect('/admin/dashboard/');

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <p className="mb-6 text-center font-display text-xl font-bold">
          Smart<span className="text-primary">Eco</span>Pack
        </p>
        <div className="card p-6">
          <h1 className="text-xl">Вхід в адмінку</h1>
          <p className="mt-1 text-sm text-muted">Керування каталогом, заявками та блогом.</p>
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
