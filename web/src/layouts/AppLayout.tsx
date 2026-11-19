import { useEffect, useRef, useState } from 'react';
import { useLocation, useOutlet } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { Topbar } from '@/components/layout/Topbar';
import { DURATION, EASING, REDUCED_TRANSITION } from '@/components/motion';
import { useFocusTrap } from '@/hooks/useFocusTrap';

export function AppLayout() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const mobileNavButtonRef = useRef<HTMLButtonElement>(null);
  const location = useLocation();
  const outlet = useOutlet();
  const prefersReduced = useReducedMotion();

  useFocusTrap(drawerRef, mobileNavOpen, () => setMobileNavOpen(false), {
    returnFocusRef: mobileNavButtonRef,
  });

  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-dvh flex bg-cream-50 text-ink-900">
      {/* Desktop Static Sidebar */}
      <div className="hidden lg:block sticky top-0 h-dvh shrink-0">
        <AppSidebar layoutGroupId="desktop-sidebar" />
      </div>

      {/* Mobile Drawer Sidebar */}
      <AnimatePresence
        onExitComplete={() => {
          if (document.activeElement === document.body) {
            mobileNavButtonRef.current?.focus();
          }
        }}
      >
        {mobileNavOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex" role="dialog" aria-modal="true">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: DURATION.fast }}
              className="fixed inset-0 bg-maroon-950/50"
              onClick={() => setMobileNavOpen(false)}
            />
            <motion.div
              ref={drawerRef}
              tabIndex={-1}
              initial={prefersReduced ? { opacity: 0 } : { x: '-100%' }}
              animate={prefersReduced ? { opacity: 1 } : { x: 0 }}
              exit={prefersReduced ? { opacity: 0 } : { x: '-100%' }}
              transition={
                prefersReduced
                  ? REDUCED_TRANSITION
                  : { duration: DURATION.base, ease: EASING.enter }
              }
              className="relative z-10 h-full shadow-raised"
            >
              <AppSidebar
                layoutGroupId="mobile-sidebar"
                showCloseButton
                onClose={() => setMobileNavOpen(false)}
                onNavigate={() => setMobileNavOpen(false)}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar
          onOpenMobileNav={() => setMobileNavOpen(true)}
          mobileNavButtonRef={mobileNavButtonRef}
        />
        <main className="flex-1 px-4 py-6 lg:px-8 lg:py-7 max-w-[1440px] w-full mx-auto">
          {prefersReduced ? (
            <div key={location.pathname} className="space-y-6">
              {outlet}
            </div>
          ) : (
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 6 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  transition: { duration: 0.16, ease: EASING.enter },
                }}
                exit={{
                  opacity: 0,
                  y: -4,
                  transition: { duration: 0.11, ease: EASING.exit },
                }}
                className="space-y-6"
              >
                {outlet}
              </motion.div>
            </AnimatePresence>
          )}
        </main>
      </div>
    </div>
  );
}
