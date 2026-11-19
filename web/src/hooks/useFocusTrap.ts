import { useEffect, useRef, type RefObject } from 'react';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (el) =>
      !el.hasAttribute('disabled') &&
      el.getAttribute('aria-hidden') !== 'true' &&
      el.offsetParent !== null,
  );
}

export interface UseFocusTrapOptions {
  returnFocusRef?: RefObject<HTMLElement | null>;
}

/**
 * Traps keyboard Tab / Shift+Tab focus inside `containerRef` while `active` is true,
 * marks background landmarks inert/aria-hidden, handles Escape, and restores focus
 * reliably (after animation frame) to the trigger element or fallback `returnFocusRef`.
 */
export function useFocusTrap(
  containerRef: RefObject<HTMLElement | null>,
  active: boolean,
  onEscape?: () => void,
  options?: UseFocusTrapOptions,
) {
  const returnFocusRef = options?.returnFocusRef;
  const onEscapeRef = useRef(onEscape);
  onEscapeRef.current = onEscape;

  useEffect(() => {
    if (!active || typeof document === 'undefined') return;

    const prevFocused = document.activeElement as HTMLElement | null;
    const fallbackFocusEl = returnFocusRef?.current ?? null;

    // Mark background landmarks inert so screen readers and Tab cannot leave the dialog
    const backgroundNodes: Array<{
      el: HTMLElement;
      prevInert: boolean;
      prevAriaHidden: string | null;
    }> = [];

    const container = containerRef.current;
    if (container) {
      const candidates = document.querySelectorAll<HTMLElement>('header, main, footer, aside');
      candidates.forEach((el) => {
        if (el === container || el.contains(container) || container.contains(el)) return;
        backgroundNodes.push({
          el,
          prevInert: Boolean((el as HTMLElement & { inert?: boolean }).inert),
          prevAriaHidden: el.getAttribute('aria-hidden'),
        });
        (el as HTMLElement & { inert?: boolean }).inert = true;
        el.setAttribute('aria-hidden', 'true');
      });
    }

    const focusTimer = window.setTimeout(() => {
      const panel = containerRef.current;
      if (!panel) return;
      const focusables = getFocusableElements(panel);
      if (focusables.length > 0) {
        focusables[0].focus();
      } else {
        panel.focus();
      }
    }, 30);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onEscapeRef.current) {
        e.preventDefault();
        onEscapeRef.current();
        return;
      }

      if (e.key !== 'Tab') return;
      const panel = containerRef.current;
      if (!panel) return;

      const focusables = getFocusableElements(panel);
      if (focusables.length === 0) {
        e.preventDefault();
        panel.focus();
        return;
      }

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const current = document.activeElement as HTMLElement | null;
      const inside = current ? panel.contains(current) : false;

      if (e.shiftKey) {
        if (!inside || current === first) {
          e.preventDefault();
          last.focus();
        }
      } else if (!inside || current === last) {
        e.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);

    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener('keydown', handleKeyDown, true);
      backgroundNodes.forEach(({ el, prevInert, prevAriaHidden }) => {
        (el as HTMLElement & { inert?: boolean }).inert = prevInert;
        if (prevAriaHidden === null) {
          el.removeAttribute('aria-hidden');
        } else {
          el.setAttribute('aria-hidden', prevAriaHidden);
        }
      });

      const restoreTarget =
        prevFocused && prevFocused !== document.body && document.contains(prevFocused)
          ? prevFocused
          : fallbackFocusEl && document.contains(fallbackFocusEl)
            ? fallbackFocusEl
            : null;

      if (restoreTarget) {
        window.requestAnimationFrame(() => {
          window.requestAnimationFrame(() => {
            if (document.contains(restoreTarget)) {
              restoreTarget.focus();
            }
          });
        });
      }
    };
  }, [active, containerRef, returnFocusRef]);
}
