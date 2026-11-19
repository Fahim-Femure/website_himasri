import { useEffect, useState } from 'react';
import { Building2, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { EmptyState } from '@/components/feedback/EmptyState';
import { FallbackImportBanner } from '@/components/feedback/FallbackImportBanner';
import { ConfirmDialog } from '@/components/feedback/Modal';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Field, TextareaField } from '@/components/ui/Field';
import {
  deleteFacultyDoc,
  importFallbackFaculties,
  saveFacultyDoc,
  subscribeAllFacultiesRaw,
} from '@/services/cmsService';
import type { FacultyDoc } from '@/types/models';

export default function ManageFacultiesPage() {
  const [faculties, setFaculties] = useState<FacultyDoc[]>([]);
  const [editing, setEditing] = useState<FacultyDoc | null>(null);
  const [name, setName] = useState('');
  const [labsText, setLabsText] = useState('');
  const [saving, setSaving] = useState(false);

  const [deletingTarget, setDeletingTarget] = useState<FacultyDoc | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    document.title = 'Fakultas & Laboratorium — HIMASRI IT PLN';
    return subscribeAllFacultiesRaw(setFaculties);
  }, []);

  const resetForm = () => {
    setEditing(null);
    setName('');
    setLabsText('');
  };

  const handleEdit = (item: FacultyDoc) => {
    setEditing(item);
    setName(item.name);
    setLabsText(item.labs.join('\n'));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) {
      toast.error('Nama fakultas minimal 2 karakter.');
      return;
    }
    const labs = labsText
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    setSaving(true);
    try {
      await saveFacultyDoc(editing?.id ?? null, {
        name: name.trim(),
        labs,
        order: editing?.order ?? faculties.length + 1,
      });
      toast.success(editing ? 'Fakultas diperbarui' : 'Fakultas ditambahkan');
      resetForm();
    } catch {
      toast.error('Gagal menyimpan data fakultas.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingTarget) return;
    setDeleting(true);
    try {
      await deleteFacultyDoc(deletingTarget.id);
      toast.success('Fakultas dihapus');
      if (editing?.id === deletingTarget.id) resetForm();
      setDeletingTarget(null);
    } catch {
      toast.error('Gagal menghapus fakultas.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fakultas & Laboratorium"
        description="Kelola daftar fakultas dan lab IT PLN. Seluruh pilihan fakultas di pendaftaran dan direktori Asisten Lab membaca dari sini."
      />

      {faculties.length === 0 && (
        <FallbackImportBanner
          subject="fakultas & laboratorium"
          onImport={async () => {
            try {
              const count = await importFallbackFaculties();
              toast.success(`${count} fakultas bawaan berhasil diimpor`);
            } catch {
              toast.error('Gagal mengimpor fakultas bawaan.');
            }
          }}
        />
      )}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        <div className="xl:col-span-7 space-y-3">
          {faculties.length > 0 ? (
            faculties.map((f) => (
              <div
                key={f.id}
                className="rounded-lg bg-white border border-cream-200 p-5 space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="type-app-body font-semibold text-ink-900">{f.name}</h3>
                    <p className="type-label text-ink-600 tabular-nums">
                      {f.labs.length} laboratorium terdaftar
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button
                      variant="secondary"
                      size="sm"
                      aria-label={`Ubah ${f.name}`}
                      onClick={() => handleEdit(f)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      aria-label={`Hapus ${f.name}`}
                      onClick={() => setDeletingTarget(f)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {f.labs.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {f.labs.map((lab) => (
                      <Badge key={lab} variant="neutral">
                        {lab}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            ))
          ) : (
            <EmptyState
              icon={<Building2 className="h-6 w-6" />}
              title="Belum ada data fakultas"
              description="Tambahkan fakultas dan daftar laboratorium melalui formulir di samping."
            />
          )}
        </div>

        <form
          onSubmit={handleSubmit}
          className="xl:col-span-5 rounded-lg bg-white border border-cream-200 p-5 space-y-4"
        >
          <div className="flex items-center justify-between gap-2">
            <h2 className="type-app-h2 text-ink-900">
              {editing ? 'Ubah Fakultas' : 'Tambah Fakultas'}
            </h2>
            {editing && (
              <Button variant="ghost" size="sm" onClick={resetForm}>
                Batal
              </Button>
            )}
          </div>

          <Field
            label="Nama fakultas"
            required
            placeholder="Contoh: Fakultas Telematika Energi"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <TextareaField
            label="Daftar laboratorium (satu nama per baris)"
            placeholder={'Lab Pemrograman Dasar\nLab Basis Data\nLab Jaringan Komputer'}
            rows={6}
            value={labsText}
            onChange={(e) => setLabsText(e.target.value)}
          />

          <Button
            type="submit"
            variant="primary"
            fullWidth
            loading={saving}
            leftIcon={<Plus className="h-4 w-4" />}
          >
            {editing ? 'Simpan perubahan' : 'Tambah fakultas'}
          </Button>
        </form>
      </div>

      <ConfirmDialog
        open={Boolean(deletingTarget)}
        onClose={() => setDeletingTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title={`Hapus fakultas "${deletingTarget?.name || ''}"?`}
        description="Fakultas dan daftar labnya akan dihapus dari pilihan formulir."
        confirmLabel="Ya, hapus"
      />
    </div>
  );
}
