import { useId } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { SPRING } from '@/components/motion';

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
  id?: string;
}

export function ToggleSwitch({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  id: providedId,
}: ToggleSwitchProps) {
  const generatedId = useId();
  const id = providedId ?? generatedId;
  const prefersReduced = useReducedMotion();

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex flex-col">
        <label htmlFor={id} className="type-small leading-5 font-semibold text-ink-900 cursor-pointer">
          {label}
        </label>
        {description && <span className="type-label leading-5 text-ink-600">{description}</span>}
      </div>

      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={[
          'relative inline-flex h-11 md:h-10 min-w-[48px] items-center justify-center rounded-full px-1 transition-colors',
          'focus-visible:outline-none',
          'disabled:opacity-50 disabled:cursor-not-allowed',
        ].join(' ')}
      >
        <span
          className={[
            'relative flex h-6 w-11 items-center rounded-full p-0.5 transition-colors',
            checked ? 'bg-maroon-700' : 'bg-cream-300',
          ].join(' ')}
        >
          <motion.span
            layout
            transition={prefersReduced ? { duration: 0 } : SPRING.toggle}
            className={[
              'h-5 w-5 rounded-full bg-cream-50 border border-cream-200 shadow-sm',
              checked ? 'translate-x-5' : 'translate-x-0',
            ].join(' ')}
          />
        </span>
      </button>
    </div>
  );
}
