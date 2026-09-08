import type { Metadata } from 'next';
import { Comfortaa } from 'next/font/google';
import '../globals.css';

/*
 * Адмінка ділить із сайтом і палітру, і шрифт: --font-sans у globals.css
 * посилається на --font-comfortaa, тож без цієї змінної тут був би
 * системний шрифт.
 */
const comfortaa = Comfortaa({
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-comfortaa',
  display: 'swap',
});

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
    <html lang="uk" className={comfortaa.variable}>
      <body className="min-h-screen bg-bg font-sans text-ink">{children}</body>
    </html>
  );
}
