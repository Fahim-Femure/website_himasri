import type { ReactNode } from 'react';
import { useCountUp } from '@/hooks/useCountUp';

export type StatTileVariant = 'maroon' | 'gold' | 'cream' | 'dark';

interface StatTileProps {
  label: string;
  value: number;
  icon?: ReactNode;
  variant?: StatTileVariant;
  suffix?: string;
}

export function StatTile({
  label,
  value,
  icon,
  suffix = '',
}: StatTileProps) {
  const { value: animatedValue, ref } = useCountUp(value);

  return (
    <div
      ref={ref}
      className="relative rounded-lg bg-white border border-cream-200 p-5"
    >
      {icon && (
        <span
          className="absolute top-4 right-4 text-ink-600 opacity-50 [&>svg]:h-4 [&>svg]:w-4"
          aria-hidden="true"
        >
          {icon}
        </span>
      )}
      <p className="type-h1 sm:text-3xl leading-none font-bold text-ink-900 tabular-nums">
        {animatedValue}
        {suffix}
      </p>
      <p className="mt-2 type-label leading-5 font-medium text-ink-600">
        {label}
      </p>
    </div>
  );
}

interface StatStripProps {
  children: ReactNode;
  cols?: 3 | 4;
  className?: string;
}

export function StatStrip({ children, cols = 4, className = '' }: StatStripProps) {
  return (
    <div
      className={[
        'grid gap-4',
        cols === 3 ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-2 lg:grid-cols-4',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </div>
  );
}
