/**
 * Заглушка зображення товару.
 *
 * Реальних фотографій ще немає — замість «сірого квадрата» малюємо силует
 * за формою товару. Коли надійдуть фото від клієнта, компонент замінюється
 * на <Image> у ProductCard і на сторінці товару; поле `image` у products.json
 * для цього вже передбачене.
 */
import type { ProductShape } from '@/data/types';

export type Shape = ProductShape;

const PATHS: Record<Shape, React.ReactNode> = {
  cup: (
    <>
      <path d="M22 22h36l-4 44a4 4 0 0 1-4 3.6H30a4 4 0 0 1-4-3.6z" />
      <path d="M24 36h32" />
    </>
  ),
  lid: (
    <>
      <ellipse cx="40" cy="42" rx="26" ry="10" />
      <path d="M14 42v6c0 5.5 11.6 10 26 10s26-4.5 26-10v-6" />
      <circle cx="40" cy="40" r="4" />
    </>
  ),
  sleeve: (
    <>
      <path d="M20 30h40l-3 24a3 3 0 0 1-3 2.6H26a3 3 0 0 1-3-2.6z" />
      <path d="M25 38h30M25 47h30" />
    </>
  ),
  holder: (
    <>
      <rect x="12" y="26" width="56" height="30" rx="3" />
      <circle cx="27" cy="41" r="8" />
      <circle cx="53" cy="41" r="8" />
    </>
  ),
  straw: (
    <>
      <path d="M32 14l10 2-8 54-10-2z" />
      <path d="M31 27l10 2M29 40l10 2M27 53l10 2" />
    </>
  ),
  box: (
    <>
      <path d="M14 32h52v30a4 4 0 0 1-4 4H18a4 4 0 0 1-4-4z" />
      <path d="M14 32l8-14h36l8 14" />
      <path d="M40 18v14" />
    </>
  ),
  round: (
    <>
      <ellipse cx="40" cy="30" rx="26" ry="9" />
      <path d="M14 30v22c0 5 11.6 9 26 9s26-4 26-9V30" />
    </>
  ),
  bag: (
    <>
      <path d="M18 28h44v42a3 3 0 0 1-3 3H21a3 3 0 0 1-3-3z" />
      <path d="M30 28v-4a10 10 0 0 1 20 0v4" />
    </>
  ),
  flat: (
    <>
      <rect x="14" y="26" width="52" height="30" rx="4" />
      <path d="M14 38h52" />
    </>
  ),
};

export function Placeholder({ shape = 'box', className = '' }: { shape?: Shape; className?: string }) {
  return (
    <div
      className={`flex items-center justify-center bg-accent-soft ${className}`}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 80 80"
        className="h-1/2 w-1/2 text-primary opacity-40"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {PATHS[shape] ?? PATHS.box}
      </svg>
    </div>
  );
}
