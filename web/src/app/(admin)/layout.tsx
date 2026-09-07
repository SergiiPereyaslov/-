import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '../globals.css';

const inter = Inter({ subsets: ['latin', 'cyrillic'], variable: '--font-inter', display: 'swap' });

/**
 * Окремий корінь для адмінки: без шапки, підвалу й мовних дерев сайту.
 * Індексація заборонена на рівні метаданих і додатково в robots.txt.
 */
export const metadata: Metadata = {
  title: 'Адмінка | SmartEcoPack',
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uk" className={inter.variable}>
      <body className="min-h-screen bg-bg font-sans text-ink">{children}</body>
    </html>
  );
}
