/**
 * Знак бренду: контур пакета з написом у три рядки.
 *
 * Це наближення до чинного логотипа, зроблене по скріншоту. Коли надійде
 * векторний оригінал, компонент замінюється на <Image> або вбудований SVG
 * із брендбука — решта верстки не змінюється.
 */
export function Logo({ className = '', title = 'SmartEcoPack' }: { className?: string; title?: string }) {
  return (
    <svg viewBox="0 0 72 72" className={className} role="img" aria-label={title}>
      {/* ручка пакета */}
      <path
        d="M28 16c0-4.4 3.6-8 8-8s8 3.6 8 8"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      {/* корпус */}
      <rect x="8" y="16" width="56" height="48" rx="6" fill="none" stroke="currentColor" strokeWidth="3" />
      <text
        x="36"
        y="34"
        textAnchor="middle"
        fill="currentColor"
        fontSize="11"
        fontFamily="var(--font-comfortaa), system-ui, sans-serif"
        fontWeight="600"
      >
        smart
      </text>
      <text
        x="36"
        y="47"
        textAnchor="middle"
        fill="currentColor"
        fontSize="13"
        fontFamily="var(--font-comfortaa), system-ui, sans-serif"
        fontWeight="700"
      >
        eco
      </text>
      <text
        x="36"
        y="59"
        textAnchor="middle"
        fill="currentColor"
        fontSize="11"
        fontFamily="var(--font-comfortaa), system-ui, sans-serif"
        fontWeight="600"
      >
        pack
      </text>
    </svg>
  );
}
