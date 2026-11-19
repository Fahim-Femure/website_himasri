import type { ReactNode } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { DURATION } from '@/components/motion';

interface ChoiceProps {
  name: string;
  value: string;
  checked: boolean;
  onChange: () => void;
  label: string;
  description?: ReactNode;
  disabled?: boolean;
  className?: string;
}

export function Choice({
  name,
  value,
  checked,
  onChange,
  label,
  description,
  disabled = false,
  className = '',
}: ChoiceProps) {
  const prefersReduced = useReducedMotion();

  return (
    <label
      className={[
        'relative flex min-h-[44px] cursor-pointer items-center gap-3 rounded-md border px-4 py-2.5 shadow-card transition-colors select-none',
        'focus-within:ring-2 focus-within:ring-gold-400 focus-within:ring-offset-2',
        checked
          ? 'border-maroon-700 bg-maroon-100/60 text-ink-900'
          : 'border-cream-300 bg-white text-ink-900 hover:bg-cream-100/60',
        disabled ? 'cursor-not-allowed opacity-50' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={{ transitionDuration: `${DURATION.fast * 1000}ms` }}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        disabled={disabled}
        onChange={onChange}
        className="sr-only"
      />
      <span
        className={[
          'flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
          checked ? 'border-maroon-700 bg-white' : 'border-cream-300 bg-white',
        ].join(' ')}
        aria-hidden="true"
      >
        <motion.span
          initial={false}
          animate={
            checked
              ? { scale: 1, opacity: 1 }
              : { scale: prefersReduced ? 1 : 0.6, opacity: 0 }
          }
          transition={{ duration: prefersReduced ? 0 : DURATION.fast }}
          className="h-2 w-2 rounded-full bg-maroon-700"
        />
      </span>
      <span className="flex flex-col">
        <span className="type-small leading-5 font-semibold text-ink-900">{label}</span>
        {description && <span className="type-label leading-5 text-ink-600">{description}</span>}
      </span>
    </label>
  );
}
