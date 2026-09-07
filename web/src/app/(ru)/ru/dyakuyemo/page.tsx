import type { Metadata } from 'next';
import View, { meta } from '@/views/dyakuyemo';

const LOCALE = 'ru' as const;

export const generateMetadata = (): Promise<Metadata> => meta(LOCALE);

export default function Page({ searchParams }: { searchParams: Promise<{ n?: string }> }) {
  return <View locale={LOCALE} searchParams={searchParams} />;
}
