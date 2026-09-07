import type { Metadata } from 'next';
import View, { meta, staticParams } from '@/views/city';

const LOCALE = 'uk' as const;

export const generateStaticParams = staticParams;

export const generateMetadata = ({ params }: { params: Promise<{ city: string }> }): Promise<Metadata> =>
  meta(LOCALE, params);

export default function Page({ params }: { params: Promise<{ city: string }> }) {
  return <View locale={LOCALE} params={params} />;
}
