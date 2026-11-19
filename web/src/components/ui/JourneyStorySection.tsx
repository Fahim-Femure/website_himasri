import { useEffect, useRef, useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Expand, X } from 'lucide-react';
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/feedback/Skeleton';
import { useLenisContext } from '@/contexts/LenisContext';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import type { JourneyItemDoc } from '@/types/models';

interface JourneyStorySectionProps {
  item: JourneyItemDoc;
  index: number;
  compact?: boolean;
  isFirst?: boolean;
  onImageClick?: () => void;
}

export function JourneyStorySection({
  item,
  index,
  compact = false,
  isFirst = false,
  onImageClick,
}: JourneyStorySectionProps) {
  const prefersReduced = useReducedMotion();
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const sectionRef = useRef<HTMLElement>(null);

  // Odd moments (1st, 3rd, 5th -> index 0, 2, 4): photo LEFT. Even moments: photo RIGHT.
  const isPhotoLeft = index % 2 === 0;
  const orderNumber = String(index + 1).padStart(2, '0');

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  });
  const parallaxY = useTransform(scrollYProgress, [0, 1], ['-6%', '6%']);
  const enableParallax = isDesktop && !prefersReduced;

  const altText = `${item.title} — ${item.dateLabel}`;
  const imgWidth = item.width || 1600;
  const imgHeight = item.height || 1067;

  return (
    <section
      ref={sectionRef}
      className={[
        'relative w-full overflow-x-clip bg-cream-50 border-b border-cream-200',
        compact ? 'lg:min-h-[60svh]' : 'lg:min-h-[85svh]',
      ].join(' ')}
    >
      <div
        className={[
          'grid grid-cols-1 lg:grid-cols-12 items-stretch',
          compact ? 'lg:min-h-[60svh]' : 'lg:min-h-[85svh]',
        ].join(' ')}
      >
        {/* Photo Column (7 cols on desktop, full-bleed to left or right edge) */}
        <motion.div
          initial={
            prefersReduced
              ? false
              : { opacity: 0, x: isDesktop ? (isPhotoLeft ? -24 : 24) : 0 }
          }
          whileInView={prefersReduced ? undefined : { opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className={[
            'relative overflow-hidden bg-maroon-950',
            'aspect-[4/5] sm:aspect-[4/3] lg:aspect-auto lg:col-span-7',
            isPhotoLeft ? 'lg:order-1' : 'lg:order-2',
          ].join(' ')}
        >
          {onImageClick ? (
            <button
              type="button"
              onClick={onImageClick}
              aria-label={`Perbesar foto ${altText}`}
              className="group relative block h-full w-full text-left cursor-pointer focus-visible:outline-none"
            >
              <motion.img
                ref={(el) => {
                  if (el) el.setAttribute('fetchpriority', isFirst ? 'high' : 'auto');
                }}
                src={item.imageUrl}
                alt={altText}
                width={imgWidth}
                height={imgHeight}
                loading={isFirst ? 'eager' : 'lazy'}
                decoding="async"
                style={enableParallax ? { y: parallaxY, scale: 1.12 } : undefined}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              />
              <span className="absolute bottom-4 right-4 z-10 inline-flex items-center gap-1.5 rounded-full bg-maroon-950/75 px-3.5 py-1.5 type-caption font-semibold text-cream-50 backdrop-blur-sm transition-colors group-hover:bg-maroon-900">
                <Expand className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Perbesar</span>
              </span>
            </button>
          ) : (
            <motion.img
              ref={(el) => {
                if (el) el.setAttribute('fetchpriority', isFirst ? 'high' : 'auto');
              }}
              src={item.imageUrl}
              alt={altText}
              width={imgWidth}
              height={imgHeight}
              loading={isFirst ? 'eager' : 'lazy'}
              decoding="async"
              style={enableParallax ? { y: parallaxY, scale: 1.12 } : undefined}
              className="h-full w-full object-cover"
            />
          )}
        </motion.div>

        {/* Text Editorial Column (5 cols on desktop, vertically centered) */}
        <motion.div
          initial={prefersReduced ? false : { opacity: 0, y: 16 }}
          whileInView={prefersReduced ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.45, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
          className={[
            'relative flex flex-col justify-center px-4 py-8 sm:px-8 lg:px-12 xl:px-16 lg:py-14 lg:col-span-5',
            isPhotoLeft ? 'lg:order-2' : 'lg:order-1',
          ].join(' ')}
        >
          {/* Thin Timeline Thread connecting moments */}
          <div
            aria-hidden="true"
            className={[
              'hidden lg:block absolute top-0 bottom-0 w-px bg-cream-300',
              isPhotoLeft ? 'left-0' : 'right-0',
            ].join(' ')}
          />
          <span
            aria-hidden="true"
            className={[
              'hidden lg:block absolute top-1/2 -translate-y-1/2 h-3 w-3 rounded-full bg-maroon-700 ring-4 ring-cream-50',
              isPhotoLeft ? '-left-[6.5px]' : '-right-[6.5px]',
            ].join(' ')}
          />

          {/* Decorative large thin background index number */}
          <span
            aria-hidden="true"
            className="pointer-events-none select-none font-extrabold leading-none text-maroon-700/[0.06] type-display-num tracking-tighter mb-[-28px] sm:mb-[-36px]"
          >
            {orderNumber}
          </span>

          <div className="relative z-10 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 type-label font-semibold text-maroon-700 tabular-nums">
                <Calendar className="h-4 w-4" aria-hidden="true" />
                <span>{item.dateLabel}</span>
              </span>
              {item.badge && <Badge variant="maroon">{item.badge}</Badge>}
            </div>

            <h2
              className={[
                'font-extrabold tracking-[-0.02em] text-ink-900',
                compact
                  ? 'text-2xl sm:text-3xl leading-[1.18]'
                  : 'text-3xl sm:text-4xl xl:text-5xl leading-[1.12]',
              ].join(' ')}
            >
              {item.title}
            </h2>

            {item.description && (
              <p className="max-w-prose type-body leading-7 text-ink-600 whitespace-pre-line">
                {item.description}
              </p>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export function JourneyStorySkeleton({ index }: { index: number }) {
  const isPhotoLeft = index % 2 === 0;
  return (
    <div className="w-full bg-cream-50 border-b border-cream-200 lg:min-h-[85svh] grid grid-cols-1 lg:grid-cols-12 items-stretch">
      <div
        className={[
          'aspect-[4/5] sm:aspect-[4/3] lg:aspect-auto lg:col-span-7 bg-cream-100',
          isPhotoLeft ? 'lg:order-1' : 'lg:order-2',
        ].join(' ')}
      >
        <Skeleton className="h-full w-full rounded-none" />
      </div>
      <div
        className={[
          'flex flex-col justify-center px-4 py-8 sm:px-8 lg:px-12 xl:px-16 lg:col-span-5 space-y-4',
          isPhotoLeft ? 'lg:order-2' : 'lg:order-1',
        ].join(' ')}
      >
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-10 w-4/5" />
        <Skeleton className="h-24 w-full" />
      </div>
    </div>
  );
}

interface JourneyLightboxProps {
  items: JourneyItemDoc[];
  activeIndex: number | null;
  onClose: () => void;
  onSelect: (index: number) => void;
}

export function JourneyLightbox({
  items,
  activeIndex,
  onClose,
  onSelect,
}: JourneyLightboxProps) {
  const { stop, start } = useLenisContext();
  const dialogRef = useRef<HTMLDivElement>(null);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const item = activeIndex !== null ? items[activeIndex] ?? null : null;

  useFocusTrap(dialogRef, activeIndex !== null, onClose);

  useEffect(() => {
    if (activeIndex === null) return;
    stop();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowRight' && items.length > 1) {
        e.preventDefault();
        onSelect((activeIndex + 1) % items.length);
      } else if (e.key === 'ArrowLeft' && items.length > 1) {
        e.preventDefault();
        onSelect((activeIndex - 1 + items.length) % items.length);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      start();
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [activeIndex, items.length, onClose, onSelect, stop, start]);

  if (!item || activeIndex === null) return null;

  const goPrev = () => onSelect((activeIndex - 1 + items.length) % items.length);
  const goNext = () => onSelect((activeIndex + 1) % items.length);

  return (
    <div
      ref={dialogRef}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-label={`Lightbox ${item.title}`}
      data-lenis-prevent
      className="fixed inset-0 z-50 flex items-center justify-center bg-maroon-950/92 p-4 sm:p-8"
      onClick={onClose}
      onTouchStart={(e) => setTouchStartX(e.touches[0]?.clientX ?? null)}
      onTouchEnd={(e) => {
        if (touchStartX === null || items.length <= 1) return;
        const delta = (e.changedTouches[0]?.clientX ?? touchStartX) - touchStartX;
        if (delta > 50) goPrev();
        else if (delta < -50) goNext();
        setTouchStartX(null);
      }}
    >
      <div
        className="relative max-w-5xl w-full max-h-[90svh] flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-4 text-cream-50">
          <div className="min-w-0">
            <p className="type-caption font-semibold text-gold-300 tabular-nums">
              {activeIndex + 1} / {items.length} · {item.dateLabel}
              {item.badge ? ` · ${item.badge}` : ''}
            </p>
            <h3 className="type-body-lg font-bold truncate">{item.title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup lightbox"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-cream-50 hover:bg-white/20 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="relative flex-1 min-h-0 flex items-center justify-center overflow-hidden rounded-lg bg-black/40">
          <img
            src={item.imageUrl}
            alt={`${item.title} — ${item.dateLabel}`}
            className="max-h-[68svh] w-auto max-w-full object-contain"
          />

          {items.length > 1 && (
            <>
              <button
                type="button"
                onClick={goPrev}
                aria-label="Momen sebelumnya"
                className="absolute left-3 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-maroon-950/75 text-cream-50 hover:bg-maroon-900 cursor-pointer"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={goNext}
                aria-label="Momen berikutnya"
                className="absolute right-3 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-maroon-950/75 text-cream-50 hover:bg-maroon-900 cursor-pointer"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}
        </div>

        {item.description && (
          <p className="type-small leading-6 text-cream-100/90 max-w-3xl">{item.description}</p>
        )}
      </div>
    </div>
  );
}
