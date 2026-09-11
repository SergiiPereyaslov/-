import type { Metadata } from 'next';
import { Manrope, Bitter } from 'next/font/google';
import '../globals.css';

/*
 * Адмінка ділить із сайтом і палітру, і шрифти: --font-sans/--font-display
 * у globals.css посилаються на --font-manrope/--font-bitter, тож без цих
 * змінних тут був би системний шрифт.
 */
const manrope = Manrope({
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-manrope',
  display: 'swap',
});

const bitter = Bitter({
  subsets: ['latin', 'cyrillic'],
  weight: ['600', '700'],
  variable: '--font-bitter',
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
    <html lang="uk" className={`${manrope.variable} ${bitter.variable}`}>
      <body className="min-h-screen bg-bg font-sans text-ink">{children}</body>
    </html>
  );
}
