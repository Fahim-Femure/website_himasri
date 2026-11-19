import { useEffect, useState } from 'react';
import { ArrowLeft, Lock, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { EmptyState } from '@/components/feedback/EmptyState';
import { BphTree } from '@/components/ui/BphTree';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import { FALLBACK_CURRENT_PERIOD, fetchCurrentPeriod } from '@/services/publicService';
import type { PeriodDoc } from '@/types/models';
import { can } from '@/utils/permissions';

export default function PublicStructurePage() {
  const { user, status, role } = useAuth();
  const [period, setPeriod] = useState<PeriodDoc>(FALLBACK_CURRENT_PERIOD);
  const canEditPeriods = Boolean(user && status === 'active' && can(role, 'periods:edit'));
  const hasBphData = period.inti.length > 0 || period.heads.length > 0;

  useEffect(() => {
    document.title = 'Struktur BPH — HIMASRI IT PLN';
    void fetchCurrentPeriod().then(setPeriod);
  }, []);

  const memberDestination =
    user && status === 'active'
      ? '/anggota/struktur'
      : user && status === 'pending'
        ? '/daftar/menunggu'
        : '/masuk';

  return (
    <div className="min-h-dvh bg-cream-50 pt-24 pb-16 md:pt-28 md:pb-24">
      <div className="public-container space-y-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-4 max-w-2xl">
            <Link to="/#bph" className="inline-flex items-center gap-1.5 type-label font-semibold text-maroon-700 hover:underline">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              <span>Kembali ke Beranda</span>
            </Link>
            <p className="type-label font-bold uppercase tracking-[0.06em] text-maroon-700">
              Badan Pengurus Harian
            </p>
            <h1 className="type-h1 leading-[1.1] md:text-4xl md:leading-[1.12] font-extrabold text-ink-900">
              {period.label ? `Struktur Lengkap Kabinet ${period.label}` : 'Struktur Lengkap BPH'}
            </h1>
            <p className="type-body leading-7 text-ink-600">
              Bagan pengurus inti serta kepala departemen dan biro HIMASRI Institut Teknologi PLN periode berjalan.
            </p>
          </div>

          <Link to={memberDestination} className="shrink-0">
            <Button variant="primary" pill arrowRight>
              {user && status === 'active' ? 'Lihat daftar anggota unit' : 'Masuk Ruang Anggota'}
            </Button>
          </Link>
        </div>

        {hasBphData ? (
          <BphTree period={period} mode="public" />
        ) : (
          <EmptyState
            icon={<Users className="h-6 w-6" />}
            title="Belum ada struktur kepengurusan"
            description="Susunan Badan Pengurus Harian akan tampil di sini setelah ditambahkan oleh pengurus."
            action={
              canEditPeriods ? (
                <Link to="/admin/periode">
                  <Button variant="primary" pill size="sm" arrowRight>
                    Tambahkan periode & BPH di panel
                  </Button>
                </Link>
              ) : undefined
            }
          />
        )}

        <div className="rounded-xl border border-cream-200 bg-white px-6 py-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <Lock className="h-5 w-5 shrink-0 text-maroon-700 mt-0.5" aria-hidden="true" />
            <div>
              <p className="type-app-body font-bold text-ink-900">
                Daftar anggota tiap departemen khusus untuk anggota terverifikasi
              </p>
              <p className="type-small text-ink-600">
                Masuk ke Ruang Anggota untuk melihat susunan staf, materi kuliah, dan kontak asisten lab.
              </p>
            </div>
          </div>
          <Link to={memberDestination} className="shrink-0">
            <Button variant="secondary" pill arrowRight>
              {user && status === 'active' ? 'Buka Ruang Anggota' : 'Masuk sekarang'}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
