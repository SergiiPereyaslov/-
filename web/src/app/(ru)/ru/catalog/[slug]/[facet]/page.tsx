import type { Metadata } from 'next';
import View, { meta, staticParams } from '@/views/catalog-facet';

const LOCALE = 'ru' as const;

export const generateStaticParams = staticParams;

export const generateMetadata = ({ params }: { params: Promise<{ slug: string; facet: string }> }): Promise<Metadata> =>
  meta(LOCALE, params);

export default function Page({ params }: { params: Promise<{ slug: string; facet: string }> }) {
  return <View locale={LOCALE} params={params} />;
}
