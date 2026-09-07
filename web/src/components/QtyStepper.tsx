'use client';

export function QtyStepper({
  value,
  onChange,
  labels,
  compact = false,
}: {
  value: number;
  onChange: (n: number) => void;
  labels: { increase: string; decrease: string };
  compact?: boolean;
}) {
  const size = compact ? 'h-9 w-9' : 'h-11 w-11';
  return (
    <div className="inline-flex items-center rounded-md border border-border bg-surface">
      <button
        type="button"
        className={`${size} flex items-center justify-center text-lg leading-none hover:text-primary disabled:opacity-40`}
        onClick={() => onChange(Math.max(1, value - 1))}
        disabled={value <= 1}
        aria-label={labels.decrease}
      >
        −
      </button>
      <input
        type="number"
        min={1}
        value={value}
        onChange={(e) => onChange(Math.max(1, Number(e.target.value) || 1))}
        className={`${compact ? 'w-10 text-sm' : 'w-14'} border-x border-border bg-transparent py-2 text-center font-semibold tnum [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`}
        aria-label={labels.increase}
      />
      <button
        type="button"
        className={`${size} flex items-center justify-center text-lg leading-none hover:text-primary`}
        onClick={() => onChange(value + 1)}
        aria-label={labels.increase}
      >
        +
      </button>
    </div>
  );
}
