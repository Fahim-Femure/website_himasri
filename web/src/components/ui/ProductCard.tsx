import { useState } from 'react';
import { ImageOff, Pencil, Trash2 } from 'lucide-react';
import { Badge } from './Badge';
import { Button, WhatsAppGlyph } from './Button';
import { formatRupiah } from '@/utils/format';
import type { ProductDoc } from '@/types/models';

interface ProductCardProps {
  product: ProductDoc;
  mode: 'view' | 'manage';
  onOrder?: (product: ProductDoc) => void;
  onEdit?: (product: ProductDoc) => void;
  onDelete?: (product: ProductDoc) => void;
}

export function ProductCard({
  product,
  mode,
  onOrder,
  onEdit,
  onDelete,
}: ProductCardProps) {
  const [imgFailed, setImgFailed] = useState(false);
  const outOfStock = product.stock <= 0;
  const lowStock = !outOfStock && product.stock <= 5;
  const imageSrc = product.imageUrl?.trim() || '';

  return (
    <article className="overflow-hidden rounded-lg bg-white border border-cream-200 p-4 transition-colors hover:border-cream-300 flex flex-col gap-4">
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-md bg-cream-100 border border-cream-200 flex items-center justify-center">
        {imageSrc && !imgFailed ? (
          <img
            src={imageSrc}
            alt={product.name}
            loading="lazy"
            onError={() => setImgFailed(true)}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center justify-center gap-1.5 text-ink-400 select-none">
            <ImageOff className="h-7 w-7" aria-hidden="true" />
            <span className="type-caption font-medium">Belum ada foto</span>
          </div>
        )}

        {/* Stock Badge anchored to top-right corner so price row never clips */}
        <div className="absolute top-2.5 right-2.5 z-10">
          {outOfStock ? (
            <Badge variant="danger" className="border border-danger-600/20">
              Habis
            </Badge>
          ) : lowStock ? (
            <Badge variant="warning" className="tabular-nums border border-warning-600/20">
              Stok {product.stock}
            </Badge>
          ) : (
            <Badge variant="success" className="tabular-nums border border-success-600/20">
              Stok {product.stock}
            </Badge>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-start justify-between gap-2">
            <h3 className="type-app-body leading-6 font-semibold text-ink-900 line-clamp-2 min-w-0">
              {product.name}
            </h3>
            {mode === 'manage' && product.status === 'draft' && (
              <Badge variant="neutral" className="shrink-0">
                Draf
              </Badge>
            )}
          </div>

          <p className="type-label leading-5 text-ink-600 truncate">{product.eventName}</p>

          <p className="pt-1 type-body-lg leading-7 font-bold text-maroon-800 tabular-nums">
            {formatRupiah(product.price)}
          </p>

          {product.description && (
            <p className="pt-1 type-label leading-5 text-ink-600 line-clamp-2">
              {product.description}
            </p>
          )}
        </div>

        {mode === 'view' ? (
          <Button
            variant="secondary"
            fullWidth
            disabled={outOfStock}
            leftIcon={outOfStock ? undefined : <WhatsAppGlyph className="h-4 w-4 text-whatsapp-600" />}
            onClick={() => onOrder?.(product)}
          >
            {outOfStock ? 'Stok habis' : 'Pesan via panitia'}
          </Button>
        ) : (
          <div className="flex items-center gap-2 pt-3 border-t border-cream-200">
            <Button
              variant="secondary"
              size="sm"
              className="flex-1"
              leftIcon={<Pencil className="h-4 w-4" />}
              onClick={() => onEdit?.(product)}
            >
              Ubah
            </Button>
            <Button
              variant="danger"
              size="sm"
              aria-label={`Hapus ${product.name}`}
              onClick={() => onDelete?.(product)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </article>
  );
}
