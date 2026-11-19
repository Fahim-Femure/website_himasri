import { useState } from 'react';

export type AvatarSize = 'XS' | 'S' | 'M' | 'L';

interface AvatarProps {
  name: string;
  photoURL?: string | null;
  size?: AvatarSize;
  className?: string;
}

const SIZE_CLASSES: Record<AvatarSize, string> = {
  XS: 'h-8 w-8 text-xs',
  S: 'h-9 w-9 text-xs',
  M: 'h-10 w-10 text-sm',
  L: 'h-16 w-16 text-lg',
};

function getInitials(name: string): string {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return 'HM';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export function Avatar({ name, photoURL, size = 'M', className = '' }: AvatarProps) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const showImage = Boolean(photoURL) && failedUrl !== photoURL;

  return (
    <div
      className={[
        'relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full g-maroon font-bold text-cream-50 ring-2 ring-gold-400 select-none',
        SIZE_CLASSES[size],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      aria-label={name}
    >
      {showImage && photoURL ? (
        <img
          src={photoURL}
          alt={name}
          loading="lazy"
          onError={() => setFailedUrl(photoURL)}
          className="h-full w-full object-cover"
        />
      ) : (
        <span aria-hidden="true">{getInitials(name)}</span>
      )}
    </div>
  );
}
