import { useEffect, useRef, useState, type RefObject } from 'react';
import { ExternalLink, LogOut, Menu } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { DURATION, EASING, REDUCED_TRANSITION } from '@/components/motion';
import { Avatar } from '@/components/ui/Avatar';
import { useAuth } from '@/contexts/AuthContext';
import { logoutAccount } from '@/services/authService';
import { ROLE_LABELS } from '@/utils/permissions';

const ROUTE_TITLES: Record<string, { group: string; title: string }> = {
  '/anggota/struktur': { group: 'Jelajahi', title: 'Struktur & Anggota' },
  '/anggota/materi': { group: 'Jelajahi', title: 'Materi Kuliah' },
  '/anggota/asisten-lab': { group: 'Jelajahi', title: 'Asisten Lab' },
  '/anggota/toko': { group: 'Jelajahi', title: 'Toko HIMASRI' },
  '/kelola/foto-beranda': { group: 'Kelola', title: 'Foto Beranda' },
  '/kelola/konten-beranda': { group: 'Kelola', title: 'Konten Beranda' },
  '/kelola/agenda': { group: 'Kelola', title: 'Agenda Tahunan' },
  '/kelola/fakultas': { group: 'Kelola', title: 'Fakultas & Lab' },
  '/kelola/asisten-lab': { group: 'Kelola', title: 'Kelola Asisten Lab' },
  '/kelola/journey': { group: 'Kelola', title: 'Journey HIMASRI' },
  '/kelola/produk': { group: 'Kelola', title: 'Produk Event' },
  '/admin/kode-referal': { group: 'Admin', title: 'Kode Referal' },
  '/admin/pengguna': { group: 'Admin', title: 'Pengguna & Hak Akses' },
  '/admin/periode': { group: 'Admin', title: 'Periode & BPH' },
  '/admin/log': { group: 'Admin', title: 'Log Audit' },
};

export function Topbar({
  onOpenMobileNav,
  mobileNavButtonRef,
}: {
  onOpenMobileNav: () => void;
  mobileNavButtonRef?: RefObject<HTMLButtonElement>;
}) {
  const { profile, role } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const prefersReduced = useReducedMotion();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const meta = ROUTE_TITLES[location.pathname] ?? { group: 'Ruang Anggota', title: 'HIMASRI' };
  const roleLabel = role ? ROLE_LABELS[role] : 'Anggota';
  const displayName = profile?.nama || 'Anggota';

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    window.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      window.removeEventListener('keydown', handleEsc);
    };
  }, []);

  const handleLogout = async () => {
    setMenuOpen(false);
    await logoutAccount();
    navigate('/', { replace: true });
  };

  return (
    <header
      className={[
        'sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b px-4 lg:px-8 transition-colors',
        scrolled
          ? 'glass-light border-x-0 border-t-0'
          : 'border-cream-200 bg-cream-50',
      ].join(' ')}
    >
      <div className="flex items-center gap-3 min-w-0">
        <button
          ref={mobileNavButtonRef}
          type="button"
          onClick={onOpenMobileNav}
          aria-label="Buka menu navigasi"
          className="flex lg:hidden h-11 w-11 shrink-0 items-center justify-center rounded-md border border-cream-300 bg-white text-ink-900 hover:bg-cream-100 shadow-card"
        >
          <Menu className="h-5 w-5" />
        </button>

        <nav aria-label="Breadcrumb" className="flex items-center gap-2 min-w-0 type-label leading-5">
          {prefersReduced ? (
            <div className="flex items-center gap-2 min-w-0">
              <span className="hidden sm:inline text-ink-600">{meta.group}</span>
              <span className="hidden sm:inline text-ink-400" aria-hidden="true">
                /
              </span>
              <span className="font-semibold text-ink-900 truncate">{meta.title}</span>
            </div>
          ) : (
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 3 }}
                animate={{ opacity: 1, y: 0, transition: { duration: 0.14, ease: EASING.enter } }}
                exit={{ opacity: 0, y: -3, transition: { duration: 0.1, ease: EASING.exit } }}
                className="flex items-center gap-2 min-w-0"
              >
                <span className="hidden sm:inline text-ink-600">{meta.group}</span>
                <span className="hidden sm:inline text-ink-400" aria-hidden="true">
                  /
                </span>
                <span className="font-semibold text-ink-900 truncate">{meta.title}</span>
              </motion.div>
            </AnimatePresence>
          )}
        </nav>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <span className="hidden md:inline-flex items-center rounded-full bg-maroon-100 px-3 py-1 type-label leading-4 font-semibold text-maroon-800">
          {roleLabel}
        </span>

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            aria-label="Menu profil pengguna"
            className="flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-full p-1 hover:bg-cream-100 cursor-pointer"
          >
            <span className="pointer-events-none flex items-center" aria-hidden="true">
              <Avatar name={displayName} photoURL={profile?.photoURL} size="XS" />
            </span>
          </button>

          <AnimatePresence>
            {menuOpen && (
              <motion.div
                role="menu"
                data-lenis-prevent
                initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: -4, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={prefersReduced ? { opacity: 0 } : { opacity: 0, y: -4, scale: 0.98 }}
                transition={
                  prefersReduced
                    ? REDUCED_TRANSITION
                    : { duration: DURATION.fast, ease: EASING.enter }
                }
                style={{ transformOrigin: 'top right' }}
                className="absolute right-0 mt-2 w-64 rounded-lg bg-cream-50 border border-cream-200 p-1.5 shadow-raised z-50"
              >
                <div className="px-3 py-2.5 border-b border-cream-200">
                  <p className="type-small font-semibold text-ink-900 truncate">{displayName}</p>
                  <p className="type-caption text-ink-600 tabular-nums">
                    {profile?.nim ? `NIM ${profile.nim} · ${roleLabel}` : roleLabel}
                  </p>
                </div>

                <Link
                  to="/"
                  role="menuitem"
                  onClick={() => setMenuOpen(false)}
                  className="mt-1 flex min-h-[44px] items-center gap-2.5 rounded-md px-3 py-2 type-small text-ink-900 hover:bg-cream-100"
                >
                  <ExternalLink className="h-4 w-4 text-ink-600" aria-hidden="true" />
                  <span>Lihat situs publik</span>
                </Link>

                <button
                  type="button"
                  role="menuitem"
                  onClick={handleLogout}
                  className="flex w-full min-h-[44px] items-center gap-2.5 rounded-md px-3 py-2 type-small text-danger-600 hover:bg-danger-50 cursor-pointer"
                >
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  <span>Keluar</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
