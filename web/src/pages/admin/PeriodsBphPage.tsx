import { useEffect, useState } from 'react';
import { CalendarCog, Check, ChevronDown, ImagePlus, Plus, Save, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Modal } from '@/components/feedback/Modal';
import { SimulationNote } from '@/components/feedback/SimulationNote';
import { PageHeader } from '@/components/layout/PageHeader';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Field, SelectField } from '@/components/ui/Field';
import { ToggleSwitch } from '@/components/ui/ToggleSwitch';
import {
  callCreatePeriodWizard,
  deleteStorageFile,
  uploadPeriodDepartmentPhoto,
  uploadPeriodPersonPhoto,
} from '@/services/cmsService';
import {
  deleteUnitDoc,
  fetchAllPeriods,
  fetchMembers,
  fetchUnitsForPeriod,
  savePeriodDoc,
  savePublicSettings,
  saveUnitDoc,
} from '@/services/memberService';
import {
  DEFAULT_PUBLIC_SETTINGS,
  FALLBACK_CURRENT_PERIOD,
  fetchPublicSettings,
} from '@/services/publicService';
import type {
  IntiOfficer,
  MemberDoc,
  PeriodDoc,
  PublicSettings,
  UnitDoc,
  UnitStripColor,
} from '@/types/models';
import { normalizeWhatsapp } from '@/utils/format';

const STRIP_COLORS: Array<{ value: UnitStripColor; label: string }> = [
  { value: 'maroon-700', label: 'Maroon Utama' },
  { value: 'gold-400', label: 'Emas' },
  { value: 'maroon-500', label: 'Maroon Sedang' },
  { value: 'gold-300', label: 'Emas Muda' },
  { value: 'maroon-950', label: 'Maroon Gelap' },
];

