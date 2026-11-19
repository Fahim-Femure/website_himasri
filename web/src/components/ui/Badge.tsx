import type { ReactNode } from 'react';

export type BadgeVariant =
  | 'success'
  | 'danger'
  | 'warning'
  | 'neutral'
  | 'maroon'
  | 'gold'
  | 'dark'
  | 'whatsapp'
  | 'cream';

interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
}

const BADGE_CLASSES: Record<BadgeVariant, string> = {
  success: 'bg-success-50 text-success-600',
  whatsapp: 'bg-success-50 text-success-600',
  danger: 'bg-danger-50 text-danger-600',
  warning: 'bg-warning-50 text-warning-600',
  gold: 'g-gold text-maroon-950',
  neutral: 'bg-cream-100 text-ink-600',
  cream: 'bg-cream-100 text-ink-600',
  dark: 'bg-maroon-950 text-cream-50',
  maroon: 'bg-maroon-100 text-maroon-800',
};

export function Badge({ variant = 'neutral', children, className = '' }: BadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 type-caption leading-4 font-semibold whitespace-nowrap',
        BADGE_CLASSES[variant],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </span>
  );
}
