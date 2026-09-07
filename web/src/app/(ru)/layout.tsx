import type { Metadata } from 'next';
import { SiteLayout, siteMetadata } from '@/views/site-layout';

const LOCALE = 'ru' as const;

export const metadata: Metadata = siteMetadata(LOCALE);

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <SiteLayout locale={LOCALE}>{children}</SiteLayout>;
}
