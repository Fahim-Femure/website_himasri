import type { CultureItem } from '@/content/site';
import { SongketPattern } from '@/components/ui/SongketPattern';

type CultureTone = 'maroon' | 'gold' | 'cream' | 'dark';

const TONE_MAP: Record<
  CultureTone,
  { card: string; badge: string; title: string; desc: string; songket: boolean }
> = {
  maroon: {
    card: 'g-maroon text-cream-50 shadow-block',
    badge: 'bg-white/15 text-gold-300',
    title: 'text-cream-50',
    desc: 'text-cream-100/85',
    songket: true,
  },
  gold: {
    card: 'g-gold text-maroon-950 shadow-gold',
    badge: 'bg-maroon-950/12 text-maroon-950',
    title: 'text-maroon-950',
    desc: 'text-maroon-900/90',
    songket: false,
  },
  cream: {
    card: 'g-cream text-ink-900 border border-cream-200 shadow-card',
    badge: 'bg-maroon-100 text-maroon-800',
    title: 'text-ink-900',
    desc: 'text-ink-600',
    songket: false,
  },
  dark: {
    card: 'g-dark text-cream-50 shadow-block',
    badge: 'bg-white/12 text-gold-300',
    title: 'text-cream-50',
    desc: 'text-cream-100/85',
    songket: true,
  },
};

export function CultureCard({
  item,
  index = 0,
}: {
  item: CultureItem;
  index?: number;
}) {
  const tones: CultureTone[] = ['maroon', 'gold', 'cream', 'dark'];
  const tone = tones[index % tones.length];
  const style = TONE_MAP[tone];

  return (
    <article
      className={[
        'relative overflow-hidden h-full rounded-xl p-6 md:p-7 flex flex-col justify-between gap-4 transition-transform duration-200 hover:-translate-y-0.5',
        style.card,
      ].join(' ')}
    >
      {style.songket && <SongketPattern corner="tr" opacity={0.08} />}

      <div className="relative z-10 flex items-center justify-between gap-2">
        <span
          className={[
            'inline-flex items-center rounded-full px-3 py-1 type-caption leading-4 font-bold uppercase tracking-[0.04em]',
            style.badge,
          ].join(' ')}
        >
          {item.category}
        </span>
      </div>

      <div className="relative z-10 space-y-2 flex-1">
        <h3 className={['type-h2 leading-7 font-extrabold', style.title].join(' ')}>
          {item.title}
        </h3>
        <p className={['type-body leading-7', style.desc].join(' ')}>{item.description}</p>
      </div>
    </article>
  );
}
