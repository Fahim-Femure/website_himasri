import { useEffect } from 'react';

function canAncestorScroll(node: EventTarget | null, deltaY: number): boolean {
  let el = node instanceof HTMLElement ? node : null;
  while (el && el !== document.body && el !== document.documentElement) {
    const style = window.getComputedStyle(el);
    const overflowY = style.overflowY;
    if ((overflowY === 'auto' || overflowY === 'scroll') && el.scrollHeight > el.clientHeight + 2) {
      const atTop = el.scrollTop <= 0;
      const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 1;
      if ((deltaY < 0 && !atTop) || (deltaY > 0 && !atBottom)) {
        return true;
      }
    }
    el = el.parentElement;
  }
  return false;
}

/**
 * Provides smooth desktop wheel scroll interpolation on public pages while
 * avoiding interference with async native scroll events, touchpads, modals,
 * inner scroll containers, and reduced-motion preferences.
 */
export function useLazySmoothScroll(resetKey?: string, enabled = true) {
  useEffect(() => {
    if (!enabled) return;
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (window.matchMedia('(pointer: coarse)').matches) return;

    let currentY = window.scrollY;
    let targetY = window.scrollY;
    let lastProgrammaticY = window.scrollY;
    let rafId: number | null = null;
    let lastTs = 0;

    const getMaxScroll = () =>
      Math.max(0, document.documentElement.scrollHeight - window.innerHeight);

    const clampTarget = (val: number) => Math.max(0, Math.min(val, getMaxScroll()));

    const stopLoop = () => {
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
        rafId = null;
      }
      lastTs = 0;
      document.documentElement.style.scrollBehavior = '';
    };

    const tick = (ts: number) => {
      const dt = lastTs ? Math.min((ts - lastTs) / 16.6667, 3) : 1;
      lastTs = ts;

      const diff = targetY - currentY;
      if (Math.abs(diff) <= 0.6) {
        currentY = targetY;
        lastProgrammaticY = currentY;
        window.scrollTo(0, currentY);
        rafId = null;
        lastTs = 0;
        document.documentElement.style.scrollBehavior = '';
        return;
      }

      const factor = 1 - Math.pow(1 - 0.22, dt);
      currentY += diff * factor;
      lastProgrammaticY = currentY;
      window.scrollTo(0, currentY);
      rafId = window.requestAnimationFrame(tick);
    };

    const normalizeWheelDelta = (e: WheelEvent) => {
      if (e.deltaMode === WheelEvent.DOM_DELTA_LINE) return e.deltaY * 32;
      if (e.deltaMode === WheelEvent.DOM_DELTA_PAGE) return e.deltaY * window.innerHeight * 0.85;
      return e.deltaY;
    };

    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      if (document.querySelector('[role="dialog"][aria-modal="true"]')) return;
      if (canAncestorScroll(e.target, e.deltaY)) return;

      // Let native hardware precision touchpad momentum pass directly
      if (
        e.deltaMode === WheelEvent.DOM_DELTA_PIXEL &&
        Math.abs(e.deltaY) < 28 &&
        !Number.isInteger(e.deltaY)
      ) {
        currentY = window.scrollY;
        targetY = window.scrollY;
        lastProgrammaticY = window.scrollY;
        return;
      }

      e.preventDefault();
      if (rafId === null) {
        currentY = window.scrollY;
        targetY = window.scrollY;
        lastProgrammaticY = window.scrollY;
        document.documentElement.style.scrollBehavior = 'auto';
      }
      targetY = clampTarget(targetY + normalizeWheelDelta(e));
      if (rafId === null) {
        rafId = window.requestAnimationFrame(tick);
      }
    };

    const onExternalScroll = () => {
      const actualY = window.scrollY;
      if (rafId !== null && Math.abs(actualY - lastProgrammaticY) <= 8) {
        return;
      }
      currentY = actualY;
      targetY = actualY;
      lastProgrammaticY = actualY;
      if (rafId !== null) {
        stopLoop();
      }
    };

    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('scroll', onExternalScroll, { passive: true });

    return () => {
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('scroll', onExternalScroll);
      stopLoop();
    };
  }, [resetKey, enabled]);
}
