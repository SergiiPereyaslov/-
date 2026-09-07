import type { Metadata } from 'next';
import View, { meta } from '@/views/blog';

const LOCALE = 'uk' as const;

export const generateMetadata = (): Promise<Metadata> => meta(LOCALE);

export default function Page() {
  return <View locale={LOCALE} />;
}
