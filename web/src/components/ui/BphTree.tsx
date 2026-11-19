import { Network, Users } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import type { PeriodDoc } from '@/types/models';

const STRIP_BG: Record<string, string> = {
  'maroon-700': 'g-maroon',
  'gold-400': 'g-gold',
  'maroon-500': 'bg-maroon-500',
  'gold-300': 'bg-gold-300',
  'maroon-950': 'g-dark',
};

interface BphTreeProps {
  period: PeriodDoc;
  mode?: 'public' | 'member';
  onUnitClick?: (unitName: string) => void;
}

export function BphTree({ period, mode = 'public', onUnitClick }: BphTreeProps) {
  const isMember = mode === 'member';
  const hasThreePresidium = period.inti.length >= 6;
  const presidium = hasThreePresidium ? period.inti.slice(0, 3) : period.inti.slice(0, 2);
  const intiStaff = hasThreePresidium ? period.inti.slice(3) : period.inti.slice(2);
  const heads = period.heads;

  const lineClass = 'bg-maroon-300/60';
  const railBorderClass = 'border-maroon-300/60';

  const tier3GridClass = isMember
    ? 'border-l pl-4 ml-4 grid grid-cols-1 sm:grid-cols-2 gap-4 xl:border-l-0 xl:pl-0 xl:ml-0 xl:grid-cols-5 xl:gap-0'
    : 'border-l pl-4 ml-4 grid grid-cols-1 sm:grid-cols-2 gap-4 lg:border-l-0 lg:pl-0 lg:ml-0 lg:grid-cols-5 lg:gap-0';
  const tier3CellPadClass = isMember ? 'xl:px-1.5' : 'lg:px-1.5';
  const tier3HubDesktopClass = isMember ? 'hidden xl:flex' : 'hidden lg:flex';
  const tier3HubMobileClass = isMember ? 'xl:hidden' : 'lg:hidden';
  const tier3BranchClass = isMember ? 'hidden xl:block' : 'hidden lg:block';

  return (
    <div
      className="w-full"
      role="region"
      aria-label={`Struktur organisasi BPH Kabinet ${period.label}`}
    >
      {/* Tier 1: Presidium Inti */}
      <div className={presidium.length >= 3 ? 'mx-auto max-w-4xl' : 'mx-auto max-w-3xl'}>
        <div className="overflow-hidden rounded-xl border border-cream-200 bg-cream-50 shadow-block">
          {period.groupPhotoUrl && (
            <div className="aspect-[16/9] w-full overflow-hidden bg-maroon-950">
              <img
                src={period.groupPhotoUrl}
                alt={`Presidium Inti Kabinet ${period.label}`}
                loading="lazy"
                className="h-full w-full object-cover"
              />
            </div>
          )}

          <div className="border-b border-cream-200 px-5 py-3 flex flex-wrap items-center justify-between gap-2 g-cream">
            <p className="type-label leading-5 font-semibold text-maroon-900">
              Presidium Inti Kabinet {period.label}
            </p>
            <Badge variant="maroon">{presidium.length} pimpinan utama</Badge>
          </div>

          <div
            className={[
              'grid divide-y md:divide-y-0 md:divide-x divide-cream-200',
              presidium.length >= 3
                ? 'grid-cols-1 md:grid-cols-3'
                : presidium.length === 2
                  ? 'grid-cols-1 md:grid-cols-2'
                  : 'grid-cols-1',
            ].join(' ')}
          >
            {presidium.map((officer) => {
              const isMainLead = /ketua/i.test(officer.position);
              return (
                <div
                  key={officer.position + officer.nama}
                  className={[
                    'min-w-0 p-4 sm:p-5 flex items-start gap-3',
                    isMainLead ? 'g-maroon text-cream-50' : 'bg-cream-50 text-ink-900',
                  ].join(' ')}
                >
                  <Avatar
                    name={officer.nama}
                    photoURL={officer.photoUrl}
                    size="M"
                    className="shrink-0 mt-0.5"
                  />
                  <div className="min-w-0 flex-1">
                    {isMainLead ? (
                      <Badge variant="gold" className="mb-1">
                        {officer.position}
                      </Badge>
                    ) : (
                      <p className="type-label leading-5 font-semibold text-maroon-700">
                        {officer.position}
                      </p>
                    )}
                    <p
                      className={[
                        'mt-0.5 type-app-body leading-6 font-bold break-words',
                        isMainLead ? 'text-cream-50' : 'text-ink-900',
                      ].join(' ')}
                    >
                      {officer.nama}
                    </p>
                    <p
                      className={[
                        'mt-0.5 type-label leading-5',
                        isMainLead ? 'text-cream-100/80' : 'text-ink-600',
                      ].join(' ')}
                    >
                      {officer.jurusan}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Stem 1 -> 2 */}
      {intiStaff.length > 0 && (
        <>
          <div aria-hidden="true" className="hidden md:flex flex-col items-center">
            <div className={['h-8 w-px', lineClass].join(' ')} />
          </div>

          {/* Tier 2: Pengurus Harian Inti */}
          <div
            className={[
              'mt-4 md:mt-0 border-l pl-4 ml-4 space-y-3 md:border-l-0 md:pl-0 md:ml-0 md:space-y-0 md:grid md:gap-0',
              railBorderClass,
              intiStaff.length === 1
                ? 'md:grid-cols-1 max-w-md mx-auto'
                : intiStaff.length === 2
                  ? 'md:grid-cols-2 max-w-3xl mx-auto'
                  : 'md:grid-cols-3',
            ].join(' ')}
          >
            {intiStaff.map((officer, idx) => {
              const isFirst = idx === 0;
              const isLast = idx === intiStaff.length - 1;
              const showCrossbar = intiStaff.length > 1;

              return (
                <div
                  key={officer.position + officer.nama}
                  className="min-w-0 relative md:px-2 flex flex-col"
                >
                  <span
                    aria-hidden="true"
                    className={['md:hidden absolute -left-4 top-7 h-px w-4', lineClass].join(' ')}
                  />
                  <span
                    aria-hidden="true"
                    className="md:hidden absolute -left-[19px] top-[25px] h-1.5 w-1.5 rounded-full bg-cream-300"
                  />

                  <div aria-hidden="true" className="hidden md:block relative h-6 w-full">
                    {showCrossbar && (
                      <div
                        className={[
                          'absolute top-0 h-px',
                          lineClass,
                          isFirst ? 'left-1/2 right-0' : isLast ? 'left-0 right-1/2' : 'inset-x-0',
                        ].join(' ')}
                      />
                    )}
                    <div
                      className={[
                        'absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-px',
                        lineClass,
                      ].join(' ')}
                    />
                  </div>

                  <div className="flex-1 rounded-lg border border-cream-200 bg-cream-50 text-ink-900 p-4 shadow-card flex items-start gap-3">
                    <Avatar
                    name={officer.nama}
                    photoURL={officer.photoUrl}
                    size="M"
                    className="shrink-0 mt-0.5"
                  />
                    <div className="min-w-0 flex-1">
                      <p className="type-label leading-5 font-medium text-ink-600">
                        {officer.position}
                      </p>
                      <p className="mt-0.5 type-app-body leading-6 font-semibold text-ink-900 break-words">
                        {officer.nama}
                      </p>
                      <p className="mt-0.5 type-label leading-5 text-ink-600">
                        {officer.jurusan}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Stem 2 -> 3 */}
      {heads.length > 0 && (
        <>
          <div aria-hidden="true" className={[tier3HubDesktopClass, 'flex-col items-center'].join(' ')}>
            <div className={['h-7 w-px', lineClass].join(' ')} />
            <div className="inline-flex items-center gap-1.5 rounded-full border border-cream-200 bg-white px-3.5 py-1 type-label font-semibold text-ink-900">
              <Network className="h-3.5 w-3.5 text-ink-600" />
              {heads.length} Departemen & Biro
            </div>
            <div className={['h-5 w-px', lineClass].join(' ')} />
          </div>

          <div className={[tier3HubMobileClass, 'mt-6 mb-3 flex items-center gap-2'].join(' ')}>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-cream-200 bg-white px-3.5 py-1 type-label font-semibold text-ink-900">
              <Network className="h-3.5 w-3.5 text-ink-600" aria-hidden="true" />
              {heads.length} Departemen & Biro
            </span>
          </div>

          {/* Tier 3: Departemen & Biro */}
          <div className={[tier3GridClass, railBorderClass].join(' ')}>
            {heads.map((head, idx) => {
              const isFirst = idx === 0;
              const isLast = idx === heads.length - 1;
              const showCrossbar = heads.length > 1;
              const interactive = typeof onUnitClick === 'function';

              const cardBody = (
                <div
                  className={[
                    'group flex-1 w-full flex flex-col overflow-hidden rounded-lg border bg-white text-ink-900 text-left shadow-card hover:shadow-lift transition-all',
                    interactive
                      ? 'border-cream-200 hover:border-maroon-700'
                      : 'border-cream-200',
                  ].join(' ')}
                >
                  <div className={['h-1.5 w-full shrink-0', STRIP_BG[head.color] ?? 'g-gold'].join(' ')} />

                  {head.photoUrl && (
                    <div className="aspect-[3/2] w-full shrink-0 overflow-hidden bg-cream-100">
                      <img
                        src={head.photoUrl}
                        alt={`${head.kind === 'DEPARTEMEN' ? 'Departemen' : 'Biro'} ${head.unit}`}
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}

                  <div className="p-3.5 flex flex-col justify-start gap-1">
                    <span className="type-caption leading-4 font-medium text-ink-600">
                      {head.kind === 'DEPARTEMEN' ? 'Departemen' : 'Biro'}
                    </span>
                    <h4 className="type-small leading-5 font-semibold text-ink-900 break-words">
                      {head.unit}
                    </h4>
                  </div>

                  <div className="flex-1 border-t border-cream-200 p-3.5 flex items-start gap-2.5">
                    <Avatar
                      name={head.nama}
                      photoURL={head.leaderPhotoUrl}
                      size="S"
                      className="shrink-0 mt-0.5"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="type-caption leading-4 font-medium text-ink-600">
                        {head.jabatan}
                      </p>
                      <p className="mt-0.5 type-small leading-5 font-semibold text-ink-900 break-words">
                        {head.nama}
                      </p>
                      <p className="type-caption leading-4 text-ink-600">{head.jurusan}</p>
                      {interactive && (
                        <p className="mt-2 inline-flex items-center gap-1 type-caption font-semibold text-maroon-700 group-hover:underline">
                          <Users className="h-3.5 w-3.5" aria-hidden="true" />
                          Lihat detail unit
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );

              return (
                <div
                  key={head.unit}
                  className={['min-w-0 relative flex flex-col', tier3CellPadClass].join(' ')}
                >
                  <span
                    aria-hidden="true"
                    className={['sm:hidden absolute -left-4 top-8 h-px w-4', lineClass].join(' ')}
                  />
                  <span
                    aria-hidden="true"
                    className="sm:hidden absolute -left-[19px] top-[29px] h-1.5 w-1.5 rounded-full bg-cream-300"
                  />

                  <div aria-hidden="true" className={[tier3BranchClass, 'relative h-6 w-full'].join(' ')}>
                    {showCrossbar && (
                      <div
                        className={[
                          'absolute top-0 h-px',
                          lineClass,
                          isFirst ? 'left-1/2 right-0' : isLast ? 'left-0 right-1/2' : 'inset-x-0',
                        ].join(' ')}
                      />
                    )}
                    <div
                      className={[
                        'absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-px',
                        lineClass,
                      ].join(' ')}
                    />
                  </div>

                  {interactive ? (
                    <button
                      type="button"
                      onClick={() => onUnitClick(head.unit)}
                      className="flex-1 flex flex-col w-full cursor-pointer rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-maroon-700 focus-visible:ring-offset-2"
                    >
                      {cardBody}
                    </button>
                  ) : (
                    cardBody
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
