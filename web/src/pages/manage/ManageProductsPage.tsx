import { useEffect, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ConfirmDialog, Modal } from '@/components/feedback/Modal';
import { SimulationNote } from '@/components/feedback/SimulationNote';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { ChipFilter } from '@/components/ui/ChipFilter';
import { Choice } from '@/components/ui/Choice';
import { Field, SelectField, TextareaField } from '@/components/ui/Field';
import { ProductCard } from '@/components/ui/ProductCard';
import { StatStrip, StatTile } from '@/components/ui/StatTile';
import { useAuth } from '@/contexts/AuthContext';
import {
  compressImageToWebp,
  deleteProductDoc,
  saveEventDoc,
  saveProductDoc,
  subscribeAllProducts,
  subscribeEvents,
  subscribeProductClickCounts,
  uploadBlobWithProgress,
} from '@/services/memberService';
import type { EventDoc, ProductDoc } from '@/types/models';
import { isValidWhatsapp, normalizeWhatsapp } from '@/utils/format';
import { Package } from 'lucide-react';

const MAX_PRODUCT_IMG_BYTES = 3 * 1024 * 1024;

export default function ManageProductsPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState<EventDoc[]>([]);
  const [products, setProducts] = useState<ProductDoc[]>([]);
  const [totalClicks, setTotalClicks] = useState(0);
  const [selectedEventFilter, setSelectedEventFilter] = useState<string>('ALL');

  // Product Form
  const [editingProduct, setEditingProduct] = useState<ProductDoc | null>(null);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [eventId, setEventId] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'published' | 'draft'>('published');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [savingProduct, setSavingProduct] = useState(false);

  // Delete Confirm
  const [deletingProduct, setDeletingProduct] = useState<ProductDoc | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Event Dialog
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventDoc | null>(null);
  const [evName, setEvName] = useState('');
  const [evWhatsapp, setEvWhatsapp] = useState('');
  const [savingEvent, setSavingEvent] = useState(false);

  useEffect(() => {
    document.title = 'Kelola Produk — HIMASRI IT PLN';
    const u1 = subscribeEvents(setEvents);
    const u2 = subscribeAllProducts(setProducts);
    const u3 = subscribeProductClickCounts((_counts, total) => setTotalClicks(total));
    return () => {
      u1();
      u2();
      u3();
    };
  }, []);

  useEffect(() => {
    if (!eventId && events.length > 0) {
      setEventId(events[0].id);
    }
  }, [events, eventId]);

  const filteredProducts = useMemo(() => {
    if (selectedEventFilter === 'ALL') return products;
    return products.filter((p) => p.eventId === selectedEventFilter);
  }, [products, selectedEventFilter]);

  const activeProductsCount = useMemo(
    () => products.filter((p) => p.status === 'published').length,
    [products],
  );
  const totalStock = useMemo(
    () => products.reduce((sum, p) => sum + (p.stock || 0), 0),
    [products],
  );
  const hasSample = useMemo(
    () => products.some((p) => p.isSample) || events.some((e) => e.isSample),
    [products, events],
  );

  const resetForm = () => {
    setEditingProduct(null);
    setName('');
    setPrice('');
    setStock('');
    setEventId(events[0]?.id || '');
    setDescription('');
    setStatus('published');
    setImageFile(null);
  };

  const handleEditProduct = (prod: ProductDoc) => {
    setEditingProduct(prod);
    setName(prod.name);
    setPrice(String(prod.price));
    setStock(String(prod.stock));
    setEventId(prod.eventId);
    setDescription(prod.description || '');
    setStatus(prod.status);
    setImageFile(null);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const numericPrice = Number(price);
    const numericStock = Number(stock);
    if (name.trim().length < 2) {
      toast.error('Nama produk minimal 2 karakter.');
      return;
    }
    if (!Number.isFinite(numericPrice) || numericPrice < 0) {
      toast.error('Harga produk harus angka ≥ 0.');
      return;
    }
    if (!Number.isFinite(numericStock) || numericStock < 0) {
      toast.error('Stok produk harus angka ≥ 0.');
      return;
    }
    if (!eventId) {
      toast.error('Pilih event untuk produk ini.');
      return;
    }
    if (imageFile && imageFile.size > MAX_PRODUCT_IMG_BYTES) {
      toast.error('Ukuran foto produk maksimal 3 MB.');
      return;
    }

    const chosenEvent = events.find((ev) => ev.id === eventId);
    const targetId = editingProduct?.id || `prod-${Date.now()}`;
    let imageUrl = editingProduct?.imageUrl || '/assets/images/products/kaos-songket.webp';
    let storagePath = editingProduct?.storagePath || '';

    setSavingProduct(true);
    try {
      if (imageFile) {
        const compressed = await compressImageToWebp(imageFile, {
          maxWidth: 960,
          aspectRatio: 4 / 3,
          quality: 0.85,
        });
        storagePath = `products/${targetId}.webp`;
        imageUrl = await uploadBlobWithProgress(storagePath, compressed.blob, 'image/webp');
      }

      await saveProductDoc(
        targetId,
        {
          eventId,
          eventName: chosenEvent?.name || 'Event HIMASRI',
          name: name.trim(),
          price: numericPrice,
          stock: numericStock,
          imageUrl,
          storagePath,
          description: description.trim(),
          status,
          createdBy: editingProduct?.createdBy || user.uid,
        },
        !editingProduct,
      );

      toast.success(editingProduct ? 'Produk diperbarui' : 'Produk ditambahkan');
      resetForm();
    } catch (err) {
      console.error(err);
      toast.error('Gagal menyimpan produk.');
    } finally {
      setSavingProduct(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingProduct) return;
    setDeleting(true);
    try {
      await deleteProductDoc(deletingProduct.id);
      toast.success('Produk dihapus');
      if (editingProduct?.id === deletingProduct.id) {
        resetForm();
      }
      setDeletingProduct(null);
    } catch {
      toast.error('Gagal menghapus produk.');
    } finally {
      setDeleting(false);
    }
  };

  const openEventDialog = (ev?: EventDoc) => {
    setEditingEvent(ev ?? null);
    setEvName(ev?.name || '');
    setEvWhatsapp(ev?.contactWhatsapp || '');
    setEventModalOpen(true);
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (evName.trim().length < 2) {
      toast.error('Nama event minimal 2 karakter.');
      return;
    }
    if (!isValidWhatsapp(evWhatsapp)) {
      toast.error('Nomor WhatsApp panitia tidak valid.');
      return;
    }

    setSavingEvent(true);
    try {
      await saveEventDoc(editingEvent?.id || null, {
        name: evName.trim(),
        contactWhatsapp: normalizeWhatsapp(evWhatsapp),
        active: true,
        order: editingEvent?.order ?? events.length + 1,
      });
      toast.success(editingEvent ? 'Event diperbarui' : 'Event baru ditambahkan');
      setEventModalOpen(false);
    } catch {
      toast.error('Gagal menyimpan event.');
    } finally {
      setSavingEvent(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        tone="maroon"
        label="Kewirausahaan & Event"
        title="Produk Event"
        description="Kelola katalog merchandise kegiatan dan nomor narahubung WhatsApp panitia."
      />

      <StatStrip cols={3}>
        <StatTile label="Produk Aktif" value={activeProductsCount} variant="maroon" />
        <StatTile label="Total Stok" value={totalStock} variant="gold" />
        <StatTile label="Klik Pesan" value={totalClicks} variant="cream" />
      </StatStrip>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <ChipFilter
            layoutId="manage-prod-chip"
            value={selectedEventFilter}
            onChange={setSelectedEventFilter}
            options={[
              { value: 'ALL', label: 'Semua Event', count: products.length },
              ...events.map((ev) => ({
                value: ev.id,
                label: ev.name,
                count: products.filter((p) => p.eventId === ev.id).length,
              })),
            ]}
          />
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => openEventDialog()}
          >
            Event
          </Button>
          {selectedEventFilter !== 'ALL' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const ev = events.find((item) => item.id === selectedEventFilter);
                if (ev) openEventDialog(ev);
              }}
            >
              Ubah kontak event
            </Button>
          )}
        </div>
        {hasSample && <SimulationNote />}
      </div>

      {/* Main Split: Products Grid Left, Form Right */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        <div className="xl:col-span-8">
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  mode="manage"
                  onEdit={handleEditProduct}
                  onDelete={setDeletingProduct}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<Package className="h-6 w-6" />}
              title="Belum ada produk"
              description="Tambahkan produk merchandise pertama menggunakan formulir di sebelah kanan."
            />
          )}
        </div>

        <form
          onSubmit={handleSaveProduct}
          className="xl:col-span-4 rounded-lg bg-white border border-cream-200 p-5 space-y-4 sticky top-20"
        >
          <div className="flex items-center justify-between">
            <h2 className="type-app-h2 text-ink-900">
              {editingProduct ? 'Ubah Produk' : 'Tambah Produk'}
            </h2>
            {editingProduct && (
              <Button variant="ghost" size="sm" onClick={resetForm}>
                Batal ubah
              </Button>
            )}
          </div>

          <Field
            label="Nama produk"
            required
            placeholder="Contoh: Kaos HIMASRI Songket"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Harga (Rp)"
              required
              type="number"
              min="0"
              placeholder="95000"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
            <Field
              label="Stok"
              required
              type="number"
              min="0"
              placeholder="40"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
            />
          </div>

          <SelectField
            label="Event"
            required
            value={eventId}
            onChange={(e) => setEventId(e.target.value)}
          >
            <option value="">Pilih event…</option>
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.name}
              </option>
            ))}
          </SelectField>

          <div className="space-y-1.5">
            <label
              htmlFor="product-photo-input"
              className="block type-small font-semibold text-ink-900"
            >
              Foto produk (4:3 · otomatis kompres WebP · maks. 3 MB)
            </label>
            <label
              htmlFor="product-photo-input"
              className="flex min-h-[44px] cursor-pointer items-center justify-between gap-3 rounded-md border border-dashed border-cream-300 bg-cream-50/70 px-3.5 py-2.5 type-label text-ink-600 hover:bg-cream-100/70 transition-colors"
            >
              <span className="truncate font-medium text-ink-900">
                {imageFile
                  ? imageFile.name
                  : editingProduct?.imageUrl
                    ? 'Ganti foto produk (opsional)'
                    : 'Pilih foto JPG, PNG, atau WebP…'}
              </span>
              <span className="shrink-0 rounded-md border border-cream-300 bg-white px-2.5 py-1 type-caption font-semibold text-ink-900">
                Pilih berkas
              </span>
              <input
                id="product-photo-input"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
                className="sr-only"
              />
            </label>
          </div>

          <TextareaField
            label="Deskripsi"
            placeholder="Bahan, ukuran, atau detail pemesanan…"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <div className="space-y-2">
            <p className="type-small font-semibold text-ink-900">Status</p>
            <div className="grid grid-cols-2 gap-2.5">
              <Choice
                name="productStatus"
                value="published"
                checked={status === 'published'}
                onChange={() => setStatus('published')}
                label="Tampilkan"
              />
              <Choice
                name="productStatus"
                value="draft"
                checked={status === 'draft'}
                onChange={() => setStatus('draft')}
                label="Draf"
              />
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            fullWidth
            loading={savingProduct}
            loadingLabel="Menyimpan…"
          >
            Simpan produk
          </Button>
        </form>
      </div>

      {/* Modal Tambah / Ubah Event */}
      <Modal
        open={eventModalOpen}
        onClose={() => setEventModalOpen(false)}
        title={editingEvent ? 'Ubah Event' : 'Tambah Event Baru'}
      >
        <form onSubmit={handleSaveEvent} className="space-y-4">
          <Field
            label="Nama event"
            required
            placeholder="Contoh: HUT HIMASRI 2026"
            value={evName}
            onChange={(e) => setEvName(e.target.value)}
          />
          <Field
            label="Nomor WhatsApp panitia"
            required
            placeholder="Contoh: 081234567803"
            value={evWhatsapp}
            onChange={(e) => setEvWhatsapp(e.target.value)}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setEventModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" variant="primary" loading={savingEvent} loadingLabel="Menyimpan…">
              Simpan event
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deletingProduct)}
        onClose={() => setDeletingProduct(null)}
        onConfirm={handleConfirmDelete}
        loading={deleting}
        title="Hapus produk ini?"
        description={`Produk "${deletingProduct?.name || ''}" akan dihapus dari toko HIMASRI.`}
        confirmLabel="Hapus produk"
      />
    </div>
  );
}
