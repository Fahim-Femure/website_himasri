import type { ReactNode } from 'react';

export interface PageHeaderProps {
  title: string;
  description: string;
  label?: string;
  actions?: ReactNode;
  tone?: 'maroon' | 'dark' | 'gold';
}

export function PageHeader({
  title,
  description,
  actions,
}: PageHeaderProps) {
  return (
    <header className="pb-5 border-b border-cream-200 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-2xl leading-8 font-semibold tracking-[-0.015em] text-ink-900">
          {title}
        </h1>
        <p className="mt-1 type-small leading-5 text-ink-600">
          {description}
        </p>
      </div>

      {actions && (
        <div className="flex flex-wrap items-center gap-2.5 min-w-0 max-w-full sm:shrink-0">
          {actions}
        </div>
      )}
    </header>
  );
}
