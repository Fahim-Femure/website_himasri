import { Info } from 'lucide-react';

interface SimulationNoteProps {
  variant?: 'light' | 'dark';
  text?: string;
  className?: string;
}

const SHOW_DEMO_BANNER = import.meta.env.VITE_DEMO_MODE === 'true';

export function SimulationNote({
  variant = 'light',
  text = 'Data contoh, ganti dengan data resmi HIMASRI.',
  className = '',
}: SimulationNoteProps) {
  if (!SHOW_DEMO_BANNER) return null;

  return (
    <div
      role="note"
      className={[
        'inline-flex items-center gap-2 type-label leading-5',
        variant === 'dark' ? 'text-cream-100/80' : 'text-ink-600',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <Info className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span>{text}</span>
    </div>
  );
}
