import { useEffect, useRef, useState, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Button } from '@/components/ui/Button';
import { DURATION, EASING, REDUCED_TRANSITION } from '@/components/motion';

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  dirty?: boolean;
  children: ReactNode;
}

export function Drawer({
  open,
  onClose,
  title,
  description,
  dirty = false,
  children,
}: DrawerProps) {
  const prefersReduced = useReducedMotion();
  const panelRef = useRef<HTMLDivElement>(null);
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  const requestClose = () => {
    if (dirty) {
      setConfirmDiscard(true);
      return;
    }
    onClose();
  };

  useEffect(() => {
    if (!open) {
      setConfirmDiscard(false);
      return;
    }

    const prevFocused = document.activeElement as HTMLElement | null;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (dirty) {
          setConfirmDiscard(true);
        } else {
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    const timer = window.setTimeout(() => {
      const firstInput = panelRef.current?.querySelector<HTMLElement>(
        'input, select, textarea, button',
      );
      firstInput?.focus();
    }, 60);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.clearTimeout(timer);
      prevFocused?.focus?.();
    };
  }, [open, dirty, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-50 flex justify-end"
          role="dialog"
          aria-modal="true"
          aria-labelledby="drawer-title"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: DURATION.base }}
            className="fixed inset-0 bg-maroon-950/50 backdrop-blur-sm"
            onClick={requestClose}
          />

          <motion.div
            ref={panelRef}
            initial={prefersReduced ? { opacity: 0 } : { x: '100%' }}
            animate={prefersReduced ? { opacity: 1 } : { x: 0 }}
            exit={prefersReduced ? { opacity: 0 } : { x: '100%' }}
            transition={
              prefersReduced
                ? REDUCED_TRANSITION
                : { duration: DURATION.medium, ease: EASING.enter }
            }
            className="relative z-10 flex h-full w-full max-w-[480px] flex-col bg-cream-50 border-l border-cream-200 shadow-raised"
          >
            <div className="flex items-start justify-between gap-4 border-b border-cream-200 px-6 py-5">
              <div>
                <h2 id="drawer-title" className="type-body-lg leading-7 font-semibold text-ink-900">
                  {title}
                </h2>
                {description && <p className="mt-1 type-small leading-5 text-ink-600">{description}</p>}
              </div>
              <button
                type="button"
                onClick={requestClose}
                aria-label="Tutup panel"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-ink-600 hover:bg-cream-100 hover:text-ink-900"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {confirmDiscard && (
              <div className="border-b border-danger-600/30 bg-danger-50 px-6 py-3 flex flex-wrap items-center justify-between gap-3">
                <p className="type-small font-medium text-danger-600">
                  Ada perubahan yang belum disimpan. Tutup panel?
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setConfirmDiscard(false)}
                  >
                    Lanjut isi
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => {
                      setConfirmDiscard(false);
                      onClose();
                    }}
                  >
                    Buang
                  </Button>
                </div>
              </div>
            )}

            <div className="scrollbar-light flex-1 overflow-y-auto px-6 py-6">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
