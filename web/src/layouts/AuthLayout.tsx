import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { PageTransition } from '@/components/motion';
import { SongketPattern } from '@/components/ui/SongketPattern';

interface AuthLayoutProps {
  quote: string;
  maxWidthClass?: string;
  children: ReactNode;
}

export function AuthLayout({
  quote,
  maxWidthClass = 'max-w-[400px]',
  children,
}: AuthLayoutProps) {
  return (
    <div className="min-h-dvh flex flex-col lg:flex-row g-page">
      {/* Left Photo & Color Block Panel */}
      <aside className="relative hidden lg:flex lg:w-[500px] xl:w-[540px] shrink-0 flex-col justify-between overflow-hidden g-maroon p-12 text-cream-50 shadow-block">
        <img
          src="/assets/images/budaya/ampera.webp"
          alt="Jembatan Ampera Palembang — Warisan Sumatera Selatan"
          className="absolute inset-0 h-full w-full object-cover opacity-35"
          style={{ objectPosition: 'center center' }}
        />
        <div className="absolute inset-0 bg-hero-overlay" />
        <SongketPattern corner="br" opacity={0.08} />

        <div className="relative z-10">
          <Link
            to="/"
            className="inline-flex items-center gap-3 rounded-md focus-visible:outline-none"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-cream-50 p-1.5 shadow-gold">
              <img
                src="/assets/images/logo-himasri.png"
                alt="Logo HIMASRI"
                className="h-8 w-8 object-contain"
              />
            </div>
            <div>
              <p className="type-body font-bold text-cream-50 leading-none">HIMASRI</p>
              <p className="mt-1 type-label font-medium text-gold-300">Institut Teknologi PLN</p>
            </div>
          </Link>
        </div>

        <div className="relative z-10 space-y-3">
          <p className="type-label font-bold uppercase tracking-[0.06em] text-gold-300">
            Wong Kito Galo
          </p>
          <blockquote className="type-h1 leading-9 font-extrabold text-cream-50">
            “{quote}”
          </blockquote>
          <p className="type-small leading-6 text-cream-100/85">
            Himpunan Mahasiswa Sriwijaya, rumah mahasiswa Sumatera Selatan di IT PLN.
          </p>
        </div>
      </aside>

      {/* Right Content Area */}
      <main className="scrollbar-light flex-1 flex items-center justify-center g-page px-6 py-10 sm:px-10 lg:px-12 overflow-y-auto">
        <div className={['w-full rounded-xl bg-white/95 border border-cream-200 p-6 sm:p-8 shadow-raised', maxWidthClass].join(' ')}>
          <PageTransition mode="public">{children}</PageTransition>
        </div>
      </main>
    </div>
  );
}
