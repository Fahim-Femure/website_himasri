import { useLenisContext } from '@/contexts/LenisContext';

/**
 * Returns the shared public Lenis smooth-scroll controller from LenisProvider.
 * Never instantiates a second Lenis instance.
 */
export function useLenis() {
  return useLenisContext();
}
