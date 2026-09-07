import type { Metadata } from 'next';
import View, { meta } from '@/views/dostavka-i-oplata';

const LOCALE = 'uk' as const;

export const generateMetadata = (): Promise<Metadata> => meta(LOCALE);

export default function Page() {
  return <View locale={LOCALE} />;
}
