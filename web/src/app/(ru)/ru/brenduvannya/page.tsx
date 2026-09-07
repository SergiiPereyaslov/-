import type { Metadata } from 'next';
import View, { meta } from '@/views/brenduvannya';

const LOCALE = 'ru' as const;

export const generateMetadata = (): Promise<Metadata> => meta(LOCALE);

export default function Page() {
  return <View locale={LOCALE} />;
}
