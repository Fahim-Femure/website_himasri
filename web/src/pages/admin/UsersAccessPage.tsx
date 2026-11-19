import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, Copy, FlaskConical, KeyRound, UserCheck, Users } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { EmptyState } from '@/components/feedback/EmptyState';
import { Modal } from '@/components/feedback/Modal';
import { PageHeader } from '@/components/layout/PageHeader';
import { DURATION, EASING } from '@/components/motion';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { TextareaField } from '@/components/ui/Field';
import { ACCESS_MATRIX_ROWS } from '@/content/site';
import { useAuth } from '@/contexts/AuthContext';
import {
  callAdminResetPassword,
  callApproveMember,
  callRejectMember,
  callSetUserRole,
  callSetUserStatus,
  subscribeAllUsers,
} from '@/services/memberService';
import type { Role, UserDoc } from '@/types/models';
import { ALL_ROLES, ROLE_LABELS } from '@/utils/permissions';

function formatStatusLabel(status: UserDoc['status']): string {
  switch (status) {
    case 'active':
      return 'Aktif';
    case 'pending':
      return 'Menunggu';
    case 'rejected':
      return 'Ditolak';
    case 'disabled':
      return 'Nonaktif';
    default:
      return status;
  }
}

export default function UsersAccessPage() {
  const { user: currentUser } = useAuth();
  const prefersReduced = useReducedMotion();

  const [users, setUsers] = useState<UserDoc[]>([]);
  const [tab, setTab] = useState<'pending' | 'all' | 'aslab'>('pending');
  const [matrixRole, setMatrixRole] = useState<
    'tamu' | 'anggota' | 'psdm' | 'minat_bakat' | 'akademik' | 'kominfo' | 'inti' | 'admin'
  >('anggota');
  const [selectedRoles, setSelectedRoles] = useState<Record<string, Role>>({});
  const [busyUid, setBusyUid] = useState<string | null>(null);

  const [rejectTarget, setRejectTarget] = useState<UserDoc | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const [tempPasswordInfo, setTempPasswordInfo] = useState<{
    nama: string;
    nim: string;
    password: string;
  } | null>(null);

  useEffect(() => {
    document.title = 'Pengguna & Hak Akses — HIMASRI IT PLN';
    return subscribeAllUsers(setUsers);
  }, []);

  const pendingUsers = useMemo(
    () => users.filter((u) => u.status === 'pending'),
    [users],
  );
  const aslabUsers = useMemo(
    () => users.filter((u) => u.isAslab && u.status === 'active'),
    [users],
  );

  const getChosenRole = (u: UserDoc): Role => selectedRoles[u.uid] ?? u.role ?? 'anggota';

  const handleApprove = async (u: UserDoc) => {
    setBusyUid(u.uid);
    try {
      const assignedRole = getChosenRole(u);
      await callApproveMember(u.uid, assignedRole);
      toast.success(`${u.nama} disetujui sebagai ${ROLE_LABELS[assignedRole]}`);
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message || 'Gagal menyetujui anggota.';
      toast.error(msg);
    } finally {
      setBusyUid(null);
    }
  };

  const handleRejectConfirm = async () => {
    if (!rejectTarget) return;
    setBusyUid(rejectTarget.uid);
    try {
      await callRejectMember(rejectTarget.uid, rejectReason.trim() || undefined);
      toast.success(`Pendaftaran ${rejectTarget.nama} ditolak.`);
      setRejectTarget(null);
      setRejectReason('');
    } catch {
      toast.error('Gagal menolak pendaftaran.');
    } finally {
      setBusyUid(null);
    }
  };

  const handleRoleChange = async (u: UserDoc, nextRole: Role) => {
    setBusyUid(u.uid);
    try {
      await callSetUserRole(u.uid, nextRole);
      toast.success(`Peran ${u.nama} diubah ke ${ROLE_LABELS[nextRole]}`);
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message || 'Gagal mengubah peran.';
      toast.error(msg);
    } finally {
      setBusyUid(null);
    }
  };

  const handleToggleStatus = async (u: UserDoc) => {
    const nextStatus = u.status === 'active' ? 'disabled' : 'active';
    setBusyUid(u.uid);
    try {
      await callSetUserStatus(u.uid, nextStatus);
      toast.success(
        nextStatus === 'active' ? `Akun ${u.nama} diaktifkan` : `Akun ${u.nama} dinonaktifkan`,
      );
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message || 'Gagal mengubah status akun.';
      toast.error(msg);
    } finally {
      setBusyUid(null);
    }
  };

  const handleResetPassword = async (u: UserDoc) => {
    setBusyUid(u.uid);
    try {
      const res = await callAdminResetPassword(u.uid);
      setTempPasswordInfo({
        nama: u.nama,
        nim: u.nim,
        password: res.tempPassword,
      });
    } catch {
      toast.error('Gagal mereset kata sandi.');
    } finally {
      setBusyUid(null);
    }
  };

  const tabs: Array<{ id: 'pending' | 'all' | 'aslab'; label: string; count: number }> = [
    { id: 'pending', label: 'Menunggu verifikasi', count: pendingUsers.length },
    { id: 'all', label: 'Semua pengguna', count: users.length },
    { id: 'aslab', label: 'Aslab', count: aslabUsers.length },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        tone="maroon"
        label="Manajemen Pengguna"
        title="Pengguna & Hak Akses"
        description="Verifikasi pendaftar baru, tetapkan hak akses sesuai jabatan BPH, atau reset kata sandi."
      />

      {/* Underline Tabs with Gold Active Bar */}
      <div role="tablist" aria-label="Kategori pengguna" className="border-b border-cream-200 flex flex-wrap gap-6">
        {tabs.map((item) => {
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(item.id)}
              className={[
                'relative min-h-11 md:min-h-[38px] py-2 md:pb-3 md:pt-1 type-small leading-5 font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer',
                active
                  ? 'text-maroon-900'
                  : 'text-ink-600 hover:text-ink-900',
              ].join(' ')}
            >
              <span>{item.label}</span>
              <Badge variant={active ? 'gold' : 'neutral'} className="tabular-nums">
                {item.count}
              </Badge>
              {active && (
                <span
                  aria-hidden="true"
                  className="absolute inset-x-0 bottom-0 h-[3px] rounded-full g-gold"
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Tab 1: Menunggu Verifikasi */}
      {tab === 'pending' && (
        <section>
          {pendingUsers.length > 0 ? (
            <>
              <div className="hidden md:block overflow-x-auto rounded-lg bg-white border border-cream-200">
                <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-cream-200 bg-cream-100 type-label font-medium text-ink-600">
                    <th className="px-5 py-3">Nama · NIM</th>
                    <th className="px-5 py-3">Jurusan · Angkatan</th>
                    <th className="px-5 py-3">Aslab</th>
                    <th className="px-5 py-3">Jabatan Diajukan</th>
                    <th className="px-5 py-3">Tetapkan Hak Akses</th>
                    <th className="px-5 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cream-200 type-small">
                  <AnimatePresence initial={false}>
                    {pendingUsers.map((u) => (
                      <motion.tr
                        key={u.uid}
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={prefersReduced ? { opacity: 0 } : { opacity: 0, x: 16 }}
                        transition={{ duration: DURATION.base, ease: EASING.standard }}
                        className="h-14"
                      >
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar name={u.nama} photoURL={u.photoURL} size="S" />
                            <div>
                              <p className="font-semibold text-ink-900">{u.nama}</p>
                              <p className="type-caption text-ink-600 tabular-nums">NIM {u.nim}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-ink-900 tabular-nums">
                          {u.jurusan} · {u.angkatan}
                        </td>
                        <td className="px-5 py-3">
                          {u.isAslab ? (
                            <Badge variant="neutral">{u.lab || 'Aslab'}</Badge>
                          ) : (
                            <span className="text-ink-600">Tidak</span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-ink-900">
                          {u.requestedPosition || 'Anggota'}
                        </td>
                        <td className="px-5 py-3">
                          <div className="relative inline-flex items-center">
                            <select
                              aria-label={`Tetapkan hak akses untuk ${u.nama}`}
                              value={getChosenRole(u)}
                              onChange={(e) =>
                                setSelectedRoles((prev) => ({
                                  ...prev,
                                  [u.uid]: e.target.value as Role,
                                }))
                              }
                              className="min-h-11 md:min-h-[38px] appearance-none rounded-md border border-cream-300 bg-white pl-3 pr-8 py-1.5 type-small text-ink-900 cursor-pointer focus:border-maroon-700 focus:outline-none"
                            >
                              {ALL_ROLES.map((r) => (
                                <option key={r} value={r}>
                                  {ROLE_LABELS[r]}
                                </option>
                              ))}
                            </select>
                            <ChevronDown
                              className="pointer-events-none absolute right-2.5 h-4 w-4 text-ink-600"
                              aria-hidden="true"
                            />
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="primary"
                              size="sm"
                              disabled={busyUid === u.uid}
                              loading={busyUid === u.uid}
                              onClick={() => handleApprove(u)}
                            >
                              Setujui
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              disabled={busyUid === u.uid}
                              onClick={() => setRejectTarget(u)}
                            >
                              Tolak
                            </Button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>

            {/* Mobile Cards (<768px) */}
            <div className="md:hidden space-y-3">
              {pendingUsers.map((u) => (
                <div
                  key={u.uid}
                  className="rounded-lg bg-white border border-cream-200 p-4 space-y-3"
                >
                  <div className="flex items-center gap-3">
                    <Avatar name={u.nama} photoURL={u.photoURL} size="S" />
                    <div className="min-w-0">
                      <p className="font-semibold text-ink-900 truncate">{u.nama}</p>
                      <p className="type-caption text-ink-600 tabular-nums">
                        {u.nim ? `NIM ${u.nim}` : 'Akun Admin'} · {u.jurusan} ({u.angkatan})
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 type-caption text-ink-600">
                    <span>Jabatan: {u.requestedPosition || 'Anggota'}</span>
                    {u.isAslab && <Badge variant="neutral">{u.lab || 'Aslab'}</Badge>}
                  </div>
                  <select
                    aria-label={`Tetapkan hak akses untuk ${u.nama}`}
                    value={getChosenRole(u)}
                    onChange={(e) =>
                      setSelectedRoles((prev) => ({ ...prev, [u.uid]: e.target.value as Role }))
                    }
                    className="min-h-11 md:min-h-[38px] w-full rounded-md border border-cream-300 bg-white px-3 py-1.5 type-small text-ink-900"
                  >
                    {ALL_ROLES.map((r) => (
                      <option key={r} value={r}>
                        {ROLE_LABELS[r]}
                      </option>
                    ))}
                  </select>
                  <div className="flex gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      fullWidth
                      disabled={busyUid === u.uid}
                      loading={busyUid === u.uid}
                      onClick={() => handleApprove(u)}
                    >
                      Setujui
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      fullWidth
                      disabled={busyUid === u.uid}
                      onClick={() => setRejectTarget(u)}
                    >
                      Tolak
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            </>
          ) : (
            <EmptyState
              icon={<UserCheck className="h-6 w-6" />}
              title="Tidak ada antrean verifikasi"
              description="Semua pendaftar yang masuk sudah diproses."
            />
          )}
        </section>
      )}

      {/* Tab 2: Semua Pengguna */}
      {tab === 'all' && (
        <section>
          <div className="overflow-x-auto rounded-lg bg-white border border-cream-200">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-cream-200 bg-cream-100 type-label font-medium text-ink-600">
                  <th className="px-5 py-3">Nama · NIM</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Peran</th>
                  <th className="px-5 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-200 type-small">
                {users.map((u) => (
                  <tr key={u.uid} className="h-14">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={u.nama} photoURL={u.photoURL} size="S" />
                        <div>
                          <p className="font-semibold text-ink-900">{u.nama}</p>
                          <p className="type-caption text-ink-600 tabular-nums">
                            {u.nim ? `NIM ${u.nim}` : 'Akun Admin'} · {u.jurusan}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <Badge
                        variant={
                          u.status === 'active'
                            ? 'success'
                            : u.status === 'pending'
                              ? 'warning'
                              : 'danger'
                        }
                      >
                        {formatStatusLabel(u.status)}
                      </Badge>
                    </td>
                    <td className="px-5 py-3">
                      <div className="relative inline-flex items-center">
                        <select
                          aria-label={`Ubah peran ${u.nama}`}
                          disabled={u.status !== 'active' || busyUid === u.uid}
                          value={u.role}
                          onChange={(e) => void handleRoleChange(u, e.target.value as Role)}
                          className="min-h-11 md:min-h-[38px] appearance-none rounded-md border border-cream-300 bg-white pl-3 pr-8 py-1.5 type-small text-ink-900 cursor-pointer focus:border-maroon-700 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {ALL_ROLES.map((r) => (
                            <option key={r} value={r}>
                              {ROLE_LABELS[r]}
                            </option>
                          ))}
                        </select>
                        <ChevronDown
                          className="pointer-events-none absolute right-2.5 h-4 w-4 text-ink-600"
                          aria-hidden="true"
                        />
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        {(u.status === 'active' || u.status === 'disabled') && (
                          <>
                            <Button
                              variant="secondary"
                              size="sm"
                              disabled={busyUid === u.uid || u.uid === currentUser?.uid}
                              onClick={() => void handleToggleStatus(u)}
                            >
                              {u.status === 'active' ? 'Nonaktifkan' : 'Aktifkan'}
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              disabled={busyUid === u.uid}
                              leftIcon={<KeyRound className="h-4 w-4 text-ink-600" />}
                              onClick={() => void handleResetPassword(u)}
                            >
                              Reset sandi
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Tab 3: Aslab */}
      {tab === 'aslab' && (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="type-small text-ink-600">
              Kelola penempatan lab, jadwal jaga, atau tandai anggota aktif sebagai asisten lab.
            </p>
            <Link to="/kelola/asisten-lab">
              <Button variant="primary" size="sm" leftIcon={<FlaskConical className="h-4 w-4" />}>
                Tandai sebagai aslab / Kelola
              </Button>
            </Link>
          </div>

          {aslabUsers.length > 0 ? (
            <>
              <div className="hidden md:block overflow-x-auto rounded-lg bg-white border border-cream-200">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-cream-200 bg-cream-100 type-label font-medium text-ink-600">
                      <th className="px-5 py-3">Nama · NIM</th>
                      <th className="px-5 py-3">Fakultas</th>
                      <th className="px-5 py-3">Laboratorium</th>
                      <th className="px-5 py-3">Jadwal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cream-200 type-small">
                    {aslabUsers.map((u) => (
                      <tr key={u.uid} className="h-14">
                        <td className="px-5 py-3 font-medium text-ink-900">
                          {u.nama}{' '}
                          <span className="text-ink-600 tabular-nums">({u.nim})</span>
                        </td>
                        <td className="px-5 py-3 text-ink-900">{u.fakultas || '—'}</td>
                        <td className="px-5 py-3">
                          <Badge variant="neutral">{u.lab || '—'}</Badge>
                        </td>
                        <td className="px-5 py-3 text-ink-600">{u.jadwalAslab || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="md:hidden space-y-3">
                {aslabUsers.map((u) => (
                  <div
                    key={u.uid}
                    className="rounded-lg bg-white border border-cream-200 p-4 space-y-2 type-label"
                  >
                    <p className="font-semibold text-ink-900">
                      {u.nama} <span className="text-ink-600 tabular-nums">({u.nim})</span>
                    </p>
                    <p className="text-ink-600">{u.fakultas || '—'}</p>
                    <Badge variant="neutral">{u.lab || '—'}</Badge>
                    <p className="text-ink-600">Jadwal: {u.jadwalAslab || '—'}</p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <EmptyState
              icon={<Users className="h-6 w-6" />}
              title="Belum ada asisten lab aktif"
              description="Anggota aktif yang mendaftar sebagai asisten lab akan tampil di tabel ini."
            />
          )}
        </section>
      )}

      {/* Access Control Matrix */}
      <section className="space-y-4 pt-4">
        <h2 className="type-app-h2 text-ink-900">Matriks Hak Akses</h2>

        {/* Mobile (<768px): Per-Role Card View */}
        <div className="md:hidden space-y-3">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="matrix-role-select" className="type-small font-semibold text-ink-900">
              Pilih peran
            </label>
            <select
              id="matrix-role-select"
              value={matrixRole}
              onChange={(e) => setMatrixRole(e.target.value as typeof matrixRole)}
              className="min-h-11 w-full rounded-md border border-cream-300 bg-white px-3.5 py-2 type-app-body text-ink-900 focus:border-maroon-700 focus:outline-none"
            >
              <option value="tamu">Tamu</option>
              <option value="anggota">Anggota</option>
              <option value="psdm">PSDM</option>
              <option value="minat_bakat">Minat & Bakat</option>
              <option value="akademik">Akademik</option>
              <option value="kominfo">Kominfo</option>
              <option value="inti">Inti</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div className="rounded-lg bg-white border border-cream-200 divide-y divide-cream-200">
            {ACCESS_MATRIX_ROWS.map((row) => {
              const cell = row[matrixRole];
              return (
                <div
                  key={row.feature}
                  className="px-4 py-3 flex items-center justify-between gap-3"
                >
                  <span className="type-small font-medium text-ink-900">{row.feature}</span>
                  {cell === 'E' ? (
                    <Badge variant="maroon">Kelola</Badge>
                  ) : cell === 'V' ? (
                    <Badge variant="neutral">Lihat</Badge>
                  ) : (
                    <span className="type-label text-ink-400 px-2">—</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Desktop (>=768px): Sticky Feature Table */}
        <div className="hidden md:block overflow-x-auto rounded-lg bg-white border border-cream-200">
          <table className="w-full min-w-[780px] text-left border-collapse">
            <thead className="sticky top-0 bg-cream-100">
              <tr className="border-b border-cream-200 type-label font-medium text-ink-600">
                <th className="sticky left-0 z-20 bg-cream-100 border-r border-cream-200 px-4 py-3 min-w-[210px]">
                  Fitur
                </th>
                <th className="px-3 py-3 text-center">Tamu</th>
                <th className="px-3 py-3 text-center">Anggota</th>
                <th className="px-3 py-3 text-center">PSDM</th>
                <th className="px-3 py-3 text-center">Minat & Bakat</th>
                <th className="px-3 py-3 text-center">Akademik</th>
                <th className="px-3 py-3 text-center">Kominfo</th>
                <th className="px-3 py-3 text-center">Inti</th>
                <th className="px-3 py-3 text-center bg-gold-100/60 font-bold text-maroon-900">
                  Admin
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-200 type-label">
              {ACCESS_MATRIX_ROWS.map((row) => (
                <tr key={row.feature} className="h-14">
                  <td className="sticky left-0 z-10 bg-white border-r border-cream-200 px-4 py-3 font-medium text-ink-900">
                    {row.feature}
                  </td>
                  {(
                    [
                      row.tamu,
                      row.anggota,
                      row.psdm,
                      row.minat_bakat,
                      row.akademik,
                      row.kominfo,
                      row.inti,
                      row.admin,
                    ] as const
                  ).map((cell, i) => (
                    <td
                      key={i}
                      className={[
                        'px-3 py-3 text-center',
                        i === 7 ? 'bg-gold-100/60' : '',
                      ].join(' ')}
                    >
                      {cell === 'E' ? (
                        <span className="type-label font-semibold text-maroon-700">Kelola</span>
                      ) : cell === 'V' ? (
                        <span className="type-label text-ink-900">Lihat</span>
                      ) : (
                        <span className="type-label text-ink-400">—</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Reject Modal */}
      <Modal
        open={Boolean(rejectTarget)}
        onClose={() => setRejectTarget(null)}
        title="Tolak Pendaftaran?"
        description={`Akun ${rejectTarget?.nama || ''} (NIM ${rejectTarget?.nim || ''}) akan dihapus dari Auth agar yang bersangkutan bisa mendaftar ulang.`}
      >
        <div className="space-y-4">
          <TextareaField
            label="Alasan penolakan (opsional)"
            placeholder="Contoh: NIM tidak cocok dengan data anggota Sumatera Selatan."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setRejectTarget(null)}>
              Batal
            </Button>
            <Button
              variant="danger"
              loading={busyUid === rejectTarget?.uid}
              loadingLabel="Memproses…"
              onClick={handleRejectConfirm}
            >
              Tolak pendaftaran
            </Button>
          </div>
        </div>
      </Modal>

      {/* Temporary Password Modal */}
      <Modal
        open={Boolean(tempPasswordInfo)}
        onClose={() => setTempPasswordInfo(null)}
        title="Kata Sandi Sementara Dibuat"
        description="Salin dan berikan kata sandi ini ke anggota terkait. Hanya ditampilkan sekali."
      >
        {tempPasswordInfo && (
          <div className="space-y-4">
            <div className="rounded-md bg-cream-100 border border-cream-200 p-4 text-center space-y-1">
              <p className="type-label text-ink-600 tabular-nums">
                {tempPasswordInfo.nama} (NIM {tempPasswordInfo.nim})
              </p>
              <p className="type-h2 font-bold text-ink-900 tabular-nums select-all">
                {tempPasswordInfo.password}
              </p>
            </div>
            <div className="flex justify-end gap-3">
              <Button
                variant="secondary"
                leftIcon={<Copy className="h-4 w-4" />}
                onClick={async () => {
                  await navigator.clipboard.writeText(tempPasswordInfo.password);
                  toast.success('Kata sandi disalin');
                }}
              >
                Salin
              </Button>
              <Button variant="primary" onClick={() => setTempPasswordInfo(null)}>
                Selesai
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
