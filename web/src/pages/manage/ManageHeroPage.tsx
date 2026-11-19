import { useEffect, useRef, useState } from 'react';
import { GripVertical, ImagePlus, Plus, Trash2 } from 'lucide-react';
import { Reorder } from 'motion/react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/feedback/Modal';
import { EmptyState } from '@/components/feedback/EmptyState';
import { FallbackImportBanner } from '@/components/feedback/FallbackImportBanner';
import { HeroSlider } from '@/components/layout/HeroSlider';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Field, SelectField } from '@/components/ui/Field';
import { ToggleSwitch } from '@/components/ui/ToggleSwitch';
import { useAuth } from '@/contexts/AuthContext';
import { importDefaultHeroSlides } from '@/services/cmsService';
import {
  compressImageToWebp,
  createHeroSlideDoc,
  deleteHeroSlideDoc,
  reorderHeroSlides,
  saveHeroSettings,
  subscribeAllHeroSlides,
  updateHeroSlideDoc,
  uploadBlobWithProgress,
} from '@/services/memberService';
import { DEFAULT_HERO_SETTINGS, subscribeHeroSettings } from '@/services/publicService';
import type { HeroSettings, HeroSlide } from '@/types/models';

const MAX_HERO_BYTES = 5 * 1024 * 1024;

