import { useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, Eye, ImagePlus, Plus, RotateCcw, Save, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { FallbackImportBanner } from '@/components/feedback/FallbackImportBanner';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Field, TextareaField } from '@/components/ui/Field';
import {
  DEFAULT_HOME_CONTENT,
  deleteCultureStorageImage,
  importDefaultHomeContent,
  saveHomeContentSection,
  subscribeHomeContentWithMeta,
  uploadCultureImage,
} from '@/services/cmsService';
import type { HomeContentDoc } from '@/types/models';

const MAX_CULTURE_IMAGE_BYTES = 5 * 1024 * 1024;

export default function ManageHomeContentPage() {
  const [content, setContent] = useState<HomeContentDoc>(DEFAULT_HOME_CONTENT);
  const [docExists, setDocExists] = useState(true);
  const [savingSection, setSavingSection] = useState<string | null>(null);
  const [uploadingCultureId, setUploadingCultureId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    document.title = 'Konten Beranda — HIMASRI IT PLN';
    return subscribeHomeContentWithMeta(({ data, exists }) => {
      setContent(data);
      setDocExists(exists);
    });
  }, []);

  const handleSave = async <K extends keyof HomeContentDoc>(section: K, label: string) => {
    setSavingSection(String(section));
    try {
      await saveHomeContentSection(section, content[section]);
      toast.success(`Bagian ${label} berhasil disimpan`);
    } catch {
      toast.error(`Gagal menyimpan bagian ${label}.`);
    } finally {
      setSavingSection(null);
    }
  };

  const updateCultureItem = (
    idx: number,
    patch: Partial<HomeContentDoc['culture']['items'][number]>,
  ) => {
    setContent((c) => {
      const next = [...c.culture.items];
      next[idx] = { ...next[idx], ...patch };
      return { ...c, culture: { ...c.culture, items: next } };
    });
  };

  const moveCultureItem = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    setContent((c) => {
      if (target < 0 || target >= c.culture.items.length) return c;
      const next = [...c.culture.items];
      const [moved] = next.splice(idx, 1);
      next.splice(target, 0, moved);
      return { ...c, culture: { ...c.culture, items: next } };
    });
  };

  const addCultureItem = () => {
    setContent((c) => ({
      ...c,
      culture: {
        ...c.culture,
        items: [
          ...c.culture.items,
          {
            id: `budaya-${Date.now()}`,
            icon: 'landmark',
            category: 'Warisan',
            title: 'Budaya Baru',
            description: 'Deskripsi singkat warisan budaya Sumatera Selatan.',
            imageUrl: '/assets/images/budaya/songket.webp',
            imageCredit: '',
          },
        ],
      },
    }));
  };

  const removeCultureItem = (idx: number) => {
    setContent((c) => ({
      ...c,
      culture: {
        ...c.culture,
        items: c.culture.items.filter((_, i) => i !== idx),
      },
    }));
  };

  const handleUploadCulturePhoto = async (idx: number, file: File | undefined) => {
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Format foto harus JPG, PNG, atau WebP.');
      return;
    }
    if (file.size > MAX_CULTURE_IMAGE_BYTES) {
      toast.error('Ukuran berkas foto maksimal 5 MB.');
      return;
    }
    const item = content.culture.items[idx];
    if (!item) return;
    setUploadingCultureId(item.id);
    try {
      const oldStoragePath = item.storagePath;
      const uploaded = await uploadCultureImage(item.id, file);
      const nextItems = content.culture.items.map((it, i) =>
        i === idx ? { ...it, imageUrl: uploaded.imageUrl, storagePath: uploaded.storagePath } : it,
      );
      const nextCulture = { ...content.culture, items: nextItems };
      setContent((c) => ({ ...c, culture: nextCulture }));
      await saveHomeContentSection('culture', nextCulture);
      if (oldStoragePath && oldStoragePath !== uploaded.storagePath) {
        await deleteCultureStorageImage(oldStoragePath);
      }
      toast.success(`Foto "${item.title}" diperbarui dan disimpan`);
    } catch {
      toast.error('Gagal mengunggah foto budaya.');
    } finally {
      setUploadingCultureId(null);
    }
  };

  const handleRestoreDefaultCulturePhoto = async (idx: number) => {
    const item = content.culture.items[idx];
    if (!item) return;
    const defaultItem = DEFAULT_HOME_CONTENT.culture.items.find((d) => d.id === item.id);
    const defaultUrl = defaultItem?.imageUrl || `/assets/images/budaya/${item.id}.webp`;
    const defaultCredit = defaultItem?.imageCredit ?? '';
    const oldStoragePath = item.storagePath;

    setUploadingCultureId(item.id);
    try {
      const nextItems = content.culture.items.map((it, i) => {
        if (i !== idx) return it;
        const restored = { ...it, imageUrl: defaultUrl, imageCredit: defaultCredit };
        delete restored.storagePath;
        return restored;
      });
      const nextCulture = { ...content.culture, items: nextItems };
      setContent((c) => ({ ...c, culture: nextCulture }));
      await saveHomeContentSection('culture', nextCulture);
      if (oldStoragePath) {
        await deleteCultureStorageImage(oldStoragePath);
      }
      toast.success(`Foto "${item.title}" dikembalikan ke foto bawaan`);
    } catch {
      toast.error('Gagal mengembalikan foto bawaan.');
    } finally {
      setUploadingCultureId(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Konten Beranda"
        description="Ubah teks beranda publik per bagian tanpa mengubah kode. Perubahan langsung tampil di situs publik."
        actions={
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Eye className="h-4 w-4" />}
            onClick={() => setShowPreview((p) => !p)}
          >
            {showPreview ? 'Tutup pratinjau' : 'Pratinjau ringkas'}
          </Button>
        }
      />

      {!docExists && (
        <FallbackImportBanner
          subject="konten beranda"
          onImport={async () => {
            try {
              await importDefaultHomeContent();
              toast.success('Konten bawaan berhasil disimpan. Sekarang bisa diedit di halaman ini.');
            } catch {
              toast.error('Gagal mengimpor konten beranda bawaan.');
            }
          }}
        />
      )}

      {showPreview && (
        <section className="rounded-lg bg-maroon-950 text-cream-50 p-6 space-y-3 border border-cream-200">
          <p className="type-caption font-semibold uppercase tracking-wider text-gold-300">
            Pratinjau Hero & Tentang
          </p>
          <h2 className="text-2xl font-bold">{content.hero.title}</h2>
          <p className="type-small text-cream-100/85 max-w-2xl">{content.hero.subtitle}</p>
          <div className="pt-2 border-t border-white/15 type-label text-cream-100/80">
            <strong>{content.about.statement}</strong> — {content.about.leftLead}
          </div>
        </section>
      )}

      {/* 1. Hero */}
      <section className="rounded-lg bg-white border border-cream-200 p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="type-app-h2 text-ink-900">1. Bagian Hero</h2>
            <p className="type-label text-ink-600">Judul utama, subjudul, dan teks tombol CTA di bagian atas beranda.</p>
          </div>
          <Button
            variant="primary"
            size="sm"
            loading={savingSection === 'hero'}
            leftIcon={<Save className="h-4 w-4" />}
            onClick={() => void handleSave('hero', 'Hero')}
          >
            Simpan Hero
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field
            label="Judul utama"
            value={content.hero.title}
            onChange={(e) =>
              setContent((c) => ({ ...c, hero: { ...c.hero, title: e.target.value } }))
            }
          />
          <Field
            label="Badge singkat (mobile)"
            value={content.hero.badgeMobile}
            onChange={(e) =>
              setContent((c) => ({ ...c, hero: { ...c.hero, badgeMobile: e.target.value } }))
            }
          />
        </div>
        <TextareaField
          label="Subjudul"
          value={content.hero.subtitle}
          onChange={(e) =>
            setContent((c) => ({ ...c, hero: { ...c.hero, subtitle: e.target.value } }))
          }
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field
            label="Tombol utama"
            value={content.hero.ctaPrimary}
            onChange={(e) =>
              setContent((c) => ({ ...c, hero: { ...c.hero, ctaPrimary: e.target.value } }))
            }
          />
          <Field
            label="Tombol sekunder"
            value={content.hero.ctaSecondary}
            onChange={(e) =>
              setContent((c) => ({ ...c, hero: { ...c.hero, ctaSecondary: e.target.value } }))
            }
          />
        </div>
      </section>

      {/* 2. Tentang */}
      <section className="rounded-lg bg-white border border-cream-200 p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="type-app-h2 text-ink-900">2. Bagian Tentang HIMASRI</h2>
            <p className="type-label text-ink-600">Semboyan, pengantar singkat, paragraf profil, dan 3 pilar.</p>
          </div>
          <Button
            variant="primary"
            size="sm"
            loading={savingSection === 'about'}
            leftIcon={<Save className="h-4 w-4" />}
            onClick={() => void handleSave('about', 'Tentang')}
          >
            Simpan Tentang
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field
            label="Label bagian"
            value={content.about.title}
            onChange={(e) =>
              setContent((c) => ({ ...c, about: { ...c.about, title: e.target.value } }))
            }
          />
          <Field
            label="Judul / Semboyan"
            value={content.about.statement}
            onChange={(e) =>
              setContent((c) => ({ ...c, about: { ...c.about, statement: e.target.value } }))
            }
          />
        </div>
        <TextareaField
          label="Pengantar singkat"
          value={content.about.leftLead}
          onChange={(e) =>
            setContent((c) => ({ ...c, about: { ...c.about, leftLead: e.target.value } }))
          }
        />
        <TextareaField
          label="Paragraf profil"
          value={content.about.paragraph}
          onChange={(e) =>
            setContent((c) => ({ ...c, about: { ...c.about, paragraph: e.target.value } }))
          }
        />
      </section>

      {/* 3. Budaya Palembang (Judul + Daftar Panel & Unggah Foto) */}
      <section className="rounded-lg bg-white border border-cream-200 p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="type-app-h2 text-ink-900">3. Bagian Budaya Palembang</h2>
            <p className="type-label text-ink-600">
              Judul, deskripsi, foto tiap warisan budaya (otomatis dikompres WebP), kredit foto, dan urutannya.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={addCultureItem}
            >
              Tambah budaya
            </Button>
            <Button
              variant="primary"
              size="sm"
              loading={savingSection === 'culture'}
              leftIcon={<Save className="h-4 w-4" />}
              onClick={() => void handleSave('culture', 'Budaya')}
            >
              Simpan Budaya
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field
            label="Judul bagian"
            value={content.culture.title}
            onChange={(e) =>
              setContent((c) => ({ ...c, culture: { ...c.culture, title: e.target.value } }))
            }
          />
          <Field
            label="Deskripsi singkat"
            value={content.culture.description}
            onChange={(e) =>
              setContent((c) => ({ ...c, culture: { ...c.culture, description: e.target.value } }))
            }
          />
        </div>

        <div className="space-y-4 pt-2 border-t border-cream-200">
          {content.culture.items.map((item, idx) => (
            <div
              key={item.id}
              className="rounded-lg border border-cream-200 bg-cream-50/50 p-4 grid grid-cols-1 lg:grid-cols-12 gap-4 items-start"
            >
              <div className="lg:col-span-4 space-y-2.5">
                <div className="relative aspect-[16/10] w-full overflow-hidden rounded-md bg-maroon-950 border border-cream-200">
                  <img
                    src={item.imageUrl || `/assets/images/budaya/${item.id}.webp`}
                    alt={item.title}
                    className="h-full w-full object-cover"
                  />
                </div>
                <label className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-cream-300 bg-white px-3 py-2 type-label font-semibold text-ink-900 hover:bg-cream-100 cursor-pointer">
                  <ImagePlus className="h-4 w-4 text-maroon-700" aria-hidden="true" />
                  <span>
                    {uploadingCultureId === item.id ? 'Mengunggah WebP…' : 'Ganti foto (WebP)'}
                  </span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    disabled={uploadingCultureId === item.id}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      e.currentTarget.value = '';
                      void handleUploadCulturePhoto(idx, file);
                    }}
                    className="sr-only"
                  />
                </label>
                {(() => {
                  const def = DEFAULT_HOME_CONTENT.culture.items.find((d) => d.id === item.id);
                  const hasCustomPhoto = Boolean(
                    item.storagePath || (def?.imageUrl && item.imageUrl && item.imageUrl !== def.imageUrl),
                  );
                  if (!def || !hasCustomPhoto) return null;
                  return (
                    <Button
                      variant="ghost"
                      size="sm"
                      fullWidth
                      disabled={uploadingCultureId === item.id}
                      leftIcon={<RotateCcw className="h-3.5 w-3.5" />}
                      onClick={() => void handleRestoreDefaultCulturePhoto(idx)}
                    >
                      Kembalikan foto bawaan
                    </Button>
                  );
                })()}
              </div>

              <div className="lg:col-span-8 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="type-caption font-bold uppercase tracking-wider text-maroon-700 tabular-nums">
                    Panel #{String(idx + 1).padStart(2, '0')}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={idx === 0}
                      aria-label={`Naikkan ${item.title}`}
                      onClick={() => moveCultureItem(idx, -1)}
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={idx === content.culture.items.length - 1}
                      aria-label={`Turunkan ${item.title}`}
                      onClick={() => moveCultureItem(idx, 1)}
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      disabled={content.culture.items.length <= 1}
                      aria-label={`Hapus ${item.title}`}
                      onClick={() => removeCultureItem(idx)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field
                    label="Kategori"
                    value={item.category}
                    onChange={(e) => updateCultureItem(idx, { category: e.target.value })}
                  />
                  <Field
                    label="Judul budaya"
                    value={item.title}
                    onChange={(e) => updateCultureItem(idx, { title: e.target.value })}
                  />
                </div>

                <TextareaField
                  label="Deskripsi"
                  rows={2}
                  value={item.description}
                  onChange={(e) => updateCultureItem(idx, { description: e.target.value })}
                />

                <Field
                  label="Kredit / atribusi foto (opsional)"
                  placeholder="Contoh: Foto: Nama Penulis / CC BY-SA 4.0"
                  value={item.imageCredit || ''}
                  onChange={(e) => updateCultureItem(idx, { imageCredit: e.target.value })}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. BPH, Kontak & Pita CTA */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <section className="rounded-lg bg-white border border-cream-200 p-5 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <h2 className="type-body font-semibold text-ink-900">4. Pengantar BPH</h2>
            <Field
              label="Judul"
              value={content.bph.title}
              onChange={(e) =>
                setContent((c) => ({ ...c, bph: { ...c.bph, title: e.target.value } }))
              }
            />
            <TextareaField
              label="Deskripsi"
              value={content.bph.description}
              onChange={(e) =>
                setContent((c) => ({ ...c, bph: { ...c.bph, description: e.target.value } }))
              }
            />
            <TextareaField
              label="Pesan akses anggota"
              value={content.bph.lockNotice}
              onChange={(e) =>
                setContent((c) => ({ ...c, bph: { ...c.bph, lockNotice: e.target.value } }))
              }
            />
          </div>
          <Button
            variant="primary"
            size="sm"
            loading={savingSection === 'bph'}
            leftIcon={<Save className="h-4 w-4" />}
            onClick={() => void handleSave('bph', 'BPH')}
          >
            Simpan BPH
          </Button>
        </section>

        <section className="rounded-lg bg-white border border-cream-200 p-5 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <h2 className="type-body font-semibold text-ink-900">5. Kontak Publik</h2>
            <Field
              label="Judul"
              value={content.contact.title}
              onChange={(e) =>
                setContent((c) => ({ ...c, contact: { ...c.contact, title: e.target.value } }))
              }
            />
            <TextareaField
              label="Deskripsi"
              value={content.contact.description}
              onChange={(e) =>
                setContent((c) => ({
                  ...c,
                  contact: { ...c.contact, description: e.target.value },
                }))
              }
            />
            <Field
              label="Pesan bawaan WhatsApp"
              value={content.contact.defaultWhatsappMessage}
              onChange={(e) =>
                setContent((c) => ({
                  ...c,
                  contact: { ...c.contact, defaultWhatsappMessage: e.target.value },
                }))
              }
            />
          </div>
          <Button
            variant="primary"
            size="sm"
            loading={savingSection === 'contact'}
            leftIcon={<Save className="h-4 w-4" />}
            onClick={() => void handleSave('contact', 'Kontak')}
          >
            Simpan Kontak
          </Button>
        </section>

        <section className="rounded-lg bg-white border border-cream-200 p-5 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <h2 className="type-body font-semibold text-ink-900">6. Pita CTA Bawah</h2>
            <Field
              label="Judul CTA"
              value={content.ctaBand.title}
              onChange={(e) =>
                setContent((c) => ({ ...c, ctaBand: { ...c.ctaBand, title: e.target.value } }))
              }
            />
            <TextareaField
              label="Deskripsi CTA"
              value={content.ctaBand.description}
              onChange={(e) =>
                setContent((c) => ({
                  ...c,
                  ctaBand: { ...c.ctaBand, description: e.target.value },
                }))
              }
            />
          </div>
          <Button
            variant="primary"
            size="sm"
            loading={savingSection === 'ctaBand'}
            leftIcon={<Save className="h-4 w-4" />}
            onClick={() => void handleSave('ctaBand', 'Pita CTA')}
          >
            Simpan Pita CTA
          </Button>
        </section>
      </div>
    </div>
  );
}