export default function PeriodsBphPage() {
  const [periods, setPeriods] = useState<PeriodDoc[]>([FALLBACK_CURRENT_PERIOD]);
  const [selectedPeriodId, setSelectedPeriodId] = useState('2025-2026');
  const [units, setUnits] = useState<UnitDoc[]>([]);
  const [activeMembers, setActiveMembers] = useState<MemberDoc[]>([]);
  const [publicSettings, setPublicSettings] = useState<PublicSettings>(DEFAULT_PUBLIC_SETTINGS);

  const [intiDraft, setIntiDraft] = useState<IntiOfficer[]>(FALLBACK_CURRENT_PERIOD.inti);
  const [savingInti, setSavingInti] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  const [newPeriodOpen, setNewPeriodOpen] = useState(false);
  const [newPeriodLabel, setNewPeriodLabel] = useState('');
  const [newPeriodStartYear, setNewPeriodStartYear] = useState('2026');
  const [copyFromPeriodId, setCopyFromPeriodId] = useState('2025-2026');
  const [archivePrevious, setArchivePrevious] = useState(true);
  const [deactivateAngkatanText, setDeactivateAngkatanText] = useState('');
  const [creatingPeriod, setCreatingPeriod] = useState(false);

  const [unitModalOpen, setUnitModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<UnitDoc | null>(null);
  const [unitKind, setUnitKind] = useState<'DEPARTEMEN' | 'BIRO'>('DEPARTEMEN');
  const [unitName, setUnitName] = useState('');
  const [unitColor, setUnitColor] = useState<UnitStripColor>('maroon-700');
  const [unitLeaderJabatan, setUnitLeaderJabatan] = useState('Kepala Departemen');
  const [unitLeaderNama, setUnitLeaderNama] = useState('');
  const [unitLeaderJurusan, setUnitLeaderJurusan] = useState('');
  const [unitLeaderPhotoUrl, setUnitLeaderPhotoUrl] = useState('');
  const [unitLeaderPhotoPath, setUnitLeaderPhotoPath] = useState('');
  const [unitPhotoUrl, setUnitPhotoUrl] = useState('');
  const [unitPhotoPath, setUnitPhotoPath] = useState('');
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const [unitMembersText, setUnitMembersText] = useState('');
  const [savingUnit, setSavingUnit] = useState(false);

  const loadData = async () => {
    const [pList, mList, pub] = await Promise.all([
      fetchAllPeriods(),
      fetchMembers(),
      fetchPublicSettings(),
    ]);
    if (pList.length > 0) {
      setPeriods(pList);
      const current = pList.find((p) => p.isCurrent) ?? pList[0];
      setSelectedPeriodId(current.id);
      setIntiDraft(current.inti);
    }
    setActiveMembers(mList);
    setPublicSettings(pub);
  };

  useEffect(() => {
    document.title = 'Periode & BPH — HIMASRI IT PLN';
    void loadData();
  }, []);

  const selectedPeriod = periods.find((p) => p.id === selectedPeriodId) ?? periods[0];

  useEffect(() => {
    if (!selectedPeriod?.id) {
      setIntiDraft([]);
      setUnits([]);
      return;
    }
    setIntiDraft(selectedPeriod.inti);
    void fetchUnitsForPeriod(selectedPeriod.id).then(setUnits);
  }, [selectedPeriod]);

  const handleSaveIntiAndHeads = async () => {
    if (!selectedPeriod) return;
    setSavingInti(true);
    try {
      const syncedHeads = units.map((u) => {
        const firstLead = u.leaders[0];
        return {
          kind: u.kind,
          unit: u.name,
          jabatan: firstLead?.jabatan || 'Kepala',
          nama: firstLead?.nama || '—',
          jurusan: firstLead?.jurusan || '—',
          color: u.color,
          ...(u.photoUrl ? { photoUrl: u.photoUrl, photoPath: u.photoPath || '' } : {}),
          ...(firstLead?.photoUrl
            ? { leaderPhotoUrl: firstLead.photoUrl, leaderPhotoPath: firstLead.photoPath || '' }
            : {}),
        };
      });

      await savePeriodDoc(
        selectedPeriod.id,
        {
          label: selectedPeriod.label,
          isCurrent: selectedPeriod.isCurrent,
          startYear: selectedPeriod.startYear,
          inti: intiDraft,
          heads: syncedHeads.length > 0 ? syncedHeads : selectedPeriod.heads,
        },
        selectedPeriod.isCurrent,
      );
      toast.success('Susunan pengurus inti disimpan');
      await loadData();
    } catch {
      toast.error('Gagal menyimpan susunan BPH.');
    } finally {
      setSavingInti(false);
    }
  };

  const handleMarkCurrent = async () => {
    if (!selectedPeriod) return;
    try {
      await savePeriodDoc(
        selectedPeriod.id,
        {
          label: selectedPeriod.label,
          isCurrent: true,
          startYear: selectedPeriod.startYear,
          inti: intiDraft,
          heads: selectedPeriod.heads,
        },
        true,
      );
      toast.success(`Periode ${selectedPeriod.label} ditandai sebagai periode berjalan`);
      await loadData();
    } catch {
      toast.error('Gagal memperbarui periode berjalan.');
    }
  };

  const handleCreatePeriod = async (e: React.FormEvent) => {
    e.preventDefault();
    const year = Number(newPeriodStartYear);
    if (!newPeriodLabel.trim() || !Number.isFinite(year)) {
      toast.error('Isi label periode dan tahun mulai dengan benar.');
      return;
    }
    const deactivateAngkatan = deactivateAngkatanText
      .split(',')
      .map((s) => Number(s.trim()))
      .filter((n) => Number.isInteger(n) && n >= 2010 && n <= 2100);

    const DEFAULT_INTI_POSITIONS = [
      'Ketua Himpunan',
      'Wakil Ketua Himpunan',
      'Sekretaris Jenderal',
      'Sekretaris',
      'Bendahara',
    ];

    setCreatingPeriod(true);
    try {
      const res = await callCreatePeriodWizard({
        label: newPeriodLabel.trim(),
        startYear: year,
        copyFromPeriodId: copyFromPeriodId || undefined,
        archivePrevious,
        deactivateAngkatan,
        inti: DEFAULT_INTI_POSITIONS.map((position) => ({
          position,
          nama: '',
          jurusan: '',
        })),
      });
      setNewPeriodOpen(false);
      setNewPeriodLabel('');
      setDeactivateAngkatanText('');
      await loadData();
      setSelectedPeriodId(res.periodId);
      toast.success(
        `Periode ${newPeriodLabel} dibuat (${res.copiedUnits} unit disalin, ${res.deactivatedCount} akun lulus dinonaktifkan)`,
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal membuat periode baru.');
    } finally {
      setCreatingPeriod(false);
    }
  };

  const openUnitModal = (unit?: UnitDoc) => {
    setEditingUnit(unit ?? null);
    setUnitKind(unit?.kind ?? 'DEPARTEMEN');
    setUnitName(unit?.name ?? '');
    const initialColor = unit?.color && STRIP_COLORS.some((c) => c.value === unit.color)
      ? unit.color
      : 'maroon-700';
    setUnitColor(initialColor);
    setUnitLeaderJabatan(unit?.leaders[0]?.jabatan ?? 'Kepala Departemen');
    setUnitLeaderNama(unit?.leaders[0]?.nama ?? '');
    setUnitLeaderJurusan(unit?.leaders[0]?.jurusan ?? '');
    setUnitLeaderPhotoUrl(unit?.leaders[0]?.photoUrl ?? '');
    setUnitLeaderPhotoPath(unit?.leaders[0]?.photoPath ?? '');
    setUnitPhotoUrl(unit?.photoUrl ?? '');
    setUnitPhotoPath(unit?.photoPath ?? '');
    setUnitMembersText(
      unit?.members.map((m) => `${m.nama} | ${m.jurusan}`).join('\n') ?? '',
    );
    setUnitModalOpen(true);
  };

  const handleUploadIntiPhoto = async (idx: number, file: File | undefined) => {
    if (!file || !selectedPeriod) return;
    const officer = intiDraft[idx];
    if (!officer) return;
    const slug = officer.position.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `inti-${idx}`;
    const key = `inti-${idx}`;
    setUploadingKey(key);
    try {
      const { photoUrl, photoPath } = await uploadPeriodPersonPhoto(selectedPeriod.id, slug, file);
      setIntiDraft((prev) =>
        prev.map((item, i) => (i === idx ? { ...item, photoUrl, photoPath } : item)),
      );
      toast.success(`Foto ${officer.position} diunggah. Klik "Simpan Pengurus Inti" untuk menerapkan.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal mengunggah foto.');
    } finally {
      setUploadingKey(null);
    }
  };

  const handleRemoveIntiPhoto = async (idx: number) => {
    const officer = intiDraft[idx];
    if (!officer) return;
    if (officer.photoPath) {
      await deleteStorageFile(officer.photoPath);
    }
    setIntiDraft((prev) =>
      prev.map((item, i) => {
        if (i !== idx) return item;
        const next = { ...item };
        delete next.photoUrl;
        delete next.photoPath;
        return next;
      }),
    );
    toast.success(`Foto ${officer.position} dihapus. Klik "Simpan Pengurus Inti" untuk menyimpan.`);
  };

  const handleUploadUnitPhoto = async (file: File | undefined) => {
    if (!file || !selectedPeriod) return;
    const slug =
      editingUnit?.id ||
      unitName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') ||
      `unit-${Date.now()}`;
    setUploadingKey('unit-photo');
    try {
      const { photoUrl, photoPath } = await uploadPeriodDepartmentPhoto(selectedPeriod.id, slug, file);
      setUnitPhotoUrl(photoUrl);
      setUnitPhotoPath(photoPath);
      toast.success('Foto departemen/biro diunggah');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal mengunggah foto departemen.');
    } finally {
      setUploadingKey(null);
    }
  };

  const handleRemoveUnitPhoto = async () => {
    if (unitPhotoPath) await deleteStorageFile(unitPhotoPath);
    setUnitPhotoUrl('');
    setUnitPhotoPath('');
    toast.success('Foto departemen/biro dihapus');
  };

  const handleUploadLeaderPhoto = async (file: File | undefined) => {
    if (!file || !selectedPeriod) return;
    const slug =
      editingUnit?.id ||
      unitName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') ||
      `leader-${Date.now()}`;
    setUploadingKey('leader-photo');
    try {
      const { photoUrl, photoPath } = await uploadPeriodPersonPhoto(
        selectedPeriod.id,
        `${slug}-leader`,
        file,
      );
      setUnitLeaderPhotoUrl(photoUrl);
      setUnitLeaderPhotoPath(photoPath);
      toast.success('Foto pimpinan unit diunggah');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal mengunggah foto pimpinan.');
    } finally {
      setUploadingKey(null);
    }
  };

  const handleRemoveLeaderPhoto = async () => {
    if (unitLeaderPhotoPath) await deleteStorageFile(unitLeaderPhotoPath);
    setUnitLeaderPhotoUrl('');
    setUnitLeaderPhotoPath('');
    toast.success('Foto pimpinan unit dihapus');
  };

  const handleSaveUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPeriod || !unitName.trim() || !unitLeaderNama.trim()) {
      toast.error('Nama unit dan nama pimpinan wajib diisi.');
      return;
    }
    setSavingUnit(true);
    try {
      const unitId =
        editingUnit?.id ||
        unitName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');

      const parsedMembers = unitMembersText
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
          const [namaPart, jurPart] = line.split('|').map((s) => s.trim());
          return { nama: namaPart, jurusan: jurPart || 'IT PLN' };
        });

      const payload: Omit<UnitDoc, 'id'> = {
        kind: unitKind,
        name: unitName.trim(),
        color: unitColor,
        order: editingUnit?.order ?? units.length + 1,
        ...(unitPhotoUrl ? { photoUrl: unitPhotoUrl, photoPath: unitPhotoPath } : {}),
        leaders: [
          {
            jabatan: unitLeaderJabatan.trim() || 'Kepala',
            nama: unitLeaderNama.trim(),
            jurusan: unitLeaderJurusan.trim() || 'IT PLN',
            ...(unitLeaderPhotoUrl
              ? { photoUrl: unitLeaderPhotoUrl, photoPath: unitLeaderPhotoPath }
              : {}),
          },
        ],
        members: parsedMembers,
      };

      await saveUnitDoc(selectedPeriod.id, unitId, payload);
      const nextUnits = await fetchUnitsForPeriod(selectedPeriod.id);
      setUnits(nextUnits);

      await savePeriodDoc(
        selectedPeriod.id,
        {
          label: selectedPeriod.label,
          isCurrent: selectedPeriod.isCurrent,
          startYear: selectedPeriod.startYear,
          inti: intiDraft,
          heads: nextUnits.map((u) => ({
            kind: u.kind,
            unit: u.name,
            jabatan: u.leaders[0]?.jabatan || 'Kepala',
            nama: u.leaders[0]?.nama || '—',
            jurusan: u.leaders[0]?.jurusan || '—',
            color: u.color,
            ...(u.photoUrl ? { photoUrl: u.photoUrl, photoPath: u.photoPath || '' } : {}),
            ...(u.leaders[0]?.photoUrl
              ? {
                  leaderPhotoUrl: u.leaders[0].photoUrl,
                  leaderPhotoPath: u.leaders[0].photoPath || '',
                }
              : {}),
          })),
        },
        selectedPeriod.isCurrent,
      );

      toast.success('Departemen/biro disimpan');
      setUnitModalOpen(false);
    } catch {
      toast.error('Gagal menyimpan departemen/biro.');
    } finally {
      setSavingUnit(false);
    }
  };

  const handleDeleteUnit = async (unitId: string) => {
    if (!selectedPeriod) return;
    try {
      await deleteUnitDoc(selectedPeriod.id, unitId);
      const nextUnits = await fetchUnitsForPeriod(selectedPeriod.id);
      setUnits(nextUnits);
      toast.success('Unit dihapus');
    } catch {
      toast.error('Gagal menghapus unit.');
    }
  };

  const handleSavePublicContacts = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      await savePublicSettings({
        ...publicSettings,
        kahimWhatsapp: normalizeWhatsapp(publicSettings.kahimWhatsapp),
        wakahimWhatsapp: normalizeWhatsapp(publicSettings.wakahimWhatsapp),
        adminWhatsapp: normalizeWhatsapp(publicSettings.adminWhatsapp),
        isSample: false,
      });
      setPublicSettings((prev) => ({ ...prev, isSample: false }));
      toast.success('Kontak publik HIMASRI diperbarui');
    } catch {
      toast.error('Gagal menyimpan kontak publik.');
    } finally {
      setSavingSettings(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        tone="maroon"
        label="Kepengurusan"
        title="Periode & BPH"
        description="Atur periode kepengurusan, susunan pengurus inti, unit departemen/biro, dan kontak WhatsApp publik."
        actions={
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <div className="relative inline-flex items-center">
              <select
                aria-label="Pilih periode"
                value={selectedPeriodId}
                onChange={(e) => setSelectedPeriodId(e.target.value)}
                className="min-h-11 md:min-h-[40px] appearance-none rounded-md border border-cream-300 bg-white pl-3.5 pr-9 py-2 type-small font-medium text-ink-900 cursor-pointer focus:border-maroon-700 focus:outline-none"
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

            {selectedPeriod && !selectedPeriod.isCurrent && (
              <Button
                variant="secondary"
                leftIcon={<Check className="h-4 w-4" />}
                onClick={handleMarkCurrent}
              >
                Tandai berjalan
              </Button>
            )}

            <Button
              variant="primary"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => setNewPeriodOpen(true)}
            >
              Periode baru
            </Button>
          </div>
        }
      />

      {/* Core Officers (Inti) Editor — Flat 2-column rows */}
      <section className="rounded-lg bg-white border border-cream-200 p-6 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="type-app-h2 text-ink-900">
              {selectedPeriod?.id ? `Pengurus Inti (${selectedPeriod.label})` : 'Pengurus Inti'}
            </h2>
            <p className="mt-0.5 type-label text-ink-600">
              Data ini tampil pada bagan BPH di halaman publik dan ruang anggota.
            </p>
          </div>
          {selectedPeriod?.id && selectedPeriod.isCurrent && (
            <Badge variant="success">Periode berjalan</Badge>
          )}
        </div>

        {!selectedPeriod?.id ? (
          <div className="rounded-lg border border-dashed border-cream-300 bg-cream-50 p-6 text-center space-y-3">
            <p className="type-body font-bold text-ink-900">Belum ada periode kepengurusan</p>
            <p className="type-small text-ink-600 max-w-md mx-auto">
              Buat periode kepengurusan pertama (mis. 2025/2026) untuk mulai mengisi susunan Pengurus
              Inti, Departemen, dan Biro.
            </p>
            <div className="pt-1">
              <Button
                variant="primary"
                leftIcon={<Plus className="h-4 w-4" />}
                onClick={() => setNewPeriodOpen(true)}
              >
                Buat Periode Pertama
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-5">
              {intiDraft.map((officer, idx) => (
                <div
                  key={`${officer.position}-${idx}`}
                  className="pt-5 first:pt-0 border-t first:border-t-0 border-cream-200 space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Avatar
                        name={officer.nama || officer.position || 'P'}
                        photoURL={officer.photoUrl}
                        size="M"
                      />
                      <div>
                        <p className="type-small leading-5 font-semibold text-ink-900">
                          {officer.position || 'Jabatan baru'}
                        </p>
                        <p className="type-caption text-ink-600">
                          {officer.photoUrl
                            ? 'Foto profil terpasang (800×800 WebP)'
                            : 'Belum ada foto (tampil inisial)'}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="inline-flex min-h-11 md:min-h-[38px] items-center gap-2 rounded-md border border-cream-300 bg-white px-3 py-1.5 type-small font-semibold text-ink-900 hover:bg-cream-100 cursor-pointer">
                        <ImagePlus className="h-4 w-4 text-maroon-700" aria-hidden="true" />
                        <span>
                          {uploadingKey === `inti-${idx}`
                            ? 'Mengunggah…'
                            : officer.photoUrl
                              ? 'Ganti foto'
                              : 'Unggah foto'}
                        </span>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          disabled={uploadingKey === `inti-${idx}`}
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            e.currentTarget.value = '';
                            void handleUploadIntiPhoto(idx, f);
                          }}
                          className="sr-only"
                        />
                      </label>
                      {officer.photoUrl && (
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => void handleRemoveIntiPhoto(idx)}
                        >
                          Hapus foto
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setIntiDraft((prev) => prev.filter((_, i) => i !== idx))
                        }
                      >
                        Hapus baris
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Field
                      label="Jabatan"
                      placeholder="Contoh: Ketua Himpunan"
                      value={officer.position}
                      onChange={(e) => {
                        const val = e.target.value;
                        setIntiDraft((prev) =>
                          prev.map((item, i) => (i === idx ? { ...item, position: val } : item)),
                        );
                      }}
                    />
                    <Field
                      label="Nama lengkap"
                      placeholder="Nama pengurus"
                      value={officer.nama}
                      onChange={(e) => {
                        const val = e.target.value;
                        setIntiDraft((prev) =>
                          prev.map((item, i) => (i === idx ? { ...item, nama: val } : item)),
                        );
                      }}
                    />
                    <Field
                      label="Program studi"
                      placeholder="Contoh: S1 Teknik Informatika"
                      value={officer.jurusan}
                      onChange={(e) => {
                        const val = e.target.value;
                        setIntiDraft((prev) =>
                          prev.map((item, i) => (i === idx ? { ...item, jurusan: val } : item)),
                        );
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="sticky bottom-0 bg-white pt-4 border-t border-cream-200 flex flex-wrap items-center justify-between gap-3">
              <Button
                variant="secondary"
                leftIcon={<Plus className="h-4 w-4" />}
                onClick={() =>
                  setIntiDraft((prev) => [
                    ...prev,
                    { position: '', nama: '', jurusan: '' },
                  ])
                }
              >
                Tambah Pengurus Inti
              </Button>
              <Button
                variant="primary"
                leftIcon={<Save className="h-4 w-4" />}
                loading={savingInti}
                loadingLabel="Menyimpan…"
                onClick={handleSaveIntiAndHeads}
              >
                Simpan Pengurus Inti
              </Button>
            </div>
          </>
        )}
      </section>

      {/* Units (Departments & Bureaus) */}
      <section className="rounded-lg bg-white border border-cream-200 p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="type-app-h2 text-ink-900">Departemen & Biro ({units.length})</h2>
            <p className="mt-0.5 type-label text-ink-600">
              Daftar kepala unit otomatis tersinkronisasi ke halaman publik.
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => openUnitModal()}
          >
            Tambah Unit
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {units.map((unit) => (
            <div
              key={unit.id}
              className="rounded-lg border border-cream-200 bg-white p-4 flex flex-col justify-between gap-4"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="neutral">
                    {unit.kind === 'DEPARTEMEN' ? 'Departemen' : 'Biro'}
                  </Badge>
                  <span className="type-caption text-ink-600 tabular-nums">
                    {unit.leaders.length + unit.members.length} orang
                  </span>
                </div>
                <h3 className="mt-2 type-app-body font-semibold text-ink-900">{unit.name}</h3>
                <p className="mt-1 type-label text-ink-600">
                  Pimpinan: {unit.leaders.map((l) => l.nama).join(', ') || '—'}
                </p>
              </div>
              <div className="flex items-center gap-2 pt-3 border-t border-cream-200">
                <Button
                  variant="secondary"
                  size="sm"
                  className="flex-1"
                  onClick={() => openUnitModal(unit)}
                >
                  Ubah unit
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  aria-label={`Hapus ${unit.name}`}
                  onClick={() => void handleDeleteUnit(unit.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Public Contact Settings */}
      <form
        onSubmit={handleSavePublicContacts}
        className="rounded-lg bg-white border border-cream-200 p-6 space-y-5"
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="type-app-h2 text-ink-900">Kontak Publik HIMASRI</h2>
            <p className="mt-0.5 type-label text-ink-600">
              Ditampilkan pada bagian Hubungi Kami, Footer, dan dialog Lupa Kata Sandi.
            </p>
          </div>
          {publicSettings.isSample && <SimulationNote />}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field
            label="WhatsApp Ketua Himpunan"
            required
            value={publicSettings.kahimWhatsapp}
            onChange={(e) =>
              setPublicSettings((s) => ({ ...s, kahimWhatsapp: e.target.value }))
            }
          />
          <Field
            label="WhatsApp Wakil Ketua"
            required
            value={publicSettings.wakahimWhatsapp}
            onChange={(e) =>
              setPublicSettings((s) => ({ ...s, wakahimWhatsapp: e.target.value }))
            }
          />
          <Field
            label="WhatsApp Admin (Reset Sandi)"
            required
            value={publicSettings.adminWhatsapp}
            onChange={(e) =>
              setPublicSettings((s) => ({ ...s, adminWhatsapp: e.target.value }))
            }
          />
          <Field
            label="Email resmi"
            required
            value={publicSettings.email}
            onChange={(e) => setPublicSettings((s) => ({ ...s, email: e.target.value }))}
          />
          <Field
            label="Instagram"
            required
            value={publicSettings.instagram}
            onChange={(e) => setPublicSettings((s) => ({ ...s, instagram: e.target.value }))}
          />
          <Field
            label="Alamat sekretariat"
            required
            value={publicSettings.alamat}
            onChange={(e) => setPublicSettings((s) => ({ ...s, alamat: e.target.value }))}
          />
        </div>

        <div className="flex justify-end">
          <Button
            type="submit"
            variant="primary"
            loading={savingSettings}
            loadingLabel="Menyimpan…"
          >
            Simpan kontak publik
          </Button>
        </div>
      </form>

      {/* Wizard Buat Periode Baru (Cloud Function Batch) */}
      <Modal
        open={newPeriodOpen}
        onClose={() => setNewPeriodOpen(false)}
        title="Wizard Periode Kepengurusan Baru"
        description="Buat periode baru, salin struktur departemen/biro, arsipkan periode lama, dan nonaktifkan angkatan lulus secara massal."
      >
        <form onSubmit={handleCreatePeriod} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field
              label="Label periode"
              required
              placeholder="Contoh: 2026/2027"
              leftIcon={<CalendarCog className="h-4 w-4" />}
              value={newPeriodLabel}
              onChange={(e) => setNewPeriodLabel(e.target.value)}
            />
            <Field
              label="Tahun mulai"
              required
              type="number"
              value={newPeriodStartYear}
              onChange={(e) => setNewPeriodStartYear(e.target.value)}
            />
          </div>

          <SelectField
            label="Salin struktur departemen & biro dari (opsional)"
            value={copyFromPeriodId}
            onChange={(e) => setCopyFromPeriodId(e.target.value)}
          >
            <option value="">Mulai kosong (tanpa salin unit)</option>
            {periods.map((p) => (
              <option key={p.id} value={p.id}>
                Periode {p.label}
              </option>
            ))}
          </SelectField>

          <ToggleSwitch
            checked={archivePrevious}
            onChange={setArchivePrevious}
            label="Jadikan periode lama arsip & aktifkan periode baru"
            description="Periode berjalan sebelumnya akan ditandai sebagai arsip (read-only)"
          />

          <Field
            label="Nonaktifkan massal anggota angkatan lulus (opsional)"
            placeholder="Contoh: 2020, 2021 (pisahkan koma)"
            helperText="Khusus Admin. Akun admin tidak akan ikut dinonaktifkan."
            value={deactivateAngkatanText}
            onChange={(e) => setDeactivateAngkatanText(e.target.value)}
          />

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setNewPeriodOpen(false)}>
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={creatingPeriod}
              loadingLabel="Memproses wizard…"
            >
              Jalankan wizard periode
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Tambah / Ubah Unit */}
      <Modal
        open={unitModalOpen}
        onClose={() => setUnitModalOpen(false)}
        title={editingUnit ? `Ubah ${editingUnit.name}` : 'Tambah Departemen / Biro'}
        maxWidthClass="max-w-xl"
      >
        <form onSubmit={handleSaveUnit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SelectField
              label="Jenis unit"
              value={unitKind}
              onChange={(e) => setUnitKind(e.target.value as 'DEPARTEMEN' | 'BIRO')}
            >
              <option value="DEPARTEMEN">Departemen</option>
              <option value="BIRO">Biro</option>
            </SelectField>
            <SelectField
              label="Warna strip"
              value={unitColor}
              onChange={(e) => setUnitColor(e.target.value as UnitStripColor)}
            >
              {STRIP_COLORS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </SelectField>
          </div>

          <Field
            label="Nama departemen / biro"
            required
            value={unitName}
            onChange={(e) => setUnitName(e.target.value)}
          />

          {/* Foto Departemen/Biro & Foto Pimpinan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-lg border border-cream-200 bg-cream-50/60 p-4">
            <div className="space-y-2.5">
              <p className="type-small font-semibold text-ink-900">Foto / logo unit (opsional)</p>
              <div className="aspect-[16/10] w-full overflow-hidden rounded-md border border-cream-200 bg-cream-100 flex items-center justify-center">
                {unitPhotoUrl ? (
                  <img src={unitPhotoUrl} alt={unitName || 'Foto unit'} className="h-full w-full object-cover" />
                ) : (
                  <span className="type-caption text-ink-600">Belum ada foto unit</span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <label className="inline-flex min-h-11 md:min-h-[38px] items-center gap-2 rounded-md border border-cream-300 bg-white px-3 py-1.5 type-small font-semibold text-ink-900 hover:bg-cream-100 cursor-pointer">
                  <ImagePlus className="h-4 w-4 text-maroon-700" aria-hidden="true" />
                  <span>
                    {uploadingKey === 'unit-photo'
                      ? 'Mengunggah…'
                      : unitPhotoUrl
                        ? 'Ganti foto'
                        : 'Unggah foto'}
                  </span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    disabled={uploadingKey === 'unit-photo'}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      e.currentTarget.value = '';
                      void handleUploadUnitPhoto(f);
                    }}
                    className="sr-only"
                  />
                </label>
                {unitPhotoUrl && (
                  <Button variant="danger" size="sm" onClick={() => void handleRemoveUnitPhoto()}>
                    Hapus
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-2.5">
              <p className="type-small font-semibold text-ink-900">Foto pimpinan (opsional)</p>
              <div className="flex items-center gap-3 py-2">
                <Avatar name={unitLeaderNama || 'Pimpinan'} photoURL={unitLeaderPhotoUrl || undefined} size="L" />
                <div className="flex flex-wrap items-center gap-2">
                  <label className="inline-flex min-h-11 md:min-h-[38px] items-center gap-2 rounded-md border border-cream-300 bg-white px-3 py-1.5 type-small font-semibold text-ink-900 hover:bg-cream-100 cursor-pointer">
                    <ImagePlus className="h-4 w-4 text-maroon-700" aria-hidden="true" />
                    <span>
                      {uploadingKey === 'leader-photo'
                        ? 'Mengunggah…'
                        : unitLeaderPhotoUrl
                          ? 'Ganti'
                          : 'Unggah'}
                    </span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      disabled={uploadingKey === 'leader-photo'}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        e.currentTarget.value = '';
                        void handleUploadLeaderPhoto(f);
                      }}
                      className="sr-only"
                    />
                  </label>
                  {unitLeaderPhotoUrl && (
                    <Button variant="danger" size="sm" onClick={() => void handleRemoveLeaderPhoto()}>
                      Hapus
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Field
              label="Jabatan pimpinan"
              value={unitLeaderJabatan}
              onChange={(e) => setUnitLeaderJabatan(e.target.value)}
            />
            <Field
              label="Nama pimpinan"
              required
              value={unitLeaderNama}
              onChange={(e) => setUnitLeaderNama(e.target.value)}
            />
            <Field
              label="Prodi pimpinan"
              value={unitLeaderJurusan}
              onChange={(e) => setUnitLeaderJurusan(e.target.value)}
            />
          </div>

          {activeMembers.length > 0 && (
            <SelectField
              label="Sisipkan dari daftar anggota aktif (opsional)"
              value=""
              onChange={(e) => {
                const found = activeMembers.find((m) => m.uid === e.target.value);
                if (found) {
                  setUnitMembersText((prev) =>
                    prev
                      ? `${prev}\n${found.nama} | ${found.jurusan}`
                      : `${found.nama} | ${found.jurusan}`,
                  );
                }
              }}
            >
              <option value="">+ Pilih anggota aktif untuk ditambahkan…</option>
              {activeMembers.map((m) => (
                <option key={m.uid} value={m.uid}>
                  {m.nama} ({m.jurusan})
                </option>
              ))}
            </SelectField>
          )}

          <div className="space-y-1.5">
            <label className="block type-small font-semibold text-ink-900">
              Daftar anggota unit (satu orang per baris: Nama | Program Studi)
            </label>
            <textarea
              rows={5}
              value={unitMembersText}
              onChange={(e) => setUnitMembersText(e.target.value)}
              placeholder="Budi Santoso | S1 Teknik Informatika"
              className="w-full rounded-md border border-cream-300 bg-white p-3 type-small text-ink-900 focus:border-maroon-700 focus:outline-none focus:ring-[3px] focus:ring-maroon-700/15"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setUnitModalOpen(false)}>
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={savingUnit}
              loadingLabel="Menyimpan…"
            >
              Simpan unit
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
