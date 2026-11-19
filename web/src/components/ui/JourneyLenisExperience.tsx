import { useMemo, useRef } from 'react';
import { ArrowLeft, Calendar, Expand, ImagePlus } from 'lucide-react';
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from 'motion/react';
import { Link } from 'react-router-dom';
import { HorizontalPinnedGallery } from '@/components/motion/HorizontalPinnedGallery';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { PUBLIC_NAVBAR_HEIGHT, useLenisContext } from '@/contexts/LenisContext';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import type { JourneyItemDoc } from '@/types/models';

/* -------------------------------------------------------------------------- */
/* 1. PINNED INTRO (±200vh)                                                   */
/* -------------------------------------------------------------------------- */

interface JourneyPinnedIntroProps {
  totalCount: number;
  years: number[];
  canEditJourney: boolean;
}

export function JourneyPinnedIntro({
  totalCount,
  years,
  canEditJourney,
}: JourneyPinnedIntroProps) {
  const prefersReduced = useReducedMotion();
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  const line1Y = useTransform(scrollYProgress, [0, 0.35], [0, -24]);
  const line2Y = useTransform(scrollYProgress, [0, 0.45], [32, -8]);
  const line2Opacity = useTransform(scrollYProgress, [0, 0.28], [0.55, 1]);
  const metaY = useTransform(scrollYProgress, [0.1, 0.55], [28, 0]);
  const metaOpacity = useTransform(scrollYProgress, [0.05, 0.42], [0.7, 1]);

  const usePinned = isDesktop && !prefersReduced;

  return (
    <section
      ref={containerRef}
      className={
        usePinned
          ? 'relative h-[190svh] bg-maroon-950 text-cream-50'
          : 'relative bg-maroon-950 text-cream-50 pt-28 pb-16'
      }
    >
      <div
        className={
          usePinned
            ? 'sticky top-0 h-dvh overflow-hidden flex flex-col justify-between pt-24 pb-12 px-6 lg:px-14'
            : 'public-container flex flex-col gap-8'
        }
        style={{
          background: 'var(--g-journey-intro)',
        }}
      >
        {/* Top bar inside intro */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link to="/">
            <Button variant="outlineOnDark" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />}>
              Kembali ke Beranda
            </Button>
          </Link>

          {canEditJourney && (
            <Link to="/kelola/journey">
              <Button variant="gold" size="sm" leftIcon={<ImagePlus className="h-4 w-4" />}>
                Kelola Foto Journey
              </Button>
            </Link>
          )}
        </div>

        {/* Giant Editorial Display Title */}
        <div className="my-auto max-w-[1400px]">
          <p className="type-caption sm:type-label font-bold uppercase tracking-[0.14em] text-gold-300 mb-4">
            Sejak waktu HIMASRI · Institut Teknologi PLN
          </p>

          <h1
            className="font-extrabold uppercase tracking-[-0.035em] leading-[0.92] text-cream-50"
            style={{ fontSize: 'clamp(3rem, 10.5vw, 9.5rem)' }}
          >
            <motion.span
              className="block"
              style={usePinned ? { y: line1Y } : undefined}
            >
              PERJALANAN
            </motion.span>
            <motion.span
              className="block text-gold-300"
              style={usePinned ? { y: line2Y, opacity: line2Opacity } : undefined}
            >
              HIMASRI
            </motion.span>
          </h1>

          <motion.div
            style={usePinned ? { y: metaY, opacity: metaOpacity } : undefined}
            className="mt-6 sm:mt-8 flex flex-col md:flex-row md:items-end justify-between gap-6 border-t border-white/15 pt-6"
          >
            <p className="max-w-xl type-body sm:type-body-lg leading-7 text-cream-100/85">
              Rekam jejak kebersamaan, kaderisasi, pengabdian sosial, dan estafet kepengurusan
              mahasiswa Sumatera Selatan di IT PLN dari masa ke masa.
            </p>
            <div className="flex flex-wrap items-center gap-3 type-small font-semibold text-gold-300 tabular-nums shrink-0">
              <span>{totalCount} momen terdokumentasi</span>
              {years.length > 0 && (
                <span className="text-cream-100/60">
                  · {years[0]}–{years[years.length - 1]}
                </span>
              )}
            </div>
          </motion.div>
        </div>

        {usePinned && (
          <div className="flex items-center justify-between type-caption uppercase tracking-[0.1em] text-cream-100/60">
            <span>Gulir ke bawah untuk menelusuri linimasa</span>
            <span className="tabular-nums">01 — {String(totalCount).padStart(2, '0')}</span>
          </div>
        )}
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* 2. HORIZONTAL PINNED GALLERY (Desktop) + VERTICAL FALLBACK (Mobile/PRM)    */
/* -------------------------------------------------------------------------- */

interface HorizontalPanelProps {
  item: JourneyItemDoc;
  index: number;
  total: number;
  scrollYProgress: MotionValue<number>;
  mini?: boolean;
  onImageClick: () => void;
  onPanelFocus: (index: number) => void;
}

function HorizontalGalleryPanel({
  item,
  index,
  total,
  scrollYProgress,
  mini = false,
  onImageClick,
  onPanelFocus,
}: HorizontalPanelProps) {
  const isPhotoTop = index % 2 === 0;
  const orderLabel = String(index + 1).padStart(2, '0');
  const altText = `${item.title} — ${item.dateLabel}`;

  // Parallax inside photo opposite to horizontal track direction (max ±8%)
  const panelCenter = total > 1 ? index / (total - 1) : 0.5;
  const imgX = useTransform(
    scrollYProgress,
    [Math.max(0, panelCenter - 0.35), Math.min(1, panelCenter + 0.35)],
    ['-7%', '7%'],
  );

  const photoBlock = (
    <button
      type="button"
      onClick={onImageClick}
      aria-label={`Perbesar foto ${altText}`}
      className={[
        'group relative w-full overflow-hidden rounded-lg bg-maroon-950 text-left cursor-pointer focus-visible:outline-none',
        mini ? 'h-[42vh] max-h-[380px]' : 'h-[50vh] lg:h-[54vh] max-h-[520px]',
      ].join(' ')}
    >
      <motion.img
        ref={(el) => {
          if (el) el.setAttribute('fetchpriority', index === 0 ? 'high' : 'auto');
        }}
        src={item.imageUrl}
        alt={altText}
        width={item.width || 1600}
        height={item.height || 1067}
        loading={index < 2 ? 'eager' : 'lazy'}
        decoding="async"
        style={{ x: imgX, scale: 1.15 }}
        className="h-full w-full object-cover"
      />
      <span className="glass-dark absolute bottom-3 right-3 z-10 inline-flex items-center gap-1.5 rounded-full px-3 py-1 type-caption font-semibold text-cream-50 group-hover:bg-maroon-900">
        <Expand className="h-3.5 w-3.5" aria-hidden="true" />
        <span>Perbesar</span>
      </span>
    </button>
  );

  const textBlock = (
    <div className="relative flex flex-col justify-center gap-2.5 py-2">
      <span
        aria-hidden="true"
        className="pointer-events-none select-none absolute -top-8 right-2 font-extrabold leading-none text-maroon-700/[0.06] type-display-num tracking-tighter"
      >
        {orderLabel}
      </span>
      <div className="relative z-10 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 type-label font-semibold text-maroon-700 tabular-nums">
          <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
          <span>{item.dateLabel}</span>
        </span>
        {item.badge && <Badge variant="maroon">{item.badge}</Badge>}
      </div>
      <h2 className="relative z-10 text-2xl lg:text-3xl font-extrabold tracking-[-0.02em] text-ink-900 leading-tight">
        {item.title}
      </h2>
      {item.description && (
        <p className="relative z-10 max-w-prose type-app-body leading-6 text-ink-600">
          {item.description}
        </p>
      )}
    </div>
  );

  return (
    <article
      tabIndex={0}
      onFocus={() => onPanelFocus(index)}
      className={[
        'shrink-0 h-full flex flex-col justify-center gap-5 px-5 lg:px-8 focus-visible:outline-none',
        mini ? 'w-[68vw] xl:w-[58vw]' : 'w-[78vw] xl:w-[70vw]',
      ].join(' ')}
    >
      {isPhotoTop ? (
        <>
          {photoBlock}
          {textBlock}
        </>
      ) : (
        <>
          {textBlock}
          {photoBlock}
        </>
      )}
    </article>
  );
}

interface JourneyHorizontalGalleryProps {
  items: JourneyItemDoc[];
  mini?: boolean;
  onImageClick: (index: number) => void;
  onScrollTo?: (y: number) => void;
}

export function JourneyHorizontalGallery({
  items,
  mini = false,
  onImageClick,
  onScrollTo,
}: JourneyHorizontalGalleryProps) {
  const { scrollTo: lenisScrollTo } = useLenisContext();

  const years = useMemo(() => {
    const set = new Set<number>();
    items.forEach((i) => set.add(i.year));
    return Array.from(set).sort((a, b) => a - b);
  }, [items]);

  const wrapperHeightVh = mini
    ? Math.max(220, items.length * 65)
    : Math.max(260, items.length * 80);

  return (
    <HorizontalPinnedGallery
      items={items}
      getKey={(item) => item.id}
      wrapperHeightVh={wrapperHeightVh}
      bgClassName="bg-cream-50"
      progressTrackClassName="bg-cream-200"
      progressFillClassName="bg-maroon-700"
      onScrollTo={onScrollTo}
      renderTopBar={({ activeIndex, total, scrollToPanel }) => {
        const activeYear = items[activeIndex]?.year ?? items[0]?.year ?? 2023;
        return (
          <div className="z-20 px-6 lg:px-10 py-3 flex items-center justify-between gap-4 border-b border-cream-200 bg-cream-50">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center rounded-full bg-maroon-950 px-3.5 py-1 type-label font-bold tracking-wider text-gold-300 tabular-nums">
                {activeYear}
              </span>
              <span className="type-label font-semibold text-ink-600 tabular-nums">
                {String(activeIndex + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
              </span>
            </div>

            {!mini && years.length > 1 && (
              <nav aria-label="Lompat ke tahun" className="flex items-center gap-1.5">
                {years.map((y) => {
                  const isCurrent = y === activeYear;
                  return (
                    <button
                      key={y}
                      type="button"
                      onClick={() => {
                        const firstIdx = items.findIndex((i) => i.year === y);
                        if (firstIdx >= 0) scrollToPanel(firstIdx);
                      }}
                      className={[
                        'min-h-[34px] rounded-full px-3.5 py-1 type-label font-semibold tabular-nums transition-colors cursor-pointer',
                        isCurrent
                          ? 'bg-maroon-700 text-cream-50'
                          : 'bg-white border border-cream-300 text-ink-900 hover:bg-cream-100',
                      ].join(' ')}
                    >
                      {y}
                    </button>
                  );
                })}
              </nav>
            )}
          </div>
        );
      }}
      renderPanel={(item, idx, ctx) => (
        <HorizontalGalleryPanel
          item={item}
          index={idx}
          total={ctx.total}
          scrollYProgress={ctx.scrollYProgress}
          mini={mini}
          onImageClick={() => onImageClick(idx)}
          onPanelFocus={ctx.scrollToPanel}
        />
      )}
      renderMobileFallback={() => {
        if (mini) {
          return (
            <div className="overflow-x-auto pb-4 px-4 flex gap-4 snap-x snap-mandatory">
              {items.map((item, idx) => (
                <article
                  key={item.id}
                  className="w-[86vw] shrink-0 snap-center rounded-lg bg-white border border-cream-200 overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => onImageClick(idx)}
                    aria-label={`Perbesar foto ${item.title} — ${item.dateLabel}`}
                    className="block w-full aspect-[4/3] overflow-hidden bg-maroon-950 cursor-pointer"
                  >
                    <img
                      src={item.imageUrl}
                      alt={`${item.title} — ${item.dateLabel}`}
                      width={item.width || 1600}
                      height={item.height || 1067}
                      loading={idx === 0 ? 'eager' : 'lazy'}
                      decoding="async"
                      className="h-full w-full object-cover"
                    />
                  </button>
                  <div className="p-4 space-y-2">
                    <div className="flex items-center gap-2 type-caption font-semibold text-maroon-700">
                      <span>{item.dateLabel}</span>
                      {item.badge && <Badge variant="maroon">{item.badge}</Badge>}
                    </div>
                    <h3 className="type-body-lg font-bold text-ink-900">{item.title}</h3>
                    <p className="type-small leading-6 text-ink-600">{item.description}</p>
                  </div>
                </article>
              ))}
            </div>
          );
        }

        return (
          <div className="bg-cream-50">
            {years.length > 1 && (
              <div className="sticky top-[72px] z-30 bg-cream-50/95 border-b border-cream-200 px-4 py-2.5 flex gap-2 overflow-x-auto">
                {years.map((y) => (
                  <button
                    key={y}
                    type="button"
                    onClick={() => {
                      lenisScrollTo(`#journey-year-${y}`, { offset: -(PUBLIC_NAVBAR_HEIGHT + 56) });
                    }}
                    className="min-h-11 min-w-11 rounded-full border border-cream-300 bg-white px-4 py-1.5 type-app-meta text-ink-900 shrink-0 tabular-nums cursor-pointer"
                  >
                    {y}
                  </button>
                ))}
              </div>
            )}
            <div className="divide-y divide-cream-200">
              {items.map((item, idx) => {
                const isFirstOfYear = idx === 0 || items[idx - 1]?.year !== item.year;
                return (
                  <article
                    key={item.id}
                    id={isFirstOfYear ? `journey-year-${item.year}` : undefined}
                    className="w-full"
                  >
                    <button
                      type="button"
                      onClick={() => onImageClick(idx)}
                      aria-label={`Perbesar foto ${item.title} — ${item.dateLabel}`}
                      className="block w-full aspect-[4/3] overflow-hidden bg-maroon-950"
                    >
                      <img
                        ref={(el) => {
                          if (el) el.setAttribute('fetchpriority', idx === 0 ? 'high' : 'auto');
                        }}
                        src={item.imageUrl}
                        alt={`${item.title} — ${item.dateLabel}`}
                        width={item.width || 1600}
                        height={item.height || 1067}
                        loading={idx < 2 ? 'eager' : 'lazy'}
                        decoding="async"
                        className="h-full w-full object-cover"
                      />
                    </button>
                    <div className="px-4 py-6 space-y-2.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="type-caption font-bold text-maroon-700 tabular-nums">
                          {String(idx + 1).padStart(2, '0')} · {item.dateLabel}
                        </span>
                        {item.badge && <Badge variant="maroon">{item.badge}</Badge>}
                      </div>
                      <h2 className="text-2xl font-extrabold text-ink-900">{item.title}</h2>
                      <p className="max-w-prose type-app-body leading-7 text-ink-600">
                        {item.description}
                      </p>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        );
      }}
    />
  );
}

/* -------------------------------------------------------------------------- */
/* 3. HIGHLIGHT STACKED CARDS (Pinned 01–07 Pattern)                          */
/* -------------------------------------------------------------------------- */

interface StackCardProps {
  item: JourneyItemDoc;
  index: number;
  total: number;
  scrollYProgress: MotionValue<number>;
  onImageClick: () => void;
}

function StackedHighlightCard({
  item,
  index,
  total,
  scrollYProgress,
  onImageClick,
}: StackCardProps) {
  const step = 1 / Math.max(1, total);
  const start = index * step * 0.85;
  const end = Math.min(1, start + step * 0.9);

  // Cards enter from right/bottom and settle into staggered stack offset (48px per card)
  const settledX = index * 48;
  const x = useTransform(
    scrollYProgress,
    [Math.max(0, start - 0.05), end],
    [index === 0 ? 0 : 420, settledX],
  );
  const y = useTransform(
    scrollYProgress,
    [Math.max(0, start - 0.05), end],
    [index === 0 ? 0 : 90, index * 8],
  );
  const opacity = useTransform(
    scrollYProgress,
    [Math.max(0, start - 0.04), Math.min(1, start + 0.08)],
    [index === 0 ? 1 : 0, 1],
  );
  const scale = useTransform(
    scrollYProgress,
    [end, 1],
    [1, Math.max(0.9, 1 - (total - 1 - index) * 0.025)],
  );

  return (
    <motion.article
      style={{ x, y, opacity, scale, zIndex: index + 1 }}
      className="absolute left-0 top-0 w-[340px] lg:w-[400px] rounded-xl overflow-hidden bg-cream-50 text-ink-900 border border-cream-200 shadow-raised will-change-transform"
    >
      <button
        type="button"
        onClick={onImageClick}
        aria-label={`Perbesar foto ${item.title} — ${item.dateLabel}`}
        className="block w-full aspect-[16/10] overflow-hidden bg-maroon-950 cursor-pointer"
      >
        <img
          src={item.imageUrl}
          alt={`${item.title} — ${item.dateLabel}`}
          width={item.width || 1600}
          height={item.height || 1067}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover"
        />
      </button>
      <div className="p-5 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <span className="type-caption font-bold uppercase tracking-wider text-maroon-700 tabular-nums">
            {String(index + 1).padStart(2, '0')} · {item.dateLabel}
          </span>
          {item.badge && <Badge variant="maroon">{item.badge}</Badge>}
        </div>
        <h3 className="type-body-lg leading-6 font-extrabold text-ink-900">{item.title}</h3>
        <p className="type-small leading-6 text-ink-600 line-clamp-3">{item.description}</p>
      </div>
    </motion.article>
  );
}

interface JourneyHighlightStackProps {
  items: JourneyItemDoc[];
  onSelectItem: (itemId: string) => void;
}

export function JourneyHighlightStack({ items, onSelectItem }: JourneyHighlightStackProps) {
  const prefersReduced = useReducedMotion();
  const isTabletUp = useMediaQuery('(min-width: 768px)');
  const enablePinned = isTabletUp && !prefersReduced;
  const wrapperRef = useRef<HTMLDivElement>(null);

  const highlights = useMemo(() => {
    const flagged = items.filter((i) => i.highlight);
    if (flagged.length >= 4) return flagged.slice(0, 7);
    return items.slice(0, Math.min(5, items.length));
  }, [items]);

  const { scrollYProgress } = useScroll({
    target: wrapperRef,
    offset: ['start start', 'end end'],
  });

  if (highlights.length === 0) return null;

  if (!enablePinned) {
    return (
      <section className="bg-maroon-950 text-cream-50 py-14 px-4 space-y-8">
        <div className="space-y-2">
          <p className="type-caption font-bold uppercase tracking-[0.12em] text-gold-300">
            Sorotan Utama
          </p>
          <h2 className="text-3xl font-extrabold">Momen yang membentuk kami</h2>
        </div>
        <div className="space-y-4">
          {highlights.map((item, idx) => (
            <article
              key={item.id}
              className="rounded-lg overflow-hidden bg-cream-50 text-ink-900 border border-cream-200"
            >
              <button
                type="button"
                onClick={() => onSelectItem(item.id)}
                aria-label={`Perbesar foto ${item.title} — ${item.dateLabel}`}
                className="block w-full aspect-[16/10] overflow-hidden bg-maroon-950 cursor-pointer"
              >
                <img
                  src={item.imageUrl}
                  alt={`${item.title} — ${item.dateLabel}`}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover"
                />
              </button>
              <div className="p-4 space-y-1.5">
                <p className="type-caption font-bold text-maroon-700 tabular-nums">
                  {String(idx + 1).padStart(2, '0')} · {item.dateLabel}
                </p>
                <h3 className="type-body-lg font-bold text-ink-900">{item.title}</h3>
                <p className="type-small leading-6 text-ink-600">{item.description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section
      ref={wrapperRef}
      style={{ height: `${Math.max(240, highlights.length * 65)}vh` }}
      className="relative w-full bg-maroon-950 text-cream-50"
    >
      <div className="sticky top-0 h-dvh overflow-hidden flex items-center px-8 lg:px-14">
        <div className="public-container w-full grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-4 space-y-4">
            <p className="type-caption font-bold uppercase tracking-[0.12em] text-gold-300">
              Sorotan Utama · 01–{String(highlights.length).padStart(2, '0')}
            </p>
            <h2 className="text-3xl lg:text-5xl font-extrabold leading-[1.08] text-cream-50">
              Momen yang membentuk kami
            </h2>
            <p className="type-app-body leading-7 text-cream-100/80">
              Tonggak penting yang menumbuhkan solidaritas, tradisi Palembang, dan estafet
              kepengurusan HIMASRI di IT PLN.
            </p>
          </div>

          <div className="lg:col-span-8 relative h-[430px] lg:h-[460px]">
            {highlights.map((item, idx) => (
              <StackedHighlightCard
                key={item.id}
                item={item}
                index={idx}
                total={highlights.length}
                scrollYProgress={scrollYProgress}
                onImageClick={() => onSelectItem(item.id)}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* 4. EDITORIAL OUTRO                                                         */
/* -------------------------------------------------------------------------- */

export function JourneyPinnedOutro() {
  const prefersReduced = useReducedMotion();
  const isTabletUp = useMediaQuery('(min-width: 768px)');
  const sectionRef = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'center center'],
  });
  const slideX = useTransform(scrollYProgress, [0, 1], [80, 0]);
  const opacity = useTransform(scrollYProgress, [0, 0.7], [0.25, 1]);

  const animateSlide = isTabletUp && !prefersReduced;

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden bg-cream-100 py-24 md:py-36 px-6 border-t border-cream-200"
    >
      <div className="public-container text-center space-y-6">
        <p className="type-caption font-bold uppercase tracking-[0.14em] text-maroon-700">
          Babak Berikutnya
        </p>

        <motion.h2
          style={animateSlide ? { x: slideX, opacity } : undefined}
          className="font-extrabold uppercase tracking-[-0.03em] leading-[0.98] text-ink-900 mx-auto max-w-5xl"
          // Giant responsive display headline
        >
          <span style={{ fontSize: 'clamp(2.5rem, 7.5vw, 6.5rem)' }}>
            PERJALANAN MASIH BERLANJUT
          </span>
        </motion.h2>

        <p className="mx-auto max-w-xl type-body leading-7 text-ink-600">
          Jadilah bagian dari babak baru keluarga besar mahasiswa Sumatera Selatan di Institut
          Teknologi PLN.
        </p>

        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
          <Link to="/daftar">
            <Button variant="primary" pill size="lg" arrowRight>
              Gabung HIMASRI
            </Button>
          </Link>
          <Link to="/">
            <Button variant="secondary" pill size="lg">
              Kembali ke Beranda
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
