import { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Calendar,
  Compass,
  ImagePlus,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmDialog, Modal } from '@/components/feedback/Modal';
import { EmptyState } from '@/components/feedback/EmptyState';
import { FallbackImportBanner } from '@/components/feedback/FallbackImportBanner';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Field, TextareaField } from '@/components/ui/Field';
import { JourneyStorySection } from '@/components/ui/JourneyStorySection';
import { ToggleSwitch } from '@/components/ui/ToggleSwitch';
import { useAuth } from '@/contexts/AuthContext';
import { importFallbackJourneyItems } from '@/services/cmsService';
import {
  compressImageToWebp,
  createJourneyItemDoc,
  deleteJourneyItemDoc,
  reorderJourneyItems,
  subscribeAllJourneyItems,
  updateJourneyItemDoc,
  uploadBlobWithProgress,
} from '@/services/memberService';
import type { JourneyItemDoc } from '@/types/models';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export default function ManageJourneyPage() {
  const { user } = useAuth();
  const createFileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  const [items, setItems] = useState<JourneyItemDoc[]>([]);

  const currentYear = new Date().getFullYear();
  const [title, setTitle] = useState('');
  const [dateLabel, setDateLabel] = useState('');
  const [year, setYear] = useState(String(currentYear));
  const [badge, setBadge] = useState('');
  const [description, setDescription] = useState('');
  const [highlight, setHighlight] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewDims, setPreviewDims] = useState<{ width: number; height: number } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [editingItem, setEditingItem] = useState<JourneyItemDoc | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDateLabel, setEditDateLabel] = useState('');
  const [editYear, setEditYear] = useState(String(currentYear));
  const [editBadge, setEditBadge] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editFile, setEditFile] = useState<File | null>(null);
  const [editPreviewUrl, setEditPreviewUrl] = useState<string | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  const [deletingItem, setDeletingItem] = useState<JourneyItemDoc | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    document.title = 'Kelola Journey HIMASRI — HIMASRI IT PLN';
    return subscribeAllJourneyItems(setItems);
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    return () => {
      if (editPreviewUrl) URL.revokeObjectURL(editPreviewUrl);
    };
  }, [editPreviewUrl]);

  const validateImageFile = (file: File): boolean => {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      toast.error('Format foto harus JPG, PNG, atau WebP.');
      return false;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      toast.error('Ukuran berkas foto maksimal 5 MB.');
      return false;
    }
    return true;
  };

  const handleSelectCreateFile = (file: File | undefined) => {
    if (!file) return;
    if (!validateImageFile(file)) {
      if (createFileInputRef.current) createFileInputRef.current.value = '';
      return;
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    const nextUrl = URL.createObjectURL(file);
    setSelectedFile(file);
    setPreviewUrl(nextUrl);
    setPreviewDims(null);

    const img = new Image();
    img.onload = () => {
      setPreviewDims({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.src = nextUrl;
  };

  const handleSelectEditFile = (file: File | undefined) => {
    if (!file) return;
    if (!validateImageFile(file)) {
      if (editFileInputRef.current) editFileInputRef.current.value = '';
      return;
    }
    if (editPreviewUrl) URL.revokeObjectURL(editPreviewUrl);
    setEditFile(file);
    setEditPreviewUrl(URL.createObjectURL(file));
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const cleanTitle = title.trim();
    const cleanDate = dateLabel.trim();
    const parsedYear = Number(year);

    if (cleanTitle.length < 3 || cleanTitle.length > 140) {
      toast.error('Judul momen harus 3–140 karakter.');
      return;
    }
    if (cleanDate.length < 2) {
      toast.error('Isi label waktu (contoh: Oktober 2025).');
      return;
    }
    if (!Number.isInteger(parsedYear) || parsedYear < 2000 || parsedYear > 2100) {
      toast.error('Tahun tidak valid (2000–2100).');
      return;
    }
    if (!selectedFile) {
      toast.error('Pilih foto momen perjalanan terlebih dahulu.');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    try {
      const compressed = await compressImageToWebp(selectedFile, { maxWidth: 1600, quality: 0.85 });
      const itemId = `journey-${Date.now()}`;
      const storagePath = `journey/${itemId}.webp`;
      const imageUrl = await uploadBlobWithProgress(
        storagePath,
        compressed.blob,
        'image/webp',
        setUploadProgress,
      );

      const nextOrder = items.length > 0 ? Math.max(...items.map((i) => i.order)) + 1 : 1;

      await createJourneyItemDoc(itemId, {
        title: cleanTitle,
        description: description.trim(),
        dateLabel: cleanDate,
        year: parsedYear,
        badge: badge.trim(),
        imageUrl,
        storagePath,
        order: nextOrder,
        active: true,
        highlight,
        width: compressed.width,
        height: compressed.height,
        uploadedBy: user.uid,
      });

      setTitle('');
      setDateLabel('');
      setBadge('');
      setDescription('');
      setHighlight(false);
      setSelectedFile(null);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
      if (createFileInputRef.current) createFileInputRef.current.value = '';
      toast.success('Momen Journey berhasil ditambahkan ke timeline publik');
    } catch (err) {
      console.error(err);
      toast.error('Gagal mengunggah momen Journey.');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const openEditModal = (item: JourneyItemDoc) => {
    setEditingItem(item);
    setEditTitle(item.title);
    setEditDateLabel(item.dateLabel);
    setEditYear(String(item.year));
    setEditBadge(item.badge || '');
    setEditDescription(item.description || '');
    setEditFile(null);
    if (editPreviewUrl) URL.revokeObjectURL(editPreviewUrl);
    setEditPreviewUrl(null);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    const cleanTitle = editTitle.trim();
    const cleanDate = editDateLabel.trim();
    const parsedYear = Number(editYear);

    if (cleanTitle.length < 3 || cleanTitle.length > 140) {
      toast.error('Judul momen harus 3–140 karakter.');
      return;
    }
    if (cleanDate.length < 2) {
      toast.error('Label waktu wajib diisi.');
      return;
    }
    if (!Number.isInteger(parsedYear) || parsedYear < 2000 || parsedYear > 2100) {
      toast.error('Tahun tidak valid (2000–2100).');
      return;
    }

    setSavingEdit(true);
    try {
      let imageUrl = editingItem.imageUrl;
      let storagePath = editingItem.storagePath;
      let width = editingItem.width;
      let height = editingItem.height;

      if (editFile) {
        const compressed = await compressImageToWebp(editFile, { maxWidth: 1600, quality: 0.85 });
        storagePath = editingItem.storagePath || `journey/${editingItem.id}.webp`;
        imageUrl = await uploadBlobWithProgress(storagePath, compressed.blob, 'image/webp');
        width = compressed.width;
        height = compressed.height;
      }

      await updateJourneyItemDoc(editingItem.id, {
        title: cleanTitle,
        dateLabel: cleanDate,
        year: parsedYear,
        badge: editBadge.trim(),
        description: editDescription.trim(),
        imageUrl,
        storagePath,
        width,
        height,
      });

      toast.success('Momen Journey diperbarui');
      setEditingItem(null);
    } catch (err) {
      console.error(err);
      toast.error('Gagal menyimpan perubahan momen.');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleMove = async (index: number, direction: -1 | 1) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= items.length) return;
    const next = [...items];
    const [moved] = next.splice(index, 1);
    next.splice(targetIdx, 0, moved);
    setItems(next);
    try {
      await reorderJourneyItems(next);
      toast.success('Urutan timeline diperbarui');
    } catch {
      toast.error('Gagal memperbarui urutan timeline.');
    }
  };

  const handleToggleActive = async (item: JourneyItemDoc, active: boolean) => {
    try {
      await updateJourneyItemDoc(item.id, { active });
      toast.success(
        active ? 'Momen ditampilkan di timeline publik' : 'Momen disembunyikan dari publik',
      );
    } catch {
      toast.error('Gagal mengubah status tampil momen.');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingItem) return;
    setDeleting(true);
    try {
      await deleteJourneyItemDoc(deletingItem.id);
      toast.success('Momen Journey dihapus');
      setDeletingItem(null);
    } catch {
      toast.error('Gagal menghapus momen Journey.');
    } finally {
      setDeleting(false);
    }
  };

  const activeCount = items.filter((i) => i.active).length;

  return (
    <div className="space-y-6">
      <PageHeader
        tone="maroon"
        label="Dokumentasi Sejarah"
        title="Journey HIMASRI"
        description="Unggah dan atur linimasa dokumentasi perjalanan HIMASRI yang tampil di halaman publik."
        actions={
          <Badge variant="neutral" className="tabular-nums">
            {activeCount} tampil · {items.length} total
          </Badge>
        }
      />

      {items.length === 0 && (
        <FallbackImportBanner
          subject="momen Journey"
          onImport={async () => {
            try {
              const count = await importFallbackJourneyItems();
              toast.success(`${count} momen Journey bawaan berhasil diimpor`);
            } catch {
              toast.error('Gagal mengimpor momen Journey bawaan.');
            }
          }}
        />
      )}

      {/* Upload Form */}
      <form
        onSubmit={handleCreateSubmit}
        className="rounded-lg bg-white border border-cream-200 p-5 space-y-5"
      >
        <div>
          <h2 className="type-app-h2 text-ink-900">Tambah momen perjalanan</h2>
          <p className="mt-0.5 type-label text-ink-600">
            Foto JPG, PNG, atau WebP maks. 5 MB. Otomatis dikompresi ke WebP sebelum disimpan.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-5 space-y-3">
            <div className="relative aspect-[16/10] w-full overflow-hidden rounded-md border border-dashed border-cream-300 bg-cream-50 flex items-center justify-center">
              {previewUrl ? (
                <img src={previewUrl} alt="Pratinjau foto momen" className="h-full w-full object-cover" />
              ) : (
                <div className="text-center px-6 py-8 space-y-1.5 text-ink-600">
                  <ImagePlus className="h-6 w-6 mx-auto text-ink-400" aria-hidden="true" />
                  <p className="type-small font-semibold text-ink-900">Belum ada foto dipilih</p>
                  <p className="type-caption text-ink-600">
                    Saran rasio lanskap 3:2 atau 4:3, lebar minimal 1600px agar tajam di tampilan full-bleed.
                  </p>
                </div>
              )}
            </div>

            {previewDims && previewDims.width < 1200 && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-md border border-warning-600/30 bg-warning-50 p-3 type-caption leading-5 text-warning-600"
              >
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
                <span>
                  Resolusi foto {previewDims.width}×{previewDims.height}px (di bawah 1200px).
                  Disarankan minimal 1600px agar tidak pecah di layar lebar.
                </span>
              </div>
            )}

            <input
              ref={createFileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => handleSelectCreateFile(e.target.files?.[0])}
            />
            <Button
              type="button"
              variant="secondary"
              fullWidth
              leftIcon={<ImagePlus className="h-4 w-4" />}
              onClick={() => createFileInputRef.current?.click()}
            >
              {selectedFile ? `Ganti foto (${selectedFile.name})` : 'Pilih foto momen'}
            </Button>
          </div>

          <div className="lg:col-span-7 space-y-4">
            <Field
              label="Judul momen"
              required
              placeholder="Contoh: Malam Keakraban HIMASRI 2025"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field
                label="Label waktu"
                required
                placeholder="Contoh: Oktober 2025"
                leftIcon={<Calendar className="h-4 w-4" />}
                value={dateLabel}
                onChange={(e) => setDateLabel(e.target.value)}
              />
              <Field
                label="Tahun"
                required
                type="number"
                min={2000}
                max={2100}
                value={year}
                onChange={(e) => setYear(e.target.value)}
              />
              <Field
                label="Kategori / Kabinet"
                placeholder="Contoh: Kaderisasi"
                value={badge}
                onChange={(e) => setBadge(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <TextareaField
                label="Cerita / keterangan lengkap (maks. 600 karakter)"
                placeholder="Ceritakan makna momen ini bagi perjalanan HIMASRI…"
                rows={4}
                maxLength={600}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              <p className="text-right type-caption text-ink-600 tabular-nums">
                {description.length} / 600 karakter
              </p>
            </div>

            <ToggleSwitch
              checked={highlight}
              onChange={setHighlight}
              label="Tampilkan di Sorotan"
              description="Muncul di bagian kartu menumpuk 'Momen yang membentuk kami' pada halaman Journey"
            />

            {uploading && (
              <div className="space-y-1.5">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-cream-200">
                  <div
                    className="h-full rounded-full bg-maroon-700 transition-all"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="type-label text-ink-600 tabular-nums">
                  Mengunggah foto momen… {uploadProgress}%
                </p>
              </div>
            )}

            <div className="flex justify-end">
              <Button
                type="submit"
                variant="primary"
                loading={uploading}
                loadingLabel="Mengunggah…"
                leftIcon={<Plus className="h-4 w-4" />}
              >
                Simpan ke Timeline
              </Button>
            </div>
          </div>
        </div>

        {/* Live Editorial Preview (matching alternating left/right order) */}
        {(previewUrl || title.trim() || description.trim()) && (
          <div className="pt-4 border-t border-cream-200 space-y-2.5">
            <p className="type-label font-semibold text-ink-600">
              Pratinjau tampilan editorial (urutan #{items.length + 1} · foto di sisi{' '}
              {items.length % 2 === 0 ? 'kiri' : 'kanan'})
            </p>
            <div className="overflow-hidden rounded-lg border border-cream-200">
              <JourneyStorySection
                compact
                index={items.length}
                item={{
                  id: 'preview-draft',
                  title: title.trim() || 'Judul Momen Perjalanan HIMASRI',
                  description:
                    description.trim() ||
                    'Deskripsi lengkap momen akan tampil di sini dalam tata letak editorial penuh.',
                  dateLabel: dateLabel.trim() || `Bulan ${year}`,
                  year: Number(year) || currentYear,
                  badge: badge.trim() || undefined,
                  imageUrl: previewUrl || '/assets/images/budaya/ampera.webp',
                  storagePath: '',
                  order: items.length + 1,
                  active: true,
                  width: previewDims?.width || 1600,
                  height: previewDims?.height || 1067,
                }}
              />
            </div>
          </div>
        )}
      </form>

      {/* Existing Timeline Items */}
      <section className="space-y-4">
        <div>
          <h2 className="type-app-h2 text-ink-900">Urutan Timeline Publik ({items.length})</h2>
          <p className="type-label text-ink-600">
            Atur urutan tampil kronologis menggunakan tombol panah naik/turun.
          </p>
        </div>

        {items.length > 0 ? (
          <div className="space-y-2.5">
            {items.map((item, idx) => (
              <article
                key={item.id}
                className="rounded-lg bg-white border border-cream-200 p-3 flex flex-col md:flex-row md:items-center gap-4"
              >
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  loading="lazy"
                  className="h-10 w-16 shrink-0 rounded object-cover bg-cream-100"
                />

                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="type-app-body leading-6 font-semibold text-ink-900 break-words">
                      {item.title}
                    </h3>
                    {item.badge && <Badge variant="neutral">{item.badge}</Badge>}
                    {item.isSample && <Badge variant="neutral">Contoh</Badge>}
                  </div>
                  <p className="type-label text-ink-600 tabular-nums">
                    #{idx + 1} · {item.dateLabel} · {item.year}
                    {item.description ? ` · ${item.description}` : ''}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-cream-200">
                  <button
                    type="button"
                    onClick={() => handleMove(idx, -1)}
                    disabled={idx === 0}
                    aria-label={`Geser ${item.title} ke atas`}
                    className="flex h-9 w-9 items-center justify-center rounded-md border border-cream-300 bg-white text-ink-900 hover:bg-cream-100 disabled:opacity-40 cursor-pointer"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMove(idx, 1)}
                    disabled={idx === items.length - 1}
                    aria-label={`Geser ${item.title} ke bawah`}
                    className="flex h-9 w-9 items-center justify-center rounded-md border border-cream-300 bg-white text-ink-900 hover:bg-cream-100 disabled:opacity-40 cursor-pointer"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </button>

                  <ToggleSwitch
                    checked={item.active}
                    onChange={(v) => handleToggleActive(item, v)}
                    label="Tampil"
                  />

                  <ToggleSwitch
                    checked={Boolean(item.highlight)}
                    onChange={async (v) => {
                      try {
                        await updateJourneyItemDoc(item.id, { highlight: v });
                        toast.success(
                          v ? 'Ditambahkan ke Sorotan Journey' : 'Dihapus dari Sorotan Journey',
                        );
                      } catch {
                        toast.error('Gagal memperbarui status Sorotan.');
                      }
                    }}
                    label="Sorotan"
                  />

                  <Button
                    variant="secondary"
                    size="sm"
                    leftIcon={<Pencil className="h-4 w-4" />}
                    onClick={() => openEditModal(item)}
                  >
                    Ubah
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    aria-label={`Hapus ${item.title}`}
                    onClick={() => setDeletingItem(item)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Compass className="h-6 w-6" />}
            title="Belum ada momen Journey"
            description="Tambahkan foto momen pertama menggunakan formulir di atas."
          />
        )}
      </section>

      {/* Edit Modal */}
      <Modal
        open={Boolean(editingItem)}
        onClose={() => !savingEdit && setEditingItem(null)}
        title="Ubah Momen Journey"
        maxWidthClass="max-w-xl"
      >
        <form onSubmit={handleSaveEdit} className="space-y-4">
          <div className="space-y-2">
            <div className="aspect-[16/10] w-full overflow-hidden rounded-md border border-cream-200 bg-cream-100">
              <img
                src={editPreviewUrl || editingItem?.imageUrl || ''}
                alt={editTitle || 'Foto momen'}
                className="h-full w-full object-cover"
              />
            </div>
            <input
              ref={editFileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => handleSelectEditFile(e.target.files?.[0])}
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              leftIcon={<ImagePlus className="h-4 w-4" />}
              onClick={() => editFileInputRef.current?.click()}
            >
              {editFile ? `Foto baru: ${editFile.name}` : 'Ganti foto momen (opsional)'}
            </Button>
          </div>

          <Field
            label="Judul momen"
            required
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Field
              label="Label waktu"
              required
              value={editDateLabel}
              onChange={(e) => setEditDateLabel(e.target.value)}
            />
            <Field
              label="Tahun"
              required
              type="number"
              min={2000}
              max={2100}
              value={editYear}
              onChange={(e) => setEditYear(e.target.value)}
            />
            <Field
              label="Kategori"
              value={editBadge}
              onChange={(e) => setEditBadge(e.target.value)}
            />
          </div>

          <TextareaField
            label="Cerita / keterangan"
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
          />

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setEditingItem(null)}
              disabled={savingEdit}
            >
              Batal
            </Button>
            <Button type="submit" variant="primary" loading={savingEdit} loadingLabel="Menyimpan…">
              Simpan perubahan
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deletingItem)}
        onClose={() => setDeletingItem(null)}
        onConfirm={handleConfirmDelete}
        loading={deleting}
        title="Hapus momen Journey?"
        description={`Momen "${deletingItem?.title || ''}" dan fotonya akan dihapus dari timeline publik.`}
        confirmLabel="Ya, hapus"
      />
    </div>
  );
}
