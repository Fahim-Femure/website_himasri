import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from 'motion/react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { DURATION, EASING, REDUCED_TRANSITION } from '@/components/motion';
import { DEFAULT_HERO_SLIDES, HERO_COPY } from '@/content/site';
import type { HeroSettings, HeroSlide, IntiOfficer } from '@/types/models';

export interface HeroSlideView {
  id: string;
  imageUrl: string;
  fallbackUrl?: string;
  caption: string;
  focalY?: number;
}

interface HeroSliderProps {
  slides: HeroSlide[];
  settings: HeroSettings;
  heroCopy?: {
    badgeMobile: string;
    title: string;
    subtitle: string;
    ctaPrimary: string;
    ctaSecondary: string;
  };
  periodLabel?: string;
  intiOfficers?: IntiOfficer[];
  compact?: boolean;
  onExploreClick?: () => void;
  onMemberClick?: () => void;
  onSeeBphClick?: () => void;
}

export function HeroSlider({
  slides,
  settings,
  heroCopy = HERO_COPY,
  compact = false,
  onExploreClick,
  onMemberClick,
}: HeroSliderProps) {
  const systemReducedMotion = useReducedMotion();
  const shouldReduceMotion = Boolean(systemReducedMotion && settings.respectReducedMotion);
  const heroRef = useRef<HTMLDivElement>(null);

  // Subtle scroll-driven parallax on hero background (max 10% translateY, scale 1.05 -> 1)
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });
  const bgY = useTransform(scrollYProgress, [0, 1], ['0%', '10%']);
  const bgScale = useTransform(scrollYProgress, [0, 1], [1.05, 1]);
  const enableParallax = !compact && !shouldReduceMotion;

  const activeSlides: HeroSlideView[] =
    slides.length > 0
      ? slides
          .filter((s) => s.active)
          .sort((a, b) => a.order - b.order)
          .map((s) => ({
            id: s.id,
            imageUrl: s.imageUrl,
            caption: s.caption,
            focalY: s.focalY ?? 50,
          }))
      : DEFAULT_HERO_SLIDES.map((s) => ({
          id: s.id,
          imageUrl: s.imageUrl,
          fallbackUrl: s.fallbackUrl,
          caption: s.caption,
          focalY: s.focalY,
        }));

  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [pausedByUser, setPausedByUser] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isFocusedWithin, setIsFocusedWithin] = useState(false);
  const [isTabHidden, setIsTabHidden] = useState(false);

  const total = activeSlides.length;
  const safeIndex = total > 0 ? index % total : 0;
  const currentSlide = activeSlides[safeIndex] ?? DEFAULT_HERO_SLIDES[0];

  const isAutoPaused =
    !settings.autoplay ||
    pausedByUser ||
    isHovered ||
    isFocusedWithin ||
    isTabHidden ||
    shouldReduceMotion ||
    total <= 1;

  const goTo = useCallback(
    (nextIdx: number, dir: number) => {
      if (total <= 1) return;
      setDirection(dir);
      setIndex(((nextIdx % total) + total) % total);
    },
    [total],
  );

  const next = useCallback(() => goTo(safeIndex + 1, 1), [goTo, safeIndex]);
  const prev = useCallback(() => goTo(safeIndex - 1, -1), [goTo, safeIndex]);

  useEffect(() => {
    const handleVisibility = () => {
      setIsTabHidden(document.hidden);
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  useEffect(() => {
    activeSlides.slice(1).forEach((slide) => {
      const img = new Image();
      img.src = slide.imageUrl;
    });
  }, [activeSlides]);

  useEffect(() => {
    if (isAutoPaused) return;
    const ms = (settings.durationSec || 5) * 1000;
    const timer = window.setInterval(() => {
      setDirection(1);
      setIndex((prevIdx) => (prevIdx + 1) % total);
    }, ms);
    return () => window.clearInterval(timer);
  }, [isAutoPaused, settings.durationSec, total]);

  const counterCurrent = String(safeIndex + 1).padStart(2, '0');
  const counterTotal = String(total).padStart(2, '0');

  return (
    <div
      ref={heroRef}
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocusCapture={() => setIsFocusedWithin(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          setIsFocusedWithin(false);
        }
      }}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') {
          e.preventDefault();
          next();
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          prev();
        }
      }}
      role="region"
      aria-roledescription="carousel"
      aria-label="Sorotan kegiatan HIMASRI"
    >
      <div
        className={[
          'relative w-full overflow-hidden bg-maroon-900',
          compact
            ? 'h-[300px] rounded-lg border border-cream-200'
            : 'h-[100vh] h-[100svh] min-h-[560px]',
        ].join(' ')}
      >
        {/* Background Slides with Scroll Parallax */}
        <motion.div
          style={enableParallax ? { y: bgY, scale: bgScale } : undefined}
          className="absolute inset-0 will-change-transform"
        >
          <AnimatePresence initial={false} custom={direction}>
            <motion.div
              key={currentSlide.id}
              custom={direction}
              initial={
                shouldReduceMotion
                  ? { opacity: 0 }
                  : settings.transition === 'slide'
                    ? { opacity: 0, x: direction > 0 ? '6%' : '-6%' }
                    : { opacity: 0 }
              }
              animate={{ opacity: 1, x: 0 }}
              exit={
                shouldReduceMotion
                  ? { opacity: 0 }
                  : settings.transition === 'slide'
                    ? { opacity: 0, x: direction > 0 ? '-6%' : '6%' }
                    : { opacity: 0 }
              }
              transition={
                shouldReduceMotion
                  ? REDUCED_TRANSITION
                  : { duration: DURATION.hero, ease: EASING.standard }
              }
              className="absolute inset-0"
            >
              <img
                ref={(el) => {
                  if (el) {
                    el.setAttribute('fetchpriority', safeIndex === 0 ? 'high' : 'auto');
                  }
                }}
                src={currentSlide.imageUrl}
                alt={currentSlide.caption}
                loading="eager"
                onError={(e) => {
                  if (currentSlide.fallbackUrl && e.currentTarget.src !== currentSlide.fallbackUrl) {
                    e.currentTarget.src = currentSlide.fallbackUrl;
                  }
                }}
                className="h-full w-full object-cover"
                style={{
                  objectPosition:
                    safeIndex === 0
                      ? 'center 42%'
                      : `center ${Math.min(currentSlide.focalY ?? 45, 45)}%`,
                }}
              />
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* Two-Layer Maroon Overlay + Subtle Maroon-950 Vignette (Lighter Mid-Stop on Mobile <768px so Photo Stays Clear) */}
        <div
          className="pointer-events-none absolute inset-0 md:hidden"
          style={{
            background:
              'linear-gradient(180deg, color-mix(in srgb, var(--color-maroon-700) 24%, transparent) 0%, color-mix(in srgb, var(--color-maroon-800) 38%, transparent) 52%, color-mix(in srgb, var(--color-maroon-900) 88%, transparent) 100%)',
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 hidden md:block"
          style={{
            background:
              'linear-gradient(180deg, color-mix(in srgb, var(--color-maroon-700) 35%, transparent) 0%, color-mix(in srgb, var(--color-maroon-800) 55%, transparent) 55%, color-mix(in srgb, var(--color-maroon-900) 88%, transparent) 100%)',
          }}
        />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse at center, transparent 55%, color-mix(in srgb, var(--color-maroon-950) 32%, transparent) 100%)',
          }}
        />
        {/* Top Navbar Contrast Scrim (Navbar 72px + 40px = 112px, Keeps Links >= 4.5:1 Without Darkening Photo) */}
        {!compact && (
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-[112px]"
            style={{
              background:
                'linear-gradient(180deg, color-mix(in srgb, var(--color-maroon-950) 55%, transparent) 0%, transparent 112px)',
            }}
          />
        )}

        {/* Foreground Content (Bottom-Left Anchored in Non-Compact Mode) */}
        <div
          className={[
            'relative z-10 flex h-full flex-col',
            compact
              ? 'justify-between p-5'
              : 'public-container justify-end pt-[88px] md:pt-[96px] pb-[max(3.5rem,calc(env(safe-area-inset-bottom)+2.75rem))] sm:pb-16 lg:pb-16 gap-5 sm:gap-6',
          ].join(' ')}
        >
          <div className={compact ? 'max-w-md space-y-2' : 'max-w-2xl space-y-3 sm:space-y-4'}>
            {compact ? (
              <Badge variant="neutral" className="type-caption">
                {heroCopy.badgeMobile}
              </Badge>
            ) : (
              heroCopy.badgeMobile && (
                <span className="glass-dark inline-flex items-center rounded-full px-3.5 py-1 type-caption font-semibold tracking-[0.04em] text-gold-300">
                  {heroCopy.badgeMobile}
                </span>
              )
            )}

            {compact ? (
              <motion.h2
                initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={
                  shouldReduceMotion
                    ? REDUCED_TRANSITION
                    : { duration: DURATION.medium, ease: EASING.enter }
                }
                className="type-h2 leading-7 font-bold text-cream-50"
              >
                {heroCopy.title}
              </motion.h2>
            ) : (
              <motion.h1
                initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={
                  shouldReduceMotion
                    ? REDUCED_TRANSITION
                    : { duration: DURATION.slow, ease: EASING.enter }
                }
                className="text-3xl leading-[1.12] sm:text-4xl md:text-5xl lg:text-6xl md:leading-[1.06] font-extrabold tracking-[-0.025em] text-cream-50 max-w-[16ch]"
              >
                {heroCopy.title}
              </motion.h1>
            )}

            <motion.p
              initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={
                shouldReduceMotion
                  ? REDUCED_TRANSITION
                  : { duration: DURATION.slow, delay: 0.1, ease: EASING.enter }
              }
              className={
                compact
                  ? 'type-label text-cream-100/90 line-clamp-2'
                  : 'type-app-body leading-6 sm:type-body sm:leading-7 md:type-body-lg text-cream-100 max-w-xl'
              }
            >
              {heroCopy.subtitle}
            </motion.p>

            {!compact && (
              <motion.div
                initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={
                  shouldReduceMotion
                    ? REDUCED_TRANSITION
                    : { duration: DURATION.slow, delay: 0.18, ease: EASING.enter }
                }
                className="flex flex-wrap items-center gap-3 pt-1"
              >
                <Button variant="gold" pill size="lg" arrowRight onClick={onExploreClick}>
                  {heroCopy.ctaPrimary}
                </Button>
                <Button variant="outlineOnDark" pill size="lg" onClick={onMemberClick}>
                  {heroCopy.ctaSecondary}
                </Button>
              </motion.div>
            )}
          </div>

          {/* Bottom Controls (Left) + Separated Slide Caption (Bottom-Right) */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div
              className={[
                'glass-dark inline-flex max-w-full flex-wrap items-center gap-2 sm:gap-2.5 rounded-full px-2.5 py-1.5 text-cream-50',
                compact ? 'type-caption' : 'type-label sm:type-small',
              ].join(' ')}
            >
              <button
                type="button"
                onClick={() => setPausedByUser((p) => !p)}
                aria-label={isAutoPaused ? 'Putar slideshow' : 'Jeda slideshow'}
                className="flex h-11 w-11 md:h-9 md:w-9 items-center justify-center rounded-full bg-white/10 text-cream-50 hover:bg-white/20 transition-colors cursor-pointer"
              >
                {isAutoPaused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
              </button>

              {total > 1 && (
                <>
                  <button
                    type="button"
                    onClick={prev}
                    aria-label="Foto sebelumnya"
                    className="hidden sm:flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-cream-50 hover:bg-white/20 transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={next}
                    aria-label="Foto berikutnya"
                    className="hidden sm:flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-cream-50 hover:bg-white/20 transition-colors cursor-pointer"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </>
              )}

              <div className="flex items-center gap-1" role="tablist" aria-label="Pilih foto hero">
                {activeSlides.map((slide, idx) => {
                  const active = idx === safeIndex;
                  return (
                    <button
                      key={slide.id}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      aria-label={`Slide ${idx + 1}: ${slide.caption}`}
                      onClick={() => goTo(idx, idx >= safeIndex ? 1 : -1)}
                      className="flex min-h-11 min-w-11 md:min-h-0 md:min-w-0 md:h-8 items-center justify-center px-1 cursor-pointer"
                    >
                      <motion.span
                        layout
                        transition={
                          shouldReduceMotion
                            ? { duration: 0 }
                            : { duration: DURATION.medium, ease: EASING.enter }
                        }
                        className={[
                          'block h-2 rounded-full transition-colors',
                          active ? 'w-7 bg-gold-300' : 'w-2 bg-white/45 hover:bg-white/80',
                        ].join(' ')}
                      />
                    </button>
                  );
                })}
              </div>

              <div
                aria-live="polite"
                className="flex items-center gap-1 font-medium tabular-nums text-cream-100 pr-2"
              >
                <span className="text-white font-semibold">{counterCurrent}</span>
                <span className="text-cream-100/75">/ {counterTotal}</span>
              </div>
            </div>

            {currentSlide.caption && (
              <AnimatePresence mode="wait">
                <motion.p
                  key={currentSlide.id + currentSlide.caption}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: shouldReduceMotion ? DURATION.fast : DURATION.medium }}
                  className={
                    compact
                      ? 'type-caption text-cream-100/90 truncate max-w-[180px]'
                      : 'hidden md:block glass-dark rounded-full px-4 py-2 type-label font-medium text-cream-50 truncate max-w-[340px]'
                  }
                >
                  {currentSlide.caption}
                </motion.p>
              </AnimatePresence>
            )}
          </div>
        </div>

        {/* Bottom-Center Scroll Indicator (Non-Compact Only) */}
        {!compact && (
          <button
            type="button"
            onClick={onExploreClick}
            aria-label="Gulir ke bagian Tentang HIMASRI"
            className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 inline-flex min-h-11 min-w-11 flex-col items-center justify-center gap-0.5 px-3 type-micro font-semibold uppercase tracking-[0.16em] text-cream-100/90 hover:text-gold-300 transition-colors cursor-pointer"
          >
            <span>Scroll</span>
            <motion.span
              aria-hidden="true"
              animate={shouldReduceMotion ? undefined : { y: [0, 4, 0] }}
              transition={
                shouldReduceMotion
                  ? undefined
                  : { duration: 1.8, repeat: Infinity, ease: 'easeInOut' }
              }
              className="flex items-center justify-center"
            >
              <ChevronDown className="h-4 w-4 text-gold-300" />
            </motion.span>
          </button>
        )}
      </div>
    </div>
  );
}
