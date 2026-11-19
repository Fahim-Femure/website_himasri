import { useEffect, useRef, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from 'motion/react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import { PUBLIC_NAVBAR_HEIGHT, useLenisContext } from '@/contexts/LenisContext';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { useScrollSpy } from '@/hooks/useScrollSpy';
import { DURATION, EASING, REDUCED_TRANSITION } from '@/components/motion';

const NAV_LINKS = [
  { id: 'tentang', label: 'Tentang' },
  { id: 'budaya', label: 'Budaya' },
  { id: 'bph', label: 'BPH' },
  { id: 'agenda', label: 'Agenda' },
  { id: 'journey', label: 'Journey' },
] as const;

const SECTION_IDS = NAV_LINKS.map((l) => l.id);

export function Navbar() {
  const { user, status } = useAuth();
  const { scrollTo, stop, start } = useLenisContext();
  const location = useLocation();
  const navigate = useNavigate();
  const prefersReduced = useReducedMotion();

  const isHome = location.pathname === '/';
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const activeSection = useScrollSpy(SECTION_IDS, PUBLIC_NAVBAR_HEIGHT, isHome);
  const sheetRef = useRef<HTMLDivElement>(null);
  const mobileMenuBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onScroll = () => {
      const heroThreshold = isHome ? Math.max(80, window.innerHeight - 120) : 80;
      setScrolled(window.scrollY > heroThreshold);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [isHome]);

  useFocusTrap(sheetRef, mobileOpen, () => setMobileOpen(false), {
    returnFocusRef: mobileMenuBtnRef,
  });

  useEffect(() => {
    if (!mobileOpen) return;
    stop();
    return () => {
      start();
    };
  }, [mobileOpen, stop, start]);

  const scrollToSection = (id: string) => {
    setMobileOpen(false);
    if (!isHome) {
      navigate(`/#${id}`);
      return;
    }
    scrollTo(`#${id}`, { offset: -PUBLIC_NAVBAR_HEIGHT });
  };

  const solidNav = !isHome || scrolled;

  return (
    <>
      <header
        className={[
          'fixed top-0 left-0 right-0 z-40 border-b transition-all',
          solidNav
            ? 'glass-dark border-x-0 border-t-0 text-cream-50'
            : 'bg-transparent text-cream-50 border-transparent',
        ].join(' ')}
        style={{ transitionDuration: `${DURATION.base * 1000}ms` }}
      >
        <div className="public-container flex h-[72px] items-center justify-between gap-4">
          {/* Brand */}
          <Link
            to="/"
            onClick={(e) => {
              if (isHome) {
                e.preventDefault();
                scrollTo(0);
              }
            }}
            className="flex items-center gap-2.5 min-h-[44px] rounded-md"
          >
            <img
              src="/assets/images/logo-himasri.png"
              alt="Logo HIMASRI"
              className="h-9 w-9 shrink-0 object-contain"
            />
            <div className="min-w-0">
              <span className="block type-body font-bold leading-none text-cream-50">
                HIMASRI
              </span>
              <span className="hidden xl:block mt-1 type-caption leading-none truncate text-gold-300">
                Institut Teknologi PLN
              </span>
            </div>
          </Link>

          {/* Desktop Links (max 5) */}
          <LayoutGroup id="public-navbar">
            <nav aria-label="Navigasi utama" className="hidden lg:flex items-center gap-1">
              {NAV_LINKS.map((item) => {
                const isActive = isHome && activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => scrollToSection(item.id)}
                    className={[
                      'relative inline-flex min-h-[44px] items-center px-3 py-2 type-small-medium font-medium transition-colors duration-150 cursor-pointer',
                      isActive
                        ? 'text-white font-semibold'
                        : 'text-cream-50/95 hover:text-white',
                    ].join(' ')}
                  >
                    <span>{item.label}</span>
                    {isActive && (
                      <motion.span
                        layoutId="navbar-active"
                        transition={
                          prefersReduced
                            ? { duration: 0 }
                            : { type: 'spring', stiffness: 500, damping: 40 }
                        }
                        className="absolute bottom-2 left-3 right-3 h-0.5 rounded-full g-gold"
                      />
                    )}
                  </button>
                );
              })}
            </nav>
          </LayoutGroup>

          {/* Desktop Primary Action */}
          <div className="hidden lg:flex items-center shrink-0">
            {user && status === 'active' ? (
              <Link to="/anggota/struktur">
                <Button variant="gold" pill size="sm" arrowRight>
                  Ruang Anggota
                </Button>
              </Link>
            ) : user && status === 'pending' ? (
              <Link to="/daftar/menunggu">
                <Button variant="gold" pill size="sm" arrowRight>
                  Menunggu Verifikasi
                </Button>
              </Link>
            ) : (
              <Link to="/masuk">
                <Button variant="gold" pill size="sm">
                  Masuk
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile Controls */}
          <div className="flex lg:hidden items-center gap-2">
            {user && status === 'active' ? (
              <Link to="/anggota/struktur">
                <Button variant="gold" pill size="sm">
                  Ruang Anggota
                </Button>
              </Link>
            ) : (
              <Link to="/masuk">
                <Button variant="gold" pill size="sm">
                  Masuk
                </Button>
              </Link>
            )}
            <button
              ref={mobileMenuBtnRef}
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Buka menu navigasi"
              aria-expanded={mobileOpen}
              className="flex h-11 w-11 items-center justify-center rounded-md border border-white/25 bg-maroon-900/80 text-cream-50 hover:bg-maroon-700 transition-colors"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Sheet */}
      <AnimatePresence
        onExitComplete={() => {
          if (document.activeElement === document.body) {
            mobileMenuBtnRef.current?.focus();
          }
        }}
      >
        {mobileOpen && (
          <div
            className="fixed inset-0 z-50 lg:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Menu navigasi"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: DURATION.base }}
              className="fixed inset-0 bg-ink-900/40"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              ref={sheetRef}
              data-lenis-prevent
              initial={prefersReduced ? { opacity: 0 } : { x: '100%' }}
              animate={prefersReduced ? { opacity: 1 } : { x: 0 }}
              exit={prefersReduced ? { opacity: 0 } : { x: '100%' }}
              transition={
                prefersReduced
                  ? REDUCED_TRANSITION
                  : { duration: DURATION.medium, ease: EASING.enter }
              }
              className="fixed right-0 top-0 bottom-0 z-10 flex w-full max-w-sm flex-col glass-dark border-y-0 border-r-0 text-cream-50 p-6 overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-5 border-b border-white/15">
                <div className="flex items-center gap-2.5">
                  <img
                    src="/assets/images/logo-himasri.png"
                    alt="Logo HIMASRI"
                    className="h-8 w-8 object-contain"
                  />
                  <span className="type-body font-bold text-cream-50">HIMASRI</span>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  aria-label="Tutup menu"
                  className="flex h-11 w-11 items-center justify-center rounded-md border border-white/20 bg-white/10 text-cream-50 hover:bg-white/20 cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <nav className="mt-5 flex flex-col gap-1 flex-1" aria-label="Navigasi mobile">
                {NAV_LINKS.map((item) => {
                  const active = isHome && activeSection === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => scrollToSection(item.id)}
                      className={[
                        'flex min-h-[48px] items-center rounded-md px-4 py-3 text-left type-app-body transition-colors cursor-pointer',
                        active
                          ? 'bg-white/12 text-white font-semibold border-l-[3px] border-l-gold-300'
                          : 'text-cream-100/90 font-medium hover:bg-white/10 hover:text-white',
                      ].join(' ')}
                    >
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>

              <div className="pt-5 border-t border-white/15 flex flex-col gap-3">
                {user && status === 'active' ? (
                  <Link to="/anggota/struktur" onClick={() => setMobileOpen(false)}>
                    <Button variant="gold" fullWidth arrowRight>
                      Masuk Ruang Anggota
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Link to="/masuk" onClick={() => setMobileOpen(false)}>
                      <Button variant="gold" fullWidth>
                        Masuk
                      </Button>
                    </Link>
                    <Link to="/daftar" onClick={() => setMobileOpen(false)}>
                      <Button variant="outlineOnDark" fullWidth>
                        Daftar Anggota
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
