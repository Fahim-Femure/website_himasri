import { useEffect, useMemo, useState } from 'react';
import { FlaskConical, Pencil, Search } from 'lucide-react';
import { toast } from 'sonner';
import { EmptyState } from '@/components/feedback/EmptyState';
import { Modal } from '@/components/feedback/Modal';
import { PageHeader } from '@/components/layout/PageHeader';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Field, SelectField } from '@/components/ui/Field';
import { ToggleSwitch } from '@/components/ui/ToggleSwitch';
import { useFaculties } from '@/hooks/useFaculties';
import { callUpdateAslab } from '@/services/cmsService';
import { subscribeAllUsers } from '@/services/memberService';
import type { UserDoc } from '@/types/models';
import { normalizeWhatsapp } from '@/utils/format';

export default function ManageAslabPage() {
  const { facultyNames, getLabsForFaculty } = useFaculties();
  const [users, setUsers] = useState<UserDoc[]>([]);
  const [search, setSearch] = useState('');
  const [onlyAslab, setOnlyAslab] = useState(true);

  const [editing, setEditing] = useState<UserDoc | null>(null);
  const [isAslab, setIsAslab] = useState(true);
  const [fakultas, setFakultas] = useState('');
  const [lab, setLab] = useState('');
  const [jadwal, setJadwal] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    document.title = 'Kelola Asisten Lab — HIMASRI IT PLN';
    return subscribeAllUsers(setUsers);
  }, []);

  const activeUsers = useMemo(
    () => users.filter((u) => u.status === 'active'),
    [users],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return activeUsers.filter((u) => {
      if (onlyAslab && !u.isAslab) return false;
      if (!q) return true;
      return (
        u.nama.toLowerCase().includes(q) ||
        (u.nim || '').toLowerCase().includes(q) ||
        (u.lab || '').toLowerCase().includes(q)
      );
    });
  }, [activeUsers, onlyAslab, search]);

  const openEdit = (u: UserDoc) => {
    setEditing(u);
    setIsAslab(Boolean(u.isAslab));
    setFakultas(u.fakultas || facultyNames[0] || '');
    setLab(u.lab || '');
    setJadwal(u.jadwalAslab || '');
    setWhatsapp(u.whatsapp || '');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    try {
      await callUpdateAslab({
        uid: editing.uid,
        isAslab,
        fakultas: isAslab ? fakultas : '',
        lab: isAslab ? lab : '',
        jadwalAslab: isAslab ? jadwal : '',
        whatsappAslab: isAslab && whatsapp.trim() ? normalizeWhatsapp(whatsapp) : '',
      });
      toast.success(`Data asisten lab ${editing.nama} diperbarui`);
      setEditing(null);
    } catch {
      toast.error('Gagal memperbarui data asisten lab.');
    } finally {
      setSaving(false);
    }
  };

  const labOptions = getLabsForFaculty(fakultas);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kelola Asisten Lab"
        description="Atur status asisten laboratorium, penempatan lab, jadwal jaga, dan kontak WhatsApp anggota aktif."
      />

      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="w-full sm:max-w-xs">
          <Field
            label="Cari anggota atau lab"
            placeholder="Ketik nama, NIM, atau nama lab…"
            leftIcon={<Search className="h-4 w-4" />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <ToggleSwitch
          checked={onlyAslab}
          onChange={setOnlyAslab}
          label="Hanya tampilkan Aslab aktif"
        />
      </div>

      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
          {filtered.map((u) => (
            <div
              key={u.uid}
              className="rounded-lg bg-white border border-cream-200 p-4 flex flex-col justify-between gap-4"
            >
              <div className="space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar name={u.nama} photoURL={u.photoURL} size="S" />
                    <div className="min-w-0">
                      <p className="type-small font-semibold text-ink-900 truncate">{u.nama}</p>
                      <p className="type-caption text-ink-600 tabular-nums">
                        NIM {u.nim} · {u.angkatan}
                      </p>
                    </div>
                  </div>
                  <Badge variant={u.isAslab ? 'success' : 'neutral'}>
                    {u.isAslab ? 'Aslab' : 'Anggota'}
                  </Badge>
                </div>

                {u.isAslab && (
                  <div className="type-label text-ink-600 space-y-1">
                    <p>
                      <span className="font-medium text-ink-900">Lab:</span> {u.lab || '—'}
                    </p>
                    <p>
                      <span className="font-medium text-ink-900">Jadwal:</span>{' '}
                      {u.jadwalAslab || '—'}
                    </p>
                  </div>
                )}
              </div>

              <Button
                variant="secondary"
                size="sm"
                fullWidth
                leftIcon={<Pencil className="h-4 w-4" />}
                onClick={() => openEdit(u)}
              >
                {u.isAslab ? 'Ubah data aslab' : 'Tandai sebagai aslab'}
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<FlaskConical className="h-6 w-6" />}
          title="Tidak ada anggota ditemukan"
          description="Matikan filter 'Hanya tampilkan Aslab aktif' untuk menandai anggota aktif lainnya sebagai asisten lab."
        />
      )}

      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={`Kelola Aslab — ${editing?.nama || ''}`}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <ToggleSwitch
            checked={isAslab}
            onChange={setIsAslab}
            label="Status Asisten Laboratorium"
            description="Tampilkan di direktori Asisten Lab ruang anggota"
          />

          {isAslab && (
            <>
              <SelectField
                label="Fakultas"
                value={fakultas}
                onChange={(e) => {
                  setFakultas(e.target.value);
                  setLab('');
                }}
              >
                <option value="">Pilih fakultas…</option>
                {facultyNames.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </SelectField>

              <SelectField
                label="Laboratorium"
                value={lab}
                onChange={(e) => setLab(e.target.value)}
              >
                <option value="">Pilih laboratorium…</option>
                {labOptions.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </SelectField>

              <Field
                label="Jadwal jaga / praktikum"
                placeholder="Contoh: Senin & Rabu 13.00–16.00"
                value={jadwal}
                onChange={(e) => setJadwal(e.target.value)}
              />

              <Field
                label="WhatsApp kontak aslab"
                placeholder="6281234567890"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
              />
            </>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setEditing(null)}>
              Batal
            </Button>
            <Button type="submit" variant="primary" loading={saving}>
              Simpan
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
