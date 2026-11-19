import { motion, useReducedMotion } from 'motion/react';
import { SPRING } from '@/components/motion';

export interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

interface ChipFilterProps {
  options: readonly FilterOption[];
  value: string;
  onChange: (value: string) => void;
  layoutId?: string;
  variant?: 'light' | 'onDark';
  className?: string;
  ariaLabel?: string;
}

export function ChipFilter({
  options,
  value,
  onChange,
  layoutId = 'chip-active',
  variant = 'light',
  className = '',
  ariaLabel = 'Filter pilihan',
}: ChipFilterProps) {
  const prefersReduced = useReducedMotion();

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={['flex flex-wrap items-center gap-2', className].filter(Boolean).join(' ')}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className={[
              'relative inline-flex min-h-11 md:min-h-[40px] items-center gap-2 rounded-full border px-4 py-1.5 type-small leading-5 font-medium transition-colors cursor-pointer',
              'focus-visible:outline-none',
              active
                ? variant === 'onDark'
                  ? 'border-transparent text-maroon-950 font-semibold shadow-gold'
                  : 'border-transparent text-cream-50 font-semibold shadow-btn'
                : variant === 'onDark'
                  ? 'border-white/25 bg-white/10 text-cream-50 hover:bg-white/20'
                  : 'border-cream-300 bg-white text-ink-900 shadow-card hover:bg-cream-100',
            ].join(' ')}
          >
            {active && (
              <motion.span
                layoutId={layoutId}
                transition={prefersReduced ? { duration: 0 } : SPRING.chip}
                className={[
                  'absolute inset-0 rounded-full',
                  variant === 'onDark' ? 'bg-gold-400' : 'bg-maroon-700',
                ].join(' ')}
              />
            )}
            <span className="relative z-10">{opt.label}</span>
            {typeof opt.count === 'number' && (
              <span
                className={[
                  'relative z-10 rounded-full px-2 py-0.5 type-caption leading-4 font-semibold tabular-nums',
                  active
                    ? variant === 'onDark'
                      ? 'bg-maroon-950/15 text-maroon-950'
                      : 'bg-white/20 text-cream-50'
                    : variant === 'onDark'
                      ? 'bg-white/15 text-cream-50'
                      : 'bg-cream-100 text-ink-600',
                ].join(' ')}
              >
                {opt.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

interface SegmentedControlProps {
  options: readonly FilterOption[];
  value: string;
  onChange: (value: string) => void;
  layoutId?: string;
  tone?: 'onDark' | 'light';
  ariaLabel?: string;
}

export function SegmentedControl({
  options,
  value,
  onChange,
  layoutId = 'segment-active',
  tone = 'light',
  ariaLabel = 'Pemilih periode',
}: SegmentedControlProps) {
  const prefersReduced = useReducedMotion();

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={[
        'inline-flex flex-wrap items-center gap-1 rounded-full border p-1',
        tone === 'onDark'
          ? 'bg-maroon-950/60 border-white/20'
          : 'bg-cream-100 border-cream-200',
      ].join(' ')}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className={[
              'relative min-h-11 md:min-h-[38px] rounded-full px-4 py-1.5 type-small leading-5 font-medium transition-colors cursor-pointer',
              'focus-visible:outline-none',
              active
                ? tone === 'onDark'
                  ? 'text-maroon-950 font-semibold'
                  : 'text-cream-50 font-semibold'
                : tone === 'onDark'
                  ? 'text-cream-100 hover:text-white'
                  : 'text-ink-900 hover:bg-cream-200/50',
            ].join(' ')}
          >
            {active && (
              <motion.span
                layoutId={layoutId}
                transition={prefersReduced ? { duration: 0 } : SPRING.chip}
                className={[
                  'absolute inset-0 rounded-full',
                  tone === 'onDark' ? 'bg-gold-400' : 'bg-maroon-700',
                ].join(' ')}
              />
            )}
            <span className="relative z-10 whitespace-nowrap">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
