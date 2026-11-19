import { Instagram, Mail, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SongketPattern } from '@/components/ui/SongketPattern';
import type { PublicSettings } from '@/types/models';

export function Footer({ settings }: { settings: PublicSettings }) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative overflow-hidden g-dark text-cream-100 pt-16 pb-10 border-t border-gold-500/20">
      <SongketPattern corner="br" opacity={0.07} />
      <div className="public-container relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 pb-10 border-b border-white/15">
          {/* Column 1: Identity & Address */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img
                src="/assets/images/logo-himasri.png"
                alt="Logo HIMASRI"
                loading="lazy"
                className="h-10 w-10 object-contain"
              />
              <div>
                <p className="type-body font-bold text-cream-50">HIMASRI</p>
                <p className="type-label text-cream-100/80">Institut Teknologi PLN</p>
              </div>
            </div>
            <p className="type-small leading-6 text-cream-100/80 max-w-sm">
              Himpunan Mahasiswa Sriwijaya, rumah bagi mahasiswa asal Sumatera Selatan di IT PLN.
              Wong Kito Galo.
            </p>
            <div className="flex items-start gap-2 type-small text-cream-100/80">
              <MapPin className="h-4 w-4 shrink-0 mt-1 text-gold-300" aria-hidden="true" />
              <span>{settings.alamat}</span>
            </div>
          </div>

          {/* Column 2: Main Navigation & Member Access */}
          <div>
            <p className="type-small font-semibold text-gold-300">Tautan Utama</p>
            <ul className="mt-2 md:mt-3 space-y-0 md:space-y-2 type-small">
              <li>
                <Link to="/#tentang" className="inline-flex min-h-11 md:min-h-[36px] items-center text-cream-100/85 hover:text-white">
                  Tentang HIMASRI
                </Link>
              </li>
              <li>
                <Link to="/#budaya" className="inline-flex min-h-11 md:min-h-[36px] items-center text-cream-100/85 hover:text-white">
                  Budaya Palembang
                </Link>
              </li>
              <li>
                <Link to="/#bph" className="inline-flex min-h-11 md:min-h-[36px] items-center text-cream-100/85 hover:text-white">
                  Susunan BPH
                </Link>
              </li>
              <li>
                <Link to="/journey" className="inline-flex min-h-11 md:min-h-[36px] items-center text-cream-100/85 hover:text-white">
                  Perjalanan (Journey)
                </Link>
              </li>
              <li>
                <Link to="/masuk" className="inline-flex min-h-11 md:min-h-[36px] items-center text-cream-100/85 hover:text-white">
                  Masuk Ruang Anggota
                </Link>
              </li>
              <li>
                <Link to="/daftar" className="inline-flex min-h-11 md:min-h-[36px] items-center text-cream-100/85 hover:text-white">
                  Daftar Anggota
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Social & Official Contact */}
          <div>
            <p className="type-small font-semibold text-gold-300">Kontak & Media Sosial</p>
            <ul className="mt-2 md:mt-3 space-y-1 md:space-y-3 type-small text-cream-100/85">
              <li className="flex items-center md:items-start gap-2.5">
                <Mail className="h-4 w-4 shrink-0 md:mt-1 text-gold-300" aria-hidden="true" />
                <a
                  href={`mailto:${settings.email}`}
                  className="inline-flex min-h-11 md:min-h-0 items-center py-2 md:py-0 hover:text-white break-all"
                >
                  {settings.email}
                </a>
              </li>
              <li className="flex items-start gap-2.5">
                <Instagram className="h-4 w-4 shrink-0 mt-1 text-gold-300" aria-hidden="true" />
                <span>{settings.instagram}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 pb-2 flex flex-col sm:flex-row items-center justify-between gap-4 type-label text-cream-100/75">
          <p>© {currentYear} HIMASRI · Himpunan Mahasiswa Sriwijaya, Institut Teknologi PLN</p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="text-cream-100/60">Foto budaya: Wikimedia Commons (CC BY-SA)</span>
            <p className="font-medium text-cream-100">Semangat Wong Kito Galo</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
