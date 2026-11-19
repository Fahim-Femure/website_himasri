import { useEffect, useMemo, useState } from 'react';
import { ShoppingBag } from 'lucide-react';
import { EmptyState } from '@/components/feedback/EmptyState';
import { SimulationNote } from '@/components/feedback/SimulationNote';
import { CardSkeleton } from '@/components/feedback/Skeleton';
import { PageHeader } from '@/components/layout/PageHeader';
import { ChipFilter } from '@/components/ui/ChipFilter';
import { ProductCard } from '@/components/ui/ProductCard';
import { useAuth } from '@/contexts/AuthContext';
import {
  recordProductClick,
  subscribeEvents,
  subscribePublishedProducts,
} from '@/services/memberService';
import type { EventDoc, ProductDoc } from '@/types/models';
import { buildWhatsappUrl } from '@/utils/whatsapp';

export default function StorePage() {
  const { user } = useAuth();
  const [events, setEvents] = useState<EventDoc[]>([]);
  const [products, setProducts] = useState<ProductDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEventId, setSelectedEventId] = useState<string>('ALL');

  useEffect(() => {
    document.title = 'Toko HIMASRI — HIMASRI IT PLN';
    const unsubEvents = subscribeEvents(setEvents);
    const unsubProducts = subscribePublishedProducts((list) => {
      setProducts(list);
      setLoading(false);
    });
    return () => {
      unsubEvents();
      unsubProducts();
    };
  }, []);

  const activeEvents = useMemo(() => events.filter((e) => e.active), [events]);

  const filteredProducts = useMemo(() => {
    if (selectedEventId === 'ALL') return products;
    return products.filter((p) => p.eventId === selectedEventId);
  }, [products, selectedEventId]);

  const hasSample = useMemo(
    () => filteredProducts.some((p) => p.isSample),
    [filteredProducts],
  );

  const handleOrder = (product: ProductDoc) => {
    const eventInfo = events.find((e) => e.id === product.eventId);
    const phone = eventInfo?.contactWhatsapp || '6281234567803';
    const text = `Halo panitia, saya ingin memesan ${product.name}.`;
    if (user) {
      void recordProductClick(product.id, user.uid).catch(() => {});
    }
    window.open(buildWhatsappUrl(phone, text), '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        tone="maroon"
        label="Merchandise Resmi"
        title="Toko HIMASRI"
        description="Pesan merchandise resmi kegiatan HIMASRI langsung melalui narahubung panitia via WhatsApp."
      />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <ChipFilter
          layoutId="store-event-chip"
          value={selectedEventId}
          onChange={setSelectedEventId}
          options={[
            { value: 'ALL', label: 'Semua Event', count: products.length },
            ...activeEvents.map((ev) => ({
              value: ev.id,
              label: ev.name,
              count: products.filter((p) => p.eventId === ev.id).length,
            })),
          ]}
          ariaLabel="Filter event merchandise"
        />
        {hasSample && <SimulationNote />}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              mode="view"
              onOrder={handleOrder}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<ShoppingBag className="h-6 w-6" />}
          title="Belum ada produk di event ini"
          description="Produk merchandise dari Kominfo & Kewirausahaan akan tampil setelah dipublikasikan."
        />
      )}
    </div>
  );
}
