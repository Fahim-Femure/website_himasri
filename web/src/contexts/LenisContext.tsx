/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
  type ReactNode,
} from 'react';
import Lenis from 'lenis';
import { useLocation } from 'react-router-dom';

export const PUBLIC_NAVBAR_HEIGHT = 72;

export interface LenisScrollOptions {
  offset?: number;
  immediate?: boolean;
  duration?: number;
}

export interface LenisContextValue {
  lenisRef: MutableRefObject<Lenis | null>;
  isActive: boolean;
  scrollTo: (target: number | string | HTMLElement, options?: LenisScrollOptions) => void;
  stop: () => void;
  start: () => void;
}

const fallbackRef: MutableRefObject<Lenis | null> = { current: null };

function nativeScrollTo(target: number | string | HTMLElement, options?: LenisScrollOptions) {
  if (typeof window === 'undefined') return;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const behavior: ScrollBehavior = options?.immediate || reducedMotion ? 'auto' : 'smooth';
  const offset = options?.offset ?? 0;

  if (typeof target === 'number') {
    window.scrollTo({ top: Math.max(0, target + offset), behavior });
    return;
  }

  const el =
    typeof target === 'string'
      ? target.startsWith('#')
        ? document.getElementById(target.slice(1))
        : document.querySelector<HTMLElement>(target)
      : target;

  if (!el) return;
  const top = el.getBoundingClientRect().top + window.scrollY + offset;
  window.scrollTo({ top: Math.max(0, top), behavior });
}

const defaultContext: LenisContextValue = {
  lenisRef: fallbackRef,
  isActive: false,
  scrollTo: nativeScrollTo,
  stop: () => {},
  start: () => {},
};

const LenisContext = createContext<LenisContextValue>(defaultContext);

function shouldDisableLenis(): boolean {
  if (typeof window === 'undefined') return true;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouch =
    window.matchMedia('(pointer: coarse)').matches ||
    ('ontouchstart' in window && navigator.maxTouchPoints > 0 && window.innerWidth < 1024);
  return reducedMotion || isTouch;
}

function clearHtmlLenisClasses() {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.remove(
    'lenis',
    'lenis-smooth',
    'lenis-scrolling',
    'lenis-stopped',
  );
}

export function LenisProvider({ children }: { children: ReactNode }) {
  const { pathname, hash } = useLocation();
  const lenisRef = useRef<Lenis | null>(null);
  const lockCountRef = useRef(0);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const motionMq = window.matchMedia('(prefers-reduced-motion: reduce)');
    let rafId = 0;

    const destroyInstance = () => {
      if (rafId) {
        window.cancelAnimationFrame(rafId);
        rafId = 0;
      }
      if (lenisRef.current) {
        lenisRef.current.destroy();
        lenisRef.current = null;
      }
      clearHtmlLenisClasses();
      setIsActive(false);
    };

    const initInstance = () => {
      destroyInstance();
      if (shouldDisableLenis()) {
        return;
      }

      const lenis = new Lenis({
        lerp: 0.1,
        smoothWheel: true,
      });
      lenisRef.current = lenis;
      setIsActive(true);

      if (lockCountRef.current > 0) {
        lenis.stop();
      }

      const raf = (time: number) => {
        lenis.raf(time);
        rafId = window.requestAnimationFrame(raf);
      };
      rafId = window.requestAnimationFrame(raf);
    };

    initInstance();

    const handleMotionChange = () => {
      initInstance();
    };
    motionMq.addEventListener('change', handleMotionChange);

    return () => {
      motionMq.removeEventListener('change', handleMotionChange);
      destroyInstance();
    };
  }, []);

  const scrollTo = useCallback(
    (target: number | string | HTMLElement, options?: LenisScrollOptions) => {
      const lenis = lenisRef.current;
      if (lenis) {
        const wasStopped = lockCountRef.current > 0;
        if (wasStopped) {
          lockCountRef.current = 0;
          lenis.start();
        }
        lenis.resize();
        lenis.scrollTo(target, {
          offset: options?.offset ?? 0,
          immediate: options?.immediate ?? false,
          duration: options?.immediate ? 0 : (options?.duration ?? 1.0),
        });
        return;
      }
      nativeScrollTo(target, options);
    },
    [],
  );

  const stop = useCallback(() => {
    lockCountRef.current += 1;
    lenisRef.current?.stop();
  }, []);

  const start = useCallback(() => {
    lockCountRef.current = Math.max(0, lockCountRef.current - 1);
    if (lockCountRef.current === 0) {
      lenisRef.current?.start();
    }
  }, []);

  // Scroll to top immediately on route change, or scroll to hash section after render
  useEffect(() => {
    if (!hash) {
      scrollTo(0, { immediate: true });
      return;
    }

    const id = hash.slice(1);
    let attempts = 0;
    let timerId = 0;
    let settleTimerId = 0;

    const tryScroll = () => {
      const targetEl = document.getElementById(id);
      if (targetEl) {
        scrollTo(targetEl, { offset: -PUBLIC_NAVBAR_HEIGHT });
        // Re-sync after async page content/layout settles (e.g. navigating from /journey to /#agenda)
        settleTimerId = window.setTimeout(() => {
          const el = document.getElementById(id);
          if (!el) return;
          const dist = Math.abs(el.getBoundingClientRect().top - PUBLIC_NAVBAR_HEIGHT);
          if (dist > 24) {
            scrollTo(el, { offset: -PUBLIC_NAVBAR_HEIGHT, duration: 0.6 });
          }
        }, 450);
        return;
      }
      attempts += 1;
      if (attempts < 12) {
        timerId = window.setTimeout(tryScroll, 50);
      }
    };

    timerId = window.setTimeout(tryScroll, 80);
    return () => {
      if (timerId) window.clearTimeout(timerId);
      if (settleTimerId) window.clearTimeout(settleTimerId);
    };
  }, [pathname, hash, scrollTo]);

  const value = useMemo<LenisContextValue>(
    () => ({ lenisRef, isActive, scrollTo, stop, start }),
    [isActive, scrollTo, stop, start],
  );

  return <LenisContext.Provider value={value}>{children}</LenisContext.Provider>;
}

export function useLenisContext() {
  return useContext(LenisContext);
}
