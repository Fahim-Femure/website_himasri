import { useEffect, useState } from 'react';
import { PUBLIC_NAVBAR_HEIGHT, useLenisContext } from '@/contexts/LenisContext';

export function useScrollSpy(
  sectionIds: readonly string[],
  offset = PUBLIC_NAVBAR_HEIGHT,
  enabled = true,
): string {
  const { lenisRef, isActive } = useLenisContext();
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    if (!enabled || typeof window === 'undefined' || sectionIds.length === 0) {
      setActiveId('');
      return;
    }

    let rafId = 0;

    const compute = () => {
      rafId = 0;
      const elements = sectionIds
        .map((id) => document.getElementById(id))
        .filter((el): el is HTMLElement => el !== null);

      if (elements.length === 0) {
        setActiveId('');
        return;
      }

      const firstRect = elements[0].getBoundingClientRect();
      // Still inside Hero above first section -> no active navbar item
      if (firstRect.top > offset + 80) {
        setActiveId('');
        return;
      }

      let current = elements[0].id;
      const threshold = offset + 64;
      for (const el of elements) {
        const rect = el.getBoundingClientRect();
        if (rect.top <= threshold) {
          current = el.id;
        }
      }
      setActiveId(current);
    };

    const scheduleCompute = () => {
      if (rafId) return;
      rafId = window.requestAnimationFrame(compute);
    };

    compute();

    window.addEventListener('scroll', scheduleCompute, { passive: true });
    window.addEventListener('resize', scheduleCompute, { passive: true });

    const lenis = lenisRef.current;
    if (lenis) {
      lenis.on('scroll', scheduleCompute);
    }

    const observer = new MutationObserver(scheduleCompute);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', scheduleCompute);
      window.removeEventListener('resize', scheduleCompute);
      if (lenis) {
        lenis.off('scroll', scheduleCompute);
      }
      observer.disconnect();
    };
  }, [sectionIds, offset, enabled, lenisRef, isActive]);

  return activeId;
}
