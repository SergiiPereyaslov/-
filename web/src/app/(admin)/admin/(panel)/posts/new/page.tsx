import Link from 'next/link';
import { PostForm } from '../PostForm';

export const dynamic = 'force-dynamic';

export default function NewPostPage() {
  return (
    <div>
      <Link href="/admin/posts/" className="text-sm text-primary">
        ← Усі статті
      </Link>
      <h1 className="mt-2 text-2xl">Нова стаття</h1>
      <PostForm
        isNew
        post={{
          slug: '',
          publishedAt: new Date(),
          titleUk: '',
          titleRu: '',
          excerptUk: '',
          excerptRu: '',
          body: [],
          related: [],
          published: false,
        }}
      />
    </div>
  );
}
