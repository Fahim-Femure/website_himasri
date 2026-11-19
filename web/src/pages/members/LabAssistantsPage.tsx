import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, FlaskConical } from 'lucide-react';
import { EmptyState } from '@/components/feedback/EmptyState';
import { SimulationNote } from '@/components/feedback/SimulationNote';
import { CardSkeleton } from '@/components/feedback/Skeleton';
import { PageHeader } from '@/components/layout/PageHeader';
import { LabAssistantCard } from '@/components/ui/LabAssistantCard';
import { useFaculties } from '@/hooks/useFaculties';
import { subscribeMembers } from '@/services/memberService';
import type { MemberDoc } from '@/types/models';

export default function LabAssistantsPage() {
  const { facultyNames, getLabsForFaculty } = useFaculties();
  const [members, setMembers] = useState<MemberDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFakultas, setSelectedFakultas] = useState<string>('ALL');
  const [selectedLab, setSelectedLab] = useState<string>('ALL');

  useEffect(() => {
    document.title = 'Asisten Lab — HIMASRI IT PLN';
    return subscribeMembers((list) => {
      setMembers(list);
      setLoading(false);
    });
  }, []);

  const assistants = useMemo(
    () => members.filter((m) => m.isAslab),
    [members],
  );

  const labOptions = useMemo(() => {
    if (selectedFakultas === 'ALL') {
      const set = new Set<string>();
      assistants.forEach((a) => {
        if (a.lab) set.add(a.lab);
      });
      return Array.from(set).sort();
    }
    return getLabsForFaculty(selectedFakultas);
  }, [assistants, selectedFakultas, getLabsForFaculty]);

  const filtered = useMemo(() => {
    return assistants.filter((a) => {
      if (selectedFakultas !== 'ALL' && a.fakultas !== selectedFakultas) return false;
      if (selectedLab !== 'ALL' && a.lab !== selectedLab) return false;
      return true;
    });
  }, [assistants, selectedFakultas, selectedLab]);

  const hasSample = useMemo(() => filtered.some((a) => a.isSample), [filtered]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Asisten Lab"
        description="Hubungi anggota HIMASRI yang menjadi asisten laboratorium di IT PLN seputar jadwal dan praktikum."
      />

      {/* Dedicated Filter Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative inline-flex items-center max-w-full">
          <select
            aria-label="Filter fakultas"
            value={selectedFakultas}
            onChange={(e) => {
              setSelectedFakultas(e.target.value);
              setSelectedLab('ALL');
            }}
            className="min-h-[40px] max-w-full appearance-none rounded-md border border-cream-300 bg-white pl-3.5 pr-9 py-2 type-small font-medium text-ink-900 cursor-pointer focus:border-maroon-700 focus:outline-none truncate"
          >
            <option value="ALL">Semua Fakultas ({assistants.length})</option>
            {facultyNames.map((f) => {
              const count = assistants.filter((a) => a.fakultas === f).length;
              return (
                <option key={f} value={f}>
                  {f} ({count})
                </option>
              );
            })}
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-3 h-4 w-4 text-ink-600"
            aria-hidden="true"
          />
        </div>

        <div className="relative inline-flex items-center max-w-full">
          <select
            aria-label="Filter laboratorium"
            value={selectedLab}
            onChange={(e) => setSelectedLab(e.target.value)}
            className="min-h-[40px] max-w-full appearance-none rounded-md border border-cream-300 bg-white pl-3.5 pr-9 py-2 type-small font-medium text-ink-900 cursor-pointer focus:border-maroon-700 focus:outline-none truncate"
          >
            <option value="ALL">Semua Lab</option>
            {labOptions.map((lab) => (
              <option key={lab} value={lab}>
                {lab}
              </option>
            ))}
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-3 h-4 w-4 text-ink-600"
            aria-hidden="true"
          />
        </div>
      </div>

      {hasSample && <SimulationNote />}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((assistant) => (
            <LabAssistantCard key={assistant.uid} assistant={assistant} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<FlaskConical className="h-6 w-6" />}
          title="Belum ada asisten lab di pilihan ini"
          description="Asisten laboratorium yang mendaftar dan terverifikasi akan tampil otomatis di direktori ini."
        />
      )}
    </div>
  );
}
