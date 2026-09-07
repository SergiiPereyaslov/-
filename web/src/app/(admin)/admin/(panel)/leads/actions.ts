'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import type { LeadStatus } from '@/generated/prisma/client';

const STATUSES = new Set(['new', 'in_progress', 'done', 'rejected']);

/** Кожна дія перевіряє сесію самостійно: layout захищає рендер, не виклики. */
const requireSession = async () => {
  const session = await getSession();
  if (!session) throw new Error('Немає доступу');
  return session;
};

export async function updateLead(formData: FormData) {
  await requireSession();

  const id = String(formData.get('id') ?? '');
  const status = String(formData.get('status') ?? '');
  const managerNote = String(formData.get('managerNote') ?? '').slice(0, 4000);

  if (!id || !STATUSES.has(status)) throw new Error('Некоректні дані');

  await prisma.lead.update({
    where: { id },
    data: { status: status as LeadStatus, managerNote: managerNote || null },
  });

  revalidatePath('/admin/leads/');
  revalidatePath(`/admin/leads/${id}/`);
  revalidatePath('/admin/dashboard/');

  // Явне підтвердження: інакше форма просто перемальовується й незрозуміло,
  // чи зміни збереглись.
  redirect(`/admin/leads/${id}/?saved=1`);
}
