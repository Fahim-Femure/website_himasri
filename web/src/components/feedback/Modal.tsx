import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Button } from '@/components/ui/Button';
import { DURATION, EASING, REDUCED_TRANSITION } from '@/components/motion';
import { useLenisContext } from '@/contexts/LenisContext';
import { useFocusTrap } from '@/hooks/useFocusTrap';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  maxWidthClass?: string;
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  maxWidthClass = 'max-w-lg',
}: ModalProps) {
  const prefersReduced = useReducedMotion();
  const { stop, start } = useLenisContext();
  const panelRef = useRef<HTMLDivElement>(null);

  useFocusTrap(panelRef, open, onClose);

  useEffect(() => {
    if (!open) return;
    stop();
    return () => {
      start();
    };
  }, [open, stop, start]);

  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: DURATION.fast }}
            className="fixed inset-0 bg-maroon-950/50 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            ref={panelRef}
            tabIndex={-1}
            data-lenis-prevent
            initial={prefersReduced ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
            animate={prefersReduced ? { opacity: 1 } : { opacity: 1, scale: 1 }}
            exit={prefersReduced ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
            transition={
              prefersReduced
                ? REDUCED_TRANSITION
                : { duration: DURATION.base, ease: EASING.enter }
            }
            className={[
              'scrollbar-light relative z-10 w-full rounded-xl bg-cream-50 border border-cream-200 p-6 shadow-raised max-h-[90vh] overflow-y-auto',
              maxWidthClass,
            ].join(' ')}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="modal-title" className="type-body-lg leading-7 font-semibold text-ink-900">
                  {title}
                </h2>
                {description && (
                  <p className="mt-1 type-small leading-5 text-ink-600">{description}</p>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Tutup dialog"
                className="flex h-11 w-11 md:h-10 md:w-10 shrink-0 items-center justify-center rounded-md text-ink-600 hover:bg-cream-100 hover:text-ink-900 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary';
  loading?: boolean;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Ya, lanjutkan',
  cancelLabel = 'Batal',
  variant = 'danger',
  loading = false,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={loading ? () => {} : onClose} title={title} maxWidthClass="max-w-md">
      <p className="type-app-body leading-6 text-ink-600">{description}</p>
      <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
        <Button variant="secondary" onClick={onClose} disabled={loading}>
          {cancelLabel}
        </Button>
        <Button
          variant={variant === 'danger' ? 'danger' : 'primary'}
          loading={loading}
          loadingLabel="Memproses…"
          onClick={onConfirm}
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
