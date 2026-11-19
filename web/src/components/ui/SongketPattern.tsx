import { useId } from 'react';

interface SongketPatternProps {
  opacity?: number;
  corner?: 'tr' | 'br' | 'full';
  className?: string;
}

const MASK_STYLES: Record<NonNullable<SongketPatternProps['corner']>, string> = {
  tr: 'radial-gradient(ellipse 75% 75% at 100% 0%, rgba(0,0,0,1) 0%, rgba(0,0,0,0.45) 45%, rgba(0,0,0,0) 78%)',
  br: 'radial-gradient(ellipse 75% 75% at 100% 100%, rgba(0,0,0,1) 0%, rgba(0,0,0,0.45) 45%, rgba(0,0,0,0) 78%)',
  full: 'radial-gradient(ellipse 90% 90% at 50% 50%, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.85) 100%)',
};

export function SongketPattern({
  opacity = 0.08,
  corner = 'tr',
  className = '',
}: SongketPatternProps) {
  const patternId = useId();
  const mask = MASK_STYLES[corner];

  return (
    <div
      aria-hidden="true"
      className={['pointer-events-none select-none absolute inset-0 z-0 overflow-hidden', className]
        .filter(Boolean)
        .join(' ')}
      style={{
        opacity,
        WebkitMaskImage: mask,
        maskImage: mask,
      }}
    >
      <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern
            id={patternId}
            width="24"
            height="24"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M12 1 L23 12 L12 23 L1 12 Z"
              fill="none"
              stroke="#E6C76A"
              strokeWidth="1"
            />
            <circle cx="12" cy="12" r="1.2" fill="#E6C76A" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${patternId})`} />
      </svg>
    </div>
  );
}
