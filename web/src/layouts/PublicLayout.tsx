import { useEffect, useRef, useState } from 'react';
import { ArrowUp, Calendar, CalendarCog, Compass, FileText, ImagePlus, Pencil, X } from 'lucide-react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Footer } from '@/components/layout/Footer';
import { Navbar } from '@/components/layout/Navbar';
import { DURATION, EASING, PageTransition, REDUCED_TRANSITION } from '@/components/motion';
import { useAuth } from '@/contexts/AuthContext';
import { LenisProvider, useLenisContext } from '@/contexts/LenisContext';
import { DEFAULT_PUBLIC_SETTINGS, subscribePublicSettings } from '@/services/publicService';
import type { PublicSettings } from '@/types/models';
import { can } from '@/utils/permissions';

function PublicFloatingControls() {
  const { scrollTo } = useLenisContext();
  const { user, status, role } = useAuth();
  const { pathname } = useLocation();
  const prefersReduced = useReducedMotion();
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [heroVisible, setHeroVisible] = useState(pathname === '/');
  const [footerVisible, setFooterVisible] = useState(false);
  const [editMenuOpen, setEditMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const editLinks =
    user && status === 'active'
      ? [
          can(role, 'content:edit')
            ? { to: '/kelola/konten-beranda', label: 'Konten & Budaya', icon: FileText }
            : null,
          can(role, 'hero:edit')
            ? { to: '/kelola/foto-beranda', label: 'Foto Hero Beranda', icon: ImagePlus }
            : null,
          can(role, 'content:edit')
            ? { to: '/kelola/agenda', label: 'Agenda Tahunan', icon: Calendar }
            : null,
          can(role, 'journey:edit')
            ? { to: '/kelola/journey', label: 'Journey HIMASRI', icon: Compass }
            : null,
          can(role, 'periods:edit')
            ? { to: '/admin/periode', label: 'Periode & BPH', icon: CalendarCog }
            : null,
        ].filter((item): item is NonNullable<typeof item> => item !== null)
      : [];

  useEffect(() => {
    const onScroll = () => {
      setShowBackToTop(window.scrollY > 520);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const heroEl = document.getElementById('beranda');
    if (!heroEl) {
      setHeroVisible(false);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        setHeroVisible(Boolean(entries[0]?.isIntersecting));
      },
      { threshold: 0.15 },
    );
    io.observe(heroEl);
    return () => io.disconnect();
  }, [pathname]);

  useEffect(() => {
    const footer = document.querySelector('footer');
    if (!footer) return;
    const io = new IntersectionObserver(
      (entries) => {
        setFooterVisible(Boolean(entries[0]?.isIntersecting));
      },
      { threshold: 0.05 },
    );
    io.observe(footer);
    return () => io.disconnect();
  }, [pathname]);

  useEffect(() => {
    if (!editMenuOpen) return;
    const handleOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setEditMenuOpen(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setEditMenuOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    window.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      window.removeEventListener('keydown', handleEsc);
    };
  }, [editMenuOpen]);

  const backToTopVisible = showBackToTop && !footerVisible;

  return (
    <div
      ref={menuRef}
      className="fixed bottom-6 right-6 z-30 flex flex-col items-end gap-2.5 pointer-events-none"
    >
      {/* Floating "Edit halaman ini" popover menu for authorized editors */}
      <AnimatePresence>
        {editMenuOpen && editLinks.length > 0 && (
          <motion.div
            data-lenis-prevent
            initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.96 }}
            transition={
              prefersReduced
                ? REDUCED_TRANSITION
                : { duration: DURATION.fast, ease: EASING.enter }
            }
            className="pointer-events-auto glass-dark w-56 rounded-xl p-1.5 text-cream-50"
            role="menu"
            aria-label="Pintasan kelola halaman"
          >
            <p className="px-3 py-1.5 type-micro font-semibold uppercase tracking-wider text-gold-300">
              Kelola Konten Publik
            </p>
            {editLinks.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  role="menuitem"
                  onClick={() => setEditMenuOpen(false)}
                  className="flex min-h-11 md:min-h-[38px] items-center gap-2.5 rounded-lg px-3 py-2 type-label font-medium text-cream-50 hover:bg-white/12 transition-colors"
                >
                  <Icon className="h-4 w-4 text-gold-300 shrink-0" aria-hidden="true" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-2 pointer-events-auto">
        {editLinks.length > 0 && !heroVisible && !footerVisible && (
          <button
            type="button"
            onClick={() => setEditMenuOpen((v) => !v)}
            aria-label="Edit halaman ini"
            aria-expanded={editMenuOpen}
            aria-haspopup="menu"
            className="glass-dark inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-full px-3 sm:px-3.5 type-label font-semibold text-cream-50 hover:bg-maroon-900 transition-colors cursor-pointer"
          >
            {editMenuOpen ? (
              <X className="h-4 w-4 text-gold-300" aria-hidden="true" />
            ) : (
              <Pencil className="h-4 w-4 text-gold-300" aria-hidden="true" />
            )}
            <span className="hidden sm:inline">Edit halaman ini</span>
          </button>
        )}

        <AnimatePresence>
          {backToTopVisible && (
            <motion.button
              type="button"
              onClick={() => scrollTo(0)}
              aria-label="Kembali ke atas"
              initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 12 }}
              transition={
                prefersReduced
                  ? REDUCED_TRANSITION
                  : { duration: DURATION.base, ease: EASING.enter }
              }
              className="flex h-11 w-11 items-center justify-center rounded-full bg-maroon-900 text-cream-50 border border-white/15 shadow-raised hover:bg-maroon-800 transition-colors cursor-pointer"
            >
              <ArrowUp className="h-5 w-5" aria-hidden="true" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export function PublicLayout() {
  const [settings, setSettings] = useState<PublicSettings>(DEFAULT_PUBLIC_SETTINGS);

  useEffect(() => {
    return subscribePublicSettings(setSettings);
  }, []);

  return (
    <LenisProvider>
      <div className="flex min-h-dvh flex-col bg-cream-50">
        <Navbar />
        <main className="flex-1">
          <PageTransition mode="public">
            <Outlet context={{ settings }} />
          </PageTransition>
        </main>
        <Footer settings={settings} />
        <PublicFloatingControls />
      </div>
    </LenisProvider>
  );
}
