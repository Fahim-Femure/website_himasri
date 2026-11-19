interface AmperaBackdropProps {
  variant?: 'dark' | 'light';
  image?: 'ampera' | 'songket';
  opacityClass?: string;
  objectPosition?: string;
  className?: string;
}

export function AmperaBackdrop({
  variant = 'dark',
  image = 'ampera',
  opacityClass,
  objectPosition = 'center 58%',
  className = '',
}: AmperaBackdropProps) {
  const src =
    image === 'songket'
      ? '/assets/images/ornaments/songket-texture.webp'
      : '/assets/images/ornaments/ampera-bg.webp';

  const resolvedOpacity =
    opacityClass ?? (variant === 'dark' ? 'opacity-[0.09]' : 'opacity-[0.055]');

  const blendClass =
    image === 'songket'
      ? variant === 'dark'
        ? 'mix-blend-screen saturate-100'
        : 'mix-blend-multiply saturate-75 contrast-110'
      : variant === 'dark'
        ? 'mix-blend-screen saturate-50'
        : 'mix-blend-multiply grayscale contrast-125';

  return (
    <div
      aria-hidden="true"
      className={[
        'pointer-events-none select-none absolute inset-0 z-0 overflow-hidden',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <img
        src={src}
        alt=""
        loading="lazy"
        decoding="async"
        className={['h-full w-full object-cover', blendClass, resolvedOpacity].join(' ')}
        style={{
          objectPosition,
          WebkitMaskImage:
            image === 'songket'
              ? 'radial-gradient(ellipse 90% 85% at 78% 50%, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.45) 55%, rgba(0,0,0,0) 100%)'
              : variant === 'dark'
                ? 'radial-gradient(ellipse 85% 80% at 72% 55%, rgba(0,0,0,1) 0%, rgba(0,0,0,0.6) 55%, rgba(0,0,0,0) 100%)'
                : 'radial-gradient(ellipse 85% 80% at 50% 60%, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.45) 55%, rgba(0,0,0,0) 100%)',
          maskImage:
            image === 'songket'
              ? 'radial-gradient(ellipse 90% 85% at 78% 50%, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.45) 55%, rgba(0,0,0,0) 100%)'
              : variant === 'dark'
                ? 'radial-gradient(ellipse 85% 80% at 72% 55%, rgba(0,0,0,1) 0%, rgba(0,0,0,0.6) 55%, rgba(0,0,0,0) 100%)'
                : 'radial-gradient(ellipse 85% 80% at 50% 60%, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.45) 55%, rgba(0,0,0,0) 100%)',
        }}
      />
    </div>
  );
}

interface SongketCornerOrnamentProps {
  position?: 'top-right' | 'bottom-right' | 'top-left' | 'bottom-left';
  tone?: 'gold' | 'maroon' | 'cream';
  className?: string;
}

const POSITION_CLASSES: Record<NonNullable<SongketCornerOrnamentProps['position']>, string> = {
  'top-right': '-top-12 -right-12',
  'bottom-right': '-bottom-12 -right-12',
  'top-left': '-top-12 -left-12',
  'bottom-left': '-bottom-12 -left-12',
};

const TONE_COLOR: Record<NonNullable<SongketCornerOrnamentProps['tone']>, string> = {
  gold: 'rgba(235, 203, 110, 0.24)',
  maroon: 'rgba(116, 26, 38, 0.11)',
  cream: 'rgba(255, 251, 243, 0.2)',
};

export function SongketCornerOrnament({
  position = 'bottom-right',
  tone = 'gold',
  className = '',
}: SongketCornerOrnamentProps) {
  return (
    <div
      aria-hidden="true"
      className={[
        'pointer-events-none select-none absolute z-0 h-60 w-60 sm:h-72 sm:w-72 rounded-full overflow-hidden',
        POSITION_CLASSES[position],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={{
        WebkitMaskImage: 'radial-gradient(circle at center, rgba(0,0,0,1) 15%, rgba(0,0,0,0) 70%)',
        maskImage: 'radial-gradient(circle at center, rgba(0,0,0,1) 15%, rgba(0,0,0,0) 70%)',
      }}
    >
      <div
        className="h-full w-full"
        style={{
          backgroundColor: TONE_COLOR[tone],
          WebkitMaskImage: "url('/assets/images/ornaments/songket-tile.webp')",
          maskImage: "url('/assets/images/ornaments/songket-tile.webp')",
          WebkitMaskSize: '180px 180px',
          maskSize: '180px 180px',
          WebkitMaskRepeat: 'repeat',
          maskRepeat: 'repeat',
        }}
      />
    </div>
  );
}

export function PucukRebungDivider({ className = '' }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={['pucuk-rebung-border pointer-events-none select-none', className]
        .filter(Boolean)
        .join(' ')}
    />
  );
}