export default function ManageHeroPage() {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [settings, setSettings] = useState<HeroSettings>(DEFAULT_HERO_SETTINGS);
  const [savingSettings, setSavingSettings] = useState(false);

  const [uploadCaption, setUploadCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [deletingSlide, setDeletingSlide] = useState<HeroSlide | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    document.title = 'Kelola Foto Beranda — HIMASRI IT PLN';
    const unsubSlides = subscribeAllHeroSlides(setSlides);
    const unsubSettings = subscribeHeroSettings(setSettings);
    return () => {
      unsubSlides();
      unsubSettings();
    };
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      await saveHeroSettings(settings);
      toast.success('Pengaturan slideshow disimpan');
    } catch {
      toast.error('Gagal menyimpan pengaturan slideshow.');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleFileSelected = async (file: File | undefined) => {
    if (!file || !user) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Format foto harus JPG, PNG, atau WebP.');
      return;
    }
    if (file.size > MAX_HERO_BYTES) {
      toast.error('Ukuran berkas foto maksimal 5 MB.');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    try {
      const compressed = await compressImageToWebp(file, { maxWidth: 1920, quality: 0.85 });
      if (compressed.originalWidth < 1920) {
        toast.info(
          `Foto berlebar ${compressed.originalWidth}px (disarankan min. 1920px untuk tampilan penuh).`,
        );
      }

      const slideId = `slide-${Date.now()}`;
      const storagePath = `hero/${slideId}.webp`;
      const imageUrl = await uploadBlobWithProgress(
        storagePath,
        compressed.blob,
        'image/webp',
        setUploadProgress,
      );

      const nextOrder =
        slides.length > 0 ? Math.max(...slides.map((s) => s.order)) + 1 : 1;

      await createHeroSlideDoc(slideId, {
        imageUrl,
        storagePath,
        caption: uploadCaption.trim() || file.name.replace(/\.[^.]+$/, ''),
        order: nextOrder,
        active: true,
        width: compressed.width,
        height: compressed.height,
        focalY: 50,
        uploadedBy: user.uid,
      });

      setUploadCaption('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      toast.success('Foto hero berhasil ditambahkan');
    } catch (err) {
      console.error(err);
      toast.error('Gagal mengunggah foto hero.');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleReorder = (nextOrderSlides: HeroSlide[]) => {
    const updated = nextOrderSlides.map((s, idx) => ({ ...s, order: idx + 1 }));
    setSlides(updated);
    void reorderHeroSlides(updated).catch(() => {
      toast.error('Gagal menyimpan urutan foto.');
    });
  };

  const handleToggleActive = async (slide: HeroSlide, active: boolean) => {
    try {
      await updateHeroSlideDoc(slide.id, { active });
      toast.success(active ? 'Foto diaktifkan' : 'Foto dinonaktifkan');
    } catch {
      toast.error('Gagal memperbarui status foto.');
    }
  };

  const handleUpdateCaption = async (slideId: string, caption: string) => {
    try {
      await updateHeroSlideDoc(slideId, { caption: caption.trim() || 'Kegiatan HIMASRI' });
      toast.success('Caption disimpan');
    } catch {
      toast.error('Gagal menyimpan caption.');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingSlide) return;
    setDeleting(true);
    try {
      await deleteHeroSlideDoc(deletingSlide.id);
      toast.success('Foto hero dihapus');
      setDeletingSlide(null);
    } catch {
      toast.error('Gagal menghapus foto hero.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        tone="maroon"
        label="Publikasi Beranda"
        title="Foto Beranda"
        description="Atur foto kegiatan yang tampil di hero beranda publik, urutan slide, dan efek transisi."
        actions={
          <Button
            variant="primary"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => fileInputRef.current?.click()}
          >
            Tambah foto
          </Button>
        }
      />

      {slides.length === 0 && (
        <FallbackImportBanner
          subject="foto hero beranda"
          onImport={async () => {
            try {
              const count = await importDefaultHeroSlides();
              toast.success(`${count} foto hero bawaan berhasil diimpor`);
            } catch {
              toast.error('Gagal mengimpor foto hero bawaan.');
            }
          }}
        />
      )}

      {/* Preview & Settings Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 space-y-2">
          <p className="type-label leading-5 font-medium text-ink-600">Pratinjau</p>
          <HeroSlider slides={slides} settings={settings} compact />
        </div>

        <form
          onSubmit={handleSaveSettings}
          className="lg:col-span-5 rounded-lg bg-white border border-cream-200 p-5 space-y-5"
        >
          <div>
            <h2 className="type-app-h2 text-ink-900">Durasi & Transisi</h2>
            <p className="mt-0.5 type-label text-ink-600">
              Pengaturan slideshow beranda publik.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SelectField
              label="Durasi per foto"
              value={String(settings.durationSec)}
              onChange={(e) =>
                setSettings((s) => ({
                  ...s,
                  durationSec: Number(e.target.value) as 4 | 5 | 7,
                }))
              }
            >
              <option value="4">4 detik</option>
              <option value="5">5 detik</option>
              <option value="7">7 detik</option>
            </SelectField>

            <SelectField
              label="Efek transisi"
              value={settings.transition}
              onChange={(e) =>
                setSettings((s) => ({
                  ...s,
                  transition: e.target.value as 'fade' | 'slide',
                }))
              }
            >
              <option value="fade">Pudar</option>
              <option value="slide">Geser</option>
            </SelectField>
          </div>

          <ToggleSwitch
            checked={settings.autoplay}
            onChange={(autoplay) => setSettings((s) => ({ ...s, autoplay }))}
            label="Geser otomatis"
            description="Jeda otomatis saat hover, fokus keyboard, atau tab tersembunyi"
          />

          <ToggleSwitch
            checked={settings.respectReducedMotion}
            onChange={(respectReducedMotion) =>
              setSettings((s) => ({ ...s, respectReducedMotion }))
            }
            label='Hormati "kurangi gerakan"'
            description="Matikan auto-geser saat perangkat meminta reduced motion"
          />

          <Button
            type="submit"
            variant="primary"
            fullWidth
            loading={savingSettings}
            loadingLabel="Menyimpan…"
          >
            Simpan pengaturan
          </Button>
        </form>
      </div>

      {/* Upload Dropzone */}
      <section className="rounded-lg bg-white border border-dashed border-cream-300 p-5 space-y-4">
        <div className="space-y-1">
          <h2 className="type-app-body font-semibold text-ink-900">Tambah foto kegiatan</h2>
          <p className="type-label text-ink-600">
            Format JPG, PNG, atau WebP (maks. 5 MB, disarankan lebar ≥ 1920px). Otomatis
            dikompresi ke WebP di browser sebelum dikirim.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          <div className="md:col-span-7">
            <Field
              label="Caption foto baru (teks alt & keterangan slide)"
              placeholder="Contoh: Makrab HIMASRI Angkatan 2025"
              value={uploadCaption}
              onChange={(e) => setUploadCaption(e.target.value)}
            />
          </div>
          <div className="md:col-span-5">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => void handleFileSelected(e.target.files?.[0])}
              className="sr-only"
              id="hero-upload-input"
            />
            <Button
              variant="secondary"
              fullWidth
              loading={uploading}
              loadingLabel={`Mengunggah ${uploadProgress}%…`}
              leftIcon={<ImagePlus className="h-4 w-4" />}
              onClick={() => fileInputRef.current?.click()}
            >
              Pilih & unggah foto
            </Button>
          </div>
        </div>

        {uploading && (
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-cream-200">
            <div
              className="h-full origin-left bg-maroon-700 transition-transform duration-150"
              style={{ transform: `scaleX(${uploadProgress / 100})` }}
            />
          </div>
        )}
      </section>

      {/* Reorderable Slide List */}
      <section className="space-y-4">
        <div>
          <h2 className="type-app-h2 text-ink-900">Daftar Foto ({slides.length})</h2>
          <p className="type-label text-ink-600">
            Seret ikon pegangan di kiri untuk mengubah urutan tampil di beranda.
          </p>
        </div>

        {slides.length > 0 ? (
          <Reorder.Group
            axis="y"
            values={slides}
            onReorder={handleReorder}
            className="space-y-2.5"
          >
            {slides.map((slide, index) => (
              <SlideManageRow
                key={slide.id}
                slide={slide}
                index={index}
                onToggleActive={handleToggleActive}
                onUpdateCaption={handleUpdateCaption}
                onDelete={() => setDeletingSlide(slide)}
              />
            ))}
          </Reorder.Group>
        ) : (
          <EmptyState
            icon={<ImagePlus className="h-6 w-6" />}
            title="Belum ada foto hero tersimpan"
            description="Beranda menggunakan foto default sampai Anda mengunggah slide baru di sini."
          />
        )}
      </section>

      <ConfirmDialog
        open={Boolean(deletingSlide)}
        onClose={() => setDeletingSlide(null)}
        onConfirm={handleConfirmDelete}
        loading={deleting}
        title="Hapus foto hero ini?"
        description={`Foto "${deletingSlide?.caption || ''}" akan dihapus dari slideshow beranda.`}
        confirmLabel="Hapus foto"
      />
    </div>
  );
}

function SlideManageRow({
  slide,
  index,
  onToggleActive,
  onUpdateCaption,
  onDelete,
}: {
  slide: HeroSlide;
  index: number;
  onToggleActive: (slide: HeroSlide, active: boolean) => Promise<void>;
  onUpdateCaption: (slideId: string, caption: string) => Promise<void>;
  onDelete: () => void;
}) {
  const [captionDraft, setCaptionDraft] = useState(slide.caption);

  useEffect(() => {
    setCaptionDraft(slide.caption);
  }, [slide.caption]);

  return (
    <Reorder.Item
      value={slide}
      whileDrag={{ scale: 1.01, boxShadow: 'var(--shadow-drag)' }}
      className="rounded-lg bg-white border border-cream-200 p-3 flex flex-col lg:flex-row lg:items-center gap-3"
    >
      <div className="flex items-center gap-3 shrink-0">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-md bg-cream-100 text-ink-600 cursor-grab active:cursor-grabbing"
          aria-label="Seret untuk mengurutkan"
        >
          <GripVertical className="h-4 w-4" />
        </div>
        <span className="type-small font-semibold text-ink-600 tabular-nums w-6 text-center">
          {index + 1}
        </span>
        <img
          src={slide.imageUrl}
          alt={slide.caption}
          loading="lazy"
          className="h-10 w-16 rounded object-cover bg-cream-100 shrink-0"
        />
      </div>

      <div className="flex-1 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
        <div className="sm:col-span-8">
          <input
            type="text"
            aria-label={`Caption slide ${index + 1}`}
            value={captionDraft}
            onChange={(e) => setCaptionDraft(e.target.value)}
            onBlur={() => {
              if (captionDraft.trim() !== slide.caption) {
                void onUpdateCaption(slide.id, captionDraft);
              }
            }}
            className="min-h-[40px] w-full rounded-md border border-cream-300 bg-white px-3 py-1.5 type-small text-ink-900 focus:border-maroon-700 focus:outline-none focus:ring-[3px] focus:ring-maroon-700/15"
          />
          <p className="mt-0.5 type-caption text-ink-600 tabular-nums">
            Resolusi {slide.width}×{slide.height}px
          </p>
        </div>

        <div className="sm:col-span-4 flex items-center justify-between lg:justify-end gap-3">
          <Badge variant={slide.active ? 'success' : 'neutral'}>
            {slide.active ? 'Aktif' : 'Nonaktif'}
          </Badge>
          <ToggleSwitch
            checked={slide.active}
            onChange={(next) => void onToggleActive(slide, next)}
            label=""
          />
          <Button
            variant="danger"
            size="sm"
            aria-label={`Hapus slide ${slide.caption}`}
            onClick={onDelete}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Reorder.Item>
  );
}
