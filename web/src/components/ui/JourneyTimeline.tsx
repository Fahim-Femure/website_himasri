import { useMemo, useState } from 'react';
import { Calendar, Compass, Expand } from 'lucide-react';
import { Modal } from '@/components/feedback/Modal';
import { EmptyState } from '@/components/feedback/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { ChipFilter } from '@/components/ui/ChipFilter';
import type { JourneyItemDoc } from '@/types/models';

interface JourneyTimelineProps {
  items: JourneyItemDoc[];
  layoutId?: string;
  tone?: 'light' | 'dark';
}

export function JourneyTimeline({
  items,
  layoutId = 'journey-year-chip',
  tone = 'light',
}: JourneyTimelineProps) {
  const isDark = tone === 'dark';
  const [selectedYear, setSelectedYear] = useState<string>('ALL');
  const [lightboxItem, setLightboxItem] = useState<JourneyItemDoc | null>(null);

  const years = useMemo(() => {
    const set = new Set<number>();
    items.forEach((item) => {
      if (typeof item.year === 'number' && !Number.isNaN(item.year)) {
        set.add(item.year);
      }
    });
    return Array.from(set).sort((a, b) => a - b);
  }, [items]);

  const filteredItems = useMemo(() => {
    if (selectedYear === 'ALL') return items;
    return items.filter((item) => String(item.year) === selectedYear);
  }, [items, selectedYear]);

  if (items.length === 0) {
    return (
      <EmptyState
        icon={<Compass className="h-6 w-6" />}
        title="Belum ada dokumentasi perjalanan"
        description="Foto momen perjalanan HIMASRI akan tampil di sini setelah ditambahkan oleh pengurus Medkom atau Admin."
      />
    );
  }

  return (
    <div className="space-y-8">
      {years.length > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-4">
          <ChipFilter
            layoutId={layoutId}
            variant={isDark ? 'onDark' : 'light'}
            value={selectedYear}
            onChange={setSelectedYear}
            options={[
              { value: 'ALL', label: 'Semua Waktu', count: items.length },
              ...years.map((y) => ({
                value: String(y),
                label: String(y),
                count: items.filter((i) => i.year === y).length,
              })),
            ]}
            ariaLabel="Filter tahun perjalanan HIMASRI"
          />
          <p className={['type-small tabular-nums', isDark ? 'text-cream-100/80' : 'text-ink-600'].join(' ')}>
            Menampilkan {filteredItems.length} momen perjalanan
          </p>
        </div>
      )}

      {/* Single Straight Vertical Timeline Column */}
      <div className="relative max-w-3xl">
        <div
          aria-hidden="true"
          className={['absolute left-2.5 top-3 bottom-3 w-px', isDark ? 'bg-white/20' : 'bg-cream-300'].join(' ')}
        />

        <ol className="space-y-8">
          {filteredItems.map((item, idx) => {
            const isHighlightedPeriod = idx === 0;

            return (
              <li key={item.id} className="relative pl-10">
                <span
                  aria-hidden="true"
                  className={[
                    'absolute left-1 top-6 z-10 h-3.5 w-3.5 rounded-full ring-4',
                    isDark ? 'ring-maroon-950' : 'ring-cream-50',
                    isHighlightedPeriod ? 'g-gold shadow-glow' : 'bg-maroon-500',
                  ].join(' ')}
                />

                <article
                  className={[
                    'group overflow-hidden rounded-xl border',
                    isDark
                      ? 'bg-cream-50 border-cream-200 shadow-block text-ink-900'
                      : 'bg-white border-cream-200 shadow-card text-ink-900',
                  ].join(' ')}
                >
                  <button
                    type="button"
                    onClick={() => setLightboxItem(item)}
                    aria-label={`Perbesar foto ${item.title}`}
                    className="relative block aspect-[16/9] w-full overflow-hidden bg-cream-100 text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-maroon-700"
                  >
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                    />
                    <span
                      aria-hidden="true"
                      className="absolute right-3 bottom-3 flex h-9 w-9 items-center justify-center rounded-md bg-white border border-cream-200 text-ink-900 opacity-90 group-hover:opacity-100"
                    >
                      <Expand className="h-4 w-4" />
                    </span>
                  </button>

                  <div className="p-5 sm:p-6 space-y-2.5">
                    <div className="flex flex-wrap items-center gap-2.5 type-small text-ink-600 tabular-nums">
                      <span className="inline-flex items-center gap-1.5 font-medium text-maroon-700">
                        <Calendar className="h-4 w-4 shrink-0" aria-hidden="true" />
                        <span>{item.dateLabel}</span>
                      </span>
                      {item.badge && <Badge variant="neutral">{item.badge}</Badge>}
                    </div>

                    <h3 className="type-h3 leading-7 font-bold text-ink-900">{item.title}</h3>

                    {item.description && (
                      <p className="type-body leading-7 text-ink-600">{item.description}</p>
                    )}
                  </div>
                </article>
              </li>
            );
          })}
        </ol>
      </div>

      {/* Lightbox Modal */}
      <Modal
        open={Boolean(lightboxItem)}
        onClose={() => setLightboxItem(null)}
        title={lightboxItem?.title || ''}
        description={
          lightboxItem
            ? `${lightboxItem.dateLabel}${lightboxItem.badge ? ` · ${lightboxItem.badge}` : ''}`
            : undefined
        }
        maxWidthClass="max-w-3xl"
      >
        {lightboxItem && (
          <div className="space-y-4">
            <div className="overflow-hidden rounded-lg bg-cream-100 border border-cream-200">
              <img
                src={lightboxItem.imageUrl}
                alt={lightboxItem.title}
                className="w-full max-h-[68vh] object-contain mx-auto"
              />
            </div>
            {lightboxItem.description && (
              <p className="type-body leading-7 text-ink-900">{lightboxItem.description}</p>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
