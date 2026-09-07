import type { Metadata } from 'next';
import View, { meta, staticParams } from '@/views/blog-slug';

const LOCALE = 'ru' as const;

export const generateStaticParams = staticParams;

export const generateMetadata = ({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> =>
  meta(LOCALE, params);

export default function Page({ params }: { params: Promise<{ slug: string }> }) {
  return <View locale={LOCALE} params={params} />;
}
