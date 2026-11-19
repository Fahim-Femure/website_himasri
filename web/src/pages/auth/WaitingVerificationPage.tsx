import { useEffect, useState } from 'react';
import { Check, Clock, XCircle } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { DURATION, EASING } from '@/components/motion';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import { AuthLayout } from '@/layouts/AuthLayout';
import { logoutAccount } from '@/services/authService';

export default function WaitingVerificationPage() {
  const { profile, status, refreshClaims } = useAuth();
  const navigate = useNavigate();
  const prefersReduced = useReducedMotion();
  const [approvedTransition, setApprovedTransition] = useState(false);

  useEffect(() => {
    document.title = 'Menunggu Verifikasi — HIMASRI IT PLN';
  }, []);

  useEffect(() => {
    if (status === 'active' && !approvedTransition) {
      setApprovedTransition(true);
      toast.success('Akun disetujui');
      const timer = window.setTimeout(async () => {
        await refreshClaims();
        navigate('/anggota/struktur', { replace: true });
      }, 650);
      return () => window.clearTimeout(timer);
    }
  }, [status, approvedTransition, refreshClaims, navigate]);

  const handleLogout = async () => {
    await logoutAccount();
    navigate('/', { replace: true });
  };

  const isRejected = status === 'rejected';

  return (
    <AuthLayout quote="Satu rumah, banyak cerita." maxWidthClass="max-w-[440px]">
      <div className="space-y-6">
        <div className="flex flex-col items-center text-center space-y-4">
          {approvedTransition ? (
            <motion.div
              initial={prefersReduced ? { opacity: 0 } : { scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: DURATION.medium, ease: EASING.enter }}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-success-50 text-success-600 border border-success-600/30"
            >
              <Check className="h-8 w-8" aria-hidden="true" />
            </motion.div>
          ) : isRejected ? (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-danger-50 text-danger-600 border border-danger-600/30">
              <XCircle className="h-8 w-8" aria-hidden="true" />
            </div>
          ) : (
            <motion.div
              animate={prefersReduced ? undefined : { scale: [1, 1.04, 1] }}
              transition={
                prefersReduced
                  ? undefined
                  : { duration: 2, repeat: Infinity, ease: 'easeInOut' }
              }
              className="flex h-16 w-16 items-center justify-center rounded-full bg-cream-100 text-maroon-700 border border-cream-200"
            >
              <Clock className="h-8 w-8" aria-hidden="true" />
            </motion.div>
          )}

          <div>
            <Badge variant={isRejected ? 'danger' : approvedTransition ? 'success' : 'warning'}>
              {approvedTransition
                ? 'Akun Disetujui'
                : isRejected
                  ? 'Pendaftaran Ditolak'
                  : 'Menunggu Verifikasi'}
            </Badge>
            <h1 className="mt-3 type-app-h1 text-ink-900">
              {approvedTransition
                ? 'Selamat datang di Ruang Anggota!'
                : isRejected
                  ? 'Pendaftaran belum dapat disetujui'
                  : 'Akunmu sedang diverifikasi'}
            </h1>
            <p className="mt-2 type-app-body leading-6 text-ink-600">
              {approvedTransition
                ? 'Mengarahkan Anda ke Ruang Anggota…'
                : isRejected
                  ? profile?.rejectReason ||
                    'Silakan hubungi pengurus HIMASRI atau daftar ulang dengan data yang benar.'
                  : 'Admin HIMASRI akan memverifikasi NIM dan jabatan Anda. Halaman ini otomatis masuk begitu akun disetujui.'}
            </p>
          </div>
        </div>

        {profile && (
          <div className="rounded-lg bg-white border border-cream-200 p-5 space-y-4">
            <div className="flex items-center gap-3">
              <Avatar name={profile.nama} photoURL={profile.photoURL} size="M" />
              <div>
                <p className="type-label font-medium text-ink-600">Ringkasan Data Pendaftar</p>
                <p className="type-app-body font-semibold text-ink-900">{profile.nama}</p>
              </div>
            </div>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 type-small">
              <div>
                <dt className="text-ink-600">Nama lengkap</dt>
                <dd className="font-semibold text-ink-900">{profile.nama}</dd>
              </div>
              <div>
                <dt className="text-ink-600">NIM</dt>
                <dd className="font-semibold text-ink-900 tabular-nums">{profile.nim}</dd>
              </div>
              <div>
                <dt className="text-ink-600">Jurusan · Angkatan</dt>
                <dd className="font-semibold text-ink-900 tabular-nums">
                  {profile.jurusan} · {profile.angkatan}
                </dd>
              </div>
              <div>
                <dt className="text-ink-600">Asisten Lab</dt>
                <dd className="font-semibold text-ink-900">
                  {profile.isAslab ? `Ya (${profile.lab || '—'})` : 'Tidak'}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-ink-600">Jabatan diajukan</dt>
                <dd className="font-semibold text-ink-900">
                  {profile.requestedPosition || 'Anggota'}
                </dd>
              </div>
            </dl>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <Link to="/" className="flex-1">
            <Button variant="secondary" fullWidth>
              Kembali ke beranda
            </Button>
          </Link>
          <Button variant="danger" className="flex-1" onClick={handleLogout}>
            Keluar
          </Button>
        </div>
      </div>
    </AuthLayout>
  );
}
