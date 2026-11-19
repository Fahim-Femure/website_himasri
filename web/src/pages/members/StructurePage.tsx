import { useEffect, useMemo, useState } from 'react';
import { Building2, ChevronDown, ChevronLeft, ChevronRight, Search, Users } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { EmptyState } from '@/components/feedback/EmptyState';
import { SimulationNote } from '@/components/feedback/SimulationNote';
import { CardSkeleton } from '@/components/feedback/Skeleton';
import { PageHeader } from '@/components/layout/PageHeader';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { BphTree } from '@/components/ui/BphTree';
import { Button } from '@/components/ui/Button';
import { Field, SelectField } from '@/components/ui/Field';
import { MemberRow } from '@/components/ui/MemberRow';
import { StatStrip, StatTile } from '@/components/ui/StatTile';
import { ToggleSwitch } from '@/components/ui/ToggleSwitch';
import { JURUSAN_OPTIONS } from '@/content/forms';
import {
  fetchAllPeriods,
  fetchUnitsForPeriod,
  subscribeMembers,
} from '@/services/memberService';
import { FALLBACK_CURRENT_PERIOD } from '@/services/publicService';
import type { MemberDoc, PeriodDoc, UnitDoc } from '@/types/models';
import { normalizePersonName } from '@/utils/format';
import { slugifyUnitAnchor } from '@/utils/unitPhotos';

const PAGE_SIZE = 24;

const UNIT_ACCENT_BAR: Record<string, string> = {
  'maroon-700': 'bg-maroon-700',
  'gold-400': 'bg-gold-400',
  'maroon-500': 'bg-maroon-500',
  'gold-300': 'bg-gold-300',
  'maroon-950': 'bg-maroon-950',
};

