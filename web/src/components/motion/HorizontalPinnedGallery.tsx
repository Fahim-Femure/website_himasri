import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from 'motion/react';
import { useLenisContext } from '@/contexts/LenisContext';
import { useMediaQuery } from '@/hooks/useMediaQuery';

export interface HorizontalPanelContext {
  scrollYProgress: MotionValue<number>;
  total: number;
  scrollToPanel: (index: number) => void;
}

export interface HorizontalTopBarContext {
  activeIndex: number;
  total: number;
  scrollToPanel: (index: number) => void;
}

interface HorizontalPinnedGalleryProps<T> {
  items: T[];
  getKey: (item: T, index: number) => string;
  renderPanel: (item: T, index: number, ctx: HorizontalPanelContext) => ReactNode;
  renderTopBar?: (ctx: HorizontalTopBarContext) => ReactNode;
  renderMobileFallback: () => ReactNode;
  wrapperHeightVh?: number;
  bgClassName?: string;
  progressTrackClassName?: string;
  progressFillClassName?: string;
  onScrollTo?: (y: number) => void;
}

export function HorizontalPinnedGallery<T>({
  items,
  getKey,
  renderPanel,
  renderTopBar,
  renderMobileFallback,
  wrapperHeightVh,
  bgClassName = 'bg-cream-50',
  progressTrackClassName = 'bg-cream-200',
  progressFillClassName = 'bg-maroon-700',
  onScrollTo,
}: HorizontalPinnedGalleryProps<T>) {
  const prefersReduced = useReducedMotion();
  const { scrollTo: lenisScrollTo } = useLenisContext();
  const isTabletUp = useMediaQuery('(min-width: 768px)');
  const enablePinnedHorizontal = isTabletUp && !prefersReduced;

  const wrapperRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [maxTranslate, setMaxTranslate] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!enablePinnedHorizontal) return;
    const track = trackRef.current;
    if (!track) return;

    const measure = () => {
      const vw = window.innerWidth;
      const trackWidth = track.scrollWidth;
      setMaxTranslate(Math.max(0, trackWidth - vw));
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(track);
    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [enablePinnedHorizontal, items.length]);

  const { scrollYProgress } = useScroll({
    target: wrapperRef,
    offset: ['start start', 'end end'],
  });

  const trackX = useTransform(scrollYProgress, [0, 1], [0, -maxTranslate]);

  useMotionValueEvent(scrollYProgress, 'change', (latest) => {
    if (items.length === 0) return;
    const idx = Math.min(items.length - 1, Math.max(0, Math.round(latest * (items.length - 1))));
    setActiveIndex(idx);
  });

  const scrollToPanel = (targetIdx: number) => {
    const wrapper = wrapperRef.current;
    if (!wrapper || items.length <= 1) return;
    const wrapperTop = wrapper.getBoundingClientRect().top + window.scrollY;
    const scrollable = Math.max(1, wrapper.offsetHeight - window.innerHeight);
    const ratio = targetIdx / (items.length - 1);
    const targetY = wrapperTop + ratio * scrollable;
    if (onScrollTo) {
      onScrollTo(targetY);
    } else {
      lenisScrollTo(targetY);
    }
  };

  if (!enablePinnedHorizontal) {
    return <>{renderMobileFallback()}</>;
  }

  const heightVh = wrapperHeightVh ?? Math.max(260, items.length * 80);

  return (
    <div
      ref={wrapperRef}
      style={{ height: `${heightVh}vh` }}
      className={['relative w-full', bgClassName].join(' ')}
    >
      <div className="sticky top-0 h-dvh overflow-hidden flex flex-col justify-between pt-[72px]">
        {renderTopBar ? renderTopBar({ activeIndex, total: items.length, scrollToPanel }) : null}

        <div className="flex-1 min-h-0 flex items-center overflow-hidden">
          <motion.div
            ref={trackRef}
            style={{ x: trackX }}
            className="flex items-stretch h-full pl-6 lg:pl-12 pr-[12vw] will-change-transform"
          >
            {items.map((item, idx) => (
              <div key={getKey(item, idx)} className="shrink-0 h-full flex">
                {renderPanel(item, idx, { scrollYProgress, total: items.length, scrollToPanel })}
              </div>
            ))}
          </motion.div>
        </div>

        <div className={['h-1 w-full', progressTrackClassName].join(' ')}>
          <motion.div
            style={{ scaleX: scrollYProgress }}
            className={['h-full w-full origin-left', progressFillClassName].join(' ')}
          />
        </div>
      </div>
    </div>
  );
}
