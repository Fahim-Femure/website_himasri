import { Compass } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';

export default function NotFoundPage() {
  return (
    <section className="min-h-[75vh] bg-cream-50 pt-32 pb-20 px-6 flex items-center justify-center">
      <div className="max-w-md w-full rounded-lg bg-white border border-cream-200 p-8 text-center space-y-5">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-cream-100 text-maroon-700">
          <Compass className="h-7 w-7" aria-hidden="true" />
        </div>
        <div className="space-y-2">
          <p className="type-caption font-semibold uppercase tracking-[0.06em] text-maroon-700">
            Tidak Ditemukan · 404
          </p>
          <h1 className="text-2xl leading-8 font-semibold text-ink-900">
            Halaman tidak ditemukan
          </h1>
          <p className="type-small leading-6 text-ink-600">
            Alamat yang Anda buka tidak ditemukan atau sudah dipindahkan.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-3 pt-1">
          <Link to="/">
            <Button variant="primary" arrowRight>
              Kembali ke Beranda
            </Button>
          </Link>
          <Link to="/anggota/struktur">
            <Button variant="secondary">Ke Ruang Anggota</Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
