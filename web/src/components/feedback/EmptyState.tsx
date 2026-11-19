import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <div
      className={[
        'rounded-xl border border-dashed border-cream-300 bg-white/80 px-6 py-12 text-center shadow-card flex flex-col items-center justify-center gap-2.5',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div
        className="relative flex h-14 w-14 items-center justify-center text-maroon-300 [&>svg]:relative [&>svg]:z-10 [&>svg]:h-7 [&>svg]:w-7"
        style={{
          background: 'var(--g-empty-glow)',
        }}
        aria-hidden="true"
      >
        {icon}
      </div>
      <h3 className="type-body leading-6 font-bold text-ink-900">{title}</h3>
      <p className="max-w-md type-small leading-5 text-ink-600">{description}</p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
