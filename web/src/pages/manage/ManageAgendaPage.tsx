import { useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, Calendar, Pencil, Plus, Star, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { EmptyState } from '@/components/feedback/EmptyState';
import { FallbackImportBanner } from '@/components/feedback/FallbackImportBanner';
import { ConfirmDialog } from '@/components/feedback/Modal';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Field, TextareaField } from '@/components/ui/Field';
import { ToggleSwitch } from '@/components/ui/ToggleSwitch';
import {
  deleteAgendaDoc,
  importFallbackAgenda,
  reorderAgendaDocs,
  saveAgendaDoc,
  subscribeAllAgenda,
} from '@/services/cmsService';
import type { AgendaDoc } from '@/types/models';

export default function ManageAgendaPage() {
  const [items, setItems] = useState<AgendaDoc[]>([]);
  const [editing, setEditing] = useState<AgendaDoc | null>(null);
  const [title, setTitle] = useState('');
  const [tag, setTag] = useState('');
  const [description, setDescription] = useState('');
  const [periodId, setPeriodId] = useState('2025-2026');
  const [highlight, setHighlight] = useState(false);
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);

  const [deletingTarget, setDeletingTarget] = useState<AgendaDoc | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    document.title = 'Kelola Agenda Tahunan — HIMASRI IT PLN';
    return subscribeAllAgenda(setItems);
  }, []);

  const resetForm = () => {
    setEditing(null);
    setTitle('');
    setTag('');
    setDescription('');
    setPeriodId('2025-2026');
    setHighlight(false);
    setActive(true);
  };

  const handleEdit = (item: AgendaDoc) => {
    setEditing(item);
    setTitle(item.title);
    setTag(item.tag);
    setDescription(item.description);
    setPeriodId(item.periodId || '2025-2026');
    setHighlight(Boolean(item.highlight));
    setActive(item.active !== false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim().length < 2 || tag.trim().length < 2) {
      toast.error('Judul dan waktu/label agenda minimal 2 karakter.');
      return;
    }
    setSaving(true);
    try {
      await saveAgendaDoc(editing?.id ?? null, {
        title: title.trim(),
        tag: tag.trim(),
        dateLabel: tag.trim(),
        description: description.trim(),
        highlight,
        active,
        periodId: periodId.trim() || '2025-2026',
        order: editing?.order ?? items.length + 1,
      });
      toast.success(editing ? 'Agenda diperbarui' : 'Agenda ditambahkan');
      resetForm();
    } catch {
      toast.error('Gagal menyimpan agenda.');
    } finally {
      setSaving(false);
    }
  };

  const handleMove = async (index: number, dir: -1 | 1) => {
    const targetIdx = index + dir;
    if (targetIdx < 0 || targetIdx >= items.length) return;
    const next = [...items];
    const [moved] = next.splice(index, 1);
    next.splice(targetIdx, 0, moved);
    setItems(next);
    try {
      await reorderAgendaDocs(next);
      toast.success('Urutan agenda diperbarui');
    } catch {
      toast.error('Gagal memperbarui urutan.');
    }
  };

  const handleDelete = async () => {
    if (!deletingTarget) return;
    setDeleting(true);
    try {
      await deleteAgendaDoc(deletingTarget.id);
      toast.success('Agenda dihapus');
      if (editing?.id === deletingTarget.id) resetForm();
      setDeletingTarget(null);
    } catch {
      toast.error('Gagal menghapus agenda.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Agenda Tahunan"
        description="Kelola daftar kegiatan tahunan HIMASRI yang tampil di beranda publik sesuai periode berjalan."
        actions={
          <Badge variant="neutral" className="tabular-nums">
            {items.filter((i) => i.active).length} aktif · {items.length} total
          </Badge>
        }
      />

      {items.length === 0 && (
        <FallbackImportBanner
          subject="agenda tahunan"
          onImport={async () => {
            try {
              await importFallbackAgenda();
              toast.success('Agenda bawaan berhasil disimpan. Sekarang bisa diedit di halaman ini.');
            } catch {
              toast.error('Gagal mengimpor agenda bawaan.');
            }
          }}
        />
      )}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        <div className="xl:col-span-7 space-y-3">
          {items.length > 0 ? (
            items.map((item, idx) => (
              <div
                key={item.id}
                className="rounded-lg bg-white border border-cream-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={item.highlight ? 'gold' : 'maroon'}>{item.tag}</Badge>
                    {item.highlight && (
                      <Badge variant="warning">
                        <Star className="h-3 w-3" aria-hidden="true" />
                        Sorotan
                      </Badge>
                    )}
                    {!item.active && <Badge variant="neutral">Tersembunyi</Badge>}
                    <span className="type-caption text-ink-600 tabular-nums">{item.periodId}</span>
                  </div>
                  <h3 className="type-app-body font-semibold text-ink-900">{item.title}</h3>
                  <p className="type-label text-ink-600">{item.description}</p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={idx === 0}
                    aria-label="Naikkan urutan"
                    onClick={() => void handleMove(idx, -1)}
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={idx === items.length - 1}
                    aria-label="Turunkan urutan"
                    onClick={() => void handleMove(idx, 1)}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    aria-label={`Ubah ${item.title}`}
                    onClick={() => handleEdit(item)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    aria-label={`Hapus ${item.title}`}
                    onClick={() => setDeletingTarget(item)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <EmptyState
              icon={<Calendar className="h-6 w-6" />}
              title="Belum ada agenda"
              description="Tambahkan agenda kegiatan tahunan pertama melalui formulir di samping."
            />
          )}
        </div>

        <form
          onSubmit={handleSubmit}
          className="xl:col-span-5 rounded-lg bg-white border border-cream-200 p-5 space-y-4"
        >
          <div className="flex items-center justify-between gap-2">
            <h2 className="type-app-h2 text-ink-900">
              {editing ? 'Ubah Agenda' : 'Tambah Agenda'}
            </h2>
            {editing && (
              <Button variant="ghost" size="sm" onClick={resetForm}>
                Batal
              </Button>
            )}
          </div>

          <Field
            label="Judul kegiatan"
            required
            placeholder="Contoh: Buka Bersama Sriwijaya"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field
              label="Bulan / Waktu"
              required
              placeholder="Contoh: Ramadan / Oktober"
              value={tag}
              onChange={(e) => setTag(e.target.value)}
            />
            <Field
              label="ID Periode"
              placeholder="2025-2026"
              value={periodId}
              onChange={(e) => setPeriodId(e.target.value)}
            />
          </div>
          <TextareaField
            label="Deskripsi singkat"
            placeholder="Tujuan dan ringkasan kegiatan…"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <ToggleSwitch
            checked={highlight}
            onChange={setHighlight}
            label="Jadikan kartu sorotan emas"
            description="Tampil menonjol di beranda publik"
          />
          <ToggleSwitch
            checked={active}
            onChange={setActive}
            label="Tampilkan di beranda"
            description="Nonaktifkan untuk menyembunyikan sementara"
          />

          <Button
            type="submit"
            variant="primary"
            fullWidth
            loading={saving}
            leftIcon={<Plus className="h-4 w-4" />}
          >
            {editing ? 'Simpan perubahan' : 'Tambah agenda'}
          </Button>
        </form>
      </div>

      <ConfirmDialog
        open={Boolean(deletingTarget)}
        onClose={() => setDeletingTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title={`Hapus agenda "${deletingTarget?.title || ''}"?`}
        description="Agenda yang dihapus tidak akan tampil lagi di beranda publik."
        confirmLabel="Ya, hapus"
      />
    </div>
  );
}
