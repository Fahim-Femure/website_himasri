import { motion, useTransform, type MotionValue } from 'motion/react';
import { HorizontalPinnedGallery } from '@/components/motion/HorizontalPinnedGallery';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type { CultureItem } from '@/content/site';

const CULTURE_PLACEHOLDER_BG: Record<string, string> = {
  songket: 'var(--color-culture-songket)',
  pempek: 'var(--color-culture-pempek)',
  ampera: 'var(--color-culture-ampera)',
  limas: 'var(--color-culture-limas)',
  gending: 'var(--color-culture-gending)',
  musi: 'var(--color-culture-musi)',
};

interface BudayaPanelProps {
  item: CultureItem;
  index: number;
  total: number;
  scrollYProgress: MotionValue<number>;
  onPanelFocus: (index: number) => void;
  onCtaClick?: () => void;
}

function BudayaGalleryPanel({
  item,
  index,
  total,
  scrollYProgress,
  onPanelFocus,
  onCtaClick,
}: BudayaPanelProps) {
  const isPhotoTop = index % 2 === 0;
  const isLast = index === total - 1;
  const orderLabel = String(index + 1).padStart(2, '0');
  const panelCenter = total > 1 ? index / (total - 1) : 0.5;
  const imgX = useTransform(
    scrollYProgress,
    [Math.max(0, panelCenter - 0.35), Math.min(1, panelCenter + 0.35)],
    ['-7%', '7%'],
  );

  const placeholderBg = CULTURE_PLACEHOLDER_BG[item.id] ?? 'var(--color-culture-fallback)';

  const photoBlock = (
    <div
      className="relative w-full h-[48vh] lg:h-[54vh] max-h-[500px] overflow-hidden rounded-lg"
      style={{ backgroundColor: placeholderBg }}
    >
      <motion.img
        ref={(el) => {
          if (el) el.setAttribute('fetchpriority', index < 2 ? 'high' : 'auto');
        }}
        src={item.imageUrl || `/assets/images/budaya/${item.id}.webp`}
        alt={`${item.title} — ${item.category} Palembang`}
        width={1600}
        height={1067}
        loading={index < 2 ? 'eager' : 'lazy'}
        decoding="async"
        style={{ x: imgX, scale: 1.15 }}
        className="h-full w-full object-cover"
      />
      {item.imageCredit && (
        <span className="glass-dark absolute bottom-3 left-3 z-10 rounded-full px-3 py-1 type-micro font-medium text-cream-50">
          {item.imageCredit}
        </span>
      )}
    </div>
  );

  const textBlock = (
    <div className="relative flex flex-col justify-center gap-2.5 py-2">
      <span
        aria-hidden="true"
        className="pointer-events-none select-none absolute -top-8 right-2 font-extrabold leading-none text-maroon-700/[0.07] type-display-num tracking-tighter"
      >
        {orderLabel}
      </span>
      <div className="relative z-10 flex flex-wrap items-center gap-2">
        <Badge variant="maroon">{item.category}</Badge>
        <span className="type-caption font-semibold text-ink-600 tabular-nums">
          {orderLabel} / {String(total).padStart(2, '0')}
        </span>
      </div>
      <h3 className="relative z-10 text-2xl lg:text-3xl font-extrabold tracking-[-0.02em] text-ink-900 leading-tight">
        {item.title}
      </h3>
      <p className="relative z-10 max-w-prose type-app-body leading-6 text-ink-600">
        {item.description}
      </p>
      {isLast && onCtaClick && (
        <div className="relative z-10 pt-2">
          <Button variant="primary" pill size="sm" arrowRight onClick={onCtaClick}>
            Kenali HIMASRI
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <article
      tabIndex={0}
      onFocus={() => onPanelFocus(index)}
      className="w-[76vw] xl:w-[68vw] shrink-0 h-full flex flex-col justify-center gap-5 px-5 lg:px-8 focus-visible:outline-none"
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

interface BudayaHorizontalGalleryProps {
  items: CultureItem[];
  onCtaClick?: () => void;
}

export function BudayaHorizontalGallery({ items, onCtaClick }: BudayaHorizontalGalleryProps) {
  return (
    <HorizontalPinnedGallery
      items={items}
      getKey={(item) => item.id}
      bgClassName="bg-cream-100"
      progressTrackClassName="bg-cream-200"
      progressFillClassName="bg-maroon-700"
      wrapperHeightVh={Math.max(240, items.length * 72)}
      renderTopBar={({ activeIndex, total, scrollToPanel }) => {
        const current = items[activeIndex];
        return (
          <div className="z-20 px-6 lg:px-10 py-3 flex items-center justify-between gap-4 border-b border-cream-200 bg-cream-100">
            <div className="flex items-center gap-3 min-w-0">
              <span className="inline-flex items-center rounded-full bg-maroon-950 px-3.5 py-1 type-caption font-bold tracking-wider uppercase text-gold-300 shrink-0">
                Budaya Palembang
              </span>
              <span className="type-label font-semibold text-ink-600 tabular-nums shrink-0">
                {String(activeIndex + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
              </span>
              {current && (
                <span className="hidden sm:inline type-label font-semibold text-ink-900 truncate">
                  · {current.title}
                </span>
              )}
            </div>

            <nav
              aria-label="Lompat ke warisan budaya"
              data-lenis-prevent
              className="hidden md:flex items-center flex-nowrap gap-1.5 overflow-x-auto max-w-[60%] py-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {items.map((item, idx) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => scrollToPanel(idx)}
                  className={[
                    'min-h-[32px] whitespace-nowrap shrink-0 rounded-full px-3 py-1 type-caption font-semibold transition-colors cursor-pointer',
                    idx === activeIndex
                      ? 'bg-maroon-700 text-cream-50'
                      : 'bg-white border border-cream-300 text-ink-900 hover:bg-cream-50',
                  ].join(' ')}
                >
                  {item.title}
                </button>
              ))}
            </nav>
          </div>
        );
      }}
      renderPanel={(item, idx, ctx) => (
        <BudayaGalleryPanel
          item={item}
          index={idx}
          total={ctx.total}
          scrollYProgress={ctx.scrollYProgress}
          onPanelFocus={ctx.scrollToPanel}
          onCtaClick={onCtaClick}
        />
      )}
      renderMobileFallback={() => (
        <div className="bg-cream-100 divide-y divide-cream-200">
          {items.map((item, idx) => (
            <article key={item.id} className="w-full">
              <div
                className="relative w-full aspect-[4/3] overflow-hidden"
                style={{ backgroundColor: CULTURE_PLACEHOLDER_BG[item.id] ?? 'var(--color-culture-fallback)' }}
              >
                <img
                  ref={(el) => {
                    if (el) el.setAttribute('fetchpriority', idx < 2 ? 'high' : 'auto');
                  }}
                  src={item.imageUrl || `/assets/images/budaya/${item.id}.webp`}
                  alt={`${item.title} — ${item.category} Palembang`}
                  width={1600}
                  height={1067}
                  loading={idx < 2 ? 'eager' : 'lazy'}
                  decoding="async"
                  className="h-full w-full object-cover"
                />
                {item.imageCredit && (
                  <span className="glass-dark absolute bottom-3 left-3 rounded-full px-2.5 py-0.5 type-micro font-medium text-cream-50">
                    {item.imageCredit}
                  </span>
                )}
              </div>
              <div className="px-4 py-6 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="type-caption font-bold text-maroon-700 tabular-nums">
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <Badge variant="maroon">{item.category}</Badge>
                </div>
                <h3 className="text-2xl font-extrabold text-ink-900">{item.title}</h3>
                <p className="max-w-prose type-app-body leading-7 text-ink-600">{item.description}</p>
                {idx === items.length - 1 && onCtaClick && (
                  <div className="pt-2">
                    <Button variant="primary" pill size="sm" arrowRight onClick={onCtaClick}>
                      Kenali HIMASRI
                    </Button>
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    />
  );
}
