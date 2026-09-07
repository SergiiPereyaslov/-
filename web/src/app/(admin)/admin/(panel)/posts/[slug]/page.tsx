import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { PostForm } from '../PostForm';

export const dynamic = 'force-dynamic';

interface Para {
  uk: string;
  ru: string;
}

export default async function EditPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await prisma.post.findUnique({ where: { slug } });
  if (!post) notFound();

  return (
    <div>
      <Link href="/admin/posts/" className="text-sm text-primary">
        ← Усі статті
      </Link>
      <h1 className="mt-2 text-2xl">{post.titleUk}</h1>
      <PostForm
        isNew={false}
        post={{
          slug: post.slug,
          publishedAt: post.publishedAt,
          titleUk: post.titleUk,
          titleRu: post.titleRu,
          excerptUk: post.excerptUk,
          excerptRu: post.excerptRu,
          body: (post.body as unknown as Para[]) ?? [],
          related: post.related,
          published: post.published,
        }}
      />
    </div>
  );
}
