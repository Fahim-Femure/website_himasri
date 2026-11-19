import { useState } from 'react';
import { Download, Info } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface FallbackImportBannerProps {
  subject: string;
  onImport: () => Promise<void>;
}

export function FallbackImportBanner({ subject, onImport }: FallbackImportBannerProps) {
  const [importing, setImporting] = useState(false);

  const handleClick = async () => {
    setImporting(true);
    try {
      await onImport();
    } finally {
      setImporting(false);
    }
  };

  return (
    <div
      role="status"
      className="rounded-lg border border-gold-400/50 bg-gold-100/50 px-4 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
    >
      <div className="flex items-start gap-2.5 type-small text-ink-900">
        <Info className="h-4 w-4 shrink-0 text-maroon-700 mt-0.5" aria-hidden="true" />
        <div>
          <p className="font-semibold">Beranda masih memakai isi bawaan</p>
          <p className="type-label text-ink-600">
            Isi {subject} belum disimpan di panel ini. Simpan isi bawaan sekali agar bisa diubah
            langsung dari sini.
          </p>
        </div>
      </div>
      <Button
        variant="primary"
        size="sm"
        loading={importing}
        loadingLabel="Mengimpor…"
        leftIcon={<Download className="h-4 w-4" />}
        onClick={() => void handleClick()}
        className="shrink-0"
      >
        Impor konten bawaan untuk diedit
      </Button>
    </div>
  );
}
