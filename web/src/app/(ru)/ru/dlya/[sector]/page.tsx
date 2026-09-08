import type { Metadata } from 'next';
import View, { meta, staticParams } from '@/views/sector';

const LOCALE = 'ru' as const;

export const generateStaticParams = staticParams;

export const generateMetadata = ({ params }: { params: Promise<{ sector: string }> }): Promise<Metadata> =>
  meta(LOCALE, params);

export default function Page({ params }: { params: Promise<{ sector: string }> }) {
  return <View locale={LOCALE} params={params} />;
}