export default function StructurePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [periods, setPeriods] = useState<PeriodDoc[]>([FALLBACK_CURRENT_PERIOD]);
  const [units, setUnits] = useState<UnitDoc[]>([]);
  const [members, setMembers] = useState<MemberDoc[]>([]);
  const [loadingPeriods, setLoadingPeriods] = useState(true);
  const [loadingUnits, setLoadingUnits] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterAngkatan, setFilterAngkatan] = useState('');
  const [filterJurusan, setFilterJurusan] = useState('');
  const [onlyAslab, setOnlyAslab] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    document.title = 'Struktur & Anggota — HIMASRI IT PLN';
    void fetchAllPeriods()
      .then((list) => {
        if (list.length > 0) setPeriods(list);
      })
      .finally(() => setLoadingPeriods(false));

    return subscribeMembers(setMembers);
  }, []);

  const currentPeriod = useMemo(
    () => periods.find((p) => p.isCurrent) ?? periods[0] ?? FALLBACK_CURRENT_PERIOD,
    [periods],
  );

  const selectedPeriodId = searchParams.get('periode') || currentPeriod.id;
  const selectedPeriod = useMemo(
    () => periods.find((p) => p.id === selectedPeriodId) ?? currentPeriod,
    [periods, selectedPeriodId, currentPeriod],
  );

  useEffect(() => {
    if (!selectedPeriod.id) {
      setUnits([]);
      setLoadingUnits(false);
      return;
    }
    setLoadingUnits(true);
    void fetchUnitsForPeriod(selectedPeriod.id)
      .then(setUnits)
      .finally(() => setLoadingUnits(false));
  }, [selectedPeriod.id]);

  const handleSelectPeriod = (id: string) => {
    setPage(1);
    setSearchParams({ periode: id });
  };

  const bphIdentitySet = useMemo(() => {
    const uids = new Set<string>();
    const names = new Set<string>();

    selectedPeriod.inti.forEach((o) => {
      if (o.uid) uids.add(o.uid);
      names.add(normalizePersonName(o.nama));
    });

    units.forEach((u) => {
      u.leaders.forEach((l) => {
        if (l.uid) uids.add(l.uid);
        names.add(normalizePersonName(l.nama));
      });
      u.members.forEach((m) => {
        if (m.uid) uids.add(m.uid);
        names.add(normalizePersonName(m.nama));
      });
    });

    return { uids, names };
  }, [selectedPeriod, units]);

  const activeMembersInPeriod = useMemo(
    () => members.filter((m) => m.activePeriods?.includes(selectedPeriod.id)),
    [members, selectedPeriod.id],
  );

  const nonBphMembers = useMemo(() => {
    return activeMembersInPeriod.filter((m) => {
      if (bphIdentitySet.uids.has(m.uid)) return false;
      if (bphIdentitySet.names.has(normalizePersonName(m.nama))) return false;
      return true;
    });
  }, [activeMembersInPeriod, bphIdentitySet]);

  const filteredNonBph = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return nonBphMembers.filter((m) => {
      if (q && !m.searchName.includes(q) && !m.jurusan.toLowerCase().includes(q)) return false;
      if (filterAngkatan && String(m.angkatan) !== filterAngkatan) return false;
      if (filterJurusan && m.jurusan !== filterJurusan) return false;
      if (onlyAslab && !m.isAslab) return false;
      return true;
    });
  }, [nonBphMembers, searchQuery, filterAngkatan, filterJurusan, onlyAslab]);

  const totalPages = Math.max(1, Math.ceil(filteredNonBph.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginatedMembers = filteredNonBph.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  const totalBphPeople = useMemo(() => bphIdentitySet.names.size, [bphIdentitySet]);
  const totalAslabCount = useMemo(
    () => activeMembersInPeriod.filter((m) => m.isAslab).length,
    [activeMembersInPeriod],
  );
  const hasSampleMembers = useMemo(
    () => nonBphMembers.some((m) => m.isSample),
    [nonBphMembers],
  );

  const angkatanOptions = useMemo(() => {
    const set = new Set<number>();
    nonBphMembers.forEach((m) => set.add(m.angkatan));
    return Array.from(set).sort((a, b) => b - a);
  }, [nonBphMembers]);

  return (
    <div className="space-y-8">
      <PageHeader
        tone="maroon"
        label="Organisasi & Direktori"
        title="Struktur & Anggota"
        description="Susunan pengurus harian tiap departemen, biro, dan anggota aktif pada periode terpilih."
        actions={
          <div className="relative inline-flex items-center shrink-0">
            <select
              aria-label="Pilih periode kepengurusan"
              value={selectedPeriod.id}
              onChange={(e) => handleSelectPeriod(e.target.value)}
              className="min-h-[40px] appearance-none rounded-md border border-cream-300 bg-white pl-3.5 pr-9 py-2 type-small font-medium text-ink-900 cursor-pointer focus:border-maroon-700 focus:outline-none"
            >
              {periods.map((p) => (
                <option key={p.id} value={p.id}>
                  Periode {p.label}
                  {p.isCurrent ? ' (Berjalan)' : ''}
                </option>
              ))}
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-3 h-4 w-4 text-ink-600"
              aria-hidden="true"
            />
          </div>
        }
      />

      {/* 4-Color-Block Stat Strip */}
      <StatStrip cols={4}>
        <StatTile label="Pengurus BPH" value={totalBphPeople} variant="maroon" />
        <StatTile
          label="Departemen & Biro"
          value={units.length || selectedPeriod.heads.length}
          variant="gold"
        />
        <StatTile label="Anggota Aktif" value={activeMembersInPeriod.length} variant="cream" />
        <StatTile label="Asisten Lab" value={totalAslabCount} variant="dark" />
      </StatStrip>

      {/* BPH Section */}
      <section className="space-y-5">
        <h2 className="type-app-h2 text-ink-900">
          Badan Pengurus Harian {selectedPeriod.label}
        </h2>

        {loadingPeriods ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        ) : (
          <BphTree
            period={selectedPeriod}
            mode="member"
            onUnitClick={(unitName) => {
              const el = document.getElementById(`unit-${slugifyUnitAnchor(unitName)}`);
              el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
          />
        )}

        {/* Department / Bureau 2-col Cards */}
        {loadingUnits ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <CardSkeleton />
            <CardSkeleton />
          </div>
        ) : units.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {units.map((unit) => {
              const stripClass = UNIT_ACCENT_BAR[unit.color] ?? 'bg-maroon-700';
              const totalOrang = unit.leaders.length + unit.members.length;
              const anchorId = `unit-${slugifyUnitAnchor(unit.name)}`;
              return (
                <article
                  key={unit.id}
                  id={anchorId}
                  className="overflow-hidden rounded-lg bg-white border border-cream-200 flex flex-col scroll-mt-20"
                >
                  <div className={['h-1 w-full shrink-0', stripClass].join(' ')} />

                  {unit.photoUrl && (
                    <div className="aspect-[3/2] w-full overflow-hidden bg-cream-100">
                      <img
                        src={unit.photoUrl}
                        alt={`${unit.kind === 'DEPARTEMEN' ? 'Departemen' : 'Biro'} ${unit.name}`}
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}

                  <div className="px-5 py-4 border-b border-cream-200 flex items-center justify-between gap-4">
                    <div>
                      <p className="type-label leading-5 font-medium text-ink-600">
                        {unit.kind === 'DEPARTEMEN' ? 'Departemen' : 'Biro'}
                      </p>
                      <h3 className="type-body leading-6 font-semibold text-ink-900">
                        {unit.name}
                      </h3>
                    </div>
                    <Badge variant="neutral">{totalOrang} orang</Badge>
                  </div>

                  <div className="p-5 space-y-5 flex-1">
                    <div className="space-y-2.5">
                      <p className="type-label leading-5 font-semibold text-ink-600">
                        Pimpinan {unit.kind === 'DEPARTEMEN' ? 'departemen' : 'biro'}
                      </p>
                      <div className="space-y-2">
                        {unit.leaders.map((lead) => (
                          <MemberRow
                            key={lead.jabatan + lead.nama}
                            variant="lead"
                            jabatan={lead.jabatan}
                            nama={lead.nama}
                            jurusan={lead.jurusan}
                            photoURL={lead.photoUrl}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="border-t border-cream-200 pt-4 space-y-2.5">
                      <p className="type-label leading-5 font-semibold text-ink-600">
                        Anggota {unit.kind === 'DEPARTEMEN' ? 'departemen' : 'biro'}
                      </p>
                      {unit.members.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
                          {unit.members.map((m) => (
                            <MemberRow
                              key={m.nama}
                              variant="member"
                              nama={m.nama}
                              jurusan={m.jurusan}
                              photoURL={m.photoUrl}
                            />
                          ))}
                        </div>
                      ) : (
                        <p className="type-small text-ink-600">Belum ada anggota terdaftar.</p>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon={<Building2 className="h-6 w-6" />}
            title="Belum ada detail unit"
            description="Detail departemen dan biro untuk periode ini belum diisi."
          />
        )}
      </section>

      {/* Non-BPH Active Members */}
      <section className="space-y-5 pt-2">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="type-app-h2 text-ink-900">
              Anggota Aktif {selectedPeriod.label}
            </h2>
            <p className="mt-0.5 type-small leading-5 text-ink-600">
              Anggota aktif di luar susunan BPH ({filteredNonBph.length} anggota).
            </p>
          </div>
          {hasSampleMembers && <SimulationNote />}
        </div>

        {/* Filter Bar */}
        <div className="rounded-lg bg-white border border-cream-200 p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 items-end">
          <div className="lg:col-span-4">
            <Field
              label="Cari nama atau jurusan"
              placeholder="Ketik nama anggota…"
              leftIcon={<Search className="h-4 w-4" />}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <div className="lg:col-span-2">
            <SelectField
              label="Angkatan"
              value={filterAngkatan}
              onChange={(e) => {
                setFilterAngkatan(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Semua</option>
              {angkatanOptions.map((y) => (
                <option key={y} value={String(y)}>
                  {y}
                </option>
              ))}
            </SelectField>
          </div>

          <div className="lg:col-span-3">
            <SelectField
              label="Jurusan"
              value={filterJurusan}
              onChange={(e) => {
                setFilterJurusan(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Semua jurusan</option>
              {JURUSAN_OPTIONS.map((j) => (
                <option key={j} value={j}>
                  {j}
                </option>
              ))}
            </SelectField>
          </div>

          <div className="lg:col-span-3 flex items-center pb-0.5">
            <ToggleSwitch
              checked={onlyAslab}
              onChange={(v) => {
                setOnlyAslab(v);
                setPage(1);
              }}
              label="Hanya aslab"
            />
          </div>
        </div>

        {paginatedMembers.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {paginatedMembers.map((member) => (
                <article
                  key={member.uid}
                  className="rounded-lg bg-white border border-cream-200 p-4 flex flex-col justify-between gap-3 h-full"
                >
                  <div className="flex items-center gap-3">
                    <Avatar name={member.nama} photoURL={member.photoURL} size="M" />
                    <div className="min-w-0">
                      <h3 className="type-small leading-5 font-semibold text-ink-900 break-words">
                        {member.nama}
                      </h3>
                      <p className="type-label leading-5 text-ink-600">{member.jurusan}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <Badge variant="neutral" className="tabular-nums">
                      Angkatan {member.angkatan}
                    </Badge>
                    {member.isAslab && member.lab && (
                      <Badge variant="maroon">Aslab · {member.lab}</Badge>
                    )}
                  </div>
                </article>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-2">
                <p className="type-label text-ink-600 tabular-nums">
                  Halaman {safePage} dari {totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={safePage <= 1}
                    leftIcon={<ChevronLeft className="h-4 w-4" />}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Sebelumnya
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={safePage >= totalPages}
                    rightIcon={<ChevronRight className="h-4 w-4" />}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  >
                    Berikutnya
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : (
          <EmptyState
            icon={<Users className="h-6 w-6" />}
            title="Tidak ada anggota yang cocok"
            description="Coba ubah kata kunci pencarian atau reset filter angkatan dan jurusan."
          />
        )}
      </section>
    </div>
  );
}
